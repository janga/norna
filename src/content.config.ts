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
const defaultResponsiveTextAlign = z.object({
	desktop: textAlign,
	mobile: textAlign,
}).strict();
const overrideResponsiveTextAlign = z.object({
	desktop: textAlign.optional(),
	mobile: textAlign.optional(),
}).strict().refine(
	(value) => value.desktop !== undefined || value.mobile !== undefined,
	'Specify desktop, mobile, or both.',
);
const defaultTextPresentation = z.object({
	align: defaultResponsiveTextAlign,
	size: textSize,
}).strict();
const overrideTextPresentation = z.object({
	align: overrideResponsiveTextAlign.optional(),
	size: textSize.optional(),
}).strict();
const sectionPresentationOverride = z.object({
	backgroundColor: colorValue.optional(),
	textColor: colorValue.optional(),
	heading: overrideTextPresentation.optional(),
	body: overrideTextPresentation.optional(),
}).strict();
const defaultPresentation = z.object({
	backgroundColor: colorValue.optional(),
	textColor: colorValue.optional(),
	heading: defaultTextPresentation,
	body: defaultTextPresentation,
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
const notice = z.object({
	id: z.string().regex(/^[a-z0-9-]+$/),
	title: z.string(),
	text: z.string().optional(),
	href: z.string().min(1),
	visible: visibilityWindow.optional(),
}).strict();

const siteSchema = z.object({
	title: z.string(),
	description: z.string(),
	defaultPresentation: defaultPresentation.optional(),
	notices: z.array(notice).optional().default([]),
	sections: z.array(
		z.object({
			id: z.string().regex(/^[a-z0-9-]+$/),
			visible: visibilityWindow.optional(),
			presentation: sectionPresentationOverride.optional(),
			gallery: z.array(galleryItem).optional().default([]),
		}).strict(),
	).min(1),
});

const site = defineCollection({
	loader: glob({
		pattern: 'content.md',
		base: pathToFileURL(siteDir),
		generateId: () => siteEntryId,
	}),
	schema: siteSchema,
});

export const collections = { site };
