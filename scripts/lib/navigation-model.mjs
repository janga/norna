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

export const getAutomaticNavigationMode = (nodes) => {
	const listedNodes = getListedNodes(nodes);
	if (listedNodes.length <= 1) return 'sections';

	return listedNodes.some((node) => getNodeDepth(node) > 1)
		? 'tree'
		: 'top';
};

export const resolveNavigationModel = ({ mode = 'automatic', nodes }) => {
	const requestedMode = assertNavigationMode(mode);
	const listedNodes = getListedNodes(nodes);
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
		hasCategories: false,
		hasNestedPages,
		maximumDepth,
	});
};
