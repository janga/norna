import assert from 'node:assert/strict';
import { access, cp, mkdir, mkdtemp, readFile, rename, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runInherit } from './lib/run-command.mjs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const fixtureRoot = path.join(repoRoot, 'fixtures', 'basic');
const tempParent = path.join(repoRoot, 'node_modules', '.cache');
await mkdir(tempParent, { recursive: true });
const tempRoot = await mkdtemp(path.join(tempParent, 'norna-basic-fixture-'));
const fixtureCopyRoot = path.join(tempRoot, 'basic');
const siteDir = path.join(fixtureCopyRoot, 'site-page-010-fixture');
const cliPath = path.join(repoRoot, 'bin', 'norna.mjs');
const pages = [
	['010-page-move', 'page-move', 'Page move'],
	['010-page-move/pages/010-child', 'page-move/child', 'Child below page move'],
	['010-page-move/pages/020-page-copy', 'page-move/page-copy', 'Page copy'],
	['020-guides', 'guides', 'Guides'],
	['020-guides/pages/010-page-move', 'guides/page-move', 'Nested page move'],
	['030-page-040-other', 'page-040-other', 'Numeric page marker'],
	['040-page-000-home', 'page-000-home', 'Page named like Home'],
	['050-page-guides/pages/010-installation', 'page-guides/installation', 'Installation below a category'],
];

try {
	await cp(fixtureRoot, fixtureCopyRoot, { recursive: true });
	await rename(path.join(fixtureCopyRoot, 'site'), siteDir);
	for (const [directory, , title] of pages) {
		const pageDir = path.join(siteDir, 'pages', directory);
		await mkdir(pageDir, { recursive: true });
		await writeFile(path.join(pageDir, 'content.md'), `---\npage:\n  description: Regression fixture for ${title.toLowerCase()}.\n---\n\n# ${title}\n`);
	}
	await writeFile(path.join(siteDir, 'pages', '050-page-guides', 'category.yaml'), 'label: Page guides\n');

	for (const siteArgument of [siteDir, path.relative(fixtureCopyRoot, siteDir)]) {
		await runInherit(process.execPath, [cliPath, '--site-dir', siteArgument, 'content:check'], { cwd: fixtureCopyRoot });
		await runInherit(process.execPath, [cliPath, '--site-dir', siteArgument, 'build'], { cwd: fixtureCopyRoot });
		const distDir = path.join(fixtureCopyRoot, 'dist');
		const homepage = await readFile(path.join(distDir, 'index.html'), 'utf8');
		assert.match(homepage, /id="page-title">Fixture Site<\/h1>/);
		if (homepage.includes('class="edit-source-link"')) {
			throw new Error('Basic fixture unexpectedly renders an edit-source link without editLink configuration.');
		}
		const sitemap = await readFile(path.join(distDir, 'sitemap.xml'), 'utf8');
		assert.ok(sitemap.includes('<loc>https://example.com/</loc>'));
		for (const [, pagePath, title] of pages) {
			const html = await readFile(path.join(distDir, pagePath, 'index.html'), 'utf8');
			assert.ok(html.includes(`id="page-title">${title}</h1>`), `${siteArgument}: ${pagePath} must render its own page`);
			assert.ok(sitemap.includes(`<loc>https://example.com/${pagePath}/</loc>`), `${pagePath} must retain its full URL`);
		}
		await access(path.join(siteDir, '.norna', '.astro'));
	}
	console.log('Basic fixture builds passed with isolated output/cache and page-ID regressions for absolute and relative site selection.');
} finally {
	await rm(tempRoot, { recursive: true, force: true });
}
