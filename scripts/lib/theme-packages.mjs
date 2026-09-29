import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { getPageDirectoryAncestors, parsePageDirectoryPath } from './page-model.mjs';
import { getPageSourceDirectory } from './site-conventions.mjs';
import { getSourceFileDefinition } from './source-files.mjs';
import { mergeThemeOverrides } from './theme-presets.mjs';
import { resolveThemePresentation } from './presentation.mjs';
import { validateThemeYamlStructure } from './site-content.mjs';
import { parseYamlConfig } from './yaml-config.mjs';

export const readThemePackage = async ({ siteRoot, filename, sources = new Map() }) => {
	const definition = getSourceFileDefinition(siteRoot, filename);
	if (!definition || !['rootTheme', 'theme', 'pageTheme'].includes(definition.schemaKind)) throw new Error(`Not a permitted theme location: ${filename}.`);
	const source = sources.has(filename) ? sources.get(filename) : await readFile(filename, 'utf8').catch((error) => {
		if (error.code !== 'ENOENT') throw error;
		if (definition.required) throw new Error(`${filename} is required. Create the root tree theme before running Norna.`);
		return null;
	});
	if (source === null) return null;
	return { path: filename, label: filename, config: parseYamlConfig(source, filename, { schema: definition.schema, validateStructure: validateThemeYamlStructure }) };
};

// Resolve authored overrides only; preset expansion stays in the shared visual
// resolvers. A page-only file is never considered while walking ancestors.
export const selectPageTheme = async ({ siteRoot, pageDirectory = '.', sources, includePageTheme = true }) => {
	siteRoot = path.resolve(siteRoot);
	parsePageDirectoryPath(pageDirectory);
	const ancestors = pageDirectory === '.' ? ['.'] : ['.', ...getPageDirectoryAncestors(pageDirectory)];
	let treeTheme;
	const sourceFiles = [];
	for (const ancestor of ancestors) {
		const filename = path.join(siteRoot, getPageSourceDirectory(ancestor), 'tree-theme.yaml');
		const candidate = await readThemePackage({ siteRoot, filename, sources });
		if (candidate) {
			treeTheme = { ...candidate, config: mergeThemeOverrides(treeTheme?.config, candidate.config) };
			sourceFiles.push(candidate);
		}
	}
	const pageTheme = includePageTheme
		? await readThemePackage({ siteRoot, filename: path.join(siteRoot, getPageSourceDirectory(pageDirectory), 'page-theme.yaml'), sources })
		: null;
	const selected = pageTheme ? { ...pageTheme, config: mergeThemeOverrides(treeTheme.config, pageTheme.config) } : treeTheme;
	if (pageTheme) sourceFiles.push(pageTheme);
	resolveThemePresentation(treeTheme.config, treeTheme.label);
	resolveThemePresentation(selected.config, selected.label);
	return { treeTheme, pageTheme, selected, sourceFiles };
};
