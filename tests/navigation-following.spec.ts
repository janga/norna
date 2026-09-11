import { expect, test, type Locator, type Page } from '@playwright/test';

const deepPage = '/guides/reading-position/';
const shallowPage = '/reference/reading-position/';
const leftSelector = '.tree-local-navigation';
const rightSelector = '.page-contents-navigation-rail';

const waitForFrames = (page: Page) => page.evaluate(() => new Promise<void>((resolve) => {
	requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
}));

const clickVisibleControl = async (page: Page, control: Locator) => {
	await expect(control).toBeInViewport();
	const box = await control.boundingBox();
	if (!box) throw new Error('Expected a visible navigation control.');
	// Avoid Playwright's pre-click scroll on ancestors of an already sticky control.
	await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
};

const expectCurrentVisible = async (container: Locator) => {
	await expect.poll(() => container.evaluate((rail) => {
		const active = rail.querySelector<HTMLElement>('[data-reading-position-ancestor]')
			?? rail.querySelector<HTMLElement>('a[aria-current="location"]');
		if (!active || active.getClientRects().length === 0) return false;
		const bounds = active.getBoundingClientRect();
		const frame = rail.getBoundingClientRect();
		let top = frame.top + rail.clientTop;
		for (const control of rail.querySelectorAll<HTMLElement>('.navigation-tree-controls, .mobile-nav-panel-actions')) {
			if (control.getClientRects().length && getComputedStyle(control).position === 'sticky') {
				top = Math.max(top, control.getBoundingClientRect().bottom);
			}
		}
		return bounds.top >= top - 1 && bounds.bottom <= Math.min(window.innerHeight, frame.bottom) + 1;
	})).toBe(true);
};

for (const scenario of [
	{ name: 'right outline', path: deepPage, width: 1440, selector: rightSelector },
	{ name: 'responsive left outline', path: deepPage, width: 1120, selector: leftSelector },
	{ name: 'shallow left outline', path: shallowPage, width: 1440, selector: leftSelector },
]) {
	test.describe(scenario.name, () => {
		test.use({ viewport: { width: scenario.width, height: 520 }, reducedMotion: 'reduce' });

		test('follows forward and backward without moving the document, focus, or URL', async ({ page }) => {
			await page.goto(scenario.path, { waitUntil: 'networkidle' });
			const rail = page.locator(scenario.selector);
			await expect(rail).toBeVisible();
			await expect.poll(() => rail.evaluate((element) => element.scrollHeight > element.clientHeight)).toBe(true);
			const focus = page.locator('[data-display-settings] > summary');
			await focus.focus();
			const initialUrl = page.url();
			const otherRailPosition = await page.locator(leftSelector).evaluate((element) => element.scrollTop);
			const seen = new Set<string>();
			const maximum = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
			const positions = Array.from({ length: 31 }, (_, index) => Math.round(maximum * index / 30));
			for (const position of [...positions, ...positions.reverse()]) {
				await page.evaluate((top) => window.scrollTo({ top, behavior: 'instant' }), position);
				await waitForFrames(page);
				await expectCurrentVisible(rail);
				expect(await page.evaluate(() => window.scrollY)).toBeCloseTo(position, 0);
				seen.add(await rail.locator('a[aria-current="location"]').getAttribute('href') ?? '');
			}
			expect(seen.size).toBeGreaterThan(10);
			await expect(focus).toBeFocused();
			expect(page.url()).toBe(initialUrl);
			expect(await page.evaluate(() => window.scrollX)).toBe(0);
			if (scenario.selector === rightSelector) {
				expect(await page.locator(leftSelector).evaluate((element) => element.scrollTop)).toBe(otherRailPosition);
			}
		});

		test('keeps a fitting entry stationary and yields to manual navigation until document scrolling resumes', async ({ page }) => {
			await page.goto(scenario.path, { waitUntil: 'networkidle' });
			const rail = page.locator(scenario.selector);
			// Establish a scroll-selected heading, not a temporary fragment-arrival marker.
			await page.evaluate(() => {
				const heading = document.getElementById('review-the-sequence')!;
				window.scrollTo({ top: heading.getBoundingClientRect().top + scrollY - innerHeight / 2 + 8, behavior: 'instant' });
			});
			await expect(rail.locator('a[aria-current="location"]')).toHaveAttribute('href', '#review-the-sequence');
			await waitForFrames(page);
			await expectCurrentVisible(rail);
			const before = await rail.evaluate((element) => element.scrollTop);
			await page.evaluate(() => window.dispatchEvent(new Event('resize')));
			await waitForFrames(page);
			expect(await rail.evaluate((element) => element.scrollTop)).toBeCloseTo(before, 0);
			const documentTop = await page.evaluate(() => window.scrollY);
			await rail.hover();
			await page.mouse.wheel(0, -10000);
			await expect.poll(() => rail.evaluate((element) => element.scrollTop)).toBe(0);
			await page.evaluate(() => window.dispatchEvent(new Event('resize')));
			await waitForFrames(page);
			expect(await rail.evaluate((element) => element.scrollTop)).toBe(0);
			expect(await page.evaluate(() => window.scrollY)).toBe(documentTop);
			await page.mouse.move(scenario.width / 2, 350);
			await page.mouse.wheel(0, 80);
			await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(documentTop);
			await expectCurrentVisible(rail);
		});

		test('does not scroll a focused navigation link out of view', async ({ page }) => {
			await page.goto(scenario.path, { waitUntil: 'networkidle' });
			const rail = page.locator(scenario.selector);
			const link = rail.locator('.page-contents-links a').filter({ hasText: /^Define the scope$/ }).last();
			await link.focus();
			const before = await rail.evaluate((element) => element.scrollTop);
			await page.evaluate(() => window.scrollTo({ top: 2200, behavior: 'instant' }));
			await waitForFrames(page);
			await expect(link).toBeFocused();
			expect(await rail.evaluate((element) => element.scrollTop)).toBe(before);
			await page.locator('[data-display-settings] > summary').focus();
			await page.evaluate(() => window.scrollBy(0, 80));
			await expectCurrentVisible(rail);
		});
	});
}

test('keeps collapsed page and category branches closed and marks the visible ancestor', async ({ page }) => {
	await page.setViewportSize({ width: 1120, height: 700 });
	await page.goto(`${deepPage}#review-the-sequence`, { waitUntil: 'networkidle' });
	const rail = page.locator(leftSelector);
	const pageBranch = rail.locator('details[data-page-path="guides/reading-position"]');
	await pageBranch.locator('summary').click();
	await expect(pageBranch).not.toHaveAttribute('open', '');
	const pageLink = rail.locator('.navigation-page-node-current > a');
	await expect(pageLink).toHaveAttribute('data-reading-position-ancestor', 'true');
	await expect(pageLink).toHaveAttribute('aria-current', 'page');
	await page.evaluate(() => window.scrollBy(0, 30));
	await waitForFrames(page);
	await expect(pageBranch).not.toHaveAttribute('open', '');
	const category = rail.locator('details[data-page-path="guides"]');
	await category.locator(':scope > summary').click();
	await expect(category.locator(':scope > summary')).toHaveAttribute('data-reading-position-ancestor', 'true');
	await expect(pageLink).not.toHaveAttribute('data-reading-position-ancestor', 'true');
	await page.evaluate(() => window.scrollBy(0, 30));
	await waitForFrames(page);
	await expect(category).not.toHaveAttribute('open', '');
});

test('follows the active rail across responsive and Focus reading changes', async ({ page }) => {
	await page.setViewportSize({ width: 1440, height: 600 });
	await page.goto(`${deepPage}#review-the-sequence`, { waitUntil: 'networkidle' });
	await expectCurrentVisible(page.locator(rightSelector));
	await page.setViewportSize({ width: 1120, height: 600 });
	await expect(page.locator(rightSelector)).toBeHidden();
	await expectCurrentVisible(page.locator(leftSelector));
	await page.setViewportSize({ width: 1440, height: 600 });
	await expectCurrentVisible(page.locator(rightSelector));
	const settings = page.locator('[data-display-settings]');
	await settings.locator('summary').click();
	await settings.getByRole('checkbox', { name: 'Focus reading' }).check();
	await expect(page.locator(leftSelector)).toBeHidden();
	await expect(page.locator(rightSelector)).toBeHidden();
	await page.keyboard.press('Escape');
	const menu = page.locator('.mobile-nav-menu');
	await menu.locator(':scope > summary').click();
	await expectCurrentVisible(page.locator('[data-compact-navigation-panel]'));
	await expect(page.locator('[data-compact-navigation-close]')).toBeFocused();
});

test('does not clear a navigation filter or move it while the reader returns to the document', async ({ page }) => {
	await page.setViewportSize({ width: 1120, height: 600 });
	await page.goto(`${deepPage}#review-the-sequence`, { waitUntil: 'networkidle' });
	const rail = page.locator(leftSelector);
	const filter = rail.locator('[data-tree-filter]');
	await filter.fill('Publishing');
	await expect(rail).toHaveAttribute('data-tree-filter-active', 'true');
	const before = await rail.evaluate((element) => element.scrollTop);
	await page.locator('[data-display-settings] > summary').focus();
	await page.evaluate(() => window.scrollBy(0, 80));
	await waitForFrames(page);
	await expect(filter).toHaveValue('Publishing');
	await expect(rail).toHaveAttribute('data-tree-filter-active', 'true');
	expect(await rail.evaluate((element) => element.scrollTop)).toBe(before);
	await filter.fill('');
	await page.locator('[data-display-settings] > summary').focus();
	await page.evaluate(() => window.scrollBy(0, 80));
	await expectCurrentVisible(rail);
});

test('a stored tree scroll position does not hide the active fragment on arrival', async ({ page }) => {
	await page.setViewportSize({ width: 1120, height: 600 });
	await page.goto(deepPage, { waitUntil: 'networkidle' });
	const rail = page.locator(leftSelector);
	await rail.evaluate((element) => { element.scrollTop = 0; });
	await page.goto(`${deepPage}?return=1#maintain-the-guide`, { waitUntil: 'networkidle' });
	await expectCurrentVisible(rail);
	await expect(rail.locator('a[aria-current="location"]')).toHaveAttribute('href', '#maintain-the-guide');
});

test('reveals the current heading once on compact arrival and keeps Close visible and focused', async ({ page }) => {
	await page.setViewportSize({ width: 390, height: 700 });
	await page.goto(`${deepPage}#review-the-sequence`, { waitUntil: 'networkidle' });
	const initialUrl = page.url();
	const documentTop = await page.evaluate(() => scrollY);
	const menu = page.locator('.mobile-nav-menu');
	await clickVisibleControl(page, menu.locator(':scope > summary'));
	const panel = page.locator('[data-compact-navigation-panel]');
	await expectCurrentVisible(panel);
	const close = page.locator('[data-compact-navigation-close]');
	await expect(close).toBeFocused();
	await expect(close).toBeInViewport();
	await panel.evaluate((element) => { element.scrollTop = 0; });
	await page.evaluate(() => window.dispatchEvent(new Event('resize')));
	await waitForFrames(page);
	await expect.poll(() => panel.evaluate((element) => element.scrollTop)).toBe(0);
	await clickVisibleControl(page, close);
	await expect(menu).not.toHaveAttribute('open', '');
	await clickVisibleControl(page, menu.locator(':scope > summary'));
	await expectCurrentVisible(panel);
	expect(page.url()).toBe(initialUrl);
	expect(await page.evaluate(() => scrollY)).toBe(documentTop);
});

test('retains ordinary links and manual navigation without JavaScript', async ({ browser }) => {
	const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 1120, height: 600 } });
	const page = await context.newPage();
	try {
		await page.goto(new URL(deepPage, test.info().project.use.baseURL).href);
		const link = page.locator(leftSelector).getByRole('link', { name: 'Maintain the guide', exact: true });
		await link.click();
		await expect(page).toHaveURL(/#maintain-the-guide$/);
		await expect(page.locator('[data-reading-position-ancestor]')).toHaveCount(0);
		await expect(page.locator('h2#maintain-the-guide')).toBeInViewport();
	} finally {
		await context.close();
	}
});
