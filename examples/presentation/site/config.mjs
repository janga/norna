const siteUrl = 'http://localhost:4321/';

export default {
	site: {
		url: siteUrl,
		basePath: '/',
	},
	navigation: {
		smoothScroll: {
			enabled: true,
			minimumDurationMs: 2_000,
			maximumDurationMs: 4_000,
			durationPerPixelMs: 0.22,
		},
	},
	locale: {
		lang: 'en',
		labels: {
			skipToContent: 'Skip to content',
			sectionNavigation: 'Sections',
			gallery: 'Images',
		},
	},
	github: {
		repo: 'owner/norna-visual-model-example',
		branch: 'main',
		pagesWorkflow: 'Deploy to GitHub Pages',
	},
};
