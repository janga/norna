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

const getNodeNavigationDepth = (node) => {
	const nodeDepth = node.depth ?? 1;
	return (node.headings ?? []).reduce((maximum, heading) => (
		Math.max(maximum, nodeDepth + heading.depth - 1)
	), nodeDepth);
};

export const getAutomaticNavigationMode = (nodes) => {
	const listedNodes = getListedNodes(nodes);
	if (listedNodes.length <= 1) return 'sections';
	if (listedNodes.some((node) => node.kind === 'category')) return 'tree';

	const maximumDepth = listedNodes.reduce((maximum, node) => (
		Math.max(maximum, getNodeNavigationDepth(node))
	), 1);

	return maximumDepth <= 2 ? 'top' : 'tree';
};

export const resolveNavigationModel = ({ mode = 'automatic', nodes }) => {
	const requestedMode = assertNavigationMode(mode);
	const listedNodes = getListedNodes(nodes);
	const hasCategories = listedNodes.some((node) => node.kind === 'category');
	if (hasCategories && requestedMode !== 'automatic' && requestedMode !== 'tree') {
		throw new Error(`Navigation categories require tree navigation. Remove navigation.mode: ${requestedMode}, or set navigation.mode: tree.`);
	}
	const maximumDepth = listedNodes.reduce((maximum, node) => (
		Math.max(maximum, getNodeNavigationDepth(node))
	), 1);

	return Object.freeze({
		mode: requestedMode === 'automatic'
			? getAutomaticNavigationMode(listedNodes)
			: requestedMode,
		requestedMode,
		listedNodeCount: listedNodes.length,
		hasCategories,
		maximumDepth,
	});
};
