import { test, expect } from '@playwright/test';

test('tabs select independently with keyboard and restore the default on reload', async ({ page }) => {
	await page.goto('/');
	const groups = page.locator('[data-content-tabs]');
	await expect(groups).toHaveCount(2);
	const tabs = groups.first().getByRole('tab');
	await expect(tabs.first()).toHaveAttribute('aria-selected', 'true');
	await tabs.first().focus();
	await page.keyboard.press('ArrowRight');
	await expect(tabs.nth(1)).toBeFocused();
	await expect(groups.first().getByRole('tabpanel')).toContainText('winget install');
	await expect(groups.nth(1).getByRole('tab').first()).toHaveAttribute('aria-selected', 'true');
	await page.keyboard.press('End');
	await expect(groups.first().getByRole('tabpanel')).toContainText('Not applicable');
	await page.keyboard.press('Home');
	await expect(tabs.first()).toBeFocused();
	await page.keyboard.press('Tab');
	await expect(groups.first().getByRole('tabpanel')).toBeFocused();
	await tabs.nth(1).click();
	await page.reload();
	await expect(groups.first().getByRole('tab').first()).toHaveAttribute('aria-selected', 'true');
	await expect(page.locator('body')).not.toContainText(':::: tabs');
	await expect(page.locator('#main-content h2')).toHaveText(['Install', 'Verify']);
});

test('all alternatives stay available without JavaScript and in print', async ({ browser, page }) => {
	const context = await browser.newContext({ javaScriptEnabled: false, baseURL: test.info().project.use.baseURL });
	const plain = await context.newPage();
	await plain.goto('/');
	await expect(plain.locator('[data-tab-panel]:visible')).toHaveCount(5);
	await expect(plain.locator('[data-tabs-controls]:visible')).toHaveCount(0);
	await expect(plain.locator('.norna-callout-note')).toContainText('Use the package manager');
	await context.close();
	await page.goto('/');
	await expect(page.getByRole('tab')).toHaveCount(5);
	await page.emulateMedia({ media: 'print' });
	await expect(page.locator('[data-tab-panel]:visible')).toHaveCount(5);
	await expect(page.locator('[data-tab-label]:visible')).toHaveCount(5);
});

test('narrow tabs remain readable and keep copy and table enhancement', async ({ page }) => {
	await page.setViewportSize({ width: 390, height: 844 });
	await page.goto('/');
	const group = page.locator('[data-content-tabs]').first();
	await group.getByRole('tab', { name: 'Windows' }).click();
	await expect(group.getByRole('tabpanel')).toContainText('Version is displayed');
	await expect(group.getByRole('tabpanel').getByRole('button', { name: 'Copy code', exact: true })).toBeVisible();
	await expect(group.getByRole('tabpanel').locator('.image-stack img')).toBeVisible();
	expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
	await page.screenshot({ path: test.info().outputPath('tabs-mobile.png') });
	await page.setViewportSize({ width: 1440, height: 1000 });
	await group.getByRole('tab', { name: 'macOS' }).click();
	const layout = await group.evaluate((element) => {
		const controls = element.querySelector('[data-tabs-controls]')!.getBoundingClientRect();
		const prose = element.querySelector('[data-tab-panel]:not([hidden]) .section-markdown')!.getBoundingClientRect();
		const previous = element.closest('section')!.querySelector('.section-markdown p')!.getBoundingClientRect();
		return { controlsLeft: controls.left, proseLeft: prose.left, gap: controls.top - previous.bottom, html: element.previousElementSibling!.outerHTML };
	});
	expect(Math.abs(layout.controlsLeft - layout.proseLeft), JSON.stringify(layout)).toBeLessThan(2);
	expect(layout.gap, JSON.stringify(layout)).toBeLessThan(64);
	await page.screenshot({ path: test.info().outputPath('tabs-desktop.png') });
	await page.emulateMedia({ colorScheme: 'dark' });
	await page.screenshot({ path: test.info().outputPath('tabs-dark.png') });
});
