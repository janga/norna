const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { getNornaProjectContext, findNornaPackage, supportedEditorApiVersion, supportedSchemaVersion } = require('./norna-project.cjs');
const { registerSiteFileActions } = require('./site-file-actions.cjs');
const { registerSiteAddressActions } = require('./site-address-actions.cjs');
const { registerSitePreviewActions } = require('./site-preview-actions.cjs');
const { registerSiteAttachmentActions } = require('./site-attachment-actions.cjs');
const { registerSiteResourceActions } = require('./site-resource-actions.cjs');
const { registerSiteSourceActions } = require('./site-source-actions.cjs');
const { createPageForm, editPageForm } = require('./page-form-actions.cjs');
const { isWithin, previewPlacement, describePlacement, describePosition } = require('./page-placement.cjs');

const viewId = 'nornaSiteTree';
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
	const urlPathsKey = 'norna.siteTree.showUrlPaths';
	let showUrlPaths = context.workspaceState.get(urlPathsKey) === true;
	void vscode.commands.executeCommand('setContext', 'nornaSiteTree.showUrlPaths', showUrlPaths);
	const configurationExpansion = { ...context.workspaceState.get(expansionKey) };
	const pageIcon = { light: context.asAbsolutePath('media/page-light.svg'), dark: context.asAbsolutePath('media/page-dark.svg') };
	const pageListIcon = { light: context.asAbsolutePath('media/page-list-light.svg'), dark: context.asAbsolutePath('media/page-list-dark.svg') };
	let activeSiteRoot = context.workspaceState.get(selectionKey);
	let moveSourceId = null;
	let moveSourceRoot = null;
	let movePreview = null;
	let applyingMove = false;
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
	const pageAddress = (node) => {
		const base = sites.get(node.siteRoot)?.addressBase;
		return base && node.url ? new URL(node.url.slice(1), base).href : node.url;
	};
	const pageUrlPath = (node) => {
		const address = pageAddress(node);
		return address?.startsWith('/') ? address : address ? new URL(address).pathname : '';
	};
	const documentSources = () => new Map(vscode.workspace.textDocuments
		.filter((document) => document.uri.scheme === 'file' && document.isDirty)
		.map((document) => [document.uri.fsPath, document.getText()]));
	const dirtyPageOwners = (siteRoot) => {
		const pages = [...nodes.values()].filter((node) => node.siteRoot === siteRoot && isPage(node));
		const owners = new Set();
		for (const { uri } of vscode.workspace.textDocuments.filter((document) => document.uri.scheme === 'file' && document.isDirty)) {
			const filename = uri.fsPath;
			const owner = pages.filter((page) => inside(path.dirname(page.sourcePath), filename))
				.sort((left, right) => right.sourcePath.length - left.sourcePath.length)[0];
			if (owner) owners.add(owner.id);
		}
		return owners;
	};

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
		if (!sites.has(root)) sites.set(root, { id: root, siteRoot: root, sourcePath: root, directory: root, kind: 'site', title: labelFor(root), children: [], cache: new Map() });
		return sites.get(root);
	};

	const publishDiagnostics = () => {
		diagnostics.clear();
		for (const site of sites.values()) {
			if (site.siteRoot !== activeSiteRoot) continue;
			const byFile = new Map();
			const add = (issue) => {
				if (!byFile.has(issue.path)) byFile.set(issue.path, new Map());
				const line = Math.max(0, (issue.line ?? 1) - 1);
				const diagnostic = new vscode.Diagnostic(new vscode.Range(line, 0, line, 1), issue.message,
					issue.severity === 'warning' ? vscode.DiagnosticSeverity.Warning : vscode.DiagnosticSeverity.Error);
				diagnostic.source = 'Norna site tree';
				byFile.get(issue.path).set(`${line}:${issue.message}`, diagnostic);
			};
			for (const node of nodes.values()) if (node.siteRoot === site.siteRoot) {
				if (node.problem && !node.issues?.length) add({ path: node.sourcePath, message: node.problem });
				for (const issue of node.issues ?? []) add(issue);
			}
			for (const problem of site.problems ?? []) add(problem);
			for (const [filename, entries] of byFile) diagnostics.set(vscode.Uri.file(filename), [...entries.values()]);
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
			// Resolve the deployment base once per site refresh, through its own
			// engine. Reuse it for all rows rather than reading the link graph per page.
			site.addressBase = null;
			const anchor = snapshot.nodes?.find((node) => node.isHome) ?? snapshot.nodes?.find(isPage);
			if (anchor && service.siteAddressApiVersion === 1) {
				try {
					const address = await service.getEditorPageAddresses({ siteRoot: site.siteRoot, sourcePath: anchor.sourcePath, sources: documentSources() });
					if (address.webAddress) site.addressBase = address.webAddress.slice(0, address.webAddress.length - address.internalLink.slice(1).length);
				} catch (error) { output.appendLine(`Site tree address: ${error.message}`); }
			}
			const previous = new Map([...nodes].filter(([, node]) => node.siteRoot === site.siteRoot));
			for (const id of previous.keys()) nodes.delete(id);
			site.children = [];
			site.problem = null;
			site.problems = snapshot.problems;
			site.fileTree = Array.isArray(snapshot.items);
			site.resourceActions = service.siteResourceActionsApiVersion === 1;
			site.preview = service.sitePreviewApiVersion === 1;
			site.previewRunning = site.preview && (await service.getEditorPreviewStatus({ siteRoot: site.siteRoot }).catch(() => ({ verified: false }))).verified;
			if (site.fileTree) {
				const entries = snapshot.items.filter((entry) => !(entry.kind === 'file' && entry.role === 'content' && entry.ownerId === entry.sourcePath));
				for (const entry of entries) {
					const node = Object.assign(previous.get(entry.id) ?? {}, { issues: [], problem: null, note: undefined, themeHelp: undefined, missingSource: false }, entry, { siteRoot: site.siteRoot, children: [] });
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
	const childrenFor = (node) => {
		if (node?.kind === 'movePreviewPages') return [movePreview?.ghost].filter(Boolean);
		if (node.id === moveSourceId) return [
			{ id: `move-cancel-source:${node.id}`, kind: 'moveAction', action: 'cancel', title: 'Cancel page move',
				siteRoot: node.siteRoot, parent: node, children: [] },
			...node.children,
		];
		if (!movePreview) return node.children;
		if (node.id === movePreview.pagesNode.id) {
			const children = [...node.children];
			children.splice(movePreview.insertAt, 0, movePreview.ghost);
			return children;
		}
		if (movePreview.syntheticPages && node.id === movePreview.parent.id) return [...node.children, movePreview.syntheticPages];
		return node.children;
	};
	const provider = {
		onDidChangeTreeData: changed.event,
		// reveal() asks for children itself: waiting for queued work here would
		// deadlock when a refresh is queued behind that reveal.
		getChildren: async (node) => {
			await reading;
			if (node) return node.siteRoot === activeSiteRoot ? childrenFor(node) : [];
			const site = activeSite();
			return site ? site.fileTree ? childrenFor(site) : [site] : [];
		},
		getParent: (node) => node.parent,
		getTreeItem: (node) => {
			const configuration = node.kind === 'directory' && node.role === 'configuration';
			const groupingRow = node.kind === 'directory' || node.kind === 'site';
			const expanded = node.kind === 'movePreview' || node.id === moveSourceId
				|| node.kind === 'moveDetailGroup' && node.children.length <= 3
				|| configuration && configurationExpansion[node.id] !== false;
			const item = new vscode.TreeItem(node.title, !childrenFor(node).length ? vscode.TreeItemCollapsibleState.None
				: expanded ? vscode.TreeItemCollapsibleState.Expanded : vscode.TreeItemCollapsibleState.Collapsed);
			item.id = node.id;
			if (node.kind === 'moveAction') {
				const complete = node.action === 'complete';
				item.contextValue = 'nornaMoveAction';
				item.iconPath = complete
					? new vscode.ThemeIcon('arrow-right', new vscode.ThemeColor('notificationsInfoIcon.foreground'))
					: new vscode.ThemeIcon('close');
				item.description = complete ? 'opens final confirmation' : 'leave files unchanged';
				item.tooltip = complete ? 'Open the final confirmation. Files change only after you confirm Complete page move.'
					: 'Cancel this page move without changing files.';
				item.command = { command: complete ? 'nornaEditor.acceptMovePreview' : 'nornaEditor.cancelMove', title: node.title };
				item.accessibilityInformation = { label: `${node.title}. ${item.description}.` };
				return item;
			}
			if (node.kind === 'moveDetailGroup' || node.kind === 'moveDetail') {
				item.contextValue = 'nornaMoveDetail';
				item.iconPath = new vscode.ThemeIcon(node.kind === 'moveDetailGroup' ? 'list-tree' : 'arrow-right',
					new vscode.ThemeColor('notificationsInfoIcon.foreground'));
				item.description = node.description;
				item.tooltip = node.tooltip ?? node.title;
				item.command = { command: 'nornaEditor.selectSiteGroup', title: 'Select' };
				item.accessibilityInformation = { label: [node.title, node.description].filter(Boolean).join(', ') };
				return item;
			}
			if (node.kind === 'movePreview' || node.kind === 'movePreviewPages') {
				item.contextValue = node.kind === 'movePreview' ? 'nornaMovePreview' : 'nornaMovePreviewPages';
				item.iconPath = node.kind === 'movePreview'
					? new vscode.ThemeIcon('file', new vscode.ThemeColor('notificationsInfoIcon.foreground'))
					: new vscode.ThemeIcon('folder');
				item.description = node.kind === 'movePreview' ? `TO ${node.destinationUrl} · ${node.positionLabel}` : undefined;
				item.tooltip = node.kind === 'movePreview'
					? `${movePreview?.description}\nComplete or cancel using the actions directly below this preview.` : 'Where the page would be placed';
				item.command = { command: 'nornaEditor.selectSiteGroup', title: 'Select' };
				if (node.kind === 'movePreview') item.accessibilityInformation = {
					label: `Preview: ${node.pageTitle}, TO ${node.destinationUrl}, ${node.positionLabel}. No files changed. Complete and cancel actions follow.`,
				};
				return item;
			}
			item.contextValue = node.id === moveSourceId && node.siteRoot === moveSourceRoot ? 'nornaMoveSource'
				: node.kind === 'site' ? (node.problem ? 'nornaSiteUnavailable' : 'nornaSite')
				: node.kind === 'incomplete' ? 'nornaIncomplete'
				: node.kind === 'directory' ? configuration ? 'nornaConfiguration' : node.role === 'pages' ? 'nornaPages' : node.role === 'images' ? 'nornaImages' : 'nornaDirectory'
					: node.kind === 'file' ? node.parent?.role === 'images' && /\.(jpe?g|png|svg)$/i.test(node.title) ? 'nornaImage' : node.removable ? 'nornaOptionalFile' : 'nornaFile'
						: node.isHome ? 'nornaHome' : 'nornaPage';
			if (sites.get(node.siteRoot)?.resourceActions && node.actions && !(node.id === moveSourceId && node.siteRoot === moveSourceRoot)) item.contextValue += ';' + node.actions.join(';;') + ';';
			const unsaved = vscode.workspace.textDocuments.some((document) => document.uri.fsPath === node.sourcePath && document.isDirty);
			const dirtyOwners = dirtyPageOwners(node.siteRoot);
			const subtreeDirectory = isPage(node) ? path.dirname(node.sourcePath)
				: groupingRow ? node.sourcePath : null;
			const dirtyPagesBelow = [...dirtyOwners].filter((id) => {
				const owner = nodes.get(id);
				return owner && owner !== node && subtreeDirectory && inside(subtreeDirectory, owner.sourcePath);
			}).length;
			const dirtyBelowLabel = dirtyPagesBelow ? `${dirtyPagesBelow} unsaved page${dirtyPagesBelow === 1 ? '' : 's'} below` : '';
			const issues = allIssues(node);
			const severity = issues.some((issue) => issue.severity === 'error') ? 'error' : issues.length ? 'warning' : '';
			item.description = [node.isHome ? 'Homepage' : '',
				node.id === moveSourceId && node.siteRoot === moveSourceRoot ? `FROM ${node.url}` : '',
				isPage(node) && node.hiddenFromNavigation ? 'unlisted' : '',
				severity, node.note,
				unsaved || isPage(node) && dirtyOwners.has(node.id) ? 'unsaved' : '',
				dirtyBelowLabel,
				showUrlPaths && isPage(node) && node.id !== moveSourceId ? pageUrlPath(node) : ''].filter(Boolean).join(' · ');
			item.iconPath = node.id === moveSourceId && node.siteRoot === moveSourceRoot
				? new vscode.ThemeIcon('file', new vscode.ThemeColor('notificationsInfoIcon.foreground'))
				: node.kind === 'page' ? node.listChildren ? pageListIcon : pageIcon
				: new vscode.ThemeIcon(configuration ? 'settings-gear' : node.kind === 'site' ? 'globe'
					: ['directory', 'incomplete'].includes(node.kind) ? 'folder' : 'file');
			const problemHelp = [...new Set(issues.map((issue) => `${issue.message}\n${issue.path}${issue.line ? `:${issue.line}` : ''}`))].join('\n\n');
			item.accessibilityInformation = { label: [node.title, item.description, isPage(node) ? pageAddress(node) : node.sourcePath].filter(Boolean).join(', ') };
			if (groupingRow) {
				item.tooltip = [node.role === 'public' ? node.description : '', problemHelp].filter(Boolean).join('\n\n');
				// Native trees expand labels that have no command. Keep expansion on
				// the chevron without opening a source or changing global tree settings.
				item.command = { command: 'nornaEditor.selectSiteGroup', title: 'Select' };
			} else if (node.sourcePath) {
				item.tooltip = isPage(node)
					? [pageAddress(node), node.isHome ? '' : node.url?.split('/').filter(Boolean).at(-1)].filter(Boolean).join('\n')
					: [node.kind === 'incomplete' ? 'Add the missing source file' : node.title,
						node.description, node.sourcePath, node.themeHelp, problemHelp].filter(Boolean).join('\n');
				item.resourceUri = vscode.Uri.file(node.sourcePath);
				item.command = { command: node.kind === 'incomplete' ? 'nornaEditor.addToPage' : 'nornaEditor.openSiteNode',
					title: node.kind === 'incomplete' ? 'Repair Source' : isPage(node) ? 'Open content.md' : 'Open file', arguments: [node] };
			}
			return item;
		},
	};
	const tree = vscode.window.createTreeView(viewId, { treeDataProvider: provider, showCollapseAll: true });
	const updateMoveHeader = () => {
		tree.title = 'Site Tree';
		tree.description = activeSite() ? siteLocation(activeSiteRoot) : undefined;
	};
	const stopMove = () => {
		moveSourceId = null;
		moveSourceRoot = null;
		movePreview = null;
		tree.message = undefined;
		updateMoveHeader();
		void vscode.commands.executeCommand('setContext', 'nornaSiteTree.moveActive', false);
		changed.fire();
	};
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
	const ownerOf = (node) => isPage(node) || node?.kind === 'site' || node?.kind === 'incomplete' ? node : nodes.get(node?.ownerId) ?? sites.get(node?.ownerId);
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
				const configs = await vscode.workspace.findFiles('**/{config.yaml,site-config/settings.yaml,root/tree-theme.yaml}', '**/{node_modules,.git,.norna,.vscode-test,dist,marketing}/**');
				for (const uri of configs) rememberSite(uri.fsPath);
				if (activeSiteRoot && inWorkspace(activeSiteRoot) && fs.existsSync(activeSiteRoot) && !sites.has(activeSiteRoot)) {
					sites.set(activeSiteRoot, { id: activeSiteRoot, siteRoot: activeSiteRoot, sourcePath: activeSiteRoot, directory: activeSiteRoot, kind: 'site', title: labelFor(activeSiteRoot), children: [], cache: new Map() });
				}
			}
			for (const [root, site] of sites) {
				if (!inWorkspace(root) || !fs.existsSync(root)) {
					sites.delete(root);
				} else await refreshSite(site);
			}
			for (const [id, node] of nodes) if (!sites.has(node.siteRoot)) nodes.delete(id);
			if (!sites.has(activeSiteRoot)) activeSiteRoot = sites.size === 1 ? sites.keys().next().value : undefined;
			if (moveSourceId && (moveSourceRoot !== activeSiteRoot || !nodes.has(moveSourceId))) {
				moveSourceId = null; moveSourceRoot = null;
				movePreview = null;
				await vscode.commands.executeCommand('setContext', 'nornaSiteTree.moveActive', false);
			}
			if (movePreview && (!nodes.has(movePreview.parent.id)
				|| !movePreview.syntheticPages && !nodes.has(movePreview.pagesNode.id))) movePreview = null;
			await context.workspaceState.update(selectionKey, activeSiteRoot);
			await vscode.commands.executeCommand('setContext', 'nornaSiteTree.hasMultipleSites', sites.size > 1);
			await vscode.commands.executeCommand('setContext', 'nornaSiteTree.hasActiveSite', Boolean(activeSite()));
			await vscode.commands.executeCommand('setContext', 'nornaSiteTree.resourceActions', Boolean(activeSite()?.resourceActions));
			await vscode.commands.executeCommand('setContext', 'nornaSiteTree.preview', Boolean(activeSite()?.preview));
			await vscode.commands.executeCommand('setContext', 'nornaSiteTree.previewRunning', Boolean(activeSite()?.previewRunning));
			publishDiagnostics();
			updateMoveHeader();
			tree.message = moveSourceId ? undefined : !sites.size ? 'Open a folder containing a Norna site to use Site Tree.'
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
			if (moveSourceRoot && moveSourceRoot !== choice.site.siteRoot) stopMove();
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
		if (node?.sourcePath && !['directory', 'site'].includes(node.kind)) await vscode.commands.executeCommand('vscode.open', vscode.Uri.file(node.sourcePath));
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
		try {
			if (moveSourceId && /^nornaEditor\.(addAttachments|insertAttachment|replaceAttachment|newPage|addPage|addChildPage|importImage|insertImage|replaceImage|removeImage|removePage|removeFile|createSourceFile|renamePage|renameResource|moveResource|removeFolder|newPublicFile|newPublicFolder|addPublicFiles|replacePublicFile|addSitePublicFiles|pageInformation)$/.test(name)) throw new Error('Complete or cancel the current page move before editing site files.');
			return await callback(...args);
		} catch (error) {
			output.appendLine(`Site tree: ${error.stack ?? error.message}`);
			if (moveSourceId && (name.startsWith('nornaEditor.placeMove') || name === 'nornaEditor.acceptMovePreview')) {
				const canOpen = error.sourcePath && inside(moveSourceRoot, error.sourcePath);
				const canRetry = name.startsWith('nornaEditor.placeMove');
				const choice = await vscode.window.showErrorMessage('Norna: Page move could not continue.',
					{ modal: true, detail: error.message },
					...(canOpen ? ['Open affected file'] : []),
					...(canRetry ? ['Try another placement'] : []), 'Cancel move');
				if (choice !== 'Try another placement') stopMove();
				if (choice === 'Open affected file') await vscode.commands.executeCommand('vscode.open', vscode.Uri.file(error.sourcePath));
			} else void vscode.window.showErrorMessage(`Norna: ${error.message}`);
		}
	}));
	register('nornaEditor.openSiteNode', openNode);
	register('nornaEditor.selectSiteGroup', () => {});
	register('nornaEditor.newPage', (node) => create('page', node));
	register('nornaEditor.addPage', (node) => create('page', node));
	register('nornaEditor.addChildPage', (node) => create('page', node, true));
	register('nornaEditor.pageInformation', editInformation);
	register('nornaEditor.movePage', async (argument) => {
		if (moveSourceId || applyingMove) return vscode.window.showInformationMessage('A page move is already in progress. Complete or cancel it before starting another.');
		const node = await chooseNode(argument);
		if (!isPage(node) || node.isHome) throw new Error('Select a page below the homepage.');
		const service = await serviceFor(node.siteRoot);
		if (service.sitePagePlacementApiVersion !== 1) throw new Error('Update this site’s Norna engine to move pages from Site Tree.');
		moveSourceId = node.id;
		moveSourceRoot = node.siteRoot;
		movePreview = null;
		updateMoveHeader();
		tree.message = undefined;
		await vscode.commands.executeCommand('setContext', 'nornaSiteTree.moveActive', true);
		changed.fire();
		await enqueueTreeWork(async () => {
			if (!tree.visible || moveSourceId !== node.id || moveSourceRoot !== activeSiteRoot) return;
			// VS Code retains collapsed state by ID; changing the initial state
			// on TreeItem alone does not reveal the new Cancel action.
			await tree.reveal(node, { select: true, focus: false, expand: true });
		});
	});
	register('nornaEditor.cancelMove', stopMove);
	const previewMoveAt = async (argument, placement) => {
		if (applyingMove) return;
		const target = await chooseNode(argument);
		const source = nodes.get(moveSourceId);
		if (!source || source.siteRoot !== activeSiteRoot || !isPage(target)) { stopMove(); return; }
		if (isWithin(target, source)) return vscode.window.showInformationMessage('Choose a page outside the branch being moved, or cancel the move.');
		const pages = [...nodes.values()].filter((entry) => entry.siteRoot === source.siteRoot && isPage(entry));
		const preview = previewPlacement(source, target, placement, pages);
		if (preview.unchanged) return vscode.window.showInformationMessage('This page is already in that position. No files changed.');
		const service = await serviceFor(source.siteRoot);
		const plan = await service.planEditorPagePlacement({ siteRoot: source.siteRoot, sourcePath: source.sourcePath,
			targetPath: target.sourcePath, placement, sources: documentSources() });
		const physicalPages = preview.parent.children.find((child) => child.kind === 'directory' && child.role === 'pages');
		const syntheticPages = physicalPages ? null : { id: `move-preview-pages:${preview.parent.id}`, kind: 'movePreviewPages',
			title: 'pages', siteRoot: source.siteRoot, parent: preview.parent, children: [] };
		const pagesNode = physicalPages ?? syntheticPages;
		const existing = pagesNode.children.filter((child) => child.id !== source.id);
		const next = existing.filter(isPage)[preview.index];
		const insertAt = next ? pagesNode.children.findIndex((child) => child.id === next.id) : pagesNode.children.length;
		const mappings = plan.movePreview?.mappings ?? [];
		const linkChanges = plan.movePreview?.linkChanges ?? [];
		const changes = mappings.map((mapping) => `${mapping.oldPathname} → ${mapping.newPathname}`);
		const description = `${describePlacement(source, target, placement, preview)}\n${changes.length ? `Old addresses will continue to lead to the moved pages:\n${changes.join('\n')}` : 'Page addresses will not change.'}\n${linkChanges.length} authored link(s) will be updated.\nNo files changed yet.`;
		const ghost = { id: `move-preview:${source.id}`, kind: 'movePreview', title: `Preview: ${source.title}`,
			pageTitle: source.title, positionLabel: describePosition(target, placement), destinationUrl: plan.destinationUrl,
			siteRoot: source.siteRoot, parent: pagesNode, children: [] };
		const detailGroup = (kind, title, entries, empty) => {
			const group = { id: `move-${kind}:${source.id}`, kind: 'moveDetailGroup', title,
				description: entries.length ? `${entries.length}` : empty, siteRoot: source.siteRoot, parent: ghost, children: [] };
			group.children = entries.map((entry, index) => ({ id: `move-${kind}-${index}:${source.id}`, kind: 'moveDetail',
				...entry, siteRoot: source.siteRoot, parent: group, children: [] }));
			return group;
		};
		ghost.children = [
			{ id: `move-complete:${source.id}`, kind: 'moveAction', action: 'complete', title: 'Complete page move…', siteRoot: source.siteRoot, parent: ghost, children: [] },
			{ id: `move-cancel:${source.id}`, kind: 'moveAction', action: 'cancel', title: 'Cancel page move', siteRoot: source.siteRoot, parent: ghost, children: [] },
			detailGroup('addresses', 'Affected addresses', mappings.map(({ oldPathname, newPathname }) => ({
				title: oldPathname, description: `→ ${newPathname}`, tooltip: `${oldPathname} → ${newPathname}. The old address remains an alias.`,
			})), `Unchanged: ${plan.sourceUrl}`),
			detailGroup('links', 'Authored links to update', linkChanges.map(({ contentLabel, line, from, to }) => ({
				title: `${contentLabel}:${line}`, description: `${from} → ${to}`,
				tooltip: `${contentLabel}, line ${line}: ${from} → ${to}`,
			})), 'None'),
			{ id: `move-note:${source.id}`, kind: 'moveDetail', title: 'No files changed yet',
				description: 'Save affected edits first',
				tooltip: 'Save affected unsaved edits before completing the move. Editor Undo does not reverse the whole move.',
				siteRoot: source.siteRoot, parent: ghost, children: [] },
		];
		movePreview = { ghost, parent: preview.parent, pagesNode, syntheticPages,
			insertAt, description, plan };
		tree.message = undefined;
		changed.fire();
		if (tree.visible) void enqueueTreeWork(() => tree.reveal(ghost, { select: true, focus: false, expand: true }))
			.catch((error) => output.appendLine(`Site tree preview: ${error.message}`));
	};
	for (const placement of ['before', 'after', 'first', 'last'])
		register(`nornaEditor.placeMove${placement[0].toUpperCase()}${placement.slice(1)}`, (node) => previewMoveAt(node, placement));
	register('nornaEditor.acceptMovePreview', async () => {
		if (!movePreview || applyingMove) return;
		applyingMove = true;
		try {
			const { plan } = movePreview;
			const source = nodes.get(moveSourceId);
			if (!source) throw new Error('The moving page changed. Start the move again.');
			const choice = await vscode.window.showWarningMessage(`Complete page move for “${source.title}”?`,
				{ modal: true, detail: 'This changes site files. Editor Undo does not reverse the whole move.' }, 'Complete page move');
			if (choice !== 'Complete page move') return;
			const affected = new Set(plan.movePreview?.sourceFiles.map((file) => file.contentPath) ?? []);
			const movingDirectories = [plan.sourceDirectory, ...plan.orderChanges.map(({ from }) => from)];
			const assertClean = () => {
				const dirty = [...documentSources().keys()].filter((filename) => affected.has(filename)
					|| filename === path.join(source.siteRoot, 'site-config/settings.yaml')
					|| movingDirectories.some((directory) => filename.startsWith(directory + path.sep)));
				if (dirty.length) throw new Error(`Save or undo these unsaved files before moving:\n${dirty.map((filename) => `- ${path.relative(source.siteRoot, filename)}`).join('\n')}`);
			};
			assertClean();
			const service = await serviceFor(source.siteRoot);
			const result = await service.applyEditorPagePlacement(plan, { renameDirectory: async (from, to) => {
				assertClean();
				const edit = new vscode.WorkspaceEdit();
				edit.renameFile(vscode.Uri.file(from), vscode.Uri.file(to), { overwrite: false });
				if (!await vscode.workspace.applyEdit(edit)) throw new Error('VS Code could not move a page directory.');
			} });
			stopMove();
			await refresh();
			const moved = [...nodes.values()].find((node) => node.sourcePath === result.sourcePath);
			if (moved && tree.visible) await enqueueTreeWork(() => tree.reveal(moved, { select: true, focus: false, expand: false }));
		} finally { applyingMove = false; }
	});
	registerSitePreviewActions({ vscode, context, chooseNode, activeSite, ownerOf, serviceFor, register });
	registerSiteAttachmentActions({ vscode, context, chooseNode, ownerOf, serviceFor, documentSources, refresh, register });
	registerSiteResourceActions({ vscode, context, chooseNode, activeSite, ownerOf, serviceFor, documentSources, refresh, register });
	registerSiteFileActions({ vscode, context, chooseNode, ownerOf, serviceFor, documentSources, refresh, register });
	registerSiteAddressActions({ vscode, chooseNode, ownerOf, serviceFor, documentSources, refresh, register });
	registerSiteSourceActions({ vscode, chooseNode, ownerOf, serviceFor, refresh, register });
	register('nornaEditor.addToPage', async (argument) => {
		const target = await chooseNode(argument);
		const configurationTarget = target?.kind === 'directory' && target.role === 'configuration';
		let node = ownerOf(target);
		if (node?.kind === 'site' && !configurationTarget) node = node.children.find((child) => child.isHome);
		if (!node) return;
		const service = await serviceFor(node.siteRoot);
		const missing = (service.siteTreeEditingApiVersion === 1 ? await service.getEditorSourceFileChoices({ siteRoot: node.siteRoot, directory: node.kind === 'site' ? node.siteRoot : node.directory ?? path.dirname(node.sourcePath) }) : [])
			.filter((choice) => !configurationTarget || path.dirname(choice.filename) === target.sourcePath);
		if (configurationTarget && !missing.length) return vscode.window.showInformationMessage('All supported files in site-config already exist. Select a file to edit it.');
		const selected = await vscode.window.showQuickPick([
			...(!configurationTarget && !node.missingSource ? [{ label: '$(add) Add child page…', command: 'addChildPage' }] : []),
			...(!configurationTarget && node.kind === 'page' ? [{ label: '$(add) Import images…', command: 'importImage' }] : []),
			...missing.map((choice) => ({ label: `$(new-file) ${choice.required ? 'Create required' : 'Add'} ${choice.name}…`, description: choice.description, command: 'createSourceFile', filename: choice.filename })),
		], { title: `Add to ${node.title}`, ignoreFocusOut: true });
		if (selected) await vscode.commands.executeCommand(`nornaEditor.${selected.command}`, node, selected.filename);
	});
	for (const [command, filename] of Object.entries({ addContent: 'content.md', addPageTheme: 'page-theme.yaml', addTreeTheme: 'tree-theme.yaml', addSettings: 'settings.yaml', addSharedContent: 'shared-content.yaml' })) {
		register(`nornaEditor.${command}`, async argument => {
			const node = await chooseNode(argument);
			const choice = node.missingFiles?.find(choice => path.basename(choice.filename) === filename);
			if (!choice) throw new Error('This file already exists or is not allowed here. Refresh Site Tree.');
			return vscode.commands.executeCommand('nornaEditor.createSourceFile', node, choice.filename);
		});
	}
	register('nornaEditor.addSiteConfiguration', async () => {
		const site = activeSite();
		if (!site) throw new Error('Choose a site first.');
		const service = await serviceFor(site.siteRoot);
		const choices = await service.getEditorSourceFileChoices({ siteRoot: site.siteRoot, directory: site.siteRoot });
		const selected = await vscode.window.showQuickPick(choices.map(choice => ({ label: choice.name, description: path.relative(site.siteRoot, choice.filename), choice })), { title: 'Add missing site files', ignoreFocusOut: true });
		if (selected) await vscode.commands.executeCommand('nornaEditor.createSourceFile', site, selected.choice.filename);
	});
	const help = () => vscode.window.showInformationMessage('Site Tree: click a page or file to open it. Right-click a row for Add, Rename, Move or Delete. The arrow expands its contents. Use Shift+F10 for the keyboard menu.');
	register('nornaEditor.siteTreeHelp', help);
	register('nornaEditor.toggleUrlPaths', async () => {
		showUrlPaths = !showUrlPaths;
		await context.workspaceState.update(urlPathsKey, showUrlPaths);
		await vscode.commands.executeCommand('setContext', 'nornaSiteTree.showUrlPaths', showUrlPaths);
		await enqueueTreeWork(() => changed.fire());
	});
	register('nornaEditor.chooseSite', chooseSite);
	register('nornaEditor.refreshSiteTree', async () => { services.clear(); await refresh({ discover: true }); await revealActive(); });
	const watcher = vscode.workspace.createFileSystemWatcher('**/{content.md,settings.yaml,tree-theme.yaml,shared-content.yaml,config.yaml,page-theme.yaml,sitewide-content.yaml}');
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
		vscode.workspace.onDidSaveTextDocument((document) => schedule(document.uri.fsPath, () => refresh())),
		vscode.workspace.onDidCloseTextDocument((document) => {
			if (nodes.has(document.uri.fsPath) || nodes.has(`resource:${document.uri.fsPath}`)) schedule('closed', () => refresh());
		}),
		vscode.workspace.onDidChangeWorkspaceFolders(() => schedule('workspace', () => refresh({ discover: true }))),
		vscode.window.onDidChangeActiveTextEditor(() => schedule('active', followActive)),
		vscode.window.tabGroups.onDidChangeTabs(() => schedule('active', followActive)),
		tree.onDidChangeVisibility(({ visible }) => { if (visible) { schedule('visible', revealActive); if (!context.globalState?.get('norna.siteTree.contextHelp')) { void context.globalState?.update('norna.siteTree.contextHelp', true); void help(); } } }),
		{ dispose: () => { disposed = true; for (const timer of timers.values()) clearTimeout(timer); } },
	);
	if (vscode.languages.onDidChangeDiagnostics) context.subscriptions.push(vscode.languages.onDidChangeDiagnostics(({ uris }) => {
		if (uris.some((uri) => uri.scheme === 'file' && activeSiteRoot && inside(activeSiteRoot, uri.fsPath))) schedule('diagnostics', () => enqueueTreeWork(() => changed.fire()));
	}));
	void refresh({ discover: true }).catch((error) => output.appendLine(`Site tree: ${error.message}`));
	return { refresh: () => refresh({ discover: true }) };
}

module.exports = { registerSiteTree };
