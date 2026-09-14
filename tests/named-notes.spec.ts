import { expect, test, type Page } from '@playwright/test';

const route = '/guide/notes/';
const openNotes = async (page: Page) => {
	await page.goto(route, { waitUntil: 'networkidle' });
	await expect(page.locator('.section-note-ref')).toHaveCount(28);
	await expect(page.locator('.section-note')).toHaveCount(28);
};
const settle = (page: Page) => page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));

const checkGeometry = async (page: Page) => {
	const result = await page.evaluate(() => {
		const bounds = (node: Element) => {
			const rect = node.getBoundingClientRect();
			return { x: rect.x, y: rect.y, right: rect.right, bottom: rect.bottom };
		};
		const items = Array.from(document.querySelectorAll('.section-note, .section-note-paragraph > p, .norna-table-frame')).map(bounds);
		const overlaps = [];
		for (let left = 0; left < items.length; left += 1) for (let right = left + 1; right < items.length; right += 1) {
			const a = items[left], b = items[right];
			if (!(a.right <= b.x + 1 || b.right <= a.x + 1 || a.bottom <= b.y + 1 || b.bottom <= a.y + 1)) overlaps.push([left, right]);
		}
		return {
			overlaps,
			overflow: items.filter((item) => item.x < -1 || item.right > document.documentElement.clientWidth + 1),
			documentOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
		};
	});
	expect(result.overlaps, JSON.stringify(result)).toEqual([]);
	expect(result.overflow, JSON.stringify(result)).toEqual([]);
	expect(result.documentOverflow).toBeLessThanOrEqual(1);
};

test('authored notes render in order with stable targets and separate numeric footnotes', async ({ page }) => {
	await openNotes(page);
	await expect(page.locator('.section-note-stack').first().locator('.section-note')).toHaveCount(2);
	await expect(page.locator('.section-note-ref').nth(25)).toHaveText('z');
	await expect(page.locator('.section-note-ref').nth(26)).toHaveText('aa');
	await expect(page.locator('.section-note-ref').nth(27)).toHaveText('ab');
	expect(await page.locator('[data-footnote-ref]').allTextContents()).toEqual(['1', '1', '2', '1']);
	await expect(page.locator('[data-footnotes] > ol > li')).toHaveCount(2);
	const identifiers = await page.evaluate(() => Array.from(document.querySelectorAll('[id]'), (node) => node.id));
	expect(new Set(identifiers).size).toBe(identifiers.length);
	for (const href of await page.locator('.section-note-ref a, [data-footnote-backref]').evaluateAll((links) => links.map((link) => link.getAttribute('href')!))) {
		expect(identifiers).toContain(decodeURIComponent(href.slice(1)));
	}
	const reference = page.locator('.section-note-ref a').first();
	const target = (await reference.getAttribute('href'))!.slice(1);
	await reference.click();
	await expect(page).toHaveURL(new RegExp(`#${target}$`));
	await expect(page.locator(`[id="${target}"]`)).toBeVisible();
});

test('hover and keyboard focus highlight only the referenced sidenote without navigation or layout changes', async ({ page }) => {
	await openNotes(page);
	const reference = page.locator('.section-note-ref a').first();
	const secondReference = page.locator('.section-note-ref a').nth(1);
	const note = page.locator('.section-note').first();
	const secondNote = page.locator('.section-note').nth(1);
	await reference.scrollIntoViewIfNeeded();
	const bounds = await note.boundingBox();
	const url = page.url();
	const scrollY = await page.evaluate(() => window.scrollY);
	const background = await note.evaluate((node) => getComputedStyle(node).backgroundColor);
	await reference.hover();
	await expect(note).toHaveClass(/is-reference-highlighted/);
	await expect(secondNote).not.toHaveClass(/is-reference-highlighted/);
	expect(await note.evaluate((node) => getComputedStyle(node).backgroundColor)).not.toBe(background);
	expect(await note.boundingBox()).toEqual(bounds);
	expect(page.url()).toBe(url);
	expect(await page.evaluate(() => window.scrollY)).toBe(scrollY);
	await secondReference.hover();
	await expect(note).not.toHaveClass(/is-reference-highlighted/);
	await expect(secondNote).toHaveClass(/is-reference-highlighted/);
	await page.mouse.move(0, 0);
	await expect(secondNote).not.toHaveClass(/is-reference-highlighted/);
	await secondReference.focus();
	await page.keyboard.press('Shift+Tab');
	await expect(reference).toBeFocused();
	await expect(note).toHaveClass(/is-reference-highlighted/);
	await page.keyboard.press('Tab');
	await expect(note).not.toHaveClass(/is-reference-highlighted/);
	await expect(secondNote).toHaveClass(/is-reference-highlighted/);
});

test('sidenote reference hover works on a page without tabs', async ({ page }) => {
	await page.goto('/guide/components/', { waitUntil: 'networkidle' });
	await expect(page.locator('[data-content-tabs]')).toHaveCount(0);
	await page.locator('.section-note-ref a').first().hover();
	await expect(page.locator('.section-note').first()).toHaveClass(/is-reference-highlighted/);
});

test('actual layout keeps multiple and adjacent notes clear of prose and tables at responsive widths', async ({ page }) => {
	await openNotes(page);
	const markers = await page.locator('.section-note-ref').allTextContents();
	for (const width of [1920, 1440, 1281, 1280, 1100, 900, 375, 320]) {
		await page.setViewportSize({ width, height: 900 });
		await settle(page);
		await checkGeometry(page);
		expect(await page.locator('.section-note-ref').allTextContents()).toEqual(markers);
		const columns = await page.locator('.section-note-paragraph').first().evaluate((node) => getComputedStyle(node).gridTemplateColumns.split(' ').length);
		if (width === 1920) expect(columns).toBe(2);
		if (width <= 1100) expect(columns).toBe(1);
	}
});

test('Focus reading and every reading width preserve names, numbers, and safe note placement', async ({ page }) => {
	await page.setViewportSize({ width: 1440, height: 1000 });
	await openNotes(page);
	const targets = await page.locator('.section-note-ref a').evaluateAll((links) => links.map((link) => link.getAttribute('href')));
	for (const focus of [false, true]) for (const width of ['Narrow', 'Standard', 'Wide']) {
		const settings = page.locator('[data-display-settings]');
		if (!await settings.getAttribute('open')) await settings.locator('summary').click();
		await settings.getByRole('radio', { name: width, exact: true }).check();
		await settings.getByRole('checkbox', { name: 'Focus reading', exact: true }).setChecked(focus);
		await settings.locator('summary').click();
		await settle(page);
		await checkGeometry(page);
		expect(await page.locator('.section-note-ref a').evaluateAll((links) => links.map((link) => link.getAttribute('href')))).toEqual(targets);
		expect(await page.locator('[data-footnote-ref]').allTextContents()).toEqual(['1', '1', '2', '1']);
	}
});

test('footnote return links reveal and focus the correct alternative, including unchanged fragments', async ({ page }) => {
	await openNotes(page);
	const panel = page.locator('[data-tab-panel]').nth(1);
	await expect(panel).toBeHidden();
	const referenceId = await panel.locator('[data-footnote-ref]').last().getAttribute('id');
	const backref = page.locator(`[data-footnote-backref][href="#${referenceId}"]`);
	await backref.click();
	await expect(page.getByRole('tab', { name: 'Group', exact: true })).toHaveAttribute('aria-selected', 'true');
	await expect(panel).toBeVisible();
	await expect(panel.locator('[data-footnote-ref]').last()).toBeFocused();
	await page.getByRole('tab', { name: 'Individual', exact: true }).click();
	await backref.focus();
	await backref.press('Enter');
	await expect(panel).toBeVisible();
	await expect(panel.locator('[data-footnote-ref]').last()).toBeFocused();
});

test('without JavaScript all notes and alternatives remain readable and print keeps notes in flow', async ({ browser, baseURL }) => {
	const context = await browser.newContext({ javaScriptEnabled: false, baseURL, viewport: { width: 1440, height: 900 } });
	try {
		const page = await context.newPage();
		await openNotes(page);
		await expect(page.locator('[data-tab-panel]:visible')).toHaveCount(2);
		await expect(page.locator('[data-tabs-controls]')).toBeHidden();
		await checkGeometry(page);
		await page.setViewportSize({ width: 375, height: 900 });
		await checkGeometry(page);
		await page.setViewportSize({ width: 1440, height: 900 });
		await page.emulateMedia({ media: 'print' });
		await expect(page.locator('[data-tab-panel]:visible')).toHaveCount(2);
		expect(await page.locator('.section-note-paragraph').first().evaluate((node) => getComputedStyle(node).gridTemplateColumns.split(' ').length)).toBe(1);
		await checkGeometry(page);
	} finally { await context.close(); }
});
