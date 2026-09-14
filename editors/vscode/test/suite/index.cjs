const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vscode = require('vscode');

const workspaceRoot = process.env.NORNA_EDITOR_TEST_WORKSPACE;
const engineRoot = process.env.NORNA_EDITOR_TEST_ENGINE_ROOT;
const engineVersion = process.env.NORNA_EDITOR_TEST_ENGINE_VERSION;
const extensionVersion = process.env.NORNA_EDITOR_TEST_EXTENSION_VERSION;
const sourceExtensionRoot = process.env.NORNA_EDITOR_TEST_EXTENSION_ROOT;

const pause = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));
const labelOf = (item) => typeof item.label === 'string' ? item.label : item.label.label;
const documentationOf = (item) => typeof item.documentation === 'string'
	? item.documentation
	: item.documentation?.value ?? '';

const openDocument = async (relativePath) => {
	const document = await vscode.workspace.openTextDocument(vscode.Uri.file(path.join(workspaceRoot, relativePath)));
	await vscode.window.showTextDocument(document);
	return document;
};

const getCompletions = async (document, line, character = document.lineAt(line).text.length) => {
	const result = await vscode.commands.executeCommand(
		'vscode.executeCompletionItemProvider',
		document.uri,
		new vscode.Position(line, character),
	);
	return result?.items ?? [];
};

const waitFor = async (read, accept, message, timeout = 10_000) => {
	const started = Date.now();
	while (Date.now() - started < timeout) {
		const value = await read();
		if (accept(value)) return value;
		await pause(100);
	}
	throw new Error(message);
};

const writeManifest = (manifest) => {
	fs.writeFileSync(path.join(engineRoot, 'schemas', 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
};

async function run() {
	assert.ok(workspaceRoot && engineRoot && engineVersion && extensionVersion && sourceExtensionRoot);
	const extension = vscode.extensions.getExtension('janga.norna-vscode');
	assert.ok(extension, 'The packaged Norna extension was not installed.');
	assert.notEqual(path.resolve(extension.extensionPath), path.resolve(sourceExtensionRoot));
	assert.equal(extension.packageJSON.version, extensionVersion);
	assert.ok(vscode.extensions.getExtension('redhat.vscode-yaml'), 'Red Hat YAML was not installed.');
	await extension.activate();
	if (['constructions', 'priority'].includes(process.env.NORNA_EDITOR_TEST_SUITE)) {
		await require('./widget-constructions.cjs').runWidgetConstructions({ openDocument, waitFor, getCompletions });
		console.log('Packaged construction widget tests passed.');
		return;
	}

	const theme = await openDocument('site/theme.yaml');
	assert.equal(theme.languageId, 'yaml');
	const themeItems = await waitFor(
		() => getCompletions(theme, 0),
		(items) => items.some((item) => labelOf(item) === 'documentation'),
		'Red Hat YAML did not return the project-local Norna preset values.',
	);
	for (const preset of ['documentation', 'portfolio', 'project', 'statement']) {
		assert.ok(themeItems.some((item) => labelOf(item) === preset), `Missing preset completion ${preset}.`);
	}
	const documentationPreset = themeItems.find((item) => labelOf(item) === 'documentation');
	assert.ok(
		documentationOf(documentationPreset).includes(`/blob/v${engineVersion}/docs/theme.md`),
		`Preset completion did not link to versioned theme documentation: ${JSON.stringify({
			detail: documentationPreset?.detail,
			documentation: documentationOf(documentationPreset),
		})}`,
	);
	const treeSurfaceDiagnostic = await waitFor(
		() => vscode.languages.getDiagnostics(theme.uri),
		(items) => items.some((item) => item.source === 'Norna' && item.code === 'tree-section-background-pattern'),
		'Norna did not report a non-uniform section background for tree navigation.',
	);
	assert.ok(treeSurfaceDiagnostic.some((item) => (
		item.source === 'Norna'
		&& item.code === 'tree-section-background-pattern'
		&& item.range.start.line === 5
	)));
	const typographyItems = await getCompletions(theme, 3);
	for (const property of ['overrides', 'profile', 'rhythm']) {
		assert.ok(typographyItems.some((item) => labelOf(item) === property), `Missing typography completion ${property}.`);
	}
	assert.ok(!typographyItems.some((item) => labelOf(item) === 'headings'));
	const invalidTypographyEdit = new vscode.WorkspaceEdit();
	invalidTypographyEdit.insert(theme.uri, new vscode.Position(3, 2), 'headings:\n    fontFamily: "Inter, sans-serif"');
	await vscode.workspace.applyEdit(invalidTypographyEdit);
	const invalidTypographyDiagnostics = await waitFor(
		() => vscode.languages.getDiagnostics(theme.uri),
		(items) => items.some((item) => /Property headings is not allowed/i.test(item.message)),
		'YAML schema validation did not reject typography.headings.',
	);
	assert.ok(invalidTypographyDiagnostics.some((item) => /Property headings is not allowed/i.test(item.message)));

	const emptyPage = await openDocument('site/pages/020-empty/content.md');
	const emptyItems = await getCompletions(emptyPage, 0, 0);
	const pageSnippet = emptyItems.find((item) => labelOf(item) === 'Norna content page');
	assert.ok(pageSnippet, 'Empty content.md did not offer the Norna page snippet.');
	assert.match(pageSnippet.insertText?.value ?? String(pageSnippet.insertText), /^---\npage:\n  description:/);
	assert.match(pageSnippet.insertText?.value ?? String(pageSnippet.insertText), /\n# \$\{2:Page title\}\n/);

	const blockPage = await openDocument('site/pages/030-block/content.md');
	const blockItems = await getCompletions(blockPage, 4);
	for (const block of ['image-stack', 'image-carousel', 'card-list']) {
		assert.ok(blockItems.some((item) => labelOf(item) === block), `Missing block completion ${block}.`);
	}
	const blockEditor = vscode.window.activeTextEditor;
	const blockSource = blockPage.getText();
	for (const prefix of ['```', '```image-st', '~~~', '~~~card-l']) {
		await blockEditor.edit((edit) => edit.replace(blockPage.lineAt(4).range, prefix));
		blockEditor.selection = new vscode.Selection(4, prefix.length, 4, prefix.length);
		await vscode.commands.executeCommand('editor.action.triggerSuggest');
		await waitFor(async () => {
			await vscode.commands.executeCommand('acceptSelectedSuggestion');
			return blockPage.lineAt(4).text;
		}, (text) => text !== prefix, `The suggestion widget did not insert a block after ${prefix}.`);
		assert.match(blockPage.lineAt(4).text, /^```(?:image-stack|image-carousel|card-list|page-list)$/,
			`Unexpected widget insertion after ${prefix}: ${JSON.stringify(blockPage.lineAt(4).text)}`);
		if (prefix.includes('image-st')) assert.equal(blockPage.lineAt(4).text, '```image-stack');
		if (prefix.includes('card-l')) assert.equal(blockPage.lineAt(4).text, '```card-list');
		await vscode.commands.executeCommand('hideSuggestWidget');
		await vscode.commands.executeCommand('leaveSnippet');
		await blockEditor.edit((edit) => edit.replace(new vscode.Range(
			blockPage.positionAt(0), blockPage.positionAt(blockPage.getText().length),
		), blockSource));
	}

	const calloutPage = await openDocument('site/pages/050-callouts/content.md');
	const calloutLine = Array.from({ length: calloutPage.lineCount }, (_value, line) => line)
		.find((line) => calloutPage.lineAt(line).text === '> [!');
	const calloutItems = await waitFor(
		() => getCompletions(calloutPage, calloutLine),
		(items) => items.some((item) => labelOf(item) === 'TIP'),
		'Semantic callout completion did not appear after > [!.',
	);
	for (const type of ['NOTE', 'TIP', 'IMPORTANT', 'WARNING', 'CAUTION', 'DANGER']) {
		assert.ok(calloutItems.some((item) => labelOf(item) === type), `Missing ${type} callout completion.`);
	}
	const tip = calloutItems.find((item) => labelOf(item) === 'TIP');
	assert.match(tip.insertText?.value ?? String(tip.insertText), /> \[!TIP\]\n> \$\{1:Callout text\}/);
	assert.match(documentationOf(tip), /docs\/content\.md#semantic-callouts/);

	const saveCalloutPage = await openDocument('site/pages/060-save-callout/content.md');
	const saveEdit = new vscode.WorkspaceEdit();
	saveEdit.insert(saveCalloutPage.uri, new vscode.Position(saveCalloutPage.lineCount - 1, 0), '\n');
	await vscode.workspace.applyEdit(saveEdit);
	const beforeSave = saveCalloutPage.getText();
	assert.ok(await saveCalloutPage.save(), 'The callout save fixture could not be saved.');
	assert.equal(saveCalloutPage.getText(), beforeSave, 'Saving must not repair or rewrite Markdown.');
	assert.match(saveCalloutPage.getText(), /> \[!TIP\]\n> Use a tip for helpful guidance\./);
	assert.doesNotMatch(saveCalloutPage.getText(), /> \[!TIP\]\n\n> /);
	assert.match(saveCalloutPage.getText(), /> \[!INFO\]\n> An unknown type remains a neutral blockquote\./);
	assert.doesNotMatch(saveCalloutPage.getText(), /> \[!INFO\]\n\n> /);
	assert.match(saveCalloutPage.getText(), /> \[!WARNING\]\n> A warning keeps its body on the next quoted line\./);
	assert.match(saveCalloutPage.getText(), /````md\n> \[!TIP\]\n> This example is inside a code fence\.\n````/);
	const firstSavedCalloutText = saveCalloutPage.getText();
	assert.ok(await saveCalloutPage.save(), 'The callout fixture could not be saved a second time.');
	assert.equal(saveCalloutPage.getText(), firstSavedCalloutText, 'A second save changed Markdown.');
	assert.equal(vscode.workspace.getConfiguration('editor', saveCalloutPage).get('formatOnSave'), false);
	assert.equal(saveCalloutPage.getText(), firstSavedCalloutText);

	const embedded = await openDocument('site/pages/070-embedded/content.md');
	const fieldItems = await getCompletions(embedded, 8);
	for (const field of ['image', 'link', 'badge-text']) {
		const properties = fieldItems.filter((item) => labelOf(item) === field && item.kind === vscode.CompletionItemKind.Property);
		assert.equal(properties.length, 1, `Expected one embedded ${field} property completion: ${JSON.stringify(fieldItems.filter((item) => labelOf(item) === field))}`);
	}
	assert.ok(!fieldItems.some((item) => item.kind === vscode.CompletionItemKind.Property && ['text', 'title'].includes(labelOf(item))), 'Already supplied fields must not be repeated.');
	const layoutItems = await getCompletions(embedded, 9);
	for (const value of ['image-top', 'image-left', 'image-right']) {
		assert.equal(layoutItems.filter((item) => labelOf(item) === value && item.kind === vscode.CompletionItemKind.EnumMember).length, 1, `Expected one embedded ${value} enum completion.`);
	}
	const duplicate = new vscode.WorkspaceEdit();
	duplicate.replace(embedded.uri, embedded.lineAt(8).range, '    title: Duplicate');
	await vscode.workspace.applyEdit(duplicate);
	const embeddedIssues = await waitFor(
		() => vscode.languages.getDiagnostics(embedded.uri).filter((issue) => /unique|duplicate/i.test(issue.message)),
		(items) => items.length > 0,
		'Embedded YAML duplicate-key diagnostics did not appear.',
	);
	assert.equal(embeddedIssues.length, 1, 'Red Hat and Norna must not duplicate embedded YAML diagnostics.');
	assert.equal(embeddedIssues[0].source, 'Norna');
	assert.equal(embeddedIssues[0].range.start.line, 8, 'Highlight the duplicate key, not the code fence.');

	const home = await openDocument('site/pages/000-home/content.md');
	const imageLine = Array.from({ length: home.lineCount }, (_value, line) => line)
		.find((line) => home.lineAt(line).text === '  - image: ');
	const imageItems = await getCompletions(home, imageLine);
	assert.ok(imageItems.some((item) => labelOf(item) === 'local.svg'));
	assert.ok(imageItems.some((item) => labelOf(item) === 'portrait.jpg'));
	const portrait = imageItems.find((item) => labelOf(item) === 'portrait.jpg');
	assert.match(documentationOf(portrait), /Run `norna content:sync`/);
	const portraitLine = Array.from({ length: home.lineCount }, (_value, line) => line)
		.find((line) => home.lineAt(line).text.includes('portrait.jpg'));
	const definitions = await vscode.commands.executeCommand(
		'vscode.executeDefinitionProvider',
		home.uri,
		new vscode.Position(portraitLine, home.lineAt(portraitLine).text.indexOf('portrait.jpg') + 2),
	);
	assert.ok(definitions.some((location) => location.uri.fsPath.endsWith(path.join('images', 'team', 'portrait.jpg'))));
	const fenceLine = Array.from({ length: home.lineCount }, (_value, line) => line)
		.find((line) => home.lineAt(line).text.includes('image-stack'));
	const hovers = await vscode.commands.executeCommand(
		'vscode.executeHoverProvider',
		home.uri,
		new vscode.Position(fenceLine, 6),
	);
	const hoverText = hovers.flatMap((hover) => hover.contents)
		.map((content) => typeof content === 'string' ? content : content.value ?? '')
		.join('\n');
	assert.match(hoverText, /managed images in a vertical stack/);
	assert.match(hoverText, /docs\/content\.md#image-stack/);

	const diagnostics = await waitFor(
		() => vscode.languages.getDiagnostics(home.uri).filter((diagnostic) => diagnostic.source === 'Norna'),
		(items) => items.some((item) => /margin:missing/.test(item.message)),
		'Norna Markdown diagnostics did not reach the Problems model.',
	);
	assert.ok(diagnostics.every((diagnostic) => diagnostic.source === 'Norna'));
	const unclosed = await openDocument('site/pages/040-unclosed/content.md');
	const unclosedDiagnostic = await waitFor(
		() => vscode.languages.getDiagnostics(unclosed.uri)
			.find((diagnostic) => diagnostic.source === 'Norna' && diagnostic.code === 'unclosed-norna-block'),
		Boolean,
		'Norna did not report the unclosed block.',
	);
	const codeActions = await vscode.commands.executeCommand(
		'vscode.executeCodeActionProvider',
		unclosed.uri,
		unclosedDiagnostic.range,
		vscode.CodeActionKind.QuickFix.value,
	);
	assert.ok(codeActions.some((action) => action.title.startsWith('Close block with')));

	const ordinaryMarkdown = await openDocument('site/notes.md');
	const ordinaryMarkdownItems = await getCompletions(ordinaryMarkdown, 0);
	assert.ok(!ordinaryMarkdownItems.some((item) => /^Norna\b/.test(labelOf(item))));
	assert.equal(vscode.languages.getDiagnostics(ordinaryMarkdown.uri).filter((item) => item.source === 'Norna').length, 0);
	const ordinaryYaml = await openDocument('other.yaml');
	const ordinaryYamlItems = await getCompletions(ordinaryYaml, 0);
	assert.ok(!ordinaryYamlItems.some((item) => /^Norna(?::|\b)/.test(labelOf(item))));

	const manifestPath = path.join(engineRoot, 'schemas', 'manifest.json');
	const compatibleManifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
	assert.equal(compatibleManifest.editorApiVersion, 2);
	for (const editorApiVersion of [1, compatibleManifest.editorApiVersion + 1]) {
		writeManifest({ ...compatibleManifest, editorApiVersion });
		await vscode.commands.executeCommand('nornaEditor.refresh');
		const incompatibleBlockItems = await getCompletions(blockPage, 4);
		assert.ok(!incompatibleBlockItems.some((item) => labelOf(item) === 'image-stack'));
	}

	writeManifest(compatibleManifest);
	await vscode.commands.executeCommand('nornaEditor.refresh');
	const restoredBlockItems = await waitFor(
		() => getCompletions(blockPage, 4),
		(items) => items.some((item) => labelOf(item) === 'image-stack'),
		'Markdown completion did not recover after restoring a compatible editor API.',
	);
	assert.ok(restoredBlockItems.some((item) => labelOf(item) === 'card-list'));

	writeManifest({ ...compatibleManifest, schemaVersion: compatibleManifest.schemaVersion + 1 });
	await vscode.commands.executeCommand('nornaEditor.refresh');
	const incompatibleEmptyItems = await getCompletions(emptyPage, 0, 0);
	assert.ok(!incompatibleEmptyItems.some((item) => labelOf(item) === 'Norna content page'));

	writeManifest(compatibleManifest);
	await vscode.commands.executeCommand('nornaEditor.refresh');
	const recoveredEmptyItems = await getCompletions(emptyPage, 0, 0);
	assert.ok(recoveredEmptyItems.some((item) => labelOf(item) === 'Norna content page'));

	await require('./completion-relevance.cjs').runCompletionRelevance({ openDocument, getCompletions });
	await require('./editing-workflows.cjs').runEditingWorkflows({ workspaceRoot, openDocument, waitFor, getCompletions });
	await require('./widget-constructions.cjs').runWidgetConstructions({ openDocument, waitFor, getCompletions });
	console.log('Packaged VS Code integration tests passed.');
}

module.exports = { run };
