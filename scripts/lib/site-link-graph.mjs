import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { parsePageMarkdownSource } from './page-markdown.mjs';
import {
	sitePagesLabel,
	sitePublicDir,
	sitePublicLabel,
} from './site-paths.mjs';
import { getSiteStructure } from './site-structure.mjs';

const internalUrlOrigin = 'https://norna.invalid';
const externalSchemePattern = /^[a-z][a-z0-9+.-]*:/i;

const toPosixPath = (filePath) => filePath.split(path.sep).join('/');

const readPublicFiles = async (directory, relativeDirectory = '') => {
	const entries = await readdir(directory, { withFileTypes: true }).catch((error) => {
		if (error?.code === 'ENOENT') return [];
		throw error;
	});
	const files = [];

	for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name, 'en'))) {
		const relativePath = relativeDirectory
			? path.join(relativeDirectory, entry.name)
			: entry.name;
		const entryPath = path.join(directory, entry.name);
		if (entry.isDirectory()) {
			files.push(...await readPublicFiles(entryPath, relativePath));
		} else if (entry.isFile()) {
			files.push({
				filePath: entryPath,
				label: `${sitePublicLabel}/${toPosixPath(relativePath)}`,
				pathname: `/${toPosixPath(relativePath)}`,
			});
		}
	}

	return files;
};

const getPagePathname = (node) => node.isHome || !node.pagePath
	? '/'
	: `/${node.pagePath}/`;

const decodePathname = (pathname) => {
	const decodedSegments = pathname.split('/').map((segment) => decodeURIComponent(segment));
	if (decodedSegments.some((segment) => segment.includes('/') || segment.includes('\\') || segment.includes('\0'))) {
		throw new Error('Encoded slashes, backslashes, and null bytes are not valid internal paths.');
	}
	return decodedSegments.join('/');
};

const decodeFragment = (fragment) => decodeURIComponent(fragment);

const getPageLookupPathname = (pathname) => {
	if (pathname === '/' || pathname === '/index.html') return '/';
	if (pathname.endsWith('/index.html')) return pathname.slice(0, -'index.html'.length);
	if (pathname.endsWith('/')) return pathname;
	const finalSegment = pathname.split('/').at(-1) ?? '';
	return finalSegment.includes('.') ? null : `${pathname}/`;
};

const isExternalTarget = (target) => target.startsWith('//') || externalSchemePattern.test(target);

export const resolveInternalTarget = (target, sourcePathname) => {
	if (isExternalTarget(target)) return { kind: 'external' };

	let url;
	try {
		url = new URL(target, `${internalUrlOrigin}${sourcePathname}`);
	} catch {
		return {
			kind: 'invalid',
			reason: 'The target is not a valid relative or site-relative URL.',
		};
	}

	if (url.origin !== internalUrlOrigin) return { kind: 'external' };

	try {
		const pathname = decodePathname(url.pathname);
		const fragment = url.hash.length > 1 ? decodeFragment(url.hash.slice(1)) : '';
		return {
			kind: 'internal',
			fragment,
			pageLookupPathname: getPageLookupPathname(pathname),
			pathname,
			query: url.search,
		};
	} catch (error) {
		return {
			kind: 'invalid',
			reason: error instanceof Error ? error.message : String(error),
		};
	}
};

const createPageRecord = ({ contentFile, document }) => {
	const pathname = getPagePathname(contentFile);
	const anchors = new Map([['page-title', {
		id: 'page-title',
		line: document.pageTitle?.line ?? 1,
		title: document.pageTitle?.title ?? 'Page title',
	}]]);

	for (const heading of document.headings) {
		if ((heading.depth !== 2 && heading.depth !== 3) || !heading.id || anchors.has(heading.id)) continue;
		anchors.set(heading.id, heading);
	}

	return {
		anchors,
		contentFile,
		document,
		pathname,
		title: document.pageTitle?.title ?? contentFile.pageId,
	};
};

const createIssue = (reference, code, message, fix) => ({
	code,
	fix,
	message,
	reference,
	severity: 'error',
});

const getTargetKey = ({ fragment, pageLookupPathname, pathname }) => {
	const identityPathname = pageLookupPathname ?? pathname;
	return `${identityPathname}${fragment ? `#${fragment}` : ''}`;
};

const looksLikePublicFile = (pathname) => {
	if (pathname.endsWith('/')) return false;
	return (pathname.split('/').at(-1) ?? '').includes('.');
};

export const createSiteLinkGraph = ({ siteStructure, pageDocuments, publicFiles = [] }) => {
	const documentsByDirectory = new Map(pageDocuments.map(({ contentFile, document }) => [
		contentFile.pageDirectory,
		{ contentFile, document },
	]));
	const pages = siteStructure.contentFiles.map((contentFile) => {
		const pageDocument = documentsByDirectory.get(contentFile.pageDirectory);
		if (!pageDocument) throw new Error(`No parsed Markdown document was provided for ${contentFile.contentLabel}.`);
		return createPageRecord(pageDocument);
	});
	const pagesByPathname = new Map(pages.map((page) => [page.pathname, page]));
	const categoriesByPathname = new Map(siteStructure.categories.map((category) => [
		getPagePathname(category),
		{ ...category, pathname: getPagePathname(category) },
	]));
	const publicFilesByPathname = new Map();
	for (const file of publicFiles) {
		publicFilesByPathname.set(file.pathname, file);
		if (file.pathname === '/index.html') publicFilesByPathname.set('/', file);
		if (file.pathname.endsWith('/index.html')) {
			publicFilesByPathname.set(file.pathname.slice(0, -'index.html'.length), file);
		}
	}

	const references = [];
	const referencesByTarget = new Map();
	const diagnostics = [];

	for (const page of pages) {
		for (const sourceReference of page.document.links) {
			const target = resolveInternalTarget(sourceReference.target, page.pathname);
			if (target.kind === 'external') continue;

			const reference = {
				...sourceReference,
				sourceContentFile: page.contentFile,
				sourcePage: page,
				target,
			};
			references.push(reference);

			if (target.kind === 'invalid') {
				diagnostics.push(createIssue(
					reference,
					'invalid-internal-url',
					`Internal link "${sourceReference.target}" on line ${sourceReference.line} is invalid. ${target.reason}`,
					'Use a valid fragment, relative URL, site-relative URL, or external URL.',
				));
				continue;
			}

			const targetKey = getTargetKey(target);
			if (!referencesByTarget.has(targetKey)) referencesByTarget.set(targetKey, []);
			referencesByTarget.get(targetKey).push(reference);

			const targetPage = target.pageLookupPathname
				? pagesByPathname.get(target.pageLookupPathname)
				: null;
			if (targetPage) {
				reference.resolution = { kind: 'page', page: targetPage, pathname: targetPage.pathname };
				if (target.fragment && !targetPage.anchors.has(target.fragment)) {
					const availableAnchors = Array.from(targetPage.anchors.keys());
					const displayedAnchors = availableAnchors.slice(0, 8).map((anchor) => `#${anchor}`);
					const omittedCount = availableAnchors.length - displayedAnchors.length;
					diagnostics.push(createIssue(
						reference,
						'missing-internal-anchor',
						`Internal link "${sourceReference.target}" on line ${sourceReference.line} points to missing heading anchor "#${target.fragment}" on ${targetPage.pathname}.`,
						availableAnchors.length > 0
							? `Use an existing anchor: ${displayedAnchors.join(', ')}${omittedCount > 0 ? `, and ${omittedCount} more` : ''}.`
							: 'Add the intended H2 or H3 heading, or remove the fragment from the link.',
					));
				}
				continue;
			}

			const targetCategory = target.pageLookupPathname
				? categoriesByPathname.get(target.pageLookupPathname)
				: null;
			if (targetCategory) {
				reference.resolution = { category: targetCategory, kind: 'category', pathname: targetCategory.pathname };
				diagnostics.push(createIssue(
					reference,
					'category-has-no-url',
					`Internal link "${sourceReference.target}" on line ${sourceReference.line} points to navigation category ${targetCategory.pathname}, which does not have its own page.`,
					'Link to one of the category pages, or replace category.yaml with content.md when the collection needs its own page.',
				));
				continue;
			}

			const publicFile = publicFilesByPathname.get(target.pathname);
			if (publicFile) {
				reference.resolution = { file: publicFile, kind: 'public-file', pathname: target.pathname };
				continue;
			}

			if (looksLikePublicFile(target.pathname)) {
				reference.resolution = { kind: 'missing-public-file', pathname: target.pathname };
				diagnostics.push(createIssue(
					reference,
					'missing-public-file',
					`Internal link "${sourceReference.target}" on line ${sourceReference.line} points to public file "${target.pathname}", but no matching file exists under ${sitePublicLabel}/.`,
					`Add the file under ${sitePublicLabel}/ with the same relative path, or correct the link.`,
				));
				continue;
			}

			const missingPathname = target.pageLookupPathname ?? target.pathname;
			reference.resolution = { kind: 'missing-page', pathname: missingPathname };
			diagnostics.push(createIssue(
				reference,
				'missing-internal-page',
				`Internal link "${sourceReference.target}" on line ${sourceReference.line} points to page "${missingPathname}", but that page does not exist.`,
				`Correct the link or create the page at the intended position under ${sitePagesLabel}/.`,
			));
		}
	}

	return {
		categoriesByPathname,
		diagnostics,
		pages,
		pagesByPathname,
		publicFilesByPathname,
		references,
		referencesByTarget,
	};
};

export const getSiteLinkGraph = async (options = {}) => {
	const siteStructure = options.siteStructure ?? await getSiteStructure();
	const [pageDocuments, publicFiles] = await Promise.all([
		Promise.all(siteStructure.contentFiles.map(async (contentFile) => ({
			contentFile,
			document: await parsePageMarkdownSource(
				await readFile(contentFile.contentPath, 'utf8'),
				{ label: contentFile.contentLabel },
			),
		}))),
		readPublicFiles(options.publicDir ?? sitePublicDir),
	]);

	return createSiteLinkGraph({ pageDocuments, publicFiles, siteStructure });
};

export const getSitePublicFiles = async (publicDir = sitePublicDir) => readPublicFiles(publicDir);
