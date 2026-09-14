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
