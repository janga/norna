import { expect, test } from '@playwright/test';

const desktopViewport = { width: 1440, height: 1000 };
const mobileViewport = { width: 393, height: 852 };
const testPagePath = '/guides/installation/macos/';
const shallowPagePath = '/reference/installation/';

test.describe('desktop tree navigation', () => {
	test.use({ hasTouch: false, isMobile: false, viewport: desktopViewport });

	test('separates the active page branch from the current page contents', async ({ page }) => {
		await page.goto(testPagePath, { waitUntil: 'networkidle' });
		expect(await page.locator('body').evaluate((body) => getComputedStyle(body).paddingTop)).toBe('0px');

		await expect(page.locator('.site-nav > ul > li > a')).toHaveText([
			'Nested pages',
			'Guides',
			'Reference',
		]);
		await expect(page.locator('.site-nav-submenu')).toHaveCount(0);
		await expect(page.locator('.site-nav-item-current-branch > a')).toHaveText('Guides');

		const localNavigation = page.locator('.tree-local-navigation');
		await expect(localNavigation).toBeVisible();
		await expect(localNavigation.locator('.navigation-page-tree-sidebar').first()).toContainText('Guides');
		await expect(localNavigation.locator('details[data-page-path="guides"] > .navigation-page-open-link')).toHaveCount(0);
		await expect(localNavigation.locator('details[data-page-path="guides/installation"] > summary'))
			.toHaveAttribute('aria-label', 'Child pages: Installation');
		await expect(localNavigation.getByRole('link', { name: 'Installation', exact: true }))
			.toBeVisible();
		await expect(localNavigation.getByRole('link', { name: 'Workflows', exact: true })).toBeVisible();
		await expect(localNavigation.locator('details[data-page-path="guides/workflows"]')).toHaveCount(0);
		const currentPageNode = localNavigation.locator('.navigation-page-node-current');
		const currentPageLink = currentPageNode.getByRole('link', { name: 'macOS', exact: true });
		await expect(currentPageLink).toHaveAttribute('aria-current', 'page');
		await expect(currentPageNode.locator(':scope > details')).toHaveCount(0);
		await expect(localNavigation.getByRole('link', { name: 'Install', exact: true })).toHaveCount(0);
		await expect(localNavigation.getByRole('link', { name: 'Prerequisites', exact: true })).toHaveCount(0);
		await expect(localNavigation.getByRole('link', { name: 'Reference', exact: true })).toHaveCount(0);

		await expect(page.locator('.site-breadcrumbs li')).toHaveText(['Guides', 'Installation', 'macOS']);
		const pageContents = page.locator('.page-contents-navigation-rail');
		await expect(pageContents).toBeVisible();
		await expect(pageContents).toHaveAttribute('class', /page-contents-navigation-rail/);
		await expect(pageContents.getByRole('navigation')).toHaveAttribute('aria-label', 'Page contents: macOS');
		await expect(pageContents.getByRole('link', { name: 'Install', exact: true })).toBeVisible();
		await expect(pageContents.getByRole('link', { name: 'Prerequisites', exact: true })).toBeVisible();
		await expect(pageContents.getByRole('link', { name: 'Verify', exact: true })).toBeVisible();
		await expect(page.locator('.page-contents-navigation-inline')).toBeHidden();
		await expect(page.locator('.page-nav')).toHaveCount(0);
		await expect(page.locator('[data-tree-navigation-toggle]')).toHaveCount(0);

		const settings = page.locator('[data-display-settings]');
		await settings.locator('summary').click();
		await expect(settings.getByRole('checkbox', { name: 'Focus reading' })).toBeVisible();
	});

	test('marks every H2 or H3 through the end of a short page without changing URL or focus', async ({ page }) => {
		await page.setViewportSize({ width: desktopViewport.width, height: 420 });
		await page.goto(testPagePath, { waitUntil: 'networkidle' });

		const contentsNavigation = page.locator('.page-contents-navigation-rail');
		const displaySettingsSummary = page.locator('[data-display-settings] > summary');
		const initialUrl = page.url();

		await displaySettingsSummary.focus();
		const transitions = await page.evaluate(async () => {
			const rail = document.querySelector('.page-contents-navigation-rail');
			const maximumScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
			const step = Math.max(1, Math.floor(maximumScroll / 72));
			const waitForTracking = () => new Promise<void>((resolve) => {
				window.requestAnimationFrame(() => window.requestAnimationFrame(() => resolve()));
			});
			const getActiveId = () => {
				const active = rail?.querySelector<HTMLAnchorElement>('a[aria-current="location"]');
				return active ? new URL(active.href).hash.slice(1) : undefined;
			};
			const collect = async (positions: number[]) => {
				const observed: string[] = [];
				for (const position of positions) {
					window.scrollTo({ behavior: 'auto', top: position });
					await waitForTracking();
					const activeId = getActiveId();
					if (activeId && observed.at(-1) !== activeId) observed.push(activeId);
				}
				return observed;
			};
			const downPositions = [];
			for (let position = 0; position < maximumScroll; position += step) {
				downPositions.push(position);
			}
			downPositions.push(maximumScroll);
			const upPositions = [...downPositions].reverse();

			return {
				down: await collect(downPositions),
				up: await collect(upPositions),
			};
		});

		expect(transitions.down).toEqual(['install', 'prerequisites', 'verify']);
		expect(transitions.up).toEqual(['verify', 'prerequisites', 'install']);
		await expect(displaySettingsSummary).toBeFocused();
		expect(page.url()).toBe(initialUrl);
		expect(await contentsNavigation.getByRole('link', { name: 'Install', exact: true })
			.evaluate((link) => getComputedStyle(link, '::before').width)).toBe('2px');

		const prerequisitesLink = contentsNavigation.getByRole('link', { name: 'Prerequisites', exact: true });
		await prerequisitesLink.click();
		await expect(page).toHaveURL(/#prerequisites$/);
		await expect(prerequisitesLink).toHaveAttribute('aria-current', 'location');
	});

	test('uses focus reading as the only control for hiding the local tree', async ({ page, context }) => {
		await page.goto(testPagePath, { waitUntil: 'networkidle' });
		const root = page.locator('html');
		const localNavigation = page.locator('.tree-local-navigation');
		const breadcrumbs = page.locator('.site-breadcrumbs');
		const settings = page.locator('[data-display-settings]');

		await expect(page.locator('[data-tree-navigation-toggle]')).toHaveCount(0);
		await settings.locator('summary').click();
		const focusReading = settings.getByRole('checkbox', { name: 'Focus reading' });
		await focusReading.check();

		await expect(root).toHaveAttribute('data-focus-reading', 'on');
		await expect(localNavigation).toBeHidden();
		await expect(page.locator('.page-contents-navigation-rail')).toBeHidden();
		await expect(page.locator('.site-nav')).toBeHidden();
		await expect(breadcrumbs).toBeHidden();
		await expect(settings.locator('summary')).toBeVisible();
		expect((await context.cookies()).find(({ name }) => name === 'norna-focus-reading')?.value).toBe('on');

		await page.goto('/guides/workflows/', { waitUntil: 'networkidle' });
		await expect(page.locator('html')).toHaveAttribute('data-focus-reading', 'on');
		await expect(page.locator('.tree-local-navigation')).toBeHidden();
		const nextSettings = page.locator('[data-display-settings]');
		await nextSettings.locator('summary').click();
		await nextSettings.getByRole('checkbox', { name: 'Focus reading' }).uncheck();
		await expect(page.locator('html')).toHaveAttribute('data-focus-reading', 'off');
		await expect(page.locator('.tree-local-navigation')).toBeVisible();
	});

	test('links adjacent pages within the active top-level area', async ({ page }) => {
		await page.goto(testPagePath, { waitUntil: 'networkidle' });
		const sequence = page.getByRole('navigation', { name: 'Page sequence' });
		await expect(sequence).toBeVisible();
		await expect(sequence.getByRole('link', { name: /Previous page\s+Installation/ }))
			.toHaveAttribute('rel', 'prev');
		const next = sequence.getByRole('link', { name: /Next page\s+Linux/ });
		await expect(next).toHaveAttribute('rel', 'next');

		await next.click();
		await expect(page).toHaveURL(/\/guides\/installation\/linux\/$/);
	});

	test('preserves open page branches and vertical positions across navigation', async ({ page }) => {
		await page.goto('/guides/installation/', { waitUntil: 'networkidle' });
		const localNavigation = page.locator('.tree-local-navigation');
		const installationBranch = localNavigation.locator('details[data-page-path="guides/installation"]');
		await expect(installationBranch).toHaveAttribute('open', '');
		await expect(installationBranch.locator('..').locator(':scope > .navigation-page-open-link'))
			.toHaveText('Installation');

		const macosLink = localNavigation.getByRole('link', { name: 'macOS', exact: true });
		await expect(macosLink).toBeVisible();
		await expect(localNavigation.getByRole('link', { name: 'Install', exact: true })).toHaveCount(0);
		const macosTopBefore = (await macosLink.boundingBox())?.y;
		const headingTopBefore = (await page.getByRole('heading', { level: 1, name: 'Installation' }).boundingBox())?.y;

		await macosLink.click();
		await expect(page).toHaveURL(/\/guides\/installation\/macos\/$/);
		const nextLocalNavigation = page.locator('.tree-local-navigation');
		const nextInstallationBranch = nextLocalNavigation.locator('details[data-page-path="guides/installation"]');
		await expect(nextInstallationBranch).toHaveAttribute('open', '');
		await expect(nextInstallationBranch.locator('..').locator(':scope > .navigation-page-open-link'))
			.toHaveText('Installation');
		const nextMacosLink = nextLocalNavigation.getByRole('link', { name: 'macOS', exact: true });
		await expect(nextMacosLink).toHaveAttribute('aria-current', 'page');
		await expect(nextLocalNavigation.getByRole('link', { name: 'Install', exact: true })).toHaveCount(0);

		const macosTopAfter = (await nextMacosLink.boundingBox())?.y;
		const headingTopAfter = (await page.getByRole('heading', { level: 1, name: 'macOS' }).boundingBox())?.y;
		expect(macosTopBefore).toBeDefined();
		expect(macosTopAfter).toBeDefined();
		expect(Math.abs((macosTopAfter ?? 0) - (macosTopBefore ?? 0))).toBeLessThan(2);
		expect(headingTopBefore).toBeDefined();
		expect(headingTopAfter).toBeDefined();
		expect(Math.abs((headingTopAfter ?? 0) - (headingTopBefore ?? 0))).toBeLessThan(2);
	});

	test('renders categories as unlinked labels while preserving descendant URLs', async ({ page }) => {
		await page.goto('/guides/installation/', { waitUntil: 'networkidle' });
		const category = page.locator('.tree-local-navigation details[data-page-path="guides"]');
		await expect(category.locator(':scope > summary')).toHaveText('Guides');
		await expect(category.getByRole('link', { name: 'Guides', exact: true })).toHaveCount(0);
		await expect(page.locator('.site-breadcrumbs li').first()).toHaveText('Guides');
		await expect(page.locator('.site-breadcrumbs li').first().locator('a')).toHaveCount(0);
		await expect(page.locator('.site-nav').getByRole('link', { name: 'Guides', exact: true }))
			.toHaveAttribute('href', '/guides/installation/');
	});

	test('renders a direct child page list on the reading axis', async ({ page }) => {
		await page.goto('/guides/installation/', { waitUntil: 'networkidle' });
		const pageList = page.getByRole('navigation', { name: 'Child pages' });
		await expect(pageList.getByRole('link')).toHaveText([
			'macOSA third-level macOS installation page.',
			'LinuxA third-level Linux installation page.',
			'Windows',
		]);
		const listBox = await pageList.boundingBox();
		const headingBox = await page.getByRole('heading', { level: 1, name: 'Installation' }).boundingBox();

		expect(listBox).not.toBeNull();
		expect(headingBox).not.toBeNull();
		expect(Math.abs((listBox?.x ?? 0) - (headingBox?.x ?? 0))).toBeLessThan(2);
		expect(Math.abs((listBox?.width ?? 0) - (headingBox?.width ?? 0))).toBeLessThan(2);
	});

	test('aligns breadcrumbs with the current page text width', async ({ page }) => {
		await page.goto('/guides/workflows/#local-work', { waitUntil: 'networkidle' });
		const breadcrumbBox = await page.locator('.site-breadcrumbs').boundingBox();
		const paragraphBox = await page.locator('.site-section:has(#local-work) .section-markdown p').first().boundingBox();

		expect(breadcrumbBox).not.toBeNull();
		expect(paragraphBox).not.toBeNull();
		expect(Math.abs((breadcrumbBox?.x ?? 0) - (paragraphBox?.x ?? 0))).toBeLessThan(2);
	});

	test('keeps section surfaces clear of the local navigation', async ({ page }) => {
		await page.goto('/guides/installation/#examples', { waitUntil: 'networkidle' });
		const localNavigationBox = await page.locator('.tree-local-navigation').boundingBox();
		const section = page.locator('.site-section:has(#examples)');
		const sectionBox = await section.boundingBox();
		const surfaceLeft = await section.evaluate((element) => getComputedStyle(element, '::before').left);

		expect(localNavigationBox).not.toBeNull();
		expect(sectionBox).not.toBeNull();
		expect((sectionBox?.x ?? 0) - ((localNavigationBox?.x ?? 0) + (localNavigationBox?.width ?? 0))).toBeGreaterThan(16);
		expect(surfaceLeft).toBe('0px');
	});

	test('keeps the local navigation stable when the destination has no page sections', async ({ page }) => {
		await page.goto('/guides/installation/', { waitUntil: 'networkidle' });
		const localNavigationTopBefore = (await page.locator('.tree-local-navigation').boundingBox())?.y;

		await page.locator('.tree-local-navigation').getByRole('link', { name: 'Release notes', exact: true }).click();
		await expect(page).toHaveURL(/\/guides\/release-notes\/$/);
		const localNavigationTopAfter = (await page.locator('.tree-local-navigation').boundingBox())?.y;

		expect(localNavigationTopBefore).toBeDefined();
		expect(localNavigationTopAfter).toBeDefined();
		expect(Math.abs((localNavigationTopAfter ?? 0) - (localNavigationTopBefore ?? 0))).toBeLessThan(2);
		await expect(page.locator('.page-contents-navigation-rail')).toHaveCount(0);
	});

	test('reserves navigation height for a wrapped current-page title', async ({ page }) => {
		await page.goto('/guides/installation/', { waitUntil: 'networkidle' });
		const currentPageDisclosure = page.locator(
			'.tree-local-navigation details[data-page-path="guides/installation"]',
		);
		const currentPageNode = currentPageDisclosure.locator('..');
		const wrappedTitle = 'A deliberately long current page title that wraps';
		await currentPageNode.locator(':scope > .navigation-page-open-link')
			.evaluate((element, title) => { element.textContent = title; }, wrappedTitle);

		const openLinkBox = await currentPageNode.locator(':scope > .navigation-page-open-link').boundingBox();
		const branchContentBox = await currentPageNode.locator(':scope > .navigation-page-branch-content').boundingBox();

		expect(openLinkBox).not.toBeNull();
		expect(branchContentBox).not.toBeNull();
		expect(branchContentBox?.y ?? 0).toBeGreaterThanOrEqual(
			(openLinkBox?.y ?? 0) + (openLinkBox?.height ?? 0) - 1,
		);
	});

	test('scrolls a long local navigation independently on a short page', async ({ page }) => {
		await page.setViewportSize({ width: desktopViewport.width, height: 800 });
		await page.goto('/guides/release-notes/', { waitUntil: 'networkidle' });
		const localNavigation = page.locator('.tree-local-navigation');
		const dimensions = await localNavigation.evaluate((element) => ({
			clientHeight: element.clientHeight,
			overflowY: getComputedStyle(element).overflowY,
			scrollHeight: element.scrollHeight,
		}));

		expect(dimensions.overflowY).toBe('auto');
		expect(dimensions.scrollHeight).toBeGreaterThan(dimensions.clientHeight);
		await localNavigation.evaluate((element) => { element.scrollTop = 120; });
		expect(await localNavigation.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
		expect(await page.evaluate(() => window.scrollY)).toBe(0);
	});

	test('uses the margin only when a sidenote fits beside the selected reading width', async ({ page }) => {
		await page.goto(testPagePath, { waitUntil: 'networkidle' });
		const note = page.locator('.section-note').first();
		const paragraph = page.locator('.section-markdown p').first();
		const sectionBody = page.locator('.section-body').first();
		const contentsNavigation = page.locator('.page-contents-navigation-rail');
		const [noteBox, paragraphBox, sectionBodyBox, contentsBox] = await Promise.all([
			note.boundingBox(),
			paragraph.boundingBox(),
			sectionBody.boundingBox(),
			contentsNavigation.boundingBox(),
		]);

		expect(await note.evaluate((element) => getComputedStyle(element).float)).toBe('right');
		expect(noteBox).not.toBeNull();
		expect(paragraphBox).not.toBeNull();
		expect(sectionBodyBox).not.toBeNull();
		expect(contentsBox).not.toBeNull();
		expect(noteBox?.x ?? 0).toBeGreaterThanOrEqual(
			(paragraphBox?.x ?? 0) + (paragraphBox?.width ?? 0) + 8,
		);
		expect((noteBox?.x ?? 0) + (noteBox?.width ?? 0)).toBeLessThanOrEqual(
			(sectionBodyBox?.x ?? 0) + (sectionBodyBox?.width ?? 0) + 1,
		);
		expect((noteBox?.x ?? 0) + (noteBox?.width ?? 0)).toBeLessThan((contentsBox?.x ?? 0) - 8);

		const settings = page.locator('[data-display-settings]');
		await settings.locator('summary').click();
		await settings.getByRole('radio', { name: 'Wide' }).check();
		expect(await note.evaluate((element) => getComputedStyle(element).float)).toBe('none');
		expect(await page.evaluate(() => document.documentElement.scrollWidth))
			.toBeLessThanOrEqual(await page.evaluate(() => document.documentElement.clientWidth + 1));

		await settings.getByRole('checkbox', { name: 'Focus reading' }).check();
		await expect(contentsNavigation).toBeHidden();
		expect(await note.evaluate((element) => getComputedStyle(element).float)).toBe('right');
		const [focusNoteBox, pageLayoutBox] = await Promise.all([
			note.boundingBox(),
			page.locator('.site-page-layout').boundingBox(),
		]);
		expect(focusNoteBox).not.toBeNull();
		expect(pageLayoutBox).not.toBeNull();
		expect((focusNoteBox?.x ?? 0) + (focusNoteBox?.width ?? 0)).toBeLessThanOrEqual(
			(pageLayoutBox?.x ?? 0) + (pageLayoutBox?.width ?? 0) + 1,
		);

		await settings.getByRole('checkbox', { name: 'Focus reading' }).uncheck();
		expect(await note.evaluate((element) => getComputedStyle(element).float)).toBe('none');

		await settings.getByRole('radio', { name: 'Standard' }).check();
		expect(await note.evaluate((element) => getComputedStyle(element).float)).toBe('right');
		await settings.getByRole('checkbox', { name: 'Focus reading' }).check();
		expect(await note.evaluate((element) => getComputedStyle(element).float)).toBe('right');

		await page.setViewportSize({ width: 1100, height: desktopViewport.height });
		expect(await note.evaluate((element) => getComputedStyle(element).float)).toBe('none');
	});

	test('uses the empty right track for a wide sidenote on a shallow page', async ({ page }) => {
		await page.goto(shallowPagePath, { waitUntil: 'networkidle' });
		await expect(page.locator('.page-contents-navigation-rail')).toHaveCount(0);

		const settings = page.locator('[data-display-settings]');
		await settings.locator('summary').click();
		await settings.getByRole('radio', { name: 'Wide' }).check();

		const note = page.locator('.section-note').first();
		const paragraph = page.locator('.section-markdown p').first();
		expect(await note.evaluate((element) => getComputedStyle(element).float)).toBe('right');
		const [noteBox, paragraphBox, pageLayoutBox] = await Promise.all([
			note.boundingBox(),
			paragraph.boundingBox(),
			page.locator('.site-page-layout').boundingBox(),
		]);
		expect(noteBox).not.toBeNull();
		expect(paragraphBox).not.toBeNull();
		expect(pageLayoutBox).not.toBeNull();
		expect(noteBox?.x ?? 0).toBeGreaterThanOrEqual(
			(paragraphBox?.x ?? 0) + (paragraphBox?.width ?? 0) + 8,
		);
		expect((noteBox?.x ?? 0) + (noteBox?.width ?? 0)).toBeLessThanOrEqual(
			(pageLayoutBox?.x ?? 0) + (pageLayoutBox?.width ?? 0) + 1,
		);
	});
});

test.describe('stable automatic navigation', () => {
	test.use({ hasTouch: false, isMobile: false, viewport: desktopViewport });

	test('keeps the global row, local rail, and page axis stable across site areas', async ({ page }) => {
		await page.goto('/', { waitUntil: 'networkidle' });
		await expect(page.locator('.site-top')).toHaveAttribute('data-navigation-mode', 'tree');
		await expect(page.locator('.tree-local-navigation')).toBeVisible();
		await expect(page.locator('.page-contents-navigation')).toHaveCount(0);
		await expect(page.locator('.site-nav-submenu')).toHaveCount(0);
		await expect(page.locator('.site-nav > ul > li > a')).toHaveText([
			'Nested pages',
			'Guides',
			'Reference',
		]);
		const homeNavigationX = (await page.locator('.site-nav-row').boundingBox())?.x;
		const homeTreeX = (await page.locator('.tree-local-navigation').boundingBox())?.x;
		const homeContentX = (await page.locator('.site-content').boundingBox())?.x;

		await page.goto(testPagePath, { waitUntil: 'networkidle' });
		await expect(page.locator('.site-top')).toHaveAttribute('data-navigation-mode', 'tree');
		await expect(page.locator('.tree-local-navigation')).toBeVisible();
		await expect(page.locator('.page-contents-navigation-rail')).toBeVisible();
		await expect(page.locator('.site-nav > ul > li > a')).toHaveText([
			'Nested pages',
			'Guides',
			'Reference',
		]);
		const branchNavigationX = (await page.locator('.site-nav-row').boundingBox())?.x;
		const branchTreeX = (await page.locator('.tree-local-navigation').boundingBox())?.x;
		const branchContentX = (await page.locator('.site-content').boundingBox())?.x;
		expect(homeNavigationX).toBeDefined();
		expect(branchNavigationX).toBeDefined();
		expect(homeTreeX).toBeDefined();
		expect(branchTreeX).toBeDefined();
		expect(homeContentX).toBeDefined();
		expect(branchContentX).toBeDefined();
		expect(Math.abs((homeNavigationX ?? 0) - (branchNavigationX ?? 0))).toBeLessThan(1);
		expect(Math.abs((homeTreeX ?? 0) - (branchTreeX ?? 0))).toBeLessThan(1);
		expect(Math.abs((homeContentX ?? 0) - (branchContentX ?? 0))).toBeLessThan(1);
	});

	test('reflows page contents into the document at intermediate widths', async ({ page }) => {
		await page.setViewportSize({ width: 960, height: 900 });
		await page.goto(testPagePath, { waitUntil: 'networkidle' });
		await expect(page.locator('.tree-local-navigation')).toBeVisible();
		await expect(page.locator('.page-contents-navigation-rail')).toBeHidden();
		await expect(page.locator('.page-contents-navigation-inline')).toBeVisible();
	});

	test('keeps the page axis stable when a short page omits the contents rail', async ({ page }) => {
		await page.goto(testPagePath, { waitUntil: 'networkidle' });
		const positionsWithContents = await page.locator('.site-page-layout-tree').evaluate((layout) => {
			const pageRail = layout.querySelector('.tree-local-navigation');
			const content = layout.querySelector('.site-content');
			if (!(pageRail instanceof HTMLElement) || !(content instanceof HTMLElement)) {
				throw new Error('Expected page rail and content.');
			}

			return {
				pageRailX: pageRail.getBoundingClientRect().x,
				contentX: content.getBoundingClientRect().x,
			};
		});

		await page.goto('/guides/release-notes/', { waitUntil: 'networkidle' });
		await expect(page.locator('.page-contents-navigation')).toHaveCount(0);
		const positionsWithoutContents = await page.locator('.site-page-layout-tree').evaluate((layout) => {
			const pageRail = layout.querySelector('.tree-local-navigation');
			const content = layout.querySelector('.site-content');
			if (!(pageRail instanceof HTMLElement) || !(content instanceof HTMLElement)) {
				throw new Error('Expected page rail and content.');
			}

			return {
				pageRailX: pageRail.getBoundingClientRect().x,
				contentX: content.getBoundingClientRect().x,
			};
		});

		expect(Math.abs(positionsWithContents.pageRailX - positionsWithoutContents.pageRailX)).toBeLessThan(1);
		expect(Math.abs(positionsWithContents.contentX - positionsWithoutContents.contentX)).toBeLessThan(1);
	});
});

test.describe('mobile tree navigation', () => {
	test.use({ hasTouch: true, isMobile: true, viewport: mobileViewport });

	test('combines the complete page tree and expandable page contents', async ({ page }) => {
		await page.goto(testPagePath, { waitUntil: 'networkidle' });
		await expect(page.locator('.tree-local-navigation')).not.toBeVisible();
		await expect(page.locator('[data-tree-navigation-toggle]')).not.toBeVisible();

		const menu = page.locator('.mobile-nav-menu');
		await menu.locator(':scope > summary').click();
		await expect(menu.locator('nav[aria-label="Pages"] h2')).toHaveText('Pages');
		await expect(menu.locator('details[data-page-path="guides"]')).toHaveAttribute('open', '');
		await expect(menu.locator('details[data-page-path="guides"] > summary')).toHaveText('Guides');
		const currentPageNode = menu.locator('.navigation-page-node-current');
		const currentPageDisclosure = currentPageNode.locator(':scope > .navigation-page-sections-disclosure');
		await expect(currentPageDisclosure).toHaveAttribute('open', '');
		await expect(currentPageDisclosure.locator(':scope > summary')).toHaveAttribute(
			'aria-label',
			'Sections: macOS',
		);
		await expect(currentPageNode.getByRole('link', { name: 'macOS', exact: true })).toHaveAttribute('aria-current', 'page');
		const currentPageSections = currentPageDisclosure.locator('.navigation-page-sections');
		await expect(currentPageSections).toBeVisible();
		await expect(currentPageSections.getByRole('link', { name: 'Prerequisites', exact: true })).toBeVisible();
		await expect(menu.getByText('Sections', { exact: true })).toHaveCount(0);

		const releaseNotesLink = menu.getByRole('link', { name: 'Release notes', exact: true });
		const releaseNotesNode = releaseNotesLink.locator('..');
		await expect(releaseNotesLink).toBeVisible();
		await expect(releaseNotesNode.locator(':scope > details')).toHaveCount(0);
	});

	test('keeps every page outline available without closing other page branches', async ({ page }) => {
		await page.goto(testPagePath, { waitUntil: 'networkidle' });
		const menu = page.locator('.mobile-nav-menu');
		await menu.locator(':scope > summary').click();
		const guidesDisclosure = menu.locator('details[data-page-path="guides"]');
		const installationDisclosure = menu.locator('details[data-page-path="guides/installation"]');
		const referenceDisclosure = menu.locator('details[data-page-path="reference"]');
		const workflowsLink = menu.getByRole('link', { name: 'Workflows', exact: true });
		const workflowsNode = workflowsLink.locator('..');
		const workflowsSectionsDisclosure = workflowsNode.locator(':scope > .navigation-page-sections-disclosure');
		await expect(guidesDisclosure).toHaveAttribute('open', '');
		await expect(installationDisclosure).toHaveAttribute('open', '');
		await expect(workflowsSectionsDisclosure).not.toHaveAttribute('open', '');
		await expect(menu.getByRole('link', { name: 'Local work', exact: true })).not.toBeVisible();
		await workflowsSectionsDisclosure.locator(':scope > summary').click();
		await expect(menu.getByRole('link', { name: 'Local work', exact: true }))
			.toHaveAttribute('href', '/guides/workflows/#local-work');
		await expect(menu.getByRole('link', { name: 'Local work', exact: true })).toBeVisible();

		await referenceDisclosure.locator(':scope > summary').click({ force: true });
		await expect(referenceDisclosure).toHaveAttribute('open', '');
		await expect(guidesDisclosure).toHaveAttribute('open', '');
		await expect(installationDisclosure).toHaveAttribute('open', '');

		await workflowsLink.click();

		await expect(page).toHaveURL(/\/guides\/workflows\/$/);
		await expect(page.locator('.mobile-nav-menu')).not.toHaveAttribute('open', '');
		await menu.locator(':scope > summary').click();
		const currentWorkflowsNode = menu.locator('.navigation-page-node-current');
		await expect(currentWorkflowsNode.locator(':scope > .navigation-page-sections-disclosure')).toHaveAttribute('open', '');
		await expect(currentWorkflowsNode.getByRole('link', { name: 'Workflows', exact: true })).toHaveAttribute('aria-current', 'page');
		await expect(currentWorkflowsNode.getByRole('link', { name: 'Local work', exact: true })).toBeVisible();
		await expect(menu.getByRole('link', { name: 'Prerequisites', exact: true })).toBeVisible();
		await expect(menu.locator('details[data-page-path="reference"]')).toHaveAttribute('open', '');
	});

	test('remembers an expanded page outline across mobile page navigation', async ({ page }) => {
		await page.goto(testPagePath, { waitUntil: 'networkidle' });
		const menu = page.locator('.mobile-nav-menu');
		await menu.locator(':scope > summary').click();
		const workflowsLink = menu.getByRole('link', { name: 'Workflows', exact: true });
		const workflowsSectionsDisclosure = workflowsLink.locator('..').locator(
			':scope > .navigation-page-sections-disclosure',
		);

		await workflowsSectionsDisclosure.locator(':scope > summary').click();
		await expect(workflowsSectionsDisclosure).toHaveAttribute('open', '');
		await menu.getByRole('link', { name: 'Linux', exact: true }).click();
		await expect(page).toHaveURL(/\/guides\/installation\/linux\/$/);

		await menu.locator(':scope > summary').click();
		const restoredWorkflowsLink = menu.getByRole('link', { name: 'Workflows', exact: true });
		const restoredWorkflowsSections = restoredWorkflowsLink.locator('..').locator(
			':scope > .navigation-page-sections-disclosure',
		);
		await expect(restoredWorkflowsSections).toHaveAttribute('open', '');
		await expect(menu.getByRole('link', { name: 'Local work', exact: true })).toBeVisible();
	});
});

test.describe('desktop tree navigation without JavaScript', () => {
	test.use({
		hasTouch: false,
		isMobile: false,
		javaScriptEnabled: false,
		viewport: desktopViewport,
	});

	test('shows the navigation tree and hides its inactive disclosure control', async ({ page }) => {
		await page.goto(testPagePath, { waitUntil: 'domcontentloaded' });
		await expect(page.locator('.tree-local-navigation')).toBeVisible();
		await expect(page.locator('[data-tree-navigation-toggle]')).not.toBeVisible();
		await expect(page.locator('.site-breadcrumbs')).toBeVisible();
		const sequence = page.getByRole('navigation', { name: 'Page sequence' });
		await expect(sequence.getByRole('link', { name: /Previous page\s+Installation/ })).toBeVisible();
		await expect(sequence.getByRole('link', { name: /Next page\s+Linux/ })).toBeVisible();
	});
});

test.describe('tree navigation without JavaScript', () => {
	test.use({
		hasTouch: true,
		isMobile: true,
		javaScriptEnabled: false,
		viewport: mobileViewport,
	});

	test('keeps page outlines and route links usable', async ({ page }) => {
		await page.goto(testPagePath, { waitUntil: 'domcontentloaded' });
		const menu = page.locator('.mobile-nav-menu');
		await menu.locator(':scope > summary').click();
		await expect(menu.locator('details[data-page-path="guides"]')).toHaveAttribute('open', '');
		const workflowsLink = menu.getByRole('link', { name: 'Workflows', exact: true });
		const workflowsSectionsDisclosure = workflowsLink.locator('..').locator(
			':scope > .navigation-page-sections-disclosure',
		);
		await workflowsSectionsDisclosure.locator(':scope > summary').click();
		await expect(menu.getByRole('link', { name: 'Local work', exact: true }))
			.toHaveAttribute('href', '/guides/workflows/#local-work');
		await workflowsLink.click();
		await expect(page).toHaveURL(/\/guides\/workflows\/$/);
	});
});
