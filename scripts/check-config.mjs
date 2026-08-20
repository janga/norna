import { siteConfigLabel, sitePublicLabel } from './lib/site-paths.mjs';
import { getLogoAssets } from './lib/logo-assets.mjs';
import { readSitewideConfig } from './lib/sitewide-config.mjs';
import { readThemeConfig, validateRouteThemeFiles } from './lib/theme-config.mjs';

const formatErrorMessage = (error) => {
	if (error instanceof SyntaxError) {
		return [
			`${siteConfigLabel} contains invalid JavaScript syntax.`,
			error.message,
		].join('\n');
	}

	if (error instanceof Error) {
		return error.message;
	}

	return String(error);
};

try {
	const { projectConfig } = await import('./lib/project-config.mjs');
	const themeConfig = await readThemeConfig();
	const sitewideConfig = await readSitewideConfig();
	await validateRouteThemeFiles();
	const logoAssets = getLogoAssets();

	if (logoAssets.length > 1) {
		throw new Error([
			`Found multiple logo files in ${sitePublicLabel}. Keep exactly one of logo.svg, logo.png, logo.jpg, or logo.jpeg.`,
			...logoAssets.map(({ filename }) => `- ${sitePublicLabel}/${filename}`),
		].join('\n'));
	}

	if (logoAssets.length === 0) {
		console.warn(`Warning: No logo file found in ${sitePublicLabel}. Norna will use sitewide navigation.brand or the homepage title as the navigation label.`);
		console.warn(`Add exactly one of ${sitePublicLabel}/logo.svg, logo.png, logo.jpg, or logo.jpeg when the site should have a logo.`);
	} else if (sitewideConfig.navigation?.brand) {
		console.warn('Warning: Both sitewide navigation.brand and a logo file are configured. The logo is used; navigation.brand is only the text fallback.');
	}

	console.log('Config check passed.');
	console.log(`Site URL: ${projectConfig.site.url}`);
	console.log(`Base path: ${projectConfig.site.basePath}`);
	console.log(`Theme preset: ${themeConfig.preset ?? '(none)'}`);
	console.log(`Page width: ${projectConfig.layout.pageWidth}`);
	console.log(`Gutter: desktop ${projectConfig.layout.gutter.desktop}, mobile ${projectConfig.layout.gutter.mobile}`);
	console.log(`Layout density: ${projectConfig.layout.density}`);
	console.log(`Image area width: ${projectConfig.gallery.width}`);
	console.log(`Image max available width: desktop ${projectConfig.gallery.maxAvailableWidthPercent.desktop}%, mobile ${projectConfig.gallery.maxAvailableWidthPercent.mobile}%`);
	console.log(`Image max available height: desktop ${projectConfig.gallery.maxAvailableHeightPercent.desktop}%, mobile ${projectConfig.gallery.maxAvailableHeightPercent.mobile}%`);
	console.log(`Font family: ${projectConfig.typography.fontFamily}`);
	console.log(`Language: ${projectConfig.locale.lang}`);
	console.log(`GitHub repo: ${projectConfig.github.repo}`);
	console.log(`Deploy branch: ${projectConfig.github.branch}`);
	console.log(`Pages workflow: ${projectConfig.github.pagesWorkflow}`);
} catch (error) {
	console.error('Config check failed.');
	console.error(formatErrorMessage(error));
	process.exit(1);
}
