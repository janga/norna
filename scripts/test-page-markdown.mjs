import assert from 'node:assert/strict';
import { parsePageMarkdown, parsePageMarkdownSource } from './lib/page-markdown.mjs';

const source = `# Dog Shelter

Welcome to the shelter. {note-ref}

{note: This is the page introduction.}

## Our dogs {#dogs}

Meet the dogs.

### Rover

\`\`\`image-stack
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
	{ depth: 2, id: 'contact', line: 21, parentId: null, title: 'Contact' },
]);
assert.equal(model.notes.length, 1);
assert.equal(model.blocks.length, 1);
assert.equal(model.blocks[0].type, 'image-stack');
assert.equal(model.blocks[0].images[0].image, 'rover.svg');
assert.deepEqual(model.managedImages.map(({ image }) => image), ['rover.svg']);
assert.deepEqual(model.markdownImages, [{ target: 'portrait.jpg', line: 25 }]);
assert.deepEqual(model.diagnostics, []);

const blockRegion = model.sections[0];
assert.deepEqual(blockRegion.content.map(({ kind }) => kind), ['markdown', 'norna-block']);
assert.equal(source.slice(blockRegion.content[1].range.start, blockRegion.content[1].range.end).startsWith('```image-stack'), true);

const renamedImageBlocks = await parsePageMarkdown(`# Renamed image blocks

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
`, { label: 'renamed-blocks.md' });
assert.deepEqual(
	renamedImageBlocks.diagnostics.map(({ code }) => code),
	['renamed-norna-block', 'renamed-norna-block', 'renamed-norna-block'],
);
assert.match(renamedImageBlocks.diagnostics[0].message, /"norna-image-stack" was renamed to "image-stack"/);
assert.match(renamedImageBlocks.diagnostics[1].message, /"norna-image-carousel" was renamed to "carousel"/);
assert.match(renamedImageBlocks.diagnostics[2].message, /"norna-carousel" was renamed to "carousel"/);

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
	['title="open.js', /missing its closing double quote/],
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

console.log('Page Markdown model tests passed.');
