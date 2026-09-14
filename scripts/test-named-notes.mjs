import assert from 'node:assert/strict';
import { test } from 'node:test';
import { markdownToHtml, markdownToMdast } from 'satteri';
import { parsePageMarkdown, parsePageMarkdownSource } from './lib/page-markdown.mjs';
import { extractInlineNoteDiagnostics, noteMarker, noteTargetKey } from './lib/markdown-notes.mjs';
import { nornaNotesRenderPlugin } from './lib/markdown-notes-render-plugin.mjs';
import { nornaMarkdownRenderPlugin } from './lib/norna-markdown-render-plugin.mjs';
import { prepareContentTabs, groupRenderedTabs } from './lib/content-tabs.mjs';

const page = (body) => `# Notes\n\n${body}\n`;
const tabs = (first, second) => `:::: tabs\n\n::: tab "First"\n\n${first}\n\n:::\n\n::: tab "Second"\n\n${second}\n\n:::\n\n::::`;
const render = (source, options = {}) => markdownToHtml(prepareContentTabs(source), {
	features: { gfm: { footnotes: { label: 'End notes', backLabel: 'Return {reference}' } } },
	mdastPlugins: [nornaNotesRenderPlugin, ...(options.regions ? [nornaMarkdownRenderPlugin] : [])],
});
const codes = (source) => extractInlineNoteDiagnostics(page(source)).diagnostics.map((issue) => issue.code);

test('Satteri identity case-folds, preserves Unicode normalization, and rejects spaces in footnote names', () => {
	const definitions = markdownToMdast('[^A]: a\n[^a]: b\n[^\u00df]: c\n[^SS]: d\n[^\u00e9]: e\n[^e\u0301]: f\n[^a b]: url').children;
	assert.deepEqual(definitions.map((node) => [node.type, node.identifier]), [
		['footnoteDefinition', 'a'], ['footnoteDefinition', 'a'], ['footnoteDefinition', 'ss'], ['footnoteDefinition', 'ss'],
		['footnoteDefinition', '\u00e9'], ['footnoteDefinition', 'e\u0301'], ['definition', '^a b'],
	]);
	for (const source of ['A[^MARGIN:x]\n\n[^margin:x]: N', 'A[^margin:x]\n\n[^Margin:x]: N']) {
		const result = extractInlineNoteDiagnostics(source);
		assert.equal(result.notes.length, 1);
		assert.ok(result.errors.some((issue) => issue.code === 'invalid-note-prefix'));
		assert.ok(!result.errors.some((issue) => issue.code === 'missing-note-definition'));
	}
	assert.ok(codes('A[^margin:]\n\n[^margin:]: Note').includes('empty-note-name'));
});

test('notes resolve across sections and before the page title, in reference order', async () => {
	const source = '[^margin:second]: Second definition\n\n# Notes\n\nA[^margin:first] B[^margin:second].\n\n## Later\n\nC[^margin:third].\n\n[^margin:third]: Third definition\n[^margin:first]: First definition';
	const model = await parsePageMarkdown(source);
	assert.deepEqual(model.diagnostics, []);
	assert.equal(model.prelude.trim(), '');
	assert.deepEqual(model.notes.map((note) => note.marker), ['a', 'b', 'c']);
	assert.equal(model.intro.notes.length, 2);
	assert.equal(model.sections[0].notes[0].identifier, 'margin:third');
	const html = (await render(source, { regions: true })).html;
	assert.equal([...html.matchAll(/class="section-note-stack"/g)].length, 2);
	assert.ok(html.indexOf('First definition') < html.indexOf('Second definition'));
	assert.ok(html.indexOf('Second definition') < html.indexOf('data-index="1"'));
	assert.doesNotMatch(html, /data-footnotes|data-footnote-ref/);
});

test('letters continue beyond z without warnings or name-dependent ordering', () => {
	const names = Array.from({ length: 53 }, (_, index) => `margin:n${index}`);
	const result = extractInlineNoteDiagnostics(page(`Text ${names.map((name) => `[^${name}]`).join(' ')}\n\n${[...names].reverse().map((name) => `[^${name}]: Note`).join('\n')}`));
	assert.deepEqual(result.diagnostics, []);
	assert.equal(result.notes[25].marker, 'z');
	assert.equal(result.notes[26].marker, 'aa');
	assert.equal(result.notes[52].marker, 'ba');
	assert.equal(noteMarker(701), 'zz');
	assert.equal(noteMarker(702), 'aaa');
});

test('stable targets encode normalized names injectively rather than numbering or slugifying them', () => {
	const a = extractInlineNoteDiagnostics(page('A[^margin:one].\n\n[^margin:one]: N')).notes[0];
	const b = extractInlineNoteDiagnostics(page('B[^margin:two] A[^margin:one].\n\n[^margin:one]: N\n[^margin:two]: N')).notes[1];
	assert.equal(a.id, b.id);
	assert.equal(a.referenceId, b.referenceId);
	assert.notEqual(a.marker, b.marker);
	const names = ['a b', 'a-b', 'a%20b', '\u00e9', 'e\u0301', 'x', 'x-2'];
	assert.equal(new Set(names.map(noteTargetKey)).size, names.length);
	assert.match(a.id, /^norna-note:margin:[0-9a-f]+$/);
});

test('ordinary numbers ignore sidenotes and reused footnotes retain unique return destinations', async () => {
	const html = (await render(page('A[^margin:m] B[^x] C[^y] D[^x] E[^x-2].\n\n[^x-2]: Third\n[^y]: Second\n[^margin:m]: Aside\n[^x]: First'))).html;
	assert.deepEqual([...html.matchAll(/data-footnote-ref aria-describedby="footnote-label">(\d+)</g)].map((match) => match[1]), ['1', '2', '1', '3']);
	assert.match(html, /aria-label="Return 1-2"/);
	assert.equal([...html.matchAll(/<li id="user-content-fn-/g)].length, 3);
	const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
	assert.equal(ids.length, new Set(ids).size);
	for (const [, target] of html.matchAll(/href="#([^"]+)"/g)) assert.ok(ids.includes(target), target);
});

test('wrapped inline note bodies retain page-scope links, emphasis, and literal code', async () => {
	const source = page('Text[^margin:body].\n\n[^margin:body]: *Emphasis* **strong** [link][target]\n    and `[^literal]` with wrapped text.\n\n[target]: https://example.com/');
	assert.deepEqual(codes(source), []);
	const html = (await render(source)).html;
	assert.match(html, /<em>Emphasis<\/em> <strong>strong<\/strong> <a href="https:\/\/example.com\/">link<\/a>/);
	assert.match(html, /<code>\[\^literal\]<\/code>/);
});

test('missing definitions, duplicates, reused sidenotes, and unused definitions have focused diagnostics', () => {
	assert.ok(codes('A[^absent] B[^margin:absent].').includes('missing-note-definition'));
	assert.equal(codes('A[^absent] B[^margin:absent].').filter((code) => code === 'missing-note-definition').length, 2);
	assert.ok(codes('A[^x]\n\n[^x]: First\n[^X]: Duplicate').includes('duplicate-note-definition'));
	assert.ok(codes('A[^margin:x] B[^margin:x]\n\n[^margin:x]: N').includes('reused-sidenote'));
	const result = extractInlineNoteDiagnostics('[^unused]: N\n[^margin:unused]: N');
	assert.equal(result.errors.length, 0);
	assert.equal(result.warnings.length, 2);
	assert.ok(result.warnings.every((issue) => issue.code === 'unused-note-definition'));
});

for (const [name, body] of [
	['heading', '## Heading[^margin:x]'],
	['setext heading', 'Heading[^margin:x]\n---'],
	['list', '- Text[^margin:x]'],
	['nested list paragraph', '- Item\n\n  Text[^margin:x]'],
	['table', '| Name |\n| --- |\n| Text[^margin:x] |'],
	['callout', '> [!NOTE]\n> Text[^margin:x]'],
	['blockquote', '> Text[^margin:x]'],
	['tabs', tabs('Text[^margin:x]', 'Other')],
	['details', '<details>\n<summary>Open</summary>\n\nText[^margin:x]\n\n</details>'],
	['HTML container', '<div>\n\nText[^margin:x]\n\n</div>'],
	['colon container', '::: container\n\nText[^margin:x]\n\n:::'],
]) test(`sidenote references reject ${name}`, () => {
	assert.ok(codes(`${body}\n\n[^margin:x]: N`).includes('invalid-sidenote-placement'));
});

for (const [name, definition] of [
	['list', '- [^x]: N'], ['blockquote', '> [^x]: N'],
	['details', '<details>\n\n[^x]: N\n\n</details>'], ['tabs', tabs('[^x]: N', 'Other')],
	['colon container', '::: container\n\n[^x]: N\n\n:::'],
]) test(`definitions reject ${name}`, () => {
	assert.ok(codes(`A[^x].\n\n${definition}`).includes('invalid-note-definition-placement'));
});

for (const [name, body] of [
	['empty body', ''], ['heading', '### Heading'], ['list', '- Item'],
	['multiple paragraphs', 'First\n\n    Second'], ['image', '![Alt](image.svg)'],
	['HTML', '<span>HTML</span>'], ['strikethrough', '~~Deleted~~'],
	['fenced code', '```js\n    code\n    ```'], ['nested note', 'Text[^nested]'],
	['nested defined note', 'Text[^nested]\n\n[^nested]: Other'],
	['container', '::: container\n    Text\n    :::'],
]) test(`sidenote bodies reject ${name}`, () => {
	assert.ok(codes(`A[^margin:x]\n\n[^margin:x]: ${body}`).includes('invalid-sidenote-body'));
});

test('literal code, escaped references, comments, and link URLs do not declare notes', () => {
	const result = extractInlineNoteDiagnostics(page('`[^missing]` `prefix {note-ref}` \\[^escaped] \\{note-ref}\n\n<!-- [^comment] {note-ref} -->\n\n```md\n[^code]\n{note-ref}\n```\n\n[Link](https://example.com/[^path])'));
	assert.deepEqual(result.diagnostics, []);
	assert.ok(codes('Old {note-ref}\n\n{note: Old body.}').includes('removed-positional-note'));
});

test('diagnostics retain frontmatter and CRLF line offsets', async () => {
	const result = await parsePageMarkdownSource('---\r\npage: {}\r\n---\r\n# Notes\r\n\r\nA[^missing]\r\n', { label: 'content.md' });
	const issue = result.noteDiagnostics.find((item) => item.code === 'missing-note-definition');
	assert.equal(issue.line, 6);
	assert.match(issue.message, /^content.md line 6:/);
});

test('parsed caption and card fields reject sidenote references but retain inline-code literals', async () => {
	for (const block of [
		'```image-stack\nitems:\n  - image: example.svg\n    caption: "Caption[^margin:caption]"\n```',
		'```card-list\nitems:\n  - title: Card\n    text: >-\n      Text[^margin:card]\n```',
		'```card-list\nitems:\n  - title: "Card[^MARGIN:card]"\n    text: Content\n```',
	]) {
		const result = await parsePageMarkdown(page(block));
		assert.equal(result.noteDiagnostics.length, 1, JSON.stringify(result.diagnostics));
		assert.equal(result.noteDiagnostics[0].code, 'invalid-sidenote-placement');
		assert.match(result.noteDiagnostics[0].message, /field of/);
	}
	const result = await parsePageMarkdown(page('```card-list\nitems:\n  - title: Card\n    text: "Literal `[^margin:card]`"\n```'));
	assert.deepEqual(result.noteDiagnostics, []);
});

test('ordinary footnotes keep complete source order across tabs, tables, and callouts', async () => {
	const source = page(`${tabs('One[^shared].', 'Two[^hidden] again[^shared].')}\n\n> [!NOTE]\n> Three[^callout].\n\n| Name |\n| --- |\n| Four[^table] |\n\n[^table]: Table\n[^callout]: Callout\n[^hidden]: Hidden\n[^shared]: Shared`);
	const model = await parsePageMarkdown(source);
	assert.deepEqual(model.diagnostics, []);
	const html = (await render(source)).html;
	assert.deepEqual([...html.matchAll(/data-footnote-ref aria-describedby="footnote-label">(\d+)</g)].map((match) => match[1]), ['1', '2', '1', '3', '4']);
	const blocks = groupRenderedTabs([{ type: 'html', html }], model.tabGroups);
	const group = blocks.find((block) => block.type === 'tabs');
	assert.match(group.panels[1].contentBlocks[0].html, /data-footnote-ref/);
	assert.doesNotMatch(group.panels[1].contentBlocks[0].html, /data-footnotes/);
	assert.match(blocks.at(-1).html, /data-footnotes/);
});
