import { expect, test } from '@playwright/test';

const configureTableWidth = async (page, width) => {
	const table = page.locator('[data-table-frame] table');
	await table.evaluate((element, nextWidth) => {
		element.style.width = `${nextWidth}px`;
		element.style.minWidth = `${nextWidth}px`;
		element.style.tableLayout = 'fixed';
	}, width);
};

const getWidths = (page) => page.evaluate(() => {
	const frame = document.querySelector('[data-table-frame]');
	const markdown = frame?.closest('.section-markdown');
	const section = frame?.closest('.site-section');
	if (!markdown || !section) throw new Error('Missing table layout fixture.');
	const prose = markdown.getBoundingClientRect();
	const canvas = section.getBoundingClientRect();
	return {
		canvas: canvas.width,
		end: (canvas.width + prose.width) / 2,
		prose: prose.width,
	};
});

test.beforeEach(async ({ page }) => {
	await page.setViewportSize({ width: 1440, height: 1000 });
	await page.goto('/surfaces/', { waitUntil: 'networkidle' });
	await expect(page.locator('[data-table-frame]')).toHaveAttribute('data-table-ready', 'true');
});

test('uses the smallest sufficient lane on a page without side navigation', async ({ page }) => {
	const frame = page.locator('[data-table-frame]');
	const markdown = page.locator('.section-markdown');
	const section = page.locator('.site-section').filter({ has: frame });
	const widths = await getWidths(page);

	await configureTableWidth(page, widths.prose - 40);
	await expect(frame).toHaveAttribute('data-table-layout', 'prose');
	const [proseFrame, proseBounds] = await Promise.all([frame.boundingBox(), markdown.boundingBox()]);
	expect(proseFrame?.x).toBeCloseTo(proseBounds?.x ?? 0, 0);
	expect(proseFrame?.width).toBeCloseTo(widths.prose, 0);

	await configureTableWidth(page, (widths.prose + widths.end) / 2);
	await expect(frame).toHaveAttribute('data-table-layout', 'end');
	const endFrame = await frame.boundingBox();
	expect(endFrame?.x).toBeCloseTo(proseBounds?.x ?? 0, 0);
	expect(endFrame?.width).toBeCloseTo(widths.end, 0);

	const canvasTarget = (widths.end + widths.canvas) / 2;
	await configureTableWidth(page, canvasTarget);
	await expect(frame).toHaveAttribute('data-table-layout', 'canvas');
	await expect(frame).toHaveAttribute('data-table-overflow', 'false');
	const [canvasFrame, canvasBounds, tableBounds] = await Promise.all([
		frame.boundingBox(),
		section.boundingBox(),
		frame.locator('table').boundingBox(),
	]);
	expect(canvasFrame?.x).toBeCloseTo(canvasBounds?.x ?? 0, 0);
	expect(canvasFrame?.width).toBeCloseTo(widths.canvas, 0);
	expect(Math.abs(
		((tableBounds?.x ?? 0) + (tableBounds?.width ?? 0))
		- ((canvasBounds?.x ?? 0) + (canvasBounds?.width ?? 0)),
	)).toBeLessThanOrEqual(
		1.1,
	);
});

test('uses internal scrolling only after the complete canvas is exhausted', async ({ page }) => {
	const frame = page.locator('[data-table-frame]');
	const scrollRegion = frame.locator('[data-table-scroll]');
	const widths = await getWidths(page);
	await configureTableWidth(page, widths.canvas + 300);

	await expect(frame).toHaveAttribute('data-table-layout', 'canvas');
	await expect(frame).toHaveAttribute('data-table-overflow', 'true');
	await expect(scrollRegion).toHaveAttribute('tabindex', '0');
	const documentWidths = await page.evaluate(() => ({
		client: document.documentElement.clientWidth,
		scroll: document.documentElement.scrollWidth,
	}));
	expect(documentWidths.scroll).toBeLessThanOrEqual(documentWidths.client + 1);
});

test('re-evaluates the smallest sufficient lane after reading width changes', async ({ page }) => {
	const frame = page.locator('[data-table-frame]');
	const markdown = page.locator('.section-markdown');
	const settings = page.locator('[data-display-settings]');
	await settings.locator('summary').click();
	await settings.getByRole('radio', { name: 'Narrow' }).check();
	const narrowWidth = await markdown.evaluate((element) => element.getBoundingClientRect().width);
	await settings.getByRole('radio', { name: 'Standard' }).check();
	const standardWidth = await markdown.evaluate((element) => element.getBoundingClientRect().width);
	expect(standardWidth).toBeGreaterThan(narrowWidth);

	await settings.getByRole('radio', { name: 'Narrow' }).check();
	await configureTableWidth(page, (narrowWidth + standardWidth) / 2);
	await expect(frame).toHaveAttribute('data-table-layout', 'end');

	await settings.getByRole('radio', { name: 'Standard' }).check();
	await expect(frame).toHaveAttribute('data-table-layout', 'prose');
});
