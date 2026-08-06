const siteUrl = 'http://localhost:4321/';

export default {
	site: {
		// Public canonical URL for this site.
		url: siteUrl,

		// URL path prefix. Use "/" for root sites and "/repository-name/" for
		// GitHub Pages project sites without a custom domain.
		basePath: '/',
	},
	layout: {
		// Maximum width of the page content area.
		pageWidth: '2048px',

		// Side margin on desktop and mobile before available gallery width is calculated.
		gutter: {
			desktop: 'clamp(1.25rem, 4vw, 3rem)',
			mobile: '16px',
		},
	},
	gallery: {
		// Hard maximum rendered gallery width for images and aligned text.
		width: '55vw',

		// Maximum share of the available width after gutters.
		maxAvailableWidthPercent: {
			desktop: 100,
			mobile: 100,
		},

		// Maximum share of viewport height used by gallery images.
		maxAvailableHeightPercent: {
			desktop: 74,
			mobile: 68,
		},
	},
	typography: {
		// CSS font-family stack used by the whole site, including sticky navigation.
		fontFamily: "Arial, 'Helvetica Neue', Helvetica, sans-serif",
	},
		navigation: {
			smoothScroll: {
			// Set to false to make section links jump directly to the target anchor.
			enabled: true,

			// Minimum and maximum animation time for controlled anchor navigation.
			minimumDurationMs: 2_000,
			maximumDurationMs: 4_000,

			// Additional duration per pixel of scroll distance, before min/max clamping.
			durationPerPixelMs: 0.22,
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
		// Omit this value to hide the copyright sentence.
		copyrightMessage: 'Dog images from Wikimedia Commons; see image captions for license details.',

		// Set enabled to false to hide the build timestamp while keeping its config.
		buildInfo: {
			enabled: true,

			// Text shown before the formatted build timestamp.
			text: 'Built',

			// Standard Intl.DateTimeFormat options for the build timestamp.
			dateTimeFormat: {
				locale: 'en-GB',
				timeZone: 'UTC',
				dateStyle: 'short',
				timeStyle: 'short',
			},
		},
	},
	github: {
		// Example repository and workflow details used by deploy scripts.
		repo: 'owner/example-gallery',
		branch: 'main',
		pagesWorkflow: 'Deploy to GitHub Pages',
	},
	deploy: {
		watch: {
			// Defaults for npm run deploy:watch.
			intervalMs: 10_000,
			timeoutMs: 15 * 60_000,
			runLimit: 10,
		},
	},
};
