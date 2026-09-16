import assert from 'node:assert/strict';
import {
	decodePageDirectoryPath,
	decodePageEntryId,
	encodePageDirectoryPath,
	encodePageEntryId,
	getPageDirectoryAncestors,
	getSiteEntryPrefix,
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

assert.equal(getSiteEntryPrefix('./examples/docs/site'), 'examples-docs-site');
assert.equal(getSiteEntryPrefix('C:\\docs\\page-site'), 'C-docs-page-site');
assert.equal(getSiteEntryPrefix('/'), 'site');
assert.equal(encodePageEntryId('site', '000-home'), 'site-page-000-home');
assert.equal(
	encodePageEntryId('./examples/docs/site', '010-guides/pages/020-installation'),
	'examples-docs-site-page-010-guides--020-installation',
);
assert.equal(
	encodePageEntryId('docs-page-010-site', '010-page-move'),
	'docs-page-010-site-page-010-page-move',
);

for (const siteDirLabel of ['site', './examples/docs/site', 'docs-page-010-site', '/tmp/page-sites/site', 'C:\\docs\\page-site', '/']) {
	for (const pageDirectory of [
		'000-home',
		'010-about',
		'010-guides/pages/020-installation',
		'010-page-move',
		'010-page-move/pages/020-installation',
		'010-guides/pages/020-page-move',
		'010-page-move/pages/020-page-copy',
		'010-page-020-home',
		'010-page-000-home',
		'010-one-page-020-two-page-030-three/pages/040-child',
	]) {
		assert.equal(
			decodePageEntryId(siteDirLabel, encodePageEntryId(siteDirLabel, pageDirectory)),
			pageDirectory,
			`${siteDirLabel}: the entire page path must survive entry ID decoding`,
		);
	}
}

for (const entryId of [
	'site-theme',
	'site-sitewide',
	'site-page-',
	'other-site-page-010-about',
	'site-extra-page-010-about',
	'site-page-about',
	'site-page-000-about',
	'site-page-010-About',
	'site-page-010-page-move--',
	'site-page-010-about---020-child',
	'site-page-010-about--000-home',
	'site-page-000-home--010-child',
]) {
	assert.equal(decodePageEntryId('site', entryId), null, `${entryId} is not a valid page entry for site`);
}

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
