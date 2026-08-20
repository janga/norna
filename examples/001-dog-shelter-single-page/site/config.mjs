export default {
	site: {
		url: 'http://localhost:4321/',
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
		repo: 'owner/dog-shelter',
		branch: 'main',
		pagesWorkflow: 'Deploy to GitHub Pages',
	},
};
