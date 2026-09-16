import { expect, test } from '@playwright/test';

for (const javaScriptEnabled of [true, false]) {
	test.describe(`category destinations with JavaScript ${javaScriptEnabled ? 'enabled' : 'disabled'}`, () => {
		test.use({ javaScriptEnabled, viewport: { width: 1440, height: 1000 } });

		for (const redirectPath of ['getting-started/', 'installation/']) {
			test(`opens ${redirectPath} with the deployment base path`, async ({ page }) => {
				await page.goto(redirectPath);
				await expect(page).toHaveURL(/\/category-review\/getting-started\/install-norna\/$/);
				await expect(page.locator('main h1')).toHaveText('Install Norna');
			});
		}

		test('lists direct children without descending until the reader chooses', async ({ page }) => {
			await page.goto('guides/');
			await expect(page.locator('main h1')).toHaveText('Guides');
			const list = page.locator('main .child-page-list');
			await expect(list.locator('strong')).toHaveText(['Installation', 'Workflows']);
			await expect(list).toContainText('Choose how to preview, check, and publish your site.');
			await expect(list.getByRole('link').first()).toHaveAttribute('href', '/category-review/guides/installation/');

			const branch = page.locator('.navigation-page-disclosure-sidebar[data-page-path="guides/installation"]');
			await branch.locator(':scope > summary').click();
			await expect(branch).toHaveAttribute('open', '');
			await expect(page).toHaveURL(/\/category-review\/guides\/$/);
			await branch.locator(':scope > summary').click();
			await expect(branch).not.toHaveAttribute('open');
			await expect(page).toHaveURL(/\/category-review\/guides\/$/);

			await list.getByRole('link').first().click();
			await expect(page).toHaveURL(/\/category-review\/guides\/installation\/requirements\/$/);
			await expect(page.locator('main h1')).toHaveText('Requirements');
		});
	});
}

const redirectAppearances = [
	{ name: 'site default on a light device', cookie: undefined, device: 'light', appearance: 'dark', mode: 'dark' },
	{ name: 'saved light on a dark device', cookie: 'light', device: 'dark', appearance: 'light', mode: 'light' },
	{ name: 'saved dark on a light device', cookie: 'dark', device: 'light', appearance: 'dark', mode: 'dark' },
	{ name: 'saved system on a light device', cookie: 'system', device: 'light', appearance: 'system', mode: 'light' },
	{ name: 'saved system on a dark device', cookie: 'system', device: 'dark', appearance: 'system', mode: 'dark' },
	{ name: 'invalid saved preference', cookie: 'invalid', device: 'light', appearance: 'dark', mode: 'dark' },
	{ name: 'site default without JavaScript', cookie: 'light', device: 'light', appearance: 'dark', mode: 'dark', javaScriptEnabled: false },
] as const;

const redirectColors = {
	light: { background: 'rgb(247, 247, 245)', text: 'rgb(23, 23, 23)', link: 'rgb(75, 75, 70)' },
	dark: { background: 'rgb(0, 0, 0)', text: 'rgb(242, 238, 230)', link: 'rgb(216, 210, 200)' },
};

for (const scenario of redirectAppearances) {
	test.describe(`redirect appearance: ${scenario.name}`, () => {
		const javaScriptEnabled = !('javaScriptEnabled' in scenario) || scenario.javaScriptEnabled;
		test.use({
			colorScheme: scenario.device,
			javaScriptEnabled,
			viewport: scenario.cookie === 'light' || scenario.cookie === 'dark'
				? { width: 390, height: 844 }
				: { width: 1440, height: 1000 },
		});

		for (const redirectPath of ['getting-started/', 'installation/']) {
			test(`${redirectPath} paints the theme without external assets`, async ({ page, context, baseURL }, testInfo) => {
				const redirectUrl = new URL(redirectPath, baseURL);
				if (scenario.cookie) {
					await context.addCookies([{
						name: 'norna-appearance', value: scenario.cookie,
						domain: redirectUrl.hostname, path: '/category-review/',
					}]);
				}
				await page.route('**/*', async (route) => {
					if (route.request().url() !== redirectUrl.href) return route.abort();
					const response = await route.fetch();
					const html = await response.text();
					const refresh = /<meta http-equiv="refresh"[^>]*>/;
					expect(html).toMatch(refresh);
					// Hold the actual intermediary in place; block external CSS and scripts
					// so its first frame must use its own theme and preference bootstrap.
					await route.fulfill({ response, body: html.replace(refresh, '') });
				});
				await page.addInitScript(() => {
					requestAnimationFrame(function capture() {
						if (!document.body) return requestAnimationFrame(capture);
						document.documentElement.dataset.firstFrameBackground = getComputedStyle(document.documentElement).backgroundColor;
					});
				});
				await page.goto(redirectUrl.href);
				const colors = redirectColors[scenario.mode];
				const root = page.locator('html');
				await expect(root).toHaveAttribute('data-appearance', scenario.appearance);
				await expect(root).toHaveCSS('background-color', colors.background);
				await expect(root).toHaveCSS('color-scheme', scenario.mode);
				await expect(page.locator('main h1')).toHaveCSS('color', colors.text);
				const link = page.getByRole('link', { name: 'Install Norna', exact: true });
				await expect(link).toHaveCSS('color', colors.link);
				await expect(link).toHaveAttribute('href', '/category-review/getting-started/install-norna/');
				if (javaScriptEnabled) {
					await expect(root).toHaveAttribute('data-first-frame-background', colors.background);
				}
				await page.screenshot({ path: testInfo.outputPath('redirect.png') });
			});
		}
	});
}
