const path = require('node:path');
const inside = (root, filename) => {
	const relative = path.relative(root, filename);
	return relative === '' || (relative !== '..' && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative));
};

exports.registerSitePreviewActions = ({ vscode, context, chooseNode, activeSite, ownerOf, serviceFor, register }) => {
	const output = vscode.window.createOutputChannel('Norna Preview');
	context.subscriptions.push(output);
	const pending = new Map();
	const serviceForPreview = async siteRoot => {
		const service = await serviceFor(siteRoot);
		if (service.sitePreviewApiVersion !== 1) throw new Error('Update this project’s Norna engine to use local preview from Site Tree.');
		return service;
	};
	const showLog = async (site, service) => {
		output.appendLine(`\n${site.siteRoot}\n${await service.getEditorPreviewLog({ siteRoot: site.siteRoot })}`);
		output.show(true);
	};
	const updateRunning = async (site, service) => {
		const status = await service.getEditorPreviewStatus({ siteRoot: site.siteRoot });
		site.previewRunning = status.verified;
		if (activeSite()?.siteRoot === site.siteRoot) await vscode.commands.executeCommand('setContext', 'nornaSiteTree.previewRunning', status.verified);
	};
	const dirtyFiles = root => vscode.workspace.textDocuments.filter(document => document.uri.scheme === 'file' && document.isDirty && inside(root, document.uri.fsPath));
	const preview = async (argument, wholeSite) => {
		const selected = wholeSite ? activeSite() : await chooseNode(argument);
		if (!selected) throw new Error('Choose a site before opening its preview.');
		const site = { ...selected, siteRoot: selected.siteRoot };
		const owner = wholeSite ? null : ownerOf(selected);
		const sourcePath = wholeSite ? undefined : owner?.sourcePath;
		if (!wholeSite && !sourcePath) throw new Error('Choose a page to preview.');
		if (pending.has(site.siteRoot)) return pending.get(site.siteRoot);
		const operation = (async () => {
			const service = await serviceForPreview(site.siteRoot);
			const dirty = dirtyFiles(site.siteRoot);
			if (dirty.length) {
				const choice = await vscode.window.showWarningMessage(`${dirty.length} unsaved file${dirty.length === 1 ? '' : 's'} in this site. Preview uses saved files.`, {
					modal: true, detail: dirty.map(document => path.relative(site.siteRoot, document.uri.fsPath)).join('\n'),
				}, 'Save Site and Preview', 'Preview Saved Files');
				if (!choice || choice === 'Cancel') return;
				if (choice === 'Save Site and Preview') {
					for (const document of dirty) if (!(await document.save())) throw new Error(`Could not save ${path.relative(site.siteRoot, document.uri.fsPath)}. Preview was not started.`);
					if (dirtyFiles(site.siteRoot).length) throw new Error('This site still has unsaved changes. Save them before previewing the new version.');
				}
			}
			try {
				const result = await vscode.window.withProgress({ location: vscode.ProgressLocation.Notification, title: `Opening preview: ${owner?.title ?? path.basename(site.siteRoot)}`, cancellable: true }, async (progress, token) => {
					const controller = new AbortController();
					const listener = token.onCancellationRequested(() => controller.abort());
					if (token.isCancellationRequested) controller.abort();
					try {
						progress.report({ message: 'Checking or starting the site server…' });
						return await service.startEditorSitePreview({ siteRoot: site.siteRoot, sourcePath, signal: controller.signal, onOutput: text => output.append(text) });
					} finally { listener.dispose(); }
				});
				await updateRunning(site, service);
				output.appendLine(`Preview: ${result.url}${result.reused ? ' (existing server)' : ''}`);
				let opened = false;
				try { opened = await vscode.env.openExternal(vscode.Uri.parse(result.url)); } catch (error) { output.appendLine(error.message); }
				if (!opened) {
					const choice = await vscode.window.showWarningMessage(`The server is ready, but the browser could not open ${result.url}`, 'Copy URL', 'Retry', 'Show Preview Log');
					if (choice === 'Copy URL') await vscode.env.clipboard.writeText(result.url);
					else if (choice === 'Retry') {
						if (!(await vscode.env.openExternal(vscode.Uri.parse(result.url)))) await vscode.env.clipboard.writeText(result.url);
					} else if (choice === 'Show Preview Log') await showLog(site, service);
				}
			} catch (error) {
				output.appendLine(error.message);
				if (error.message === 'Preview cancelled.') return;
				const choice = await vscode.window.showErrorMessage(error.message, 'Show Preview Log');
				if (choice === 'Show Preview Log') await showLog(site, service);
			} finally {
				// Failed rendering may leave a reused server running; cancellation
				// may have stopped a newly started one. Keep Stop Preview truthful.
				await updateRunning(site, service).catch(error => output.appendLine(error.message));
			}
		})();
		pending.set(site.siteRoot, operation);
		try { return await operation; } finally { pending.delete(site.siteRoot); }
	};
	register('nornaEditor.previewPage', argument => preview(argument, false));
	register('nornaEditor.previewSite', () => preview(undefined, true));
	register('nornaEditor.showPreviewLog', async () => {
		const site = activeSite();
		if (site) await showLog(site, await serviceForPreview(site.siteRoot));
	});
	register('nornaEditor.stopPreview', async () => {
		const site = activeSite();
		if (!site) return;
		const service = await serviceForPreview(site.siteRoot);
		await vscode.window.withProgress({ location: vscode.ProgressLocation.Notification, title: 'Stopping preview server…' }, () => service.stopEditorSitePreview({ siteRoot: site.siteRoot, onOutput: text => output.append(text) }));
		await updateRunning(site, service);
	});
};
