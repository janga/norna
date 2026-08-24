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
	await writeFile(path.join(siteDir, 'config.yaml'), 'url: https://example.com/\n');
	await writeFile(path.join(siteDir, 'theme.yaml'), `typography:
  profile: reading
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
		assert.ok(manifest['images/duplicate.jpg']);
		assert.ok(manifest['pages/010-guide/images/duplicate.jpg']);

		const homepageHtml = await readFile(path.join(path.dirname(siteDir), 'dist', 'index.html'), 'utf8');
		assert.match(homepageHtml, /site-section-page-title/);
		assert.match(homepageHtml, /site-section-page-title-empty/);
		assert.match(homepageHtml, /fetchpriority="high"/);
	} finally {
		await rm(root, { recursive: true, force: true });
	}
});

test('the removed routes directory is rejected with a page migration hint', async () => {
	const { root, siteDir } = await createTempSite();
	try {
		await writeFile(path.join(siteDir, 'content.md'), `# Home
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

test('page theme replaces visual theme without changing site navigation', async () => {
	const { root, siteDir } = await createTempSite({ underRepoCache: true });
	try {
		await writeFile(path.join(siteDir, 'theme.yaml'), `typography:
  profile: reading
`);
		await mkdir(path.join(siteDir, 'pages', '010-guide'), { recursive: true });
		await writeFile(path.join(siteDir, 'content.md'), `---
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
		await writeFile(path.join(siteDir, 'pages', '010-guide', 'theme.yaml'), `typography:
  profile: statement
palette: light
`);

		await runNorna(['--site-dir', siteDir, 'build']);
		const rootHtml = await readFile(path.join(path.dirname(siteDir), 'dist', 'index.html'), 'utf8');
		const pageHtml = await readFile(path.join(path.dirname(siteDir), 'dist', 'guide', 'index.html'), 'utf8');
		assert.match(rootHtml, /--color-page: #000000/);
		assert.match(pageHtml, /--color-page: #ffffff/);
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
		await writeFile(path.join(siteDir, 'content.md'), `# Welcome

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
		await writeFile(path.join(siteDir, 'content.md'), `---
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
		await writeFile(path.join(siteDir, 'content.md'), `---
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

test('content:check warns for local Markdown images but not external Markdown images', async () => {
	const { root, siteDir } = await createTempSite();
	try {
		await writeFile(path.join(siteDir, 'content.md'), `---
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
		await writeFile(path.join(siteDir, 'content.md'), `---
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
		await mkdir(path.join(siteDir, 'images'), { recursive: true });
		await writeFile(path.join(siteDir, 'images', 'diagram.svg'), '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 620"><rect width="900" height="620"/></svg>\n');

		await runContentScript(siteDir, ['--check']);
		await runNorna(['--site-dir', siteDir, 'images']);

		const manifest = JSON.parse(await readFile(path.join(siteDir, '.norna', 'generated-images.json'), 'utf8'));
		const entry = manifest['images/diagram.svg'];
		assert.equal(entry.kind, 'static');
		assert.equal(entry.width, 900);
		assert.equal(entry.height, 620);
		assert.match(entry.src, /^\/images\/original\/images\/diagram-[a-f0-9]{8}\.svg$/);
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
page:
  description: Fixture
---

# Inline notes

## Intro {#intro}

The first paragraph points to an explanation.{note-ref}

{note: This explanation names \`sitewide-content.yaml\` and stays beside the
paragraph on wide screens.}

The second paragraph has its own explanation.{note-ref}

{note:
  This is the second
  explanation.
}
`);

		await runNorna(['--site-dir', siteDir, 'build']);
		const html = await readFile(path.join(path.dirname(siteDir), 'dist', 'index.html'), 'utf8');
		assert.match(html, /<sup class="section-note-ref"><a id="note-ref-home-intro-1" href="#note-home-intro-1" aria-label="Note 1" aria-describedby="note-home-intro-1" data-note-id="note-home-intro-1">1<\/a><\/sup>/);
		assert.match(html, /<aside class="section-note section-note-margin" id="note-home-intro-1" aria-label="Note 1" role="note" data-note-id="note-home-intro-1" style="grid-row: 1;">/);
		assert.match(html, /<a class="section-note-number" href="#note-ref-home-intro-1" aria-label="Note 1">\s*1\s*<\/a>/);
		assert.match(html, /This explanation names <code>sitewide-content\.yaml<\/code> and stays beside the paragraph on wide screens\./);
		assert.match(html, /<sup class="section-note-ref"><a id="note-ref-home-intro-2" href="#note-home-intro-2" aria-label="Note 2" aria-describedby="note-home-intro-2" data-note-id="note-home-intro-2">2<\/a><\/sup>/);
		assert.match(html, /<aside class="section-note section-note-margin" id="note-home-intro-2" aria-label="Note 2" role="note" data-note-id="note-home-intro-2" style="grid-row: 2;">/);
		assert.match(html, /This is the second explanation\./);
		assert.doesNotMatch(html, /\{note:/);
	} finally {
		await rm(root, { recursive: true, force: true });
	}
});

test('updated managed SVG images get updated static output', async () => {
	const { root, siteDir } = await createTempSite();
	try {
		await writeFile(path.join(siteDir, 'content.md'), `---
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
		await mkdir(path.join(siteDir, 'images'), { recursive: true });
		const sourcePath = path.join(siteDir, 'images', 'diagram.svg');
		await writeFile(sourcePath, '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 620"><rect width="900" height="620" fill="red"/></svg>\n');

		await runContentScript(siteDir, ['--check']);
		await runNorna(['--site-dir', siteDir, 'images']);

		const firstManifest = JSON.parse(await readFile(path.join(siteDir, '.norna', 'generated-images.json'), 'utf8'));
		const firstEntry = firstManifest['images/diagram.svg'];
		const firstOutputPath = path.join(siteDir, '.norna', 'public', firstEntry.src.replace(/^\//, ''));

		await writeFile(sourcePath, '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 620"><rect width="900" height="620" fill="blue"/></svg>\n');
		await runNorna(['--site-dir', siteDir, 'images']);

		const secondManifest = JSON.parse(await readFile(path.join(siteDir, '.norna', 'generated-images.json'), 'utf8'));
		const secondEntry = secondManifest['images/diagram.svg'];
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
		await mkdir(path.join(siteDir, 'images'), { recursive: true });
		await writeFile(path.join(siteDir, 'images', 'first.svg'), '<svg xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100"/></svg>\n');
		await writeFile(path.join(siteDir, 'images', 'second.svg'), '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100"/></svg>\n');

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
		await mkdir(path.join(siteDir, 'images'), { recursive: true });
		await writeFile(path.join(siteDir, 'images', 'adopt.svg'), '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 100"><rect width="160" height="100"/></svg>\n');

		const { stdout } = await runContentScript(siteDir, ['--check']);
		assert.match(stdout, /Content check passed\./);

		await runNorna(['--site-dir', siteDir, 'images']);
		const manifest = JSON.parse(await readFile(path.join(siteDir, '.norna', 'generated-images.json'), 'utf8'));
		assert.equal(manifest['images/adopt.svg'].kind, 'static');

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
		assert.match(html, /src="\/images\/original\/images\/adopt-[a-f0-9]{8}\.svg"/);
	} finally {
		await rm(root, { recursive: true, force: true });
	}
});

test('content:check fails when a norna-card-list image file is missing', async () => {
	const { root, siteDir } = await createTempSite();
	try {
		await writeFile(path.join(siteDir, 'content.md'), `---
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
				assert.match(error.output, /Image "missing\.svg" does not exist at .*site\/images\/missing\.svg or anywhere under any page image root\./);
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
		await writeFile(path.join(siteDir, 'content.md'), `---
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
		await writeFile(path.join(siteDir, 'content.md'), `---
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
		await writeFile(path.join(siteDir, 'content.md'), `---
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

test('content:sync moves Norna-managed images inside the same page image root', async () => {
	const { root, siteDir } = await createTempSite();
	try {
		await writeFile(path.join(siteDir, 'content.md'), `---
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
		await mkdir(path.join(siteDir, 'images', 'old'), { recursive: true });
		await writeFile(path.join(siteDir, 'images', 'old', 'moved.jpg'), 'fixture image');

		await runContentScript(siteDir, ['--write', '--yes']);

		const moved = await readFile(path.join(siteDir, 'images', 'moved.jpg'), 'utf8');
		assert.equal(moved, 'fixture image');
	} finally {
		await rm(root, { recursive: true, force: true });
	}
});

test('content:sync moves managed SVG images inside the same page image root', async () => {
	const { root, siteDir } = await createTempSite();
	try {
		await writeFile(path.join(siteDir, 'content.md'), `---
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
		await mkdir(path.join(siteDir, 'images', 'old'), { recursive: true });
		await writeFile(path.join(siteDir, 'images', 'old', 'moved.svg'), '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"></svg>\n');

		await runContentScript(siteDir, ['--write', '--yes']);

		const moved = await readFile(path.join(siteDir, 'images', 'moved.svg'), 'utf8');
		assert.match(moved, /viewBox="0 0 10 10"/);
	} finally {
		await rm(root, { recursive: true, force: true });
	}
});

test('content:sync moves Norna-managed images across page image roots when git is clean', async () => {
	const { root, siteDir } = await createTempSite();
	try {
		const sourcePageDir = path.join(siteDir, 'pages', '010-source');
		const targetPageDir = path.join(siteDir, 'pages', '020-target');
		await mkdir(path.join(sourcePageDir, 'images'), { recursive: true });
		await mkdir(targetPageDir, { recursive: true });
		await writeFile(path.join(siteDir, 'content.md'), `---
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
		await initCleanGitWorktree(root);

		await runContentScript(siteDir, ['--write', '--yes']);

		assert.equal(await fileExists(path.join(targetPageDir, 'images', 'moved.jpg')), true);
		assert.equal(await fileExists(path.join(sourcePageDir, 'images', 'moved.jpg')), false);
	} finally {
		await rm(root, { recursive: true, force: true });
	}
});

test('content:sync refuses cross-page image moves when git status is dirty', async () => {
	const { root, siteDir } = await createTempSite();
	try {
		const sourcePageDir = path.join(siteDir, 'pages', '010-source');
		const targetPageDir = path.join(siteDir, 'pages', '020-target');
		await mkdir(path.join(sourcePageDir, 'images'), { recursive: true });
		await mkdir(targetPageDir, { recursive: true });
		await writeFile(path.join(siteDir, 'content.md'), `---
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

		await assert.rejects(
			() => runContentScript(siteDir, ['--write', '--yes']),
			(error) => {
				assert.match(error.output, /Cross-page content sync requires a clean git working tree before moving files between page image roots\./);
				assert.match(error.output, /dirty\.txt/);
				return true;
			},
		);

		assert.equal(await fileExists(path.join(targetPageDir, 'images', 'moved.jpg')), false);
		assert.equal(await fileExists(path.join(sourcePageDir, 'images', 'moved.jpg')), true);
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
		await writeFile(path.join(siteDir, 'content.md'), `---
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
		await writeFile(path.join(siteDir, 'content.md'), `---
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
		await initCleanGitWorktree(root);

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
		await writeFile(path.join(siteDir, 'content.md'), `---
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
		await mkdir(path.join(siteDir, 'images', 'old'), { recursive: true });
		await cp(path.join(fixtureSiteDir, 'images', 'hero.jpg'), path.join(siteDir, 'images', 'old', 'slide-one.jpg'));
		await cp(path.join(fixtureSiteDir, 'images', 'detail.jpg'), path.join(siteDir, 'images', 'slide-two.jpg'), { force: true });

		await runNorna(['--site-dir', siteDir, 'content:sync', '--yes']);

		const manifest = JSON.parse(await readFile(path.join(siteDir, '.norna', 'generated-images.json'), 'utf8'));
		assert.equal(await fileExists(path.join(siteDir, 'images', 'slide-one.jpg')), true);
		assert.ok(manifest['images/slide-one.jpg']);
		assert.ok(manifest['images/slide-two.jpg']);
	} finally {
		await rm(root, { recursive: true, force: true });
	}
});

test('automatic H2 and H3 ids render while explicit ids remain stable', async () => {
	const { root, siteDir } = await createTempSite({ underRepoCache: true });
	try {
		await writeFile(path.join(siteDir, 'content.md'), `---
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

test('content:check fails for malformed Norna image blocks', async () => {
	const { root, siteDir } = await createTempSite();
	try {
		await writeFile(path.join(siteDir, 'content.md'), `---
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
		await mkdir(path.join(siteDir, 'images', 'plain'), { recursive: true });
		await writeFile(path.join(siteDir, 'images', 'plain', 'image.jpg'), 'fixture image');
		await writeFile(path.join(siteDir, 'content.md'), `---
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
		await writeFile(path.join(siteDir, 'content.md'), `---
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
		await mkdir(path.join(siteDir, 'images'), { recursive: true });
		await writeFile(path.join(siteDir, 'images', 'hero.jpg'), 'fixture image');
		await writeFile(path.join(siteDir, 'content.md'), `---
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
		await writeFile(path.join(siteDir, 'content.md'), `---
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
		await writeFile(path.join(siteDir, 'content.md'), `---
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
		await writeFile(path.join(siteDir, 'content.md'), `---
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
		await writeFile(path.join(siteDir, 'content.md'), `---
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
		await writeFile(path.join(siteDir, 'content.md'), `---
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
				assert.match(error.output, /Image "missing-intro\.jpg" does not exist at .*site\/images\/missing-intro\.jpg or anywhere under any page image root\./);
				assert.match(error.output, /Image "missing-more\.jpg" does not exist at .*site\/images\/missing-more\.jpg or anywhere under any page image root\./);
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
		await mkdir(path.join(siteDir, 'images'), { recursive: true });
		await writeFile(path.join(siteDir, 'images', 'hero.jpg'), 'fixture image');
		await writeFile(path.join(siteDir, 'content.md'), `---
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
		await writeFile(path.join(siteDir, 'content.md'), `---
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
				assert.match(error.output, /Image "foo\.jpg" does not exist at .*site\/images\/foo\.jpg or anywhere under any page image root\./);
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
				assert.match(error.output, /Image "missing\.jpg" does not exist at .*site\/images\/missing\.jpg or anywhere under any page image root\./);
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
		await writeFile(path.join(siteDir, 'content.md'), `---
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
		await writeFile(path.join(siteDir, 'content.md'), `---
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

test('content:sync refuses ambiguous image relocation', async () => {
	const { root, siteDir } = await createTempSite();
	try {
		await writeFile(path.join(siteDir, 'content.md'), `---
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

		assert.equal(await fileExists(path.join(siteDir, 'images', 'shared.jpg')), false);
		assert.equal(await fileExists(path.join(siteDir, 'images', 'old-a', 'shared.jpg')), true);
		assert.equal(await fileExists(path.join(siteDir, 'images', 'old-b', 'shared.jpg')), true);
	} finally {
		await rm(root, { recursive: true, force: true });
	}
});

test('content:sync moves one page-local image once when multiple sections reference it', async () => {
	const { root, siteDir } = await createTempSite();
	try {
		await writeFile(path.join(siteDir, 'content.md'), `---
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
		await mkdir(path.join(siteDir, 'images', 'intro'), { recursive: true });
		await writeFile(path.join(siteDir, 'images', 'intro', 'shared.jpg'), 'shared image');

		await runContentScript(siteDir, ['--write', '--yes']);

		assert.equal(await fileExists(path.join(siteDir, 'images', 'intro', 'shared.jpg')), false);
		assert.equal(await fileExists(path.join(siteDir, 'images', 'shared.jpg')), true);
		await runContentScript(siteDir, ['--check']);
	} finally {
		await rm(root, { recursive: true, force: true });
	}
});
