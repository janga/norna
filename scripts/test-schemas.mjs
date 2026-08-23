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
	'sitewide-content.schema.json',
	'content-frontmatter.schema.json',
];
const requiredRichHelp = {
	'config.schema.json': ['url', 'language', 'scrollBehavior'],
	'theme.schema.json': ['preset', 'layout', 'images', 'typography', 'palette', 'sectionSurfaces'],
	'sitewide-content.schema.json': ['navigation', 'banners', 'footer'],
	'content-frontmatter.schema.json': ['title', 'description', 'navigation', 'sections'],
};

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

const visitSchema = (schema, location) => {
	assert.equal(schema.enum, undefined, `${location} uses an undescribed enum.`);
	if (schema.properties) {
		for (const [name, property] of Object.entries(schema.properties)) {
			assert.ok(property.description, `${location}.${name} has no description.`);
			visitSchema(property, `${location}.${name}`);
		}
	}
	if (schema.items) visitSchema(schema.items, `${location}[]`);
	for (const keyword of ['allOf', 'anyOf', 'oneOf']) {
		for (const [index, candidate] of (schema[keyword] ?? []).entries()) {
			if (Object.hasOwn(candidate, 'const')) {
				assert.ok(candidate.title, `${location}.${keyword}[${index}] has no title.`);
				assert.ok(candidate.description, `${location}.${keyword}[${index}] has no description.`);
			}
			visitSchema(candidate, `${location}.${keyword}[${index}]`);
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
	visitSchema(schema, filename);
}

const config = JSON.parse(await readFile(path.join(root, 'schemas', 'config.schema.json'), 'utf8'));
assert.equal(config.properties.language.default, 'en');
assert.deepEqual(config.properties.language.examples, ['en', 'sv', 'en-GB', 'sv-SE']);
assert.equal(config.properties.scrollBehavior.default, 'instant');

const sitewide = JSON.parse(await readFile(path.join(root, 'schemas', 'sitewide-content.schema.json'), 'utf8'));
assert.deepEqual(Object.keys(sitewide.properties.navigation.properties), ['label', 'logo']);
assert.deepEqual(Object.keys(sitewide.properties.navigation.properties.logo.properties), ['height']);
assert.match(sitewide.properties.navigation.properties.logo.markdownDescription, /```yaml\nnavigation:\n  label: Example Site\n  logo:\n    height: 2rem\n```/);
assert.match(sitewide.properties.navigation.properties.logo.markdownDescription, /does not enable or select the file/);
assert.match(sitewide.properties.navigation.properties.logo.markdownDescription, /docs\/public-files\.md#navigation-logo/);
assert.equal(sitewide.properties.navigation.properties.logo.description.length < 100, true);

console.log('Schema metadata tests passed.');
