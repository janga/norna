import { documentationLink } from './documentation-links.mjs';
import { getSchemaValueDefinition } from './schema-value-definitions.mjs';

const yamlExample = (source) => `\`\`\`yaml\n${source}\n\`\`\``;

const expandSchemaVariants = (schemas) => schemas.flatMap((schema) => [
	schema,
	...(schema?.allOf ?? []),
	...(schema?.anyOf ?? []),
	...(schema?.oneOf ?? []),
]);

const schemaProperties = (schema, propertyPath) => {
	let current = [schema];
	for (const name of propertyPath.split('.')) {
		current = expandSchemaVariants(current).flatMap((candidate) => {
			if (name === '[]') return candidate?.items ? [candidate.items] : [];
			if (name === '*') {
				return candidate?.additionalProperties && typeof candidate.additionalProperties === 'object'
					? [candidate.additionalProperties]
					: [];
			}
			return candidate?.properties?.[name] ? [candidate.properties[name]] : [];
		});
		if (current.length === 0) throw new Error(`Generated schema has no property at ${propertyPath}.`);
	}
	return current;
};

const schemaProperty = (schema, propertyPath) => schemaProperties(schema, propertyPath)[0];

const addHelp = (schema, propertyPath, paragraphs, examples = []) => {
	for (const property of schemaProperties(schema, propertyPath)) {
		property.markdownDescription = paragraphs.join('\n\n');
		if (examples.length > 0) property.examples = examples;
	}
};

const addFieldHelp = (schema, propertyPath, example, file, anchor, examples = []) => {
	const property = schemaProperty(schema, propertyPath);
	addHelp(schema, propertyPath, [
		yamlExample(example),
		property.description,
		documentationLink('Read the relevant reference', file, anchor),
	], examples);
};

const addSnippets = (schema, propertyPath, snippets) => {
	for (const property of schemaProperties(schema, propertyPath)) {
		property.defaultSnippets = snippets;
	}
};

const schemaSnippet = ({ label, body, description, file, anchor }) => ({
	label,
	markdownDescription: [
		description,
		documentationLink('Read the relevant reference', file, anchor),
	].join('\n\n'),
	body,
});

const getLiteralValues = (schema) => {
	if (Array.isArray(schema.enum)) return schema.enum;
	if (
		Array.isArray(schema.anyOf)
		&& schema.anyOf.length > 0
		&& schema.anyOf.every((candidate) => Object.hasOwn(candidate, 'const'))
	) {
		return schema.anyOf.map((candidate) => candidate.const);
	}
	return null;
};

const addValueDescriptions = (schema) => {
	if (!schema || typeof schema !== 'object') return;
	if (Array.isArray(schema)) {
		for (const value of schema) addValueDescriptions(value);
		return;
	}

	const values = getLiteralValues(schema);
	const definition = values ? getSchemaValueDefinition(values) : null;
	if (definition) {
		delete schema.enum;
		delete schema.anyOf;
		schema.oneOf = values.map((value) => ({
			const: value,
			title: definition.options[value].title,
			description: definition.options[value].description,
		}));
	}

	for (const value of Object.values(schema)) addValueDescriptions(value);
};

const addLanguageSuggestions = (jsonSchema) => {
	const language = jsonSchema.properties?.language;
	if (!language) throw new Error('Generated config schema has no language property.');
	const definition = getSchemaValueDefinition(['en', 'sv']);
	language.default = 'en';
	language.examples = ['en', 'sv', 'en-GB', 'sv-SE'];
	language.oneOf = [
		...definition.values.map((value) => ({
			const: value,
			title: definition.options[value].title,
			description: definition.options[value].description,
		})),
		{
			type: 'string',
			pattern: '^(?:en|sv)-[a-zA-Z0-9]+(?:-[a-zA-Z0-9]+)*$',
			title: 'Regional language tag',
			description: 'Use an English or Swedish regional language tag such as en-GB or sv-SE.',
		},
	];
};

const addSitewideLogoHelp = (jsonSchema) => {
	const logo = jsonSchema.properties?.logo;
	if (!logo) throw new Error('Generated site-wide schema has no logo property.');

	logo.markdownDescription = [
		yamlExample('logo:\n  height: 2rem'),
		'`logo` optionally overrides the displayed height of the convention-based logo file. The logo links home, and its alternative text comes from the homepage Markdown H1. This setting does not enable or select the file.',
		documentationLink('Navigation logo filenames and placement', 'public-files.md', 'navigation-logo'),
	].join('\n\n');
	logo.properties.height.examples = ['2rem'];
	addFieldHelp(
		jsonSchema,
		'logo.height',
		'logo:\n  height: 2rem',
		'public-files.md',
		'navigation-logo',
		['2rem'],
	);
};

const addConfigHelp = (jsonSchema) => {
	jsonSchema.markdownDescription = [
		yamlExample('url: https://example.com/'),
		'`config.yaml` contains the few technical settings shared by the complete site.',
		documentationLink('Configuration reference', 'configuration.md'),
	].join('\n\n');
	addHelp(jsonSchema, 'url', [
		yamlExample('url: https://example.com/'),
		'The absolute public URL. Its path also determines the base path for generated links and assets.',
		documentationLink('Public URL reference', 'configuration.md', 'url'),
	], ['https://example.com/', 'https://owner.github.io/repository-name/']);
	addHelp(jsonSchema, 'language', [
		yamlExample('language: en-GB'),
		'Sets the page language and selects Norna\'s built-in English or Swedish interface text. The default is `en`.',
		documentationLink('Language reference', 'configuration.md', 'language'),
	], ['en', 'sv', 'en-GB', 'sv-SE']);
	addHelp(jsonSchema, 'navigation', [
		yamlExample('navigation:\n  mode: automatic'),
		'Sets one navigation model for the complete site. `automatic` selects from the page hierarchy.',
		documentationLink('Navigation reference', 'pages.md', 'navigation'),
	]);
	addFieldHelp(
		jsonSchema,
		'navigation.mode',
		'navigation:\n  mode: automatic',
		'pages.md',
		'navigation',
		['automatic', 'sections', 'top', 'tree'],
	);
	addHelp(jsonSchema, 'scrollBehavior', [
		yamlExample('scrollBehavior: smooth'),
		'Controls same-page anchor movement. `instant` is the default; `smooth` uses the browser\'s native smooth scrolling.',
		documentationLink('Scroll behavior reference', 'configuration.md', 'scrollbehavior'),
	], ['instant', 'smooth']);
};

const addThemeHelp = (jsonSchema) => {
	jsonSchema.markdownDescription = [
		yamlExample('preset: documentation'),
		'Choose one complete preset first. Add focused overrides only when the site needs to differ from it.',
		documentationLink('Theme reference', 'theme.md'),
	].join('\n\n');
	addHelp(jsonSchema, 'preset', [
		yamlExample('preset: documentation'),
		'Selects coordinated shapes, layout, image sizing, typography, palette and section backgrounds. This is the normal starting point for a theme.',
		documentationLink('Compare theme presets', 'theme.md', 'theme-presets'),
	]);
	addHelp(jsonSchema, 'shape', [
		yamlExample('shape: soft'),
		'Chooses one consistent corner treatment for navigation, cards and framed content throughout the site.',
		documentationLink('Theme reference', 'theme.md'),
	], ['square', 'soft']);
	addHelp(jsonSchema, 'layout', [
		yamlExample('layout:\n  contentSpacing: compact\n  textWidth: narrow'),
		'Overrides text width, content spacing, page width and gutters after the selected preset.',
		documentationLink('Layout reference', 'theme.md', 'layout'),
	]);
	addHelp(jsonSchema, 'images', [
		yamlExample('images:\n  width: 900px\n  maxAvailableHeightPercent: 74'),
		'Overrides the available width and height used by Norna-managed images.',
		documentationLink('Image sizing reference', 'theme.md', 'image-sizing'),
	]);
	addHelp(jsonSchema, 'typography', [
		yamlExample('typography:\n  profile: reading\n  rhythm: normal'),
		'Overrides the preset\'s font stack, typography profile, rhythm or individual text settings.',
		documentationLink('Typography configuration reference', 'typography.md', 'configuration-shape'),
	]);
	addHelp(jsonSchema, 'palette', [
		yamlExample('palette: paper'),
		'Chooses a coordinated color system for the page frame, navigation, footer and section surfaces.',
		documentationLink('Palette and section surfaces', 'theme.md', 'palette-and-section-surfaces'),
	], ['dark', 'light', 'paper']);
	addHelp(jsonSchema, 'colorMode', [
		yamlExample('colorMode:\n  default: system'),
		'Controls the initial light or dark appearance. Enable the reader-facing choice under readerControls.',
		documentationLink('Color modes', 'theme.md', 'color-modes'),
	]);
	addFieldHelp(jsonSchema, 'colorMode.default', 'colorMode:\n  default: system', 'theme.md', 'color-modes', ['system', 'light', 'dark']);
	addSnippets(jsonSchema, 'colorMode', [schemaSnippet({
		label: 'Set the initial color mode',
		body: 'colorMode:\n  default: ${1:system}',
		description: 'Follow the system color preference or choose a fixed initial appearance.',
		file: 'theme.md',
		anchor: 'color-modes',
	})]);
	addHelp(jsonSchema, 'readerControls', [
		yamlExample('readerControls:\n  appearance: true\n  readingWidth: true\n  focusReading: true'),
		'Chooses which bounded reader preferences appear together in the site-wide Display panel. Presets provide suitable defaults, so override only what the site needs.',
		documentationLink('Reader controls design', 'design/preset-development-plan.md', 'phase-3-implement-reader-display-preferences'),
	]);
	for (const [propertyPath, example] of [
		['readerControls.appearance', 'readerControls:\n  appearance: true'],
		['readerControls.readingWidth', 'readerControls:\n  readingWidth: true'],
		['readerControls.focusReading', 'readerControls:\n  focusReading: true'],
	]) {
		addFieldHelp(
			jsonSchema,
			propertyPath,
			example,
			'design/preset-development-plan.md',
			'phase-3-implement-reader-display-preferences',
		);
	}
	addSnippets(jsonSchema, 'readerControls', [schemaSnippet({
		label: 'Configure the Display panel',
		body: 'readerControls:\n  appearance: ${1:true}\n  readingWidth: ${2:true}\n  focusReading: ${3:true}',
		description: 'Offer bounded appearance, reading-width, and focus-reading choices.',
		file: 'design/preset-development-plan.md',
		anchor: 'phase-3-implement-reader-display-preferences',
	})]);
	addHelp(jsonSchema, 'sections', [
		yamlExample('sections:\n  backgroundPattern: alternating'),
		'Chooses whether section backgrounds stay uniform, alternate between two surfaces or cycle through three.',
		documentationLink('Palette and section surfaces', 'theme.md', 'palette-and-section-surfaces'),
	]);
	addFieldHelp(jsonSchema, 'sections.backgroundPattern', 'sections:\n  backgroundPattern: alternating', 'theme.md', 'palette-and-section-surfaces', ['uniform', 'alternating', 'cycling']);

	const layoutFields = [
		['layout.contentSpacing', 'layout:\n  contentSpacing: compact'],
		['layout.textWidth', 'layout:\n  textWidth: narrow'],
		['layout.pageWidth', 'layout:\n  pageWidth: 72rem'],
		['layout.gutter', 'layout:\n  gutter:\n    desktop: clamp(1.25rem, 4vw, 3rem)\n    mobile: 1rem'],
		['layout.gutter.desktop', 'layout:\n  gutter:\n    desktop: clamp(1.25rem, 4vw, 3rem)'],
		['layout.gutter.mobile', 'layout:\n  gutter:\n    mobile: 1rem'],
		['layout.spacing', 'layout:\n  spacing:\n    sectionGap: 2rem'],
	];
	for (const [propertyPath, example] of layoutFields) {
		addFieldHelp(jsonSchema, propertyPath, example, 'theme.md', 'layout');
	}

	const spacingExamples = {
		blockGap: '1.5em',
		finalSectionBottom: '2rem',
		firstSectionTop: '1.5rem',
		headingToBlock: '0.75em',
		imageGap: '1rem',
		sectionGap: '2rem',
	};
	for (const [name, value] of Object.entries(spacingExamples)) {
		const prefix = `layout:\n  spacing:\n    ${name}:`;
		addFieldHelp(jsonSchema, `layout.spacing.${name}`, `${prefix} ${value}`, 'theme.md', 'layout');
		addFieldHelp(jsonSchema, `layout.spacing.${name}.desktop`, `${prefix}\n      desktop: ${value}`, 'theme.md', 'layout');
		addFieldHelp(jsonSchema, `layout.spacing.${name}.mobile`, `${prefix}\n      mobile: ${value}`, 'theme.md', 'layout');
		addSnippets(jsonSchema, `layout.spacing.${name}`, [schemaSnippet({
			label: 'Responsive spacing',
			body: {
				desktop: `\${1:${value}}`,
				mobile: `\${2:${value}}`,
			},
			description: 'Set separate spacing values for wider and narrow screens.',
			file: 'theme.md',
			anchor: 'layout',
		})]);
	}
	addSnippets(jsonSchema, 'layout.gutter', [schemaSnippet({
		label: 'Responsive page gutter',
		body: {
			desktop: '${1:clamp(1.25rem, 4vw, 3rem)}',
			mobile: '${2:1rem}',
		},
		description: 'Set separate page gutters for wider and narrow screens.',
		file: 'theme.md',
		anchor: 'layout',
	})]);
	addSnippets(jsonSchema, 'layout.spacing', [schemaSnippet({
		label: 'Layout spacing overrides',
		body: {
			sectionGap: {
				desktop: '${1:2rem}',
				mobile: '${2:1.5rem}',
			},
			headingToBlock: '${3:0.75em}',
			blockGap: '${4:1.5em}',
		},
		description: 'Start with the structural spacing values most commonly adjusted together.',
		file: 'theme.md',
		anchor: 'layout',
	})]);

	const imageFields = [
		['images.width', 'images:\n  width: 900px'],
		['images.maxAvailableWidthPercent', 'images:\n  maxAvailableWidthPercent:\n    desktop: 100\n    mobile: 100'],
		['images.maxAvailableWidthPercent.desktop', 'images:\n  maxAvailableWidthPercent:\n    desktop: 100'],
		['images.maxAvailableWidthPercent.mobile', 'images:\n  maxAvailableWidthPercent:\n    mobile: 100'],
		['images.maxAvailableHeightPercent', 'images:\n  maxAvailableHeightPercent:\n    desktop: 74\n    mobile: 68'],
		['images.maxAvailableHeightPercent.desktop', 'images:\n  maxAvailableHeightPercent:\n    desktop: 74'],
		['images.maxAvailableHeightPercent.mobile', 'images:\n  maxAvailableHeightPercent:\n    mobile: 68'],
	];
	for (const [propertyPath, example] of imageFields) {
		addFieldHelp(jsonSchema, propertyPath, example, 'theme.md', 'image-sizing');
	}
	for (const [propertyPath, desktop, mobile] of [
		['images.maxAvailableWidthPercent', 100, 100],
		['images.maxAvailableHeightPercent', 74, 68],
	]) {
		addSnippets(jsonSchema, propertyPath, [schemaSnippet({
			label: 'Responsive image limit',
			body: {
				desktop: `\${1:${desktop}}`,
				mobile: `\${2:${mobile}}`,
			},
			description: 'Set separate managed-image limits for wider and narrow screens.',
			file: 'theme.md',
			anchor: 'image-sizing',
		})]);
	}

	const typographyFields = [
		['typography.fontFamily', 'typography:\n  fontFamily: "Arial, sans-serif"'],
		['typography.profile', 'typography:\n  profile: reading'],
		['typography.rhythm', 'typography:\n  rhythm: normal'],
		['typography.overrides', 'typography:\n  overrides:\n    body:\n      lineHeight: 1.55'],
		['typography.overrides.headings', 'typography:\n  overrides:\n    headings:\n      h2:\n        size: medium'],
		['typography.overrides.body', 'typography:\n  overrides:\n    body:\n      lineHeight: 1.55'],
		['typography.overrides.caption', 'typography:\n  overrides:\n    caption:\n      size: small'],
	];
	for (const [propertyPath, example] of typographyFields) {
		addFieldHelp(jsonSchema, propertyPath, example, 'typography.md', 'configuration-shape');
	}

	const textOverrideHelp = (propertyPath, prefix, includeHeadingFields = false) => {
		const fields = [
			['align', `${prefix}\n  align:\n    desktop: left\n    mobile: left`],
			['align.desktop', `${prefix}\n  align:\n    desktop: left`],
			['align.mobile', `${prefix}\n  align:\n    mobile: left`],
			['size', `${prefix}\n  size: medium`],
			['lineHeight', `${prefix}\n  lineHeight: 1.5`],
		];
		if (includeHeadingFields) {
			fields.push(
				['weight', `${prefix}\n  weight: 600`],
				['spacingBefore', `${prefix}\n  spacingBefore: 1.5em`],
				['spacingAfter', `${prefix}\n  spacingAfter: 0.5em`],
			);
		}
		for (const [name, example] of fields) {
			addFieldHelp(jsonSchema, `${propertyPath}.${name}`, example, 'typography.md', 'configuration-shape');
		}
		addSnippets(jsonSchema, `${propertyPath}.align`, [schemaSnippet({
			label: 'Responsive text alignment',
			body: {
				desktop: '${1:left}',
				mobile: '${2:left}',
			},
			description: 'Set separate text alignment for wider and narrow screens.',
			file: 'typography.md',
			anchor: 'configuration-shape',
		})]);
	};
	for (const level of ['h1', 'h2', 'h3', 'h4']) {
		const propertyPath = `typography.overrides.headings.${level}`;
		const prefix = `typography:\n  overrides:\n    headings:\n      ${level}:`;
		addFieldHelp(jsonSchema, propertyPath, `${prefix}\n        size: medium`, 'typography.md', 'configuration-shape');
		textOverrideHelp(propertyPath, `${prefix}\n      `, true);
	}
	textOverrideHelp('typography.overrides.body', 'typography:\n  overrides:\n    body:');
	addFieldHelp(jsonSchema, 'typography.overrides.body.paragraphSpacing', 'typography:\n  overrides:\n    body:\n      paragraphSpacing: 1em', 'typography.md', 'configuration-shape');
	textOverrideHelp('typography.overrides.caption', 'typography:\n  overrides:\n    caption:');
	addFieldHelp(jsonSchema, 'typography.overrides.caption.spacingBefore', 'typography:\n  overrides:\n    caption:\n      spacingBefore: 0.5em', 'typography.md', 'configuration-shape');
	addSnippets(jsonSchema, 'typography.overrides', [schemaSnippet({
		label: 'Typography overrides',
		body: {
			headings: {
				h2: {
					size: '${1:medium}',
					weight: '${2:600}',
				},
			},
		body: {
				lineHeight: '${3:1.55}',
			},
		},
		description: 'Start a focused set of heading and body-text overrides.',
		file: 'typography.md',
		anchor: 'configuration-shape',
	})]);
};

const addPageThemeHelp = (jsonSchema) => {
	jsonSchema.markdownDescription = [
		yamlExample('layout:\n  textWidth: narrow\n  contentSpacing: compact'),
		'A page theme may adjust only page layout, managed-image sizing and the section background pattern. Descendant pages inherit these values. Site colors, shapes and typography stay consistent.',
		documentationLink('Page theme reference', 'theme.md', 'page-themes'),
	].join('\n\n');
	addHelp(jsonSchema, 'layout', [
		yamlExample('layout:\n  textWidth: narrow\n  contentSpacing: compact'),
		'Adjusts body-text line length and vertical content spacing for this page and its descendants.',
		documentationLink('Page theme reference', 'theme.md', 'page-themes'),
	]);
	addFieldHelp(jsonSchema, 'layout.textWidth', 'layout:\n  textWidth: narrow', 'theme.md', 'page-themes', ['narrow', 'normal', 'wide']);
	addFieldHelp(jsonSchema, 'layout.contentSpacing', 'layout:\n  contentSpacing: compact', 'theme.md', 'page-themes', ['compact', 'normal', 'spacious']);
	addHelp(jsonSchema, 'images', [
		yamlExample('images:\n  width: 900px'),
		'Adjusts managed-image sizing for this page and its descendants.',
		documentationLink('Image sizing reference', 'theme.md', 'image-sizing'),
	]);
	const imageFields = [
		['images.width', 'images:\n  width: 900px'],
		['images.maxAvailableWidthPercent', 'images:\n  maxAvailableWidthPercent:\n    desktop: 100\n    mobile: 100'],
		['images.maxAvailableWidthPercent.desktop', 'images:\n  maxAvailableWidthPercent:\n    desktop: 100'],
		['images.maxAvailableWidthPercent.mobile', 'images:\n  maxAvailableWidthPercent:\n    mobile: 100'],
		['images.maxAvailableHeightPercent', 'images:\n  maxAvailableHeightPercent:\n    desktop: 74\n    mobile: 68'],
		['images.maxAvailableHeightPercent.desktop', 'images:\n  maxAvailableHeightPercent:\n    desktop: 74'],
		['images.maxAvailableHeightPercent.mobile', 'images:\n  maxAvailableHeightPercent:\n    mobile: 68'],
	];
	for (const [propertyPath, example] of imageFields) {
		addFieldHelp(jsonSchema, propertyPath, example, 'theme.md', 'image-sizing');
	}
	addHelp(jsonSchema, 'sections', [
		yamlExample('sections:\n  backgroundPattern: alternating'),
		'Adjusts the section background sequence for this page and its descendants.',
		documentationLink('Page theme reference', 'theme.md', 'page-themes'),
	]);
	addFieldHelp(jsonSchema, 'sections.backgroundPattern', 'sections:\n  backgroundPattern: alternating', 'theme.md', 'page-themes', ['uniform', 'alternating', 'cycling']);
};

const addSitewideHelp = (jsonSchema) => {
	jsonSchema.markdownDescription = [
		yamlExample('footer:\n  copyrightMessage: Copyright Example Owner.'),
		'`sitewide-content.yaml` optionally defines banners, footer content, and logo display settings shared by every page.',
		documentationLink('Site-wide content reference', 'sitewide-content.md'),
	].join('\n\n');
	addSitewideLogoHelp(jsonSchema);
	addHelp(jsonSchema, 'banners', [
		yamlExample('banners:\n  - id: project-status\n    tone: warning\n    title: Experimental code\n    text: Not for production use.'),
		'Adds dismissible notices above page content. List order controls their presentation order; each `id` must be unique.',
		documentationLink('Banner reference', 'sitewide-content.md', 'banners'),
	]);
	const bannerItem = jsonSchema.properties?.banners?.items;
	if (!bannerItem) throw new Error('Generated site-wide schema has no banner item definition.');
	const bannerItemHelp = [
		'A `warning` is a dismissible site-wide notice shown above page content. Use it for important temporary information visitors should notice, rather than ordinary page content.',
		documentationLink('Banner reference', 'sitewide-content.md', 'banners'),
	].join('\n\n');
	bannerItem.title = 'Warning banner';
	bannerItem.markdownDescription = bannerItemHelp;
	bannerItem.defaultSnippets = [{
		label: 'Warning banner',
		markdownDescription: bannerItemHelp,
		body: {
			id: '${1:project-status}',
			tone: 'warning',
			title: '${2:Important notice}',
			text: '${3:Brief explanation.}',
		},
	}];
	addHelp(jsonSchema, 'footer', [
		yamlExample('footer:\n  copyrightMessage: Copyright Example Owner.'),
		'Adds shared footer content. Generated build information is optional.',
		documentationLink('Footer reference', 'sitewide-content.md', 'footer'),
	]);

	const bannerFields = [
		['banners.[].id', 'banners:\n  - id: project-status'],
		['banners.[].tone', 'banners:\n  - tone: warning'],
		['banners.[].visible', 'banners:\n  - visible:\n      from: "2026-01-01"\n      until: "2026-02-01"'],
		['banners.[].visible.from', 'banners:\n  - visible:\n      from: "2026-01-01"'],
		['banners.[].visible.until', 'banners:\n  - visible:\n      until: "2026-02-01"'],
		['banners.[].title', 'banners:\n  - title: Important notice'],
		['banners.[].text', 'banners:\n  - text: Brief explanation.'],
	];
	for (const [propertyPath, example] of bannerFields) {
		addFieldHelp(jsonSchema, propertyPath, example, 'sitewide-content.md', 'banners');
	}
	addSnippets(jsonSchema, 'banners.[].visible', [schemaSnippet({
		label: 'Visibility window',
		body: {
			from: '${1:2026-01-01}',
			until: '${2:2026-02-01}',
		},
		description: 'Show the banner from the first date up to, but not including, the second date.',
		file: 'sitewide-content.md',
		anchor: 'banners',
	})]);

	const footerFields = [
		['footer.copyrightMessage', 'footer:\n  copyrightMessage: Copyright Example Owner.'],
		['footer.buildInfo', 'footer:\n  buildInfo: true'],
	];
	for (const [propertyPath, example] of footerFields) {
		addFieldHelp(jsonSchema, propertyPath, example, 'sitewide-content.md', 'footer');
	}
};

const addContentHelp = (jsonSchema) => {
	jsonSchema.markdownDescription = [
		yamlExample('---\npage:\n  description: About this project.\n---'),
		'Content frontmatter is optional. Write the page title as the single Markdown H1; use frontmatter only for optional metadata or navigation settings.',
		documentationLink('Page title and frontmatter reference', 'content.md', 'page-title-and-frontmatter'),
	].join('\n\n');
	addHelp(jsonSchema, 'page', [
		yamlExample('page:\n  description: About this project.'),
		'Contains optional metadata for the current homepage or additional page. The Markdown H1 supplies its title.',
		documentationLink('Page title and frontmatter reference', 'content.md', 'page-title-and-frontmatter'),
	]);
	addHelp(jsonSchema, 'page.description', [
		yamlExample('page:\n  description: About this project.'),
		'An optional page-specific description rendered as `<meta name="description">`. It is not visible in page content.',
		documentationLink('Page title and frontmatter reference', 'content.md', 'page-title-and-frontmatter'),
	], ['About this project.']);
	addHelp(jsonSchema, 'navigation', [
		yamlExample('navigation:\n  listed: false'),
		'Optionally excludes an additional page from site navigation without removing its public URL.',
		documentationLink('Site navigation reference', 'pages.md', 'navigation'),
	]);
	addFieldHelp(jsonSchema, 'navigation.listed', 'navigation:\n  listed: false', 'pages.md', 'navigation', [true, false]);
};

export const applySchemaEditorMetadata = (filename, jsonSchema) => {
	addValueDescriptions(jsonSchema);
	if (filename === 'config.schema.json') {
		addLanguageSuggestions(jsonSchema);
		addConfigHelp(jsonSchema);
	}
	if (filename === 'theme.schema.json') addThemeHelp(jsonSchema);
	if (filename === 'page-theme.schema.json') addPageThemeHelp(jsonSchema);
	if (filename === 'sitewide-content.schema.json') addSitewideHelp(jsonSchema);
	if (filename === 'content-frontmatter.schema.json') addContentHelp(jsonSchema);
	return jsonSchema;
};
