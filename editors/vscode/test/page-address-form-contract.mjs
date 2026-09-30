import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { test } from 'node:test';
import { createRequire } from 'node:module';
import { Script } from 'node:vm';
import * as engine from '../../../scripts/lib/editor-site-tree.mjs';
const require = createRequire(import.meta.url);
const { editPageForm } = require('../page-form-actions.cjs');

async function fixture(t, { isHome = false, service = engine } = {}) {
	const siteRoot = await mkdtemp(path.join(os.tmpdir(), 'norna-slug-form-'));
	t.after(() => rm(siteRoot, { recursive: true, force: true }));
	const write = async (relative, text) => {
		const filename = path.join(siteRoot, relative);
		await mkdir(path.dirname(filename), { recursive: true });
		await writeFile(filename, text); return filename;
	};
	await write('site-config/settings.yaml', 'url: https://example.com/manual/\n');
	await write('root/tree-theme.yaml', 'preset: documentation\n');
	const home = await write('root/content.md', '# Home\n\n[Guide](/guide/)\n');
	const page = await write('root/pages/010-guide/content.md', '---\npage:\n  aliases: [/old-guide/]\n---\n# Guide\n');
	const child = await write('root/pages/010-guide/pages/020-child/content.md', '---\npage:\n  aliases: [/old-child/]\n---\n# Child\n');
	const filename = isHome ? home : page;
	const initial = await readFile(filename, 'utf8');
	let text = initial, version = 1, dirty = false, active = true, receive, panel, onDispose, ready;
	let confirmation, afterRename;
	const replies = [], dialogs = [], opened = [], renames = [];
	const document = { uri: { fsPath: filename }, getText: () => text, get version() { return version; }, get isDirty() { return dirty; }, positionAt: n => n };
	const node = { kind: 'page', isHome, title: isHome ? 'Home' : 'Guide', sourcePath: filename, siteRoot, url: isHome ? '/' : '/guide/' };
	const vscode = {
		ViewColumn: { Active: 1 }, Uri: { file: fsPath => ({ fsPath }) },
		Range: class { constructor(start, end) { Object.assign(this, { start, end }); } },
		WorkspaceEdit: class { renameFile(from, to, options) { this.move = { from, to, options }; } },
		workspace: { applyEdit: async ({ move }) => {
			assert.equal(move.options.overwrite, false);
			renames.push(move); await rename(move.from.fsPath, move.to.fsPath);
			if (renames.length === 1) await afterRename?.();
			return true;
		} },
		window: {
			createWebviewPanel: () => {
				panel = { disposed: false, webview: { html: '', onDidReceiveMessage: fn => { receive = fn; ready(); return { dispose() {} }; }, postMessage: async reply => replies.push(reply) },
					onDidDispose: fn => { onDispose = fn; }, dispose: () => { panel.disposed = true; onDispose?.(); } };
				return panel;
			},
			showWarningMessage: async (title, options) => { dialogs.push({ title, ...options }); return typeof confirmation === 'function' ? confirmation() : confirmation; },
			showTextDocument: async target => { opened.push(target); return { edit: async callback => {
				callback({ replace: (range, value) => { text = text.slice(0, range.start) + value + text.slice(range.end); } });
				version++; dirty = true; return true;
			} }; },
		},
	};
	const info = await engine.getSiteNodeInformation({ kind: 'page', isHome, sourcePath: filename, source: initial });
	const available = new Promise(resolve => { ready = resolve; });
	const promise = editPageForm({ vscode, context: { subscriptions: [] }, service, node, document, info,
		chooseNode: async () => { if (!active) throw new Error('The active site changed.'); return node; },
		documentSources: () => new Map(dirty ? [[filename, text]] : []), updateDocument: async () => {}, refresh: async () => {} });
	await Promise.race([available, promise]);
	assert.ok(receive, 'Properties did not open');
	t.after(() => panel.dispose());
	new Script(panel.webview.html.match(/<script nonce="[^"]+">([\s\S]*?)<\/script>/)[1]);
	const values = { title: info.title, description: info.description, listed: info.listed, listChildren: info.listChildren, aliases: info.aliases, slug: 'handbook', preserveAliases: true };
	return { siteRoot, node, home, child, initial, filename, panel, values, replies, dialogs, opened, renames, promise,
		send: async (values, type = 'preview') => { replies.length = 0; await receive({ type, revision: 1, values }); },
		onRename: callback => { afterRename = callback; },
		confirm: value => { confirmation = value; }, switchSite: () => { active = false; },
		edit: () => { text += '\nUnsaved edit.\n'; version++; dirty = true; },
	};
}

for (const preserveAliases of [true, false]) test(`Properties previews and applies slug changes with preserveAliases=${preserveAliases}`, async t => {
	const f = await fixture(t);
	assert.match(f.panel.webview.html, /id="slug"[^>]*value="guide"/);
	assert.match(f.panel.webview.html, /id="preserve-aliases"[^>]*checked/);
	const values = { ...f.values, preserveAliases };
	await f.send(values);
	assert.equal(f.replies.at(-1).errors, undefined);
	assert.match(f.replies.at(-1).preview, /https:\/\/example.com\/manual\/handbook\//);
	assert.match(f.replies.at(-1).preview, /\/guide\/child\/ → \/handbook\/child\//);
	assert.match(f.replies.at(-1).preview, preserveAliases ? /will be kept as aliases/ : /No new aliases/);
	assert.equal(await readFile(f.filename, 'utf8'), f.initial);
	await f.send(values, 'submit');
	assert.match(f.replies.at(-1).errors.slug, /Use Change address/);
	await f.send(values, 'address'); // cancel final confirmation
	assert.equal(f.panel.disposed, false);
	assert.equal(f.renames.length, 0);
	f.confirm('Change address');
	await f.send(values, 'address'); await f.promise;
	assert.equal(f.panel.disposed, true);
	assert.equal(f.renames.length, 1);
	assert.match(f.dialogs.at(-1).detail, preserveAliases ? /will be kept as aliases/ : /No new aliases/);
	const sourcePath = path.join(f.siteRoot, 'root/pages/010-handbook/content.md');
	assert.equal(f.opened.at(-1).fsPath, sourcePath);
	assert.deepEqual((await engine.getEditorPageAddresses({ siteRoot: f.siteRoot, sourcePath })).aliases.sort(), ['/old-guide/', ...(preserveAliases ? ['/guide/'] : [])].sort());
	const childPath = path.join(path.dirname(sourcePath), 'pages/020-child/content.md');
	assert.deepEqual((await engine.getEditorPageAddresses({ siteRoot: f.siteRoot, sourcePath: childPath })).aliases.sort(), ['/old-child/', ...(preserveAliases ? ['/guide/child/'] : [])].sort());
	assert.match(await readFile(f.home, 'utf8'), /\[Guide\]\(\/handbook\/\)/);
});

test('Properties protects metadata, invalid slugs and unchanged addresses', async t => {
	const f = await fixture(t);
	await f.send({ ...f.values, title: 'Other title' }, 'address');
	assert.match(f.replies.at(-1).errors.form, /Save other Properties changes separately/);
	await f.send({ ...f.values, slug: 'Bad slug' });
	assert.match(f.replies.at(-1).errors.slug, /lowercase/);
	await f.send({ ...f.values, slug: 'guide' }, 'address');
	assert.match(f.replies.at(-1).errors.slug, /different slug/);
	assert.equal(f.dialogs.length, 0);
	assert.equal(f.renames.length, 0);
	assert.equal(await readFile(f.filename, 'utf8'), f.initial);
});

for (const interruption of ['dirty', 'site', 'closed', 'saved']) test(`Properties refuses address writes after ${interruption} change during confirmation`, async t => {
	const f = await fixture(t);
	f.confirm(async () => {
		if (interruption === 'dirty') f.edit();
		if (interruption === 'site') f.switchSite();
		if (interruption === 'closed') f.panel.dispose();
		if (interruption === 'saved') await writeFile(f.home, '# A new saved edit\n');
		return 'Change address';
	});
	await f.send(f.values, 'address');
	assert.equal(f.renames.length, 0);
	assert.equal(await readFile(f.filename, 'utf8'), f.initial);
	if (interruption !== 'closed') assert.ok(f.replies.at(-1).errors.form);
});

for (const options of [{ isHome: true }, { service: { ...engine, sitePageAddressOptionsApiVersion: undefined } }]) test('Properties hides unsupported slug editing', async t => {
	const f = await fixture(t, options);
	assert.doesNotMatch(f.panel.webview.html, /id="change-address"/);
	assert.doesNotMatch(f.panel.webview.html, /id="preserve-aliases"/);
	await f.send(f.values, 'address');
	assert.match(f.replies.at(-1).errors.form, /Update this site/);
	assert.equal(f.renames.length, 0);
});


test('address rollback remains available after the Properties form closes', async t => {
	const f = await fixture(t);
	f.confirm('Change address');
	f.onRename(async () => {
		f.panel.dispose();
		const extra = path.join(f.siteRoot, 'root/pages/030-broken/content.md');
		await mkdir(path.dirname(extra), { recursive: true });
		await writeFile(extra, '# Broken\n\n[Missing](/missing/)\n');
	});
	await f.send(f.values, 'address');
	assert.equal(f.renames.length, 2, 'A failed final validation must be able to restore the original directory.');
	assert.equal(await readFile(f.filename, 'utf8'), f.initial);
	assert.match(await readFile(f.home, 'utf8'), /\[Guide\]\(\/guide\/\)/);
});
