import { pathToFileURL } from 'node:url';
import { siteConfigLabel, siteConfigPath } from './site-paths.mjs';

const { default: siteConfig } = await import(/* @vite-ignore */ pathToFileURL(siteConfigPath).href);

const cssLengthPattern = String.raw`(?:\d+|\d*\.\d+)(?:px|rem|em|vw|vh|vmin|vmax|ch|%)`;
const simpleCssLengthPattern = new RegExp(`^${cssLengthPattern}$`);
const clampCssLengthPattern = new RegExp(`^clamp\\(\\s*${cssLengthPattern}\\s*,\\s*${cssLengthPattern}\\s*,\\s*${cssLengthPattern}\\s*\\)$`);

const assertObject = (value, path) => {
	if (!value || typeof value !== 'object' || Array.isArray(value)) {
		throw new Error(`${path} must be an object in ${siteConfigLabel}.`);
	}

	return value;
};

const readString = (object, key, path) => {
	const value = object[key];

	if (typeof value !== 'string' || value.trim() === '') {
		throw new Error(`${path}.${key} must be a non-empty string in ${siteConfigLabel}.`);
	}

	return value.trim();
};

const readOptionalString = (object, key, path) => {
	const value = object[key];

	if (value === undefined || value === null || value === '') {
		return null;
	}

	if (typeof value !== 'string' || value.trim() === '') {
		throw new Error(`${path}.${key} must be a non-empty string when set in ${siteConfigLabel}.`);
	}

	return value.trim();
};

const readFontFamily = (object, key, path, fallback) => {
	const value = object[key] ?? fallback;

	if (typeof value !== 'string' || value.trim() === '') {
		throw new Error(`${path}.${key} must be a non-empty CSS font-family value in ${siteConfigLabel}.`);
	}

	const normalizedValue = value.trim();

	if (/[\n\r;{}]/.test(normalizedValue)) {
		throw new Error(`${path}.${key} must not contain semicolons, braces, or line breaks in ${siteConfigLabel}.`);
	}

	return normalizedValue;
};

const readCssLength = (object, key, path, fallback) => {
	const value = object[key] ?? fallback;

	if (typeof value !== 'string' || value.trim() === '') {
		throw new Error(`${path}.${key} must be a non-empty CSS length in ${siteConfigLabel}.`);
	}

	const normalizedValue = value.trim();

	if (!simpleCssLengthPattern.test(normalizedValue) || parseFloat(normalizedValue) <= 0) {
		throw new Error(`${path}.${key} must be a CSS length such as "900px", "56rem", or "90%" in ${siteConfigLabel}.`);
	}

	return normalizedValue;
};

const readCssLengthValue = (value, path) => {
	if (typeof value !== 'string' || value.trim() === '') {
		throw new Error(`${path} must be a non-empty CSS length in ${siteConfigLabel}.`);
	}

	const normalizedValue = value.trim();

	if (
		(!simpleCssLengthPattern.test(normalizedValue) && !clampCssLengthPattern.test(normalizedValue))
		|| parseFloat(normalizedValue) <= 0
	) {
		throw new Error(`${path} must be a CSS length such as "48px", "3rem", "4vw", or a clamp() of those lengths in ${siteConfigLabel}.`);
	}

	return normalizedValue;
};

const readResponsiveCssLength = (object, key, path, fallback) => {
	const value = object[key] ?? fallback;

	if (typeof value === 'string') {
		const length = readCssLengthValue(value, `${path}.${key}`);

		return Object.freeze({
			desktop: length,
			mobile: length,
		});
	}

	const responsiveValue = assertObject(value, `${path}.${key}`);

	return Object.freeze({
		desktop: readCssLengthValue(responsiveValue.desktop ?? fallback.desktop, `${path}.${key}.desktop`),
		mobile: readCssLengthValue(responsiveValue.mobile ?? fallback.mobile, `${path}.${key}.mobile`),
	});
};

const readPercentValue = (value, path) => {
	if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0 || value > 100) {
		throw new Error(`${path} must be a number greater than 0 and less than or equal to 100 in ${siteConfigLabel}.`);
	}

	return value;
};

const readResponsivePercent = (object, key, path, fallback) => {
	const value = object[key] ?? fallback;

	if (typeof value === 'number') {
		const percent = readPercentValue(value, `${path}.${key}`);

		return Object.freeze({
			desktop: percent,
			mobile: percent,
		});
	}

	const responsiveValue = assertObject(value, `${path}.${key}`);

	return Object.freeze({
		desktop: readPercentValue(responsiveValue.desktop ?? fallback.desktop, `${path}.${key}.desktop`),
		mobile: readPercentValue(responsiveValue.mobile ?? fallback.mobile, `${path}.${key}.mobile`),
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
			skipToContent: readString({ skipToContent: labels.skipToContent ?? 'Skip to content' }, 'skipToContent', 'locale.labels'),
			sectionNavigation: readString({ sectionNavigation: labels.sectionNavigation ?? 'Sections' }, 'sectionNavigation', 'locale.labels'),
			gallery: readString({ gallery: labels.gallery ?? 'Gallery' }, 'gallery', 'locale.labels'),
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
const rawSite = assertObject(rawConfig.site, 'site');
const rawLayout = assertObject(rawConfig.layout ?? {}, 'layout');
const rawGallery = assertObject(rawConfig.gallery ?? {}, 'gallery');
const rawTypography = assertObject(rawConfig.typography ?? {}, 'typography');
const rawNavigation = assertObject(rawConfig.navigation ?? {}, 'navigation');
const rawLocale = rawConfig.locale ?? {};
const rawFooter = assertObject(rawConfig.footer ?? {}, 'footer');
const rawGithub = assertObject(rawConfig.github, 'github');
const rawDeploy = assertObject(rawConfig.deploy ?? {}, 'deploy');
const rawDeployWatch = assertObject(rawDeploy.watch ?? {}, 'deploy.watch');

const defaultFontFamily = "Arial, 'Helvetica Neue', Helvetica, sans-serif";

export const projectConfig = Object.freeze({
	site: Object.freeze({
		url: readUrl(rawSite, 'url', 'site'),
	}),
	layout: Object.freeze({
		gutter: readResponsiveCssLength(rawLayout, 'gutter', 'layout', Object.freeze({
			desktop: 'clamp(1.25rem, 4vw, 3rem)',
			mobile: '1rem',
		})),
		pageWidth: readCssLength(rawLayout, 'pageWidth', 'layout', '1180px'),
	}),
	gallery: Object.freeze({
		maxAvailableHeightPercent: readResponsivePercent(rawGallery, 'maxAvailableHeightPercent', 'gallery', Object.freeze({
			desktop: 74,
			mobile: 68,
		})),
		maxAvailableWidthPercent: readResponsivePercent(rawGallery, 'maxAvailableWidthPercent', 'gallery', Object.freeze({
			desktop: 100,
			mobile: 100,
		})),
		width: readCssLength(rawGallery, 'width', 'gallery', '900px'),
	}),
	typography: Object.freeze({
		fontFamily: readFontFamily(rawTypography, 'fontFamily', 'typography', defaultFontFamily),
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
