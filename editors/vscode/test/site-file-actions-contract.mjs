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
	const inputs = [], dialogs = [], choices = [], forms = [], insertForms = [], confirmations = [], messages = [], trashed = [], formHtml = [];
	let failReplacement = false;
	let failSource;
	let active = true;
	let activeService = service;
	const uri = (fsPath) => ({ scheme: 'file', fsPath });
	const storage = path.join(root, 'storage');
	const vscode = {
		Uri: { file: uri }, Range: class {}, ViewColumn: { Active: 1 },
		workspace: {
			textDocuments: [document], openTextDocument: async () => document,
			fs: {
				createDirectory: (target) => mkdir(target.fsPath, { recursive: true }),
				copy: async (from, to, options) => {
					assert.equal(options.overwrite, false);
					if (from.fsPath === failSource) throw new Error('Injected copy failure');
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
				assert.equal(options.canSelectMany, options.title.startsWith('Import images'));
				return dialogs.shift();
			},
			createWebviewPanel: (viewType) => {
				let disposed;
				let receive;
				const next = () => {
					let selected = (viewType === 'nornaImageInsert' ? insertForms : forms).shift();
					if (typeof selected === 'function') selected = selected();
					void receive(selected === null ? { type: 'cancel' } : viewType === 'nornaImageInsert'
						? { type: 'submit', values: selected } : { type: 'submit', revision: 0, rows: selected });
				};
				const panel = { webview: {
					set html(value) { formHtml.push(value); },
					cspSource: 'vscode-resource:', asWebviewUri: (value) => ({ toString: () => `vscode-resource:${value.fsPath}` }),
					onDidReceiveMessage: (handler) => {
						receive = handler;
						queueMicrotask(next);
						return { dispose() {} };
					},
					postMessage: async (message) => { messages.push(message); if ((viewType === 'nornaImageInsert' ? insertForms : forms).length) setTimeout(next, 0); else panel.dispose(); },
				},
					onDidDispose: (callback) => { disposed = callback; }, dispose: () => { disposed?.(); },
				};
				return panel;
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
	registerSiteFileActions({ vscode, context: { globalStorageUri: uri(storage), subscriptions: [] }, chooseNode: async (node) => { if (!active) throw new Error('Choose a page in the active site.'); return node; },
		ownerOf: (node) => node.owner ?? node, serviceFor: async () => activeService,
		documentSources: () => document.isDirty ? new Map([[pagePath, document.source]]) : new Map(), refresh: async () => {},
		register: (name, callback) => commands.set(name, callback) });
	return { root, page, image, source, document, imagePath, inputs, dialogs, choices, forms, insertForms, confirmations, messages, trashed, formHtml,
		uri, run: (name, node = page) => commands.get(`nornaEditor.${name}`)(node), failReplacement: () => { failReplacement = true; },
		failCopy: (sourcePath) => { failSource = sourcePath; },
		switchSite: () => { active = false; }, useService: (next) => { activeService = next; } };
};

test('site-owned optional files use confirmation and Trash independently of homepage content', async (t) => {
	const f = await setup(t);
	const siteRoot = f.page.siteRoot;
	const site = { kind: 'site', siteRoot, sourcePath: siteRoot, directory: siteRoot, title: 'Site' };
	const sourcePath = path.join(siteRoot, 'site-config/shared-content.yaml');
	const file = { kind: 'file', sourcePath, owner: site };
	await writeFile(sourcePath, 'banners: []\n');
	await rm(path.join(siteRoot, 'root/content.md'));
	await f.run('removeFile', file);
	assert.equal(f.trashed.length, 0, 'Cancelling preserves the shared file.');
	f.confirmations.push(true);
	await f.run('removeFile', file);
	assert.equal(f.trashed[0].source, sourcePath);
	assert.match(f.messages.at(-1).detail, /whole site/);
	await assert.rejects(f.run('importImage', site), /Select a page/);
	await assert.rejects(f.run('removePage', site), /Select a page/);
});

test('cancelled import creates nothing; importing and appending preserves original and dirty prose', async (t) => {
	const f = await setup(t);
	await f.run('importImage');
	await assert.rejects(stat(path.dirname(f.imagePath)), { code: 'ENOENT' });
	f.dialogs.push([f.uri(f.source)]);
	f.forms.push(null);
	await f.run('importImage');
	await assert.rejects(stat(path.dirname(f.imagePath)), { code: 'ENOENT' });
	f.document.source += '\nUnsaved prose.\n'; f.document.isDirty = true;
	f.dialogs.push([f.uri(f.source)]); f.forms.push([{ id: 0, action: 'insert', filename: 'example.svg', replace: false, alt: 'An image', caption: 'A caption', decorative: false }]);
	await f.run('importImage');
	assert.equal(await readFile(f.imagePath, 'utf8'), '<svg/>');
	assert.equal(await readFile(f.source, 'utf8'), '<svg/>');
	assert.equal(await readFile(f.page.sourcePath, 'utf8'), '# Page\n', 'Insertion stays in the editor for normal save/undo.');
	assert.equal(f.document.source, '# Page\n\nUnsaved prose.\n\n```image-stack\nitems:\n  - image: example.svg\n    alt: "An image"\n    caption: "A caption"\n```\n');
});

test('multi-image import keeps chosen insertion order and permits an import-only row', async (t) => {
	const f = await setup(t);
	const second = path.join(f.root, 'second.png');
	const third = path.join(f.root, 'third.jpg');
	await writeFile(second, 'second'); await writeFile(third, 'third');
	f.dialogs.push([f.uri(f.source), f.uri(second), f.uri(third)]);
	f.forms.push([
		{ id: 1, action: 'insert', filename: 'second.png', replace: false, alt: '', caption: '', decorative: false },
		{ id: 0, action: 'insert', filename: 'example.svg', replace: false, alt: '', caption: 'First caption', decorative: true },
		{ id: 2, action: 'import', filename: 'third.jpg', replace: false, alt: '', caption: '', decorative: false },
	]);
	await f.run('importImage');
	assert.equal(await readFile(path.join(path.dirname(f.imagePath), 'second.png'), 'utf8'), 'second');
	assert.equal(await readFile(path.join(path.dirname(f.imagePath), 'third.jpg'), 'utf8'), 'third');
	assert.match(f.document.source, /image: second\.png\n  - image: example\.svg\n    alt: ""\n    caption: "First caption"/);
	assert.doesNotMatch(f.document.source, /third\.jpg/);
	assert.equal(await readFile(f.page.sourcePath, 'utf8'), '# Page\n');
});

test('existing image inserts with alt and caption from one form, preserving an unsaved page edit', async (t) => {
	const f = await setup(t);
	await mkdir(path.dirname(f.imagePath)); await writeFile(f.imagePath, 'existing image');
	f.document.source += '\nUnsaved prose.\n'; f.document.isDirty = true;
	f.insertForms.push({ alt: 'A diagram', caption: 'Figure 1', decorative: false });
	await f.run('insertImage', f.image);
	assert.match(f.document.source, /Unsaved prose\.\n\n```image-stack\nitems:\n  - image: example\.svg\n    alt: "A diagram"\n    caption: "Figure 1"\n```\n$/);
	assert.equal(await readFile(f.page.sourcePath, 'utf8'), '# Page\n');
});

test('existing image form supports cancellation and optional alternative text', async (t) => {
	const f = await setup(t);
	await mkdir(path.dirname(f.imagePath)); await writeFile(f.imagePath, 'existing image');
	f.insertForms.push(null);
	await f.run('insertImage', f.image);
	assert.equal(f.document.source, '# Page\n');
	f.insertForms.push({ alt: '', caption: '', decorative: false });
	await f.run('insertImage', f.image);
	assert.match(f.document.source, /  - image: example\.svg\n```\n$/);
});

test('an occupied initial name defaults to replacement, with confirmation and a return to the form', async (t) => {
	const f = await setup(t);
	const sourceTarget = path.join(path.dirname(f.imagePath), 'source.svg');
	await mkdir(path.dirname(f.imagePath)); await writeFile(sourceTarget, 'old');
	f.dialogs.push([f.uri(f.source)]);
	f.forms.push([{ id: 0, action: 'import', filename: 'source.svg', alt: '', caption: '', decorative: false }]);
	await f.run('importImage');
	assert.equal(await readFile(sourceTarget, 'utf8'), 'old');
	assert.match(f.formHtml[0], /value="source\.svg"/);
	assert.doesNotMatch(f.formHtml[0], /class="replace"/);
	assert.equal(f.messages.at(-1).issues[0].collision, true);
	assert.match(f.messages.at(-1).summary, /Replacement cancelled/);
	f.dialogs.push([f.uri(f.source)]); f.confirmations.push(true);
	f.forms.push([{ id: 0, action: 'import', filename: 'source.svg', alt: '', caption: '', decorative: false }]);
	await f.run('importImage');
	assert.equal(await readFile(sourceTarget, 'utf8'), '<svg/>');
	assert.equal(await readFile(f.trashed[0].destination, 'utf8'), 'old');
});

test('a free edited filename imports a new image, while another occupied name replaces its exact target', async (t) => {
	const f = await setup(t);
	await mkdir(path.dirname(f.imagePath)); await writeFile(f.imagePath, 'first old');
	const otherTarget = path.join(path.dirname(f.imagePath), 'other.svg');
	await writeFile(otherTarget, 'second old');
	f.dialogs.push([f.uri(f.source)]);
	f.forms.push([{ id: 0, action: 'import', filename: 'new-name.svg', alt: '', caption: '', decorative: false }]);
	await f.run('importImage');
	assert.equal(await readFile(f.imagePath, 'utf8'), 'first old');
	assert.equal(await readFile(path.join(path.dirname(f.imagePath), 'new-name.svg'), 'utf8'), '<svg/>');
	assert.equal(f.trashed.length, 0);
	f.dialogs.push([f.uri(f.source)]); f.confirmations.push(true);
	f.forms.push([{ id: 0, action: 'import', filename: 'other.svg', alt: '', caption: '', decorative: false }]);
	await f.run('importImage');
	assert.equal(await readFile(f.imagePath, 'utf8'), 'first old');
	assert.equal(await readFile(otherTarget, 'utf8'), '<svg/>');
	assert.match(f.messages.find((message) => message.title?.startsWith('Replace')).detail, /other\.svg/);
	assert.equal(await readFile(f.trashed[0].destination, 'utf8'), 'second old');
});

test('duplicate target names within one import are rejected on both rows', async (t) => {
	const f = await setup(t);
	const second = path.join(f.root, 'second.svg');
	await writeFile(second, '<svg id="second"/>');
	f.dialogs.push([f.uri(f.source), f.uri(second)]);
	f.forms.push([
		{ id: 0, action: 'import', filename: 'shared.svg', alt: '', caption: '', decorative: false },
		{ id: 1, action: 'import', filename: 'shared.svg', alt: '', caption: '', decorative: false },
	]);
	await f.run('importImage');
	assert.match(f.messages.at(-1).issues[0].error, /Another selected image/);
	assert.match(f.messages.at(-1).issues[1].error, /Another selected image/);
	await assert.rejects(stat(path.join(path.dirname(f.imagePath), 'shared.svg')), { code: 'ENOENT' });
});

test('two replacements share one confirmation and keep both originals in Trash', async (t) => {
	const f = await setup(t);
	const secondSource = path.join(f.root, 'second.png');
	const secondTarget = path.join(path.dirname(f.imagePath), 'second.png');
	await mkdir(path.dirname(f.imagePath));
	await writeFile(f.imagePath, 'old SVG');
	await writeFile(secondTarget, 'old PNG');
	await writeFile(secondSource, 'new PNG');
	f.dialogs.push([f.uri(f.source), f.uri(secondSource)]); f.confirmations.push(true);
	f.forms.push([
		{ id: 0, action: 'import', filename: 'example.svg', replace: true, alt: '', caption: '', decorative: false },
		{ id: 1, action: 'import', filename: 'second.png', replace: true, alt: '', caption: '', decorative: false },
	]);
	await f.run('importImage');
	assert.equal(f.messages.filter((message) => message.title?.startsWith('Replace')).length, 1);
	assert.equal(await readFile(f.imagePath, 'utf8'), '<svg/>');
	assert.equal(await readFile(secondTarget, 'utf8'), 'new PNG');
	assert.deepEqual(await Promise.all(f.trashed.map((file) => readFile(file.destination, 'utf8'))), ['old SVG', 'old PNG']);
});

test('partial batch failure retains completed images and retries only pending rows', async (t) => {
	const f = await setup(t);
	const second = path.join(f.root, 'second.png');
	await writeFile(second, 'second');
	f.failCopy(second);
	const values = [
		{ id: 0, action: 'import', filename: 'example.svg', replace: false, alt: '', caption: '', decorative: false },
		{ id: 1, action: 'import', filename: 'second.png', replace: false, alt: '', caption: '', decorative: false },
	];
	f.dialogs.push([f.uri(f.source), f.uri(second)]);
	f.forms.push(values, () => { f.failCopy(undefined); return values; });
	await f.run('importImage');
	assert.match(f.messages[0].summary, /Imported: source\.svg.*Pending: second\.png/s);
	assert.deepEqual(f.messages[0].done, [0]);
	assert.equal(await readFile(f.imagePath, 'utf8'), '<svg/>');
	assert.equal(await readFile(path.join(path.dirname(f.imagePath), 'second.png'), 'utf8'), 'second');
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
	assert.match(f.messages[0].detail, /References in page content will stay unchanged/);
	assert.match(f.document.source, /image: example.svg/);
	assert.equal(await readFile(f.trashed[0].destination, 'utf8'), 'old image');
});

test('unused image removal uses a concise, scoped explanation of references and Trash', async (t) => {
	const f = await setup(t);
	await mkdir(path.dirname(f.imagePath)); await writeFile(f.imagePath, 'unused image');
	await f.run('removeImage', f.image);
	assert.equal(f.messages[0].detail, 'No references found in Norna content blocks.\n\nRestore it in Finder’s Trash if needed; VS Code Undo will not restore the file.');
	assert.match(f.messages[0].title, /from “Page” to Trash/);
	assert.equal(await readFile(f.imagePath, 'utf8'), 'unused image');
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
