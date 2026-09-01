import assert from 'node:assert/strict';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { test } from 'node:test';
import { createPageAliasModel } from './lib/page-aliases.mjs';
import { siteSchema } from './lib/schema-definitions.mjs';
import { createTempSite, runNorna } from './test-support/content-model.mjs';

const pageNode = ({ aliases = [], home = false, label, pagePath }) => ({
	aliases,
	contentLabel: label,
	isHome: home,
	kind: 'page',
	pagePath,
});

test('page aliases use constrained old Norna page URLs', () => {
	assert.equal(siteSchema.safeParse({
		page: {
			aliases: ['/installation/', '/guides/old-install/'],
		},
	}).success, true);

	for (const alias of [
		'/',
		'installation/',
		'/installation',
		'/Installation/',
		'/old--install/',
		'/installation/?from=old',
		'/installation/#verify',
		'https://example.com/installation/',
	]) {
		assert.equal(
			siteSchema.safeParse({ page: { aliases: [alias] } }).success,
			false,
			`Expected ${alias} to be rejected as a page alias.`,
		);
	}

	assert.equal(siteSchema.safeParse({
		page: { aliases: ['/old/', '/old/'] },
	}).success, false);
});

test('page aliases reject every occupied public URL identity', () => {
	const home = pageNode({
		home: true,
		label: 'site/pages/000-home/content.md',
		pagePath: '',
	});
	const existing = pageNode({
		label: 'site/pages/010-existing/content.md',
		pagePath: 'existing',
	});
	const first = pageNode({
		aliases: ['/existing/', '/guides/', '/downloads/', '/generated/', '/shared/'],
		label: 'site/pages/020-first/content.md',
		pagePath: 'first',
	});
	const second = pageNode({
		aliases: ['/shared/'],
		label: 'site/pages/030-second/content.md',
		pagePath: 'second',
	});
	const model = createPageAliasModel({
		categories: [{
			categorySourceLabel: 'site/pages/015-guides/category.yaml',
			isHome: false,
			pagePath: 'guides',
		}],
		generatedRoutes: [{
			kind: 'generated-route',
			label: 'Norna generated route',
			pathname: '/generated/',
		}],
		pages: [home, existing, first, second],
		publicFiles: [{
			label: 'site/public/downloads/index.html',
			pathname: '/downloads/index.html',
		}],
	});

	assert.deepEqual(model.aliases.map(({ pathname }) => pathname), ['/shared/']);
	assert.equal(model.diagnostics.length, 5);
	assert.match(model.diagnostics[0].message, /page URL from site\/pages\/010-existing\/content\.md/);
	assert.match(model.diagnostics[1].message, /navigation category path from site\/pages\/015-guides\/category\.yaml/);
	assert.match(model.diagnostics[2].message, /public file site\/public\/downloads\/index\.html/);
	assert.match(model.diagnostics[3].message, /generated route Norna generated route/);
	assert.match(model.diagnostics[4].message, /page alias declared in site\/pages\/020-first\/content\.md/);
});

test('build emits a base-path-aware static redirect document outside the sitemap', async () => {
	const { root, siteDir } = await createTempSite({ underRepoCache: true });
	try {
		await writeFile(path.join(siteDir, 'config.yaml'), 'url: https://example.com/project/\n');
		await writeFile(path.join(siteDir, 'pages', '000-home', 'content.md'), `# Home

## Start

[Install through its old address](/installation/#verify)
`);
		const installDir = path.join(siteDir, 'pages', '010-guides', 'pages', '010-install');
		await mkdir(installDir, { recursive: true });
		await writeFile(path.join(siteDir, 'pages', '010-guides', 'content.md'), `# Guides

## Overview

Choose a guide.
`);
		await writeFile(path.join(installDir, 'content.md'), `---
page:
  aliases:
    - /installation/
---

# Install Norna

## Verify

Check the local preview.
`);

		await runNorna(['--site-dir', siteDir, 'build']);

		const distDir = path.join(root, 'dist');
		const aliasHtml = await readFile(path.join(distDir, 'installation', 'index.html'), 'utf8');
		const sitemap = await readFile(path.join(distDir, 'sitemap.xml'), 'utf8');
		assert.match(aliasHtml, /<meta name="robots" content="noindex, follow">/);
		assert.match(aliasHtml, /<meta http-equiv="refresh" content="0; url=\/project\/guides\/install\/">/);
		assert.match(aliasHtml, /<link rel="canonical" href="https:\/\/example\.com\/project\/guides\/install\/">/);
		assert.match(aliasHtml, /<a href="\/project\/guides\/install\/"[^>]*>Install Norna<\/a>/);
		assert.doesNotMatch(aliasHtml, /<script\b/);
		assert.match(await readFile(path.join(distDir, 'guides', 'install', 'index.html'), 'utf8'), /Install Norna/);
		assert.doesNotMatch(sitemap, /installation/);
		assert.match(sitemap, /https:\/\/example\.com\/project\/guides\/install\//);
	} finally {
		await rm(root, { recursive: true, force: true });
	}
});

test('content check reports an alias collision with a public index file', async () => {
	const { root, siteDir } = await createTempSite();
	try {
		await writeFile(path.join(siteDir, 'pages', '000-home', 'content.md'), `---
page:
  aliases:
    - /archive/
---

# Home
`);
		await mkdir(path.join(siteDir, 'public', 'archive'), { recursive: true });
		await writeFile(path.join(siteDir, 'public', 'archive', 'index.html'), '<p>Archive</p>\n');

		await assert.rejects(
			runNorna(['--site-dir', siteDir, 'content:check']),
			(error) => {
				assert.match(error.output, /Page alias "\/archive\/"/);
				assert.match(error.output, /site\/pages\/000-home\/content\.md/);
				assert.match(error.output, /site\/public\/archive\/index\.html/);
				return true;
			},
		);
	} finally {
		await rm(root, { recursive: true, force: true });
	}
});
