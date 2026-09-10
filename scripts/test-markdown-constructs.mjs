import assert from 'node:assert/strict';
import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { test } from 'node:test';
import {
	createTempFixtureCopy,
	createTempSite,
	fileExists,
	fixtureSiteDir,
	initCleanGitWorktree,
	runContentScript,
	runNorna,
} from './test-support/content-model.mjs';

const writePage = async (siteDir, pageDirectory, source) => {
	const pageDir = path.join(siteDir, 'pages', pageDirectory);
	await mkdir(pageDir, { recursive: true });
	await writeFile(path.join(pageDir, 'content.md'), source);
};

const writePublicRoute = async (siteDir, route) => {
	const routeDir = path.join(siteDir, 'public', route);
	await mkdir(routeDir, { recursive: true });
	await writeFile(path.join(routeDir, 'index.html'), '<!doctype html><title>Fixture target</title>\n');
};

test('inline notes render as linked numbered CSS margin notes', async () => {
	const { root, siteDir } = await createTempSite({ underRepoCache: true });
	try {
		await writeFile(path.join(siteDir, 'config.yaml'), 'url: https://example.com/docs/\n');
		await writeFile(path.join(siteDir, 'pages', '000-home', 'content.md'), `---
page:
  description: Fixture
---

# Inline notes

## Intro {#intro}

The first paragraph points to an explanation.{note-ref}

{note: This explanation names \`sitewide-content.yaml\`, links to the
[site files](/faq/#site-files), and stays beside the paragraph on wide screens.}

The second paragraph has its own explanation.{note-ref}

{note: This is the second explanation and links to the [FAQ](/faq/#second-note).}

The third paragraph points to a link-only note.{note-ref}

{note: [Install ImageMagick.](/faq/#link-only-note)}
`);
		await writePublicRoute(siteDir, 'faq');

		await runNorna(['--site-dir', siteDir, 'build']);
		const html = await readFile(path.join(path.dirname(siteDir), 'dist', 'index.html'), 'utf8');
		assert.match(html, /<sup class="section-note-ref"><a id="note-ref-home-intro-1" href="#note-home-intro-1" aria-label="Note 1" aria-describedby="note-home-intro-1">1<\/a><\/sup><span class="section-note section-note-margin" id="note-home-intro-1" aria-label="Note 1" role="note">/);
		assert.match(html, /<a class="section-note-number" href="#note-ref-home-intro-1" aria-label="Note 1">\s*1\s*<\/a>/);
		assert.match(html, /This explanation names <code>sitewide-content\.yaml<\/code>, links to the/);
		assert.match(html, /<a href="\/docs\/faq\/#site-files">site files<\/a>/);
		assert.doesNotMatch(html, /href="\/docs\/docs\/faq\/|href="docs\/faq\//);
		assert.match(html, /<sup class="section-note-ref"><a id="note-ref-home-intro-2" href="#note-home-intro-2" aria-label="Note 2" aria-describedby="note-home-intro-2">2<\/a><\/sup><span class="section-note section-note-margin" id="note-home-intro-2" aria-label="Note 2" role="note">/);
		assert.match(html, /This is the second explanation and links/);
		assert.match(html, /<a href="\/docs\/faq\/#second-note">FAQ<\/a>/);
		assert.match(html, /<a href="\/docs\/faq\/#link-only-note">Install ImageMagick\.<\/a>/);
		assert.doesNotMatch(html, /data-note-id|grid-row:/);
		assert.doesNotMatch(html, /\{note:/);
	} finally {
		await rm(root, { recursive: true, force: true });
	}
});

test('page-title notes preserve root-relative links under a site base path', async () => {
	const { root, siteDir } = await createTempSite({ underRepoCache: true });
	try {
		await writeFile(path.join(siteDir, 'config.yaml'), 'url: https://example.com/docs/\n');
		await writeFile(path.join(siteDir, 'pages', '000-home', 'content.md'), `---
page:
  description: Fixture
---

# Page-title note

The introduction points to an installation note.{note-ref}

{note: [Install ImageMagick.](/faq/#install-imagemagick)}

## Intro {#intro}

Page content.
`);
		await writePublicRoute(siteDir, 'faq');

		await runNorna(['--site-dir', siteDir, 'build']);
		const html = await readFile(path.join(path.dirname(siteDir), 'dist', 'index.html'), 'utf8');
		assert.match(html, /<a href="\/docs\/faq\/#install-imagemagick">Install ImageMagick\.<\/a>/);
		assert.doesNotMatch(html, /href="\/docs\/docs\/faq\/|href="docs\/faq\//);
	} finally {
		await rm(root, { recursive: true, force: true });
	}
});

test('reference footnotes render page-wide with localized accessible links', async () => {
	for (const locale of [
		{
			language: 'en',
			label: 'Footnotes',
			backLabel: 'Back to reference',
		},
		{
			language: 'sv',
			label: 'Fotnoter',
			backLabel: 'Tillbaka till referens',
		},
	]) {
		const { root, siteDir } = await createTempSite({ underRepoCache: true });
		try {
			await writeFile(path.join(siteDir, 'config.yaml'), `url: https://example.com/docs/\nlanguage: ${locale.language}\n`);
			await writeFile(path.join(siteDir, 'pages', '000-home', 'content.md'), `# Reference footnotes

The first section cites one source twice.[^scope] A second reference points to
the same definition.[^scope]

## Details {#details}

The definition may live in another page section.

[^scope]: The first line of the definition continues on a second line and
    links to the [About page](/about/).
`);
			await writePage(siteDir, '010-about', `# About

## Scope {#scope}

About this fixture.
`);

			const { stdout } = await runContentScript(siteDir, ['--check']);
			assert.match(stdout, /Content check passed\./);

			await runNorna(['--site-dir', siteDir, 'build']);
			const html = await readFile(path.join(root, 'dist', 'index.html'), 'utf8');
			assert.match(html, /<section data-footnotes class="footnotes">/);
			assert.match(html, new RegExp(`<h2 class="sr-only" id="footnote-label">${locale.label}<\\/h2>`));
			assert.match(html, /id="user-content-fnref-scope" data-footnote-ref aria-describedby="footnote-label">1<\/a>/);
			assert.match(html, /id="user-content-fnref-scope-2" data-footnote-ref aria-describedby="footnote-label">1<\/a>/);
			assert.match(html, new RegExp(`aria-label="${locale.backLabel} 1"`));
			assert.match(html, new RegExp(`aria-label="${locale.backLabel} 1-2"`));
			assert.match(html, /href="\/docs\/about\/">About page<\/a>/);
			assert.match(html, /The first line of the definition continues on a second line and\s+links to the/);
		} finally {
			await rm(root, { recursive: true, force: true });
		}
	}
});

test('semantic callouts render every supported meaning with localized accessible labels', async () => {
	for (const locale of [
		{
			language: 'en',
			labels: ['Note', 'Tip', 'Important', 'Warning', 'Caution', 'Danger'],
		},
		{
			language: 'sv',
			labels: ['Notera', 'Tips', 'Viktigt', 'Varning', 'Var försiktig', 'Fara'],
		},
	]) {
		const { root, siteDir } = await createTempSite({ underRepoCache: true });
		try {
			await writeFile(path.join(siteDir, 'config.yaml'), `url: https://example.com/\nlanguage: ${locale.language}\n`);
			await writeFile(path.join(siteDir, 'pages', '000-home', 'content.md'), `# Callouts

## Meanings {#meanings}

> [!NOTE]
> Context with [a link](/about/) and **emphasis**.

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

> An ordinary blockquote remains ordinary.
`);
			await writePage(siteDir, '010-about', `# About

## Context {#context}

Linked content.
`);

			const { stdout } = await runContentScript(siteDir, ['--check']);
			assert.match(stdout, /Content check passed\./);
			await runNorna(['--site-dir', siteDir, 'build']);
			const html = await readFile(path.join(root, 'dist', 'index.html'), 'utf8');

			for (const [index, type] of ['note', 'tip', 'important', 'warning', 'caution', 'danger'].entries()) {
				assert.match(
					html,
					new RegExp(`<aside aria-labelledby="norna-callout-label-${index}" class="norna-callout norna-callout-${type}" role="note">`),
				);
				assert.match(
					html,
					new RegExp(`<p class="norna-callout-label" id="norna-callout-label-${index}">${locale.labels[index]}<\\/p>`),
				);
			}
			assert.match(html, /Context with <a href="\/about\/">a link<\/a> and <strong>emphasis<\/strong>\./);
			assert.match(html, /<blockquote>\s*<p>An ordinary blockquote remains ordinary\.<\/p>\s*<\/blockquote>/);
			assert.doesNotMatch(html, /\[!(?:NOTE|TIP|IMPORTANT|WARNING|CAUTION|DANGER)\]/);
		} finally {
			await rm(root, { recursive: true, force: true });
		}
	}
});

test('content:check rejects unsupported semantic callout syntax', async () => {
	const { root, siteDir } = await createTempSite();
	try {
		await writeFile(path.join(siteDir, 'pages', '000-home', 'content.md'), `# Invalid callout

## Warning {#warning}

> [!INFO]
> This type is not supported.
`);

		await assert.rejects(
			runContentScript(siteDir, ['--check']),
			(error) => {
				assert.match(error.output, /Unknown semantic callout type "INFO"/);
				assert.match(error.output, /Use one of: NOTE, TIP, IMPORTANT, WARNING, CAUTION, DANGER/);
				return true;
			},
		);
	} finally {
		await rm(root, { recursive: true, force: true });
	}
});

test('Markdown tables retain native semantics inside one focusable overflow frame', async () => {
	const { root, siteDir } = await createTempSite({ underRepoCache: true });
	try {
		await writeFile(path.join(siteDir, 'pages', '000-home', 'content.md'), `# Data table

| Feature {row-header} | Status | Notes |
| --- | --- | --- |
| Native table | Ready | Header and cell relationships stay intact. |
| Wide layout | Ready | The wrapper owns horizontal overflow. |

> [!NOTE]
> A compact table may remain inside a callout.
>
> | Scope | Behavior |
> | --- | --- |
> | Nested | Stays inside the callout. |
`);

		await runNorna(['--site-dir', siteDir, 'build']);
		const html = await readFile(path.join(root, 'dist', 'index.html'), 'utf8');
		assert.match(
			html,
			/<div\b(?=[^>]*class="norna-table-frame content-block-note-lane-boundary")(?=[^>]*data-table-frame)(?=[^>]*data-table-row-headers="true")[^>]*><div\b(?=[^>]*class="norna-table-scroll")(?=[^>]*data-table-scroll)(?=[^>]*tabindex="0")[^>]*><table data-row-headers="true">/,
		);
		assert.match(html, /<thead>[\s\S]*?<th scope="col">Feature<\/th>[\s\S]*?<th scope="col">Status<\/th>[\s\S]*?<th scope="col">Notes<\/th>[\s\S]*?<\/thead>/);
		assert.match(html, /<tbody>[\s\S]*?<th scope="row">Native table<\/th>[\s\S]*?<td>Ready<\/td>[\s\S]*?<\/tbody>/);
		assert.doesNotMatch(html, /\{row-header\}/);
		assert.match(
			html,
			/<aside\b[^>]*class="norna-callout norna-callout-note"[^>]*>[\s\S]*?<div\b(?=[^>]*class="norna-table-frame content-block-note-lane-boundary")(?=[^>]*data-table-frame)[^>]*>[\s\S]*?<th>Scope<\/th>[\s\S]*?<\/aside>/,
			'A table inside a callout must remain a nested native table.',
		);
		assert.equal(
			(html.match(/data-table-row-headers="true"/gu) ?? []).length,
			1,
			'Only the explicitly declared table may receive the row-header contract.',
		);
		assert.equal((html.match(/<table\b/gu) ?? []).length, 2, 'Each source table must render exactly once.');
	} finally {
		await rm(root, { recursive: true, force: true });
	}
});

test('content:check rejects ambiguous row-header tables', async () => {
	const { root, siteDir } = await createTempSite();
	try {
		await writeFile(path.join(siteDir, 'pages', '000-home', 'content.md'), `# Invalid table

## Comparison {#comparison}

| Feature {row-header} | State |
| --- | --- |
| Search | Ready |
| search | Planned |
`);

		await assert.rejects(
			runContentScript(siteDir, ['--check']),
			(error) => {
				assert.match(error.output, /Row header "search" is repeated/);
				assert.match(error.output, /Give every row a unique label/);
				return true;
			},
		);
	} finally {
		await rm(root, { recursive: true, force: true });
	}
});

test('code titles and selected lines render without changing copied code', async () => {
	const { root, siteDir } = await createTempSite({ underRepoCache: true });
	try {
		await writeFile(path.join(siteDir, 'pages', '000-home', 'content.md'), `# Code examples

## Configuration {#configuration}

\`\`\`js title="src/config.js" {2,4-5}
const first = true;
const second = true;
const third = true;
const fourth = true;
const fifth = true;
\`\`\`

\`\`\`sh
npm run build
\`\`\`
`);

		const { stdout } = await runContentScript(siteDir, ['--check']);
		assert.match(stdout, /Content check passed\./);
		await runNorna(['--site-dir', siteDir, 'build']);
		const html = await readFile(path.join(root, 'dist', 'index.html'), 'utf8');

		assert.match(html, /<figure class="norna-code-example">/);
		assert.match(html, /<figcaption class="norna-code-title"><span class="norna-code-title-text">src\/config\.js<\/span><\/figcaption>/);
		assert.match(html, /class="astro-code github-dark norna-code-has-highlighted-lines"/);
		assert.match(html, /class="line norna-code-line-highlighted" data-line="2"/);
		assert.match(html, /class="line norna-code-line-highlighted" data-line="4"/);
		assert.match(html, /class="line norna-code-line-highlighted" data-line="5"/);
		assert.doesNotMatch(html, /class="line norna-code-line-highlighted" data-line="3"/);
		assert.match(html, /<pre class="astro-code github-dark"[^>]*data-language="sh">/);
		assert.doesNotMatch(html, /title=&quot;src\/config\.js&quot;|\{2,4-5\}/);
	} finally {
		await rm(root, { recursive: true, force: true });
	}
});

test('content:check rejects malformed code fence metadata', async () => {
	const { root, siteDir } = await createTempSite();
	try {
		await writeFile(path.join(siteDir, 'pages', '000-home', 'content.md'), `# Invalid code

## Example {#example}

\`\`\`js {1} title="src/config.js"
const value = true;
\`\`\`
`);

		await assert.rejects(
			runContentScript(siteDir, ['--check']),
			(error) => {
				assert.match(error.output, /line selector must come after the optional title/);
				assert.match(error.output, /title="src\/config\.js" \{2,4-6\}/);
				return true;
			},
		);
	} finally {
		await rm(root, { recursive: true, force: true });
	}
});

test('card-list images are managed image references', async () => {
	const { root, siteDir } = await createTempSite({ underRepoCache: true });
	try {
		await writeFile(path.join(siteDir, 'pages', '000-home', 'content.md'), `---
page:
  description: Fixture
---

# Card List Fixture

## Help {#help}

\`\`\`card-list
layout: image-left
flow: stack
size: l
width: narrow

- title: Adopt
  text: Give a dog a new home.
  image: adopt.svg
  link: /adopt/
  badge-text: Recommended
- title: Donate
  text: Support the shelter.
\`\`\`
`);
		await mkdir(path.join(siteDir, 'pages', '000-home', 'images'), { recursive: true });
		await writeFile(path.join(siteDir, 'pages', '000-home', 'images', 'adopt.svg'), '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 100"><rect width="160" height="100"/></svg>\n');
		await writePage(siteDir, '010-adopt', `# Adopt

## Start {#start}

Adoption information.
`);

		const { stdout } = await runContentScript(siteDir, ['--check']);
		assert.match(stdout, /Content check passed\./);

		await runNorna(['--site-dir', siteDir, 'images']);
		const manifest = JSON.parse(await readFile(path.join(siteDir, '.norna', 'generated-images.json'), 'utf8'));
		assert.equal(manifest['pages/000-home/images/adopt.svg'].kind, 'static');

		await runNorna(['--site-dir', siteDir, 'build']);
		const html = await readFile(path.join(root, 'dist', 'index.html'), 'utf8');
		assert.match(html, /card-list-layout-image-left/);
		assert.match(html, /card-list-flow-stack/);
		assert.match(html, /card-list-size-l/);
		assert.match(html, /card-list-width-narrow/);
		assert.match(html, /card-list-item-has-image/);
		assert.match(html, /class="card-list-badge">Recommended<\/p>/);
		assert.match(html, /Give a dog a new home\./);
		assert.match(html, /href="\/adopt\/"/);
		assert.match(html, /src="\/images\/original\/pages\/000-home\/images\/adopt-[a-f0-9]{8}\.svg"/);
	} finally {
		await rm(root, { recursive: true, force: true });
	}
});

test('content:check fails when a card-list image file is missing', async () => {
	const { root, siteDir } = await createTempSite();
	try {
		await writeFile(path.join(siteDir, 'pages', '000-home', 'content.md'), `---
page:
  description: Fixture
---

# Missing Card Image

## Help {#help}

\`\`\`card-list
- title: Adopt
  image: missing.svg
\`\`\`
`);

		await assert.rejects(
			() => runContentScript(siteDir, ['--check']),
			(error) => {
				assert.match(error.output, /Image "missing\.svg" does not exist at .*site\/pages\/000-home\/images\/missing\.svg or anywhere under any page image root\./);
				return true;
			},
		);
	} finally {
		await rm(root, { recursive: true, force: true });
	}
});

test('content:check fails for malformed card-list blocks', async () => {
	const { root, siteDir } = await createTempSite();
	try {
		await writeFile(path.join(siteDir, 'pages', '000-home', 'content.md'), `---
page:
  description: Fixture
---

# Malformed Card List

## Help {#help}

\`\`\`card-list
- text: Missing title
\`\`\`
`);

		await assert.rejects(
			() => runContentScript(siteDir, ['--check']),
			(error) => {
				assert.match(error.output, /Invalid card-list entry "- text: Missing title"\. Start each card with "- title: Card title"\./);
				return true;
			},
		);
	} finally {
		await rm(root, { recursive: true, force: true });
	}
});

test('content:check fails for invalid card-list options', async () => {
	const { root, siteDir } = await createTempSite();
	try {
		await writeFile(path.join(siteDir, 'pages', '000-home', 'content.md'), `---
page:
  description: Fixture
---

# Invalid Card List Options

## Help {#help}

\`\`\`card-list
layout: floating
flow: list
size: huge
width: full

- title: Adopt
  text: Give a dog a new home.
\`\`\`
`);

		await assert.rejects(
			() => runContentScript(siteDir, ['--check']),
			(error) => {
				assert.match(error.output, /Invalid card-list layout "floating"\. Use one of: image-top, image-left, image-right\./);
				return true;
			},
		);
	} finally {
		await rm(root, { recursive: true, force: true });
	}
});

test('content:check fails for invalid card-list width', async () => {
	const { root, siteDir } = await createTempSite();
	try {
		await writeFile(path.join(siteDir, 'pages', '000-home', 'content.md'), `---
page:
  description: Fixture
---

# Invalid Card List Width

## Help {#help}

\`\`\`card-list
width: full

- title: Adopt
  text: Give a dog a new home.
\`\`\`
`);

		await assert.rejects(
			() => runContentScript(siteDir, ['--check']),
			(error) => {
				assert.match(error.output, /Invalid card-list width "full"\. Use one of: text, narrow, normal, wide\./);
				return true;
			},
		);
	} finally {
		await rm(root, { recursive: true, force: true });
	}
});

test('content:check fails for invalid card-list size', async () => {
	const { root, siteDir } = await createTempSite();
	try {
		await writeFile(path.join(siteDir, 'pages', '000-home', 'content.md'), `---
page:
  description: Fixture
---

# Invalid Card List Size

## Help {#help}

\`\`\`card-list
size: huge

- title: Adopt
  text: Give a dog a new home.
\`\`\`
`);

		await assert.rejects(
			() => runContentScript(siteDir, ['--check']),
			(error) => {
				assert.match(error.output, /Invalid card-list size "huge"\. Use one of: s, m, l, xl\./);
				return true;
			},
		);
	} finally {
		await rm(root, { recursive: true, force: true });
	}
});

test('content:check fails for malformed Norna image blocks', async () => {
	const { root, siteDir } = await createTempSite();
	try {
		await writeFile(path.join(siteDir, 'pages', '000-home', 'content.md'), `---
page:
  description: Fixture
---

# Malformed Block

## Intro {#intro}

\`\`\`image-stack
image hero.jpg
  alt: Hero
\`\`\`
`);

		await assert.rejects(
			() => runContentScript(siteDir, ['--check']),
			(error) => {
				assert.match(error.output, /Invalid image-stack entry "image hero\.jpg"\. Start each image with "- image: filename\.jpg"\./);
				return true;
			},
		);
	} finally {
		await rm(root, { recursive: true, force: true });
	}
});

test('content:check fails for unknown Norna block names', async () => {
	const { root, siteDir } = await createTempSite();
	try {
		await mkdir(path.join(siteDir, 'pages', '000-home', 'images', 'plain'), { recursive: true });
		await writeFile(path.join(siteDir, 'pages', '000-home', 'images', 'plain', 'image.jpg'), 'fixture image');
		await writeFile(path.join(siteDir, 'pages', '000-home', 'content.md'), `---
page:
  description: Fixture
---

# Unknown Block

## Plain {#plain}

\`\`\`norna-gallery-stack
- image: image.jpg
\`\`\`
`);

		await assert.rejects(
			() => runContentScript(siteDir, ['--check']),
			(error) => {
				assert.match(error.output, /Unknown Norna block "norna-gallery-stack"\. Use one of: image-stack, image-carousel, card-list, page-list\./);
				assert.match(error.output, /Use image-stack for one or more stacked images\./);
				assert.match(error.output, /Example: ```image-stack\n- image: filename\.jpg\n```/);
				return true;
			},
		);
	} finally {
		await rm(root, { recursive: true, force: true });
	}
});

test('content:check explains renamed content block names', async () => {
	const { root, siteDir } = await createTempSite();
	try {
		await writeFile(path.join(siteDir, 'pages', '000-home', 'content.md'), `# Renamed blocks

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
`);

		await assert.rejects(
			() => runContentScript(siteDir, ['--check']),
			(error) => {
				assert.match(error.output, /Norna block "norna-image-stack" was renamed to "image-stack"/);
				assert.match(error.output, /Example: ```image-stack\n- image: filename\.jpg\n```/);
				assert.match(error.output, /Norna block "norna-image-carousel" was renamed to "image-carousel"/);
				assert.match(error.output, /Norna block "norna-carousel" was renamed to "image-carousel"/);
				assert.match(error.output, /Norna block "carousel" was renamed to "image-carousel"/);
				assert.match(error.output, /Example: ```image-carousel\n- image: first\.jpg\n- image: second\.jpg\n```/);
				assert.match(error.output, /Norna block "norna-card-list" was renamed to "card-list"/);
				assert.match(error.output, /Example: ```card-list\nlayout: image-top/);
				assert.match(error.output, /Norna block "norna-page-list" was renamed to "page-list"/);
				assert.match(error.output, /Example: ```page-list\n```/);
				return true;
			},
		);
	} finally {
		await rm(root, { recursive: true, force: true });
	}
});

test('content:check rejects the removed norna-note block', async () => {
	const { root, siteDir } = await createTempSite();
	try {
		await writeFile(path.join(siteDir, 'pages', '000-home', 'content.md'), `---
page:
  description: Fixture
---

# Removed note block

## Intro {#intro}

\`\`\`norna-note
This block is no longer supported.
\`\`\`
`);

		await assert.rejects(
			() => runContentScript(siteDir, ['--check']),
			(error) => {
				assert.match(error.output, /Unknown Norna block "norna-note"\. Use one of: image-stack, image-carousel, card-list, page-list\./);
				return true;
			},
		);
	} finally {
		await rm(root, { recursive: true, force: true });
	}
});

test('page-list rejects options and reports pages without direct child pages', async () => {
	const invalid = await createTempSite();
	try {
		await writeFile(path.join(invalid.siteDir, 'pages', '000-home', 'content.md'), `# Invalid child page list

## Pages {#pages}

\`\`\`page-list
depth: all
\`\`\`
`);
		await assert.rejects(
			() => runContentScript(invalid.siteDir, ['--check']),
			(error) => {
				assert.match(error.output, /page-list does not accept options or items\. Leave the block empty\./);
				return true;
			},
		);
	} finally {
		await rm(invalid.root, { recursive: true, force: true });
	}

	const empty = await createTempSite();
	try {
		await writeFile(path.join(empty.siteDir, 'pages', '000-home', 'content.md'), `# Empty child page list

## Pages {#pages}

\`\`\`page-list
\`\`\`
`);
		await assert.rejects(
			() => runContentScript(empty.siteDir, ['--check']),
			(error) => {
				assert.match(error.output, /page-list on line \d+ has no listed direct child pages to display\. Navigation categories are not pages\./);
				assert.match(error.output, /Fix: Add a listed direct child page or remove the block\./);
				return true;
			},
		);
	} finally {
		await rm(empty.root, { recursive: true, force: true });
	}
});

test('content:check supports tilde fenced Norna blocks', async () => {
	const { root, siteDir } = await createTempSite();
	try {
		await mkdir(path.join(siteDir, 'pages', '000-home', 'images'), { recursive: true });
		await writeFile(path.join(siteDir, 'pages', '000-home', 'images', 'hero.jpg'), 'fixture image');
		await writeFile(path.join(siteDir, 'pages', '000-home', 'content.md'), `---
page:
  description: Fixture
---

# Tilde Fence

## Intro {#intro}

~~~image-stack
- image: hero.jpg
~~~
`);

		const result = await runContentScript(siteDir, ['--check']);
		assert.match(result.stdout, /Content check passed\./);
	} finally {
		await rm(root, { recursive: true, force: true });
	}
});

test('content:check ignores Norna blocks shown inside longer code fences', async () => {
	const { root, siteDir } = await createTempSite();
	try {
		await writeFile(path.join(siteDir, 'pages', '000-home', 'content.md'), `---
page:
  description: Fixture
---

# Code Example

## Intro {#intro}

\`\`\`\`md
\`\`\`image-stack
- image: missing-example.jpg
\`\`\`
\`\`\`\`
`);

		const result = await runContentScript(siteDir, ['--check']);
		assert.match(result.stdout, /Content check passed\./);
	} finally {
		await rm(root, { recursive: true, force: true });
	}
});

test('content:check fails for likely Norna block names outside fences', async () => {
	const { root, siteDir } = await createTempSite();
	try {
		await writeFile(path.join(siteDir, 'pages', '000-home', 'content.md'), `---
page:
  description: Fixture
---

# Missing Fence

## Intro {#intro}

image-stack
- image: hero.jpg
`);

		await assert.rejects(
			() => runContentScript(siteDir, ['--check']),
			(error) => {
				assert.match(error.output, /Found "image-stack" outside a code block\./);
				assert.match(error.output, /Start the block like this:\n```image-stack\n- image: filename\.jpg\n```/);
				return true;
			},
		);
	} finally {
		await rm(root, { recursive: true, force: true });
	}
});

test('content:check fails for short Norna block fences', async () => {
	const { root, siteDir } = await createTempSite();
	try {
		await writeFile(path.join(siteDir, 'pages', '000-home', 'content.md'), `---
page:
  description: Fixture
---

# Short Fence

## Intro {#intro}

\`\`image-stack
- image: hero.jpg
\`\`
`);

		await assert.rejects(
			() => runContentScript(siteDir, ['--check']),
			(error) => {
				assert.match(error.output, /Invalid Norna block start for "image-stack"\./);
				assert.match(error.output, /Use three backticks or three tildes/);
				return true;
			},
		);
	} finally {
		await rm(root, { recursive: true, force: true });
	}
});

test('content:check fails for unclosed Norna blocks', async () => {
	const { root, siteDir } = await createTempSite();
	try {
		await writeFile(path.join(siteDir, 'pages', '000-home', 'content.md'), `---
page:
  description: Fixture
---

# Unclosed Fence

## Intro {#intro}

\`\`\`image-stack
- image: hero.jpg
~~~
`);

		await assert.rejects(
			() => runContentScript(siteDir, ['--check']),
			(error) => {
				assert.match(error.output, /This Norna block was started on line \d+ but not closed\./);
				assert.match(error.output, /Add a closing ``` line after the last entry\./);
				return true;
			},
		);
	} finally {
		await rm(root, { recursive: true, force: true });
	}
});

test('content:check continues after malformed Norna blocks', async () => {
	const { root, siteDir } = await createTempSite();
	try {
		await writeFile(path.join(siteDir, 'pages', '000-home', 'content.md'), `---
page:
  description: Fixture
---

# Multiple Issues

## Intro {#intro}

\`\`\`image-stack
image broken.jpg
  alt: Broken
\`\`\`

\`\`\`image-stack
- image: missing-intro.jpg
  alt: Missing intro
\`\`\`

## More {#more}

\`\`\`image-stack
- image: missing-more.jpg
  alt: Missing more
\`\`\`
`);

		await assert.rejects(
			() => runContentScript(siteDir, ['--check']),
			(error) => {
				assert.match(error.output, /Invalid image-stack entry "image broken\.jpg"\. Start each image with "- image: filename\.jpg"\./);
				assert.match(error.output, /Image "missing-intro\.jpg" does not exist at .*site\/pages\/000-home\/images\/missing-intro\.jpg or anywhere under any page image root\./);
				assert.match(error.output, /Image "missing-more\.jpg" does not exist at .*site\/pages\/000-home\/images\/missing-more\.jpg or anywhere under any page image root\./);
				return true;
			},
		);
	} finally {
		await rm(root, { recursive: true, force: true });
	}
});
