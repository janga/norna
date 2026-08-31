import { z } from 'astro/zod';
import { navigationModeNames } from './navigation-model.mjs';
import { themePresetNames } from './theme-presets.mjs';

const isDateOnly = (value) => {
	if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

	const date = new Date(`${value}T00:00:00.000Z`);
	return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
};

const textAlign = z.enum(['left', 'center', 'right']).describe('Text alignment. Omit an override to keep the active typography profile.');
const textSize = z.enum(['small', 'medium', 'large', 'xlarge']).describe('Text size from the active typography system. Omit an override to keep the profile value.');
const textWidth = z.enum(['narrow', 'normal', 'wide']).describe('Maximum width of body text. Omit this to keep the inherited page setting.');
const headingWeight = z.union([z.literal(400), z.literal(500), z.literal(600), z.literal(700)]).describe('CSS font weight.');
const typographyProfile = z.enum(['restrained', 'dense', 'reading', 'statement']).describe('Coordinated typography defaults. Omit this to use the selected preset.');
const themePreset = z.enum(themePresetNames).describe('Complete Norna visual preset. Start here and add overrides only when needed.');
const presentationPalette = z.enum(['near-monochrome', 'cool-green', 'warm-paper']).describe('Coordinated site color palette. Every palette provides light and dark variants. Omit this to use the selected preset.');
const themeColorMode = z.object({
	default: z.enum(['system', 'light', 'dark']).optional().describe('Initial color mode. System follows the visitor\'s operating-system preference.'),
}).strict().refine(
	(value) => value.default !== undefined,
	'Specify default.',
).describe('Site-wide light and dark mode behaviour.');
const readerControls = z.object({
	colorMode: z.boolean().optional().describe('Let readers choose System, Light, or Dark color mode in the site-wide Display panel.'),
	focusReading: z.boolean().optional().describe('Let readers temporarily hide navigation and other secondary page chrome while reading.'),
}).strict().refine(
	(value) => value.colorMode !== undefined || value.focusReading !== undefined,
	'Specify colorMode, focusReading, or both.',
).describe('Optional site-wide reader choices grouped with the always-available reading-width choice in the Display panel.');
const spacingDensity = z.enum(['compact', 'normal', 'airy']).describe('Coordinated spacing density. Omit this to use the selected preset.');
const contentSpacing = z.enum(['compact', 'normal', 'spacious']).describe('Vertical spacing between page sections and structured content blocks.');
const backgroundPattern = z.enum(['uniform', 'alternating', 'accented']).describe('How coordinated backgrounds are assigned to H2 sections. Non-uniform patterns are unavailable with tree navigation.');
const cornerTreatment = z.enum(['square', 'rounded']).describe('Site-wide corner treatment for navigation, cards and framed content.');
const cardListWidth = z.enum(['text', 'narrow', 'normal', 'wide']).describe('Default maximum width for card lists. A width written in a norna-card-list block overrides this value.');
const navigationMode = z.enum(navigationModeNames).describe('Site-wide navigation model. Automatic selects from the site structure.');
const createLineHeight = (minimum, role) => z.number()
	.min(minimum, `Use a unitless ${role} line height of at least ${minimum}.`)
	.max(3, `Use a unitless ${role} line height of at most 3.`)
	.describe(`Unitless ${role} line height between ${minimum} and 3.`);
const headingLineHeight = createLineHeight(1, 'heading');
const bodyLineHeight = createLineHeight(1.4, 'body-text');
const captionLineHeight = createLineHeight(1.25, 'caption');
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
};
const headingPresentationOverride = z.object({
	...commonTextPresentationOverride,
	lineHeight: headingLineHeight.optional(),
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
	lineHeight: bodyLineHeight.optional(),
	paragraphSpacing: cssLength.optional().describe('Vertical space between body paragraphs.'),
}).strict().describe('Focused overrides for body text.');
const captionPresentationOverride = z.object({
	...commonTextPresentationOverride,
	lineHeight: captionLineHeight.optional(),
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
	contentSpacing: contentSpacing.optional().describe('Page content spacing. Omit this to keep the selected preset or inherited page setting.'),
	textWidth: textWidth.optional().describe('Body-text line length. Omit this to keep the selected preset or inherited page setting.'),
	pageWidth: visualCssLength.optional().describe('Maximum width of the site layout. Omit this to keep the selected preset.'),
	gutter: responsiveCssLength.optional().describe('Horizontal page gutter as one value or separate desktop and mobile values.'),
	spacing: themeLayoutSpacing.optional().describe('Fine-grained spacing overrides.'),
}).strict().describe('Optional layout overrides applied after the preset.');
const pageThemeLayout = z.object({
	contentSpacing: contentSpacing.optional().describe('Page content spacing. Descendant pages inherit this value.'),
	textWidth: textWidth.optional().describe('Body-text line length. Descendant pages inherit this value.'),
}).strict().refine(
	(value) => value.contentSpacing !== undefined || value.textWidth !== undefined,
	'Specify contentSpacing, textWidth, or both.',
).describe('Page-local layout settings inherited by descendant pages.');
const themeImages = z.object({
	width: visualCssLength.optional().describe('Maximum managed-image width. Omit this to keep the selected preset.'),
	maxAvailableWidthPercent: responsivePercent.optional().describe('Maximum percentage of available horizontal space used by managed images.'),
	maxAvailableHeightPercent: responsivePercent.optional().describe('Maximum percentage of viewport height used by managed images.'),
}).strict().describe('Optional defaults for managed image presentation.');
const themeCardList = z.object({
	width: cardListWidth,
}).strict().describe('Site-wide card-list defaults.');
const themeBlocks = z.object({
	cardList: themeCardList.optional(),
}).strict().refine(
	(value) => value.cardList !== undefined,
	'Specify cardList.',
).describe('Optional site-wide defaults for structured Norna content blocks.');
const configNavigation = z.object({
	mode: navigationMode.optional().describe('Navigation model. Omit this to let Norna choose from the site structure.'),
	sectionTracking: z.boolean().optional().default(false).describe('As the reader scrolls in tree navigation, mark the last H2 or H3 that has reached the reading area below the sticky header. The URL and keyboard focus do not change.'),
}).strict().describe('Site-wide navigation behavior.');
const themeSections = z.object({
	backgroundPattern: backgroundPattern.optional().describe('Section background pattern. Alternating and accented create full-width bands with sections or top navigation; tree navigation requires uniform.'),
}).strict().describe('Defaults for page section presentation.');
const pageThemeSections = z.object({
	backgroundPattern: backgroundPattern.optional().describe('Section background sequence inherited by descendant pages. Non-uniform patterns are invalid with tree navigation.'),
}).strict().refine(
	(value) => value.backgroundPattern !== undefined,
	'Specify backgroundPattern.',
).describe('Page-local section presentation inherited by descendant pages.');
const pageNavigation = z.object({
	listed: z.boolean().optional().default(true).describe('List this page in site navigation. The page remains public when false.'),
}).strict();
const pageMetadata = z.object({
	description: z.string().min(1).optional().describe('Optional page-specific meta description.'),
}).strict().describe('Optional metadata for this homepage or additional page. The Markdown H1 supplies the page title.');
const sitewideLogo = z.object({
	height: visualCssLength.optional().describe('Displayed logo height on wider screens. Omit it to use 2.6rem; narrow screens cap the height at 2.15rem. Width follows the intrinsic aspect ratio.'),
}).strict().describe('Optional display settings for a convention-based navigation logo.');

const banner = z.object({
	id: z.string().regex(/^[a-z0-9-]+$/).describe('Stable banner identifier used for dismissal state.'),
	tone: z.enum(['warning']).default('warning').describe('Semantic banner tone.'),
	visible: visibilityWindow.optional().describe('Optional date window for the banner.'),
	title: z.string().min(1).describe('Short banner heading.'),
	text: z.string().min(1).describe('Concise banner message.'),
}).strict().describe('Dismissible site-wide warning shown above page content for important temporary information.');
const banners = z.array(banner).optional().default([]).refine(
	(values) => new Set(values.map((value) => value.id)).size === values.length,
	'Banner ids must be unique.',
);
const sitewideFooter = z.object({
	copyrightMessage: z.string().min(1).optional().describe('Copyright or ownership text shown in the site footer.'),
	buildInfo: z.boolean().optional().default(false).describe('Show a localized generated build timestamp in the footer.'),
}).strict().describe('Site-wide footer content.');

const configShape = {
	url: z.string().url().describe('Absolute public URL for the built site.'),
	language: z.string().regex(/^(?:en|sv)(?:-[a-zA-Z0-9]+)*$/).optional().describe('Site language tag using Norna\'s English or Swedish interface text; the default is en.'),
	navigation: configNavigation.optional(),
	scrollBehavior: z.enum(['instant', 'smooth']).optional().default('instant').describe('Use instant anchors by default or the browser\'s native smooth scrolling.'),
};

const siteShape = {
	page: pageMetadata.optional(),
	navigation: pageNavigation.optional().describe('Optional navigation metadata for this page.'),
};

const themeVisualShape = {
	preset: themePreset.optional().describe('Complete visual starting point. Add only the overrides the site actually needs.'),
	colorMode: themeColorMode.optional(),
	readerControls: readerControls.optional(),
	corners: cornerTreatment.optional().describe('Site-wide corner treatment. Omit this to use the selected preset.'),
	layout: themeLayout.optional(),
	images: themeImages.optional(),
	blocks: themeBlocks.optional(),
	typography: themeTypography.optional(),
	palette: presentationPalette.optional(),
	sections: themeSections.optional(),
};

const pageThemeShape = {
	layout: pageThemeLayout.optional(),
	images: themeImages.optional(),
	sections: pageThemeSections.optional(),
};

const sitewideShape = {
	logo: sitewideLogo.optional(),
	banners: banners.describe('Site-wide dismissible notices.'),
	footer: sitewideFooter.optional().describe('Site-wide footer content.'),
};

const categoryShape = {
	label: z.string().trim().min(1).describe('Navigation label for this non-routable page category.'),
};

export const schemaTopLevelKeys = Object.freeze({
	config: Object.freeze(Object.keys(configShape)),
	category: Object.freeze(Object.keys(categoryShape)),
	content: Object.freeze(Object.keys(siteShape)),
	sitewide: Object.freeze(Object.keys(sitewideShape)),
	theme: Object.freeze(Object.keys(themeVisualShape)),
	pageTheme: Object.freeze(Object.keys(pageThemeShape)),
});

export const configSchema = z.object(configShape).strict()
	.describe('Technical settings for one Norna site. Additional pages cannot provide technical configuration.');
export const categorySchema = z.object(categoryShape).strict()
	.describe('A non-routable navigation category containing child pages.');
export const siteSchema = z.object(siteShape).strict()
	.describe('Frontmatter for a homepage or additional page content.md file.');
export const themeVisualSchema = z.object(themeVisualShape).strict()
	.describe('Site-wide visual identity and default page presentation. Presets may be selected only in the root theme.');
export const pageThemeSchema = z.object(pageThemeShape).strict()
	.refine(
		(value) => value.layout !== undefined || value.images !== undefined || value.sections !== undefined,
		'Specify layout, images, sections, or a combination of them.',
	)
	.describe('Limited page presentation overrides inherited by descendant pages. Site colors, corners, typography, content-block defaults and navigation remain global.');
export const sitewideSchema = z.object(sitewideShape).strict()
	.describe('Editorial content and optional navigation logo display settings shared by every page.');
