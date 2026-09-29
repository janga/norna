import { expect, test } from '@playwright/test';

test.use({ browserName: 'webkit' });

for (const javaScriptEnabled of [true, false]) {
	test.describe(`content-backed overview pages with JavaScript ${javaScriptEnabled ? 'enabled' : 'disabled'}`, () => {
		test.use({ javaScriptEnabled, viewport: { width: 1440, height: 1000 } });

		test('every parent has its own URL and lists only direct listed children', async ({ page }) => {
			await page.goto('guides/');
			await expect(page).toHaveURL(/\/category-review\/guides\/$/);
			await expect(page.locator('main h1')).toHaveText('Guides');
			const list = page.locator('main .child-page-list');
			await expect(list.locator('strong')).toHaveText(['Installation', 'Workflows']);
			await expect(list).toContainText('Choose how to preview, check, and publish your site.');
			await expect(list.getByRole('link').first()).toHaveAttribute('href', '/category-review/guides/installation/');
			await expect(list.getByRole('link', { name: 'Hidden draft' })).toHaveCount(0);
			await expect(list.getByRole('link', { name: 'Requirements' })).toHaveCount(0);

			await list.getByRole('link').first().click();
			await expect(page).toHaveURL(/\/category-review\/guides\/installation\/$/);
			await expect(page.locator('main h1')).toHaveText('Installation');
			await expect(page.locator('main .child-page-list a').first())
				.toHaveAttribute('href', '/category-review/guides/installation/requirements/');
		});

		test('global navigation and search use the parent page URL', async ({ page }) => {
			await page.goto('getting-started/');
			await expect(page).toHaveURL(/\/category-review\/getting-started\/$/);
			await expect(page.locator('main h1')).toHaveText('Getting Started');
			await expect(page.locator('main .child-page-list a').first())
				.toHaveAttribute('href', '/category-review/getting-started/install-norna/');
			await expect(page.locator('.mobile-site-nav a').filter({ hasText: /^Getting Started$/ }).first())
				.toHaveAttribute('href', '/category-review/getting-started/');
			await page.goto('search/');
			await expect(page.locator('main h1')).toHaveText('Search');
			await expect(page.locator('[data-area-switcher] a').filter({ hasText: /^Getting Started$/ }).first())
				.toHaveAttribute('href', '/category-review/getting-started/');
		});
	});
}
