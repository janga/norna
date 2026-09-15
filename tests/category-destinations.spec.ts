import { expect, test } from '@playwright/test';

for (const javaScriptEnabled of [true, false]) {
	test.describe(`category destinations with JavaScript ${javaScriptEnabled ? 'enabled' : 'disabled'}`, () => {
		test.use({ javaScriptEnabled, viewport: { width: 1440, height: 1000 } });

		test('opens the first direct page with the deployment base path', async ({ page }) => {
			await page.goto('getting-started/');
			await expect(page).toHaveURL(/\/category-review\/getting-started\/install-norna\/$/);
			await expect(page.locator('h1')).toHaveText('Install Norna');
		});

		test('lists direct children without descending until the reader chooses', async ({ page }) => {
			await page.goto('guides/');
			await expect(page.locator('h1')).toHaveText('Guides');
			const list = page.locator('main .child-page-list');
			await expect(list.locator('strong')).toHaveText(['Installation', 'Workflows']);
			await expect(list).toContainText('Choose how to preview, check, and publish your site.');
			await expect(list.getByRole('link').first()).toHaveAttribute('href', '/category-review/guides/installation/');

			const branch = page.locator('.navigation-page-disclosure-sidebar[data-page-path="guides/installation"]');
			await branch.locator(':scope > summary').click();
			await expect(branch).toHaveAttribute('open', '');
			await expect(page).toHaveURL(/\/category-review\/guides\/$/);
			await branch.locator(':scope > summary').click();
			await expect(branch).not.toHaveAttribute('open');
			await expect(page).toHaveURL(/\/category-review\/guides\/$/);

			await list.getByRole('link').first().click();
			await expect(page).toHaveURL(/\/category-review\/guides\/installation\/requirements\/$/);
			await expect(page.locator('h1')).toHaveText('Requirements');
		});
	});
}
