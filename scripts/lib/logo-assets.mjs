import { readdirSync } from 'node:fs';
import { sitePublicDir, sitePublicLabel } from './site-paths.mjs';
import {
	inspectPublicAssetFilenames,
	logoAssetFilenames,
} from './public-asset-conventions.mjs';

const getPublicAssetFilenames = () => {
	let entries;

	try {
		entries = readdirSync(sitePublicDir, { withFileTypes: true });
	} catch (error) {
		if (error?.code === 'ENOENT') return [];
		throw error;
	}

	return entries.filter((entry) => entry.isFile()).map((entry) => entry.name);
};

export const getPublicAssetInspection = () => inspectPublicAssetFilenames(getPublicAssetFilenames());

export const getLogoAssets = () => getPublicAssetInspection().logos
	.map((entry) => ({
		filename: entry,
		href: `/${entry}`,
	}));

export const getLogoAsset = () => {
	const assets = getLogoAssets();

	if (assets.length > 1) {
		throw new Error([
			`Found multiple logo files in ${sitePublicLabel}. Keep exactly one of ${logoAssetFilenames.join(', ')}.`,
			...assets.map(({ filename }) => `- ${sitePublicLabel}/${filename}`),
		].join('\n'));
	}

	return assets[0] ?? null;
};
