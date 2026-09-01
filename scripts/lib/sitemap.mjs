import { getAbsolutePageUrl, getSiteNodePathname } from './site-page-urls.mjs';

export const sitemapFilename = 'sitemap.xml';

const escapeXml = (value) => String(value)
	.replaceAll('&', '&amp;')
	.replaceAll('<', '&lt;')
	.replaceAll('>', '&gt;')
	.replaceAll('"', '&quot;')
	.replaceAll("'", '&apos;');

const compareStrings = (left, right) => left < right ? -1 : left > right ? 1 : 0;

export const getSitemapUrls = ({ siteStructure, siteUrl }) => (
	siteStructure.contentFiles
		.map((page) => getSiteNodePathname(page))
		.sort(compareStrings)
		.map((pathname) => getAbsolutePageUrl(siteUrl, pathname))
);

export const createSitemapXml = (options) => {
	const urls = getSitemapUrls(options);
	const lines = [
		'<?xml version="1.0" encoding="UTF-8"?>',
		'<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
	];

	for (const url of urls) {
		lines.push('  <url>', `    <loc>${escapeXml(url)}</loc>`, '  </url>');
	}

	lines.push('</urlset>');
	return `${lines.join('\n')}\n`;
};
