export const presentationEngineContract = Object.freeze({
	contrast: Object.freeze({
		normalText: 4.5,
		largeText: 3,
		nonText: 3,
	}),
	focus: Object.freeze({
		indicatorWidthCssPixels: 2,
		minimumContrast: 3,
	}),
	pointerTargets: Object.freeze({
		minimumCssPixels: 24,
		comfortableCssPixels: 44,
	}),
	readerPreferences: Object.freeze({
		appearance: Object.freeze(['system', 'light', 'dark']),
		readingWidth: Object.freeze(['narrow', 'standard', 'wide']),
		focusReading: Object.freeze(['off', 'on']),
	}),
	reflow: Object.freeze({
		minimumViewportWidthCssPixels: 320,
		textResizePercent: 200,
		zoomPercent: 400,
	}),
	textMeasure: Object.freeze({
		narrowCharacters: 60,
		standardCharacters: 72,
		maximumCharacters: 80,
	}),
	textSpacing: Object.freeze({
		lineHeight: 1.5,
		paragraphSpacingEm: 2,
		letterSpacingEm: 0.12,
		wordSpacingEm: 0.16,
	}),
});

const statusColors = Object.freeze({
	light: Object.freeze({
		warning: Object.freeze({ accent: '#7a5600', surface: '#fff4c2', text: '#3b2b00' }),
		error: Object.freeze({ accent: '#a12d2d', surface: '#fce8e8', text: '#5f1616' }),
		success: Object.freeze({ accent: '#17643c', surface: '#e4f4e9', text: '#12472e' }),
	}),
	dark: Object.freeze({
		warning: Object.freeze({ accent: '#ffd84d', surface: '#332b12', text: '#fff2be' }),
		error: Object.freeze({ accent: '#ff9a9a', surface: '#3a1d1d', text: '#ffeaea' }),
		success: Object.freeze({ accent: '#7ed5a5', surface: '#173024', text: '#e5f8ed' }),
	}),
});

const clampChannel = (value) => Math.max(0, Math.min(255, Math.round(value)));

const parseAlpha = (value) => {
	if (value === undefined) return 1;
	const normalized = value.trim();
	return normalized.endsWith('%')
		? Number.parseFloat(normalized) / 100
		: Number.parseFloat(normalized);
};

export const parseCssColor = (value) => {
	const normalized = value.trim().toLowerCase();
	const shortHexMatch = normalized.match(/^#([a-f\d])([a-f\d])([a-f\d])$/u);
	if (shortHexMatch) {
		return {
			r: Number.parseInt(shortHexMatch[1].repeat(2), 16),
			g: Number.parseInt(shortHexMatch[2].repeat(2), 16),
			b: Number.parseInt(shortHexMatch[3].repeat(2), 16),
			a: 1,
		};
	}

	const hexMatch = normalized.match(/^#([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/u);
	if (hexMatch) {
		return {
			r: Number.parseInt(hexMatch[1], 16),
			g: Number.parseInt(hexMatch[2], 16),
			b: Number.parseInt(hexMatch[3], 16),
			a: 1,
		};
	}

	const rgbMatch = normalized.match(/^rgba?\(\s*([\d.]+)(?:\s+|\s*,\s*)([\d.]+)(?:\s+|\s*,\s*)([\d.]+)(?:\s*(?:\/|,)\s*([\d.]+%?))?\s*\)$/u);
	if (rgbMatch) {
		return {
			r: clampChannel(Number.parseFloat(rgbMatch[1])),
			g: clampChannel(Number.parseFloat(rgbMatch[2])),
			b: clampChannel(Number.parseFloat(rgbMatch[3])),
			a: Math.max(0, Math.min(1, parseAlpha(rgbMatch[4]))),
		};
	}

	throw new Error(`Unsupported CSS color in the presentation contract: ${value}`);
};

const toHex = ({ r, g, b }) => `#${[r, g, b]
	.map((channel) => clampChannel(channel).toString(16).padStart(2, '0'))
	.join('')}`;

const composite = (foreground, background) => {
	const foregroundColor = typeof foreground === 'string' ? parseCssColor(foreground) : foreground;
	const backgroundColor = typeof background === 'string' ? parseCssColor(background) : background;
	const alpha = foregroundColor.a + (backgroundColor.a * (1 - foregroundColor.a));
	if (alpha === 0) return { r: 0, g: 0, b: 0, a: 0 };

	return {
		r: ((foregroundColor.r * foregroundColor.a) + (backgroundColor.r * backgroundColor.a * (1 - foregroundColor.a))) / alpha,
		g: ((foregroundColor.g * foregroundColor.a) + (backgroundColor.g * backgroundColor.a * (1 - foregroundColor.a))) / alpha,
		b: ((foregroundColor.b * foregroundColor.a) + (backgroundColor.b * backgroundColor.a * (1 - foregroundColor.a))) / alpha,
		a: alpha,
	};
};

const solidColor = (color, backdrop) => {
	const parsed = typeof color === 'string' ? parseCssColor(color) : color;
	if (parsed.a === 1) return parsed;
	if (!backdrop) {
		throw new Error(`A translucent color requires a backdrop in the presentation contract: ${color}`);
	}

	return composite(parsed, backdrop);
};

const channelLuminance = (channel) => {
	const normalized = channel / 255;
	return normalized <= 0.04045
		? normalized / 12.92
		: ((normalized + 0.055) / 1.055) ** 2.4;
};

const luminance = (color, backdrop) => {
	const { r, g, b } = solidColor(color, backdrop);
	return (0.2126 * channelLuminance(r))
		+ (0.7152 * channelLuminance(g))
		+ (0.0722 * channelLuminance(b));
};

export const contrastRatio = (foreground, background, backdrop) => {
	const solidBackground = solidColor(background, backdrop);
	const foregroundLuminance = luminance(foreground, solidBackground);
	const backgroundLuminance = luminance(solidBackground);
	const [lighter, darker] = [foregroundLuminance, backgroundLuminance].sort((left, right) => right - left);
	return (lighter + 0.05) / (darker + 0.05);
};

const mixColors = (foreground, background, foregroundWeight) => {
	const foregroundColor = solidColor(foreground);
	const backgroundColor = solidColor(background);
	const backgroundWeight = 1 - foregroundWeight;

	return toHex({
		r: (foregroundColor.r * foregroundWeight) + (backgroundColor.r * backgroundWeight),
		g: (foregroundColor.g * foregroundWeight) + (backgroundColor.g * backgroundWeight),
		b: (foregroundColor.b * foregroundWeight) + (backgroundColor.b * backgroundWeight),
	});
};

export const deriveSecondaryTextColor = (textColor, backgroundColor) => {
	const minimumContrast = presentationEngineContract.contrast.normalText;
	for (let weight = 0.72; weight <= 1.001; weight += 0.01) {
		const candidate = mixColors(textColor, backgroundColor, Math.min(weight, 1));
		if (contrastRatio(candidate, backgroundColor) >= minimumContrast) return candidate;
	}

	return textColor;
};

export const createSemanticColorRoles = ({ appearance, page, secondaryText, linkText }) => {
	const statuses = statusColors[appearance];
	if (!statuses) throw new Error(`Unknown semantic color appearance: ${appearance}`);

	return Object.freeze({
		primaryText: page.textColor,
		secondaryText,
		linkText,
		focusRing: page.textColor,
		focusRingContrast: page.backgroundColor,
		selectionBackground: page.textColor,
		selectionText: page.backgroundColor,
		controlBackground: 'rgb(0 0 0 / 70%)',
		controlBackgroundActive: 'rgb(0 0 0 / 86%)',
		controlText: '#ffffff',
		codeBackground: '#0d1117',
		codeText: '#f0f6fc',
		warningAccent: statuses.warning.accent,
		warningSurface: statuses.warning.surface,
		warningText: statuses.warning.text,
		errorAccent: statuses.error.accent,
		errorSurface: statuses.error.surface,
		errorText: statuses.error.text,
		successAccent: statuses.success.accent,
		successSurface: statuses.success.surface,
		successText: statuses.success.text,
	});
};

const addPair = (pairs, label, foreground, background, minimum, backdrop) => {
	pairs.push({ label, foreground, background, minimum, backdrop });
};

export const getPaletteContrastPairs = (mode) => {
	const pairs = [];
	const normalText = presentationEngineContract.contrast.normalText;
	const nonText = presentationEngineContract.contrast.nonText;
	const backgrounds = [
		['page', mode.page.backgroundColor],
		['frame', mode.frame.backgroundColor],
		...Object.entries(mode.surfaces).map(([name, surface]) => [`${name} surface`, surface.backgroundColor]),
	];

	addPair(pairs, 'page text', mode.page.textColor, mode.page.backgroundColor, normalText);
	addPair(pairs, 'frame text', mode.frame.textColor, mode.frame.backgroundColor, normalText);
	for (const [surfaceName, surface] of Object.entries(mode.surfaces)) {
		addPair(pairs, `${surfaceName} surface text`, surface.textColor, surface.backgroundColor, normalText);
		addPair(pairs, `${surfaceName} surface secondary text`, surface.secondaryTextColor, surface.backgroundColor, normalText);
	}

	addPair(pairs, 'secondary page text', mode.semantic.secondaryText, mode.page.backgroundColor, normalText);
	addPair(pairs, 'secondary frame text', mode.semantic.secondaryText, mode.frame.backgroundColor, normalText);
	for (const [backgroundName, backgroundColor] of backgrounds) {
		addPair(pairs, `link text on ${backgroundName}`, mode.semantic.linkText, backgroundColor, normalText);
		addPair(pairs, `focus ring on ${backgroundName}`, mode.semantic.focusRing, backgroundColor, nonText);
		addPair(
			pairs,
			`control text on ${backgroundName}`,
			mode.semantic.controlText,
			mode.semantic.controlBackground,
			normalText,
			backgroundColor,
		);
	}

	addPair(pairs, 'focus ring two-color boundary', mode.semantic.focusRing, mode.semantic.focusRingContrast, nonText);
	addPair(pairs, 'selection text', mode.semantic.selectionText, mode.semantic.selectionBackground, normalText);
	addPair(pairs, 'code text', mode.semantic.codeText, mode.semantic.codeBackground, normalText);
	for (const status of ['warning', 'error', 'success']) {
		addPair(
			pairs,
			`${status} text`,
			mode.semantic[`${status}Text`],
			mode.semantic[`${status}Surface`],
			normalText,
		);
		addPair(
			pairs,
			`${status} indicator`,
			mode.semantic[`${status}Accent`],
			mode.semantic[`${status}Surface`],
			nonText,
		);
	}

	return pairs;
};

export const assertPaletteModeContract = (paletteName, modeName, mode) => {
	for (const pair of getPaletteContrastPairs(mode)) {
		const ratio = contrastRatio(pair.foreground, pair.background, pair.backdrop);
		if (ratio + Number.EPSILON < pair.minimum) {
			throw new Error([
				`${paletteName}/${modeName} violates the presentation color contract for ${pair.label}.`,
				`Expected at least ${pair.minimum}:1, received ${ratio.toFixed(2)}:1.`,
			].join(' '));
		}
	}
};
