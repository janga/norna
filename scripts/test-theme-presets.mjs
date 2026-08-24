import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { load } from 'js-yaml';
import { resolveThemePresentation } from './lib/presentation.mjs';
import {
	getThemePresetMetadata,
	resolveThemeConfig,
	themePresetDefinitions,
	themePresetNames,
	themePresets,
} from './lib/theme-presets.mjs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const cliPath = path.join(repoRoot, 'bin', 'norna.mjs');
const tempParent = path.join(repoRoot, 'node_modules', '.cache');
await mkdir(tempParent, { recursive: true });
const tempRoot = await mkdtemp(path.join(tempParent, 'norna theme presets-'));
const siteDir = path.join(tempRoot, 'site');

const runCli = (args) => spawnSync(process.execPath, [cliPath, '--site-dir', siteDir, ...args], {
	cwd: repoRoot,
	encoding: 'utf8',
});

try {
	assert.deepEqual(Object.keys(themePresets), themePresetNames);
	assert.deepEqual(Object.keys(themePresetDefinitions), themePresetNames);
	for (const presetName of themePresetNames) {
		const metadata = getThemePresetMetadata(presetName);
		assert.equal(metadata.name, presetName);
		assert.ok(metadata.title);
		assert.ok(metadata.description);
		const resolved = resolveThemeConfig({ preset: presetName }, 'test theme');
		assert.equal(resolved.preset, presetName);
		assert.ok(resolved.layout?.density);
		assert.equal(resolved.navigation?.mode, 'automatic');
		assert.ok(resolved.images?.width);
		assert.ok(resolved.typography?.fontFamily);
		assert.ok(resolved.typography?.profile);
		assert.ok(resolved.palette);
		assert.ok(resolved.sectionSurfaces);
	}

	const overridden = resolveThemeConfig({
		preset: 'documentation',
		layout: { pageWidth: '1300px' },
		palette: 'dark',
	}, 'test theme');
	assert.equal(overridden.layout.density, 'compact');
	assert.equal(overridden.navigation.mode, 'automatic');
	assert.equal(overridden.layout.pageWidth, '1300px');
	assert.equal(overridden.images.width, '920px');
	assert.equal(overridden.palette, 'dark');
	assert.deepEqual(overridden.sectionSurfaces, ['base', 'soft']);
	assert.throws(
		() => resolveThemeConfig({ preset: 'unknown' }, 'test/theme.yaml'),
		/Unknown theme preset "unknown" in test\/theme\.yaml.*portfolio, documentation, project, statement/,
	);
	assert.throws(
		() => resolveThemePresentation({ sectionSurfaces: ['base', 'glowing'] }, 'test/theme.yaml'),
		/Unknown section surface "glowing" in test\/theme\.yaml.*base, soft, emphasis/,
	);
	assert.throws(
		() => resolveThemePresentation({ sectionSurfaces: ['base', 'base'] }, 'test/theme.yaml'),
		/Each section surface may appear only once in test\/theme\.yaml/,
	);

	const listResult = runCli(['theme:presets']);
	assert.equal(listResult.status, 0, listResult.stderr || listResult.stdout);
	for (const presetName of themePresetNames) {
		const metadata = getThemePresetMetadata(presetName);
		assert.ok(listResult.stdout.includes(`${presetName}\n  ${metadata.description}`));
	}
	const invalidListResult = runCli(['theme:presets', 'documentation']);
	assert.notEqual(invalidListResult.status, 0);
	assert.match(invalidListResult.stderr, /Usage: norna theme:presets/);

	const themeSchema = JSON.parse(await readFile(path.join(repoRoot, 'schemas', 'theme.schema.json'), 'utf8'));
	assert.deepEqual(
		themeSchema.properties.preset.oneOf.map((entry) => entry.const),
		themePresetNames,
	);
	for (const entry of themeSchema.properties.preset.oneOf) {
		const metadata = getThemePresetMetadata(entry.const);
		assert.equal(entry.title, metadata.title);
		assert.equal(entry.description, metadata.description);
	}

	await mkdir(path.join(siteDir, 'pages', '010-guide'), { recursive: true });
	await writeFile(path.join(siteDir, 'config.yaml'), 'url: https://example.com/\n');
	await writeFile(path.join(siteDir, 'content.md'), `---
page:
  description: Root page
---

# Theme preset test

## Home {#home}

Root content.
`);
	await writeFile(path.join(siteDir, 'theme.yaml'), `preset: documentation
layout:
  pageWidth: 1300px
palette: dark
`);
	await writeFile(path.join(siteDir, 'pages', '010-guide', 'content.md'), `---
page:
  description: Additional page
---

# Guide
Page content.
`);
	await writeFile(path.join(siteDir, 'pages', '010-guide', 'theme.yaml'), `preset: portfolio
layout:
  pageWidth: 1010px
palette: light
`);

	const buildResult = runCli(['build']);
	assert.equal(buildResult.status, 0, buildResult.stderr || buildResult.stdout);
	const rootHtml = await readFile(path.join(tempRoot, 'dist', 'index.html'), 'utf8');
	const pageHtml = await readFile(path.join(tempRoot, 'dist', 'guide', 'index.html'), 'utf8');
	assert.match(rootHtml, /--page-width: 1300px/);
	assert.match(rootHtml, /--font-sans: Georgia, 'Times New Roman', serif/);
	assert.match(rootHtml, /--color-page: #000000/);
	assert.match(pageHtml, /--page-width: 1010px/);
	assert.match(pageHtml, /--font-sans: 'Helvetica Neue', Arial, sans-serif/);
	assert.match(pageHtml, /--color-page: #ffffff/);
	assert.match(rootHtml, /data-navigation-mode="top"/);
	assert.match(pageHtml, /data-navigation-mode="top"/);

	const typographyResult = runCli(['typography', 'show']);
	assert.equal(typographyResult.status, 0, typographyResult.stderr || typographyResult.stdout);
	assert.match(typographyResult.stdout, /value: reading/);
	assert.match(typographyResult.stdout, /value: restrained/);

	const pageThemePath = path.join(siteDir, 'pages', '010-guide', 'theme.yaml');
	const pageThemeSource = await readFile(pageThemePath, 'utf8');
	await writeFile(pageThemePath, 'preset: unknown\n');
	const invalidPagePresetResult = runCli(['config:check']);
	assert.notEqual(invalidPagePresetResult.status, 0);
	assert.match(invalidPagePresetResult.stderr, /Unknown theme preset "unknown" in .*pages\/010-guide\/theme\.yaml/);
	await writeFile(pageThemePath, pageThemeSource);
	await writeFile(pageThemePath, 'navigation:\n  mode: sections\n');
	const pageNavigationResult = runCli(['config:check']);
	assert.notEqual(pageNavigationResult.status, 0);
	assert.match(pageNavigationResult.stderr, /page themes may not define navigation/);
	await writeFile(pageThemePath, pageThemeSource);

	const exportResult = runCli(['theme:export', 'documentation']);
	assert.equal(exportResult.status, 0, exportResult.stderr || exportResult.stdout);
	assert.match(exportResult.stdout, /orig-documentation-theme\.yaml/);
	const exportedPath = path.join(siteDir, 'orig-documentation-theme.yaml');
	const exportedSource = await readFile(exportedPath, 'utf8');
	assert.match(exportedSource, /This is a reference file\. Norna only loads theme\.yaml\./);
	assert.match(exportedSource, /Available theme presets: portfolio, documentation, project, statement\./);
	assert.match(exportedSource, /# Alternatives: dark, light, paper\./);
	const exportedConfig = load(exportedSource);
	assert.equal(exportedConfig.preset, 'documentation');
	assert.equal(exportedConfig.navigation.mode, 'automatic');
	assert.equal(exportedConfig.layout.pageWidth, themePresets.documentation.layout.pageWidth);
	assert.equal(exportedConfig.typography.fontFamily, themePresets.documentation.typography.fontFamily);
	assert.deepEqual(exportedConfig.sectionSurfaces, ['base', 'soft']);

	const exportAgainResult = runCli(['theme:export', 'documentation']);
	assert.notEqual(exportAgainResult.status, 0);
	assert.match(exportAgainResult.stderr, /already exists\. Norna will not overwrite it\./);
	assert.equal(await readFile(exportedPath, 'utf8'), exportedSource);

	const unknownExportResult = runCli(['theme:export', 'unknown']);
	assert.notEqual(unknownExportResult.status, 0);
	assert.match(unknownExportResult.stderr, /Unknown theme preset "unknown"/);

	console.log('ok - complete theme presets resolve for root and page themes and export as protected references');
} finally {
	await rm(tempRoot, { force: true, recursive: true });
}
