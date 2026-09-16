import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
	getNornaBlockCompletionContext,
	getNornaBlockFieldContext,
	getMarkdownDiagnostics,
	getMarkdownCompletionScope,
	nornaBlockDefinitions,
} from './lib/editor-language-service.mjs';
import { getNornaBlockSchema, parseNornaMarkdownBlock } from './lib/norna-markdown-blocks.mjs';

const context = (body, type = 'card-list') => {
	const lines = ['# Page', '', `\`\`\`${type}`, ...body.split('\n'), '```'];
	const line = lines.findIndex((text) => text.includes('|CURSOR|'));
	const source = lines.join('\n').replace('|CURSOR|', '');
	return { source, line };
};
const keys = (input) => getNornaBlockCompletionContext(input)?.candidates.map(({ key }) => key);

test('Markdown parser distinguishes active syntax from literal and forbidden contexts', () => {
	const scope = (source) => {
		const offset = source.indexOf('|CURSOR|');
		const prefix = source.slice(0, offset).split('\n');
		return getMarkdownCompletionScope({ source: source.replace('|CURSOR|', ''), line: prefix.length - 1, character: prefix.at(-1).length });
	};
	for (const fence of ['```', '~~~']) {
		assert.equal(scope(`# Page\n\n${fence}|CURSOR|`).blocks, true);
		assert.equal(scope(`# Page\n\n${fence}image-stack\nitems:\n  - image: x.svg\n${fence}|CURSOR|`).blocks, false);
		assert.equal(scope(`# Page\n\n${fence}image-stack\nitems:\n  - |CURSOR|\n${fence}`).embedded, true);
	}
	for (const source of [
		'````md\n```|CURSOR|\n````',
		'```md\n~~~image-stack|CURSOR|\n```',
		'```md\n```not-a-closer\n```|CURSOR|\n```',
		'<!--\n```image-stack|CURSOR|\n-->',
		'    ```image-stack|CURSOR|',
		'---\ndescription: |\n  ```image-stack|CURSOR|\n---\n# Page',
	]) assert.equal(scope(source).blocks, false, source);
	for (const source of [
		'<!--\n> [!|CURSOR|\n-->',
		'````md\n> [!|CURSOR|\n````',
		'```md\n```not-a-closer\n> [!|CURSOR|\n```',
	]) assert.equal(scope(source).callouts, false, source);
	for (const source of [
		'# Title [^margin:|CURSOR|',
		'- List [^margin:|CURSOR|',
		'> Quote [^margin:|CURSOR|',
		'An inline `[^margin:|CURSOR|` example.',
		'<!-- [^margin:|CURSOR| -->',
		':::: tabs\n::: tab "One"\n\nText.[^margin:|CURSOR|\n:::\n::::',
		'| Heading |\n| --- |\n| [^margin:|CURSOR| |',
	]) assert.equal(scope(source).notes, false, source);
	assert.equal(scope('Text.[^margin:|CURSOR|').notes, true);
	assert.equal(scope('> [!|CURSOR|').callouts, true);
	assert.equal(scope('# Page\n\n|CURSOR|').insertBlocks, true);
	assert.equal(scope('# Page\n\n````md\n```image-stack\n```\n````\n\n|CURSOR|').insertBlocks, true);
	for (const source of [
		'# Page\n\n```md\n|CURSOR|\n```',
		'# Page\n\n<!--\n|CURSOR|\n-->',
		'# Page\n\n    |CURSOR|',
		'# Page\n\n- Item\n\n  |CURSOR|\n  More',
		'---\npage:\n  description: |\n    |CURSOR|\n---\n# Page',
		'# Page\n\n:::: tabs\n::: tab "One"\n\n|CURSOR|\n:::\n::::',
	]) assert.equal(scope(source).insertBlocks, false, source);
});

test('embedded block roots use schema properties, including options after items', () => {
	assert.deepEqual(keys(context('|CURSOR|')), Object.keys(getNornaBlockSchema('card-list').properties));
	assert.deepEqual(keys(context('items:\n  - title: Card\n    text: Content\n|CURSOR|\nflow: stack')), ['layout', 'size', 'width', 'Add card']);
	assert.deepEqual(keys(context('|CURSOR|', 'page-list')), []);
});

test('every item field can start an item and required fields remain available later', () => {
	const properties = getNornaBlockSchema('card-list').properties.items.items.properties;
	assert.deepEqual(keys(context('items:\n  - |CURSOR|')), Object.keys(properties));
	assert.deepEqual(keys(context('items:\n  |CURSOR|')), [...Object.keys(properties), 'Add card']);
	assert.deepEqual(keys(context('items:\n  - title: Card\n    text: Content\n  |CURSOR|')), [...Object.keys(properties), 'Add card']);
	assert.deepEqual(keys(context('items:\n  - text: Content\n    |CURSOR|\n    image: example.jpg')), ['title', 'link', 'badge-text']);
	assert.deepEqual(keys(context('items:\n  - alt: Description\n    |CURSOR|', 'image-stack')), ['image', 'caption', 'Add image']);
	assert.equal(getNornaBlockFieldContext(context('items:\n  - text: |CURSOR|Content')).key, 'text');
	assert.equal(getNornaBlockFieldContext(context('items:\n  - alt: |CURSOR|Description', 'image-stack')).key, 'alt');
});

test('field ownership comes from YAML, including quoted keys and non-default indentation', () => {
	assert.deepEqual(keys(context('"items":\n    - "text": Content\n      |CURSOR|')), ['title', 'image', 'link', 'badge-text', 'Add card']);
	assert.equal(getNornaBlockFieldContext(context('items:\n  - "image": "im\\u0061ge.jpg"|CURSOR|', 'image-stack')).value, 'image.jpg');
	const values = getNornaBlockCompletionContext(context('items:\n  - title: Card\n    text: Content\n"layout": |CURSOR|'));
	assert.equal(values.mode, 'value');
	assert.deepEqual(values.candidates.map(({ label }) => label), Object.keys(nornaBlockDefinitions['card-list'].options.layout.values));
});

test('block scalars, comments, unrelated fences, and legacy roots get no field help', () => {
	for (const body of [
		'items:\n  - title: Card\n    text: |-\n      image: |CURSOR|',
		'items:\n  - title: Card\n    text: >-\n      |CURSOR|',
		'items:\n  - title: Card\n    # |CURSOR|',
		'- title: Card\n  |CURSOR|',
		'other:\n  - title: Card\n    |CURSOR|',
	]) assert.deepEqual(keys(context(body)), [], body);
	assert.equal(getNornaBlockFieldContext(context('items:\n  - title: Card\n    text: |-\n      image: |CURSOR|example.jpg')), null);
	assert.equal(getNornaBlockCompletionContext(context('items:\n  - |CURSOR|', 'yaml')), null);
	assert.equal(getNornaBlockCompletionContext({ source: '```markdown\n~~~card-list\nitems:\n  - \n~~~\n```', line: 3 }), null);
});

test('generated block snippets parse and share schema enums and minimum item counts', () => {
	assert.equal(getNornaBlockSchema('image-carousel').properties.items.minItems, 2);
	for (const [type, definition] of Object.entries(nornaBlockDefinitions)) {
		const source = definition.snippet.replace(/\$\{\d+:([^}]+)\}/g, '$1')
			.replace(/\$\{\d+\|([^}]+)\|\}/g, (_match, choices) => choices.split(',')[0]);
		assert.doesNotThrow(() => parseNornaMarkdownBlock(type, source.split('\n').slice(1, -1).join('\n')), type);
		if (type !== 'page-list') assert.match(source, /\nitems:\n  - /);
		if (type === 'card-list') {
			assert.match(source, /\n    link: \/destination\//);
			assert.match(definition.description, /whole card clickable/);
			assert.match(definition.documentation, /https:\/\/janga\.github\.io\/norna\/reference\/content\/cards\//);
		}
		for (const [key, field] of Object.entries(definition.options ?? {})) {
			if (field.default !== undefined) assert.ok(definition.snippet.includes(`|${Object.keys(field.values).join(',')}|`), key);
		}
	}
});

test('embedded YAML diagnostics highlight the offending source line once', async () => {
	const source = '# Page\n\n```card-list\nitems:\n  - text: Text\n    title: First\n    title: Second\n```';
	const issues = await getMarkdownDiagnostics({ documentPath: '/tmp/norna-editor-contract/content.md', source });
	assert.equal(issues.length, 1);
	assert.equal(issues[0].code, 'invalid-norna-block');
	assert.equal(issues[0].line, 7);
});

test('new entries fit the existing sequence and preserve neighboring data', () => {
	for (const type of ['image-stack', 'image-carousel', 'card-list']) {
		const entry = type === 'card-list' ? 'title: Existing\n    text: Text' : 'image: existing.svg\n    alt: Text\n    caption: Caption';
		for (const indent of ['', '  ', '    ']) {
			const input = context(`items:\n  - ${entry}\n${indent}|CURSOR|`, type);
			const result = getNornaBlockCompletionContext(input);
			const candidate = result.candidates.find(({ kind }) => kind === 'new-item');
			assert.ok(candidate, `${type}: missing new item for ${indent.length} spaces`);
			const lines = input.source.split('\n');
			lines[input.line] = candidate.snippet.replace(/\$\{\d+:([^}]+)\}/g, '$1');
			const parsed = parseNornaMarkdownBlock(type, lines.slice(3, -1).join('\n'));
			assert.equal((parsed.cards ?? parsed.images).length, 2);
		}
	}
	const custom = getNornaBlockCompletionContext(context('"items":\n    - image: old.svg\n      alt: Text\n|CURSOR|', 'image-stack'));
	assert.match(custom.candidates.find(({ kind }) => kind === 'new-item').snippet, /^    - image:/);
	assert.ok(keys(context('items:\n|CURSOR|', 'image-stack')).includes('Add image'));
	assert.ok(keys(context('items:\n  - image: first.svg\n|CURSOR|\n  - image: second.svg', 'image-stack')).includes('Add image'));
	for (const body of [
		'items:\n  - image: first.svg\n|CURSOR|\n    alt: Keep with first image',
		'items:\n  - image: first.svg\n    caption: |\n      Text\n      |CURSOR|',
		'items:\n  - image: first.svg\n    caption: >-\n      Text\n      |CURSOR|\n      Continued',
		'|CURSOR|\nitems:\n  - image: first.svg',
		'items: [{image: first.svg}]\n|CURSOR|',
		'items:\n  - image: first.svg\n  # |CURSOR|',
	]) assert.ok(!getNornaBlockCompletionContext(context(body, 'image-stack'))?.candidates.some(({ kind }) => kind === 'new-item'), body);
	assert.deepEqual(keys(context('|CURSOR|', 'page-list')), []);
});
