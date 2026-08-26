import assert from 'node:assert/strict';
import {
	decodePageDirectoryPath,
	encodePageDirectoryPath,
	getPageDirectoryAncestors,
	parsePageDirectory,
	parsePageDirectoryPath,
} from './lib/page-model.mjs';

assert.deepEqual(parsePageDirectory('010-getting-started'), {
	pageDirectory: '010-getting-started',
	pageOrder: 10,
	pageId: 'getting-started',
});

assert.deepEqual(parsePageDirectory('120-api-reference'), {
	pageDirectory: '120-api-reference',
	pageOrder: 120,
	pageId: 'api-reference',
});

assert.deepEqual(parsePageDirectory('000-home'), {
	pageDirectory: '000-home',
	pageOrder: 0,
	pageId: 'home',
});

assert.deepEqual(parsePageDirectoryPath('000-home'), {
	pageDirectory: '000-home',
	pageDirectories: ['000-home'],
	pageId: 'home',
	pageIds: [],
	pageOrder: 0,
	pageOrders: [],
	pagePath: '',
	parentPagePath: null,
	depth: 1,
});

assert.throws(
	() => parsePageDirectoryPath('000-home/pages/010-about'),
	/000-home is the homepage and cannot contain child pages.*beside it under site\/pages\/.*below another non-home page/,
);

assert.deepEqual(parsePageDirectoryPath('010-guides/pages/020-installation'), {
	pageDirectory: '010-guides/pages/020-installation',
	pageDirectories: ['010-guides', '020-installation'],
	pageId: 'installation',
	pageIds: ['guides', 'installation'],
	pageOrder: 20,
	pageOrders: [10, 20],
	pagePath: 'guides/installation',
	parentPagePath: 'guides',
	depth: 2,
});

assert.equal(
	encodePageDirectoryPath('010-guides/pages/020-installation'),
	'010-guides--020-installation',
);
assert.equal(
	decodePageDirectoryPath('010-guides--020-installation'),
	'010-guides/pages/020-installation',
);
assert.deepEqual(
	getPageDirectoryAncestors('010-guides/pages/020-installation/pages/030-macos'),
	[
		'010-guides',
		'010-guides/pages/020-installation',
		'010-guides/pages/020-installation/pages/030-macos',
	],
);

for (const pageDirectoryPath of [
	'010-guides/020-installation',
	'010-guides/children/020-installation',
	'pages/010-guides',
	'010-guides/pages',
]) {
	assert.throws(
		() => parsePageDirectoryPath(pageDirectoryPath),
		/(Nested pages must use|Use a pages directory)/,
		`${pageDirectoryPath} should be rejected`,
	);
}

for (const pageDirectory of [
	'000-about',
	'10-about',
	'010_About',
	'010-About',
	'010-about-',
	'010-about--team',
	'010-om-oss!',
]) {
	assert.throws(
		() => parsePageDirectory(pageDirectory),
		/(Page directories must use the form NNN-page-id|000 prefix is reserved)/,
		`${pageDirectory} should be rejected`,
	);
}

assert.throws(
	() => parsePageDirectoryPath('010-guides/pages/000-home'),
	/000-home is allowed only as a top-level page/,
);

console.log('Page model test passed.');
