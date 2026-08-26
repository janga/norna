import assert from 'node:assert/strict';
import {
	formatHeadingIdentifierIssue,
	getHeadingIdentifierIssues,
	getMarkdownHeadings,
	slugifyHeadingText,
} from './lib/heading-ids.mjs';

assert.equal(slugifyHeadingText('Förstå Norna'), 'forsta-norna');
assert.equal(slugifyHeadingText('Café Über Straße'), 'cafe-uber-strasse');
assert.equal(slugifyHeadingText('Smørrebrød & œuvre'), 'smorrebrod-oeuvre');
assert.equal(slugifyHeadingText("What's new?"), 'whats-new');

const { headings } = await getMarkdownHeadings(`# Page title

## A **bold** [heading](https://example.com)

### Café details

## Renamed heading {#stable-id}

\`\`\`md
## Not a heading
\`\`\`
`);

assert.deepEqual(
	headings.map(({ depth, explicitId, id, title }) => ({ depth, explicitId, id, title })),
	[
		{ depth: 1, explicitId: null, id: null, title: 'Page title' },
		{ depth: 2, explicitId: null, id: 'a-bold-heading', title: 'A bold heading' },
		{ depth: 3, explicitId: null, id: 'cafe-details', title: 'Café details' },
		{ depth: 2, explicitId: 'stable-id', id: 'stable-id', title: 'Renamed heading' },
	],
);
assert.deepEqual(getHeadingIdentifierIssues(headings), []);

const collision = await getMarkdownHeadings(`# Page

## Förstå

### Forsta
`);
assert.equal(getHeadingIdentifierIssues(collision.headings)[0]?.code, 'duplicate-heading-id');
assert.equal(
	formatHeadingIdentifierIssue(getHeadingIdentifierIssues(collision.headings)[0], 'site/pages/000-home/content.md'),
	[
		'site/pages/000-home/content.md: Two headings resolve to id "forsta".',
		'- line 3: "Förstå"',
		'- line 5: "Forsta"',
		'Add a unique explicit id to at least one heading, for example {#forsta-details}.',
	].join('\n'),
);

const invalid = await getMarkdownHeadings(`# Page

## Symbols 🎉

### 日本語

## Explicit {#Not Valid}
`);
assert.deepEqual(
	getHeadingIdentifierIssues(invalid.headings).map(({ code }) => code),
	['empty-heading-id', 'invalid-heading-id'],
);

console.log('Heading id tests passed.');
