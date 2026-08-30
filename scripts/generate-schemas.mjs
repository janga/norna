import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'astro/zod';
import {
	categorySchema,
	configSchema,
	pageThemeSchema,
	siteSchema,
	sitewideSchema,
	themeVisualSchema,
} from './lib/schema-definitions.mjs';
import { applySchemaEditorMetadata } from './lib/schema-editor-metadata.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const schemaDirectory = path.join(root, 'schemas');
const definitions = [
	['category.schema.json', 'Norna page category', categorySchema],
	['config.schema.json', 'Norna site configuration', configSchema],
	['theme.schema.json', 'Norna visual theme', themeVisualSchema],
	['page-theme.schema.json', 'Norna page theme', pageThemeSchema],
	['sitewide-content.schema.json', 'Norna site-wide content', sitewideSchema],
	['content-frontmatter.schema.json', 'Norna page frontmatter', siteSchema],
];
const schemaFiles = new Map();

for (const [filename, title, schema] of definitions) {
	const jsonSchema = z.toJSONSchema(schema, { target: 'draft-07', io: 'input' });
	jsonSchema.$id = `https://janga.github.io/norna/schemas/${filename}`;
	jsonSchema.title = title;
	applySchemaEditorMetadata(filename, jsonSchema);
	schemaFiles.set(filename, `${JSON.stringify(jsonSchema, null, 2)}\n`);
}

schemaFiles.set('manifest.json', `${JSON.stringify({
	editorApiVersion: 1,
	schemaVersion: 3,
	files: {
		category: 'category.schema.json',
		config: 'config.schema.json',
		contentFrontmatter: 'content-frontmatter.schema.json',
		sitewideContent: 'sitewide-content.schema.json',
		theme: 'theme.schema.json',
		pageTheme: 'page-theme.schema.json',
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
