import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
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
const stylesDirectory = path.join(repoRoot, 'src', 'styles');
const stylesheetFiles = (await readdir(stylesDirectory))
	.filter((fileName) => fileName.endsWith('.css'))
	.sort((left, right) => left.localeCompare(right, 'en'));
const stylesheet = (await Promise.all(stylesheetFiles.map((fileName) => (
	readFile(path.join(stylesDirectory, fileName), 'utf8')
)))).join('\n');
const noteLaneBoundaryComponents = await Promise.all([
	'CardList.astro',
	'ImageCarousel.astro',
	'ImageStack.astro',
].map((fileName) => readFile(path.join(repoRoot, 'src', 'components', fileName), 'utf8')));
const tableRenderPlugin = await readFile(path.join(repoRoot, 'scripts', 'lib', 'table-render-plugin.mjs'), 'utf8');
const tableOverflowScript = await readFile(path.join(repoRoot, 'src', 'components', 'TableOverflowScript.astro'), 'utf8');
const imageStackEnhancement = await readFile(path.join(repoRoot, 'src', 'components', 'ImageStackEnhancement.astro'), 'utf8');
const siteNavigationSource = await readFile(path.join(repoRoot, 'src', 'components', 'SiteNavigation.astro'), 'utf8');
const sectionNavigationScript = await readFile(path.join(repoRoot, 'src', 'components', 'SectionNavigationScript.astro'), 'utf8');

for (const paletteName of presentationPaletteNames) {
	const palette = getPresentationPalette(paletteName);
	for (const [modeName, mode] of Object.entries(palette.modes)) {
		assert.deepEqual(
			mode.frame,
			mode.page,
			`${paletteName}/${modeName} must use the page colors for the site frame`,
		);
		assert.equal(
			mode.surfaces.base.backgroundColor,
			mode.page.backgroundColor,
			`${paletteName}/${modeName} base surface must match the page background`,
		);
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
		assert.equal(
			Object.hasOwn(variables, `--palette-${modeName}-nav-background`),
			false,
			`${paletteName}/${modeName} must not define a separate navigation background`,
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
assert.equal(
	resolvePagePresentation({ preset: 'statement' }, 'tree-theme.yaml', { navigationMode: 'tree' })
		.readerPreferences.controls.focusReading,
	true,
	'tree navigation must make focus reading available even when the preset disables it',
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

assert.match(
	stylesheet,
	/\.site-top\s*\{[\s\S]*?background-color:\s*var\(--site-top-background-color,\s*var\(--color-page\)\)/u,
	'the sticky header must fall back to the page background',
);
assert.doesNotMatch(
	stylesheet,
	/backdrop-filter\s*:/u,
	'opaque navigation surfaces must not depend on backdrop filtering',
);
assert.match(
	stylesheet,
	/\.tree-local-navigation\s*\{[\s\S]*?border-inline-end:\s*1px solid var\(--color-nav-separator\)/u,
	'tree navigation must use one low-contrast boundary against the content canvas',
);
assert.match(
	stylesheet,
	/:root\[data-appearance='dark'\][\s\S]*?:is\(\.tree-local-navigation, \.mobile-site-nav, \.page-contents-navigation\)\s*\{[\s\S]*?var\(--color-surface-emphasis-background\) 64%[\s\S]*?var\(--color-surface-soft-background\)/u,
	'Dark persistent, compact, and Page contents navigation must share a palette-derived current-item marker',
);
assert.match(
	stylesheet,
	/\.page-contents-navigation-rail\s*\{[\s\S]*?border-inline-start:\s*1px solid var\(--color-nav-separator\)/u,
	'the contents rail must close the opposite edge of the content canvas',
);
assert.match(
	stylesheet,
	/\.content-block-note-lane-boundary\s*\{[\s\S]*?clear:\s*both/u,
	'wide content blocks must clear preceding margin notes through one shared layout boundary',
);
for (const componentSource of noteLaneBoundaryComponents) {
	assert.match(
		componentSource,
		/content-block-note-lane-boundary/u,
		'every existing wide structured block must use the shared note-lane boundary',
	);
}
assert.match(
	tableRenderPlugin,
	/className:\s*\['norna-table-frame',\s*'content-block-note-lane-boundary'\]/u,
	'Markdown tables must claim the shared note lane through their generated frame',
);
assert.match(
	stylesheet,
	/\.norna-table-frame\[data-table-overflow='true'\]\[data-table-at-end='false'\]::after[\s\S]*?opacity:\s*1/u,
	'a horizontally clipped table must expose a visible cue toward hidden columns',
);
assert.match(
	stylesheet,
	/\.section-markdown > \.norna-table-frame\[data-table-overflow='false'\] thead th\s*\{[\s\S]*?position:\s*sticky[\s\S]*?top:\s*var\(--site-top-anchor-offset\)/u,
	'a fitting page-level table must use native sticky column headings',
);
assert.match(
	stylesheet,
	/\.norna-table-navigation\s*\{[\s\S]*?background:\s*var\(--section-background-color, var\(--color-page\)\)/u,
	'the sticky table-control carrier must mask rows with the owning section background',
);
assert.match(
	stylesheet,
	/\.norna-table-frame\s*\{[\s\S]*?width:\s*100%[\s\S]*?\.section-markdown > \.norna-table-frame\s*\{[\s\S]*?--table-prose-width:\s*100%[\s\S]*?--table-end-width:[\s\S]*?--table-canvas-width:/u,
	'nested tables must stay within their parent while top-level tables expose adaptive data lanes',
);
assert.doesNotMatch(
	stylesheet,
	/\.section-markdown table\s*\{[\s\S]*?display:\s*block/u,
	'the native table must not double as its horizontal scrolling container',
);
assert.match(
	stylesheet,
	/\.managed-image-item\[data-image-caption-placement='persistent'\][\s\S]*?\.image-details\s*\{[\s\S]*?position:\s*sticky[\s\S]*?top:\s*calc\(var\(--site-top-anchor-offset\) \+ 1rem\)/u,
	'persistent image captions must remain bounded by their figure and below the sticky header',
);
for (const requiredSource of [
	"figure.dataset.imageCaptionPlacement = 'persistent'",
	"layout.querySelectorAll<HTMLElement>('.page-contents-navigation-rail')",
	"layout.dataset.pageContentsPlacement === 'contents-rail'",
	"document.documentElement.dataset.focusReading !== 'on'",
	"attributeFilter: ['data-focus-reading', 'data-reading-width']",
]) {
	assert.match(
		imageStackEnhancement,
		new RegExp(requiredSource.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&'), 'u'),
		'tall-image caption placement must respond to lane ownership and reader preferences',
	);
}
for (const requiredSource of [
	"frame.dataset.tableOverflow = hasOverflow ? 'true' : 'false'",
	"frame.dataset.tableAtStart = isAtStart ? 'true' : 'false'",
	"frame.dataset.tableAtEnd = isAtEnd ? 'true' : 'false'",
	"frame.dataset.tableStickyHeading = stickyHeadingReady ? 'true' : 'false'",
	"tableNavigation.hidden = !hasOverflow",
	"previousButton.disabled = isAtStart",
	"nextButton.disabled = isAtEnd",
	"Math.round(scrollRegion.clientWidth * 0.8)",
	"scrollRegion.scrollBy({",
	"setOverflowDescription(hasOverflow)",
	"scrollRegion.setAttribute('tabindex', '0')",
	'scrollRegion.removeAttribute(\'tabindex\')',
	"const isTopLevel = frame.parentElement?.classList.contains('section-markdown') === true",
	"const candidates: TableLayout[] = ['prose', 'end', 'canvas']",
	'const selected = candidates.find(tableFitsLayout)',
	"stickyHeading.setAttribute('aria-hidden', 'true')",
	"stickyHeading.setAttribute('inert', '')",
	'stickyHeadingTrack.style.transform',
	'updateOverflow({ refreshStickyHeading: true })',
]) {
	assert.match(
		tableOverflowScript,
		new RegExp(requiredSource.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&'), 'u'),
		'table overflow enhancement must expose measured, keyboard-reachable overflow state',
	);
}
assert.doesNotMatch(
	tableOverflowScript,
	/document\.createElement\(['"]table['"]\)/u,
	'the sticky enhancement must not create a second table element',
);
assert.match(
	stylesheet,
	/:root\[data-reader-preferences-ready='true'\]\[data-focus-reading='on'\] \.mobile-nav-menu\s*\{[\s\S]*?display:\s*block/u,
	'Focus reading must expose the compact navigation trigger only after its enhancement is ready',
);
assert.match(
	stylesheet,
	/:root\[data-reader-preferences-ready='true'\]\[data-focus-reading='on'\] :is\([\s\S]*?\.site-nav,[\s\S]*?\.tree-local-navigation,[\s\S]*?\.page-contents-navigation/u,
	'Focus reading must replace persistent navigation with the compact trigger',
);
assert.match(
	siteNavigationSource,
	/data-compact-navigation-panel[\s\S]*?role="dialog"[\s\S]*?aria-modal="true"/u,
	'the compact navigation overlay must expose modal dialog semantics',
);
assert.match(
	siteNavigationSource,
	/data-compact-navigation-close[\s\S]*?aria-label=\{projectConfig\.locale\.labels\.closeNavigation\}/u,
	'the compact navigation overlay must provide a localized close control',
);
for (const requiredSource of [
	"element.setAttribute('inert', '')",
	"element.removeAttribute('inert')",
	'mobileMenuClose?.focus()',
	'mobileMenuSummary?.focus()',
]) {
	assert.match(
		sectionNavigationScript,
		new RegExp(requiredSource.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&'), 'u'),
		'compact navigation must contain focus and restore the surrounding document',
	);
}

console.log('Presentation engine contract tests passed.');
