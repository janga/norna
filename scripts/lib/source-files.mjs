import path from 'node:path';
import { pageDirectoryPattern, parsePageDirectoryPath } from './page-model.mjs';
import { getSiteSourcePaths } from './site-conventions.mjs';
import { configSchema, rootThemeSchema, pageThemeSchema, siteSchema, sitewideSchema, themeVisualSchema } from './schema-definitions.mjs';

// Also published in schemas/manifest.json for synchronous editor discovery.
export const sourceFileDefinitions = [
	{ name: 'settings.yaml', location: 'site-config', schemaKind: 'config', required: true, input: 'url', description: 'Required public URL and technical site settings.' },
	{ name: 'shared-content.yaml', location: 'site-config', schemaKind: 'sitewideContent', text: 'banners: []\n', description: 'Shared notices and footer content for the complete site.', removalEffect: 'Shared notices, authored footer content and logo display settings in this file will be removed from the whole site.' },
	{ name: 'content.md', location: 'page', schemaKind: 'contentFrontmatter', required: true, input: 'title', description: 'Required page content.' },
	{ name: 'tree-theme.yaml', location: 'page', schemaKind: 'theme', rootSchemaKind: 'rootTheme', required: 'root', rootText: 'preset: documentation\n', text: '# Modify inherited settings. Add preset only to replace the complete base.\n{}\n', description: 'Visual settings for this page and its descendants. Without preset, modifies inherited values; preset selects a new base. Required on the root page.', removalEffect: 'This branch resumes the ancestor tree theme. Overrides on descendants remain; a descendant preset starts an independent base.' },
	{ name: 'page-theme.yaml', location: 'page', schemaKind: 'pageTheme', text: '# Modify this page only. Add preset only to replace the complete base.\n{}\n', description: 'Visual settings for this page only. Without preset, modifies its tree theme; preset selects a new base. Descendants keep their tree theme.', removalEffect: 'This page will use its selected tree theme again. Other pages are unchanged.' },
];
export const sourcePageDirectoryPattern = pageDirectoryPattern.source.replace('^', '^(?!000-)');
const schemas = { config: configSchema, contentFrontmatter: siteSchema, sitewideContent: sitewideSchema, theme: themeVisualSchema, rootTheme: rootThemeSchema, pageTheme: pageThemeSchema };

export const getSourcePageLocation = (siteRoot, directory) => {
	const relative = path.relative(getSiteSourcePaths(siteRoot).root, directory);
	if (!relative) return { isHome: true, ...parsePageDirectoryPath('.') };
	if (!relative.startsWith(`pages${path.sep}`)) return null;
	try { return { ...parsePageDirectoryPath(relative.slice(6).split(path.sep).join('/')), isHome: false }; }
	catch { return null; }
};

export const getSourceFileDefinition = (siteRoot, filename) => {
	const relative = path.relative(siteRoot, filename).split(path.sep).join('/');
	const location = getSourcePageLocation(siteRoot, path.dirname(filename));
	const definition = sourceFileDefinitions.find((entry) => entry.location === 'page'
		? location && path.basename(filename) === entry.name : relative === `${entry.location}/${entry.name}`);
	if (!definition) return null;
	const schemaKind = location?.isHome && definition.rootSchemaKind ? definition.rootSchemaKind : definition.schemaKind;
	return { ...definition, schemaKind, text: location?.isHome && definition.rootText ? definition.rootText : definition.text, schema: schemaKind === 'contentFrontmatter' ? undefined : schemas[schemaKind],
		required: definition.required === true || definition.required === 'root' && location?.isHome === true };
};
