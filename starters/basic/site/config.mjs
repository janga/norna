export default {
	site: {
		url: 'https://example.com/',
		basePath: '/',
	},
	navigation: {
		smoothScroll: {
			enabled: true,
			minimumDurationMs: 600,
			maximumDurationMs: 1_200,
			durationPerPixelMs: 0.2,
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
		repo: 'owner/example-site',
		branch: 'main',
		pagesWorkflow: 'Deploy to GitHub Pages',
	},
};
