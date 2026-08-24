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

for (const mode of ['sections', 'top', 'tree']) {
	const resolved = resolveNavigationModel({
		mode,
		pages: [home([h2]), page([h2, h3])],
	});
	assert.equal(resolved.requestedMode, mode);
	assert.equal(resolved.mode, mode);
}

const automatic = resolveNavigationModel({
	pages: [home([h2]), page([h2, h3])],
});
assert.equal(automatic.requestedMode, 'automatic');
assert.equal(automatic.mode, 'tree');
assert.equal(automatic.listedPageCount, 2);
assert.equal(automatic.maximumDepth, 3);

assert.throws(
	() => resolveNavigationModel({ mode: 'sidebar', pages: [home()] }),
	/Unknown navigation mode "sidebar".*automatic, sections, top, tree/,
);

console.log('Navigation model test passed.');
