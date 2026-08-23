import { z } from 'astro/zod';
import { themePresetNames } from './theme-presets.mjs';

const isDateOnly = (value) => {
	if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

	const date = new Date(`${value}T00:00:00.000Z`);
	return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
};

const textAlign = z.enum(['left', 'center', 'right']).describe('Text alignment. Omit an override to keep the active typography profile.');
const textSize = z.enum(['small', 'medium', 'large', 'xlarge']).describe('Text size from the active typography system. Omit an override to keep the profile value.');
const textWidth = z.enum(['narrow', 'normal', 'wide']).describe('Maximum width of body text. Omit an override to keep the profile value.');
const headingWeight = z.union([z.literal(400), z.literal(500), z.literal(600), z.literal(700)]).describe('CSS font weight.');
const typographyProfile = z.enum(['restrained', 'dense', 'reading', 'statement']).describe('Coordinated typography defaults. Omit this to use the selected preset.');
const themePreset = z.enum(themePresetNames).describe('Complete Norna visual preset. Start here and add overrides only when needed.');
const presentationPalette = z.enum(['dark', 'light', 'paper']).describe('Coordinated site color palette. Omit this to use the selected preset.');
const sectionSurface = z.enum(['base', 'soft', 'emphasis']).describe('Semantic section surface from the active palette.');
const spacingDensity = z.enum(['compact', 'normal', 'airy']).describe('Coordinated spacing density. Omit this to use the selected preset.');
const lineHeight = z.number()
	.min(1, 'Use a unitless line height of at least 1.')
	.max(3, 'Use a unitless line height of at most 3.')
	.describe('Unitless line height between 1 and 3.');
const cssLength = z.string().regex(
	/^(?:0|(?:\d+(?:\.\d+)?|\.\d+)(?:px|rem|em|ch|lh))$/,
	'Use a CSS length such as "0", "0.8em", "1rem", or "12px".',
).describe('CSS length using px, rem, em, ch or lh.');
const visualCssLengthUnit = String.raw`(?:px|rem|em|vw|vh|vmin|vmax|ch|%)`;
const visualCssLengthValue = String.raw`(?:\d+(?:\.\d+)?|\.\d+)${visualCssLengthUnit}`;
const visualCssLength = z.string().regex(
	new RegExp(`^(?:0|${visualCssLengthValue}|clamp\\(\\s*${visualCssLengthValue}\\s*,\\s*${visualCssLengthValue}\\s*,\\s*${visualCssLengthValue}\\s*\\))$`),
	'Use a CSS length such as "0", "900px", "56rem", "90%", or "clamp(1rem, 4vw, 3rem)".',
).describe('Responsive CSS length or clamp() expression.');
const dateOnly = z.string()
	.regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD format.')
	.refine(isDateOnly, 'Use a real calendar date.')
	.describe('Calendar date using YYYY-MM-DD.');
const visibilityWindow = z.object({
	from: dateOnly.optional().describe('First date on which the content is visible.'),
	until: dateOnly.optional().describe('First date on which the content is no longer visible.'),
}).strict().refine(
	(value) => value.from !== undefined || value.until !== undefined,
	'Specify from, until, or both.',
).refine(
	(value) => value.from === undefined || value.until === undefined || value.from < value.until,
	'visible.until must be later than visible.from.',
).describe('Optional visibility interval.');
const overrideResponsiveTextAlign = z.object({
	desktop: textAlign.optional().describe('Text alignment on wider screens.'),
	mobile: textAlign.optional().describe('Text alignment on narrow screens.'),
}).strict().refine(
	(value) => value.desktop !== undefined || value.mobile !== undefined,
	'Specify desktop, mobile, or both.',
);
const commonTextPresentationOverride = {
	align: overrideResponsiveTextAlign.optional().describe('Responsive text alignment override.'),
	size: textSize.optional(),
	lineHeight: lineHeight.optional(),
};
const headingPresentationOverride = z.object({
	...commonTextPresentationOverride,
	weight: headingWeight.optional().describe('Heading font weight. Omit this to keep the profile value.'),
	spacingBefore: cssLength.optional().describe('Vertical space before the heading.'),
	spacingAfter: cssLength.optional().describe('Vertical space after the heading.'),
}).strict().describe('Focused overrides for one heading level.');
const headingLevelsPresentationOverride = z.object({
	h1: headingPresentationOverride.optional().describe('Overrides for Markdown level 1 headings.'),
	h2: headingPresentationOverride.optional().describe('Overrides for Markdown level 2 section headings.'),
	h3: headingPresentationOverride.optional().describe('Overrides for Markdown level 3 headings.'),
	h4: headingPresentationOverride.optional().describe('Overrides for Markdown level 4 headings.'),
}).strict().describe('Heading overrides by Markdown level.');
const bodyPresentationOverride = z.object({
	...commonTextPresentationOverride,
	width: textWidth.optional().describe('Maximum body-text line length.'),
	paragraphSpacing: cssLength.optional().describe('Vertical space between body paragraphs.'),
}).strict().describe('Focused overrides for body text.');
const captionPresentationOverride = z.object({
	...commonTextPresentationOverride,
	spacingBefore: cssLength.optional().describe('Vertical space between an image and its caption.'),
}).strict().describe('Focused overrides for image captions.');
const typographyOverrides = z.object({
	headings: headingLevelsPresentationOverride.optional().describe('Overrides for heading levels.'),
	body: bodyPresentationOverride.optional().describe('Overrides for body text.'),
	caption: captionPresentationOverride.optional().describe('Overrides for image captions.'),
}).strict().describe('Fine-grained typography overrides applied after profile and rhythm.');
const themeTypography = z.object({
	fontFamily: z.string()
		.min(1)
		.refine((value) => !/[\n\r;{}]/.test(value), 'Do not use semicolons, braces, or line breaks.')
		.optional()
		.describe('CSS font-family stack.'),
	profile: typographyProfile.optional().describe('Typography profile. Omit this to keep the selected preset.'),
	rhythm: spacingDensity.optional().describe('Typography spacing rhythm. Omit this to keep the selected preset.'),
	overrides: typographyOverrides.optional().describe('Focused typography overrides applied after the profile.'),
}).strict().refine(
	(value) => value.fontFamily !== undefined || value.profile !== undefined || value.rhythm !== undefined || value.overrides !== undefined,
	'Specify fontFamily, profile, rhythm, overrides, or a combination of them.',
).describe('Typography profile, rhythm, font family, and focused overrides.');
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
		desktop: z.number().positive().max(100).describe('Percentage used on wider screens.'),
		mobile: z.number().positive().max(100).describe('Percentage used on narrow screens.'),
	}).strict(),
]);
const themeLayoutSpacing = z.object({
	blockGap: responsiveCssLength.optional().describe('Default vertical gap between structured content blocks.'),
	finalSectionBottom: responsiveCssLength.optional().describe('Bottom space after the final section.'),
	firstSectionTop: responsiveCssLength.optional().describe('Top space before the first section.'),
	headingToBlock: responsiveCssLength.optional().describe('Gap from a section heading to a following structured block.'),
	imageGap: responsiveCssLength.optional().describe('Gap between images in an image stack.'),
	sectionGap: responsiveCssLength.optional().describe('Vertical separation between page sections.'),
}).strict().describe('Fine-grained spacing overrides applied after layout density.');
const themeLayout = z.object({
	density: spacingDensity.optional().describe('Overall spacing density. Omit this to keep the selected preset.'),
	pageWidth: visualCssLength.optional().describe('Maximum width of the site layout. Omit this to keep the selected preset.'),
	gutter: responsiveCssLength.optional().describe('Horizontal page gutter as one value or separate desktop and mobile values.'),
	spacing: themeLayoutSpacing.optional().describe('Fine-grained spacing overrides.'),
}).strict().describe('Optional layout overrides applied after the preset.');
const themeImages = z.object({
	width: visualCssLength.optional().describe('Maximum managed-image width. Omit this to keep the selected preset.'),
	maxAvailableWidthPercent: responsivePercent.optional().describe('Maximum percentage of available horizontal space used by managed images.'),
	maxAvailableHeightPercent: responsivePercent.optional().describe('Maximum percentage of viewport height used by managed images.'),
}).strict().describe('Optional defaults for managed image presentation.');
const sectionSurfaces = z.array(sectionSurface).min(1).max(3).refine(
	(value) => new Set(value).size === value.length,
	'Each section surface may appear only once.',
).describe('Surface sequence cycled across page sections.');
const pageNavigation = z.object({
	include: z.boolean().optional().describe('Include this page in site navigation. Pages are included when omitted.'),
	label: z.string().optional().describe('Navigation label when it should differ from the page title.'),
}).strict();
const sitewideNavigation = z.object({
	label: z.string().min(1).optional().describe('Accessible site label used for navigation text and logo alternative text.'),
	logo: z.object({
		height: visualCssLength.optional().describe('Displayed logo height. Width follows the intrinsic aspect ratio.'),
	}).strict().optional().describe('Optional display settings for a convention-based navigation logo.'),
}).strict().describe('Site-wide identity shown in navigation.');

const sectionMetadata = z.object({
	visible: visibilityWindow.optional().describe('Optional date window for this section.'),
}).strict().describe('Metadata keyed by the explicit Markdown section id. Markdown order remains authoritative.');
const banner = z.object({
	id: z.string().regex(/^[a-z0-9-]+$/).describe('Stable banner identifier used for dismissal state.'),
	tone: z.enum(['warning']).default('warning').describe('Semantic banner tone.'),
	visible: visibilityWindow.optional().describe('Optional date window for the banner.'),
	title: z.string().min(1).describe('Short banner heading.'),
	text: z.string().min(1).describe('Concise banner message.'),
}).strict().describe('Dismissible, site-wide one-line notice.');
const banners = z.array(banner).optional().default([]).refine(
	(values) => new Set(values.map((value) => value.id)).size === values.length,
	'Banner ids must be unique.',
);
const dateTimeFormat = z.object({
	locale: z.string().min(1).describe('Intl locale such as en-GB or sv-SE.'),
	timeZone: z.string().min(1).describe('IANA time zone such as Europe/Stockholm.'),
	dateStyle: z.enum(['short', 'medium', 'long', 'full']).describe('Intl dateStyle for the build timestamp.'),
	timeStyle: z.enum(['short', 'medium', 'long', 'full']).describe('Intl timeStyle for the build timestamp.'),
}).strict().refine((value) => {
	try {
		new Intl.DateTimeFormat(value.locale, {
			dateStyle: value.dateStyle,
			timeStyle: value.timeStyle,
			timeZone: value.timeZone,
		});
		return true;
	} catch {
		return false;
	}
}, 'Use a valid Intl.DateTimeFormat configuration.');
const sitewideFooter = z.object({
	copyrightMessage: z.string().min(1).optional().describe('Copyright or ownership text shown in the site footer.'),
	buildInfo: z.object({
		enabled: z.boolean().default(true).describe('Show generated build information in the footer.'),
		text: z.string().min(1).describe('Label shown before the generated build timestamp.'),
		dateTimeFormat: dateTimeFormat.describe('Formatting used for the generated build timestamp.'),
	}).strict().optional().describe('Optional generated build timestamp.'),
}).strict().describe('Site-wide footer content.');

export const configSchema = z.object({
	url: z.string().url().describe('Absolute public URL for the built site.'),
	language: z.string().regex(/^(?:en|sv)(?:-[a-zA-Z0-9]+)*$/).optional().describe('Site language tag using Norna\'s English or Swedish interface text; the default is en.'),
	scrollBehavior: z.enum(['instant', 'smooth']).optional().default('instant').describe('Use instant anchors by default or the browser\'s native smooth scrolling.'),
}).strict().describe('Technical settings for one Norna site. Routes cannot provide technical configuration.');

export const siteSchema = z.object({
	title: z.string().describe('Page title used in metadata and route navigation.'),
	description: z.string().describe('Page description used in metadata.'),
	navigation: pageNavigation.optional().describe('Optional navigation metadata for this page.'),
	sections: z.record(z.string().regex(/^[a-z0-9-]+$/), sectionMetadata).optional().default({}).describe('Optional metadata keyed by Markdown section id. Do not duplicate section order here.'),
}).strict().describe('Frontmatter for a homepage or route content.md file.');

export const themeVisualSchema = z.object({
	preset: themePreset.optional().describe('Complete visual starting point. Add only the overrides the site actually needs.'),
	layout: themeLayout.optional(),
	images: themeImages.optional(),
	typography: themeTypography.optional(),
	palette: presentationPalette.optional(),
	sectionSurfaces: sectionSurfaces.optional().describe('Surface sequence cycled through page sections. Omit this to keep the selected preset.'),
}).strict().describe('Visual settings for a site or route. A route theme replaces the inherited visual theme; site identity remains site-wide.');

export const sitewideSchema = z.object({
	navigation: sitewideNavigation.optional().describe('Site-wide navigation identity.'),
	banners: banners.describe('Site-wide dismissible notices.'),
	footer: sitewideFooter.optional().describe('Site-wide footer content.'),
}).strict().describe('Editorial content and identity shared by every page.');
