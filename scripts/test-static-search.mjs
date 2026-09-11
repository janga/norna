import assert from 'node:assert/strict';
import { access, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';
import { gunzip } from 'node:zlib';
import { createTempSite, runNorna } from './test-support/content-model.mjs';

const fileExists = (filePath) => access(filePath).then(() => true, () => false);
const gunzipAsync = promisify(gunzip);

const readSearchDocuments = async (pagefindDirectory) => {
	const fragmentDirectory = path.join(pagefindDirectory, 'fragment');
	const fragmentFilenames = (await readdir(fragmentDirectory))
		.filter((filename) => filename.endsWith('.pf_fragment'));
	return Promise.all(fragmentFilenames.map(async (filename) => {
		const decompressed = (await gunzipAsync(await readFile(path.join(fragmentDirectory, filename)))).toString('utf8');
		return JSON.parse(decompressed.slice(decompressed.indexOf('{')));
	}));
};

const runSite = (siteDir, command) => runNorna([command], {
	env: {
		...process.env,
		NORNA_SITE_DIR: siteDir,
	},
});

const { root, siteDir } = await createTempSite({ underRepoCache: true });
const distDir = path.join(root, 'dist');
const readDeliveredScripts = async (html) => {
	const scripts = html.match(/<script\b[^>]*>[\s\S]*?<\/script>/gi) ?? [];
	const sources = await Promise.all(scripts.map((script) => {
		const source = script.match(/\ssrc="([^"]+)"/)?.[1];
		return source ? readFile(path.join(distDir, source.replace(/^\/project\//, '')), 'utf8') : script;
	}));
	return sources.join('\n');
};

try {
	await writeFile(path.join(siteDir, 'config.yaml'), `url: https://example.com/project/
language: bg
search: true
`);
	await writeFile(path.join(siteDir, 'pages', '000-home', 'content.md'), `# Search fixture

## Overview {#overview}

Началната страница съдържа уникалната дума кобалтовязовец.
`);
	const nestedPageDir = path.join(siteDir, 'pages', '010-guides', 'pages', '010-installation');
	await mkdir(nestedPageDir, { recursive: true });
	await writeFile(path.join(siteDir, 'pages', '010-guides', 'category.yaml'), 'label: Guides\n');
	await writeFile(path.join(nestedPageDir, 'content.md'), `# Installation

## Verify {#verify}

This nested section contains the unique term amberotter.
`);

	const enabledBuild = await runSite(siteDir, 'build');
	assert.match(enabledBuild.stdout, /Generated static search index for 2 pages\./);

	const homeHtml = await readFile(path.join(distDir, 'index.html'), 'utf8');
	const nestedHtml = await readFile(path.join(distDir, 'guides', 'installation', 'index.html'), 'utf8');
	const searchHtml = await readFile(path.join(distDir, 'search', 'index.html'), 'utf8');
	const searchDocuments = await readSearchDocuments(path.join(distDir, 'pagefind'));

	assert.match(homeHtml, /<main\b[^>]*data-pagefind-body/);
	assert.match(nestedHtml, /<main\b[^>]*data-pagefind-body/);
	assert.match(homeHtml, /href="\/project\/search\/"/);
	assert.match(homeHtml, /data-search-source-title="Search fixture"/);
	assert.match(nestedHtml, /data-search-source-title="Installation"/);
	assert.match(searchHtml, /href="\/project\/" data-search-return/);
	assert.match(searchHtml, /data-search-return-label="Обратно към \{page\}"/);
	assert.match(searchHtml, /<span\b[^>]*>Към началната страница<\/span>/);
	assert.match(await readDeliveredScripts(homeHtml), /norna:search:/);
	assert.match(await readDeliveredScripts(searchHtml), /norna:search:/);
	assert.doesNotMatch(homeHtml, /pagefind-ui\.js/);
	assert.doesNotMatch(nestedHtml, /pagefind-ui\.js/);
	assert.match(searchHtml, /<meta name="robots" content="noindex"/);
	assert.match(searchHtml, /href="\/project\/pagefind\/pagefind-ui\.css"/);
	assert.match(searchHtml, /\/project\/pagefind\/pagefind-ui\.js/);
	assert.match(searchHtml, /baseUrl: "\/project\/"/);
	assert.match(searchHtml, /<html lang="bg"/);
	assert.match(searchHtml, /translations: \{"placeholder":"Търсене"/);
	assert.doesNotMatch(searchHtml, /translations: \{"language":/);
	assert.match(searchHtml, /aria-current="page" aria-label="Търсене"/);
	assert.deepEqual(searchDocuments.map(({ url }) => url).sort(), ['/', '/guides/installation/']);
	assert.equal(searchDocuments.some(({ content }) => content.includes('кобалтовязовец')), true);
	assert.equal(searchDocuments.some(({ content }) => content.includes('amberotter')), true);
	assert.equal(searchDocuments.some(({ content }) => content.includes('Страницата не е намерена')), false);
	assert.equal(searchDocuments.some(({ content }) => content.includes('Зареждане на търсенето')), false);
	assert.equal(await fileExists(path.join(siteDir, '.norna', 'public', 'pagefind', 'pagefind.js')), true);

	await writeFile(path.join(siteDir, 'config.yaml'), 'url: https://example.com/project/\nsearch: false\n');
	const disabledBuild = await runSite(siteDir, 'build');
	assert.match(disabledBuild.stdout, /Static search is disabled\./);
	assert.equal(await fileExists(path.join(distDir, 'search', 'index.html')), false);
	assert.equal(await fileExists(path.join(distDir, 'pagefind')), false);
	assert.equal(await fileExists(path.join(siteDir, '.norna', 'public', 'pagefind')), false);
	const disabledHomeHtml = await readFile(path.join(distDir, 'index.html'), 'utf8');
	assert.doesNotMatch(await readDeliveredScripts(disabledHomeHtml), /norna:search:/);

	await writeFile(path.join(siteDir, 'config.yaml'), 'url: https://example.com/project/\nsearch: true\n');
	const conflictingPageDir = path.join(siteDir, 'pages', '020-search');
	await mkdir(conflictingPageDir, { recursive: true });
	await writeFile(path.join(conflictingPageDir, 'content.md'), '# Search page\n\nConflicting source page.\n');
	await assert.rejects(
		runSite(siteDir, 'content:check'),
		(error) => {
			assert.match(error.output, /Generated route "\/search\/"/);
			assert.match(error.output, /Norna generated search page owns \/search\//);
			return true;
		},
	);

	console.log('Static search tests passed.');
} finally {
	await rm(root, { force: true, recursive: true });
}
