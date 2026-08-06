const siteUrl = 'http://localhost:4321/';

export default {
	site: {
		url: siteUrl,
	},
	layout: {
		pageWidth: '1180px',
		gutter: {
			desktop: 'clamp(1.25rem, 4vw, 3rem)',
			mobile: '1rem',
		},
	},
	gallery: {
		width: '900px',
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
			gallery: 'Gallery',
		},
	},
	footer: {
		copyrightMessage: 'norna documentation site.',
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
