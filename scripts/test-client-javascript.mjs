import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const nornaBin = path.join(repoRoot, 'bin', 'norna.mjs');
const tempParent = path.join(repoRoot, 'node_modules', '.cache');
await mkdir(tempParent, { recursive: true });
const tempRoot = await mkdtemp(path.join(tempParent, 'norna-client-javascript-'));
const siteDir = path.join(tempRoot, 'site');
const homeDir = path.join(siteDir, 'pages', '000-home');
const pageDir = path.join(siteDir, 'pages', '010-details');
const configPath = path.join(siteDir, 'config.yaml');

const runBuild = () => {
	const result = spawnSync(process.execPath, [nornaBin, 'build'], {
		cwd: tempRoot,
		encoding: 'utf8',
		env: {
			...process.env,
			NORNA_SITE_DIR: siteDir,
		},
	});

	if (result.status !== 0) {
		throw new Error([
			`norna build exited with code ${result.status}.`,
			result.stdout.trim(),
			result.stderr.trim(),
		].filter(Boolean).join('\n'));
	}
};

const readPage = (pathname = 'index.html') => readFile(path.join(tempRoot, 'dist', pathname), 'utf8');
const getScripts = (html) => html.match(/<script\b[^>]*>[\s\S]*?<\/script>/gi) ?? [];
const getReaderPreferenceScripts = (html) => getScripts(html).filter((script) => script.includes('norna-reading-width'));
const getFeatureScripts = (html) => getScripts(html).filter((script) => !script.includes('norna-reading-width'));
const assertUniversalReadingWidth = (html, label) => {
	assert.equal(getReaderPreferenceScripts(html).length, 1, `${label} should load the universal reading-width preference script.`);
	assert.match(html, /<html\b[^>]*data-reading-width="(?:narrow|standard|wide)"/);
	assert.match(html, /data-reader-width/);
};
const assertOnlyUniversalReadingWidth = (html, label) => {
	assertUniversalReadingWidth(html, label);
	assert.deepEqual(getFeatureScripts(html), [], `${label} should not load unrelated client-side features.`);
};
const assertScrollBehavior = (html, behavior, label) => {
	assert.match(
		html,
		new RegExp(`<html\\b[^>]*style="[^"]*scroll-behavior: ${behavior}(?:;|&quot;|\")`),
		`${label} should render scroll-behavior: ${behavior}.`,
	);
};
const writeConfig = (scrollBehavior) => writeFile(configPath, `url: https://example.com/
${scrollBehavior ? `scrollBehavior: ${scrollBehavior}\n` : ''}`);
const writeSvg = (filePath, color) => writeFile(filePath, [
	'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 90">',
	`  <rect width="160" height="90" fill="${color}"/>`,
	'</svg>',
	'',
].join('\n'));

try {
	await mkdir(homeDir, { recursive: true });
	await mkdir(path.join(siteDir, 'public'), { recursive: true });
	await writeConfig();
	await writeFile(path.join(siteDir, 'theme.yaml'), `typography:
  profile: reading
palette: warm-paper
`);
	await writeFile(path.join(homeDir, 'content.md'), `---
page:
  description: A minimal single page without sections.
---

# Minimal page

Ordinary page content does not need a level 2 section.
`);

	runBuild();
	const titleOnlyHtml = await readPage();
	assertOnlyUniversalReadingWidth(titleOnlyHtml, 'A single page with only its page-title navigation');
	assert.match(titleOnlyHtml, /<nav class="page-nav page-nav-title-only" aria-label="Page contents">/);
	assert.match(titleOnlyHtml, /class="page-nav-page-top" data-page-top href="\/">Minimal page<\/a>/);
	assert.doesNotMatch(titleOnlyHtml, /class="mobile-nav-menu"/);

	await writeFile(path.join(homeDir, 'content.md'), `---
page:
  description: A single page with one section.
---

# One section

## Intro {#intro}

One section still provides a useful navigation destination after the page title.
`);

	runBuild();
	const oneSectionHtml = await readPage();
	assertUniversalReadingWidth(oneSectionHtml, 'A single page with section navigation');
	assert.match(oneSectionHtml, /<nav class="page-nav" aria-label="Page contents">/);
	assert.match(oneSectionHtml, /class="page-nav-page-top" data-page-top href="\/">One section<\/a>/);
	assert.match(oneSectionHtml, /class="mobile-nav-menu"/);
	assert.match(oneSectionHtml, /href="#intro"/);

	await writeFile(path.join(homeDir, 'content.md'), `---
page:
  description: A single page with sticky section navigation.
---

# Section navigation

## Intro {#intro}

The section heading is a native anchor target.

## More {#more}

The navigation enhancement keeps native anchors clear of the sticky header.
`);

	runBuild();
	const instantHtml = await readPage();
	assertUniversalReadingWidth(instantHtml, 'Sticky section navigation');
	assert.equal(
		getFeatureScripts(instantHtml).length,
		1,
		'Sticky section navigation should load only its anchor-offset enhancement in addition to reader preferences.',
	);
	assert.match(getFeatureScripts(instantHtml)[0], /site-top-anchor-offset/);
	assertScrollBehavior(instantHtml, 'auto', 'The default instant scroll mode');
	assert.match(instantHtml, /<nav class="page-nav"/);
	assert.match(instantHtml, /<nav class="page-nav" aria-label="Page contents">/);
	assert.doesNotMatch(instantHtml, /class="page-nav-label"/);
	assert.doesNotMatch(instantHtml, /<h2 tabindex="-1">Page contents<\/h2>/);
	assert.match(instantHtml, /class="page-nav-page-top" data-page-top href="\/">Section navigation<\/a>/);
	assert.match(instantHtml, /class="mobile-nav-destination mobile-nav-page-top" data-page-top href="\/">/);
	assert.match(instantHtml, /href="#intro"/);
	assert.match(instantHtml, /href="#more"/);

	await writeConfig('smooth');
	runBuild();
	const browserSmoothHtml = await readPage();
	assertUniversalReadingWidth(browserSmoothHtml, 'Browser smooth scrolling');
	assert.equal(
		getFeatureScripts(browserSmoothHtml).length,
		1,
		'Browser smooth scrolling should use the same anchor-offset enhancement in addition to reader preferences.',
	);
	assertScrollBehavior(browserSmoothHtml, 'smooth', 'The browser smooth scroll mode');

	await writeConfig();

	await mkdir(path.join(pageDir, 'images'), { recursive: true });
	await writeSvg(path.join(pageDir, 'images', 'first.svg'), '#7b8f78');
	await writeSvg(path.join(pageDir, 'images', 'second.svg'), '#a7664b');
	await writeFile(path.join(homeDir, 'content.md'), `---
page:
  description: A page without interactive features.
---

# Static baseline

## Intro {#intro}

Ordinary Markdown needs no client-side JavaScript.
`);
	await writeFile(path.join(pageDir, 'content.md'), `---
page:
  description: Static managed images.
---

# Details
Static image stacks remain static.

\`\`\`norna-image-stack
- image: first.svg
  caption: First image.
- image: second.svg
  caption: Second image.
\`\`\`

\`\`\`norna-card-list
- title: Static card
  text: Cards do not require client-side behaviour.
\`\`\`
`);

	runBuild();
	assertOnlyUniversalReadingWidth(await readPage(), 'A plain homepage in a multi-page site');
	assertOnlyUniversalReadingWidth(
		await readPage(path.join('details', 'index.html')),
		'A page with managed image stacks and cards',
	);

	await writeFile(path.join(homeDir, 'content.md'), `---
page:
  description: A page with a copyable code block.
---

# Code example

\`\`\`sh
npm run norna:check
\`\`\`
`);

	runBuild();
	const codeBlockHtml = await readPage();
	assertUniversalReadingWidth(codeBlockHtml, 'A page with a copyable code block');
	assert.equal(
		getFeatureScripts(codeBlockHtml).length,
		1,
		'A code block should load only its copy enhancement in addition to reader preferences.',
	);
	assert.match(codeBlockHtml, /data-code-copy-template/);
	assert.match(codeBlockHtml, /aria-label="Copy code"/);
	assert.match(getFeatureScripts(codeBlockHtml)[0], /navigator\.clipboard/);

	await writeFile(path.join(homeDir, 'content.md'), `---
page:
  description: A page with a CSS sidenote.
---

# Notes

## Intro {#intro}

This sentence has additional context.{note-ref}

{note: The note remains readable and uses the page margin without JavaScript.}
`);
	await writeFile(path.join(pageDir, 'content.md'), `---
page:
  description: An interactive image carousel.
---

# Carousel

## Details {#details}

\`\`\`norna-image-carousel
- image: first.svg
  caption: First slide.
- image: second.svg
  caption: Second slide.
\`\`\`
`);

	runBuild();
	const noteHtml = await readPage();
	const carouselHtml = await readPage(path.join('details', 'index.html'));
	assertOnlyUniversalReadingWidth(noteHtml, 'A page with CSS margin notes');
	assert.match(noteHtml, /class="section-note section-note-margin"/);
	assertUniversalReadingWidth(carouselHtml, 'A carousel page');
	assert.equal(getFeatureScripts(carouselHtml).length, 1, 'A carousel page should load only the carousel implementation in addition to reader preferences.');
	assert.match(carouselHtml, /data-carousel/);
	assert.match(carouselHtml, /--image-carousel-width-from-height-desktop:/);
	assert.match(carouselHtml, /aria-label="Previous image"/);
	assert.match(carouselHtml, /aria-label="Next image"/);
	assert.match(getFeatureScripts(carouselHtml)[0], /\ssrc=/, 'Carousel JavaScript should be emitted as a module asset.');

	await writeFile(path.join(homeDir, 'content.md'), `---
page:
  description: A page with a dismissible banner.
---

# Banner

## Intro {#intro}

The only interactive feature is the banner.
`);
	await writeFile(path.join(pageDir, 'content.md'), `---
page:
  description: A second plain page.
---

# Details
Plain page content.
`);
	await writeFile(path.join(siteDir, 'sitewide-content.yaml'), `banners:
  - id: test-banner
    title: Test banner
    text: This banner can be dismissed.
`);

	runBuild();
	const bannerHtml = await readPage();
	assertUniversalReadingWidth(bannerHtml, 'A page with a dismissible banner');
	assert.equal(getFeatureScripts(bannerHtml).length, 1, 'A dismissible banner should load only its dismissal script in addition to reader preferences.');
	assert.match(getFeatureScripts(bannerHtml)[0], /norna-banner:/);

	await writeFile(path.join(siteDir, 'sitewide-content.yaml'), '{}\n');
	await writeFile(path.join(homeDir, 'content.md'), `---
page:
  description: A plain page with selectable color modes.
---

# Color modes

Ordinary content with a user-selectable color mode.
`);
	await writeFile(path.join(siteDir, 'theme.yaml'), `typography:
  profile: reading
palette: warm-paper
colorMode:
  default: system
readerControls:
  colorMode: true
  focusReading: true
`);

	runBuild();
	const selectableColorModeHtml = await readPage();
	assert.equal(
		getScripts(selectableColorModeHtml).length,
		1,
		'A selectable color mode should load only its preference script on a plain page.',
	);
	assert.match(selectableColorModeHtml, /<html\b[^>]*data-color-mode="system"/);
	assert.match(selectableColorModeHtml, /<details\b[^>]*data-display-settings/);
	assert.match(selectableColorModeHtml, /data-reader-appearance/);
	assert.match(selectableColorModeHtml, /data-reader-width/);
	assert.match(selectableColorModeHtml, /data-reader-focus/);
	assert.match(selectableColorModeHtml, /data-reader-reset/);
	assert.match(getScripts(selectableColorModeHtml)[0], /norna-color-mode/);
	assert.match(getScripts(selectableColorModeHtml)[0], /norna-reading-width/);
	assert.match(getScripts(selectableColorModeHtml)[0], /norna-focus-reading/);
	assert.match(getScripts(selectableColorModeHtml)[0], /document\.cookie/);
	assert.match(getScripts(selectableColorModeHtml)[0], /SameSite=Lax/);
	assert.match(getScripts(selectableColorModeHtml)[0], /maxAge = 31536000/);
	assert.doesNotMatch(getScripts(selectableColorModeHtml)[0], /localStorage/);

	console.log('Client JavaScript boundaries test passed.');
} finally {
	await rm(tempRoot, { force: true, recursive: true });
}
