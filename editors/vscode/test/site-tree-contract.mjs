import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
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
const outsideSite = path.join(temporary, 'outside');
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
const forms = [];
const choices = [];
const documents = [];
const tabChanges = new EventEmitter();
const revealed = [];
const state = new Map();
const contexts = new Map();
const workspaceChanges = new EventEmitter();
const documentChanges = new EventEmitter();
const editorDiagnostics = new Map();
const diagnosticChanges = new EventEmitter();
const workspaceState = { get: (key) => state.get(key), update: async (key, value) => { state.set(key, value); } };
let discoveredRoots = [siteRoot, legacySite];
let provider;
let tree;
const vscode = {
	EventEmitter,
	Uri: { file: (fsPath) => ({ scheme: 'file', fsPath }) },
	TreeItem: class { constructor(label, collapsibleState) { Object.assign(this, { label, collapsibleState }); } },
	ViewColumn: { Active: 1 },
	ThemeIcon: class { constructor(id) { this.id = id; } },
	TreeItemCollapsibleState: { None: 0, Collapsed: 1, Expanded: 2 },
	Range: class {}, Diagnostic: class {}, DiagnosticSeverity: { Error: 0, Warning: 1 },
	languages: { createDiagnosticCollection: () => ({ clear() {}, set() {}, dispose() {} }),
		getDiagnostics: (uri) => editorDiagnostics.get(uri.fsPath) ?? [], onDidChangeDiagnostics: diagnosticChanges.event },
	workspace: {
		isTrusted: true, textDocuments: documents,
		workspaceFolders: [siteRoot, legacySite].map((root) => ({ name: path.basename(root), uri: { scheme: 'file', fsPath: root } })),
		asRelativePath: (filename) => path.relative(temporary, filename),
		findFiles: async () => discoveredRoots.map((root) => vscode.Uri.file(path.join(root, 'site-config/settings.yaml'))),
		createFileSystemWatcher: () => ({ onDidCreate: disposable, onDidDelete: disposable, onDidChange: disposable, dispose() {} }),
		onDidChangeTextDocument: documentChanges.event, onDidCloseTextDocument: disposable, onDidChangeWorkspaceFolders: workspaceChanges.event,
	},
	window: {
		createWebviewPanel: () => {
			let receive, dispose; const replies=[];
			const panel={ webview: { html:'', onDidReceiveMessage: (fn)=>{receive=fn;return disposable();}, postMessage: async message=>{replies.push(message);} }, onDidDispose: fn=>{dispose=fn;}, dispose: ()=>dispose?.() };
			queueMicrotask(async()=>{
				try {
					const model=JSON.parse(panel.webview.html.match(/const initial=(.*);\nconst byId/)[1]);
					const action=forms.shift(); assert.ok(action,'Unexpected page form');
					const values=action(model);
					if(!values) return receive({type:'cancel'});
					await receive({type:'preview',revision:1,values,suggestSlug:false});
					assert.equal(replies.at(-1).errors,undefined,JSON.stringify(replies.at(-1)));
					assert.match(replies.at(-1).preview,new RegExp(values.slug));
					await receive({type:'submit',revision:1,values,suggestSlug:false});
				} catch(error){errors.push(error.message);panel.dispose();}
			});
			return panel;
		},
		createTreeView: (_id, options) => { provider = options.treeDataProvider; tree = {
			visible: false, selection: [], onDidChangeVisibility: disposable,
			expansions: new EventEmitter(), collapses: new EventEmitter(),
			onDidExpandElement(listener) { return this.expansions.event(listener); },
			onDidCollapseElement(listener) { return this.collapses.event(listener); },
			reveal: async (node) => revealed.push(node), dispose() {},
		}; return tree; },
		tabGroups: { activeTabGroup: {}, onDidChangeTabs: tabChanges.event },
		onDidChangeActiveTextEditor: disposable,
		showInputBox: async () => inputs.shift(),
		showOpenDialog: async () => undefined,
		showQuickPick: async (items) => { const choose = choices.shift(); assert.ok(choose, 'Unexpected location or confirmation prompt.'); return choose(items); },
		showTextDocument: async (uri) => { opened.push(['text', uri.fsPath]); },
		showErrorMessage: async (message) => errors.push(message),
	},
	commands: {
		registerCommand: (name, callback) => { commands.set(name, callback); return disposable(); },
		executeCommand: async (name, ...args) => {
			if (name === 'setContext') return contexts.set(args[0], args[1]);
			if (commands.has(name)) return commands.get(name)(...args);
			opened.push([name, args[0].fsPath]);
		},
	},
};
let context = { subscriptions: [], workspaceState, asAbsolutePath: (relative) => path.join(extensionRoot, relative) };
try {
	for (const root of [siteRoot, legacySite, outsideSite]) {
		await write(path.join(root, 'site-config/settings.yaml'), 'url: https://example.com/\n');
		await write(path.join(root, 'content.md'), '# Home\n');
		await write(path.join(root, 'site-config/site-theme.yaml'), 'preset: documentation\n');
	}
	await write(path.join(siteRoot, 'pages/010-guide/content.md'), '# Guide\n');
	await write(path.join(siteRoot, 'pages/010-guide/pages/010-child/content.md'), '# Child\n');
	await write(path.join(siteRoot, 'pages/010-guide/images/example.png'), 'Fixture bytes');
	await write(path.join(siteRoot, 'public/robots.txt'), 'User-agent: *\n');
	await write(path.join(siteRoot, 'theme.yaml'), 'layout:\n  textWidth: narrow\n');
	await write(path.join(legacyEngine, 'scripts/lib/editor-site-tree.mjs'),
		`export { siteTreeApiVersion, readSiteTree, getSiteNodeInformation, editSiteNodeInformation, planSiteNodeCreation, createSiteNode, slugifyAsciiIdentifier } from ${JSON.stringify(pathToFileURL(path.join(engineRoot, 'scripts/lib/editor-site-tree.mjs')).href)};\n`);
	const localRequire = (name) => name === 'vscode' ? vscode : ['./site-file-actions.cjs', './site-address-actions.cjs', './site-source-actions.cjs', './page-form-actions.cjs'].includes(name) ? require(path.join(extensionRoot, name)) : name === './norna-project.cjs' ? {
		getNornaProjectContext: (filename) => {
			const root = [siteRoot, legacySite, outsideSite].find((root) => filename.startsWith(root + path.sep));
			if (!root) return null;
			const legacy = root === legacySite;
			return { siteRoot: root, editorCompatible: true, schemaCompatible: true,
				nornaPackage: { root: legacy ? legacyEngine : engineRoot, packageJson: { version: 'test' } } };
		},
	} : require(name);
	const module = { exports: {} };
	new Function('require', 'module', 'exports', await readFile(path.join(extensionRoot, 'site-tree.cjs'), 'utf8'))(localRequire, module, module.exports);
	let registered = module.exports.registerSiteTree(context, { appendLine() {} });
	await registered.refresh();
	assert.deepEqual(await provider.getChildren(), [], 'Several workspace sites must wait for an explicit choice.');
	assert.equal(tree.message, undefined, 'The empty tree must allow the native Choose Site welcome button.');
	assert.equal(contexts.get('nornaSiteTree.hasMultipleSites'), true);
	assert.equal(contexts.get('nornaSiteTree.hasActiveSite'), false);
	choices.push(() => undefined);
	await commands.get('nornaEditor.chooseSite')();
	assert.deepEqual(await provider.getChildren(), [], 'Cancelling the first choice must leave the tree empty.');
	const chooseSite = async (root) => {
		choices.push((items) => {
			assert.equal(items.some((item) => item.site.siteRoot === outsideSite), false);
			const choice = items.find((item) => item.detail === root);
			assert.ok(choice, `Missing site ${root}`);
			assert.ok(choice.description, 'A location distinguishes equal site titles.');
			const folder = vscode.workspace.workspaceFolders.find(({ uri }) => uri.fsPath === root);
			if (folder?.name) assert.equal(choice.description, folder.name, 'Use the workspace name beside the full path.');
			return choice;
		});
		await commands.get('nornaEditor.chooseSite')();
		assert.equal(errors.length, 0, errors.join('\n'));
	};
	await chooseSite(siteRoot);
	const [home] = await provider.getChildren();
	assert.equal((await provider.getChildren()).length, 1);
	assert.equal(home.sourcePath, path.join(siteRoot, 'content.md'));
	assert.equal(provider.getParent(home), undefined);
	assert.equal(provider.getTreeItem(home).description, 'Homepage');
	assert.equal(home.children[0].title, 'theme.yaml');
	const configuration = home.children.find(node => node.kind === 'directory' && node.role === 'configuration');
	assert.equal(configuration.title, 'site-config');
	assert.equal(provider.getTreeItem(configuration).iconPath.id, 'settings-gear');
	assert.equal(provider.getTreeItem(configuration).collapsibleState, vscode.TreeItemCollapsibleState.Expanded);
	choices.push((items) => {
		assert.deepEqual(items.map((item) => path.basename(item.filename)), ['shared-content.yaml']);
		return undefined;
	});
	await commands.get('nornaEditor.addToPage')(configuration);
	tree.collapses.fire({ element: configuration });
	await registered.refresh();
	assert.equal(provider.getTreeItem(configuration).collapsibleState, vscode.TreeItemCollapsibleState.Collapsed);
	tree.expansions.fire({ element: configuration });
	assert.equal(provider.getTreeItem(configuration).collapsibleState, vscode.TreeItemCollapsibleState.Expanded);
	tree.collapses.fire({ element: configuration });
	const localTheme = provider.getTreeItem(home.children.find((node) => node.title === 'theme.yaml'));
	assert.equal(localTheme.description, '', 'Theme help belongs in hover, not a permanent row description.');
	assert.match(localTheme.tooltip, /Visual settings for this page only/);
	assert.match(provider.getTreeItem(home.children.find((node) => node.role === 'public')).tooltip, /Files published unchanged/);
	assert.equal(state.get('norna.siteTree.activeSite'), siteRoot);
	assert.equal(contexts.get('nornaSiteTree.hasActiveSite'), true);
	choices.push(() => undefined);
	await commands.get('nornaEditor.chooseSite')();
	assert.deepEqual(await provider.getChildren(), [home], 'Cancelling a later choice must preserve the active site.');
	const pages = home.children.find((node) => node.role === 'pages');
	const guide = pages.children[0];
	const guidePages = guide.children.find((node) => node.role === 'pages');
	const image = guide.children.find((node) => node.role === 'images').children[0];
	assert.deepEqual(provider.getTreeItem(home).iconPath, provider.getTreeItem(guide).iconPath);
	assert.match(provider.getTreeItem(guide).iconPath.light, /media\/page-light\.svg$/);
	assert.equal(provider.getTreeItem(pages).contextValue, 'nornaPages');
	for (const node of [pages, configuration]) {
		const item = provider.getTreeItem(node);
		assert.equal(item.command.command, 'nornaEditor.selectSiteGroup');
		assert.equal(item.tooltip, '');
		assert.equal(item.resourceUri, undefined, 'Grouping rows must not gain a filesystem hover.');
		assert.ok(item.accessibilityInformation.label.includes(node.title));
		await commands.get(item.command.command)();
	}
	assert.deepEqual(opened, [], 'Selecting grouping rows must not open files.');
	assert.equal(home.children.some((node) => node.title === 'content.md'), false);
	assert.match(provider.getTreeItem(home).tooltip, /Open page content/);
	assert.equal(provider.getTreeItem(home).command.command, 'nornaEditor.openSiteNode');
	await commands.get('nornaEditor.openSiteNode')(home);
	assert.deepEqual(opened.pop(), ['vscode.open', home.sourcePath]);
	assert.equal(provider.getTreeItem(image).contextValue, 'nornaImage');
	await commands.get('nornaEditor.openSiteNode')(image);
	assert.deepEqual(opened.pop(), ['vscode.open', image.sourcePath], 'Resources must use VS Code editor selection, not a forced text editor.');
	await commands.get('nornaEditor.pageInformation')(image);
	assert.match(errors.pop(), /Select a page/);
	assert.equal(errors.length, 0);
	forms.push(model => { assert.equal(model.parentPath, '/guide/'); return {title:'Added below guide',slug:'added-below-guide',parentPath:model.parentPath,description:'',listed:true,listChildren:false,aliases:[]}; });
	await commands.get('nornaEditor.addPage')(guidePages);
	const created = path.join(siteRoot, 'pages/010-guide/pages/020-added-below-guide/content.md');
	assert.match(await readFile(created, 'utf8'), /^# Added below guide\n/);
	assert.deepEqual(opened.pop(), ['text', created]);
	assert.equal(errors.length, 0, errors.join('\n'));
	const updatedHome = (await provider.getChildren()).find((node) => node.siteRoot === siteRoot);
	assert.equal(updatedHome, home, 'Stable node objects and IDs preserve unrelated expansion on refresh.');
	const firstChild = guidePages.children.find((node) => node.title === 'Child');
	const beforeCancel = await readdir(path.dirname(firstChild.sourcePath));
	choices.push((items) => { assert.deepEqual(items.map((item) => item.command), ['addChildPage', 'importImage', 'createSourceFile']); return undefined; });
	await commands.get('nornaEditor.addToPage')(firstChild);
	assert.deepEqual(await readdir(path.dirname(firstChild.sourcePath)), beforeCancel, 'Cancelling Add must not create images or pages.');
	choices.push((items) => items.find((item) => item.command === 'importImage'));
	await commands.get('nornaEditor.addToPage')(firstChild);
	assert.deepEqual(await readdir(path.dirname(firstChild.sourcePath)), beforeCancel, 'Cancelling the image picker must not create images/.');
	choices.push((items) => items.find((item) => item.command === 'addChildPage'));
	forms.push(model => { assert.equal(model.parentPath, '/guide/child/'); return {title:'First grandchild',slug:'first-grandchild',parentPath:model.parentPath,description:'',listed:true,listChildren:false,aliases:[]}; });
	await commands.get('nornaEditor.addToPage')(firstChild);
	assert.match(await readFile(path.join(path.dirname(firstChild.sourcePath), 'pages/010-first-grandchild/content.md'), 'utf8'), /^# First grandchild/);
	assert.equal(choices.length, 0, 'The visible plus must not ask for Inside/Beside.');
	const importImage = commands.get('nornaEditor.importImage');
	let importedInto;
	commands.set('nornaEditor.importImage', (node) => { importedInto = node; });
	choices.push((items) => items.find((item) => item.command === 'importImage'));
	await commands.get('nornaEditor.addToPage')(image);
	assert.equal(importedInto, guide, 'Add on a resource must import into its owning page.');
	commands.set('nornaEditor.importImage', importImage);
	choices.push((items) => { assert.deepEqual(items.map((item) => item.command), ['pageInformation', 'addressesAndLinks', 'openSiteNode', 'removePage']); return undefined; });
	await commands.get('nornaEditor.pageActions')(guide);
	forms.push(() => undefined);
	await commands.get('nornaEditor.addPage')(pages);
	assert.equal(home.children.find((node) => node.role === 'pages').children.length, 1);
	await write(path.join(siteRoot, 'pages/020-topics/content.md'), '---\npage:\n  listChildren: true\n---\n# Topics\n');
	await registered.refresh();
	const overview = pages.children.find((node) => node.title === 'Topics');
	choices.push((items) => { assert.deepEqual(items.map((item) => item.command), ['addChildPage', 'importImage', 'createSourceFile']); return undefined; });
	await commands.get('nornaEditor.addToPage')(overview);
	assert.equal(provider.getTreeItem(overview).command.command, 'nornaEditor.openSiteNode');
	await commands.get('nornaEditor.openSiteNode')(overview);
	assert.deepEqual(opened.pop(), ['vscode.open', overview.sourcePath]);
	assert.match(provider.getTreeItem(overview).iconPath.light, /media\/page-list-light\.svg$/);
	const leaf = guidePages.children.find((node) => node.title === 'Added below guide');
	assert.equal(provider.getTreeItem(leaf).collapsibleState, vscode.TreeItemCollapsibleState.Collapsed, 'An existing empty images folder is a visible detail.');
	await rm(path.join(path.dirname(leaf.sourcePath), 'images'), { recursive: true });
	await registered.refresh();
	assert.equal(provider.getTreeItem(leaf).collapsibleState, vscode.TreeItemCollapsibleState.None);
	choices.push((items) => items.find((item) => item.filename?.endsWith('/theme.yaml')));
	choices.push(() => undefined);
	await commands.get('nornaEditor.addToPage')(leaf);
	assert.deepEqual(await readdir(path.dirname(leaf.sourcePath)), ['content.md']);
	choices.push((items) => items.find((item) => item.filename?.endsWith('/theme.yaml')));
	choices.push((items) => { assert.match(items[0].description, /normal body text width/); return items[0]; });
	await commands.get('nornaEditor.addToPage')(leaf);
	assert.equal(await readFile(path.join(path.dirname(leaf.sourcePath), 'theme.yaml'), 'utf8'), 'layout:\n  textWidth: normal\n');
	assert.deepEqual(opened.pop(), ['text', path.join(path.dirname(leaf.sourcePath), 'theme.yaml')]);
	assert.equal(provider.getTreeItem(leaf).collapsibleState, vscode.TreeItemCollapsibleState.Collapsed);
	choices.push((items) => { assert.deepEqual(items.map((item) => item.command), ['addChildPage', 'importImage']); return undefined; });
	await commands.get('nornaEditor.addToPage')(leaf);
	const leafTheme = leaf.children[0];
	await write(leafTheme.sourcePath, 'layout:\n  textWidth: impossible\n');
	await registered.refresh();
	assert.match(provider.getTreeItem(leafTheme).description, /error/);
	assert.equal(provider.getTreeItem(leafTheme).iconPath.id, 'file', 'Errors must preserve the file type.');
	assert.match(provider.getTreeItem(leaf).description, /error/, 'The owning page reveals a child problem.');
	await write(leafTheme.sourcePath, 'layout:\n  textWidth: normal\n');
	await registered.refresh();
	assert.equal(provider.getTreeItem(leafTheme).description, '', 'Repair must clear old issues on reused nodes.');
	editorDiagnostics.set(leafTheme.sourcePath, [{ message: 'An unsaved schema error', severity: vscode.DiagnosticSeverity.Error, source: 'YAML', range: { start: { line: 2 } } }]);
	diagnosticChanges.fire({ uris: [vscode.Uri.file(leafTheme.sourcePath)] });
	assert.match(provider.getTreeItem(leafTheme).tooltip, /An unsaved schema error/);
	assert.match(provider.getTreeItem(leaf).description, /error/);
	editorDiagnostics.clear();
	diagnosticChanges.fire({ uris: [vscode.Uri.file(leafTheme.sourcePath)] });
	assert.equal(provider.getTreeItem(leafTheme).description, '');
	await rm(leafTheme.sourcePath);
	await registered.refresh();
	assert.equal(provider.getTreeItem(leaf).collapsibleState, vscode.TreeItemCollapsibleState.None);
	const blockedPath = path.join(path.dirname(leaf.sourcePath), 'theme.yaml');
	documents.push({ uri: vscode.Uri.file(blockedPath), isDirty: true });
	choices.push((items) => items.find((item) => item.filename === blockedPath));
	choices.push((items) => items[0]);
	await commands.get('nornaEditor.addToPage')(leaf);
	assert.match(errors.pop(), /unsaved buffer/);
	assert.deepEqual(await readdir(path.dirname(leaf.sourcePath)), ['content.md']);
	documents.pop();
	// Selecting an owned resource in the command palette resolves to its page.
	forms.push(model => { assert.equal(model.parents[0].parentPath, '/guide/'); assert.equal(model.parents[1].parentPath, '/'); return undefined; });
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
	tree.reveal = async (node) => revealed.push(node);
	const openTab = async (filename) => {
		vscode.window.tabGroups.activeTabGroup.activeTab = { input: { uri: vscode.Uri.file(filename) } };
		tabChanges.fire();
		await new Promise((resolve) => setTimeout(resolve, 250));
		await registered.refresh();
	};
	for (const root of [outsideSite, legacySite]) {
		const count = revealed.length;
		await openTab(path.join(root, 'content.md'));
		assert.deepEqual(await provider.getChildren(), [home], 'An unrelated active editor must not add or switch site roots.');
		assert.equal(revealed.length, count, 'An unrelated file must not reveal a row from another site.');
		assert.equal(state.get('norna.siteTree.activeSite'), siteRoot);
	}
	// Dirty titles belong to the selected site without moving source bytes.
	const homePath = path.join(siteRoot, 'content.md');
	await openTab(homePath);
	assert.equal(revealed.at(-1).id, homePath, 'Reveal the page representing hidden content.md.');
	const beforeSettings = revealed.length;
	await openTab(path.join(siteRoot, 'site-config/settings.yaml'));
	await commands.get('nornaEditor.refreshSiteTree')();
	assert.ok(revealed.length > beforeSettings);
	assert.ok(revealed.slice(beforeSettings).every((node) => node === configuration), 'Reveal the collapsed configuration folder without reopening it for an active settings file.');
	assert.equal(provider.getTreeItem(configuration).collapsibleState, vscode.TreeItemCollapsibleState.Collapsed);
	const originalHome = await readFile(homePath, 'utf8');
	const dirty = { uri: vscode.Uri.file(homePath), isDirty: true, version: 1, getText: () => '# Unsaved Home\n' };
	documents.push(dirty);
	documentChanges.fire({ document: dirty });
	await new Promise((resolve) => setTimeout(resolve, 250));
	await registered.refresh();
	assert.equal((await provider.getChildren())[0].title, 'Unsaved Home');
	assert.match(provider.getTreeItem(home).description, /Homepage.*unsaved/);
	assert.equal(await readFile(homePath, 'utf8'), originalHome);
	documents.pop();
	await registered.refresh();
	await chooseSite(legacySite);
	const [legacy] = await provider.getChildren();
	assert.equal(legacy.kind, 'site', 'An older engine retains its page-only tree within the selected site.');
	assert.match(tree.message, /pages only/);
	assert.equal((await provider.getChildren(legacy))[0].title, 'Home');
	assert.equal(provider.getTreeItem(legacy.children[0]).command.command, 'nornaEditor.openSiteNode', 'Old engines still need page-label source opening.');
	assert.deepEqual(await provider.getChildren(home), [], 'Old handles cannot expose another site’s children.');
	await commands.get('nornaEditor.addPage')(pages);
	assert.match(errors.pop(), /active site/, 'Stale commands must not create in an inactive site.');
	tree.selection = [guide];
	vscode.window.tabGroups.activeTabGroup.activeTab = { input: { uri: vscode.Uri.file(path.join(outsideSite, 'content.md')) } };
	inputs.push(undefined);
	await commands.get('nornaEditor.newPage')();
	assert.equal(inputs.length, 0, 'An inactive selection must fall back to the chosen site, without a foreign-parent prompt.');
	tree.selection = [];
	// A reload restores the explicit site rather than following the open file.
	for (const subscription of context.subscriptions) subscription.dispose();
	context = { subscriptions: [], workspaceState, asAbsolutePath: (relative) => path.join(extensionRoot, relative) };
	registered = module.exports.registerSiteTree(context, { appendLine() {} });
	await registered.refresh();
	assert.equal((await provider.getChildren())[0].siteRoot, legacySite);
	// Even an overbroad discovery result cannot escape workspace membership.
	discoveredRoots.push(outsideSite);
	vscode.workspace.workspaceFolders = [{ uri: vscode.Uri.file(siteRoot) }];
	workspaceChanges.fire();
	await new Promise((resolve) => setTimeout(resolve, 250));
	await registered.refresh();
	assert.equal((await provider.getChildren()).length, 1);
	assert.equal((await provider.getChildren())[0].siteRoot, siteRoot, 'Removing the selected folder selects the only remaining workspace site.');
	const restoredConfiguration = (await provider.getChildren())[0].children.find((node) => node.kind === 'directory' && node.role === 'configuration');
	assert.equal(provider.getTreeItem(restoredConfiguration).collapsibleState, vscode.TreeItemCollapsibleState.Collapsed, 'Configuration collapse must survive a reload and site switch.');
	assert.equal(contexts.get('nornaSiteTree.hasMultipleSites'), false);
	await commands.get('nornaEditor.openSiteNode')(legacy);
	assert.match(errors.pop(), /active site/);
	vscode.workspace.workspaceFolders = [];
	await registered.refresh();
	assert.deepEqual(await provider.getChildren(), []);
	assert.equal(state.get('norna.siteTree.activeSite'), undefined);
	assert.match(tree.message, /Open a folder/);
	assert.equal(contexts.get('nornaSiteTree.hasActiveSite'), false);
	vscode.workspace.workspaceFolders = [siteRoot, legacySite].map((root) => ({ uri: vscode.Uri.file(root) }));
	await registered.refresh();
	assert.deepEqual(await provider.getChildren(), [], 'Restored multiple folders require a new choice after invalidation.');
	await chooseSite(siteRoot);
	await rm(path.join(siteRoot, 'site-config/settings.yaml'));
	await registered.refresh();
	assert.equal((await provider.getChildren())[0].siteRoot, siteRoot, 'A missing required file must not switch the active site.');
	assert.match(provider.getTreeItem((await provider.getChildren())[0]).description, /error/);
	await rm(homePath);
	await registered.refresh();
	const damagedHome = (await provider.getChildren())[0];
	assert.equal(damagedHome.kind, 'incomplete');
	assert.equal(provider.getTreeItem(damagedHome).contextValue, 'nornaIncomplete');
	assert.equal(provider.getTreeItem(damagedHome).command.command, 'nornaEditor.addToPage');
	choices.push((items) => { assert.ok(items.some((item) => item.filename === homePath)); assert.ok(items.every((item) => item.command === 'createSourceFile')); return undefined; });
	await commands.get('nornaEditor.addToPage')(damagedHome);
	for (const subscription of context.subscriptions) subscription.dispose();
	context = { subscriptions: [], workspaceState, asAbsolutePath: (relative) => path.join(extensionRoot, relative) };
	registered = module.exports.registerSiteTree(context, { appendLine() {} });
	await registered.refresh();
	assert.equal((await provider.getChildren())[0].siteRoot, siteRoot, 'Reload must retain the damaged chosen site.');
	choices.push((items) => items.find((item) => item.filename === homePath));
	inputs.push('Repaired Home'); choices.push((items) => items[0]);
	await commands.get('nornaEditor.addToPage')((await provider.getChildren())[0]);
	assert.equal((await provider.getChildren())[0].title, 'Repaired Home');
	assert.equal(await readFile(path.join(outsideSite, 'content.md'), 'utf8'), '# Home\n');
	assert.equal(errors.length, 0, errors.join('\n'));
	console.log('VS Code tree adapter contract passed: one active workspace site, explicit choice/cancellation, reload/removal, external files, dirty sources, guarded commands, physical ownership, refresh/reveal coordination and older-engine fallback.');
} finally {
	for (const subscription of context.subscriptions) subscription.dispose();
	await rm(temporary, { recursive: true, force: true });
}
