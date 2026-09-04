import assert from 'node:assert/strict';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { test } from 'node:test';
import { createTempSite, runNorna } from './test-support/content-model.mjs';

test('build emits an English root-hosted 404 page with a static Home link', async () => {
	const { root, siteDir } = await createTempSite({ underRepoCache: true });
	try {
		await writeFile(path.join(siteDir, 'pages', '000-home', 'content.md'), '# Home\n\nWelcome.\n');
		await runNorna(['--site-dir', siteDir, 'build']);

		const html = await readFile(path.join(root, 'dist', '404.html'), 'utf8');
		assert.match(html, /<html lang="en"/);
		assert.match(html, /<meta name="robots" content="noindex">/);
		assert.match(html, /<title>Page not found<\/title>/);
		assert.match(html, /<h1 id="page-title">Page not found<\/h1>/);
		assert.match(html, /The requested page does not exist or may have moved\./);
		assert.match(html, /<a href="\/">Go to the homepage<\/a>/);
		assert.doesNotMatch(html, /rel="canonical"/);
		assert.doesNotMatch(html, /property="og:/);
		assert.doesNotMatch(html, /name="twitter:/);
		assert.doesNotMatch(html, /http-equiv="refresh"/);
	} finally {
		await rm(root, { recursive: true, force: true });
	}
});

test('build emits a localized base-path 404 page with valid navigation and asset URLs', async () => {
	const { root, siteDir } = await createTempSite({ underRepoCache: true });
	try {
		await writeFile(path.join(siteDir, 'config.yaml'), 'url: https://example.com/project/\nlanguage: sv-SE\n');
		await mkdir(path.join(siteDir, 'public'), { recursive: true });
		await writeFile(path.join(siteDir, 'public', 'logo.svg'), '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"/>');
		await writeFile(path.join(siteDir, 'public', 'favicon.svg'), '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"/>');
		await writeFile(path.join(siteDir, 'public', 'social-image.png'), 'preview');
		await writeFile(path.join(siteDir, 'pages', '000-home', 'content.md'), '# Hem\n\nVälkommen.\n');
		await mkdir(path.join(siteDir, 'pages', '010-om'), { recursive: true });
		await writeFile(path.join(siteDir, 'pages', '010-om', 'content.md'), '# Om\n\nOm webbplatsen.\n');

		await runNorna(['--site-dir', siteDir, 'build']);

		const html = await readFile(path.join(root, 'dist', '404.html'), 'utf8');
		assert.match(html, /<html lang="sv-SE"/);
		assert.match(html, /<title>Sidan hittades inte<\/title>/);
		assert.match(html, /Den begärda sidan finns inte eller kan ha flyttats\./);
		assert.match(html, /<a href="\/project\/">Gå till startsidan<\/a>/);
		assert.match(html, /<a class="site-brand" href="\/project\/">/);
		assert.match(html, /src="\/project\/logo\.svg" alt="Hem"/);
		assert.match(html, /href="\/project\/om\/">\s*Om\s*<\/a>/);
		assert.doesNotMatch(html, /aria-current="page"/);
		assert.match(html, /<link rel="icon" type="image\/svg\+xml" href="\/project\/favicon\.svg">/);
		assert.doesNotMatch(html, /social-image\.png/);
	} finally {
		await rm(root, { recursive: true, force: true });
	}
});
