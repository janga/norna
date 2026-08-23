import { readFile } from 'node:fs/promises';
import {
	validateConfigYamlStructure,
} from './site-content.mjs';
import {
	siteConfigLabel,
	siteConfigPath,
	siteThemeLabel,
} from './site-paths.mjs';
import { readThemeConfig } from './theme-config.mjs';
import { resolveThemeConfig } from './theme-presets.mjs';
import { parseYamlConfig } from './yaml-config.mjs';

const readSiteConfig = async () => {
	const source = await readFile(siteConfigPath, 'utf8').catch((error) => {
		if (error?.code === 'ENOENT') {
			throw new Error(`${siteConfigLabel} is required. Create it before running Norna.`);
		}

		throw error;
	});

	return parseYamlConfig(source, siteConfigLabel, {
		validateStructure: validateConfigYamlStructure,
	});
};

const siteConfig = await readSiteConfig();
const themeConfig = await readThemeConfig();

const cssLengthPattern = String.raw`(?:\d+|\d*\.\d+)(?:px|rem|em|vw|vh|vmin|vmax|ch|%)`;
const simpleCssLengthPattern = new RegExp(`^${cssLengthPattern}$`);
const clampCssLengthPattern = new RegExp(`^clamp\\(\\s*${cssLengthPattern}\\s*,\\s*${cssLengthPattern}\\s*,\\s*${cssLengthPattern}\\s*\\)$`);

const assertObject = (value, path, sourceLabel = siteConfigLabel) => {
	if (!value || typeof value !== 'object' || Array.isArray(value)) {
		throw new Error(`${path} must be an object in ${sourceLabel}.`);
	}

	return value;
};

const readEnum = (object, key, path, allowedValues, fallback, sourceLabel = siteConfigLabel) => {
	const value = object[key] ?? fallback;

	if (!allowedValues.includes(value)) {
		throw new Error(`${path}.${key} must be one of ${allowedValues.join(', ')} in ${sourceLabel}.`);
	}

	return value;
};

const readFontFamily = (object, key, path, fallback, sourceLabel = siteConfigLabel) => {
	const value = object[key] ?? fallback;

	if (typeof value !== 'string' || value.trim() === '') {
		throw new Error(`${path}.${key} must be a non-empty CSS font-family value in ${sourceLabel}.`);
	}

	const normalizedValue = value.trim();

	if (/[\n\r;{}]/.test(normalizedValue)) {
		throw new Error(`${path}.${key} must not contain semicolons, braces, or line breaks in ${sourceLabel}.`);
	}

	return normalizedValue;
};

const readCssLength = (object, key, path, fallback, sourceLabel = siteConfigLabel) => {
	const value = object[key] ?? fallback;

	if (typeof value !== 'string' || value.trim() === '') {
		throw new Error(`${path}.${key} must be a non-empty CSS length in ${sourceLabel}.`);
	}

	const normalizedValue = value.trim();

	if (!simpleCssLengthPattern.test(normalizedValue) || parseFloat(normalizedValue) <= 0) {
		throw new Error(`${path}.${key} must be a CSS length such as "900px", "56rem", or "90%" in ${sourceLabel}.`);
	}

	return normalizedValue;
};

const readCssLengthValue = (value, path, sourceLabel = siteConfigLabel) => {
	if (typeof value !== 'string' || value.trim() === '') {
		throw new Error(`${path} must be a non-empty CSS length in ${sourceLabel}.`);
	}

	const normalizedValue = value.trim();

	if (
		normalizedValue !== '0'
		&& (
			(!simpleCssLengthPattern.test(normalizedValue) && !clampCssLengthPattern.test(normalizedValue))
			|| parseFloat(normalizedValue) < 0
		)
	) {
		throw new Error(`${path} must be a CSS length such as "0", "48px", "3rem", "4vw", or a clamp() of those lengths in ${sourceLabel}.`);
	}

	return normalizedValue;
};

const readResponsiveCssLength = (object, key, path, fallback, sourceLabel = siteConfigLabel) => {
	const value = object[key] ?? fallback;

	if (typeof value === 'string') {
		const length = readCssLengthValue(value, `${path}.${key}`, sourceLabel);

		return Object.freeze({
			desktop: length,
			mobile: length,
		});
	}

	const responsiveValue = assertObject(value, `${path}.${key}`, sourceLabel);

	return Object.freeze({
		desktop: readCssLengthValue(responsiveValue.desktop ?? fallback.desktop, `${path}.${key}.desktop`, sourceLabel),
		mobile: readCssLengthValue(responsiveValue.mobile ?? fallback.mobile, `${path}.${key}.mobile`, sourceLabel),
	});
};

const readPercentValue = (value, path, sourceLabel = siteConfigLabel) => {
	if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0 || value > 100) {
		throw new Error(`${path} must be a number greater than 0 and less than or equal to 100 in ${sourceLabel}.`);
	}

	return value;
};

const readResponsivePercent = (object, key, path, fallback, sourceLabel = siteConfigLabel) => {
	const value = object[key] ?? fallback;

	if (typeof value === 'number') {
		const percent = readPercentValue(value, `${path}.${key}`, sourceLabel);

		return Object.freeze({
			desktop: percent,
			mobile: percent,
		});
	}

	const responsiveValue = assertObject(value, `${path}.${key}`, sourceLabel);

	return Object.freeze({
		desktop: readPercentValue(responsiveValue.desktop ?? fallback.desktop, `${path}.${key}.desktop`, sourceLabel),
		mobile: readPercentValue(responsiveValue.mobile ?? fallback.mobile, `${path}.${key}.mobile`, sourceLabel),
	});
};

const readSiteUrl = (config) => {
	const configuredValue = process.env.NORNA_SITE_URL ?? config.url;

	if (typeof configuredValue !== 'string' || configuredValue.trim() === '') {
		throw new Error(`url must be a non-empty absolute URL in ${siteConfigLabel}.`);
	}

	let url;
	try {
		url = new URL(configuredValue.trim());
	} catch {
		throw new Error(`url must be an absolute URL such as "https://example.com/" in ${siteConfigLabel}.`);
	}

	if (!['http:', 'https:'].includes(url.protocol)) {
		throw new Error(`url must use http or https in ${siteConfigLabel}.`);
	}
	if (url.search || url.hash) {
		throw new Error(`url must not contain a query string or fragment in ${siteConfigLabel}.`);
	}
	if (!url.pathname.endsWith('/')) {
		url.pathname = `${url.pathname}/`;
	}
	if (url.pathname.includes('//')) {
		throw new Error(`url must not contain repeated slashes in its path in ${siteConfigLabel}.`);
	}

	return url;
};

const localeLabels = Object.freeze({
	en: Object.freeze({
		dismissBanner: 'Dismiss notice',
		built: 'Built',
		images: 'Images',
		note: 'Note',
		pageNavigation: 'On this page',
		siteBanners: 'Site notices',
		siteNavigation: 'Pages',
		skipToContent: 'Skip to content',
	}),
	sv: Object.freeze({
		dismissBanner: 'Stäng meddelande',
		built: 'Byggd',
		images: 'Bilder',
		note: 'Not',
		pageNavigation: 'På den här sidan',
		siteBanners: 'Meddelanden',
		siteNavigation: 'Sidor',
		skipToContent: 'Hoppa till innehållet',
	}),
});

const readLocale = (config) => {
	const lang = config.language ?? 'en';

	if (typeof lang !== 'string' || !/^[a-zA-Z]{2,3}(?:-[a-zA-Z0-9]+)*$/.test(lang.trim())) {
		throw new Error(`language must be a valid language tag such as "en" or "sv" in ${siteConfigLabel}.`);
	}

	const normalizedLang = lang.trim();
	const languageKey = normalizedLang.toLowerCase().split('-')[0];
	const labels = localeLabels[languageKey];

	if (!labels) {
		throw new Error(`language "${normalizedLang}" has no built-in Norna UI text. Supported languages: ${Object.keys(localeLabels).join(', ')}.`);
	}

	return Object.freeze({
		lang: normalizedLang,
		labels,
	});
};

const rawConfig = assertObject(siteConfig, 'config YAML');
const rawTheme = assertObject(themeConfig, 'theme YAML', siteThemeLabel);
const siteUrl = readSiteUrl(rawConfig);
const scrollBehaviorNames = ['instant', 'smooth'];

const defaultFontFamily = "Arial, 'Helvetica Neue', Helvetica, sans-serif";
const layoutDensityNames = ['compact', 'normal', 'airy'];
const layoutDensityProfiles = Object.freeze({
	compact: Object.freeze({
		blockGap: Object.freeze({
			desktop: '1.25em',
			mobile: '1.1em',
		}),
		finalSectionBottom: Object.freeze({
			desktop: 'clamp(1.2rem, 2.4vw, 2.25rem)',
			mobile: '1.25rem',
		}),
		firstSectionTop: Object.freeze({
			desktop: 'clamp(1rem, 2vw, 1.75rem)',
			mobile: '1rem',
		}),
		headingToBlock: Object.freeze({
			desktop: '0.65em',
			mobile: '0.6em',
		}),
		imageGap: Object.freeze({
			desktop: 'clamp(1rem, 2vw, 1.5rem)',
			mobile: '1.25rem',
		}),
		sectionGap: Object.freeze({
			desktop: 'clamp(1.2rem, 2.4vw, 2.25rem)',
			mobile: '1.25rem',
		}),
	}),
	normal: Object.freeze({
		blockGap: Object.freeze({
			desktop: '1.5em',
			mobile: '1.25em',
		}),
		finalSectionBottom: Object.freeze({
			desktop: 'clamp(1.4rem, 3vw, 2.75rem)',
			mobile: '1.5rem',
		}),
		firstSectionTop: Object.freeze({
			desktop: 'clamp(1.25rem, 3vw, 2.5rem)',
			mobile: '1.25rem',
		}),
		headingToBlock: Object.freeze({
			desktop: '0.75em',
			mobile: '0.7em',
		}),
		imageGap: Object.freeze({
			desktop: 'clamp(1.25rem, 2.8vw, 2rem)',
			mobile: '1.5rem',
		}),
		sectionGap: Object.freeze({
			desktop: 'clamp(1.4rem, 3vw, 2.75rem)',
			mobile: '1.5rem',
		}),
	}),
	airy: Object.freeze({
		blockGap: Object.freeze({
			desktop: '1.75em',
			mobile: '1.5em',
		}),
		finalSectionBottom: Object.freeze({
			desktop: 'clamp(2.25rem, 5vw, 4.5rem)',
			mobile: '2rem',
		}),
		firstSectionTop: Object.freeze({
			desktop: 'clamp(2rem, 5vw, 4rem)',
			mobile: '1.5rem',
		}),
		headingToBlock: Object.freeze({
			desktop: '0.9em',
			mobile: '0.8em',
		}),
		imageGap: Object.freeze({
			desktop: 'clamp(1.5rem, 3.5vw, 2.75rem)',
			mobile: '2rem',
		}),
		sectionGap: Object.freeze({
			desktop: 'clamp(2.25rem, 5vw, 4.5rem)',
			mobile: '2rem',
		}),
	}),
});
export const resolveThemeVisualConfig = (theme, sourceLabel = siteThemeLabel) => {
	const rawThemeConfig = assertObject(resolveThemeConfig(theme, sourceLabel), 'theme frontmatter', sourceLabel);
	const rawLayoutConfig = assertObject(rawThemeConfig.layout ?? {}, 'layout', sourceLabel);
	const rawLayoutSpacingConfig = assertObject(rawLayoutConfig.spacing ?? {}, 'layout.spacing', sourceLabel);
	const rawImagesConfig = assertObject(rawThemeConfig.images ?? {}, 'images', sourceLabel);
	const rawTypographyConfig = assertObject(rawThemeConfig.typography ?? {}, 'typography', sourceLabel);
	const resolvedLayoutDensity = readEnum(rawLayoutConfig, 'density', 'layout', layoutDensityNames, 'normal', sourceLabel);
	const resolvedLayoutSpacingDefaults = layoutDensityProfiles[resolvedLayoutDensity];

	return Object.freeze({
		layout: Object.freeze({
			density: resolvedLayoutDensity,
			gutter: readResponsiveCssLength(rawLayoutConfig, 'gutter', 'layout', Object.freeze({
				desktop: 'clamp(1.25rem, 4vw, 3rem)',
				mobile: '1rem',
			}), sourceLabel),
			pageWidth: readCssLength(rawLayoutConfig, 'pageWidth', 'layout', '1180px', sourceLabel),
			spacing: Object.freeze({
				blockGap: readResponsiveCssLength(rawLayoutSpacingConfig, 'blockGap', 'layout.spacing', resolvedLayoutSpacingDefaults.blockGap, sourceLabel),
				finalSectionBottom: readResponsiveCssLength(rawLayoutSpacingConfig, 'finalSectionBottom', 'layout.spacing', resolvedLayoutSpacingDefaults.finalSectionBottom, sourceLabel),
				firstSectionTop: readResponsiveCssLength(rawLayoutSpacingConfig, 'firstSectionTop', 'layout.spacing', resolvedLayoutSpacingDefaults.firstSectionTop, sourceLabel),
				headingToBlock: readResponsiveCssLength(rawLayoutSpacingConfig, 'headingToBlock', 'layout.spacing', resolvedLayoutSpacingDefaults.headingToBlock, sourceLabel),
				imageGap: readResponsiveCssLength(rawLayoutSpacingConfig, 'imageGap', 'layout.spacing', resolvedLayoutSpacingDefaults.imageGap, sourceLabel),
				sectionGap: readResponsiveCssLength(rawLayoutSpacingConfig, 'sectionGap', 'layout.spacing', resolvedLayoutSpacingDefaults.sectionGap, sourceLabel),
			}),
		}),
		images: Object.freeze({
			maxAvailableHeightPercent: readResponsivePercent(rawImagesConfig, 'maxAvailableHeightPercent', 'images', Object.freeze({
				desktop: 74,
				mobile: 68,
			}), sourceLabel),
			maxAvailableWidthPercent: readResponsivePercent(rawImagesConfig, 'maxAvailableWidthPercent', 'images', Object.freeze({
				desktop: 100,
				mobile: 100,
			}), sourceLabel),
			width: readCssLength(rawImagesConfig, 'width', 'images', '900px', sourceLabel),
		}),
		typography: Object.freeze({
			fontFamily: readFontFamily(rawTypographyConfig, 'fontFamily', 'typography', defaultFontFamily, sourceLabel),
		}),
	});
};

export const projectConfig = Object.freeze({
	site: Object.freeze({
		basePath: siteUrl.pathname,
		url: siteUrl.href,
	}),
	...resolveThemeVisualConfig(rawTheme, siteThemeLabel),
	navigation: Object.freeze({
		scrollBehavior: readEnum(
			rawConfig,
			'scrollBehavior',
			'config frontmatter',
			scrollBehaviorNames,
			'instant',
		),
	}),
	locale: readLocale(rawConfig),
});

export default projectConfig;
