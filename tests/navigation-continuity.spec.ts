import { expect, test, type Page } from '@playwright/test';

// Default documentation navigation; installed Safari is assessed separately.
test.use({ browserName: 'webkit', viewport: { width: 1200, height: 1000 } });
const ready = (page: Page) => page.waitForFunction(() => document.documentElement.hasAttribute('data-navigation-motion-ready'));
const menu = (page: Page) => page.locator('.tree-local-navigation');

test('prefetches only an eligible page after intent', async ({ page, baseURL }) => {
	const prefetched: string[] = [];
	page.on('request', (request) => {
		const url = new URL(request.url());
		if (!request.isNavigationRequest() && url.origin === new URL(baseURL!).origin && url.pathname.endsWith('/')) {
			prefetched.push(url.pathname);
		}
	});
	await page.goto('reference/site/pages/');
	await ready(page);
	await page.waitForTimeout(180);
	expect(prefetched).toEqual([]);
	await menu(page).locator('a[href$="/reference/site/urls/"]').hover();
	await expect.poll(() => prefetched).toEqual([new URL('reference/site/urls/', baseURL).pathname]);
});


test('preserves a reader interruption while initial arrival waits for fonts', async ({ page }) => {
	await page.addInitScript(() => {
		const fonts = document.fonts.ready;
		const gate = new Promise<void>((resolve) => {
			(window as Window & { releaseNavigationFonts?: () => void }).releaseNavigationFonts = resolve;
		});
		Object.defineProperty(document.fonts, 'ready', { get: () => Promise.all([fonts, gate]) });
	});
	await page.goto('reference/site/pages/#names-and-order');
	await page.mouse.click(650, 450);
	await page.evaluate(() => scrollBy({ top: 180, behavior: 'instant' }));
	const position = await page.evaluate(() => scrollY);
	await page.evaluate(() => (window as Window & { releaseNavigationFonts?: () => void }).releaseNavigationFonts!());
	await ready(page);
	expect(Math.abs(await page.evaluate(() => scrollY) - position)).toBeLessThanOrEqual(1);
	expect(await page.evaluate(() => history.scrollRestoration)).toBe('auto');
});

test('restores the reading position when returning from search', async ({ page }) => {
	await page.setViewportSize({ width: 1440, height: 1000 });
	await page.goto('reference/site/pages/#names-and-order');
	await ready(page);
	await page.evaluate(() => scrollBy({ top: 220, behavior: 'instant' }));
	const position = await page.evaluate(() => scrollY);
	const search = await page.locator('.site-search-link').boundingBox();
	expect(search).not.toBeNull();
	await page.mouse.click(search!.x + search!.width / 2, search!.y + search!.height / 2);
	const returnLink = page.locator('[data-search-return]');
	await expect(returnLink).toContainText('Pages and categories');
	await returnLink.click();
	await ready(page);
	await expect.poll(async () => Math.abs(await page.evaluate(() => scrollY) - position)).toBeLessThanOrEqual(1);
	expect(await page.evaluate(() => history.scrollRestoration)).toBe('auto');
});
