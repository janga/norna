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

test('content:sync moves Norna-managed images inside the same page image root', async () => {
	const { root, siteDir } = await createTempSite();
	try {
		await writeFile(path.join(siteDir, 'pages', '000-home', 'content.md'), `---
page:
  description: Fixture
---

# Sync Fixture

## Work {#work}

\`\`\`norna-image-stack
- image: moved.jpg
  alt: Moved image
\`\`\`
`);
		await mkdir(path.join(siteDir, 'pages', '000-home', 'images', 'old'), { recursive: true });
		await writeFile(path.join(siteDir, 'pages', '000-home', 'images', 'old', 'moved.jpg'), 'fixture image');

		await runContentScript(siteDir, ['--write', '--yes']);

		const moved = await readFile(path.join(siteDir, 'pages', '000-home', 'images', 'moved.jpg'), 'utf8');
		assert.equal(moved, 'fixture image');
	} finally {
		await rm(root, { recursive: true, force: true });
	}
});

test('content:sync moves managed SVG images inside the same page image root', async () => {
	const { root, siteDir } = await createTempSite();
	try {
		await writeFile(path.join(siteDir, 'pages', '000-home', 'content.md'), `---
page:
  description: Fixture
---

# SVG Sync Fixture

## Work {#work}

\`\`\`norna-image-stack
- image: moved.svg
  alt: Moved diagram
\`\`\`
`);
		await mkdir(path.join(siteDir, 'pages', '000-home', 'images', 'old'), { recursive: true });
		await writeFile(path.join(siteDir, 'pages', '000-home', 'images', 'old', 'moved.svg'), '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"></svg>\n');

		await runContentScript(siteDir, ['--write', '--yes']);

		const moved = await readFile(path.join(siteDir, 'pages', '000-home', 'images', 'moved.svg'), 'utf8');
		assert.match(moved, /viewBox="0 0 10 10"/);
	} finally {
		await rm(root, { recursive: true, force: true });
	}
});

test('content:sync shows its plan and moves images across pages without requiring a Git worktree', async () => {
	const { root, siteDir } = await createTempSite();
	try {
		const sourcePageDir = path.join(siteDir, 'pages', '010-source');
		const targetPageDir = path.join(siteDir, 'pages', '020-target');
		await mkdir(path.join(sourcePageDir, 'images'), { recursive: true });
		await mkdir(targetPageDir, { recursive: true });
		await writeFile(path.join(siteDir, 'pages', '000-home', 'content.md'), `---
page:
  description: Fixture
---

# Cross Page Sync

## Home {#home}

Text.
`);
		await writeFile(path.join(sourcePageDir, 'content.md'), `---
page:
  description: Fixture
---

# Source

## Old {#old}

Text.
`);
		await writeFile(path.join(targetPageDir, 'content.md'), `---
page:
  description: Fixture
---

# Target

## Work {#work}

\`\`\`norna-image-stack
- image: moved.jpg
\`\`\`
`);
		await writeFile(path.join(sourcePageDir, 'images', 'moved.jpg'), 'page image');
		const { stdout } = await runContentScript(siteDir, ['--write', '--yes']);

		assert.match(stdout, /Planned image moves:/);
		assert.match(stdout, /site\/pages\/010-source\/images\/moved\.jpg -> .*site\/pages\/020-target\/images\/moved\.jpg/);
		assert.match(stdout, /Moved image "moved\.jpg" to .*site\/pages\/020-target\/images\//);
		assert.equal(await fileExists(path.join(targetPageDir, 'images', 'moved.jpg')), true);
		assert.equal(await fileExists(path.join(sourcePageDir, 'images', 'moved.jpg')), false);
	} finally {
		await rm(root, { recursive: true, force: true });
	}
});

test('content:sync moves images across pages when Git status is dirty', async () => {
	const { root, siteDir } = await createTempSite();
	try {
		const sourcePageDir = path.join(siteDir, 'pages', '010-source');
		const targetPageDir = path.join(siteDir, 'pages', '020-target');
		await mkdir(path.join(sourcePageDir, 'images'), { recursive: true });
		await mkdir(targetPageDir, { recursive: true });
		await writeFile(path.join(siteDir, 'pages', '000-home', 'content.md'), `---
page:
  description: Fixture
---

# Dirty Cross Page Sync

## Home {#home}

Text.
`);
		await writeFile(path.join(sourcePageDir, 'content.md'), `---
page:
  description: Fixture
---

# Source

## Old {#old}

Text.
`);
		await writeFile(path.join(targetPageDir, 'content.md'), `---
page:
  description: Fixture
---

# Target

## Work {#work}

\`\`\`norna-image-stack
- image: moved.jpg
\`\`\`
`);
		await writeFile(path.join(sourcePageDir, 'images', 'moved.jpg'), 'page image');
		await initCleanGitWorktree(root);
		await writeFile(path.join(root, 'dirty.txt'), 'dirty');

		const { stdout } = await runContentScript(siteDir, ['--write', '--yes']);

		assert.match(stdout, /Planned image moves:/);
		assert.equal(await fileExists(path.join(targetPageDir, 'images', 'moved.jpg')), true);
		assert.equal(await fileExists(path.join(sourcePageDir, 'images', 'moved.jpg')), false);
	} finally {
		await rm(root, { recursive: true, force: true });
	}
});

test('content:check reports cross-page image moves without requiring clean git status', async () => {
	const { root, siteDir } = await createTempSite();
	try {
		const sourcePageDir = path.join(siteDir, 'pages', '010-source');
		const targetPageDir = path.join(siteDir, 'pages', '020-target');
		await mkdir(path.join(sourcePageDir, 'images'), { recursive: true });
		await mkdir(targetPageDir, { recursive: true });
		await writeFile(path.join(siteDir, 'pages', '000-home', 'content.md'), `---
page:
  description: Fixture
---

# Cross Page Check

## Home {#home}

Text.
`);
		await writeFile(path.join(sourcePageDir, 'content.md'), `---
page:
  description: Fixture
---

# Source

## Old {#old}

Text.
`);
		await writeFile(path.join(targetPageDir, 'content.md'), `---
page:
  description: Fixture
---

# Target

## Work {#work}

\`\`\`norna-image-stack
- image: moved.jpg
\`\`\`
`);
		await writeFile(path.join(sourcePageDir, 'images', 'moved.jpg'), 'page image');
		await writeFile(path.join(root, 'dirty.txt'), 'dirty');

		await assert.rejects(
			() => runContentScript(siteDir, ['--check']),
			(error) => {
				assert.match(error.output, /Image "moved\.jpg" is used here but is located in .*site\/pages\/010-source\/images\/moved\.jpg\./);
				assert.match(error.output, /Run norna content:sync to move it from .*site\/pages\/010-source to .*site\/pages\/020-target\./);
				assert.doesNotMatch(error.output, /requires a clean git working tree before moving files/);
				return true;
			},
		);
	} finally {
		await rm(root, { recursive: true, force: true });
	}
});

test('content:sync refuses to move a cross-page image still referenced by its current section', async () => {
	const { root, siteDir } = await createTempSite();
	try {
		const sourcePageDir = path.join(siteDir, 'pages', '010-source');
		const targetPageDir = path.join(siteDir, 'pages', '020-target');
		await mkdir(path.join(sourcePageDir, 'images'), { recursive: true });
		await mkdir(targetPageDir, { recursive: true });
		await writeFile(path.join(siteDir, 'pages', '000-home', 'content.md'), `---
page:
  description: Fixture
---

# Cross Page Copy

## Home {#home}

Text.
`);
		await writeFile(path.join(sourcePageDir, 'content.md'), `---
page:
  description: Fixture
---

# Source

## Old {#old}

\`\`\`norna-image-stack
- image: shared.jpg
\`\`\`
`);
		await writeFile(path.join(targetPageDir, 'content.md'), `---
page:
  description: Fixture
---

# Target

## Work {#work}

\`\`\`norna-image-stack
- image: shared.jpg
\`\`\`
`);
		await writeFile(path.join(sourcePageDir, 'images', 'shared.jpg'), 'page image');
		await assert.rejects(
			() => runContentScript(siteDir, ['--write', '--yes']),
			(error) => {
				assert.match(error.output, /Cannot relocate "shared\.jpg" from .*site\/pages\/010-source\/images\/shared\.jpg because it is still referenced from .*site\/pages\/010-source\/content\.md \[old\]\./);
				return true;
			},
		);

		assert.equal(await fileExists(path.join(targetPageDir, 'images', 'shared.jpg')), false);
		assert.equal(await fileExists(path.join(sourcePageDir, 'images', 'shared.jpg')), true);
	} finally {
		await rm(root, { recursive: true, force: true });
	}
});

test('CLI content:sync refreshes generated images after moving a carousel image', async () => {
	const { root, siteDir } = await createTempSite();
	try {
		await writeFile(path.join(siteDir, 'pages', '000-home', 'content.md'), `---
page:
  description: Fixture
---

# Sync Fixture

## Work {#work}

\`\`\`norna-image-carousel
- image: slide-one.jpg
  alt: Slide one
- image: slide-two.jpg
  alt: Slide two
\`\`\`
`);
		await mkdir(path.join(siteDir, 'pages', '000-home', 'images', 'old'), { recursive: true });
		await cp(path.join(fixtureSiteDir, 'pages', '000-home', 'images', 'hero.jpg'), path.join(siteDir, 'pages', '000-home', 'images', 'old', 'slide-one.jpg'));
		await cp(path.join(fixtureSiteDir, 'pages', '000-home', 'images', 'detail.jpg'), path.join(siteDir, 'pages', '000-home', 'images', 'slide-two.jpg'), { force: true });

		await runNorna(['--site-dir', siteDir, 'content:sync', '--yes']);

		const manifest = JSON.parse(await readFile(path.join(siteDir, '.norna', 'generated-images.json'), 'utf8'));
		assert.equal(await fileExists(path.join(siteDir, 'pages', '000-home', 'images', 'slide-one.jpg')), true);
		assert.ok(manifest['pages/000-home/images/slide-one.jpg']);
		assert.ok(manifest['pages/000-home/images/slide-two.jpg']);
	} finally {
		await rm(root, { recursive: true, force: true });
	}
});

test('content:sync refuses ambiguous image relocation', async () => {
	const { root, siteDir } = await createTempSite();
	try {
		await writeFile(path.join(siteDir, 'pages', '000-home', 'content.md'), `---
page:
  description: Fixture
---

# Ambiguous Move

## Work {#work}

\`\`\`norna-image-stack
- image: shared.jpg
  alt: Shared
\`\`\`
`);
		await mkdir(path.join(siteDir, 'pages', '000-home', 'images', 'old-a'), { recursive: true });
		await mkdir(path.join(siteDir, 'pages', '000-home', 'images', 'old-b'), { recursive: true });
		await writeFile(path.join(siteDir, 'pages', '000-home', 'images', 'old-a', 'shared.jpg'), 'a');
		await writeFile(path.join(siteDir, 'pages', '000-home', 'images', 'old-b', 'shared.jpg'), 'b');

		await assert.rejects(
			() => runContentScript(siteDir, ['--write', '--yes']),
			(error) => {
				assert.match(error.output, /Cannot relocate "shared\.jpg"\. Multiple files with this filename were found:/);
				assert.match(error.output, /site\/pages\/000-home\/images\/old-a\/shared\.jpg/);
				assert.match(error.output, /site\/pages\/000-home\/images\/old-b\/shared\.jpg/);
				return true;
			},
		);

		assert.equal(await fileExists(path.join(siteDir, 'pages', '000-home', 'images', 'shared.jpg')), false);
		assert.equal(await fileExists(path.join(siteDir, 'pages', '000-home', 'images', 'old-a', 'shared.jpg')), true);
		assert.equal(await fileExists(path.join(siteDir, 'pages', '000-home', 'images', 'old-b', 'shared.jpg')), true);
	} finally {
		await rm(root, { recursive: true, force: true });
	}
});

test('content:sync moves one page-local image once when multiple sections reference it', async () => {
	const { root, siteDir } = await createTempSite();
	try {
		await writeFile(path.join(siteDir, 'pages', '000-home', 'content.md'), `---
page:
  description: Fixture
---

# Copied Image Reference

## Intro {#intro}

\`\`\`norna-image-stack
- image: shared.jpg
  alt: Shared original
\`\`\`

## Plain {#plain}

\`\`\`norna-image-stack
- image: shared.jpg
  alt: Shared copy
\`\`\`
`);
		await mkdir(path.join(siteDir, 'pages', '000-home', 'images', 'intro'), { recursive: true });
		await writeFile(path.join(siteDir, 'pages', '000-home', 'images', 'intro', 'shared.jpg'), 'shared image');

		await runContentScript(siteDir, ['--write', '--yes']);

		assert.equal(await fileExists(path.join(siteDir, 'pages', '000-home', 'images', 'intro', 'shared.jpg')), false);
		assert.equal(await fileExists(path.join(siteDir, 'pages', '000-home', 'images', 'shared.jpg')), true);
		await runContentScript(siteDir, ['--check']);
	} finally {
		await rm(root, { recursive: true, force: true });
	}
});
