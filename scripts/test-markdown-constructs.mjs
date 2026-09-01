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

		await runNorna(['--site-dir', siteDir, 'build']);
		const html = await readFile(path.join(path.dirname(siteDir), 'dist', 'index.html'), 'utf8');
		assert.match(html, /<a href="\/docs\/faq\/#install-imagemagick">Install ImageMagick\.<\/a>/);
		assert.doesNotMatch(html, /href="\/docs\/docs\/faq\/|href="docs\/faq\//);
	} finally {
		await rm(root, { recursive: true, force: true });
	}
});

test('norna-card-list images are managed image references', async () => {
	const { root, siteDir } = await createTempSite({ underRepoCache: true });
	try {
		await writeFile(path.join(siteDir, 'pages', '000-home', 'content.md'), `---
page:
  description: Fixture
---

# Card List Fixture

## Help {#help}

\`\`\`norna-card-list
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

test('content:check fails when a norna-card-list image file is missing', async () => {
	const { root, siteDir } = await createTempSite();
	try {
		await writeFile(path.join(siteDir, 'pages', '000-home', 'content.md'), `---
page:
  description: Fixture
---

# Missing Card Image

## Help {#help}

\`\`\`norna-card-list
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

test('content:check fails for malformed norna-card-list blocks', async () => {
	const { root, siteDir } = await createTempSite();
	try {
		await writeFile(path.join(siteDir, 'pages', '000-home', 'content.md'), `---
page:
  description: Fixture
---

# Malformed Card List

## Help {#help}

\`\`\`norna-card-list
- text: Missing title
\`\`\`
`);

		await assert.rejects(
			() => runContentScript(siteDir, ['--check']),
			(error) => {
				assert.match(error.output, /Invalid norna-card-list entry "- text: Missing title"\. Start each card with "- title: Card title"\./);
				return true;
			},
		);
	} finally {
		await rm(root, { recursive: true, force: true });
	}
});

test('content:check fails for invalid norna-card-list options', async () => {
	const { root, siteDir } = await createTempSite();
	try {
		await writeFile(path.join(siteDir, 'pages', '000-home', 'content.md'), `---
page:
  description: Fixture
---

# Invalid Card List Options

## Help {#help}

\`\`\`norna-card-list
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
				assert.match(error.output, /Invalid norna-card-list layout "floating"\. Use one of: image-top, image-left, image-right\./);
				return true;
			},
		);
	} finally {
		await rm(root, { recursive: true, force: true });
	}
});

test('content:check fails for invalid norna-card-list width', async () => {
	const { root, siteDir } = await createTempSite();
	try {
		await writeFile(path.join(siteDir, 'pages', '000-home', 'content.md'), `---
page:
  description: Fixture
---

# Invalid Card List Width

## Help {#help}

\`\`\`norna-card-list
width: full

- title: Adopt
  text: Give a dog a new home.
\`\`\`
`);

		await assert.rejects(
			() => runContentScript(siteDir, ['--check']),
			(error) => {
				assert.match(error.output, /Invalid norna-card-list width "full"\. Use one of: text, narrow, normal, wide\./);
				return true;
			},
		);
	} finally {
		await rm(root, { recursive: true, force: true });
	}
});

test('content:check fails for invalid norna-card-list size', async () => {
	const { root, siteDir } = await createTempSite();
	try {
		await writeFile(path.join(siteDir, 'pages', '000-home', 'content.md'), `---
page:
  description: Fixture
---

# Invalid Card List Size

## Help {#help}

\`\`\`norna-card-list
size: huge

- title: Adopt
  text: Give a dog a new home.
\`\`\`
`);

		await assert.rejects(
			() => runContentScript(siteDir, ['--check']),
			(error) => {
				assert.match(error.output, /Invalid norna-card-list size "huge"\. Use one of: s, m, l, xl\./);
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

\`\`\`norna-image-stack
image hero.jpg
  alt: Hero
\`\`\`
`);

		await assert.rejects(
			() => runContentScript(siteDir, ['--check']),
			(error) => {
				assert.match(error.output, /Invalid norna-image-stack entry "image hero\.jpg"\. Start each image with "- image: filename\.jpg"\./);
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
				assert.match(error.output, /Unknown Norna block "norna-gallery-stack"\. Use one of: norna-image-stack, norna-image-carousel, norna-card-list\./);
				assert.match(error.output, /Use norna-image-stack for one or more stacked images\./);
				assert.match(error.output, /Example: ```norna-image-stack\n- image: filename\.jpg\n```/);
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
				assert.match(error.output, /Unknown Norna block "norna-note"\. Use one of: norna-image-stack, norna-image-carousel, norna-card-list\./);
				return true;
			},
		);
	} finally {
		await rm(root, { recursive: true, force: true });
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

~~~norna-image-stack
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
\`\`\`norna-image-stack
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

norna-image-stack
- image: hero.jpg
`);

		await assert.rejects(
			() => runContentScript(siteDir, ['--check']),
			(error) => {
				assert.match(error.output, /Found "norna-image-stack" outside a code block\./);
				assert.match(error.output, /Start the block like this:\n```norna-image-stack\n- image: filename\.jpg\n```/);
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

\`\`norna-image-stack
- image: hero.jpg
\`\`
`);

		await assert.rejects(
			() => runContentScript(siteDir, ['--check']),
			(error) => {
				assert.match(error.output, /Invalid Norna block start for "norna-image-stack"\./);
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

\`\`\`norna-image-stack
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

\`\`\`norna-image-stack
image broken.jpg
  alt: Broken
\`\`\`

\`\`\`norna-image-stack
- image: missing-intro.jpg
  alt: Missing intro
\`\`\`

## More {#more}

\`\`\`norna-image-stack
- image: missing-more.jpg
  alt: Missing more
\`\`\`
`);

		await assert.rejects(
			() => runContentScript(siteDir, ['--check']),
			(error) => {
				assert.match(error.output, /Invalid norna-image-stack entry "image broken\.jpg"\. Start each image with "- image: filename\.jpg"\./);
				assert.match(error.output, /Image "missing-intro\.jpg" does not exist at .*site\/pages\/000-home\/images\/missing-intro\.jpg or anywhere under any page image root\./);
				assert.match(error.output, /Image "missing-more\.jpg" does not exist at .*site\/pages\/000-home\/images\/missing-more\.jpg or anywhere under any page image root\./);
				return true;
			},
		);
	} finally {
		await rm(root, { recursive: true, force: true });
	}
});
