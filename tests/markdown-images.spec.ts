import { test, expect } from '@playwright/test';

for (const width of [390, 1024, 1920]) {
	test(`managed Markdown images preserve size and containers at ${width}px`, async ({ page }) => {
		await page.setViewportSize({ width, height: 1000 });
		await page.goto('/');
		const image = (alt: string) => page.getByAltText(alt, { exact: true });
		const markdown = await image('Markdown standalone').boundingBox();
		const stack = await image('Stack comparison').boundingBox();
		expect(Math.abs(markdown!.width - stack!.width)).toBeLessThan(1);
		expect(Math.abs(markdown!.x - stack!.x)).toBeLessThan(1);
		for (const alt of ['Small standalone', 'Inline', 'First', 'Second', 'List inline', 'List link']) {
			const bounds = await image(alt).boundingBox();
			expect(bounds!.width, alt).toBeLessThanOrEqual(32);
			expect(bounds!.height, alt).toBeLessThanOrEqual(24);
		}
		for (const [alt, selector] of [['Quoted', 'blockquote'], ['List', 'li'], ['Details', 'details']]) {
			const geometry = await image(alt).evaluate((node, container) => {
				const image = node.getBoundingClientRect();
				const parent = node.closest(container)!.getBoundingClientRect();
				return { left: image.left - parent.left, right: parent.right - image.right, ratio: image.width / image.height };
			}, selector);
			expect(geometry.left, alt).toBeGreaterThanOrEqual(-1);
			expect(geometry.right, alt).toBeGreaterThanOrEqual(-1);
			expect(geometry.ratio, alt).toBeCloseTo(1200 / 700, 2);
		}
		await expect(image('Inline').locator('..')).toHaveText('Before  after.');
		await expect(image('Linked').locator('..')).toHaveAttribute('href', '#destination');
		await expect(image('Linked').locator('..')).not.toHaveAttribute('data-image-inspection-trigger');
		expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
		await page.screenshot({ path: test.info().outputPath(`markdown-images-${width}.png`), fullPage: true, style: 'astro-dev-toolbar { display: none !important; }' });
	});
}

test('standalone Markdown images inspect, close and return focus; authored links navigate', async ({ page }) => {
	await page.goto('/');
	for (const alt of ['Markdown standalone', 'Quoted', 'List', 'Details']) {
		const trigger = page.locator('#main-content').getByAltText(alt, { exact: true }).locator('..');
		await expect(trigger).toHaveAttribute('data-image-inspection-available', 'true');
		await trigger.click();
		const dialog = page.locator('[data-image-inspector]');
		await expect(dialog).toBeVisible();
		await expect(dialog.locator('img')).toHaveAttribute('alt', alt);
		await expect(dialog.locator('[data-image-inspector-caption]')).toBeHidden();
		await page.keyboard.press('Escape');
		await expect(dialog).toBeHidden();
		await expect(trigger).toBeFocused();
	}
	await page.getByAltText('Linked', { exact: true }).click();
	await expect(page).toHaveURL(/#destination$/);
	await expect(page.locator('[data-image-inspector]')).toBeHidden();
	await page.emulateMedia({ colorScheme: 'dark' });
	await page.screenshot({ path: test.info().outputPath('markdown-images-dark.png'), fullPage: true });
});

test('images and direct image links remain usable without JavaScript', async ({ browser }) => {
	const context = await browser.newContext({ javaScriptEnabled: false, baseURL: test.info().project.use.baseURL });
	const page = await context.newPage();
	await page.goto('/');
	const standalone = page.getByAltText('Markdown standalone', { exact: true });
	await expect(standalone).toBeVisible();
	const href = await standalone.locator('..').getAttribute('href');
	const response = await page.request.get(href!);
	expect(response.ok()).toBe(true);
	expect(response.headers()['content-type']).toContain('image/svg+xml');
	await page.getByAltText('Linked', { exact: true }).click();
	await expect(page).toHaveURL(/#destination$/);
	await context.close();
});
