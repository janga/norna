import { expect, test } from '@playwright/test';

test.use({ reducedMotion: 'reduce' });

test('code expands safely while short and nested examples stay contained', async ({ page }) => {
	await page.setViewportSize({ width: 1440, height: 1000 });
	await page.goto('/surfaces/', { waitUntil: 'networkidle' });
	const short = page.locator('.section-markdown > .code-block').first();
	const long = page.locator('.section-markdown > .code-block').nth(1);
	await expect(short).toHaveAttribute('data-code-layout', 'prose');
	await expect(long).toHaveAttribute('data-code-layout', /end|canvas/);
	const shortBounds = await short.boundingBox();
	const longBounds = await long.boundingBox();
	expect(longBounds!.width).toBeGreaterThan(shortBounds!.width);
	const originalSource = await long.locator('code').textContent();
	for (const width of [1024, 390]) {
		await page.setViewportSize({ width, height: 800 });
		await expect(long).toHaveAttribute('data-code-overflow', 'true');
		await expect(long.locator('pre')).toHaveAttribute('tabindex', '0');
		await expect(long.locator('code')).toHaveText(originalSource!);
		const bounds = await page.evaluate(() => ({
			page: document.documentElement.clientWidth,
			scroll: document.documentElement.scrollWidth,
			callout: document.querySelector('.norna-callout')!.getBoundingClientRect().width,
			code: document.querySelector('.norna-callout .code-block')!.getBoundingClientRect().width,
		}));
		expect(bounds.scroll).toBeLessThanOrEqual(bounds.page + 1);
		expect(bounds.code).toBeLessThan(bounds.callout);
	}
});

test('source remains scrollable and unchanged without JavaScript', async ({ browser }) => {
	const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 800 } });
	try {
		const page = await context.newPage();
		await page.goto('/surfaces/');
		const code = page.locator('.norna-code-example pre');
		await expect(code).toHaveCSS('overflow-x', 'auto');
		expect(await code.evaluate((pre) => pre.scrollWidth > pre.clientWidth)).toBe(true);
		await expect(page.locator('.code-block-copy')).toHaveCount(0);
	} finally { await context.close(); }
});
