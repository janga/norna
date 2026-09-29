import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, readdir, rename, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { applyEditorPagePlacement, planEditorPagePlacement } from './lib/editor-page-placement.mjs';
import { readEditorLinkState } from './lib/editor-site-links.mjs';
import { planSiteNodeCreation } from './lib/site-node-create.mjs';

const fixture = async (t, orders = [10, 20, 30]) => {
	const siteRoot = await mkdtemp(path.join(os.tmpdir(), 'norna-placement-'));
	t.after(() => rm(siteRoot, { recursive: true, force: true }));
	const write = async (filename, source) => {
		const file = path.join(siteRoot, filename);
		await mkdir(path.dirname(file), { recursive: true });
		await writeFile(file, source);
		return file;
	};
	await write('site-config/settings.yaml', 'url: https://example.com/manual/\n');
	await write('root/tree-theme.yaml', 'preset: editorial\n');
	const home = await write('root/content.md', '# Home\n\n[First](/first/)\n');
	const names = ['first', 'second', 'third'];
	const files = {};
	for (let index = 0; index < 3; index += 1) {
		const name = names[index];
		files[name] = await write(`root/pages/${String(orders[index]).padStart(3, '0')}-${name}/content.md`, `# ${name}\n`);
	}
	return { siteRoot, home, files, write };
};

test('reorder changes the page order but neither URLs nor aliases', async (t) => {
	const { siteRoot, files } = await fixture(t);
	const plan = await planEditorPagePlacement({ siteRoot, sourcePath: files.third, targetPath: files.first, placement: 'before' });
	assert.equal(plan.sameParent, true);
	assert.equal(plan.destinationUrl, '/third/');
	const result = await applyEditorPagePlacement(plan);
	assert.deepEqual((await readdir(path.join(siteRoot, 'root/pages'))).sort(), ['005-third', '010-first', '020-second']);
	assert.equal(await readFile(result.sourcePath, 'utf8'), '# third\n');
	assert.equal(result.url, '/third/');
});

test('unsaved files blocking placement are named', async (t) => {
	const { siteRoot, home, files } = await fixture(t);
	await assert.rejects(planEditorPagePlacement({ siteRoot, sourcePath: files.first, targetPath: files.second,
		placement: 'first', sources: new Map([[home, '# Unsaved Home\n']]) }),
		/Save or undo these unsaved files before moving:\n- root\/content\.md/);
});

test('an exhausted order gap reindexes siblings and restores them on rename failure', async (t) => {
	const { siteRoot, files } = await fixture(t, [1, 2, 3]);
	const plan = await planEditorPagePlacement({ siteRoot, sourcePath: files.third, targetPath: files.second, placement: 'before' });
	assert.ok(plan.orderChanges.length > 1);
	let count = 0;
	await assert.rejects(applyEditorPagePlacement(plan, { renameDirectory: async (from, to) => {
		count += 1;
		if (count === 2) throw new Error('test rename failure');
		await rename(from, to);
	} }), /original page order was restored/);
	assert.deepEqual((await readdir(path.join(siteRoot, 'root/pages'))).sort(), ['001-first', '002-second', '003-third']);
	const retry = await planEditorPagePlacement({ siteRoot, sourcePath: files.third, targetPath: files.second, placement: 'before' });
	await applyEditorPagePlacement(retry);
	assert.deepEqual((await readdir(path.join(siteRoot, 'root/pages'))).sort(), ['333-first', '666-third', '999-second']);
});

test('moving under another page updates links and keeps old addresses for descendants', async (t) => {
	const { siteRoot, files, home, write } = await fixture(t);
	await write('root/pages/010-first/pages/010-child/content.md', '# Child\n');
	const plan = await planEditorPagePlacement({ siteRoot, sourcePath: files.first, targetPath: files.second, placement: 'first' });
	assert.equal(plan.sameParent, false);
	assert.equal(plan.movePreview.mappings.length, 2);
	const result = await applyEditorPagePlacement(plan);
	assert.equal(result.url, '/second/first/');
	assert.match(await readFile(home, 'utf8'), /\[First\]\(\/second\/first\/\)/);
	assert.match(await readFile(result.sourcePath, 'utf8'), /- \/first\//);
	assert.match(await readFile(path.join(path.dirname(result.sourcePath), 'pages/010-child/content.md'), 'utf8'), /- \/first\/child\//);
	await assert.rejects(planSiteNodeCreation({ siteRoot, kind: 'page', title: 'Replacement', slug: 'first', metadata: {} }), /previous address for “first”.*Choose another URL segment, or remove this previous address/s);
	await assert.rejects(planSiteNodeCreation({ siteRoot, kind: 'page', title: 'Replacement', slug: 'first' }), /previous address for “first”/);
	const replacement = await write('root/pages/010-first/content.md', '# Replacement\n');
	const collision = (await readEditorLinkState({ siteRoot })).graph.diagnostics.find((entry) => entry.code === 'page-alias-collision');
	assert.match(collision.message, /Page alias "\/first\/"/);
	assert.match(collision.message, /010-first\/content.md/);
	assert.match(collision.message, /500-first\/content.md/);
	assert.match(collision.fix, /Rename the page.*or remove \/first\/ from the previous addresses/);
	assert.ok(replacement);
});

test('moving a branch back reclaims its own previous addresses', async (t) => {
	const { siteRoot, home, files, write } = await fixture(t);
	await write('root/pages/010-first/content.md', '---\npage:\n  description: Keep this setting\n  aliases:\n    - /older-first/\n---\n# first\n');
	await write('root/pages/010-first/pages/010-child/content.md', '# Child\n');
	const moved = await applyEditorPagePlacement(await planEditorPagePlacement({ siteRoot,
		sourcePath: files.first, targetPath: files.second, placement: 'first' }));
	const returned = await applyEditorPagePlacement(await planEditorPagePlacement({ siteRoot,
		sourcePath: moved.sourcePath, targetPath: files.second, placement: 'before' }));
	assert.equal(returned.url, '/first/');
	const parentSource = await readFile(returned.sourcePath, 'utf8');
	const childSource = await readFile(path.join(path.dirname(returned.sourcePath), 'pages/010-child/content.md'), 'utf8');
	assert.match(parentSource, /- "?\/second\/first\//);
	assert.doesNotMatch(parentSource, /- "?\/first\//);
	assert.match(parentSource, /description: Keep this setting/);
	assert.match(parentSource, /- "\/older-first\/"/);
	assert.match(childSource, /- "?\/second\/first\/child\//);
	assert.doesNotMatch(childSource, /- "?\/first\/child\//);
	assert.match(await readFile(home, 'utf8'), /\[First\]\(\/first\/\)/);
	assert.equal((await readEditorLinkState({ siteRoot })).graph.diagnostics.filter(({ severity }) => severity === 'error').length, 0);
});

test('cross-parent insertion with no order gap restores target siblings after a failed move', async (t) => {
	const { siteRoot, files, write } = await fixture(t);
	await write('root/pages/020-second/pages/001-alpha/content.md', '# Alpha\n');
	const beta = await write('root/pages/020-second/pages/002-beta/content.md', '# Beta\n');
	const plan = await planEditorPagePlacement({ siteRoot, sourcePath: files.first, targetPath: beta, placement: 'before' });
	assert.ok(plan.orderChanges.length > 0);
	await assert.rejects(applyEditorPagePlacement(plan, { renameDirectory: async (from, to) => {
		if (from === path.dirname(files.first)) throw new Error('test destination failure');
		await rename(from, to);
	} }), /test destination failure/);
	assert.deepEqual((await readdir(path.join(siteRoot, 'root/pages/020-second/pages'))).sort(), ['001-alpha', '002-beta']);
	assert.equal(await readFile(files.first, 'utf8'), '# first\n');
	const result = await applyEditorPagePlacement(await planEditorPagePlacement({ siteRoot, sourcePath: files.first, targetPath: beta, placement: 'before' }));
	assert.equal(result.url, '/second/first/');
	assert.match(await readFile(result.sourcePath, 'utf8'), /- \/first\//);
});

test('a stale preview and a destination alias block a move before writing', async (t) => {
	const { siteRoot, files, write } = await fixture(t);
	const plan = await planEditorPagePlacement({ siteRoot, sourcePath: files.first, targetPath: files.second, placement: 'first' });
	await write('root/pages/030-third/content.md', '# third\n\nChanged\n');
	await assert.rejects(applyEditorPagePlacement(plan), /site changed/);
	await write('root/pages/020-second/content.md', '---\npage:\n  aliases:\n    - /second/first/\n---\n# second\n');
	await assert.rejects(planEditorPagePlacement({ siteRoot, sourcePath: files.first, targetPath: files.second, placement: 'first' }), /Cannot move here.*previous address for “second”/);
});

test('existing inline aliases accept another site-relative address during a move', async (t) => {
	const { siteRoot, files, write } = await fixture(t);
	await write('root/pages/010-first/content.md', '---\npage:\n  description: Test\n  aliases: [/older-first/]\n---\n# first\n');
	const plan = await planEditorPagePlacement({ siteRoot, sourcePath: files.first, targetPath: files.second, placement: 'first' });
	assert.deepEqual(plan.movePreview.aliasChanges.map(({ alias }) => alias), ['/first/']);
	const result = await applyEditorPagePlacement(plan);
	const source = await readFile(result.sourcePath, 'utf8');
	assert.match(source, /description: Test/);
	assert.match(source, /- "\/older-first\/"/);
	assert.match(source, /- "\/first\/"/);
	assert.match(source, /# first/);
});

test('flow-style page settings can gain aliases without losing other settings', async (t) => {
	const { siteRoot, files, write } = await fixture(t);
	await write('root/pages/010-first/content.md', '---\npage: {description: Test, aliases: [/older-first/]}\n---\n# first\n');
	const plan = await planEditorPagePlacement({ siteRoot, sourcePath: files.first, targetPath: files.second, placement: 'first' });
	const result = await applyEditorPagePlacement(plan);
	assert.match(await readFile(result.sourcePath, 'utf8'), /page: \{description: Test, aliases: \["\/older-first\/","\/first\/"\]\}/);
});

test('source-aware alias editing refuses YAML anchors before writing', async (t) => {
	const { siteRoot, files, write } = await fixture(t);
	const source = '---\npage:\n  aliases: &previous [/older-first/]\n---\n# first\n';
	await write('root/pages/010-first/content.md', source);
	await assert.rejects(planEditorPagePlacement({ siteRoot, sourcePath: files.first, targetPath: files.second, placement: 'first' }),
		(error) => /Cannot preserve \/first\/.*anchors/.test(error.message) && error.sourcePath === files.first);
	assert.equal(await readFile(files.first, 'utf8'), source);
});
