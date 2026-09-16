const fs = require('node:fs');
const { createHash } = require('node:crypto');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const vscode = require('vscode');
const {
	getNornaDocumentContext,
	getNornaProjectContext,
	supportedEditorApiVersion,
	supportedSchemaVersion,
} = require('./norna-project.cjs');
const { getYamlSchemaSnippetCompletions, getYamlPropertyCompletionContext } = require('./yaml-schema-completions.cjs');

const schemaContentByUri = new Map();
const documentContextByPath = new Map();
const projectContextByPath = new Map();
const serviceByRoot = new Map();
const diagnosticTimers = new Map();
const publicAssetDiagnosticUrisByRoot = new Map();
let diagnostics;
let extensionVersion;
let output;
let statusBar;

const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, 'utf8'));

const getDocumentContext = (documentPath) => {
	if (!documentContextByPath.has(documentPath)) {
		documentContextByPath.set(documentPath, getNornaDocumentContext(documentPath));
	}
	return documentContextByPath.get(documentPath);
};

const getProjectContext = (documentPath) => {
	if (!projectContextByPath.has(documentPath)) {
		projectContextByPath.set(documentPath, getNornaProjectContext(documentPath));
	}
	return projectContextByPath.get(documentPath);
};

const documentationRootFor = (documentPath) => {
	const version = getProjectContext(documentPath)?.nornaPackage?.packageJson?.version;
	const reference = version ? `v${version}` : 'main';
	return `https://github.com/janga/norna/blob/${reference}/docs`;
};

const documentationLinkFor = async (documentPath, label, file, anchor) => {
	const nornaPackage = getProjectContext(documentPath)?.nornaPackage;
	const helper = nornaPackage && path.join(nornaPackage.root, 'scripts', 'lib', 'documentation-links.mjs');
	if (vscode.workspace.isTrusted && helper && fs.existsSync(helper)) {
		const revision = `${nornaPackage.packageJson.version}-${fs.statSync(helper).mtimeMs}`;
		const links = await import(`${pathToFileURL(helper).href}?revision=${encodeURIComponent(revision)}`);
		if (links.documentationLinkForVersion) {
			return links.documentationLinkForVersion(nornaPackage.packageJson.version, label, file, anchor);
		}
	}
	// Older project installations have their reference only in their own tags.
	return `[${label}](${documentationRootFor(documentPath)}/${file}${anchor ? `#${anchor}` : ''})`;
};

const getSchema = (documentPath, kind) => {
	const context = getDocumentContext(documentPath);
	const nornaPackage = context?.schemaCompatible ? context.nornaPackage : null;
	if (!nornaPackage || context.schemaKind !== kind) return null;
	const manifestPath = path.join(nornaPackage.root, 'schemas', 'manifest.json');
	const manifest = readJson(manifestPath);
	const filename = manifest.files?.[kind];
	if (!filename) return null;
	const schemaPath = path.join(nornaPackage.root, 'schemas', filename);
	if (!fs.existsSync(schemaPath)) return null;
	return { manifest, nornaPackage, schema: readJson(schemaPath), schemaPath };
};

const getLanguageService = async (documentPath) => {
	if (!vscode.workspace.isTrusted) return null;
	const context = getProjectContext(documentPath);
	const nornaPackage = context?.editorCompatible ? context.nornaPackage : null;
	if (!nornaPackage) return null;
	if (!serviceByRoot.has(nornaPackage.root)) {
		const servicePath = path.join(nornaPackage.root, 'scripts', 'lib', 'editor-language-service.mjs');
		const revision = fs.existsSync(servicePath)
			? `${nornaPackage.packageJson.version}-${fs.statSync(servicePath).mtimeMs}`
			: 'missing';
		serviceByRoot.set(nornaPackage.root, fs.existsSync(servicePath)
			? import(`${pathToFileURL(servicePath).href}?revision=${encodeURIComponent(revision)}`)
			: Promise.resolve(null));
	}
	return serviceByRoot.get(nornaPackage.root);
};

const isNornaContentDocument = (document) => (
	document.languageId === 'markdown'
	&& getDocumentContext(document.uri.fsPath)?.documentKind === 'content'
);

const getYamlSchemaKind = (document) => document.languageId === 'yaml'
	? getDocumentContext(document.uri.fsPath)?.schemaKind
	: undefined;

const isNornaYamlDocument = (document) => Boolean(
	getYamlSchemaKind(document) && getDocumentContext(document.uri.fsPath)?.schemaCompatible
);

const getSchemaChoices = (schema) => {
	if (Array.isArray(schema?.enum)) {
		return schema.enum.map((value) => ({ value, title: String(value), description: '' }));
	}
	if (Array.isArray(schema?.oneOf)) {
		return schema.oneOf
			.filter((candidate) => Object.hasOwn(candidate, 'const'))
			.map((candidate) => ({
				value: candidate.const,
				title: candidate.title ?? String(candidate.const),
				description: candidate.description ?? '',
			}));
	}
	return [];
};

const choiceDocumentation = (choices) => choices
	.map((choice) => `- \`${choice.value}\`: ${choice.description || choice.title}`)
	.join('\n');

const schemaDocumentation = (property, choices = []) => [
	property.markdownDescription ?? property.description,
	choices.length > 0 ? choiceDocumentation(choices) : null,
	property.default !== undefined ? `Default: \`${property.default}\`.` : null,
].filter(Boolean).join('\n\n');

const displaySnippet = (snippet) => snippet
	.replace(/\$\{\d+:([^}]+)\}/g, '$1')
	.replace(/\$\{\d+\|([^}]+)\|\}/g, (_match, choices) => choices.split(',')[0]);

const markdownBlockExample = (snippet) => `\`\`\`\`md\n${displaySnippet(snippet)}\n\`\`\`\``;

const semanticCalloutDefinitions = Object.freeze([
	{ type: 'NOTE', description: 'Neutral context or background information.' },
	{ type: 'TIP', description: 'Helpful guidance or a positive suggestion.' },
	{ type: 'IMPORTANT', description: 'Information that deserves particular attention.' },
	{ type: 'WARNING', description: 'A possible problem, harm, or loss.' },
	{ type: 'CAUTION', description: 'A significant negative consequence.' },
	{ type: 'DANGER', description: 'Severe or irreversible harm.' },
]);

const isInsideMarkdownFence = (document, lineIndex) => {
	let fence = null;
	for (let index = 0; index < lineIndex; index += 1) {
		const match = document.lineAt(index).text.match(/^ {0,3}(`{3,}|~{3,})(.*)$/);
		if (!match) continue;
		const marker = match[1];
		if (!fence) {
			fence = { character: marker[0], length: marker.length };
			continue;
		}
		if (marker[0] === fence.character && marker.length >= fence.length && !match[2].trim()) fence = null;
	}
	return Boolean(fence);
};

// Call only after file/context checks, and only with items owned by Norna.
// Keep local relevance ordering; VS Code still owns matching and snippet placement.
const prioritizeNornaCompletions = (items) => items?.map((item, index) => {
	item.sortText = `0000-norna-${item.sortText ?? String(index).padStart(4, '0')}`;
	return item;
});

const getSemanticCalloutCompletionItems = async (document, position, { allowBlank = false } = {}) => {
	if (isInsideMarkdownFence(document, position.line)) return [];
	const lineText = document.lineAt(position.line).text;
	const prefix = lineText.slice(0, position.character);
	const match = prefix.match(/^(\s{0,3}>\s*)\[!([A-Za-z0-9-]*)$/);
	const blank = allowBlank && /^ {0,3}$/.test(lineText);
	if (!match && !blank) return [];

	const quotePrefix = blank ? '> ' : `${match[1].trimEnd()} `;
	const range = new vscode.Range(position.line, 0, position.line, position.character);
	const reference = await documentationLinkFor(
		document.uri.fsPath,
		'Semantic callout reference',
		'content.md',
		'semantic-callouts',
	);
	return semanticCalloutDefinitions.map((definition, index) => {
		const item = new vscode.CompletionItem(definition.type, vscode.CompletionItemKind.EnumMember);
		item.detail = 'Norna semantic callout';
		item.documentation = new vscode.MarkdownString([
			definition.description,
			'The marker stays on its own line; the next quoted line contains the callout text.',
			reference,
		].join('\n\n'));
		item.insertText = new vscode.SnippetString(
			`${quotePrefix}[!${definition.type}]\n${quotePrefix}\${1:Callout text}`,
		);
		item.range = range;
		item.filterText = blank ? definition.type : `${quotePrefix}[!${definition.type}]`;
		item.sortText = `callout-${String(index).padStart(2, '0')}`;
		return item;
	});
};

const getFrontmatterRange = (document) => {
	if (document.lineCount < 2 || document.lineAt(0).text.trim() !== '---') return null;
	for (let line = 1; line < document.lineCount; line += 1) {
		if (document.lineAt(line).text.trim() === '---') return { start: 1, end: line - 1 };
	}
	return null;
};

const getSchemaAtIndent = (document, position, schema) => {
	const frontmatter = getFrontmatterRange(document);
	if (!frontmatter || position.line < frontmatter.start || position.line > frontmatter.end) return null;
	const currentText = document.lineAt(position.line).text;
	const currentIndent = currentText.match(/^ */)?.[0].length ?? 0;
	const stack = [];

	for (let line = frontmatter.start; line < position.line; line += 1) {
		const text = document.lineAt(line).text;
		if (!text.trim() || text.trim().startsWith('#')) continue;
		const match = text.match(/^( *)([A-Za-z][A-Za-z0-9-]*):\s*(.*)$/);
		if (!match) continue;
		const indent = match[1].length;
		while (stack.length > 0 && stack[stack.length - 1].indent >= indent) stack.pop();
		if (!match[3].trim()) stack.push({ indent, key: match[2] });
	}

	while (stack.length > 0 && stack[stack.length - 1].indent >= currentIndent) stack.pop();
	let currentSchema = schema;
	for (const entry of stack) {
		currentSchema = currentSchema?.properties?.[entry.key] ?? currentSchema?.additionalProperties;
		if (!currentSchema || typeof currentSchema !== 'object') return null;
	}

	return { currentIndent, currentSchema, frontmatter };
};

const schemaCompletionItems = (document, position, schema) => {
	const frontmatter = getFrontmatterRange(document);
	if (!frontmatter || position.line < frontmatter.start || position.line > frontmatter.end) return [];
	const source = Array.from({ length: frontmatter.end - frontmatter.start + 1 },
		(_value, index) => document.lineAt(frontmatter.start + index).text).join('\n');
	const context = getYamlPropertyCompletionContext({ source, line: position.line - frontmatter.start, schema });
	if (!context) return [];

	return Object.entries(context.currentSchema.properties)
		.filter(([key]) => !context.existingKeys.has(key))
		.map(([key, property]) => {
			const choices = getSchemaChoices(property);
			const item = new vscode.CompletionItem(key, vscode.CompletionItemKind.Property);
			item.range = new vscode.Range(position.line, context.currentIndent, position.line, document.lineAt(position.line).text.length);
			item.detail = property.description ?? 'Norna frontmatter field';
			item.documentation = new vscode.MarkdownString(schemaDocumentation(property, choices));
			if (choices.length > 0) {
				item.insertText = new vscode.SnippetString(`${key}: \${1|${choices.map(({ value }) => value).join(',')}|}`);
			} else if (property.type === 'boolean') {
				item.insertText = new vscode.SnippetString(`${key}: \${1|true,false|}`);
			} else if (property.type === 'object') {
				item.insertText = new vscode.SnippetString(`${key}:\n${' '.repeat(context.currentIndent + 2)}\${0}`);
			} else {
				item.insertText = new vscode.SnippetString(`${key}: \${0}`);
			}
			return item;
		});
};

const makeWholeDocumentSnippet = (document, label, detail, source, documentation) => {
	const item = new vscode.CompletionItem({ label, description: 'Complete file' }, vscode.CompletionItemKind.Snippet);
	item.detail = detail;
	item.documentation = new vscode.MarkdownString([detail, documentation].filter(Boolean).join('\n\n'));
	item.insertText = new vscode.SnippetString(source);
	item.range = new vscode.Range(
		document.positionAt(0),
		document.positionAt(document.getText().length),
	);
	return item;
};

const getEmptyContentCompletionItems = async (document) => {
	const context = getDocumentContext(document.uri.fsPath);
	if (document.getText().trim() || !context?.schemaCompatible || !context.editorCompatible) return [];
	return [makeWholeDocumentSnippet(
		document,
		'Norna content page',
		'Create a Norna page with optional metadata, one page title, and its first section.',
		'---\npage:\n  description: ${1:Short page description.}\n---\n\n# ${2:Page title}\n\n## ${3:Introduction} {#${4:introduction}}\n\n${0}',
		await documentationLinkFor(document.uri.fsPath, 'Content reference', 'content.md'),
	)];
};

const getEmptyYamlCompletionItems = async (document) => {
	if (!isNornaYamlDocument(document) || document.getText().trim()) return [];
	const kind = getYamlSchemaKind(document);
	const resolved = getSchema(document.uri.fsPath, kind);
	if (!resolved) return [];
	let schemaPath = path.relative(path.dirname(document.uri.fsPath), resolved.schemaPath).split(path.sep).join('/');
	if (!schemaPath.startsWith('.')) schemaPath = `./${schemaPath}`;
	const directive = new vscode.SnippetString().appendText(`# yaml-language-server: $schema=${schemaPath}`).value;
	const presetChoices = getSchemaChoices(resolved.schema.properties?.preset).map(({ value }) => value);
	const snippets = {
		category: `${directive}\n\nlabel: \${1:Category label}\n`,
		config: `${directive}\n\nurl: \${1:https://example.com/}\n`,
		theme: `${directive}\n\npreset: \${1|${presetChoices.join(',')}|}\n`,
		sitewideContent: `${directive}\n\nfooter:\n  copyrightMessage: \${1:Copyright owner.}\n`,
	};
	const labels = {
		category: 'Norna page category',
		config: 'Norna site configuration',
		theme: 'Norna theme',
		sitewideContent: 'Norna site-wide content',
	};
	const documentation = {
		category: ['Nested pages reference', 'pages.md', 'nested-pages'],
		config: ['Configuration reference', 'configuration.md'],
		theme: ['Theme reference', 'theme.md'],
		sitewideContent: ['Site-wide content reference', 'sitewide-content.md'],
	};
	return [makeWholeDocumentSnippet(
		document,
		labels[kind],
		`Create a minimal ${path.basename(document.uri.fsPath)}.`,
		snippets[kind],
		await documentationLinkFor(document.uri.fsPath, ...documentation[kind]),
	)];
};

const getYamlSchemaSnippetItems = (document, position) => {
	if (!isNornaYamlDocument(document)) return [];
	const kind = getYamlSchemaKind(document);
	const resolved = getSchema(document.uri.fsPath, kind);
	if (!resolved) return [];
	const snippets = getYamlSchemaSnippetCompletions({
		lineText: document.lineAt(position.line).text,
		offset: document.offsetAt(position),
		schema: resolved.schema,
		source: document.getText(),
	});

	return snippets.map((snippet, index) => {
		const item = new vscode.CompletionItem(snippet.label, vscode.CompletionItemKind.Snippet);
		item.detail = `Norna ${path.basename(document.uri.fsPath)} snippet`;
		item.documentation = new vscode.MarkdownString(snippet.documentation);
		item.insertText = new vscode.SnippetString(snippet.text);
		item.range = document.lineAt(position.line).range;
		item.filterText = `${document.lineAt(position.line).text}${snippet.label}`;
		item.sortText = String(index).padStart(3, '0');
		return item;
	});
};

const makeBlockCandidateItem = (candidate, replacementRange, documentation) => {
	const item = new vscode.CompletionItem(candidate.key, ['item', 'new-item'].includes(candidate.kind)
		? vscode.CompletionItemKind.Snippet
		: vscode.CompletionItemKind.Property);
	const values = candidate.values ? Object.keys(candidate.values) : [];
	item.detail = candidate.description;
	item.documentation = new vscode.MarkdownString([
		candidate.description,
		candidate.default !== undefined ? `Default: \`${candidate.default}\`.` : null,
		values.length > 0 ? choiceDocumentation(values.map((value) => ({
			value,
			title: candidate.values[value].title,
			description: candidate.values[value].description,
		}))) : null,
		documentation,
	].filter(Boolean).join('\n\n'));
	const placeholder = values.length > 0
		? `\${1|${values.join(',')}|}`
		: `\${1:${candidate.key === 'image' ? 'filename.jpg' : candidate.key === 'title' ? 'Card title' : 'value'}}`;
	item.insertText = new vscode.SnippetString(candidate.snippet ?? `${candidate.prefix}${candidate.key}: ${placeholder}`);
	item.range = replacementRange;
	if (candidate.kind === 'new-item') {
		item.range = new vscode.Range(replacementRange.start.line, 0, replacementRange.end.line, replacementRange.end.character);
		item.keepWhitespace = true;
	}
	return item;
};

const makeBlockValueItem = (candidate, replacementRange, documentation) => {
	const item = new vscode.CompletionItem({
		label: candidate.label,
		description: candidate.title,
	}, vscode.CompletionItemKind.EnumMember);
	item.detail = candidate.description;
	item.documentation = new vscode.MarkdownString([candidate.description, documentation].filter(Boolean).join('\n\n'));
	item.insertText = candidate.label;
	item.range = replacementRange;
	return item;
};

const getNoteCompletionItems = async (document, position) => {
	if (isInsideMarkdownFence(document, position.line)) return [];
	const prefix = document.lineAt(position.line).text.slice(0, position.character);
	const match = prefix.match(/\[\^(?:margin(?::[^\]\s]*)?)?$/);
	if (!match) return [];
	const range = new vscode.Range(position.line, position.character - match[0].length, position.line, position.character);
	const notesDocumentation = await documentationLinkFor(document.uri.fsPath, 'Sidenote reference', 'content.md', 'side-notes');
	return [
		Object.assign(new vscode.CompletionItem('[^margin:name]', vscode.CompletionItemKind.Snippet), {
			detail: 'Attach a lettered sidenote to ordinary body text.',
			documentation: new vscode.MarkdownString([
				'Use one reference per named sidenote, outside containers. Several different sidenotes may share a paragraph.',
				notesDocumentation,
			].join('\n\n')),
			insertText: new vscode.SnippetString('[^margin:${1:name}]'),
			range,
		}),
		Object.assign(new vscode.CompletionItem('[^margin:name]: ...', vscode.CompletionItemKind.Snippet), {
			detail: 'Define a named sidenote at page top level.',
			documentation: new vscode.MarkdownString([
				'Write one paragraph outside containers, anywhere before or after the matching reference.',
				notesDocumentation,
			].join('\n\n')),
			insertText: new vscode.SnippetString('[^margin:${1:name}]: ${2:Explanatory text}'),
			range,
		}),
	].filter((_item, index) => index === 0 || prefix === match[0]);
};

const getBlockCompletionItems = async (document, position, service, scope) => {
	const lineText = document.lineAt(position.line).text;
	const trimmed = lineText.trim();
	const blockPrefix = scope.insertBlocks ? '' : trimmed.match(/^(?:```|~~~)([a-z-]*)$/)?.[1];
	const matchingBlocks = (!scope.blocks && !scope.insertBlocks) || blockPrefix === undefined
		? []
		: Object.entries(service.nornaBlockDefinitions)
			.filter(([name]) => name.startsWith(blockPrefix));
	if (matchingBlocks.length > 0) {
		return matchingBlocks.map(([name, definition]) => {
			const item = new vscode.CompletionItem(name, vscode.CompletionItemKind.Snippet);
			item.detail = `Norna ${name} block`;
			item.documentation = new vscode.MarkdownString([
				markdownBlockExample(definition.snippet),
				definition.description,
				definition.documentation,
			].filter(Boolean).join('\n\n'));
			item.insertText = new vscode.SnippetString(definition.snippet);
			item.range = document.lineAt(position.line).range;
			item.filterText = scope.insertBlocks ? name : `${trimmed.slice(0, 3)}${name}`;
			return item;
		});
	}
	if (!scope.embedded) return scope.notes ? getNoteCompletionItems(document, position) : [];

	const imageContext = await service.getImageCompletionContext({
		documentPath: document.uri.fsPath,
		line: position.line,
		source: document.getText(),
	});
	if (imageContext) {
		const imageFilesDocumentation = await documentationLinkFor(
			document.uri.fsPath,
			'Managed image files',
			'content.md',
			'image-files',
		);
		const valueMatch = lineText.match(/image:\s*([^\s]*)$/);
		const valueStart = imageContext.valueRange?.start ?? (valueMatch ? lineText.length - valueMatch[1].length : position.character);
		const replacementRange = new vscode.Range(position.line, valueStart, position.line, imageContext.valueRange?.end ?? lineText.length);
		return imageContext.candidates.map((candidate) => {
			const usageLabel = { unused: 'Unused on this page', used: 'Already used on this page', ambiguous: 'Ambiguous on this page' }[candidate.usage];
			const label = {
				label: candidate.filename,
				description: usageLabel,
				...(candidate.duplicateCount > 1 ? { detail: ` (${candidate.siteRelativePath})` } : {}),
			};
			const item = new vscode.CompletionItem(label, vscode.CompletionItemKind.File);
			item.insertText = candidate.filename;
			item.range = replacementRange;
			item.sortText = candidate.sortText;
			item.detail = candidate.isExpected ? 'Image on this page' : `Image on another page: ${candidate.siteRelativePath}`;
			const documentation = [
				candidate.usage === 'used' ? 'Referenced in an image or card block in this page, including unsaved edits.'
					: candidate.usage === 'ambiguous' ? 'This page references the filename, but it cannot be resolved to one source image.'
						: 'Not referenced in an image or card block in this page. This does not indicate whether the file has been published.',
				candidate.isExpected
					? 'Stored in this page\'s images directory.'
					: `Stored at \`${candidate.siteRelativePath}\`. Run \`norna content:sync\` after moving the reference.`,
				candidate.duplicateCount > 1 ? `The filename is ambiguous across ${candidate.duplicateCount} files.` : null,
				candidate.referencedBy.length > 0 ? `Referenced by: ${candidate.referencedBy.map((value) => `\`${value}\``).join(', ')}.` : null,
				imageFilesDocumentation,
			].filter(Boolean).join('\n\n');
			item.documentation = new vscode.MarkdownString(documentation);
			return item;
		});
	}

	const blockContext = service.getNornaBlockCompletionContext({
		line: position.line,
		source: document.getText(),
	});
	if (!blockContext) return [];
	if (blockContext.mode === 'value') {
		const valueMatch = lineText.match(/:\s*(.*?)\s*$/);
		const valueStart = blockContext.valueRange?.start ?? (valueMatch ? lineText.lastIndexOf(valueMatch[1]) : position.character);
		const range = new vscode.Range(position.line, valueStart, position.line, blockContext.valueRange?.end ?? lineText.length);
		return blockContext.candidates.map((candidate) => makeBlockValueItem(
			candidate,
			range,
			blockContext.definition.documentation,
		));
	}

	const contentStart = lineText.search(/\S|$/);
	const range = new vscode.Range(position.line, contentStart, position.line, lineText.length);
	return blockContext.candidates.map((candidate) => makeBlockCandidateItem(
		candidate,
		range,
		blockContext.definition.documentation,
	));
};

const toDiagnostic = (document, issue) => {
	const line = Math.max(0, Math.min(document.lineCount - 1, (issue.line ?? 1) - 1));
	const range = document.lineAt(line).range;
	const severity = issue.severity === 'warning' ? vscode.DiagnosticSeverity.Warning : vscode.DiagnosticSeverity.Error;
	const diagnostic = new vscode.Diagnostic(range, issue.message, severity);
	diagnostic.source = 'Norna';
	if (issue.code) diagnostic.code = issue.code;
	return diagnostic;
};

const clearPublicAssetDiagnostics = (siteRoot) => {
	for (const uri of publicAssetDiagnosticUrisByRoot.get(siteRoot) ?? []) diagnostics.delete(uri);
	publicAssetDiagnosticUrisByRoot.delete(siteRoot);
};

const refreshPublicAssetDiagnostics = async (documentPath, service) => {
	const status = await service?.getSitePublicAssetStatus(documentPath);
	if (!status) return null;
	clearPublicAssetDiagnostics(status.siteRoot);

	const issuesByUri = new Map();
	for (const issue of status.issues) {
		const uri = vscode.Uri.file(issue.absolutePath);
		const key = uri.toString();
		if (!issuesByUri.has(key)) issuesByUri.set(key, { uri, issues: [] });
		const severity = issue.severity === 'error'
			? vscode.DiagnosticSeverity.Error
			: vscode.DiagnosticSeverity.Warning;
		const line = Math.max(0, (issue.line ?? 1) - 1);
		const diagnostic = new vscode.Diagnostic(new vscode.Range(line, 0, line, 1), issue.message, severity);
		diagnostic.source = 'Norna';
		diagnostic.code = issue.code;
		issuesByUri.get(key).issues.push(diagnostic);
	}

	const uris = [];
	for (const { uri, issues } of issuesByUri.values()) {
		diagnostics.set(uri, issues);
		uris.push(uri);
	}
	publicAssetDiagnosticUrisByRoot.set(status.siteRoot, uris);
	return status;
};

const refreshDiagnostics = async (document) => {
	if (!isNornaContentDocument(document) && !isNornaYamlDocument(document)) return;
	const service = await getLanguageService(document.uri.fsPath);
	if (!service) return;
	try {
		if (isNornaContentDocument(document)) {
			const issues = await service.getMarkdownDiagnostics({ documentPath: document.uri.fsPath, source: document.getText() });
			diagnostics.set(document.uri, issues.map((issue) => toDiagnostic(document, issue)));
		} else if (['theme', 'pageTheme'].includes(getYamlSchemaKind(document))) {
			const issues = typeof service.getThemeDiagnostics === 'function'
				? await service.getThemeDiagnostics({ documentPath: document.uri.fsPath, source: document.getText() })
				: [];
			diagnostics.set(document.uri, issues.map((issue) => toDiagnostic(document, issue)));
		}
		await refreshPublicAssetDiagnostics(document.uri.fsPath, service);
	} catch (error) {
		output.appendLine(`Diagnostics failed for ${document.uri.fsPath}: ${error instanceof Error ? error.stack ?? error.message : String(error)}`);
	}
};

const scheduleDiagnostics = (document, delay = 350) => {
	if (!isNornaContentDocument(document) && !isNornaYamlDocument(document)) return;
	const key = document.uri.toString();
	clearTimeout(diagnosticTimers.get(key));
	diagnosticTimers.set(key, setTimeout(() => {
		diagnosticTimers.delete(key);
		void refreshDiagnostics(document);
	}, delay));
};

const scheduleOpenThemeDiagnostics = (documentPath, delay = 350) => {
	const siteRoot = getProjectContext(documentPath)?.siteRoot;
	if (!siteRoot) return;
	for (const document of vscode.workspace.textDocuments) {
		if (!['theme', 'pageTheme'].includes(getYamlSchemaKind(document))) continue;
		if (getProjectContext(document.uri.fsPath)?.siteRoot !== siteRoot) continue;
		scheduleDiagnostics(document, delay);
	}
};

const registerYamlSchemas = async (context) => {
	const yamlExtension = vscode.extensions.getExtension('redhat.vscode-yaml');
	if (!yamlExtension) {
		output.appendLine('YAML support is unavailable because redhat.vscode-yaml is not installed.');
		return;
	}
	const api = await yamlExtension.activate();
	const disposable = api.registerContributor(
		'norna',
		(resource) => {
			const uri = vscode.Uri.parse(resource);
			const context = getDocumentContext(uri.fsPath);
			if (!context?.schemaCompatible || context.documentKind !== 'yaml') return undefined;
			const kind = context.schemaKind;
			const resolved = getSchema(uri.fsPath, kind);
			if (!resolved) return undefined;
			const schemaContent = JSON.stringify(resolved.schema);
			const revision = createHash('sha256').update(schemaContent).digest('hex').slice(0, 12);
			const schemaUri = `norna://schema/${kind}/${Buffer.from(resolved.schemaPath).toString('base64url')}/${revision}`;
			schemaContentByUri.set(schemaUri, schemaContent);
			return schemaUri;
		},
		(schemaUri) => schemaContentByUri.get(schemaUri),
	);
	if (disposable?.dispose) context.subscriptions.push(disposable);
};

const getSupportStatus = (document) => {
	if (!document) return null;
	const project = getProjectContext(document.uri.fsPath);
	if (!project) return null;
	const documentContext = getDocumentContext(document.uri.fsPath);
	if (!documentContext) return null;
	const version = project.nornaPackage?.packageJson?.version;

	if (!project.nornaPackage) {
		return {
			message: 'Run npm install in this project so Norna can load support for the project\'s declared engine version.',
			state: 'warning',
		};
	}
	if (!project.schemaCompatible) {
		return {
			message: `Norna ${version} uses schema format ${project.nornaPackage.manifest.schemaVersion ?? '(missing)'}; this extension supports format ${supportedSchemaVersion}. Update Norna or the extension.`,
			state: 'warning',
		};
	}
	if (documentContext.documentKind === 'yaml' && !vscode.extensions.getExtension('redhat.vscode-yaml')) {
		return {
			message: 'Install or enable Red Hat YAML to use Norna YAML completion and validation.',
			state: 'warning',
		};
	}
	if (!project.editorCompatible) {
		return {
			message: `Norna ${version} schemas are available, but Markdown help and diagnostics require editor API ${supportedEditorApiVersion}. Update Norna or the extension.`,
			state: 'warning',
		};
	}

	return {
		message: `Norna editor ${extensionVersion} is using engine ${version} for ${documentContext.relativePath}.`,
		state: 'ready',
	};
};

const updateStatusBar = (editor = vscode.window.activeTextEditor) => {
	if (!statusBar) return;
	const status = getSupportStatus(editor?.document);
	if (!status) {
		statusBar.hide();
		return;
	}

	statusBar.text = status.state === 'ready' ? '$(check) Norna' : '$(warning) Norna';
	statusBar.tooltip = status.message;
	statusBar.accessibilityInformation = {
		label: status.state === 'ready'
			? 'Norna editor support is active'
			: `Norna editor support needs attention. ${status.message}`,
		role: 'button',
	};
	statusBar.show();
};

const showStatus = async () => {
	const editor = vscode.window.activeTextEditor;
	if (!editor) {
		void vscode.window.showInformationMessage('Open a Norna file to inspect IntelliSense status.');
		return;
	}
	const project = getProjectContext(editor.document.uri.fsPath);
	if (!project) {
		void vscode.window.showWarningMessage('The active file is not inside a current Norna site containing config.yaml and pages/000-home/content.md.');
		return;
	}
	const resolved = project.nornaPackage;
	if (!resolved) {
		void vscode.window.showWarningMessage('This Norna site has no discoverable project-local @janga/norna installation. Run npm install in the project.');
		return;
	}
	const documentContext = getDocumentContext(editor.document.uri.fsPath);
	if (!documentContext) {
		void vscode.window.showWarningMessage('The active file is not a Norna source file recognized by the installed Norna version.');
		return;
	}
	if (!project.schemaCompatible) {
		void vscode.window.showWarningMessage(`Norna ${resolved.packageJson.version} uses schema format ${resolved.manifest.schemaVersion ?? '(missing)'}, but this extension supports format ${supportedSchemaVersion}. Norna IntelliSense is disabled for this file.`);
		return;
	}
	const manifest = resolved.manifest;
	const service = await getLanguageService(editor.document.uri.fsPath);
	const assetStatus = await refreshPublicAssetDiagnostics(editor.document.uri.fsPath, service);
	const logo = assetStatus?.logos.length === 1
		? assetStatus.logos[0]
		: assetStatus?.logos.length > 1
			? `${assetStatus.logos.length} conflicting files`
			: 'none (navigation uses page titles)';
	const browserIcons = assetStatus?.browserIcons.length > 0
		? assetStatus.browserIcons.join(', ')
		: 'none';
	const socialImage = assetStatus?.socialImages.length === 1
		? assetStatus.socialImages[0]
		: assetStatus?.socialImages.length > 1
			? `${assetStatus.socialImages.length} conflicting files`
			: 'none';
	const issueCount = assetStatus?.issues.length ?? 0;
	output.appendLine([
		`Norna editor extension: ${extensionVersion}`,
		`Norna engine: ${resolved.packageJson.version}`,
		`Schema format: ${manifest.schemaVersion}`,
		`Editor API: ${manifest.editorApiVersion ?? '(missing)'}${project.editorCompatible ? '' : ` (extension supports ${supportedEditorApiVersion})`}`,
		`Schemas: ${resolved.root}`,
		`Active file: ${documentContext.relativePath}`,
		assetStatus ? `Site: ${assetStatus.siteRoot}` : 'Site: not found for the active file',
		assetStatus ? `Public directory: ${assetStatus.publicDirectory}` : null,
		`Navigation logo: ${logo}`,
		`Browser icons: ${browserIcons}`,
		`Social sharing image: ${socialImage}`,
		`Public asset issues: ${issueCount}`,
		...(assetStatus?.issues.map((issue) => `- ${issue.filename}: ${issue.message}`) ?? []),
		'',
	].filter((line) => line !== null).join('\n'));
	const action = await vscode.window.showInformationMessage(
		project.editorCompatible
			? `Norna editor ${extensionVersion} with engine ${resolved.packageJson.version}. Logo: ${logo}. Browser icons: ${browserIcons}. Social image: ${socialImage}. ${issueCount} public asset issue${issueCount === 1 ? '' : 's'}.`
			: `Norna ${resolved.packageJson.version} schemas are active, but Norna-specific Markdown support requires editor API ${supportedEditorApiVersion}.`,
		'Show details',
	);
	if (action === 'Show details') output.show(true);
};

const refresh = ({ notify = false } = {}) => {
	documentContextByPath.clear();
	projectContextByPath.clear();
	schemaContentByUri.clear();
	serviceByRoot.clear();
	diagnostics.clear();
	for (const siteRoot of publicAssetDiagnosticUrisByRoot.keys()) clearPublicAssetDiagnostics(siteRoot);
	for (const document of vscode.workspace.textDocuments) scheduleDiagnostics(document, 0);
	updateStatusBar();
	if (notify) void vscode.window.showInformationMessage('Norna IntelliSense refreshed.');
};

const makeCloseFenceAction = (document, diagnostic) => {
	const opening = document.lineAt(diagnostic.range.start.line).text.match(/^ {0,3}(`{3,}|~{3,})/);
	if (!opening) return null;
	const end = document.positionAt(document.getText().length);
	const prefix = document.getText().endsWith('\n') ? '' : '\n';
	const edit = new vscode.WorkspaceEdit();
	edit.insert(document.uri, end, `${prefix}${opening[1]}\n`);
	const action = new vscode.CodeAction(`Close block with ${opening[1]}`, vscode.CodeActionKind.QuickFix);
	action.edit = edit;
	action.isPreferred = true;
	action.diagnostics = [diagnostic];
	return action;
};

const makeContentSyncAction = (document, diagnostic) => {
	const action = new vscode.CodeAction('Run Norna content sync in terminal', vscode.CodeActionKind.QuickFix);
	action.command = {
		command: 'nornaEditor.runContentSync',
		title: 'Run Norna content sync in terminal',
		arguments: [document.uri],
	};
	action.diagnostics = [diagnostic];
	return action;
};

const makeManagedImageAction = (document, diagnostic) => {
	const line = document.lineAt(diagnostic.range.start.line);
	const match = line.text.match(/^\s*!\[([^\]\n]*)\]\(([a-z0-9][a-z0-9.-]*\.(?:jpe?g|png|svg))\)\s*$/i);
	if (!match) return null;
	const alt = `\n    alt: ${JSON.stringify(match[1])}`;
	const replacement = `\`\`\`image-stack\nitems:\n  - image: ${match[2]}${alt}\n\`\`\``;
	const edit = new vscode.WorkspaceEdit();
	edit.replace(document.uri, line.range, replacement);
	const action = new vscode.CodeAction('Convert to a managed Norna image stack', vscode.CodeActionKind.QuickFix);
	action.edit = edit;
	action.isPreferred = true;
	action.diagnostics = [diagnostic];
	return action;
};

const findProjectScript = (documentPath, scriptNames) => {
	let directory = path.dirname(path.resolve(documentPath));
	while (true) {
		const packagePath = path.join(directory, 'package.json');
		if (fs.existsSync(packagePath)) {
			try {
				const packageJson = readJson(packagePath);
				const scriptName = scriptNames.find((name) => packageJson.scripts?.[name]);
				if (scriptName) return { directory, scriptName };
			} catch {
				// Continue upwards; malformed unrelated package files are not project roots.
			}
		}
		const parent = path.dirname(directory);
		if (parent === directory) return null;
		directory = parent;
	}
};

const runContentSync = (uri) => {
	const project = findProjectScript(uri.fsPath, ['norna:sync', 'content:sync']);
	if (!project) {
		void vscode.window.showErrorMessage('No package.json with a Norna content-sync script was found for this file.');
		return;
	}
	const terminal = vscode.window.createTerminal({ cwd: project.directory, name: 'Norna content sync' });
	terminal.show();
	terminal.sendText(`npm run ${project.scriptName}`);
};

async function activate(context) {
	extensionVersion = context.extension.packageJSON.version;
	output = vscode.window.createOutputChannel('Norna');
	diagnostics = vscode.languages.createDiagnosticCollection('norna');
	statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 80);
	statusBar.name = 'Norna editor support';
	statusBar.command = 'nornaEditor.showStatus';
	context.subscriptions.push(output, diagnostics, statusBar);

	await registerYamlSchemas(context);

	context.subscriptions.push(vscode.commands.registerCommand('nornaEditor.showStatus', showStatus));
	context.subscriptions.push(vscode.commands.registerCommand('nornaEditor.refresh', () => refresh({ notify: true })));
	context.subscriptions.push(vscode.commands.registerCommand('nornaEditor.runContentSync', runContentSync));
	context.subscriptions.push(vscode.languages.registerCompletionItemProvider(
		{ language: 'yaml', scheme: 'file' },
		{
			provideCompletionItems: async (document, position) => {
				const emptyItems = await getEmptyYamlCompletionItems(document);
				if (emptyItems.length > 0) return prioritizeNornaCompletions(emptyItems);
				const snippetItems = getYamlSchemaSnippetItems(document, position);
				return snippetItems.length > 0 ? prioritizeNornaCompletions(snippetItems) : undefined;
			},
		},
		'-', ':',
	));
	context.subscriptions.push(vscode.languages.registerCompletionItemProvider(
		{ language: 'markdown', scheme: 'file' },
		{
			provideCompletionItems: async (document, position) => {
				if (!isNornaContentDocument(document)) return undefined;
				const emptyItems = await getEmptyContentCompletionItems(document);
				if (emptyItems.length > 0) return prioritizeNornaCompletions(emptyItems);
				const service = await getLanguageService(document.uri.fsPath);
				const scope = service?.getMarkdownCompletionScope({
					source: document.getText(), line: position.line, character: position.character,
				});
				if (scope?.insertBlocks) return prioritizeNornaCompletions([
					...await getSemanticCalloutCompletionItems(document, position, { allowBlank: true }),
					...await getBlockCompletionItems(document, position, service, scope),
				]);
				const calloutItems = scope?.callouts ? await getSemanticCalloutCompletionItems(document, position) : [];
				if (calloutItems.length > 0) return prioritizeNornaCompletions(calloutItems);
				const schemaResult = getSchema(document.uri.fsPath, 'contentFrontmatter');
				const frontmatterItems = schemaResult ? schemaCompletionItems(document, position, schemaResult.schema) : [];
				if (frontmatterItems.length > 0) return prioritizeNornaCompletions(frontmatterItems);
				return service ? prioritizeNornaCompletions(await getBlockCompletionItems(document, position, service, scope)) : undefined;
			},
		},
		'`', '~', ':', '-', '/', '{', '>', '[', '!',
	));

	context.subscriptions.push(vscode.languages.registerHoverProvider(
		{ language: 'markdown', scheme: 'file' },
		{
			provideHover: async (document, position) => {
				if (!isNornaContentDocument(document)) return undefined;
				const schemaResult = getSchema(document.uri.fsPath, 'contentFrontmatter');
				const schemaContext = schemaResult ? getSchemaAtIndent(document, position, schemaResult.schema) : null;
				const keyMatch = document.lineAt(position.line).text.match(/^( *)([A-Za-z][A-Za-z0-9-]*):/);
				if (schemaContext && keyMatch) {
					const property = schemaContext.currentSchema?.properties?.[keyMatch[2]];
					if (property) {
						const choices = getSchemaChoices(property);
						const details = [
							`**${keyMatch[2]}**`,
							schemaDocumentation(property, choices),
						].filter(Boolean).join('\n\n');
						return new vscode.Hover(new vscode.MarkdownString(details));
					}
				}
				const noteRange = document.getWordRangeAtPosition(position, /\[\^margin:[^\]\s]+\]/);
				if (noteRange && getProjectContext(document.uri.fsPath)?.editorCompatible && !isInsideMarkdownFence(document, position.line)) {
					const notesDocumentation = await documentationLinkFor(
						document.uri.fsPath,
						'Sidenote reference',
						'content.md',
						'side-notes',
					);
					return new vscode.Hover(new vscode.MarkdownString([
						'**Named sidenote**\n\nUse one `[^margin:name]` reference in ordinary body text and one `[^margin:name]: ...` definition at page top level. The body is one paragraph; Norna assigns letters in reference order.',
						notesDocumentation,
					].join('\n\n')), noteRange);
				}
				const service = await getLanguageService(document.uri.fsPath);
				const fieldContext = service?.getNornaBlockFieldContext({
					line: position.line,
					source: document.getText(),
				});
				if (fieldContext) {
					const keyRange = document.getWordRangeAtPosition(position, /[a-z][a-z0-9-]*/);
					if (keyRange && document.getText(keyRange) === fieldContext.key) {
						const values = fieldContext.field.values
							? Object.entries(fieldContext.field.values).map(([value, definition]) => ({ value, ...definition }))
							: [];
						return new vscode.Hover(new vscode.MarkdownString([
							`**${fieldContext.key}**`,
							fieldContext.field.description,
							fieldContext.field.default !== undefined ? `Default: \`${fieldContext.field.default}\`.` : null,
							values.length > 0 ? choiceDocumentation(values) : null,
							fieldContext.definition.documentation,
						].filter(Boolean).join('\n\n')), keyRange);
					}
				}
				const wordRange = document.getWordRangeAtPosition(position, /(?:image-stack|image-carousel|card-list|page-list|norna-[a-z-]+)/);
				if (wordRange) {
					const name = document.getText(wordRange);
					const definition = service?.nornaBlockDefinitions?.[name];
					if (definition) return new vscode.Hover(new vscode.MarkdownString([
						`**${name}**`,
						definition.description,
						definition.documentation,
					].join('\n\n')), wordRange);
				}
				return undefined;
			},
		},
	));

	context.subscriptions.push(vscode.languages.registerDefinitionProvider(
		{ language: 'markdown', scheme: 'file' },
		{
			provideDefinition: async (document, position) => {
				if (!isNornaContentDocument(document)) return undefined;
				const service = await getLanguageService(document.uri.fsPath);
				const definition = await service?.getImageDefinitionContext({
					documentPath: document.uri.fsPath,
					line: position.line,
					source: document.getText(),
				});
				return definition?.files.map((filePath) => new vscode.Location(vscode.Uri.file(filePath), new vscode.Position(0, 0)));
			},
		},
	));

	context.subscriptions.push(vscode.languages.registerCodeActionsProvider(
		{ language: 'markdown', scheme: 'file' },
		{
			provideCodeActions: (document, _range, codeActionContext) => codeActionContext.diagnostics
				.filter((diagnostic) => diagnostic.source === 'Norna')
				.flatMap((diagnostic) => {
					if (diagnostic.code === 'unclosed-norna-block') return [makeCloseFenceAction(document, diagnostic)].filter(Boolean);
					if (diagnostic.code === 'image-needs-sync') return [makeContentSyncAction(document, diagnostic)];
					if (diagnostic.code === 'local-markdown-image') return [makeManagedImageAction(document, diagnostic)].filter(Boolean);
					return [];
				}),
		},
		{ providedCodeActionKinds: [vscode.CodeActionKind.QuickFix] },
	));

	context.subscriptions.push(vscode.workspace.onDidOpenTextDocument((document) => scheduleDiagnostics(document, 0)));
	context.subscriptions.push(vscode.workspace.onDidChangeTextDocument((event) => scheduleDiagnostics(event.document)));
	context.subscriptions.push(vscode.workspace.onDidSaveTextDocument((document) => {
		scheduleDiagnostics(document, 0);
		scheduleOpenThemeDiagnostics(document.uri.fsPath, 0);
	}));
	context.subscriptions.push(vscode.workspace.onDidDeleteFiles(() => refresh()));
	context.subscriptions.push(vscode.workspace.onDidCreateFiles(() => refresh()));
	context.subscriptions.push(vscode.workspace.onDidRenameFiles(() => refresh()));
	context.subscriptions.push(vscode.window.onDidChangeActiveTextEditor(updateStatusBar));
	context.subscriptions.push(vscode.workspace.onDidCloseTextDocument((document) => {
		if (isNornaContentDocument(document) || isNornaYamlDocument(document)) diagnostics.delete(document.uri);
	}));

	const publicAssetWatcher = vscode.workspace.createFileSystemWatcher('**/public/*');
	const refreshWatchedPublicAsset = async (uri) => {
		const service = await getLanguageService(uri.fsPath);
		if (!service) return;
		try {
			await refreshPublicAssetDiagnostics(uri.fsPath, service);
		} catch (error) {
			output.appendLine(`Public asset diagnostics failed for ${uri.fsPath}: ${error instanceof Error ? error.stack ?? error.message : String(error)}`);
		}
	};
	context.subscriptions.push(
		publicAssetWatcher,
		publicAssetWatcher.onDidCreate(refreshWatchedPublicAsset),
		publicAssetWatcher.onDidChange(refreshWatchedPublicAsset),
		publicAssetWatcher.onDidDelete(refreshWatchedPublicAsset),
	);

	for (const document of vscode.workspace.textDocuments) scheduleDiagnostics(document, 0);
	updateStatusBar();
}

function deactivate() {
	for (const timer of diagnosticTimers.values()) clearTimeout(timer);
	diagnosticTimers.clear();
}

module.exports = { activate, deactivate };
