import type { HeadingNavigation, SectionNavigation } from './sectionContent';
import type { SiteNode, SitePage } from './sitePages';

export type SiteNavigationEntry = {
	node: SiteNode;
	headings: HeadingNavigation[];
	sections: SectionNavigation[];
};

export type SiteNavigationNode = SiteNavigationEntry & {
	children: SiteNavigationNode[];
};

export const getSiteNavigationTree = (entries: SiteNavigationEntry[]) => {
	const nodes = new Map<string, SiteNavigationNode>();
	const roots: SiteNavigationNode[] = [];

	for (const entry of entries) {
		nodes.set(entry.node.pagePath, { ...entry, children: [] });
	}

	for (const entry of entries) {
		const node = nodes.get(entry.node.pagePath);
		if (!node) continue;

		if (entry.node.isHome || entry.node.parentPagePath === null) {
			roots.push(node);
			continue;
		}

		const parent = nodes.get(entry.node.parentPagePath);
		if (!parent) {
			throw new Error(`Site node "${entry.node.pagePath}" has no parent node "${entry.node.parentPagePath}".`);
		}

		parent.children.push(node);
	}

	return roots;
};

export const getListedSiteNavigationTree = (entries: SiteNavigationEntry[]) => {
	const filterListed = (nodes: SiteNavigationNode[]): SiteNavigationNode[] => nodes.flatMap((node) => {
		if (!node.node.isHome && !node.node.navigation.listed) return [];
		const children = filterListed(node.children);
		if (node.node.kind === 'category' && children.length === 0) return [];
		return [{ ...node, children }];
	});

	return filterListed(getSiteNavigationTree(entries));
};

export const getFirstPageInNavigationNode = (node: SiteNavigationNode): SitePage | null => {
	if (node.node.kind === 'page') return node.node;

	for (const child of node.children) {
		const page = getFirstPageInNavigationNode(child);
		if (page) return page;
	}

	return null;
};

export const flattenSiteNavigationTree = (nodes: SiteNavigationNode[]): SiteNavigationNode[] => nodes.flatMap((node) => [
	node,
	...flattenSiteNavigationTree(node.children),
]);
