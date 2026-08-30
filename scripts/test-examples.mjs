import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderThemePresetComparison } from './build-theme-preset-comparison.mjs';
import { getExampleSites } from './lib/example-sites.mjs';
import { runInherit } from './lib/run-command.mjs';
import { themePresetNames } from './lib/theme-presets.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const cliPath = path.join(root, 'bin', 'norna.mjs');
const examples = await getExampleSites(root);

const discoveryRoot = await mkdtemp(path.join(tmpdir(), 'norna-example-discovery-'));
try {
	for (const category of ['complete-sites', 'feature-demos']) {
		await mkdir(path.join(discoveryRoot, 'examples', category), { recursive: true });
	}
	const validSite = path.join(discoveryRoot, 'examples', 'complete-sites', 'valid', 'site');
	await mkdir(path.join(validSite, 'pages', '000-home'), { recursive: true });
	await writeFile(path.join(validSite, 'config.yaml'), 'url: https://example.com/\n');
	await writeFile(path.join(validSite, 'pages', '000-home', 'content.md'), '# Example\n');
	await mkdir(path.join(
		discoveryRoot,
		'examples',
		'feature-demos',
		'removed-example',
		'site',
		'.norna',
		'public',
		'images',
		'generated',
	), { recursive: true });

	const discovered = await getExampleSites(discoveryRoot);
	assert.deepEqual(discovered.map(({ name }) => name), ['valid']);
} finally {
	await rm(discoveryRoot, { recursive: true, force: true });
}

const collectSourceManifest = async (directory, baseDirectory = directory) => {
	const manifest = {};
	for (const entry of await readdir(directory, { withFileTypes: true })) {
		const entryPath = path.join(directory, entry.name);
		if (entry.isDirectory()) {
			Object.assign(manifest, await collectSourceManifest(entryPath, baseDirectory));
		} else {
			manifest[path.relative(baseDirectory, entryPath)] = await readFile(entryPath, 'base64');
		}
	}
	return manifest;
};

const presetExamples = themePresetNames.map((presetName) => {
	const example = examples.find(({ name }) => name === `theme-preset-${presetName}`);
	assert.ok(example, `Missing theme-preset-${presetName} example.`);
	return { presetName, example };
});
const canonicalPresetPages = await collectSourceManifest(path.join(presetExamples[0].example.siteDirectory, 'pages'));

for (const { presetName, example } of presetExamples.slice(1)) {
	const pages = await collectSourceManifest(path.join(example.siteDirectory, 'pages'));
	assert.deepEqual(
		pages,
		canonicalPresetPages,
		`The ${presetName} example must use the same page content and images as the other preset examples.`,
	);
}

const comparisonHtml = renderThemePresetComparison();
assert.match(comparisonHtml, /<label class="comparison-control">/);
assert.match(comparisonHtml, /aria-live="polite"/);
for (const presetName of themePresetNames) {
	assert.ok(comparisonHtml.includes(`theme-preset-${presetName}/`), `Preset comparison is missing ${presetName}.`);
}

for (const example of examples) {
	console.log(`\nBuilding ${example.siteLabel}`);
	const exampleDistDirectory = path.join(path.dirname(example.siteDirectory), 'dist');
	try {
		await runInherit(process.execPath, [cliPath, '--site-dir', example.siteDirectory, 'build'], { cwd: root });

		if (['svg', 'png', 'jpg', 'jpeg'].some((extension) => existsSync(path.join(example.siteDirectory, 'public', `logo.${extension}`)))) {
			const homepageHtml = await readFile(path.join(exampleDistDirectory, 'index.html'), 'utf8');
			if (!homepageHtml.includes('class="site-brand-logo"')) {
				throw new Error(`Example ${example.siteLabel} has a logo file that is not rendered on its homepage.`);
			}
		}

		if (example.name.startsWith('theme-preset-')) {
			const homepageHtml = await readFile(path.join(exampleDistDirectory, 'index.html'), 'utf8');
			assert.match(homepageHtml, /data-navigation-mode="sections"/);
			assert.match(homepageHtml, /class="page-nav-page-top"[^>]*>[^<]+<\/a>/);
			for (const sectionId of [
				'preset-purpose',
				'reading-rhythm',
				'images-and-captions',
				'carousel-controls',
				'cards-and-surfaces',
			]) {
				assert.match(homepageHtml, new RegExp(`href="#${sectionId}"`));
			}
		}

		if (example.name === 'media-and-surfaces') {
			const surfacesHtml = await readFile(path.join(exampleDistDirectory, 'surfaces', 'index.html'), 'utf8');
			assert.match(surfacesHtml, /data-navigation-mode="top"/);
			assert.doesNotMatch(surfacesHtml, /class="tree-local-navigation"/);
			assert.match(surfacesHtml, /--section-background-color: var\(--color-surface-soft-background\)/);
			assert.match(surfacesHtml, /--section-background-color: var\(--color-surface-emphasis-background\)/);
		}
	} finally {
		await rm(exampleDistDirectory, { recursive: true, force: true });
	}
}

console.log(`\nok - built ${examples.length} example sites`);
