import assert from 'node:assert/strict';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { test } from 'node:test';
import { parsePageMarkdownSource } from './lib/page-markdown.mjs';
import { createTempSite, runNorna } from './test-support/content-model.mjs';

test('CommonMark and GFM constructs survive a complete Norna build', async () => {
	const { root, siteDir } = await createTempSite({ underRepoCache: true });
	try {
		await writeFile(path.join(siteDir, 'site-config/settings.yaml'), 'url: https://example.com/docs/\n');
		await mkdir(path.join(siteDir, 'root/pages/010-guide'), { recursive: true });
		await writeFile(path.join(siteDir, 'root/pages/010-guide/content.md'), '# Guide\n\n## Intro\n\nA destination.\n');
		const source = [
			'Markdown audit',
			'==============',
			'',
			'First line',
			'stays in one paragraph.',
			'',
			'Underlined **section** {#underlined}',
			'-----------------------------------',
			'',
			'Hard break\\',
			'next line.',
			'',
			'---',
			'',
			'    Indented code',
			'',
			'> Quoted text',
			'>',
			'> > Nested quotation.',
			'',
			'- Parent',
			'    - Child',
			'- Next',
			'',
			'3. Third',
			'4. Fourth',
			'',
			'- Loose first',
			'',
			'  Second paragraph in the item.',
			'',
			'- Loose second',
			'',
			'> ### Quoted heading',
			'> Quoted detail.',
			'',
			'- List item with heading',
			'',
			'    ### List heading',
			'',
			'    More detail.',
			'',
			'### Top-level H3',
			'',
			'Its text.',
			'',
			'<h3 class="manual">HTML heading</h3>',
			'',
			'~~~text',
			'Fenced code',
			'~~~',
			'',
			'**Strong**, *emphasis*, ***both***, foo_bar_baz, ~~removed~~, `code`, `` `backtick` ``, \\*literal\\* and &amp;.',
			'',
			'[Inline](/guide/ "Guide title") and [Reference][guide].',
			'',
			'[guide]: /guide/ "Reference title"',
			'',
			'![Remote alt](https://example.com/image.png "Image title")',
			'',
			'![Reference alt][photo]',
			'',
			'[photo]: https://example.com/photo.png "Photo title"',
			'',
			'## GFM {#gfm}',
			'',
			'| Left | Right |',
			'| :--- | ---: |',
			'| A | 2 |',
			'',
			'- [x] Done',
			'- [ ] Pending',
			'',
			'Visit https://example.com/ or email hello@example.com.',
			'',
			'Angle <https://example.com/help> and <team@example.com>.',
			'',
			'A note.[^detail]',
			'',
			'[^detail]: Footnote detail.',
			'',
			'> [!NOTE]',
			'>',
			'> A Norna callout.',
			'',
			'<kbd>Ctrl</kbd> is plain HTML.',
			'',
			'Second underlined',
			'-----------------',
			'',
			'Final text.',
			'',
		].join('\n');
		await writeFile(path.join(siteDir, 'root/content.md'), source);

		const parsed = await parsePageMarkdownSource(source);
		assert.deepEqual(parsed.diagnostics.filter(({ severity }) => severity === 'error'), []);
		assert.deepEqual(parsed.sections.map(({ id }) => id), ['underlined', 'gfm', 'second-underlined']);
		assert.deepEqual(parsed.navigationHeadings.filter(({ depth }) => depth === 3).map(({ id }) => id), ['top-level-h3']);
		assert.equal(parsed.links.filter(({ target }) => target === '/guide/').length, 2);

		await runNorna(['--site-dir', siteDir, 'build']);
		const html = await readFile(path.join(root, 'dist/index.html'), 'utf8');
		const contains = (pattern) => assert.ok(pattern.test(html), `Missing rendered pattern: ${pattern}`);
		contains(/<h1[^>]*>Markdown audit<\/h1>/);
		contains(/<h2[^>]*id="underlined"[^>]*>Underlined <strong>section<\/strong><\/h2>/);
		contains(/<h2[^>]*id="second-underlined"[^>]*>Second underlined<\/h2>/);
		contains(/First line\s+stays in one paragraph/);
		contains(/Hard break<br\s*\/?>(?:\s*)next line/);
		contains(/<hr\s*\/?>(?:\s*)<pre/);
		contains(/<pre[^>]*><code[^>]*>[\s\S]{0,500}Indented code/);
		contains(/<blockquote>[\s\S]*<blockquote>[\s\S]*Nested quotation/);
		contains(/<li>Parent\s*<ul>\s*<li>Child<\/li>\s*<\/ul>\s*<\/li>/);
		contains(/<ol start="3">/);
		contains(/Second paragraph in the item/);
		contains(/<blockquote>[\s\S]*<h3 id="quoted-heading">Quoted heading<\/h3>/);
		contains(/<li>[\s\S]*<h3 id="list-heading">List heading<\/h3>/);
		contains(/<h3 id="top-level-h3">Top-level H3<\/h3>/);
		contains(/<h3 class="manual">HTML heading<\/h3>/);
		assert.ok(!/data-norna-page-heading/.test(html));
		contains(/Fenced code/);
		contains(/<strong>Strong<\/strong>/);
		contains(/<em>emphasis<\/em>/);
		contains(/<em><strong>both<\/strong><\/em>/);
		contains(/foo_bar_baz/);
		contains(/<del>removed<\/del>/);
		contains(/<code>`backtick`<\/code>/);
		contains(/\*literal\* and &amp;/);
		contains(/href="\/docs\/guide\/" title="Guide title"/);
		contains(/href="\/docs\/guide\/" title="Reference title"/);
		contains(/alt="Remote alt"/);
		contains(/alt="Reference alt"/);
		contains(/title="Image title"/);
		contains(/title="Photo title"/);
		contains(/<th[^>]*text-align: ?right/);
		contains(/type="checkbox"[^>]*checked/);
		contains(/href="https:\/\/example\.com\/"/);
		contains(/href="mailto:hello@example\.com"/);
		contains(/href="https:\/\/example\.com\/help"/);
		contains(/href="mailto:team@example\.com"/);
		contains(/<section data-footnotes/);
		contains(/class="norna-callout norna-callout-note"/);
		contains(/<kbd>Ctrl<\/kbd>/);
	} finally {
		await rm(root, { recursive: true, force: true });
	}
});

test('Norna reports constrained Markdown without treating it as another syntax dialect', async () => {
	const source = '# Page\n\n## Content\n\n![Local](photo.png)\n\n<details>\n<summary>More</summary>\n\n### Hidden\n\n</details>\n';
	const parsed = await parsePageMarkdownSource(source);
	assert.ok(parsed.diagnostics.some(({ code }) => code === 'heading-inside-details'));
	assert.deepEqual(parsed.markdownImages.map(({ target }) => target), ['photo.png']);
});
