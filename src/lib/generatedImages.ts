import { readFileSync, statSync } from 'node:fs';
import projectConfig from '../../scripts/lib/project-config.mjs';
import { generatedImagesManifestPath } from '../../scripts/lib/site-paths.mjs';
import { withBasePath } from './basePath';

type GeneratedImage = {
	kind?: 'static';
	outputVersion?: number;
	sourceHash?: string;
	src?: string;
	width?: number;
	height?: number;
	variants?: Array<{
		src: string;
		width: number;
	}>;
};

let cachedImagesSignature: string | null = null;
let cachedImages: Record<string, GeneratedImage | undefined> = {};

const readGeneratedImages = () => {
	try {
		const manifestStats = statSync(generatedImagesManifestPath);
		const signature = `${manifestStats.mtimeMs}:${manifestStats.size}`;

		if (signature === cachedImagesSignature) {
			return cachedImages;
		}

		cachedImages = JSON.parse(readFileSync(generatedImagesManifestPath, 'utf8')) as Record<string, GeneratedImage | undefined>;
		cachedImagesSignature = signature;
		return cachedImages;
	} catch {
		cachedImagesSignature = null;
		cachedImages = {};
		return {};
	}
};

const maxDisplayImageWidth = 1920;
const fallbackDisplayImageWidth = 1440;

export const getGeneratedImage = (src: string) => readGeneratedImages()[src];

const displaySrc = (src: string) => withBasePath(projectConfig.site.basePath, src);

const getDisplayVariants = (variants: NonNullable<GeneratedImage['variants']>) => {
	const sortedVariants = [...variants].sort((a, b) => a.width - b.width);
	const displayVariants = sortedVariants.filter((variant) => variant.width <= maxDisplayImageWidth);

	return displayVariants.length > 0 ? displayVariants : sortedVariants;
};

const getFallbackVariant = (variants: NonNullable<GeneratedImage['variants']>) => (
	variants.filter((variant) => variant.width <= fallbackDisplayImageWidth).at(-1) ?? variants[0]
);

export const getImageAttributes = (src: string, sizes: string) => {
	const image = getGeneratedImage(src);

	if (!image) {
		return {
			src: displaySrc(src),
			sizes,
		};
	}

	if (image.kind === 'static') {
		return {
			src: displaySrc(image.src ?? src),
			...(Number.isFinite(image.width) && Number.isFinite(image.height)
				? {
					style: `aspect-ratio: ${image.width} / ${image.height};`,
					width: image.width,
					height: image.height,
				}
				: {}),
		};
	}

	if (!image.variants) {
		return {
			src: displaySrc(src),
			sizes,
		};
	}

	const displayVariants = getDisplayVariants(image.variants);
	const fallbackVariant = getFallbackVariant(displayVariants);

	return {
		src: displaySrc(fallbackVariant?.src ?? src),
		srcset: displayVariants.map((variant) => `${displaySrc(variant.src)} ${variant.width}w`).join(', '),
		sizes,
		style: `aspect-ratio: ${image.width} / ${image.height};`,
		width: image.width,
		height: image.height,
	};
};
