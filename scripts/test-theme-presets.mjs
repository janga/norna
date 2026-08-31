import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { load } from 'js-yaml';
import { getPresentationPalette, presentationPaletteNames, resolveThemePresentation } from './lib/presentation.mjs';
import {
	resolveThemeProfileRecipe,
	themeProfileCategoryNames,
	themeProfileDefinitions,
} from './lib/theme-profiles.mjs';
import {
	getThemePresetMetadata,
	resolveThemeConfig,
	themePresetDefinitions,
	themePresetNames,
	themePresetRecipes,
	themePresets,
} from './lib/theme-presets.mjs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const cliPath = path.join(repoRoot, 'bin', 'norna.mjs');
const tempParent = path.join(repoRoot, 'node_modules', '.cache');
await mkdir(tempParent, { recursive: true });
const tempRoot = await mkdtemp(path.join(tempParent, 'norna theme presets-'));
const siteDir = path.join(tempRoot, 'site');
const expectedPresetThemes = JSON.parse(await readFile(
	path.join(repoRoot, 'tests', 'preset-baselines', 'resolved-themes.json'),
	'utf8',
));

const expectedPresetRecipes = {
	portfolio: {
		color: 'near-monochrome-dark',
		typography: 'restrained-sans',
		rhythm: 'balanced',
		geometry: 'image-led',
		media: 'prominent',
		blocks: 'wide-cards',
		corners: 'square',
		surfaces: 'uniform',
	},
	documentation: {
		color: 'warm-paper-adaptive',
		typography: 'editorial-reading',
		rhythm: 'compact',
		geometry: 'focused-reading',
		media: 'supporting',
		blocks: 'reading-column-cards',
		corners: 'rounded',
		surfaces: 'alternating',
	},
	project: {
		color: 'near-monochrome-adaptive',
		typography: 'system-reading',
		rhythm: 'compact',
		geometry: 'balanced-site',
		media: 'balanced',
		blocks: 'balanced-cards',
		corners: 'rounded',
		surfaces: 'alternating',
	},
	statement: {
		color: 'warm-paper-adaptive',
		typography: 'expressive-sans',
		rhythm: 'expansive',
		geometry: 'expansive-statement',
		media: 'immersive',
		blocks: 'wide-cards',
		corners: 'square',
		surfaces: 'accented',
	},
};

const runCli = (args) => spawnSync(process.execPath, [cliPath, '--site-dir', siteDir, ...args], {
	cwd: repoRoot,
	encoding: 'utf8',
});

const channelLuminance = (channel) => {
	const normalized = channel / 255;
	return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
};
const luminance = (hex) => {
	const channels = hex.match(/[a-f\d]{2}/gi).map((channel) => Number.parseInt(channel, 16));
	return (0.2126 * channelLuminance(channels[0]))
		+ (0.7152 * channelLuminance(channels[1]))
		+ (0.0722 * channelLuminance(channels[2]));
};
const contrastRatio = (left, right) => {
	const [lighter, darker] = [luminance(left), luminance(right)].sort((a, b) => b - a);
	return (lighter + 0.05) / (darker + 0.05);
};

try {
	assert.deepEqual(Object.keys(themePresets), themePresetNames);
	assert.deepEqual(Object.keys(themePresetDefinitions), themePresetNames);
	assert.deepEqual(Object.keys(themePresetRecipes), themePresetNames);
	assert.deepEqual(themePresetRecipes, expectedPresetRecipes);
	assert.deepEqual(themeProfileCategoryNames, [
		'color',
		'typography',
		'rhythm',
		'geometry',
		'media',
		'blocks',
		'corners',
		'surfaces',
	]);
	assert.ok(Object.isFrozen(themeProfileDefinitions));
	for (const [category, profiles] of Object.entries(themeProfileDefinitions)) {
		assert.ok(Object.isFrozen(profiles), `${category} profiles must be immutable`);
		assert.ok(Object.keys(profiles).length > 0, `${category} must provide profiles`);
		assert.deepEqual(
			[...new Set(Object.values(themePresetRecipes).map((recipe) => recipe[category]))].sort(),
			Object.keys(profiles).sort(),
			`${category} profiles must be selected by at least one built-in preset`,
		);
		for (const profile of Object.values(profiles)) {
			assert.ok(Object.isFrozen(profile), `${category} profile definitions must be immutable`);
		}
	}
	for (const presetName of themePresetNames) {
		assert.ok(Object.isFrozen(themePresetRecipes[presetName]), `${presetName} recipe must be immutable`);
		assert.ok(Object.isFrozen(themePresets[presetName]), `${presetName} resolved theme must be immutable`);
		assert.ok(Object.isFrozen(themePresets[presetName].layout), `${presetName} resolved layout must be immutable`);
		const metadata = getThemePresetMetadata(presetName);
		assert.equal(metadata.name, presetName);
		assert.ok(metadata.title);
		assert.ok(metadata.description);
		const resolved = resolveThemeConfig({ preset: presetName }, 'test theme');
		assert.equal(resolved.preset, presetName);
		assert.ok(resolved.layout?.contentSpacing);
		assert.ok(resolved.layout?.textWidth);
		assert.ok(resolved.layout?.noteWidth);
		assert.ok(resolved.layout?.noteGap);
		assert.ok(resolved.corners);
		assert.ok(resolved.images?.width);
		assert.ok(resolved.blocks?.cardList?.width);
		assert.ok(resolved.typography?.fontFamily);
		assert.ok(resolved.typography?.profile);
		assert.ok(resolved.palette);
		assert.ok(resolved.colorMode?.default);
		assert.equal(resolved.readerControls?.colorMode, true);
		assert.ok(resolved.sections?.backgroundPattern);
		assert.equal(
			resolveThemePresentation({ preset: presetName }, `${presetName} presentation`).readerPreferences.controls.readingWidth,
			true,
			`${presetName} must always let readers choose a reading width`,
		);
		assert.deepEqual(themePresets[presetName], expectedPresetThemes[presetName]);
		const { readerControls, ...expectedVisualProfiles } = expectedPresetThemes[presetName];
		assert.deepEqual(
			resolveThemeProfileRecipe(themePresetRecipes[presetName], `${presetName} test recipe`),
			expectedVisualProfiles,
		);
		assert.deepEqual(themePresetDefinitions[presetName].readerControls, readerControls);
	}
	const isolatedResolution = resolveThemeProfileRecipe(themePresetRecipes.project, 'isolated recipe');
	isolatedResolution.layout.pageWidth = '1px';
	assert.equal(
		resolveThemeProfileRecipe(themePresetRecipes.project, 'second isolated recipe').layout.pageWidth,
		'1120px',
	);
	assert.throws(
		() => resolveThemeProfileRecipe({ ...themePresetRecipes.project, color: 'unknown' }, 'invalid recipe'),
		/Unknown color profile "unknown" in invalid recipe.*near-monochrome-dark, near-monochrome-adaptive, warm-paper-adaptive/,
	);
	const missingProfileRecipe = { ...themePresetRecipes.project };
	delete missingProfileRecipe.media;
	assert.throws(
		() => resolveThemeProfileRecipe(missingProfileRecipe, 'incomplete recipe'),
		/Missing theme profile category "media" in incomplete recipe/,
	);
	assert.throws(
		() => resolveThemeProfileRecipe({ ...themePresetRecipes.project, animation: 'busy' }, 'extended recipe'),
		/Unknown theme profile category "animation" in extended recipe/,
	);
	for (const paletteName of presentationPaletteNames) {
		const palette = getPresentationPalette(paletteName);
		for (const [modeName, mode] of Object.entries(palette.modes)) {
			for (const [surfaceName, surface] of Object.entries(mode.surfaces)) {
				assert.ok(
					contrastRatio(surface.backgroundColor, surface.textColor) >= 4.5,
					`${paletteName}/${modeName}/${surfaceName} must provide readable text and reversible carousel controls.`,
				);
			}
		}
	}

	const overridden = resolveThemeConfig({
		preset: 'documentation',
		layout: { pageWidth: '1300px' },
		blocks: { cardList: { width: 'wide' } },
		palette: 'near-monochrome',
	}, 'test theme');
	assert.equal(overridden.layout.contentSpacing, 'compact');
	assert.equal(overridden.layout.textWidth, 'narrow');
	assert.equal(overridden.layout.pageWidth, '1300px');
	assert.equal(overridden.layout.localNavigationGap, 'clamp(1rem, 2vw, 1.5rem)');
	assert.equal(overridden.layout.noteWidth, '12rem');
	assert.equal(overridden.layout.noteGap, '1.25rem');
	assert.equal(overridden.images.width, '920px');
	assert.equal(overridden.blocks.cardList.width, 'wide');
	assert.equal(overridden.palette, 'near-monochrome');
	assert.equal(overridden.sections.backgroundPattern, 'alternating');
	assert.throws(
		() => resolveThemeConfig({ preset: 'unknown' }, 'test/theme.yaml'),
		/Unknown theme preset "unknown" in test\/theme\.yaml.*portfolio, documentation, project, statement/,
	);
	assert.throws(
		() => resolveThemePresentation({ sections: { backgroundPattern: 'glowing' } }, 'test/theme.yaml'),
		/sections\.backgroundPattern must be one of uniform, alternating, accented in test\/theme\.yaml/,
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

	await mkdir(path.join(siteDir, 'pages', '000-home'), { recursive: true });
	await mkdir(path.join(siteDir, 'pages', '010-guide'), { recursive: true });
	const configPath = path.join(siteDir, 'config.yaml');
	await writeFile(configPath, 'url: https://example.com/\nnavigation:\n  mode: top\n');
	await writeFile(path.join(siteDir, 'pages', '000-home', 'content.md'), `---
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
palette: near-monochrome
`);
	await writeFile(path.join(siteDir, 'pages', '010-guide', 'content.md'), `---
page:
  description: Additional page
---

# Guide
Page content.
`);
	await writeFile(path.join(siteDir, 'pages', '010-guide', 'theme.yaml'), `layout:
  contentSpacing: spacious
  textWidth: wide
images:
  width: 700px
sections:
  backgroundPattern: accented
`);

	const rootThemePath = path.join(siteDir, 'theme.yaml');
	const rootThemeSource = await readFile(rootThemePath, 'utf8');
	for (const [legacySource, expectedMessage] of [
		['palette: paper\n', /Palette value "paper" was replaced by "warm-paper"/],
		['corners: soft\n', /Corner value "soft" was replaced by "rounded"/],
		['readerControls:\n  appearance: true\n', /Reader control "appearance" was replaced by "colorMode"/],
		['readerControls:\n  readingWidth: true\n', /Reader control "readingWidth" was removed because reading width is now always available/],
		['sections:\n  backgroundPattern: cycling\n', /Section background pattern "cycling" was replaced by "accented"/],
		['shape: soft\n', /"shape" was replaced by "corners"[\s\S]*replace the old "soft" value with "rounded"/],
	]) {
		await writeFile(rootThemePath, legacySource);
		const legacyResult = runCli(['config:check']);
		assert.notEqual(legacyResult.status, 0);
		assert.match(legacyResult.stderr, expectedMessage);
	}
	await writeFile(rootThemePath, rootThemeSource);

	const buildResult = runCli(['build']);
	assert.equal(buildResult.status, 0, buildResult.stderr || buildResult.stdout);
	const rootHtml = await readFile(path.join(tempRoot, 'dist', 'index.html'), 'utf8');
	const pageHtml = await readFile(path.join(tempRoot, 'dist', 'guide', 'index.html'), 'utf8');
	assert.match(rootHtml, /--page-width: 1300px/);
	assert.match(rootHtml, /--section-note-width: 12rem/);
	assert.match(rootHtml, /--section-note-gap: 1\.25rem/);
	assert.match(rootHtml, /--font-sans: Georgia, 'Times New Roman', serif/);
	assert.match(rootHtml, /data-color-mode="system"/);
	assert.match(rootHtml, /--palette-light-page-background: #f7f7f5/);
	assert.match(rootHtml, /--palette-dark-page-background: #000000/);
	assert.match(pageHtml, /--page-width: 1300px/);
	assert.match(pageHtml, /--font-sans: Georgia, 'Times New Roman', serif/);
	assert.match(pageHtml, /--palette-dark-page-background: #000000/);
	assert.match(pageHtml, /data-display-settings/);
	assert.match(pageHtml, /data-reading-width="wide"/);
	assert.match(pageHtml, /--image-width: 700px/);
	assert.match(pageHtml, /--space-section-to-section-desktop: clamp\(2\.25rem, 5vw, 4\.5rem\)/);
	assert.match(rootHtml, /data-navigation-mode="top"/);
	assert.match(pageHtml, /data-navigation-mode="top"/);

	const typographyResult = runCli(['typography', 'show']);
	assert.equal(typographyResult.status, 0, typographyResult.stderr || typographyResult.stdout);
	assert.match(typographyResult.stdout, /value: reading/);
	assert.doesNotMatch(typographyResult.stdout, /value: restrained/);

	const pageThemePath = path.join(siteDir, 'pages', '010-guide', 'theme.yaml');
	const pageThemeSource = await readFile(pageThemePath, 'utf8');
	await writeFile(pageThemePath, 'preset: unknown\n');
	const invalidPagePresetResult = runCli(['config:check']);
	assert.notEqual(invalidPagePresetResult.status, 0);
	assert.match(invalidPagePresetResult.stderr, /page themes may not define site-wide visual identity through "preset"/);
	await writeFile(pageThemePath, pageThemeSource);
	await writeFile(pageThemePath, 'navigation:\n  mode: sections\n');
	const pageNavigationResult = runCli(['config:check']);
	assert.notEqual(pageNavigationResult.status, 0);
	assert.match(pageNavigationResult.stderr, /navigation is technical, site-wide configuration/);
	assert.match(pageNavigationResult.stderr, /config\.yaml/);
	await writeFile(pageThemePath, pageThemeSource);

	await writeFile(configPath, 'url: https://example.com/\nnavigation:\n  mode: tree\n');
	const treeSurfaceConflictResult = runCli(['config:check']);
	assert.notEqual(treeSurfaceConflictResult.status, 0);
	assert.match(treeSurfaceConflictResult.stderr, /sections\.backgroundPattern "accented" cannot be used with tree navigation/);
	assert.match(treeSurfaceConflictResult.stderr, /pages\/010-guide\/theme\.yaml/);
	await writeFile(pageThemePath, pageThemeSource.replace('backgroundPattern: accented', 'backgroundPattern: uniform'));
	const uniformTreeResult = runCli(['config:check']);
	assert.equal(uniformTreeResult.status, 0, uniformTreeResult.stderr || uniformTreeResult.stdout);
	await writeFile(configPath, 'url: https://example.com/\nnavigation:\n  mode: top\n');
	await writeFile(pageThemePath, pageThemeSource);

	const exportResult = runCli(['theme:export', 'documentation']);
	assert.equal(exportResult.status, 0, exportResult.stderr || exportResult.stdout);
	assert.match(exportResult.stdout, /orig-documentation-theme\.yaml/);
	const exportedPath = path.join(siteDir, 'orig-documentation-theme.yaml');
	const exportedSource = await readFile(exportedPath, 'utf8');
	assert.match(exportedSource, /This is a reference file\. Norna only loads theme\.yaml\./);
	assert.match(exportedSource, /Available theme presets: portfolio, documentation, project, statement\./);
	assert.match(exportedSource, /# Alternatives: near-monochrome, cool-green, warm-paper\./);
	const exportedConfig = load(exportedSource);
	assert.equal(exportedConfig.preset, 'documentation');
	assert.equal(exportedConfig.navigation, undefined);
	assert.equal(exportedConfig.corners, themePresets.documentation.corners);
	assert.equal(exportedConfig.layout.pageWidth, themePresets.documentation.layout.pageWidth);
	assert.equal(exportedConfig.layout.noteWidth, undefined);
	assert.equal(exportedConfig.layout.noteGap, undefined);
	assert.equal(exportedConfig.blocks.cardList.width, 'text');
	assert.equal(exportedConfig.typography.fontFamily, themePresets.documentation.typography.fontFamily);
	assert.equal(exportedConfig.sections.backgroundPattern, 'alternating');

	const exportAgainResult = runCli(['theme:export', 'documentation']);
	assert.notEqual(exportAgainResult.status, 0);
	assert.match(exportAgainResult.stderr, /already exists\. Norna will not overwrite it\./);
	assert.equal(await readFile(exportedPath, 'utf8'), exportedSource);

	const unknownExportResult = runCli(['theme:export', 'unknown']);
	assert.notEqual(unknownExportResult.status, 0);
	assert.match(unknownExportResult.stderr, /Unknown theme preset "unknown"/);

	console.log('ok - complete root presets and limited inherited page themes resolve and export as protected references');
} finally {
	await rm(tempRoot, { force: true, recursive: true });
}
