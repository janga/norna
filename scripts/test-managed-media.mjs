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

test('content:check warns for local Markdown images but not external Markdown images', async () => {
	const { root, siteDir } = await createTempSite();
	try {
		await writeFile(path.join(siteDir, 'pages', '000-home', 'content.md'), `---
page:
  description: Fixture
---

# Markdown Image Warning

## Intro {#intro}

![Local](portrait.jpg)

![External](https://example.com/portrait.jpg)

![Public](/favicon.svg)
`);

		const { stdout } = await runContentScript(siteDir, ['--check']);
		assert.match(stdout, /Markdown image "portrait\.jpg" references a local image that is not managed by Norna\./);
		assert.doesNotMatch(stdout, /https:\/\/example\.com\/portrait\.jpg/);
		assert.doesNotMatch(stdout, /\/favicon\.svg/);
	} finally {
		await rm(root, { recursive: true, force: true });
	}
});

test('managed SVG images are copied as static image output', async () => {
	const { root, siteDir } = await createTempSite();
	try {
		await writeFile(path.join(siteDir, 'pages', '000-home', 'content.md'), `---
page:
  description: Fixture
---

# SVG Fixture

## Intro {#intro}

\`\`\`norna-image-stack
- image: diagram.svg
  alt: Diagram
\`\`\`
`);
		await mkdir(path.join(siteDir, 'pages', '000-home', 'images'), { recursive: true });
		await writeFile(path.join(siteDir, 'pages', '000-home', 'images', 'diagram.svg'), '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 620"><rect width="900" height="620"/></svg>\n');

		await runContentScript(siteDir, ['--check']);
		await runNorna(['--site-dir', siteDir, 'images']);

		const manifest = JSON.parse(await readFile(path.join(siteDir, '.norna', 'generated-images.json'), 'utf8'));
		const entry = manifest['pages/000-home/images/diagram.svg'];
		assert.equal(entry.kind, 'static');
		assert.equal(entry.width, 900);
		assert.equal(entry.height, 620);
		assert.match(entry.src, /^\/images\/original\/pages\/000-home\/images\/diagram-[a-f0-9]{8}\.svg$/);
		assert.equal(entry.variants, undefined);
		assert.equal(await fileExists(path.join(siteDir, '.norna', 'public', entry.src.replace(/^\//, ''))), true);
	} finally {
		await rm(root, { recursive: true, force: true });
	}
});

test('updated managed SVG images get updated static output', async () => {
	const { root, siteDir } = await createTempSite();
	try {
		await writeFile(path.join(siteDir, 'pages', '000-home', 'content.md'), `---
page:
  description: Fixture
---

# SVG Update Fixture

## Intro {#intro}

\`\`\`norna-image-stack
- image: diagram.svg
  alt: Diagram
\`\`\`
`);
		await mkdir(path.join(siteDir, 'pages', '000-home', 'images'), { recursive: true });
		const sourcePath = path.join(siteDir, 'pages', '000-home', 'images', 'diagram.svg');
		await writeFile(sourcePath, '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 620"><rect width="900" height="620" fill="red"/></svg>\n');

		await runContentScript(siteDir, ['--check']);
		await runNorna(['--site-dir', siteDir, 'images']);

		const firstManifest = JSON.parse(await readFile(path.join(siteDir, '.norna', 'generated-images.json'), 'utf8'));
		const firstEntry = firstManifest['pages/000-home/images/diagram.svg'];
		const firstOutputPath = path.join(siteDir, '.norna', 'public', firstEntry.src.replace(/^\//, ''));

		await writeFile(sourcePath, '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 620"><rect width="900" height="620" fill="blue"/></svg>\n');
		await runNorna(['--site-dir', siteDir, 'images']);

		const secondManifest = JSON.parse(await readFile(path.join(siteDir, '.norna', 'generated-images.json'), 'utf8'));
		const secondEntry = secondManifest['pages/000-home/images/diagram.svg'];
		const secondOutputPath = path.join(siteDir, '.norna', 'public', secondEntry.src.replace(/^\//, ''));

		assert.notEqual(secondEntry.sourceHash, firstEntry.sourceHash);
		assert.notEqual(secondEntry.src, firstEntry.src);
		assert.equal(await fileExists(firstOutputPath), false);
		assert.match(await readFile(secondOutputPath, 'utf8'), /fill="blue"/);
	} finally {
		await rm(root, { recursive: true, force: true });
	}
});

test('content:check warns when carousel SVG images have no intrinsic aspect ratio', async () => {
	const { root, siteDir } = await createTempSite();
	try {
		await writeFile(path.join(siteDir, 'pages', '000-home', 'content.md'), `---
page:
  description: Fixture
---

# SVG Carousel Fixture

## Intro {#intro}

\`\`\`norna-image-carousel
- image: first.svg
  alt: First
- image: second.svg
  alt: Second
\`\`\`
`);
		await mkdir(path.join(siteDir, 'pages', '000-home', 'images'), { recursive: true });
		await writeFile(path.join(siteDir, 'pages', '000-home', 'images', 'first.svg'), '<svg xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100"/></svg>\n');
		await writeFile(path.join(siteDir, 'pages', '000-home', 'images', 'second.svg'), '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100"/></svg>\n');

		const { stdout } = await runContentScript(siteDir, ['--check']);
		assert.match(stdout, /Content check completed with warnings\./);
		assert.match(stdout, /Carousel on line \d+ uses images without an intrinsic aspect ratio: first\.svg\./);
	} finally {
		await rm(root, { recursive: true, force: true });
	}
});

test('content:check allows Norna images without alt text', async () => {
	const { root, siteDir } = await createTempSite();
	try {
		await mkdir(path.join(siteDir, 'pages', '000-home', 'images'), { recursive: true });
		await writeFile(path.join(siteDir, 'pages', '000-home', 'images', 'hero.jpg'), 'fixture image');
		await writeFile(path.join(siteDir, 'pages', '000-home', 'content.md'), `---
page:
  description: Fixture
---

# Missing Alt

## Intro {#intro}

\`\`\`norna-image-stack
- image: hero.jpg
\`\`\`
`);

		const result = await runContentScript(siteDir, ['--check']);
		assert.match(result.stdout, /Content check passed\./);
	} finally {
		await rm(root, { recursive: true, force: true });
	}
});

test('content:check reports single-image carousel and missing file together', async () => {
	const { root, siteDir } = await createTempSite();
	try {
		await writeFile(path.join(siteDir, 'pages', '000-home', 'content.md'), `---
page:
  description: Fixture
---

# Beginner Errors

## Plain {#plain}

\`\`\`norna-image-carousel
 - image: foo.jpg
\`\`\`
`);

		await assert.rejects(
			() => runContentScript(siteDir, ['--check']),
			(error) => {
				assert.match(error.output, /norna-image-carousel on line \d+ contains 1 image\. A carousel needs at least two images\./);
				assert.match(error.output, /Image "foo\.jpg" does not exist at .*site\/pages\/000-home\/images\/foo\.jpg or anywhere under any page image root\./);
				return true;
			},
		);
	} finally {
		await rm(root, { recursive: true, force: true });
	}
});

test('content:check fails when a Norna-managed image file is missing', async () => {
	const { root, siteDir } = await createTempSite();
	try {
		await writeFile(path.join(siteDir, 'pages', '000-home', 'content.md'), `---
page:
  description: Fixture
---

# Missing Image

## Intro {#intro}

\`\`\`norna-image-stack
- image: missing.jpg
  alt: Missing
\`\`\`
`);

		await assert.rejects(
			() => runContentScript(siteDir, ['--check']),
			(error) => {
				assert.match(error.output, /Image "missing\.jpg" does not exist at .*site\/pages\/000-home\/images\/missing\.jpg or anywhere under any page image root\./);
				return true;
			},
		);
	} finally {
		await rm(root, { recursive: true, force: true });
	}
});
