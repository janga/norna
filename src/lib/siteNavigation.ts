import type { HeadingNavigation, SectionNavigation } from './sectionContent';
import type { SitePage } from './sitePages';

export type PageNavigationEntry = {
	page: SitePage;
	headings: HeadingNavigation[];
	sections: SectionNavigation[];
};

export type PageNavigationNode = PageNavigationEntry & {
	children: PageNavigationNode[];
};

export const getPageNavigationTree = (entries: PageNavigationEntry[]) => {
	const nodes = new Map<string, PageNavigationNode>();
	const roots: PageNavigationNode[] = [];

	for (const entry of entries) {
		nodes.set(entry.page.pagePath, { ...entry, children: [] });
	}

	for (const entry of entries) {
		const node = nodes.get(entry.page.pagePath);
		if (!node) continue;

		if (entry.page.isHome || entry.page.parentPagePath === null) {
			roots.push(node);
			continue;
		}

		const parent = nodes.get(entry.page.parentPagePath);
		if (!parent) {
			throw new Error(`Page "${entry.page.pathname}" has no parent page "${entry.page.parentPagePath}".`);
		}

		parent.children.push(node);
	}

	return roots;
};

export const getListedPageNavigationTree = (entries: PageNavigationEntry[]) => {
	const filterListed = (nodes: PageNavigationNode[]): PageNavigationNode[] => nodes.flatMap((node) => {
		if (!node.page.isHome && !node.page.navigation.listed) return [];
		return [{ ...node, children: filterListed(node.children) }];
	});

	return filterListed(getPageNavigationTree(entries));
};
