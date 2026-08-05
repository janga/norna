import {
	defaultTypography,
	resolveTypographyConfig,
	resolveTypographyOverride,
} from './typography.mjs';

export const fallbackPresentationColors = Object.freeze({
	backgroundColor: 'transparent',
	textColor: 'var(--color-text)',
});

const normalizePresentation = (presentation) => presentation ?? {};

export const resolveThemePresentation = (themePresentation) => {
	const normalizedThemePresentation = normalizePresentation(themePresentation);

	return {
		backgroundColor: normalizedThemePresentation.backgroundColor ?? fallbackPresentationColors.backgroundColor,
		textColor: normalizedThemePresentation.textColor ?? fallbackPresentationColors.textColor,
		inlineStyles: normalizedThemePresentation.inlineStyles ?? {},
		typography: resolveTypographyConfig(normalizedThemePresentation.typography ?? defaultTypography),
	};
};

export const resolvePagePresentation = (themePresentation, pagePresentation) => {
	const resolvedThemePresentation = resolveThemePresentation(themePresentation);
	const normalizedPagePresentation = normalizePresentation(pagePresentation);

	return {
		backgroundColor: normalizedPagePresentation.backgroundColor ?? resolvedThemePresentation.backgroundColor,
		textColor: normalizedPagePresentation.textColor ?? resolvedThemePresentation.textColor,
		inlineStyles: resolvedThemePresentation.inlineStyles,
		typography: resolveTypographyOverride(
			resolvedThemePresentation.typography,
			normalizedPagePresentation.typography,
		),
	};
};

const getColorsFromPresentation = (presentation) => ({
	backgroundColor: presentation.backgroundColor,
	textColor: presentation.textColor,
});

const resolveColorSource = ({ colors, themePresentation, themeFrameColors, pagePresentation }) => {
	if (!colors || colors === 'theme') {
		return themeFrameColors;
	}

	if (colors === 'presentation') {
		return getColorsFromPresentation(pagePresentation);
	}

	return colors;
};

export const resolveFrameColors = ({ themePresentation, themeFrame, pagePresentation, pageFrame }) => {
	const resolvedThemePresentation = resolveThemePresentation(themePresentation);
	const themeFrameColors = resolveColorSource({
		colors: themeFrame?.colors ?? 'presentation',
		themePresentation: resolvedThemePresentation,
		themeFrameColors: getColorsFromPresentation(resolvedThemePresentation),
		pagePresentation: resolvedThemePresentation,
	});

	return resolveColorSource({
		colors: pageFrame?.colors ?? 'theme',
		themePresentation: resolvedThemePresentation,
		themeFrameColors,
		pagePresentation,
	});
};
