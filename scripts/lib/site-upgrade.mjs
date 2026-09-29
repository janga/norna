import { lstat } from 'node:fs/promises';
import path from 'node:path';
import { readThemePackage } from './theme-packages.mjs';
import { getSiteSourcePaths } from './site-conventions.mjs';

const inspect = (filename) => lstat(filename).catch((error) => {
	if (error.code === 'ENOENT') return null;
	throw error;
});

// Keep the existing command without claiming the former layout is current.
// Our maintained sites are converted directly; no general converter is needed.
export const planSiteUpgrade = async (siteRoot) => {
	siteRoot = path.resolve(siteRoot);
	const source = getSiteSourcePaths(siteRoot);
	if (!(await inspect(siteRoot))?.isDirectory()) throw new Error(`${siteRoot} must be a regular directory, not a symbolic link.`);
	for (const name of ['content.md', 'theme.yaml', 'images', 'pages', 'routes', 'config.yaml', 'page-theme.yaml', 'sitewide-content.yaml', 'site-config/site-theme.yaml', 'root/theme.yaml']) {
		if (await inspect(path.join(siteRoot, name))) {
			throw new Error(`This site uses former source locations (${name}). Automatic conversion to root/ is not provided. Stop the development server and back up the site. Keep site-config/ and public/ at the site level; put the homepage content.md, images/ and pages/ in root/. Put the required tree-theme.yaml with an explicit preset in root/; optional page-theme.yaml affects one page only. Rename descendant theme.yaml to tree-theme.yaml to preserve inherited overrides. For older formats, follow the source-layout reference before moving files. Update relative source/schema links, then run norna check and norna build. No files changed.`);
		}
	}
	for (const directory of [source.root, path.join(siteRoot, 'site-config')]) {
		if (!(await inspect(directory))?.isDirectory()) throw new Error(`${directory} must be a regular directory, not a symbolic link.`);
	}
	for (const filename of [source.content, path.join(siteRoot, 'site-config', 'settings.yaml'), source.theme]) {
		if (!(await inspect(filename))?.isFile()) throw new Error(`${filename} is required and must be a regular file.`);
	}
	await readThemePackage({ siteRoot, filename: source.theme });
	return { siteRoot, moves: [] };
};
