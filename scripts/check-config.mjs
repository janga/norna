import { siteConfigLabel } from './lib/site-paths.mjs';

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

	console.log('Config check passed.');
	console.log(`Site URL: ${projectConfig.site.url}`);
	console.log(`Base path: ${projectConfig.site.basePath}`);
	console.log(`Page width: ${projectConfig.layout.pageWidth}`);
	console.log(`Gutter: desktop ${projectConfig.layout.gutter.desktop}, mobile ${projectConfig.layout.gutter.mobile}`);
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
