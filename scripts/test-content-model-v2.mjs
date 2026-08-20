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

const createTempSite = async ({ underRepoCache = false } = {}) => {
	const tempParent = underRepoCache
		? path.join(repoRoot, 'node_modules', '.cache')
		: os.tmpdir();
	await mkdir(tempParent, { recursive: true });
	const root = await mkdtemp(path.join(tempParent, 'norna-content-model-v2-'));
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

const runGit = async (cwd, args) => execFileAsync('git', args, {
	cwd,
	env: {
		...process.env,
		GIT_AUTHOR_NAME: 'Norna Test',
		GIT_AUTHOR_EMAIL: 'norna@example.test',
		GIT_COMMITTER_NAME: 'Norna Test',
		GIT_COMMITTER_EMAIL: 'norna@example.test',
	},
	maxBuffer: 1024 * 1024,
});

const initCleanGitWorktree = async (root) => {
	await runGit(root, ['init']);
	await runGit(root, ['config', 'user.email', 'norna@example.test']);
	await runGit(root, ['config', 'user.name', 'Norna Test']);
	await runGit(root, ['add', '.']);
	await runGit(root, ['commit', '-m', 'initial']);
};

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

test('route theme replaces visual theme while site identity stays at the root', async () => {
	const { root, siteDir } = await createTempSite({ underRepoCache: true });
	try {
		await writeFile(path.join(siteDir, 'theme.md'), `---
navigation:
  brand: Root Brand
typography:
  preset: text-forward
---
`);
		await mkdir(path.join(siteDir, 'routes', '010-guide'), { recursive: true });
		await writeFile(path.join(siteDir, 'content.md'), `---
title: Root
description: Root page
---

## Home {#home}

Root content.
`);
		await writeFile(path.join(siteDir, 'routes', '010-guide', 'route-content.md'), `---
title: Guide
description: Guide page
navigation:
  label: Guide
---

## Guide {#guide}

Route content.
`);
		await writeFile(path.join(siteDir, 'routes', '010-guide', 'theme.md'), `---
typography:
  preset: statement
presentation:
  palette: light
---
`);

		await runNorna(['--site-dir', siteDir, 'build']);
		const rootHtml = await readFile(path.join(path.dirname(siteDir), 'dist', 'index.html'), 'utf8');
		const routeHtml = await readFile(path.join(path.dirname(siteDir), 'dist', 'guide', 'index.html'), 'utf8');
		assert.match(rootHtml, /--color-page: #000000/);
		assert.match(routeHtml, /--color-page: #ffffff/);
		assert.match(routeHtml, /<a class="site-brand" href="\/">Root Brand<\/a>/);
	} finally {
		await rm(root, { recursive: true, force: true });
	}
});

test('route theme cannot define site identity', async () => {
	const { root, siteDir } = await createTempSite({ underRepoCache: true });
	try {
		await mkdir(path.join(siteDir, 'routes', '010-guide'), { recursive: true });
		await writeFile(path.join(siteDir, 'content.md'), `---
title: Root
description: Root page
---

## Home {#home}

Root content.
`);
		await writeFile(path.join(siteDir, 'routes', '010-guide', 'route-content.md'), `---
title: Guide
description: Guide page
---

## Guide {#guide}

Route content.
`);
		await writeFile(path.join(siteDir, 'routes', '010-guide', 'theme.md'), `---
navigation:
  brand: Route Brand
---
`);

		await assert.rejects(
			runNorna(['--site-dir', siteDir, 'config:check']),
			(error) => {
				assert.match(error.output, /may not define navigation\. Brand and logo belong in site\/theme\.md/);
				return true;
			},
		);
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

test('inline notes render as linked numbered margin notes', async () => {
	const { root, siteDir } = await createTempSite({ underRepoCache: true });
	try {
		await writeFile(path.join(siteDir, 'content.md'), `---
title: Inline notes
description: Fixture
---

## Intro {#intro}

The paragraph points to an explanation.{note-ref}

{note: This explanation is kept beside the paragraph on wide screens.}
`);

		await runNorna(['--site-dir', siteDir, 'build']);
		const html = await readFile(path.join(path.dirname(siteDir), 'dist', 'index.html'), 'utf8');
		assert.match(html, /<sup class="section-note-ref"><a id="note-ref-home-intro-1" href="#note-home-intro-1" aria-label="Note 1">1<\/a><\/sup>/);
		assert.match(html, /<aside class="section-note section-note-margin" id="note-home-intro-1" aria-label="Note">/);
		assert.match(html, /<a class="section-note-number" href="#note-ref-home-intro-1" aria-label="Note 1">\s*1\s*<\/a>/);
		assert.match(html, /This explanation is kept beside the paragraph on wide screens\./);
		assert.doesNotMatch(html, /\{note:/);
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

test('norna-card-list images are managed image references', async () => {
	const { root, siteDir } = await createTempSite({ underRepoCache: true });
	try {
		await writeFile(path.join(siteDir, 'content.md'), `---
title: Card List Fixture
description: Fixture
---

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
		await mkdir(path.join(siteDir, 'images', 'help'), { recursive: true });
		await writeFile(path.join(siteDir, 'images', 'help', 'adopt.svg'), '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 100"><rect width="160" height="100"/></svg>\n');

		const { stdout } = await runContentScript(siteDir, ['--check']);
		assert.match(stdout, /Content check passed\./);

		await runNorna(['--site-dir', siteDir, 'images']);
		const manifest = JSON.parse(await readFile(path.join(siteDir, '.norna', 'generated-images.json'), 'utf8'));
		assert.equal(manifest['images/help/adopt.svg'].kind, 'static');

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
		assert.match(html, /src="\/images\/original\/images\/help\/adopt-[a-f0-9]{8}\.svg"/);
	} finally {
		await rm(root, { recursive: true, force: true });
	}
});

test('content:check fails when a norna-card-list image file is missing', async () => {
	const { root, siteDir } = await createTempSite();
	try {
		await writeFile(path.join(siteDir, 'content.md'), `---
title: Missing Card Image
description: Fixture
---

## Help {#help}

\`\`\`norna-card-list
- title: Adopt
  image: missing.svg
\`\`\`
`);

		await assert.rejects(
			() => runContentScript(siteDir, ['--check']),
			(error) => {
				assert.match(error.output, /Image "missing\.svg" does not exist at .*site\/images\/help\/missing\.svg or anywhere under any page or route image root\./);
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
		await writeFile(path.join(siteDir, 'content.md'), `---
title: Malformed Card List
description: Fixture
---

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
		await writeFile(path.join(siteDir, 'content.md'), `---
title: Invalid Card List Options
description: Fixture
---

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
		await writeFile(path.join(siteDir, 'content.md'), `---
title: Invalid Card List Width
description: Fixture
---

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
		await writeFile(path.join(siteDir, 'content.md'), `---
title: Invalid Card List Size
description: Fixture
---

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

test('content:sync moves Norna-managed images across route image roots when git is clean', async () => {
	const { root, siteDir } = await createTempSite();
	try {
		const sourceRouteDir = path.join(siteDir, 'routes', '010-source');
		const targetRouteDir = path.join(siteDir, 'routes', '020-target');
		await mkdir(path.join(sourceRouteDir, 'images', 'old'), { recursive: true });
		await mkdir(targetRouteDir, { recursive: true });
		await writeFile(path.join(siteDir, 'content.md'), `---
title: Cross Route Sync
description: Fixture
---

## Home {#home}

Text.
`);
		await writeFile(path.join(sourceRouteDir, 'route-content.md'), `---
title: Source
description: Fixture
---

## Old {#old}

Text.
`);
		await writeFile(path.join(targetRouteDir, 'route-content.md'), `---
title: Target
description: Fixture
---

## Work {#work}

\`\`\`norna-image-stack
- image: moved.jpg
\`\`\`
`);
		await writeFile(path.join(sourceRouteDir, 'images', 'old', 'moved.jpg'), 'route image');
		await initCleanGitWorktree(root);

		await runContentScript(siteDir, ['--write', '--yes']);

		assert.equal(await fileExists(path.join(targetRouteDir, 'images', 'work', 'moved.jpg')), true);
		assert.equal(await fileExists(path.join(sourceRouteDir, 'images', 'old', 'moved.jpg')), false);
	} finally {
		await rm(root, { recursive: true, force: true });
	}
});

test('content:sync refuses cross-route image moves when git status is dirty', async () => {
	const { root, siteDir } = await createTempSite();
	try {
		const sourceRouteDir = path.join(siteDir, 'routes', '010-source');
		const targetRouteDir = path.join(siteDir, 'routes', '020-target');
		await mkdir(path.join(sourceRouteDir, 'images', 'old'), { recursive: true });
		await mkdir(targetRouteDir, { recursive: true });
		await writeFile(path.join(siteDir, 'content.md'), `---
title: Dirty Cross Route Sync
description: Fixture
---

## Home {#home}

Text.
`);
		await writeFile(path.join(sourceRouteDir, 'route-content.md'), `---
title: Source
description: Fixture
---

## Old {#old}

Text.
`);
		await writeFile(path.join(targetRouteDir, 'route-content.md'), `---
title: Target
description: Fixture
---

## Work {#work}

\`\`\`norna-image-stack
- image: moved.jpg
\`\`\`
`);
		await writeFile(path.join(sourceRouteDir, 'images', 'old', 'moved.jpg'), 'route image');
		await initCleanGitWorktree(root);
		await writeFile(path.join(root, 'dirty.txt'), 'dirty');

		await assert.rejects(
			() => runContentScript(siteDir, ['--write', '--yes']),
			(error) => {
				assert.match(error.output, /Cross-route content sync requires a clean git working tree before moving files between page or route image roots\./);
				assert.match(error.output, /dirty\.txt/);
				return true;
			},
		);

		assert.equal(await fileExists(path.join(targetRouteDir, 'images', 'work', 'moved.jpg')), false);
		assert.equal(await fileExists(path.join(sourceRouteDir, 'images', 'old', 'moved.jpg')), true);
	} finally {
		await rm(root, { recursive: true, force: true });
	}
});

test('content:check reports cross-route image moves without requiring clean git status', async () => {
	const { root, siteDir } = await createTempSite();
	try {
		const sourceRouteDir = path.join(siteDir, 'routes', '010-source');
		const targetRouteDir = path.join(siteDir, 'routes', '020-target');
		await mkdir(path.join(sourceRouteDir, 'images', 'old'), { recursive: true });
		await mkdir(targetRouteDir, { recursive: true });
		await writeFile(path.join(siteDir, 'content.md'), `---
title: Cross Route Check
description: Fixture
---

## Home {#home}

Text.
`);
		await writeFile(path.join(sourceRouteDir, 'route-content.md'), `---
title: Source
description: Fixture
---

## Old {#old}

Text.
`);
		await writeFile(path.join(targetRouteDir, 'route-content.md'), `---
title: Target
description: Fixture
---

## Work {#work}

\`\`\`norna-image-stack
- image: moved.jpg
\`\`\`
`);
		await writeFile(path.join(sourceRouteDir, 'images', 'old', 'moved.jpg'), 'route image');
		await writeFile(path.join(root, 'dirty.txt'), 'dirty');

		await assert.rejects(
			() => runContentScript(siteDir, ['--check']),
			(error) => {
				assert.match(error.output, /Image "moved\.jpg" is used here but is located in .*site\/routes\/010-source\/images\/old\/moved\.jpg\./);
				assert.match(error.output, /Run norna content:sync to move it from .*site\/routes\/010-source to .*site\/routes\/020-target\./);
				assert.doesNotMatch(error.output, /requires a clean git working tree before moving files/);
				return true;
			},
		);
	} finally {
		await rm(root, { recursive: true, force: true });
	}
});

test('content:sync refuses to move a cross-route image still referenced by its current section', async () => {
	const { root, siteDir } = await createTempSite();
	try {
		const sourceRouteDir = path.join(siteDir, 'routes', '010-source');
		const targetRouteDir = path.join(siteDir, 'routes', '020-target');
		await mkdir(path.join(sourceRouteDir, 'images', 'old'), { recursive: true });
		await mkdir(targetRouteDir, { recursive: true });
		await writeFile(path.join(siteDir, 'content.md'), `---
title: Cross Route Copy
description: Fixture
---

## Home {#home}

Text.
`);
		await writeFile(path.join(sourceRouteDir, 'route-content.md'), `---
title: Source
description: Fixture
---

## Old {#old}

\`\`\`norna-image-stack
- image: shared.jpg
\`\`\`
`);
		await writeFile(path.join(targetRouteDir, 'route-content.md'), `---
title: Target
description: Fixture
---

## Work {#work}

\`\`\`norna-image-stack
- image: shared.jpg
\`\`\`
`);
		await writeFile(path.join(sourceRouteDir, 'images', 'old', 'shared.jpg'), 'route image');

		await assert.rejects(
			() => runContentScript(siteDir, ['--write', '--yes']),
			(error) => {
				assert.match(error.output, /Cannot relocate "shared\.jpg" from .*site\/routes\/010-source\/images\/old\/shared\.jpg because it is still referenced from .*site\/routes\/010-source\/route-content\.md \[old\]\./);
				return true;
			},
		);

		assert.equal(await fileExists(path.join(targetRouteDir, 'images', 'work', 'shared.jpg')), false);
		assert.equal(await fileExists(path.join(sourceRouteDir, 'images', 'old', 'shared.jpg')), true);
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
		await writeFile(path.join(siteDir, 'content.md'), `---
title: Removed note block
description: Fixture
---

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
				assert.match(error.output, /Image "missing-intro\.jpg" does not exist at .*site\/images\/intro\/missing-intro\.jpg or anywhere under any page or route image root\./);
				assert.match(error.output, /Image "missing-more\.jpg" does not exist at .*site\/images\/more\/missing-more\.jpg or anywhere under any page or route image root\./);
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
				assert.match(error.output, /Image "foo\.jpg" does not exist at .*site\/images\/plain\/foo\.jpg or anywhere under any page or route image root\./);
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
				assert.match(error.output, /Image "missing\.jpg" does not exist at .*site\/images\/intro\/missing\.jpg or anywhere under any page or route image root\./);
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

test('content:sync refuses ambiguous image relocation', async () => {
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
