import { expect, test } from '@playwright/test';

const desktopViewport = { width: 1440, height: 1000 };
const mobileViewport = { width: 393, height: 852 };
const testPagePath = '/guides/installation/macos/';

test.describe('desktop tree navigation', () => {
	test.use({ hasTouch: false, isMobile: false, viewport: desktopViewport });

	test('connects the current page contents to its node in the active branch', async ({ page }) => {
		await page.goto(testPagePath, { waitUntil: 'networkidle' });

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
		await expect(localNavigation.locator('details[data-page-path="guides/installation"] > summary')).toHaveText('Installation');
		await expect(localNavigation.locator('details[data-page-path="guides/workflows"] > summary')).toHaveText('Workflows');
		const currentPageDisclosure = localNavigation.locator('details[data-page-path="guides/installation/macos"]');
		await expect(currentPageDisclosure.locator(':scope > summary')).toHaveText('macOS');
		await expect(currentPageDisclosure.getByRole('link', { name: 'macOS', exact: true })).toHaveAttribute('aria-current', 'page');
		await expect(localNavigation.getByRole('link', { name: 'Reference', exact: true })).toHaveCount(0);

		await expect(page.locator('.site-breadcrumbs li')).toHaveText(['Guides', 'Installation', 'macOS']);
		const currentPageNode = localNavigation.locator('.navigation-page-node-current');
		const pageContents = currentPageNode.locator('.navigation-page-sections');
		await expect(pageContents).toBeVisible();
		await expect(pageContents.getByRole('link', { name: 'Install', exact: true })).toBeVisible();
		await expect(pageContents.getByRole('link', { name: 'Prerequisites', exact: true })).toBeVisible();
		await expect(pageContents.getByRole('link', { name: 'Verify', exact: true })).toBeVisible();
		await expect(page.locator('.page-nav')).toHaveCount(0);

		const toggleIconBox = await page.locator('.tree-navigation-toggle-icon-hide').boundingBox();
		const activeRootLinkBox = await localNavigation
			.locator('.navigation-page-tree-sidebar > .navigation-page-node .navigation-page-summary-title')
			.first()
			.boundingBox();
		expect(toggleIconBox).not.toBeNull();
		expect(activeRootLinkBox).not.toBeNull();
		expect(Math.abs((toggleIconBox?.x ?? 0) - (activeRootLinkBox?.x ?? 0))).toBeLessThan(2);
	});

	test('collapses the local tree in one action while preserving page context and reading position', async ({ page }) => {
		await page.goto(testPagePath, { waitUntil: 'networkidle' });
		const root = page.locator('html');
		const localNavigation = page.locator('.tree-local-navigation');
		const collapseButton = page.locator('[data-tree-navigation-toggle]');
		const content = page.locator('.site-content');
		const breadcrumbs = page.locator('.site-breadcrumbs');
		const heading = page.locator('.section-header').first();
		const prose = page.locator('.section-markdown').first();
		const contentWidthBefore = (await content.boundingBox())?.width;
		const breadcrumbsBefore = await breadcrumbs.boundingBox();
		const headingBefore = await heading.boundingBox();
		const proseBefore = await prose.boundingBox();

		await expect(collapseButton).toHaveAttribute('aria-expanded', 'true');
		await expect(collapseButton).toHaveAccessibleName('Hide navigation');
		await collapseButton.click();

		await expect(collapseButton).toBeFocused();
		await expect(root).toHaveAttribute('data-tree-navigation', 'collapsed');
		await expect(collapseButton).toHaveAttribute('aria-expanded', 'false');
		await expect(collapseButton).toHaveAccessibleName('Show navigation');
		await expect(localNavigation).toBeHidden();
		await expect(page.locator('.site-nav')).toBeVisible();
		await expect(page.locator('.site-breadcrumbs')).toBeVisible();

		const contentWidthAfter = (await content.boundingBox())?.width;
		const breadcrumbsAfter = await breadcrumbs.boundingBox();
		const headingAfter = await heading.boundingBox();
		const proseAfter = await prose.boundingBox();
		expect(contentWidthBefore).toBeDefined();
		expect(contentWidthAfter).toBeDefined();
		expect((contentWidthAfter ?? 0) - (contentWidthBefore ?? 0)).toBeGreaterThan(100);
		expect(proseBefore).not.toBeNull();
		expect(proseAfter).not.toBeNull();
		expect(headingBefore).not.toBeNull();
		expect(headingAfter).not.toBeNull();
		expect(breadcrumbsBefore).not.toBeNull();
		expect(breadcrumbsAfter).not.toBeNull();
		expect(Math.abs((proseAfter?.width ?? 0) - (proseBefore?.width ?? 0))).toBeLessThan(2);
		expect(Math.abs((proseAfter?.x ?? 0) - (proseBefore?.x ?? 0))).toBeLessThan(2);
		expect(Math.abs((headingAfter?.x ?? 0) - (headingBefore?.x ?? 0))).toBeLessThan(2);
		expect(Math.abs((breadcrumbsAfter?.x ?? 0) - (breadcrumbsBefore?.x ?? 0))).toBeLessThan(2);
		expect(await page.evaluate(() => sessionStorage.getItem('norna:tree-navigation:visibility:/'))).toBe('collapsed');

		await page.goto('/guides/workflows/', { waitUntil: 'networkidle' });
		await expect(page.locator('html')).toHaveAttribute('data-tree-navigation', 'collapsed');
		await expect(page.locator('.tree-local-navigation')).toBeHidden();
		const showButton = page.locator('[data-tree-navigation-toggle]');
		await showButton.click();
		await expect(showButton).toBeFocused();
		await expect(page.locator('html')).toHaveAttribute('data-tree-navigation', 'expanded');
		await expect(page.locator('.tree-local-navigation')).toBeVisible();
	});

	test('preserves open page sections and vertical positions across navigation', async ({ page }) => {
		await page.goto('/guides/installation/', { waitUntil: 'networkidle' });
		const localNavigation = page.locator('.tree-local-navigation');
		const installationBranch = localNavigation.locator('details[data-page-path="guides/installation"]');
		await expect(installationBranch).toHaveAttribute('open', '');
		await expect(installationBranch.getByRole('link', { name: 'Installation details', exact: true })).toBeVisible();

		const macosBranch = localNavigation.locator('details[data-page-path="guides/installation/macos"]');
		await expect(macosBranch).not.toHaveAttribute('open', '');
		await expect(macosBranch.getByRole('link', { name: 'macOS', exact: true })).not.toBeVisible();
		await macosBranch.locator(':scope > summary').click();
		await expect(page).toHaveURL(/\/guides\/installation\/$/);
		await expect(macosBranch.getByRole('link', { name: 'Install', exact: true })).toBeVisible();
		await expect(macosBranch.getByRole('link', { name: 'macOS', exact: true })).toBeVisible();
		const macosTopBefore = (await macosBranch.locator(':scope > summary').boundingBox())?.y;
		const headingTopBefore = (await page.getByRole('heading', { level: 1, name: 'Installation' }).boundingBox())?.y;

		await macosBranch.getByRole('link', { name: 'macOS', exact: true }).click();
		await expect(page).toHaveURL(/\/guides\/installation\/macos\/$/);
		const nextLocalNavigation = page.locator('.tree-local-navigation');
		const nextInstallationBranch = nextLocalNavigation.locator('details[data-page-path="guides/installation"]');
		const nextMacosBranch = nextLocalNavigation.locator('details[data-page-path="guides/installation/macos"]');
		await expect(nextInstallationBranch).toHaveAttribute('open', '');
		await expect(nextInstallationBranch.getByRole('link', { name: 'Installation details', exact: true })).toBeVisible();
		await expect(nextMacosBranch).toHaveAttribute('open', '');
		await expect(nextMacosBranch.getByRole('link', { name: 'Install', exact: true })).toBeVisible();

		const macosTopAfter = (await nextMacosBranch.locator(':scope > summary').boundingBox())?.y;
		const headingTopAfter = (await page.getByRole('heading', { level: 1, name: 'macOS' }).boundingBox())?.y;
		expect(macosTopBefore).toBeDefined();
		expect(macosTopAfter).toBeDefined();
		expect(Math.abs((macosTopAfter ?? 0) - (macosTopBefore ?? 0))).toBeLessThan(2);
		expect(headingTopBefore).toBeDefined();
		expect(headingTopAfter).toBeDefined();
		expect(Math.abs((headingTopAfter ?? 0) - (headingTopBefore ?? 0))).toBeLessThan(2);
	});

	test('keeps the breadcrumb slot stable from a top-level page to a child page', async ({ page }) => {
		await page.goto('/guides/', { waitUntil: 'networkidle' });
		await expect(page.locator('.site-breadcrumbs')).toHaveCount(1);
		await expect(page.locator('.site-breadcrumbs li')).toHaveCount(0);
		const headingTopBefore = (await page.getByRole('heading', { level: 1, name: 'Guides' }).boundingBox())?.y;
		const installationBranch = page.locator('.tree-local-navigation details[data-page-path="guides/installation"]');
		await installationBranch.locator(':scope > summary').click();
		await expect(page).toHaveURL(/\/guides\/$/);
		await installationBranch.getByRole('link', { name: 'Installation', exact: true }).click();

		await expect(page).toHaveURL(/\/guides\/installation\/$/);
		await expect(page.locator('.site-breadcrumbs li')).toHaveText(['Guides', 'Installation']);
		const headingTopAfter = (await page.getByRole('heading', { level: 1, name: 'Installation' }).boundingBox())?.y;
		expect(headingTopBefore).toBeDefined();
		expect(headingTopAfter).toBeDefined();
		expect(Math.abs((headingTopAfter ?? 0) - (headingTopBefore ?? 0))).toBeLessThan(2);
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
		await page.goto('/guides/#guide-overview', { waitUntil: 'networkidle' });
		const localNavigationTopBefore = (await page.locator('.tree-local-navigation').boundingBox())?.y;

		await page.locator('.tree-local-navigation').getByRole('link', { name: 'Release notes', exact: true }).click();
		await expect(page).toHaveURL(/\/guides\/release-notes\/$/);
		const localNavigationTopAfter = (await page.locator('.tree-local-navigation').boundingBox())?.y;

		expect(localNavigationTopBefore).toBeDefined();
		expect(localNavigationTopAfter).toBeDefined();
		expect(Math.abs((localNavigationTopAfter ?? 0) - (localNavigationTopBefore ?? 0))).toBeLessThan(2);
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
});

test.describe('mobile tree navigation', () => {
	test.use({ hasTouch: true, isMobile: true, viewport: mobileViewport });

	test('combines the complete page tree and current-page contents', async ({ page }) => {
		await page.goto(testPagePath, { waitUntil: 'networkidle' });
		await expect(page.locator('.tree-local-navigation')).not.toBeVisible();
		await expect(page.locator('[data-tree-navigation-toggle]')).not.toBeVisible();

		const menu = page.locator('.mobile-nav-menu');
		await menu.locator(':scope > summary').click();
		await expect(menu.locator('nav[aria-label="Pages"] h2')).toHaveText('Pages');
		await expect(menu.locator('details[data-page-path="guides"]')).toHaveAttribute('open', '');
		await expect(menu.locator('details[data-page-path="guides"] > summary')).toHaveText('Guides');
		const currentPageDisclosure = menu.locator('details[data-page-path="guides/installation/macos"]');
		await expect(currentPageDisclosure).toHaveAttribute('open', '');
		await expect(currentPageDisclosure.locator(':scope > summary')).toHaveText('macOS');
		await expect(currentPageDisclosure.getByRole('link', { name: 'macOS', exact: true })).toHaveAttribute('aria-current', 'page');
		const currentPageSections = menu.locator('.navigation-page-node-current > .navigation-page-disclosure .navigation-page-sections');
		await expect(currentPageSections).toBeVisible();
		await expect(currentPageSections.getByRole('link', { name: 'Prerequisites', exact: true })).toBeVisible();

		const releaseNotesLink = menu.getByRole('link', { name: 'Release notes', exact: true });
		const releaseNotesNode = releaseNotesLink.locator('..');
		await expect(releaseNotesLink).toBeVisible();
		await expect(releaseNotesNode.locator(':scope > details')).toHaveCount(0);
	});

	test('expands a page before its title becomes a page link', async ({ page }) => {
		await page.goto(testPagePath, { waitUntil: 'networkidle' });
		const menu = page.locator('.mobile-nav-menu');
		await menu.locator(':scope > summary').click();
		const workflowsDisclosure = menu.locator('details[data-page-path="guides/workflows"]');
		await expect(workflowsDisclosure).not.toHaveAttribute('open', '');
		await expect(workflowsDisclosure.getByRole('link', { name: 'Workflows', exact: true })).not.toBeVisible();
		await workflowsDisclosure.locator(':scope > summary').click();
		await expect(page).toHaveURL(new RegExp(`${testPagePath}$`));
		await expect(workflowsDisclosure).toHaveAttribute('open', '');
		await expect(workflowsDisclosure.getByRole('link', { name: 'Workflows', exact: true })).toBeVisible();
		await workflowsDisclosure.getByRole('link', { name: 'Workflows', exact: true }).click();

		await expect(page).toHaveURL(/\/guides\/workflows\/$/);
		await expect(page.locator('.mobile-nav-menu')).not.toHaveAttribute('open', '');
		await menu.locator(':scope > summary').click();
		await expect(menu.locator('details[data-page-path="guides/installation/macos"]')).toHaveAttribute('open', '');
		await expect(menu.locator('details[data-page-path="guides/installation/macos"] .navigation-page-sections')).toBeVisible();
		await expect(menu.locator('details[data-page-path="guides/workflows"]')).toHaveAttribute('open', '');
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
	});
});

test.describe('tree navigation without JavaScript', () => {
	test.use({
		hasTouch: true,
		isMobile: true,
		javaScriptEnabled: false,
		viewport: mobileViewport,
	});

	test('keeps the page tree and route links usable', async ({ page }) => {
		await page.goto(testPagePath, { waitUntil: 'domcontentloaded' });
		const menu = page.locator('.mobile-nav-menu');
		await menu.locator(':scope > summary').click();
		await expect(menu.locator('details[data-page-path="guides"]')).toHaveAttribute('open', '');
		const workflowsDisclosure = menu.locator('details[data-page-path="guides/workflows"]');
		await workflowsDisclosure.locator(':scope > summary').click();
		await workflowsDisclosure.getByRole('link', { name: 'Workflows', exact: true }).click();
		await expect(page).toHaveURL(/\/guides\/workflows\/$/);
	});
});
