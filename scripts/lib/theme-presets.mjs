import { freezeDeep, mergeDeep } from './object.mjs';
import { resolveThemeProfileRecipe } from './theme-profiles.mjs';

export const themePresetRecipes = Object.freeze({
	portfolio: Object.freeze({
		color: 'monochrome-dark',
		typography: 'restrained-sans',
		rhythm: 'balanced',
		geometry: 'image-led',
		media: 'prominent',
		shape: 'square',
		surfaces: 'uniform',
	}),
	documentation: Object.freeze({
		color: 'paper-adaptive',
		typography: 'editorial-reading',
		rhythm: 'compact',
		geometry: 'focused-reading',
		media: 'supporting',
		shape: 'soft',
		surfaces: 'alternating',
	}),
	project: Object.freeze({
		color: 'clear-adaptive',
		typography: 'system-reading',
		rhythm: 'compact',
		geometry: 'balanced-site',
		media: 'balanced',
		shape: 'soft',
		surfaces: 'alternating',
	}),
	statement: Object.freeze({
		color: 'paper-adaptive',
		typography: 'expressive-sans',
		rhythm: 'expansive',
		geometry: 'expansive-statement',
		media: 'immersive',
		shape: 'square',
		surfaces: 'cycling',
	}),
});

export const themePresetDefinitions = Object.freeze({
	portfolio: Object.freeze({
		title: 'Portfolio',
		description: 'For portfolios and image-led sites, with restrained typography and generous space for images.',
		recipe: themePresetRecipes.portfolio,
	}),
	documentation: Object.freeze({
		title: 'Documentation',
		description: 'For guides and reference material, with reading-focused typography and compact spacing.',
		recipe: themePresetRecipes.documentation,
	}),
	project: Object.freeze({
		title: 'Project',
		description: 'For project and product sites that balance explanation, code, cards, and images.',
		recipe: themePresetRecipes.project,
	}),
	statement: Object.freeze({
		title: 'Statement',
		description: 'For short, expressive sites, with larger typography, airy spacing, and stronger section emphasis.',
		recipe: themePresetRecipes.statement,
	}),
});

export const themePresetNames = Object.freeze(Object.keys(themePresetDefinitions));

export const themePresets = Object.freeze(Object.fromEntries(
	themePresetNames.map((name) => [
		name,
		freezeDeep(resolveThemeProfileRecipe(
			themePresetDefinitions[name].recipe,
			`${name} theme preset`,
		)),
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
	const { colorMode, shape, layout, images, typography, palette, sections } = preset;

	return [
		`# Original values for Norna's "${presetName}" theme preset.`,
		`# ${metadata.description}`,
		'# This is a reference file. Norna only loads theme.yaml.',
		'# Keep the preset in theme.yaml and copy only the values you want to override.',
		`# Available theme presets: ${themePresetNames.join(', ')}.`,
		`preset: ${presetName}`,
		'',
		'# The visitor may follow the operating-system preference or choose light or dark.',
		'colorMode:',
		`  default: ${colorMode.default}`,
		`  allowSelection: ${colorMode.allowSelection}`,
		'',
		'# Alternatives: square, soft.',
		`shape: ${shape}`,
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
		'# Alternatives: dark, light, paper.',
		`palette: ${palette}`,
		'sections:',
		'  # Alternatives: uniform, alternating, cycling.',
		`  backgroundPattern: ${sections.backgroundPattern}`,
		'',
	].join('\n');
};
