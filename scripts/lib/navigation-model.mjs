export const navigationModeNames = Object.freeze([
	'automatic',
	'sections',
	'top',
	'tree',
]);

const assertNavigationMode = (mode) => {
	if (!navigationModeNames.includes(mode)) {
		throw new Error(`Unknown navigation mode "${mode}". Use one of: ${navigationModeNames.join(', ')}.`);
	}

	return mode;
};

const getListedNodes = (nodes) => nodes.filter((node) => node.isHome || node.listed !== false);

const getNodeDepth = (node) => node.depth ?? 1;

const getTopLevelPagePath = (pagePath) => pagePath?.split('/')[0] ?? '';

const getActiveBranchNodes = (nodes, currentPage) => {
	if (!currentPage) return [];
	if (currentPage.isHome) return nodes.filter((node) => node.isHome);

	const rootPath = getTopLevelPagePath(currentPage.pagePath);
	return nodes.filter((node) => (
		node.pagePath === rootPath
		|| node.pagePath?.startsWith(`${rootPath}/`)
	));
};

export const getAutomaticNavigationMode = (nodes) => {
	const listedNodes = getListedNodes(nodes);
	if (listedNodes.length <= 1) return 'sections';

	return listedNodes.some((node) => node.kind === 'category' || getNodeDepth(node) > 1)
		? 'tree'
		: 'top';
};

export const resolveNavigationModel = ({ mode = 'automatic', nodes }) => {
	const requestedMode = assertNavigationMode(mode);
	const listedNodes = getListedNodes(nodes);
	const hasCategories = listedNodes.some((node) => node.kind === 'category');
	if (hasCategories && requestedMode !== 'automatic' && requestedMode !== 'tree') {
		throw new Error(`Navigation categories require tree navigation. Remove navigation.mode: ${requestedMode}, or set navigation.mode: tree.`);
	}
	const maximumDepth = listedNodes.reduce((maximum, node) => (
		Math.max(maximum, getNodeDepth(node))
	), 1);
	const hasNestedPages = listedNodes.some((node) => getNodeDepth(node) > 1);

	return Object.freeze({
		mode: requestedMode === 'automatic'
			? getAutomaticNavigationMode(listedNodes)
			: requestedMode,
		requestedMode,
		listedNodeCount: listedNodes.length,
		hasCategories,
		hasNestedPages,
		maximumDepth,
	});
};

export const resolvePageContentsPlacement = ({
	navigationMode,
	nodes,
	currentPage,
	headingCount,
}) => {
	const listedNodes = getListedNodes(nodes);
	const activeBranchNodes = getActiveBranchNodes(listedNodes, currentPage);
	const activeBranchDepth = activeBranchNodes.reduce((maximum, node) => (
		Math.max(maximum, getNodeDepth(node))
	), 0);
	const hasPageContents = headingCount >= 2;
	const placement = navigationMode !== 'tree' || !hasPageContents
		? 'none'
		: activeBranchDepth <= 2
			? 'page-tree'
			: 'contents-rail';

	return Object.freeze({
		activeBranchDepth,
		hasPageContents,
		placement,
	});
};
