import { expect, test, type Page, type Locator } from '@playwright/test';

// Documentation-site trial. Installed Safari is assessed separately.
test.use({ browserName: 'webkit', viewport: { width: 1440, height: 1000 } });
const ready = async (page: Page) => {
	await expect(page.locator('html')).toHaveAttribute('data-area-navigation', '');
	await page.waitForFunction(() => document.documentElement.hasAttribute('data-navigation-motion-ready'));
};
const tree = (page: Page) => page.locator('.tree-local-navigation');
const openPage = async (page: Page, path: string) => {
	await page.goto(path);
	await ready(page);
};
const clickText = async (page: Page, selector: string) => {
	const point = await page.locator(selector).evaluate((element) => {
		const range = document.createRange();
		range.selectNodeContents(element);
		const rect = range.getClientRects()[0];
		return { x: rect.left + Math.min(12, rect.width / 2), y: rect.top + rect.height / 2 };
	});
	await page.mouse.click(point.x, point.y);
};
const clickVisibleControl = async (control: Locator) => {
	await expect(control).toBeVisible();
	const box = (await control.boundingBox())!;
	await control.page().mouse.click(box.x + box.width / 2, box.y + box.height / 2);
};
const openReadingMenu = (page: Page) => clickVisibleControl(page.locator('[data-area-switcher] > summary'));
const referenceAreas = ['site', 'configuration', 'content', 'commands', 'reader', 'workflows'] as const;

test('keeps the reading frame stable and restores the global Home navigation', async ({ page }) => {
	const snapshot = () => page.locator('.site-top').evaluate(header =>
		[header, ...header.querySelectorAll<HTMLElement>(
			'.site-nav-row, .site-brand, .site-nav > ul > li, .site-search-link, .display-settings > summary, .mobile-nav-menu > summary, .site-reading-location, [data-area-switcher] > summary',
		)].filter(element => element.checkVisibility()).map(element => {
			const { x, y, width, height } = element.getBoundingClientRect();
			return { x, y, width, height };
		}));
	for (const width of [1440, 1024, 390]) {
		await page.setViewportSize({ width, height: 1000 });
		await openPage(page, './');
		await page.evaluate(() => document.fonts.ready);
		const homePath = new URL(page.url()).pathname;
		const home = await snapshot();
		if (width < 961) {
			await clickVisibleControl(page.locator('.mobile-nav-menu > summary'));
			await page.locator('.mobile-site-nav a[href$="/features/"]').click();
		} else {
			await page.locator('.site-nav > ul > li > a[href$="/features/"]').click();
		}
		await page.waitForURL('**/features/');
		await ready(page);
		await page.evaluate(() => document.fonts.ready);
		await expect(page.locator('html')).toHaveAttribute('data-area-reading-frame', '');
		await expect(page.locator('.site-nav')).toHaveCount(0);
		const reading = await snapshot();
		await openPage(page, 'reference/site/files/');
		expect(await snapshot(), `Reading frame at ${width}px`).toEqual(reading);
		await page.locator('.site-brand').click();
		await page.waitForURL(url => url.pathname === homePath);
		await ready(page);
		expect(await snapshot(), `Return to Home at ${width}px`).toEqual(home);
	}
});

test('keeps breadcrumbs and their menu sticky while preserving anchor clearance', async ({ page }) => {
	await page.setViewportSize({ width: 1024, height: 900 });
	await openPage(page, 'reference/site/files/');
	const header = page.locator('.site-top');
	const before = await header.boundingBox();
	await expect(page.locator('.site-reading-location .site-breadcrumbs li')).toHaveText(['Reference', 'Site model', 'Site files']);
	await expect(page.locator('main > .site-breadcrumbs')).toBeHidden();
	await expect(tree(page).locator('.navigation-area-title')).toHaveText('Site model');
	await tree(page).locator('a[href="#page-folders"]').click();
	await expect.poll(() => page.evaluate(() => Math.abs(document.getElementById('page-folders')!.getBoundingClientRect().top
		- document.querySelector('.site-top')!.getBoundingClientRect().bottom))).toBeLessThanOrEqual(1);
	expect(await header.boundingBox()).toEqual(before);
	const articlePosition = await page.evaluate(() => scrollY);
	await openReadingMenu(page);
	const panel = page.locator('[data-area-switcher] .area-navigation-panel');
	await expect(panel).toBeVisible();
	const box = (await panel.boundingBox())!;
	expect(box.x).toBeGreaterThanOrEqual(0);
	expect(box.x + box.width).toBeLessThanOrEqual(1024);
	expect(await page.evaluate(() => scrollY)).toBe(articlePosition);
	await page.keyboard.press('Escape');
	await expect(panel).toBeHidden();
	await openPage(page, 'getting-started/install-norna/');
	await expect(tree(page).locator('.navigation-area-title')).toHaveCount(0);
	await page.setViewportSize({ width: 390, height: 844 });
	await expect(page.locator('.site-reading-location')).toBeHidden();
	await expect(page.locator('main > .site-breadcrumbs')).toBeVisible();
});

test('keeps site search and Display reachable in the reading frame without a page outline', async ({ page }) => {
	await openPage(page, 'reference/site/files/');
	await page.locator('.site-search-link').click();
	await page.waitForURL('**/search/**');
	await ready(page);
	await expect(page.locator('html')).toHaveAttribute('data-area-reading-frame', '');
	await expect(page.locator('.site-nav, .tree-local-navigation')).toHaveCount(0);
	await expect(page.locator('.site-reading-location')).toContainText('Search');
	await expect(page.locator('h1')).toHaveText('Search');
	await expect(page.locator('[data-search-return]')).toHaveAttribute('href', /\/reference\/site\/files\/$/);
	await clickVisibleControl(page.locator('[data-display-settings] > summary'));
	await expect(page.locator('.display-settings-panel')).toBeVisible();
	await page.keyboard.press('Escape');
	await openReadingMenu(page);
	await expect(page.locator('[data-area-switcher] .area-navigation-other-roots a')).toHaveText([
		'Home', 'What Norna Does', 'Getting Started', 'Examples', 'Reference', 'FAQ', 'Resources',
	]);
	await page.locator('[data-area-switcher] a[href$="/reference/"]').click();
	await ready(page);
	await expect(tree(page)).toHaveAttribute('data-navigation-area', 'reference');
});

test('aligns sticky text and keeps hover menus reachable and dismissible without moving focus', async ({ page }) => {
	await openPage(page, './');
	for (const width of [1440, 1024]) {
		await page.setViewportSize({ width, height: 1000 });
		const textTops = await page.locator('.site-nav > ul > li').evaluateAll(items => items.map(item => {
			const label = item.querySelector(':scope > a, .top-page-menu-title')!;
			const range = document.createRange(); range.selectNodeContents(label);
			return range.getBoundingClientRect().top;
		}));
		expect(Math.max(...textTops) - Math.min(...textTops)).toBeLessThanOrEqual(0.5);
	}
	const menu = page.locator('[data-area-menu="reference"]');
	const trigger = menu.locator('summary');
	await expect(trigger.locator('svg')).toHaveCount(0);
	const triggerBox = await trigger.boundingBox();
	await trigger.hover();
	await expect(menu).toHaveAttribute('open', '');
	expect(await trigger.boundingBox()).toEqual(triggerBox);
	expect(await trigger.evaluate(e => getComputedStyle(e).textDecorationLine)).toBe('none');
	expect(await menu.evaluate(e => e.contains(document.activeElement))).toBe(false);
	await page.keyboard.press('Escape');
	await page.waitForTimeout(240);
	await expect(menu).not.toHaveAttribute('open', '');
	await page.mouse.move(20, 500);
	await trigger.hover();
	await expect(menu).toHaveAttribute('open', '');
	await trigger.click();
	await expect(menu).toHaveAttribute('open', '');
	await menu.locator('[data-area-choice="reference/site"]').hover();
	await page.waitForTimeout(240);
	await expect(menu).toHaveAttribute('open', '');
	expect(await trigger.evaluate(e => getComputedStyle(e, '::before').backgroundColor)).not.toBe('rgba(0, 0, 0, 0)');
	await page.mouse.move(20, 500);
	await expect(menu).not.toHaveAttribute('open', '');
});

test('separates parent destinations from plain links while flat pages keep their parent context', async ({ page }) => {
	await openPage(page, './');
	const menu = page.locator('[data-area-menu="resources"], [data-area-switcher]');
	await menu.locator('summary').hover();
	await expect(menu).toHaveAttribute('open', '');
	await expect(menu.locator('[data-area-choice-group="branches"] a')).toHaveCount(1);
	await expect(menu.locator('[data-area-choice-group="branches"] .area-navigation-description')).toBeVisible();
	await expect(menu.locator('[data-area-choice-group="pages"] a')).toHaveCount(1);
	await expect(menu.locator('[data-area-choice-group="pages"] .area-navigation-description')).toHaveCount(0);
	await menu.locator('[data-area-choice="resources"]').click();
	await ready(page);
	await expect(tree(page)).toHaveAttribute('data-navigation-area', 'resources');
	await openReadingMenu(page);
	await menu.locator('[data-area-choice="resources/capabilities"]').click();
	await ready(page);
	await expect(tree(page)).toHaveAttribute('data-navigation-area', 'resources');
	await expect(tree(page).locator('a[href="/norna/resources/"]')).toBeVisible();
});

test('keeps menus open while crossing slowly and diagonally from their titles', async ({ page }) => {
	await openPage(page, './');
	for (const width of [1440, 1024]) {
		await page.setViewportSize({ width, height: 1000 });
		for (const name of ['reference', 'getting-started']) {
			await page.mouse.move(20, 500);
			const menu = page.locator(`[data-area-menu="${name}"]`);
			await menu.locator('summary').hover();
			await expect(menu).toHaveAttribute('open', '');
			const geometry = await menu.evaluate(element => ({
				trigger: element.querySelector('summary')!.getBoundingClientRect().toJSON(),
				panel: element.querySelector('.top-page-panel')!.getBoundingClientRect().toJSON(),
			}));
			const x = geometry.trigger.left + geometry.trigger.width / 2;
			expect(geometry.panel.left).toBeLessThanOrEqual(x);
			expect(geometry.panel.right).toBeGreaterThanOrEqual(x);
			await page.mouse.move(x, (geometry.trigger.bottom + geometry.panel.top) / 2, { steps: 10 });
			// A fast locator hover skips the header padding that exposed this bug.
			await page.waitForTimeout(700);
			await expect(menu).toHaveAttribute('open', '');
			const choice = await menu.locator('[data-area-choice]').first().boundingBox();
			await page.mouse.move(choice!.x + choice!.width / 2, choice!.y + choice!.height / 2, { steps: 10 });
			await page.waitForTimeout(240);
			await expect(menu).toHaveAttribute('open', '');
		}
	}
});

test('presents flat collections in columns and keeps an open panel aligned after resizing', async ({ page }) => {
	await openPage(page, './');
	for (const [name, columns] of [['getting-started', 3], ['faq', 2]] as const) {
		const menu = page.locator(`[data-area-menu="${name}"]`);
		await menu.locator('summary').focus();
		await page.keyboard.press('ArrowDown');
		await expect(menu).toHaveAttribute('open', '');
		const positions = await menu.locator('[data-area-choice]').evaluateAll(links =>
			links.map(link => link.getBoundingClientRect().left));
		expect(new Set(positions).size).toBe(columns);
		for (const width of [1024, 1440]) {
			await page.setViewportSize({ width, height: 1000 });
			await expect.poll(() => menu.evaluate(element => {
				const trigger = element.querySelector('summary')!.getBoundingClientRect();
				const panel = element.querySelector('.top-page-panel')!.getBoundingClientRect();
				const center = trigger.left + trigger.width / 2;
				return panel.left >= 15.5 && panel.right <= document.documentElement.clientWidth - 15.5
					&& panel.left <= center && panel.right >= center;
			})).toBe(true);
		}
		await page.keyboard.press('Escape');
	}
});

test('retains touch activation of desktop menu titles without requiring hover', async ({ browser, baseURL }) => {
	const context = await browser.newContext({ baseURL, viewport: { width: 1440, height: 1000 }, hasTouch: true });
	try {
		const page = await context.newPage();
		await openPage(page, './');
		await page.locator('[data-area-menu="reference"] summary').tap();
		await page.waitForTimeout(700);
		await expect(page.locator('[data-area-choice="reference/site"]')).toBeVisible();
		await page.locator('[data-area-choice="reference/configuration"]').tap();
		await page.waitForURL('**/reference/configuration/site/');
		await ready(page);
		await expect(tree(page)).toHaveAttribute('data-navigation-area', 'reference/configuration');
	} finally { await context.close(); }
});

test('offers equal immediate area choices and resolves the same scope on menu and direct arrival', async ({ page }) => {
	for (const area of referenceAreas) {
		await openPage(page, 'reference/');
		await openReadingMenu(page);
		const choices = page.locator('[data-area-switcher] [data-area-choice]');
		await expect(choices).toHaveCount(6);
		const layout = await choices.evaluateAll(links => links.map(link => {
			const box = link.getBoundingClientRect();
			return { x: box.x, y: box.y };
		}));
		expect(new Set(layout.map(({ x }) => x)).size).toBe(3);
		expect(new Set(layout.map(({ y }) => y)).size).toBe(2);
		const href = await page.locator(`[data-area-choice="reference/${area}"]`).getAttribute('href');
		await page.locator(`[data-area-choice="reference/${area}"]`).click();
		await page.waitForURL(url => url.pathname === href);
		await ready(page);
		await expect(tree(page)).toHaveAttribute('data-navigation-area', `reference/${area}`);
		await expect(page.locator('.page-contents-navigation')).toHaveCount(0);
		await page.reload();
		await ready(page);
		await expect(tree(page)).toHaveAttribute('data-navigation-area', `reference/${area}`);
		await openReadingMenu(page);
		await expect(page.locator(`[data-area-choice="reference/${area}"]`)).toHaveAttribute('aria-current', 'true');
	}
});

for (const [menu, slugs] of [
	['getting-started', ['install-norna', 'grow-your-site', 'choose-a-theme', 'prepare-your-site', 'build-and-publish']],
	['faq', ['installation', 'project-setup', 'content-and-images', 'maintenance-and-publishing']],
] as const) {
	test(`keeps ${menu} siblings and their H2 together on direct, sticky and fragment arrivals`, async ({ page }) => {
		const path = `${menu}/${slugs[0]}/`;
		await openPage(page, path);
		const siblings = slugs.map(slug => new URL(`../${slug}/`, page.url()).pathname);
		const pageLinks = tree(page).locator(':scope > nav > ul > li > .navigation-page-link');
		await expect(tree(page)).toHaveAttribute('data-navigation-area', menu);
		expect(await pageLinks.evaluateAll(links => links.map(a => a.getAttribute('href')))).toEqual(siblings);
		const current = tree(page).locator(`details[data-page-path="${menu}/${slugs[0]}"]`);
		await expect(current).toHaveAttribute('open', '');
		await expect(tree(page).locator('details[open]')).toHaveCount(1);
		const headings = await page.locator('main h2[id]').evaluateAll(elements => elements.map(e => `#${e.id}`));
		expect(await current.locator('.page-contents-links a').evaluateAll(links => links.map(a => a.getAttribute('href')))).toEqual(headings);
		await expect(tree(page).locator('.page-contents-links ol')).toHaveCount(0);
		const other = tree(page).locator(`details[data-page-path="${menu}/${slugs[1]}"]`);
		await other.locator('summary').click();
		await expect(current).toHaveAttribute('open', '');
		const sectionLink = other.locator('.page-contents-links a').first();
		const sectionHref = await sectionLink.getAttribute('href');
		await sectionLink.click();
		await page.waitForURL(url => `${url.pathname}${url.hash}` === sectionHref);
		await ready(page);
		await expect(tree(page)).toHaveAttribute('data-navigation-area', menu);
		expect(await pageLinks.evaluateAll(links => links.map(a => a.getAttribute('href')))).toEqual(siblings);
		await page.reload();
		await ready(page);
		await expect(tree(page)).toHaveAttribute('data-navigation-area', menu);
		const beforeMenu = page.url();
		await openReadingMenu(page);
		await expect(page).toHaveURL(beforeMenu);
		const last = page.locator('[data-area-switcher] [data-area-choice]').last();
		await expect(last).toBeVisible();
		const href = await last.getAttribute('href');
		await last.click();
		await page.waitForURL(url => url.pathname === href);
		await ready(page);
		await expect(tree(page)).toHaveAttribute('data-navigation-area', menu);
		expect(await pageLinks.evaluateAll(links => links.map(a => a.getAttribute('href')))).toEqual(siblings);
	});
}

test('keeps the root overview and standalone destinations distinct from flat collections', async ({ page }) => {
	await openPage(page, 'reference/');
	await expect(tree(page)).toHaveAttribute('data-navigation-area', 'reference');
	await openPage(page, './');
	await expect(tree(page)).toHaveCount(0);
	const examples = page.locator('.site-nav > ul > li > a[href$="/examples/"]');
	await expect(examples).toBeVisible();
	await expect(examples.locator('..').locator('summary')).toHaveCount(0);
	await examples.click();
	await page.waitForURL('**/examples/');
	await ready(page);
	await expect(tree(page).locator('.navigation-page-tree')).toHaveCount(0);
});

test('discloses another page H2 independently and follows its fragment without H3 menu levels', async ({ page }) => {
	await openPage(page, 'reference/site/files/');
	const other = tree(page).locator('details[data-page-path="reference/site/pages"]');
	await other.locator('summary').click();
	await expect(other).toHaveAttribute('open', '');
	await expect(tree(page).locator('details[data-page-path="reference/site/files"]')).toHaveAttribute('open', '');
	await other.locator('a[href$="#names-and-order"]').click();
	await page.waitForURL('**/pages/#names-and-order');
	await ready(page);
	await expect(tree(page).locator('.page-contents-links ol')).toHaveCount(0);
	await expect.poll(() => page.evaluate(() => Math.abs(document.getElementById('names-and-order')!.getBoundingClientRect().top
		- Math.ceil(document.querySelector('.site-top')!.getBoundingClientRect().height)))).toBeLessThanOrEqual(1);
});

test('a page choice reopens its outline from sticky navigation and from its own name', async ({ page }) => {
	await openPage(page, 'getting-started/install-norna/');
	const current = tree(page).locator('details[data-page-path="getting-started/install-norna"]');
	const other = tree(page).locator('details[data-page-path="getting-started/grow-your-site"]');
	await other.locator('summary').click();
	await expect(other).toHaveAttribute('open', '');
	await current.locator('summary').click();
	await expect(current).not.toHaveAttribute('open', '');
	await openReadingMenu(page);
	await page.locator('.area-navigation-other-roots a[href$="/examples/"]').click();
	await page.waitForURL('**/examples/');
	await ready(page);
	await page.locator('.site-brand').click();
	await ready(page);
	await page.locator('[data-area-menu="getting-started"] > summary').click();
	await page.locator('[data-area-choice="getting-started/install-norna"]').click();
	await page.waitForURL('**/getting-started/install-norna/');
	await ready(page);
	await expect(current).toHaveAttribute('open', '');
	await expect(other).toHaveAttribute('open', '');
	await current.locator('summary').click();
	await expect(current).not.toHaveAttribute('open', '');
	const selector = '.tree-local-navigation a[href$="/getting-started/install-norna/"]:not(.navigation-area-title)';
	const before = await page.locator(selector).boundingBox();
	await Promise.all([page.waitForEvent('load'), clickText(page, selector)]);
	await ready(page);
	await expect(current).toHaveAttribute('open', '');
	await expect(other).toHaveAttribute('open', '');
	expect(Math.abs((await page.locator(selector).boundingBox())!.y - before!.y)).toBeLessThanOrEqual(1);
});

test('history restores closed current outlines and deep menu positions independently for each entry', async ({ page }) => {
	await page.setViewportSize({ width: 1440, height: 920 });
	await openPage(page, 'reference/configuration/site/');
	await tree(page).locator('[data-tree-expand-all]').click();
	await tree(page).evaluate(nav => {
		for (const path of ['reference/configuration/site', 'reference/configuration/shared-content']) {
			nav.querySelector<HTMLDetailsElement>(`details[data-page-path="${path}"]`)!.open = false;
		}
		nav.scrollTop = nav.scrollHeight;
	});
	const snapshot = () => tree(page).evaluate(nav => ({
		open: [...nav.querySelectorAll<HTMLDetailsElement>('details[open]')].map(e => e.dataset.pagePath),
		scroll: nav.scrollTop, article: scrollY,
	}));
	const before = await snapshot();
	const selector = '.tree-local-navigation a[href$="/reference/configuration/shared-content/"]';
	const row = await page.locator(selector).boundingBox();
	await clickText(page, selector);
	await page.waitForURL('**/reference/configuration/shared-content/');
	await ready(page);
	await expect(tree(page).locator('details[data-page-path="reference/configuration/shared-content"]')).toHaveAttribute('open', '');
	expect(Math.abs((await page.locator(selector).boundingBox())!.y - row!.y)).toBeLessThanOrEqual(1);
	await page.evaluate(() => scrollTo({ top: 250, behavior: 'instant' }));
	await expect.poll(() => page.evaluate(() => scrollY)).toBe(250);
	const after = await snapshot();
	await page.goBack();
	await ready(page);
	await expect.poll(snapshot).toEqual(before);
	await page.goForward();
	await ready(page);
	await expect.poll(snapshot).toEqual(after);
});

test('opens the selected outline before deferred scripts while retaining other scoped choices', async ({ page }) => {
	await page.setViewportSize({ width: 1440, height: 600 });
	await page.addInitScript(() => {
		const state = JSON.stringify({ openPaths: [], sectionOpenByPath: {
			'reference/site/files': true, 'reference/site/pages': true, 'reference/site/urls': false,
		}, scrollTop: 70 });
		sessionStorage.setItem('norna:tree-navigation:desktop:area:/reference/site/', state);
		sessionStorage.setItem('norna:tree-navigation:shared:area:/norna/', state);
	});
	let release!: () => void;
	const gate = new Promise<void>(resolve => { release = resolve; });
	await page.route('**/*', async route => {
		if (route.request().resourceType() === 'script') await gate;
		await route.continue();
	});
	const snapshot = () => tree(page).evaluate(element => ({
		scroll: element.scrollTop,
		open: [...element.querySelectorAll<HTMLDetailsElement>('details[open]')].map(branch => branch.dataset.pagePath),
	}));
	let before;
	try {
		await page.goto('reference/site/urls/', { waitUntil: 'commit' });
		await tree(page).locator('details[data-page-path="reference/site/requirements"]').waitFor({ state: 'attached' });
		before = await snapshot();
		expect(before).toEqual({ scroll: 70, open: ['reference/site/files', 'reference/site/pages', 'reference/site/urls'] });
	} finally { release(); }
	await ready(page);
	expect(await snapshot()).toEqual(before);
});

test('reveals a direct destination in a short viewport before deferred scripts can follow headings', async ({ page }) => {
	await page.setViewportSize({ width: 1440, height: 650 });
	let release!: () => void;
	const gate = new Promise<void>(resolve => { release = resolve; });
	await page.route('**/*', async route => {
		if (route.request().resourceType() === 'script') await gate;
		await route.continue();
	});
	const measure = () => tree(page).evaluate(nav => {
		const row = nav.querySelector('.navigation-page-node-current > .navigation-page-link')!.getBoundingClientRect();
		return { row: row.top, bottom: row.bottom, scroll: nav.scrollTop,
			top: nav.querySelector('[data-tree-controls]')!.getBoundingClientRect().bottom,
			limit: nav.getBoundingClientRect().bottom };
	});
	let before;
	try {
		await page.goto('reference/configuration/shared-content/', { waitUntil: 'commit' });
		await page.locator('#norna-navigation-ready').waitFor({ state: 'attached' });
		before = await measure();
		expect(before.row).toBeGreaterThanOrEqual(before.top);
		expect(before.bottom).toBeLessThanOrEqual(before.limit);
	} finally { release(); }
	await ready(page);
	expect(await measure()).toEqual(before);
});

for (const width of [1200, 1440]) {
	test(`retains the selected row and label weight through the first five page clicks at ${width}px`, async ({ page }) => {
		await page.setViewportSize({ width, height: 1000 });
		await openPage(page, 'examples/');
		await openReadingMenu(page);
		await page.locator('.area-navigation-other-roots a[href$="/reference/"]').click();
		await ready(page);
		await openReadingMenu(page);
		await page.locator('[data-area-choice="reference/site"]').click();
		await page.waitForURL('**/reference/site/files/');
		await ready(page);
		const snapshot = () => tree(page).evaluate(nav => ({
			scroll: nav.scrollTop,
			rows: [...nav.querySelectorAll<HTMLElement>('.navigation-page-link')].map(link => ({
				text: link.textContent, top: link.getBoundingClientRect().top, weight: getComputedStyle(link).fontWeight,
			})),
		}));
		for (const name of ['pages', 'urls', 'metadata', 'images', 'files']) {
			const selector = `.tree-local-navigation a[href$="/reference/site/${name}/"]`;
			await page.locator(selector).evaluate(link => {
				const nav = link.closest<HTMLElement>('.tree-local-navigation')!;
				const top = nav.querySelector('[data-tree-controls]')!.getBoundingClientRect().bottom + 12;
				const bottom = nav.getBoundingClientRect().bottom - 16;
				const box = link.getBoundingClientRect();
				if (box.top < top) nav.scrollTop += box.top - top;
				else if (box.bottom > bottom) nav.scrollTop += box.bottom - bottom;
			});
			const before = await snapshot();
			const selectedTitle = await page.locator(selector).textContent();
			await clickText(page, selector);
			await page.waitForURL(`**/reference/site/${name}/`);
			await ready(page);
			const after = await snapshot();
			const selected = before.rows.findIndex(row => row.text === selectedTitle);
			// Opening the selected outline adds rows below it. Earlier rows and
			// the clicked title retain their position; all weights stay constant.
			for (const [index, row] of before.rows.entries()) {
				expect(after.rows[index].weight).toBe(row.weight);
				if (index <= selected) expect(Math.abs(after.rows[index].top - row.top)).toBeLessThanOrEqual(1);
			}
			await expect(tree(page).locator(`details[data-page-path="reference/site/${name}"]`)).toHaveAttribute('open', '');
			expect(await page.locator('main').evaluate(e => getComputedStyle(e).viewTransitionName)).toBe('none');
		}
	});
}

test('opens a low outline without moving its row and only clamps closing at the scroll limit', async ({ page }) => {
	await page.setViewportSize({ width: 1440, height: 700 });
	await openPage(page, 'reference/content/markdown/');
	await tree(page).locator('[data-tree-expand-all]').click();
	const branch = tree(page).locator('details[data-page-path="reference/content/footnotes"]');
	await branch.evaluate((details: HTMLDetailsElement) => { details.open = false; });
	await tree(page).evaluate(nav => { nav.scrollTop = nav.scrollHeight; });
	const sample = () => branch.locator('summary').evaluate(async element => {
		const nav = document.querySelector<HTMLElement>('.tree-local-navigation')!;
		const before = { top: element.getBoundingClientRect().top, scroll: nav.scrollTop };
		element.click();
		const frames = [];
		const start = performance.now();
		while (performance.now() - start < 230) {
			await new Promise(requestAnimationFrame);
			frames.push({ top: element.getBoundingClientRect().top, scroll: nav.scrollTop, max: nav.scrollHeight - nav.clientHeight });
		}
		return { before, frames };
	});
	const opened = await sample();
	for (const frame of opened.frames) expect(Math.abs(frame.top - opened.before.top)).toBeLessThanOrEqual(1);
	await tree(page).evaluate(nav => { nav.scrollTop = nav.scrollHeight; });
	const closed = await sample();
	for (const frame of closed.frames) {
		expect(Math.abs(frame.scroll - Math.min(closed.before.scroll, frame.max))).toBeLessThanOrEqual(1);
	}
	const end = await tree(page).evaluate(nav => {
		nav.scrollTop = nav.scrollHeight;
		const last = [...nav.querySelectorAll('a')].filter(e => e.checkVisibility()).at(-1)!;
		return nav.getBoundingClientRect().bottom - last.getBoundingClientRect().bottom;
	});
	expect(end).toBeGreaterThanOrEqual(24);
});

test('masks rows behind the filter, restores filtering and shares compact disclosure choices', async ({ page }) => {
	await openPage(page, 'reference/site/files/');
	await tree(page).locator('[data-tree-expand-all]').click();
	const filter = tree(page).locator('[data-tree-filter]');
	await filter.fill('metadata');
	await expect(tree(page).getByRole('link', { name: 'Page metadata', exact: true })).toBeVisible();
	await filter.press('Escape');
	await expect(tree(page).locator('details[data-page-path="reference/site/pages"]')).toHaveAttribute('open', '');
	expect(await tree(page).evaluate(nav => {
		nav.scrollTop = 300;
		const box = nav.getBoundingClientRect();
		return nav.querySelector('[data-tree-controls]')!.contains(document.elementFromPoint(box.left + 70, box.top + 8));
	})).toBe(true);
	await page.setViewportSize({ width: 390, height: 844 });
	await page.locator('.mobile-nav-menu > summary').click();
	const compactBranch = page.locator('.mobile-site-nav details[data-page-path="reference/site/pages"]');
	await expect(compactBranch).toHaveAttribute('open', '');
	await compactBranch.locator('summary').focus();
	await page.keyboard.press('Enter');
	await expect(compactBranch).not.toHaveAttribute('open', '');
	await expect(tree(page).locator('details[data-page-path="reference/site/pages"]')).not.toHaveAttribute('open', '');
	await expect(page.locator('.mobile-site-nav .page-contents-links ol')).toHaveCount(0);
});

for (const reducedMotion of ['no-preference', 'reduce'] as const) {
	test(`restores history past a fragment with ${reducedMotion}`, async ({ page }) => {
		await page.emulateMedia({ reducedMotion });
		await openPage(page, 'reference/site/pages/#names-and-order');
		await page.evaluate(() => scrollBy({ top: 220, behavior: 'instant' }));
		const backPosition = await page.evaluate(() => scrollY);
		await clickText(page, '.tree-local-navigation a[href$="/reference/site/urls/"]');
		await page.waitForURL('**/reference/site/urls/');
		await ready(page);
		await page.evaluate(() => scrollBy({ top: 180, behavior: 'instant' }));
		const forwardPosition = await page.evaluate(() => scrollY);
		await page.goBack();
		await ready(page);
		await expect.poll(() => page.evaluate(position => Math.abs(scrollY - position), backPosition)).toBeLessThanOrEqual(1);
		await page.goForward();
		await ready(page);
		await expect.poll(() => page.evaluate(position => Math.abs(scrollY - position), forwardPosition)).toBeLessThanOrEqual(1);
		await expect(tree(page)).toHaveAttribute('data-navigation-area', 'reference/site');
	});
}

test('supports keyboard and no-script area selection while retaining native links', async ({ page, browser, baseURL }) => {
	await openPage(page, 'reference/site/files/');
	const trigger = page.locator('[data-area-switcher] > summary');
	await trigger.focus();
	await page.keyboard.press('Enter');
	await expect(page.locator('[data-area-choice="reference/configuration"]')).toBeVisible();
	await page.keyboard.press('Escape');
	await expect(trigger).toBeFocused();
	await expect(page).toHaveURL(/\/reference\/site\/files\/$/);
	const context = await browser.newContext({ javaScriptEnabled: false, baseURL, viewport: { width: 1440, height: 1000 } });
	try {
		const plain = await context.newPage();
		await plain.goto('reference/site/files/');
		await plain.locator('[data-area-switcher] > summary').click();
		await plain.locator('[data-area-choice="reference/configuration"]').click();
		await expect(plain).toHaveURL(/\/reference\/configuration\/site\/$/);
		const outline = tree(plain).locator('details[data-page-path="reference/configuration/site"]');
		await expect(outline).toHaveAttribute('open', '');
		await outline.locator('summary').click();
		await expect(outline).not.toHaveAttribute('open', '');
		await tree(plain).locator('a[href$="/reference/configuration/site/"]').click();
		await expect(plain.locator('h1')).toHaveText('Site configuration');
	} finally { await context.close(); }
});

test('keeps notes within the recovered canvas and reflows them on compact screens', async ({ page }) => {
	for (const width of [1440, 1280, 1100, 1024, 390]) {
		await page.setViewportSize({ width, height: 1000 });
		await openPage(page, 'reference/content/sidenotes/');
		const geometry = await page.locator('.section-note-paragraph').first().evaluate(element => {
			const prose = element.querySelector(':scope > p')!.getBoundingClientRect();
			const note = element.querySelector('.section-note')!.getBoundingClientRect();
			return { inMargin: note.left >= prose.right, noteRight: note.right,
				noteTop: note.top, proseBottom: prose.bottom, overflow: document.documentElement.scrollWidth - innerWidth };
		});
		expect(geometry.overflow).toBeLessThanOrEqual(1);
		expect(geometry.noteRight).toBeLessThanOrEqual(width);
		if (width === 1440) expect(geometry.inMargin).toBe(true);
		if (width <= 1100) expect(geometry.noteTop).toBeGreaterThanOrEqual(geometry.proseBottom);
	}
});

test('retains Focus reading, compact destinations and touch activation', async ({ page, browser, baseURL }) => {
	await openPage(page, 'reference/site/files/');
	const display = page.locator('[data-display-settings]');
	await display.locator('summary').click();
	await display.getByRole('checkbox', { name: 'Focus reading' }).check();
	await expect(tree(page)).toBeHidden();
	await page.keyboard.press('Escape');
	await page.locator('.mobile-nav-menu > summary').click();
	await expect(page.locator('.mobile-site-nav a[href$="/reference/site/pages/"]')).toBeVisible();
	const context = await browser.newContext({ baseURL, viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
	try {
		const touch = await context.newPage();
		await openPage(touch, 'reference/site/files/');
		await touch.locator('.mobile-nav-menu > summary').tap();
		const branch = touch.locator('.mobile-site-nav details[data-page-path="reference/site/pages"]');
		await branch.locator('summary').tap();
		await expect(branch).toHaveAttribute('open', '');
		await touch.locator('.mobile-site-nav a[href$="/pages/#names-and-order"]').tap();
		await expect(touch).toHaveURL(/\/pages\/#names-and-order$/);
		await ready(touch);
	} finally { await context.close(); }
});

test('resolves prose and category-overview links directly and leaves external links native', async ({ page, context }) => {
	await openPage(page, 'reference/');
	const documents: string[] = [];
	page.on('request', request => {
		if (request.isNavigationRequest() && request.frame() === page.mainFrame()) documents.push(request.url());
	});
	await page.locator('.child-page-list a[href$="/reference/site/files/"]').click();
	await page.waitForURL('**/reference/site/files/');
	await ready(page);
	expect(documents).toHaveLength(1);
	await page.locator('main').getByRole('link', { name: 'limited inherited overrides', exact: true }).click();
	await page.waitForURL('**/reference/configuration/theme/#page-themes');
	await ready(page);
	await expect(tree(page)).toHaveAttribute('data-navigation-area', 'reference/configuration');
	await openPage(page, 'reference/workflows/editor/');
	const requested: string[] = [];
	await context.route('https://github.com/**', route => {
		requested.push(route.request().url());
		return route.fulfill({ contentType: 'text/html', body: '<title>External destination</title>' });
	});
	const external = page.locator('main a').filter({ hasText: 'contributor task' });
	await external.hover();
	await page.waitForTimeout(180);
	expect(requested).toEqual([]);
	const popup = context.waitForEvent('page');
	await external.click({ modifiers: [process.platform === 'darwin' ? 'Meta' : 'Control'] });
	const opened = await popup;
	await opened.waitForLoadState();
	await expect(opened).toHaveURL(/https:\/\/github.com\/janga\/norna\//);
	await expect(page).toHaveURL(/\/reference\/workflows\/editor\/$/);
	await opened.close();
});
