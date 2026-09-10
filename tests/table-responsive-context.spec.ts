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
		expect(geometry.visualHeading.x).toBeCloseTo(geometry.originalHeading.x, 0);
		expect(geometry.visualHeading.width).toBeCloseTo(geometry.originalHeading.width, 0);
		const pageWidth = await page.evaluate(() => ({
			client: document.documentElement.clientWidth,
			scroll: document.documentElement.scrollWidth,
		}));
		expect(pageWidth.scroll).toBeLessThanOrEqual(pageWidth.client + 1);
	}
});
