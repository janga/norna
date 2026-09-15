import assert from 'node:assert/strict';
import { parsePageMarkdown, parsePageMarkdownSource } from './lib/page-markdown.mjs';
import { splitNornaRenderedBlocks } from './lib/norna-markdown-blocks.mjs';

const details = (body) => `<details>\n<summary>More</summary>\n\n${body}\n\n</details>`;
const detailsIssues = async (body) => (await parsePageMarkdownSource(`# Page\n\n${body}`, {
	label: 'site/pages/010-guide/content.md',
})).diagnostics.filter((issue) => issue.code === 'heading-inside-details');

for (const heading of [
	...Array.from({ length: 6 }, (_, i) => `${'#'.repeat(i + 1)} Hidden`),
	'Hidden\n======', 'Hidden\n------',
	...Array.from({ length: 6 }, (_, i) => `<H${i + 1} class="title">Hidden</H${i + 1}>`),
	'<div>\n\n### Hidden\n\n</div>',
	'<div>\n<h4>Hidden</h4>\n</div>',
	'> ### Hidden', '- ### Hidden',
]) {
	const issues = await detailsIssues(details(heading));
	assert.equal(issues.length, 1, heading);
	assert.equal(issues[0].severity, 'error');
	assert.match(issues[0].message, /site\/pages\/010-guide\/content\.md line \d+: Headings H1-H6/);
	assert.match(issues[0].fix, /outside <details>.*bold text/);
}

for (const [body, count] of [
	['<details><summary><h2>Summary heading</h2></summary></details>', 1],
	[details(details('## Nested')), 1],
	[`${details('## First')}\n\n${details('### Second')}`, 2],
	['<details>\n\n## Unclosed disclosure', 1],
	['<DeTaIlS data-label=">">\n\n## Hidden\n\n</DeTaIlS>\n\n## Outside', 1],
	['<details>\n<!-- </details> -->\n\n## Hidden\n\n</details>', 1],
	[details('~~~html\n</details>\n~~~\n\n## Still hidden'), 1],
	[details('`</details>`\n\n## Still hidden'), 1],
	[details('<span title="</details>">Label</span>\n\n## Still hidden'), 1],
	[details('Text.\n\n> <details>\n> <summary>More</summary>\n>\n> <h2>Hidden</h2>\n> </details>'), 1],
	[details('<summary>\n\nSummary heading\n---\n\n</summary>'), 1],
	[details('<p title="<h2>Not a heading</h2>">Text</p>'), 0],
	[details('<!-- <h2>Example</h2> -->\n\n<!--\n## Example\n-->'), 0],
	[details('~~~markdown\n## Example\n<h2>Example</h2>\n~~~'), 0],
	[details('    ## Example\n    <h2>Example</h2>'), 0],
	[details('`## Example` and `<h2>Example</h2>`.'), 0],
	[details('\\## Example\n\n\\<h2>Example\\</h2>\n\n&lt;h3&gt;Example&lt;/h3&gt;'), 0],
	[details('<pre>\n## Example\n&lt;h2&gt;Example&lt;/h2&gt;\n</pre>'), 0],
	[details('<script>const example = "<h2>Example</h2>";</script>'), 0],
	[details('<textarea><h2>Example</h2></textarea>'), 0],
	[details('Text with **emphasis**.\n\n- Item\n- Another item'), 0],
	['```html\n<details>\n```\n\n## Visible', 0],
	['<!-- <details> -->\n\n## Visible', 0],
	[`${details('Text.')}\n\n## Visible\n\n<h3>Also visible</h3>`, 0],
]) assert.equal((await detailsIssues(body)).length, count, body);

const detailsWithFrontmatter = ['---', 'page:', '  description: Example', '---', '# Page', '', ...details('## Hidden').split('\n')].join('\r\n');
const detailsDocument = await parsePageMarkdownSource(detailsWithFrontmatter, { label: 'guide/content.md' });
assert.equal(detailsDocument.diagnostics[0].code, 'heading-inside-details');
assert.equal(detailsDocument.diagnostics[0].line, 10);
assert.match(detailsDocument.diagnostics[0].message, /guide\/content\.md line 10:/);

const source = `# Dog Shelter

Welcome to the shelter.[^margin:intro]

[^margin:intro]: This is the page introduction.

## Our dogs {#dogs}

Meet the dogs.

### Rover

\`\`\`image-stack
items:
  - image: rover.svg
    caption: Rover
\`\`\`

## Contact

![Remote dog](https://example.com/dog.jpg)

![Local dog](portrait.jpg)
`;

const model = await parsePageMarkdown(source, {
	label: 'site/pages/000-home/content.md',
	lineOffset: 3,
});

assert.equal(model.pageTitle?.title, 'Dog Shelter');
assert.equal(model.intro?.kind, 'page-intro');
assert.deepEqual(model.sections.map(({ id, title }) => ({ id, title })), [
	{ id: 'dogs', title: 'Our dogs' },
	{ id: 'contact', title: 'Contact' },
]);
assert.deepEqual(model.navigationHeadings, [
	{ depth: 2, id: 'dogs', line: 10, parentId: null, title: 'Our dogs' },
	{ depth: 3, id: 'rover', line: 14, parentId: 'dogs', title: 'Rover' },
	{ depth: 2, id: 'contact', line: 22, parentId: null, title: 'Contact' },
]);
assert.equal(model.notes.length, 1);
assert.equal(model.blocks.length, 1);
assert.equal(model.blocks[0].type, 'image-stack');
assert.equal(model.blocks[0].images[0].image, 'rover.svg');
assert.deepEqual(model.managedImages.map(({ image }) => image), ['rover.svg']);
assert.deepEqual(model.markdownImages, [{ target: 'portrait.jpg', line: 26 }]);
assert.deepEqual(model.diagnostics, []);

const hotReloadBlocks = [
	{ type: 'page-list', source: '' },
	{ type: 'image-stack', source: '- image: rover.svg' },
];
const markerContent = splitNornaRenderedBlocks([
	'<p>Before.</p>',
	'<norna-block data-index="0"></norna-block>',
	'<p>Between.</p>',
	'<norna-block data-index="1"></norna-block>',
].join('\n'), hotReloadBlocks);
assert.deepEqual(markerContent.map(({ type }) => type), [
	'html',
	'page-list',
	'html',
	'image-stack',
]);
const hotReloadContent = splitNornaRenderedBlocks([
	'<p>Before.</p>',
	'<pre data-language="plaintext"><code><span class="line"><span>ordinary code</span></span></code></pre>',
	'<pre data-language="plaintext"><code><span class="line"><span></span></span></code></pre>',
	'<p>Between.</p>',
	'<pre data-language="plaintext"><code><span class="line"><span>- image: rover.svg</span></span></code></pre>',
].join('\n'), hotReloadBlocks);
assert.deepEqual(hotReloadContent.map(({ type }) => type), [
	'html',
	'page-list',
	'html',
	'image-stack',
]);
assert.match(hotReloadContent[0].html, /ordinary code/);
assert.throws(
	() => splitNornaRenderedBlocks('<p>No rendered block.</p>', hotReloadBlocks),
	/Rendered Markdown contains 0 Norna block markers, but 2 blocks were parsed/,
);
assert.throws(
	() => splitNornaRenderedBlocks([
		'<pre><code></code></pre>',
		'<pre><code></code></pre>',
	].join('\n'), [{ type: 'page-list', source: '' }]),
	/ambiguous plain-code matches/,
);

const blockRegion = model.sections[0];
assert.deepEqual(blockRegion.content.map(({ kind }) => kind), ['markdown', 'norna-block']);
assert.equal(source.slice(blockRegion.content[1].range.start, blockRegion.content[1].range.end).startsWith('```image-stack'), true);

const renamedContentBlocks = await parsePageMarkdown(`# Renamed content blocks

## Examples {#examples}

\`\`\`norna-image-stack
- image: first.jpg
\`\`\`

\`\`\`norna-image-carousel
- image: first.jpg
- image: second.jpg
\`\`\`

\`\`\`norna-carousel
- image: first.jpg
- image: second.jpg
\`\`\`

\`\`\`carousel
- image: first.jpg
- image: second.jpg
\`\`\`

\`\`\`norna-card-list
- title: First card
  text: Card text.
\`\`\`

\`\`\`norna-page-list
\`\`\`
`, { label: 'renamed-blocks.md' });
assert.deepEqual(
	renamedContentBlocks.diagnostics.map(({ code }) => code),
	Array(6).fill('renamed-norna-block'),
);
assert.match(renamedContentBlocks.diagnostics[0].message, /"norna-image-stack" was renamed to "image-stack"/);
assert.match(renamedContentBlocks.diagnostics[1].message, /"norna-image-carousel" was renamed to "image-carousel"/);
assert.match(renamedContentBlocks.diagnostics[2].message, /"norna-carousel" was renamed to "image-carousel"/);
assert.match(renamedContentBlocks.diagnostics[3].message, /"carousel" was renamed to "image-carousel"/);
assert.match(renamedContentBlocks.diagnostics[4].message, /"norna-card-list" was renamed to "card-list"/);
assert.match(renamedContentBlocks.diagnostics[5].message, /"norna-page-list" was renamed to "page-list"/);

const carouselAsProse = await parsePageMarkdown(`# Carousel prose

## Name {#name}

carousel
`);
assert.deepEqual(carouselAsProse.diagnostics, []);

const invalid = await parsePageMarkdown(`Before title.

## Section

\`\`image-stack
- image: missing.jpg
`, { label: 'invalid.md' });

assert.deepEqual(
	invalid.diagnostics.map(({ code }) => code),
	['missing-page-title', 'page-title-order', 'page-title-order', 'invalid-norna-block-start'],
);
assert.equal(invalid.diagnostics.at(-1)?.line, 5);

const withFrontmatter = await parsePageMarkdownSource(`---
page:
  description: Example
---
# Frontmatter page

## Section
`);
assert.equal(withFrontmatter.pageTitle?.title, 'Frontmatter page');
assert.equal(withFrontmatter.intro?.line, 5);
assert.equal(withFrontmatter.sections[0]?.line, 7);
assert.equal(withFrontmatter.frontmatterUnclosed, false);

const unclosedFrontmatter = await parsePageMarkdownSource(`---
page:
  description: Missing delimiter
`);
assert.equal(unclosedFrontmatter.frontmatterUnclosed, true);
assert.equal(unclosedFrontmatter.pageTitle, null);

const validCallouts = await parsePageMarkdown(`# Callouts

## Meanings {#meanings}

> [!NOTE]
> Context.

> [!TIP]
> Optional guidance.

> [!IMPORTANT]
> Required information.

> [!WARNING]
> Immediate attention.

> [!CAUTION]
> A negative consequence.

> [!DANGER]
> Severe or irreversible harm.
`);
assert.deepEqual(validCallouts.diagnostics, []);

const invalidCallouts = await parsePageMarkdown(`# Invalid callouts

## Problems {#problems}

> [!warning]
> Wrong case.

> [!INFO]
> Unknown meaning.

> [!TIP] Custom title
> Titles are not supported.

> [!NOTE]

> Ordinary blockquote.
>
> > [!DANGER]
> > Nested callout.
`, { label: 'invalid-callouts.md' });
assert.deepEqual(
	invalidCallouts.diagnostics.map(({ code }) => code),
	[
		'invalid-semantic-callout-type-case',
		'unknown-semantic-callout-type',
		'unsupported-semantic-callout-title',
		'empty-semantic-callout',
		'nested-semantic-callout',
	],
);
assert.match(invalidCallouts.diagnostics[0].message, /invalid-callouts\.md line 5/);
assert.match(invalidCallouts.diagnostics[1].fix, /NOTE, TIP, IMPORTANT, WARNING, CAUTION, DANGER/);

const validCodeMetadata = await parsePageMarkdown(`# Code examples

## Configuration {#configuration}

\`\`\`js title="src/config.js" {2,4-6}
const first = true;
const second = true;
const third = true;
const fourth = true;
const fifth = true;
const sixth = true;
\`\`\`

\`\`\`sh {1}
npm run build
\`\`\`
`);
assert.deepEqual(validCodeMetadata.diagnostics, []);

for (const [metadata, expectedMessage] of [
	['highlight=2', /Unknown code fence metadata/],
	['{2} title="late.js"', /line selector must come after/],
	['title=""', /title cannot be empty/],
	['title="open.js', /JSON double-quoted string with a closing double quote/],
	['{0}', /Invalid code line range/],
	['{3-2}', /Invalid code line range/],
	['{2,2}', /selected more than once/],
	['{3}', /block has 2 lines/],
]) {
	const invalidCodeMetadata = await parsePageMarkdown(`# Invalid code

## Example {#example}

\`\`\`js ${metadata}
one();
two();
\`\`\`
`, { label: 'invalid-code.md' });
	assert.equal(invalidCodeMetadata.diagnostics.length, 1);
	assert.equal(invalidCodeMetadata.diagnostics[0].code, 'invalid-code-fence-metadata');
	assert.equal(invalidCodeMetadata.diagnostics[0].line, 5);
	assert.match(invalidCodeMetadata.diagnostics[0].message, /invalid-code\.md line 5/);
	assert.match(invalidCodeMetadata.diagnostics[0].message, expectedMessage);
}

const codeMetadataWithoutLanguage = await parsePageMarkdown(`# Missing language

## Example {#example}

\`\`\` title="src/config.js"
const value = true;
\`\`\`
`, { label: 'missing-language.md' });
assert.equal(codeMetadataWithoutLanguage.diagnostics[0].code, 'invalid-code-fence-metadata');
assert.match(codeMetadataWithoutLanguage.diagnostics[0].message, /requires a language/);
assert.match(codeMetadataWithoutLanguage.diagnostics[0].fix, /```js title="src\/config\.js" \{2\}/);

const validRowHeaders = await parsePageMarkdown(`# Row headers

## Comparison {#comparison}

| **Feature** {row-header} | State |
| --- | --- |
| Search | Ready |
| Page moves | Planned |
`, { label: 'row-headers.md' });
assert.deepEqual(validRowHeaders.diagnostics, []);

for (const [table, expectedCode, expectedMessage] of [
	[
		'| Feature | State {row-header} |\n| --- | --- |\n| Search | Ready |',
		'invalid-table-row-header-column',
		/must appear in the first column heading/,
	],
	[
		'| Feature {row-header} {row-header} | State |\n| --- | --- |\n| Search | Ready |',
		'repeated-table-row-header-marker',
		/may contain \{row-header\} only once/,
	],
	[
		'| Feature {row-header} detail | State |\n| --- | --- |\n| Search | Ready |',
		'invalid-table-row-header-marker-position',
		/must be the final content/,
	],
	[
		'| {row-header} | State |\n| --- | --- |\n| Search | Ready |',
		'empty-table-row-header-heading',
		/needs a visible column heading/,
	],
	[
		'| Feature {row-header} | State |\n| --- | --- |\n| | Ready |',
		'empty-table-row-header',
		/has an empty row header/,
	],
	[
		'| Feature {row-header} | State |\n| --- | --- |\n| Search | Ready |\n| search | Planned |',
		'duplicate-table-row-header',
		/Row header "search" is repeated/,
	],
	[
		'| Feature {row-header} | State |\n| --- | --- |',
		'empty-table-row-header-body',
		/needs at least one body row/,
	],
]) {
	const invalidRowHeaders = await parsePageMarkdown(`# Invalid row headers

## Comparison {#comparison}

${table}
`, { label: 'invalid-row-headers.md' });
	assert.ok(invalidRowHeaders.diagnostics.some(({ code }) => code === expectedCode));
	assert.match(
		invalidRowHeaders.diagnostics.find(({ code }) => code === expectedCode)?.message ?? '',
		expectedMessage,
	);
}

console.log('Page Markdown model tests passed.');
