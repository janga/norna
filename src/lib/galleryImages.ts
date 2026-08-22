import { getGeneratedImage } from './generatedImages';

export type GalleryImage = {
	image: string;
	src?: string;
	alt?: string;
	caption?: string;
};

type GeneratedImageWithDimensions = NonNullable<ReturnType<typeof getGeneratedImage>> & {
	width: number;
	height: number;
};

const hasDimensions = (image: ReturnType<typeof getGeneratedImage>): image is GeneratedImageWithDimensions => (
	Boolean(image) && Number.isFinite(image.width) && Number.isFinite(image.height)
);

export const getCaptionId = (image: GalleryImage, itemIndex: number, imageIndex = 0) => {
	const source = (image.src ?? image.image)
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-|-$/g, '');

	return `gallery-caption-${source}-${itemIndex}-${imageIndex}`;
};

export const getGalleryImageSizes = (maxAvailableWidthPercent: { desktop: number; mobile: number }) => [
	`(max-width: 700px) ${maxAvailableWidthPercent.mobile}vw`,
	`${maxAvailableWidthPercent.desktop}vw`,
].join(', ');

export const getImageClass = (image: GalleryImage) => {
	const generatedImage = getGeneratedImage(image.src ?? image.image);
	return hasDimensions(generatedImage) && generatedImage.width > generatedImage.height
		? 'gallery-image-landscape'
		: undefined;
};

export const getImageLoadingProps = (isPriority: boolean) => ({
	decoding: 'async' as const,
	fetchpriority: isPriority ? 'high' as const : 'low' as const,
	loading: isPriority ? 'eager' as const : 'lazy' as const,
});

export const getCarouselAspectRatio = (images: GalleryImage[]) => {
	const ratios = images
		.map((image) => getGeneratedImage(image.src ?? image.image))
		.filter(hasDimensions)
		.map((image) => image.width / image.height);

	return ratios.length > 0 ? Math.min(...ratios) : null;
};
