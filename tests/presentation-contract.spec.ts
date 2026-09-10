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
	await expect(frame.locator('[data-table-navigation]')).toBeHidden();

	let stickyOffset = 0;
	for (const width of [1440, 1100, 900]) {
		await page.setViewportSize({ width, height: 720 });
		await page.evaluate(() => {
			window.scrollTo(0, 0);
			return new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
		});
		await expect(frame).toHaveAttribute('data-table-overflow', 'false');
		await frame.evaluate((element) => {
			window.scrollTo(0, window.scrollY + element.getBoundingClientRect().top + 120);
		});
		const [stickyHeading, currentStickyOffset] = await Promise.all([
			firstHeading.boundingBox(),
			page.evaluate(() => Number.parseFloat(
				getComputedStyle(document.documentElement).getPropertyValue('--site-top-anchor-offset'),
			)),
		]);
		expect(stickyHeading).not.toBeNull();
		expect(stickyHeading?.y).toBeCloseTo(currentStickyOffset, 0);
		stickyOffset = currentStickyOffset;
	}

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

test('an overflowing long table keeps a synchronized visual heading while the semantic table scrolls', async ({ page }) => {
	await page.setViewportSize({ width: 1440, height: 720 });
	await openComponents(page);
	const section = page.locator('.site-section').filter({ has: page.locator('#data-table') });
	const frame = section.locator('[data-table-frame]');
	const scrollRegion = frame.locator('[data-table-scroll]');
	const table = frame.locator('table');
	const stickyHeading = frame.locator('[data-table-sticky-heading]');
	const tableNavigation = frame.locator('[data-table-navigation]');
	const previousColumns = tableNavigation.getByRole('button', { name: 'Show previous columns' });
	const nextColumns = tableNavigation.getByRole('button', { name: 'Show next columns' });
	const originalHeadings = table.locator('thead th');
	const visualHeadings = stickyHeading.locator('.norna-table-sticky-heading-cell');

	await table.evaluate((element) => {
		const frame = element.closest<HTMLElement>('[data-table-frame]');
		if (!frame) throw new Error('Missing table frame.');
		element.style.width = `${frame.clientWidth + 1600}px`;
		element.style.minWidth = `${frame.clientWidth + 1600}px`;
		element.style.tableLayout = 'fixed';
		const body = element.tBodies[0];
		const sourceRows = Array.from(body.rows);
		for (let index = 0; index < 18; index += 1) {
			for (const row of sourceRows) body.append(row.cloneNode(true));
		}
	});
	await expect(frame).toHaveAttribute('data-table-overflow', 'true');
	await expect(frame).toHaveAttribute('data-table-sticky-heading', 'true');
	await expect(tableNavigation).toBeVisible();
	await expect(tableNavigation.getByRole('group', { name: 'Table columns' })).toBeVisible();
	await expect(tableNavigation.locator('.norna-table-navigation-label')).toHaveCount(0);
	await expect(previousColumns).toBeDisabled();
	await expect(nextColumns).toBeEnabled();
	await expect(scrollRegion).toHaveAttribute('aria-describedby', /norna-table-overflow-/);
	await expect(frame.locator('[data-table-overflow-description]')).toHaveText(
		'More table columns are available horizontally.',
	);
	await expect(stickyHeading).toHaveAttribute('aria-hidden', 'true');
	await expect(stickyHeading).toHaveAttribute('inert', '');
	await expect(stickyHeading).toHaveCSS('pointer-events', 'none');
	await expect(stickyHeading.locator('table')).toHaveCount(0);
	await expect(visualHeadings).toHaveCount(await originalHeadings.count());
	await expect(page.getByRole('columnheader')).toHaveCount(await originalHeadings.count());
	const [navigationBounds, controlsBounds, previousBounds, nextBounds] = await Promise.all([
		tableNavigation.boundingBox(),
		tableNavigation.locator('.norna-table-navigation-buttons').boundingBox(),
		previousColumns.boundingBox(),
		nextColumns.boundingBox(),
	]);
	expect(navigationBounds).not.toBeNull();
	expect(controlsBounds).not.toBeNull();
	expect(previousBounds?.width ?? 0).toBeGreaterThanOrEqual(44);
	expect(previousBounds?.height ?? 0).toBeGreaterThanOrEqual(44);
	expect(nextBounds?.width ?? 0).toBeGreaterThanOrEqual(44);
	expect(nextBounds?.height ?? 0).toBeGreaterThanOrEqual(44);
	expect((controlsBounds?.x ?? 0) + (controlsBounds?.width ?? 0)).toBeCloseTo(
		(navigationBounds?.x ?? 0) + (navigationBounds?.width ?? 0),
		0,
	);

	await frame.evaluate((element) => {
		window.scrollTo(0, window.scrollY + element.getBoundingClientRect().top + 120);
	});
	const stickyOffset = await page.evaluate(() => Number.parseFloat(
		getComputedStyle(document.documentElement).getPropertyValue('--site-top-anchor-offset'),
	));
	await expect.poll(async () => (await tableNavigation.boundingBox())?.y).toBeCloseTo(stickyOffset, 0);
	await expect.poll(async () => {
		const [navigationBounds, headingBounds] = await Promise.all([
			tableNavigation.boundingBox(),
			stickyHeading.boundingBox(),
		]);
		if (!navigationBounds || !headingBounds) return null;
		return headingBounds.y - (navigationBounds.y + navigationBounds.height);
	}).toBeCloseTo(0, 0);

	const expectHeadingsAligned = async () => {
		const [originalBounds, visualBounds, stickyDebug] = await Promise.all([
			originalHeadings.evaluateAll((headings) => headings.map((heading) => {
				const bounds = heading.getBoundingClientRect();
				return { width: bounds.width, x: bounds.x };
			})),
			visualHeadings.evaluateAll((headings) => headings.map((heading) => {
				const bounds = heading.getBoundingClientRect();
				return { width: bounds.width, x: bounds.x };
			})),
			stickyHeading.evaluate((heading) => ({
				direction: getComputedStyle(heading).direction,
				left: heading.getBoundingClientRect().left,
				trackTransform: (heading.firstElementChild as HTMLElement | null)?.style.transform,
				visualLeft: (heading.firstElementChild?.firstElementChild as HTMLElement | null)?.style.left,
			})),
		]);
		expect(visualBounds).toHaveLength(originalBounds.length);
		for (const [index, original] of originalBounds.entries()) {
			expect(
				visualBounds[index]?.x,
				JSON.stringify({ originalBounds, stickyDebug, visualBounds }, null, 2),
			).toBeCloseTo(original.x, 0);
			expect(visualBounds[index]?.width).toBeCloseTo(original.width, 0);
		}
	};

	await expectHeadingsAligned();
	const [initialScrollPosition, tableScrollDimensions] = await Promise.all([
		page.evaluate(() => window.scrollY),
		scrollRegion.evaluate((element) => ({
			clientWidth: element.clientWidth,
			maximumScroll: element.scrollWidth - element.clientWidth,
		})),
	]);
	await nextColumns.click();
	const expectedControlScroll = Math.min(
		tableScrollDimensions.maximumScroll,
		Math.round(tableScrollDimensions.clientWidth * 0.8),
	);
	await expect.poll(async () => Math.abs(
		Math.abs(await scrollRegion.evaluate((element) => element.scrollLeft)) - expectedControlScroll,
	)).toBeLessThanOrEqual(2);
	expect(await page.evaluate(() => window.scrollY)).toBeCloseTo(initialScrollPosition, 0);
	await expect(previousColumns).toBeEnabled();
	await previousColumns.click();
	await expect.poll(() => scrollRegion.evaluate((element) => Math.abs(element.scrollLeft))).toBeLessThanOrEqual(2);
	await expect(previousColumns).toBeDisabled();
	await expect(nextColumns).toBeEnabled();

	await scrollRegion.focus();
	await page.keyboard.press('ArrowRight');
	await expect.poll(() => scrollRegion.evaluate((element) => Math.abs(element.scrollLeft))).toBeGreaterThan(0);
	await scrollRegion.evaluate((element) => {
		element.scrollLeft = (element.scrollWidth - element.clientWidth) / 2;
	});
	await expect(frame).toHaveAttribute('data-table-at-start', 'false');
	await expect(frame).toHaveAttribute('data-table-at-end', 'false');
	await expectHeadingsAligned();
	await scrollRegion.evaluate((element) => {
		element.scrollLeft = element.scrollWidth;
	});
	await expect(frame).toHaveAttribute('data-table-at-end', 'true');
	await expectHeadingsAligned();

	await page.evaluate(() => document.documentElement.setAttribute('dir', 'rtl'));
	await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
	await scrollRegion.evaluate((element) => { element.scrollLeft = 0; });
	await expect(frame).toHaveAttribute('data-table-at-start', 'true');
	await expect(previousColumns).toBeDisabled();
	await expect(nextColumns).toBeEnabled();
	await expectHeadingsAligned();
	await scrollRegion.evaluate((element) => {
		element.scrollLeft = 0 - ((element.scrollWidth - element.clientWidth) / 2);
	});
	await expect(frame).toHaveAttribute('data-table-at-start', 'false');
	await expect(frame).toHaveAttribute('data-table-at-end', 'false');
	await expectHeadingsAligned();
	await scrollRegion.evaluate((element) => {
		element.scrollLeft = 0 - element.scrollWidth;
	});
	await expect(frame).toHaveAttribute('data-table-at-end', 'true');
	await expect(previousColumns).toBeEnabled();
	await expect(nextColumns).toBeDisabled();
	await expectHeadingsAligned();

	await page.evaluate(() => document.documentElement.setAttribute('dir', 'ltr'));
	await page.setViewportSize({ width: 1280, height: 720 });
	await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
	await expect(frame).toHaveAttribute('data-table-sticky-heading', 'true');
	await expectHeadingsAligned();

	const settings = page.locator('[data-display-settings]');
	await settings.locator('summary').click();
	await settings.getByRole('checkbox', { name: 'Focus reading' }).check();
	await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
	await expect(frame).toHaveAttribute('data-table-sticky-heading', 'true');
	await expectHeadingsAligned();
	await settings.getByRole('radio', { name: 'Dark' }).check();
	const [originalBackground, visualBackground, navigationBackground] = await Promise.all([
		originalHeadings.first().evaluate((heading) => getComputedStyle(heading).backgroundColor),
		visualHeadings.first().evaluate((heading) => getComputedStyle(heading).backgroundColor),
		tableNavigation.evaluate((navigation) => getComputedStyle(navigation).backgroundColor),
	]);
	expect(visualBackground).toBe(originalBackground);
	expect(navigationBackground).toBe(originalBackground);
	await page.emulateMedia({ forcedColors: 'active' });
	const [forcedOriginalBackground, forcedVisualBackground, forcedNavigationBackground] = await Promise.all([
		originalHeadings.first().evaluate((heading) => getComputedStyle(heading).backgroundColor),
		visualHeadings.first().evaluate((heading) => getComputedStyle(heading).backgroundColor),
		tableNavigation.evaluate((navigation) => getComputedStyle(navigation).backgroundColor),
	]);
	expect(forcedVisualBackground).toBe(forcedOriginalBackground);
	expect(forcedNavigationBackground).toBe(forcedOriginalBackground);
	expect(forcedVisualBackground).not.toBe('rgba(0, 0, 0, 0)');
	await page.emulateMedia({ forcedColors: 'none' });

	await frame.evaluate((element, offset) => {
		const bounds = element.getBoundingClientRect();
		const absoluteBottom = window.scrollY + bounds.bottom;
		window.scrollTo(0, absoluteBottom - offset - 8);
	}, stickyOffset);
	const [releasedNavigation, releasedHeading, releasedFrame] = await Promise.all([
		tableNavigation.boundingBox(),
		stickyHeading.boundingBox(),
		frame.boundingBox(),
	]);
	expect(releasedNavigation).not.toBeNull();
	expect(releasedHeading).not.toBeNull();
	expect(releasedFrame).not.toBeNull();
	expect(releasedNavigation?.y ?? Infinity).toBeLessThan(stickyOffset);
	expect(releasedHeading?.y ?? Infinity).toBeLessThan(stickyOffset);
	expect((releasedHeading?.y ?? 0) + (releasedHeading?.height ?? 0)).toBeLessThanOrEqual(
		(releasedFrame?.y ?? 0) + (releasedFrame?.height ?? 0) + 1,
	);
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
	await title.locator('.norna-code-title-text').evaluate((node) => {
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

test('a long titled code example keeps and releases its context bar at its own boundaries', async ({ page }) => {
	await page.setViewportSize({ width: 1280, height: 600 });
	await openComponents(page);
	const example = page.locator('.norna-code-example').first();
	const title = example.locator('.norna-code-title');
	const button = example.getByRole('button', { name: 'Copy code' });
	await example.locator('pre').evaluate((node) => {
		node.style.minHeight = '1400px';
	});

	await example.evaluate((node) => window.scrollTo(0, node.getBoundingClientRect().top + window.scrollY + 180));
	await expect.poll(async () => {
		const [header, context, control] = await Promise.all([
			page.locator('.site-top').boundingBox(),
			title.boundingBox(),
			button.boundingBox(),
		]);
		if (!header || !context || !control) return null;
		return control.y >= context.y
			&& control.y + control.height <= context.y + context.height
			&& Math.abs(context.y - (header.y + header.height)) <= 1;
	}).toBe(true);

	await example.evaluate((node) => {
		const bottom = node.getBoundingClientRect().bottom + window.scrollY;
		window.scrollTo(0, bottom - 10);
	});
	await expect.poll(async () => {
		const [header, context] = await Promise.all([
			page.locator('.site-top').boundingBox(),
			title.boundingBox(),
		]);
		if (!header || !context) return false;
		return context.y + context.height < header.y + header.height;
	}).toBe(true);
});

test('detailed stack images retain a direct link and open an accessible inspector', async ({ page }) => {
	await page.setViewportSize({ width: 1280, height: 900 });
	await openComponents(page);
	const trigger = page.locator('[data-image-inspection-trigger]').nth(1);
	const inlineImage = trigger.locator('img');
	const dialog = page.locator('[data-image-inspector]');
	const inspectedImage = dialog.locator('[data-image-inspector-image]');
	const sizeButton = dialog.getByRole('button', { name: 'Show actual size' });
	const closeButton = dialog.getByRole('button', { name: 'Close image inspection' });

	await expect(trigger).toHaveAttribute('href', /\/images\/original\/.*stack-one-[a-f0-9]+\.svg$/);
	await expect(trigger).toHaveAttribute('data-image-inspection-available', 'true');
	await trigger.focus();
	await trigger.press('Enter');
	await expect(dialog).toBeVisible();
	await expect(closeButton).toBeFocused();
	await expect(inspectedImage).toHaveAttribute('alt', await inlineImage.getAttribute('alt') ?? '');
	await expect(inspectedImage).toHaveAttribute('aria-describedby', 'image-inspector-caption');
	await expect(dialog.locator('[data-image-inspector-caption]')).toContainText('concise caption');
	await expect(dialog.locator('[data-image-inspector-media]')).toHaveAttribute('data-image-inspector-mode', 'fit');
	await expect(sizeButton).toBeHidden();
	await page.keyboard.press('Escape');
	await expect(dialog).not.toBeVisible();
	await expect(trigger).toBeFocused();

	await trigger.evaluate((element) => {
		const canvas = document.createElement('canvas');
		canvas.width = 1000;
		canvas.height = 600;
		element.href = canvas.toDataURL('image/png');
		element.dataset.imageIntrinsicWidth = '1000';
		element.dataset.imageIntrinsicHeight = '600';
		delete element.dataset.imageInspectionScalable;
		window.dispatchEvent(new Event('resize'));
	});
	await expect(trigger).toHaveAttribute('data-image-inspection-available', 'true');
	await trigger.click();
	await expect(dialog).toBeVisible();
	await expect(sizeButton).toBeHidden();
	await page.keyboard.press('Escape');
});

test('the image inspector confines enlargement to a reflow-safe mobile dialog', async ({ page }) => {
	await page.setViewportSize({ width: 320, height: 640 });
	await openComponents(page);
	const trigger = page.locator('[data-image-inspection-trigger]').first();
	await trigger.scrollIntoViewIfNeeded();
	await trigger.evaluate((element) => {
		const canvas = document.createElement('canvas');
		canvas.width = 2400;
		canvas.height = 1440;
		element.href = canvas.toDataURL('image/png');
		element.dataset.imageIntrinsicWidth = '2400';
		element.dataset.imageIntrinsicHeight = '1440';
		delete element.dataset.imageInspectionScalable;
		window.dispatchEvent(new Event('resize'));
	});
	await expect(trigger.locator('img')).toHaveJSProperty('complete', true);
	await expect(trigger).toHaveAttribute('data-image-inspection-available', 'true');
	await trigger.click();
	const dialog = page.locator('[data-image-inspector]');
	await expect(dialog).toBeVisible();
	const sizeButton = dialog.getByRole('button', { name: 'Show actual size' });
	await expect(sizeButton).toBeVisible();
	await sizeButton.click();

	const [bounds, overflow] = await Promise.all([
		dialog.boundingBox(),
		getHorizontalOverflow(page),
	]);
	expect(bounds).not.toBeNull();
	expect(bounds?.x ?? -1).toBeGreaterThanOrEqual(0);
	expect((bounds?.x ?? 0) + (bounds?.width ?? 0)).toBeLessThanOrEqual(320);
	expect(bounds?.y ?? -1).toBeGreaterThanOrEqual(0);
	expect((bounds?.y ?? 0) + (bounds?.height ?? 0)).toBeLessThanOrEqual(640);
	expect(overflow.scrollWidth, JSON.stringify(overflow.offenders, null, 2)).toBeLessThanOrEqual(overflow.clientWidth + 1);
	await expect(dialog.getByRole('button', { name: 'Fit image to window' })).toBeVisible();
	await expect(dialog.getByRole('button', { name: 'Close image inspection' })).toBeVisible();
});

test('image inspection remains a normal original-image link without JavaScript', async ({ browser }) => {
	const context = await browser.newContext({ javaScriptEnabled: false });
	const page = await context.newPage();
	await page.goto(componentsPath, { waitUntil: 'domcontentloaded' });
	const trigger = page.locator('[data-image-inspection-trigger]').first();
	await expect(trigger).not.toHaveAttribute('data-image-inspection-available', 'true');
	const target = await trigger.getAttribute('href');
	expect(target).toMatch(/\/images\/original\/.*stack-portrait-[a-f0-9]+\.svg$/);
	await Promise.all([
		page.waitForURL((url) => url.pathname === target),
		trigger.evaluate((node) => node.click()),
	]);
	await context.close();
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

test('Dark appearance uses one lighter marker for the current page and heading', async ({ page }) => {
	await page.setViewportSize({ width: 1440, height: 1000 });
	await page.goto(`${componentsPath}#image-stack`, { waitUntil: 'domcontentloaded' });
	await page.locator('[data-carousel-ready="true"]').waitFor();
	await page.locator('html').evaluate((root) => {
		root.dataset.appearance = 'dark';
	});
	await page.waitForTimeout(250);
	const currentPage = page.locator('.tree-local-navigation .navigation-page-link[aria-current="page"]');
	const currentHeading = page.locator(
		'.tree-local-navigation .navigation-page-sections a[aria-current="location"]',
	);
	await expect(currentPage).toBeVisible();
	await expect(currentHeading).toBeVisible();

	const colors = await page.evaluate(() => {
		const pageMarker = document.querySelector<HTMLElement>(
			'.tree-local-navigation .navigation-page-link[aria-current="page"]',
		);
		const headingMarker = document.querySelector<HTMLElement>(
			'.tree-local-navigation .navigation-page-sections a[aria-current="location"]',
		);
		const navigation = document.querySelector<HTMLElement>('.tree-local-navigation');
		if (!pageMarker || !headingMarker || !navigation) throw new Error('Missing current navigation markers.');
		const parseRgb = (value: string) => {
			const hex = value.trim().match(/^#([\da-f]{6})$/i)?.[1];
			if (hex) return [0, 2, 4].map((offset) => Number.parseInt(hex.slice(offset, offset + 2), 16));
			const channels = value.match(/[\d.]+/g)?.slice(0, 3).map(Number);
			if (!channels || channels.length !== 3) throw new Error(`Cannot parse color ${value}.`);
			return value.trim().startsWith('color(srgb ')
				? channels.map((channel) => channel * 255)
				: channels;
		};
		const luminance = (value: string) => parseRgb(value)
			.map((channel) => channel / 255)
			.map((channel) => channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4)
			.reduce((sum, channel, index) => sum + channel * [0.2126, 0.7152, 0.0722][index], 0);
		const contrast = (first: string, second: string) => {
			const values = [luminance(first), luminance(second)].sort((left, right) => right - left);
			return (values[0] + 0.05) / (values[1] + 0.05);
		};
		const pageStyle = getComputedStyle(pageMarker);
		const headingStyle = getComputedStyle(headingMarker);
		const navigationStyle = getComputedStyle(navigation);
		const rootStyle = getComputedStyle(document.documentElement);
		return {
			contrast: contrast(pageStyle.color, pageStyle.backgroundColor),
			headingBackground: headingStyle.backgroundColor,
			markerBackground: pageStyle.backgroundColor,
			markerLuminance: luminance(pageStyle.backgroundColor),
			navigationLuminance: luminance(navigationStyle.backgroundColor),
			softLuminance: luminance(rootStyle.getPropertyValue('--color-surface-soft-background')),
		};
	});

	expect(colors.headingBackground).toBe(colors.markerBackground);
	expect(colors.markerLuminance).toBeGreaterThan(colors.navigationLuminance);
	expect(colors.markerLuminance).toBeGreaterThan(colors.softLuminance);
	expect(colors.contrast, JSON.stringify(colors)).toBeGreaterThanOrEqual(4.5);
});

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
	const stackCaptionGap = (stackCaptionBounds?.x ?? 0)
		- ((portraitBounds?.x ?? 0) + (portraitBounds?.width ?? 0));
	expect(frameBounds?.x).toBeCloseTo(proseBounds?.x ?? 0, 0);
	expect(stackCaptionGap).toBeGreaterThanOrEqual(8);
	expect(stackCaptionGap).toBeLessThanOrEqual(16);
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

test('a tall image keeps its semantic caption visible in a vacant end lane', async ({ page }) => {
	await page.setViewportSize({ width: 1440, height: 900 });
	await openComponents(page);
	const figure = page.locator('[data-image-stack-figure]').first();
	const frame = figure.locator('.managed-image-frame');
	const image = frame.locator('img');
	const caption = figure.locator('figcaption');
	const captionDetails = caption.locator('.image-details');
	await expect(figure).toHaveAttribute('data-image-caption-placement', 'persistent');

	const [figureBounds, frameBounds, imageBounds, captionBounds, layoutBounds] = await Promise.all([
		figure.boundingBox(),
		frame.boundingBox(),
		image.boundingBox(),
		caption.boundingBox(),
		page.locator('.site-page-layout-tree').boundingBox(),
	]);
	expect(figureBounds).not.toBeNull();
	expect(frameBounds).not.toBeNull();
	expect(imageBounds).not.toBeNull();
	expect(captionBounds).not.toBeNull();
	expect(layoutBounds).not.toBeNull();
	const captionGap = (captionBounds?.x ?? 0) - ((imageBounds?.x ?? 0) + (imageBounds?.width ?? 0));
	expect(captionGap).toBeGreaterThanOrEqual(8);
	expect(captionGap).toBeLessThanOrEqual(16);
	expect((captionBounds?.x ?? 0) + (captionBounds?.width ?? 0)).toBeLessThanOrEqual(
		(layoutBounds?.x ?? 0) + (layoutBounds?.width ?? 0) + 1,
	);
	expect(await caption.evaluate((element) => element.tagName)).toBe('FIGCAPTION');
	expect(await frame.locator('img').getAttribute('aria-describedby')).toBe(await caption.getAttribute('id'));

	await figure.evaluate((element) => {
		window.scrollTo(0, window.scrollY + element.getBoundingClientRect().top + 220);
	});
	await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(resolve)));
	const [stickyCaptionBounds, anchorOffset] = await Promise.all([
		captionDetails.boundingBox(),
		page.evaluate(() => Number.parseFloat(
			getComputedStyle(document.documentElement).getPropertyValue('--site-top-anchor-offset'),
		)),
	]);
	expect(stickyCaptionBounds?.y).toBeCloseTo(anchorOffset + 16, 0);

	const measureReleasedCaption = async () => {
		await figure.evaluate((element) => {
			const image = element.querySelector<HTMLImageElement>('img');
			const details = element.querySelector<HTMLElement>('.image-details');
			if (!image || !details) throw new Error('Missing persistent caption image or details.');
			const imageBottom = window.scrollY + image.getBoundingClientRect().bottom;
			const anchor = Number.parseFloat(
				getComputedStyle(document.documentElement).getPropertyValue('--site-top-anchor-offset'),
			) || 0;
			window.scrollTo(0, imageBottom - anchor - details.getBoundingClientRect().height + 20);
		});
		await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(resolve)));
		return Promise.all([image.boundingBox(), captionDetails.boundingBox()]);
	};

	const [releasedImageBounds, releasedCaptionBounds] = await measureReleasedCaption();
	expect(releasedCaptionBounds?.y ?? Infinity).toBeLessThan(anchorOffset);
	expect(Math.abs(
		((releasedCaptionBounds?.y ?? 0) + (releasedCaptionBounds?.height ?? 0))
		- ((releasedImageBounds?.y ?? 0) + (releasedImageBounds?.height ?? 0)),
	)).toBeLessThanOrEqual(1);

	await page.evaluate(() => window.scrollTo(0, 0));
	await frame.evaluate((element) => {
		element.style.paddingBlock = '18px 31px';
		window.dispatchEvent(new Event('resize'));
	});
	await expect(figure).toHaveAttribute('data-image-caption-placement', 'persistent');
	const [offsetImageBounds, offsetCaptionBounds] = await measureReleasedCaption();
	expect(Math.abs(
		((offsetCaptionBounds?.y ?? 0) + (offsetCaptionBounds?.height ?? 0))
		- ((offsetImageBounds?.y ?? 0) + (offsetImageBounds?.height ?? 0)),
	)).toBeLessThanOrEqual(1);

	const overflow = await getHorizontalOverflow(page);
	expect(overflow.scrollWidth, JSON.stringify(overflow.offenders, null, 2)).toBeLessThanOrEqual(overflow.clientWidth + 1);
});

test('persistent image captions fall back when the end lane is occupied or narrow', async ({ page }) => {
	await page.setViewportSize({ width: 1440, height: 900 });
	await openComponents(page);
	const figure = page.locator('[data-image-stack-figure]').first();
	await expect(figure).toHaveAttribute('data-image-caption-placement', 'persistent');

	await page.locator('.site-page-layout-tree').evaluate((layout) => {
		const rail = document.createElement('aside');
		rail.className = 'page-contents-navigation page-contents-navigation-rail';
		rail.style.position = 'fixed';
		rail.style.right = '0';
		rail.style.top = '5rem';
		rail.style.width = '11rem';
		rail.style.height = '12rem';
		rail.textContent = 'Occupied end lane';
		layout.append(rail);
		window.dispatchEvent(new Event('resize'));
	});
	await expect(figure).not.toHaveAttribute('data-image-caption-placement', 'persistent');
	const settings = page.locator('[data-display-settings]');
	await settings.locator('summary').click();
	await settings.getByRole('checkbox', { name: 'Focus reading' }).check();
	await expect(figure).toHaveAttribute('data-image-caption-placement', 'persistent');

	await page.setViewportSize({ width: 900, height: 900 });
	await expect(figure).not.toHaveAttribute('data-image-caption-placement', 'persistent');
	const [frameBounds, captionBounds] = await Promise.all([
		figure.locator('.managed-image-frame').boundingBox(),
		figure.locator('figcaption').boundingBox(),
	]);
	const captionGap = (captionBounds?.y ?? 0) - ((frameBounds?.y ?? 0) + (frameBounds?.height ?? 0));
	expect(captionGap).toBeGreaterThanOrEqual(0);
	expect(captionGap).toBeLessThanOrEqual(8);
});

test('deep-page image captions stay below when Page contents moves into the page tree', async ({ page }) => {
	await page.setViewportSize({ width: 1440, height: 900 });
	await openComponents(page);
	const layout = page.locator('.site-page-layout-tree');
	const figure = page.locator('[data-image-stack-figure]').first();

	await layout.evaluate((element) => {
		element.dataset.pageContentsPlacement = 'contents-rail';
		const rail = document.createElement('aside');
		rail.className = 'page-contents-navigation page-contents-navigation-rail';
		rail.textContent = 'Page contents';
		element.append(rail);
		window.dispatchEvent(new Event('resize'));
	});
	const contentsRail = layout.locator('.page-contents-navigation-rail');

	await expect(contentsRail).toBeVisible();
	await expect(figure).not.toHaveAttribute('data-image-caption-placement', 'persistent');

	await page.setViewportSize({ width: 1281, height: 900 });
	await expect(contentsRail).toBeVisible();
	await expect(figure).not.toHaveAttribute('data-image-caption-placement', 'persistent');

	await page.setViewportSize({ width: 1280, height: 900 });
	await expect(contentsRail).toBeHidden();
	await expect(figure).not.toHaveAttribute('data-image-caption-placement', 'persistent');

	const settings = page.locator('[data-display-settings]');
	await settings.locator('summary').click();
	await settings.getByRole('checkbox', { name: 'Focus reading' }).check();
	await expect(figure).toHaveAttribute('data-image-caption-placement', 'persistent');

	await settings.getByRole('checkbox', { name: 'Focus reading' }).uncheck();
	await expect(figure).not.toHaveAttribute('data-image-caption-placement', 'persistent');
	await page.setViewportSize({ width: 1100, height: 900 });
	await expect(figure).not.toHaveAttribute('data-image-caption-placement', 'persistent');

	const overflow = await getHorizontalOverflow(page);
	expect(overflow.scrollWidth, JSON.stringify(overflow.offenders, null, 2)).toBeLessThanOrEqual(overflow.clientWidth + 1);
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
	await expect(page.locator('[data-table-sticky-heading]')).toHaveCount(0);
	await expect(page.locator('[data-table-navigation]')).toHaveCount(0);
	await expect(page.getByRole('table')).toHaveCount(1);
	const figure = page.locator('[data-image-stack-figure]').first();
	await expect(figure).not.toHaveAttribute('data-image-caption-placement', 'persistent');
	const [frameBounds, captionBounds] = await Promise.all([
		figure.locator('.managed-image-frame').boundingBox(),
		figure.locator('figcaption').boundingBox(),
	]);
	const captionGap = (captionBounds?.y ?? 0) - ((frameBounds?.y ?? 0) + (frameBounds?.height ?? 0));
	expect(captionGap).toBeGreaterThanOrEqual(0);
	expect(captionGap).toBeLessThanOrEqual(8);
	await context.close();
});
