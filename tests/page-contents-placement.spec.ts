import { expect, test } from '@playwright/test';

const desktopViewport = { width: 1440, height: 1000 };
const intermediateViewport = { width: 960, height: 900 };
const mobileViewport = { width: 393, height: 852 };
const homePagePath = '/';
const deepPagePath = '/guides/installation/macos/';
const shallowPagePath = '/reference/installation/';

test.describe('adaptive page contents on desktop', () => {
	test.use({ hasTouch: false, isMobile: false, viewport: desktopViewport });

	test('uses a leading disclosure column without disturbing the label axis', async ({ page }) => {
		await page.goto('/guides/installation/', { waitUntil: 'networkidle' });

		const tree = page.locator('.tree-local-navigation');
		const installation = tree.locator('details[data-page-path="guides/installation"]');
		const summary = installation.locator(':scope > summary');
		const chevron = summary.locator('.navigation-page-chevron');
		const summaryTitle = summary.locator('.navigation-page-summary-title');
		const openLink = installation.locator(':scope > .navigation-page-open-link');
		const siblingLink = tree.getByRole('link', { name: 'Workflows', exact: true });
		const [treeBox, chevronBox, titleBox, openLinkBox, siblingTextX] = await Promise.all([
			tree.boundingBox(),
			chevron.boundingBox(),
			summaryTitle.boundingBox(),
			openLink.boundingBox(),
			siblingLink.evaluate((link) => {
				const textNode = link.firstChild;
				if (!textNode) throw new Error('Expected the sibling link to contain text.');
				const range = document.createRange();
				range.selectNodeContents(textNode);
				return range.getBoundingClientRect().x;
			}),
		]);

		expect(treeBox).not.toBeNull();
		expect(chevronBox).not.toBeNull();
		expect(titleBox).not.toBeNull();
		expect(openLinkBox).not.toBeNull();
		expect((chevronBox?.x ?? 0) + (chevronBox?.width ?? 0)).toBeLessThan((titleBox?.x ?? 0) - 4);
		expect(Math.abs((titleBox?.x ?? 0) - (openLinkBox?.x ?? 0))).toBeLessThan(1);
		expect(Math.abs((titleBox?.x ?? 0) - siblingTextX)).toBeLessThan(1);
		expect((treeBox?.x ?? 0) + (treeBox?.width ?? 0) - (chevronBox?.x ?? 0)).toBeGreaterThan(40);
	});

	test('integrates page outlines into expanded shallow tree branches', async ({ page }) => {
		await page.goto(shallowPagePath, { waitUntil: 'networkidle' });

		const layout = page.locator('.site-page-layout');
		const tree = page.locator('.tree-local-navigation');
		const referenceBranch = tree.locator('details[data-page-path="reference"]');
		const referenceSections = referenceBranch.locator(
			':scope > .navigation-page-branch-content > .navigation-page-sections',
		);
		const currentPage = tree.locator('.navigation-page-node-current');
		const sections = currentPage.locator('.navigation-page-sections');

		await expect(layout).toHaveAttribute('data-page-contents-placement', 'page-tree');
		await expect(tree).toBeVisible();
		const currentPageDisclosure = currentPage.locator(':scope > .navigation-page-sections-disclosure');
		await expect(currentPageDisclosure).toHaveAttribute('open', '');
		await expect(currentPageDisclosure.locator(':scope > summary')).toHaveAttribute(
			'aria-label',
			'Sections: Reference installation',
		);
		await expect(currentPage.locator(':scope > .navigation-page-link')).toHaveAttribute(
			'aria-current',
			'page',
		);
		await expect(currentPage.locator('.navigation-page-chevron')).toHaveCount(1);
		await expect(referenceBranch).toHaveAttribute('open', '');
		await expect(referenceSections).toBeVisible();
		await expect(referenceSections.getByRole('link', { name: 'Reference overview', exact: true }))
			.toHaveAttribute('href', '/reference/#reference-overview');
		await expect(sections).toBeVisible();
		await expect(sections.locator('.navigation-page-sections-label')).toHaveCount(0);
		await expect(tree.locator('.navigation-page-sections')).toHaveCount(2);
		await expect(sections.getByRole('navigation')).toHaveCount(0);
		await expect(sections).toHaveAttribute('aria-label', 'Page contents: Reference installation');
		await expect(sections.getByRole('link')).toHaveText(['Install', 'Prerequisites', 'Verify']);
		await expect(page.locator('.page-contents-navigation')).toHaveCount(0);

		const [pageTitleTextX, sectionLineX, installTextX, subsectionLineX] = await Promise.all([
			currentPage.locator(':scope > .navigation-page-link').evaluate((link) => {
				const textNode = link.firstChild;
				if (!textNode) throw new Error('Expected the current page link to contain text.');
				const range = document.createRange();
				range.selectNodeContents(textNode);
				return range.getBoundingClientRect().x;
			}),
			sections.evaluate((navigation) => navigation.getBoundingClientRect().x),
			sections.getByRole('link', { name: 'Install', exact: true }).evaluate((link) => {
				const textNode = link.firstChild;
				if (!textNode) throw new Error('Expected the section link to contain text.');
				const range = document.createRange();
				range.selectNodeContents(textNode);
				return range.getBoundingClientRect().x;
			}),
			sections.locator('.page-contents-links > li:first-child > ol').evaluate((list) => (
				list.getBoundingClientRect().x
			)),
		]);
		expect(Math.abs(sectionLineX - pageTitleTextX)).toBeLessThan(1);
		expect(Math.abs(subsectionLineX - installTextX)).toBeLessThan(1);

		await currentPageDisclosure.locator('.navigation-page-chevron').click();
		await expect(currentPageDisclosure).not.toHaveAttribute('open', '');
		await expect(sections).not.toBeVisible();
		await expect(currentPage.locator(':scope > .navigation-page-link')).toBeVisible();
		await expect(tree.locator('details[data-page-path="reference"]')).toHaveAttribute('open', '');
		await currentPageDisclosure.locator('.navigation-page-chevron').click();
		await expect(sections).toBeVisible();

		const verifyLink = sections.getByRole('link', { name: 'Verify', exact: true });
		await verifyLink.click();
		await expect(page).toHaveURL(/#verify$/);
		await expect(verifyLink).toHaveAttribute('aria-current', 'location');
		const currentSectionStyle = await verifyLink.evaluate((link) => ({
			backgroundColor: getComputedStyle(link).backgroundColor,
			markerContent: getComputedStyle(link, '::before').content,
			textDecorationLine: getComputedStyle(link).textDecorationLine,
			textDecorationThickness: getComputedStyle(link).textDecorationThickness,
		}));
		expect(currentSectionStyle.backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
		expect(currentSectionStyle.markerContent).toBe('none');
		expect(currentSectionStyle.textDecorationLine).toContain('underline');
		expect(currentSectionStyle.textDecorationThickness).toBe('1.5px');
	});

	test('remembers an explicitly closed page outline across shallow page navigation', async ({ page }) => {
		await page.goto(shallowPagePath, { waitUntil: 'networkidle' });

		const currentSections = page.locator(
			'.tree-local-navigation .navigation-page-node-current > .navigation-page-sections-disclosure',
		);
		await expect(currentSections).toHaveAttribute('open', '');
		await currentSections.locator(':scope > summary').click();
		await expect(currentSections).not.toHaveAttribute('open', '');

		await page.locator(
			'.tree-local-navigation details[data-page-path="reference"] > .navigation-page-open-link',
		).click();
		await expect(page).toHaveURL(/\/reference\/$/);
		await page.locator('.tree-local-navigation').getByRole('link', {
			name: 'Reference installation',
			exact: true,
		}).click();
		await expect(page).toHaveURL(/\/reference\/installation\/$/);

		await expect(page.locator(
			'.tree-local-navigation .navigation-page-node-current > .navigation-page-sections-disclosure',
		)).not.toHaveAttribute('open', '');
	});

	test('keeps the outline in a separate rail for every page in a deep branch', async ({ page }) => {
		await page.goto(deepPagePath, { waitUntil: 'networkidle' });

		await expect(page.locator('.site-page-layout')).toHaveAttribute(
			'data-page-contents-placement',
			'contents-rail',
		);
		await expect(page.locator('.tree-local-navigation .navigation-page-sections')).toHaveCount(0);
		const contentsRail = page.locator('.page-contents-navigation-rail');
		await expect(contentsRail).toBeVisible();
		const currentSection = contentsRail.getByRole('link', { name: 'Install', exact: true });
		await expect(currentSection).toHaveAttribute('aria-current', 'location');
		expect(await currentSection.evaluate((link) => getComputedStyle(link, '::before').width)).toBe('2px');
	});

	test('keeps the local rail and content axis stable from Home into a nested branch', async ({ page }) => {
		await page.goto(homePagePath, { waitUntil: 'networkidle' });

		const homeLayout = page.locator('.site-page-layout');
		const homeTree = page.locator('.tree-local-navigation');
		await expect(page.locator('.site-top')).toHaveAttribute('data-navigation-mode', 'tree');
		await expect(homeLayout).toHaveAttribute('data-page-contents-placement', 'page-tree');
		await expect(homeTree).toBeVisible();
		await expect(homeTree.getByRole('link', { name: 'Start here', exact: true })).toBeVisible();

		const [homeTreeBox, homeContentBox] = await Promise.all([
			homeTree.boundingBox(),
			page.locator('.site-content').boundingBox(),
		]);

		await page.locator('.site-nav').getByRole('link', { name: 'Guides', exact: true }).click();
		await expect(page).toHaveURL(/\/guides\/installation\/$/);

		const nestedTree = page.locator('.tree-local-navigation');
		const [nestedTreeBox, nestedContentBox] = await Promise.all([
			nestedTree.boundingBox(),
			page.locator('.site-content').boundingBox(),
		]);

		expect(homeTreeBox).not.toBeNull();
		expect(homeContentBox).not.toBeNull();
		expect(nestedTreeBox).not.toBeNull();
		expect(nestedContentBox).not.toBeNull();
		expect(nestedTreeBox?.x).toBeCloseTo(homeTreeBox?.x ?? 0, 0);
		expect(nestedContentBox?.x).toBeCloseTo(homeContentBox?.x ?? 0, 0);
	});
});

test.describe('adaptive page contents at intermediate widths', () => {
	test.use({ hasTouch: false, isMobile: false, viewport: intermediateViewport });

	test('keeps every expanded shallow outline in the tree without adding an inline duplicate', async ({ page }) => {
		await page.goto(shallowPagePath, { waitUntil: 'networkidle' });

		await expect(page.locator('.tree-local-navigation')).toBeVisible();
		await expect(page.locator('.tree-local-navigation .navigation-page-sections')).toHaveCount(2);
		await expect(page.getByRole('navigation', { name: 'Page contents: Reference', exact: true })).toBeVisible();
		await expect(page.getByRole('navigation', { name: 'Page contents: Reference installation' })).toBeVisible();
		await expect(page.locator('.page-contents-navigation')).toHaveCount(0);
	});
});

test.describe('adaptive page contents on mobile', () => {
	test.use({ hasTouch: true, isMobile: true, viewport: mobileViewport });

	test('keeps page outlines available in the consolidated page and section menu', async ({ page }) => {
		await page.goto(shallowPagePath, { waitUntil: 'networkidle' });

		const menu = page.locator('.mobile-nav-menu');
		await menu.locator(':scope > summary').click();
		const currentPage = menu.locator('.navigation-page-node-current');
		await expect(currentPage.locator('.navigation-page-sections')).toBeVisible();
		await expect(currentPage.getByRole('link', { name: 'Prerequisites', exact: true })).toBeVisible();
		await expect(menu.getByRole('link', { name: 'Reference overview', exact: true }))
			.toHaveAttribute('href', '/reference/#reference-overview');
	});
});

test.describe('adaptive page contents without JavaScript', () => {
	test.use({
		hasTouch: false,
		isMobile: false,
		javaScriptEnabled: false,
		viewport: desktopViewport,
	});

	test('renders expanded shallow outlines as native links', async ({ page }) => {
		await page.goto(shallowPagePath, { waitUntil: 'domcontentloaded' });

		const referenceBranch = page.locator('.tree-local-navigation details[data-page-path="reference"]');
		const currentPage = page.locator('.tree-local-navigation .navigation-page-node-current');
		await expect(referenceBranch).toHaveAttribute('open', '');
		await expect(referenceBranch.getByRole('link', { name: 'Reference overview', exact: true }))
			.toHaveAttribute('href', '/reference/#reference-overview');
		await expect(currentPage.locator(':scope > .navigation-page-sections-disclosure')).toHaveAttribute('open', '');
		await expect(currentPage.getByRole('link', { name: 'Install', exact: true })).toBeVisible();
		await expect(currentPage.getByRole('link', { name: 'Verify', exact: true })).toBeVisible();
	});
});
