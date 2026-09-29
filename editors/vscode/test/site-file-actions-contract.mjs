import assert from 'node:assert/strict';
import { copyFile, mkdir, mkdtemp, readFile, rename, rm, stat, writeFile } from 'node:fs/promises';
import { constants } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { createRequire } from 'node:module';
import * as service from '../../../scripts/lib/editor-site-tree.mjs';

const { registerSiteFileActions } = createRequire(import.meta.url)('../site-file-actions.cjs');
const setup = async (t) => {
	const root = await mkdtemp(path.join(os.tmpdir(), 'norna-file-actions-'));
	t.after(() => rm(root, { recursive: true, force: true }));
	const siteRoot = path.join(root, 'site');
	const pagePath = path.join(siteRoot, 'root/pages/010-page/content.md');
	await mkdir(path.dirname(pagePath), { recursive: true });
	await mkdir(path.join(siteRoot, 'site-config'));
	await writeFile(path.join(siteRoot, 'site-config/settings.yaml'), 'url: https://example.com/\n');
	await writeFile(path.join(siteRoot, 'root/content.md'), '# Home\n');
	await writeFile(pagePath, '# Page\n');
	const source = path.join(root, 'source.svg');
	await writeFile(source, '<svg/>');
	const page = { kind: 'page', title: 'Page', siteRoot, sourcePath: pagePath };
	const imagePath = path.join(path.dirname(pagePath), 'images/example.svg');
	const image = { kind: 'file', title: 'example.svg', sourcePath: imagePath, owner: page };
	const document = { uri: { scheme: 'file', fsPath: pagePath }, version: 1, isDirty: false, source: '# Page\n',
		getText() { return this.source; }, positionAt(offset) { return offset; } };
	const commands = new Map();
	const inputs = [], dialogs = [], choices = [], confirmations = [], messages = [], trashed = [];
	let failReplacement = false;
	let active = true;
	let activeService = service;
	const uri = (fsPath) => ({ scheme: 'file', fsPath });
	const storage = path.join(root, 'storage');
	const vscode = {
		Uri: { file: uri }, Range: class {},
		workspace: {
			textDocuments: [document], openTextDocument: async () => document,
			fs: {
				createDirectory: (target) => mkdir(target.fsPath, { recursive: true }),
				copy: async (from, to, options) => {
					assert.equal(options.overwrite, false);
					if (failReplacement && from.fsPath.startsWith(storage)) throw new Error('Injected destination failure');
					await copyFile(from.fsPath, to.fsPath, constants.COPYFILE_EXCL);
				},
				delete: async (target, options) => {
					if (target.fsPath.startsWith(storage)) return rm(target.fsPath);
					assert.equal(options.useTrash, true, 'User files must never use permanent deletion.');
					const destination = path.join(root, `trash-${trashed.length}`);
					await rename(target.fsPath, destination);
					trashed.push({ source: target.fsPath, destination });
				},
			},
		},
		window: {
			showOpenDialog: async (options) => {
				assert.equal(options.canSelectFiles, true);
				assert.equal(options.canSelectFolders, false);
				assert.equal(options.canSelectMany, false);
				return dialogs.shift();
			},
			showInputBox: async (options) => { const value = inputs.shift(); if (value !== undefined) assert.equal(await options.validateInput?.(value), undefined); return value; },
			showQuickPick: async () => choices.shift(),
			showWarningMessage: async (title, options, action) => { messages.push({ title, ...options }); const next = confirmations.shift(); return typeof next === 'function' ? next(action) : next ? action : undefined; },
			showTextDocument: async () => ({ revealRange() {}, edit: async (callback) => {
				callback({ insert: (offset, text) => { document.source = document.source.slice(0, offset) + text + document.source.slice(offset); document.version++; document.isDirty = true; } });
				return true;
			} }),
		},
	};
	registerSiteFileActions({ vscode, context: { globalStorageUri: uri(storage) }, chooseNode: async (node) => { if (!active) throw new Error('Choose a page in the active site.'); return node; },
		ownerOf: (node) => node.owner ?? node, serviceFor: async () => activeService,
		documentSources: () => document.isDirty ? new Map([[pagePath, document.source]]) : new Map(), refresh: async () => {},
		register: (name, callback) => commands.set(name, callback) });
	return { root, page, image, source, document, imagePath, inputs, dialogs, choices, confirmations, messages, trashed,
		uri, run: (name, node = page) => commands.get(`nornaEditor.${name}`)(node), failReplacement: () => { failReplacement = true; },
		switchSite: () => { active = false; }, useService: (next) => { activeService = next; } };
};

test('cancelled import creates nothing; importing and appending preserves original and dirty prose', async (t) => {
	const f = await setup(t);
	await f.run('importImage');
	await assert.rejects(stat(path.dirname(f.imagePath)), { code: 'ENOENT' });
	f.dialogs.push([f.uri(f.source)]);
	await f.run('importImage');
	await assert.rejects(stat(path.dirname(f.imagePath)), { code: 'ENOENT' });
	f.document.source += '\nUnsaved prose.\n'; f.document.isDirty = true;
	f.dialogs.push([f.uri(f.source)]); f.inputs.push('example.svg', 'An image', 'A caption'); f.choices.push({ insert: true });
	await f.run('importImage');
	assert.equal(await readFile(f.imagePath, 'utf8'), '<svg/>');
	assert.equal(await readFile(f.source, 'utf8'), '<svg/>');
	assert.equal(await readFile(f.page.sourcePath, 'utf8'), '# Page\n', 'Insertion stays in the editor for normal save/undo.');
	assert.equal(f.document.source, '# Page\n\nUnsaved prose.\n\n```image-stack\nitems:\n  - image: example.svg\n    alt: "An image"\n    caption: "A caption"\n```\n');
});

test('page removal cancels, refuses dirty/stale files, then trashes only the reviewed branch', async (t) => {
	const f = await setup(t);
	await f.run('removePage');
	assert.equal(f.trashed.length, 0);
	f.document.isDirty = true;
	await assert.rejects(f.run('removePage'), /unsaved/);
	f.document.isDirty = false;
	f.confirmations.push(async (action) => { await writeFile(f.page.sourcePath, '# Changed\n'); return action; });
	await assert.rejects(f.run('removePage'), /changed/);
	assert.equal(f.trashed.length, 0);
	f.confirmations.push(true);
	await f.run('removePage');
	assert.equal(f.trashed[0].source, path.dirname(f.page.sourcePath));
	assert.equal(await readFile(path.join(f.trashed[0].destination, 'content.md'), 'utf8'), '# Changed\n');
	assert.equal(await readFile(path.join(f.page.siteRoot, 'root/content.md'), 'utf8'), '# Home\n');
});

test('replacement trashes old bytes and preserves both the selected source and references', async (t) => {
	const f = await setup(t);
	await mkdir(path.dirname(f.imagePath)); await writeFile(f.imagePath, 'old image');
	f.dialogs.push([f.uri(f.source)]); f.confirmations.push(true);
	await f.run('replaceImage', f.image);
	assert.equal(await readFile(f.imagePath, 'utf8'), '<svg/>');
	assert.equal(await readFile(f.trashed[0].destination, 'utf8'), 'old image');
	assert.equal(await readFile(f.source, 'utf8'), '<svg/>');
	assert.equal(await readFile(f.page.sourcePath, 'utf8'), '# Page\n');
});

test('failed replacement preserves a recoverable original and never falls back to permanent deletion', async (t) => {
	const f = await setup(t);
	await mkdir(path.dirname(f.imagePath)); await writeFile(f.imagePath, 'old image');
	f.failReplacement(); f.dialogs.push([f.uri(f.source)]); f.confirmations.push(true);
	await assert.rejects(f.run('replaceImage', f.image), /old image is in Trash/);
	assert.equal(await readFile(f.trashed[0].destination, 'utf8'), 'old image');
	assert.equal(await readFile(f.source, 'utf8'), '<svg/>');
});

test('image removal describes unsaved references and leaves content edits intact', async (t) => {
	const f = await setup(t);
	await mkdir(path.dirname(f.imagePath)); await writeFile(f.imagePath, 'old image');
	f.document.source += '\n```image-stack\nitems:\n  - image: example.svg\n```\n'; f.document.isDirty = true;
	f.confirmations.push(true);
	await f.run('removeImage', f.image);
	assert.match(f.messages[0].detail, /content\.md:5/);
	assert.match(f.messages[0].detail, /Content is not rewritten/);
	assert.match(f.document.source, /image: example.svg/);
	assert.equal(await readFile(f.trashed[0].destination, 'utf8'), 'old image');
});

test('late unsaved edits and switching sites during confirmation abort removal', async (t) => {
	const f = await setup(t);
	let checks = 0;
	f.useService({ ...service, planEditorRemoval: async (options) => {
		const plan = await service.planEditorRemoval(options);
		if (++checks === 2) { f.document.isDirty = true; f.document.source += '\nA late edit.\n'; }
		return plan;
	} });
	f.confirmations.push(true);
	await assert.rejects(f.run('removePage'), /Unsaved page content changed/);
	assert.equal(f.trashed.length, 0);
	f.useService(service); f.document.isDirty = false;
	f.confirmations.push((action) => { f.switchSite(); return action; });
	await assert.rejects(f.run('removePage'), /active site/);
	assert.equal(f.trashed.length, 0);
});
