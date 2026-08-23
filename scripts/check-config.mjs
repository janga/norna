import { siteConfigLabel, sitePublicLabel } from './lib/site-paths.mjs';
import { getLogoAssets, getPublicAssetInspection } from './lib/logo-assets.mjs';
import { logoAssetFilenames } from './lib/public-asset-conventions.mjs';
import { readSitewideContent } from './lib/sitewide-content.mjs';
import { readThemeConfig, validateRouteThemeFiles } from './lib/theme-config.mjs';

const formatErrorMessage = (error) => {
	if (error instanceof Error) {
		return error.message;
	}

	return String(error);
};

try {
	const { projectConfig } = await import('./lib/project-config.mjs');
	const themeConfig = await readThemeConfig();
	const sitewideContent = await readSitewideContent();
	await validateRouteThemeFiles();
	const logoAssets = getLogoAssets();
	const publicAssetInspection = getPublicAssetInspection();
	const logoAssetPaths = logoAssetFilenames.map((filename) => `${sitePublicLabel}/${filename}`);
	for (const issue of publicAssetInspection.suspicious) {
		console.warn(`Warning: ${sitePublicLabel}/${issue.filename}: ${issue.message}`);
	}

	if (logoAssets.length > 1) {
		throw new Error([
			`Found multiple logo files in ${sitePublicLabel}. Keep exactly one of ${logoAssetFilenames.join(', ')}.`,
			...logoAssets.map(({ filename }) => `- ${sitePublicLabel}/${filename}`),
		].join('\n'));
	}

	if (logoAssets.length === 0) {
		if (sitewideContent.logo) {
			throw new Error(`Site-wide logo is configured, but no logo file was found. Add exactly one of ${logoAssetPaths.join(', ')}, or remove logo.`);
		}
		console.warn(`Warning: No logo file found in ${sitePublicLabel}. Norna will use page titles for navigation.`);
		console.warn(`Add exactly one of ${logoAssetPaths.join(', ')} when the site should have a logo.`);
	}

	console.log('Config check passed.');
	console.log(`Site URL: ${projectConfig.site.url}`);
	console.log(`Base path: ${projectConfig.site.basePath}`);
	console.log(`Theme preset: ${themeConfig.preset ?? '(none)'}`);
	console.log(`Page width: ${projectConfig.layout.pageWidth}`);
	console.log(`Gutter: desktop ${projectConfig.layout.gutter.desktop}, mobile ${projectConfig.layout.gutter.mobile}`);
	console.log(`Layout density: ${projectConfig.layout.density}`);
	console.log(`Image area width: ${projectConfig.images.width}`);
	console.log(`Image max available width: desktop ${projectConfig.images.maxAvailableWidthPercent.desktop}%, mobile ${projectConfig.images.maxAvailableWidthPercent.mobile}%`);
	console.log(`Image max available height: desktop ${projectConfig.images.maxAvailableHeightPercent.desktop}%, mobile ${projectConfig.images.maxAvailableHeightPercent.mobile}%`);
	console.log(`Font family: ${projectConfig.typography.fontFamily}`);
	console.log(`Language: ${projectConfig.locale.lang}`);
	console.log(`Scroll behavior: ${projectConfig.navigation.scrollBehavior}`);
} catch (error) {
	console.error('Config check failed.');
	console.error(formatErrorMessage(error));
	process.exit(1);
}
