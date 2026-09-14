const assert = require('node:assert/strict');
const fs = require('node:fs');
const vscode = require('vscode');

const fullRange = (document) => new vscode.Range(document.positionAt(0), document.positionAt(document.getText().length));
const replaceText = async (document, before, after) => {
	const offset = document.getText().indexOf(before);
	assert.notEqual(offset, -1, `Missing text to edit: ${before}`);
	const editor = await vscode.window.showTextDocument(document);
	assert.ok(await editor.edit((edit) => edit.replace(new vscode.Range(
		document.positionAt(offset), document.positionAt(offset + before.length),
	), after)));
};

async function runEditingWorkflows({ openDocument, waitFor, getCompletions }) {
	const saveUnchanged = async (document, expected) => {
		await vscode.window.showTextDocument(document);
		await vscode.commands.executeCommand('workbench.action.files.save');
		await waitFor(() => document.isDirty, (dirty) => !dirty, 'Save did not finish.');
		assert.equal(document.getText(), expected, 'Save changed the editor buffer.');
		assert.equal(fs.readFileSync(document.uri.fsPath, 'utf8'), expected, 'Saved bytes differ from the expected source.');
	};
	const reopen = async (document, relativePath, expected) => {
		await vscode.window.showTextDocument(document, { preview: false });
		await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
		await waitFor(() => vscode.window.tabGroups.all.flatMap((group) => group.tabs)
			.some((tab) => tab.input instanceof vscode.TabInputText && tab.input.uri.toString() === document.uri.toString()),
		(open) => !open, 'The saved editor tab was not closed.');
		const reopened = await openDocument(relativePath);
		assert.equal(reopened.getText(), expected, 'Reopening changed the source.');
		return reopened;
	};
	const acceptSuggestion = async (document, line, prefix, expectedLabel) => {
		const editor = await vscode.window.showTextDocument(document);
		assert.ok(await editor.edit((edit) => edit.replace(document.lineAt(line).range, prefix)));
		editor.selection = new vscode.Selection(line, prefix.length, line, prefix.length);
		await waitFor(() => getCompletions(document, line), (items) => items.some((item) => (
			(typeof item.label === 'string' ? item.label : item.label.label) === expectedLabel
		)), `Provider did not offer ${expectedLabel}.`);
		await vscode.commands.executeCommand('editor.action.triggerSuggest');
		// The provider API is not evidence that the suggestion widget displays it.
		await waitFor(async () => {
			await vscode.commands.executeCommand('acceptSelectedSuggestion');
			return document.lineAt(line).text;
		}, (text) => text !== prefix, `The widget did not insert ${expectedLabel} after ${prefix}.`);
	};
	const nornaIssues = (document) => vscode.languages.getDiagnostics(document.uri).filter((issue) => issue.source === 'Norna');

	if (process.env.NORNA_EDITOR_TEST_PRETTIER === 'true') {
		const prettier = vscode.extensions.getExtension('esbenp.prettier-vscode');
		assert.ok(prettier, 'The formatter coexistence scenario requires real Prettier.');
		await prettier.activate();
		const probe = await openDocument('formatter-probe.md');
		assert.equal(vscode.workspace.getConfiguration('editor', probe).get('formatOnSave'), false);
		const edits = await vscode.commands.executeCommand('vscode.executeFormatDocumentProvider', probe.uri, { tabSize: 2, insertSpaces: true });
		assert.ok(edits?.length, 'Prettier must be operational, not merely installed.');
		console.log(`Formatter coexistence: Prettier ${prettier.packageJSON.version} active; Markdown save formatting scoped off.`);
	}

	// Every save cycle starts dirty: saving a clean document can skip save participants.
	for (const relativePath of ['site/pages/090-roundtrip/content.md', 'site/pages/100-crlf/content.md']) {
		let document = await openDocument(relativePath);
		const original = document.getText();
		assert.equal(vscode.workspace.getConfiguration('editor', document).get('formatOnSave'), false);
		for (let iteration = 1; iteration <= 3; iteration += 1) {
			const before = iteration === 1 ? 'Use a tip for helpful guidance.' : `Guidance revision ${iteration - 1}.`;
			const after = `Guidance revision ${iteration}.`;
			const expected = document.getText().replace(before, after);
			await replaceText(document, before, after);
			assert.ok(document.isDirty);
			await saveUnchanged(document, expected);
			document = await reopen(document, relativePath, expected);
			await saveUnchanged(document, expected);
		}
		assert.equal(document.getText().replace('Guidance revision 3.', 'Use a tip for helpful guidance.'), original);
		console.log(`PASS edit/save/close/reopen/edit/save: ${relativePath} (3 dirty saves; exact LF/CRLF bytes).`);
	}

	const authorPath = 'site/pages/080-authoring/content.md';
	let author = await openDocument(authorPath);
	const editor = await vscode.window.showTextDocument(author);
	const initialAuthorSource = author.getText();
	await editor.edit((edit) => edit.replace(fullRange(author), '# Authoring\n\n````md\n```image-stack\n```\n````\n\n'));
	await acceptSuggestion(author, author.lineCount - 1, '', 'NOTE');
	assert.match(author.getText(), /\n> \[!NOTE\]\n> Callout text$/);
	await vscode.commands.executeCommand('leaveSnippet');
	for (const type of ['NOTE', 'TIP', 'IMPORTANT', 'WARNING', 'CAUTION', 'DANGER']) {
		await editor.edit((edit) => edit.replace(fullRange(author), '# Authoring\n\n'));
		await acceptSuggestion(author, 2, `> [!${type}`, type);
		assert.equal(author.lineAt(2).text, `> [!${type}]`);
		assert.equal(author.lineAt(3).text, '> Callout text');
		await vscode.commands.executeCommand('leaveSnippet');
	}
	await editor.edit((edit) => edit.replace(fullRange(author), initialAuthorSource));
	await acceptSuggestion(author, 2, '```image-st', 'image-stack');
	assert.equal(author.lineAt(2).text, '```image-stack');
	await vscode.commands.executeCommand('leaveSnippet');
	const imageLine = author.getText().split('\n').findIndex((line) => line.trimStart().startsWith('- image:'));
	await acceptSuggestion(author, imageLine, '  - image: loc', 'local.svg');
	assert.equal(author.lineAt(imageLine).text, '  - image: local.svg');
	await saveUnchanged(author, author.getText());
	author = await reopen(author, authorPath, author.getText());
	const append = async (text) => {
		const editor = await vscode.window.showTextDocument(author);
		assert.ok(await editor.edit((edit) => edit.insert(author.positionAt(author.getText().length), text)));
	};
	await append('\n\n> [!TI');
	await acceptSuggestion(author, author.lineCount - 1, '> [!TI', 'TIP');
	await vscode.commands.executeCommand('type', { text: 'Preview before publishing.' });
	await vscode.commands.executeCommand('leaveSnippet');
	assert.match(author.getText(), /> \[!TIP\]\n> Preview before publishing\./);
	await append('\n\nContext.[^margin:');
	await acceptSuggestion(author, author.lineCount - 1, 'Context.[^margin:', '[^margin:name]');
	await vscode.commands.executeCommand('type', { text: 'context' });
	await vscode.commands.executeCommand('leaveSnippet');
	assert.match(author.getText(), /Context\.\[\^margin:context\]/);
	await saveUnchanged(author, author.getText());
	await waitFor(() => nornaIssues(author), (issues) => issues.some((issue) => /margin:context/.test(issue.message)), 'Missing-note diagnostic did not appear after save.');
	author = await reopen(author, authorPath, author.getText());
	await append('\n\n[^margin:context]: Additional context.\n');
	await saveUnchanged(author, author.getText());
	await waitFor(() => nornaIssues(author), (issues) => issues.length === 0, 'Diagnostics did not clear after defining the note.');
	author = await reopen(author, authorPath, author.getText());
	const validSource = author.getText();
	await replaceText(author, 'items:', 'items:\n  - image: local.svg\n    image: local.svg');
	await saveUnchanged(author, author.getText());
	await waitFor(() => nornaIssues(author), (issues) => issues.some((issue) => /unique|duplicate/i.test(issue.message)), 'Duplicate-key diagnostic did not appear.');
	const repairEditor = await vscode.window.showTextDocument(author);
	await repairEditor.edit((edit) => edit.replace(fullRange(author), validSource));
	await saveUnchanged(author, validSource);
	await waitFor(() => nornaIssues(author), (issues) => issues.length === 0, 'Duplicate-key diagnostic remained after repair.');
	author = await reopen(author, authorPath, validSource);
	await replaceText(author, '    alt:', '    al');
	const altLine = author.getText().split('\n').findIndex((line) => line.startsWith('    al'));
	await acceptSuggestion(author, altLine, '    al', 'alt');
	await vscode.commands.executeCommand('type', { text: 'A test image.' });
	await vscode.commands.executeCommand('leaveSnippet');
	await saveUnchanged(author, author.getText());
	await waitFor(() => nornaIssues(author), (issues) => issues.length === 0, 'Editing a reopened image block left an error.');
	console.log('PASS authoring: widget insertion, snippet text, image filename, repeated saves/reopens, diagnostic repair, and renewed field completion.');

	let theme = await openDocument('site/theme.yaml');
	const themeEditor = await vscode.window.showTextDocument(theme);
	await themeEditor.edit((edit) => edit.replace(fullRange(theme), 'preset: docu\n'));
	await acceptSuggestion(theme, 0, 'preset: docu', 'documentation');
	await vscode.commands.executeCommand('leaveSnippet');
	assert.equal(theme.lineAt(0).text, 'preset: documentation');
	await saveUnchanged(theme, theme.getText());
	theme = await reopen(theme, 'site/theme.yaml', theme.getText());
	await acceptSuggestion(theme, 0, 'preset: portf', 'portfolio');
	assert.equal(theme.lineAt(0).text, 'preset: portfolio');
	await saveUnchanged(theme, theme.getText());
	console.log('PASS YAML: Red Hat preset selection/edit/save/reopen/edit/save.');
}

module.exports = { runEditingWorkflows };
