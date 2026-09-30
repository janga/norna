import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, readdir, rename, rm, writeFile } from 'node:fs/promises';
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
const siteRoot = path.join(temporary, 'site with spaces');
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
const copied = [];
const errors = [];
const errorActions = [];
const errorReplies = [];
const information = [];
const warningReplies = [];
const warningActions = [];
const inputs = [];
const forms = [];
const moveConfirmations = [];
const moveResponses = [];
const choices = [];
const documents = [];
const tabChanges = new EventEmitter();
const revealed = [];
const revealCalls = [];
const state = new Map();
const contexts = new Map();
const workspaceChanges = new EventEmitter();
const documentChanges = new EventEmitter();
const documentSaves = new EventEmitter();
const editorDiagnostics = new Map();
const treeDiagnostics = new Map();
const diagnosticChanges = new EventEmitter();
const workspaceState = { get: (key) => state.get(key), update: async (key, value) => { state.set(key, value); } };
let discoveredRoots = [siteRoot, legacySite];
let provider;
let tree;
const vscode = {
	env: { clipboard: { writeText: async (text) => copied.push(text) } },
	EventEmitter,
	Uri: { file: (fsPath) => ({ scheme: 'file', fsPath }) },
	TreeItem: class { constructor(label, collapsibleState) { Object.assign(this, { label, collapsibleState }); } },
	WorkspaceEdit: class { renameFile(from, to) { this.from = from.fsPath; this.to = to.fsPath; } },
	ViewColumn: { Active: 1 },
	ThemeIcon: class { constructor(id, color) { Object.assign(this, { id, color }); } },
	ThemeColor: class { constructor(id) { this.id = id; } },
	TreeItemCollapsibleState: { None: 0, Collapsed: 1, Expanded: 2 },
	Range: class {}, Diagnostic: class { constructor(range, message, severity) { Object.assign(this, { range, message, severity }); } }, DiagnosticSeverity: { Error: 0, Warning: 1 },
	languages: { createDiagnosticCollection: () => ({ clear() { treeDiagnostics.clear(); }, set(uri, issues) { treeDiagnostics.set(uri.fsPath, issues); }, dispose() {} }),
		getDiagnostics: (uri) => editorDiagnostics.get(uri.fsPath) ?? [], onDidChangeDiagnostics: diagnosticChanges.event },
	workspace: {
		isTrusted: true, textDocuments: documents,
		workspaceFolders: [siteRoot, legacySite].map((root) => ({ name: path.basename(root), uri: { scheme: 'file', fsPath: root } })),
		asRelativePath: (filename) => path.relative(temporary, filename),
		findFiles: async () => discoveredRoots.map((root) => vscode.Uri.file(path.join(root, 'site-config/settings.yaml'))),
		applyEdit: async (edit) => { await rename(edit.from, edit.to); return true; },
		createFileSystemWatcher: () => ({ onDidCreate: disposable, onDidDelete: disposable, onDidChange: disposable, dispose() {} }),
		onDidChangeTextDocument: documentChanges.event, onDidSaveTextDocument: documentSaves.event,
		onDidCloseTextDocument: disposable, onDidChangeWorkspaceFolders: workspaceChanges.event,
	},
	window: {
		createOutputChannel: () => ({ append() {}, appendLine() {}, show() {}, dispose() {} }),
		createWebviewPanel: (viewType) => {
			let receive, dispose; const replies=[];
			const panel={ webview: { html:'', onDidReceiveMessage: (fn)=>{receive=fn;return disposable();}, postMessage: async message=>{replies.push(message);} }, onDidDispose: fn=>{dispose=fn;}, dispose: ()=>dispose?.() };
			queueMicrotask(async()=>{
				try {
					if (viewType === 'nornaPageMoveConfirmation') {
						moveConfirmations.push(panel.webview.html);
						assert.match(panel.webview.html, /id="preserve-aliases"[^>]*checked/);
						const response = moveResponses.shift();
						if (typeof response === 'function') return await response({ receive, panel, replies });
						return await receive(response === undefined ? { type: 'cancel' } : { type: 'complete', preserveAliases: response });
					}
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
			reveal: async (node, options) => { revealed.push(node); revealCalls.push({ node, options }); }, dispose() {},
		}; return tree; },
		tabGroups: { activeTabGroup: {}, onDidChangeTabs: tabChanges.event },
		onDidChangeActiveTextEditor: disposable,
		showInputBox: async () => inputs.shift(),
		showOpenDialog: async () => undefined,
		showQuickPick: async (items) => { const choose = choices.shift(); assert.ok(choose, 'Unexpected location or confirmation prompt.'); return choose(items); },
		showTextDocument: async (uri) => { opened.push(['text', uri.fsPath]); },
		showErrorMessage: async (message, options, ...actions) => { errors.push(message); errorActions.push({ options, actions }); return errorReplies.shift(); },
		showInformationMessage: async (message) => information.push(message),
		showWarningMessage: async (message, options, ...actions) => { information.push(message); warningActions.push({ options, actions }); return warningReplies.shift(); },
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
		await write(path.join(root, 'root/content.md'), '# Home\n');
		await write(path.join(root, 'root/tree-theme.yaml'), 'preset: documentation\n');
	}
	await write(path.join(siteRoot, 'root/pages/010-guide/content.md'), '# Guide\n');
	await write(path.join(siteRoot, 'root/pages/010-guide/pages/010-child/content.md'), '# Child\n');
	await write(path.join(siteRoot, 'root/pages/010-guide/images/example.png'), 'Fixture bytes');
	await write(path.join(siteRoot, 'root/pages/010-guide/downloads/manual.pdf'), 'Fixture attachment');
	await write(path.join(siteRoot, 'public/robots.txt'), 'User-agent: *\n');
	await write(path.join(siteRoot, 'root/page-theme.yaml'), 'layout:\n  textWidth: narrow\n');
	await write(path.join(legacyEngine, 'scripts/lib/editor-site-tree.mjs'),
		`export { siteTreeApiVersion, readSiteTree, getSiteNodeInformation, editSiteNodeInformation, planSiteNodeCreation, createSiteNode, slugifyAsciiIdentifier } from ${JSON.stringify(pathToFileURL(path.join(engineRoot, 'scripts/lib/editor-site-tree.mjs')).href)};\n`);
	const localRequire = (name) => name === 'vscode' ? vscode : ['./site-preview-actions.cjs', './site-attachment-actions.cjs', './site-resource-actions.cjs', './site-file-actions.cjs', './site-address-actions.cjs', './site-source-actions.cjs', './page-form-actions.cjs', './page-placement.cjs', './page-move-confirmation.cjs'].includes(name) ? require(path.join(extensionRoot, name)) : name === './norna-project.cjs' ? {
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
	const roots = await provider.getChildren();
	const home = roots.find((node) => node.isHome);
	assert.equal((await provider.getChildren()).length, 3);
	assert.equal(home.sourcePath, path.join(siteRoot, 'root/content.md'));
	assert.equal(provider.getParent(home), undefined);
	assert.equal(provider.getTreeItem(home).description, 'Homepage');
	assert.equal(home.children[0].title, 'tree-theme.yaml');
	const configuration = roots.find(node => node.kind === 'directory' && node.role === 'configuration');
	assert.equal(configuration.title, 'site-config');
	assert.equal(configuration.ownerId, siteRoot);
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
	const localTheme = provider.getTreeItem(home.children.find((node) => node.title === 'tree-theme.yaml'));
	assert.equal(localTheme.description, '', 'Theme help belongs in hover, not a permanent row description.');
	assert.match(localTheme.tooltip, /Visual settings for this page and its descendants/);
	assert.match(localTheme.tooltip, /Preset: documentation\nPreset source: root\/tree-theme.yaml/);
	assert.equal(provider.getTreeItem(home).tooltip, 'URL: https://example.com/');
	assert.match(provider.getTreeItem(roots.find((node) => node.role === 'public')).tooltip, /Files published unchanged/);
	assert.equal(state.get('norna.siteTree.activeSite'), siteRoot);
	assert.equal(contexts.get('nornaSiteTree.hasActiveSite'), true);
	choices.push(() => undefined);
	await commands.get('nornaEditor.chooseSite')();
	assert.deepEqual(await provider.getChildren(), roots, 'Cancelling a later choice must preserve the active site.');
	const pages = home.children.find((node) => node.role === 'pages');
	const guide = pages.children[0];
	const guidePages = guide.children.find((node) => node.role === 'pages');
	const image = guide.children.find((node) => node.role === 'images').children[0];
	const imagesFolder = guide.children.find(node => node.role === 'images');
	const downloadsFolder = guide.children.find(node => node.role === 'downloads');
	for (const [node, expected] of [[home, path.join(siteRoot, 'root')], [guide, path.join(siteRoot, 'root/pages/010-guide')], [imagesFolder, imagesFolder.sourcePath], [downloadsFolder, downloadsFolder.sourcePath]]) {
		assert.match(provider.getTreeItem(node).contextValue, /;copyFolderPath;/);
		await commands.get('nornaEditor.copyFolderPath')(node);
		assert.equal(copied.pop(), expected, 'Copy the plain absolute folder path, including spaces, without quoting or a command.');
	}
	for (const node of [image, pages, configuration]) {
		assert.doesNotMatch(provider.getTreeItem(node).contextValue, /;copyFolderPath;/);
		await commands.get('nornaEditor.copyFolderPath')(node);
		assert.match(errors.pop(), /Choose a page, images folder or downloads folder/);
	}
	assert.deepEqual(copied, []);

	assert.equal(provider.getTreeItem(guide).tooltip, 'URL: https://example.com/guide/\nSlug: guide');
	assert.equal(provider.getTreeItem(guide).description, '');
	assert.equal(contexts.get('nornaSiteTree.showUrlPaths'), false);
	await commands.get('nornaEditor.toggleUrlPaths')();
	assert.equal(provider.getTreeItem(guide).description, '/guide/');
	assert.equal(provider.getTreeItem(guidePages.children[0]).description, '/guide/child/');
	assert.equal(provider.getTreeItem(home).description, 'Homepage · /');
	assert.equal(contexts.get('nornaSiteTree.showUrlPaths'), true);
	const settingsPath = path.join(siteRoot, 'site-config/settings.yaml');
	const settingsOverlay = { uri: vscode.Uri.file(settingsPath), isDirty: true, getText: () => 'url: https://docs.example.org/manual/\n' };
	documents.push(settingsOverlay);
	await registered.refresh();
	assert.equal(provider.getTreeItem(guide).tooltip, 'URL: https://docs.example.org/manual/guide/\nSlug: guide');
	assert.equal(provider.getTreeItem(guide).description, '/manual/guide/');
	assert.equal(provider.getTreeItem(home).tooltip, 'URL: https://docs.example.org/manual/');
	documents.splice(documents.indexOf(settingsOverlay), 1);
	await registered.refresh();
	assert.equal(provider.getTreeItem(guide).tooltip, 'URL: https://example.com/guide/\nSlug: guide');
	await commands.get('nornaEditor.toggleUrlPaths')();
	assert.equal(provider.getTreeItem(guide).description, '');

	assert.deepEqual(provider.getTreeItem(home).iconPath, provider.getTreeItem(guide).iconPath);
	assert.match(provider.getTreeItem(guide).iconPath.light, /media\/page-light\.svg$/);
	assert.match(provider.getTreeItem(pages).contextValue, /^nornaPages;/);
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
	assert.equal(provider.getTreeItem(home).tooltip, 'URL: https://example.com/');
	assert.equal(provider.getTreeItem(home).command.command, 'nornaEditor.openSiteNode');
	await commands.get('nornaEditor.openSiteNode')(home);
	assert.deepEqual(opened.pop(), ['vscode.open', home.sourcePath]);
	assert.match(provider.getTreeItem(image).contextValue, /^nornaImage;/);
	await commands.get('nornaEditor.openSiteNode')(image);
	assert.deepEqual(opened.pop(), ['vscode.open', image.sourcePath], 'Resources must use VS Code editor selection, not a forced text editor.');
	await commands.get('nornaEditor.pageInformation')(image);
	assert.match(errors.pop(), /Select a page/);
	assert.equal(errors.length, 0);
	forms.push(model => { assert.equal(model.parentPath, '/guide/'); return {title:'Added below guide',slug:'added-below-guide',parentPath:model.parentPath,description:'',listed:true,listChildren:false,aliases:[]}; });
	await commands.get('nornaEditor.addPage')(guidePages);
	const created = path.join(siteRoot, 'root/pages/010-guide/pages/020-added-below-guide/content.md');
	assert.match(await readFile(created, 'utf8'), /^# Added below guide\n/);
	assert.deepEqual(opened.pop(), ['text', created]);
	assert.equal(errors.length, 0, errors.join('\n'));
	const updatedHome = (await provider.getChildren()).find((node) => node.isHome && node.siteRoot === siteRoot);
	assert.equal(updatedHome, home, 'Stable node objects and IDs preserve unrelated expansion on refresh.');
	const firstChild = guidePages.children.find((node) => node.title === 'Child');
	const beforeCancel = await readdir(path.dirname(firstChild.sourcePath));
	choices.push((items) => { assert.deepEqual(items.map((item) => item.command), ['addChildPage', 'importImage', 'createSourceFile', 'createSourceFile']); return undefined; });
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
	assert.equal(commands.has('nornaEditor.pageActions'), false, 'No duplicate page action picker.');
	forms.push(() => undefined);
	await commands.get('nornaEditor.addPage')(pages);
	assert.equal(home.children.find((node) => node.role === 'pages').children.length, 1);
	await write(path.join(siteRoot, 'root/pages/020-topics/content.md'), '---\npage:\n  listChildren: true\n---\n# Topics\n');
	await registered.refresh();
	const overview = pages.children.find((node) => node.title === 'Topics');
	await write(guide.sourcePath, '---\npage:\n  aliases: &previous [/older-guide/]\n---\n# Guide\n');
	await registered.refresh();
	await commands.get('nornaEditor.movePage')(guide);
	errorReplies.push('Try another placement');
	await commands.get('nornaEditor.placeMoveFirst')(overview);
	assert.match(errorActions.at(-1).options.detail, /Cannot preserve \/guide\/.*anchors/s);
	assert.deepEqual(errorActions.at(-1).actions, ['Open affected file', 'Try another placement', 'Cancel move']);
	assert.equal(contexts.get('nornaSiteTree.moveActive'), true, 'Choosing another placement keeps the move active.');
	assert.match(errors.pop(), /Page move could not continue/);
	errorReplies.push('Open affected file');
	await commands.get('nornaEditor.placeMoveFirst')(overview);
	assert.deepEqual(opened.pop(), ['vscode.open', guide.sourcePath]);
	assert.equal(contexts.get('nornaSiteTree.moveActive'), false, 'Opening the source ends the failed move.');
	assert.match(errors.pop(), /Page move could not continue/);
	await commands.get('nornaEditor.movePage')(guide);
	errorReplies.push('Cancel move');
	await commands.get('nornaEditor.placeMoveFirst')(overview);
	assert.equal(contexts.get('nornaSiteTree.moveActive'), false, 'The error dialog can cancel the move.');
	assert.match(errors.pop(), /Page move could not continue/);
	await commands.get('nornaEditor.movePage')(guide);
	await commands.get('nornaEditor.placeMoveFirst')(overview);
	assert.equal(contexts.get('nornaSiteTree.moveActive'), false, 'Dismissing the error dialog cancels the move.');
	assert.match(errors.pop(), /Page move could not continue/);
	await write(guide.sourcePath, '# Guide\n');
	await registered.refresh();
	tree.visible = true;
	const restingGuideItem = provider.getTreeItem(guide);
	assert.equal(provider.getTreeItem(guide).collapsibleState, vscode.TreeItemCollapsibleState.Collapsed);
	await commands.get('nornaEditor.movePage')(guide);
	assert.equal(revealCalls.at(-1)?.node.id, guide.id, 'Starting a move must reveal the source instead of relying on its initial expansion state.');
	assert.deepEqual(revealCalls.at(-1)?.options, { select: true, focus: false, expand: true }, 'Explicit expansion overrides a previously collapsed native branch so Cancel is visible.');
	await commands.get('nornaEditor.cancelMove')(overview);
	assert.equal(contexts.get('nornaSiteTree.moveActive'), false, 'Cancellation from another row does not depend on the source selection.');
	assert.equal(await readFile(guide.sourcePath, 'utf8'), '# Guide\n');
	assert.doesNotMatch(provider.getTreeItem(overview).contextValue, /;moveTarget;/);
	assert.ok(!(await provider.getChildren(guide)).some(node => node.kind === 'moveAction'));
	const revealsBeforeRestart = revealCalls.length;
	await commands.get('nornaEditor.movePage')(guide);
	assert.equal(revealCalls.length, revealsBeforeRestart + 1, 'A later move must reveal cancellation again, including after the user has collapsed the source.');
	tree.visible = false;
	assert.equal(contexts.get('nornaSiteTree.moveActive'), true);
	assert.equal(tree.title, 'Site Tree', 'Move state belongs to the involved pages, not the view title.');
	assert.notEqual(tree.description, 'Guide', 'The moving page is identified at its source row.');
	assert.equal(tree.message, undefined, 'Instructions do not masquerade as tree content.');
	const sourceCancel = (await provider.getChildren(guide))[0];
	assert.equal(sourceCancel.title, 'Cancel page move', 'The source offers cancellation before a destination is chosen.');
	assert.equal(provider.getTreeItem(sourceCancel).command.command, 'nornaEditor.cancelMove');
	assert.equal(provider.getTreeItem(sourceCancel).description, undefined);
	assert.equal(provider.getTreeItem(sourceCancel).tooltip, undefined);
	assert.equal(provider.getTreeItem(sourceCancel).accessibilityInformation.label, sourceCancel.title);
	for (const field of ['label', 'description', 'iconPath', 'tooltip']) {
		assert.deepEqual(provider.getTreeItem(guide)[field], restingGuideItem[field], `Moving preserves the source ${field}.`);
	}
	await commands.get('nornaEditor.movePage')(overview);
	assert.match(information.pop(), /move is already in progress/);
	assert.equal(tree.title, 'Site Tree', 'A second move must not replace the active source.');
	assert.equal(commands.has('nornaEditor.pageActions'), false);
	await commands.get('nornaEditor.toggleUrlPaths')();
	assert.equal(provider.getTreeItem(guide).description, '/guide/', 'The move source keeps the ordinary URL path display.');
	assert.equal(provider.getTreeItem(guide).tooltip, 'URL: https://example.com/guide/\nSlug: guide');
	await commands.get('nornaEditor.toggleUrlPaths')();
	assert.equal(provider.getTreeItem(guide).contextValue, 'nornaMoveSource');
	assert.doesNotMatch(provider.getTreeItem(firstChild).contextValue, /;moveTarget;/, 'Descendants are not placement targets.');
	assert.match(provider.getTreeItem(overview).contextValue, /;moveTarget;/);
	assert.match(provider.getTreeItem(home).contextValue, /;moveTarget;/);
	await commands.get('nornaEditor.copyFolderPath')(guide);
	assert.equal(copied.pop(), path.dirname(guide.sourcePath), 'The existing folder-copy command remains callable even while hidden from the move menu.');
	assert.deepEqual(provider.getTreeItem(guide).iconPath, restingGuideItem.iconPath);
	assert.equal(provider.getTreeItem(overview).command.command, 'nornaEditor.openSiteNode');
	assert.equal(provider.getTreeItem(overview).command.title, 'Open content.md');
	await commands.get(provider.getTreeItem(overview).command.command)(overview);
	assert.deepEqual(opened.pop(), ['vscode.open', overview.sourcePath], 'Clicking a page still opens its content during a move.');
	assert.equal(contexts.get('nornaSiteTree.moveActive'), true, 'Opening content does not cancel placement.');
	await commands.get('nornaEditor.placeMoveLast')(home);
	const homePreview = (await provider.getChildren(pages)).find(node => node.kind === 'movePreview');
	const homeActions = await provider.getChildren(homePreview);
	assert.equal(homeActions[0].title, `Complete move last under “${home.title}”`, 'Sibling reordering describes placement instead of repeating the URL.');
	assert.equal(homeActions[1].title, 'Cancel page move');
	await commands.get('nornaEditor.placeMoveAfter')(overview);
	assert.equal(tree.message, undefined, 'The destination preview carries its own actions.');
	const movedPreview = (await provider.getChildren(pages)).at(-1);
	assert.equal(provider.getTreeItem(movedPreview).contextValue, 'nornaMovePreview');
	assert.equal(movedPreview.title, 'Guide');
	assert.equal(provider.getTreeItem(movedPreview).description, undefined);
	assert.deepEqual(provider.getTreeItem(movedPreview).iconPath, restingGuideItem.iconPath);
	assert.equal(provider.getTreeItem(movedPreview).collapsibleState, vscode.TreeItemCollapsibleState.Expanded);
	const [completeMove, cancelMove, addresses, links] = await provider.getChildren(movedPreview);
	assert.equal(completeMove.title, 'Complete move after “Topics”');
	assert.equal(cancelMove.title, 'Cancel page move');
	assert.equal(provider.getTreeItem(cancelMove).description, undefined);
	assert.equal(provider.getTreeItem(cancelMove).tooltip, undefined);
	assert.equal(provider.getTreeItem(completeMove).description, undefined);
	assert.equal(provider.getTreeItem(completeMove).accessibilityInformation.label, completeMove.title);
	assert.equal(provider.getTreeItem(completeMove).command.command, 'nornaEditor.acceptMovePreview');
	assert.equal(provider.getTreeItem(completeMove).iconPath.color.id, 'notificationsInfoIcon.foreground');
	assert.equal(provider.getTreeItem(cancelMove).command.command, 'nornaEditor.cancelMove');
	assert.equal(addresses.title, 'Affected addresses');
	assert.match(provider.getTreeItem(addresses).description, /Unchanged: \/guide\//);
	assert.equal(links.title, 'Authored links to update');
	assert.equal((await provider.getChildren(movedPreview)).length, 4, 'Only completion, cancellation, addresses and links remain.');
	assert.equal(provider.getParent(completeMove), movedPreview);
	assert.equal(provider.getParent(guide.children[0]), guide);
	assert.equal((await provider.getChildren(pages)).some((entry) => entry.id === guide.id), true, 'The source stays at its real location until files move.');
	await commands.get('nornaEditor.acceptMovePreview')();
	assert.deepEqual(warningActions.pop().actions, ['Complete page move'], 'Reordering keeps the existing confirmation without an alias checkbox.');
	information.pop();

	await commands.get('nornaEditor.placeMoveFirst')(firstChild);
	assert.match(information.pop(), /outside the branch/);
	await commands.get('nornaEditor.placeMoveFirst')(overview);
	const previewFolder = (await provider.getChildren(overview)).at(-1);
	assert.equal(provider.getTreeItem(previewFolder).contextValue, 'nornaMovePreviewPages');
	assert.equal((await provider.getChildren(previewFolder))[0].title, 'Guide');
	const crossParentPreview = (await provider.getChildren(previewFolder))[0];
	assert.equal(provider.getTreeItem(crossParentPreview).description, undefined);
	assert.equal((await provider.getChildren(crossParentPreview))[0].title, 'Complete move from /guide/ to /topics/guide/');
	assert.equal((await provider.getChildren(crossParentPreview))[1].title, 'Cancel page move');
	assert.equal((await provider.getChildren(guide))[0].title, 'Cancel page move');
	await commands.get('nornaEditor.toggleUrlPaths')();
	assert.equal(provider.getTreeItem(crossParentPreview).description, '/topics/guide/');
	assert.equal(provider.getTreeItem(guide).description, '/guide/');
	await commands.get('nornaEditor.toggleUrlPaths')();
	const crossParentAddresses = (await provider.getChildren(crossParentPreview))[2];
	assert.ok((await provider.getChildren(crossParentAddresses)).some((row) => row.title === '/guide/' && row.description === '→ /topics/guide/'));
	await commands.get(provider.getTreeItem(completeMove).command.command)();
	assert.match(moveConfirmations.at(-1), /Complete page move/);
	assert.match(moveConfirmations.at(-1), /Preserve old addresses as aliases/);
	assert.equal(await readFile(guide.sourcePath, 'utf8'), '# Guide\n', 'Cancelling the confirmation keeps the source in place.');
	moveResponses.push(async ({ receive, replies }) => {
		await write(guide.sourcePath, '# Guide changed after preview\n');
		await receive({ type: 'complete', preserveAliases: false });
		assert.match(replies.at(-1).message, /site changed/);
		await write(guide.sourcePath, '# Guide\n');
		await receive({ type: 'cancel' });
	});
	await commands.get('nornaEditor.acceptMovePreview')();
	moveResponses.push(async ({ receive, replies }) => {
		await commands.get('nornaEditor.cancelMove')();
		await receive({ type: 'complete', preserveAliases: false });
		assert.match(replies.at(-1).message, /cancelled or changed/);
		await receive({ type: 'cancel' });
	});
	await commands.get('nornaEditor.acceptMovePreview')();
	assert.equal(await readFile(guide.sourcePath, 'utf8'), '# Guide\n');

	await commands.get(provider.getTreeItem(cancelMove).command.command)();
	assert.equal(contexts.get('nornaSiteTree.moveActive'), false);
	assert.equal(tree.title, 'Site Tree');
	assert.equal(provider.getTreeItem(overview).command.command, 'nornaEditor.openSiteNode');
	choices.push((items) => { assert.deepEqual(items.map((item) => item.command), ['addChildPage', 'importImage', 'createSourceFile', 'createSourceFile']); return undefined; });
	await commands.get('nornaEditor.addToPage')(overview);
	assert.equal(provider.getTreeItem(overview).command.command, 'nornaEditor.openSiteNode');
	await commands.get('nornaEditor.openSiteNode')(overview);
	assert.deepEqual(opened.pop(), ['vscode.open', overview.sourcePath]);
	assert.match(provider.getTreeItem(overview).iconPath.light, /media\/page-list-light\.svg$/);
	const leaf = guidePages.children.find((node) => node.title === 'Added below guide');
	assert.equal(provider.getTreeItem(leaf).collapsibleState, vscode.TreeItemCollapsibleState.None, 'An empty images folder is hidden; Add stays on the page.');
	await rm(path.join(path.dirname(leaf.sourcePath), 'images'), { recursive: true });
	await registered.refresh();
	assert.equal(provider.getTreeItem(leaf).collapsibleState, vscode.TreeItemCollapsibleState.None);
	choices.push((items) => items.find((item) => item.filename?.endsWith('/tree-theme.yaml')));
	choices.push(() => undefined);
	await commands.get('nornaEditor.addToPage')(leaf);
	assert.deepEqual(await readdir(path.dirname(leaf.sourcePath)), ['content.md']);
	choices.push((items) => items.find((item) => item.filename?.endsWith('/tree-theme.yaml')));
	choices.push((items) => { assert.match(items[0].description, /modifies inherited values/); return items[0]; });
	await commands.get('nornaEditor.addToPage')(leaf);
	assert.doesNotMatch(await readFile(path.join(path.dirname(leaf.sourcePath), 'tree-theme.yaml'), 'utf8'), /^preset:/m, 'Creating local modifications must preserve inheritance.');
	assert.deepEqual(opened.pop(), ['text', path.join(path.dirname(leaf.sourcePath), 'tree-theme.yaml')]);
	assert.equal(provider.getTreeItem(leaf).collapsibleState, vscode.TreeItemCollapsibleState.Collapsed);
	choices.push((items) => { assert.deepEqual(items.map((item) => item.command), ['addChildPage', 'importImage', 'createSourceFile']); return undefined; });
	await commands.get('nornaEditor.addToPage')(leaf);
	const leafTheme = leaf.children[0];
	await write(leafTheme.sourcePath, 'layout:\n  textWidth: impossible\n');
	await registered.refresh();
	assert.match(provider.getTreeItem(leafTheme).description, /error/);
	assert.match(provider.getTreeItem(leafTheme).tooltip, /Preset unavailable/);
	assert.equal(provider.getTreeItem(leafTheme).iconPath.id, 'file', 'Errors must preserve the file type.');
	await commands.get('nornaEditor.toggleUrlPaths')();
	assert.match(provider.getTreeItem(leaf).description, /error.*\/guide\/added-below-guide\//, 'Paths preserve the owning page error indicator.');
	await commands.get('nornaEditor.toggleUrlPaths')();
	await write(leafTheme.sourcePath, 'layout:\n  textWidth: normal\n');
	await registered.refresh();
	assert.equal(provider.getTreeItem(leafTheme).description, '', 'Repair must clear old issues on reused nodes.');
	assert.match(provider.getTreeItem(leafTheme).tooltip, /Preset: documentation/);
	assert.doesNotMatch(provider.getTreeItem(leafTheme).tooltip, /Preset unavailable/);
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
	const blockedPath = path.join(path.dirname(leaf.sourcePath), 'tree-theme.yaml');
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
	const externalImage = path.join(siteRoot, 'root/images/external.png');
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
		await openTab(path.join(root, 'root/content.md'));
		assert.deepEqual(await provider.getChildren(), roots, 'An unrelated active editor must not add or switch site roots.');
		assert.equal(revealed.length, count, 'An unrelated file must not reveal a row from another site.');
		assert.equal(state.get('norna.siteTree.activeSite'), siteRoot);
	}
	// Dirty titles belong to the selected site without moving source bytes.
	const homePath = path.join(siteRoot, 'root/content.md');
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
	assert.equal((await provider.getChildren()).find((node) => node.isHome).title, 'Unsaved Home');
	assert.match(provider.getTreeItem(home).description, /Homepage.*unsaved/);
	assert.equal(await readFile(homePath, 'utf8'), originalHome);
	const dirtyGuideTheme = { uri: vscode.Uri.file(path.join(path.dirname(guide.sourcePath), 'theme.yaml')), isDirty: true, getText: () => 'layout: {}\n' };
	documents.push(dirtyGuideTheme);
	await commands.get('nornaEditor.toggleUrlPaths')();
	assert.match(provider.getTreeItem(guide).description, /unsaved.*\/guide\//, 'Paths preserve the owning page dirty indicator.');
	await commands.get('nornaEditor.toggleUrlPaths')();
	assert.match(provider.getTreeItem(pages).description, /1 unsaved page below/, 'A collapsed Pages row points to dirty pages.');
	assert.match(provider.getTreeItem(home).description, /1 unsaved page below/, 'A parent page points to dirty descendants.');
	documents.pop();
	dirty.isDirty = false;
	documentSaves.fire(dirty);
	await new Promise((resolve) => setTimeout(resolve, 250));
	assert.doesNotMatch(provider.getTreeItem(home).description, /unsaved/, 'Saving clears the tree marker.');
	documents.pop();
	await registered.refresh();
	await write(homePath, '# Home\n\n[Guide](/guide/)\n');
	await commands.get('nornaEditor.movePage')(guide);
	await commands.get('nornaEditor.placeMoveFirst')(overview);
	moveResponses.push(true);
	await commands.get('nornaEditor.acceptMovePreview')();
	const movedGuide = path.join(siteRoot, 'root/pages/020-topics/pages/500-guide/content.md');
	assert.match(await readFile(movedGuide, 'utf8'), /- \/guide\//, 'The move preserves the old page URL.');
	assert.match(await readFile(homePath, 'utf8'), /\[Guide\]\(\/topics\/guide\/\)/, 'The move updates known internal links.');
	const movedNode = (await provider.getChildren(overview)).find(node => node.role === 'pages').children.find(node => node.title === 'Guide');
	await commands.get('nornaEditor.movePage')(movedNode);
	await commands.get('nornaEditor.placeMoveFirst')(home);
	moveResponses.push(false);
	await commands.get('nornaEditor.acceptMovePreview')();
	assert.equal(errors.length, 0, errors.join('\n'));
	const returnedNode = (await provider.getChildren(home)).find(node => node.role === 'pages').children.find(node => node.title === 'Guide');
	assert.equal(returnedNode.url, '/guide/');
	assert.doesNotMatch(await readFile(returnedNode.sourcePath, 'utf8'), /aliases:/, 'Unchecked confirmation must create no alias for the old parent path.');

	await chooseSite(legacySite);
	const [legacy] = await provider.getChildren();
	assert.equal(legacy.kind, 'site', 'An older engine retains its page-only tree within the selected site.');
	assert.match(tree.message, /pages only/);
	assert.equal((await provider.getChildren(legacy))[0].title, 'Home');
	assert.equal(provider.getTreeItem(legacy.children[0]).command.command, 'nornaEditor.openSiteNode', 'Old engines still need page-label source opening.');
	assert.deepEqual(await provider.getChildren(home), [], 'Old handles cannot expose another site’s children.');
	await commands.get('nornaEditor.copyFolderPath')(guide);
	assert.match(errors.pop(), /active site/);
	assert.deepEqual(copied, [], 'An inactive site handle must not copy a path.');
	await commands.get('nornaEditor.addPage')(pages);
	assert.match(errors.pop(), /active site/, 'Stale commands must not create in an inactive site.');
	tree.selection = [guide];
	vscode.window.tabGroups.activeTabGroup.activeTab = { input: { uri: vscode.Uri.file(path.join(outsideSite, 'root/content.md')) } };
	inputs.push(undefined);
	await commands.get('nornaEditor.newPage')();
	assert.equal(inputs.length, 0, 'An inactive selection must fall back to the chosen site, without a foreign-parent prompt.');
	tree.selection = [];
	assert.equal(provider.getTreeItem(legacy.children[0]).tooltip, 'URL: /', 'Older engines without address support keep the known path.');
	await commands.get('nornaEditor.toggleUrlPaths')();
	// A reload restores the explicit site rather than following the open file.
	for (const subscription of context.subscriptions) subscription.dispose();
	context = { subscriptions: [], workspaceState, asAbsolutePath: (relative) => path.join(extensionRoot, relative) };
	registered = module.exports.registerSiteTree(context, { appendLine() {} });
	await registered.refresh();
	assert.equal((await provider.getChildren())[0].siteRoot, legacySite);
	assert.equal(contexts.get('nornaSiteTree.showUrlPaths'), true);
	assert.equal(provider.getTreeItem((await provider.getChildren())[0].children[0]).description, 'Homepage · /');
	await commands.get('nornaEditor.toggleUrlPaths')();
	// Even an overbroad discovery result cannot escape workspace membership.
	discoveredRoots.push(outsideSite);
	vscode.workspace.workspaceFolders = [{ uri: vscode.Uri.file(siteRoot) }];
	workspaceChanges.fire();
	await new Promise((resolve) => setTimeout(resolve, 250));
	await registered.refresh();
	assert.equal((await provider.getChildren()).length, 3);
	assert.equal((await provider.getChildren()).find((node) => node.isHome).siteRoot, siteRoot, 'Removing the selected folder selects the only remaining workspace site.');
	const restoredConfiguration = (await provider.getChildren()).find((node) => node.kind === 'directory' && node.role === 'configuration');
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
	assert.equal((await provider.getChildren()).find((node) => node.isHome).siteRoot, siteRoot, 'A missing required file must not switch the active site.');
	assert.match(provider.getTreeItem((await provider.getChildren()).find((node) => node.role === 'configuration')).description, /error/);
	assert.ok(treeDiagnostics.get(path.join(siteRoot, 'site-config/settings.yaml'))?.length, 'Report a site configuration problem at its own file.');
	assert.equal(provider.getTreeItem((await provider.getChildren()).find((node) => node.isHome)).tooltip, 'URL: /', 'Missing settings must clear the previous domain.');
	await rm(homePath);
	await registered.refresh();
	const damagedHome = (await provider.getChildren()).find((node) => node.isHome);
	assert.equal(damagedHome.kind, 'incomplete');
	assert.equal(damagedHome.themeHelp, undefined, 'A repaired/changed node must not retain a previous page theme summary.');
	assert.match(provider.getTreeItem(damagedHome).contextValue, /^nornaIncomplete;/);
	assert.equal(provider.getTreeItem(damagedHome).command.command, 'nornaEditor.addToPage');
	choices.push((items) => { assert.ok(items.some((item) => item.filename === homePath)); assert.ok(items.every((item) => item.command === 'createSourceFile')); return undefined; });
	await commands.get('nornaEditor.addToPage')(damagedHome);
	choices.push((items) => items.find((item) => item.filename === path.join(siteRoot, 'site-config/settings.yaml')));
	inputs.push('https://example.com/'); choices.push((items) => items[0]);
	await commands.get('nornaEditor.addToPage')(configuration);
	assert.match(await readFile(path.join(siteRoot, 'site-config/settings.yaml'), 'utf8'), /example.com/);
	assert.equal(treeDiagnostics.has(path.join(siteRoot, 'site-config/settings.yaml')), false, 'Repair clears the site-level diagnostic without a homepage.');
	for (const subscription of context.subscriptions) subscription.dispose();
	context = { subscriptions: [], workspaceState, asAbsolutePath: (relative) => path.join(extensionRoot, relative) };
	registered = module.exports.registerSiteTree(context, { appendLine() {} });
	await registered.refresh();
	assert.equal((await provider.getChildren()).find((node) => node.isHome).siteRoot, siteRoot, 'Reload must retain the damaged chosen site.');
	choices.push((items) => items.find((item) => item.filename === homePath));
	inputs.push('Repaired Home'); choices.push((items) => items[0]);
	await commands.get('nornaEditor.addToPage')((await provider.getChildren()).find((node) => node.isHome));
	assert.equal((await provider.getChildren()).find((node) => node.isHome).title, 'Repaired Home');
	await rm(path.join(siteRoot, 'root'), { recursive: true });
	await write(path.join(siteRoot, 'root'), 'Not a directory');
	await registered.refresh();
	assert.ok(treeDiagnostics.get(path.join(siteRoot, 'root'))?.some((entry) => /Cannot read/.test(entry.message)), 'An unreadable root page directory reports its own error without a homepage row.');
	assert.ok((await provider.getChildren()).some((node) => node.role === 'configuration'), 'Site resources remain accessible.');
	assert.equal(await readFile(path.join(outsideSite, 'root/content.md'), 'utf8'), '# Home\n');
	assert.equal(errors.length, 0, errors.join('\n'));
	console.log('VS Code tree adapter contract passed: one active workspace site, explicit choice/cancellation, reload/removal, external files, dirty sources, guarded commands, physical ownership, refresh/reveal coordination and older-engine fallback.');
} finally {
	for (const subscription of context.subscriptions) subscription.dispose();
	await rm(temporary, { recursive: true, force: true });
}
