import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'astro/zod';
import {
	configSchema,
	siteSchema,
	sitewideSchema,
	themeVisualSchema,
} from './lib/schema-definitions.mjs';
import { documentationLink } from './lib/documentation-links.mjs';
import { getSchemaValueDefinition } from './lib/schema-value-definitions.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const schemaDirectory = path.join(root, 'schemas');
const definitions = [
	['config.schema.json', 'Norna site configuration', configSchema],
	['theme.schema.json', 'Norna visual theme', themeVisualSchema],
	['sitewide-content.schema.json', 'Norna site-wide content', sitewideSchema],
	['content-frontmatter.schema.json', 'Norna page frontmatter', siteSchema],
];
const yamlExample = (source) => `\`\`\`yaml\n${source}\n\`\`\``;

const schemaProperty = (schema, propertyPath) => {
	let current = schema;
	for (const name of propertyPath.split('.')) {
		current = current?.properties?.[name];
		if (!current) throw new Error(`Generated schema has no property at ${propertyPath}.`);
	}
	return current;
};

const addHelp = (schema, propertyPath, paragraphs, examples = []) => {
	const property = schemaProperty(schema, propertyPath);
	property.markdownDescription = paragraphs.join('\n\n');
	if (examples.length > 0) property.examples = examples;
};

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

const addSitewideNavigationHelp = (jsonSchema) => {
	const navigation = jsonSchema.properties?.navigation;
	const label = navigation?.properties?.label;
	const logo = navigation?.properties?.logo;
	if (!navigation || !label || !logo) throw new Error('Generated site-wide schema has no navigation label/logo properties.');

	navigation.markdownDescription = [
		yamlExample('navigation:\n  label: Example Site'),
		'`navigation` defines the identity shared by the homepage and every route. Routes cannot replace it.',
		documentationLink('Navigation identity reference', 'sitewide-content.md', 'navigation-identity'),
	].join('\n\n');
	label.markdownDescription = [
		yamlExample('navigation:\n  label: Example Site'),
		'- Without a logo, this text is shown in the navigation.',
		'- With a logo, this text becomes the image alternative text.',
		'- When omitted, Norna uses the homepage title.',
		documentationLink('Navigation identity reference', 'sitewide-content.md', 'navigation-identity'),
	].join('\n\n');
	label.examples = ['Example Site'];
	logo.markdownDescription = [
		yamlExample('navigation:\n  label: Example Site\n  logo:\n    height: 2rem'),
		'`logo` optionally overrides the displayed height of the logo file that Norna discovers automatically. It does not enable or select the file.',
		documentationLink('Navigation logo filenames and placement', 'public-files.md', 'navigation-logo'),
	].join('\n\n');
	logo.properties.height.examples = ['2rem'];
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
		'Selects coordinated layout, image sizing, typography, palette and section surfaces. This is the normal starting point for a theme.',
		documentationLink('Compare theme presets', 'theme.md', 'theme-presets'),
	]);
	addHelp(jsonSchema, 'layout', [
		yamlExample('layout:\n  density: compact\n  pageWidth: 72rem'),
		'Overrides page width, gutters and structural spacing after the selected preset.',
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
	addHelp(jsonSchema, 'sectionSurfaces', [
		yamlExample('sectionSurfaces: [base, soft, emphasis]'),
		'Lists one to three semantic surfaces. Norna cycles through them in section order; omit this field to keep the preset sequence.',
		documentationLink('Palette and section surfaces', 'theme.md', 'palette-and-section-surfaces'),
	], [['base'], ['base', 'soft'], ['base', 'soft', 'emphasis']]);
};

const addSitewideHelp = (jsonSchema) => {
	jsonSchema.markdownDescription = [
		yamlExample('navigation:\n  label: Example Site'),
		'`sitewide-content.yaml` optionally defines editorial content and identity shared by every page.',
		documentationLink('Site-wide content reference', 'sitewide-content.md'),
	].join('\n\n');
	addSitewideNavigationHelp(jsonSchema);
	addHelp(jsonSchema, 'banners', [
		yamlExample('banners:\n  - id: project-status\n    tone: warning\n    title: Experimental code\n    text: Not for production use.'),
		'Adds dismissible notices above page content. List order controls their presentation order; each `id` must be unique.',
		documentationLink('Banner reference', 'sitewide-content.md', 'banners'),
	]);
	addHelp(jsonSchema, 'footer', [
		yamlExample('footer:\n  copyrightMessage: Copyright Example Owner.'),
		'Adds shared footer content. Generated build information is optional.',
		documentationLink('Footer reference', 'sitewide-content.md', 'footer'),
	]);
};

const addContentHelp = (jsonSchema) => {
	jsonSchema.markdownDescription = [
		yamlExample('---\ntitle: About\ndescription: About this project.\n---'),
		'Every homepage and route `content.md` starts with page metadata, followed by Markdown sections.',
		documentationLink('Page frontmatter reference', 'content.md', 'page-frontmatter'),
	].join('\n\n');
	addHelp(jsonSchema, 'title', [
		yamlExample('title: About'),
		'The page title used in metadata and, by default, route navigation.',
		documentationLink('Page frontmatter reference', 'content.md', 'page-frontmatter'),
	], ['About']);
	addHelp(jsonSchema, 'description', [
		yamlExample('description: About this project.'),
		'A concise page description used in metadata.',
		documentationLink('Page frontmatter reference', 'content.md', 'page-frontmatter'),
	], ['About this project.']);
	addHelp(jsonSchema, 'navigation', [
		yamlExample('navigation:\n  include: true\n  label: About us'),
		'Controls whether a route appears in site navigation and optionally replaces its visible title there. Homepage navigation is section-based.',
		documentationLink('Route navigation reference', 'routes.md', 'navigation'),
	]);
	addHelp(jsonSchema, 'sections', [
		yamlExample('sections:\n  announcement:\n    visible:\n      until: "2026-12-01"'),
		'Adds optional metadata keyed by explicit Markdown section id. Markdown headings remain the source of section content and order.',
		documentationLink('Section metadata reference', 'content.md', 'section-metadata'),
	]);
};

const schemaFiles = new Map();

for (const [filename, title, schema] of definitions) {
	const jsonSchema = z.toJSONSchema(schema, { target: 'draft-07', io: 'input' });
	jsonSchema.$id = `https://janga.github.io/norna/schemas/${filename}`;
	jsonSchema.title = title;
	addValueDescriptions(jsonSchema);
	if (filename === 'config.schema.json') {
		addLanguageSuggestions(jsonSchema);
		addConfigHelp(jsonSchema);
	}
	if (filename === 'theme.schema.json') addThemeHelp(jsonSchema);
	if (filename === 'sitewide-content.schema.json') addSitewideHelp(jsonSchema);
	if (filename === 'content-frontmatter.schema.json') addContentHelp(jsonSchema);
	schemaFiles.set(filename, `${JSON.stringify(jsonSchema, null, 2)}\n`);
}

schemaFiles.set('manifest.json', `${JSON.stringify({
	schemaVersion: 1,
	files: {
		config: 'config.schema.json',
		contentFrontmatter: 'content-frontmatter.schema.json',
		sitewideContent: 'sitewide-content.schema.json',
		theme: 'theme.schema.json',
	},
}, null, 2)}\n`);

const args = process.argv.slice(2);
const checkOnly = args.length === 1 && args[0] === '--check';
if (args.length > 0 && !checkOnly) {
	throw new Error('Usage: node scripts/generate-schemas.mjs [--check]');
}

if (checkOnly) {
	const stale = [];
	for (const [filename, expected] of schemaFiles) {
		const actual = await readFile(path.join(schemaDirectory, filename), 'utf8').catch((error) => (
			error?.code === 'ENOENT' ? null : Promise.reject(error)
		));
		if (actual !== expected) stale.push(filename);
	}

	if (stale.length > 0) {
		throw new Error(`Generated Norna schemas are stale: ${stale.join(', ')}. Run "npm run schemas:generate".`);
	}

	console.log(`Norna schemas are up to date (${definitions.length} schemas).`);
} else {
	await mkdir(schemaDirectory, { recursive: true });
	for (const [filename, source] of schemaFiles) {
		await writeFile(path.join(schemaDirectory, filename), source);
	}

	console.log(`Generated ${definitions.length} Norna schemas in ${path.relative(root, schemaDirectory)}.`);
}
