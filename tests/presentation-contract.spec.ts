import { expect, test } from '@playwright/test';

const componentsPath = '/guide/components/';

const openComponents = async (page) => {
	await page.goto(componentsPath, { waitUntil: 'domcontentloaded' });
	await page.locator('[data-carousel-ready="true"]').waitFor();
};

const getHorizontalOverflow = (page) => page.evaluate(() => ({
	clientWidth: document.documentElement.clientWidth,
	offenders: Array.from(document.querySelectorAll('body *')).flatMap((node) => {
		const rectangle = node.getBoundingClientRect();
		if (rectangle.width === 0 || rectangle.right <= document.documentElement.clientWidth + 1) return [];
		return [{
			className: node.getAttribute('class') ?? '',
			right: Math.round(rectangle.right),
			tagName: node.tagName,
			width: Math.round(rectangle.width),
		}];
	}).slice(0, 12),
	scrollWidth: document.documentElement.scrollWidth,
}));

test('content reflows at 320 CSS pixels with long unbroken text', async ({ page }) => {
	await page.setViewportSize({ width: 320, height: 800 });
	await openComponents(page);
	await page.locator('.section-markdown p').first().evaluate((paragraph) => {
		const code = document.createElement('code');
		code.textContent = 'configurationvaluewithoutbreakpoints'.repeat(8);
		paragraph.append(' ', code);
	});

	const overflow = await getHorizontalOverflow(page);
	expect(overflow.scrollWidth, JSON.stringify(overflow.offenders, null, 2)).toBeLessThanOrEqual(overflow.clientWidth + 1);
});

test('WCAG text-spacing overrides do not clip key content', async ({ page }) => {
	await page.setViewportSize({ width: 390, height: 844 });
	await openComponents(page);
	await page.addStyleTag({
		content: `
			*:not(svg):not(path) {
				letter-spacing: 0.12em !important;
				line-height: 1.5 !important;
				word-spacing: 0.16em !important;
			}
			p { margin-bottom: 2em !important; }
		`,
	});

	const overflow = await getHorizontalOverflow(page);
	expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth + 1);

	for (const selector of ['.site-banner', '.site-breadcrumbs', '.mobile-nav-menu > summary']) {
		const element = page.locator(selector).first();
		if (await element.count() === 0) continue;
		const dimensions = await element.evaluate((node) => ({
			clientHeight: node.clientHeight,
			scrollHeight: node.scrollHeight,
		}));
		expect(dimensions.scrollHeight, selector).toBeLessThanOrEqual(dimensions.clientHeight + 1);
	}
});

test('200 percent text resizing preserves horizontal reflow', async ({ page }) => {
	await page.setViewportSize({ width: 1280, height: 900 });
	await openComponents(page);
	await page.addStyleTag({ content: 'html { font-size: 200% !important; }' });

	const overflow = await getHorizontalOverflow(page);
	expect(overflow.scrollWidth, JSON.stringify(overflow.offenders, null, 2)).toBeLessThanOrEqual(overflow.clientWidth + 1);
	await expect(page.locator('.site-content h1').first()).toBeVisible();
	await expect(page.locator('.color-mode-selector summary')).toBeVisible();
});

test('authored navigation and controls meet the minimum target size', async ({ page }) => {
	await page.setViewportSize({ width: 390, height: 844 });
	await openComponents(page);
	const targets = await page.locator([
		'button',
		'summary',
		'.mobile-nav-panel a',
		'.page-nav a',
		'.site-nav a',
	].join(', ')).evaluateAll((nodes) => nodes.flatMap((node) => {
		const rectangle = node.getBoundingClientRect();
		if (rectangle.width === 0 || rectangle.height === 0) return [];
		return [{
			height: rectangle.height,
			label: node.getAttribute('aria-label') ?? node.textContent?.trim() ?? node.tagName,
			width: rectangle.width,
		}];
	}));

	expect(targets.length).toBeGreaterThan(0);
	for (const target of targets) {
		expect(target.height, `${target.label} height`).toBeGreaterThanOrEqual(24);
		expect(target.width, `${target.label} width`).toBeGreaterThanOrEqual(24);
	}
});

test('keyboard focus has a visible two-color indicator', async ({ page }) => {
	await page.setViewportSize({ width: 1280, height: 900 });
	await openComponents(page);
	const control = page.locator('.color-mode-selector summary');
	await control.focus();
	const focus = await control.evaluate((node) => {
		const style = getComputedStyle(node);
		return {
			boxShadow: style.boxShadow,
			outlineStyle: style.outlineStyle,
			outlineWidth: Number.parseFloat(style.outlineWidth),
		};
	});

	expect(focus.outlineStyle).not.toBe('none');
	expect(focus.outlineWidth).toBeGreaterThanOrEqual(2);
	expect(focus.boxShadow).not.toBe('none');

	const contentLink = page.locator('.card-list-link').first();
	await contentLink.focus();
	const position = await contentLink.evaluate((node) => {
		const header = document.querySelector('.site-top');
		if (!header) throw new Error('Missing sticky site header.');
		return {
			headerBottom: header.getBoundingClientRect().bottom,
			linkTop: node.getBoundingClientRect().top,
		};
	});
	expect(position.linkTop).toBeGreaterThanOrEqual(position.headerBottom - 1);
});

test('reduced motion disables transitions and carousel animation', async ({ page }) => {
	await page.emulateMedia({ reducedMotion: 'reduce' });
	await page.setViewportSize({ width: 1280, height: 900 });
	await openComponents(page);

	const motion = await page.evaluate(() => {
		const root = getComputedStyle(document.documentElement);
		const siteTop = getComputedStyle(document.querySelector('.site-top'));
		return {
			reduced: matchMedia('(prefers-reduced-motion: reduce)').matches,
			scrollBehavior: root.scrollBehavior,
			transitionDuration: siteTop.transitionDuration,
		};
	});
	expect(motion.reduced).toBe(true);
	expect(motion.scrollBehavior).toBe('auto');
	const transitionSeconds = motion.transitionDuration.endsWith('ms')
		? Number.parseFloat(motion.transitionDuration) / 1000
		: Number.parseFloat(motion.transitionDuration);
	expect(transitionSeconds).toBeLessThanOrEqual(0.00001);

	const position = page.locator('[data-carousel-position]');
	const before = await position.textContent();
	await page.locator('[data-carousel-next]').click();
	await expect(position).not.toHaveText(before ?? '');
});

test('forced colors preserve visible control boundaries', async ({ page }) => {
	await page.emulateMedia({ forcedColors: 'active' });
	await page.setViewportSize({ width: 1280, height: 900 });
	await openComponents(page);

	expect(await page.evaluate(() => matchMedia('(forced-colors: active)').matches)).toBe(true);
	const boundary = await page.locator('[data-carousel-next]').evaluate((node) => {
		const style = getComputedStyle(node);
		return {
			borderStyle: style.borderStyle,
			borderWidth: Number.parseFloat(style.borderWidth),
		};
	});
	expect(boundary.borderStyle).toBe('solid');
	expect(boundary.borderWidth).toBeGreaterThanOrEqual(1);
});
