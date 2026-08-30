import type { CollectionEntry } from 'astro:content';
import path from 'node:path';
import { decodePageDirectoryPath, parsePageDirectoryPath } from '../../scripts/lib/page-model.mjs';
import { parsePageMarkdown } from '../../scripts/lib/page-markdown.mjs';
import { readSiteFile } from '../../scripts/lib/site-content.mjs';
import { homePageDirectory } from '../../scripts/lib/site-conventions.mjs';
import { getSiteStructure } from '../../scripts/lib/site-structure.mjs';
import { sitePagesDir, sitePagesLabel } from '../../scripts/lib/site-paths.mjs';

type SiteEntry = CollectionEntry<'site'>;

type SiteNodeBase = {
	kind: 'category' | 'page';
	isHome: boolean;
	navigation: {
		listed: boolean;
		order: number;
	};
	depth: number;
	pageDirectories: string[];
	pathSegment: string;
	pageDirectory: string;
	pageId: string;
	pageIds: string[];
	pageOrders: number[];
	pagePath: string;
	parentPagePath: string | null;
	title: string;
};

export type SitePage = SiteNodeBase & {
	kind: 'page';
	entry: SiteEntry;
	pathname: string;
	markdown: string;
	markdownDocument: Awaited<ReturnType<typeof parsePageMarkdown>>;
	contentLabel: string;
};

export type SiteCategory = SiteNodeBase & {
	kind: 'category';
};

export type SiteNode = SitePage | SiteCategory;

const pageIdMarker = '-page-';

const stripPageIdPrefix = (id: string) => {
	const markerIndex = id.lastIndexOf(pageIdMarker);
	if (markerIndex === -1) return null;

	const candidate = id.slice(markerIndex + pageIdMarker.length);
	try {
		return parsePageDirectoryPath(decodePageDirectoryPath(candidate)).pageDirectory;
	} catch {
		return null;
	}
};

export const isHomePageEntry = (entry: SiteEntry) => stripPageIdPrefix(entry.id) === homePageDirectory;

export const getPageDirectory = (entry: SiteEntry) => {
	const pageDirectory = stripPageIdPrefix(entry.id);
	if (!pageDirectory) throw new Error(`Page entry "${entry.id}" has no valid page directory.`);
	return pageDirectory;
};

const getPageMetadata = (entry: SiteEntry) => {
	const pageDirectory = getPageDirectory(entry);
	return parsePageDirectoryPath(pageDirectory, `page directory ${pageDirectory}`);
};

const getPagePathname = (pathSegment: string) => pathSegment ? `/${pathSegment}/` : '/';

const compareNumberPaths = (left: number[], right: number[]) => {
	const sharedLength = Math.min(left.length, right.length);
	for (let index = 0; index < sharedLength; index += 1) {
		const difference = left[index] - right[index];
		if (difference !== 0) return difference;
	}

	return left.length - right.length;
};

const readPageMarkdownDocument = async (entry: SiteEntry) => {
	const pageDirectory = getPageDirectory(entry);
	const contentLabel = `${sitePagesLabel}/${pageDirectory}/content.md`;
	const { body } = await readSiteFile(path.join(sitePagesDir, pageDirectory, 'content.md'), contentLabel);
	const markdownDocument = await parsePageMarkdown(body, { label: contentLabel });

	if (markdownDocument.pageHeadings.length !== 1 || markdownDocument.regions[0]?.kind !== 'page-intro') {
		throw new Error(`Page entry "${entry.id}" must contain exactly one Markdown H1 page title.`);
	}

	return { body, contentLabel, markdownDocument };
};

const createSitePage = async (entry: SiteEntry): Promise<SitePage> => {
	const isHome = isHomePageEntry(entry);
	const pageMetadata = getPageMetadata(entry);
	const { body, contentLabel, markdownDocument } = await readPageMarkdownDocument(entry);
	const pageDirectory = pageMetadata.pageDirectory;
	const pageId = pageMetadata.pageId;
	const pagePath = pageMetadata.pagePath;
	const pathSegment = isHome ? '' : pagePath;
	const navigation = entry.data.navigation ?? {};

	return {
		kind: 'page',
		entry,
		isHome,
		depth: pageMetadata.depth,
		navigation: {
		listed: navigation.listed ?? true,
			order: isHome ? 0 : pageMetadata.pageOrder,
		},
		pathSegment,
		pathname: getPagePathname(pathSegment),
		pageDirectory,
		pageDirectories: pageMetadata.pageDirectories,
		pageId,
		pageIds: pageMetadata.pageIds,
		pageOrders: pageMetadata.pageOrders,
		pagePath,
		parentPagePath: isHome ? null : pageMetadata.parentPagePath,
		contentLabel,
		markdown: body,
		markdownDocument,
		title: markdownDocument.pageTitle.title,
	};
};

const createSiteCategory = (category: Awaited<ReturnType<typeof getSiteStructure>>['categories'][number]): SiteCategory => ({
	kind: 'category',
	isHome: false,
	depth: category.depth,
	navigation: {
		listed: true,
		order: category.pageOrder,
	},
	pathSegment: category.pagePath,
	pageDirectory: category.pageDirectory,
	pageDirectories: category.pageDirectories,
	pageId: category.pageId,
	pageIds: category.pageIds,
	pageOrders: category.pageOrders,
	pagePath: category.pagePath,
	parentPagePath: category.parentPagePath,
	title: category.label,
});

export const getSitePage = async (entry: SiteEntry): Promise<SitePage> => createSitePage(entry);

const createSitePages = async (entries: SiteEntry[]) => {
	const pages = await Promise.all(entries.map(createSitePage));
	const pathnames = new Map<string, SitePage>();
	const siblingPageIds = new Map<string, SitePage>();
	const siblingPageOrders = new Map<string, SitePage>();

	for (const page of pages) {
		if (page.isHome && page.navigation.listed === false) {
			throw new Error(`${homePageDirectory} is the required homepage and cannot set navigation.listed to false.`);
		}
		const existing = pathnames.get(page.pathname);
		if (existing) {
			throw new Error(`Duplicate page path "${page.pathname}" from "${existing.entry.id}" and "${page.entry.id}".`);
		}

		pathnames.set(page.pathname, page);

		if (page.isHome) continue;

		const siblingScope = page.pageDirectories.slice(0, -1).join('/pages/');
		const pageIdKey = `${siblingScope}\0${page.pageId}`;
		const existingPageId = siblingPageIds.get(pageIdKey);
		if (existingPageId) {
			throw new Error(`Duplicate sibling page id "${page.pageId}" below "${page.parentPagePath ?? '/'}" from "${existingPageId.entry.id}" and "${page.entry.id}".`);
		}

		siblingPageIds.set(pageIdKey, page);

		const pageOrderKey = `${siblingScope}\0${page.navigation.order}`;
		const existingPageOrder = siblingPageOrders.get(pageOrderKey);
		if (existingPageOrder) {
			throw new Error(`Duplicate sibling page order "${String(page.navigation.order).padStart(3, '0')}" below "${page.parentPagePath ?? '/'}" from "${existingPageOrder.entry.id}" and "${page.entry.id}".`);
		}

		siblingPageOrders.set(pageOrderKey, page);
	}
	if (!pages.some(({ isHome }) => isHome)) {
		throw new Error(`Homepage page entry ${homePageDirectory} is missing.`);
	}

	return pages.sort((left, right) => (
		left.isHome ? -1 : right.isHome ? 1 :
		compareNumberPaths(left.pageOrders, right.pageOrders) ||
		left.title.localeCompare(right.title, 'sv') ||
		left.pathname.localeCompare(right.pathname, 'sv')
	));
};

export const getSiteModel = async (entries: SiteEntry[]) => {
	const [pages, structure] = await Promise.all([
		createSitePages(entries),
		getSiteStructure(),
	]);
	const pagesByDirectory = new Map(pages.map((page) => [page.pageDirectory, page]));
	const nodes = structure.nodes.map((node): SiteNode => {
		if (node.kind === 'category') return createSiteCategory(node);

		const page = pagesByDirectory.get(node.pageDirectory);
		if (!page) {
			throw new Error(`${node.contentLabel} was discovered as a page but Astro did not load it.`);
		}
		return page;
	});

	if (pagesByDirectory.size !== structure.contentFiles.length) {
		throw new Error('Astro loaded a page that is outside the validated Norna page structure.');
	}

	return {
		categories: nodes.filter((node): node is SiteCategory => node.kind === 'category'),
		nodes,
		pages,
		warnings: structure.warnings,
	};
};

export const getSitePages = async (entries: SiteEntry[]) => (await getSiteModel(entries)).pages;
