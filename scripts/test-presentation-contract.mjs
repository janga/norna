import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
	contrastRatio,
	deriveSecondaryTextColor,
	getPaletteContrastPairs,
	presentationEngineContract,
} from './lib/presentation-contract.mjs';
import {
	getPresentationCssVariables,
	getPresentationPalette,
	getTextWidthCssValue,
	presentationPaletteNames,
	resolvePagePresentation,
	resolveSectionSurface,
	resolveThemePresentation,
} from './lib/presentation.mjs';
import { themePresets } from './lib/theme-presets.mjs';
import {
	resolveTypographyConfig,
	typographyProfiles,
	typographyRhythms,
} from './lib/typography.mjs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const stylesheet = await readFile(path.join(repoRoot, 'src', 'styles', 'global.css'), 'utf8');

for (const paletteName of presentationPaletteNames) {
	const palette = getPresentationPalette(paletteName);
	for (const [modeName, mode] of Object.entries(palette.modes)) {
		for (const pair of getPaletteContrastPairs(mode)) {
			const ratio = contrastRatio(pair.foreground, pair.background, pair.backdrop);
			assert.ok(
				ratio + Number.EPSILON >= pair.minimum,
				`${paletteName}/${modeName} ${pair.label} must be at least ${pair.minimum}:1, received ${ratio.toFixed(2)}:1`,
			);
		}

		const variables = getPresentationCssVariables({ paletteModes: { [modeName]: mode } });
		assert.equal(variables[`--palette-${modeName}-primary-text`], mode.semantic.primaryText);
		assert.equal(variables[`--palette-${modeName}-focus-ring`], mode.semantic.focusRing);
		assert.equal(
			variables[`--palette-${modeName}-surface-base-secondary-text`],
			mode.surfaces.base.secondaryTextColor,
		);
	}
}

assert.equal(contrastRatio('#000000', '#ffffff'), 21);
const secondaryText = deriveSecondaryTextColor('#555555', '#ffffff');
assert.ok(
	contrastRatio(secondaryText, '#ffffff') >= presentationEngineContract.contrast.normalText,
	'derived secondary text must retain normal-text contrast',
);

for (const profileName of Object.keys(typographyProfiles)) {
	assert.doesNotThrow(
		() => resolveTypographyConfig({ profile: profileName }),
		`${profileName} must satisfy the typography contract`,
	);
}

for (const [presetName, preset] of Object.entries(themePresets)) {
	assert.doesNotThrow(
		() => resolveThemePresentation(preset, `${presetName} preset`),
		`${presetName} must satisfy the resolved presentation contract`,
	);
}

assert.deepEqual(
	resolvePagePresentation({ preset: 'documentation' }, 'top-theme.yaml', { navigationMode: 'top' }).sectionSurfaces,
	['base', 'soft'],
	'top navigation must retain the preset section background pattern',
);
assert.deepEqual(
	resolvePagePresentation({ preset: 'statement' }, 'sections-theme.yaml', { navigationMode: 'sections' }).sectionSurfaces,
	['base', 'soft', 'emphasis', 'soft'],
	'sections navigation must retain accented section backgrounds',
);
const accentedPresentation = resolvePagePresentation(
	{ preset: 'statement' },
	'sections-theme.yaml',
	{ navigationMode: 'sections' },
);
assert.deepEqual(
	Array.from({ length: 9 }, (_, sectionIndex) => (
		resolveSectionSurface(accentedPresentation, sectionIndex).name
	)),
	['base', 'soft', 'emphasis', 'soft', 'base', 'soft', 'emphasis', 'soft', 'base'],
	'accented section backgrounds must move up and down through the three surfaces',
);
assert.deepEqual(
	resolvePagePresentation({ preset: 'documentation' }, 'tree-theme.yaml', { navigationMode: 'tree' }).sectionSurfaces,
	['base'],
	'tree navigation must use one uniform reading surface',
);
assert.throws(
	() => resolvePagePresentation({
		preset: 'documentation',
		sections: { backgroundPattern: 'alternating' },
	}, 'tree-theme.yaml', { navigationMode: 'tree' }),
	/sections\.backgroundPattern "alternating" cannot be used with tree navigation in tree-theme\.yaml[\s\S]*set it to uniform/,
);

assert.throws(
	() => resolveTypographyConfig({
		overrides: {
			headings: {
				h1: { size: 'small' },
				h2: { size: 'xlarge' },
			},
		},
	}, 'unsafe-theme.yaml'),
	/Typography must preserve H1 > H2 in unsafe-theme\.yaml/,
);

assert.throws(
	() => resolveTypographyConfig({ overrides: { body: { lineHeight: 1.2 } } }, 'unsafe-theme.yaml'),
	/body\.lineHeight must be at least 1\.4 in unsafe-theme\.yaml/,
);

for (const widthName of ['narrow', 'normal', 'wide']) {
	const width = getTextWidthCssValue(widthName);
	const characterMeasure = Number.parseInt(width.match(/min\((\d+)ch/u)?.[1] ?? '', 10);
	assert.ok(Number.isFinite(characterMeasure), `${widthName} must resolve to a character-based measure`);
	assert.ok(
		characterMeasure <= presentationEngineContract.textMeasure.maximumCharacters,
		`${widthName} must not exceed the engine text-measure ceiling`,
	);
}

for (const [rhythmName, rhythm] of Object.entries(typographyRhythms)) {
	for (const [level, values] of Object.entries(rhythm.headings)) {
		for (const [property, value] of Object.entries(values)) {
			assert.match(value, /^(?:0|[\d.]+em)$/u, `${rhythmName}.${level}.${property} must follow text size`);
		}
	}
	assert.match(rhythm.body.paragraphSpacing, /^[\d.]+em$/u);
	assert.match(rhythm.caption.spacingBefore, /^[\d.]+em$/u);
}

for (const requiredSource of [
	'--target-size-minimum: 1.5rem',
	'--focus-indicator-width: 2px',
	'@media (prefers-reduced-motion: reduce)',
	'@media (forced-colors: active)',
	'.section-markdown :not(pre) > code',
	'overflow-wrap: anywhere',
]) {
	assert.match(stylesheet, new RegExp(requiredSource.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&'), 'u'));
}

console.log('Presentation engine contract tests passed.');
