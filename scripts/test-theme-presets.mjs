import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseYamlMapping } from './lib/frontmatter-yaml.mjs';
import { resolveThemePresentation } from './lib/presentation.mjs';
import { splitSiteFile } from './lib/site-content.mjs';
import {
	resolveThemeConfig,
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
	for (const presetName of themePresetNames) {
		const resolved = resolveThemeConfig({ preset: presetName }, 'test theme');
		assert.equal(resolved.preset, presetName);
		assert.ok(resolved.layout?.density);
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
	assert.equal(overridden.layout.pageWidth, '1300px');
	assert.equal(overridden.images.width, '920px');
	assert.equal(overridden.palette, 'dark');
	assert.deepEqual(overridden.sectionSurfaces, ['base', 'soft']);
	assert.throws(
		() => resolveThemeConfig({ preset: 'unknown' }, 'test/theme.md'),
		/Unknown theme preset "unknown" in test\/theme\.md.*portfolio, documentation, project, statement/,
	);
	assert.throws(
		() => resolveThemePresentation({ sectionSurfaces: ['base', 'glowing'] }, 'test/theme.md'),
		/Unknown section surface "glowing" in test\/theme\.md.*base, soft, emphasis/,
	);
	assert.throws(
		() => resolveThemePresentation({ sectionSurfaces: ['base', 'base'] }, 'test/theme.md'),
		/Each section surface may appear only once in test\/theme\.md/,
	);

	await mkdir(path.join(siteDir, 'routes', '010-guide'), { recursive: true });
	await writeFile(path.join(siteDir, 'config.md'), `---
url: https://example.com/
---
`);
	await writeFile(path.join(siteDir, 'content.md'), `---
title: Theme preset test
description: Root page
---

## Home {#home}

Root content.
`);
	await writeFile(path.join(siteDir, 'theme.md'), `---
preset: documentation
layout:
  pageWidth: 1300px
palette: dark
---
`);
	await writeFile(path.join(siteDir, 'routes', '010-guide', 'content.md'), `---
title: Guide
description: Route page
navigation:
  label: Guide
---

## Guide {#guide}

Route content.
`);
	await writeFile(path.join(siteDir, 'routes', '010-guide', 'theme.md'), `---
preset: portfolio
layout:
  pageWidth: 1010px
palette: light
---
`);

	const buildResult = runCli(['build']);
	assert.equal(buildResult.status, 0, buildResult.stderr || buildResult.stdout);
	const rootHtml = await readFile(path.join(tempRoot, 'dist', 'index.html'), 'utf8');
	const routeHtml = await readFile(path.join(tempRoot, 'dist', 'guide', 'index.html'), 'utf8');
	assert.match(rootHtml, /--page-width: 1300px/);
	assert.match(rootHtml, /--font-sans: Georgia, 'Times New Roman', serif/);
	assert.match(rootHtml, /--color-page: #000000/);
	assert.match(routeHtml, /--page-width: 1010px/);
	assert.match(routeHtml, /--font-sans: 'Helvetica Neue', Arial, sans-serif/);
	assert.match(routeHtml, /--color-page: #ffffff/);

	const typographyResult = runCli(['typography', 'show']);
	assert.equal(typographyResult.status, 0, typographyResult.stderr || typographyResult.stdout);
	assert.match(typographyResult.stdout, /value: reading/);
	assert.match(typographyResult.stdout, /value: restrained/);

	const routeThemePath = path.join(siteDir, 'routes', '010-guide', 'theme.md');
	const routeThemeSource = await readFile(routeThemePath, 'utf8');
	await writeFile(routeThemePath, `---\npreset: unknown\n---\n`);
	const invalidRoutePresetResult = runCli(['config:check']);
	assert.notEqual(invalidRoutePresetResult.status, 0);
	assert.match(invalidRoutePresetResult.stderr, /Unknown theme preset "unknown" in .*routes\/010-guide\/theme\.md/);
	await writeFile(routeThemePath, routeThemeSource);

	const exportResult = runCli(['theme:export', 'documentation']);
	assert.equal(exportResult.status, 0, exportResult.stderr || exportResult.stdout);
	assert.match(exportResult.stdout, /orig-documentation-theme\.md/);
	const exportedPath = path.join(siteDir, 'orig-documentation-theme.md');
	const exportedSource = await readFile(exportedPath, 'utf8');
	assert.match(exportedSource, /This is a reference file\. Norna only loads theme\.md\./);
	assert.match(exportedSource, /Available theme presets: portfolio, documentation, project, statement\./);
	assert.match(exportedSource, /# Alternatives: dark, light, paper\./);
	const { frontmatterBody } = splitSiteFile(exportedSource, 'exported theme reference');
	const exportedConfig = parseYamlMapping(frontmatterBody);
	assert.equal(exportedConfig.preset, 'documentation');
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

	console.log('ok - complete theme presets resolve for root and route themes and export as protected references');
} finally {
	await rm(tempRoot, { force: true, recursive: true });
}
