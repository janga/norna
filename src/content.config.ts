import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { pathToFileURL } from 'node:url';
import { z } from 'astro/zod';
import { siteDir, siteDirLabel } from '../scripts/lib/site-paths.mjs';
import { parseRouteDirectory } from '../scripts/lib/route-model.mjs';
import { isDateOnly } from './lib/visibility';

const siteEntryId = `${siteDirLabel
	.replace(/^[./\\]+/, '')
	.replace(/[^a-zA-Z0-9-]+/g, '-')
	.replace(/^-+|-+$/g, '') || 'site'}-content`;
const textAlign = z.enum(['left', 'center', 'right']);
const textSize = z.enum(['small', 'medium', 'large', 'xlarge']);
const textWidth = z.enum(['narrow', 'normal', 'wide']);
const headingWeight = z.union([z.literal(400), z.literal(500), z.literal(600), z.literal(700)]);
const typographyPreset = z.enum(['quiet-gallery', 'compact-gallery', 'text-forward', 'statement']);
const presentationPalette = z.enum(['dark', 'light', 'paper']);
const sectionSurfaceMode = z.enum(['none', 'cycle']);
const sectionSurface = z.enum(['base', 'soft', 'emphasis']);
const spacingDensity = z.enum(['compact', 'normal', 'airy']);
const lineHeight = z.number()
	.min(1, 'Use a unitless line height of at least 1.')
	.max(3, 'Use a unitless line height of at most 3.');
const cssLength = z.string().regex(
	/^(?:0|(?:\d+(?:\.\d+)?|\.\d+)(?:px|rem|em|ch|lh))$/,
	'Use a CSS length such as "0", "0.8em", "1rem", or "12px".',
);
const visualCssLengthUnit = String.raw`(?:px|rem|em|vw|vh|vmin|vmax|ch|%)`;
const visualCssLengthValue = String.raw`(?:\d+(?:\.\d+)?|\.\d+)${visualCssLengthUnit}`;
const visualCssLength = z.string().regex(
	new RegExp(`^(?:0|${visualCssLengthValue}|clamp\\(\\s*${visualCssLengthValue}\\s*,\\s*${visualCssLengthValue}\\s*,\\s*${visualCssLengthValue}\\s*\\))$`),
	'Use a CSS length such as "0", "900px", "56rem", "90%", or "clamp(1rem, 4vw, 3rem)".',
);
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
	weight: headingWeight.optional(),
	spacingBefore: cssLength.optional(),
	spacingAfter: cssLength.optional(),
}).strict();
const headingLevelsPresentationOverride = z.object({
	h1: headingPresentationOverride.optional(),
	h2: headingPresentationOverride.optional(),
	h3: headingPresentationOverride.optional(),
	h4: headingPresentationOverride.optional(),
}).strict();
const bodyPresentationOverride = z.object({
	...commonTextPresentationOverride,
	width: textWidth.optional(),
	paragraphSpacing: cssLength.optional(),
}).strict();
const captionPresentationOverride = z.object({
	...commonTextPresentationOverride,
	spacingBefore: cssLength.optional(),
}).strict();
const typographyOverrides = z.object({
	headings: headingLevelsPresentationOverride.optional(),
	body: bodyPresentationOverride.optional(),
	caption: captionPresentationOverride.optional(),
}).strict();
const themeTypography = z.object({
	fontFamily: z.string()
		.min(1)
		.refine((value) => !/[\n\r;{}]/.test(value), 'Do not use semicolons, braces, or line breaks.').optional(),
	preset: typographyPreset.optional(),
	rhythm: spacingDensity.optional(),
	overrides: typographyOverrides.optional(),
}).strict().refine(
	(value) => value.fontFamily !== undefined || value.preset !== undefined || value.rhythm !== undefined || value.overrides !== undefined,
	'Specify fontFamily, preset, rhythm, overrides, or both.',
);
const responsiveCssLength = z.union([
	visualCssLength,
	z.object({
		desktop: visualCssLength,
		mobile: visualCssLength,
	}).strict(),
]);
const responsivePercent = z.union([
	z.number().positive().max(100),
	z.object({
		desktop: z.number().positive().max(100),
		mobile: z.number().positive().max(100),
	}).strict(),
]);
const themeLayoutSpacing = z.object({
	blockGap: responsiveCssLength.optional(),
	finalSectionBottom: responsiveCssLength.optional(),
	firstSectionTop: responsiveCssLength.optional(),
	headingToBlock: responsiveCssLength.optional(),
	imageGap: responsiveCssLength.optional(),
	sectionGap: responsiveCssLength.optional(),
}).strict();
const themeLayout = z.object({
	density: spacingDensity.optional(),
	pageWidth: visualCssLength.optional(),
	gutter: responsiveCssLength.optional(),
	spacing: themeLayoutSpacing.optional(),
}).strict();
const themeGallery = z.object({
	width: visualCssLength.optional(),
	maxAvailableWidthPercent: responsivePercent.optional(),
	maxAvailableHeightPercent: responsivePercent.optional(),
}).strict();
const themePresentation = z.object({
	palette: presentationPalette.optional(),
	sectionSurfaces: z.object({
		mode: sectionSurfaceMode,
		sequence: z.array(sectionSurface).min(1).max(3).optional(),
	}).strict().refine(
		(value) => !value.sequence || new Set(value.sequence).size === value.sequence.length,
		'Each section surface may appear only once in a sequence.',
	).optional(),
}).strict();
const pageNavigation = z.object({
	include: z.boolean().optional(),
	label: z.string().optional(),
}).strict();
const themeNavigation = z.object({
	brand: z.string().min(1).optional(),
	logo: z.object({
		alt: z.string().min(1).optional(),
		height: visualCssLength.optional(),
	}).strict().optional(),
}).strict();

const sectionMetadata = z.object({
	visible: visibilityWindow.optional(),
}).strict();
const banner = z.object({
	id: z.string().regex(/^[a-z0-9-]+$/),
	tone: z.enum(['warning']).default('warning'),
	visible: visibilityWindow.optional(),
	title: z.string().min(1),
	text: z.string().min(1),
}).strict();
const banners = z.array(banner).optional().default([]).refine(
	(values) => new Set(values.map((value) => value.id)).size === values.length,
	'Banner ids must be unique.',
);
const dateTimeFormat = z.object({
	locale: z.string().min(1),
	timeZone: z.string().min(1),
	dateStyle: z.string().min(1),
	timeStyle: z.string().min(1),
}).strict().refine((value) => {
	try {
		new Intl.DateTimeFormat(value.locale, {
			dateStyle: value.dateStyle as Intl.DateTimeFormatOptions['dateStyle'],
			timeStyle: value.timeStyle as Intl.DateTimeFormatOptions['timeStyle'],
			timeZone: value.timeZone,
		});
		return true;
	} catch {
		return false;
	}
}, 'Use a valid Intl.DateTimeFormat configuration.');
const sitewideFooter = z.object({
	copyrightMessage: z.string().min(1).optional(),
	buildInfo: z.object({
		enabled: z.boolean().default(true),
		text: z.string().min(1),
		dateTimeFormat,
	}).strict().optional(),
}).strict();

const siteSchema = z.object({
	title: z.string(),
	description: z.string(),
	navigation: pageNavigation.optional(),
	sections: z.record(z.string().regex(/^[a-z0-9-]+$/), sectionMetadata).optional().default({}),
});

export const themeVisualSchema = z.object({
	layout: themeLayout.optional(),
	gallery: themeGallery.optional(),
	typography: themeTypography.optional(),
	presentation: themePresentation.optional(),
}).strict();

const siteThemeSchema = themeVisualSchema.extend({
	navigation: themeNavigation.optional(),
}).strict();

const sitewideSchema = z.object({
	banners,
	footer: sitewideFooter.optional(),
}).strict();

const site = defineCollection({
	loader: glob({
		pattern: ['content.md', 'routes/*/route-content.md'],
		base: pathToFileURL(siteDir),
		generateId: ({ entry }) => {
			if (entry === 'content.md') {
				return siteEntryId;
			}

			const routeDirectory = entry.match(/^routes\/([^/]+)\/route-content\.md$/)?.[1];
			return routeDirectory
				? `${siteEntryId.replace(/-content$/, '')}-route-${parseRouteDirectory(routeDirectory, `route directory routes/${routeDirectory}`).routeDirectory}`
				: entry.replace(/[^a-zA-Z0-9-]+/g, '-').replace(/^-+|-+$/g, '');
		},
	}),
	schema: siteSchema,
});

const theme = defineCollection({
	loader: glob({
		pattern: 'theme.md',
		base: pathToFileURL(siteDir),
		generateId: ({ entry }) => entry,
	}),
	schema: siteThemeSchema,
});

const sitewide = defineCollection({
	loader: glob({
		pattern: 'sitewide-content.md',
		base: pathToFileURL(siteDir),
		generateId: () => `${siteEntryId.replace(/-content$/, '')}-sitewide`,
	}),
	schema: sitewideSchema,
});

export const collections = { site, theme, sitewide };
