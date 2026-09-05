import assert from 'node:assert/strict';
import {
	getAutomaticNavigationMode,
	navigationModeNames,
	resolveNavigationModel,
	resolvePageContentsPlacement,
} from './lib/navigation-model.mjs';

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
const category = (overrides = {}) => ({
	pagePath: 'guides',
	kind: 'category',
	isHome: false,
	listed: true,
	depth: 1,
	headings: [],
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
assert.equal(getAutomaticNavigationMode([home([h2]), category()]), 'tree');

const contextualNodes = [
	home([h2]),
	page([h2], { pagePath: 'about' }),
	category(),
	page([h2], { pagePath: 'guides/install', depth: 2 }),
];
assert.equal(getAutomaticNavigationMode(contextualNodes, home()), 'top');
assert.equal(getAutomaticNavigationMode(contextualNodes, page([], { pagePath: 'about' })), 'top');
assert.equal(getAutomaticNavigationMode(contextualNodes, page([], { pagePath: 'guides/install', depth: 2 })), 'tree');

for (const mode of ['sections', 'top', 'tree']) {
	const resolved = resolveNavigationModel({
		mode,
		nodes: [home([h2]), page([h2, h3])],
	});
	assert.equal(resolved.requestedMode, mode);
	assert.equal(resolved.mode, mode);
}

const automatic = resolveNavigationModel({
	nodes: contextualNodes,
	currentPage: page([], { pagePath: 'about' }),
});
assert.equal(automatic.requestedMode, 'automatic');
assert.equal(automatic.mode, 'top');
assert.equal(automatic.listedNodeCount, 4);
assert.equal(automatic.hasNestedPages, true);
assert.equal(automatic.maximumDepth, 2);

const nestedAutomatic = resolveNavigationModel({
	nodes: contextualNodes,
	currentPage: page([], { pagePath: 'guides/install', depth: 2 }),
});
assert.equal(nestedAutomatic.mode, 'tree');

assert.throws(
	() => resolveNavigationModel({ mode: 'sidebar', nodes: [home()] }),
	/Unknown navigation mode "sidebar".*automatic, sections, top, tree/,
);

for (const mode of ['sections', 'top']) {
	assert.throws(
		() => resolveNavigationModel({ mode, nodes: [home(), category()] }),
		/Navigation categories require tree navigation/,
	);
}
const categoryTree = resolveNavigationModel({ mode: 'tree', nodes: [home(), category()] });
assert.equal(categoryTree.mode, 'tree');
assert.equal(categoryTree.hasCategories, true);

const shallowBranch = [
	home([h2]),
	category({ pagePath: 'reference' }),
	page([h2, h3], { pagePath: 'reference/install', depth: 2 }),
];
const deepBranch = [
	home([h2]),
	category(),
	page([h2, h3], { pagePath: 'guides/install', depth: 2 }),
	page([h2, h3], { pagePath: 'guides/install/macos', depth: 3 }),
];

assert.deepEqual(
	resolvePageContentsPlacement({
		navigationMode: 'tree',
		nodes: shallowBranch,
		currentPage: { isHome: false, pagePath: 'reference/install' },
		headingCount: 3,
	}),
	{
		activeBranchDepth: 2,
		hasPageContents: true,
		placement: 'page-tree',
	},
);
assert.equal(resolvePageContentsPlacement({
	navigationMode: 'tree',
	nodes: deepBranch,
	currentPage: { isHome: false, pagePath: 'guides' },
	headingCount: 3,
}).placement, 'contents-rail');
assert.deepEqual(
	resolvePageContentsPlacement({
		navigationMode: 'tree',
		nodes: deepBranch,
		currentPage: { isHome: false, pagePath: 'guides/install' },
		headingCount: 3,
	}),
	{
		activeBranchDepth: 3,
		hasPageContents: true,
		placement: 'contents-rail',
	},
);
assert.equal(resolvePageContentsPlacement({
	navigationMode: 'tree',
	nodes: [
		...shallowBranch,
		page([h2], {
			pagePath: 'reference/install/hidden',
			depth: 3,
			listed: false,
		}),
	],
	currentPage: { isHome: false, pagePath: 'reference/install' },
	headingCount: 3,
}).placement, 'page-tree');
assert.equal(resolvePageContentsPlacement({
	navigationMode: 'tree',
	nodes: shallowBranch,
	currentPage: { isHome: false, pagePath: 'reference/install' },
	headingCount: 1,
}).placement, 'none');
assert.equal(resolvePageContentsPlacement({
	navigationMode: 'top',
	nodes: deepBranch,
	currentPage: { isHome: false, pagePath: 'guides/install' },
	headingCount: 3,
}).placement, 'none');

console.log('Navigation model test passed.');
