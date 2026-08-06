export default {
	site: {
		url: 'https://example.com/',
		basePath: '/',
	},
	layout: {
		pageWidth: '1180px',
		gutter: {
			desktop: 'clamp(1.25rem, 4vw, 3rem)',
			mobile: '1rem',
		},
	},
	gallery: {
		maxAvailableWidthPercent: {
			desktop: 100,
			mobile: 100,
		},
		maxAvailableHeightPercent: {
			desktop: 74,
			mobile: 68,
		},
	},
	typography: {
		fontFamily: "Arial, 'Helvetica Neue', Helvetica, sans-serif",
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
			gallery: 'Gallery',
		},
	},
	footer: {
		copyrightMessage: '(c) Fixture Artist.',
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
		repo: 'owner/fixture-gallery',
		branch: 'main',
		pagesWorkflow: 'Deploy to GitHub Pages',
	},
};
