import { pathToFileURL } from 'node:url';
import { siteConfigLabel, siteConfigPath, siteThemeLabel } from './site-paths.mjs';
import { readThemeConfig } from './theme-config.mjs';

const { default: siteConfig } = await import(/* @vite-ignore */ pathToFileURL(siteConfigPath).href);
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

const readString = (object, key, path, sourceLabel = siteConfigLabel) => {
	const value = object[key];

	if (typeof value !== 'string' || value.trim() === '') {
		throw new Error(`${path}.${key} must be a non-empty string in ${sourceLabel}.`);
	}

	return value.trim();
};

const readOptionalString = (object, key, path, sourceLabel = siteConfigLabel) => {
	const value = object[key];

	if (value === undefined || value === null || value === '') {
		return null;
	}

	if (typeof value !== 'string' || value.trim() === '') {
		throw new Error(`${path}.${key} must be a non-empty string when set in ${sourceLabel}.`);
	}

	return value.trim();
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

const readBoolean = (object, key, path, fallback) => {
	const value = object[key] ?? fallback;

	if (typeof value !== 'boolean') {
		throw new Error(`${path}.${key} must be a boolean in ${siteConfigLabel}.`);
	}

	return value;
};

const readPositiveInteger = (object, key, path, fallback) => {
	const value = object[key] ?? fallback;

	if (!Number.isInteger(value) || value <= 0) {
		throw new Error(`${path}.${key} must be a positive integer in ${siteConfigLabel}.`);
	}

	return value;
};

const readPositiveNumber = (object, key, path, fallback) => {
	const value = object[key] ?? fallback;

	if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
		throw new Error(`${path}.${key} must be a positive number in ${siteConfigLabel}.`);
	}

	return value;
};

const readUrl = (object, key, path) => {
	const value = readString(object, key, path);

	try {
		return new URL(value).href;
	} catch {
		throw new Error(`${path}.${key} must be an absolute URL in ${siteConfigLabel}.`);
	}
};

const readBasePath = (object, key, path) => {
	const value = object[key] ?? '/';

	if (typeof value !== 'string' || value.trim() === '') {
		throw new Error(`${path}.${key} must be a non-empty URL path in ${siteConfigLabel}.`);
	}

	const normalizedValue = value.trim();

	if (
		!normalizedValue.startsWith('/')
		|| !normalizedValue.endsWith('/')
		|| normalizedValue.includes('//')
		|| /[\s?#]/.test(normalizedValue)
	) {
		throw new Error(`${path}.${key} must start and end with "/" and must not contain whitespace, "?", "#", or "//" in ${siteConfigLabel}.`);
	}

	return normalizedValue;
};

const readSmoothScroll = (navigation) => {
	const rawSmoothScroll = assertObject(navigation.smoothScroll ?? {}, 'navigation.smoothScroll');
	const minimumDurationMs = readPositiveInteger(rawSmoothScroll, 'minimumDurationMs', 'navigation.smoothScroll', 2_000);
	const maximumDurationMs = readPositiveInteger(rawSmoothScroll, 'maximumDurationMs', 'navigation.smoothScroll', 4_000);

	if (maximumDurationMs < minimumDurationMs) {
		throw new Error(`navigation.smoothScroll.maximumDurationMs must be greater than or equal to minimumDurationMs in ${siteConfigLabel}.`);
	}

	return Object.freeze({
		durationPerPixelMs: readPositiveNumber(rawSmoothScroll, 'durationPerPixelMs', 'navigation.smoothScroll', 0.22),
		enabled: readBoolean(rawSmoothScroll, 'enabled', 'navigation.smoothScroll', true),
		maximumDurationMs,
		minimumDurationMs,
	});
};

const readLocale = (rawLocale) => {
	const locale = assertObject(rawLocale ?? {}, 'locale');
	const labels = assertObject(locale.labels ?? {}, 'locale.labels');
	const lang = locale.lang ?? 'en';

	if (typeof lang !== 'string' || !/^[a-zA-Z]{2,3}(?:-[a-zA-Z0-9]+)*$/.test(lang.trim())) {
		throw new Error(`locale.lang must be a valid language tag such as "en" or "sv" in ${siteConfigLabel}.`);
	}

	return Object.freeze({
		lang: lang.trim(),
		labels: Object.freeze({
			closeMenu: readString({ closeMenu: labels.closeMenu ?? 'Close menu' }, 'closeMenu', 'locale.labels'),
			skipToContent: readString({ skipToContent: labels.skipToContent ?? 'Skip to content' }, 'skipToContent', 'locale.labels'),
			sectionNavigation: readString({ sectionNavigation: labels.sectionNavigation ?? 'Sections' }, 'sectionNavigation', 'locale.labels'),
			gallery: readString({ gallery: labels.gallery ?? 'Images' }, 'gallery', 'locale.labels'),
			menu: readString({ menu: labels.menu ?? 'Menu' }, 'menu', 'locale.labels'),
			pageNavigation: readString({ pageNavigation: labels.pageNavigation ?? 'On this page' }, 'pageNavigation', 'locale.labels'),
			siteNavigation: readString({ siteNavigation: labels.siteNavigation ?? 'Pages' }, 'siteNavigation', 'locale.labels'),
		}),
	});
};

const readDateTimeFormat = (object, path) => {
	const dateTimeFormat = assertObject(object, path);
	const locale = readString(dateTimeFormat, 'locale', path);
	const timeZone = readString(dateTimeFormat, 'timeZone', path);
	const dateStyle = readString(dateTimeFormat, 'dateStyle', path);
	const timeStyle = readString(dateTimeFormat, 'timeStyle', path);

	try {
		new Intl.DateTimeFormat(locale, {
			dateStyle,
			timeStyle,
			timeZone,
		});
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		throw new Error(`${path} must be a valid Intl.DateTimeFormat configuration in ${siteConfigLabel}: ${message}`);
	}

	return Object.freeze({
		dateStyle,
		locale,
		timeStyle,
		timeZone,
	});
};

const readBuildInfo = (footer) => {
	const value = footer.buildInfo;

	if (value === undefined || value === null || value === false) {
		return null;
	}

	const buildInfo = assertObject(value, 'footer.buildInfo');

	return Object.freeze({
		enabled: readBoolean(buildInfo, 'enabled', 'footer.buildInfo', true),
		text: readString(buildInfo, 'text', 'footer.buildInfo'),
		dateTimeFormat: readDateTimeFormat(buildInfo.dateTimeFormat, 'footer.buildInfo.dateTimeFormat'),
	});
};

const rawConfig = assertObject(siteConfig, 'default export');
const misplacedThemeKeys = ['layout', 'gallery', 'typography'].filter((key) => key in rawConfig);
if (misplacedThemeKeys.length > 0) {
	throw new Error(`${misplacedThemeKeys.join(', ')} belong in ${siteThemeLabel}, not ${siteConfigLabel}.`);
}

const rawTheme = assertObject(themeConfig, 'theme frontmatter', siteThemeLabel);
const rawSite = assertObject(rawConfig.site, 'site');
const rawLayout = assertObject(rawTheme.layout ?? {}, 'layout', siteThemeLabel);
const rawLayoutSpacing = assertObject(rawLayout.spacing ?? {}, 'layout.spacing', siteThemeLabel);
const rawGallery = assertObject(rawTheme.gallery ?? {}, 'gallery', siteThemeLabel);
const rawTypography = assertObject(rawTheme.typography ?? {}, 'typography', siteThemeLabel);
const rawNavigation = assertObject(rawConfig.navigation ?? {}, 'navigation');
const rawLocale = rawConfig.locale ?? {};
const rawFooter = assertObject(rawConfig.footer ?? {}, 'footer');
const rawGithub = assertObject(rawConfig.github, 'github');
const rawDeploy = assertObject(rawConfig.deploy ?? {}, 'deploy');
const rawDeployWatch = assertObject(rawDeploy.watch ?? {}, 'deploy.watch');

const defaultFontFamily = "Arial, 'Helvetica Neue', Helvetica, sans-serif";

export const projectConfig = Object.freeze({
	site: Object.freeze({
		basePath: readBasePath(rawSite, 'basePath', 'site'),
		url: readUrl(rawSite, 'url', 'site'),
	}),
	layout: Object.freeze({
		gutter: readResponsiveCssLength(rawLayout, 'gutter', 'layout', Object.freeze({
			desktop: 'clamp(1.25rem, 4vw, 3rem)',
			mobile: '1rem',
		}), siteThemeLabel),
		pageWidth: readCssLength(rawLayout, 'pageWidth', 'layout', '1180px', siteThemeLabel),
		spacing: Object.freeze({
			bodyToImages: readResponsiveCssLength(rawLayoutSpacing, 'bodyToImages', 'layout.spacing', Object.freeze({
				desktop: 'clamp(1.25rem, 2.5vw, 2rem)',
				mobile: '1.25rem',
			}), siteThemeLabel),
			finalSectionBottom: readResponsiveCssLength(rawLayoutSpacing, 'finalSectionBottom', 'layout.spacing', Object.freeze({
				desktop: 'clamp(2.55rem, 4.2vw, 3.9rem)',
				mobile: '2.25rem',
			}), siteThemeLabel),
			firstSectionTop: readResponsiveCssLength(rawLayoutSpacing, 'firstSectionTop', 'layout.spacing', Object.freeze({
				desktop: 'clamp(1.875rem, 3vw, 2.75rem)',
				mobile: '1.375rem',
			}), siteThemeLabel),
			imageGap: readResponsiveCssLength(rawLayoutSpacing, 'imageGap', 'layout.spacing', Object.freeze({
				desktop: 'clamp(1.5rem, 3.5vw, 2.75rem)',
				mobile: '2.75rem',
			}), siteThemeLabel),
			sectionGap: readResponsiveCssLength(rawLayoutSpacing, 'sectionGap', 'layout.spacing', Object.freeze({
				desktop: 'clamp(2.55rem, 4.2vw, 3.9rem)',
				mobile: '2.25rem',
			}), siteThemeLabel),
			sectionHeadingToBody: readResponsiveCssLength(rawLayoutSpacing, 'sectionHeadingToBody', 'layout.spacing', Object.freeze({
				desktop: 'clamp(0.5625rem, 1.25vw, 0.75rem)',
				mobile: '0.4375rem',
			}), siteThemeLabel),
			subheadingRuleTop: readResponsiveCssLength(rawLayoutSpacing, 'subheadingRuleTop', 'layout.spacing', Object.freeze({
				desktop: '1rem',
				mobile: '0.8rem',
			}), siteThemeLabel),
			subheadingTop: readResponsiveCssLength(rawLayoutSpacing, 'subheadingTop', 'layout.spacing', Object.freeze({
				desktop: '2rem',
				mobile: '1.6rem',
			}), siteThemeLabel),
		}),
	}),
	gallery: Object.freeze({
		maxAvailableHeightPercent: readResponsivePercent(rawGallery, 'maxAvailableHeightPercent', 'gallery', Object.freeze({
			desktop: 74,
			mobile: 68,
		}), siteThemeLabel),
		maxAvailableWidthPercent: readResponsivePercent(rawGallery, 'maxAvailableWidthPercent', 'gallery', Object.freeze({
			desktop: 100,
			mobile: 100,
		}), siteThemeLabel),
		width: readCssLength(rawGallery, 'width', 'gallery', '900px', siteThemeLabel),
	}),
	typography: Object.freeze({
		fontFamily: readFontFamily(rawTypography, 'fontFamily', 'typography', defaultFontFamily, siteThemeLabel),
	}),
	navigation: Object.freeze({
		smoothScroll: readSmoothScroll(rawNavigation),
	}),
	locale: readLocale(rawLocale),
	footer: Object.freeze({
		buildInfo: readBuildInfo(rawFooter),
		copyrightMessage: readOptionalString(rawFooter, 'copyrightMessage', 'footer'),
	}),
	github: Object.freeze({
		repo: readString(rawGithub, 'repo', 'github'),
		branch: readString(rawGithub, 'branch', 'github'),
		pagesWorkflow: readString(rawGithub, 'pagesWorkflow', 'github'),
	}),
	deploy: Object.freeze({
		watch: Object.freeze({
			intervalMs: readPositiveInteger(rawDeployWatch, 'intervalMs', 'deploy.watch', 10_000),
			timeoutMs: readPositiveInteger(rawDeployWatch, 'timeoutMs', 'deploy.watch', 15 * 60_000),
			runLimit: readPositiveInteger(rawDeployWatch, 'runLimit', 'deploy.watch', 10),
		}),
	}),
});

export default projectConfig;
