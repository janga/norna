import path from 'node:path';

export const logoAssetFilenames = Object.freeze([
	'logo.svg',
	'logo.png',
	'logo.jpg',
	'logo.jpeg',
]);

export const browserIconAssetDefinitions = Object.freeze([
	Object.freeze({ filename: 'favicon.svg', rel: 'icon', type: 'image/svg+xml' }),
	Object.freeze({ filename: 'favicon.ico', rel: 'icon', sizes: 'any' }),
	Object.freeze({ filename: 'favicon.png', rel: 'icon', type: 'image/png' }),
	Object.freeze({ filename: 'apple-touch-icon.png', rel: 'apple-touch-icon' }),
]);

export const browserIconAssetFilenames = Object.freeze(
	browserIconAssetDefinitions.map(({ filename }) => filename),
);

const logoExtensions = new Set(['.svg', '.png', '.jpg', '.jpeg']);
const faviconExtensions = new Set(['.svg', '.png', '.ico']);
const exactLogoNames = new Set(logoAssetFilenames);
const exactBrowserIconNames = new Set(browserIconAssetFilenames);

export const isLogoAssetFilename = (filename) => exactLogoNames.has(filename);

const editDistance = (left, right) => {
	const rows = Array.from({ length: left.length + 1 }, (_, index) => [index]);
	for (let column = 1; column <= right.length; column += 1) rows[0][column] = column;

	for (let row = 1; row <= left.length; row += 1) {
		for (let column = 1; column <= right.length; column += 1) {
			rows[row][column] = Math.min(
				rows[row - 1][column] + 1,
				rows[row][column - 1] + 1,
				rows[row - 1][column - 1] + (left[row - 1] === right[column - 1] ? 0 : 1),
			);
		}
	}

	return rows[left.length][right.length];
};

const getSuspiciousAsset = (filename) => {
	const lowerFilename = filename.toLowerCase();
	const parsed = path.parse(lowerFilename);

	if (exactLogoNames.has(lowerFilename) && filename !== lowerFilename) {
		return {
			code: 'public-asset-case',
			message: `Norna does not recognize "${filename}" as the navigation logo on case-sensitive file systems. Rename it to "${lowerFilename}".`,
		};
	}

	if (exactBrowserIconNames.has(lowerFilename) && filename !== lowerFilename) {
		return {
			code: 'public-asset-case',
			message: `Norna does not recognize "${filename}" as a browser icon on case-sensitive file systems. Rename it to "${lowerFilename}".`,
		};
	}

	if (parsed.name === 'logo' && !logoExtensions.has(parsed.ext)) {
		return {
			code: 'unsupported-logo-file',
			message: `Norna does not recognize "${filename}" as the navigation logo. Use exactly one of ${logoAssetFilenames.join(', ')}.`,
		};
	}

	if (parsed.name === 'favicon' && !faviconExtensions.has(parsed.ext)) {
		return {
			code: 'unsupported-favicon-file',
			message: `Norna does not link "${filename}" as a browser icon. Use favicon.svg, favicon.ico, or favicon.png.`,
		};
	}

	if (/^favicon[-_.]/.test(lowerFilename) && !exactBrowserIconNames.has(lowerFilename)) {
		return {
			code: 'unrecognized-favicon-file',
			message: `Norna does not link "${filename}" automatically. Use favicon.svg, favicon.ico, favicon.png, or apple-touch-icon.png for convention-based browser icons.`,
		};
	}

	if (logoExtensions.has(parsed.ext) && editDistance(parsed.name, 'logo') === 1) {
		return {
			code: 'possible-logo-typo',
			message: `"${filename}" looks like a misspelled navigation logo filename. Norna recognizes ${logoAssetFilenames.join(', ')}.`,
		};
	}

	if (faviconExtensions.has(parsed.ext) && editDistance(parsed.name, 'favicon') <= 2) {
		return {
			code: 'possible-favicon-typo',
			message: `"${filename}" looks like a misspelled browser icon filename. Norna recognizes favicon.svg, favicon.ico, and favicon.png.`,
		};
	}

	return null;
};

export const inspectPublicAssetFilenames = (filenames) => {
	const files = [...filenames].sort((left, right) => left.localeCompare(right, 'en'));
	const logos = files.filter(isLogoAssetFilename);
	const browserIcons = files.filter((filename) => exactBrowserIconNames.has(filename));
	const suspicious = files.flatMap((filename) => {
		if (isLogoAssetFilename(filename) || exactBrowserIconNames.has(filename)) return [];
		const issue = getSuspiciousAsset(filename);
		return issue ? [{ filename, ...issue }] : [];
	});

	return { browserIcons, files, logos, suspicious };
};
