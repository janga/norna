const palette = (title, description) => Object.freeze({ title, description });

export const presentationPaletteMetadata = Object.freeze({
	'near-monochrome': palette(
		'Near monochrome',
		'Neutral grays and off-whites with almost no visible hue.',
	),
	'warm-paper': palette(
		'Warm paper',
		'Warm off-whites and browns resembling paper and ink.',
	),
	'retro-earth': palette(
		'Retro earth',
		'Earthy ochres, olives and warm neutrals with a subdued retro character.',
	),
	'clay-rose': palette(
		'Clay rose',
		'Muted clay, rose and wine tones with a warm editorial character.',
	),
	'forest-moss': palette(
		'Forest moss',
		'Botanical greens, mossy surfaces and warm lichen neutrals.',
	),
	'mineral-teal': palette(
		'Mineral teal',
		'Cool mineral greens with muted teal accents and pale aqua-gray surfaces.',
	),
	'arctic-blue': palette(
		'Arctic blue',
		'Cool blue-gray surfaces with clear, restrained blue accents.',
	),
	'soft-lavender': palette(
		'Soft lavender',
		'Quiet lavender surfaces with low-key mauve accents.',
	),
	'vivid-night': palette(
		'Vivid night',
		'Indigo surfaces with a brighter cyan accent and a dark-first character.',
	),
});

export const presentationPaletteNames = Object.freeze(Object.keys(presentationPaletteMetadata));

export const getPresentationPaletteMetadata = (name) => {
	const metadata = presentationPaletteMetadata[name];
	if (!metadata) {
		throw new Error(`Unknown presentation palette metadata: ${name}. Use one of: ${presentationPaletteNames.join(', ')}`);
	}

	return metadata;
};
