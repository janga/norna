import assert from 'node:assert/strict';
import { getAreaMenuGroups, hasLargeAreaMenu, resolveAreaNavigation, withH2Outlines } from '../src/lib/areaNavigation.ts';
import {
	getAutomaticNavigationMode,
	navigationModeNames,
	resolveNavigationModel,
} from './lib/navigation-model.mjs';
import {
	getDirectChildPages,
	getListedSiteNavigationTree,
	getSequentialPageNavigation,
} from './lib/site-navigation-tree.mjs';

const home = (headings = []) => ({
	pagePath: '',
	isHome: true,
	kind: 'page',
	listed: true,
	depth: 1,
	headings,
});
const page = (headings = [], overrides = {}) => ({
	pagePath: 'about',
	kind: 'page',
	isHome: false,
	listed: true,
	depth: 1,
	headings,
	...overrides,
});
const h2 = { depth: 2 };
const h3 = { depth: 3 };

assert.deepEqual(navigationModeNames, ['automatic', 'sections', 'top', 'tree']);
assert.equal(getAutomaticNavigationMode([home([h2, h3])]), 'sections');
assert.equal(getAutomaticNavigationMode([home([h2]), page([h2])]), 'top');
assert.equal(getAutomaticNavigationMode([home([h2]), page([h2, h3])]), 'top');
assert.equal(
	getAutomaticNavigationMode([home([h2]), page([h2, h3], { listed: false })]),
	'sections',
);
assert.equal(
	getAutomaticNavigationMode([
		home([h2]),
		page([], { pagePath: 'guides' }),
		page([], { pagePath: 'guides/install', depth: 2 }),
	]),
	'tree',
);
assert.equal(
	getAutomaticNavigationMode([home([h2]), page([h2], { pagePath: 'guides/install', depth: 2 })]),
	'tree',
);
const hierarchicalNodes = [
	home([h2]),
	page([h2], { pagePath: 'about' }),
	page([], { pagePath: 'guides' }),
	page([h2], { pagePath: 'guides/install', depth: 2 }),
];
assert.equal(getAutomaticNavigationMode(hierarchicalNodes), 'tree');

for (const mode of ['sections', 'top', 'tree']) {
	const resolved = resolveNavigationModel({
		mode,
		nodes: [home([h2]), page([h2, h3])],
	});
	assert.equal(resolved.requestedMode, mode);
	assert.equal(resolved.mode, mode);
}

const automatic = resolveNavigationModel({
	nodes: hierarchicalNodes,
});
assert.equal(automatic.requestedMode, 'automatic');
assert.equal(automatic.mode, 'tree');
assert.equal(automatic.listedNodeCount, 4);
assert.equal(automatic.hasNestedPages, true);
assert.equal(automatic.maximumDepth, 2);

const nestedAutomatic = resolveNavigationModel({
	nodes: hierarchicalNodes,
});
assert.equal(nestedAutomatic.mode, 'tree');

assert.throws(
	() => resolveNavigationModel({ mode: 'sidebar', nodes: [home()] }),
	/Unknown navigation mode "sidebar".*automatic, sections, top, tree/,
);

assert.equal(resolveNavigationModel({ mode: 'tree', nodes: hierarchicalNodes }).hasCategories, false);

const sequenceEntry = ({
	pagePath,
	kind = 'page',
	parentPagePath = null,
	listed = true,
	title = pagePath || 'Home',
}) => ({
	node: {
		isHome: pagePath === '',
		kind,
		navigation: { listed },
		pagePath,
		parentPagePath,
		title,
	},
	headings: [],
	sections: [],
});
const sequenceTree = getListedSiteNavigationTree([
	sequenceEntry({ pagePath: '' }),
	sequenceEntry({ pagePath: 'guides', title: 'Guides' }),
	sequenceEntry({ pagePath: 'guides/install', parentPagePath: 'guides', title: 'Install' }),
	sequenceEntry({ pagePath: 'guides/install/macos', parentPagePath: 'guides/install', title: 'macOS' }),
	sequenceEntry({ pagePath: 'guides/install/private', parentPagePath: 'guides/install', listed: false }),
	sequenceEntry({ pagePath: 'guides/work', parentPagePath: 'guides', title: 'Work' }),
	sequenceEntry({ pagePath: 'reference', title: 'Reference' }),
]);
assert.deepEqual(
	getSequentialPageNavigation(sequenceTree, 'guides/install'),
	{
		previous: sequenceTree[1].node,
		next: sequenceTree[1].children[0].children[0].node,
	},
);
assert.deepEqual(
	getSequentialPageNavigation(sequenceTree, 'guides/install/macos'),
	{
		previous: sequenceTree[1].children[0].node,
		next: sequenceTree[1].children[1].node,
	},
);
assert.deepEqual(
	getSequentialPageNavigation(sequenceTree, 'guides/work'),
	{
		previous: sequenceTree[1].children[0].children[0].node,
		next: null,
	},
);
assert.deepEqual(getSequentialPageNavigation(sequenceTree, 'reference'), { previous: null, next: null });
assert.deepEqual(getSequentialPageNavigation(sequenceTree, 'guides/install/private'), { previous: null, next: null });
assert.deepEqual(
	getDirectChildPages(sequenceTree, 'guides/install'),
	[sequenceTree[1].children[0].children[0].node],
);
assert.deepEqual(
	getDirectChildPages(sequenceTree, 'guides'),
	[
		sequenceTree[1].children[0].node,
		sequenceTree[1].children[1].node,
	],
);
assert.deepEqual(getDirectChildPages(sequenceTree, ''), [sequenceTree[1].node, sequenceTree[2].node]);
assert.deepEqual(getDirectChildPages(sequenceTree, 'guides/install/private'), []);
assert.deepEqual(getDirectChildPages(sequenceTree, 'missing'), []);

// Area selection uses the listed hierarchy, including content-bearing parents
// and flat siblings. Similar path prefixes must not imply ancestry.
const areaEntries = [
	sequenceEntry({ pagePath: '' }),
	sequenceEntry({ pagePath: 'manual' }),
	sequenceEntry({ pagePath: 'manual/start', parentPagePath: 'manual' }),
	sequenceEntry({ pagePath: 'manual/install', parentPagePath: 'manual' }),
	sequenceEntry({ pagePath: 'manual/install/system', parentPagePath: 'manual/install' }),
	sequenceEntry({ pagePath: 'manual/install/system/verify', parentPagePath: 'manual/install/system' }),
	sequenceEntry({ pagePath: 'manual/installation', parentPagePath: 'manual' }),
	sequenceEntry({ pagePath: 'manual/hidden', parentPagePath: 'manual', listed: false }),
	sequenceEntry({ pagePath: 'manual/hidden/child', parentPagePath: 'manual/hidden' }),
	sequenceEntry({ pagePath: 'manual/empty', parentPagePath: 'manual' }),
	sequenceEntry({ pagePath: 'faq' }),
	sequenceEntry({ pagePath: 'faq/first', parentPagePath: 'faq' }),
	sequenceEntry({ pagePath: 'faq/second', parentPagePath: 'faq' }),
	sequenceEntry({ pagePath: 'faq/hidden', parentPagePath: 'faq', listed: false }),
	sequenceEntry({ pagePath: 'faq/hidden/child', parentPagePath: 'faq/hidden' }),
	sequenceEntry({ pagePath: 'faq/empty', parentPagePath: 'faq' }),
	sequenceEntry({ pagePath: 'resources' }),
	sequenceEntry({ pagePath: 'resources/capabilities', parentPagePath: 'resources' }),
	sequenceEntry({ pagePath: 'standalone' }),
];
const areaRoots = getListedSiteNavigationTree(areaEntries);
const scopeFor = (pagePath) => resolveAreaNavigation(areaRoots, { pagePath });
for (const pagePath of ['manual/start', 'manual/installation']) {
	assert.equal(scopeFor(pagePath).localRoot, undefined);
	assert.equal(scopeFor(pagePath).globalRoot.node.pagePath, 'manual');
}
assert.equal(scopeFor('manual').localRoot.node.pagePath, 'manual');
assert.equal(scopeFor('faq').localRoot.node.pagePath, 'faq');
for (const pagePath of ['manual/install', 'manual/install/system', 'manual/install/system/verify']) {
	assert.equal(scopeFor(pagePath).localRoot.node.pagePath, 'manual/install');
	assert.equal(scopeFor(pagePath).globalRoot.node.pagePath, 'manual');
}
assert.equal(scopeFor('').localRoot, undefined);
assert.equal(scopeFor('').globalRoot.node.isHome, true);
assert.equal(scopeFor('manual-other').globalRoot, undefined);
assert.equal(resolveAreaNavigation(areaRoots).localRoot, undefined);
for (const pagePath of ['faq/first', 'faq/second']) {
	assert.equal(scopeFor(pagePath).localRoot.node.pagePath, 'faq');
	assert.deepEqual(scopeFor(pagePath).localRoot.children.map(({ node }) => node.pagePath), ['faq/first', 'faq/second', 'faq/empty']);
}
assert.equal(scopeFor('resources/capabilities').localRoot.node.pagePath, 'resources', 'A flat authored parent retains its context too.');
assert.equal(scopeFor('standalone').localRoot, undefined);
assert.equal(scopeFor('manual/hidden/child').localRoot, undefined);
assert.deepEqual(scopeFor('manual/hidden/child').globalRoot.children.map(({ node }) => node.pagePath), [
	'manual/start', 'manual/install', 'manual/installation', 'manual/empty',
]);
assert.deepEqual(getAreaMenuGroups(areaRoots[1]).branches.map(({ node }) => node.pagePath), ['manual', 'manual/install']);
assert.deepEqual(getAreaMenuGroups(areaRoots[1]).pages.map(({ node }) => node.pagePath), ['manual/start', 'manual/installation', 'manual/empty']);
assert.deepEqual(getAreaMenuGroups(areaRoots[2]).branches.map(({ node }) => node.pagePath), ['faq']);

{
	const entries = [sequenceEntry({ pagePath: 'large' }), ...Array.from({ length: 11 }, (_, index) => (
		sequenceEntry({ pagePath: `large/page-${index}`, parentPagePath: 'large' })
	))];
	const atBoundary = getListedSiteNavigationTree(entries);
	assert.equal(hasLargeAreaMenu(atBoundary[0]), false, 'Twelve visible choices still fit the menu.');
	assert.equal(resolveAreaNavigation(atBoundary, { pagePath: 'large/page-0' }).localRoot.node.pagePath, 'large');
	const withExcluded = getListedSiteNavigationTree([...entries,
		sequenceEntry({ pagePath: 'large/hidden', parentPagePath: 'large', listed: false }),
	]);
	assert.equal(hasLargeAreaMenu(withExcluded[0]), false, 'Unlisted choices must not trigger overflow.');
	const subgroup = sequenceEntry({ pagePath: 'large/page-1/child', parentPagePath: 'large/page-1' });
	const withSubgroup = getListedSiteNavigationTree([...entries, subgroup]);
	assert.equal(hasLargeAreaMenu(withSubgroup[0]), false, 'Deeper descendants do not count as sticky choices.');
	assert.equal(resolveAreaNavigation(withSubgroup, { pagePath: 'large/page-0' }).localRoot, undefined,
		'A direct leaf beside a subgroup has only its own outline while the menu fits.');
	const overBoundary = getListedSiteNavigationTree([...entries,
		subgroup,
		sequenceEntry({ pagePath: 'large/extra', parentPagePath: 'large' }),
	]);
	assert.equal(hasLargeAreaMenu(overBoundary[0]), true);
	assert.equal(resolveAreaNavigation(overBoundary, { pagePath: 'large/page-0' }).localRoot.node.pagePath, 'large');
}

areaRoots[1].headings = [{ depth: 2, id: 'overview' }, { depth: 3, id: 'detail', parentId: 'overview' }];
areaRoots[1].children[1].headings = [{ depth: 2, id: 'install' }, { depth: 3, id: 'requirements', parentId: 'install' }];
const outlinedAreas = withH2Outlines(areaRoots);
assert.deepEqual(outlinedAreas[1].headings.map(({ id }) => id), ['overview']);
assert.deepEqual(outlinedAreas[1].children[1].headings.map(({ id }) => id), ['install']);
assert.equal(areaRoots[1].headings.length, 2, 'Filtering the trial outline must not mutate the baseline tree.');
assert.deepEqual(outlinedAreas[1].children.map(({ node }) => node.pagePath), areaRoots[1].children.map(({ node }) => node.pagePath));

console.log('Navigation model and area navigation tests passed.');
