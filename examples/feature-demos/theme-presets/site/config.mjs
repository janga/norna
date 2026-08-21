const siteUrl = process.env.NORNA_EXAMPLE_SITE_URL ?? 'http://localhost:4321/';
const basePath = process.env.NORNA_EXAMPLE_BASE_PATH ?? '/';

export default {
	site: {
		url: siteUrl,
		basePath,
	},
	navigation: {
		smoothScroll: {
			enabled: true,
			minimumDurationMs: 600,
			maximumDurationMs: 1_400,
			durationPerPixelMs: 0.12,
		},
	},
	locale: {
		lang: 'en',
		labels: {
			skipToContent: 'Skip to content',
			sectionNavigation: 'Presets',
			gallery: 'Images',
		},
	},
	github: {
		repo: 'owner/theme-presets-example',
		branch: 'main',
		pagesWorkflow: 'Deploy to GitHub Pages',
	},
};
