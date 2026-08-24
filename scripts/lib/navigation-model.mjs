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

const getListedPages = (pages) => pages.filter((page) => page.isHome || page.listed !== false);

const getPageNavigationDepth = (page) => {
	const pageDepth = page.depth ?? 1;
	return (page.headings ?? []).reduce((maximum, heading) => (
		Math.max(maximum, pageDepth + heading.depth - 1)
	), pageDepth);
};

export const getAutomaticNavigationMode = (pages) => {
	const listedPages = getListedPages(pages);
	if (listedPages.length <= 1) return 'sections';

	const maximumDepth = listedPages.reduce((maximum, page) => (
		Math.max(maximum, getPageNavigationDepth(page))
	), 1);

	return maximumDepth <= 2 ? 'top' : 'tree';
};

export const resolveNavigationModel = ({ mode = 'automatic', pages }) => {
	const requestedMode = assertNavigationMode(mode);
	const listedPages = getListedPages(pages);
	const maximumDepth = listedPages.reduce((maximum, page) => (
		Math.max(maximum, getPageNavigationDepth(page))
	), 1);

	return Object.freeze({
		mode: requestedMode === 'automatic'
			? getAutomaticNavigationMode(listedPages)
			: requestedMode,
		requestedMode,
		listedPageCount: listedPages.length,
		maximumDepth,
	});
};
