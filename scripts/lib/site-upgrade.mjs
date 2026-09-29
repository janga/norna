import { lstat } from 'node:fs/promises';
import path from 'node:path';
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
	for (const name of ['content.md', 'theme.yaml', 'images', 'pages', 'routes', 'config.yaml', 'page-theme.yaml', 'sitewide-content.yaml']) {
		if (await inspect(path.join(siteRoot, name))) {
			throw new Error(`This site uses former source locations (${name}). Automatic conversion to root/ is not provided. Stop the development server and back up the site. Keep site-config/ and public/ at the site level; move the homepage content.md, its optional theme.yaml, images/ and pages/ into root/. Keep the shared theme in site-config/site-theme.yaml. For older formats, follow the source-layout reference before moving files. Update relative source/schema links, then run norna check and norna build. No files changed.`);
		}
	}
	for (const directory of [source.root, path.join(siteRoot, 'site-config')]) {
		if (!(await inspect(directory))?.isDirectory()) throw new Error(`${directory} must be a regular directory, not a symbolic link.`);
	}
	for (const filename of [source.content, path.join(siteRoot, 'site-config', 'settings.yaml'), path.join(siteRoot, 'site-config', 'site-theme.yaml')]) {
		if (!(await inspect(filename))?.isFile()) throw new Error(`${filename} is required and must be a regular file.`);
	}
	return { siteRoot, moves: [] };
};
