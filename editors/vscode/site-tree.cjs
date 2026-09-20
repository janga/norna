const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { getNornaProjectContext } = require('./norna-project.cjs');

const viewId = 'nornaSiteTree';
const sourceNames = new Set(['content.md', 'category.yaml']);
const isPage = (node) => node?.kind === 'page' || node?.kind === 'category';
const inside = (root, file) => {
	const relative = path.relative(root, file);
	return relative === '' || (!relative.startsWith(`..${path.sep}`) && relative !== '..' && !path.isAbsolute(relative));
};

function registerSiteTree(context, output) {
	const vscode = require('vscode');
	const sites = new Map();
	const nodes = new Map();
	const services = new Map();
	const timers = new Map();
	const changed = new vscode.EventEmitter();
	const diagnostics = vscode.languages.createDiagnosticCollection('norna-site-tree');
	let treeWork = Promise.resolve();
	let reading = Promise.resolve();
	let disposed = false;
	// A refresh invalidates VS Code's handles. Keep it out of an in-flight
	// reveal, including reveals triggered by opening a newly created source.
	const enqueueTreeWork = (action) => {
		const next = treeWork.catch(() => {}).then(() => disposed ? undefined : action());
		treeWork = next;
		return next;
	};
	const labelFor = (root) => vscode.workspace.asRelativePath(root, false);
	const documentSources = () => new Map(vscode.workspace.textDocuments
		.filter((document) => document.uri.scheme === 'file' && document.isDirty)
		.map((document) => [document.uri.fsPath, document.getText()]));

	const serviceFor = async (root) => {
		if (!vscode.workspace.isTrusted) throw new Error('Trust this workspace before using the Norna site tree.');
		const project = getNornaProjectContext(path.join(root, 'config.yaml'));
		if (!project?.nornaPackage) throw new Error('Install this project’s @janga/norna dependency to use the site tree.');
		if (!project.editorCompatible || !project.schemaCompatible) throw new Error('Update the Norna extension and project engine to compatible versions.');
		const filename = path.join(project.nornaPackage.root, 'scripts', 'lib', 'editor-site-tree.mjs');
		if (!fs.existsSync(filename)) throw new Error('This project’s Norna engine does not provide the site tree. Update the engine to a version with site-tree support.');
		const revision = `${project.nornaPackage.packageJson.version}-${fs.statSync(filename).mtimeMs}`;
		const key = `${filename}:${revision}`;
		if (!services.has(key)) services.set(key, import(`${pathToFileURL(filename).href}?revision=${encodeURIComponent(revision)}`));
		const service = await services.get(key);
		if (service.siteTreeApiVersion !== 1) throw new Error('This engine uses an incompatible site-tree API. Update the Norna extension.');
		return service;
	};

	const rememberSite = (filename) => {
		const project = getNornaProjectContext(filename);
		if (!project) return null;
		const root = project.siteRoot;
		if (!sites.has(root)) sites.set(root, { id: root, siteRoot: root, kind: 'site', title: labelFor(root), children: [], cache: new Map() });
		return sites.get(root);
	};

	const publishDiagnostics = () => {
		diagnostics.clear();
		for (const site of sites.values()) {
			const byFile = new Map();
			const add = (filename, message) => {
				if (!byFile.has(filename)) byFile.set(filename, new Set());
				byFile.get(filename).add(message);
			};
			for (const node of nodes.values()) if (node.siteRoot === site.siteRoot && node.problem) add(node.sourcePath, node.problem);
			for (const problem of site.problems ?? []) add(sourceNames.has(path.basename(problem.path)) ? problem.path : path.join(site.siteRoot, 'config.yaml'), problem.message);
			for (const [filename, messages] of byFile) diagnostics.set(vscode.Uri.file(filename), [...messages].map((message) => {
				const diagnostic = new vscode.Diagnostic(new vscode.Range(0, 0, 0, 1), message, vscode.DiagnosticSeverity.Error);
				diagnostic.source = 'Norna site tree';
				return diagnostic;
			}));
		}
	};

	const refreshSite = async (site) => {
		try {
			const service = await serviceFor(site.siteRoot);
			const supportsFiles = service.siteFileTreeApiVersion === 1 && typeof service.readSiteFileTree === 'function';
			const snapshot = await (supportsFiles ? service.readSiteFileTree : service.readSiteTree)({
				siteRoot: site.siteRoot, sources: documentSources(), cache: site.cache,
			});
			const previous = new Map([...nodes].filter(([, node]) => node.siteRoot === site.siteRoot));
			for (const id of previous.keys()) nodes.delete(id);
			site.children = [];
			site.problem = null;
			site.problems = snapshot.problems;
			site.fileTree = Array.isArray(snapshot.items);
			if (site.fileTree) {
				for (const entry of snapshot.items) {
					const node = Object.assign(previous.get(entry.id) ?? {}, entry, { siteRoot: site.siteRoot, children: [] });
					nodes.set(node.id, node);
				}
				for (const entry of snapshot.items) {
					const node = nodes.get(entry.id);
					node.parent = nodes.get(entry.parentId);
					(node.parent?.children ?? site.children).push(node);
				}
			} else {
				const byPath = new Map();
				for (const entry of snapshot.nodes) {
					const id = entry.sourcePath;
					const node = Object.assign(previous.get(id) ?? {}, entry, { id, siteRoot: site.siteRoot, children: [] });
					node.parent = byPath.get(entry.parentPagePath) ?? site;
					node.parent.children.push(node);
					byPath.set(entry.pagePath, node);
					nodes.set(id, node);
				}
			}
			const visibility = (node) => {
				node.hiddenFromNavigation = node.listed === false || node.parent?.hiddenFromNavigation === true;
				node.children.forEach(visibility);
			};
			site.children.forEach(visibility);
		} catch (error) {
			if (site.problem !== error.message) output.appendLine(`Site tree: ${site.siteRoot}: ${error.message}`);
			site.problem = error.message;
			site.fileTree = false;
			site.children = [];
			site.problems = [];
			for (const [id, node] of nodes) if (node.siteRoot === site.siteRoot) nodes.delete(id);
		}
	};

	const provider = {
		onDidChangeTreeData: changed.event,
		// reveal() asks for children itself: waiting for queued work here would
		// deadlock when a refresh is queued behind that reveal.
		getChildren: async (node) => { await reading; return node ? node.children : [...sites.values()].flatMap((site) => site.fileTree ? site.children : [site]); },
		getParent: (node) => node.parent,
		getTreeItem: (node) => {
			const item = new vscode.TreeItem(node.title, node.children.length ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None);
			item.id = node.id;
			item.contextValue = node.kind === 'site' ? (node.problem ? 'nornaSiteUnavailable' : 'nornaSite')
				: node.kind === 'directory' ? node.role === 'pages' ? 'nornaPages' : 'nornaDirectory'
					: node.kind === 'file' ? 'nornaFile' : node.isHome ? 'nornaHome' : node.kind === 'category' ? 'nornaCategory' : 'nornaPage';
			const unsaved = vscode.workspace.textDocuments.some((document) => document.uri.fsPath === node.sourcePath && document.isDirty);
			item.description = [node.problem ? 'needs attention' : isPage(node) && node.hiddenFromNavigation ? 'unlisted' : node.kind === 'category' ? 'category' : '',
				node.isHome && sites.size > 1 ? labelFor(node.siteRoot) : '', unsaved ? 'unsaved' : ''].filter(Boolean).join(' · ');
			item.iconPath = new vscode.ThemeIcon(node.problem ? 'warning' : node.kind === 'site' ? 'globe'
				: node.kind === 'category' || node.kind === 'directory' ? 'folder' : 'file');
			item.tooltip = [node.title, node.description, node.url, node.sourcePath ?? node.siteRoot, node.problem].filter(Boolean).join('\n');
			if (node.sourcePath) {
				item.resourceUri = vscode.Uri.file(node.sourcePath);
				if (node.kind !== 'directory') item.command = { command: 'nornaEditor.openSiteNode', title: 'Open Source', arguments: [node] };
			}
			return item;
		},
	};
	const tree = vscode.window.createTreeView(viewId, { treeDataProvider: provider, showCollapseAll: true });

	const activeUri = () => vscode.window.tabGroups.activeTabGroup.activeTab?.input?.uri ?? vscode.window.activeTextEditor?.document.uri;
	const activeNode = () => {
		const uri = activeUri();
		if (uri?.scheme !== 'file') return undefined;
		return nodes.get(uri.fsPath) ?? nodes.get(`resource:${uri.fsPath}`);
	};
	const ownerOf = (node) => isPage(node) || node?.kind === 'site' ? node : nodes.get(node?.ownerId);
	const revealActive = () => enqueueTreeWork(async () => {
		const node = activeNode();
		if (node && tree.visible) await tree.reveal(node, { select: true, focus: false, expand: false });
	});
	const refresh = ({ discover = false } = {}) => enqueueTreeWork(async () => {
		reading = (async () => {
			if (discover) {
				const configs = await vscode.workspace.findFiles('**/config.yaml', '**/{node_modules,.git,.norna,.vscode-test,dist,marketing}/**');
				for (const uri of configs) rememberSite(uri.fsPath);
			}
			const active = activeUri();
			if (active?.scheme === 'file') rememberSite(active.fsPath);
			for (const [root, site] of sites) {
				if (!fs.existsSync(path.join(root, 'config.yaml'))) {
					sites.delete(root);
					for (const [id, node] of nodes) if (node.siteRoot === root) nodes.delete(id);
				} else await refreshSite(site);
			}
			publishDiagnostics();
			tree.message = !sites.size ? 'Open a Norna site folder or one of its source files.'
				: [...sites.values()].some((site) => !site.fileTree && !site.problem)
					? 'Some sites show pages only. Update their Norna engine and root-page format to browse configuration, images and public files.' : undefined;
		})();
		await reading;
		if (!disposed) changed.fire();
	});
	const schedule = (key, action) => {
		clearTimeout(timers.get(key));
		timers.set(key, setTimeout(() => {
			timers.delete(key);
			if (!disposed) void action().catch((error) => output.appendLine(`Site tree: ${error.message}`));
		}, 180));
	};
	const updateDocument = (document) => enqueueTreeWork(async () => {
		const node = nodes.get(document.uri.fsPath);
		if (!isPage(node)) {
			const resource = nodes.get(`resource:${document.uri.fsPath}`);
			if (resource) changed.fire(resource);
			return;
		}
		const version = document.version;
		const service = await serviceFor(node.siteRoot);
		const information = await service.getSiteNodeInformation({ kind: node.kind, isHome: node.isHome,
			source: document.getText(), sourcePath: node.sourcePath, fallbackTitle: node.pageId });
		if (document.version !== version || nodes.get(node.id) !== node) return;
		Object.assign(node, information);
		const visibility = (entry) => {
			entry.hiddenFromNavigation = entry.listed === false || entry.parent?.hiddenFromNavigation === true;
			entry.children.forEach(visibility);
			changed.fire(entry);
		};
		visibility(node);
		publishDiagnostics();
	});

	const chooseNode = async (argument) => {
		await treeWork;
		const selected = nodes.get(argument?.id) ?? sites.get(argument?.id) ?? tree.selection[0] ?? activeNode();
		if (selected) return selected;
		const entries = [...sites.values()].map((site) => ({ label: site.title, description: site.problem, site }));
		if (!entries.length) throw new Error('Open a Norna site before using this action.');
		return (entries.length === 1 ? entries[0] : await vscode.window.showQuickPick(entries, { title: 'Choose a Norna site' }))?.site;
	};
	const openNode = async (argument) => {
		const node = await chooseNode(argument);
		if (node?.sourcePath && node.kind !== 'directory') await vscode.commands.executeCommand('vscode.open', vscode.Uri.file(node.sourcePath), { preview: true });
	};
	const oneLine = (value) => !value.trim() || /[\r\n]/.test(value) ? 'Enter a non-empty, single line of text.' : undefined;
	const create = async (kind, argument) => {
		const target = await chooseNode(argument);
		const selected = ownerOf(target);
		if (!selected) return;
		const service = await serviceFor(selected.siteRoot);
		let parentPath = '/';
		if (target.kind === 'directory' && target.role === 'pages') parentPath = selected.url;
		else if (selected.kind !== 'site') {
			const rootPage = selected.isHome && selected.sourcePath === path.join(selected.siteRoot, 'content.md');
			const parent = ownerOf(selected.parent);
			const choices = [
				...(!selected.isHome || rootPage ? [{ label: `Inside “${selected.title}”`, description: selected.url, parentPath: selected.url }] : []),
				...(!rootPage ? [{ label: `Beside “${selected.title}”`, description: parent?.url ?? '/', parentPath: parent?.url ?? '/' }] : []),
				...(!rootPage && parent?.url && parent.url !== '/' ? [{ label: 'At site root', description: '/', parentPath: '/' }] : []),
			];
			const choice = await vscode.window.showQuickPick(choices, { title: `New ${kind}: ${labelFor(selected.siteRoot)}`, placeHolder: 'Choose where to create it', ignoreFocusOut: true });
			if (!choice) return;
			parentPath = choice.parentPath;
		}
		const title = await vscode.window.showInputBox({ title: `New ${kind}`, prompt: kind === 'page' ? 'Page title' : 'Navigation category label', validateInput: oneLine, ignoreFocusOut: true });
		if (title === undefined) return;
		const options = { siteRoot: selected.siteRoot, kind, title, parentPath };
		const slug = await vscode.window.showInputBox({ title: `New ${kind}`, prompt: 'URL segment (lowercase letters, numbers and hyphens)', value: service.slugifyAsciiIdentifier(title), ignoreFocusOut: true,
			validateInput: async (value) => { try { await service.planSiteNodeCreation({ ...options, slug: value }); } catch (error) { return error.message; } return undefined; } });
		if (slug === undefined) return;
		const plan = await service.planSiteNodeCreation({ ...options, slug });
		const confirm = await vscode.window.showQuickPick([{ label: `Create ${kind}`, description: `${kind === 'category' ? 'Child URL prefix: ' : ''}${plan.url}`, detail: labelFor(plan.destination) }],
			{ title: `Create “${title}” in ${labelFor(selected.siteRoot)}`, placeHolder: 'Review the location; Escape cancels without creating files', ignoreFocusOut: true });
		if (!confirm) return;
		const created = await service.createSiteNode(plan);
		await refresh();
		await vscode.window.showTextDocument(vscode.Uri.file(created.sourcePath), { preview: false });
		await revealActive();
	};

	const editInformation = async (argument) => {
		const node = await chooseNode(argument);
		if (!isPage(node)) throw new Error('Select a page or navigation category to edit its information.');
		const service = await serviceFor(node.siteRoot);
		const document = await vscode.workspace.openTextDocument(vscode.Uri.file(node.sourcePath));
		const info = await service.getSiteNodeInformation({ kind: node.kind, isHome: node.isHome, source: document.getText(), sourcePath: node.sourcePath });
		if (info.problem) throw new Error(`${info.problem} Open the source to repair it.`);
		const version = document.version;
		const selected = await vscode.window.showQuickPick([
			{ label: node.kind === 'category' ? 'Label' : 'Title', description: info.title, field: 'title' },
			{ label: 'Description', description: info.description || 'Not set', field: 'description' },
			...(node.kind === 'page' ? [{ label: 'Navigation', description: node.isHome ? 'Home is always listed' : info.listed ? 'Listed' : 'Unlisted (still published)', field: node.isHome ? null : 'listed' }] : []),
			{ label: 'Location', kind: vscode.QuickPickItemKind.Separator },
			{ label: node.kind === 'category' ? 'Category URL' : 'Current URL', description: node.url, detail: 'Read-only; select to copy', copy: node.url },
			{ label: 'Source file', description: labelFor(node.sourcePath), detail: 'Select to open', open: true },
			...(node.kind === 'page' ? [{ label: 'Previous URLs', description: info.aliases.join(', ') || 'None', detail: 'Read-only; select to copy', copy: info.aliases.join('\n') }] : []),
		], { title: `Page Information: ${info.title}`, ignoreFocusOut: true });
		if (!selected) return;
		if (selected.open) return openNode(node);
		if (selected.copy !== undefined) return vscode.env.clipboard.writeText(selected.copy);
		if (!selected.field) return;
		let value;
		if (selected.field === 'listed') {
			const visibility = await vscode.window.showQuickPick([
				{ label: 'Listed', description: 'Include this page and its descendants in generated navigation', value: true },
				{ label: 'Unlisted', description: 'Omit this branch from navigation; its pages remain published', value: false },
			], { title: `Navigation: ${info.title}`, ignoreFocusOut: true });
			if (!visibility) return;
			value = visibility.value;
		} else {
			value = await vscode.window.showInputBox({ title: `${selected.label}: ${info.title}`, value: info[selected.field],
				prompt: selected.field === 'title' ? 'Changes the displayed title; the URL and authored link text stay the same.' : 'A short introduction; leave empty to remove it.',
				validateInput: selected.field === 'title' ? oneLine : (text) => /[\r\n]/.test(text) ? 'Use a single line of text.' : undefined, ignoreFocusOut: true });
			if (value === undefined) return;
		}
		if (document.version !== version) throw new Error('The source changed while Page Information was open. Open it again to edit the current values.');
		const edits = await service.editSiteNodeInformation({ siteRoot: node.siteRoot, sourcePath: node.sourcePath, source: document.getText(), field: selected.field, value });
		if (document.version !== version) throw new Error('The source changed. Try Page Information again.');
		const editor = await vscode.window.showTextDocument(document, { preview: false });
		const applied = await editor.edit((builder) => {
			for (const edit of edits) builder.replace(new vscode.Range(document.positionAt(edit.start), document.positionAt(edit.end)), edit.text);
		}, { undoStopBefore: true, undoStopAfter: true });
		if (!applied) throw new Error('The edit could not be applied. Open Page Information again.');
		await updateDocument(document);
	};

	const register = (name, callback) => context.subscriptions.push(vscode.commands.registerCommand(name, async (...args) => {
		try { return await callback(...args); } catch (error) {
			output.appendLine(`Site tree: ${error.stack ?? error.message}`);
			void vscode.window.showErrorMessage(`Norna: ${error.message}`);
		}
	}));
	register('nornaEditor.openSiteNode', openNode);
	register('nornaEditor.newPage', (node) => create('page', node));
	register('nornaEditor.addPage', (node) => create('page', node));
	register('nornaEditor.newCategory', (node) => create('category', node));
	register('nornaEditor.pageInformation', editInformation);
	register('nornaEditor.refreshSiteTree', async () => { services.clear(); await refresh({ discover: true }); await revealActive(); });
	const watcher = vscode.workspace.createFileSystemWatcher('**/{content.md,category.yaml,config.yaml,theme.yaml,page-theme.yaml,sitewide-content.yaml}');
	const directoryWatcher = vscode.workspace.createFileSystemWatcher('**/{pages,images,public}', false, true, false);
	const resourceWatcher = vscode.workspace.createFileSystemWatcher('**/{pages,images,public}/**', false, true, false);
	const fileChanged = (uri) => {
		if (uri.fsPath.split(path.sep).some((part) => ['.norna', 'node_modules', '.git'].includes(part))) return;
		if ([...sites.keys()].some((root) => inside(root, uri.fsPath)) || path.basename(uri.fsPath) === 'config.yaml') {
			schedule('filesystem', () => refresh({ discover: path.basename(uri.fsPath) === 'config.yaml' }));
		}
	};
	const followActive = async () => {
		const uri = activeUri();
		if (uri?.scheme !== 'file') return;
		const site = rememberSite(uri.fsPath);
		if (!site) return;
		if (!site.children.length || !activeNode()) await refresh();
		await revealActive();
	};
	context.subscriptions.push(tree, changed, diagnostics, watcher, directoryWatcher, resourceWatcher,
		watcher.onDidCreate(fileChanged), watcher.onDidDelete(fileChanged), watcher.onDidChange(fileChanged),
		directoryWatcher.onDidCreate(fileChanged), directoryWatcher.onDidDelete(fileChanged),
		resourceWatcher.onDidCreate(fileChanged), resourceWatcher.onDidDelete(fileChanged),
		vscode.workspace.onDidChangeTextDocument(({ document }) => schedule(document.uri.fsPath, () => updateDocument(document))),
		vscode.workspace.onDidCloseTextDocument((document) => {
			if (nodes.has(document.uri.fsPath) || nodes.has(`resource:${document.uri.fsPath}`)) schedule('closed', () => refresh());
		}),
		vscode.workspace.onDidChangeWorkspaceFolders(() => schedule('workspace', () => refresh({ discover: true }))),
		vscode.window.onDidChangeActiveTextEditor(() => schedule('active', followActive)),
		vscode.window.tabGroups.onDidChangeTabs(() => schedule('active', followActive)),
		tree.onDidChangeVisibility(({ visible }) => { if (visible) schedule('visible', revealActive); }),
		{ dispose: () => { disposed = true; for (const timer of timers.values()) clearTimeout(timer); } },
	);
	void refresh({ discover: true }).catch((error) => output.appendLine(`Site tree: ${error.message}`));
	return { refresh: () => refresh({ discover: true }) };
}

module.exports = { registerSiteTree };
