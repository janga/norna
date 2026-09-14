import assert from 'node:assert/strict';
import { parse as parseYaml } from 'yaml';
import { getNornaBlockSchema, parseNornaMarkdownBlock } from './lib/norna-markdown-blocks.mjs';
import { parsePageMarkdownSource } from './lib/page-markdown.mjs';

const parse = (source, type = 'image-stack') => parseNornaMarkdownBlock(type, source, { label: 'content.md', line: 10 });
assert.deepEqual(parse('items:\n  - image: photo.svg\n    alt: ""').images, [{ image: 'photo.svg', alt: '', line: 11 }]);
assert.equal(parse('items: [{caption: "A: B # C", image: photo.svg}]').images[0].caption, 'A: B # C');
assert.equal(parse('items:\n  - image: photo.svg\n    caption: |\n      First\n      Second\n').images[0].caption, 'First\nSecond\n');
assert.equal(parse('items:\n  - image: photo.svg\n    caption: >-\n      First\n      Second\n').images[0].caption, 'First Second');
assert.equal(parse('items: [{image: photo.svg, caption: "Unicode \\u00e5"}]').images[0].caption, 'Unicode å');
assert.equal(parse("items: [{image: photo.svg, caption: 'It''s fine'}]").images[0].caption, "It's fine");
assert.equal(parse('items: [{title: Test, text: "true"}]\nflow: stack', 'card-list').flow, 'stack');
assert.equal(parse('items: [{title: Test, link: /}]', 'card-list').size, 'm');
assert.equal(getNornaBlockSchema('card-list').properties.items.items.properties.text.type, 'string');
assert.equal(getNornaBlockSchema('card-list').properties.flow.default, 'grid');
assert.equal(getNornaBlockSchema('page-list'), null);

for (const source of [
	'- image: photo.svg', 'items: []', 'items:', 'items: photo.svg',
	'items: [photo.svg]', 'items: [{}]', 'items: [{image: photo.svg, image: second.svg}]',
	'items: [{image: photo.svg}]\nitems: []',
	'items: [{image: photo.svg, mystery: value}]',
	'items: [{image: photo.svg}]\nmystery: value',
	'items: [{image: photo.svg, caption: 123}]',
	'items: [{image: photo.svg, caption: true}]',
	'items: [{image: photo.svg, caption: null}]',
	'items: [{image: photo.svg, caption: ""}]',
	'items: [{image: photo.svg, caption: "   "}]',
	'items: [{image: photo.svg, alt: "   "}]',
	'items: [{image: photo.svg, alt: "bad\\n"}]',
	'items: [{image: photo.svg, alt: "bad\\u2028"}]',
	'items: [{image: photo.svg, alt: "bad\\u2029"}]',
	'items: [{image: "photo.svg\\n"}]',
	'items: [{image: photo.svg, caption: "bad\\u0000"}]',
	'items: [{image: photo.svg, caption: "bad\\u0085"}]',
	'%YAML 1.1\n---\nitems: [{image: photo.svg}]',
	'items: [{image: ../photo.svg}]',
	'items: [{image: photo.svg, caption: [a, b]}]',
	'items: [{image: photo.svg, caption: {a: b}}]',
	'items: [{image: &name photo.svg}]',
	'items: [{image: *name}]',
	'items: [{image: !!str photo.svg}]',
	'items: [{image: !unknown photo.svg}]',
	'items: [{image: photo.svg, <<: {caption: bad}}]',
	'items: [{image: photo.svg}]\n---\nitems: [{image: next.svg}]',
]) assert.throws(() => parse(source), /content\.md line \d+: image-stack:/, source);

for (const source of [
	'items: [{title: "" , text: Text}]',
	'items: [{title: true, text: Text}]',
	'items: [{title: "Title\\n", text: Text}]',
	'items: [{title: Title}]',
	'items: [{title: Title, text: Text}]\nflow: wrong',
	'items: [{title: Title, link: ""}]',
]) assert.throws(() => parse(source, 'card-list'), /card-list:/, source);

// Link source ranges must work for flow mappings, escapes, CRLF, and reordered keys.
for (const scalar of ['"/old/\\u0023details"', "'/old/#details'", '/old/#details']) {
	const source = `---\npage:\n  description: Links\n---\n# Links\n\n## Cards\n\n\`\`\`card-list\nitems: [{link: ${scalar}, title: Go}] # Keep this comment\n\`\`\`\n`.replaceAll('\n', '\r\n');
	const model = await parsePageMarkdownSource(source);
	assert.deepEqual(model.diagnostics, []);
	const link = model.links.find((item) => item.kind === 'card-link');
	assert.equal(link.targetSource, '/old/#details');
	assert.equal(link.yamlScalar, true);
	assert.equal(source.slice(link.targetRange.start, link.targetRange.end), scalar);
	const changed = source.slice(0, link.targetRange.start) + JSON.stringify('/new/#details') + source.slice(link.targetRange.end);
	const updated = await parsePageMarkdownSource(changed);
	assert.deepEqual(updated.diagnostics, []);
	assert.equal(updated.blocks[0].cards[0].link, '/new/#details');
	assert.match(changed, /# Keep this comment/);
	assert.equal(parseYaml(scalar), '/old/#details');
}

{
	const source = '# Folded link\n\n```card-list\nitems:\n  - link: >-\n      /old/#details\n    title: Preserve this field\n```\n';
	const model = await parsePageMarkdownSource(source);
	assert.deepEqual(model.diagnostics, []);
	const link = model.links[0];
	const changed = source.slice(0, link.targetRange.start) + JSON.stringify('/new/#details') + source.slice(link.targetRange.end);
	const updated = await parsePageMarkdownSource(changed);
	assert.deepEqual(updated.diagnostics, []);
	assert.equal(updated.blocks[0].cards[0].title, 'Preserve this field');
	assert.equal(updated.blocks[0].cards[0].link, '/new/#details');
}

console.log('Structured YAML block tests passed.');
