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

export const resolveThemePresentation = (theme) => {
	const normalizedTheme = theme ?? {};
	const normalizedThemePresentation = normalizePresentation(normalizedTheme.presentation);

	return {
		backgroundColor: normalizedThemePresentation.backgroundColor ?? fallbackPresentationColors.backgroundColor,
		textColor: normalizedThemePresentation.textColor ?? fallbackPresentationColors.textColor,
		inlineStyles: normalizedThemePresentation.inlineStyles ?? {},
		typography: resolveTypographyConfig(normalizedTheme.typography ?? defaultTypography),
	};
};

export const resolvePagePresentation = (theme, pagePresentation) => {
	const resolvedThemePresentation = resolveThemePresentation(theme);
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

const resolveColorSource = ({ colors, themeFrameColors, pagePresentation }) => {
	if (!colors || colors === 'theme') {
		return themeFrameColors;
	}

	if (colors === 'presentation') {
		return getColorsFromPresentation(pagePresentation);
	}

	return colors;
};

export const resolveFrameColors = ({ theme, pagePresentation, pageFrame }) => {
	const resolvedThemePresentation = resolveThemePresentation(theme);
	const themeFrameColors = resolveColorSource({
		colors: theme?.frame?.colors ?? 'presentation',
		themeFrameColors: getColorsFromPresentation(resolvedThemePresentation),
		pagePresentation: resolvedThemePresentation,
	});

	return resolveColorSource({
		colors: pageFrame?.colors ?? 'theme',
		themeFrameColors,
		pagePresentation,
	});
};
