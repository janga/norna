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
			siteBanners: 'Site notices',
			dismissBanner: 'Dismiss notice',
		},
	},
	github: {
		repo: 'owner/norna-sitewide-content-example',
		branch: 'main',
		pagesWorkflow: 'Deploy to GitHub Pages',
	},
};
