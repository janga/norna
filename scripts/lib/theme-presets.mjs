import { freezeDeep, mergeDeep } from './object.mjs';
import { resolveThemeProfileRecipe } from './theme-profiles.mjs';

export const themePresetRecipes = Object.freeze({
	portfolio: Object.freeze({
		color: 'near-monochrome-dark',
		typography: 'restrained-sans',
		rhythm: 'balanced',
		geometry: 'image-led',
		media: 'prominent',
		blocks: 'wide-cards',
		corners: 'square',
		surfaces: 'uniform',
	}),
	documentation: Object.freeze({
		color: 'warm-paper-adaptive',
		typography: 'editorial-reading',
		rhythm: 'compact',
		geometry: 'focused-reading',
		media: 'supporting',
		blocks: 'reading-column-cards',
		corners: 'rounded',
		surfaces: 'alternating',
	}),
	project: Object.freeze({
		color: 'cool-green-adaptive',
		typography: 'system-reading',
		rhythm: 'compact',
		geometry: 'balanced-site',
		media: 'balanced',
		blocks: 'balanced-cards',
		corners: 'rounded',
		surfaces: 'alternating',
	}),
	statement: Object.freeze({
		color: 'warm-paper-adaptive',
		typography: 'expressive-sans',
		rhythm: 'expansive',
		geometry: 'expansive-statement',
		media: 'immersive',
		blocks: 'wide-cards',
		corners: 'square',
		surfaces: 'accented',
	}),
});

export const themePresetDefinitions = Object.freeze({
	portfolio: Object.freeze({
		title: 'Portfolio',
		description: 'For portfolios and image-led sites, with restrained typography and generous space for images.',
		recipe: themePresetRecipes.portfolio,
		readerControls: Object.freeze({ colorMode: true }),
	}),
	documentation: Object.freeze({
		title: 'Documentation',
		description: 'For guides and reference material, with reading-focused typography and compact spacing.',
		recipe: themePresetRecipes.documentation,
		readerControls: Object.freeze({ colorMode: true, focusReading: true }),
	}),
	project: Object.freeze({
		title: 'Project',
		description: 'For project and product sites that balance explanation, code, cards, and images.',
		recipe: themePresetRecipes.project,
		readerControls: Object.freeze({ colorMode: true, focusReading: true }),
	}),
	statement: Object.freeze({
		title: 'Statement',
		description: 'For short, expressive sites, with larger typography, airy spacing, and stronger section emphasis.',
		recipe: themePresetRecipes.statement,
		readerControls: Object.freeze({ colorMode: true }),
	}),
});

export const themePresetNames = Object.freeze(Object.keys(themePresetDefinitions));

export const themePresets = Object.freeze(Object.fromEntries(
	themePresetNames.map((name) => [
		name,
		freezeDeep({
			...resolveThemeProfileRecipe(
				themePresetDefinitions[name].recipe,
				`${name} theme preset`,
			),
			readerControls: themePresetDefinitions[name].readerControls,
		}),
	]),
));

export const getThemePresetMetadata = (presetName) => {
	const definition = themePresetDefinitions[presetName];
	if (!definition) return undefined;

	return {
		name: presetName,
		title: definition.title,
		description: definition.description,
	};
};

export const getThemePreset = (presetName, sourceLabel = 'theme.yaml') => {
	const preset = themePresets[presetName];

	if (!preset) {
		throw new Error(`Unknown theme preset "${presetName}" in ${sourceLabel}. Use one of: ${themePresetNames.join(', ')}.`);
	}

	return structuredClone(preset);
};

export const resolveThemeConfig = (theme = {}, sourceLabel = 'theme.yaml') => {
	const presetName = theme?.preset;
	if (presetName === undefined) return structuredClone(theme ?? {});

	const overrides = structuredClone(theme ?? {});
	delete overrides.preset;

	return {
		preset: presetName,
		...mergeDeep(getThemePreset(presetName, sourceLabel), overrides),
	};
};

const mergePageThemePart = (base, override, keys) => Object.fromEntries(keys
	.filter((key) => override?.[key] !== undefined || base?.[key] !== undefined)
	.map((key) => [key, override?.[key] ?? base?.[key]]));

export const mergePageThemeConfig = (base = {}, override = {}) => ({
	...base,
	layout: {
		...(base.layout ?? {}),
		...mergePageThemePart(base.layout, override.layout, ['contentSpacing', 'textWidth']),
	},
	images: {
		...(base.images ?? {}),
		...mergePageThemePart(base.images, override.images, [
			'width',
			'maxAvailableWidthPercent',
			'maxAvailableHeightPercent',
		]),
	},
	sections: {
		...(base.sections ?? {}),
		...mergePageThemePart(base.sections, override.sections, ['backgroundPattern']),
	},
});

const quote = (value) => JSON.stringify(value);
const responsiveValueLines = (label, value, indent = 2) => {
	const prefix = ' '.repeat(indent);
	return [
		`${prefix}${label}:`,
		`${prefix}  desktop: ${value.desktop}`,
		`${prefix}  mobile: ${value.mobile}`,
	];
};

export const renderThemePresetReference = (presetName, sourceLabel = 'theme.yaml') => {
	const preset = getThemePreset(presetName, sourceLabel);
	const metadata = getThemePresetMetadata(presetName);
	const { colorMode, readerControls, corners, layout, images, blocks, typography, palette, sections } = preset;

	return [
		`# Original values for Norna's "${presetName}" theme preset.`,
		`# ${metadata.description}`,
		'# This is a reference file. Norna only loads theme.yaml.',
		'# Keep the preset in theme.yaml and copy only the values you want to override.',
		`# Available theme presets: ${themePresetNames.join(', ')}.`,
		`preset: ${presetName}`,
		'',
		'# Initial appearance. System follows the visitor\'s operating-system preference.',
		'colorMode:',
		`  default: ${colorMode.default}`,
		'',
		'# Optional reader controls shown with the always-available reading-width choice.',
		'readerControls:',
		`  colorMode: ${readerControls.colorMode === true}`,
		`  focusReading: ${readerControls.focusReading === true}`,
		'',
		'# Alternatives: square, rounded.',
		`corners: ${corners}`,
		'',
		'layout:',
		'  # Alternatives: compact, normal, spacious.',
		`  contentSpacing: ${layout.contentSpacing}`,
		'  # Alternatives: narrow, normal, wide.',
		`  textWidth: ${layout.textWidth}`,
		'  # Any positive CSS length, including px, rem, em, %, or clamp(...).',
		`  pageWidth: ${layout.pageWidth}`,
		'  gutter:',
		`    desktop: ${layout.gutter.desktop}`,
		`    mobile: ${layout.gutter.mobile}`,
		'  # Optional spacing overrides use blockGap, finalSectionBottom,',
		'  # firstSectionTop, headingToBlock, imageGap, and sectionGap.',
		'',
		'images:',
		'  # width accepts a positive CSS length.',
		`  width: ${images.width}`,
		'  # Percent values must be greater than 0 and at most 100.',
		...responsiveValueLines('maxAvailableWidthPercent', images.maxAvailableWidthPercent),
		...responsiveValueLines('maxAvailableHeightPercent', images.maxAvailableHeightPercent),
		'',
		'blocks:',
		'  cardList:',
		'    # Alternatives: text, narrow, normal, wide.',
		'    # A width written in a norna-card-list block overrides this default.',
		`    width: ${blocks.cardList.width}`,
		'',
		'typography:',
		'  # Any valid CSS font-family stack without semicolons.',
		`  fontFamily: ${quote(typography.fontFamily)}`,
		'  # Alternatives: restrained, dense, reading, statement.',
		`  profile: ${typography.profile}`,
		'  # Alternatives: compact, normal, airy.',
		`  rhythm: ${typography.rhythm}`,
		'  # Fine-grained overrides can target headings.h1-h4, body, and caption.',
		'  # Example:',
		'  # overrides:',
		'  #   headings:',
		'  #     h2:',
		'  #       size: large  # small, medium, large, or xlarge',
		'',
		'# Alternatives: near-monochrome, cool-green, warm-paper.',
		`palette: ${palette}`,
		'sections:',
		'  # Alternatives: uniform, alternating, accented.',
		'  # Alternating and accented are full-width and unavailable with tree navigation.',
		`  backgroundPattern: ${sections.backgroundPattern}`,
		'',
	].join('\n');
};
