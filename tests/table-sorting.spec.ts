import { expect, test } from '@playwright/test';

const getColumnValues = (table, columnIndex: number) => table.locator('tbody tr').evaluateAll(
	(rows, index) => rows.map((row) => row.cells[index]?.textContent?.replace(/\s+/gu, ' ').trim() ?? ''),
	columnIndex,
);

const settleLayout = (page) => page.evaluate(() => new Promise((resolve) => (
	requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(resolve)))
)));

test.beforeEach(async ({ page }) => {
	await page.setViewportSize({ width: 1200, height: 800 });
	await page.goto('/', { waitUntil: 'networkidle' });
	await expect(page.locator('[data-table-frame]')).toHaveAttribute('data-table-ready', 'true');
	await expect(page.locator('[data-table-frame] table')).toHaveAttribute('data-table-sortable', 'true');
});

test('sorts text with the configured locale and restores source order', async ({ page }) => {
	const table = page.locator('[data-table-frame] table');
	const nameHeading = table.locator('thead th').nth(0);
	const nameButton = nameHeading.locator('[data-table-sort-button]');

	await nameButton.focus();
	await page.keyboard.press('Enter');
	await expect(nameHeading).toHaveAttribute('aria-sort', 'ascending');
	await expect(getColumnValues(table, 0)).resolves.toEqual(['Zebra', 'Åland', 'Älmhult', 'Örebro']);
	await expect(nameButton).toBeFocused();

	await nameButton.click();
	await expect(nameHeading).toHaveAttribute('aria-sort', 'descending');
	await expect(getColumnValues(table, 0)).resolves.toEqual(['Örebro', 'Älmhult', 'Åland', 'Zebra']);

	await nameButton.click();
	await expect(nameHeading).not.toHaveAttribute('aria-sort');
	await expect(getColumnValues(table, 0)).resolves.toEqual(['Örebro', 'Zebra', 'Åland', 'Älmhult']);
});

test('detects numeric and ISO-date columns while keeping blanks last and ties stable', async ({ page }) => {
	const table = page.locator('[data-table-frame] table');

	await table.locator('thead th').nth(1).locator('[data-table-sort-button]').click();
	await expect(getColumnValues(table, 0)).resolves.toEqual(['Zebra', 'Älmhult', 'Örebro', 'Åland']);

	await page.reload({ waitUntil: 'networkidle' });
	const reloadedTable = page.locator('[data-table-frame] table');
	await reloadedTable.locator('thead th').nth(2).locator('[data-table-sort-button]').click();
	await expect(getColumnValues(reloadedTable, 0)).resolves.toEqual(['Åland', 'Zebra', 'Örebro', 'Älmhult']);

	await page.reload({ waitUntil: 'networkidle' });
	const mixedTable = page.locator('[data-table-frame] table');
	await mixedTable.locator('thead th').nth(3).locator('[data-table-sort-button]').click();
	await expect(getColumnValues(mixedTable, 0)).resolves.toEqual(['Zebra', 'Åland', 'Älmhult', 'Örebro']);
});

test('keeps the native source table without JavaScript', async ({ browser }) => {
	const context = await browser.newContext({
		javaScriptEnabled: false,
		viewport: { width: 1200, height: 800 },
	});
	const page = await context.newPage();
	await page.goto('/', { waitUntil: 'domcontentloaded' });
	const table = page.locator('[data-table-frame] table');

	await expect(table.locator('[data-table-sort-button]')).toHaveCount(0);
	await expect(page.getByRole('scrollbar')).toHaveCount(0);
	await expect(getColumnValues(table, 0)).resolves.toEqual(['Örebro', 'Zebra', 'Åland', 'Älmhult']);
	await context.close();
});

const openLongTable = async (page) => {
	await page.goto('/long-table/', { waitUntil: 'networkidle' });
	const frame = page.locator('[data-table-frame]');
	await expect(frame).toHaveAttribute('data-table-ready', 'true');
	await frame.locator('table').evaluate((table) => {
		table.style.width = '1800px';
		table.style.minWidth = '1800px';
		table.style.tableLayout = 'fixed';
	});
	await expect(frame).toHaveAttribute('data-table-sticky-heading', 'true');
	await frame.evaluate((element) => window.scrollTo(0, window.scrollY + element.getBoundingClientRect().top + 350));
	return frame;
};

test('persistent scrollbar stays visible, represents the viewport, and supports dragging and track clicks', async ({ page }) => {
	const frame = await openLongTable(page);
	const scrollbar = frame.getByRole('scrollbar');
	const thumb = scrollbar.locator('[data-table-scrollbar-thumb]');
	const region = frame.locator('[data-table-scroll]');
	await expect(scrollbar).toBeVisible();
	await expect(scrollbar).toHaveAttribute('aria-orientation', 'horizontal');
	await expect(scrollbar).toHaveAttribute('aria-controls', await region.getAttribute('id') as string);
	await expect(scrollbar).toHaveAttribute('aria-valuenow', '0');
	const barBounds = (await scrollbar.boundingBox())!;
	const headingBounds = (await frame.locator('[data-table-sticky-heading]').boundingBox())!;
	expect(barBounds.y).toBeCloseTo(headingBounds.y + headingBounds.height, 0);
	expect(barBounds.height).toBeGreaterThanOrEqual(24);
	await expect(frame.locator('[data-table-scroll-next], [data-table-scroll-previous]')).toHaveCount(0);
	const thumbBounds = (await thumb.boundingBox())!;
	const fraction = await region.evaluate((element) => element.clientWidth / element.scrollWidth);
	expect(thumbBounds.width / barBounds.width).toBeCloseTo(fraction, 2);
	expect(barBounds.y).toBeGreaterThanOrEqual(0);
	expect(barBounds.y + barBounds.height).toBeLessThan(800);
	expect((await region.boundingBox())!.y + (await region.boundingBox())!.height).toBeGreaterThan(800);

	const oldScrollY = await page.evaluate(() => scrollY);
	await page.mouse.move(thumbBounds.x + thumbBounds.width / 2, thumbBounds.y + thumbBounds.height / 2);
	await page.mouse.down();
	await page.mouse.move(barBounds.x + barBounds.width, barBounds.y + barBounds.height / 2, { steps: 8 });
	await page.mouse.up();
	await expect(scrollbar).toHaveAttribute('aria-valuenow', '100');
	await expect(scrollbar).toBeFocused();
	expect(await page.evaluate(() => scrollY)).toBeCloseTo(oldScrollY, 0);
	await scrollbar.click({ position: { x: 1, y: barBounds.height / 2 } });
	await expect(scrollbar).toHaveAttribute('aria-valuenow', '0');

	await region.evaluate((element) => { element.scrollLeft = (element.scrollWidth - element.clientWidth) / 2; });
	await expect(scrollbar).toHaveAttribute('aria-valuenow', '50');
	await scrollbar.press('ArrowRight');
	await expect.poll(async () => Number(await scrollbar.getAttribute('aria-valuenow'))).toBeGreaterThan(50);
});

test('persistent scrollbar supports keyboard movement and RTL positions without scrolling the document', async ({ page }) => {
	const frame = await openLongTable(page);
	const scrollbar = frame.getByRole('scrollbar');
	const region = frame.locator('[data-table-scroll]');
	await scrollbar.focus();
	const oldScrollY = await page.evaluate(() => scrollY);
	for (const key of ['ArrowRight', 'PageDown', 'End']) {
		await page.keyboard.press(key);
		await expect.poll(async () => Number(await scrollbar.getAttribute('aria-valuenow'))).toBeGreaterThan(0);
	}
	await expect(scrollbar).toHaveAttribute('aria-valuenow', '100');
	await page.keyboard.press('PageUp');
	await expect.poll(async () => Number(await scrollbar.getAttribute('aria-valuenow'))).toBeLessThan(100);
	await page.keyboard.press('Home');
	await expect(scrollbar).toHaveAttribute('aria-valuenow', '0');
	expect(await page.evaluate(() => scrollY)).toBeCloseTo(oldScrollY, 0);

	await page.evaluate(() => { document.documentElement.dir = 'rtl'; });
	await settleLayout(page);
	await page.keyboard.press('Home');
	const atStart = await scrollbar.locator('[data-table-scrollbar-thumb]').boundingBox();
	const track = (await scrollbar.boundingBox())!;
	expect(atStart!.x + atStart!.width).toBeCloseTo(track.x + track.width, 0);
	await page.keyboard.press('ArrowLeft');
	await expect.poll(() => region.evaluate((element) => element.scrollLeft)).toBeLessThan(0);
	await page.keyboard.press('End');
	await expect(scrollbar).toHaveAttribute('aria-valuenow', '100');
	expect((await scrollbar.locator('[data-table-scrollbar-thumb]').boundingBox())!.x).toBeCloseTo(track.x, 0);
	await page.keyboard.press('ArrowRight');
	await expect.poll(async () => Number(await scrollbar.getAttribute('aria-valuenow'))).toBeLessThan(100);
});

test('persistent scrollbar adapts to reading preferences, hides when unnecessary, and releases focus', async ({ page }) => {
	const frame = await openLongTable(page);
	const scrollbar = frame.getByRole('scrollbar');
	const region = frame.locator('[data-table-scroll]');
	for (const width of [1200, 600, 390]) {
		await page.setViewportSize({ width, height: 800 });
		for (const focusReading of ['on', 'off']) {
			await page.evaluate((value) => {
				document.documentElement.dataset.focusReading = value;
				document.documentElement.dataset.readingWidth = 'wide';
			}, focusReading);
			await settleLayout(page);
			await expect(scrollbar).toBeVisible();
			await scrollbar.focus();
			await page.keyboard.press('End');
			await expect(scrollbar).toHaveAttribute('aria-valuenow', '100');
			const track = (await scrollbar.boundingBox())!;
			expect(track.width).toBeGreaterThanOrEqual(44);
			expect(track.x).toBeGreaterThanOrEqual(0);
			expect(track.x + track.width).toBeLessThanOrEqual(width);
		}
	}
	await page.setViewportSize({ width: 1200, height: 800 });
	await settleLayout(page);
	await scrollbar.focus();
	await frame.locator('table').evaluate((table) => {
		table.style.minWidth = '0';
		table.style.width = '400px';
	});
	await expect(frame).toHaveAttribute('data-table-overflow', 'false');
	await expect(frame.locator('[data-table-scrollbar]')).toBeHidden();
	await expect(region).toBeFocused();
	await expect(frame.getByRole('scrollbar')).toHaveCount(0);
});

test('sorts from the visible sticky header and keeps source semantics and indicators synchronized', async ({ page }, testInfo) => {
	const frame = await openLongTable(page);
	const table = frame.locator('table');
	const header = table.locator('thead th').nth(1);
	const sticky = frame.locator('[data-table-sticky-heading]');
	const button = sticky.getByRole('button', { name: 'Count', exact: true });
	const sourceOrder = await getColumnValues(table, 0);
	await expect(sticky).not.toHaveAttribute('inert');
	await expect(frame.getByRole('columnheader', { name: 'Count', exact: true })).toHaveCount(1);
	await expect(frame.getByRole('button', { name: 'Count', exact: true })).toHaveCount(1);
	expect((await header.boundingBox())!.y).toBeLessThan(0);
	const beforeScroll = await page.evaluate(() => window.scrollY);

	await button.click();
	await expect(header).toHaveAttribute('aria-sort', 'ascending');
	await expect(button).toHaveAttribute('data-table-sort-state', 'ascending');
	await expect(header.locator('[data-table-sort-button]')).toHaveAttribute('data-table-sort-state', 'ascending');
	await expect(getColumnValues(table, 1)).resolves.toEqual(Array.from({ length: 28 }, (_, i) => String(i + 1)));
	await expect(button).toBeFocused();
	expect(await page.evaluate(() => window.scrollY)).toBeCloseTo(beforeScroll, 0);
	await page.screenshot({ path: testInfo.outputPath('sticky-sorting.png') });

	await page.keyboard.press('Space');
	await expect(header).toHaveAttribute('aria-sort', 'descending');
	await expect(button).toHaveAttribute('data-table-sort-state', 'descending');
	await page.keyboard.press('Enter');
	await expect(header).not.toHaveAttribute('aria-sort');
	await expect(button).toHaveAttribute('data-table-sort-state', 'unsorted');
	await expect(getColumnValues(table, 0)).resolves.toEqual(sourceOrder);
});

test('retains focused sticky controls through resize and preference changes, with one tab stop per column', async ({ page }) => {
	const frame = await openLongTable(page);
	const button = frame.locator('[data-table-sticky-heading]').getByRole('button', { name: 'Count', exact: true });
	await button.focus();
	const identity = await button.elementHandle();
	for (const width of [900, 600, 390, 1200]) {
		await page.setViewportSize({ width, height: 800 });
		await settleLayout(page);
		await expect(button).toBeFocused();
		expect(await identity!.evaluate((element) => element.isConnected)).toBe(true);
		await page.keyboard.press('Enter');
		await expect(button).toBeFocused();
	}
	for (const [focusReading, readingWidth] of [['on', 'wide'], ['on', 'narrow'], ['off', 'standard']]) {
		await page.evaluate(([focusReading, readingWidth]) => {
			document.documentElement.dataset.focusReading = focusReading;
			document.documentElement.dataset.readingWidth = readingWidth;
		}, [focusReading, readingWidth]);
		await settleLayout(page);
		await expect.poll(() => identity!.evaluate((element) => element === document.activeElement)).toBe(true);
		await expect(frame).toHaveAttribute('data-table-overflow', 'true');
	}
	await expect(frame.locator('thead [data-table-sort-button]:not([tabindex="-1"])')).toHaveCount(0);
	await expect(frame.getByRole('button', { name: 'Count', exact: true })).toHaveCount(1);

	// Real keyboard navigation reveals later columns instead of focusing clipped controls.
	for (const name of ['Inspected', 'Responsibility', 'Next action', 'Context']) {
		await page.keyboard.press('Tab');
		const next = frame.locator('[data-table-sticky-heading]').getByRole('button', { name, exact: true });
		await expect(next).toBeFocused();
		await expect.poll(() => next.evaluate((element) => {
			const bounds = element.getBoundingClientRect();
			return document.elementFromPoint(bounds.left + 5, bounds.top + 5)?.closest('button') === element;
		})).toBe(true);
	}
});

test('transfers focus to the original header when overflow ends and back when it returns', async ({ page }) => {
	const frame = await openLongTable(page);
	const table = frame.locator('table');
	const stickyButton = frame.locator('[data-table-sticky-heading]').getByRole('button', { name: 'Count', exact: true });
	await stickyButton.focus();
	await table.evaluate((table) => {
		table.style.minWidth = '0';
		table.style.width = '400px';
	});
	await expect(frame).toHaveAttribute('data-table-overflow', 'false');
	const original = table.locator('thead').getByRole('button', { name: 'Count', exact: true });
	await expect(original).toBeFocused();
	await expect(frame.getByRole('button', { name: 'Count', exact: true })).toHaveCount(1);
	await table.evaluate((table) => {
		table.style.width = '1800px';
		table.style.minWidth = '1800px';
	});
	await expect(frame).toHaveAttribute('data-table-overflow', 'true');
	await expect(stickyButton).toBeFocused();
	await expect(frame.getByRole('button', { name: 'Count', exact: true })).toHaveCount(1);
});

test('sorts after changing Focus reading and width through the Display panel', async ({ page }) => {
	const frame = await openLongTable(page);
	const settings = page.locator('[data-display-settings]');
	await settings.locator('summary').click();
	await settings.locator('[data-reader-focus]').check();
	await settings.locator('[data-reader-width][value="wide"]').check();
	await settings.locator('summary').click();
	await settleLayout(page);
	await expect(page.locator('html')).toHaveAttribute('data-focus-reading', 'on');
	await expect(frame).toHaveAttribute('data-table-overflow', 'true');
	await frame.getByRole('button', { name: 'Count', exact: true }).click();
	await expect(frame.locator('thead th').nth(1)).toHaveAttribute('aria-sort', 'ascending');
	await expect(getColumnValues(frame.locator('table'), 1)).resolves.toEqual(Array.from({ length: 28 }, (_, i) => String(i + 1)));
});
