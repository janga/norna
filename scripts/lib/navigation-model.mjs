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

const branchNeedsPageRail = (nodes, pagePath) => {
	const rootPath = getTopLevelPagePath(pagePath);
	if (!rootPath) return false;

	return nodes.some((node) => (
		(node.pagePath === rootPath && node.kind === 'category')
		|| node.pagePath?.startsWith(`${rootPath}/`)
	));
};

export const getAutomaticNavigationMode = (nodes, currentPage = null) => {
	const listedNodes = getListedNodes(nodes);
	if (listedNodes.length <= 1) return 'sections';

	if (currentPage) {
		if (currentPage.isHome) return 'top';
		return branchNeedsPageRail(listedNodes, currentPage.pagePath) ? 'tree' : 'top';
	}

	return listedNodes.some((node) => node.kind === 'category' || getNodeDepth(node) > 1)
		? 'tree'
		: 'top';
};

export const resolveNavigationModel = ({ mode = 'automatic', nodes, currentPage = null }) => {
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
			? getAutomaticNavigationMode(listedNodes, currentPage)
			: requestedMode,
		requestedMode,
		listedNodeCount: listedNodes.length,
		hasCategories,
		hasNestedPages,
		maximumDepth,
	});
};
