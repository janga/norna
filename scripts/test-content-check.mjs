import assert from 'node:assert/strict';
import { access, mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const contentScript = path.join(repoRoot, 'scripts', 'sync-content-sections.mjs');
const tests = [];

const test = (name, run) => {
	tests.push({ name, run });
};

const fileExists = async (filePath) => access(filePath).then(() => true, () => false);

const runContentScript = (root, args, env = {}) => spawnSync(process.execPath, [contentScript, ...args], {
	cwd: root,
	encoding: 'utf8',
	env: {
		...process.env,
		...env,
	},
});

const getOutput = (result) => `${result.stdout}${result.stderr}`;

const writeFixtureFile = async (root, relativePath, contents = 'fixture image') => {
	const filePath = path.join(root, relativePath);
	await mkdir(path.dirname(filePath), { recursive: true });
	await writeFile(filePath, contents);
};

const makePngHeader = ({ width, height }) => {
	const buffer = Buffer.alloc(24);
	Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).copy(buffer, 0);
	buffer.writeUInt32BE(13, 8);
	buffer.write('IHDR', 12, 'ascii');
	buffer.writeUInt32BE(width, 16);
	buffer.writeUInt32BE(height, 20);
	return buffer;
};

const withTempProject = async ({ site, files, siteDirectory = 'site' }, run) => {
	const root = await mkdtemp(path.join(tmpdir(), 'walde-content-check-'));

	try {
		await writeFixtureFile(root, `${siteDirectory}/content.md`, site);

		for (const file of files) {
			if (typeof file === 'string') {
				await writeFixtureFile(root, file);
			} else {
				await writeFixtureFile(root, file.path, file.contents);
			}
		}

		await run(root);
	} finally {
		await rm(root, { force: true, recursive: true });
	}
};

const brokenSite = `---
sections:
  - id: karin-walde
    gallery:
      - image: karin.jpg
  - id: min-konst
    gallery:
      - image: vav.jpeg
      - image: missing.jpeg
      - image: duplicate.jpg
      - image: duplicate.jpg
  - id: mitt-hem
    gallery:
      - image: home.jpg

---
## Karin Walde {#karin-walde}
Text.
## Min konst {#min-konst}
Text.
## Extra {#extra}
Text.
## Mitt hem {#mitt-hem}
Text.
`;

test('content:check groups section issues, global issues, and unreferenced images', async () => {
	await withTempProject({
		site: brokenSite,
		files: [
			'site/images/karin-walde/karin.jpg',
			'site/images/karin-walde/unreferenced.jpg',
			'site/images/min-konst/duplicate.jpg',
			'site/images/mitt-hem/home.jpg',
			'site/images/mitt-hem/vav.jpeg',
		],
	}, async (root) => {
		const result = runContentScript(root, ['--check']);
		const output = getOutput(result);

		assert.equal(result.status, 1, output);
		assert.match(output, /^Content check failed\./m);
		assert.match(output, /Section and Gallery Issues\n\n\[min-konst\]\n  Errors:/);
		assert.match(output, /Image "vav\.jpeg" is used here but is located in site\/images\/mitt-hem\/\./);
		assert.match(output, /Image "missing\.jpeg" does not exist anywhere under site\/images\/\./);
		assert.match(output, /Image "duplicate\.jpg" is referenced more than once in this section\./);
		assert.match(output, /\[extra\]\n  Warnings:/);
		assert.match(output, /Global Content Issues\n\nWarnings:\n- Markdown section order differs from frontmatter\./);
		assert.match(output, /Unreferenced Images\nThese files are kept in site\/images\/ but are not mounted on the site:/);
		assert.match(output, /site\/images\/karin-walde\/unreferenced\.jpg/);
	});
});

const carouselAspectRatioSite = `---
sections:
  - id: puppies
    gallery:
      - carousel:
          - image: wide.png
          - image: wider.png

---
## Puppies {#puppies}
Text.
`;

test('content:check warns when carousel images use different aspect ratios', async () => {
	await withTempProject({
		site: carouselAspectRatioSite,
		files: [
			{
				path: 'site/images/puppies/wide.png',
				contents: makePngHeader({ width: 400, height: 300 }),
			},
			{
				path: 'site/images/puppies/wider.png',
				contents: makePngHeader({ width: 600, height: 300 }),
			},
		],
	}, async (root) => {
		const result = runContentScript(root, ['--check']);
		const output = getOutput(result);

		assert.equal(result.status, 0, output);
		assert.match(output, /^Content check completed with warnings\./m);
		assert.match(output, /Carousel on line 5 uses images with different aspect ratios: wide\.png \(4:3\), wider\.png \(2:1\)\./);
		assert.match(output, /Use images with exactly matching proportions in the same carousel/);
	});
});

const inlineStyleSite = `---
defaultPresentation:
  inlineStyles:
    highlight:
      color: "#ffd84d"
sections:
  - id: intro
    gallery: []

---
## Intro {#intro}
This has [known text]{.highlight} and [unknown text]{.missing}.
`;

test('content:check fails when Markdown uses undefined inline styles', async () => {
	await withTempProject({
		site: inlineStyleSite,
		files: [],
	}, async (root) => {
		const result = runContentScript(root, ['--check']);
		const output = getOutput(result);

		assert.equal(result.status, 1, output);
		assert.match(output, /^Content check failed\./m);
		assert.match(output, /Inline style "\.missing" is used in Markdown but is not defined in defaultPresentation\.inlineStyles\./);
		assert.doesNotMatch(output, /"\.highlight" is used in Markdown/);
	});
});

const badWhitespaceSite = `---
defaultPresentation:
  typography:
    preset: quiet-gallery
\u00a0\u00a0\u00a0\u00a0overrides:
      body:
        paragraphSpacing: 0.3em
sections:
  - id: intro
    gallery: []

---
## Intro {#intro}
Text.
`;

test('content:check explains invalid frontmatter indentation whitespace', async () => {
	await withTempProject({
		site: badWhitespaceSite,
		files: [],
	}, async (root) => {
		const result = runContentScript(root, ['--check']);
		const output = getOutput(result);

		assert.equal(result.status, 1, output);
		assert.match(output, /^Content check failed\./m);
		assert.match(output, /Frontmatter line 5 uses tabs, non-breaking spaces, or invalid whitespace for indentation\./);
		assert.match(output, /Replace the indentation on that line with ordinary spaces\./);
	});
});

const badNestedValueSite = `---
defaultPresentation:
  typography:
    preset: quiet-gallery
      overrides:
        body:
          paragraphSpacing: 0.3em
sections:
  - id: intro
    gallery: []

---
## Intro {#intro}
Text.
`;

test('content:check explains frontmatter indentation below scalar values', async () => {
	await withTempProject({
		site: badNestedValueSite,
		files: [],
	}, async (root) => {
		const result = runContentScript(root, ['--check']);
		const output = getOutput(result);

		assert.equal(result.status, 1, output);
		assert.match(output, /^Content check failed\./m);
		assert.match(output, /Frontmatter line 5 is indented under line 4, but line 4 already has a value\./);
		assert.match(output, /Move the later line to the same indentation level as its sibling/);
	});
});

const topLevelGallerySite = `---
title: Example
description: Example site.
sections:
  - id: intro
gallery:
      - image: intro.jpg

---
## Intro {#intro}
Text.
`;

test('content:check explains likely misindented frontmatter keys', async () => {
	await withTempProject({
		site: topLevelGallerySite,
		files: ['site/images/intro/intro.jpg'],
	}, async (root) => {
		const result = runContentScript(root, ['--check']);
		const output = getOutput(result);

		assert.equal(result.status, 1, output);
		assert.match(output, /^Content check failed\./m);
		assert.match(output, /Frontmatter line 6 defines "gallery" at the top level, but it is not a valid top-level content field\./);
		assert.match(output, /Indent "gallery:" under the section or object it belongs to\./);
	});
});

test('content:check respects CLI_GALLERY_SITE_DIR', async () => {
	await withTempProject({
		site: movableSite,
		siteDirectory: 'custom-site',
		files: [
			'custom-site/images/min-konst/move-me.jpg',
			'custom-site/images/mitt-hem/home.jpg',
		],
	}, async (root) => {
		const result = runContentScript(root, ['--check'], { CLI_GALLERY_SITE_DIR: 'custom-site' });
		const output = getOutput(result);

		assert.equal(result.status, 0, output);
		assert.match(output, /Content check passed\./);
	});
});

const movableSite = `---
sections:
  - id: min-konst
    gallery:
      - image: move-me.jpg
  - id: mitt-hem
    gallery:
      - image: home.jpg

---
## Min konst {#min-konst}
Text.
## Mitt hem {#mitt-hem}
Text.
`;

test('content:sync moves referenced images and keeps unreferenced images in place', async () => {
	await withTempProject({
		site: movableSite,
		files: [
			'site/images/mitt-hem/home.jpg',
			'site/images/mitt-hem/move-me.jpg',
			'site/images/mitt-hem/unreferenced.jpg',
		],
	}, async (root) => {
		const syncResult = runContentScript(root, ['--write', '--yes']);
		const syncOutput = getOutput(syncResult);

		assert.equal(syncResult.status, 0, syncOutput);
		assert.match(syncOutput, /Moved image "move-me\.jpg" to site\/images\/min-konst\/\./);
		assert.equal(await fileExists(path.join(root, 'site/images/min-konst/move-me.jpg')), true);
		assert.equal(await fileExists(path.join(root, 'site/images/mitt-hem/move-me.jpg')), false);
		assert.equal(await fileExists(path.join(root, 'site/images/mitt-hem/unreferenced.jpg')), true);

		const checkResult = runContentScript(root, ['--check']);
		const checkOutput = getOutput(checkResult);

		assert.equal(checkResult.status, 0, checkOutput);
		assert.match(checkOutput, /Content check passed\./);
		assert.match(checkOutput, /site\/images\/mitt-hem\/unreferenced\.jpg/);
	});
});

let failed = 0;

for (const { name, run } of tests) {
	try {
		await run();
		console.log(`ok - ${name}`);
	} catch (error) {
		failed += 1;
		console.error(`not ok - ${name}`);
		console.error(error);
	}
}

if (failed > 0) {
	process.exit(1);
}
