import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { test } from 'node:test';
import { createRequire } from 'node:module';
import * as service from '../../../scripts/lib/editor-site-tree.mjs';

const require = createRequire(import.meta.url);
const { registerSiteAddressActions } = require('../site-address-actions.cjs');
const { registerSiteFileActions } = require('../site-file-actions.cjs');
const setup = async (t) => {
	const root = await mkdtemp(path.join(os.tmpdir(), 'norna-address-ui-'));
	t.after(() => rm(root, { recursive: true, force: true }));
	const siteRoot = path.join(root, 'site');
	const write = async (relative, source) => {
		const filename = path.join(siteRoot, relative);
		await mkdir(path.dirname(filename), { recursive: true });
		await writeFile(filename, source); return filename;
	};
	await write('site-config/settings.yaml', 'url: https://example.com/manual/\n');
	const homePath = await write('root/content.md', '# Home\n\n[Guide](/guide/)\n');
	const sourcePath = await write('root/pages/010-guide/content.md', '# Guide\n');
	const home = { kind: 'page', title: 'Home', siteRoot, sourcePath: homePath, isHome: true };
	const page = { kind: 'page', title: 'Guide', siteRoot, sourcePath, isHome: false };
	const commands = new Map(), documents = new Map();
	const picks = [], inputs = [], warnings = [], menus = [], dialogs = [], opened = [], copied = [], trashed = [];
	let active = true, engine = service;
	const uri = (fsPath) => ({ scheme: 'file', fsPath });
	const open = async ({ fsPath }) => {
		if (!documents.has(fsPath)) documents.set(fsPath, {
			uri: uri(fsPath), source: await readFile(fsPath, 'utf8'), version: 1, isDirty: false,
			getText() { return this.source; }, positionAt(offset) { return offset; },
		});
		return documents.get(fsPath);
	};
	const vscode = {
		Uri: { file: uri, parse: (url) => url },
		Position: class { constructor(line, character) { Object.assign(this, { line, character }); } },
		Range: class { constructor(start, end) { Object.assign(this, { start, end }); } },
		WorkspaceEdit: class { renameFile(from, to, options) { this.move = { from, to, options }; } },
		env: { clipboard: { writeText: async (text) => copied.push(text) }, openExternal: async (url) => opened.push(url) },
		workspace: {
			get textDocuments() { return [...documents.values()]; }, openTextDocument: open,
			fs: { delete: async (target, options) => {
				assert.equal(options.useTrash, true);
				const destination = path.join(root, `trash-${trashed.length}`);
				await rename(target.fsPath, destination); trashed.push(destination);
			} },
			applyEdit: async ({ move }) => {
				assert.equal(move.options.overwrite, false);
				await rename(move.from.fsPath, move.to.fsPath);
				for (const [filename, document] of [...documents]) if (filename.startsWith(move.from.fsPath + path.sep)) {
					documents.delete(filename); document.uri = uri(move.to.fsPath + filename.slice(move.from.fsPath.length)); documents.set(document.uri.fsPath, document);
				}
				return true;
			},
		},
		window: {
			showQuickPick: async (items, options) => {
				menus.push({ items, options });
				const select = picks.shift();
				return typeof select === 'function' ? select(items) : items.find((item) => item.label === select);
			},
			showInputBox: async (options) => { const value = inputs.shift(); if (typeof value === 'function') return value(options); if (value !== undefined) assert.equal(await options.validateInput?.(value), undefined); return value; },
			showWarningMessage: async (title, options, ...actions) => {
				dialogs.push({ title, ...options, actions }); const value = warnings.shift(); return typeof value === 'function' ? value(actions) : value;
			},
			showTextDocument: async (input, options) => {
				const document = input.fsPath ? await open(input) : input;
				opened.push({ path: document.uri.fsPath, options });
				return { edit: async (callback) => {
					const edits = []; callback({ replace: (range, text) => edits.push({ ...range, text }) });
					for (const edit of edits.sort((a, b) => b.start - a.start)) document.source = document.source.slice(0, edit.start) + edit.text + document.source.slice(edit.end);
					document.version++; document.isDirty = true; return true;
				} };
			},
		},
	};
	const support = { vscode, context: {}, chooseNode: async (node) => { if (!active) throw new Error('The active site changed.'); return node; }, ownerOf: (node) => node.owner ?? node,
		serviceFor: async () => engine, documentSources: () => new Map([...documents].filter(([, document]) => document.isDirty).map(([filename, document]) => [filename, document.source])),
		refresh: async () => {}, register: (name, callback) => commands.set(name, callback) };
	registerSiteAddressActions(support); registerSiteFileActions(support);
	return { root, siteRoot, page, home, write, open: (filename) => open(uri(filename)), documents, picks, inputs, warnings, menus, dialogs, opened, copied, trashed,
		run: (name, node = page) => commands.get(`nornaEditor.${name}`)(node), switchSite: () => { active = false; }, useService: (value) => { engine = value; } };
};

test('native address choices copy both address forms and expose help, homepage and category limits', async (t) => {
	const f = await setup(t);
	f.picks.push('Web address'); await f.run('addressesAndLinks');
	f.picks.push('Internal link'); await f.run('addressesAndLinks');
	assert.deepEqual(f.copied, ['https://example.com/manual/guide/', '/guide/']);
	assert.deepEqual(f.menus[0].items.map(({ label }) => label), ['Web address', 'Internal link', 'Change URL segment…', 'Additional addresses…', 'Incoming links…', 'Help: page addresses and links']);
	await f.run('addressesAndLinks', f.home);
	assert.ok(!f.menus.at(-1).items.some(({ action }) => action === 'rename'));
	f.picks.push('Help: page addresses and links'); await f.run('addressesAndLinks');
	assert.equal(f.opened.at(-1), 'https://janga.github.io/norna/reference/site/urls/');
	f.useService({ ...service, siteAddressApiVersion: undefined });
	await assert.rejects(f.run('addressesAndLinks'), /Update this site/);
});

test('alias dialogs edit the buffer, cancel cleanly, validate input and preserve existing unsaved prose', async (t) => {
	const f = await setup(t);
	const document = await f.open(f.page.sourcePath);
	document.source += '\nUnsaved prose.\n'; document.version++; document.isDirty = true;
	f.picks.push('Additional addresses…', '$(add) Add additional address…');
	f.inputs.push(async (options) => { assert.match(await options.validateInput('/'), /alias|path|address/i); return '/old-guide/'; });
	await f.run('addressesAndLinks');
	assert.match(document.source, /aliases:[\s\S]*\/old-guide\//);
	assert.ok(document.source.endsWith('Unsaved prose.\n'));
	assert.equal(await readFile(f.page.sourcePath, 'utf8'), '# Guide\n');
	const snapshot = document.source;
	f.picks.push('Additional addresses…', '/old-guide/', 'Remove additional address…');
	await f.run('addressesAndLinks'); assert.equal(document.source, snapshot);
	f.picks.push('Additional addresses…', '/old-guide/', 'Remove additional address…'); f.warnings.push('Remove address');
	await f.run('addressesAndLinks'); assert.doesNotMatch(document.source, /aliases:/);
	assert.ok(document.source.endsWith('Unsaved prose.\n'));
});

test('incoming links open the exact source line; Show links cancels page deletion', async (t) => {
	const f = await setup(t);
	f.picks.push((items) => items.find((item) => item.reference));
	await f.run('incomingLinks');
	assert.equal(f.opened.at(-1).path, f.home.sourcePath);
	assert.equal(f.opened.at(-1).options.selection.start.line, 2);
	f.warnings.push('Show links'); f.picks.push((items) => items[0]);
	await f.run('removePage');
	assert.equal(f.trashed.length, 0);
	assert.match(f.dialogs.at(-1).detail, /1 internal link/);
	f.warnings.push('Move to Trash'); await f.run('removePage');
	assert.equal(await readFile(path.join(f.trashed[0], 'content.md'), 'utf8'), '# Guide\n');
	assert.match(await readFile(f.home.sourcePath, 'utf8'), /\[Guide\]\(\/guide\/\)/);
});

test('optional-file deletion cancels, protects dirty files, reports inherited effects and uses Trash', async (t) => {
	const f = await setup(t);
	const sourcePath = await f.write('root/page-theme.yaml', 'layout:\n  textWidth: narrow\n');
	const file = { kind: 'file', sourcePath, owner: f.home };
	await f.run('removeFile', file); assert.equal(f.trashed.length, 0);
	const document = await f.open(sourcePath); document.isDirty = true;
	await assert.rejects(f.run('removeFile', file), /unsaved/);
	document.isDirty = false; f.warnings.push('Move to Trash');
	await f.run('removeFile', file);
	assert.match(f.dialogs.at(-1).detail, /Other pages are unchanged/);
	assert.match(await readFile(f.trashed[0], 'utf8'), /textWidth: narrow/);
	await assert.rejects(f.run('removeFile', { ...file, sourcePath: f.home.sourcePath }), /cannot be removed separately/);
});

test('URL confirmation cancels without files, then renames through VS Code and updates authored links', async (t) => {
	const f = await setup(t);
	f.picks.push('Change URL segment…'); f.inputs.push('handbook');
	await f.run('addressesAndLinks');
	assert.equal(await readFile(f.page.sourcePath, 'utf8'), '# Guide\n');
	f.picks.push('Change URL segment…'); f.inputs.push('handbook'); f.warnings.push('Change address');
	await f.run('addressesAndLinks');
	assert.equal(f.opened.at(-1).path, path.join(f.siteRoot, 'root/pages/010-handbook/content.md'));
	assert.match(await readFile(f.home.sourcePath, 'utf8'), /\/handbook\//);
	assert.match(await readFile(f.opened.at(-1).path, 'utf8'), /- \/guide\//);
});

test('late source edits and a changed active site abort address writes', async (t) => {
	const f = await setup(t);
	const document = await f.open(f.page.sourcePath);
	f.picks.push('Additional addresses…', '$(add) Add additional address…');
	f.inputs.push(() => { document.source += '\nLate edit.\n'; document.version++; document.isDirty = true; return '/old/'; });
	await assert.rejects(f.run('addressesAndLinks'), /page changed/);
	assert.doesNotMatch(document.source, /aliases:/);
	document.isDirty = false;
	f.picks.push('Change URL segment…'); f.inputs.push('moved');
	f.warnings.push(() => { f.switchSite(); return 'Change address'; });
	await assert.rejects(f.run('addressesAndLinks'), /active site/);
	assert.equal(await readFile(f.page.sourcePath, 'utf8'), '# Guide\n');
});
