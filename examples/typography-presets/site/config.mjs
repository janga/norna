const siteUrl = 'http://localhost:4321/';

export default {
	site: {
		url: siteUrl,
		basePath: '/',
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
		repo: 'owner/typography-presets-example',
		branch: 'main',
		pagesWorkflow: 'Deploy to GitHub Pages',
	},
};
