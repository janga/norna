import { sitemapFilename } from './sitemap.mjs';

// Shared by the build and editor preflight.
export const getReservedPublicEntries = (searchEnabled) => [
	{ filename: sitemapFilename, explanation: `Norna generates ${sitemapFilename} from the public page tree and the URL in site/site-config/settings.yaml.` },
	{ filename: '404.html', explanation: "Norna generates 404.html as the site's localized missing-page response." },
	...(searchEnabled ? [{ filename: 'pagefind', explanation: 'Norna generates pagefind/ from the rendered editorial content when search is enabled.' }] : []),
];
