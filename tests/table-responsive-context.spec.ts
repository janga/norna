import { expect, test } from '@playwright/test';

const deepTablePath = '/deep-navigation/reference/data-and-code/';

const settleResponsiveLayout = (page) => page.evaluate(() => new Promise((resolve) => (
	requestAnimationFrame(() => requestAnimationFrame(resolve))
)));

test('overflow controls seal the table header through responsive rail transitions', async ({ page }) => {
	await page.setViewportSize({ width: 1440, height: 720 });
	await page.goto(deepTablePath, { waitUntil: 'networkidle' });
	const section = page.locator('.site-section').filter({ has: page.locator('#adaptive-table') });
	const frame = section.locator('[data-table-frame]');
	const table = frame.locator('table');
	const tableNavigation = frame.locator('[data-table-navigation]');

	await expect(frame).toHaveAttribute('data-table-ready', 'true');
	await table.evaluate((element) => {
		element.style.width = '2400px';
		element.style.minWidth = '2400px';
		element.style.tableLayout = 'fixed';
		const body = element.tBodies[0];
		const sourceRows = Array.from(body.rows);
		for (let index = 0; index < 18; index += 1) {
			for (const row of sourceRows) body.append(row.cloneNode(true));
		}
	});

	for (const state of [
		{ contentsRail: true, treeRail: true, width: 1440 },
		{ contentsRail: false, treeRail: true, width: 1280 },
		{ contentsRail: false, treeRail: false, width: 900 },
	]) {
		await page.setViewportSize({ width: state.width, height: 720 });
		await settleResponsiveLayout(page);
		if (state.treeRail) await expect(page.locator('.tree-local-navigation')).toBeVisible();
		else await expect(page.locator('.tree-local-navigation')).toBeHidden();
		if (state.contentsRail) await expect(page.locator('.page-contents-navigation-rail')).toBeVisible();
		else await expect(page.locator('.page-contents-navigation-rail')).toBeHidden();
		await expect(frame).toHaveAttribute('data-table-overflow', 'true');
		await expect(frame).toHaveAttribute('data-table-sticky-heading', 'true');
		await frame.evaluate((element) => {
			window.scrollTo(0, window.scrollY + element.getBoundingClientRect().top + 120);
		});

		const stickyOffset = await page.evaluate(() => Number.parseFloat(
			getComputedStyle(document.documentElement).getPropertyValue('--site-top-anchor-offset'),
		));
		await expect.poll(async () => (await tableNavigation.boundingBox())?.y).toBeCloseTo(stickyOffset, 0);
		const geometry = await frame.evaluate((element) => {
			const navigation = element.querySelector<HTMLElement>('[data-table-navigation]');
			const controls = element.querySelector<HTMLElement>('.norna-table-navigation-buttons');
			const heading = element.querySelector<HTMLElement>('[data-table-sticky-heading]');
			const originalHeading = element.querySelector<HTMLElement>('thead th');
			const visualHeading = element.querySelector<HTMLElement>('.norna-table-sticky-heading-cell');
			if (!navigation || !controls || !heading || !originalHeading || !visualHeading) {
				throw new Error('Missing responsive table header elements.');
			}

			const bounds = (node: Element) => {
				const rectangle = node.getBoundingClientRect();
				return {
					height: rectangle.height,
					width: rectangle.width,
					x: rectangle.x,
					y: rectangle.y,
				};
			};
			const backgroundAlpha = (color: string) => {
				const canvas = document.createElement('canvas');
				canvas.width = 1;
				canvas.height = 1;
				const context = canvas.getContext('2d');
				if (!context) return 0;
				context.clearRect(0, 0, 1, 1);
				context.fillStyle = color;
				context.fillRect(0, 0, 1, 1);
				return context.getImageData(0, 0, 1, 1).data[3];
			};

			const navigationBounds = navigation.getBoundingClientRect();
			const controlsBounds = controls.getBoundingClientRect();
			const sampleX = navigationBounds.left + Math.max(1, (controlsBounds.left - navigationBounds.left) / 2);
			const sampleY = navigationBounds.top + (navigationBounds.height / 2);
			const cellBehindCarrier = Array.from(element.querySelectorAll('tbody td')).some((cell) => {
				const rectangle = cell.getBoundingClientRect();
				return rectangle.left <= sampleX
					&& rectangle.right >= sampleX
					&& rectangle.top <= sampleY
					&& rectangle.bottom >= sampleY;
			});
			const navigationStyle = getComputedStyle(navigation);
			const headingStyle = getComputedStyle(heading);

			return {
				cellBehindCarrier,
				controls: bounds(controls),
				frame: bounds(element),
				heading: bounds(heading),
				headingBackground: headingStyle.backgroundColor,
				headingZIndex: Number.parseInt(headingStyle.zIndex, 10),
				navigation: bounds(navigation),
				navigationAlpha: backgroundAlpha(navigationStyle.backgroundColor),
				navigationBackground: navigationStyle.backgroundColor,
				navigationZIndex: Number.parseInt(navigationStyle.zIndex, 10),
				originalHeading: bounds(originalHeading),
				visualHeading: bounds(visualHeading),
			};
		});

		expect(geometry.cellBehindCarrier).toBe(true);
		expect(geometry.navigationAlpha).toBe(255);
		expect(geometry.navigationBackground).toBe(geometry.headingBackground);
		expect(geometry.navigation.x).toBeCloseTo(geometry.frame.x, 0);
		expect(geometry.navigation.width).toBeCloseTo(geometry.frame.width, 0);
		expect(geometry.heading.x).toBeCloseTo(geometry.frame.x, 0);
		expect(geometry.heading.width).toBeCloseTo(geometry.frame.width, 0);
		expect(geometry.heading.y).toBeCloseTo(
			geometry.navigation.y + geometry.navigation.height,
			0,
		);
		expect(geometry.controls.x + geometry.controls.width).toBeCloseTo(
			geometry.navigation.x + geometry.navigation.width,
			0,
		);
		expect(geometry.controls.x).toBeGreaterThan(geometry.navigation.x);
		expect(geometry.navigationZIndex).toBeGreaterThan(geometry.headingZIndex);
		expect(Math.abs(geometry.visualHeading.x - geometry.originalHeading.x)).toBeLessThanOrEqual(1.5);
		expect(Math.abs(geometry.visualHeading.width - geometry.originalHeading.width)).toBeLessThanOrEqual(1.5);
		const pageWidth = await page.evaluate(() => ({
			client: document.documentElement.clientWidth,
			scroll: document.documentElement.scrollWidth,
		}));
		expect(pageWidth.scroll).toBeLessThanOrEqual(pageWidth.client + 1);
	}
});

test('declared row headers remain visible through horizontal scrolling in both directions', async ({ page }) => {
	await page.setViewportSize({ width: 1280, height: 720 });
	await page.goto(deepTablePath, { waitUntil: 'networkidle' });
	const frame = page.locator('[data-table-frame]').first();
	const scrollRegion = frame.locator('[data-table-scroll]');
	const table = frame.locator('table');
	const firstRowHeader = table.getByRole('rowheader').first();
	const stickyRowHeader = frame.locator('[data-table-sticky-row-header]');

	await expect(frame).toHaveAttribute('data-table-row-headers', 'true');
	await expect(table).toHaveAttribute('data-row-headers', 'true');
	await expect(table.getByRole('columnheader').first()).toHaveAttribute('scope', 'col');
	await expect(firstRowHeader).toHaveAttribute('scope', 'row');
	await table.evaluate((element) => {
		element.style.width = '2400px';
		element.style.minWidth = '2400px';
		element.style.tableLayout = 'fixed';
		const body = element.tBodies[0];
		const sourceRows = Array.from(body.rows);
		for (let index = 0; index < 12; index += 1) {
			for (const row of sourceRows) body.append(row.cloneNode(true));
		}
	});
	await expect(frame).toHaveAttribute('data-table-overflow', 'true');
	await expect(frame).toHaveAttribute('data-table-sticky-heading', 'true');
	await expect(stickyRowHeader).toHaveCount(1);

	const expectInlineStartAlignment = async (direction: 'ltr' | 'rtl') => {
		const geometry = await frame.evaluate((element, currentDirection) => {
			const scroll = element.querySelector<HTMLElement>('[data-table-scroll]');
			const rowHeader = element.querySelector<HTMLElement>('tbody th[scope="row"]');
			const nextCell = rowHeader?.nextElementSibling;
			const stickyHeader = element.querySelector<HTMLElement>('[data-table-sticky-row-header]');
			if (!scroll || !rowHeader || !(nextCell instanceof HTMLElement) || !stickyHeader) {
				throw new Error('Missing row-header table elements.');
			}
			const scrollBounds = scroll.getBoundingClientRect();
			const rowBounds = rowHeader.getBoundingClientRect();
			const nextBounds = nextCell.getBoundingClientRect();
			const stickyBounds = stickyHeader.getBoundingClientRect();
			const style = getComputedStyle(rowHeader);
			return {
				inlineDelta: currentDirection === 'rtl'
					? scrollBounds.right - rowBounds.right
					: rowBounds.left - scrollBounds.left,
				nextCellBehind: currentDirection === 'rtl'
					? nextBounds.right > rowBounds.left
					: nextBounds.left < rowBounds.right,
				position: style.position,
				stickyInlineDelta: currentDirection === 'rtl'
					? scrollBounds.right - stickyBounds.right
					: stickyBounds.left - scrollBounds.left,
				wrap: style.overflowWrap,
			};
		}, direction);
		expect(Math.abs(geometry.inlineDelta)).toBeLessThanOrEqual(1.5);
		expect(Math.abs(geometry.stickyInlineDelta)).toBeLessThanOrEqual(1.5);
		expect(geometry.nextCellBehind).toBe(true);
		expect(geometry.position).toBe('sticky');
		expect(geometry.wrap).toBe('anywhere');
	};

	await scrollRegion.evaluate((element) => {
		element.scrollLeft = (element.scrollWidth - element.clientWidth) / 2;
	});
	await expect(frame).toHaveAttribute('data-table-at-start', 'false');
	await expectInlineStartAlignment('ltr');

	await page.evaluate(() => document.documentElement.setAttribute('dir', 'rtl'));
	await settleResponsiveLayout(page);
	await scrollRegion.evaluate((element) => {
		element.scrollLeft = 0 - ((element.scrollWidth - element.clientWidth) / 2);
	});
	await expect(frame).toHaveAttribute('data-table-at-start', 'false');
	await expectInlineStartAlignment('rtl');
});

test('row-header semantics and native horizontal scrolling remain without JavaScript', async ({ browser }) => {
	const context = await browser.newContext({
		javaScriptEnabled: false,
		viewport: { width: 900, height: 720 },
	});
	const page = await context.newPage();
	await page.goto(deepTablePath, { waitUntil: 'domcontentloaded' });
	const frame = page.locator('[data-table-frame]').first();
	const scrollRegion = frame.locator('[data-table-scroll]');
	const rowHeader = frame.getByRole('rowheader').first();

	await expect(frame).toHaveAttribute('data-table-row-headers', 'true');
	await expect(rowHeader).toHaveAttribute('scope', 'row');
	await expect(rowHeader).toHaveCSS('position', 'sticky');
	await expect(scrollRegion).toHaveCSS('overflow-x', 'auto');
	await expect(frame.locator('[data-table-navigation]')).toHaveCount(0);
	await expect(frame.locator('[data-table-sticky-heading]')).toHaveCount(0);
	await context.close();
});

test('row headers remain bounded and opaque in compact, Dark, and forced-color layouts', async ({ page }) => {
	await page.setViewportSize({ width: 320, height: 640 });
	await page.goto(deepTablePath, { waitUntil: 'networkidle' });
	const frame = page.locator('[data-table-frame]').first();
	const table = frame.locator('table');
	const rowHeader = table.getByRole('rowheader').first();

	await page.locator('html').evaluate((element) => {
		element.dataset.appearance = 'dark';
		element.style.fontSize = '200%';
	});
	await table.evaluate((element) => {
		element.style.width = '1200px';
		element.style.minWidth = '1200px';
	});
	await expect(frame).toHaveAttribute('data-table-overflow', 'true');

	const compactGeometry = await rowHeader.evaluate((element) => {
		const bounds = element.getBoundingClientRect();
		const style = getComputedStyle(element);
		return {
			background: style.backgroundColor,
			width: bounds.width,
		};
	});
	expect(compactGeometry.width).toBeLessThanOrEqual((320 * 0.55) + 2);
	expect(compactGeometry.background).not.toBe('rgba(0, 0, 0, 0)');
	const pageWidth = await page.evaluate(() => ({
		client: document.documentElement.clientWidth,
		scroll: document.documentElement.scrollWidth,
	}));
	expect(pageWidth.scroll).toBeLessThanOrEqual(pageWidth.client + 1);

	await page.emulateMedia({ forcedColors: 'active' });
	await expect.poll(() => page.evaluate(() => matchMedia('(forced-colors: active)').matches)).toBe(true);
	const forcedColorStyle = await rowHeader.evaluate((element) => {
		const style = getComputedStyle(element);
		return {
			background: style.backgroundColor,
			border: style.borderInlineEndColor,
		};
	});
	expect(forcedColorStyle.background).not.toBe('rgba(0, 0, 0, 0)');
	expect(forcedColorStyle.border).not.toBe('rgba(0, 0, 0, 0)');
});
