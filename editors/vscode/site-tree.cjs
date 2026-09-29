const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { getNornaProjectContext, findNornaPackage, supportedEditorApiVersion, supportedSchemaVersion } = require('./norna-project.cjs');
const { registerSiteFileActions } = require('./site-file-actions.cjs');
const { registerSiteAddressActions } = require('./site-address-actions.cjs');
const { registerSiteSourceActions } = require('./site-source-actions.cjs');
const { createPageForm, editPageForm } = require('./page-form-actions.cjs');

const viewId = 'nornaSiteTree';
const sourceNames = new Set(['content.md']);
const isPage = (node) => node?.kind === 'page';
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
	const selectionKey = 'norna.siteTree.activeSite';
	const expansionKey = 'norna.siteTree.configurationExpansion';
	const configurationExpansion = { ...context.workspaceState.get(expansionKey) };
	const pageIcon = { light: context.asAbsolutePath('media/page-light.svg'), dark: context.asAbsolutePath('media/page-dark.svg') };
	const pageListIcon = { light: context.asAbsolutePath('media/page-list-light.svg'), dark: context.asAbsolutePath('media/page-list-dark.svg') };
	let activeSiteRoot = context.workspaceState.get(selectionKey);
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
	const siteLocation = (root) => vscode.workspace.workspaceFolders
		?.find(({ uri }) => uri.scheme === 'file' && uri.fsPath === root)?.name
		?? vscode.workspace.asRelativePath(root, true);
	const inWorkspace = (root) => (vscode.workspace.workspaceFolders ?? [])
		.some(({ uri }) => uri.scheme === 'file' && inside(uri.fsPath, root));
	const activeSite = () => sites.get(activeSiteRoot);
	const documentSources = () => new Map(vscode.workspace.textDocuments
		.filter((document) => document.uri.scheme === 'file' && document.isDirty)
		.map((document) => [document.uri.fsPath, document.getText()]));

	const serviceFor = async (root) => {
		if (!vscode.workspace.isTrusted) throw new Error('Trust this workspace before using the Norna site tree.');
		let project = getNornaProjectContext(path.join(root, 'root', 'content.md')) ?? getNornaProjectContext(path.join(root, 'site-config/settings.yaml'));
		if (!project || project.siteRoot !== root) {
			const nornaPackage = findNornaPackage(root);
			project = { nornaPackage, editorCompatible: nornaPackage?.manifest.editorApiVersion === supportedEditorApiVersion,
				schemaCompatible: nornaPackage?.manifest.schemaVersion === supportedSchemaVersion };
		}
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
		const markerRoot = path.basename(path.dirname(filename)) === 'site-config' ? path.dirname(path.dirname(filename)) : null;
		const root = markerRoot ?? project?.siteRoot;
		if (!root || !project && !findNornaPackage(root)) return null;
		if (!inWorkspace(root)) return null;
		if (!sites.has(root)) sites.set(root, { id: root, siteRoot: root, kind: 'site', title: labelFor(root), children: [], cache: new Map() });
		return sites.get(root);
	};

	const publishDiagnostics = () => {
		diagnostics.clear();
		for (const site of sites.values()) {
			if (site.siteRoot !== activeSiteRoot) continue;
			const byFile = new Map();
			const add = (filename, message) => {
				if (!byFile.has(filename)) byFile.set(filename, new Set());
				byFile.get(filename).add(message);
			};
			for (const node of nodes.values()) if (node.siteRoot === site.siteRoot) {
				if (node.problem && !node.issues?.length) add(node.sourcePath, node.problem);
			}
			for (const problem of site.problems ?? []) add(sourceNames.has(path.basename(problem.path)) ? problem.path : path.join(site.siteRoot, 'root', 'content.md'), problem.message);
			for (const [filename, messages] of byFile) diagnostics.set(vscode.Uri.file(filename), [...messages].map((message) => {
				const diagnostic = new vscode.Diagnostic(new vscode.Range(0, 0, 0, 1), message, vscode.DiagnosticSeverity.Error);
				diagnostic.source = 'Norna site tree';
				return diagnostic;
			}));
			const detailed = new Map();
			for (const node of nodes.values()) if (node.siteRoot === site.siteRoot) for (const issue of node.issues ?? []) {
				if (!detailed.has(issue.path)) detailed.set(issue.path, new Map());
				const line = Math.max(0, (issue.line ?? 1) - 1);
				const diagnostic = new vscode.Diagnostic(new vscode.Range(line, 0, line, 1), issue.message,
					issue.severity === 'warning' ? vscode.DiagnosticSeverity.Warning : vscode.DiagnosticSeverity.Error);
				diagnostic.source = 'Norna site tree';
				detailed.get(issue.path).set(`${line}:${issue.message}`, diagnostic);
			}
			for (const [filename, entries] of detailed) diagnostics.set(vscode.Uri.file(filename), [...entries.values()]);
		}
	};

	const refreshSite = async (site) => {
		try {
			const service = await serviceFor(site.siteRoot);
			const supportsFiles = service.siteFileTreeApiVersion === 1 && typeof service.readSiteFileTree === 'function';
			const snapshot = await (supportsFiles ? service.readSiteFileTree : service.readSiteTree)({
				siteRoot: site.siteRoot, sources: documentSources(), cache: site.cache,
				editing: service.siteTreeEditingApiVersion === 1,
			});
			const previous = new Map([...nodes].filter(([, node]) => node.siteRoot === site.siteRoot));
			for (const id of previous.keys()) nodes.delete(id);
			site.children = [];
			site.problem = null;
			site.problems = snapshot.problems;
			site.fileTree = Array.isArray(snapshot.items);
			if (site.fileTree) {
				const entries = snapshot.items.filter((entry) => !(entry.kind === 'file' && entry.role === 'content' && entry.ownerId === entry.sourcePath));
				for (const entry of entries) {
					const node = Object.assign(previous.get(entry.id) ?? {}, { issues: [], problem: null, note: undefined, missingSource: false }, entry, { siteRoot: site.siteRoot, children: [] });
					nodes.set(node.id, node);
				}
				for (const entry of entries) {
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

	const ownIssues = (node) => {
		const external = node.sourcePath ? (vscode.languages.getDiagnostics?.(vscode.Uri.file(node.sourcePath)) ?? [])
			.filter((issue) => issue.source !== 'Norna site tree' && issue.severity <= vscode.DiagnosticSeverity.Warning)
			.map((issue) => ({ message: issue.message, path: node.sourcePath, line: issue.range.start.line + 1,
				severity: issue.severity === vscode.DiagnosticSeverity.Error ? 'error' : 'warning' })) : [];
		return [...(node.issues ?? []), ...(!node.issues?.length && node.problem ? [{ message: node.problem, severity: 'error', path: node.sourcePath }] : []), ...external];
	};
	const allIssues = (node) => [...ownIssues(node), ...node.children.flatMap(allIssues)];
	const provider = {
		onDidChangeTreeData: changed.event,
		// reveal() asks for children itself: waiting for queued work here would
		// deadlock when a refresh is queued behind that reveal.
		getChildren: async (node) => {
			await reading;
			if (node) return node.siteRoot === activeSiteRoot ? node.children : [];
			const site = activeSite();
			return site ? site.fileTree ? site.children : [site] : [];
		},
		getParent: (node) => node.parent,
		getTreeItem: (node) => {
			const configuration = node.kind === 'directory' && node.role === 'configuration';
			const groupingRow = node.kind === 'directory' || node.kind === 'site';
			const expanded = configuration && configurationExpansion[node.id] !== false;
			const item = new vscode.TreeItem(node.title, !node.children.length ? vscode.TreeItemCollapsibleState.None
				: expanded ? vscode.TreeItemCollapsibleState.Expanded : vscode.TreeItemCollapsibleState.Collapsed);
			item.id = node.id;
			item.contextValue = node.kind === 'site' ? (node.problem ? 'nornaSiteUnavailable' : 'nornaSite')
				: node.kind === 'incomplete' ? 'nornaIncomplete'
				: node.kind === 'directory' ? configuration ? 'nornaConfiguration' : node.role === 'pages' ? 'nornaPages' : node.role === 'images' ? 'nornaImages' : 'nornaDirectory'
					: node.kind === 'file' ? node.parent?.role === 'images' && /\.(jpe?g|png|svg)$/i.test(node.title) ? 'nornaImage' : node.removable ? 'nornaOptionalFile' : 'nornaFile'
						: node.isHome ? 'nornaHome' : 'nornaPage';
			const unsaved = vscode.workspace.textDocuments.some((document) => document.uri.fsPath === node.sourcePath && document.isDirty);
			const issues = allIssues(node);
			const severity = issues.some((issue) => issue.severity === 'error') ? 'error' : issues.length ? 'warning' : '';
			item.description = [node.isHome ? 'Homepage' : '',
				isPage(node) && node.hiddenFromNavigation ? 'unlisted' : '',
				severity, node.note,
				unsaved ? 'unsaved' : ''].filter(Boolean).join(' · ');
			item.iconPath = node.kind === 'page' ? node.listChildren ? pageListIcon : pageIcon
				: new vscode.ThemeIcon(configuration ? 'settings-gear' : node.kind === 'site' ? 'globe'
					: ['directory', 'incomplete'].includes(node.kind) ? 'folder' : 'file');
			const problemHelp = [...new Set(issues.map((issue) => `${issue.message}\n${issue.path}${issue.line ? `:${issue.line}` : ''}`))].join('\n\n');
			item.accessibilityInformation = { label: [node.title, item.description, node.sourcePath].filter(Boolean).join(', ') };
			if (groupingRow) {
				item.tooltip = [node.role === 'public' ? node.description : '', problemHelp].filter(Boolean).join('\n\n');
				// Native trees expand labels that have no command. Keep expansion on
				// the chevron without opening a source or changing global tree settings.
				item.command = { command: 'nornaEditor.selectSiteGroup', title: 'Select' };
			} else if (node.sourcePath) {
				item.tooltip = [node.kind === 'page' ? node.listChildren ? 'Open page content. This page automatically lists its direct child pages.' : 'Open page content' : node.kind === 'incomplete' ? 'Add the missing source file' : node.title,
					node.description, node.sourcePath, problemHelp].filter(Boolean).join('\n');
				item.resourceUri = vscode.Uri.file(node.sourcePath);
				item.command = { command: node.kind === 'incomplete' ? 'nornaEditor.addToPage' : 'nornaEditor.openSiteNode', title: node.kind === 'incomplete' ? 'Repair Source' : 'Open Source', arguments: [node] };
			}
			return item;
		},
	};
	const tree = vscode.window.createTreeView(viewId, { treeDataProvider: provider, showCollapseAll: true });
	const rememberExpansion = ({ element }, expanded) => {
		if (element.kind !== 'directory' || element.role !== 'configuration') return;
		configurationExpansion[element.id] = expanded;
		void context.workspaceState.update(expansionKey, { ...configurationExpansion })
			.catch((error) => output.appendLine(`Site tree: ${error.message}`));
	};

	const activeUri = () => vscode.window.tabGroups.activeTabGroup.activeTab?.input?.uri ?? vscode.window.activeTextEditor?.document.uri;
	const activeNode = () => {
		const uri = activeUri();
		if (uri?.scheme !== 'file') return undefined;
		const node = nodes.get(`resource:${uri.fsPath}`) ?? nodes.get(uri.fsPath);
		return node?.siteRoot === activeSiteRoot ? node : undefined;
	};
	const ownerOf = (node) => isPage(node) || node?.kind === 'site' || node?.kind === 'incomplete' ? node : nodes.get(node?.ownerId);
	const revealActive = () => enqueueTreeWork(async () => {
		const node = activeNode();
		let target = node;
		// Following an open settings file must not undo an explicit collapse,
		// including after refresh or reload while that file is still active.
		for (let ancestor = node?.parent; ancestor; ancestor = ancestor.parent) {
			if (ancestor.kind === 'directory' && ancestor.role === 'configuration' && configurationExpansion[ancestor.id] === false) {
				target = ancestor;
				break;
			}
		}
		if (target && tree.visible) await tree.reveal(target, { select: target === node, focus: false, expand: false });
	});
	const refresh = ({ discover = false } = {}) => enqueueTreeWork(async () => {
		reading = (async () => {
			if (discover) {
				const configs = await vscode.workspace.findFiles('**/{config.yaml,site-config/settings.yaml,site-config/site-theme.yaml}', '**/{node_modules,.git,.norna,.vscode-test,dist,marketing}/**');
				for (const uri of configs) rememberSite(uri.fsPath);
				if (activeSiteRoot && inWorkspace(activeSiteRoot) && fs.existsSync(activeSiteRoot) && !sites.has(activeSiteRoot)) {
					sites.set(activeSiteRoot, { id: activeSiteRoot, siteRoot: activeSiteRoot, kind: 'site', title: labelFor(activeSiteRoot), children: [], cache: new Map() });
				}
			}
			for (const [root, site] of sites) {
				if (!inWorkspace(root) || !fs.existsSync(root)) {
					sites.delete(root);
				} else await refreshSite(site);
			}
			for (const [id, node] of nodes) if (!sites.has(node.siteRoot)) nodes.delete(id);
			if (!sites.has(activeSiteRoot)) activeSiteRoot = sites.size === 1 ? sites.keys().next().value : undefined;
			await context.workspaceState.update(selectionKey, activeSiteRoot);
			await vscode.commands.executeCommand('setContext', 'nornaSiteTree.hasMultipleSites', sites.size > 1);
			await vscode.commands.executeCommand('setContext', 'nornaSiteTree.hasActiveSite', Boolean(activeSite()));
			publishDiagnostics();
			tree.description = activeSite() ? siteLocation(activeSiteRoot) : undefined;
			tree.message = !sites.size ? 'Open a folder containing a Norna site to use Site Tree.'
				: !activeSite() ? undefined
					: !activeSite().fileTree && !activeSite().problem
						? 'This site shows pages only. Update its Norna engine and root-page format to browse configuration, images and public files.' : undefined;
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
		if (node && node.siteRoot !== activeSiteRoot) return;
		if (!isPage(node)) {
			const resource = nodes.get(`resource:${document.uri.fsPath}`);
			if (resource?.siteRoot === activeSiteRoot) {
				await refreshSite(activeSite()); publishDiagnostics(); changed.fire();
			}
			return;
		}
		const version = document.version;
		const service = await serviceFor(node.siteRoot);
		if (service.siteTreeEditingApiVersion === 1) {
			await refreshSite(activeSite()); publishDiagnostics(); changed.fire(); return;
		}
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

	const chooseSite = async () => {
		await refresh({ discover: true });
		const entries = [...sites.values()].map((site) => ({
			label: site.children.find((node) => node.isHome)?.title ?? site.title,
			description: siteLocation(site.siteRoot),
			detail: site.siteRoot,
			site,
		}));
		if (!entries.length) throw new Error('Open a folder containing a Norna site before choosing a site.');
		const choice = await vscode.window.showQuickPick(entries, {
			title: 'Choose Site', placeHolder: 'Show one site in Site Tree; opening other files will not change this choice', ignoreFocusOut: true,
		});
		if (!choice) return undefined;
		await enqueueTreeWork(async () => {
			if (!inWorkspace(choice.site.siteRoot) || !sites.has(choice.site.siteRoot)) throw new Error('This site is no longer in the workspace. Choose a site again.');
			activeSiteRoot = choice.site.siteRoot;
		});
		await refresh();
		await revealActive();
		return activeSite();
	};
	const chooseNode = async (argument) => {
		await treeWork;
		if (argument) {
			const node = nodes.get(argument.id) ?? sites.get(argument.id);
			if (!node || node.siteRoot !== activeSiteRoot) throw new Error('Choose a page in the active site before using this action.');
			return node;
		}
		const selected = [tree.selection[0], activeNode()].find((node) => node?.siteRoot === activeSiteRoot
			&& (nodes.has(node.id) || sites.has(node.id)));
		return selected ?? activeSite() ?? await chooseSite();
	};
	const openNode = async (argument) => {
		const node = await chooseNode(argument);
		if (node?.missingSource) return vscode.commands.executeCommand('nornaEditor.addToPage', node);
		if (node?.sourcePath && node.kind !== 'directory') await vscode.commands.executeCommand('vscode.open', vscode.Uri.file(node.sourcePath));
	};
	const oneLine = (value) => !value.trim() || /[\r\n]/.test(value) ? 'Enter a non-empty, single line of text.' : undefined;
	const create = async (kind, argument, insideSelected = false) => {
		const target = await chooseNode(argument);
		const selected = ownerOf(target);
		if (!selected) return;
		if (selected.missingSource) throw new Error('Use the page’s Add menu to create its content.md before adding children.');
		const service = await serviceFor(selected.siteRoot);
		if (service.sitePageFormApiVersion === 1) return createPageForm({ vscode, context, service, kind, selected, target, insideSelected, ownerOf, chooseNode, documentSources, refresh, revealActive });
		let parentPath = '/';
		if (insideSelected || (target.kind === 'directory' && target.role === 'pages')) parentPath = selected.url ?? '/';
		else if (selected.kind !== 'site') {
			const rootPage = selected.isHome && selected.sourcePath === path.join(selected.siteRoot, 'root', 'content.md');
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
		const title = await vscode.window.showInputBox({ title: 'New page', prompt: 'Page title', validateInput: oneLine, ignoreFocusOut: true });
		if (title === undefined) return;
		const options = { siteRoot: selected.siteRoot, kind, title, parentPath };
		const slug = await vscode.window.showInputBox({ title: `New ${kind}`, prompt: 'URL segment (lowercase letters, numbers and hyphens)', value: service.slugifyAsciiIdentifier(title), ignoreFocusOut: true,
			validateInput: async (value) => { try { await service.planSiteNodeCreation({ ...options, slug: value }); } catch (error) { return error.message; } return undefined; } });
		if (slug === undefined) return;
		const plan = await service.planSiteNodeCreation({ ...options, slug });
		const confirm = await vscode.window.showQuickPick([{ label: 'Create page', description: plan.url, detail: labelFor(plan.destination) }],
			{ title: `Create “${title}” in ${labelFor(selected.siteRoot)}`, placeHolder: 'Review the location; Escape cancels without creating files', ignoreFocusOut: true });
		if (!confirm) return;
		await chooseNode(target);
		const created = await service.createSiteNode(plan);
		await refresh();
		await vscode.window.showTextDocument(vscode.Uri.file(created.sourcePath), { preview: false });
		await revealActive();
	};

	const editInformation = async (argument) => {
		const node = await chooseNode(argument);
		if (!isPage(node)) throw new Error('Select a page to edit its information.');
		const service = await serviceFor(node.siteRoot);
		const document = await vscode.workspace.openTextDocument(vscode.Uri.file(node.sourcePath));
		const info = await service.getSiteNodeInformation({ kind: node.kind, isHome: node.isHome, source: document.getText(), sourcePath: node.sourcePath });
		if (info.problem) throw new Error(`${info.problem} Open the source to repair it.`);
		if (service.sitePageFormApiVersion === 1) return editPageForm({ vscode, context, service, node, document, info, chooseNode, documentSources, updateDocument });
		const version = document.version;
		const selected = await vscode.window.showQuickPick([
			{ label: 'Title', description: info.title, field: 'title' },
			{ label: 'Description', description: info.description || 'Not set', field: 'description' },
			{ label: 'Navigation', description: node.isHome ? 'Home is always listed' : info.listed ? 'Listed' : 'Unlisted (still published)', field: node.isHome ? null : 'listed' },
			{ label: 'Location', kind: vscode.QuickPickItemKind.Separator },
			...(service.siteAddressApiVersion === 1
				? [{ label: 'Addresses and links…', detail: 'Copy or change addresses and review incoming links', addresses: true }]
				: [{ label: 'Current URL', description: node.url, detail: 'Read-only; select to copy', copy: node.url }]),
			{ label: 'Source file', description: labelFor(node.sourcePath), detail: 'Select to open', open: true },
			...(service.siteAddressApiVersion !== 1 ? [{ label: 'Previous URLs', description: info.aliases.join(', ') || 'None', detail: 'Read-only; select to copy', copy: info.aliases.join('\n') }] : []),
		], { title: `Page Information: ${info.title}`, ignoreFocusOut: true });
		if (!selected) return;
		if (selected.addresses) return vscode.commands.executeCommand('nornaEditor.addressesAndLinks', node);
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
	register('nornaEditor.selectSiteGroup', () => {});
	register('nornaEditor.newPage', (node) => create('page', node));
	register('nornaEditor.addPage', (node) => create('page', node));
	register('nornaEditor.addChildPage', (node) => create('page', node, true));
	register('nornaEditor.pageInformation', editInformation);
	registerSiteFileActions({ vscode, context, chooseNode, ownerOf, serviceFor, documentSources, refresh, register });
	registerSiteAddressActions({ vscode, chooseNode, ownerOf, serviceFor, documentSources, refresh, register });
	registerSiteSourceActions({ vscode, chooseNode, ownerOf, serviceFor, refresh, register });
	register('nornaEditor.addToPage', async (argument) => {
		const target = await chooseNode(argument);
		const configurationTarget = target?.kind === 'directory' && target.role === 'configuration';
		let node = ownerOf(target);
		if (node?.kind === 'site') node = node.children.find((child) => child.isHome);
		if (!node) return;
		const service = await serviceFor(node.siteRoot);
		const missing = (service.siteTreeEditingApiVersion === 1 ? await service.getEditorSourceFileChoices({ siteRoot: node.siteRoot, directory: node.directory ?? path.dirname(node.sourcePath) }) : [])
			.filter((choice) => !configurationTarget || path.dirname(choice.filename) === target.sourcePath);
		if (configurationTarget && !missing.length) return vscode.window.showInformationMessage('All supported files in site-config already exist. Select a file to edit it.');
		const selected = await vscode.window.showQuickPick([
			...(!configurationTarget && !node.missingSource ? [{ label: '$(add) Add child page…', command: 'addChildPage' }] : []),
			...(!configurationTarget && node.kind === 'page' ? [{ label: '$(file-media) Import image…', command: 'importImage' }] : []),
			...missing.map((choice) => ({ label: `$(new-file) ${choice.required ? 'Create required' : 'Add'} ${choice.name}…`, description: choice.description, command: 'createSourceFile', filename: choice.filename })),
		], { title: `Add to ${node.title}`, ignoreFocusOut: true });
		if (selected) await vscode.commands.executeCommand(`nornaEditor.${selected.command}`, node, selected.filename);
	});
	register('nornaEditor.pageActions', async (argument) => {
		const node = await chooseNode(argument);
		if (!isPage(node)) throw new Error('Select a page.');
		const selected = await vscode.window.showQuickPick([
			{ label: '$(edit) Page information…', command: 'pageInformation' },
			{ label: '$(link) Addresses and links…', command: 'addressesAndLinks' },
			{ label: '$(go-to-file) Open source', command: 'openSiteNode' },
			...(!node.isHome ? [{ label: '$(trash) Move page to Trash…', command: 'removePage' }] : []),
		], { title: `Page actions: ${node.title}`, ignoreFocusOut: true });
		if (selected) await vscode.commands.executeCommand(`nornaEditor.${selected.command}`, node);
	});
	register('nornaEditor.fileActions', async (argument) => {
		const node = await chooseNode(argument);
		if (node?.kind !== 'file' || !node.removable) throw new Error('Select an optional file. Required files cannot be removed separately.');
		const selected = await vscode.window.showQuickPick([
			{ label: '$(go-to-file) Open source', command: 'openSiteNode' },
			{ label: '$(trash) Move to Trash…', command: 'removeFile' },
		], { title: `File actions: ${node.title}`, ignoreFocusOut: true });
		if (selected) await vscode.commands.executeCommand(`nornaEditor.${selected.command}`, node);
	});
	register('nornaEditor.imageActions', async (argument) => {
		const node = await chooseNode(argument);
		if (node?.kind !== 'file' || node.parent?.role !== 'images') throw new Error('Select a page image.');
		const selected = await vscode.window.showQuickPick([
			{ label: '$(add) Insert image at end of page…', command: 'insertImage' },
			{ label: '$(replace) Replace image…', command: 'replaceImage' },
			{ label: '$(trash) Move image to Trash…', command: 'removeImage' },
		], { title: `Image actions: ${node.title}`, ignoreFocusOut: true });
		if (selected) await vscode.commands.executeCommand(`nornaEditor.${selected.command}`, node);
	});
	register('nornaEditor.chooseSite', chooseSite);
	register('nornaEditor.refreshSiteTree', async () => { services.clear(); await refresh({ discover: true }); await revealActive(); });
	const watcher = vscode.workspace.createFileSystemWatcher('**/{content.md,settings.yaml,site-theme.yaml,shared-content.yaml,theme.yaml,config.yaml,page-theme.yaml,sitewide-content.yaml}');
	const directoryWatcher = vscode.workspace.createFileSystemWatcher('**/{pages,images,public}', false, true, false);
	const resourceWatcher = vscode.workspace.createFileSystemWatcher('**/*', false, true, false);
	const fileChanged = (uri) => {
		if (uri.fsPath.split(path.sep).some((part) => ['.norna', 'node_modules', '.git'].includes(part))) return;
		if (!inWorkspace(uri.fsPath)) return;
		if ((activeSiteRoot && inside(activeSiteRoot, uri.fsPath)) || ['settings.yaml', 'config.yaml'].includes(path.basename(uri.fsPath))) {
			schedule('filesystem', () => refresh({ discover: ['settings.yaml', 'config.yaml'].includes(path.basename(uri.fsPath)) }));
		}
	};
	const followActive = async () => {
		const uri = activeUri();
		if (uri?.scheme !== 'file') return;
		const site = activeSite();
		if (!site) return;
		if (!inside(activeSiteRoot, uri.fsPath)) return;
		if (!site.children.length || !activeNode()) await refresh();
		await revealActive();
	};
	context.subscriptions.push(tree, changed, diagnostics, watcher, directoryWatcher, resourceWatcher,
		tree.onDidExpandElement((event) => rememberExpansion(event, true)),
		tree.onDidCollapseElement((event) => rememberExpansion(event, false)),
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
	if (vscode.languages.onDidChangeDiagnostics) context.subscriptions.push(vscode.languages.onDidChangeDiagnostics(({ uris }) => {
		if (uris.some((uri) => uri.scheme === 'file' && activeSiteRoot && inside(activeSiteRoot, uri.fsPath))) schedule('diagnostics', () => enqueueTreeWork(() => changed.fire()));
	}));
	void refresh({ discover: true }).catch((error) => output.appendLine(`Site tree: ${error.message}`));
	return { refresh: () => refresh({ discover: true }) };
}

module.exports = { registerSiteTree };
