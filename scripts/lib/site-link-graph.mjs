import { getSiteAttachments, resolveAttachment, parseLocalAttachmentTarget, attachmentOutputIssues } from './page-attachments.mjs';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import {
	createPageAliasModel,
	generatedSiteRoutes,
} from './page-aliases.mjs';
import { parsePageMarkdownSource } from './page-markdown.mjs';
import {
	parseContentFrontmatter,
	splitSiteFile,
	toPosixPath,
} from './site-content.mjs';
import {
	siteDir as defaultSiteDir,
	sitePagesLabel,
	sitePublicDir,
	sitePublicLabel,
} from './site-paths.mjs';
import { getSiteNodePathname } from './site-page-urls.mjs';
import { getSiteStructure } from './site-structure.mjs';
import { createCategoryDestinationModel } from './category-destinations.mjs';
import { parseYamlConfig } from './yaml-config.mjs';
import { configSchema } from './schema-definitions.mjs';

const internalUrlOrigin = 'https://norna.invalid';
const externalSchemePattern = /^[a-z][a-z0-9+.-]*:/i;

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

export const resolveInternalTarget = (target, sourcePathname, siteUrl) => {
	const absolute = isExternalTarget(target);
	if (absolute && (!siteUrl || !/^(?:https?:)?\/\//i.test(target))) return { kind: 'external' };

	let url;
	let siteBase;
	try {
		siteBase = absolute ? new URL(siteUrl) : null;
		url = new URL(target, siteBase ?? `${internalUrlOrigin}${sourcePathname}`);
	} catch {
		if (absolute) return { kind: 'external' };
		return {
			kind: 'invalid',
			reason: 'The target is not a valid relative or site-relative URL.',
		};
	}

	if (url.origin !== (siteBase?.origin ?? internalUrlOrigin) || url.username || url.password) return { kind: 'external' };

	try {
		let pathname = decodePathname(url.pathname);
		let absolutePrefix;
		if (siteBase) {
			const encodedBase = siteBase.pathname.replace(/\/?$/, '/');
			const base = decodePathname(encodedBase);
			if (pathname === base.slice(0, -1)) pathname = '/';
			else if (pathname.startsWith(base)) pathname = '/' + pathname.slice(base.length);
			else return { kind: 'external' };
			absolutePrefix = (target.startsWith('//') ? `//${url.host}` : url.origin) + encodedBase.slice(0, -1);
		}
		const fragment = url.hash.length > 1 ? decodeFragment(url.hash.slice(1)) : '';
		return {
			kind: 'internal',
			...(absolutePrefix ? { absolutePrefix } : {}),
			fragment,
			pageLookupPathname: getPageLookupPathname(pathname),
			pathname,
			query: url.search,
		};
	} catch (error) {
		if (absolute) return { kind: 'external' };
		return {
			kind: 'invalid',
			reason: error instanceof Error ? error.message : String(error),
		};
	}
};

const createPageRecord = ({ contentFile, data = {}, document }) => {
	const pathname = getSiteNodePathname(contentFile);
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
		aliases: data.page?.aliases ?? [],
		anchors,
		contentFile,
		document,
		navigation: {
			listed: data.navigation?.listed ?? true,
		},
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

export const createSiteLinkGraph = ({
	siteUrl,
	siteStructure,
	pageDocuments,
	publicFiles = [],
	attachments = { files: [], diagnostics: [] },
	generatedRoutes,
}) => {
	const activeGeneratedRoutes = generatedRoutes ?? generatedSiteRoutes;
	const documentsByDirectory = new Map(pageDocuments.map(({ contentFile, data, document }) => [
		contentFile.pageDirectory,
		{ contentFile, data, document },
	]));
	const pages = siteStructure.contentFiles.map((contentFile) => {
		const pageDocument = documentsByDirectory.get(contentFile.pageDirectory);
		if (!pageDocument) throw new Error(`No parsed Markdown document was provided for ${contentFile.contentLabel}.`);
		return createPageRecord(pageDocument);
	});
	const pagesByPathname = new Map(pages.map((page) => [page.pathname, page]));
	const pagesByDirectory = new Map(pages.map((page) => [page.contentFile.pageDirectory, page]));
	const categoryModel = createCategoryDestinationModel(siteStructure.nodes.map((node) => ({
		...node,
		navigation: node.kind === 'page'
			? pagesByDirectory.get(node.pageDirectory).navigation
			: { listed: true },
	})));
	const categoriesByPathname = new Map(siteStructure.categories.map((category) => [
		getSiteNodePathname(category),
		{ ...category, pathname: getSiteNodePathname(category) },
	]));
	const publicFilesByPathname = new Map();
	for (const file of publicFiles) {
		publicFilesByPathname.set(file.pathname, file);
		if (file.pathname === '/index.html') publicFilesByPathname.set('/', file);
		if (file.pathname.endsWith('/index.html')) {
			publicFilesByPathname.set(file.pathname.slice(0, -'index.html'.length), file);
		}
	}
	const aliasModel = createPageAliasModel({
		categories: siteStructure.categories,
		pages,
		publicFiles,
		generatedRoutes: activeGeneratedRoutes,
	});
	const generatedRoutesByPathname = new Map(
		activeGeneratedRoutes.map((route) => [route.pathname, route]),
	);

	const references = [];
	const referencesByTarget = new Map();
	const diagnostics = [...aliasModel.diagnostics, ...categoryModel.diagnostics, ...attachments.diagnostics,
		...attachmentOutputIssues({ files: attachments.files, pages, publicFiles, generatedRoutes: activeGeneratedRoutes })];

	for (const page of pages) {
		for (const sourceReference of page.document.links) {
			const target = resolveInternalTarget(sourceReference.target, page.pathname, siteUrl);
			if (target.kind === 'external') continue;
			const attachment = target.kind === 'internal'
				? resolveAttachment(sourceReference.target, page.pathname, attachments.files, target.pathname) : null;
			// One origin/base path may also host independently built sites. Only
			// adopt absolute URLs whose destination this source tree actually owns.
			if (target.absolutePrefix && !attachment
				&& !pagesByPathname.has(target.pageLookupPathname)
				&& !aliasModel.aliasesByPathname.has(target.pageLookupPathname)
				&& !publicFilesByPathname.has(target.pathname)
				&& !categoriesByPathname.has(target.pageLookupPathname)
				&& !generatedRoutesByPathname.has(target.pathname)
				&& !generatedRoutesByPathname.has(target.pageLookupPathname)) continue;

			const reference = {
				...sourceReference,
				sourceTarget: sourceReference.target,
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

			const localAttachment = parseLocalAttachmentTarget(sourceReference.target);
			if (attachment) {
				const ambiguous = localAttachment?.prefix === '' && (publicFilesByPathname.has(target.pathname) || pagesByPathname.has(target.pageLookupPathname) || aliasModel.aliasesByPathname.has(target.pageLookupPathname));
				if (ambiguous) {
					reference.resolution = { kind: 'ambiguous-attachment' };
					diagnostics.push(createIssue(reference, 'ambiguous-attachment', `Link "${sourceReference.target}" could identify a page/public file or a local attachment.`, `Use ${attachment.pathname} for the attachment or an explicit site-relative page/public link.`));
				} else reference.resolution = { kind: 'attachment', file: attachment, pathname: attachment.pathname };
				continue;
			}

			if (localAttachment?.prefix) {
				const expectedPath = path.join(path.dirname(page.contentFile.contentPath), 'downloads', localAttachment.filename);
				reference.resolution = { kind: 'missing-attachment', pathname: target.pathname };
				diagnostics.push(createIssue(reference, 'missing-attachment', `Attachment "${sourceReference.target}" was not found at ${toPosixPath(expectedPath)}.`, 'Add the file to this page’s downloads/ folder or correct the link.'));
				continue;
			}

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

			const targetAlias = target.pageLookupPathname
				? aliasModel.aliasesByPathname.get(target.pageLookupPathname)
				: null;
			if (targetAlias) {
				const aliasTargetPage = pagesByPathname.get(targetAlias.targetPathname);
				if (!aliasTargetPage) {
					throw new Error(`Page alias "${targetAlias.pathname}" has no target page ${targetAlias.targetPathname}.`);
				}
				reference.resolution = {
					alias: targetAlias,
					kind: 'page-alias',
					page: aliasTargetPage,
					pathname: aliasTargetPage.pathname,
				};
				if (target.fragment && !aliasTargetPage.anchors.has(target.fragment)) {
					const availableAnchors = Array.from(aliasTargetPage.anchors.keys());
					diagnostics.push(createIssue(
						reference,
						'missing-internal-anchor',
						`Internal link "${sourceReference.target}" on line ${sourceReference.line} points through alias ${targetAlias.pathname} to missing heading anchor "#${target.fragment}" on ${aliasTargetPage.pathname}.`,
						availableAnchors.length > 0
							? `Use an existing anchor: ${availableAnchors.slice(0, 8).map((anchor) => `#${anchor}`).join(', ')}.`
							: 'Add the intended H2 or H3 heading, or remove the fragment from the link.',
					));
				}
				continue;
			}

			const generatedRoute = generatedRoutesByPathname.get(
				target.pageLookupPathname ?? target.pathname,
			);
			if (generatedRoute && !target.fragment) {
				reference.resolution = {
					kind: 'generated-route',
					pathname: generatedRoute.pathname,
					route: generatedRoute,
				};
				continue;
			}

			const targetCategory = target.pageLookupPathname
				? categoriesByPathname.get(target.pageLookupPathname)
				: null;
			if (targetCategory && categoryModel.byPathname.has(targetCategory.pathname)) {
				reference.resolution = { category: targetCategory, kind: 'category', pathname: targetCategory.pathname };
				const destination = categoryModel.byPathname.get(targetCategory.pathname);
				if (target.fragment && !(destination.kind === 'listing' && target.fragment === 'page-title')) diagnostics.push(createIssue(
					reference,
					'missing-internal-anchor',
					`Internal link "${sourceReference.target}" on line ${sourceReference.line} points to an unavailable category anchor.`,
					'Link to the category without a fragment, or use the content page URL for a heading link.',
				));
				continue;
			}

			const publicFile = publicFilesByPathname.get(target.pathname);
			if (publicFile) {
				reference.resolution = { file: publicFile, kind: 'public-file', pathname: target.pathname };
				continue;
			}

			if (target.pathname.includes('/downloads/') && !target.pathname.endsWith('/')) {
				reference.resolution = { kind: 'missing-attachment', pathname: target.pathname };
				diagnostics.push(createIssue(reference, 'missing-attachment', `Attachment "${sourceReference.target}" does not exist.`, 'Add the file to its owning page’s downloads/ or correct the link.'));
				continue;
			}

			if (looksLikePublicFile(target.pathname)) {
				reference.resolution = { kind: 'missing-public-file', pathname: target.pathname };
				diagnostics.push(createIssue(
					reference,
					'missing-public-file',
					`Internal link "${sourceReference.target}" on line ${sourceReference.line} points to public file "${target.pathname}", but no matching file exists under ${sitePublicLabel}/ or the owning page’s downloads/.`,
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
		siteUrl,
		attachments,
		categoryModel,
		aliasModel,
		aliases: aliasModel.aliases,
		aliasesByPathname: aliasModel.aliasesByPathname,
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
	const siteRoot = options.siteRoot ?? defaultSiteDir;
	const siteStructure = options.siteStructure ?? await getSiteStructure({ siteRoot });
	const settingsPath = path.join(siteRoot, 'site-config/settings.yaml');
	const settings = parseYamlConfig(await readFile(settingsPath, 'utf8'), settingsPath, { schema: configSchema });
	const [pageDocuments, publicFiles] = await Promise.all([
		Promise.all(siteStructure.contentFiles.map(async (contentFile) => {
			const source = await readFile(contentFile.contentPath, 'utf8');
			const { frontmatterBody } = splitSiteFile(source, contentFile.contentLabel);
			return {
				contentFile,
				data: parseContentFrontmatter(frontmatterBody, contentFile.contentLabel),
				document: await parsePageMarkdownSource(source, { label: contentFile.contentLabel }),
			};
		})),
		readPublicFiles(options.publicDir ?? path.join(siteRoot, 'public')),
	]);

	return createSiteLinkGraph({
		siteUrl: settings.url,
		pageDocuments,
		publicFiles,
		siteStructure,
		attachments: await getSiteAttachments(siteStructure),
		generatedRoutes: options.generatedRoutes,
	});
};

export const getSitePublicFiles = async (publicDir = sitePublicDir) => readPublicFiles(publicDir);
