import { expect, test } from '@playwright/test';

const mobileViewport = { width: 393, height: 852 };
const desktopViewport = { width: 1280, height: 900 };
const maximumAnchorGap = 20;
const maximumAnchorWait = 7_000;
const minimumFullscreenSafeTextTop = 24;
const testPagePath = '/media/';

type AnchorMeasurement = {
	hash: string;
	navigationBottom: number;
	headingTop: number;
	gap: number;
};

const pageNavSelector = '.page-nav a';
const currentDesktopPageSelector = '.site-nav > ul > .site-nav-item > a[aria-current="page"]';
const mobilePageNavSelector = '.mobile-nav-sections a';
const currentMobilePageNavSelector = '.mobile-nav-sections a';
const sectionNavSelector = `${pageNavSelector}, ${mobilePageNavSelector}`;

const getNavTargets = async (page) => page.locator(pageNavSelector).evaluateAll((links) => (
	links.map((link) => {
		const url = new URL(link.href, window.location.href);
		return {
			hash: url.hash,
			label: link.textContent?.trim() ?? '',
			pathname: url.pathname,
		};
	}).filter((link) => link.pathname === window.location.pathname && link.hash.startsWith('#'))
));

const measureAnchor = async (page, sectionId: string): Promise<AnchorMeasurement> => page.evaluate((id) => {
	const header = document.querySelector('.site-top');
	const pageNavigation = document.querySelector('.page-nav');
	const heading = document.getElementById(id);

	if (!(header instanceof HTMLElement) || !(heading instanceof HTMLElement)) {
		throw new Error(`Cannot measure section heading for ${id}.`);
	}

	const navigationBottom = Math.max(
		header.getBoundingClientRect().bottom,
		pageNavigation instanceof HTMLElement && pageNavigation.getClientRects().length > 0
			? pageNavigation.getBoundingClientRect().bottom
			: 0,
	);
	const headingTop = heading.getBoundingClientRect().top;
	return {
		hash: window.location.hash,
		navigationBottom,
		headingTop,
		gap: headingTop - navigationBottom,
	};
}, sectionId);

const openSite = async (page, path = testPagePath) => {
	await page.goto(path, { waitUntil: 'domcontentloaded' });
	await page.locator(sectionNavSelector).first().waitFor({ state: 'attached' });
	await page.waitForLoadState('networkidle').catch(() => {});
};

const waitForAnchorPosition = async (page, sectionId: string) => {
	await page.waitForFunction(
		({ id }) => {
			const header = document.querySelector('.site-top');
			const pageNavigation = document.querySelector('.page-nav');
			const heading = document.getElementById(id);

			if (!(header instanceof HTMLElement) || !(heading instanceof HTMLElement)) {
				return false;
			}

			const navigationBottom = Math.max(
				header.getBoundingClientRect().bottom,
				pageNavigation instanceof HTMLElement && pageNavigation.getClientRects().length > 0
					? pageNavigation.getBoundingClientRect().bottom
					: 0,
			);
			const headingTop = heading.getBoundingClientRect().top;
			const gap = headingTop - navigationBottom;

			return window.location.hash === `#${id}`
				&& gap >= -1
				&& headingTop < window.innerHeight;
		},
		{ id: sectionId },
		{ timeout: maximumAnchorWait },
	);
};

const clickSectionLink = async (page, hash: string) => {
	const desktopLink = page.locator(`${pageNavSelector}[href$="${hash}"]`).first();

	if (await desktopLink.isVisible()) {
		await desktopLink.click();
		return;
	}

	const mobileMenu = page.locator('.mobile-nav-menu').first();
	if (await mobileMenu.isVisible()) {
		if (!(await mobileMenu.getAttribute('open'))) {
			await mobileMenu.locator(':scope > summary').click();
		}
		await page.locator(`${currentMobilePageNavSelector}[href$="${hash}"]`).first().click();
		return;
	}

	throw new Error(`Cannot find visible section navigation link for ${hash}.`);
};

const measureNavTextHitTargets = async (page) => page.locator(pageNavSelector).evaluateAll((links) => (
	links.map((link) => {
		const linkUrl = new URL(link.href, window.location.href);
		const textRange = document.createRange();
		textRange.selectNodeContents(link);
		const textRect = textRange.getBoundingClientRect();
		textRange.detach();

		const x = textRect.left + textRect.width / 2;
		const y = textRect.top + textRect.height / 2;
		const hitElement = document.elementFromPoint(x, y);

		return {
			href: link.getAttribute('href'),
			label: link.textContent?.trim(),
			textTop: textRect.top,
			hitHref: hitElement instanceof HTMLAnchorElement
				? hitElement.getAttribute('href')
				: hitElement?.closest('a')?.getAttribute('href'),
			pathname: linkUrl.pathname,
		};
	}).filter((link) => link.pathname === window.location.pathname)
));

test.describe('site navigation menus', () => {
	test.use({
		hasTouch: false,
		isMobile: false,
		viewport: desktopViewport,
	});

	test('keeps page navigation and current-page sections separate', async ({ page }) => {
		await openSite(page);

		const currentPageLink = page.locator(currentDesktopPageSelector);
		await expect(currentPageLink).toHaveText('Media blocks');
		await expect(page.locator('.page-nav-label')).toHaveText('Page contents');
		await expect(page.locator(pageNavSelector).first()).toBeVisible();
		await expect(page.locator('.site-nav-submenu a[href*="#"]')).toHaveCount(0);
	});

	test('marks an activated current-page section', async ({ page }) => {
		await openSite(page);
		const firstSectionLink = page.locator(pageNavSelector).first();
		const targetHash = await firstSectionLink.getAttribute('href');
		await firstSectionLink.click();
		await expect.poll(() => page.evaluate(() => window.location.hash)).toBe(new URL(targetHash!, 'http://example.test').hash);
		await expect(firstSectionLink).toHaveAttribute('aria-current', 'location');
	});

	test('moves keyboard focus to the activated section heading', async ({ page }) => {
		await openSite(page);

		const firstSectionLink = page.locator(pageNavSelector).first();
		const targetHash = new URL(
			(await firstSectionLink.getAttribute('href'))!,
			'http://example.test',
		).hash;

		await firstSectionLink.focus();
		await expect(firstSectionLink).toBeFocused();
		await page.keyboard.press('Enter');

		await expect.poll(() => page.evaluate(() => window.location.hash)).toBe(targetHash);
		await expect.poll(() => page.evaluate(() => `#${document.activeElement?.id}`)).toBe(targetHash);
	});

	test('renders non-tree section surfaces as full viewport bands', async ({ page }) => {
		await openSite(page);
		const section = page.locator('.site-section').filter({ has: page.locator('#carousels') });
		const bounds = await section.evaluate((node) => {
			const rectangle = node.getBoundingClientRect();
			const pseudo = getComputedStyle(node, '::before');
			return {
				left: rectangle.left + Number.parseFloat(pseudo.left),
				right: rectangle.right - Number.parseFloat(pseudo.right),
				viewportWidth: document.documentElement.clientWidth,
			};
		});

		expect(bounds.left).toBeCloseTo(0, 0);
		expect(bounds.right).toBeCloseTo(bounds.viewportWidth, 0);
	});
});

test.describe('mobile site navigation drawer', () => {
	test.use({
		hasTouch: true,
		isMobile: true,
		viewport: mobileViewport,
	});

	test('shows pages and current-page sections as separate groups', async ({ page }) => {
		await openSite(page);
		const menu = page.locator('.mobile-nav-menu');
		await menu.locator(':scope > summary').click();

		await expect(menu.locator('nav[aria-label="Pages"] h2')).toHaveText('Pages');
		await expect(menu.locator('.navigation-page-node-current > .navigation-page-link')).toHaveText('Media blocks');
		await expect(menu.getByRole('link', { name: 'Surfaces', exact: true })).toHaveAttribute('href', '/surfaces/');
		await expect(menu.locator('nav[aria-label="Page contents"] h2')).toHaveText('Page contents');
		await expect(menu.locator(mobilePageNavSelector).first()).toBeVisible();
		await expect(menu.locator('.navigation-page-tree-mobile a[href*="#"]')).toHaveCount(0);
	});

	test('closes with Escape and returns focus to the menu button', async ({ page }) => {
		await openSite(page);
		const menu = page.locator('.mobile-nav-menu');
		const summary = menu.locator(':scope > summary');
		await summary.click();
		await expect(menu).toHaveAttribute('open', '');

		await page.keyboard.press('Escape');
		await expect(menu).not.toHaveAttribute('open', '');
		await expect(summary).toBeFocused();
	});
});

for (const scenario of [
	{ name: 'mobile', viewport: mobileViewport, isMobile: true, hasTouch: true },
	{ name: 'desktop', viewport: desktopViewport, isMobile: false, hasTouch: false },
]) {
	test.describe(`section navigation on ${scenario.name}`, () => {
		test.use({
			hasTouch: scenario.hasTouch,
			isMobile: scenario.isMobile,
			viewport: scenario.viewport,
		});

		test('keeps each section heading visible below the sticky navigation', async ({ page }) => {
			await openSite(page);
			const targets = await getNavTargets(page);

			for (const [targetIndex, target] of targets.entries()) {
				const sectionId = target.hash.slice(1);
				await clickSectionLink(page, target.hash);
				await waitForAnchorPosition(page, sectionId);

				const measurement = await measureAnchor(page, sectionId);
				expect(measurement.hash, target.label).toBe(target.hash);
				expect(measurement.gap, target.label).toBeGreaterThanOrEqual(-1);
				if (targetIndex === 1) expect(measurement.gap, target.label).toBeLessThanOrEqual(maximumAnchorGap);
			}
		});

		test('keeps direct hash-link headings visible below the sticky navigation', async ({ page }) => {
			await openSite(page);
			const targets = await getNavTargets(page);

			for (const [targetIndex, target] of targets.entries()) {
				const sectionId = target.hash.slice(1);
				await openSite(page, `${testPagePath}${target.hash}`);
				await waitForAnchorPosition(page, sectionId);

				const measurement = await measureAnchor(page, sectionId);
				expect(measurement.hash, target.label).toBe(target.hash);
				expect(measurement.gap, target.label).toBeGreaterThanOrEqual(-1);
				if (targetIndex === 1) expect(measurement.gap, target.label).toBeLessThanOrEqual(maximumAnchorGap);
			}
		});

		test('uses native immediate anchor movement by default', async ({ page }) => {
			await openSite(page);
			await expect.poll(() => page.evaluate(
				() => getComputedStyle(document.documentElement).scrollBehavior,
			)).toBe('auto');
		});

	});
}

test.describe('section navigation history', () => {
	test.use({
		hasTouch: false,
		isMobile: false,
		viewport: desktopViewport,
	});

	test('back and forward move between section jumps on the same page', async ({ page }) => {
		await openSite(page);
		const targets = (await getNavTargets(page)).slice(0, 3);
		if (targets.length < 3) throw new Error('The fixture must provide at least three navigation targets.');

		await clickSectionLink(page, targets[1].hash);
		await waitForAnchorPosition(page, targets[1].hash.slice(1));
		await clickSectionLink(page, targets[2].hash);
		await waitForAnchorPosition(page, targets[2].hash.slice(1));

		await page.goBack();
		await waitForAnchorPosition(page, targets[1].hash.slice(1));
		expect(page.url()).toContain(targets[1].hash);

		await page.goForward();
		await waitForAnchorPosition(page, targets[2].hash.slice(1));
		expect(page.url()).toContain(targets[2].hash);
	});

	test('back to the page without a hash restores the page URL', async ({ page }) => {
		await openSite(page);
		const targets = (await getNavTargets(page)).slice(0, 3);
		if (targets.length < 3) throw new Error('The fixture must provide at least three navigation targets.');

		await clickSectionLink(page, targets[1].hash);
		await waitForAnchorPosition(page, targets[1].hash.slice(1));
		await clickSectionLink(page, targets[2].hash);
		await waitForAnchorPosition(page, targets[2].hash.slice(1));

		await page.goBack();
		await waitForAnchorPosition(page, targets[1].hash.slice(1));
		await expect.poll(() => page.evaluate(() => window.location.hash)).toBe(targets[1].hash);

		await page.goBack();
		await expect.poll(() => page.evaluate(() => window.location.hash)).toBe('');
		await expect(page.locator(currentDesktopPageSelector)).toHaveText('Media blocks');
	});

	test('rapid section clicks keep the last clicked section in the URL', async ({ page }) => {
		await openSite(page);
		const targets = (await getNavTargets(page)).slice(0, 3);
		if (targets.length < 3) throw new Error('The fixture must provide at least three navigation targets.');

		for (const target of targets.slice(1)) {
			await clickSectionLink(page, target.hash);
		}

		const finalTarget = targets.at(-1);
		await waitForAnchorPosition(page, finalTarget.hash.slice(1));
		await expect.poll(() => page.evaluate(() => window.location.hash)).toBe(finalTarget.hash);
	});
});

test.describe('desktop navigation hit targets', () => {
	test.use({
		hasTouch: false,
		isMobile: false,
		viewport: desktopViewport,
	});

	test('keeps labels below the top fullscreen browser chrome risk area', async ({ page }) => {
		await openSite(page);

		for (const target of await measureNavTextHitTargets(page)) {
			expect(target.textTop, target.label).toBeGreaterThanOrEqual(minimumFullscreenSafeTextTop);
			expect(target.hitHref, target.label).toBe(target.href);
		}
	});
});

test.describe('section navigation without JavaScript', () => {
	test.use({
		hasTouch: true,
		isMobile: false,
		javaScriptEnabled: false,
		viewport: mobileViewport,
	});

	test('keeps hash links usable as a fallback', async ({ page }) => {
		await openSite(page);
		const target = (await getNavTargets(page))[1];
		if (!target) throw new Error('The fixture must provide at least two navigation targets.');
		const sectionId = target.hash.slice(1);
		await clickSectionLink(page, target.hash);

		const measurement = await measureAnchor(page, sectionId);
		expect(measurement.hash).toBe(target.hash);
		expect(measurement.gap).toBeGreaterThanOrEqual(-1);
	});
});
