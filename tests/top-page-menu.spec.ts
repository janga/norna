import { expect, test } from '@playwright/test';

for (const javaScriptEnabled of [true, false]) {
	test.describe(`top page sections with JavaScript ${javaScriptEnabled}`, () => {
		test.use({ javaScriptEnabled, viewport: { width: 1280, height: 900 } });
		test('opens another page at its section without an intermediate page visit', async ({ page }) => {
			await page.goto('/media/');
			await expect(page.locator('.site-nav-item:has(> a[href="/"]) summary')).toHaveCount(0);
			const item = page.locator('.site-nav-item').filter({ has: page.locator('a[href="/surfaces/"]') });
			await expect(item.locator(':scope > a')).toHaveAttribute('href', '/surfaces/');
			const summary = item.locator('summary');
			await summary.focus();
			await page.keyboard.press('Enter');
			await expect(item.getByRole('link', { name: 'Overview', exact: true })).toBeVisible();
			await item.getByRole('link', { name: 'Overview', exact: true }).click();
			await expect(page).toHaveURL(/\/surfaces\/#overview$/);
			await expect(page.locator('#overview')).toBeVisible();
		});
		test('offers the same cross-page destination in the compact menu', async ({ page }) => {
			await page.setViewportSize({ width: 390, height: 844 });
			await page.goto('/media/');
			await page.locator('.mobile-nav-menu > summary').click();
			const item = page.locator('.mobile-nav-menu [data-navigation-title="Surfaces"]');
			await item.locator('summary').click();
			await item.getByRole('link', { name: 'Overview', exact: true }).click();
			await expect(page).toHaveURL(/\/surfaces\/#overview$/);
		});
	});
}

test('dismisses a disclosure with Escape, outside click, and keyboard departure', async ({ page }) => {
	await page.goto('/media/');
	const menu = page.locator('.top-page-menu').first();
	const summary = menu.locator('summary');
	await summary.click();
	await page.keyboard.press('Escape');
	await expect(menu).not.toHaveAttribute('open');
	await expect(summary).toBeFocused();
	await summary.click();
	await page.locator('#page-title').click();
	await expect(menu).not.toHaveAttribute('open');
	await summary.click();
	await page.locator('.site-nav-item > a').last().focus();
	await expect(menu).not.toHaveAttribute('open');
});
