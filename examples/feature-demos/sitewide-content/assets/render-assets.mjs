// Render the maintained vector artwork without changing its shapes or type.
// Run from the repository root: node examples/feature-demos/sitewide-content/assets/render-assets.mjs
import { copyFile, readFile } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from '@playwright/test';

const publicDirectory = path.resolve(import.meta.dirname, '../site/public');
const documentationSite = path.resolve(import.meta.dirname, '../../../../site');
await copyFile(path.join(publicDirectory, 'logo.svg'), path.join(documentationSite,
	'root/pages/examples/pages/building-a-site/images/shared-frame.svg'));
const browser = await chromium.launch();
try {
	const page = await browser.newPage({ deviceScaleFactor: 1 });
	const render = async (svg, width, height, filename) => {
		await page.setViewportSize({ width, height });
		await page.setContent(`<html><body style="margin:0">${svg}</body></html>`);
		await page.evaluate(() => document.fonts.ready);
		await page.screenshot({ path: path.join(publicDirectory, filename) });
	};
	await render(await readFile(path.join(import.meta.dirname, 'social-image.svg'), 'utf8'), 1200, 630, 'social-image.png');
	await copyFile(path.join(publicDirectory, 'social-image.png'), path.join(documentationSite,
		'root/pages/examples/pages/building-a-site/images/sitewide-social-image.png'));
	const icon = await readFile(path.join(publicDirectory, 'favicon.svg'), 'utf8');
	await render(`<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180" viewBox="0 0 180 180">
<rect width="180" height="180" fill="#f5f2ec"/>
<g transform="translate(26 26) scale(2)">${icon}</g></svg>`, 180, 180, 'apple-touch-icon.png');
} finally {
	await browser.close();
}
