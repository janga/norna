import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const packageJson = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'));
const expectedDocumentationRef = `v${packageJson.version}`;
const filenames = [
	'category.schema.json',
	'config.schema.json',
	'theme.schema.json',
	'page-theme.schema.json',
	'sitewide-content.schema.json',
	'content-frontmatter.schema.json',
];
const requiredRichHelp = {
	'category.schema.json': ['label'],
	'config.schema.json': ['url', 'language', 'navigation', 'scrollBehavior'],
	'theme.schema.json': ['preset', 'appearance', 'readerControls', 'corners', 'layout', 'images', 'blocks', 'typography', 'palette', 'sections'],
	'page-theme.schema.json': ['layout', 'images', 'sections'],
	'sitewide-content.schema.json': ['logo', 'banners', 'footer'],
	'content-frontmatter.schema.json': ['page', 'navigation'],
};
const manifest = JSON.parse(await readFile(path.join(root, 'schemas', 'manifest.json'), 'utf8'));
assert.equal(manifest.editorApiVersion, 1);
assert.equal(manifest.schemaVersion, 3);
assert.equal(manifest.files.category, 'category.schema.json');
assert.equal(manifest.files.pageTheme, 'page-theme.schema.json');

const githubHeadingAnchor = (heading) => heading
	.toLowerCase()
	.replace(/<[^>]+>/g, '')
	.replace(/[`*_~]/g, '')
	.replace(/[^\p{L}\p{N}\s-]/gu, '')
	.trim()
	.replace(/\s+/g, '-');

const assertDocumentationLinks = async (markdownDescription, location) => {
	const links = [...markdownDescription.matchAll(
		/https:\/\/github\.com\/janga\/norna\/blob\/([^/\s]+)\/docs\/([^\s)#]+)(?:#([^\s)]+))?/g,
	)];
	assert.ok(links.length > 0, `${location} has no documentation link.`);

	for (const [, reference, filename, anchor] of links) {
		assert.equal(reference, expectedDocumentationRef, `${location} uses documentation ref ${reference}.`);
		const documentationPath = path.join(root, 'docs', decodeURIComponent(filename));
		assert.ok(existsSync(documentationPath), `${location} links to missing docs/${filename}.`);
		if (!anchor) continue;

		const source = await readFile(documentationPath, 'utf8');
		const anchors = source
			.split('\n')
			.filter((line) => /^#{1,6}\s/.test(line))
			.map((line) => githubHeadingAnchor(line.replace(/^#{1,6}\s+/, '')));
		assert.ok(anchors.includes(anchor), `${location} links to missing anchor docs/${filename}#${anchor}.`);
	}
};

const assertSnippetShape = (schema, value, location) => {
	if (Array.isArray(value)) {
		const arraySchema = schema.items
			? schema
			: [...(schema.anyOf ?? []), ...(schema.oneOf ?? []), ...(schema.allOf ?? [])]
				.find((candidate) => candidate.type === 'array' || candidate.items);
		assert.ok(arraySchema?.items, `${location} inserts an array where the schema has no array items.`);
		for (const [index, item] of value.entries()) {
			assertSnippetShape(arraySchema.items, item, `${location}[${index}]`);
		}
		return;
	}

	if (!value || typeof value !== 'object') return;
	const objectSchema = schema.type === 'object' || schema.properties
		? schema
		: [...(schema.anyOf ?? []), ...(schema.oneOf ?? []), ...(schema.allOf ?? [])]
			.find((candidate) => candidate.type === 'object' || candidate.properties);
	assert.ok(objectSchema, `${location} inserts an object into a non-object schema.`);
	for (const [key, child] of Object.entries(value)) {
		const childSchema = objectSchema.properties?.[key]
			?? (objectSchema.additionalProperties && typeof objectSchema.additionalProperties === 'object'
				? objectSchema.additionalProperties
				: null);
		assert.ok(childSchema, `${location} inserts unknown property "${key}".`);
		assertSnippetShape(childSchema, child, `${location}.${key}`);
	}
};

const visitSchema = (schema, location, richProperties) => {
	assert.equal(schema.enum, undefined, `${location} uses an undescribed enum.`);
	for (const [index, snippet] of (schema.defaultSnippets ?? []).entries()) {
		assert.ok(snippet && typeof snippet === 'object', `${location}.defaultSnippets[${index}] is invalid.`);
		assert.ok(Object.hasOwn(snippet, 'body'), `${location}.defaultSnippets[${index}] has no body.`);
		assertSnippetShape(schema, snippet.body, `${location}.defaultSnippets[${index}].body`);
	}
	if (schema.properties) {
		for (const [name, property] of Object.entries(schema.properties)) {
			assert.ok(property.description, `${location}.${name} has no description.`);
			richProperties.push([property, `${location}.${name}`]);
			visitSchema(property, `${location}.${name}`, richProperties);
		}
	}
	if (schema.items) visitSchema(schema.items, `${location}[]`, richProperties);
	if (schema.additionalProperties && typeof schema.additionalProperties === 'object') {
		visitSchema(schema.additionalProperties, `${location}.*`, richProperties);
	}
	for (const keyword of ['allOf', 'anyOf', 'oneOf']) {
		for (const [index, candidate] of (schema[keyword] ?? []).entries()) {
			if (Object.hasOwn(candidate, 'const')) {
				assert.ok(candidate.title, `${location}.${keyword}[${index}] has no title.`);
				assert.ok(candidate.description, `${location}.${keyword}[${index}] has no description.`);
			}
			visitSchema(candidate, `${location}.${keyword}[${index}]`, richProperties);
		}
	}
};

for (const filename of filenames) {
	const schema = JSON.parse(await readFile(path.join(root, 'schemas', filename), 'utf8'));
	assert.ok(schema.description, `${filename} has no root description.`);
	assert.match(schema.markdownDescription, /^```yaml\n/, `${filename} rich help must start with YAML syntax.`);
	await assertDocumentationLinks(schema.markdownDescription, filename);
	for (const propertyName of requiredRichHelp[filename]) {
		const property = schema.properties[propertyName];
		assert.match(
			property.markdownDescription,
			/^```yaml\n/,
			`${filename}.${propertyName} rich help must start with YAML syntax.`,
		);
		await assertDocumentationLinks(property.markdownDescription, `${filename}.${propertyName}`);
	}
	const richProperties = [];
	visitSchema(schema, filename, richProperties);
	for (const [property, location] of richProperties) {
		assert.match(
			property.markdownDescription,
			/^```yaml\n/,
			`${location} rich help must start with YAML syntax.`,
		);
		await assertDocumentationLinks(property.markdownDescription, location);
	}
}

const config = JSON.parse(await readFile(path.join(root, 'schemas', 'config.schema.json'), 'utf8'));
assert.equal(config.properties.language.default, 'en');
assert.deepEqual(config.properties.language.examples, ['en', 'sv', 'en-GB', 'sv-SE']);
assert.equal(config.properties.scrollBehavior.default, 'instant');

const category = JSON.parse(await readFile(path.join(root, 'schemas', 'category.schema.json'), 'utf8'));
assert.deepEqual(Object.keys(category.properties), ['label']);
assert.deepEqual(category.required, ['label']);
assert.match(category.markdownDescription, /creates a navigation-only group/);
assert.match(category.markdownDescription, /produces no URL of its own/);

const sitewide = JSON.parse(await readFile(path.join(root, 'schemas', 'sitewide-content.schema.json'), 'utf8'));
assert.deepEqual(Object.keys(sitewide.properties.logo.properties), ['height']);
assert.match(sitewide.properties.logo.markdownDescription, /```yaml\nlogo:\n  height: 2rem\n```/);
assert.match(sitewide.properties.logo.markdownDescription, /does not enable or select the file/);
assert.match(sitewide.properties.logo.markdownDescription, /homepage Markdown H1/);
assert.match(sitewide.properties.logo.markdownDescription, /2\.6rem/);
assert.match(sitewide.properties.logo.markdownDescription, /2\.15rem/);
assert.match(sitewide.properties.logo.markdownDescription, /docs\/public-files\.md#navigation-logo/);
assert.equal(sitewide.properties.logo.description.length < 100, true);
const bannerItem = sitewide.properties.banners.items;
assert.equal(bannerItem.title, 'Warning banner');
assert.match(bannerItem.description, /important temporary information/);
assert.match(bannerItem.markdownDescription, /A `warning` is a dismissible site-wide notice/);
await assertDocumentationLinks(bannerItem.markdownDescription, 'sitewide-content.schema.json.banners[]');
assert.equal(bannerItem.defaultSnippets[0].label, 'Warning banner');
assert.deepEqual(bannerItem.defaultSnippets[0].body, {
	id: '${1:project-status}',
	tone: 'warning',
	title: '${2:Important notice}',
	text: '${3:Brief explanation.}',
});
await assertDocumentationLinks(
	bannerItem.defaultSnippets[0].markdownDescription,
	'sitewide-content.schema.json.banners[].defaultSnippets[0]',
);
const buildInfo = sitewide.properties.footer.properties.buildInfo;
assert.equal(buildInfo.type, 'boolean');
assert.equal(buildInfo.default, false);
assert.match(buildInfo.markdownDescription, /footer:\n  buildInfo: true/);

const theme = JSON.parse(await readFile(path.join(root, 'schemas', 'theme.schema.json'), 'utf8'));
assert.equal(theme.properties.layout.properties.gutter.defaultSnippets[0].label, 'Responsive page gutter');
assert.equal(theme.properties.appearance.defaultSnippets[0].label, 'Set the initial appearance');
assert.equal(theme.properties.readerControls.defaultSnippets[0].label, 'Configure the Display panel');
assert.deepEqual(Object.keys(theme.properties.readerControls.properties), ['appearance', 'focusReading']);
assert.match(
	theme.properties.readerControls.markdownDescription,
	/Choose which optional controls readers can use in the site-wide Display panel\./,
);
assert.match(
	theme.properties.readerControls.markdownDescription,
	/Reading width is always included\. Sites with tree navigation always include Focus reading/,
);
assert.match(
	theme.properties.readerControls.properties.appearance.markdownDescription,
	/Show an Appearance control that lets readers choose System, Light, or Dark\./,
);
assert.match(
	theme.properties.readerControls.properties.focusReading.markdownDescription,
	/lets readers hide navigation, breadcrumbs, and the footer/,
);
assert.deepEqual(
	theme.properties.palette.oneOf.map((entry) => entry.const),
	[
		'near-monochrome',
		'warm-paper',
		'retro-earth',
		'clay-rose',
		'forest-moss',
		'mineral-teal',
		'arctic-blue',
		'soft-lavender',
		'vivid-night',
	],
);
assert.deepEqual(
	theme.properties.corners.oneOf.map((entry) => entry.const),
	['square', 'rounded'],
);
assert.deepEqual(
	theme.properties.sections.properties.backgroundPattern.oneOf.map((entry) => entry.const),
	['uniform', 'alternating', 'accented'],
);
assert.equal(theme.properties.layout.properties.spacing.defaultSnippets[0].label, 'Layout spacing overrides');
assert.equal(theme.properties.typography.properties.overrides.defaultSnippets[0].label, 'Typography overrides');
assert.equal(
	theme.properties.images.properties.maxAvailableWidthPercent.defaultSnippets[0].label,
	'Responsive image limit',
);
assert.deepEqual(
	theme.properties.blocks.properties.cardList.properties.width.oneOf.map((entry) => entry.const),
	['text', 'narrow', 'normal', 'wide'],
);
assert.equal(theme.properties.blocks.defaultSnippets[0].label, 'Override content-block defaults');
assert.match(theme.properties.blocks.markdownDescription, /docs\/theme\.md#content-block-defaults/);
assert.match(
	theme.properties.blocks.properties.cardList.properties.width.markdownDescription,
	/docs\/theme\.md#content-block-defaults/,
);
assert.equal(theme.properties.navigation, undefined);
assert.equal(theme.properties.layout.properties.density, undefined);
assert.ok(theme.properties.layout.properties.contentSpacing);
assert.ok(theme.properties.layout.properties.textWidth);
assert.ok(theme.properties.sections.properties.backgroundPattern);
assert.equal(
	theme.properties.typography.properties.overrides.properties.headings.properties.h1.properties.lineHeight.minimum,
	1,
);
assert.equal(
	theme.properties.typography.properties.overrides.properties.body.properties.lineHeight.minimum,
	1.4,
);
assert.equal(
	theme.properties.typography.properties.overrides.properties.caption.properties.lineHeight.minimum,
	1.25,
);

const pageTheme = JSON.parse(await readFile(path.join(root, 'schemas', 'page-theme.schema.json'), 'utf8'));
assert.deepEqual(Object.keys(pageTheme.properties), ['layout', 'images', 'sections']);
assert.deepEqual(Object.keys(pageTheme.properties.layout.properties), ['contentSpacing', 'textWidth']);
assert.equal(pageTheme.properties.preset, undefined);
assert.equal(pageTheme.properties.palette, undefined);
assert.equal(pageTheme.properties.appearance, undefined);
assert.equal(pageTheme.properties.readerControls, undefined);
assert.equal(pageTheme.properties.typography, undefined);
assert.equal(pageTheme.properties.blocks, undefined);
assert.match(pageTheme.markdownDescription, /content-block defaults/);

const content = JSON.parse(await readFile(path.join(root, 'schemas', 'content-frontmatter.schema.json'), 'utf8'));
assert.deepEqual(Object.keys(content.properties), ['page', 'navigation']);
assert.deepEqual(Object.keys(content.properties.page.properties), ['description', 'aliases']);
assert.match(content.properties.page.properties.aliases.markdownDescription, /permanently identify this page/);
assert.match(content.properties.page.properties.aliases.markdownDescription, /docs\/pages\.md#preserve-old-page-urls/);
assert.match(content.properties.page.properties.aliases.items.markdownDescription, /configured base path/);
assert.deepEqual(content.properties.page.properties.aliases.examples, [['/old-about/']]);
assert.deepEqual(content.properties.page.properties.aliases.items.examples, ['/old-about/']);
assert.equal(content.properties.page.required, undefined);
assert.equal(content.required, undefined);
assert.deepEqual(Object.keys(content.properties.navigation.properties), ['listed']);

console.log('Schema metadata tests passed.');
