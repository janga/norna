import assert from 'node:assert/strict';
import { parsePageMarkdown } from './lib/page-markdown.mjs';

const source = `# Dog Shelter

Welcome to the shelter. {note-ref}

{note: This is the page introduction.}

## Our dogs {#dogs}

Meet the dogs.

### Rover

\`\`\`norna-image-stack
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
assert.equal(source.slice(blockRegion.content[1].range.start, blockRegion.content[1].range.end).startsWith('```norna-image-stack'), true);

const invalid = await parsePageMarkdown(`Before title.

## Section

\`\`norna-image-stack
- image: missing.jpg
`, { label: 'invalid.md' });

assert.deepEqual(
	invalid.diagnostics.map(({ code }) => code),
	['missing-page-title', 'page-title-order', 'page-title-order', 'invalid-norna-block'],
);
assert.equal(invalid.diagnostics.at(-1)?.line, 5);

console.log('Page Markdown model tests passed.');
