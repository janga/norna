import { expect, test, type Page } from '@playwright/test';

// Run against the documentation site with NORNA_NAVIGATION_PROTOTYPE=1.
// Installed browsers are also inspected separately: Playwright WebKit is not Safari.
test.use({ browserName: 'webkit', viewport: { width: 1200, height: 1000 } });
test.skip(process.env.NORNA_NAVIGATION_PROTOTYPE !== '1', 'The navigation prototype is opt-in.');

type MenuFrame = { scroll: number; labels: Record<string, { top: number; weight: string }> };
type ProbeWindow = Window & { menuFrames: MenuFrame[]; sampleMenu: () => MenuFrame | null };

const ready = (page: Page) => page.waitForFunction(() => (
	document.documentElement.hasAttribute('data-navigation-motion-ready')
));
const menu = (page: Page) => page.locator('.tree-local-navigation');
const clickWithoutScrolling = async (page: Page, selector: string) => {
	// The link's left padding can overlap the separate disclosure hit area.
	// Click its actual text, retaining the existing menu/document position.
	const measure = () => page.locator(selector).evaluate((link) => {
		const text = document.createRange();
		text.selectNodeContents(link);
		const bounds = text.getClientRects()[0];
		const x = bounds.left + Math.min(12, bounds.width / 2);
		const y = bounds.top + bounds.height / 2;
		return { x, y, receivesClick: link.contains(document.elementFromPoint(x, y)) };
	});
	// Native transition snapshots temporarily own pointer hit testing.
	await expect.poll(async () => (await measure()).receivesClick, { message: selector }).toBe(true);
	const point = await measure();
	await page.mouse.click(point.x, point.y);
};
const installMenuProbe = async (page: Page) => page.addInitScript(() => {
	const probe = window as unknown as ProbeWindow;
	probe.menuFrames = [];
	probe.sampleMenu = () => {
		const tree = document.querySelector<HTMLElement>('.tree-local-navigation');
		if (!tree) return null;
		const labels: MenuFrame['labels'] = {};
		for (const element of tree.querySelectorAll<HTMLElement>('.navigation-page-link, .navigation-page-summary-title')) {
			if (!element.checkVisibility()) continue;
			const bounds = element.getBoundingClientRect();
			if (bounds.bottom <= 0 || bounds.top >= innerHeight) continue;
			labels[element.textContent!.trim()] = { top: bounds.top, weight: getComputedStyle(element).fontWeight };
		}
		return { scroll: tree.scrollTop, labels };
	};
	const sample = () => {
		const frame = probe.sampleMenu();
		if (frame) probe.menuFrames.push(frame);
		if (performance.now() < 2500) requestAnimationFrame(sample);
	};
	requestAnimationFrame(sample);
});
const assertStableArrival = async (page: Page, before: MenuFrame) => {
	await ready(page);
	const frames = await page.evaluate(() => (window as unknown as ProbeWindow).menuFrames);
	expect(frames.length).toBeGreaterThan(0);
	for (const frame of frames) {
		expect(Math.abs(frame.scroll - before.scroll)).toBeLessThanOrEqual(1);
		for (const [label, previous] of Object.entries(before.labels)) {
			const current = frame.labels[label];
			expect(current, `Missing menu label in an arrival frame: ${label}`).toBeDefined();
			expect(Math.abs(current.top - previous.top), label).toBeLessThanOrEqual(1);
			expect(current.weight, label).toBe(previous.weight);
		}
	}
};

for (const stored of [
	{ name: 'malformed local JSON', local: '{', shared: 'valid', configurationOpen: true, scrollTop: 0 },
	{ name: 'existing null shared JSON', local: 'valid', shared: 'null', configurationOpen: false, scrollTop: 40 },
	{ name: 'numeric string scroll position', local: 'string-scroll', shared: null, configurationOpen: true, scrollTop: 240 },
]) {
	test(`restores ${stored.name} before deferred scripts and keeps it stable afterwards`, async ({ page }) => {
		// Keep section-following in the right rail: this isolates restoration
		// from its deliberate reveal of an off-screen current row in the tree.
		await page.setViewportSize({ width: 1440, height: 700 });
		await page.addInitScript((input) => {
			const value = (scrollTop: number | string) => JSON.stringify({
				openPaths: ['reference', 'reference/site', 'reference/configuration', 'reference/content', 'reference/workflows'],
				sectionOpenByPath: { 'reference/site/pages': false }, scrollTop,
			});
			sessionStorage.setItem('norna:tree-navigation:desktop:/reference/',
				input.local === 'valid' ? value(input.scrollTop) : input.local === 'string-scroll' ? value(String(input.scrollTop)) : input.local);
			if (input.shared !== null) sessionStorage.setItem('norna:tree-navigation:shared:/norna/',
				input.shared === 'valid' ? value(999) : input.shared);
		}, stored);
		let release!: () => void;
		const deferredScripts = new Promise<void>((resolve) => { release = resolve; });
		await page.route('**/*', async (route) => {
			if (route.request().resourceType() === 'script') await deferredScripts;
			await route.continue();
		});
		const snapshot = () => menu(page).evaluate((tree) => ({
			configurationOpen: tree.querySelector<HTMLDetailsElement>('.navigation-page-disclosure[data-page-path="reference/configuration"]')!.open,
			currentOutlineOpen: tree.querySelector<HTMLDetailsElement>('.navigation-page-sections-disclosure[data-page-path="reference/site/pages"]')!.open,
			scrollTop: tree.scrollTop,
		}));
		try {
			await page.goto('reference/site/pages/', { waitUntil: 'commit' });
			// Wait for the last tree node, not deferred initialization. The inline
			// source must have restored all parser additions before this point.
			await menu(page).locator('[data-page-path="reference/workflows/legacy-source"]').first().waitFor({ state: 'attached' });
			await expect(menu(page).locator('[data-tree-controls]')).toHaveAttribute('hidden', '');
			expect(await snapshot()).toEqual({ configurationOpen: stored.configurationOpen, currentOutlineOpen: stored.shared === 'null', scrollTop: stored.scrollTop });
		} finally {
			release();
		}
		await ready(page);
		expect(await snapshot()).toEqual({ configurationOpen: stored.configurationOpen, currentOutlineOpen: stored.shared === 'null', scrollTop: stored.scrollTop });
	});
}

for (const width of [1200, 1440]) {
	test(`keeps the first five menu clicks stable after header navigation at ${width}px`, async ({ page }) => {
		await page.setViewportSize({ width, height: 1000 });
		await installMenuProbe(page);
		const areas = [
			{ header: 'getting-started/install-norna', pages: ['grow-your-site', 'choose-a-theme', 'prepare-your-site', 'build-and-publish', 'install-norna'] },
			{ header: 'faq/installation', pages: ['project-setup', 'content-and-images', 'maintenance-and-publishing', 'installation', 'project-setup'] },
			{ header: 'reference', pages: ['site/files', 'site/pages', 'site/urls', 'site/metadata', 'site/images'] },
		];
		for (const area of areas) {
			await page.goto('reference/site/pages/');
			await ready(page);
			const documents: string[] = [];
			const record = (request: import('@playwright/test').Request) => {
				if (request.isNavigationRequest() && request.frame() === page.mainFrame()) documents.push(request.url());
			};
			page.on('request', record);
			await clickWithoutScrolling(page, `.site-nav a[href$="/${area.header}/"]`);
			await page.waitForURL(`**/${area.header}/`);
			await ready(page);
			page.off('request', record);
			expect(documents).toHaveLength(1);
			const root = area.header.split('/')[0];
			for (const destination of area.pages) {
				const before = await page.evaluate(() => (window as unknown as ProbeWindow).sampleMenu()!);
				await clickWithoutScrolling(page, `.tree-local-navigation a:not(.navigation-category-link)[href$="/${root}/${destination}/"]`);
				await page.waitForURL(`**/${root}/${destination}/`);
				await assertStableArrival(page, before);
			}
		}
	});
}

test('retains a deeply scrolled tree from the first arrival frame', async ({ page }) => {
	await installMenuProbe(page);
	await page.goto('reference/workflows/embedded-publishing/');
	await ready(page);
	await menu(page).locator('[data-tree-expand-all]').click();
	const target = '.tree-local-navigation a[href$="/reference/workflows/upgrading/"]';
	await page.locator(target).evaluate((link) => {
		const tree = document.querySelector<HTMLElement>('.tree-local-navigation')!;
		tree.scrollTop += link.getBoundingClientRect().top - tree.getBoundingClientRect().top - 180;
	});
	const before = await page.evaluate(() => (window as unknown as ProbeWindow).sampleMenu()!);
	expect(before.scroll).toBeGreaterThan(1000);
	await clickWithoutScrolling(page, target);
	await page.waitForURL('**/reference/workflows/upgrading/');
	await assertStableArrival(page, before);
});

test('keeps the activated heading stationary while opening and only clamps at the end when closing', async ({ page }) => {
	await page.goto('reference/configuration/site/');
	await ready(page);
	await menu(page).locator('[data-tree-expand-all]').click();
	const summary = menu(page).locator('[data-page-path="reference/workflows"] > summary');
	await summary.evaluate((element) => { (element.parentElement as HTMLDetailsElement).open = false; });
	await summary.evaluate((element) => {
		const tree = document.querySelector<HTMLElement>('.tree-local-navigation')!;
		tree.scrollTop = tree.scrollHeight;
		element.focus({ preventScroll: true });
	});
	const sampleMotion = () => summary.evaluate(async (element) => {
		const tree = document.querySelector<HTMLElement>('.tree-local-navigation')!;
		const top = element.getBoundingClientRect().top;
		const scroll = tree.scrollTop;
		const frames: { top: number; scroll: number; max: number }[] = [];
		element.click();
		const start = performance.now();
		while (performance.now() - start < 260) {
			await new Promise(requestAnimationFrame);
			frames.push({ top: element.getBoundingClientRect().top, scroll: tree.scrollTop, max: tree.scrollHeight - tree.clientHeight });
		}
		return { top, scroll, frames, focused: document.activeElement === element, open: (element.parentElement as HTMLDetailsElement).open };
	});
	const opened = await sampleMotion();
	expect(opened.open).toBe(true);
	for (const frame of opened.frames) expect(Math.abs(frame.top - opened.top)).toBeLessThanOrEqual(1);
	await summary.evaluate((element) => {
		const tree = document.querySelector<HTMLElement>('.tree-local-navigation')!;
		tree.scrollTop += element.getBoundingClientRect().top - tree.getBoundingClientRect().top - 180;
	});
	const closed = await sampleMotion();
	expect(closed.open).toBe(false);
	expect(closed.focused).toBe(true);
	for (const frame of closed.frames) {
		expect(Math.abs(frame.scroll - Math.min(closed.scroll, frame.max))).toBeLessThanOrEqual(1);
		expect(Math.abs(frame.top - (closed.top + closed.scroll - frame.scroll))).toBeLessThanOrEqual(1);
	}
});

test('reverses disclosure motion and respects reduced motion and keyboard activation', async ({ page }) => {
	await page.goto('reference/site/pages/');
	await ready(page);
	const branch = menu(page).locator('.navigation-category-disclosure[data-page-path="reference/configuration"]');
	const summary = branch.locator(':scope > summary');
	await summary.focus();
	await page.keyboard.press('Enter');
	await page.keyboard.press('Space');
	await expect(branch).not.toHaveAttribute('open', '');
	await expect(summary).toBeFocused();
	await expect(branch).not.toHaveAttribute('data-navigation-motion-open');
	await page.emulateMedia({ reducedMotion: 'reduce' });
	await page.keyboard.press('Enter');
	await expect(branch).toHaveAttribute('open', '');
	await expect(branch).not.toHaveAttribute('data-navigation-motion-open');
	expect(await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior)).toBe('auto');
});

test('restores the filter snapshot and shares disclosure choices between desktop and mobile', async ({ page }) => {
	await page.goto('reference/site/pages/');
	await ready(page);
	const selector = '.navigation-category-disclosure[data-page-path="reference/configuration"]';
	const desktopBranch = menu(page).locator(selector);
	await desktopBranch.locator(':scope > summary').focus();
	await page.keyboard.press('Enter');
	await expect(desktopBranch).toHaveAttribute('open', '');
	await expect(desktopBranch).not.toHaveAttribute('data-navigation-motion-open');
	const snapshot = () => menu(page).evaluate((tree) => [...tree.querySelectorAll<HTMLDetailsElement>('details[data-page-path]')]
		.map((branch) => ({ path: branch.dataset.pagePath, open: branch.open })));
	const before = await snapshot();
	const filter = menu(page).locator('[data-tree-filter]');
	await filter.fill('metadata');
	await expect(menu(page).getByRole('link', { name: 'Page metadata', exact: true })).toBeVisible();
	await filter.press('Escape');
	expect(await snapshot()).toEqual(before);
	await page.setViewportSize({ width: 390, height: 844 });
	const compact = page.locator('.mobile-nav-menu');
	await compact.locator(':scope > summary').click();
	const mobileBranch = compact.locator(selector);
	await expect(mobileBranch).toHaveAttribute('open', '');
	await mobileBranch.locator(':scope > summary').focus();
	await page.keyboard.press('Enter');
	await expect(mobileBranch).not.toHaveAttribute('open', '');
	await expect(desktopBranch).not.toHaveAttribute('open', '');
	await page.setViewportSize({ width: 1200, height: 1000 });
	await expect(desktopBranch).not.toHaveAttribute('open', '');
});

test('prefetches only an eligible page after intent', async ({ page, baseURL }) => {
	const prefetched: string[] = [];
	page.on('request', (request) => {
		const url = new URL(request.url());
		if (!request.isNavigationRequest() && url.origin === new URL(baseURL!).origin && url.pathname.endsWith('/')) {
			prefetched.push(url.pathname);
		}
	});
	await page.goto('reference/site/pages/');
	await ready(page);
	await page.waitForTimeout(180);
	expect(prefetched).toEqual([]);
	await menu(page).locator('a[href$="/reference/site/urls/"]').hover();
	await expect.poll(() => prefetched).toEqual([new URL('reference/site/urls/', baseURL).pathname]);
});

test('keeps category destinations and native disclosures usable without JavaScript', async ({ browser, baseURL }) => {
	const context = await browser.newContext({ javaScriptEnabled: false, baseURL, viewport: { width: 1200, height: 1000 } });
	try {
		const page = await context.newPage();
		await page.goto('reference/site/pages/');
		await page.locator('.site-nav a[href$="/getting-started/install-norna/"]').click();
		await expect(page).toHaveURL(/\/getting-started\/install-norna\/$/);
		await expect(page.locator('h1')).toHaveText('Install Norna');
		const outline = menu(page).locator('.navigation-page-sections-disclosure[data-current-page="true"]');
		await outline.locator('summary').click();
		await expect(outline).not.toHaveAttribute('open', '');
	} finally {
		await context.close();
	}
});

test('aligns a direct fragment below the sticky header', async ({ page }) => {
	await page.goto('reference/site/pages/#names-and-order');
	await ready(page);
	const offset = await page.evaluate(() => document.getElementById('names-and-order')!.getBoundingClientRect().top
		- Math.ceil(document.querySelector('.site-top')!.getBoundingClientRect().height));
	expect(Math.abs(offset)).toBeLessThanOrEqual(1);
});

for (const width of [1440, 390]) {
	test(`separates category links from disclosure controls at ${width}px`, async ({ page }) => {
		await page.setViewportSize({ width, height: 920 });
		await page.goto('reference/site/files/');
		await ready(page);
		const tree = width < 600 ? page.locator('.mobile-site-nav') : menu(page);
		if (width < 600) await page.locator('.mobile-nav-menu > summary').click();
		const category = tree.locator('.navigation-category-disclosure[data-page-path="reference/configuration"]');
		const summary = category.locator(':scope > summary');
		await summary.locator('.navigation-page-chevron').click();
		await expect(category).toHaveAttribute('open', '');
		await expect(category).not.toHaveAttribute('data-navigation-motion-open');
		await summary.focus();
		await page.keyboard.press('Space');
		await expect(category).not.toHaveAttribute('open', '');
		await expect(page).toHaveURL(/\/reference\/site\/files\/$/);
		await summary.locator('.navigation-category-link').focus();
		await page.keyboard.press('Enter');
		await expect(page).toHaveURL(/\/reference\/configuration\/site\/$/);
		await ready(page);
		expect(await page.evaluate(() => scrollY)).toBe(0);
	});
}

test('opens generated category-overview links without a redirect document', async ({ page }) => {
	for (const destination of ['site/files', 'configuration/site']) {
		await page.goto('reference/');
		await ready(page);
		const documents: string[] = [];
		const record = (request: import('@playwright/test').Request) => {
			if (request.isNavigationRequest() && request.frame() === page.mainFrame()) documents.push(request.url());
		};
		page.on('request', record);
		await page.locator(`.child-page-list a[href$="/reference/${destination}/"]`).click();
		await page.waitForURL(`**/reference/${destination}/`);
		await ready(page);
		page.off('request', record);
		expect(documents).toHaveLength(1);
	}
});

test('covers scrolled menu rows above the sticky filter', async ({ page }) => {
	await page.goto('reference/site/files/#page-folders');
	await ready(page);
	await menu(page).locator('[data-tree-expand-all]').click();
	const covered = await menu(page).evaluate((tree) => {
		tree.scrollTop = 300;
		const bounds = tree.getBoundingClientRect();
		const hit = document.elementFromPoint(bounds.left + 70, bounds.top + 8);
		return tree.querySelector('[data-tree-controls]')!.contains(hit);
	});
	expect(covered).toBe(true);
});

test('keeps the last menu row reachable with notices and while scrolling the article', async ({ page }) => {
	await page.setViewportSize({ width: 1440, height: 920 });
	await page.goto('reference/workflows/legacy-source/');
	await ready(page);
	await menu(page).locator('[data-tree-expand-all]').click();
	const checkEnd = () => menu(page).evaluate((tree) => {
		tree.scrollTop = tree.scrollHeight;
		const links = [...tree.querySelectorAll('a')].filter((link) => link.checkVisibility());
		const last = links.at(-1)!;
		return {
			height: tree.getBoundingClientRect().height,
			bottom: tree.getBoundingClientRect().bottom,
			lastBottom: last.getBoundingClientRect().bottom,
			viewport: innerHeight,
		};
	});
	const before = await checkEnd();
	expect(before.bottom).toBeLessThanOrEqual(before.viewport);
	expect(before.lastBottom).toBeLessThanOrEqual(before.viewport);
	await page.evaluate(() => scrollTo({ top: 400, behavior: 'instant' }));
	const after = await checkEnd();
	expect(after.height).toBe(before.height);
	expect(after.lastBottom).toBeLessThanOrEqual(after.viewport);
	await page.locator('[data-dismiss-banner]').click();
	await expect.poll(async () => (await checkEnd()).height).toBeGreaterThan(before.height);
	const dismissed = await checkEnd();
	expect(dismissed.lastBottom).toBeLessThanOrEqual(dismissed.viewport);
});

test('keeps prose links, cross-page fragments and external new-tab navigation usable', async ({ page, context }) => {
	await page.goto('reference/site/files/');
	await ready(page);
	await page.locator('#main-content').getByRole('link', { name: 'Pages and categories', exact: true }).click();
	await expect(page).toHaveURL(/\/reference\/site\/pages\/$/);
	await ready(page);
	await page.goto('reference/site/files/');
	await ready(page);
	await page.locator('#main-content').getByRole('link', { name: 'limited inherited overrides', exact: true }).click();
	await expect(page).toHaveURL(/\/reference\/configuration\/theme\/#page-themes$/);
	await ready(page);
	await expect.poll(() => page.evaluate(() => Math.abs(
		document.getElementById('page-themes')!.getBoundingClientRect().top
		- Math.ceil(document.querySelector('.site-top')!.getBoundingClientRect().height),
	))).toBeLessThanOrEqual(1);

	// Test the browser contract deterministically, without depending on GitHub uptime.
	const external = 'https://github.com/janga/norna/blob/main/editors/vscode/README.md#extension-development';
	const requested: string[] = [];
	await context.route('https://github.com/**', (route) => {
		requested.push(route.request().url());
		return route.fulfill({ contentType: 'text/html', body: '<title>External test destination</title>' });
	});
	await page.goto('reference/workflows/editor/');
	await ready(page);
	const link = page.locator('#main-content a').filter({ hasText: 'contributor task' });
	await expect(link).toHaveAttribute('href', external);
	await link.hover();
	await page.waitForTimeout(180);
	expect(requested).toEqual([]);
	const popupPromise = context.waitForEvent('page');
	await link.click({ modifiers: [process.platform === 'darwin' ? 'Meta' : 'Control'] });
	const popup = await popupPromise;
	await popup.waitForLoadState();
	await expect(popup).toHaveURL(external);
	await expect(page).toHaveURL(/\/reference\/workflows\/editor\/$/);
	await popup.close();
});

test('preserves a reader interruption while initial arrival waits for fonts', async ({ page }) => {
	await page.addInitScript(() => {
		const fonts = document.fonts.ready;
		const gate = new Promise<void>((resolve) => {
			(window as Window & { releaseNavigationFonts?: () => void }).releaseNavigationFonts = resolve;
		});
		Object.defineProperty(document.fonts, 'ready', { get: () => Promise.all([fonts, gate]) });
	});
	await page.goto('reference/site/pages/#names-and-order');
	await page.mouse.click(650, 450);
	await page.evaluate(() => scrollBy({ top: 180, behavior: 'instant' }));
	const position = await page.evaluate(() => scrollY);
	await page.evaluate(() => (window as Window & { releaseNavigationFonts?: () => void }).releaseNavigationFonts!());
	await ready(page);
	expect(Math.abs(await page.evaluate(() => scrollY) - position)).toBeLessThanOrEqual(1);
	expect(await page.evaluate(() => history.scrollRestoration)).toBe('auto');
});

test('restores the reading position when returning from search', async ({ page }) => {
	await page.setViewportSize({ width: 1440, height: 1000 });
	await page.goto('reference/site/pages/#names-and-order');
	await ready(page);
	await page.evaluate(() => scrollBy({ top: 220, behavior: 'instant' }));
	const position = await page.evaluate(() => scrollY);
	const search = await page.locator('.site-search-link').boundingBox();
	expect(search).not.toBeNull();
	await page.mouse.click(search!.x + search!.width / 2, search!.y + search!.height / 2);
	const returnLink = page.locator('[data-search-return]');
	await expect(returnLink).toContainText('Pages and categories');
	await returnLink.click();
	await ready(page);
	await expect.poll(async () => Math.abs(await page.evaluate(() => scrollY) - position)).toBeLessThanOrEqual(1);
	expect(await page.evaluate(() => history.scrollRestoration)).toBe('auto');
});

for (const reducedMotion of ['no-preference', 'reduce'] as const) {
	test(`restores a reading position past the original fragment on Back and Forward with ${reducedMotion}`, async ({ page }) => {
		await page.emulateMedia({ reducedMotion });
		await page.setViewportSize({ width: 1440, height: 1000 });
		await page.goto('reference/site/pages/#names-and-order');
		await ready(page);
		await page.evaluate(() => scrollBy({ top: 220, behavior: 'instant' }));
		const before = await page.evaluate(() => scrollY);
		await clickWithoutScrolling(page, '.tree-local-navigation a[href$="/reference/site/urls/"]');
		await page.waitForURL('**/reference/site/urls/');
		await ready(page);
		await page.evaluate(() => scrollBy({ top: 180, behavior: 'instant' }));
		const forwardPosition = await page.evaluate(() => scrollY);
		expect(forwardPosition).toBeGreaterThan(0);
		for (let visit = 0; visit < 2; visit++) {
			await page.goBack();
			await ready(page);
			expect(Math.abs(await page.evaluate(() => scrollY) - before)).toBeLessThanOrEqual(1);
			expect(await page.evaluate(() => history.scrollRestoration)).toBe('auto');
			await page.goForward();
			await ready(page);
			expect(Math.abs(await page.evaluate(() => scrollY) - forwardPosition)).toBeLessThanOrEqual(1);
			expect(await page.evaluate(() => history.scrollRestoration)).toBe('auto');
		}
	});
}
