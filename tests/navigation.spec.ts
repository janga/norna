import { expect, test } from '@playwright/test';

const mobileViewport = { width: 393, height: 852 };
const desktopViewport = { width: 1280, height: 900 };
const maximumAnchorGap = 2;
const maximumAnchorWait = 7_000;
const minimumFullscreenSafeTextTop = 24;

type AnchorMeasurement = {
	hash: string;
	headerBottom: number;
	headingTop: number;
	gap: number;
	isFirstSection: boolean;
	scrollBottomGap: number;
	scrollY: number;
};

const pageNavSelector = '.site-nav-submenu a';
const mobilePageNavSelector = '.mobile-page-nav a';
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
	const sections = Array.from(document.querySelectorAll('.site-section'));
	const section = document.getElementById(id);
	const heading = section?.querySelector('h1, h2');

	if (!(header instanceof HTMLElement) || !(heading instanceof HTMLElement)) {
		throw new Error(`Cannot measure section heading for ${id}.`);
	}

	const headerBottom = header.getBoundingClientRect().bottom;
	const headingTop = heading.getBoundingClientRect().top;
	const maxScrollY = Math.max(
		0,
		document.documentElement.scrollHeight - window.innerHeight,
		document.body.scrollHeight - window.innerHeight,
	);

	return {
		hash: window.location.hash,
		headerBottom,
		headingTop,
		gap: headingTop - headerBottom,
		isFirstSection: sections[0] === section,
		scrollBottomGap: maxScrollY - window.scrollY,
		scrollY: window.scrollY,
	};
}, sectionId);

const openSite = async (page, path = '/') => {
	await page.goto(path, { waitUntil: 'domcontentloaded' });
	await page.locator(sectionNavSelector).first().waitFor({ state: 'attached' });
	await page.waitForLoadState('networkidle').catch(() => {});
};

const waitForAnchorPosition = async (page, sectionId: string) => {
	await page.waitForFunction(
		({ id, maximumGap }) => {
			const header = document.querySelector('.site-top');
			const sections = Array.from(document.querySelectorAll('.site-section'));
			const section = document.getElementById(id);
			const heading = section?.querySelector('h1, h2');

			if (!(header instanceof HTMLElement) || !(heading instanceof HTMLElement)) {
				return false;
			}

			const headerBottom = header.getBoundingClientRect().bottom;
			const headingTop = heading.getBoundingClientRect().top;
			const gap = headingTop - headerBottom;

			const maxScrollY = Math.max(
				0,
				document.documentElement.scrollHeight - window.innerHeight,
				document.body.scrollHeight - window.innerHeight,
			);
			const atDocumentTop = window.scrollY <= 2;
			const atDocumentBottom = maxScrollY - window.scrollY <= 2;
			const isFirstSection = sections[0] === section;

			return window.location.hash === `#${id}`
				&& gap >= -1
				&& (gap <= maximumGap || (atDocumentTop && isFirstSection) || atDocumentBottom);
		},
		{ id: sectionId, maximumGap: maximumAnchorGap },
		{ timeout: maximumAnchorWait },
	);
};

const clickSectionLink = async (page, hash: string) => {
	const desktopLink = page.locator(`${pageNavSelector}[href$="${hash}"]`).first();
	const currentRouteLink = page.locator('.site-nav a[aria-current="page"]').first();

	if (await currentRouteLink.isVisible()) {
		await currentRouteLink.hover();
	}

	if (await desktopLink.isVisible()) {
		await desktopLink.click();
		return;
	}

	const mobileMenu = page.locator('.mobile-nav-menu').first();
	if (await mobileMenu.isVisible()) {
		await mobileMenu.locator('summary').click();
		await page.locator(`${mobilePageNavSelector}[href$="${hash}"]`).first().click();
		return;
	}

	throw new Error(`Cannot find visible section navigation link for ${hash}.`);
};

const getActiveSectionHash = async (page) => page.locator(`${sectionNavSelector}[aria-current="true"]`)
	.first()
	.getAttribute('href');

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

test.describe('route navigation menus', () => {
	test.use({
		hasTouch: false,
		isMobile: false,
		viewport: desktopViewport,
	});

	test('marks the current route and opens its section menu on hover', async ({ page }) => {
		await openSite(page);

		const currentRouteLink = page.locator('.site-nav a[aria-current="page"]');
		await expect(currentRouteLink).toHaveText('Home');
		await currentRouteLink.hover();

		const currentRouteItem = currentRouteLink.locator('..');
		const submenu = currentRouteItem.locator('.site-nav-submenu');
		await expect(submenu).toBeVisible();
		await expect(submenu.locator('a').first()).toBeVisible();
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

		test('positions each section heading below the sticky navigation', async ({ page }) => {
			await openSite(page);

			for (const target of await getNavTargets(page)) {
				const sectionId = target.hash.slice(1);
				await clickSectionLink(page, target.hash);
				await waitForAnchorPosition(page, sectionId);

				const measurement = await measureAnchor(page, sectionId);
				expect(measurement.hash, target.label).toBe(target.hash);
				expect(measurement.gap, target.label).toBeGreaterThanOrEqual(-1);
				if (!measurement.isFirstSection && measurement.scrollY > 2 && measurement.scrollBottomGap > 2) {
					expect(measurement.gap, target.label).toBeLessThanOrEqual(maximumAnchorGap);
				}
			}
		});

		test('positions direct hash links below the sticky navigation', async ({ page }) => {
			await openSite(page);

			for (const target of await getNavTargets(page)) {
				const sectionId = target.hash.slice(1);
				await openSite(page, `/${target.hash}`);
				await waitForAnchorPosition(page, sectionId);

				const measurement = await measureAnchor(page, sectionId);
				expect(measurement.hash, target.label).toBe(target.hash);
				expect(measurement.gap, target.label).toBeGreaterThanOrEqual(-1);
				if (!measurement.isFirstSection && measurement.scrollY > 2 && measurement.scrollBottomGap > 2) {
					expect(measurement.gap, target.label).toBeLessThanOrEqual(maximumAnchorGap);
				}
			}
		});

	test('keeps the target aligned when layout above it changes during smooth scroll', async ({ page }) => {
			await openSite(page);
			const targets = await getNavTargets(page);
			const target = targets[Math.floor(targets.length / 2)];
			if (!target) throw new Error('The fixture must provide at least three navigation targets.');
			const sectionId = target.hash.slice(1);

			await page.evaluate((id) => {
				window.setTimeout(() => {
					const target = document.getElementById(id);
					const spacer = document.createElement('div');

					spacer.id = 'scroll-shift-probe';
					spacer.style.height = '180px';
					spacer.style.pointerEvents = 'none';
					target?.before(spacer);
				}, 500);
			}, sectionId);

			await clickSectionLink(page, target.hash);
			await waitForAnchorPosition(page, sectionId);

			const measurement = await measureAnchor(page, sectionId);
			expect(measurement.hash).toBe(target.hash);
			expect(measurement.gap).toBeGreaterThanOrEqual(-1);
			expect(measurement.gap).toBeLessThanOrEqual(maximumAnchorGap);
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

	test('back to the page without a hash restores the first active section', async ({ page }) => {
		await openSite(page);
		const targets = (await getNavTargets(page)).slice(0, 3);
		if (targets.length < 3) throw new Error('The fixture must provide at least three navigation targets.');

		await clickSectionLink(page, targets[1].hash);
		await waitForAnchorPosition(page, targets[1].hash.slice(1));
		await clickSectionLink(page, targets[2].hash);
		await waitForAnchorPosition(page, targets[2].hash.slice(1));

		await page.goBack();
		await waitForAnchorPosition(page, targets[1].hash.slice(1));
		await expect.poll(() => getActiveSectionHash(page)).toBe(targets[1].hash);

		const startedAt = Date.now();
		await page.goBack();
		await expect.poll(() => page.evaluate(() => window.location.hash)).toBe('');
		await expect.poll(() => getActiveSectionHash(page)).toBe(targets[0].hash);
		expect(Date.now() - startedAt).toBeLessThan(1_000);
		await page.waitForTimeout(700);
		await expect.poll(() => getActiveSectionHash(page)).toBe(targets[0].hash);
	});

	test('rapid section clicks keep the last clicked section active', async ({ page }) => {
		await openSite(page);
		const targets = (await getNavTargets(page)).slice(0, 4);
		if (targets.length < 4) throw new Error('The fixture must provide at least four navigation targets.');

		for (const target of targets.slice(1)) {
			await clickSectionLink(page, target.hash);
		}

		const finalTarget = targets.at(-1);
		await waitForAnchorPosition(page, finalTarget.hash.slice(1));
		await expect.poll(() => getActiveSectionHash(page)).toBe(finalTarget.hash);
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
		await page.locator('.site-nav a[aria-current="page"]').hover();

		for (const target of await measureNavTextHitTargets(page)) {
			expect(target.textTop, target.label).toBeGreaterThanOrEqual(minimumFullscreenSafeTextTop);
			expect(target.hitHref, target.label).toBe(target.href);
		}
	});
});

test.describe('section navigation without JavaScript', () => {
	test.use({
		hasTouch: true,
		isMobile: true,
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
