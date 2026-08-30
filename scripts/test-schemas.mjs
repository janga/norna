import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const packageJson = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'));
const expectedDocumentationRef = `v${packageJson.version}`;
const filenames = [
	'config.schema.json',
	'theme.schema.json',
	'page-theme.schema.json',
	'sitewide-content.schema.json',
	'content-frontmatter.schema.json',
];
const requiredRichHelp = {
	'config.schema.json': ['url', 'language', 'navigation', 'scrollBehavior'],
	'theme.schema.json': ['preset', 'colorMode', 'readerControls', 'corners', 'layout', 'images', 'typography', 'palette', 'sections'],
	'page-theme.schema.json': ['layout', 'images', 'sections'],
	'sitewide-content.schema.json': ['logo', 'banners', 'footer'],
	'content-frontmatter.schema.json': ['page', 'navigation'],
};
const manifest = JSON.parse(await readFile(path.join(root, 'schemas', 'manifest.json'), 'utf8'));
assert.equal(manifest.editorApiVersion, 1);
assert.equal(manifest.schemaVersion, 2);
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

const visitSchema = (schema, location, richProperties) => {
	assert.equal(schema.enum, undefined, `${location} uses an undescribed enum.`);
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

const sitewide = JSON.parse(await readFile(path.join(root, 'schemas', 'sitewide-content.schema.json'), 'utf8'));
assert.deepEqual(Object.keys(sitewide.properties.logo.properties), ['height']);
assert.match(sitewide.properties.logo.markdownDescription, /```yaml\nlogo:\n  height: 2rem\n```/);
assert.match(sitewide.properties.logo.markdownDescription, /does not enable or select the file/);
assert.match(sitewide.properties.logo.markdownDescription, /homepage Markdown H1/);
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
assert.equal(theme.properties.colorMode.defaultSnippets[0].label, 'Set the initial color mode');
assert.equal(theme.properties.readerControls.defaultSnippets[0].label, 'Configure the Display panel');
assert.deepEqual(Object.keys(theme.properties.readerControls.properties), ['colorMode', 'readingWidth', 'focusReading']);
assert.deepEqual(
	theme.properties.palette.oneOf.map((entry) => entry.const),
	['near-monochrome', 'cool-green', 'warm-paper'],
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
assert.equal(theme.properties.navigation, undefined);
assert.equal(theme.properties.layout.properties.density, undefined);
assert.ok(theme.properties.layout.properties.contentSpacing);
assert.ok(theme.properties.layout.properties.textWidth);
assert.ok(theme.properties.sections.properties.backgroundPattern);

const pageTheme = JSON.parse(await readFile(path.join(root, 'schemas', 'page-theme.schema.json'), 'utf8'));
assert.deepEqual(Object.keys(pageTheme.properties), ['layout', 'images', 'sections']);
assert.deepEqual(Object.keys(pageTheme.properties.layout.properties), ['contentSpacing', 'textWidth']);
assert.equal(pageTheme.properties.preset, undefined);
assert.equal(pageTheme.properties.palette, undefined);
assert.equal(pageTheme.properties.colorMode, undefined);
assert.equal(pageTheme.properties.readerControls, undefined);
assert.equal(pageTheme.properties.typography, undefined);

const content = JSON.parse(await readFile(path.join(root, 'schemas', 'content-frontmatter.schema.json'), 'utf8'));
assert.deepEqual(Object.keys(content.properties), ['page', 'navigation']);
assert.deepEqual(Object.keys(content.properties.page.properties), ['description']);
assert.equal(content.properties.page.required, undefined);
assert.equal(content.required, undefined);
assert.deepEqual(Object.keys(content.properties.navigation.properties), ['listed']);

console.log('Schema metadata tests passed.');
