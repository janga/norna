const path = require('node:path');

function registerSiteSourceActions({ vscode, chooseNode, ownerOf, serviceFor, refresh, register }) {
	let running = false;
	register('nornaEditor.createSourceFile', async (argument, filename) => {
		if (running) throw new Error('Finish or cancel the current file creation first.');
		running = true;
		try {
			const page = ownerOf(await chooseNode(argument));
			if (!page) throw new Error('Select the page that should own the new file.');
			const service = await serviceFor(page.siteRoot);
			if (service.siteTreeEditingApiVersion !== 1) throw new Error('Update the project engine to create missing source files from Site Tree.');
			const options = { siteRoot: page.siteRoot, directory: page.kind === 'site' ? page.siteRoot : page.directory ?? path.dirname(page.sourcePath) };
			const choices = await service.getEditorSourceFileChoices(options);
			const choice = choices.find((entry) => entry.filename === filename);
			if (!choice) throw new Error('This file already exists or is not allowed here. Open Add again.');
			let value;
			if (choice.input) {
				value = await vscode.window.showInputBox({ title: `Create ${choice.name}`, ignoreFocusOut: true,
					prompt: choice.input === 'url' ? 'The public URL where this site will be published' : choice.input === 'label' ? 'Navigation category label' : 'Page title',
					value: choice.input === 'url' ? undefined : page.title,
					validateInput: async (value) => { try { await service.planEditorSourceFileCreation({ ...options, filename, value }); } catch (error) { return error.message; } return undefined; } });
				if (value === undefined) return;
			}
			const plan = await service.planEditorSourceFileCreation({ ...options, filename, value });
			const confirm = await vscode.window.showQuickPick([{ label: `Create ${choice.name}`, description: choice.effect, detail: filename }],
				{ title: `Add to ${page.title}`, placeHolder: 'Review the file and its effect; Escape cancels', ignoreFocusOut: true });
			if (!confirm) return;
			await chooseNode(page);
			if (vscode.workspace.textDocuments.some((document) => document.uri.fsPath === filename && document.isDirty)) throw new Error('Save or close the unsaved buffer for this file before creating it.');
			const created = await service.createEditorSourceFile(plan);
			await refresh();
			await vscode.window.showTextDocument(vscode.Uri.file(created.sourcePath), { preview: false });
		} finally { running = false; }
	});
}

module.exports = { registerSiteSourceActions };
