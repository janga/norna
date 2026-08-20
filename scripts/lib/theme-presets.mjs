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
		gallery: {
			width: '1000px',
			maxAvailableWidthPercent: { desktop: 100, mobile: 100 },
			maxAvailableHeightPercent: { desktop: 78, mobile: 68 },
		},
		typography: {
			fontFamily: "'Helvetica Neue', Arial, sans-serif",
			preset: 'quiet-gallery',
			rhythm: 'normal',
		},
		presentation: {
			palette: 'dark',
			sectionSurfaces: {
				mode: 'none',
				sequence: ['base', 'soft', 'emphasis'],
			},
		},
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
		gallery: {
			width: '920px',
			maxAvailableWidthPercent: { desktop: 100, mobile: 100 },
			maxAvailableHeightPercent: { desktop: 74, mobile: 68 },
		},
		typography: {
			fontFamily: "Georgia, 'Times New Roman', serif",
			preset: 'text-forward',
			rhythm: 'compact',
		},
		presentation: {
			palette: 'paper',
			sectionSurfaces: {
				mode: 'cycle',
				sequence: ['base', 'soft'],
			},
		},
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
		gallery: {
			width: '840px',
			maxAvailableWidthPercent: { desktop: 100, mobile: 100 },
			maxAvailableHeightPercent: { desktop: 70, mobile: 62 },
		},
		typography: {
			fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
			preset: 'text-forward',
			rhythm: 'compact',
		},
		presentation: {
			palette: 'light',
			sectionSurfaces: {
				mode: 'cycle',
				sequence: ['base', 'soft'],
			},
		},
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
		gallery: {
			width: '1080px',
			maxAvailableWidthPercent: { desktop: 100, mobile: 100 },
			maxAvailableHeightPercent: { desktop: 80, mobile: 70 },
		},
		typography: {
			fontFamily: "'Trebuchet MS', 'Helvetica Neue', Arial, sans-serif",
			preset: 'statement',
			rhythm: 'airy',
		},
		presentation: {
			palette: 'paper',
			sectionSurfaces: {
				mode: 'cycle',
				sequence: ['base', 'emphasis'],
			},
		},
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
	const { layout, gallery, typography, presentation } = preset;

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
		'gallery:',
		'  # width accepts a positive CSS length.',
		`  width: ${gallery.width}`,
		'  # Percent values must be greater than 0 and at most 100.',
		...responsiveValueLines('maxAvailableWidthPercent', gallery.maxAvailableWidthPercent),
		...responsiveValueLines('maxAvailableHeightPercent', gallery.maxAvailableHeightPercent),
		'',
		'typography:',
		'  # Any valid CSS font-family stack without semicolons.',
		`  fontFamily: ${quote(typography.fontFamily)}`,
		'  # Alternatives: quiet-gallery, compact-gallery, text-forward, statement.',
		`  preset: ${typography.preset}`,
		'  # Alternatives: compact, normal, airy.',
		`  rhythm: ${typography.rhythm}`,
		'  # Fine-grained overrides can target headings.h1-h4, body, and caption.',
		'  # Example:',
		'  # overrides:',
		'  #   headings:',
		'  #     h2:',
		'  #       size: large  # small, medium, large, or xlarge',
		'',
		'presentation:',
		'  # Alternatives: dark, light, paper.',
		`  palette: ${presentation.palette}`,
		'  sectionSurfaces:',
		'    # Alternatives: none, cycle.',
		`    mode: ${presentation.sectionSurfaces.mode}`,
		'    # Use one to three unique values from: base, soft, emphasis.',
		`    sequence: [${presentation.sectionSurfaces.sequence.join(', ')}]`,
		'---',
		'',
	].join('\n');
};
