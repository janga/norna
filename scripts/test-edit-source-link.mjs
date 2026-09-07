import assert from 'node:assert/strict';
import {
	getEditSourceUrl,
	normalizeEditLinkBaseUrl,
} from './lib/edit-source-link.mjs';

assert.equal(
	normalizeEditLinkBaseUrl('https://github.com/example/project/edit/release-2'),
	'https://github.com/example/project/edit/release-2/',
);
assert.equal(
	getEditSourceUrl({
		baseUrl: 'https://github.com/example/project/edit/main/packages/docs/',
		sourcePath: 'site/pages/010-guides/pages/020-first steps/content.md',
	}),
	'https://github.com/example/project/edit/main/packages/docs/site/pages/010-guides/pages/020-first%20steps/content.md',
);
assert.equal(
	getEditSourceUrl({
		baseUrl: 'https://gitlab.example.com/group/project/-/edit/trunk/',
		sourcePath: String.raw`site\pages\000-home\content.md`,
	}),
	'https://gitlab.example.com/group/project/-/edit/trunk/site/pages/000-home/content.md',
);

for (const baseUrl of [
	'file:///tmp/project/',
	'https://user:secret@example.com/edit/main/',
	'https://example.com/edit/main/?mode=preview',
	'https://example.com/edit/main/#source',
]) {
	assert.throws(() => normalizeEditLinkBaseUrl(baseUrl), /editLink\.baseUrl must/);
}

for (const sourcePath of ['', '/site/content.md', '../site/content.md', 'site//content.md']) {
	assert.throws(() => getEditSourceUrl({
		baseUrl: 'https://example.com/edit/main/',
		sourcePath,
	}), /Edit-source path/);
}

console.log('Edit-source link tests passed.');
