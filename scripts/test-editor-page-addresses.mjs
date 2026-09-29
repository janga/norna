import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, rename, rm, stat, symlink, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { applyEditorPageAddress, editSiteNodeInformation, getEditorIncomingLinks, getEditorPageAddresses, planEditorPageAddress, planEditorRemoval, readSiteFileTree } from './lib/editor-site-tree.mjs';
import { applyPageMovePlan } from './lib/page-move-apply.mjs';

const fixture = async (t) => {
	const siteRoot = await mkdtemp(path.join(os.tmpdir(), 'norna-addresses-'));
	t.after(() => rm(siteRoot, { recursive: true, force: true }));
	const write = async (relative, source) => {
		const filename = path.join(siteRoot, relative);
		await mkdir(path.dirname(filename), { recursive: true });
		await writeFile(filename, source);
		return filename;
	};
	await write('site-config/settings.yaml', 'url: https://example.com/manual/\nsearch: true\n');
	await write('root/tree-theme.yaml', 'preset: editorial\n');
	const home = await write('root/content.md', '# Home\n\n[Guide](/guide/)\n');
	const sourcePath = await write('root/pages/010-guide/content.md', '---\npage:\n  aliases:\n    - /old-guide/\n---\n\n# Guide\n\n## Read\n\n[My child](child/)\n');
	const child = await write('root/pages/010-guide/pages/020-child/content.md', '# Child\n\n[Parent](../)\n');
	return { siteRoot, sourcePath, home, child, write };
};
const applyEdits = (source, edits) => [...edits].sort((a, b) => b.start - a.start).reduce((text, edit) => text.slice(0, edit.start) + edit.text + text.slice(edit.end), source);

test('removal policies protect required files and describe optional file scope', async (t) => {
	const f = await fixture(t);
	for (const name of ['content.md', 'site-config/settings.yaml', 'root/tree-theme.yaml']) {
		await assert.rejects(planEditorRemoval({ ...f, sourcePath: f.home, filePath: path.join(f.siteRoot, name) }), /cannot be removed separately/);
	}
	for (const [file, sourcePath, effect] of [
		['root/page-theme.yaml', f.home, /Other pages are unchanged/],
		['root/pages/010-guide/tree-theme.yaml', f.sourcePath, /descendants/],
		['site-config/shared-content.yaml', f.home, /whole site/],
		['public/robots.txt', f.home, /no longer be published/],
	]) {
		const filePath = await f.write(file, '# optional\n');
		const plan = await planEditorRemoval({ ...f, sourcePath, filePath });
		assert.equal(plan.recursive, false); assert.match(plan.effect, effect);
		assert.ok((await readSiteFileTree(f)).items.find((item) => item.sourcePath === filePath).removable);
	}
	const nestedPublic = await f.write('public/.well-known/security.txt', 'Contact: mailto:security@example.com\n');
	const sources = new Map([[f.home, '# Home\n\n[Security](/.well-known/security.txt)\n']]);
	assert.equal((await planEditorRemoval({ ...f, sourcePath: f.home, filePath: nestedPublic, sources })).usage.references.length, 1);
	await assert.rejects(planEditorRemoval({ ...f, filePath: nestedPublic }), /cannot be removed separately/, 'A public file belongs to the site, not a descendant.');
	await symlink(nestedPublic, path.join(f.siteRoot, 'public/shortcut.txt'));
	await assert.rejects(planEditorRemoval({ ...f, sourcePath: f.home, filePath: path.join(f.siteRoot, 'public/shortcut.txt') }), /Symbolic links/);
});

test('site-owned file removal does not require a homepage and still reviews links and protects required files', async (t) => {
	const f = await fixture(t);
	const publicFile = await f.write('public/robots.txt', 'User-agent: *\n');
	const sharedFile = await f.write('site-config/shared-content.yaml', 'banners: []\n');
	await rm(f.home);
	const sources = new Map([[f.sourcePath, '# Guide\n\n[Robots](/robots.txt)\n']]);
	const options = { siteRoot: f.siteRoot, sourcePath: f.siteRoot, sources };
	const plan = await planEditorRemoval({ ...options, filePath: publicFile });
	assert.equal(plan.target, publicFile);
	assert.equal(plan.recursive, false);
	assert.equal(plan.usage.references.length, 1);
	assert.ok(plan.usage.incomplete.length, 'A missing homepage must remain visible in link-review limitations.');
	assert.match((await planEditorRemoval({ ...options, filePath: sharedFile })).effect, /whole site/);
	for (const file of ['site-config/settings.yaml', 'root/tree-theme.yaml', 'root/pages/010-guide/tree-theme.yaml']) {
		await assert.rejects(planEditorRemoval({ ...options, filePath: path.join(f.siteRoot, file) }), /cannot be removed separately/);
	}
	await assert.rejects(planEditorRemoval({ ...options, filePath: path.join(f.siteRoot, '../outside.txt') }), /selected site/);
	await symlink(publicFile, path.join(f.siteRoot, 'public/shortcut.txt'));
	await assert.rejects(planEditorRemoval({ ...options, filePath: path.join(f.siteRoot, 'public/shortcut.txt') }), /Symbolic links/);
});

test('incoming links resolve aliases, anchors, relative and card links, and exclude a deleted branch', async (t) => {
	const f = await fixture(t);
	const other = await f.write('root/pages/030-other/content.md', '# Other\n');
	const sources = new Map([[other, '# Other\n\n[Alias](/old-guide/#read)\n[Child](../guide/child/)\n[External](https://example.com/manual/guide/)\n[Reference][guide]\n\n[guide]: /guide/\n\n```card-list\nitems:\n  - title: Guide\n    link: /guide/\n```\n']]);
	const usage = await getEditorIncomingLinks({ ...f, sources });
	assert.equal(usage.references.filter((entry) => entry.sourcePath === other).length, 3);
	assert.ok(usage.references.some((entry) => entry.sourcePath === f.child));
	const plan = await planEditorRemoval({ ...f, sources });
	assert.equal(plan.usage.references.length, 5);
	assert.deepEqual(new Set(plan.usage.references.map(({ sourcePath }) => sourcePath)), new Set([f.home, other]));
	assert.equal(plan.usage.incomplete.length, 0);
	assert.equal((await getEditorIncomingLinks({ ...f, sources, alias: '/old-guide/' })).references.length, 1);
	sources.set(other, '# Other\n');
	assert.notEqual((await planEditorRemoval({ ...f, sources })).fingerprint, plan.fingerprint);
	const broken = await f.write('root/pages/040-broken/content.md', '---\npage: [\n---\n# Broken\n');
	const incomplete = await planEditorRemoval(f);
	assert.ok(incomplete.usage.incomplete.some((message) => message.includes('040-broken')));
	assert.ok(incomplete.usage.references.some((entry) => entry.sourcePath === f.home));
	await rm(broken);
});

test('addresses distinguish the site prefix, homepage, overview pages and dirty aliases', async (t) => {
	const f = await fixture(t);
	assert.deepEqual(await getEditorPageAddresses(f), { internalLink: '/guide/', webAddress: 'https://example.com/manual/guide/', segment: 'guide', aliases: ['/old-guide/'], incomplete: [] });
	assert.equal((await getEditorPageAddresses({ ...f, sourcePath: f.home })).webAddress, 'https://example.com/manual/');
	const overview = await f.write('root/pages/030-group/content.md', '---\npage:\n  listChildren: true\n---\n# Group\n');
	assert.equal((await getEditorPageAddresses({ ...f, sourcePath: overview })).internalLink, '/group/');
	const sources = new Map([[f.sourcePath, '---\npage:\n  aliases: [/draft/]\n---\n# Guide\n']]);
	assert.deepEqual((await getEditorPageAddresses({ ...f, sources })).aliases, ['/draft/']);
});

test('alias edits preserve prose, comments and LF/CRLF; reject collisions and invalid paths', async (t) => {
	const f = await fixture(t);
	for (const eol of ['\n', '\r\n']) {
		const source = ['---', '# Metadata comment', 'page:', '  description: Keep this exactly', '  aliases:', '    - /old-guide/ # Keep redirect comment', 'navigation: { listed: true }', '---', '', '# Guide', '', 'Unchanged prose.', ''].join(eol);
		const edit = (value, options = {}) => editSiteNodeInformation({ ...f, source, field: 'aliases', value, ...options });
		const next = applyEdits(source, await edit(['/old-guide/', '/archive/guide/']));
		assert.match(next, /Keep redirect comment/);
		assert.ok(next.includes('  description: Keep this exactly' + eol));
		assert.ok(next.endsWith('# Guide' + eol + eol + 'Unchanged prose.' + eol));
		assert.ok(!next.replaceAll(eol, '').includes('\n'));
		const removed = applyEdits(source, await edit([]));
		assert.doesNotMatch(removed, /aliases:/); assert.match(removed, /Keep redirect comment/);
		for (const alias of ['/', '/guide/', '/search/', '/sitemap.xml/', '/bad//path/', 'https://example.com/', '/has?query/', '/with#fragment/']) {
			await assert.rejects(edit([alias]));
		}
		await assert.rejects(edit(['/repeat/', '/repeat/']));
		const other = await f.write('root/pages/030-other/content.md', '# Other\n');
		await assert.rejects(edit(['/taken/'], { sources: new Map([[other, '---\npage:\n  aliases: [/taken/]\n---\n# Other\n']]) }), /conflicts/);
		await f.write('public/public-guide/index.html', 'A public file');
		await assert.rejects(edit(['/public-guide/']), /conflicts/);
	}
	for (const source of ['# Guide\n', '---\npage: {description: "Keep", aliases: [/old-guide/]}\n---\n# Guide\n']) {
		const next = applyEdits(source, await editSiteNodeInformation({ ...f, source, field: 'aliases', value: ['/added/'] }));
		assert.match(next, /\/added\//);
	}
	for (const eol of ['\n', '\r\n']) {
		const source = ['---', 'page:', '  aliases: [/last/]', '---', '', '# Guide', ''].join(eol);
		const next = applyEdits(source, await editSiteNodeInformation({ ...f, source, field: 'aliases', value: [] }));
		assert.equal(next, ['', '# Guide', ''].join(eol));
	}
});

test('URL segment changes preview then reuse the page-move transaction and update descendants', async (t) => {
	const f = await fixture(t);
	// Exercise the actual author journey: edit additional addresses, save,
	// then rename this page. Both actions must agree on the source format.
	const source = await readFile(f.sourcePath, 'utf8');
	await writeFile(f.sourcePath, applyEdits(source, await editSiteNodeInformation({ ...f, source, field: 'aliases', value: ['/old-guide/', '/archive/guide/'] })));
	await f.write('root/pages/010-guide/images/example.svg', '<svg/>');
	const plan = await planEditorPageAddress({ ...f, segment: 'handbook' });
	assert.equal(plan.webTo, 'https://example.com/manual/handbook/');
	assert.equal(path.basename(plan.destinationDirectory), '010-handbook');
	assert.equal(plan.mappings.length, 2);
	assert.equal(await readFile(f.home, 'utf8'), '# Home\n\n[Guide](/guide/)\n');
	let renames = 0;
	const result = await applyEditorPageAddress(plan, { renameDirectory: async (from, to) => { renames++; await rename(from, to); } });
	assert.equal(renames, 1);
	assert.equal(result.url, '/handbook/');
	assert.match(await readFile(f.home, 'utf8'), /\[Guide\]\(\/handbook\/\)/);
	assert.match(await readFile(result.sourcePath, 'utf8'), /- "?\/guide\//);
	assert.match(await readFile(path.join(plan.destinationDirectory, 'pages/020-child/content.md'), 'utf8'), /- "?\/guide\/child\//);
	assert.equal(await readFile(path.join(plan.destinationDirectory, 'images/example.svg'), 'utf8'), '<svg/>');
});

test('URL segment can return to an address previously owned by the same branch', async (t) => {
	const f = await fixture(t);
	const moved = await applyEditorPageAddress(await planEditorPageAddress({ ...f, segment: 'handbook' }));
	const returned = await applyEditorPageAddress(await planEditorPageAddress({
		siteRoot: f.siteRoot, sourcePath: moved.sourcePath, segment: 'guide',
	}));
	assert.equal(returned.url, '/guide/');
	assert.match(await readFile(returned.sourcePath, 'utf8'), /- "?\/handbook\//);
	assert.doesNotMatch(await readFile(returned.sourcePath, 'utf8'), /- "?\/guide\//);
	const child = await readFile(path.join(path.dirname(returned.sourcePath), 'pages/020-child/content.md'), 'utf8');
	assert.match(child, /- "?\/handbook\/child\//);
	assert.doesNotMatch(child, /- "?\/guide\/child\//);
});

test('rename rejects stale plans, dirty sources, collisions, home, categories and linked paths', async (t) => {
	const f = await fixture(t);
	for (const segment of ['guide', 'search', 'a/b', 'Uppercase', 'bad--segment']) await assert.rejects(planEditorPageAddress({ ...f, segment }));
	await assert.rejects(planEditorPageAddress({ ...f, sourcePath: f.home, segment: 'moved' }), /homepage/);
	await assert.rejects(planEditorPageAddress({ ...f, segment: 'moved', sources: new Map([[f.home, '# Dirty\n']]) }), /Save or undo/);
	const plan = await planEditorPageAddress({ ...f, segment: 'moved' });
	await f.write('root/content.md', '# Home changed\n');
	await assert.rejects(applyEditorPageAddress(plan), /site changed/);
	assert.ok((await stat(path.dirname(f.sourcePath))).isDirectory());
	await symlink(f.home, path.join(path.dirname(f.sourcePath), 'linked.md'));
	await assert.rejects(planEditorPageAddress({ ...f, segment: 'moved' }), /symbolic link/);
});

test('shared move transaction restores original paths and bytes after final validation fails', async (t) => {
	const f = await fixture(t);
	const plan = await planEditorPageAddress({ ...f, segment: 'moved' });
	const originals = await Promise.all([f.home, f.sourcePath, f.child].map((filename) => readFile(filename, 'utf8')));
	plan.fileChanges[0].updatedSource += '\n[Broken](/does-not-exist/)\n';
	await assert.rejects(applyPageMovePlan(plan, { siteRoot: f.siteRoot }), /restored/);
	assert.deepEqual(await Promise.all([f.home, f.sourcePath, f.child].map((filename) => readFile(filename, 'utf8'))), originals);
	await assert.rejects(stat(plan.destinationDirectory), { code: 'ENOENT' });
});

test('a refused editor rename does not roll back sources when no move has started', async (t) => {
	const f = await fixture(t);
	const plan = await planEditorPageAddress({ ...f, segment: 'moved' });
	await assert.rejects(applyEditorPageAddress(plan, { renameDirectory: async () => {
		await writeFile(f.home, '# A new saved edit\n');
		throw new Error('The editor refused the move.');
	} }), /No source file was changed/);
	assert.equal(await readFile(f.home, 'utf8'), '# A new saved edit\n');
	assert.equal(await readFile(f.sourcePath, 'utf8'), plan.sourceFiles.find(({ contentPath }) => contentPath === f.sourcePath).source);
});
