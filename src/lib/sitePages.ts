import type { CollectionEntry } from 'astro:content';

type SiteEntry = CollectionEntry<'site'>;

export type SitePage = {
	entry: SiteEntry;
	isHome: boolean;
	navigation: {
		include: boolean;
		label: string;
		order: number;
	};
	pathname: string;
	routeFolder: string | null;
	slug: string;
	title: string;
};

const routeIdMarker = '-route-';

const stripRouteIdPrefix = (id: string) => {
	const markerIndex = id.indexOf(routeIdMarker);
	return markerIndex === -1 ? null : id.slice(markerIndex + routeIdMarker.length);
};

export const isHomePageEntry = (entry: SiteEntry) => stripRouteIdPrefix(entry.id) === null;

const getRouteFolder = (entry: SiteEntry) => isHomePageEntry(entry) ? null : stripRouteIdPrefix(entry.id);

const getPageSlug = (entry: SiteEntry) => {
	if (isHomePageEntry(entry)) return '';

	const routeFolder = getRouteFolder(entry);
	return entry.data.slug ?? routeFolder ?? '';
};

const getPagePathname = (slug: string) => slug ? `/${slug}/` : '/';

export const getSitePage = (entry: SiteEntry): SitePage => {
	const isHome = isHomePageEntry(entry);
	const routeFolder = getRouteFolder(entry);
	const slug = getPageSlug(entry);
	const navigation = entry.data.navigation ?? {};

	return {
		entry,
		isHome,
		navigation: {
			include: navigation.include ?? true,
			label: navigation.label ?? entry.data.title,
			order: navigation.order ?? (isHome ? 0 : 100),
		},
		pathname: getPagePathname(slug),
		routeFolder,
		slug,
		title: entry.data.title,
	};
};

export const getSitePages = (entries: SiteEntry[]) => {
	const pages = entries.map(getSitePage);
	const pathnames = new Map<string, SitePage>();

	for (const page of pages) {
		const existing = pathnames.get(page.pathname);
		if (existing) {
			throw new Error(`Duplicate page path "${page.pathname}" from "${existing.entry.id}" and "${page.entry.id}".`);
		}

		pathnames.set(page.pathname, page);
	}

	return pages.sort((left, right) => (
		left.navigation.order - right.navigation.order ||
		left.navigation.label.localeCompare(right.navigation.label, 'sv') ||
		left.pathname.localeCompare(right.pathname, 'sv')
	));
};

export const getNavigationPages = (pages: SitePage[]) => pages.filter((page) => page.navigation.include);
