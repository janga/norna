import type { CollectionEntry } from 'astro:content';
import { parseRouteDirectory } from '../../scripts/lib/route-model.mjs';

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
	routeDirectory: string | null;
	routeId: string;
	title: string;
};

const routeIdMarker = '-route-';

const stripRouteIdPrefix = (id: string) => {
	const markerIndex = id.indexOf(routeIdMarker);
	return markerIndex === -1 ? null : id.slice(markerIndex + routeIdMarker.length);
};

export const isHomePageEntry = (entry: SiteEntry) => stripRouteIdPrefix(entry.id) === null;

const getRouteDirectory = (entry: SiteEntry) => isHomePageEntry(entry) ? null : stripRouteIdPrefix(entry.id);

const getRouteMetadata = (entry: SiteEntry) => {
	const routeDirectory = getRouteDirectory(entry);
	return routeDirectory ? parseRouteDirectory(routeDirectory, `route directory ${routeDirectory}`) : null;
};

const getPagePathname = (pathSegment: string) => pathSegment ? `/${pathSegment}/` : '/';

export const getSitePage = (entry: SiteEntry): SitePage => {
	const isHome = isHomePageEntry(entry);
	const routeMetadata = getRouteMetadata(entry);
	const routeDirectory = routeMetadata?.routeDirectory ?? null;
	const routeId = routeMetadata?.routeId ?? '';
	const pathSegment = isHome ? '' : routeId;
	const navigation = entry.data.navigation ?? {};

	return {
		entry,
		isHome,
		navigation: {
		listed: navigation.listed ?? true,
		order: isHome ? 0 : routeMetadata?.routeOrder ?? 100,
		},
		pathSegment,
		pathname: getPagePathname(pathSegment),
		routeDirectory,
		routeId,
		title: entry.data.page.title,
	};
};

export const getSitePages = (entries: SiteEntry[]) => {
	const pages = entries.map(getSitePage);
	const pathnames = new Map<string, SitePage>();
	const routeIds = new Map<string, SitePage>();
	const routeOrders = new Map<number, SitePage>();

	for (const page of pages) {
		const existing = pathnames.get(page.pathname);
		if (existing) {
			throw new Error(`Duplicate page path "${page.pathname}" from "${existing.entry.id}" and "${page.entry.id}".`);
		}

		pathnames.set(page.pathname, page);

		if (page.isHome) continue;

		const existingRouteId = routeIds.get(page.routeId);
		if (existingRouteId) {
			throw new Error(`Duplicate route id "${page.routeId}" from "${existingRouteId.entry.id}" and "${page.entry.id}".`);
		}

		routeIds.set(page.routeId, page);

		const existingRouteOrder = routeOrders.get(page.navigation.order);
		if (existingRouteOrder) {
			throw new Error(`Duplicate route order "${String(page.navigation.order).padStart(3, '0')}" from "${existingRouteOrder.entry.id}" and "${page.entry.id}".`);
		}

		routeOrders.set(page.navigation.order, page);
	}

	return pages.sort((left, right) => (
		left.navigation.order - right.navigation.order ||
		left.title.localeCompare(right.title, 'sv') ||
		left.pathname.localeCompare(right.pathname, 'sv')
	));
};
