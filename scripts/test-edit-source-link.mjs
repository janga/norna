import assert from 'node:assert/strict';
import {
	getEditSourceUrl,
	getLocalEditorSourceUrl,
	isLoopbackHostname,
	normalizeEditLinkBaseUrl,
	resolveEditSourceTarget,
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
assert.equal(
	getLocalEditorSourceUrl({
		editor: 'vscode',
		sourcePath: '/Users/example/My Norna Site/site/pages/000-home/content.md',
	}),
	'vscode://file/Users/example/My%20Norna%20Site/site/pages/000-home/content.md',
);

for (const hostname of ['localhost', 'docs.localhost', '127.0.0.1', '127.12.34.56', '::1', '[::1]', '::ffff:127.0.0.1']) {
	assert.equal(isLoopbackHostname(hostname), true, hostname);
}
for (const hostname of ['192.168.1.12', 'docs.example.com', '']) {
	assert.equal(isLoopbackHostname(hostname), false, hostname);
}

const linkOptions = {
	baseUrl: 'https://github.com/example/project/edit/main/',
	localEditor: 'vscode',
	sourceLabel: 'site/pages/000-home/content.md',
	sourcePath: '/Users/example/project/site/pages/000-home/content.md',
};
assert.deepEqual(resolveEditSourceTarget({
	...linkOptions,
	development: true,
	hostname: '127.0.0.1',
}), {
	href: 'vscode://file/Users/example/project/site/pages/000-home/content.md',
	kind: 'local',
});
assert.deepEqual(resolveEditSourceTarget({
	...linkOptions,
	development: true,
	hostname: '192.168.1.12',
}), {
	href: 'https://github.com/example/project/edit/main/site/pages/000-home/content.md',
	kind: 'remote',
});
assert.deepEqual(resolveEditSourceTarget({
	...linkOptions,
	development: false,
	hostname: '127.0.0.1',
}), {
	href: 'https://github.com/example/project/edit/main/site/pages/000-home/content.md',
	kind: 'remote',
});
assert.equal(resolveEditSourceTarget({
	...linkOptions,
	baseUrl: null,
	development: true,
	hostname: 'docs.example.com',
}), null);
assert.equal(resolveEditSourceTarget({
	...linkOptions,
	baseUrl: null,
	development: false,
	hostname: 'localhost',
}), null);

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

assert.throws(
	() => getLocalEditorSourceUrl({ editor: 'unknown', sourcePath: '/tmp/content.md' }),
	/Unknown local editor "unknown".*vscode/,
);
assert.throws(
	() => getLocalEditorSourceUrl({ editor: 'vscode', sourcePath: 'site/content.md' }),
	/Local editor source path must be absolute/,
);

console.log('Edit-source link tests passed.');
