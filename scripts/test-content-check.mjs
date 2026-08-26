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

const defaultTheme = `typography:
  profile: restrained
palette: dark
`;

const withTempProject = async ({ site, theme = defaultTheme, files, siteDirectory = 'site' }, run) => {
	const root = await mkdtemp(path.join(tmpdir(), 'walde-content-check-'));

	try {
		await writeFixtureFile(root, `${siteDirectory}/pages/000-home/content.md`, site);
		await writeFixtureFile(root, `${siteDirectory}/theme.yaml`, theme);

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
page:
  description: Exercises grouped content diagnostics.
---

# Broken content fixture

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
			'site/pages/000-home/images/karin.jpg',
			'site/pages/000-home/images/karin-walde/unreferenced.jpg',
			'site/pages/000-home/images/min-konst/duplicate.jpg',
			'site/pages/000-home/images/home.jpg',
			'site/pages/000-home/images/mitt-hem/vav.jpeg',
		],
	}, async (root) => {
		const result = runContentScript(root, ['--check']);
		const output = getOutput(result);

		assert.equal(result.status, 1, output);
		assert.match(output, /^Content check failed\./m);
		assert.match(output, /Content Issues\n\n\[site\/pages\/000-home\/content\.md \[min-konst\]\]\n  Errors:/);
		assert.match(output, /Image "vav\.jpeg" is used here but is located in site\/pages\/000-home\/images\/mitt-hem\/vav\.jpeg\./);
		assert.match(output, /Image "missing\.jpeg" does not exist at site\/pages\/000-home\/images\/missing\.jpeg or anywhere under any page image root\./);
		assert.match(output, /Unreferenced Images\nThese files are kept under page image roots but are not referenced by Norna-managed image references:/);
		assert.match(output, /site\/pages\/000-home\/images\/karin-walde\/unreferenced\.jpg/);
	});
});

const carouselAspectRatioSite = `# Carousel Aspect Ratio

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
				path: 'site/pages/000-home/images/wide.png',
				contents: makePngHeader({ width: 400, height: 300 }),
			},
			{
				path: 'site/pages/000-home/images/wider.png',
				contents: makePngHeader({ width: 600, height: 300 }),
			},
		],
	}, async (root) => {
		const result = runContentScript(root, ['--check']);
		const output = getOutput(result);

		assert.equal(result.status, 0, output);
		assert.match(output, /^Content check completed with warnings\./m);
		assert.match(output, /Carousel on line 6 uses images with different aspect ratios: wide\.png \(4:3\), wider\.png \(2:1\)\./);
		assert.match(output, /Use images with exactly matching proportions in the same carousel/);
	});
});

const inlineStyleSite = `# Inline Style

## Intro {#intro}
This has [known text]{.highlight} and [unknown text]{.missing}.
`;

test('content:check fails when Markdown uses removed inline color styles', async () => {
	await withTempProject({
		site: inlineStyleSite,
		files: [],
	}, async (root) => {
		const result = runContentScript(root, ['--check']);
		const output = getOutput(result);

		assert.equal(result.status, 1, output);
		assert.match(output, /^Content check failed\./m);
		assert.match(output, /Inline color style "\.highlight" is no longer supported in site\/pages\/000-home\/content\.md\./);
		assert.match(output, /Inline color style "\.missing" is no longer supported in site\/pages\/000-home\/content\.md\./);
	});
});

test('content:check suggests semantic Markdown instead of inline color styles', async () => {
	await withTempProject({
		site: `# Invalid Inline Color

## Intro {#intro}
This has [yellow text]{.yellow}.
`,
		files: [],
	}, async (root) => {
		const result = runContentScript(root, ['--check']);
		const output = getOutput(result);

		assert.equal(result.status, 1, output);
		assert.match(output, /^Content check failed\./m);
		assert.match(output, /Use standard Markdown emphasis, a blockquote, or a semantic Norna block instead of color syntax\./);
	});
});

const inlineNoteSite = `---
page:
  description: Fixture
---

# Inline notes

## Intro {#intro}
This paragraph has a note reference.{note-ref}

{note: Additional context.}

\`\`\`text
{note-ref}
{note: This is code, not a note.
\`\`\`
`;

test('content:check accepts valid inline notes and ignores note syntax in code fences', async () => {
	await withTempProject({ site: inlineNoteSite, files: [] }, async (root) => {
		const result = runContentScript(root, ['--check']);
		const output = getOutput(result);

		assert.equal(result.status, 0, output);
		assert.match(output, /Content check passed\./);
	});
});

test('content:check accepts wrapped and explicit multiline inline notes', async () => {
	await withTempProject({
		site: `---
page:
  description: Fixture
---

# Multiline inline notes

## Wrapped {#wrapped}
This paragraph has a formatter-wrapped note.{note-ref}

{note: This note was wrapped by
an editor before its closing brace.}

## Explicit {#explicit}
This paragraph has an explicit multiline note.{note-ref}

{note:
  This note uses the explicit
  multiline form.
}
`,
		files: [],
	}, async (root) => {
		const result = runContentScript(root, ['--check']);
		const output = getOutput(result);

		assert.equal(result.status, 0, output);
		assert.match(output, /Content check passed\./);
	});
});

test('content:check reports an unclosed multiline inline note', async () => {
	await withTempProject({
		site: `---
page:
  description: Fixture
---

# Unclosed inline note

## Intro {#intro}
This paragraph has a note reference.{note-ref}

{note: This note never closes
and continues to the end of the file.
`,
		files: [],
	}, async (root) => {
		const result = runContentScript(root, ['--check']);
		const output = getOutput(result);

		assert.equal(result.status, 1, output);
		assert.match(output, /The note starting on line \d+ is not closed\./);
		assert.match(output, /End it with "\}" on its own line or at the end of the note text\./);
	});
});

test('content:check rejects nested note syntax before a multiline note is closed', async () => {
	await withTempProject({
		site: `---
page:
  description: Fixture
---

# Nested inline note syntax

## Nested note {#nested-note}
This paragraph has a note reference.{note-ref}

{note: The first note is still open
{note: A second note starts here.}

## Nested reference {#nested-reference}
This paragraph has another note reference.{note-ref}

{note: This note is still open
and contains {note-ref} before closing.}
`,
		files: [],
	}, async (root) => {
		const result = runContentScript(root, ['--check']);
		const output = getOutput(result);

		assert.equal(result.status, 1, output);
		assert.match(output, /is not closed before another note starts on line \d+\./);
		assert.match(output, /contains "\{note-ref\}" on line \d+\./);
	});
});

test('content:check allows escaped and inline-code note syntax inside notes', async () => {
	await withTempProject({
		site: `---
page:
  description: Fixture
---

# Literal inline note syntax

## Intro {#intro}
This paragraph has a note reference.{note-ref}

{note: Write \\{note: ... to show escaped text, or use \`{note-ref}\` as inline code.}
`,
		files: [],
	}, async (root) => {
		const result = runContentScript(root, ['--check']);
		const output = getOutput(result);

		assert.equal(result.status, 0, output);
		assert.match(output, /Content check passed\./);
	});
});

test('content:check rejects unpaired and repeated inline notes', async () => {
	await withTempProject({
		site: `---
page:
  description: Fixture
---

# Invalid inline notes

## Orphan {#orphan}
{note: This note has no reference.}

## Missing {#missing}
This reference has no note.{note-ref}

## Repeated {#repeated}
This paragraph has {note-ref} two references {note-ref}.
`,
		files: [],
	}, async (root) => {
		const result = runContentScript(root, ['--check']);
		const output = getOutput(result);

		assert.equal(result.status, 1, output);
		assert.match(output, /A "\{note: \.\.\.\}" requires a preceding paragraph containing "\{note-ref\}"\./);
		assert.match(output, /contains "\{note-ref\}" but has no following "\{note: \.\.\.\}"/);
		assert.match(output, /A paragraph may contain only one "\{note-ref\}"\./);
	});
});

const badWhitespaceSite = `---
typography:
  profile: restrained
\u00a0\u00a0overrides:
    body:
      paragraphSpacing: 0.3em
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
		assert.match(output, /Frontmatter line 4 uses tabs, non-breaking spaces, or invalid whitespace for indentation\./);
		assert.match(output, /Replace the indentation on that line with ordinary spaces\./);
	});
});

const badNestedValueSite = `---
typography:
  profile: restrained
    overrides:
      body:
        paragraphSpacing: 0.3em
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
		assert.match(output, /Frontmatter line 4 is indented under line 3, but line 3 already has a value\./);
		assert.match(output, /Move the later line to the same indentation level as its sibling/);
	});
});

const topLevelImagesSite = `---
page:
  description: Example site.
images:
      - image: intro.jpg
---

# Example

## Intro {#intro}
Text.
`;

test('content:check explains likely misindented frontmatter keys', async () => {
	await withTempProject({
		site: topLevelImagesSite,
		files: ['site/pages/000-home/images/intro/intro.jpg'],
	}, async (root) => {
		const result = runContentScript(root, ['--check']);
		const output = getOutput(result);

		assert.equal(result.status, 1, output);
		assert.match(output, /^Content check failed\./m);
		assert.match(output, /Frontmatter line 4 defines "images" at the top level, but it is not a valid top-level content field\./);
		assert.match(output, /Put local image references in norna-image-stack or norna-image-carousel blocks in the Markdown body\./);
	});
});

test('content:check respects NORNA_SITE_DIR', async () => {
	await withTempProject({
		site: movableSite,
		siteDirectory: 'custom-site',
		files: [
			'custom-site/pages/000-home/images/move-me.jpg',
			'custom-site/pages/000-home/images/home.jpg',
		],
	}, async (root) => {
		const result = runContentScript(root, ['--check'], { NORNA_SITE_DIR: 'custom-site' });
		const output = getOutput(result);

		assert.equal(result.status, 0, output);
		assert.match(output, /Content check passed\./);
	});
});

const movableSite = `---
page:
  description: Exercises content sync.
---

# Movable image fixture

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
			'site/pages/000-home/images/home.jpg',
			'site/pages/000-home/images/mitt-hem/move-me.jpg',
			'site/pages/000-home/images/mitt-hem/unreferenced.jpg',
		],
	}, async (root) => {
		const syncResult = runContentScript(root, ['--write', '--yes']);
		const syncOutput = getOutput(syncResult);

		assert.equal(syncResult.status, 0, syncOutput);
		assert.match(syncOutput, /Moved image "move-me\.jpg" to site\/pages\/000-home\/images\/\./);
		assert.equal(await fileExists(path.join(root, 'site/pages/000-home/images/move-me.jpg')), true);
		assert.equal(await fileExists(path.join(root, 'site/pages/000-home/images/mitt-hem/move-me.jpg')), false);
		assert.equal(await fileExists(path.join(root, 'site/pages/000-home/images/mitt-hem/unreferenced.jpg')), true);

		const checkResult = runContentScript(root, ['--check']);
		const checkOutput = getOutput(checkResult);

		assert.equal(checkResult.status, 0, checkOutput);
		assert.match(checkOutput, /Content check completed with warnings\./);
		assert.match(checkOutput, /site\/pages\/000-home\/images\/mitt-hem\/unreferenced\.jpg/);
	});
});

test('content:check accepts a frontmatter-free page with one H1 title', async () => {
	await withTempProject({
		site: `# About

Introductory text.

\`\`\`md
# Example heading in code
\`\`\`

## Details {#details}

More text.
`,
		files: [],
	}, async (root) => {
		const result = runContentScript(root, ['--check']);
		assert.equal(result.status, 0, getOutput(result));
	});
});

test('content:check requires exactly one H1 before level 2 sections', async () => {
	await withTempProject({
		site: `## Details {#details}

Text.
`,
		files: [],
	}, async (root) => {
		const result = runContentScript(root, ['--check']);
		const output = getOutput(result);
		assert.equal(result.status, 1, output);
		assert.match(output, /The page is missing its Markdown H1 title\./);
		assert.match(output, /a Norna page must start with its H1 title\./);
	});
});

test('content:check rejects repeated H1 page titles', async () => {
	await withTempProject({
		site: `# First title

Text.

# Second title

More text.
`,
		files: [],
	}, async (root) => {
		const result = runContentScript(root, ['--check']);
		const output = getOutput(result);
		assert.equal(result.status, 1, output);
		assert.match(output, /The page contains 2 Markdown H1 headings\./);
	});
});

test('content:check rejects section ids and content before the H1 page title', async () => {
	await withTempProject({
		site: `Text before the title.

# About {#about}

Page text.
`,
		files: [],
	}, async (root) => {
		const result = runContentScript(root, ['--check']);
		const output = getOutput(result);
		assert.equal(result.status, 1, output);
		assert.match(output, /The page contains content before its first heading\./);
		assert.match(output, /The Markdown H1 is the page title and must not have an id\./);
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
