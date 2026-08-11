import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { access, cp, mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { test } from 'node:test';

const execFileAsync = promisify(execFile);
const repoRoot = path.resolve(import.meta.dirname, '..');
const nodeBin = process.execPath;
const nornaBin = path.join(repoRoot, 'bin', 'norna.mjs');
const contentScript = path.join(repoRoot, 'scripts', 'sync-content-sections.mjs');
const fixtureSiteDir = path.join(repoRoot, 'fixtures', 'content-model-v2', 'site');
const fixtureRoot = path.dirname(fixtureSiteDir);

const runNorna = async (args, options = {}) => {
	try {
		return await execFileAsync(nodeBin, [nornaBin, ...args], {
			cwd: repoRoot,
			maxBuffer: 1024 * 1024 * 10,
			...options,
		});
	} catch (error) {
		error.output = `${error.stdout ?? ''}${error.stderr ?? ''}`;
		throw error;
	}
};

const runContentScript = async (siteDir, args) => {
	try {
		return await execFileAsync(nodeBin, [contentScript, ...args], {
			cwd: repoRoot,
			env: {
				...process.env,
				NORNA_SITE_DIR: siteDir,
			},
			maxBuffer: 1024 * 1024 * 10,
		});
	} catch (error) {
		error.output = `${error.stdout ?? ''}${error.stderr ?? ''}`;
		throw error;
	}
};

const createTempSite = async () => {
	const root = await mkdtemp(path.join(os.tmpdir(), 'norna-content-model-v2-'));
	const siteDir = path.join(root, 'site');
	await mkdir(siteDir, { recursive: true });
	await writeFile(path.join(siteDir, 'config.mjs'), `export default {
  site: {
    url: 'https://example.com',
    basePath: '/',
  },
  github: {
    branch: 'main',
    repo: 'owner/repo',
    pagesWorkflow: 'Deploy to GitHub Pages',
  },
};
`);
	await writeFile(path.join(siteDir, 'theme.md'), `---
typography:
  preset: text-forward
---
`);
	return { root, siteDir };
};

const fileExists = async (filePath) => access(filePath).then(() => true, () => false);

const createTempFixtureCopy = async () => {
	const tempParent = path.join(repoRoot, 'node_modules', '.cache');
	await mkdir(tempParent, { recursive: true });
	const root = await mkdtemp(path.join(tempParent, 'norna-content-model-v2-fixture-'));
	const fixtureCopyRoot = path.join(root, 'content-model-v2');

	await cp(fixtureRoot, fixtureCopyRoot, {
		recursive: true,
		filter: (source) => ![
			path.join(fixtureRoot, '.astro'),
			path.join(fixtureRoot, 'dist'),
			path.join(fixtureRoot, 'node_modules'),
			path.join(fixtureSiteDir, '.norna'),
		].some((ignoredPath) => source === ignoredPath || source.startsWith(`${ignoredPath}${path.sep}`)),
	});

	return {
		root,
		siteDir: path.join(fixtureCopyRoot, 'site'),
	};
};

test('content model v2 fixture checks and builds', async () => {
	const { root, siteDir } = await createTempFixtureCopy();
	try {
		await runNorna(['--site-dir', siteDir, 'content:check']);
		await runNorna(['--site-dir', siteDir, 'build']);

		const manifest = JSON.parse(await readFile(path.join(siteDir, '.norna', 'generated-images.json'), 'utf8'));
		assert.ok(manifest['images/intro/duplicate.jpg']);
		assert.ok(manifest['routes/010-guide/images/intro/duplicate.jpg']);
	} finally {
		await rm(root, { recursive: true, force: true });
	}
});

test('content:check warns for local Markdown images but not external Markdown images', async () => {
	const { root, siteDir } = await createTempSite();
	try {
		await writeFile(path.join(siteDir, 'content.md'), `---
title: Markdown Image Warning
description: Fixture
---

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
		await writeFile(path.join(siteDir, 'content.md'), `---
title: SVG Fixture
description: Fixture
---

## Intro {#intro}

\`\`\`norna-image-stack
- image: diagram.svg
  alt: Diagram
\`\`\`
`);
		await mkdir(path.join(siteDir, 'images', 'intro'), { recursive: true });
		await writeFile(path.join(siteDir, 'images', 'intro', 'diagram.svg'), '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 620"><rect width="900" height="620"/></svg>\n');

		await runContentScript(siteDir, ['--check']);
		await runNorna(['--site-dir', siteDir, 'images']);

		const manifest = JSON.parse(await readFile(path.join(siteDir, '.norna', 'generated-images.json'), 'utf8'));
		const entry = manifest['images/intro/diagram.svg'];
		assert.equal(entry.kind, 'static');
		assert.equal(entry.width, 900);
		assert.equal(entry.height, 620);
		assert.match(entry.src, /^\/images\/original\/images\/intro\/diagram-[a-f0-9]{8}\.svg$/);
		assert.equal(entry.variants, undefined);
		assert.equal(await fileExists(path.join(siteDir, '.norna', 'public', entry.src.replace(/^\//, ''))), true);
	} finally {
		await rm(root, { recursive: true, force: true });
	}
});

test('updated managed SVG images get updated static output', async () => {
	const { root, siteDir } = await createTempSite();
	try {
		await writeFile(path.join(siteDir, 'content.md'), `---
title: SVG Update Fixture
description: Fixture
---

## Intro {#intro}

\`\`\`norna-image-stack
- image: diagram.svg
  alt: Diagram
\`\`\`
`);
		await mkdir(path.join(siteDir, 'images', 'intro'), { recursive: true });
		const sourcePath = path.join(siteDir, 'images', 'intro', 'diagram.svg');
		await writeFile(sourcePath, '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 620"><rect width="900" height="620" fill="red"/></svg>\n');

		await runContentScript(siteDir, ['--check']);
		await runNorna(['--site-dir', siteDir, 'images']);

		const firstManifest = JSON.parse(await readFile(path.join(siteDir, '.norna', 'generated-images.json'), 'utf8'));
		const firstEntry = firstManifest['images/intro/diagram.svg'];
		const firstOutputPath = path.join(siteDir, '.norna', 'public', firstEntry.src.replace(/^\//, ''));

		await writeFile(sourcePath, '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 620"><rect width="900" height="620" fill="blue"/></svg>\n');
		await runNorna(['--site-dir', siteDir, 'images']);

		const secondManifest = JSON.parse(await readFile(path.join(siteDir, '.norna', 'generated-images.json'), 'utf8'));
		const secondEntry = secondManifest['images/intro/diagram.svg'];
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
		await writeFile(path.join(siteDir, 'content.md'), `---
title: SVG Carousel Fixture
description: Fixture
---

## Intro {#intro}

\`\`\`norna-image-carousel
- image: first.svg
  alt: First
- image: second.svg
  alt: Second
\`\`\`
`);
		await mkdir(path.join(siteDir, 'images', 'intro'), { recursive: true });
		await writeFile(path.join(siteDir, 'images', 'intro', 'first.svg'), '<svg xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100"/></svg>\n');
		await writeFile(path.join(siteDir, 'images', 'intro', 'second.svg'), '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100"/></svg>\n');

		const { stdout } = await runContentScript(siteDir, ['--check']);
		assert.match(stdout, /Content check completed with warnings\./);
		assert.match(stdout, /Carousel on line \d+ uses images without an intrinsic aspect ratio: first\.svg\./);
	} finally {
		await rm(root, { recursive: true, force: true });
	}
});

test('content:sync moves Norna-managed images inside the same page image root', async () => {
	const { root, siteDir } = await createTempSite();
	try {
		await writeFile(path.join(siteDir, 'content.md'), `---
title: Sync Fixture
description: Fixture
---

## Work {#work}

\`\`\`norna-image-stack
- image: moved.jpg
  alt: Moved image
\`\`\`
`);
		await mkdir(path.join(siteDir, 'images', 'old'), { recursive: true });
		await writeFile(path.join(siteDir, 'images', 'old', 'moved.jpg'), 'fixture image');

		await runContentScript(siteDir, ['--write', '--yes']);

		const moved = await readFile(path.join(siteDir, 'images', 'work', 'moved.jpg'), 'utf8');
		assert.equal(moved, 'fixture image');
	} finally {
		await rm(root, { recursive: true, force: true });
	}
});

test('content:sync moves managed SVG images inside the same page image root', async () => {
	const { root, siteDir } = await createTempSite();
	try {
		await writeFile(path.join(siteDir, 'content.md'), `---
title: SVG Sync Fixture
description: Fixture
---

## Work {#work}

\`\`\`norna-image-stack
- image: moved.svg
  alt: Moved diagram
\`\`\`
`);
		await mkdir(path.join(siteDir, 'images', 'old'), { recursive: true });
		await writeFile(path.join(siteDir, 'images', 'old', 'moved.svg'), '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"></svg>\n');

		await runContentScript(siteDir, ['--write', '--yes']);

		const moved = await readFile(path.join(siteDir, 'images', 'work', 'moved.svg'), 'utf8');
		assert.match(moved, /viewBox="0 0 10 10"/);
	} finally {
		await rm(root, { recursive: true, force: true });
	}
});

test('CLI content:sync refreshes generated images after moving a carousel image', async () => {
	const { root, siteDir } = await createTempSite();
	try {
		await writeFile(path.join(siteDir, 'content.md'), `---
title: Sync Fixture
description: Fixture
---

## Work {#work}

\`\`\`norna-image-carousel
- image: slide-one.jpg
  alt: Slide one
- image: slide-two.jpg
  alt: Slide two
\`\`\`
`);
		await mkdir(path.join(siteDir, 'images', 'old'), { recursive: true });
		await mkdir(path.join(siteDir, 'images', 'work'), { recursive: true });
		await cp(path.join(fixtureSiteDir, 'images', 'intro', 'hero.jpg'), path.join(siteDir, 'images', 'old', 'slide-one.jpg'));
		await cp(path.join(fixtureSiteDir, 'images', 'intro', 'detail.jpg'), path.join(siteDir, 'images', 'work', 'slide-two.jpg'), { force: true });

		await runNorna(['--site-dir', siteDir, 'content:sync', '--yes']);

		const manifest = JSON.parse(await readFile(path.join(siteDir, '.norna', 'generated-images.json'), 'utf8'));
		assert.equal(await fileExists(path.join(siteDir, 'images', 'work', 'slide-one.jpg')), true);
		assert.ok(manifest['images/work/slide-one.jpg']);
		assert.ok(manifest['images/work/slide-two.jpg']);
	} finally {
		await rm(root, { recursive: true, force: true });
	}
});

test('content:check fails when a level 2 section is missing an explicit id', async () => {
	const { root, siteDir } = await createTempSite();
	try {
		await writeFile(path.join(siteDir, 'content.md'), `---
title: Missing Id
description: Fixture
---

## Intro

This section has no explicit id.
`);

		await assert.rejects(
			() => runContentScript(siteDir, ['--check']),
			(error) => {
				assert.match(error.output, /Section heading "Intro" is missing an explicit id\./);
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
		await writeFile(path.join(siteDir, 'content.md'), `---
title: Malformed Block
description: Fixture
---

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
		await mkdir(path.join(siteDir, 'images', 'plain'), { recursive: true });
		await writeFile(path.join(siteDir, 'images', 'plain', 'image.jpg'), 'fixture image');
		await writeFile(path.join(siteDir, 'content.md'), `---
title: Unknown Block
description: Fixture
---

## Plain {#plain}

\`\`\`norna-gallery-stack
- image: image.jpg
\`\`\`
`);

		await assert.rejects(
			() => runContentScript(siteDir, ['--check']),
			(error) => {
				assert.match(error.output, /Unknown Norna image block "norna-gallery-stack"\. Use one of: norna-image-stack, norna-image-carousel\./);
				assert.match(error.output, /Use norna-image-stack for one or more stacked images\./);
				assert.match(error.output, /Example: ```norna-image-stack\n- image: filename\.jpg\n```/);
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
		await mkdir(path.join(siteDir, 'images', 'intro'), { recursive: true });
		await writeFile(path.join(siteDir, 'images', 'intro', 'hero.jpg'), 'fixture image');
		await writeFile(path.join(siteDir, 'content.md'), `---
title: Tilde Fence
description: Fixture
---

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
		await writeFile(path.join(siteDir, 'content.md'), `---
title: Code Example
description: Fixture
---

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
		await writeFile(path.join(siteDir, 'content.md'), `---
title: Missing Fence
description: Fixture
---

## Intro {#intro}

norna-image-stack
- image: hero.jpg
`);

		await assert.rejects(
			() => runContentScript(siteDir, ['--check']),
			(error) => {
				assert.match(error.output, /Found "norna-image-stack" outside a code block\./);
				assert.match(error.output, /Start the image block like this:\n```norna-image-stack\n- image: filename\.jpg\n```/);
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
		await writeFile(path.join(siteDir, 'content.md'), `---
title: Short Fence
description: Fixture
---

## Intro {#intro}

\`\`norna-image-stack
- image: hero.jpg
\`\`
`);

		await assert.rejects(
			() => runContentScript(siteDir, ['--check']),
			(error) => {
				assert.match(error.output, /Invalid Norna image block start for "norna-image-stack"\./);
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
		await writeFile(path.join(siteDir, 'content.md'), `---
title: Unclosed Fence
description: Fixture
---

## Intro {#intro}

\`\`\`norna-image-stack
- image: hero.jpg
~~~
`);

		await assert.rejects(
			() => runContentScript(siteDir, ['--check']),
			(error) => {
				assert.match(error.output, /This Norna image block was started on line \d+ but not closed\./);
				assert.match(error.output, /Add a closing ``` line after the last image entry\./);
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
		await writeFile(path.join(siteDir, 'content.md'), `---
title: Multiple Issues
description: Fixture
---

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
				assert.match(error.output, /Image "missing-intro\.jpg" does not exist at .*site\/images\/intro\/missing-intro\.jpg or anywhere under .*site\/images\//);
				assert.match(error.output, /Image "missing-more\.jpg" does not exist at .*site\/images\/more\/missing-more\.jpg or anywhere under .*site\/images\//);
				return true;
			},
		);
	} finally {
		await rm(root, { recursive: true, force: true });
	}
});

test('content:check allows Norna images without alt text', async () => {
	const { root, siteDir } = await createTempSite();
	try {
		await mkdir(path.join(siteDir, 'images', 'intro'), { recursive: true });
		await writeFile(path.join(siteDir, 'images', 'intro', 'hero.jpg'), 'fixture image');
		await writeFile(path.join(siteDir, 'content.md'), `---
title: Missing Alt
description: Fixture
---

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
		await writeFile(path.join(siteDir, 'content.md'), `---
title: Beginner Errors
description: Fixture
---

## Plain {#plain}

\`\`\`norna-image-carousel
 - image: foo.jpg
\`\`\`
`);

		await assert.rejects(
			() => runContentScript(siteDir, ['--check']),
			(error) => {
				assert.match(error.output, /norna-image-carousel on line \d+ contains 1 image\. A carousel needs at least two images\./);
				assert.match(error.output, /Image "foo\.jpg" does not exist at .*site\/images\/plain\/foo\.jpg or anywhere under .*site\/images\//);
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
		await writeFile(path.join(siteDir, 'content.md'), `---
title: Missing Image
description: Fixture
---

## Intro {#intro}

\`\`\`norna-image-stack
- image: missing.jpg
  alt: Missing
\`\`\`
`);

		await assert.rejects(
			() => runContentScript(siteDir, ['--check']),
			(error) => {
				assert.match(error.output, /Image "missing\.jpg" does not exist at .*site\/images\/intro\/missing\.jpg or anywhere under .*site\/images\//);
				return true;
			},
		);
	} finally {
		await rm(root, { recursive: true, force: true });
	}
});

test('content:check fails when a page repeats a section id', async () => {
	const { root, siteDir } = await createTempSite();
	try {
		await writeFile(path.join(siteDir, 'content.md'), `---
title: Duplicate Section
description: Fixture
---

## Intro {#intro}

First.

## Again {#intro}

Second.
`);

		await assert.rejects(
			() => runContentScript(siteDir, ['--check']),
			(error) => {
				assert.match(error.output, /Duplicate Markdown section heading id "intro"\./);
				return true;
			},
		);
	} finally {
		await rm(root, { recursive: true, force: true });
	}
});

test('content:check fails when section metadata has no Markdown section', async () => {
	const { root, siteDir } = await createTempSite();
	try {
		await writeFile(path.join(siteDir, 'content.md'), `---
title: Orphaned Metadata
description: Fixture
sections:
  missing: {}
---

## Intro {#intro}

Text.
`);

		await assert.rejects(
			() => runContentScript(siteDir, ['--check']),
			(error) => {
				assert.match(error.output, /Section metadata "missing" does not match any Markdown section\./);
				return true;
			},
		);
	} finally {
		await rm(root, { recursive: true, force: true });
	}
});

test('content:sync refuses ambiguous page-local image relocation', async () => {
	const { root, siteDir } = await createTempSite();
	try {
		await writeFile(path.join(siteDir, 'content.md'), `---
title: Ambiguous Move
description: Fixture
---

## Work {#work}

\`\`\`norna-image-stack
- image: shared.jpg
  alt: Shared
\`\`\`
`);
		await mkdir(path.join(siteDir, 'images', 'old-a'), { recursive: true });
		await mkdir(path.join(siteDir, 'images', 'old-b'), { recursive: true });
		await writeFile(path.join(siteDir, 'images', 'old-a', 'shared.jpg'), 'a');
		await writeFile(path.join(siteDir, 'images', 'old-b', 'shared.jpg'), 'b');

		await assert.rejects(
			() => runContentScript(siteDir, ['--write', '--yes']),
			(error) => {
				assert.match(error.output, /Cannot relocate "shared\.jpg"\. Multiple files with this filename were found:/);
				assert.match(error.output, /site\/images\/old-a\/shared\.jpg/);
				assert.match(error.output, /site\/images\/old-b\/shared\.jpg/);
				return true;
			},
		);

		assert.equal(await fileExists(path.join(siteDir, 'images', 'work', 'shared.jpg')), false);
		assert.equal(await fileExists(path.join(siteDir, 'images', 'old-a', 'shared.jpg')), true);
		assert.equal(await fileExists(path.join(siteDir, 'images', 'old-b', 'shared.jpg')), true);
	} finally {
		await rm(root, { recursive: true, force: true });
	}
});

test('content:sync refuses to move an image still referenced by its current section', async () => {
	const { root, siteDir } = await createTempSite();
	try {
		await writeFile(path.join(siteDir, 'content.md'), `---
title: Copied Image Reference
description: Fixture
---

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
		await mkdir(path.join(siteDir, 'images', 'intro'), { recursive: true });
		await writeFile(path.join(siteDir, 'images', 'intro', 'shared.jpg'), 'shared image');

		await assert.rejects(
			() => runContentScript(siteDir, ['--write', '--yes']),
			(error) => {
				assert.match(error.output, /Cannot relocate "shared\.jpg" from .*site\/images\/intro\/shared\.jpg because it is still referenced from .*site\/content\.md \[intro\]\./);
				return true;
			},
		);

		assert.equal(await fileExists(path.join(siteDir, 'images', 'intro', 'shared.jpg')), true);
		assert.equal(await fileExists(path.join(siteDir, 'images', 'plain', 'shared.jpg')), false);
	} finally {
		await rm(root, { recursive: true, force: true });
	}
});
