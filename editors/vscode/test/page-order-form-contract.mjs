import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdtemp, mkdir, writeFile, readFile, rm, access } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import * as service from '../../../scripts/lib/editor-site-tree.mjs';
const require = createRequire(import.meta.url);
const { createPageForm } = require('../page-form-actions.cjs');
const { pageMoveConfirmationHtml } = require('../page-move-confirmation.cjs');

const siteRoot = await mkdtemp(path.join(os.tmpdir(), 'norna-order-form-'));
const write = async (relative, text) => {
	const filename = path.join(siteRoot, relative);
	await mkdir(path.dirname(filename), { recursive: true });
	await writeFile(filename, text);
};
let receive, html, closed, replies, opened = 0;
const notifications = [];
const vscode = {
	ViewColumn: { Active: 1 }, Uri: { file: fsPath => ({ fsPath }) }, workspace: { textDocuments: [] },
	window: {
		createWebviewPanel: () => {
			closed = false; replies = []; let onDispose;
			return { webview: { set html(value) { html = value; }, onDidReceiveMessage(fn) { receive = fn; return { dispose() {} }; },
				postMessage: async reply => replies.push(reply) }, onDidDispose(fn) { onDispose = fn; },
				dispose() { closed = true; onDispose(); } };
		},
		showInformationMessage: async message => notifications.push(message),
		showTextDocument: async () => { opened++; },
	},
};
const parent = { isHome: true, url: '/', kind: 'page' };
const selected = { kind: 'page', title: 'Alpha', url: '/alpha/', siteRoot, parent,
	sourcePath: path.join(siteRoot, 'root/pages/alpha/content.md') };
const open = () => createPageForm({ vscode, context: { subscriptions: [] }, service, kind: 'page', selected,
	target: selected, insideSelected: true, ownerOf: node => node, chooseNode: async () => {},
	documentSources: () => new Map(), refresh: async () => {}, revealActive: async () => {} });
const values = { title: 'Inserted', slug: 'inserted', parentPath: 'after', description: '', listed: true, listChildren: false, aliases: [] };
const send = (type = 'submit', revision = 1) => receive({ type, revision, values });
try {
	await write('site-config/settings.yaml', 'sourceFormat: 2\nurl: https://example.com/\n');
	await write('root/content.md', '# Home\n');
	await write('root/tree-theme.yaml', 'preset: documentation\n');
	await write('root/pages/alpha/content.md', '---\nnavigation:\n  order: 1\n---\n# Alpha\n');
	await write('root/pages/beta/content.md', '---\nnavigation:\n  order: 2\n---\n# Beta\n');
	const beta = path.join(siteRoot, 'root/pages/beta/content.md');
	const original = await readFile(beta, 'utf8');
	const destination = path.join(siteRoot, 'root/pages/inserted/content.md');
	let promise = open();
	for (const choice of ['last', 'first', 'before', 'after']) assert.match(html, new RegExp(`option value="${choice}"`));
	await send();
	assert.match(replies.at(-1).errors.form, /Review the affected files and order values/);
	assert.match(replies.at(-1).preview, /beta\/content.md: 2 → 3000/);
	assert.match(replies.at(-1).preview, /Address: \/inserted\//);
	assert.equal(opened, 0); assert.equal(closed, false);
	await assert.rejects(access(destination));
	await receive({ type: 'cancel' }); await promise;
	assert.equal(await readFile(beta, 'utf8'), original, 'Cancel must leave existing orders untouched.');

	promise = open();
	await send('preview');
	await writeFile(beta, original + '\nConcurrent saved edit.\n');
	await send();
	assert.match(replies.at(-1).errors.form, /Review/);
	await assert.rejects(access(destination));
	await send(); await promise;
	assert.equal(opened, 1); assert.equal(closed, true);
	assert.match(await readFile(destination, 'utf8'), /order: 2000/);
	assert.match(await readFile(beta, 'utf8'), /order: 3000/);
	assert.match(await readFile(beta, 'utf8'), /Concurrent saved edit/);
	assert.match(notifications[0], /2 existing sibling/);

	const confirmation = pageMoveConfirmationHtml({ title: 'Alpha', plan: { sameParent: true, sourceUrl: '/alpha/', destinationUrl: '/alpha/',
		orderChanges: [{ contentPath: '<unsafe>/content.md', oldOrder: null, newOrder: 1000 }] } }, 'test');
	assert.match(confirmation, /<details open><summary>Page order changes/);
	assert.match(confirmation, /&lt;unsafe&gt;\/content.md: unset → 1000/);
	assert.doesNotMatch(confirmation, /<input id="preserve-aliases"/);
	console.log('Page order forms passed: relative creation, visible renumbering, cancel, stale preview, confirmed edits and reorder confirmation.');
} finally {
	await rm(siteRoot, { recursive: true, force: true });
}
