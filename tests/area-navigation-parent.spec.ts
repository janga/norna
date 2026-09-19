import { expect, test } from '@playwright/test';

// Run against fixtures/nested-pages/site with default navigation.
test.use({ browserName: 'webkit', viewport: { width: 1440, height: 1000 } });

test('keeps a parent outline before its children and scopes direct deeper arrivals identically', async ({ page }) => {
	for (const path of ['guides/installation/', 'guides/installation/macos/']) {
		await page.goto(path);
		await expect(page.locator('html')).toHaveAttribute('data-area-navigation', '');
		const tree = page.locator('.tree-local-navigation');
		await expect(tree).toHaveAttribute('data-navigation-area', 'guides');
		const links = tree.locator('#navigation-sidebar-guides-installation-children');
		const destinations = await links.locator('a').evaluateAll(elements => elements.map(e => e.getAttribute('href')));
		expect(destinations.slice(0, 3)).toEqual([
			`${path.endsWith('/macos/') ? '/guides/installation/' : ''}#installation-details`,
			`${path.endsWith('/macos/') ? '/guides/installation/' : ''}#examples`,
			'/guides/installation/macos/',
		]);
		await expect(tree.locator('.page-contents-links ol')).toHaveCount(0);
		await expect(tree.locator('a[href*="unlisted"], a[href*="private"]')).toHaveCount(0);
	}
});

test('preserves a parent destination, a single H2 and existing H3 deep links', async ({ page }) => {
	await page.goto('reference/');
	await expect(page.locator('.tree-local-navigation')).toHaveAttribute('data-navigation-area', 'reference');
	await expect(page.locator('.tree-local-navigation a[href="#reference-overview"]')).toBeVisible();
	await page.locator('[data-area-switcher] > summary').click();
	await expect(page.locator('[data-area-switcher] [data-area-choice]').first()).toHaveAttribute('href', '/reference/');
	await page.locator('[data-area-switcher] a[href="/reference/installation/"]').click();
	await expect(page.locator('.tree-local-navigation')).toHaveAttribute('data-navigation-area', 'reference');
	await expect(page.locator('.tree-local-navigation a[href="/reference/"]')).toBeVisible();
	await expect(page.locator('.tree-local-navigation a[href="/reference/reading-position/"]')).toBeVisible();
	await page.locator('[data-area-switcher] > summary').click();
	await page.locator('[data-area-choice="reference"]').click();
	await expect(page.locator('h1')).toHaveText('Reference');
	await page.setViewportSize({ width: 1440, height: 520 });
	await page.goto('guides/installation/macos/#prerequisites');
	await page.waitForFunction(() => document.documentElement.hasAttribute('data-navigation-motion-ready'));
	await expect(page.locator('.tree-local-navigation a[href$="#prerequisites"]')).toHaveCount(0);
	await expect.poll(() => page.evaluate(() => Math.abs(document.getElementById('prerequisites')!.getBoundingClientRect().top
		- Math.ceil(document.querySelector('.site-top')!.getBoundingClientRect().height)))).toBeLessThanOrEqual(1);
	await page.locator('.tree-local-navigation a[href="/guides/installation/"]').click();
	await expect(page.locator('h1')).toHaveText('Installation');
});

test('uses a direct sticky destination and full tree for a collection larger than twelve choices', async ({ page }) => {
	await page.goto('./');
	await expect(page.locator('[data-area-menu="guides"]')).toHaveCount(0);
	await page.locator('.site-nav').getByRole('link', { name: 'Guides', exact: true }).click();
	await expect(page.locator('.tree-local-navigation')).toHaveAttribute('data-navigation-area', 'guides');
	const tree = page.locator('.tree-local-navigation');
	expect(await tree.locator(':scope > nav > ul > li').count()).toBeGreaterThan(12);
	await tree.locator('a[href="/guides/configuration/"]').click();
	await expect(page.locator('h1')).toHaveText('Configuration');
	await expect(tree).toHaveAttribute('data-navigation-area', 'guides');
	await page.reload();
	await expect(tree).toHaveAttribute('data-navigation-area', 'guides');
});
