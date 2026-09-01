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
	for (const block of ['norna-image-stack', 'norna-image-carousel', 'norna-card-list']) {
		assert.ok(blockItems.some((item) => labelOf(item) === block), `Missing block completion ${block}.`);
	}

	const home = await openDocument('site/pages/000-home/content.md');
	const imageLine = Array.from({ length: home.lineCount }, (_value, line) => line)
		.find((line) => home.lineAt(line).text === '- image: ');
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
		.find((line) => home.lineAt(line).text.includes('norna-image-stack'));
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
		(items) => items.some((item) => item.code === 'invalid-inline-note'),
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
	writeManifest({ ...compatibleManifest, editorApiVersion: compatibleManifest.editorApiVersion + 1 });
	await vscode.commands.executeCommand('nornaEditor.refresh');
	const incompatibleBlockItems = await getCompletions(blockPage, 4);
	assert.ok(!incompatibleBlockItems.some((item) => labelOf(item) === 'norna-image-stack'));

	writeManifest(compatibleManifest);
	await vscode.commands.executeCommand('nornaEditor.refresh');
	const restoredBlockItems = await waitFor(
		() => getCompletions(blockPage, 4),
		(items) => items.some((item) => labelOf(item) === 'norna-image-stack'),
		'Markdown completion did not recover after restoring a compatible editor API.',
	);
	assert.ok(restoredBlockItems.some((item) => labelOf(item) === 'norna-card-list'));

	writeManifest({ ...compatibleManifest, schemaVersion: compatibleManifest.schemaVersion + 1 });
	await vscode.commands.executeCommand('nornaEditor.refresh');
	const incompatibleEmptyItems = await getCompletions(emptyPage, 0, 0);
	assert.ok(!incompatibleEmptyItems.some((item) => labelOf(item) === 'Norna content page'));

	writeManifest(compatibleManifest);
	await vscode.commands.executeCommand('nornaEditor.refresh');
	const recoveredEmptyItems = await getCompletions(emptyPage, 0, 0);
	assert.ok(recoveredEmptyItems.some((item) => labelOf(item) === 'Norna content page'));

	console.log('Packaged VS Code integration tests passed.');
}

module.exports = { run };
