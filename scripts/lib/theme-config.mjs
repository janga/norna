import { readdir } from 'node:fs/promises';
import path from 'node:path';
import { getSiteSourcePaths } from './site-conventions.mjs';
import { siteDir, siteThemePath } from './site-paths.mjs';
import { readThemePackage } from './theme-packages.mjs';
import { getSourcePageLocation } from './source-files.mjs';
import { resolveThemePresentation } from './presentation.mjs';

export const readThemeConfig = async () => {
	const theme = await readThemePackage({ siteRoot: siteDir, filename: siteThemePath });
	resolveThemePresentation(theme.config, theme.label);
	return theme.config;
};

export const validatePageThemeFiles = async () => {
	const themes = [];
	const visit = async (directory) => {
		const entries = await readdir(directory, { withFileTypes: true }).catch((error) => {
			if (error.code === 'ENOENT') return [];
			throw error;
		});
		for (const entry of entries) {
			const filename = path.join(directory, entry.name);
			if (entry.isDirectory()) { await visit(filename); continue; }
			if (!['tree-theme.yaml', 'page-theme.yaml', 'theme.yaml'].includes(entry.name)) continue;
			const location = getSourcePageLocation(siteDir, directory);
			if (!location) continue;
			if (entry.name === 'theme.yaml') throw new Error(`${filename} uses the former theme filename. Use page-theme.yaml for one page only or tree-theme.yaml for inherited branch settings.`);
			if (filename === siteThemePath) continue;
			themes.push({ ...await readThemePackage({ siteRoot: siteDir, filename }), pageDirectory: location.pageDirectory });
		}
	};
	await visit(getSiteSourcePaths(siteDir).root);
	return themes;
};
