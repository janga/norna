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

test('content model v2 fixture checks and builds', async () => {
	const { root, siteDir } = await createTempFixtureCopy();
	try {
		await runNorna(['--site-dir', siteDir, 'content:check']);
		await runNorna(['--site-dir', siteDir, 'build']);

		const manifest = JSON.parse(await readFile(path.join(siteDir, '.norna', 'generated-images.json'), 'utf8'));
		assert.ok(manifest['pages/000-home/images/duplicate.jpg']);
		assert.ok(manifest['pages/010-guide/images/duplicate.jpg']);

		const homepageHtml = await readFile(path.join(path.dirname(siteDir), 'dist', 'index.html'), 'utf8');
		assert.match(homepageHtml, /site-section-page-title/);
		assert.match(homepageHtml, /site-section-page-title-empty/);
		assert.match(homepageHtml, /fetchpriority="high"/);
	} finally {
		await rm(root, { recursive: true, force: true });
	}
});

test('the removed root page structure is rejected with a migration hint', async () => {
	const { root, siteDir } = await createTempSite();
	try {
		await writeFile(path.join(siteDir, 'content.md'), `# Home
Home content.
`);

		await assert.rejects(
			runNorna(['--site-dir', siteDir, 'content:check']),
			(error) => {
				assert.match(error.output, /The old root-page structure is no longer supported: site\/content\.md\./);
				assert.match(error.output, /Move the homepage content to site\/pages\/000-home\/content\.md/);
				return true;
			},
		);
	} finally {
		await rm(root, { recursive: true, force: true });
	}
});

test('the removed routes directory is rejected with a page migration hint', async () => {
	const { root, siteDir } = await createTempSite();
	try {
		await writeFile(path.join(siteDir, 'pages', '000-home', 'content.md'), `# Home
Home content.
`);
		await mkdir(path.join(siteDir, 'routes', '010-guide'), { recursive: true });
		await writeFile(path.join(siteDir, 'routes', '010-guide', 'content.md'), 'Old page content.\n');

		await assert.rejects(
			runNorna(['--site-dir', siteDir, 'content:check']),
			(error) => {
				assert.match(error.output, /site\/routes is no longer supported\. Rename it to site\/pages and use NNN-page-id directory names\./);
				return true;
			},
		);
	} finally {
		await rm(root, { recursive: true, force: true });
	}
});

test('the required home page cannot own child pages', async () => {
	const { root, siteDir } = await createTempSite();
	try {
		await writeFile(path.join(siteDir, 'pages', '000-home', 'content.md'), `# Home

## Welcome {#welcome}

Home content.
`);
		const homeChildDir = path.join(siteDir, 'pages', '000-home', 'pages', '010-news');
		await mkdir(homeChildDir, { recursive: true });
		await writeFile(path.join(homeChildDir, 'content.md'), '# News\n\nNews content.\n');

		await assert.rejects(
			runNorna(['--site-dir', siteDir, 'content:check']),
			(error) => {
				assert.match(error.output, /site\/pages\/000-home is the homepage and cannot contain child pages\./);
				assert.match(error.output, /Move these page directories beside 000-home under site\/pages\//);
				assert.match(error.output, /site\/pages\/000-home\/pages\/010-news/);
				return true;
			},
		);
	} finally {
		await rm(root, { recursive: true, force: true });
	}
});

test('page theme changes page presentation while preserving site visual identity', async () => {
	const { root, siteDir } = await createTempSite({ underRepoCache: true });
	try {
		await writeFile(path.join(siteDir, 'theme.yaml'), `preset: documentation
palette: near-monochrome
`);
		await mkdir(path.join(siteDir, 'pages', '010-guide'), { recursive: true });
		await writeFile(path.join(siteDir, 'pages', '000-home', 'content.md'), `---
page:
  description: Root page
---

# Root

## Home {#home}

Root content.
`);
		await writeFile(path.join(siteDir, 'pages', '010-guide', 'content.md'), `---
page:
  description: Guide page
---

# Guide
Page content.
`);
		await mkdir(path.join(siteDir, 'pages', '010-guide', 'pages', '010-detail'), { recursive: true });
		await writeFile(path.join(siteDir, 'pages', '010-guide', 'pages', '010-detail', 'content.md'), `# Detail

Inherited page content.
`);
		await writeFile(path.join(siteDir, 'pages', '010-guide', 'theme.yaml'), `layout:
  contentSpacing: spacious
  textWidth: wide
sections:
  backgroundPattern: uniform
`);
		await writeFile(path.join(siteDir, 'pages', '010-guide', 'pages', '010-detail', 'theme.yaml'), `layout:
  textWidth: narrow
`);

		await runNorna(['--site-dir', siteDir, 'build']);
		const rootHtml = await readFile(path.join(path.dirname(siteDir), 'dist', 'index.html'), 'utf8');
		const pageHtml = await readFile(path.join(path.dirname(siteDir), 'dist', 'guide', 'index.html'), 'utf8');
		const detailHtml = await readFile(path.join(path.dirname(siteDir), 'dist', 'guide', 'detail', 'index.html'), 'utf8');
		assert.match(rootHtml, /data-appearance="system"/);
		assert.match(pageHtml, /data-appearance="system"/);
		assert.match(rootHtml, /--palette-dark-page-background: #000000/);
		assert.match(pageHtml, /--palette-dark-page-background: #000000/);
		assert.match(rootHtml, /--font-sans: Georgia, 'Times New Roman', serif/);
		assert.match(pageHtml, /--font-sans: Georgia, 'Times New Roman', serif/);
		assert.match(pageHtml, /--space-section-to-section-desktop: clamp\(2\.25rem, 5vw, 4\.5rem\)/);
		assert.match(pageHtml, /--section-body-width-desktop: min\(72ch,/);
		assert.match(detailHtml, /--space-section-to-section-desktop: clamp\(2\.25rem, 5vw, 4\.5rem\)/);
		assert.match(detailHtml, /--section-body-width-desktop: min\(60ch,/);
		assert.match(pageHtml, /<a href="\/">\s*Root\s*<\/a>/);
	} finally {
		await rm(root, { recursive: true, force: true });
	}
});

test('page metadata, navigation logo, and page listing have separate roles', async () => {
	const { root, siteDir } = await createTempSite({ underRepoCache: true });
	try {
		await mkdir(path.join(siteDir, 'public'), { recursive: true });
		await writeFile(path.join(siteDir, 'public', 'logo.svg'), '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"/>');
		await writeFile(path.join(siteDir, 'sitewide-content.yaml'), `logo:
  height: 2rem
`);
		await writeFile(path.join(siteDir, 'pages', '000-home', 'content.md'), `# Welcome

## Intro {#intro}

Homepage content.
`);
		await mkdir(path.join(siteDir, 'pages', '010-guide'), { recursive: true });
		await writeFile(path.join(siteDir, 'pages', '010-guide', 'content.md'), `---
page:
  description: The visible guide page.
---

# Guide
Guide content.
`);
		await mkdir(path.join(siteDir, 'pages', '020-private'), { recursive: true });
		await writeFile(path.join(siteDir, 'pages', '020-private', 'content.md'), `---
navigation:
  listed: false
---

# Unlisted
Public but unlisted content.
`);

		await runNorna(['--site-dir', siteDir, 'build']);
		const distDir = path.join(path.dirname(siteDir), 'dist');
		const homeHtml = await readFile(path.join(distDir, 'index.html'), 'utf8');
		const guideHtml = await readFile(path.join(distDir, 'guide', 'index.html'), 'utf8');
		const unlistedHtml = await readFile(path.join(distDir, 'private', 'index.html'), 'utf8');

		assert.match(homeHtml, /<title>Welcome<\/title>/);
		assert.doesNotMatch(homeHtml, /<meta name="description"/);
		assert.match(homeHtml, /<img class="site-brand-logo"[^>]+alt="Welcome"/);
		assert.match(homeHtml, /<a href="\/" aria-current="page">\s*Welcome\s*<\/a>/);
		assert.match(homeHtml, /<a href="\/guide\/">\s*Guide\s*<\/a>/);
		assert.doesNotMatch(homeHtml, />\s*Unlisted\s*<\/a>/);
		assert.match(guideHtml, /<meta name="description" content="The visible guide page\."/);
		assert.match(unlistedHtml, /Public but unlisted content/);
	} finally {
		await rm(root, { recursive: true, force: true });
	}
});

test('footer build information uses the site language and fixed formatting', async () => {
	const { root, siteDir } = await createTempSite({ underRepoCache: true });
	try {
		await writeFile(path.join(siteDir, 'config.yaml'), 'url: https://example.com/\nlanguage: sv-SE\n');
		await writeFile(path.join(siteDir, 'sitewide-content.yaml'), `footer:
  buildInfo: true
`);
		await writeFile(path.join(siteDir, 'pages', '000-home', 'content.md'), `---
page:
  description: Footer build information.
---

# Footer

## Home {#home}

Content.
`);

		await runNorna(['--site-dir', siteDir, 'build']);
		const html = await readFile(path.join(path.dirname(siteDir), 'dist', 'index.html'), 'utf8');
		assert.match(html, /<span>Byggd [^<]+<\/span>/);
	} finally {
		await rm(root, { recursive: true, force: true });
	}
});

test('page theme cannot define navigation logo settings', async () => {
	const { root, siteDir } = await createTempSite({ underRepoCache: true });
	try {
		await mkdir(path.join(siteDir, 'pages', '010-guide'), { recursive: true });
		await writeFile(path.join(siteDir, 'pages', '000-home', 'content.md'), `---
page:
  description: Root page
---

# Root

## Home {#home}

Root content.
`);
		await writeFile(path.join(siteDir, 'pages', '010-guide', 'content.md'), `---
page:
  description: Guide page
---

# Guide
Page content.
`);
		await writeFile(path.join(siteDir, 'pages', '010-guide', 'theme.yaml'), `logo:
  height: 3rem
`);

		await assert.rejects(
			runNorna(['--site-dir', siteDir, 'config:check']),
			(error) => {
				assert.match(error.output, /may not define navigation logo settings\. Optional logo display settings belong under "logo:" in site\/sitewide-content\.yaml/);
				return true;
			},
		);
	} finally {
		await rm(root, { recursive: true, force: true });
	}
});

test('navigation logo settings require one conventional logo file', async () => {
	const { root, siteDir } = await createTempSite();
	try {
		await writeFile(path.join(siteDir, 'sitewide-content.yaml'), `logo:
  height: 2rem
`);

		await assert.rejects(
			runNorna(['--site-dir', siteDir, 'config:check']),
			(error) => {
				assert.match(error.output, /Site-wide logo is configured, but no logo file was found/);
				assert.match(error.output, /site\/public\/logo\.svg/);
				return true;
			},
		);
	} finally {
		await rm(root, { recursive: true, force: true });
	}
});

test('multiple conventional navigation logo files stop config validation', async () => {
	const { root, siteDir } = await createTempSite();
	try {
		await mkdir(path.join(siteDir, 'public'), { recursive: true });
		await writeFile(path.join(siteDir, 'public', 'logo.svg'), '<svg/>');
		await writeFile(path.join(siteDir, 'public', 'logo.png'), 'png');

		await assert.rejects(
			runNorna(['--site-dir', siteDir, 'config:check']),
			(error) => {
				assert.match(error.output, /Found multiple logo files/);
				assert.match(error.output, /site\/public\/logo\.svg/);
				assert.match(error.output, /site\/public\/logo\.png/);
				return true;
			},
		);
	} finally {
		await rm(root, { recursive: true, force: true });
	}
});

test('automatic H2 and H3 ids render while explicit ids remain stable', async () => {
	const { root, siteDir } = await createTempSite({ underRepoCache: true });
	try {
		await writeFile(path.join(siteDir, 'pages', '000-home', 'content.md'), `---
page:
  description: Fixture
---

# Heading IDs

## Café and **code**

### More details

Automatic identifiers.

## Renamed heading {#stable-id}

Explicit identifier.
`);

		await runContentScript(siteDir, ['--check']);
		await runNorna(['--site-dir', siteDir, 'build']);

		const html = await readFile(path.join(root, 'dist', 'index.html'), 'utf8');
		assert.match(html, /<h2 id="cafe-and-code">Café and <strong>code<\/strong><\/h2>/);
		assert.match(html, /<h3 id="more-details">More details<\/h3>/);
		assert.match(html, /<h2 id="stable-id">Renamed heading<\/h2>/);
	} finally {
		await rm(root, { recursive: true, force: true });
	}
});

test('content:check fails when a page repeats a section id', async () => {
	const { root, siteDir } = await createTempSite();
	try {
		await writeFile(path.join(siteDir, 'pages', '000-home', 'content.md'), `---
page:
  description: Fixture
---

# Duplicate Section

## Intro {#intro}

First.

## Again {#intro}

Second.
`);

		await assert.rejects(
			() => runContentScript(siteDir, ['--check']),
			(error) => {
				assert.match(error.output, /Two headings resolve to id "intro"\./);
				return true;
			},
		);
	} finally {
		await rm(root, { recursive: true, force: true });
	}
});

test('content:check reports collisions between automatic H2 and H3 ids', async () => {
	const { root, siteDir } = await createTempSite();
	try {
		await writeFile(path.join(siteDir, 'pages', '000-home', 'content.md'), `---
page:
  description: Fixture
---

# Automatic collision

## Förstå

Section text.

### Forsta

Topic text.
`);

		await assert.rejects(
			() => runContentScript(siteDir, ['--check']),
			(error) => {
				assert.match(error.output, /Two headings resolve to id "forsta"\./);
				assert.match(error.output, /The other heading is on line \d+\./);
				assert.match(error.output, /Add a unique explicit id to at least one heading/);
				return true;
			},
		);
	} finally {
		await rm(root, { recursive: true, force: true });
	}
});

test('content:check rejects removed sections frontmatter', async () => {
	const { root, siteDir } = await createTempSite();
	try {
		await writeFile(path.join(siteDir, 'pages', '000-home', 'content.md'), `---
page:
  description: Fixture
sections:
  intro: {}
---

# Removed Section Metadata

## Intro {#intro}

Text.
`);

		await assert.rejects(
			() => runContentScript(siteDir, ['--check']),
			(error) => {
				assert.match(error.output, /defines "sections" at the top level, but it is not a valid top-level content field\./);
				return true;
			},
		);
	} finally {
		await rm(root, { recursive: true, force: true });
	}
});
