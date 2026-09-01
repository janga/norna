import { expect, test } from '@playwright/test';

const componentsPath = '/guide/components/';

const openComponents = async (page) => {
	await page.goto(componentsPath, { waitUntil: 'domcontentloaded' });
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
	const markdown = page.locator('.section-markdown').first();
	await markdown.evaluate((element) => {
		const table = document.createElement('table');
		table.innerHTML = `
			<thead><tr>${Array.from({ length: 8 }, (_, index) => `<th>Column ${index + 1}</th>`).join('')}</tr></thead>
			<tbody><tr>${Array.from({ length: 8 }, () => '<td>Representative table value</td>').join('')}</tr></tbody>
		`;
		element.append(table);
	});

	const table = markdown.locator('table');
	const dimensions = await table.evaluate((element) => ({
		clientWidth: element.clientWidth,
		overflowX: getComputedStyle(element).overflowX,
		scrollWidth: element.scrollWidth,
	}));
	const overflow = await getHorizontalOverflow(page);

	expect(dimensions.overflowX).toBe('auto');
	expect(dimensions.scrollWidth).toBeGreaterThan(dimensions.clientWidth);
	expect(overflow.scrollWidth, JSON.stringify(overflow.offenders, null, 2)).toBeLessThanOrEqual(overflow.clientWidth + 1);
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
});

test('Display groups native reader controls and closes with Escape', async ({ page }) => {
	await page.setViewportSize({ width: 1280, height: 900 });
	await openComponents(page);
	const settings = page.locator('[data-display-settings]');
	const trigger = settings.locator('summary');
	await trigger.click();

	await expect(settings).toHaveAttribute('open', '');
	await expect(settings.getByRole('group', { name: 'Color mode' })).toBeVisible();
	await expect(settings.getByRole('group', { name: 'Reading width' })).toBeVisible();
	await expect(settings.getByRole('radio', { name: 'System' })).toBeChecked();
	await expect(settings.getByRole('radio', { name: 'Standard' })).toBeChecked();
	await expect(settings.getByRole('checkbox', { name: 'Focus reading' })).not.toBeChecked();
	await expect(settings.getByRole('button', { name: 'Reset' })).toBeVisible();

	await settings.getByRole('radio', { name: 'Standard' }).press('Escape');
	await expect(settings).not.toHaveAttribute('open', '');
	await expect(trigger).toBeFocused();
});

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
	await expect(page.locator('html')).toHaveAttribute('data-color-mode', 'dark');
	await expect(page.locator('html')).toHaveAttribute('data-reading-width', 'wide');
	await expect(page.locator('html')).toHaveAttribute('data-focus-reading', 'on');
	await expect(page.locator('.tree-local-navigation')).toBeHidden();
	await expect(settings.locator('summary')).toBeVisible();
	await expect(settings.locator('.display-settings-focus-status')).toBeVisible();
	await expect(settings.locator('.display-settings-focus-status')).toHaveText('Focus reading');

	const cookieNames = (await context.cookies()).map((cookie) => cookie.name);
	expect(cookieNames).toEqual(expect.arrayContaining([
		'norna-color-mode',
		'norna-reading-width',
		'norna-focus-reading',
	]));

	await page.reload({ waitUntil: 'domcontentloaded' });
	await page.locator('[data-carousel-ready="true"]').waitFor();
	await expect(page.locator('html')).toHaveAttribute('data-color-mode', 'dark');
	await expect(page.locator('html')).toHaveAttribute('data-reading-width', 'wide');
	await expect(page.locator('html')).toHaveAttribute('data-focus-reading', 'on');

	const reloadedSettings = page.locator('[data-display-settings]');
	await reloadedSettings.locator('summary').click();
	await reloadedSettings.getByRole('button', { name: 'Reset' }).click();
	await expect(page.locator('html')).toHaveAttribute('data-color-mode', 'system');
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

		for (const headingId of ['image-stack', 'image-carousel', 'card-list']) {
			const heading = document.getElementById(headingId);
			const paragraph = heading?.closest('.site-section')?.querySelector('.section-markdown p');
			if (!paragraph) throw new Error(`Missing paragraph for ${headingId}.`);
			const note = sourceNote.cloneNode(true) as HTMLElement;
			note.removeAttribute('id');
			paragraph.append(note);
		}
	});

	for (const headingId of ['image-stack', 'image-carousel', 'card-list']) {
		const section = page.locator('.site-section').filter({ has: page.locator(`#${headingId}`) });
		const note = section.locator('.section-note');
		const structuredContent = section.locator(':scope .image-stack, :scope .managed-images, :scope .card-list');
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
	expect(stickyHeaderAfter?.height ?? Infinity).toBeLessThan(stickyHeaderBefore?.height ?? 0);
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

	await expect(page.locator('html')).toHaveAttribute('data-color-mode', 'system');
	await expect(page.locator('html')).toHaveAttribute('data-reading-width', 'standard');
	await expect(page.locator('.site-content h1').first()).toBeVisible();
	await expect(page.locator('.tree-local-navigation')).toBeVisible();
	await expect(page.locator('[data-display-settings]')).toBeHidden();
	await context.close();
});
