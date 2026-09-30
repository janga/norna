const path = require('node:path');
const { showLinks, describeLinks } = require('./site-link-review.cjs');

function registerSiteResourceActions({ vscode, context, chooseNode, activeSite, ownerOf, serviceFor, documentSources, refresh, register }) {
	const uri = filename => vscode.Uri.file(filename);
	const inside = (root, filename) => filename === root || filename.startsWith(root + path.sep);
	const clean = filename => {
		if (vscode.workspace.textDocuments.some(doc => doc.isDirty && inside(filename, doc.uri.fsPath))) throw new Error('Save or undo unsaved changes in the affected files before continuing.');
	};
	const target = async argument => {
		const node = await chooseNode(argument);
		if (!node) throw new Error('Choose a site first.');
		const service = await serviceFor(node.siteRoot);
		if (service.siteResourceActionsApiVersion !== 1) throw new Error('Update this project’s Norna engine to use these file actions.');
		return { node, service, options: { siteRoot: node.siteRoot, filePath: node.sourcePath ?? node.siteRoot } };
	};
	const stable = async callback => {
		const sources = documentSources();
		const result = await callback(sources);
		if (JSON.stringify([...sources]) !== JSON.stringify([...documentSources()])) throw new Error('Unsaved content changed during the check. Start the action again.');
		return result;
	};
	const same = (before, after) => { if (before.fingerprint !== after.fingerprint) throw new Error('The files or references changed. Start the action again.'); };
	const confirm = async (title, detail, action) => (await vscode.window.showWarningMessage(title, { modal: true, detail }, action)) === action;

	const renameResource = async (argument, move = false) => {
		const { node, service, options } = await target(argument);
		let destinationDirectory;
		if (move) {
			const selected = await vscode.window.showOpenDialog({ title: 'Move within public', openLabel: 'Choose Folder', defaultUri: uri(path.join(node.siteRoot, 'public')), canSelectFolders: true, canSelectFiles: false, canSelectMany: false });
			if (!selected?.length) return;
			if (selected[0].scheme !== 'file') throw new Error('Choose a folder on this computer.');
			destinationDirectory = selected[0].fsPath;
		}
		const planFor = name => stable(sources => service.planEditorResourceRename({ ...options, name, destinationDirectory, sources }));
		const name = move ? path.basename(node.sourcePath) : await vscode.window.showInputBox({ title: `Rename ${node.title}`, value: path.basename(node.sourcePath), ignoreFocusOut: true,
			validateInput: async name => { try { await planFor(name); } catch (error) { return error.message; } } });
		if (name === undefined) return;
		const plan = await planFor(name);
		clean(plan.filePath); clean(plan.destination);
		if (!await confirm(`${move ? 'Move' : 'Rename'} “${node.title}”?`, [path.relative(node.siteRoot, plan.filePath) + '\n→ ' + path.relative(node.siteRoot, plan.destination),
			`Update ${plan.usage.references.length} known reference(s) in ${plan.changes.length} page(s).`, plan.usage.scope, ...plan.warnings,
			'Page edits remain unsaved in VS Code. Save them to keep the updated references. Editor Undo does not reverse the whole file operation.'].join('\n\n'), move ? 'Move' : 'Rename')) return;
		await chooseNode(node);
		same(plan, await planFor(name));
		const documents = [];
		for (const change of plan.changes) {
			const document = await vscode.workspace.openTextDocument(uri(change.sourcePath));
			if (document.getText() !== change.original) throw new Error('A referring page changed. Start again.');
			documents.push({ document, change, version: document.version });
		}
		const unchanged = () => {
			for (const { document, change, version } of documents) if (document.isClosed || document.version !== version || document.getText() !== change.original) throw new Error('A referring page changed. Start again.');
		};
		const moveFile = async (from, to) => {
			const edit = new vscode.WorkspaceEdit(); edit.renameFile(uri(from), uri(to), { overwrite: false });
			if (!await vscode.workspace.applyEdit(edit)) throw new Error('VS Code could not rename the file or folder.');
		};
		await chooseNode(node); clean(plan.filePath); clean(plan.destination); unchanged();
		same(plan, await planFor(name));
		await moveFile(plan.filePath, plan.destination);
		try {
			unchanged();
			if (documents.length) {
				// A text-only WorkspaceEdit is all-or-nothing. Keep file movement
				// separate so failure can restore the old path without losing edits.
				const edit = new vscode.WorkspaceEdit();
				for (const { document, change } of documents) edit.replace(document.uri, new vscode.Range(document.positionAt(0), document.positionAt(change.original.length)), change.updated);
				if (!await vscode.workspace.applyEdit(edit)) throw new Error('VS Code could not update the references.');
			}
		} catch (error) {
			try { await moveFile(plan.destination, plan.filePath); }
			catch (rollback) { throw new Error(`${error.message}\nRecovery needed: the resource remains at ${plan.destination}; references still use ${plan.filePath}. Restore its original name. ${rollback.message}`); }
			throw new Error(`${error.message} The original resource name was restored.`);
		} finally { await refresh(); }
	};
	const removeFolder = async argument => {
		const { node, service } = await target(argument);
		const planFor = () => stable(sources => service.planEditorFolderRemoval({ siteRoot: node.siteRoot, directory: node.sourcePath, sources }));
		const plan = await planFor(); clean(plan.target);
		if (!await confirm(`Delete “${node.title}”?`, `${plan.pages} pages and ${plan.files} files.\n\n${describeLinks(plan.usage)}\n\nReferences are not rewritten. Restore deleted files from Finder’s Trash; Editor Undo does not restore them.`, 'Move to Trash')) return;
		await chooseNode(node); same(plan, await planFor()); clean(plan.target);
		await vscode.workspace.fs.delete(uri(plan.target), { recursive: true, useTrash: true }); await refresh();
	};
	const publicCreation = async (argument, operation) => {
		const { node, service } = await target(argument);
		const replace = operation === 'replace';
		const directory = node.kind === 'site' ? path.join(node.siteRoot, 'public') : replace ? path.dirname(node.sourcePath) : node.sourcePath;
		let files = [null];
		if (operation === 'import' || replace) {
			files = await vscode.window.showOpenDialog({ title: replace ? `Replace ${node.title}` : 'Add Files', openLabel: replace ? 'Choose Replacement' : 'Add Files', canSelectFiles: true, canSelectFolders: false, canSelectMany: !replace });
			if (!files?.length) return;
			if (files.some(file => file.scheme !== 'file')) throw new Error('Choose files on this computer.');
		}
		const prepared = [], names = new Set();
		for (const file of files) {
			const options = { siteRoot: node.siteRoot, directory, source: file?.fsPath, folder: operation === 'folder', replace, pending: prepared.map(entry => entry.plan.destination) };
			const planFor = name => stable(sources => service.planEditorPublicCreation({ ...options, name, sources }));
			let name = replace ? path.basename(node.sourcePath) : file ? path.basename(file.fsPath) : undefined;
			let failure;
			if (name) try { await planFor(name); } catch (error) { failure = error.message; }
			if (!name || failure || names.has(name.toLowerCase())) name = await vscode.window.showInputBox({ title: file ? `Add ${path.basename(file.fsPath)}` : operation === 'folder' ? 'New Folder' : 'New File', value: name, prompt: failure ?? (file ? 'Choose a unique filename' : undefined), ignoreFocusOut: true,
				validateInput: async value => { if (names.has(value.toLowerCase())) return 'Another selected file already uses this name.'; try { await planFor(value); } catch (error) { return error.message; } } });
			if (name === undefined) return;
			const plan = await planFor(name); names.add(name.toLowerCase()); prepared.push({ options, plan });
		}
		const warnings = [...new Set(prepared.flatMap(entry => entry.plan.warnings))];
		let replacementUsage;
		if (replace) {
			const usage = await stable(sources => service.getEditorResourceReferences({ siteRoot: node.siteRoot, filePath: node.sourcePath, sources }));
			replacementUsage = usage;
			if (!await confirm(`Replace “${node.title}”?`, `${describeLinks(usage)}\n\nThe old file goes to Trash. Its address stays the same.`, 'Replace')) return;
		} else if (warnings.length && !await confirm('Add these public files?', warnings.join('\n'), 'Add')) return;
		const completed = [];
		try {
			for (const { options, plan } of prepared) {
				await chooseNode(node); clean(plan.destination); if (plan.source) clean(plan.source);
				same(plan, await stable(sources => service.planEditorPublicCreation({ ...options, name: plan.name, sources })));
				await vscode.workspace.fs.createDirectory(uri(directory));
				if (replace) {
					const staged = uri(path.join(context.globalStorageUri.fsPath, `public-${Date.now()}-${Math.random().toString(16).slice(2)}`));
					await vscode.workspace.fs.createDirectory(context.globalStorageUri);
					await vscode.workspace.fs.copy(uri(plan.source), staged, { overwrite: false });
					try {
						same(plan, await stable(sources => service.planEditorPublicCreation({ ...options, name: plan.name, sources }))); clean(plan.destination);
						const currentUsage = await stable(sources => service.getEditorResourceReferences({ siteRoot: node.siteRoot, filePath: node.sourcePath, sources }));
						if (JSON.stringify(currentUsage) !== JSON.stringify(replacementUsage)) throw new Error('References changed. Review the replacement again.');
						await chooseNode(node);
						await vscode.workspace.fs.delete(uri(plan.destination), { useTrash: true });
						try { await vscode.workspace.fs.copy(staged, uri(plan.destination), { overwrite: false }); }
						catch (error) { throw new Error(`The original is in Finder’s Trash. The replacement could not be written: ${error.message}`); }
					} finally { await vscode.workspace.fs.delete(staged).catch(() => {}); }
				} else if (plan.folder) await vscode.workspace.fs.createDirectory(uri(plan.destination));
				else if (plan.source) await vscode.workspace.fs.copy(uri(plan.source), uri(plan.destination), { overwrite: false });
				else {
					const edit = new vscode.WorkspaceEdit(); edit.createFile(uri(plan.destination), { overwrite: false, ignoreIfExists: false });
					if (!await vscode.workspace.applyEdit(edit)) throw new Error('The new file could not be created.');
				}
				completed.push(plan.name);
			}
		} catch (error) { throw new Error(`${error.message}\nAdded: ${completed.join(', ') || 'none'}.`); }
		finally { await refresh(); }
		if (operation === 'file') await vscode.window.showTextDocument(uri(prepared[0].plan.destination), { preview: false });
	};
	const renamePage = async argument => {
		const node = await chooseNode(argument), service = await serviceFor(node.siteRoot);
		if (node.kind !== 'page') throw new Error('Select a page to rename.');
		const document = await vscode.workspace.openTextDocument(uri(node.sourcePath));
		const source = document.getText(), version = document.version;
		const info = await service.getSiteNodeInformation({ source, sourcePath: node.sourcePath, kind: node.kind, isHome: node.isHome });
		const title = await vscode.window.showInputBox({ title: 'Rename Page', value: info.title, prompt: 'Changes the page title. The URL stays the same.', ignoreFocusOut: true, validateInput: value => !value.trim() || /[\r\n]/.test(value) ? 'Enter a title on one line.' : undefined });
		if (title === undefined) return;
		const edits = await service.editSiteNodeInformation({ siteRoot: node.siteRoot, sourcePath: node.sourcePath, source, field: 'title', value: title });
		await chooseNode(node);
		const editor = await vscode.window.showTextDocument(document, { preview: false });
		if (document.isClosed || document.version !== version) throw new Error('The page changed. Open Rename again.');
		if (!await editor.edit(builder => { for (const edit of edits) builder.replace(new vscode.Range(document.positionAt(edit.start), document.positionAt(edit.end)), edit.text); }, { undoStopBefore: true, undoStopAfter: true })) throw new Error('The page title could not be updated.');
		await refresh();
	};
	let running = false;
	const actions = { renameResource, moveResource: node => renameResource(node, true), removeFolder, renamePage,
		newPublicFile: node => publicCreation(node, 'file'), newPublicFolder: node => publicCreation(node, 'folder'), addPublicFiles: node => publicCreation(node, 'import'), replacePublicFile: node => publicCreation(node, 'replace'),
		addSitePublicFiles: () => publicCreation(activeSite(), 'import'),
		resourceReferences: async argument => { const { node, service, options } = await target(argument); const usage = await stable(sources => service.getEditorResourceReferences({ ...options, sources })); await showLinks(vscode, usage, node.siteRoot, `References: ${node.title}`); },
		copyResourceLink: async argument => { const { service, options } = await target(argument); await vscode.env.clipboard.writeText(await service.getEditorResourceAddress({ ...options, sources: documentSources() })); },
		copyPageLink: async argument => { const page = ownerOf(await chooseNode(argument)), service = await serviceFor(page.siteRoot); const addresses = await service.getEditorPageAddresses({ siteRoot: page.siteRoot, sourcePath: page.sourcePath, sources: documentSources() }); if (!addresses.webAddress) throw new Error('Repair site-config/settings.yaml to copy the full address.'); await vscode.env.clipboard.writeText(addresses.webAddress); },
	};
	for (const [name, action] of Object.entries(actions)) register(`nornaEditor.${name}`, async argument => { if (running) throw new Error('Finish or cancel the current file action first.'); running = true; try { return await action(argument); } finally { running = false; } });
}
module.exports = { registerSiteResourceActions };
