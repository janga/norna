import type { CollectionEntry } from 'astro:content';
import { decodePageDirectoryPath, parsePageDirectoryPath } from '../../scripts/lib/page-model.mjs';
import { homePageDirectory } from '../../scripts/lib/site-conventions.mjs';

type SiteEntry = CollectionEntry<'site'>;

export type SitePage = {
	entry: SiteEntry;
	isHome: boolean;
	navigation: {
		listed: boolean;
		order: number;
	};
	depth: number;
	pageDirectories: string[];
	pathSegment: string;
	pathname: string;
	pageDirectory: string;
	pageId: string;
	pageIds: string[];
	pageOrders: number[];
	pagePath: string;
	parentPagePath: string | null;
	title: string;
};

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

const getPageDirectory = (entry: SiteEntry) => {
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

const decodeHtmlEntities = (value: string) => value
	.replace(/&amp;/g, '&')
	.replace(/&lt;/g, '<')
	.replace(/&gt;/g, '>')
	.replace(/&quot;/g, '"')
	.replace(/&#39;/g, "'");

const getPageTitle = (entry: SiteEntry) => {
	const html = entry.rendered?.html ?? '';
	const headings = Array.from(html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi));
	if (headings.length !== 1) {
		throw new Error(`Page entry "${entry.id}" must contain exactly one Markdown H1 page title.`);
	}

	return decodeHtmlEntities((headings[0]?.[1] ?? '').replace(/<[^>]*>/g, '')).trim();
};

export const getSitePage = (entry: SiteEntry): SitePage => {
	const isHome = isHomePageEntry(entry);
	const pageMetadata = getPageMetadata(entry);
	const pageDirectory = pageMetadata.pageDirectory;
	const pageId = pageMetadata.pageId;
	const pagePath = pageMetadata.pagePath;
	const pathSegment = isHome ? '' : pagePath;
	const navigation = entry.data.navigation ?? {};

	return {
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
		title: getPageTitle(entry),
	};
};

export const getSitePages = (entries: SiteEntry[]) => {
	const pages = entries.map(getSitePage);
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
