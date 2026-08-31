import {
	getThemePresetMetadata,
	themePresetNames,
} from './theme-presets.mjs';

const option = (title, description) => Object.freeze({ title, description });
const definition = (values, options) => Object.freeze({
	values: Object.freeze(values),
	options: Object.freeze(options),
});

export const schemaValueDefinitions = Object.freeze([
	definition(themePresetNames, Object.fromEntries(themePresetNames.map((name) => {
		const metadata = getThemePresetMetadata(name);
		return [name, option(metadata.title, metadata.description)];
	}))),
	definition(['instant', 'smooth'], {
		instant: option('Instant', 'Jump directly to anchors without animated scrolling. This is the default.'),
		smooth: option('Browser smooth', 'Use the browser\'s native smooth scrolling for anchor navigation.'),
	}),
	definition(['automatic', 'sections', 'top', 'tree'], {
		automatic: option('Automatic', 'Choose sections for one page, top navigation for a shallow multi-page site, and tree navigation for deeper content.'),
		sections: option('Sections', 'Navigate the sections of the current page.'),
		top: option('Top', 'Use pages in the top navigation and sections below them.'),
		tree: option('Tree', 'Use a hierarchical site-wide navigation tree.'),
	}),
	definition(['en', 'sv'], {
		en: option('English', 'Use Norna\'s built-in English interface text.'),
		sv: option('Swedish', 'Use Norna\'s built-in Swedish interface text.'),
	}),
	definition(['left', 'center', 'right'], {
		left: option('Left', 'Align text with the left edge of its text area.'),
		center: option('Center', 'Center text within its text area.'),
		right: option('Right', 'Align text with the right edge of its text area.'),
	}),
	definition(['small', 'medium', 'large', 'xlarge'], {
		small: option('Small', 'Use the small type size from the active typography system.'),
		medium: option('Medium', 'Use the standard type size from the active typography system.'),
		large: option('Large', 'Use a larger type size for stronger emphasis.'),
		xlarge: option('Extra large', 'Use the largest available type size for exceptional emphasis.'),
	}),
	definition(['narrow', 'normal', 'wide'], {
		narrow: option('Narrow', 'Use a shorter line length suited to reading-focused text.'),
		normal: option('Normal', 'Use the balanced default line length.'),
		wide: option('Wide', 'Allow body text to use more horizontal space.'),
	}),
	definition(['text', 'narrow', 'normal', 'wide'], {
		text: option('Text width', 'Match the active body-text width, including a reader-selected reading width.'),
		narrow: option('Narrow', 'Limit the complete card list to at most 48rem.'),
		normal: option('Normal', 'Limit the complete card list to at most 56rem.'),
		wide: option('Wide', 'Allow the complete card list to use the available page-layout width.'),
	}),
	definition([400, 500, 600, 700], {
		400: option('Regular', 'Use regular font weight.'),
		500: option('Medium', 'Use medium font weight.'),
		600: option('Semibold', 'Use semibold font weight.'),
		700: option('Bold', 'Use bold font weight.'),
	}),
	definition(['restrained', 'dense', 'reading', 'statement'], {
		restrained: option('Restrained', 'Quiet typography with regular-weight headings and balanced line lengths.'),
		dense: option('Dense', 'Compact typography with wider text and tighter line height.'),
		reading: option('Reading', 'Reading-focused typography with narrower text and relaxed line height.'),
		statement: option('Statement', 'Stronger headings and tighter body rhythm for short, expressive pages.'),
	}),
	definition(['near-monochrome', 'cool-green', 'warm-paper'], {
		'near-monochrome': option('Near monochrome', 'Neutral grays and off-whites with almost no visible hue, in coordinated light and dark variants.'),
		'cool-green': option('Cool green', 'Cool neutral backgrounds with restrained green accents, in coordinated light and dark variants.'),
		'warm-paper': option('Warm paper', 'Warm off-whites and browns resembling paper and ink, in coordinated light and dark variants.'),
	}),
	definition(['system', 'light', 'dark'], {
		system: option('System', 'Follow the visitor\'s operating-system light or dark preference.'),
		light: option('Light', 'Start with the palette\'s light appearance.'),
		dark: option('Dark', 'Start with the palette\'s dark appearance.'),
	}),
	definition(['square', 'rounded'], {
		square: option('Square', 'Use square corners for navigation, cards and framed content.'),
		rounded: option('Rounded', 'Use restrained rounded corners consistently across the site.'),
	}),
	definition(['uniform', 'alternating', 'accented'], {
		uniform: option('Uniform', 'Use the normal page background for every H2 section. Tree navigation requires this pattern.'),
		alternating: option('Alternating', 'Alternate normal and subtly contrasting full-width section backgrounds. Available with sections and top navigation.'),
		accented: option('Accented', 'Move through base, soft, emphasis and soft full-width section backgrounds before repeating. Available with sections and top navigation.'),
	}),
	definition(['compact', 'normal', 'spacious'], {
		compact: option('Compact', 'Use restrained spacing between sections and structured blocks.'),
		normal: option('Normal', 'Use balanced content spacing.'),
		spacious: option('Spacious', 'Use more expansive spacing between sections and structured blocks.'),
	}),
	definition(['base', 'soft', 'emphasis'], {
		base: option('Base', 'Use the palette\'s normal page surface.'),
		soft: option('Soft', 'Use the palette\'s subtle contrasting surface.'),
		emphasis: option('Emphasis', 'Use the palette\'s strongest section surface.'),
	}),
	definition(['compact', 'normal', 'airy'], {
		compact: option('Compact', 'Reduce vertical spacing while preserving readable separation.'),
		normal: option('Normal', 'Use balanced vertical spacing.'),
		airy: option('Airy', 'Increase vertical spacing for a more expansive presentation.'),
	}),
	definition(['warning'], {
		warning: option('Warning', 'Present the banner as an important warning notice.'),
	}),
]);

const valuesEqual = (left, right) => (
	left.length === right.length
	&& left.every((value, index) => value === right[index])
);

export const getSchemaValueDefinition = (values) => (
	schemaValueDefinitions.find((candidate) => valuesEqual(candidate.values, values))
);
