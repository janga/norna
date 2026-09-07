import type { HeadingNavigation, SectionNavigation } from './sectionContent';
import type { SiteNode, SitePage } from './sitePages';
import {
	flattenSiteNavigationTree as flattenSiteNavigationTreeShared,
	getFirstPageInNavigationNode as getFirstPageInNavigationNodeShared,
	getListedSiteNavigationTree as getListedSiteNavigationTreeShared,
	getSequentialPageNavigation as getSequentialPageNavigationShared,
} from '../../scripts/lib/site-navigation-tree.mjs';

export type SiteNavigationEntry = {
	node: SiteNode;
	headings: HeadingNavigation[];
	sections: SectionNavigation[];
};

export type SiteNavigationNode = SiteNavigationEntry & {
	children: SiteNavigationNode[];
};

export const getListedSiteNavigationTree = (entries: SiteNavigationEntry[]) => (
	getListedSiteNavigationTreeShared(entries) as SiteNavigationNode[]
);

export const getFirstPageInNavigationNode = (node: SiteNavigationNode): SitePage | null => (
	getFirstPageInNavigationNodeShared(node) as SitePage | null
);

export const flattenSiteNavigationTree = (nodes: SiteNavigationNode[]): SiteNavigationNode[] => (
	flattenSiteNavigationTreeShared(nodes) as SiteNavigationNode[]
);

export const getSequentialPageNavigation = (
	nodes: SiteNavigationNode[],
	currentPagePath: string,
): { previous: SitePage | null; next: SitePage | null } => (
	getSequentialPageNavigationShared(nodes, currentPagePath) as {
		previous: SitePage | null;
		next: SitePage | null;
	}
);
