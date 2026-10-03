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

assert.deepEqual(parsePageDirectory('getting-started'), {
	pageDirectory: 'getting-started',
	pageOrder: null,
	pageId: 'getting-started',
});

assert.deepEqual(parsePageDirectory('api-reference'), {
	pageDirectory: 'api-reference',
	pageOrder: null,
	pageId: 'api-reference',
});

assert.deepEqual(parsePageDirectoryPath('.'), {
	pageDirectory: '.', pageDirectories: [], pageId: 'home', pageIds: [],
	pageOrder: 0, pagePath: '', parentPagePath: null, depth: 0,
});
assert.deepEqual(getPageDirectoryAncestors('.'), []);

assert.deepEqual(parsePageDirectoryPath('guides/pages/installation'), {
	pageDirectory: 'guides/pages/installation',
	pageDirectories: ['guides', 'installation'],
	pageId: 'installation',
	pageIds: ['guides', 'installation'],
	pageOrder: null,
	pagePath: 'guides/installation',
	parentPagePath: 'guides',
	depth: 2,
});

assert.equal(
	encodePageDirectoryPath('guides/pages/installation'),
	'guides--installation',
);
assert.equal(
	decodePageDirectoryPath('guides--installation'),
	'guides/pages/installation',
);

assert.equal(getSiteEntryPrefix('./examples/docs/site'), 'examples-docs-site');
assert.equal(getSiteEntryPrefix('C:\\docs\\page-site'), 'C-docs-page-site');
assert.equal(getSiteEntryPrefix('/'), 'site');
assert.equal(encodePageEntryId('site', '.'), 'site-page-~home');
assert.equal(
	encodePageEntryId('./examples/docs/site', 'guides/pages/installation'),
	'examples-docs-site-page-guides--installation',
);
assert.equal(
	encodePageEntryId('docs-page-site', 'page-move'),
	'docs-page-site-page-page-move',
);

for (const siteDirLabel of ['site', './examples/docs/site', 'docs-page-site', '/tmp/page-sites/site', 'C:\\docs\\page-site', '/']) {
	for (const pageDirectory of [
		'.',
		'root',
		'guide',
		'about',
		'guides/pages/installation',
		'page-move',
		'page-move/pages/installation',
		'guides/pages/page-move',
		'page-move/pages/page-copy',
		'page-home',
		'page-home',
		'one-page-two-page-three/pages/child',
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
	'other-site-page-about',
	'site-extra-page-about',
	'site-page-010-About',
	'site-page-page-move--',
	'site-page-about---child',
]) {
	assert.equal(decodePageEntryId('site', entryId), null, `${entryId} is not a valid page entry for site`);
}

assert.deepEqual(
	getPageDirectoryAncestors('guides/pages/installation/pages/macos'),
	[
		'guides',
		'guides/pages/installation',
		'guides/pages/installation/pages/macos',
	],
);

for (const pageDirectoryPath of [
	'guides/installation',
	'guides/children/installation',
	'pages/guides',
	'guides/pages',
]) {
	assert.throws(
		() => parsePageDirectoryPath(pageDirectoryPath),
		/(Nested pages must use|Use a pages directory)/,
		`${pageDirectoryPath} should be rejected`,
	);
}

for (const pageDirectory of [
	'010_About',
	'010-About',
	'about-',
	'about--team',
	'om-oss!',
]) {
	assert.throws(
		() => parsePageDirectory(pageDirectory),
		/Page directories must use a slug/,
		`${pageDirectory} should be rejected`,
	);
}

console.log('Page model test passed.');
