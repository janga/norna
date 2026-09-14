import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFile, mkdir } from 'node:fs/promises';
import { stripTypeScriptTypes } from 'node:module';
import { chromium } from '@playwright/test';
import { markdownToHtml } from 'satteri';
import { nornaNotesRenderPlugin, marginNoteLayoutDeclarations } from './lib/markdown-notes-render-plugin.mjs';

test('multiple notes stay separate at desktop/mobile/print and footnote returns reveal and focus tabs', async () => {
	const browser = await chromium.launch({ headless: true });
	try {
		const page = await browser.newPage();
		const source = `First paragraph[^margin:one] continues after its first marker[^margin:two].\n\nAdjacent paragraph[^margin:three].\n\n| Wide table | Value |\n| --- | --- |\n| Row | Value |\n\n[^margin:one]: ${'Long note content. '.repeat(20)}\n[^margin:two]: A second note.\n[^margin:three]: A third note.`;
		const html = (await markdownToHtml(source, { mdastPlugins: [nornaNotesRenderPlugin] })).html;
		const css = await readFile(new URL('../src/styles/content.css', import.meta.url), 'utf8');
		await page.setContent(`<style>${css}\n:root { --layout-reading-width: min(100%, 680px); --layout-inline-start-margin: 0; --layout-inline-end-margin: auto; --layout-note-width: 192px; --layout-note-gap: 20px; } body { margin: 24px; font-family: sans-serif; } .section-body { width: 100%; } @container (min-width: 912px) { .section-note-paragraph { ${marginNoteLayoutDeclarations} } }</style><main class="section-body"><div class="section-markdown">${html}</div></main>`);
		await mkdir('.local/review-captures/notes', { recursive: true });
		for (const width of [1440, 768, 375]) {
			await page.setViewportSize({ width, height: 900 });
			const boxes = await page.locator('.section-note, .section-note-paragraph > p, table').evaluateAll((nodes) => nodes.map((node) => {
				const rect = node.getBoundingClientRect();
				return { x: rect.x, y: rect.y, right: rect.right, bottom: rect.bottom };
			}));
			for (let left = 0; left < boxes.length; left += 1) for (let right = left + 1; right < boxes.length; right += 1) {
				const a = boxes[left], b = boxes[right];
				assert.ok(a.right <= b.x + 1 || b.right <= a.x + 1 || a.bottom <= b.y + 1 || b.bottom <= a.y + 1, `${width}: overlap ${left}/${right}`);
			}
			assert.ok(boxes.every((box) => box.x >= 0 && box.right <= width), `${width}: overflow`);
			assert.deepEqual(await page.locator('.section-note-ref').allTextContents(), ['a', 'b', 'c']);
			await page.screenshot({ path: `.local/review-captures/notes/${width}.png`, fullPage: true });
		}
		await page.setViewportSize({ width: 1440, height: 900 });
		await page.emulateMedia({ media: 'print' });
		assert.equal(await page.locator('.section-note-paragraph').first().evaluate((node) => getComputedStyle(node).gridTemplateColumns.split(' ').length), 1);
		await page.emulateMedia({ media: 'screen' });

		const notes = (await markdownToHtml('First[^shared]\n\nSecond[^hidden] repeated[^shared]\n\n[^shared]: Shared\n[^hidden]: Hidden', { mdastPlugins: [nornaNotesRenderPlugin] })).html;
		const paragraphs = [...notes.matchAll(/<p>[\s\S]*?<\/p>/g)].map((match) => match[0]);
		const footer = notes.slice(notes.indexOf('<section data-footnotes'));
		await page.setContent(`<div data-content-tabs><div data-tabs-controls hidden></div><div data-tab-panel><p data-tab-label>First</p>${paragraphs[0]}</div><div data-tab-panel><p data-tab-label>Second</p>${paragraphs[1]}</div></div>${footer}`);
		assert.equal(await page.locator('[data-tab-panel]:visible').count(), 2);
		const tabsSource = (await readFile(new URL('../src/components/ContentTabsScript.astro', import.meta.url), 'utf8')).match(/<script>([\s\S]*?)<\/script>/)[1]
			.replace(/^\s*import\s+\{\s*installNoteNavigation\s*\}\s+from\s+[^;]+;/m, '')
			.replace(/\binstallNoteNavigation\(\);/g, '');
		const navigationSource = await readFile(new URL('../src/lib/noteNavigation.ts', import.meta.url), 'utf8');
		await page.addScriptTag({ content: stripTypeScriptTypes(tabsSource) });
		await page.addScriptTag({ content: `${stripTypeScriptTypes(navigationSource).replace('export ', '')}\ninstallNoteNavigation();` });
		assert.equal(await page.locator('[data-tab-panel]:visible').count(), 1);
		const backref = page.locator('[data-footnote-backref]').filter({ hasText: '2' });
		const targetId = (await backref.getAttribute('href')).slice(1);
		await backref.click();
		assert.equal(await page.locator('[data-tab-panel]').nth(1).isVisible(), true);
		assert.equal(await page.evaluate(() => document.activeElement.id), targetId);
		await page.getByRole('tab', { name: 'First', exact: true }).click();
		await backref.click();
		assert.equal(await page.evaluate(() => document.activeElement.id), targetId);
		assert.equal(await page.locator('[data-tab-panel]').nth(1).isVisible(), true);
	} finally { await browser.close(); }
});
