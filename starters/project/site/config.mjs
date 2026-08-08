export default {
	site: {
		url: 'https://example.com/',
		basePath: '/',
	},
	navigation: {
		smoothScroll: {
			enabled: true,
			minimumDurationMs: 500,
			maximumDurationMs: 1_100,
			durationPerPixelMs: 0.18,
		},
	},
	locale: {
		lang: 'en',
		labels: {
			skipToContent: 'Skip to content',
			siteNavigation: 'Pages',
			pageNavigation: 'On this page',
			sectionNavigation: 'Sections',
			menu: 'Menu',
			gallery: 'Images',
		},
	},
	footer: {
		copyrightMessage: '(c) Project contributors.',
		buildInfo: {
			enabled: true,
			text: 'Built',
			dateTimeFormat: {
				locale: 'en-GB',
				timeZone: 'UTC',
				dateStyle: 'short',
				timeStyle: 'short',
			},
		},
	},
	github: {
		repo: 'owner/project-name',
		branch: 'main',
		pagesWorkflow: 'Deploy to GitHub Pages',
	},
};
