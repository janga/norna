import assert from 'node:assert/strict';
import { createSitemapXml, getSitemapUrls } from './lib/sitemap.mjs';

const home = { isHome: true, pagePath: '' };
const hidden = { isHome: false, navigation: { listed: false }, pagePath: 'hidden' };
const installation = { isHome: false, pagePath: 'guides/installation' };
const zeta = { isHome: false, pagePath: 'zeta' };
const category = { isHome: false, kind: 'category', pagePath: 'guides' };

const siteStructure = {
	categories: [category],
	contentFiles: [zeta, hidden, home, installation],
};

assert.deepEqual(getSitemapUrls({ siteStructure, siteUrl: 'https://example.com/' }), [
	'https://example.com/',
	'https://example.com/guides/installation/',
	'https://example.com/hidden/',
	'https://example.com/zeta/',
]);

assert.deepEqual(getSitemapUrls({ siteStructure, siteUrl: 'https://example.com/project/' }), [
	'https://example.com/project/',
	'https://example.com/project/guides/installation/',
	'https://example.com/project/hidden/',
	'https://example.com/project/zeta/',
]);

const xml = createSitemapXml({ siteStructure, siteUrl: 'https://example.com/docs-&-guides/' });
assert.equal(xml, `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://example.com/docs-&amp;-guides/</loc>
  </url>
  <url>
    <loc>https://example.com/docs-&amp;-guides/guides/installation/</loc>
  </url>
  <url>
    <loc>https://example.com/docs-&amp;-guides/hidden/</loc>
  </url>
  <url>
    <loc>https://example.com/docs-&amp;-guides/zeta/</loc>
  </url>
</urlset>
`);
assert.doesNotMatch(xml, /lastmod/);

const reorderedStructure = {
	...siteStructure,
	contentFiles: [...siteStructure.contentFiles].reverse(),
};
assert.equal(
	createSitemapXml({ siteStructure: reorderedStructure, siteUrl: 'https://example.com/docs-&-guides/' }),
	xml,
);

console.log('Sitemap tests passed.');
