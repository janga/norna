import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { parse } from 'yaml';

const source = await readFile(new URL('../extension.cjs', import.meta.url), 'utf8');
const require = createRequire(new URL('../extension.cjs', import.meta.url));
class Range {
	constructor(startLine, startCharacter, endLine, endCharacter) {
		this.start = { line: startLine, character: startCharacter };
		this.end = { line: endLine, character: endCharacter };
	}
}
class Text {
	constructor(value) { this.value = value; }
}
const vscode = {
	Range, MarkdownString: Text, SnippetString: Text,
	CompletionItem: class { constructor(label, kind) { this.label = label; this.kind = kind; } },
	CompletionItemKind: { Snippet: 1, Property: 2, EnumMember: 3 },
	CodeAction: class { constructor(title) { this.title = title; } },
	CodeActionKind: { QuickFix: 'quickfix' },
	WorkspaceEdit: class { replace(uri, range, text) { this.replacement = { uri, range, text }; } },
};
const module = { exports: {} };
vm.runInNewContext(`${source}\nmodule.exports.test = { getNoteCompletionItems, getSemanticCalloutCompletionItems, makeManagedImageAction, makeBlockCandidateItem };`, {
	module, require: (name) => name === 'vscode' ? vscode : require(name),
});
const api = module.exports.test;
const { getYamlPropertyCompletionContext } = require('./yaml-schema-completions.cjs');
const frontmatterSchema = { properties: {
	page: { properties: { description: { type: 'string' }, aliases: { type: 'array' } } },
	navigation: { properties: { listed: { type: 'boolean' } } },
} };
for (const source of ['page:\n  description: |-\n    page', 'page:\n  description: >-\n    ', '# comment', 'page:\n  description: Text']) {
	assert.equal(getYamlPropertyCompletionContext({ source, line: source.split('\n').length - 1, schema: frontmatterSchema }), null);
}
const owner = getYamlPropertyCompletionContext({ source: 'page:\n  description: Text\n  ', line: 2, schema: frontmatterSchema });
assert.deepEqual(Object.keys(owner.currentSchema.properties).filter((key) => !owner.existingKeys.has(key)), ['aliases']);
const document = (text) => {
	const lines = text.split('\n');
	return {
		uri: { fsPath: '/tmp/norna-editor-contract/content.md' },
		lineCount: lines.length,
		lineAt: (line) => ({ text: lines[line], range: new Range(line, 0, line, lines[line].length) }),
	};
};

assert.doesNotMatch(source, /onWillSaveTextDocument|normalizeSavedCallouts|getSemanticCalloutSaveEdits|register\w*FormattingEditProvider/);
const noteDocument = document('A paragraph.[^margin:');
const notes = api.getNoteCompletionItems(noteDocument, { line: 0, character: noteDocument.lineAt(0).text.length });
assert.ok(notes.some((item) => item.insertText.value === '[^margin:${1:name}]'));
assert.equal(notes.length, 1, 'A definition must not be inserted inline.');
assert.equal(api.getNoteCompletionItems(document('[^margin:'), { line: 0, character: 9 }).length, 2);
assert.ok(notes.every((item) => !item.insertText.value.includes('{note')));
assert.equal(api.getNoteCompletionItems(document('```md\n[^margin:'), { line: 1, character: 9 }).length, 0);

for (const prefix of ['', ':::: tabs\n\n::: tab "One"\n\n', '```md\n```example\n```\n\n']) {
	const doc = document(`${prefix}> [!`);
	const items = api.getSemanticCalloutCompletionItems(doc, { line: doc.lineCount - 1, character: 4 });
	assert.equal(items.length, 6);
	assert.equal(items.find((item) => item.label === 'TIP').insertText.value, '> [!TIP]\n> ${1:Callout text}');
	assert.equal(items.find((item) => item.label === 'TIP').filterText, '> [!TIP]');
	assert.ok(items.every((item) => !item.insertText.value.startsWith(':::')));
}

const image = document('![Opening hours: "Saturday"](workshop.jpg)');

const blankCallouts = api.getSemanticCalloutCompletionItems(document(''), { line: 0, character: 0 }, { allowBlank: true });
assert.equal(blankCallouts.length, 6);
for (const item of blankCallouts) {
	assert.equal(item.filterText, item.label);
	assert.equal(item.insertText.value, `> [!${item.label}]\n> \${1:Callout text}`);
}
const fix = api.makeManagedImageAction(image, { range: { start: { line: 0 } } });
assert.deepEqual(parse(fix.edit.replacement.text.split('\n').slice(1, -1).join('\n')), {
	items: [{ image: 'workshop.jpg', alt: 'Opening hours: "Saturday"' }],
});
const candidate = api.makeBlockCandidateItem({ key: 'items', description: 'Entries.', snippet: 'items:\n  - image: ${1:filename.jpg}' }, new Range(0, 0, 0, 2));
assert.equal(candidate.insertText.value, 'items:\n  - image: ${1:filename.jpg}');
console.log('VS Code Markdown contract passed.');
