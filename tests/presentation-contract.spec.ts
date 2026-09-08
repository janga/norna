import { expect, test } from '@playwright/test';

const componentsPath = '/guide/components/';
const centeredFitPath = '/reference/';

const openComponents = async (page) => {
	await page.goto(componentsPath, { waitUntil: 'domcontentloaded' });
	await page.locator('[data-carousel-ready="true"]').waitFor();
};

const openCenteredFit = async (page) => {
	await page.goto(centeredFitPath, { waitUntil: 'domcontentloaded' });
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

const getSectionSurfaceBounds = (section) => section.evaluate((node) => {
	const rectangle = node.getBoundingClientRect();
	const style = getComputedStyle(node, '::before');
	const left = Number.parseFloat(style.left);
	const right = Number.parseFloat(style.right);
	return {
		left: rectangle.left + left,
		right: rectangle.right - right,
	};
});

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

test('wide Markdown tables scroll without widening the page', async ({ page }) => {
	await page.setViewportSize({ width: 320, height: 800 });
	await openComponents(page);
	const section = page.locator('.site-section').filter({ has: page.locator('#data-table') });
	const frame = section.locator('[data-table-frame]');
	const scrollRegion = frame.locator('[data-table-scroll]');
	await section.locator('table').evaluate((table) => {
		table.style.whiteSpace = 'nowrap';
	});
	await expect(frame).toHaveAttribute('data-table-overflow', 'true');
	await expect(frame).toHaveAttribute('data-table-at-start', 'true');
	await expect(frame).toHaveAttribute('data-table-at-end', 'false');

	const dimensions = await scrollRegion.evaluate((element) => ({
		clientWidth: element.clientWidth,
		overflowX: getComputedStyle(element).overflowX,
		scrollWidth: element.scrollWidth,
		tabIndex: element.tabIndex,
	}));
	const overflow = await getHorizontalOverflow(page);

	expect(dimensions.overflowX).toBe('auto');
	expect(dimensions.scrollWidth).toBeGreaterThan(dimensions.clientWidth);
	expect(dimensions.tabIndex).toBe(0);
	await expect.poll(() => frame.evaluate((element) => (
		Number.parseFloat(getComputedStyle(element, '::after').opacity)
	))).toBeGreaterThan(0.9);
	expect(overflow.scrollWidth, JSON.stringify(overflow.offenders, null, 2)).toBeLessThanOrEqual(overflow.clientWidth + 1);

	await scrollRegion.evaluate((element) => element.scrollTo({ left: element.scrollWidth }));
	await expect(frame).toHaveAttribute('data-table-at-start', 'false');
	await expect(frame).toHaveAttribute('data-table-at-end', 'true');
	await expect.poll(() => frame.evaluate((element) => (
		Number.parseFloat(getComputedStyle(element, '::before').opacity)
	))).toBeGreaterThan(0.9);
	await expect.poll(() => frame.evaluate((element) => (
		Number.parseFloat(getComputedStyle(element, '::after').opacity)
	))).toBeLessThan(0.1);
});

test('Focus reading preserves a table already using the vacant auxiliary lane', async ({ page }) => {
	await page.setViewportSize({ width: 1440, height: 1000 });
	await openComponents(page);
	const section = page.locator('.site-section').filter({ has: page.locator('#data-table') });
	const frame = section.locator('[data-table-frame]');
	const prose = section.locator('.section-markdown');
	await expect(frame).toHaveAttribute('data-table-ready', 'true');

	const before = await Promise.all([frame.boundingBox(), prose.boundingBox()]);
	const settings = page.locator('[data-display-settings]');
	await settings.locator('summary').click();
	await settings.getByRole('checkbox', { name: 'Focus reading' }).check();
	await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
	const after = await Promise.all([frame.boundingBox(), prose.boundingBox()]);

	expect(before.every(Boolean)).toBe(true);
	expect(after.every(Boolean)).toBe(true);
	expect(after[0]?.x).toBeCloseTo(before[0]?.x ?? 0, 0);
	expect(after[0]?.width).toBeCloseTo(before[0]?.width ?? 0, 0);
	expect(after[1]?.x).toBeCloseTo(before[1]?.x ?? 0, 0);
	expect(after[1]?.width).toBeCloseTo(before[1]?.width ?? 0, 0);
});

test('Focus reading releases both side lanes only for a table that needs them', async ({ page }) => {
	await page.setViewportSize({ width: 1440, height: 1000 });
	await openComponents(page);
	const layout = page.locator('.site-page-layout-tree');
	const navigation = page.locator('.tree-local-navigation');
	const prose = page.locator('.site-section').filter({ has: page.locator('#data-table') }).locator('.section-markdown');
	const frame = prose.locator('[data-table-frame]');
	const table = frame.locator('table');
	const [layoutBefore, navigationBefore, proseBefore] = await Promise.all([
		layout.boundingBox(),
		navigation.boundingBox(),
		prose.boundingBox(),
	]);
	expect(layoutBefore).not.toBeNull();
	expect(navigationBefore).not.toBeNull();
	expect(proseBefore).not.toBeNull();
	const normalEndWidth = (layoutBefore?.x ?? 0) + (layoutBefore?.width ?? 0) - (proseBefore?.x ?? 0);
	const targetWidth = normalEndWidth + (((layoutBefore?.width ?? 0) - normalEndWidth) / 2);

	await table.evaluate((element, width) => {
		element.style.width = `${width}px`;
		element.style.minWidth = `${width}px`;
		element.style.tableLayout = 'fixed';
	}, targetWidth);
	await expect(frame).toHaveAttribute('data-table-layout', 'canvas');
	await expect(frame).toHaveAttribute('data-table-overflow', 'true');
	const normalFrame = await frame.boundingBox();
	expect(normalFrame?.x ?? 0).toBeGreaterThanOrEqual(
		(navigationBefore?.x ?? 0) + (navigationBefore?.width ?? 0),
	);

	const settings = page.locator('[data-display-settings]');
	await settings.locator('summary').click();
	await settings.getByRole('checkbox', { name: 'Focus reading' }).check();
	await expect(frame).toHaveAttribute('data-table-layout', 'canvas');
	await expect(frame).toHaveAttribute('data-table-overflow', 'false');
	const [layoutAfter, frameAfter, proseAfter, tableAfter] = await Promise.all([
		layout.boundingBox(),
		frame.boundingBox(),
		prose.boundingBox(),
		table.boundingBox(),
	]);
	expect(frameAfter?.x).toBeCloseTo(layoutAfter?.x ?? 0, 0);
	expect(frameAfter?.width).toBeCloseTo(layoutAfter?.width ?? 0, 0);
	expect(proseAfter?.x).toBeCloseTo(proseBefore?.x ?? 0, 0);
	expect(proseAfter?.width).toBeCloseTo(proseBefore?.width ?? 0, 0);
	expect(Math.abs(
		((tableAfter?.x ?? 0) + (tableAfter?.width ?? 0))
		- ((layoutAfter?.x ?? 0) + (layoutAfter?.width ?? 0)),
	)).toBeLessThanOrEqual(
		1.1,
	);

	await table.evaluate((element, width) => {
		element.style.width = `${width}px`;
		element.style.minWidth = `${width}px`;
	}, (layoutAfter?.width ?? 0) + 300);
	await expect(frame).toHaveAttribute('data-table-overflow', 'true');
	const documentWidths = await page.evaluate(() => ({
		client: document.documentElement.clientWidth,
		scroll: document.documentElement.scrollWidth,
	}));
	expect(documentWidths.scroll).toBeLessThanOrEqual(documentWidths.client + 1);
});

test('a fitting long table keeps its headings below the sticky site header and releases them at its end', async ({ page }) => {
	await page.setViewportSize({ width: 1440, height: 720 });
	await openComponents(page);
	const section = page.locator('.site-section').filter({ has: page.locator('#data-table') });
	const frame = section.locator('[data-table-frame]');
	const table = frame.locator('table');
	const firstHeading = table.locator('thead th').first();
	await table.evaluate((element) => {
		element.style.width = '100%';
		element.style.tableLayout = 'fixed';
		element.querySelectorAll<HTMLElement>('th, td').forEach((cell) => {
			cell.style.overflowWrap = 'anywhere';
			cell.style.whiteSpace = 'normal';
		});
		const body = element.tBodies[0];
		const sourceRows = Array.from(body.rows);
		for (let index = 0; index < 18; index += 1) {
			for (const row of sourceRows) body.append(row.cloneNode(true));
		}
	});
	await expect(frame).toHaveAttribute('data-table-overflow', 'false');
	await expect(frame.locator('[data-table-scroll]')).not.toHaveAttribute('tabindex', '0');

	await frame.evaluate((element) => {
		window.scrollTo(0, window.scrollY + element.getBoundingClientRect().top + 120);
	});
	const [stickyHeading, stickyOffset] = await Promise.all([
		firstHeading.boundingBox(),
		page.evaluate(() => Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--site-top-anchor-offset'))),
	]);
	expect(stickyHeading).not.toBeNull();
	expect(stickyHeading?.y).toBeCloseTo(stickyOffset, 0);

	await frame.evaluate((element, offset) => {
		const rectangle = element.getBoundingClientRect();
		const absoluteBottom = window.scrollY + rectangle.bottom;
		window.scrollTo(0, absoluteBottom - offset - 8);
	}, stickyOffset);
	const [releasedHeading, releasedFrame] = await Promise.all([
		firstHeading.boundingBox(),
		frame.boundingBox(),
	]);
	expect(releasedHeading).not.toBeNull();
	expect(releasedFrame).not.toBeNull();
	expect((releasedHeading?.y ?? Infinity) + (releasedHeading?.height ?? 0)).toBeLessThanOrEqual(
		(releasedFrame?.y ?? 0) + (releasedFrame?.height ?? 0) + 1,
	);
	expect(releasedHeading?.y ?? Infinity).toBeLessThan(stickyOffset);
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
	await expect(page.locator('.display-settings summary')).toBeVisible();
});

test('authored navigation and controls meet the minimum target size', async ({ page }) => {
	await page.setViewportSize({ width: 390, height: 844 });
	await openComponents(page);
	await page.locator('.mobile-nav-menu > summary').click();
	const targets = await page.locator([
		'button',
		'summary',
		'.mobile-nav-panel a',
		'.page-nav a',
		'.site-nav a',
	].join(', ')).evaluateAll((nodes) => nodes.flatMap((node) => {
		const rectangle = node.getBoundingClientRect();
		if (!node.checkVisibility() || rectangle.width === 0 || rectangle.height === 0) return [];
		return [{
			height: rectangle.height,
			label: `${node.tagName.toLowerCase()}${node.className ? `.${String(node.className).trim().replaceAll(/\s+/g, '.')}` : ''} "${node.getAttribute('aria-label') ?? node.textContent?.trim() ?? node.tagName}"`,
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
	const control = page.locator('.display-settings summary');
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

test('code blocks expose an accessible copy control without changing copied text', async ({ page }) => {
	await page.addInitScript(() => {
		Object.defineProperty(navigator, 'clipboard', {
			configurable: true,
			value: {
				writeText: async (text: string) => {
					(window as Window & { copiedCode?: string }).copiedCode = text;
				},
			},
		});
	});
	await openComponents(page);

	const example = page.locator('.norna-code-example').first();
	const title = example.locator('.norna-code-title');
	const highlightedLine = example.locator('.norna-code-line-highlighted');
	await expect(title).toHaveText('Terminal');
	await expect(example.locator('figcaption + pre')).toBeVisible();
	await expect(highlightedLine).toHaveAttribute('data-line', '2');
	const emphasis = await highlightedLine.evaluate((node) => {
		const style = getComputedStyle(node);
		return {
			backgroundColor: style.backgroundColor,
			borderStyle: style.borderInlineStartStyle,
			borderWidth: Number.parseFloat(style.borderInlineStartWidth),
		};
	});
	expect(emphasis.backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
	expect(emphasis.borderStyle).toBe('solid');
	expect(emphasis.borderWidth).toBeGreaterThanOrEqual(3);

	const button = page.getByRole('button', { name: 'Copy code' }).first();
	await expect(button).toBeVisible();
	await expect(button.locator('[data-code-copy-icon="copy"]')).toBeVisible();
	await expect(button.locator('[data-code-copy-icon="copied"]')).toBeHidden();
	await expect(button.locator('[data-code-copy-icon="failed"]')).toBeHidden();
	await button.focus();
	await expect(button).toBeFocused();
	await button.press('Enter');
	await expect(button.locator('[data-code-copy-status]')).toHaveText('Copied');
	await expect.poll(() => page.evaluate(() => (
		(window as Window & { copiedCode?: string }).copiedCode
	))).toContain('npm run norna:check');
	await expect.poll(() => page.evaluate(() => (
		(window as Window & { copiedCode?: string }).copiedCode
	))).not.toContain('Terminal');

	await page.setViewportSize({ width: 320, height: 800 });
	await title.evaluate((node) => {
		node.textContent = 'site/pages/010-guide/pages/010-components/a-deliberately-long-code-example-filename.js';
	});
	const [titleBounds, buttonBounds, overflow] = await Promise.all([
		title.boundingBox(),
		button.boundingBox(),
		getHorizontalOverflow(page),
	]);
	expect(titleBounds).not.toBeNull();
	expect(buttonBounds).not.toBeNull();
	expect(titleBounds.y + titleBounds.height).toBeGreaterThanOrEqual(buttonBounds.y + buttonBounds.height);
	expect(overflow.scrollWidth, JSON.stringify(overflow.offenders, null, 2)).toBeLessThanOrEqual(overflow.clientWidth + 1);
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

	const highlightedLine = page.locator('.norna-code-line-highlighted');
	const lineCue = await highlightedLine.evaluate((node) => {
		const style = getComputedStyle(node);
		return {
			borderStyle: style.borderInlineStartStyle,
			borderWidth: Number.parseFloat(style.borderInlineStartWidth),
		};
	});
	expect(lineCue.borderStyle).toBe('solid');
	expect(lineCue.borderWidth).toBeGreaterThanOrEqual(3);
});

test('Display groups native reader controls and closes with Escape', async ({ page }) => {
	await page.setViewportSize({ width: 1280, height: 900 });
	await openComponents(page);
	const settings = page.locator('[data-display-settings]');
	const trigger = settings.locator('summary');
	await trigger.click();

	await expect(settings).toHaveAttribute('open', '');
	await expect(settings.getByRole('group', { name: 'Appearance' })).toBeVisible();
	await expect(settings.getByRole('group', { name: 'Reading width' })).toBeVisible();
	await expect(settings.getByRole('radio', { name: 'System' })).toBeChecked();
	await expect(settings.getByRole('radio', { name: 'Standard' })).toBeChecked();
	await expect(settings.getByRole('checkbox', { name: 'Focus reading' })).not.toBeChecked();
	await expect(settings.getByRole('button', { name: 'Reset' })).toBeVisible();

	await settings.getByRole('radio', { name: 'Standard' }).press('Escape');
	await expect(settings).not.toHaveAttribute('open', '');
	await expect(trigger).toBeFocused();
});

for (const viewport of [
	{ name: 'portrait', width: 320, height: 568 },
	{ name: 'landscape', width: 667, height: 375 },
]) {
	test(`Display panel stays visible and distinct in mobile ${viewport.name}`, async ({ page }) => {
		await page.setViewportSize({ width: viewport.width, height: viewport.height });
		await openComponents(page);
		const settings = page.locator('[data-display-settings]');
		await settings.locator('summary').click();

		const panel = settings.locator('.display-settings-panel');
		await expect(panel).toBeVisible();
		const presentation = await panel.evaluate((node) => {
			const rectangle = node.getBoundingClientRect();
			const panelStyle = getComputedStyle(node);
			const rootStyle = getComputedStyle(document.documentElement);
			return {
				bottom: rectangle.bottom,
				left: rectangle.left,
				panelBackground: panelStyle.backgroundColor,
				pageBackground: rootStyle.getPropertyValue('--color-page').trim(),
				right: rectangle.right,
				viewportHeight: window.visualViewport?.height ?? window.innerHeight,
				viewportWidth: window.visualViewport?.width ?? window.innerWidth,
			};
		});

		expect(presentation.left).toBeGreaterThanOrEqual(0);
		expect(presentation.right).toBeLessThanOrEqual(presentation.viewportWidth + 1);
		expect(presentation.bottom).toBeLessThanOrEqual(presentation.viewportHeight + 1);
		expect(presentation.panelBackground).not.toBe(presentation.pageBackground);
	});
}

test('reader preferences apply, persist, and reset as one bounded overlay', async ({ page, context }) => {
	await page.setViewportSize({ width: 1280, height: 900 });
	await openComponents(page);
	const settings = page.locator('[data-display-settings]');
	await settings.locator('summary').click();

	const standardWidth = await page.locator('.section-markdown').first().evaluate((node) => node.getBoundingClientRect().width);
	await settings.getByRole('radio', { name: 'Wide' }).check();
	const wideWidth = await page.locator('.section-markdown').first().evaluate((node) => node.getBoundingClientRect().width);
	expect(wideWidth).toBeGreaterThan(standardWidth + 20);
	const wideAlignment = await page.locator('.site-section').first().evaluate((section) => {
		const heading = section.querySelector('.section-header')?.getBoundingClientRect();
		const body = section.querySelector('.section-markdown')?.getBoundingClientRect();
		return {
			headingLeft: heading?.left,
			headingWidth: heading?.width,
			bodyLeft: body?.left,
			bodyWidth: body?.width,
		};
	});
	expect(wideAlignment.headingLeft).toBeCloseTo(wideAlignment.bodyLeft ?? 0, 0);
	expect(wideAlignment.headingWidth).toBeCloseTo(wideAlignment.bodyWidth ?? 0, 0);

	await settings.getByRole('radio', { name: 'Dark' }).check();
	await settings.getByRole('checkbox', { name: 'Focus reading' }).check();
	await expect(page.locator('html')).toHaveAttribute('data-appearance', 'dark');
	await expect(page.locator('html')).toHaveAttribute('data-reading-width', 'wide');
	await expect(page.locator('html')).toHaveAttribute('data-focus-reading', 'on');
	await expect(page.locator('.tree-local-navigation')).toBeHidden();
	await expect(settings.locator('summary')).toBeVisible();
	await expect(settings.locator('.display-settings-focus-status')).toBeVisible();
	await expect(settings.locator('.display-settings-focus-status')).toHaveText('Focus reading');

	const cookieNames = (await context.cookies()).map((cookie) => cookie.name);
	expect(cookieNames).toEqual(expect.arrayContaining([
		'norna-appearance',
		'norna-reading-width',
		'norna-focus-reading',
	]));

	await page.reload({ waitUntil: 'domcontentloaded' });
	await page.locator('[data-carousel-ready="true"]').waitFor();
	await expect(page.locator('html')).toHaveAttribute('data-appearance', 'dark');
	await expect(page.locator('html')).toHaveAttribute('data-reading-width', 'wide');
	await expect(page.locator('html')).toHaveAttribute('data-focus-reading', 'on');

	const reloadedSettings = page.locator('[data-display-settings]');
	await reloadedSettings.locator('summary').click();
	await reloadedSettings.getByRole('button', { name: 'Reset' }).click();
	await expect(page.locator('html')).toHaveAttribute('data-appearance', 'system');
	await expect(page.locator('html')).toHaveAttribute('data-reading-width', 'standard');
	await expect(page.locator('html')).toHaveAttribute('data-focus-reading', 'off');
	await expect(page.locator('.tree-local-navigation')).toBeVisible();
});

test('text-width card lists follow the active reading column', async ({ page }) => {
	await page.setViewportSize({ width: 1440, height: 1000 });
	await openComponents(page);
	const cardSection = page.locator('.site-section').filter({ has: page.locator('#card-list') });
	const cards = cardSection.locator('.card-list');
	const prose = cardSection.locator('.section-markdown').first();

	await cards.evaluate((element) => {
		element.classList.remove('card-list-width-normal');
		element.classList.add('card-list-width-text');
		document.documentElement.dataset.readingWidth = 'narrow';
	});
	await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(resolve)));

	const [cardsBounds, proseBounds] = await Promise.all([cards.boundingBox(), prose.boundingBox()]);
	expect(cardsBounds).not.toBeNull();
	expect(proseBounds).not.toBeNull();
	expect(cardsBounds?.x).toBeCloseTo(proseBounds?.x ?? 0, 0);
	expect(cardsBounds?.width).toBeCloseTo(proseBounds?.width ?? 0, 0);
});

for (const appearance of ['light', 'dark']) {
	test(`tree navigation shares the opaque page surface in ${appearance} appearance`, async ({ page }) => {
		await page.setViewportSize({ width: 1440, height: 1000 });
		await openComponents(page);
		await page.locator('html').evaluate((root, value) => {
			root.dataset.appearance = value;
		}, appearance);
		await page.waitForTimeout(250);

		const presentation = await page.evaluate(() => {
			const header = document.querySelector('.site-top');
			const navigation = document.querySelector('.tree-local-navigation');
			const navigationRow = document.querySelector('.site-nav-row');
			const layout = document.querySelector('.site-page-layout-tree');
			if (!header || !navigation || !navigationRow || !layout) {
				throw new Error('Missing tree-navigation layout elements.');
			}
			const headerStyle = getComputedStyle(header);
			const navigationStyle = getComputedStyle(navigation);
			const navigationRowBounds = navigationRow.getBoundingClientRect();
			const layoutBounds = layout.getBoundingClientRect();
			return {
				headerBackground: headerStyle.backgroundColor,
				layoutLeft: layoutBounds.left,
				layoutRight: layoutBounds.right,
				navigationBackground: navigationStyle.backgroundColor,
				navigationBorderStyle: navigationStyle.borderInlineEndStyle,
				navigationBorderWidth: Number.parseFloat(navigationStyle.borderInlineEndWidth),
				navigationRowLeft: navigationRowBounds.left,
				navigationRowRight: navigationRowBounds.right,
				pageBackground: getComputedStyle(document.body).backgroundColor,
			};
		});

		expect(presentation.headerBackground).toBe(presentation.pageBackground);
		expect(presentation.navigationBackground).toBe(presentation.pageBackground);
		expect(presentation.navigationBorderStyle).toBe('solid');
		expect(presentation.navigationBorderWidth).toBeGreaterThanOrEqual(1);
		expect(presentation.navigationRowLeft).toBeCloseTo(presentation.layoutLeft, 0);
		expect(presentation.navigationRowRight).toBeCloseTo(presentation.layoutRight, 0);
	});
}

test('prose-aligned stacks stay width-driven while carousels fit the viewport height', async ({ page }) => {
	await page.setViewportSize({ width: 1440, height: 1000 });
	await openComponents(page);
	await expect(page.locator('html')).toHaveAttribute('data-image-presentation', 'prose-aligned');

	const stackSection = page.locator('.site-section').filter({ has: page.locator('#image-stack') });
	const prose = stackSection.locator('.section-markdown').first();
	const frame = stackSection.locator('.managed-image-frame').first();
	const stackCaption = stackSection.locator('.image-meta').first();
	const portrait = stackSection.getByAltText('A tall diagram with three connected panels.');
	const carouselSection = page.locator('.site-section').filter({ has: page.locator('#image-carousel') });
	const carouselStage = carouselSection.locator('.image-carousel-stage');
	const carouselCaptions = carouselSection.locator('.image-carousel-captions');
	const carousel = carouselStage.locator('..');
	const [proseBounds, frameBounds, stackCaptionBounds, portraitBounds, carouselBounds, carouselCaptionBounds] = await Promise.all([
		prose.boundingBox(),
		frame.boundingBox(),
		stackCaption.boundingBox(),
		portrait.boundingBox(),
		carouselStage.boundingBox(),
		carouselCaptions.boundingBox(),
	]);

	expect(proseBounds).not.toBeNull();
	expect(frameBounds).not.toBeNull();
	expect(stackCaptionBounds).not.toBeNull();
	expect(portraitBounds).not.toBeNull();
	expect(carouselBounds).not.toBeNull();
	expect(carouselCaptionBounds).not.toBeNull();
	expect(frameBounds?.x).toBeCloseTo(proseBounds?.x ?? 0, 0);
	expect(stackCaptionBounds?.x).toBeCloseTo(frameBounds?.x ?? 0, 0);
	expect(portraitBounds?.x).toBeCloseTo(frameBounds?.x ?? 0, 0);
	expect(carouselBounds?.x).toBeCloseTo(proseBounds?.x ?? 0, 0);
	expect(carouselCaptionBounds?.x).toBeCloseTo(carouselBounds?.x ?? 0, 0);
	expect(frameBounds?.width ?? 0).toBeGreaterThan(proseBounds?.width ?? Infinity);
	expect(await portrait.evaluate((image) => getComputedStyle(image).maxHeight)).toBe('none');
	expect(carouselBounds?.height ?? Infinity).toBeLessThanOrEqual(740 + 1);
	expect(await carousel.getAttribute('style')).toContain('--image-carousel-width-from-height-desktop');
});

test('centered-fit images are centered and constrained by viewport height', async ({ page }) => {
	await page.setViewportSize({ width: 1440, height: 1000 });
	await openCenteredFit(page);
	await expect(page.locator('html')).toHaveAttribute('data-image-presentation', 'centered-fit');

	const stackSection = page.locator('.site-section').filter({ has: page.locator('#centered-fit-stack') });
	const stackBody = stackSection.locator('.section-body');
	const frame = stackSection.locator('.managed-image-frame');
	const stackCaption = stackSection.locator('.image-meta');
	const stackCaptionText = stackCaption.locator('.image-details span');
	const portrait = stackSection.getByAltText('A tall composition with a large circle above two bars.');
	const carouselSection = page.locator('.site-section').filter({ has: page.locator('#centered-fit-carousel') });
	const carouselStage = carouselSection.locator('.image-carousel-stage');
	const carouselCaptions = carouselSection.locator('.image-carousel-captions');
	const carouselCaptionText = carouselCaptions.locator('.image-carousel-caption').first().locator('.image-details span');
	const carousel = carouselStage.locator('..');
	const [
		bodyBounds,
		frameBounds,
		stackCaptionBounds,
		stackCaptionTextBounds,
		portraitBounds,
		carouselBounds,
		carouselCaptionBounds,
		carouselCaptionTextBounds,
	] = await Promise.all([
		stackBody.boundingBox(),
		frame.boundingBox(),
		stackCaption.boundingBox(),
		stackCaptionText.boundingBox(),
		portrait.boundingBox(),
		carouselStage.boundingBox(),
		carouselCaptions.boundingBox(),
		carouselCaptionText.boundingBox(),
	]);
	const center = (rectangle) => (rectangle?.x ?? 0) + ((rectangle?.width ?? 0) / 2);

	expect(bodyBounds).not.toBeNull();
	expect(frameBounds).not.toBeNull();
	expect(stackCaptionBounds).not.toBeNull();
	expect(stackCaptionTextBounds).not.toBeNull();
	expect(portraitBounds).not.toBeNull();
	expect(carouselBounds).not.toBeNull();
	expect(carouselCaptionBounds).not.toBeNull();
	expect(carouselCaptionTextBounds).not.toBeNull();
	expect(center(frameBounds)).toBeCloseTo(center(bodyBounds), 0);
	expect(center(portraitBounds)).toBeCloseTo(center(frameBounds), 0);
	expect(center(stackCaptionBounds)).toBeCloseTo(center(frameBounds), 0);
	expect(center(stackCaptionTextBounds)).toBeCloseTo(center(frameBounds), 0);
	expect(portraitBounds?.x ?? 0).toBeGreaterThan((frameBounds?.x ?? 0) + 1);
	expect(portraitBounds?.height ?? Infinity).toBeLessThanOrEqual(740 + 1);
	expect(center(carouselBounds)).toBeCloseTo(center(bodyBounds), 0);
	expect(center(carouselCaptionBounds)).toBeCloseTo(center(carouselBounds), 0);
	expect(center(carouselCaptionTextBounds)).toBeCloseTo(center(carouselBounds), 0);
	expect(carouselBounds?.height ?? Infinity).toBeLessThanOrEqual(740 + 1);
	expect(await carousel.getAttribute('style')).toContain('--image-carousel-width-from-height-desktop');
});

test('centered-fit image stacks and carousels stay within a 320 pixel viewport', async ({ page }) => {
	await page.setViewportSize({ width: 320, height: 800 });
	await openCenteredFit(page);

	const overflow = await getHorizontalOverflow(page);
	expect(overflow.scrollWidth, JSON.stringify(overflow.offenders, null, 2)).toBeLessThanOrEqual(overflow.clientWidth + 1);
	await expect(page.locator('.managed-image-frame')).toBeVisible();
	await expect(page.locator('.image-carousel-stage')).toBeVisible();
	await expect(page.locator('.image-carousel-button-previous')).toBeVisible();
	await expect(page.locator('.image-carousel-button-next')).toBeVisible();
});

test('prose-aligned portrait carousels retain the automatic mobile height limit', async ({ page }) => {
	await page.setViewportSize({ width: 700, height: 800 });
	await openCenteredFit(page);
	await page.locator('html').evaluate((root) => {
		root.dataset.imagePresentation = 'prose-aligned';
	});
	await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(resolve)));

	const carouselStage = page.locator('.image-carousel-stage');
	const carouselBounds = await carouselStage.boundingBox();
	const proseBounds = await page.locator('.site-section')
		.filter({ has: page.locator('#centered-fit-carousel') })
		.locator('.section-markdown')
		.first()
		.boundingBox();

	expect(carouselBounds).not.toBeNull();
	expect(proseBounds).not.toBeNull();
	expect(carouselBounds?.height ?? Infinity).toBeLessThanOrEqual(544 + 1);
	expect(carouselBounds?.x).toBeCloseTo(proseBounds?.x ?? 0, 0);
});

test('image presentation changes carousel alignment without removing viewport fitting', async ({ page }) => {
	await page.setViewportSize({ width: 1440, height: 1000 });
	await openCenteredFit(page);
	const centeredFitStage = await page.locator('.image-carousel-stage').boundingBox();
	await page.locator('html').evaluate((root) => {
		root.dataset.imagePresentation = 'prose-aligned';
	});
	await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(resolve)));
	const proseAlignedStage = await page.locator('.image-carousel-stage').boundingBox();
	const prose = await page.locator('.site-section')
		.filter({ has: page.locator('#centered-fit-carousel') })
		.locator('.section-markdown')
		.first()
		.boundingBox();

	expect(centeredFitStage).not.toBeNull();
	expect(proseAlignedStage).not.toBeNull();
	expect(prose).not.toBeNull();
	expect(proseAlignedStage?.width).toBeCloseTo(centeredFitStage?.width ?? 0, 0);
	expect(proseAlignedStage?.height ?? Infinity).toBeLessThanOrEqual(740 + 1);
	expect(proseAlignedStage?.x).toBeCloseTo(prose?.x ?? 0, 0);
	expect(centeredFitStage?.x ?? 0).toBeGreaterThan(proseAlignedStage?.x ?? Infinity);

	await openComponents(page);
	const cards = page.locator('.card-list');
	const cardsBefore = await cards.boundingBox();
	await page.locator('html').evaluate((root) => {
		root.dataset.imagePresentation = 'centered-fit';
	});
	await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(resolve)));
	const cardsAfter = await cards.boundingBox();
	expect(cardsBefore).not.toBeNull();
	expect(cardsAfter).not.toBeNull();
	expect(cardsAfter?.x).toBeCloseTo(cardsBefore?.x ?? 0, 0);
	expect(cardsAfter?.width).toBeCloseTo(cardsBefore?.width ?? 0, 0);
});

test('tree layout gives prose and structured blocks one shared inline origin', async ({ page }) => {
	await page.setViewportSize({ width: 1440, height: 1000 });
	await openComponents(page);
	const elements = [
		page.locator('.section-header').first(),
		page.locator('.section-markdown').first(),
		page.locator('.card-list').first(),
		page.locator('.managed-image-frame').first(),
		page.locator('.image-carousel-stage').first(),
		page.locator('.image-carousel-captions').first(),
	];
	const bounds = await Promise.all(elements.map((element) => element.boundingBox()));
	const expectedLeft = bounds[0]?.x;

	expect(expectedLeft).toBeDefined();
	for (const [index, rectangle] of bounds.entries()) {
		expect(rectangle, `layout element ${index}`).not.toBeNull();
		expect(rectangle?.x, `layout element ${index}`).toBeCloseTo(expectedLeft ?? 0, 0);
	}
});

test('structured content starts below a preceding margin note', async ({ page }) => {
	await page.setViewportSize({ width: 1440, height: 1000 });
	await openComponents(page);
	await page.evaluate(() => {
		const sourceNote = document.querySelector('.section-note');
		if (!sourceNote) throw new Error('Missing source note.');

		for (const headingId of ['data-table', 'image-stack', 'image-carousel', 'card-list']) {
			const heading = document.getElementById(headingId);
			const paragraph = heading?.closest('.site-section')?.querySelector('.section-markdown p');
			if (!paragraph) throw new Error(`Missing paragraph for ${headingId}.`);
			const note = sourceNote.cloneNode(true) as HTMLElement;
			note.removeAttribute('id');
			paragraph.append(note);
		}
	});

	for (const headingId of ['data-table', 'image-stack', 'image-carousel', 'card-list']) {
		const section = page.locator('.site-section').filter({ has: page.locator(`#${headingId}`) });
		const note = section.locator('.section-note');
		const structuredContent = section.locator(':scope .norna-table-frame, :scope .image-stack, :scope .managed-images, :scope .card-list');
		const [noteBounds, contentBounds] = await Promise.all([
			note.boundingBox(),
			structuredContent.boundingBox(),
		]);

		expect(noteBounds).not.toBeNull();
		expect(contentBounds).not.toBeNull();
		expect(contentBounds?.y ?? 0, headingId).toBeGreaterThanOrEqual(
			(noteBounds?.y ?? 0) + (noteBounds?.height ?? 0),
		);
	}
});

test('focus reading preserves content geometry and the reading position', async ({ page }) => {
	await page.setViewportSize({ width: 1440, height: 1000 });
	await openComponents(page);
	await page.addStyleTag({ content: '.site-brand-logo { height: 5rem !important; width: auto !important; }' });
	const imageStackSection = page.locator('.site-section').filter({ has: page.locator('#image-stack') });
	const imageStackHeading = imageStackSection.locator('.section-header');
	const elements = [
		page.locator('.section-markdown').first(),
		page.locator('.card-list').first(),
		imageStackSection.locator('.section-markdown'),
		imageStackSection.locator('.managed-image-frame').first(),
		imageStackSection.locator('.image-meta').first(),
	];
	await imageStackHeading.evaluate((heading) => {
		window.scrollTo(0, window.scrollY + heading.getBoundingClientRect().top - 180);
	});

	const settings = page.locator('[data-display-settings]');
	await settings.locator('summary').click();
	const stickyHeaderBefore = await page.locator('.site-top').boundingBox();
	const headingTopBefore = await imageStackHeading.evaluate((heading) => heading.getBoundingClientRect().top);
	const geometryBefore = await Promise.all(elements.map((element) => element.boundingBox()));
	const surfaceBefore = await getSectionSurfaceBounds(imageStackSection);
	await settings.getByRole('checkbox', { name: 'Focus reading' }).check();
	await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));

	const headingTopAfter = await imageStackHeading.evaluate((heading) => heading.getBoundingClientRect().top);
	const stickyHeaderAfter = await page.locator('.site-top').boundingBox();
	const geometryAfter = await Promise.all(elements.map((element) => element.boundingBox()));
	const surfaceAfter = await getSectionSurfaceBounds(imageStackSection);
	expect(geometryBefore.every(Boolean)).toBe(true);
	expect(geometryAfter.every(Boolean)).toBe(true);
	expect(stickyHeaderBefore).not.toBeNull();
	expect(stickyHeaderAfter).not.toBeNull();
	expect(stickyHeaderAfter?.height).toBeCloseTo(stickyHeaderBefore?.height ?? 0, 0);
	expect(headingTopAfter).toBeCloseTo(headingTopBefore, 0);
	for (const [index, rectangle] of geometryBefore.entries()) {
		expect(geometryAfter[index]?.x).toBeCloseTo(rectangle?.x ?? 0, 0);
		expect(geometryAfter[index]?.width).toBeCloseTo(rectangle?.width ?? 0, 0);
	}
	expect(surfaceAfter.left).toBeCloseTo(surfaceBefore.left, 0);
	expect(surfaceAfter.right).toBeCloseTo(surfaceBefore.right, 0);
});

test('configured presentation remains usable without JavaScript', async ({ browser }) => {
	const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 1280, height: 900 } });
	const page = await context.newPage();
	await page.goto(componentsPath, { waitUntil: 'domcontentloaded' });

	await expect(page.locator('html')).toHaveAttribute('data-appearance', 'system');
	await expect(page.locator('html')).toHaveAttribute('data-reading-width', 'standard');
	await expect(page.locator('.site-content h1').first()).toBeVisible();
	await expect(page.locator('.tree-local-navigation')).toBeVisible();
	await expect(page.locator('[data-display-settings]')).toBeHidden();
	await context.close();
});
