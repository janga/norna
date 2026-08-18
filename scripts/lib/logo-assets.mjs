import { readdirSync } from 'node:fs';
import { sitePublicDir, sitePublicLabel } from './site-paths.mjs';

const logoFilePattern = /^logo\.(svg|png|jpe?g)$/i;

export const getLogoAssets = () => {
	let entries;

	try {
		entries = readdirSync(sitePublicDir, { withFileTypes: true });
	} catch (error) {
		if (error?.code === 'ENOENT') return [];
		throw error;
	}

	return entries
		.filter((entry) => entry.isFile() && logoFilePattern.test(entry.name))
		.map((entry) => ({
			filename: entry.name,
			href: `/${entry.name}`,
		}));
};

export const getLogoAsset = () => {
	const assets = getLogoAssets();

	if (assets.length > 1) {
		throw new Error([
			`Found multiple logo files in ${sitePublicLabel}. Keep exactly one of logo.svg, logo.png, logo.jpg, or logo.jpeg.`,
			...assets.map(({ filename }) => `- ${sitePublicLabel}/${filename}`),
		].join('\n'));
	}

	return assets[0] ?? null;
};
