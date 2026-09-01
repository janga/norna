import assert from 'node:assert/strict';
import { access, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const syncScript = path.join(repoRoot, 'scripts', 'sync-site-public.mjs');
const tests = [];

const test = (name, run) => {
	tests.push({ name, run });
};

const fileExists = async (filePath) => access(filePath).then(() => true, () => false);

const runSyncScript = (root, env = {}) => spawnSync(process.execPath, [syncScript], {
	cwd: root,
	encoding: 'utf8',
	env: {
		...process.env,
		...env,
	},
});

const getOutput = (result) => `${result.stdout}${result.stderr}`;

const writeFixtureFile = async (root, relativePath, contents) => {
	const filePath = path.join(root, relativePath);
	await mkdir(path.dirname(filePath), { recursive: true });
	await writeFile(filePath, contents);
};

const readFixtureFile = (root, relativePath) => readFile(path.join(root, relativePath), 'utf8');

const writeSiteFiles = async (root, siteDirectory = 'custom-site') => {
	await writeFixtureFile(root, `${siteDirectory}/config.yaml`, 'url: https://example.com/docs/\n');
	await writeFixtureFile(root, `${siteDirectory}/theme.yaml`, 'preset: documentation\n');
	await writeFixtureFile(root, `${siteDirectory}/pages/000-home/content.md`, '# Home\n');
};

const withTempProject = async (run) => {
	const root = await mkdtemp(path.join(tmpdir(), 'walde-site-public-'));

	try {
		await run(root);
	} finally {
		await rm(root, { force: true, recursive: true });
	}
};

test('site:public copies configured public files, removes stale generated public files, and keeps images output', async () => {
	await withTempProject(async (root) => {
		await writeSiteFiles(root);
		await writeFixtureFile(root, 'custom-site/pages/010-zeta/content.md', '# Zeta\n');
		await writeFixtureFile(root, 'custom-site/pages/020-guides/category.yaml', 'label: Guides\n');
		await writeFixtureFile(root, 'custom-site/pages/020-guides/pages/010-installation/content.md', '# Installation\n');
		await writeFixtureFile(root, 'custom-site/pages/030-hidden/content.md', `---
navigation:
  listed: false
---

# Hidden
`);
		await writeFixtureFile(root, 'custom-site/public/CNAME', 'example.com\n');
		await writeFixtureFile(root, 'custom-site/public/robots.txt', 'User-agent: *\nAllow: /\n');
		await writeFixtureFile(root, 'custom-site/public/nested/source.txt', 'source file\n');
		await writeFixtureFile(root, 'custom-site/.norna/public/stale.txt', 'stale generated file\n');
		await writeFixtureFile(root, 'custom-site/.norna/public/nested/old.txt', 'stale nested file\n');
		await writeFixtureFile(root, 'custom-site/.norna/public/images/generated/keep.webp', 'generated image\n');

		const result = runSyncScript(root, { NORNA_SITE_DIR: 'custom-site' });
		const output = getOutput(result);

		assert.equal(result.status, 0, output);
		assert.match(output, /Synced custom-site\/public\/ to custom-site\/\.norna\/public\/\./);
		assert.equal(await readFixtureFile(root, 'custom-site/.norna/public/CNAME'), 'example.com\n');
		assert.equal(await readFixtureFile(root, 'custom-site/.norna/public/robots.txt'), 'User-agent: *\nAllow: /\n');
		assert.equal(await readFixtureFile(root, 'custom-site/.norna/public/nested/source.txt'), 'source file\n');
		assert.equal(await readFixtureFile(root, 'custom-site/.norna/public/sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://example.com/docs/</loc>
  </url>
  <url>
    <loc>https://example.com/docs/guides/installation/</loc>
  </url>
  <url>
    <loc>https://example.com/docs/hidden/</loc>
  </url>
  <url>
    <loc>https://example.com/docs/zeta/</loc>
  </url>
</urlset>
`);
		assert.equal(await fileExists(path.join(root, 'custom-site/.norna/public/stale.txt')), false);
		assert.equal(await fileExists(path.join(root, 'custom-site/.norna/public/nested/old.txt')), false);
		assert.equal(await readFixtureFile(root, 'custom-site/.norna/public/images/generated/keep.webp'), 'generated image\n');
	});
});

test('site:public rejects a source sitemap before changing generated public output', async () => {
	await withTempProject(async (root) => {
		await writeSiteFiles(root);
		await writeFixtureFile(root, 'custom-site/public/sitemap.xml', 'source sitemap\n');
		await writeFixtureFile(root, 'custom-site/.norna/public/sitemap.xml', 'previous generated sitemap\n');
		await writeFixtureFile(root, 'custom-site/.norna/public/stale.txt', 'keep after failed preflight\n');

		const result = runSyncScript(root, { NORNA_SITE_DIR: 'custom-site' });
		const output = getOutput(result);

		assert.notEqual(result.status, 0, output);
		assert.match(output, /custom-site\/public\/sitemap\.xml conflicts with Norna's generated sitemap\.xml/);
		assert.match(output, /Remove that source file/);
		assert.equal(await readFixtureFile(root, 'custom-site/public/sitemap.xml'), 'source sitemap\n');
		assert.equal(await readFixtureFile(root, 'custom-site/.norna/public/sitemap.xml'), 'previous generated sitemap\n');
		assert.equal(await readFixtureFile(root, 'custom-site/.norna/public/stale.txt'), 'keep after failed preflight\n');
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
