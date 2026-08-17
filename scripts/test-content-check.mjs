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

const defaultTheme = `---
typography:
  preset: quiet-gallery
frame:
  colors: presentation
---
`;

const withTempProject = async ({ site, theme = defaultTheme, files, siteDirectory = 'site' }, run) => {
	const root = await mkdtemp(path.join(tmpdir(), 'walde-content-check-'));

	try {
		await writeFixtureFile(root, `${siteDirectory}/content.md`, site);
		await writeFixtureFile(root, `${siteDirectory}/theme.md`, theme);

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
  karin-walde: {}
  min-konst: {}
  mitt-hem: {}

---
## Karin Walde {#karin-walde}
Text.

\`\`\`norna-image-stack
- image: karin.jpg
  alt: Karin
\`\`\`

## Min konst {#min-konst}
Text.

\`\`\`norna-image-stack
- image: vav.jpeg
  alt: Vav
- image: missing.jpeg
  alt: Missing
- image: duplicate.jpg
  alt: Duplicate one
- image: duplicate.jpg
  alt: Duplicate two
\`\`\`

## Extra {#extra}
Text.
## Mitt hem {#mitt-hem}
Text.

\`\`\`norna-image-stack
- image: home.jpg
  alt: Home
\`\`\`
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
		assert.match(output, /Content Issues\n\n\[site\/content\.md \[min-konst\]\]\n  Errors:/);
		assert.match(output, /Image "vav\.jpeg" is used here but is located in site\/images\/mitt-hem\/vav\.jpeg\./);
		assert.match(output, /Image "missing\.jpeg" does not exist at site\/images\/min-konst\/missing\.jpeg or anywhere under any page or route image root\./);
		assert.match(output, /Unreferenced Images\nThese files are kept under page or route image roots but are not referenced by Norna-managed image references:/);
		assert.match(output, /site\/images\/karin-walde\/unreferenced\.jpg/);
	});
});

const carouselAspectRatioSite = `---
title: Carousel Aspect Ratio
---
## Puppies {#puppies}
Text.

\`\`\`norna-image-carousel
- image: wide.png
  alt: Wide
- image: wider.png
  alt: Wider
\`\`\`
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
		assert.match(output, /Carousel on line 7 uses images with different aspect ratios: wide\.png \(4:3\), wider\.png \(2:1\)\./);
		assert.match(output, /Use images with exactly matching proportions in the same carousel/);
	});
});

const inlineStyleTheme = `---
presentation:
  inlineStyles:
    highlight:
      color: "#ffd84d"
---
`;

const inlineStyleSite = `---
title: Inline Style
---
## Intro {#intro}
This has [known text]{.highlight} and [unknown text]{.missing}.
`;

test('content:check fails when Markdown uses undefined inline styles', async () => {
	await withTempProject({
		site: inlineStyleSite,
		theme: inlineStyleTheme,
		files: [],
	}, async (root) => {
		const result = runContentScript(root, ['--check']);
		const output = getOutput(result);

		assert.equal(result.status, 1, output);
		assert.match(output, /^Content check failed\./m);
		assert.match(output, /Inline style "\.missing" is used in site\/content\.md but is not defined in site\/theme\.md presentation\.inlineStyles\./);
		assert.doesNotMatch(output, /"\.highlight" is used in Markdown/);
	});
});

const invalidInlineStyleColorTheme = `---
presentation:
  inlineStyles:
    yellow:
      color: "#ffd844d"
---
`;

test('content:check explains invalid inline style colors', async () => {
	await withTempProject({
		site: `---
title: Invalid Inline Color
---
## Intro {#intro}
This has [yellow text]{.yellow}.
`,
		theme: invalidInlineStyleColorTheme,
		files: [],
	}, async (root) => {
		const result = runContentScript(root, ['--check']);
		const output = getOutput(result);

		assert.equal(result.status, 1, output);
		assert.match(output, /^Content check failed\./m);
		assert.match(output, /site\/theme\.md line 5 defines presentation\.inlineStyles\.yellow\.color with invalid color value "#ffd844d"\./);
		assert.match(output, /Use a quoted hex color in #rgb, #rrggbb, or #rrggbbaa form, for example color: "#ffd84d"\./);
		assert.doesNotMatch(output, /Inline style "\.yellow" is used in site\/content\.md but is not defined/);
	});
});

const badWhitespaceSite = `---
presentation:
  typography:
    preset: quiet-gallery
\u00a0\u00a0\u00a0\u00a0overrides:
      body:
        paragraphSpacing: 0.3em
sections:
  intro: {}

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
presentation:
  typography:
    preset: quiet-gallery
      overrides:
        body:
          paragraphSpacing: 0.3em
sections:
  intro: {}

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
  intro: {}
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
		assert.match(output, /Indent "gallery:" under the object it belongs to, or move image content into Norna Markdown blocks\./);
	});
});

test('content:check respects NORNA_SITE_DIR', async () => {
	await withTempProject({
		site: movableSite,
		siteDirectory: 'custom-site',
		files: [
			'custom-site/images/min-konst/move-me.jpg',
			'custom-site/images/mitt-hem/home.jpg',
		],
	}, async (root) => {
		const result = runContentScript(root, ['--check'], { NORNA_SITE_DIR: 'custom-site' });
		const output = getOutput(result);

		assert.equal(result.status, 0, output);
		assert.match(output, /Content check passed\./);
	});
});

const movableSite = `---
sections:
  min-konst: {}
  mitt-hem: {}

---
## Min konst {#min-konst}
Text.

\`\`\`norna-image-stack
- image: move-me.jpg
  alt: Move me
\`\`\`

## Mitt hem {#mitt-hem}
Text.

\`\`\`norna-image-stack
- image: home.jpg
  alt: Home
\`\`\`
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
		assert.match(checkOutput, /Content check completed with warnings\./);
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
