import {
	astroCacheDir,
	astroDistDir,
	astroPublicDir,
	engineRoot,
	generatedImagesManifestPath,
	invocationRoot,
	siteConfigPath,
	siteContentPath,
	siteDir,
	siteDirectory,
	siteImagesDir,
	siteProjectRoot,
	sitePublicDir,
	sitePagesDir,
	siteThemePath,
} from './lib/site-paths.mjs';

const lines = [
	'norna doctor',
	`Invocation root: ${invocationRoot}`,
	`Site project root: ${siteProjectRoot}`,
	`Site directory: ${siteDirectory}`,
	`Site directory path: ${siteDir}`,
	`Site config: ${siteConfigPath}`,
	`Site theme: ${siteThemePath}`,
	`Site content: ${siteContentPath}`,
	`Site images: ${siteImagesDir}`,
	`Site pages: ${sitePagesDir}`,
	`Site public source: ${sitePublicDir}`,
	`Generated image manifest: ${generatedImagesManifestPath}`,
	`Astro public output: ${astroPublicDir}`,
	`Astro dist output: ${astroDistDir}`,
	`Astro cache: ${astroCacheDir}`,
	`Engine root: ${engineRoot}`,
];

console.log(lines.join('\n'));
