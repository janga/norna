import {
	assertTypographyContract,
	defaultTypography,
	resolveTypographyConfig,
} from './typography.mjs';
import {
	assertPaletteModeContract,
	createSemanticColorRoles,
	deriveSecondaryTextColor,
} from './presentation-contract.mjs';
import { resolveThemeConfig } from './theme-presets.mjs';

export const presentationPaletteNames = ['near-monochrome', 'cool-green', 'warm-paper'];
export const colorModeNames = ['system', 'light', 'dark'];
const sectionBackgroundPatterns = Object.freeze({
	uniform: ['base'],
	alternating: ['base', 'soft'],
	accented: ['base', 'soft', 'emphasis', 'soft'],
});

const createPaletteMode = ({ appearance, page, surfaces, frame, css }) => {
	const resolvedSurfaces = Object.fromEntries(Object.entries(surfaces).map(([name, surface]) => [
		name,
		Object.freeze({
			...surface,
			secondaryTextColor: deriveSecondaryTextColor(surface.textColor, surface.backgroundColor),
		}),
	]));

	return Object.freeze({
		page: Object.freeze(page),
		surfaces: Object.freeze(resolvedSurfaces),
		frame: Object.freeze(frame),
		css: Object.freeze(css),
		semantic: createSemanticColorRoles({
			appearance,
			page,
			secondaryText: css.muted,
			linkText: css.accent,
		}),
	});
};

const presentationPalettes = Object.freeze({
	'near-monochrome': Object.freeze({
		defaultMode: 'dark',
		modes: Object.freeze({
			light: createPaletteMode({
				appearance: 'light',
				page: { backgroundColor: '#f7f7f5', textColor: '#171717' },
				surfaces: {
					base: { backgroundColor: '#f7f7f5', textColor: '#171717' },
					soft: { backgroundColor: '#ececea', textColor: '#171717' },
					emphasis: { backgroundColor: '#dadad6', textColor: '#171717' },
				},
				frame: { backgroundColor: '#f7f7f5', textColor: '#171717' },
				css: {
					surface: '#eeeeeb',
					muted: '#666660',
					soft: '#d8d8d3',
					accent: '#4b4b46',
					border: 'rgb(23 23 23 / 16%)',
					navBackground: 'rgb(247 247 245 / 92%)',
					navSeparator: 'rgb(23 23 23 / 24%)',
				},
			}),
			dark: createPaletteMode({
				appearance: 'dark',
				page: { backgroundColor: '#000000', textColor: '#f2eee6' },
				surfaces: {
					base: { backgroundColor: '#000000', textColor: '#f2eee6' },
					soft: { backgroundColor: '#171717', textColor: '#f2eee6' },
					emphasis: { backgroundColor: '#252525', textColor: '#f2eee6' },
				},
				frame: { backgroundColor: '#000000', textColor: '#f2eee6' },
				css: {
					surface: '#101010',
					muted: '#aaa49a',
					soft: '#302f2c',
					accent: '#d8d2c8',
					border: 'rgb(255 255 255 / 14%)',
					navBackground: 'rgb(0 0 0 / 90%)',
					navSeparator: 'rgb(255 255 255 / 28%)',
				},
			}),
		}),
	}),
	'cool-green': Object.freeze({
		defaultMode: 'light',
		modes: Object.freeze({
			light: createPaletteMode({
				appearance: 'light',
				page: { backgroundColor: '#e8f5e9', textColor: '#172319' },
				surfaces: {
					base: { backgroundColor: '#e8f5e9', textColor: '#172319' },
					soft: { backgroundColor: '#d4ead7', textColor: '#172319' },
					emphasis: { backgroundColor: '#b9dbbf', textColor: '#172319' },
				},
				frame: { backgroundColor: '#e8f5e9', textColor: '#172319' },
				css: {
					surface: '#dcecdf',
					muted: '#596b5a',
					soft: '#bed9c3',
					accent: '#2f6339',
					border: 'rgb(23 35 25 / 16%)',
					navBackground: 'rgb(232 245 233 / 92%)',
					navSeparator: 'rgb(23 35 25 / 22%)',
				},
			}),
			dark: createPaletteMode({
				appearance: 'dark',
				page: { backgroundColor: '#101a11', textColor: '#eff7ef' },
				surfaces: {
					base: { backgroundColor: '#101a11', textColor: '#eff7ef' },
					soft: { backgroundColor: '#1a2d1d', textColor: '#eff7ef' },
					emphasis: { backgroundColor: '#29462f', textColor: '#eff7ef' },
				},
				frame: { backgroundColor: '#101a11', textColor: '#eff7ef' },
				css: {
					surface: '#162619',
					muted: '#afc0ae',
					soft: '#355036',
					accent: '#99d5a4',
					border: 'rgb(239 247 239 / 16%)',
					navBackground: 'rgb(16 26 17 / 92%)',
					navSeparator: 'rgb(239 247 239 / 28%)',
				},
			}),
		}),
	}),
	'warm-paper': Object.freeze({
		defaultMode: 'light',
		modes: Object.freeze({
			light: createPaletteMode({
				appearance: 'light',
				page: { backgroundColor: '#f8f5ee', textColor: '#272522' },
				surfaces: {
					base: { backgroundColor: '#f8f5ee', textColor: '#272522' },
					soft: { backgroundColor: '#ebe5d9', textColor: '#272522' },
					emphasis: { backgroundColor: '#ded4c5', textColor: '#272522' },
				},
				frame: { backgroundColor: '#f8f5ee', textColor: '#272522' },
				css: {
					surface: '#f0ebe1',
					muted: '#746e63',
					soft: '#d8d0c4',
					accent: '#685a43',
					border: 'rgb(39 37 34 / 18%)',
					navBackground: 'rgb(248 245 238 / 92%)',
					navSeparator: 'rgb(39 37 34 / 24%)',
				},
			}),
			dark: createPaletteMode({
				appearance: 'dark',
				page: { backgroundColor: '#1b1916', textColor: '#f3ede2' },
				surfaces: {
					base: { backgroundColor: '#1b1916', textColor: '#f3ede2' },
					soft: { backgroundColor: '#25211c', textColor: '#f3ede2' },
					emphasis: { backgroundColor: '#342d25', textColor: '#f3ede2' },
				},
				frame: { backgroundColor: '#1b1916', textColor: '#f3ede2' },
				css: {
					surface: '#211e1a',
					muted: '#b9ad9c',
					soft: '#3b342b',
					accent: '#d5bea0',
					border: 'rgb(243 237 226 / 16%)',
					navBackground: 'rgb(27 25 22 / 92%)',
					navSeparator: 'rgb(243 237 226 / 26%)',
				},
			}),
		}),
	}),
});

for (const [paletteName, palette] of Object.entries(presentationPalettes)) {
	for (const [modeName, mode] of Object.entries(palette.modes)) {
		assertPaletteModeContract(paletteName, modeName, mode);
	}
}

export const getPresentationPalette = (paletteName = 'near-monochrome') => {
	const palette = presentationPalettes[paletteName];
	if (!palette) {
		throw new Error(`Unknown presentation palette: ${paletteName}. Use one of: ${presentationPaletteNames.join(', ')}`);
	}

	return palette;
};

export const getPresentationCssVariables = (presentation) => {
	const variables = {};
	for (const [modeName, palette] of Object.entries(presentation.paletteModes)) {
		const prefix = `--palette-${modeName}`;
		variables[`${prefix}-page-background`] = palette.page.backgroundColor;
		variables[`${prefix}-page-text`] = palette.page.textColor;
		variables[`${prefix}-frame-background`] = palette.frame.backgroundColor;
		variables[`${prefix}-frame-text`] = palette.frame.textColor;
		for (const [surfaceName, surface] of Object.entries(palette.surfaces)) {
			variables[`${prefix}-surface-${surfaceName}-background`] = surface.backgroundColor;
			variables[`${prefix}-surface-${surfaceName}-text`] = surface.textColor;
			variables[`${prefix}-surface-${surfaceName}-secondary-text`] = surface.secondaryTextColor;
		}
		for (const [name, value] of Object.entries(palette.css)) {
			const cssName = name.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
			variables[`${prefix}-${cssName}`] = value;
		}
		for (const [name, value] of Object.entries(palette.semantic)) {
			const cssName = name.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
			variables[`${prefix}-${cssName}`] = value;
		}
	}

	return variables;
};

const getSectionSurfaces = (pattern = 'uniform', sourceLabel = 'theme.yaml') => {
	const surfaces = sectionBackgroundPatterns[pattern];
	if (!surfaces) {
		throw new Error(`sections.backgroundPattern must be one of ${Object.keys(sectionBackgroundPatterns).join(', ')} in ${sourceLabel}.`);
	}

	return surfaces;
};

export const resolveThemePresentation = (theme, sourceLabel = 'theme.yaml') => {
	const normalizedTheme = resolveThemeConfig(theme, sourceLabel);
	const paletteName = normalizedTheme.palette ?? 'near-monochrome';
	const palette = getPresentationPalette(paletteName);
	const colorMode = normalizedTheme.colorMode ?? {};
	const readerControls = normalizedTheme.readerControls ?? {};
	const defaultColorMode = colorMode.default ?? palette.defaultMode;
	if (!colorModeNames.includes(defaultColorMode)) {
		throw new Error(`colorMode.default must be one of ${colorModeNames.join(', ')} in ${sourceLabel}.`);
	}
	const typography = resolveTypographyConfig(normalizedTheme.typography ?? defaultTypography, sourceLabel);
	const textWidth = normalizedTheme.layout?.textWidth;
	if (textWidth !== undefined) {
		typography.values.body.width = textWidth;
	}
	assertTypographyContract(typography, sourceLabel);

	return {
		paletteName,
		palette: palette.modes[defaultColorMode === 'dark' ? 'dark' : 'light'],
		paletteModes: palette.modes,
		colorMode: {
			default: defaultColorMode,
		},
		readerPreferences: {
			controls: {
				appearance: readerControls.colorMode === true,
				readingWidth: true,
				focusReading: readerControls.focusReading === true,
			},
			defaults: {
				appearance: defaultColorMode,
				readingWidth: textWidth === 'narrow' ? 'narrow' : textWidth === 'wide' ? 'wide' : 'standard',
				focusReading: 'off',
			},
		},
		blocks: {
			cardList: {
				width: normalizedTheme.blocks?.cardList?.width ?? 'normal',
			},
		},
		sectionSurfaces: getSectionSurfaces(normalizedTheme.sections?.backgroundPattern, sourceLabel),
		typography,
	};
};

export const assertSectionBackgroundPatternCompatibility = (
	theme,
	sourceLabel = 'theme.yaml',
	navigationMode = 'sections',
) => {
	const requestedPattern = theme?.sections?.backgroundPattern;
	if (navigationMode === 'tree' && requestedPattern !== undefined && requestedPattern !== 'uniform') {
		throw new Error([
			`sections.backgroundPattern "${requestedPattern}" cannot be used with tree navigation in ${sourceLabel}.`,
			'Tree navigation uses one uniform reading surface so the navigation rail and page content remain distinct.',
			'Remove sections.backgroundPattern or set it to uniform.',
		].join('\n'));
	}
};

export const resolvePagePresentation = (theme, sourceLabel, { navigationMode = 'sections' } = {}) => {
	assertSectionBackgroundPatternCompatibility(theme, sourceLabel, navigationMode);

	const resolvedThemePresentation = resolveThemePresentation(theme, sourceLabel);
	if (navigationMode === 'tree') {
		return {
			...resolvedThemePresentation,
			sectionSurfaces: getSectionSurfaces('uniform', sourceLabel),
		};
	}

	return resolvedThemePresentation;
};

const textWidthCssValues = Object.freeze({
	narrow: 'min(60ch, var(--text-width))',
	normal: 'min(72ch, var(--text-width))',
	wide: 'min(72ch, var(--image-layout-width))',
});

export const getTextWidthCssValue = (textWidth) => textWidthCssValues[textWidth];

export const resolveSectionSurface = (pagePresentation, sectionIndex) => {
	const surfaceName = pagePresentation.sectionSurfaces[sectionIndex % pagePresentation.sectionSurfaces.length];

	return {
		name: surfaceName,
		backgroundColor: `var(--color-surface-${surfaceName}-background)`,
		textColor: `var(--color-surface-${surfaceName}-text)`,
		secondaryTextColor: `var(--color-surface-${surfaceName}-secondary-text)`,
	};
};

export const resolveFrameColors = () => ({
	backgroundColor: 'var(--color-frame-background)',
	textColor: 'var(--color-frame-text)',
});
