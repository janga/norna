import { expect, test } from '@playwright/test';

const desktopViewport = { width: 1440, height: 1000 };
const intermediateViewport = { width: 960, height: 900 };
const mobileViewport = { width: 393, height: 852 };
const deepPagePath = '/guides/installation/macos/';
const shallowPagePath = '/reference/installation/';

test.describe('adaptive page contents on desktop', () => {
	test.use({ hasTouch: false, isMobile: false, viewport: desktopViewport });

	test('integrates the current outline into a shallow page tree', async ({ page }) => {
		await page.goto(shallowPagePath, { waitUntil: 'networkidle' });

		const layout = page.locator('.site-page-layout');
		const tree = page.locator('.tree-local-navigation');
		const currentPage = tree.locator('.navigation-page-node-current');
		const sections = currentPage.locator('.navigation-page-sections');

		await expect(layout).toHaveAttribute('data-page-contents-placement', 'page-tree');
		await expect(tree).toBeVisible();
		await expect(currentPage.locator(':scope > details')).toHaveAttribute('open', '');
		await expect(sections).toBeVisible();
		await expect(sections.locator('.navigation-page-sections-label')).toHaveText('Sections');
		await expect(sections.getByRole('navigation')).toHaveCount(0);
		await expect(sections).toHaveAttribute('aria-label', 'Page contents: Reference installation');
		await expect(sections.getByRole('link')).toHaveText(['Install', 'Prerequisites', 'Verify']);
		await expect(page.locator('.page-contents-navigation')).toHaveCount(0);

		const verifyLink = sections.getByRole('link', { name: 'Verify', exact: true });
		await verifyLink.click();
		await expect(page).toHaveURL(/#verify$/);
		await expect(verifyLink).toHaveAttribute('aria-current', 'location');
	});

	test('keeps the outline in a separate rail for every page in a deep branch', async ({ page }) => {
		await page.goto(deepPagePath, { waitUntil: 'networkidle' });

		await expect(page.locator('.site-page-layout')).toHaveAttribute(
			'data-page-contents-placement',
			'contents-rail',
		);
		await expect(page.locator('.tree-local-navigation .navigation-page-sections')).toHaveCount(0);
		await expect(page.locator('.page-contents-navigation-rail')).toBeVisible();
	});
});

test.describe('adaptive page contents at intermediate widths', () => {
	test.use({ hasTouch: false, isMobile: false, viewport: intermediateViewport });

	test('keeps shallow contents in the tree without adding an inline duplicate', async ({ page }) => {
		await page.goto(shallowPagePath, { waitUntil: 'networkidle' });

		await expect(page.locator('.tree-local-navigation')).toBeVisible();
		await expect(page.locator('.tree-local-navigation .navigation-page-sections')).toBeVisible();
		await expect(page.locator('.page-contents-navigation')).toHaveCount(0);
	});
});

test.describe('adaptive page contents on mobile', () => {
	test.use({ hasTouch: true, isMobile: true, viewport: mobileViewport });

	test('keeps the established consolidated page and section menu', async ({ page }) => {
		await page.goto(shallowPagePath, { waitUntil: 'networkidle' });

		const menu = page.locator('.mobile-nav-menu');
		await menu.locator(':scope > summary').click();
		const currentPage = menu.locator('.navigation-page-node-current');
		await expect(currentPage.locator('.navigation-page-sections')).toBeVisible();
		await expect(currentPage.getByRole('link', { name: 'Prerequisites', exact: true })).toBeVisible();
	});
});

test.describe('adaptive page contents without JavaScript', () => {
	test.use({
		hasTouch: false,
		isMobile: false,
		javaScriptEnabled: false,
		viewport: desktopViewport,
	});

	test('renders the active shallow outline as native links', async ({ page }) => {
		await page.goto(shallowPagePath, { waitUntil: 'domcontentloaded' });

		const currentPage = page.locator('.tree-local-navigation .navigation-page-node-current');
		await expect(currentPage.locator(':scope > details')).toHaveAttribute('open', '');
		await expect(currentPage.getByRole('link', { name: 'Install', exact: true })).toBeVisible();
		await expect(currentPage.getByRole('link', { name: 'Verify', exact: true })).toBeVisible();
	});
});
