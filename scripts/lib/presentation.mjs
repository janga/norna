import {
	defaultTypography,
	resolveTypographyConfig,
} from './typography.mjs';
import { resolveThemeConfig } from './theme-presets.mjs';

export const presentationPaletteNames = ['dark', 'light', 'paper'];
const sectionBackgroundPatterns = Object.freeze({
	uniform: ['base'],
	alternating: ['base', 'soft'],
	cycling: ['base', 'soft', 'emphasis'],
});

const presentationPalettes = Object.freeze({
	dark: {
		colorScheme: 'dark',
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
	},
	light: {
		colorScheme: 'light',
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
	},
	paper: {
		colorScheme: 'light',
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
	},
});

export const getPresentationPalette = (paletteName = 'dark') => {
	const palette = presentationPalettes[paletteName];
	if (!palette) {
		throw new Error(`Unknown presentation palette: ${paletteName}. Use one of: ${presentationPaletteNames.join(', ')}`);
	}

	return palette;
};

export const getPresentationCssVariables = (presentation) => {
	const { palette } = presentation;
	return {
		'--color-page': palette.page.backgroundColor,
		'--color-text': palette.page.textColor,
		'--color-surface': palette.css.surface,
		'--color-muted': palette.css.muted,
		'--color-soft': palette.css.soft,
		'--color-accent': palette.css.accent,
		'--color-border': palette.css.border,
		'--color-nav-background': palette.css.navBackground,
		'--color-nav-separator': palette.css.navSeparator,
		'--color-scheme': palette.colorScheme,
	};
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
	const typography = resolveTypographyConfig(normalizedTheme.typography ?? defaultTypography);
	const textWidth = normalizedTheme.layout?.textWidth;
	if (textWidth !== undefined) {
		typography.values.body.width = textWidth;
	}

	return {
		paletteName,
		palette,
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
		...pagePresentation.palette.surfaces[surfaceName],
	};
};

export const resolveFrameColors = ({ theme, sourceLabel }) => resolveThemePresentation(theme, sourceLabel).palette.frame;
