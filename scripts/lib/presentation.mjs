import {
	defaultTypography,
	resolveTypographyConfig,
} from './typography.mjs';
import { resolveThemeConfig } from './theme-presets.mjs';

export const presentationPaletteNames = ['dark', 'light', 'paper'];
export const colorModeNames = ['system', 'light', 'dark'];
const sectionBackgroundPatterns = Object.freeze({
	uniform: ['base'],
	alternating: ['base', 'soft'],
	cycling: ['base', 'soft', 'emphasis'],
});

const createPaletteMode = ({ page, surfaces, frame, css }) => Object.freeze({
	page: Object.freeze(page),
	surfaces: Object.freeze(Object.fromEntries(Object.entries(surfaces)
		.map(([name, surface]) => [name, Object.freeze(surface)]))),
	frame: Object.freeze(frame),
	css: Object.freeze(css),
});

const presentationPalettes = Object.freeze({
	dark: Object.freeze({
		defaultMode: 'dark',
		modes: Object.freeze({
			light: createPaletteMode({
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
	light: Object.freeze({
		defaultMode: 'light',
		modes: Object.freeze({
			light: createPaletteMode({
				page: { backgroundColor: '#ffffff', textColor: '#17201d' },
				surfaces: {
					base: { backgroundColor: '#ffffff', textColor: '#17201d' },
					soft: { backgroundColor: '#f1f4f2', textColor: '#17201d' },
					emphasis: { backgroundColor: '#dde7e1', textColor: '#17201d' },
				},
				frame: { backgroundColor: '#ffffff', textColor: '#17201d' },
				css: {
					surface: '#f7f8f7',
					muted: '#5e655f',
					soft: '#d9dfda',
					accent: '#38645a',
					border: 'rgb(0 0 0 / 14%)',
					navBackground: 'rgb(255 255 255 / 92%)',
					navSeparator: 'rgb(0 0 0 / 20%)',
				},
			}),
			dark: createPaletteMode({
				page: { backgroundColor: '#0f1512', textColor: '#edf4ef' },
				surfaces: {
					base: { backgroundColor: '#0f1512', textColor: '#edf4ef' },
					soft: { backgroundColor: '#17211c', textColor: '#edf4ef' },
					emphasis: { backgroundColor: '#223129', textColor: '#edf4ef' },
				},
				frame: { backgroundColor: '#0f1512', textColor: '#edf4ef' },
				css: {
					surface: '#151d19',
					muted: '#aab8b0',
					soft: '#2c3b33',
					accent: '#a9d2c4',
					border: 'rgb(237 244 239 / 15%)',
					navBackground: 'rgb(15 21 18 / 92%)',
					navSeparator: 'rgb(237 244 239 / 26%)',
				},
			}),
		}),
	}),
	paper: Object.freeze({
		defaultMode: 'light',
		modes: Object.freeze({
			light: createPaletteMode({
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

export const getPresentationPalette = (paletteName = 'dark') => {
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
		}
		for (const [name, value] of Object.entries(palette.css)) {
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
	const paletteName = normalizedTheme.palette ?? 'dark';
	const palette = getPresentationPalette(paletteName);
	const colorMode = normalizedTheme.colorMode ?? {};
	const defaultColorMode = colorMode.default ?? palette.defaultMode;
	if (!colorModeNames.includes(defaultColorMode)) {
		throw new Error(`colorMode.default must be one of ${colorModeNames.join(', ')} in ${sourceLabel}.`);
	}
	const typography = resolveTypographyConfig(normalizedTheme.typography ?? defaultTypography);
	const textWidth = normalizedTheme.layout?.textWidth;
	if (textWidth !== undefined) {
		typography.values.body.width = textWidth;
	}

	return {
		paletteName,
		palette: palette.modes[defaultColorMode === 'dark' ? 'dark' : 'light'],
		paletteModes: palette.modes,
		colorMode: {
			default: defaultColorMode,
			allowSelection: colorMode.allowSelection === true,
		},
		sectionSurfaces: getSectionSurfaces(normalizedTheme.sections?.backgroundPattern, sourceLabel),
		typography,
	};
};

export const resolvePagePresentation = (theme, sourceLabel) => {
	const resolvedThemePresentation = resolveThemePresentation(theme, sourceLabel);

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
	};
};

export const resolveFrameColors = () => ({
	backgroundColor: 'var(--color-frame-background)',
	textColor: 'var(--color-frame-text)',
});
