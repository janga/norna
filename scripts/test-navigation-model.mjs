import assert from 'node:assert/strict';
import {
	getAutomaticNavigationMode,
	navigationModeNames,
	resolveNavigationModel,
} from './lib/navigation-model.mjs';

const home = (headings = []) => ({
	isHome: true,
	listed: true,
	depth: 1,
	headings,
});
const page = (headings = [], overrides = {}) => ({
	kind: 'page',
	isHome: false,
	listed: true,
	depth: 1,
	headings,
	...overrides,
});
const category = (overrides = {}) => ({
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
assert.equal(getAutomaticNavigationMode([home([h2]), page([h2, h3])]), 'tree');
assert.equal(
	getAutomaticNavigationMode([home([h2]), page([h2, h3], { listed: false })]),
	'sections',
);
assert.equal(
	getAutomaticNavigationMode([home([h2]), page([], { depth: 2 })]),
	'top',
);
assert.equal(
	getAutomaticNavigationMode([home([h2]), page([h2], { depth: 2 })]),
	'tree',
);
assert.equal(getAutomaticNavigationMode([home([h2]), category()]), 'tree');

for (const mode of ['sections', 'top', 'tree']) {
	const resolved = resolveNavigationModel({
		mode,
		nodes: [home([h2]), page([h2, h3])],
	});
	assert.equal(resolved.requestedMode, mode);
	assert.equal(resolved.mode, mode);
}

const automatic = resolveNavigationModel({
	nodes: [home([h2]), page([h2, h3])],
});
assert.equal(automatic.requestedMode, 'automatic');
assert.equal(automatic.mode, 'tree');
assert.equal(automatic.listedNodeCount, 2);
assert.equal(automatic.maximumDepth, 3);

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

console.log('Navigation model test passed.');
