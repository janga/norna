import { getPublicAssetInspection } from './logo-assets.mjs';
import {
	socialImageAssetDefinitions,
	socialImageAssetFilenames,
} from './public-asset-conventions.mjs';
import { sitePublicLabel } from './site-paths.mjs';

const definitionsByFilename = new Map(
	socialImageAssetDefinitions.map((definition) => [definition.filename, definition]),
);

export const getSocialImageAssets = () => getPublicAssetInspection().socialImages
	.map((filename) => ({
		...definitionsByFilename.get(filename),
		filename,
		href: `/${filename}`,
	}));

export const getSocialImageAsset = () => {
	const assets = getSocialImageAssets();

	if (assets.length > 1) {
		throw new Error([
			`Found multiple social sharing images in ${sitePublicLabel}. Keep exactly one of ${socialImageAssetFilenames.join(', ')}.`,
			...assets.map(({ filename }) => `- ${sitePublicLabel}/${filename}`),
		].join('\n'));
	}

	return assets[0] ?? null;
};
