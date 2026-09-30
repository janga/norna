import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createRequire } from 'node:module';
import { chromium } from '@playwright/test';

const { attachmentFormHtml } = createRequire(import.meta.url)('../attachment-form.cjs');

test('attachment validation preserves focus on text, select, checkbox and reorder controls', async t => {
 const browser = await chromium.launch();
 t.after(() => browser.close());
 const page = await browser.newPage();
 const errors = [];
 page.on('pageerror', error => errors.push(error.message));
 await page.evaluate(() => {
  window.messages = [];
  window.acquireVsCodeApi = () => ({ postMessage: message => window.messages.push(message) });
 });
 await page.setContent(attachmentFormHtml({ title: 'Guide', placement: 'At cursor in Guide', rows: [1, 2].map(id => ({
  id, sourceName: `file-${id}.txt`, filename: `file-${id}.txt`, text: `File ${id}`,
  action: 'insert', existing: { size: 1, modified: 0, type: 'TXT' },
  sourceInfo: { size: 2, modified: 0, type: 'TXT' },
 })) }, 'test'));
 const reply = () => page.evaluate(() => window.dispatchEvent(new MessageEvent('message', {
  data: { request: window.messages.at(-1).request, blocked: false },
 })));
 const focused = async selector => assert.equal(await page.locator(selector).evaluate(el => el === document.activeElement), true, selector);
 await reply();
 const first = 'article[data-id="1"]';
 await page.locator(`${first} .text`).fill('A descriptive link');
 await page.locator(`${first} .text`).evaluate(el => el.setSelectionRange(2, 7));
 await reply();
 await focused(`${first} .text`);
 assert.deepEqual(await page.locator(`${first} .text`).evaluate(el => [el.selectionStart, el.selectionEnd]), [2, 7]);
 await page.locator(`${first} .action`).focus();
 await page.locator(`${first} .action`).selectOption('import');
 await reply();
 await focused(`${first} .action`);
 await page.locator(`${first} .action`).selectOption('insert');
 await reply();
 await page.locator(`${first} .replace`).check();
 await reply();
 await focused(`${first} .replace`);
 await page.locator(`${first} .down`).click();
 await reply();
 await focused(`${first} .down`);
 assert.deepEqual(await page.locator('article').evaluateAll(els => els.map(el => el.dataset.id)), ['2', '1']);
 await page.locator('#apply').click();
 assert.deepEqual(await page.evaluate(() => window.messages.at(-1).rows.map(row => row.id)), [2, 1]);
 assert.deepEqual(errors, []);
});
