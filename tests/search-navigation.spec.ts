import { expect, test, type Page } from '@playwright/test';

const originPath = 'examples/?review=search#semantic-callouts';
const returnLink = (page: Page) => page.locator('[data-search-return]');
const searchLink = (page: Page) => page.locator('.site-search-link');
const relativeUrl = (page: Page, path: string) => new URL(path, process.env.PLAYWRIGHT_BASE_URL!).href;

const prepareOrigin = async (page: Page) => {
	await page.goto(originPath);
	await expect(page.locator('#main-content [data-carousel]').first()).toHaveAttribute('data-carousel-ready', 'true');
	await page.evaluate(async () => {
		await document.fonts.ready;
		window.scrollTo({ top: document.querySelector('#semantic-callouts')!.getBoundingClientRect().top + scrollY + 120, behavior: 'instant' });
	});
	await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(1000);
	return page.evaluate(() => scrollY);
};

const openSearch = async (page: Page) => {
	// Clicking a visible sticky control must not scroll its document-flow box into view first.
	const box = await searchLink(page).boundingBox();
	expect(box).not.toBeNull();
	await page.mouse.click(box!.x + box!.width / 2, box!.y + box!.height / 2);
	await expect(returnLink(page)).toHaveText('Back to Examples');
	await expect(page).toHaveURL(relativeUrl(page, 'search/'));
};

test.beforeEach(async ({ page }) => {
	await page.route('**/pagefind/pagefind-ui.js', (route) => route.abort());
	await page.route('**/pagefind/pagefind-ui.css', (route) => route.fulfill({ contentType: 'text/css', body: '' }));
});

for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 700 }]) {
	test(`return survives unavailable search and reload at ${viewport.width}px`, async ({ page, context }) => {
		await page.setViewportSize(viewport);
		await page.emulateMedia({ colorScheme: 'dark' });
		await context.addCookies([
			{ name: 'norna-appearance', value: 'dark', url: relativeUrl(page, '') },
			{ name: 'norna-reading-width', value: 'wide', url: relativeUrl(page, '') },
			{ name: 'norna-focus-reading', value: 'on', url: relativeUrl(page, '') },
		]);
		const position = await prepareOrigin(page);
		const sourceUrl = page.url();
		const appearance = await page.locator('html').getAttribute('data-appearance');
		await openSearch(page);
		await expect(page.locator('[data-search-status]')).toContainText('Search is unavailable');
		await page.reload();
		await expect(returnLink(page)).toHaveText('Back to Examples');
		await expect(returnLink(page)).toHaveAttribute('href', new URL(sourceUrl).pathname + new URL(sourceUrl).search + new URL(sourceUrl).hash);
		await expect(returnLink(page)).toBeInViewport();
		const bounds = await returnLink(page).boundingBox();
		expect(bounds!.x).toBeGreaterThanOrEqual(0);
		expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(viewport.width);
		await returnLink(page).focus();
		await page.keyboard.press('Enter');
		await expect(page).toHaveURL(sourceUrl);
		await expect.poll(() => page.evaluate(() => scrollY)).toBeCloseTo(position, 0);
		await expect(searchLink(page)).toBeFocused();
		await expect(page.locator('html')).toHaveAttribute('data-reading-width', 'wide');
		await expect(page.locator('html')).toHaveAttribute('data-focus-reading', 'on');
		await expect(page.locator('html')).toHaveAttribute('data-appearance', appearance!);
		expect((await context.cookies()).find((cookie) => cookie.name === 'norna-appearance')?.value).toBe('dark');
	});
}

test('return remains available while search reports no matching results', async ({ page }) => {
	await page.route('**/pagefind/pagefind-ui.js', (route) => route.fulfill({
		contentType: 'application/javascript',
		body: `window.PagefindUI = class {
			constructor(options) {
				const root = document.querySelector(options.element);
				const input = document.createElement('input');
				input.className = 'pagefind-ui__search-input';
				const status = document.createElement('p');
				status.setAttribute('role', 'status');
				input.addEventListener('input', () => { status.textContent = 'No results found'; });
				root.append(input, status);
			}
		};`,
	}));
	await prepareOrigin(page);
	await openSearch(page);
	await page.getByRole('textbox', { name: 'Search' }).fill('unmatched-query');
	await expect(page.locator('#norna-search').getByRole('status')).toHaveText('No results found');
	await expect(returnLink(page)).toHaveText('Back to Examples');
	await returnLink(page).click();
	await expect(page).toHaveURL(relativeUrl(page, originPath));
});

test('direct visits do not reuse an earlier search origin', async ({ page }) => {
	await prepareOrigin(page);
	await openSearch(page);
	await page.goto('examples/');
	await page.goto('search/');
	await expect(returnLink(page)).toHaveText('Go to the homepage');
	await expect(returnLink(page)).toHaveAttribute('href', new URL(relativeUrl(page, '')).pathname);
	await returnLink(page).click();
	await expect(page).toHaveURL(relativeUrl(page, ''));
});

test('search links in page content also offer a return to their source', async ({ page }) => {
	await page.goto('examples/#search');
	await page.locator('#main-content a[href="/norna/search/"]').click();
	await expect(returnLink(page)).toHaveText('Back to Examples');
	await returnLink(page).click();
	await expect(page).toHaveURL(relativeUrl(page, 'examples/#search'));
});

test('browser Back still returns to the source page', async ({ page }) => {
	const position = await prepareOrigin(page);
	const sourceUrl = page.url();
	await openSearch(page);
	await page.goBack();
	await expect(page).toHaveURL(sourceUrl);
	await expect.poll(() => page.evaluate(() => scrollY)).toBeCloseTo(position, 0);
});

test('modified clicks keep a plain search destination in a new tab', async ({ page, context }) => {
	await prepareOrigin(page);
	const popupPromise = context.waitForEvent('page');
	await searchLink(page).click({ modifiers: ['ControlOrMeta'] });
	const popup = await popupPromise;
	await popup.waitForLoadState();
	await expect(returnLink(popup)).toHaveText('Go to the homepage');
	await expect(popup).toHaveURL(relativeUrl(page, 'search/'));
	await popup.close();
});

test('blocked storage leaves normal search and homepage links usable', async ({ page }) => {
	await page.addInitScript(() => {
		Object.defineProperty(window, 'sessionStorage', { get() { throw new DOMException('Blocked', 'SecurityError'); } });
	});
	await prepareOrigin(page);
	await searchLink(page).click();
	await expect(page).toHaveURL(relativeUrl(page, 'search/'));
	await expect(returnLink(page)).toHaveText('Go to the homepage');
	await returnLink(page).click();
	await expect(page).toHaveURL(relativeUrl(page, ''));
});

test('without JavaScript the search page has a visible homepage exit', async ({ browser, baseURL }) => {
	const context = await browser.newContext({ baseURL, javaScriptEnabled: false, viewport: { width: 390, height: 700 } });
	try {
		const page = await context.newPage();
		await page.goto('search/');
		await expect(returnLink(page)).toHaveText('Go to the homepage');
		await expect(returnLink(page)).toBeInViewport();
		await returnLink(page).click();
		await expect(page).toHaveURL(baseURL!);
	} finally { await context.close(); }
});

for (const [name, value] of [
	['external destination', { href: 'https://elsewhere.example/' }],
	['protocol-relative destination', { href: '//elsewhere.example/' }],
	['outside the site base', { href: '/another-site/' }],
	['search itself', { href: '/norna/search/' }],
	['invalid position', { y: -1 }],
	['unknown visit', { id: 'unmatched' }],
] as const) {
	test(`ignores ${name}`, async ({ page }) => {
		await page.goto('examples/');
		await page.evaluate((override) => {
			const base = document.querySelector<HTMLElement>('[data-search-base]')!.dataset.searchBase;
			sessionStorage.setItem(`norna:search:${base}:departure`, JSON.stringify({
				id: 'test-visit', href: `${base}examples/`, title: 'Examples', x: 0, y: 100, ...override,
			}));
		}, value);
		await page.goto('search/?norna-return=test-visit');
		await expect(page).toHaveURL(relativeUrl(page, 'search/'));
		await expect(returnLink(page)).toHaveText('Go to the homepage');
	});
}

test('page titles are inserted as text and wrap within the viewport', async ({ page }) => {
	await page.setViewportSize({ width: 390, height: 700 });
	await page.goto('examples/');
	const title = '<img src=x onerror=alert(1)> A very long page title with several descriptive words';
	await page.evaluate((title) => {
		const link = document.querySelector<HTMLElement>('.site-search-link')!;
		link.dataset.searchSourceTitle = title;
	}, title);
	await searchLink(page).click();
	await expect(returnLink(page)).toHaveText(`Back to ${title}`);
	await expect(returnLink(page).locator('img')).toHaveCount(0);
	const bounds = await returnLink(page).boundingBox();
	expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(390);
	const heading = await page.locator('#main-content h1').boundingBox();
	expect(heading!.y).toBeGreaterThanOrEqual(bounds!.y + bounds!.height);
});
