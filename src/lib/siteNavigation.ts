import type { HeadingNavigation, SectionNavigation } from './sectionContent';
import type { SiteNode, SitePage } from './sitePages';
import {
	flattenSiteNavigationTree as flattenSiteNavigationTreeShared,
	getDirectChildPages as getDirectChildPagesShared,
	getListedSiteNavigationTree as getListedSiteNavigationTreeShared,
	getSequentialPageNavigation as getSequentialPageNavigationShared,
} from '../../scripts/lib/site-navigation-tree.mjs';

export type CategoryDestinationMap = ReadonlyMap<string, { target: SitePage | null }>;

export const getNavigationDestination = (node: SiteNode, categoryDestinations?: CategoryDestinationMap): SiteNode => (
	categoryDestinations?.get(node.pathname)?.target ?? node
);

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

export const getDirectChildPages = (
	nodes: SiteNavigationNode[],
	currentPagePath: string,
): SitePage[] => getDirectChildPagesShared(nodes, currentPagePath) as SitePage[];
