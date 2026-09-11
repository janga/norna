import { expect, test } from '@playwright/test';

for (const javaScriptEnabled of [true, false]) {
	test.describe(`documentation illustration with JavaScript ${javaScriptEnabled}`, () => {
		test.use({ javaScriptEnabled, viewport: { width: 1440, height: 850 } });

		test('keeps the same page and heading destinations through responsive fallbacks', async ({ page }) => {
			await page.goto('/guides/installation/linux/');
			const tree = page.locator('.tree-local-navigation');
			const rail = page.locator('.page-contents-navigation-rail');
			const headings = ['Requirements', 'Check Node.js', 'Local preview'];
			await expect(page.locator('#page-title')).toHaveText('Linux');
			await expect(page.locator('.site-page-layout')).toHaveAttribute('data-page-contents-placement', 'contents-rail');
			await expect(tree).toBeVisible();
			await expect(rail).toBeVisible();
			await expect(rail.getByRole('link')).toHaveText(headings);
			for (const title of ['macOS', 'Windows', 'Linux']) {
				await expect(tree.getByRole('link', { name: title, exact: true })).toBeVisible();
			}
			const localSections = tree.locator('.navigation-page-node-current .navigation-page-sections');
			await expect(localSections).toBeHidden();

			await page.setViewportSize({ width: 1120, height: 850 });
			await expect(rail).toBeHidden();
			await expect(tree).toBeVisible();
			await expect(localSections).toBeVisible();
			await expect(localSections.getByRole('link')).toHaveText(headings);

			await page.setViewportSize({ width: 390, height: 844 });
			await expect(tree).toBeHidden();
			const menu = page.locator('.mobile-nav-menu');
			await menu.locator(':scope > summary').click();
			const mobileSections = menu.locator('.navigation-page-node-current .navigation-page-sections');
			await expect(mobileSections).toBeVisible();
			await expect(mobileSections.getByRole('link')).toHaveText(headings);
			await mobileSections.getByRole('link', { name: 'Local preview', exact: true }).click();
			await expect(page).toHaveURL(/\/guides\/installation\/linux\/#local-preview$/);
			await expect(page.locator('#local-preview')).toBeVisible();
		});
	});
}
