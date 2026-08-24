import type { CollectionEntry } from 'astro:content';
import { pageDirectoryPattern, parsePageDirectory } from '../../scripts/lib/page-model.mjs';

type SiteEntry = CollectionEntry<'site'>;

export type SitePage = {
	entry: SiteEntry;
	isHome: boolean;
	navigation: {
		listed: boolean;
		order: number;
	};
	pathSegment: string;
	pathname: string;
	pageDirectory: string | null;
	pageId: string;
	title: string;
};

const pageIdMarker = '-page-';

const stripPageIdPrefix = (id: string) => {
	const markerIndex = id.lastIndexOf(pageIdMarker);
	if (markerIndex === -1) return null;

	const candidate = id.slice(markerIndex + pageIdMarker.length);
	return pageDirectoryPattern.test(candidate) ? candidate : null;
};

export const isHomePageEntry = (entry: SiteEntry) => stripPageIdPrefix(entry.id) === null;

const getPageDirectory = (entry: SiteEntry) => isHomePageEntry(entry) ? null : stripPageIdPrefix(entry.id);

const getPageMetadata = (entry: SiteEntry) => {
	const pageDirectory = getPageDirectory(entry);
	return pageDirectory ? parsePageDirectory(pageDirectory, `page directory ${pageDirectory}`) : null;
};

const getPagePathname = (pathSegment: string) => pathSegment ? `/${pathSegment}/` : '/';

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
	const pageDirectory = pageMetadata?.pageDirectory ?? null;
	const pageId = pageMetadata?.pageId ?? '';
	const pathSegment = isHome ? '' : pageId;
	const navigation = entry.data.navigation ?? {};

	return {
		entry,
		isHome,
		navigation: {
		listed: navigation.listed ?? true,
			order: isHome ? 0 : pageMetadata?.pageOrder ?? 100,
		},
		pathSegment,
		pathname: getPagePathname(pathSegment),
		pageDirectory,
		pageId,
		title: getPageTitle(entry),
	};
};

export const getSitePages = (entries: SiteEntry[]) => {
	const pages = entries.map(getSitePage);
	const pathnames = new Map<string, SitePage>();
	const pageIds = new Map<string, SitePage>();
	const pageOrders = new Map<number, SitePage>();

	for (const page of pages) {
		const existing = pathnames.get(page.pathname);
		if (existing) {
			throw new Error(`Duplicate page path "${page.pathname}" from "${existing.entry.id}" and "${page.entry.id}".`);
		}

		pathnames.set(page.pathname, page);

		if (page.isHome) continue;

		const existingPageId = pageIds.get(page.pageId);
		if (existingPageId) {
			throw new Error(`Duplicate page id "${page.pageId}" from "${existingPageId.entry.id}" and "${page.entry.id}".`);
		}

		pageIds.set(page.pageId, page);

		const existingPageOrder = pageOrders.get(page.navigation.order);
		if (existingPageOrder) {
			throw new Error(`Duplicate page order "${String(page.navigation.order).padStart(3, '0')}" from "${existingPageOrder.entry.id}" and "${page.entry.id}".`);
		}

		pageOrders.set(page.navigation.order, page);
	}

	return pages.sort((left, right) => (
		left.navigation.order - right.navigation.order ||
		left.title.localeCompare(right.title, 'sv') ||
		left.pathname.localeCompare(right.pathname, 'sv')
	));
};
