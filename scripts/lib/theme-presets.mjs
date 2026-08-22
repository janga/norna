import { mergeDeep } from './typography.mjs';

export const themePresetNames = [
	'portfolio',
	'documentation',
	'project',
	'statement',
];

export const themePresets = Object.freeze({
	portfolio: Object.freeze({
		layout: {
			density: 'normal',
			pageWidth: '1240px',
			gutter: {
				desktop: 'clamp(1.25rem, 4vw, 3rem)',
				mobile: '1rem',
			},
		},
		images: {
			width: '1000px',
			maxAvailableWidthPercent: { desktop: 100, mobile: 100 },
			maxAvailableHeightPercent: { desktop: 78, mobile: 68 },
		},
		typography: {
			fontFamily: "'Helvetica Neue', Arial, sans-serif",
			profile: 'restrained',
			rhythm: 'normal',
		},
		palette: 'dark',
		sectionSurfaces: ['base'],
	}),
	documentation: Object.freeze({
		layout: {
			density: 'compact',
			pageWidth: '1240px',
			gutter: {
				desktop: 'clamp(1.25rem, 4vw, 3rem)',
				mobile: '1rem',
			},
		},
		images: {
			width: '920px',
			maxAvailableWidthPercent: { desktop: 100, mobile: 100 },
			maxAvailableHeightPercent: { desktop: 74, mobile: 68 },
		},
		typography: {
			fontFamily: "Georgia, 'Times New Roman', serif",
			profile: 'reading',
			rhythm: 'compact',
		},
		palette: 'paper',
		sectionSurfaces: ['base', 'soft'],
	}),
	project: Object.freeze({
		layout: {
			density: 'compact',
			pageWidth: '1120px',
			gutter: {
				desktop: 'clamp(1.25rem, 4vw, 3rem)',
				mobile: '1rem',
			},
		},
		images: {
			width: '840px',
			maxAvailableWidthPercent: { desktop: 100, mobile: 100 },
			maxAvailableHeightPercent: { desktop: 70, mobile: 62 },
		},
		typography: {
			fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
			profile: 'reading',
			rhythm: 'compact',
		},
		palette: 'light',
		sectionSurfaces: ['base', 'soft'],
	}),
	statement: Object.freeze({
		layout: {
			density: 'airy',
			pageWidth: '1280px',
			gutter: {
				desktop: 'clamp(1.5rem, 5vw, 4rem)',
				mobile: '1rem',
			},
		},
		images: {
			width: '1080px',
			maxAvailableWidthPercent: { desktop: 100, mobile: 100 },
			maxAvailableHeightPercent: { desktop: 80, mobile: 70 },
		},
		typography: {
			fontFamily: "'Trebuchet MS', 'Helvetica Neue', Arial, sans-serif",
			profile: 'statement',
			rhythm: 'airy',
		},
		palette: 'paper',
		sectionSurfaces: ['base', 'emphasis'],
	}),
});

export const getThemePreset = (presetName, sourceLabel = 'theme.md') => {
	const preset = themePresets[presetName];

	if (!preset) {
		throw new Error(`Unknown theme preset "${presetName}" in ${sourceLabel}. Use one of: ${themePresetNames.join(', ')}.`);
	}

	return structuredClone(preset);
};

export const resolveThemeConfig = (theme = {}, sourceLabel = 'theme.md') => {
	const presetName = theme?.preset;
	if (presetName === undefined) return structuredClone(theme ?? {});

	const overrides = structuredClone(theme ?? {});
	delete overrides.preset;

	return {
		preset: presetName,
		...mergeDeep(getThemePreset(presetName, sourceLabel), overrides),
	};
};

const quote = (value) => JSON.stringify(value);
const responsiveValueLines = (label, value, indent = 2) => {
	const prefix = ' '.repeat(indent);
	return [
		`${prefix}${label}:`,
		`${prefix}  desktop: ${value.desktop}`,
		`${prefix}  mobile: ${value.mobile}`,
	];
};

export const renderThemePresetReference = (presetName, sourceLabel = 'theme.md') => {
	const preset = getThemePreset(presetName, sourceLabel);
	const { layout, images, typography, palette, sectionSurfaces } = preset;

	return [
		'---',
		`# Original values for Norna's "${presetName}" theme preset.`,
		'# This is a reference file. Norna only loads theme.md.',
		'# Keep the preset in theme.md and copy only the values you want to override.',
		`# Available theme presets: ${themePresetNames.join(', ')}.`,
		`preset: ${presetName}`,
		'',
		'layout:',
		'  # Alternatives: compact, normal, airy.',
		`  density: ${layout.density}`,
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
		'# One value keeps every section on the same surface; multiple values cycle.',
		'# Use one to three unique values from: base, soft, emphasis.',
		`sectionSurfaces: [${sectionSurfaces.join(', ')}]`,
		'---',
		'',
	].join('\n');
};
