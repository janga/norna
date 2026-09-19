import type { SiteNavigationNode } from './siteNavigation';
import type { SiteNode } from './sitePages';

const containsPage = (root: SiteNavigationNode, page: SiteNode) => (
	root.node.pagePath === page.pagePath
	|| (root.node.pagePath !== '' && page.pagePath.startsWith(`${root.node.pagePath}/`))
);

// Beyond twelve choices, use a destination with a local tree instead of a panel.
export const hasLargeAreaMenu = (root: SiteNavigationNode) => (
	root.children.length + (root.node.kind === 'page' ? 1 : 0) > 12
);

export const getAreaMenuGroups = (root: SiteNavigationNode) => {
	const choices = root.node.kind === 'page' ? [root, ...root.children] : root.children;
	return {
		branches: choices.filter(({ children }) => children.length > 0),
		pages: choices.filter(({ children }) => children.length === 0),
	};
};

// Only the listed tree enters this resolver. Flat collections keep their pages
// together; collections with subgroups select child branches. Large collections
// and a parent's own overview retain the full tree. Scope never depends on the
// arrival route, stored state or the number of headings on a page.
export const resolveAreaNavigation = (roots: SiteNavigationNode[], page?: SiteNode) => {
	const globalRoot = page ? roots.find((root) => containsPage(root, page)) : undefined;
	if (globalRoot && globalRoot.children.length > 0 && (
		globalRoot.children.every((child) => child.children.length === 0)
		|| hasLargeAreaMenu(globalRoot) || page?.pagePath === globalRoot.node.pagePath
	)) return { globalRoot, localRoot: globalRoot };
	const area = page && globalRoot?.children.find((child) => (
		child.children.length > 0 && containsPage(child, page)
	));
	return { globalRoot, localRoot: area };
};

export const withH2Outlines = (roots: SiteNavigationNode[]): SiteNavigationNode[] => roots.map((root) => ({
	...root,
	headings: root.headings.filter(({ depth }) => depth === 2),
	children: withH2Outlines(root.children),
}));
