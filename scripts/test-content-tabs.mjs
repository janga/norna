import assert from 'node:assert/strict';
import { test } from 'node:test';
import { cp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { gunzipSync } from 'node:zlib';
import { markdownToHtml } from 'satteri';
import { parseContentTabs, prepareContentTabs, groupRenderedTabs } from './lib/content-tabs.mjs';
import { parsePageMarkdown } from './lib/page-markdown.mjs';
import { createTempSite, runNorna, runContentScript } from './test-support/content-model.mjs';

const tabs = (first = 'First option.', second = 'Second option.') => `:::: tabs\n\n::: tab "macOS"\n${first}\n:::\n\n::: tab "Windows"\n${second}\n:::\n\n::::`;
const page = (body) => `# Installation\n\n## Install\n\n${body}\n\n## Verify\n\nDone.\n`;

test('tabs retain links, images, notes, code and navigation in the shared page model', async () => {
	const source = page(tabs('::: info\nUseful context.\n:::\n\n~~~sh\necho ":::\\n# Literal heading"\n~~~\n\nSee [verification](#verify).{note-ref}\n\n{note: This explains the first option.}', '~~~image-stack\n- image: example.svg\n~~~'));
	const model = await parsePageMarkdown(source);
	assert.deepEqual(model.diagnostics, []);
	assert.deepEqual(model.navigationHeadings.map((h) => h.title), ['Install', 'Verify']);
	assert.equal(model.notes.length, 1);
	assert.equal(model.managedImages[0].image, 'example.svg');
	assert.ok(model.links.some((link) => source.slice(link.targetRange.start, link.targetRange.end) === '#verify'));
	assert.equal(model.sections[0].tabGroups.length, 1);
	const rendered = await markdownToHtml(prepareContentTabs(source, { labels: { note: 'Note' } }));
	assert.match(rendered.html, /norna-callout-note/);
	assert.match(rendered.html, /language-sh/);
	assert.doesNotMatch(rendered.html, /hidden/);
	const blocks = groupRenderedTabs([{ type: 'html', html: rendered.html }], model.tabGroups);
	const group = blocks.find((block) => block.type === 'tabs');
	assert.deepEqual(group.panels.map((p) => p.label), ['macOS', 'Windows']);
	assert.match(group.panels[0].contentBlocks[0].html, /Useful context/);
	assert.match(group.panels[1].contentBlocks[0].html, /example.svg/);
	for (const block of [...blocks, ...group.panels.flatMap((panel) => panel.contentBlocks)]) {
		if (block.type === 'html') assert.equal([...block.html.matchAll(/<p(?:\s[^>]*)?>/g)].length, [...block.html.matchAll(/<\/p>/g)].length, block.html);
	}
});

test('multiple independent groups accept translated and escaped labels', () => {
	const source = page(`${tabs()}\n\n${tabs().replace('"macOS"', '"F\\\"or macOS"').replace('"Windows"', '"F\u00f6r Windows"')}`);
	const parsed = parseContentTabs(source);
	assert.deepEqual(parsed.diagnostics, []);
	assert.equal(parsed.groups.length, 2);
	assert.equal(parsed.groups[1].panels[0].label, 'F"or macOS');
});

test('a sidenote and its reference cannot cross alternative boundaries', async () => {
	const model = await parsePageMarkdown(page(tabs('Read this.{note-ref}', '{note: This belongs in another tab.}')));
	assert.ok(model.diagnostics.some((issue) => issue.code === 'invalid-inline-note'));
});

for (const [name, body, message] of [
	['one alternative', ':::: tabs\n::: tab "Only"\nHello\n:::\n::::', /at least two/],
	['duplicate label', tabs().replace('"Windows"', '"macOS"'), /Duplicate tab label/],
	['empty label', tabs().replace('"Windows"', '""'), /nonempty quoted label/],
	['public ID', tabs().replace('"Windows"', 'windows "Windows"'), /nonempty quoted label/],
	['empty panel', tabs('', 'Text'), /cannot be empty/],
	['comment-only panel', tabs('<!-- invisible -->'), /cannot be empty/],
	['nested tabs', tabs(tabs()), /cannot be nested/],
	['ATX heading', tabs('### Prerequisites'), /cannot contain headings/],
	['setext heading', tabs('Prerequisites\n---'), /cannot contain headings/],
	['HTML heading', tabs('<h4>Hidden heading</h4>'), /cannot contain headings/],
	['frontmatter', tabs('---\npage:\n  description: Wrong scope\n---'), /Frontmatter belongs/],
	['unclosed group', tabs().slice(0, -4), /unclosed/],
	['missing panel close', tabs().replace('First option.\n:::', 'First option.'), /Close the preceding tab/],
	['text outside panel', tabs().replace(':::: tabs', ':::: tabs\nOutside'), /inside a labelled tab/],
	['wrong group fence', tabs().replace(':::: tabs', '::: tabs'), /Open a tab group/],
	['nested in blockquote', '> :::: tabs\n> ::: tab "A"\n> Text\n> :::', /outside lists and blockquotes/],
	['unknown marker', tabs('::: unsupported\nText\n:::'), /Unknown or misplaced/],
	['nested in container', `::: warning\n\n${tabs()}\n\n:::`, /outside other containers/],
	['extra closing marker', `${tabs()}\n::::`, /no open tab group/],
]) test(`tabs reject ${name} with source context`, () => {
	const errors = parseContentTabs(page(body), { label: 'site/pages/010-install/content.md', lineOffset: 4 }).diagnostics;
	assert.ok(errors.some((e) => message.test(e.message)), JSON.stringify(errors));
	assert.ok(errors.every((e) => e.message.includes('site/pages/010-install/content.md') && e.message.includes('section "Install"')));
	assert.throws(() => prepareContentTabs(page(body)), /./);
});

test('literal fences and headings in code examples do not declare tabs', () => {
	const source = page(`\`\`\`\`markdown\n${tabs('~~~sh\n# Heading\n~~~')}\n\`\`\`\``);
	assert.deepEqual(parseContentTabs(source).groups, []);
	assert.equal(prepareContentTabs(source), source);
});

test('tabs build with assets, index every alternative, and report invalid content through the CLI', async () => {
	const { root, siteDir } = await createTempSite({ underRepoCache: true });
	try {
		await cp(path.resolve('fixtures/content-tabs/site'), siteDir, { recursive: true, filter: (source) => !source.split(path.sep).includes('.norna') });
		await writeFile(path.join(siteDir, 'config.yaml'), 'url: https://example.com/docs/\nsearch: true\n');
		await mkdir(path.join(siteDir, 'pages', '010-plain'), { recursive: true });
		await writeFile(path.join(siteDir, 'pages', '010-plain', 'content.md'), '# Plain page\n\nOrdinary prose.\n');
		await runContentScript(siteDir, ['--check']);
		await runNorna(['build'], { cwd: root, env: { ...process.env, NORNA_SITE_DIR: siteDir } });
		const html = await readFile(path.join(root, 'dist', 'index.html'), 'utf8');
		assert.equal([...html.matchAll(/class="content-tab-panel"/g)].length, 5);
		assert.match(html, /src="\/docs\/images\//);
		assert.match(html, /role="group" aria-labelledby="norna-tabs-label-/);
		assert.match(html, /norna-callout-note/);
		assert.doesNotMatch(html, /data-norna-tabs-marker|:::: tabs/);
		const readScripts = async (markup) => Promise.all([...markup.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)].map((match) => {
			const src = match[1].match(/\bsrc="([^"]+)"/)?.[1];
			return src ? readFile(path.join(root, 'dist', src.replace(/^\/docs\//, '')), 'utf8') : match[2];
		}));
		assert.ok((await readScripts(html)).some((source) => source.includes('data-content-tabs')));
		const plain = await readFile(path.join(root, 'dist', 'plain', 'index.html'), 'utf8');
		assert.ok((await readScripts(plain)).every((source) => !source.includes('data-content-tabs')));
		const fragmentDir = path.join(root, 'dist', 'pagefind', 'fragment');
		const documents = await Promise.all((await readdir(fragmentDir)).filter((name) => name.endsWith('.pf_fragment')).map(async (name) => {
			const text = gunzipSync(await readFile(path.join(fragmentDir, name))).toString();
			return JSON.parse(text.slice(text.indexOf('{')));
		}));
		const indexed = documents.map((document) => document.content).join('\n');
		for (const content of ['brew install', 'winget install', 'Not applicable']) assert.ok(indexed.includes(content), content);
		await writeFile(path.join(siteDir, 'pages', '000-home', 'content.md'), page(tabs('[Broken](/missing/)')));
		await assert.rejects(() => runContentScript(siteDir, ['--check']), (error) => /missing/.test(error.output));
		await writeFile(path.join(siteDir, 'pages', '000-home', 'content.md'), page(tabs('### Hidden heading')));
		await assert.rejects(() => runContentScript(siteDir, ['--check']), (error) => /Tabs cannot contain headings/.test(error.output));
	} finally { await rm(root, { recursive: true, force: true }); }
});
