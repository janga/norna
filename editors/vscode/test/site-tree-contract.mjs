import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

// Check adapter boundaries independently of the native-widget suite: engine
// capability fallback, physical ownership and command destinations.
const extensionRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const engineRoot = path.resolve(extensionRoot, '../..');
const require = createRequire(import.meta.url);
const temporary = await mkdtemp(path.join(os.tmpdir(), 'norna-tree-adapter-'));
const siteRoot = path.join(temporary, 'site');
const legacySite = path.join(temporary, 'legacy-site');
const legacyEngine = path.join(temporary, 'legacy-engine');
const write = async (filename, source) => { await mkdir(path.dirname(filename), { recursive: true }); await writeFile(filename, source); };
const disposable = () => ({ dispose() {} });
class EventEmitter {
	listeners = [];
	event = (listener) => { this.listeners.push(listener); return disposable(); };
	fire = (value) => { for (const listener of this.listeners) listener(value); };
	dispose() {}
}
const commands = new Map();
const opened = [];
const errors = [];
const inputs = [];
const choices = [];
const documents = [];
const tabChanges = new EventEmitter();
const revealed = [];
let provider;
let tree;
const vscode = {
	EventEmitter,
	Uri: { file: (fsPath) => ({ scheme: 'file', fsPath }) },
	TreeItem: class { constructor(label, collapsibleState) { Object.assign(this, { label, collapsibleState }); } },
	ThemeIcon: class { constructor(id) { this.id = id; } },
	TreeItemCollapsibleState: { None: 0, Collapsed: 1 },
	Range: class {}, Diagnostic: class {}, DiagnosticSeverity: { Error: 0 },
	languages: { createDiagnosticCollection: () => ({ clear() {}, set() {}, dispose() {} }) },
	workspace: {
		isTrusted: true, textDocuments: documents,
		asRelativePath: (filename) => path.relative(temporary, filename),
		findFiles: async () => [siteRoot, legacySite].map((root) => vscode.Uri.file(path.join(root, 'config.yaml'))),
		createFileSystemWatcher: () => ({ onDidCreate: disposable, onDidDelete: disposable, onDidChange: disposable, dispose() {} }),
		onDidChangeTextDocument: disposable, onDidCloseTextDocument: disposable, onDidChangeWorkspaceFolders: disposable,
	},
	window: {
		createTreeView: (_id, options) => { provider = options.treeDataProvider; tree = {
			visible: false, selection: [], onDidChangeVisibility: disposable,
			reveal: async (node) => revealed.push(node), dispose() {},
		}; return tree; },
		tabGroups: { activeTabGroup: {}, onDidChangeTabs: tabChanges.event },
		onDidChangeActiveTextEditor: disposable,
		showInputBox: async () => inputs.shift(),
		showQuickPick: async (items) => { const choose = choices.shift(); assert.ok(choose, 'Unexpected location or confirmation prompt.'); return choose(items); },
		showTextDocument: async (uri) => { opened.push(['text', uri.fsPath]); },
		showErrorMessage: async (message) => errors.push(message),
	},
	commands: {
		registerCommand: (name, callback) => { commands.set(name, callback); return disposable(); },
		executeCommand: async (name, uri) => opened.push([name, uri.fsPath]),
	},
};
const context = { subscriptions: [] };
try {
	for (const root of [siteRoot, legacySite]) {
		await write(path.join(root, 'config.yaml'), 'url: https://example.com/\n');
		await write(path.join(root, 'content.md'), '# Home\n');
	}
	await write(path.join(siteRoot, 'pages/010-guide/content.md'), '# Guide\n');
	await write(path.join(siteRoot, 'pages/010-guide/pages/010-child/content.md'), '# Child\n');
	await write(path.join(siteRoot, 'pages/010-guide/images/example.png'), 'Fixture bytes');
	await write(path.join(siteRoot, 'public/download.txt'), 'Public text');
	await write(path.join(legacyEngine, 'scripts/lib/editor-site-tree.mjs'),
		`export { siteTreeApiVersion, readSiteTree, getSiteNodeInformation, editSiteNodeInformation, planSiteNodeCreation, createSiteNode, slugifyAsciiIdentifier } from ${JSON.stringify(pathToFileURL(path.join(engineRoot, 'scripts/lib/editor-site-tree.mjs')).href)};\n`);
	const localRequire = (name) => name === 'vscode' ? vscode : name === './norna-project.cjs' ? {
		getNornaProjectContext: (filename) => {
			const legacy = filename.startsWith(legacySite + path.sep);
			return { siteRoot: legacy ? legacySite : siteRoot, editorCompatible: true, schemaCompatible: true,
				nornaPackage: { root: legacy ? legacyEngine : engineRoot, packageJson: { version: 'test' } } };
		},
	} : require(name);
	const module = { exports: {} };
	new Function('require', 'module', 'exports', await readFile(path.join(extensionRoot, 'site-tree.cjs'), 'utf8'))(localRequire, module, module.exports);
	const registered = module.exports.registerSiteTree(context, { appendLine() {} });
	await registered.refresh();
	const roots = await provider.getChildren();
	const home = roots.find((node) => node.siteRoot === siteRoot);
	const legacy = roots.find((node) => node.siteRoot === legacySite);
	assert.equal(home.sourcePath, path.join(siteRoot, 'content.md'));
	assert.equal(provider.getParent(home), undefined);
	assert.equal(legacy.kind, 'site', 'An engine without the optional file capability must retain its existing page tree.');
	assert.match(tree.message, /pages only/);
	assert.equal((await provider.getChildren(legacy))[0].title, 'Home');
	const pages = home.children.find((node) => node.role === 'pages');
	const guide = pages.children[0];
	const guidePages = guide.children.find((node) => node.role === 'pages');
	const image = guide.children.find((node) => node.role === 'images').children[0];
	assert.equal(provider.getTreeItem(home).iconPath.id, provider.getTreeItem(guide).iconPath.id);
	assert.equal(provider.getTreeItem(pages).contextValue, 'nornaPages');
	assert.equal(provider.getTreeItem(pages).command, undefined);
	assert.equal(provider.getTreeItem(image).contextValue, 'nornaFile');
	await commands.get('nornaEditor.openSiteNode')(image);
	assert.deepEqual(opened.pop(), ['vscode.open', image.sourcePath], 'Resources must use VS Code editor selection, not a forced text editor.');
	await commands.get('nornaEditor.pageInformation')(image);
	assert.match(errors.pop(), /Select a page or navigation category/);
	assert.equal(errors.length, 0);
	inputs.push('Added below guide', 'added-below-guide');
	choices.push((items) => { assert.equal(items.length, 1); assert.equal(items[0].description, '/guide/added-below-guide/'); return items[0]; });
	await commands.get('nornaEditor.addPage')(guidePages);
	const created = path.join(siteRoot, 'pages/010-guide/pages/020-added-below-guide/content.md');
	assert.match(await readFile(created, 'utf8'), /^# Added below guide\n/);
	assert.deepEqual(opened.pop(), ['text', created]);
	assert.equal(errors.length, 0, errors.join('\n'));
	const updatedHome = (await provider.getChildren()).find((node) => node.siteRoot === siteRoot);
	assert.equal(updatedHome, home, 'Stable node objects and IDs preserve unrelated expansion on refresh.');
	inputs.push('Cancelled', 'cancelled');
	choices.push(() => undefined);
	await commands.get('nornaEditor.addPage')(pages);
	assert.equal(home.children.find((node) => node.role === 'pages').children.length, 1);
	// Selecting an owned resource in the command palette resolves to its page.
	choices.push((items) => { assert.equal(items[0].parentPath, '/guide/'); assert.equal(items[1].parentPath, '/'); return undefined; });
	await commands.get('nornaEditor.newPage')(image);
	assert.equal(inputs.length, 0);
	assert.equal(choices.length, 0);
	assert.equal(errors.length, 0);
	const externalImage = path.join(siteRoot, 'images/external.png');
	await write(externalImage, 'Image bytes');
	tree.visible = true;
	vscode.window.tabGroups.activeTabGroup.activeTab = { input: { uri: vscode.Uri.file(externalImage) } };
	tabChanges.fire();
	const deadline = Date.now() + 3000;
	while (!revealed.some((node) => node.sourcePath === externalImage) && Date.now() < deadline) {
		await new Promise((resolve) => setTimeout(resolve, 30));
	}
	assert.equal(revealed.at(-1)?.sourcePath, externalImage, 'A custom image editor must reveal a newly discovered resource without a text editor.');
	// Opening a new source can overlap filesystem refresh and active-tab reveal.
	// Hold reveal until a refresh is requested, then let it ask for its parent’s
	// children as VS Code does. Refresh must wait without blocking getChildren.
	const started = Promise.withResolvers();
	const resolveChildren = Promise.withResolvers();
	let revealing = false;
	let changesDuringReveal = 0;
	provider.onDidChangeTreeData(() => { if (revealing) changesDuringReveal += 1; });
	tree.reveal = async (node) => {
		assert.equal(revealing, false, 'Reveals must not overlap.');
		revealing = true;
		started.resolve();
		await resolveChildren.promise;
		const siblings = await provider.getChildren(provider.getParent(node));
		assert.ok(siblings.includes(node), 'The active item must remain in its parent during reveal.');
		revealing = false;
	};
	const revealingCommand = commands.get('nornaEditor.refreshSiteTree')();
	await started.promise;
	const queuedRefresh = registered.refresh();
	const secondReveal = commands.get('nornaEditor.refreshSiteTree')();
	resolveChildren.resolve();
	let timeout;
	try {
		await Promise.race([
			Promise.all([revealingCommand, queuedRefresh, secondReveal]),
			new Promise((_, reject) => { timeout = setTimeout(() => reject(new Error('Tree refresh/reveal deadlocked.')), 3000); }),
		]);
	} finally { clearTimeout(timeout); }
	assert.equal(changesDuringReveal, 0, 'Refreshing during reveal invalidates VS Code’s item handles.');
	assert.equal(errors.length, 0, errors.join('\n'));
	console.log('VS Code tree adapter contract passed: physical parents, resources, creation destinations, cancellation, stable identity, refresh/reveal coordination and older-engine fallback.');
} finally {
	for (const subscription of context.subscriptions) subscription.dispose();
	await rm(temporary, { recursive: true, force: true });
}
