import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { pathToFileURL } from 'node:url';
import { z } from 'astro/zod';
import { siteDir, siteDirLabel } from '../scripts/lib/site-paths.mjs';
import { isDateOnly } from './lib/visibility';

const siteEntryId = `${siteDirLabel
	.replace(/^[./\\]+/, '')
	.replace(/[^a-zA-Z0-9-]+/g, '-')
	.replace(/^-+|-+$/g, '') || 'site'}-content`;
const contentImageName = z.string().regex(/^[a-z0-9][a-z0-9.-]*\.(jpe?g|png)$/i);
const colorValue = z.string().regex(
	/^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/,
	'Use a hex color such as "#000000".',
);
const textAlign = z.enum(['left', 'center', 'right']);
const textSize = z.enum(['small', 'medium', 'large', 'xlarge']);
const typographyPreset = z.enum(['quiet-gallery', 'compact-gallery', 'text-forward', 'statement']);
const lineHeight = z.number()
	.min(1, 'Use a unitless line height of at least 1.')
	.max(3, 'Use a unitless line height of at most 3.');
const cssLength = z.string().regex(
	/^(?:0|(?:\d+(?:\.\d+)?|\.\d+)(?:px|rem|em|ch|lh))$/,
	'Use a CSS length such as "0", "0.8em", "1rem", or "12px".',
);
const inlineStyleName = z.string().regex(/^[a-z][a-z0-9-]*$/);
const dateOnly = z.string()
	.regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD format.')
	.refine(isDateOnly, 'Use a real calendar date.');
const visibilityWindow = z.object({
	from: dateOnly.optional(),
	until: dateOnly.optional(),
}).strict().refine(
	(value) => value.from !== undefined || value.until !== undefined,
	'Specify from, until, or both.',
).refine(
	(value) => value.from === undefined || value.until === undefined || value.from < value.until,
	'visible.until must be later than visible.from.',
);
const overrideResponsiveTextAlign = z.object({
	desktop: textAlign.optional(),
	mobile: textAlign.optional(),
}).strict().refine(
	(value) => value.desktop !== undefined || value.mobile !== undefined,
	'Specify desktop, mobile, or both.',
);
const commonTextPresentationOverride = {
	align: overrideResponsiveTextAlign.optional(),
	size: textSize.optional(),
	lineHeight: lineHeight.optional(),
};
const headingPresentationOverride = z.object({
	...commonTextPresentationOverride,
	spacing: cssLength.optional(),
}).strict();
const bodyPresentationOverride = z.object({
	...commonTextPresentationOverride,
	paragraphSpacing: cssLength.optional(),
}).strict();
const captionPresentationOverride = z.object({
	...commonTextPresentationOverride,
	spacing: cssLength.optional(),
}).strict();
const typographyOverrides = z.object({
	heading: headingPresentationOverride.optional(),
	body: bodyPresentationOverride.optional(),
	caption: captionPresentationOverride.optional(),
}).strict();
const typography = z.object({
	preset: typographyPreset.optional(),
	overrides: typographyOverrides.optional(),
}).strict().refine(
	(value) => value.preset !== undefined || value.overrides !== undefined,
	'Specify preset, overrides, or both.',
);
const sectionPresentationOverride = z.object({
	backgroundColor: colorValue.optional(),
	textColor: colorValue.optional(),
	typography: typography.optional(),
}).strict();
const themePresentation = z.object({
	backgroundColor: colorValue.optional(),
	textColor: colorValue.optional(),
	inlineStyles: z.record(inlineStyleName, z.object({
		color: colorValue,
	}).strict()).optional(),
	typography: typography.optional(),
}).strict();
const pagePresentation = z.object({
	backgroundColor: colorValue.optional(),
	textColor: colorValue.optional(),
	typography: typography.optional(),
}).strict();
const frameColors = z.union([
	z.enum(['theme', 'presentation']),
	z.object({
		backgroundColor: colorValue,
		textColor: colorValue,
	}).strict(),
]);
const frame = z.object({
	colors: frameColors.optional(),
}).strict();

const galleryImage = z.object({
	image: contentImageName,
	alt: z.string(),
	caption: z.string().optional(),
}).strict();
const galleryCarousel = z.object({
	carousel: z.array(galleryImage).min(2, 'A carousel must contain at least two images.'),
}).strict();
const galleryItem = z.union([galleryImage, galleryCarousel]);

const siteSchema = z.object({
	title: z.string(),
	description: z.string(),
	presentation: pagePresentation.optional(),
	frame: frame.optional(),
	sections: z.array(
		z.object({
			id: z.string().regex(/^[a-z0-9-]+$/),
			visible: visibilityWindow.optional(),
			presentation: sectionPresentationOverride.optional(),
			gallery: z.array(galleryItem).optional().default([]),
		}).strict(),
	).min(1),
});

const themeSchema = z.object({
	presentation: themePresentation.optional(),
	frame: frame.optional(),
}).strict();

const site = defineCollection({
	loader: glob({
		pattern: 'content.md',
		base: pathToFileURL(siteDir),
		generateId: () => siteEntryId,
	}),
	schema: siteSchema,
});

const theme = defineCollection({
	loader: glob({
		pattern: 'theme.md',
		base: pathToFileURL(siteDir),
		generateId: () => `${siteEntryId.replace(/-content$/, '')}-theme`,
	}),
	schema: themeSchema,
});

export const collections = { site, theme };
