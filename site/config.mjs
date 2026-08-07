export default {
	site: {
		url: 'https://janga.github.io/norna/',
		basePath: '/norna/',
	},
	navigation: {
		smoothScroll: {
			enabled: true,
			minimumDurationMs: 700,
			maximumDurationMs: 1_800,
			durationPerPixelMs: 0.18,
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
	footer: {
		copyrightMessage: 'norna is licensed under GNU GPL v3.',
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
		repo: 'janga/norna',
		branch: 'main',
		pagesWorkflow: 'Deploy to GitHub Pages',
	},
	deploy: {
		watch: {
			intervalMs: 10_000,
			timeoutMs: 15 * 60_000,
			runLimit: 10,
		},
	},
};
