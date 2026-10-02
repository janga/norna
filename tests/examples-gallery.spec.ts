import { expect, test } from '@playwright/test';

test.use({ reducedMotion: 'reduce' });

const section = (page, id: string) => page.locator('.site-section').filter({ has: page.locator(`#${id}`) });

test('nested Markdown list stays indented below its parent item', async ({ page }) => {
	await page.goto('examples/standard-markdown/#lists');
	const list = section(page, 'lists').locator('.section-markdown > ul').filter({ hasText: 'Before the visit' });
	await expect(list.locator(':scope > li')).toHaveCount(2);
	await expect(list.locator(':scope > li:first-child > ul > li')).toHaveCount(2);

	for (const width of [1440, 390]) {
		await page.setViewportSize({ width, height: 900 });
		const placement = await list.evaluate((root) => {
			const parent = root.querySelector(':scope > li:first-child')!;
			const nested = parent.querySelector(':scope > ul')!;
			const text = document.createRange();
			text.selectNode(parent.firstChild!);
			return {
				display: getComputedStyle(nested).display,
				parent: text.getBoundingClientRect().toJSON(),
				child: nested.querySelector('li')!.getBoundingClientRect().toJSON(),
			};
		});
		expect(placement.display).toBe('block');
		expect(placement.child.top).toBeGreaterThanOrEqual(placement.parent.bottom - 1);
		expect(placement.child.left).toBeGreaterThan(placement.parent.left);
	}
});

test('the gallery keeps its table source readable and bounded at every width', async ({ page }) => {
	await page.setViewportSize({ width: 1440, height: 1000 });
	await page.goto('examples/common-markdown-extensions/#tables');
	const tables = section(page, 'tables');
	const comparison = tables.locator('table').filter({ hasText: 'Capability' });
	const code = tables.locator('.code-block').filter({ hasText: '| Capability' });
	await expect(code).toHaveAttribute('data-code-overflow', 'false');
	await expect(comparison.locator('tbody tr')).toHaveCount(11);
	await expect(comparison.locator('thead th')).toHaveCount(6);
	await expect(code.locator('pre code')).toContainText('| Capability');
	const widths = await tables.evaluate((node) => ({
		prose: node.querySelector('.section-markdown')!.getBoundingClientRect().width,
		code: node.querySelector('.code-block')!.getBoundingClientRect().width,
	}));
	expect(widths.code).toBeGreaterThan(widths.prose);

	for (const width of [1440, 1024, 390]) {
		await page.setViewportSize({ width, height: 900 });
		for (const appearance of ['light', 'dark']) {
			await page.locator('html').evaluate((root, value) => { root.dataset.appearance = value; }, appearance);
			await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
			if (width === 390) {
				await expect(code).toHaveAttribute('data-code-overflow', 'true');
				await expect(code.locator('pre')).toHaveAttribute('tabindex', '0');
				await expect(tables.locator('.norna-table-frame').filter({ hasText: 'Capability' })).toHaveAttribute('data-table-overflow', 'true');
			}
		}
	}
	await page.setViewportSize({ width: 1440, height: 1000 });
	await page.locator('html').evaluate((root) => {
		root.dataset.focusReading = 'on';
		root.dataset.readingWidth = 'wide';
	});
	await expect(code).toHaveAttribute('data-code-overflow', 'false');
	await expect(page.locator('.tree-local-navigation')).toBeHidden();
	await expect(page.locator('.mobile-nav-menu > summary')).toBeVisible();
});

test('the overview links to six areas with working media and attachments', async ({ page }) => {
	await page.goto('examples/');
	const links = page.locator('.child-page-list a');
	await expect(links).toHaveCount(6);
	await expect(links.first()).toContainText('Standard Markdown');
	await expect(links.first()).toHaveAttribute('href', /\/examples\/standard-markdown\/$/);
	const destinations = await links.evaluateAll((links: HTMLAnchorElement[]) => links.map(link => link.href));
	for (const destination of destinations) {
		await page.goto(destination);
		await expect(page.locator('#main-content h1')).toHaveCount(1);
		await expect(page.locator('#main-content :is(h4,h5,h6)')).toHaveCount(0);
		await page.evaluate(async () => {
			await Promise.all(Array.from(document.querySelectorAll<HTMLImageElement>('#main-content img'), async (image) => {
				image.loading = 'eager';
				await image.decode().catch(() => {});
			}));
		});
		expect(await page.locator('#main-content img').evaluateAll((images: HTMLImageElement[]) => images.filter((image) => !image.naturalWidth).map((image) => image.src))).toEqual([]);
	}
	await page.goto('examples/everyday-markdown/');
	await expect(page).toHaveURL(/\/examples\/standard-markdown\/$/);
	await expect(page.locator('#main-content h1')).toHaveText('Standard Markdown');
	await page.goto('examples/common-markdown-extensions/');
	for (const type of ['note', 'tip', 'important', 'warning', 'caution', 'danger']) {
		await expect(section(page, 'semantic-callouts').locator(`.norna-callout-${type}`)).toHaveCount(1);
	}
	await page.goto('examples/building-a-site/');
	const attachment = page.locator('#main-content a[href$="/examples/building-a-site/downloads/visit-checklist.txt"]');
	await expect(attachment).toHaveCount(1);
	const response = await page.request.get((await attachment.getAttribute('href'))!);
	expect(response.ok()).toBe(true);
	expect(await response.text()).toContain('Visit checklist');
	await page.goto('examples/norna-extensions/');
	await expect(section(page, 'image-carousels').locator('[data-carousel]')).toHaveAttribute('data-carousel-ready', 'true');
});

test.describe('gallery without JavaScript', () => {
	test.use({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
	test('keeps table cells, source, images, and native navigation available', async ({ page }) => {
		await page.goto('examples/common-markdown-extensions/#tables');
		await expect(section(page, 'tables').locator('table').filter({ hasText: 'Capability' }).locator('tbody tr')).toHaveCount(11);
		await expect(section(page, 'tables').locator('pre code').filter({ hasText: '| Capability' })).toContainText('| Capability');
		await expect(page.locator('.code-block-copy')).toHaveCount(0);
		await page.goto('examples/norna-extensions/#tabs');
		await expect(section(page, 'tabs').locator('[data-tab-panel]:visible')).toHaveCount(2);
		const carousel = section(page, 'image-carousels').locator('[data-carousel]');
		await expect(carousel.locator('img')).toHaveCount(3);
		await expect(carousel.locator('a')).toHaveCount(0);
		await expect(carousel.locator('[data-carousel-next]')).toBeHidden();
		await page.locator('.mobile-nav-menu > summary').click();
		await expect(page.locator('.mobile-nav-menu')).toHaveAttribute('open');
		await expect(page.locator('.mobile-nav-menu a[href="#tabs"]')).toBeVisible();
	});
});

test('gallery alternatives retain exact code and a stable page outline', async ({ page }) => {
	await page.goto('examples/norna-extensions/#tabs');
	const example = section(page, 'tabs');
	const group = example.locator('[data-content-tabs]');
	const headings = await page.locator('#main-content :is(h1,h2,h3)').allTextContents();
	await group.getByRole('tab', { name: 'Windows' }).click();
	await expect(group.getByRole('tabpanel').locator('pre code')).toHaveText('winget install ImageMagick.ImageMagick');
	await group.getByRole('tab', { name: 'macOS' }).focus();
	await page.keyboard.press('Home');
	await expect(group.getByRole('tabpanel').locator('pre code')).toHaveText('brew install imagemagick');
	await expect(group.getByRole('tabpanel').locator('.norna-callout-tip')).toBeVisible();
	expect(await page.locator('#main-content :is(h1,h2,h3)').allTextContents()).toEqual(headings);
	await expect(example.locator('a[href$="/reference/content/tabs/"]')).toHaveCount(1);
	for (const width of [1440, 1024, 390]) {
		await page.setViewportSize({ width, height: 900 });
		await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
	}
});
