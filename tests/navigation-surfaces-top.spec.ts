import { expect, test } from '@playwright/test';

const proseAlignedPath = '/';
const centeredFitPath = '/guide/';

const openPage = async (page, pathname: string) => {
	await page.goto(pathname, { waitUntil: 'domcontentloaded' });
	await page.waitForLoadState('networkidle').catch(() => {});
	await page.locator('.managed-image').first().waitFor();
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

test.describe('top-navigation content canvas', () => {
	test.use({ viewport: { width: 1440, height: 1000 } });

	for (const appearance of ['light', 'dark']) {
		test(`uses one opaque page surface in ${appearance} appearance`, async ({ page }) => {
			await openPage(page, proseAlignedPath);
			await page.locator('html').evaluate((root, value) => {
				root.dataset.appearance = value;
			}, appearance);
			await page.waitForTimeout(250);

			const presentation = await page.evaluate(() => {
				const header = document.querySelector('.site-top');
				const navigationRow = document.querySelector('.site-nav-row');
				const content = document.querySelector('.site-content');
				if (!header || !navigationRow || !content) throw new Error('Missing top-navigation layout elements.');
				const headerStyle = getComputedStyle(header);
				const navigationBounds = navigationRow.getBoundingClientRect();
				const contentBounds = content.getBoundingClientRect();
				return {
					backdropFilter: headerStyle.backdropFilter,
					borderBottomStyle: headerStyle.borderBottomStyle,
					borderBottomWidth: Number.parseFloat(headerStyle.borderBottomWidth),
					contentLeft: contentBounds.left,
					contentRight: contentBounds.right,
					headerBackground: headerStyle.backgroundColor,
					navigationLeft: navigationBounds.left,
					navigationRight: navigationBounds.right,
					pageBackground: getComputedStyle(document.body).backgroundColor,
				};
			});

			expect(presentation.headerBackground).toBe(presentation.pageBackground);
			expect(presentation.backdropFilter).toBe('none');
			expect(presentation.borderBottomStyle).toBe('solid');
			expect(presentation.borderBottomWidth).toBeGreaterThanOrEqual(1);
			expect(presentation.navigationLeft).toBeCloseTo(presentation.contentLeft, 0);
			expect(presentation.navigationRight).toBeCloseTo(presentation.contentRight, 0);
		});
	}

	test('aligns prose-oriented stacks, carousels, and captions to the prose edge', async ({ page }) => {
		await openPage(page, proseAlignedPath);
		await page.locator('[data-carousel-ready="true"]').waitFor();
		await expect(page.locator('html')).toHaveAttribute('data-image-presentation', 'prose-aligned');

		const stackSection = page.locator('.site-section').filter({ has: page.locator('#intro') });
		const carouselSection = page.locator('.site-section').filter({ has: page.locator('#timed') });
		const elements = [
			stackSection.locator('.section-markdown').first(),
			stackSection.locator('.managed-image-frame').first(),
			stackSection.locator('.image-meta').first(),
			carouselSection.locator('.section-markdown').first(),
			carouselSection.locator('.image-carousel-stage'),
			carouselSection.locator('.image-carousel-captions'),
		];
		const [contentBounds, ...bounds] = await Promise.all([
			page.locator('.site-content').boundingBox(),
			...elements.map((element) => element.boundingBox()),
		]);

		expect(contentBounds).not.toBeNull();
		expect(bounds.every(Boolean)).toBe(true);
		expect(bounds[1]?.x).toBeCloseTo(bounds[0]?.x ?? 0, 0);
		expect(bounds[2]?.x).toBeCloseTo(bounds[1]?.x ?? 0, 0);
		expect(bounds[4]?.x).toBeCloseTo(bounds[3]?.x ?? 0, 0);
		expect(bounds[5]?.x).toBeCloseTo(bounds[4]?.x ?? 0, 0);
		for (const rectangle of [bounds[1], bounds[2], bounds[4], bounds[5]]) {
			expect((rectangle?.x ?? 0) + (rectangle?.width ?? Infinity)).toBeLessThanOrEqual(
				(contentBounds?.x ?? 0) + (contentBounds?.width ?? 0) + 1,
			);
		}
	});

	test('centers centered-fit images and captions inside the page content canvas', async ({ page }) => {
		await openPage(page, centeredFitPath);
		await expect(page.locator('html')).toHaveAttribute('data-image-presentation', 'centered-fit');

		const body = page.locator('.section-body').filter({ has: page.locator('.managed-image-frame') });
		const frame = page.locator('.managed-image-frame');
		const caption = page.locator('.image-meta');
		const [bodyBounds, frameBounds, captionBounds] = await Promise.all([
			body.boundingBox(),
			frame.boundingBox(),
			caption.boundingBox(),
		]);
		const center = (rectangle) => (rectangle?.x ?? 0) + ((rectangle?.width ?? 0) / 2);

		expect(bodyBounds).not.toBeNull();
		expect(frameBounds).not.toBeNull();
		expect(captionBounds).not.toBeNull();
		expect(center(frameBounds)).toBeCloseTo(center(bodyBounds), 0);
		expect(center(captionBounds)).toBeCloseTo(center(frameBounds), 0);
	});
});

for (const presentation of [
	{ name: 'prose-aligned', pathname: proseAlignedPath },
	{ name: 'centered-fit', pathname: centeredFitPath },
]) {
	test(`${presentation.name} media retains proportions at 320 CSS pixels and 200 percent text`, async ({ page }) => {
		await page.setViewportSize({ width: 320, height: 800 });
		await openPage(page, presentation.pathname);
		await page.addStyleTag({ content: 'html { font-size: 200% !important; }' });

		const overflow = await getHorizontalOverflow(page);
		expect(overflow.scrollWidth, JSON.stringify(overflow.offenders, null, 2)).toBeLessThanOrEqual(overflow.clientWidth + 1);
		const ratio = await page.locator('.managed-image').first().evaluate((image: HTMLImageElement) => {
			const bounds = image.getBoundingClientRect();
			return {
				natural: image.naturalWidth / image.naturalHeight,
				rendered: bounds.width / bounds.height,
			};
		});
		expect(ratio.rendered).toBeCloseTo(ratio.natural, 2);
	});
}

test('the mobile navigation overlay does not change the closed content geometry', async ({ page }) => {
	await page.setViewportSize({ width: 390, height: 844 });
	await openPage(page, proseAlignedPath);
	const content = page.locator('.site-content');
	const menu = page.locator('.mobile-nav-menu');
	const before = await content.boundingBox();

	await menu.locator(':scope > summary').click();
	const overlay = menu.locator('.mobile-nav-panel');
	await expect(overlay).toBeVisible();
	const overlayPresentation = await overlay.evaluate((node) => {
		const style = getComputedStyle(node);
		const bounds = node.getBoundingClientRect();
		return {
			background: style.backgroundColor,
			bottom: bounds.bottom,
			position: style.position,
			viewportHeight: window.innerHeight,
		};
	});
	const openBounds = await content.boundingBox();
	await page.keyboard.press('Escape');
	const after = await content.boundingBox();

	expect(overlayPresentation.position).toBe('fixed');
	expect(overlayPresentation.background).not.toBe('rgba(0, 0, 0, 0)');
	expect(overlayPresentation.bottom).toBeCloseTo(overlayPresentation.viewportHeight, 0);
	expect(openBounds?.x).toBeCloseTo(before?.x ?? 0, 0);
	expect(openBounds?.width).toBeCloseTo(before?.width ?? 0, 0);
	expect(after?.x).toBeCloseTo(before?.x ?? 0, 0);
	expect(after?.width).toBeCloseTo(before?.width ?? 0, 0);
});
