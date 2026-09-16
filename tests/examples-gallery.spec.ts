import { expect, test } from '@playwright/test';

test.use({ reducedMotion: 'reduce' });

const section = (page, id: string) => page.locator('.site-section').filter({ has: page.locator(`#${id}`) });

test('the gallery keeps its table source readable and bounded at every width', async ({ page }) => {
	await page.setViewportSize({ width: 1440, height: 1000 });
	await page.goto('examples/#tables');
	const tables = section(page, 'tables');
	const code = tables.locator('.code-block');
	await expect(code).toHaveAttribute('data-code-overflow', 'false');
	await expect(tables.locator('tbody tr')).toHaveCount(11);
	await expect(tables.locator('thead th')).toHaveCount(6);
	await expect(tables.locator('pre code')).toContainText('Capability {row-header}');
	const widths = await tables.evaluate((node) => ({
		prose: node.querySelector('.section-markdown')!.getBoundingClientRect().width,
		code: node.querySelector('.code-block')!.getBoundingClientRect().width,
	}));
	expect(widths.code).toBeGreaterThan(widths.prose);

	for (const width of [1440, 1024, 390]) {
		await page.setViewportSize({ width, height: 900 });
		for (const appearance of ['light', 'dark']) {
			await page.locator('html').evaluate((root, value) => { root.dataset.appearance = value; }, appearance);
			await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
			if (width === 390) {
				await expect(code).toHaveAttribute('data-code-overflow', 'true');
				await expect(code.locator('pre')).toHaveAttribute('tabindex', '0');
				await expect(tables.locator('.norna-table-frame')).toHaveAttribute('data-table-overflow', 'true');
			}
		}
	}
	await page.setViewportSize({ width: 1440, height: 1000 });
	await page.locator('html').evaluate((root) => {
		root.dataset.focusReading = 'on';
		root.dataset.readingWidth = 'wide';
	});
	await expect(code).toHaveAttribute('data-code-overflow', 'false');
	await expect(page.locator('.tree-local-navigation')).toBeHidden();
	await expect(page.locator('.mobile-nav-menu > summary')).toBeVisible();
});

test('the visible examples render their exact source without broken image references', async ({ page }) => {
	await page.goto('examples/');
	await expect(page.locator('#main-content .section-header h2')).toHaveCount(22);
	await expect(page.locator('#main-content .section-header h2').first()).toHaveAttribute('id', 'single-image');
	await expect(section(page, 'semantic-callouts').locator('.norna-callout')).toHaveCount(2);
	await expect(section(page, 'image-carousels').locator('[data-carousel]')).toHaveAttribute('data-carousel-ready', 'true');
	await page.evaluate(async () => {
		await Promise.all(Array.from(document.querySelectorAll<HTMLImageElement>('#main-content img'), async (image) => {
			image.loading = 'eager';
			await image.decode().catch(() => {});
		}));
	});
	expect(await page.locator('#main-content img').evaluateAll((images: HTMLImageElement[]) => images.filter((image) => !image.naturalWidth).map((image) => image.src))).toEqual([]);
});

test.describe('gallery without JavaScript', () => {
	test.use({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
	test('keeps table cells, source, images, and native navigation available', async ({ page }) => {
		await page.goto('examples/#tables');
		await expect(section(page, 'tables').locator('tbody tr')).toHaveCount(11);
		await expect(section(page, 'tabs').locator('[data-tab-panel]:visible')).toHaveCount(2);
		await expect(section(page, 'tables').locator('pre code')).toContainText('Capability {row-header}');
		await expect(page.locator('.code-block-copy')).toHaveCount(0);
		const carousel = section(page, 'image-carousels').locator('[data-carousel]');
		await expect(carousel.locator('img')).toHaveCount(3);
		await expect(carousel.locator('a')).toHaveCount(0);
		await expect(carousel.locator('[data-carousel-next]')).toBeHidden();
		await page.locator('.mobile-nav-menu > summary').click();
		await expect(page.locator('.mobile-nav-menu')).toHaveAttribute('open');
		await expect(page.locator('.mobile-nav-menu a[href="#tables"]')).toBeVisible();
	});
});

test('gallery alternatives retain exact code and a stable page outline', async ({ page }) => {
	await page.goto('examples/#tabs');
	const example = section(page, 'tabs');
	const group = example.locator('[data-content-tabs]');
	const headings = await page.locator('#main-content :is(h1,h2,h3)').allTextContents();
	await group.getByRole('tab', { name: 'Windows' }).click();
	await expect(group.getByRole('tabpanel').locator('pre code')).toHaveText('winget install ImageMagick.ImageMagick');
	await group.getByRole('tab', { name: 'macOS' }).focus();
	await page.keyboard.press('Home');
	await expect(group.getByRole('tabpanel').locator('pre code')).toHaveText('brew install imagemagick');
	await expect(group.getByRole('tabpanel').locator('.norna-callout-tip')).toBeVisible();
	expect(await page.locator('#main-content :is(h1,h2,h3)').allTextContents()).toEqual(headings);
	await expect(example.locator('a[href$="/reference/content/tabs/"]')).toHaveCount(1);
	for (const width of [1440, 1024, 390]) {
		await page.setViewportSize({ width, height: 900 });
		await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
	}
});
