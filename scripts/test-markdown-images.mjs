import assert from 'node:assert/strict';
import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { test } from 'node:test';
import { parseFragment } from 'parse5';
import { markdownToHtml } from 'satteri';
import { nornaMarkdownRenderPlugin } from './lib/norna-markdown-render-plugin.mjs';
import { parsePageMarkdownSource } from './lib/page-markdown.mjs';
import { planEditorResourceRename, getEditorResourceReferences } from './lib/editor-resource-actions.mjs';
import { getImageDefinitionContext } from './lib/editor-language-service.mjs';
import { createTempSite, fixtureSiteDir, runContentScript, runNorna } from './test-support/content-model.mjs';

const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 620"><rect width="900" height="620"/></svg>\n';

test('Markdown image discovery uses the complete AST and preserves editable CRLF destinations', async () => {
	const source = ['---', 'page:', '  description: Images', '---', '# Images', '',
		'![One](images/dog.svg "Title")', '![Two](./images/dog.svg)', '![Three](dog.svg)',
		'![Nested [brackets] and \\] escaped](<images/dog.svg> "Title")',
		'![`[`](images/dog.svg)', '![` ] `](images/dog.svg)',
		'![Four][dog]', '![dog][]', '![dog]', '[![Linked](images/dog.svg)](https://example.com/)',
		'`![Example](ignored.svg)`', '\\![Escaped](ignored.svg)', '<!-- ![Hidden](ignored.svg) -->',
		'', '    ![Indented](ignored.svg)', '', '```md', '![Fenced](ignored.svg)', '```',
		'', '## Definitions', '', '[dog]: ./images/dog.svg "Reference title"', '[dog]: ignored.svg',
		'', '![Remote](https://example.com/dog.svg)', '![Public](/_norna/shared/logo.svg)',
	].join('\r\n');
	const document = await parsePageMarkdownSource(source);
	assert.deepEqual(document.diagnostics, []);
	assert.equal(document.managedImages.length, 10);
	assert.ok(document.managedImages.every(image => image.image === 'dog.svg'));
	assert.ok(document.markdownImages.every(image => image.targetRange && source.slice(image.targetRange.start, image.targetRange.end) === image.targetSource));
	assert.equal(document.markdownImages[6].title, 'Reference title');
	assert.equal(document.markdownImages[0].line, 7);
	const { html } = await markdownToHtml(source, { features: { frontmatter: true, gfm: true }, mdastPlugins: [nornaMarkdownRenderPlugin] });
	assert.equal((html.match(/data-norna-managed-image="dog.svg"/g) ?? []).length, 10);
	assert.match(html, /title="Reference title"/);
});

test('local image paths cannot escape ownership or bypass existing filename and format rules', async () => {
	for (const target of ['../images/dog.svg', 'images/nested/dog.svg', 'other/dog.svg', './dog.svg', 'images/../dog.svg', 'images/dog.webp', 'dog_name.svg', 'images/%2e%2e%2fdog.svg', 'images/dog.svg?x=1']) {
		const document = await parsePageMarkdownSource(`# Images\n\n![Dog](${target})\n`);
		assert.equal(document.managedImages.length, 0, target);
		assert.equal(document.diagnostics[0].code, 'invalid-markdown-image', target);
	}
});

test('usage and rename cover mixed image forms without editing examples or another page', async t => {
	const { root, siteDir } = await createTempSite();
	t.after(() => rm(root, { recursive: true, force: true }));
	await mkdir(path.join(siteDir, 'root/images'), { recursive: true });
	const filePath = path.join(siteDir, 'root/images/dog.svg');
	await writeFile(filePath, svg);
	const sourcePath = path.join(siteDir, 'root/content.md');
	await writeFile(sourcePath, '# Images\n');
	await mkdir(path.join(siteDir, 'root/pages/other'), { recursive: true });
	await writeFile(path.join(siteDir, 'root/pages/other/content.md'), '# Other\n\n![Missing local dog](dog.svg)\n');
	const source = ['# Images', '', '![One](images/dog.svg)', '![Two](./images/dog.svg)', '![Three](dog.svg)',
		'![Four][dog]', '![dog][]', '![dog]', '', '[dog]: images/dog.svg "Keep title"', '',
		'```image-stack', 'items:', '  - image: dog.svg # Keep comment', '```', '',
		'`![Example](images/dog.svg)`', '', '```md', '![Example](images/dog.svg)', '```', '',
	].join('\r\n');
	const sources = new Map([[sourcePath, source]]);
	const usage = await getEditorResourceReferences({ siteRoot: siteDir, filePath, sources });
	assert.equal(usage.references.length, 7);
	assert.ok(usage.references.every(ref => ref.sourcePath === sourcePath && !ref.unresolved));
	const plan = await planEditorResourceRename({ siteRoot: siteDir, filePath, sources, name: 'renamed.svg' });
	assert.equal(plan.changes.length, 1);
	const updated = plan.changes[0].updated;
	assert.equal((updated.match(/renamed.svg/g) ?? []).length, 5, 'One shared definition is edited once');
	assert.match(updated, /!\[Two\]\(\.\/images\/renamed.svg\)/);
	assert.match(updated, /\[dog\]: images\/renamed.svg "Keep title"/);
	assert.match(updated, /image: "renamed.svg" # Keep comment/);
	assert.equal((updated.match(/!\[Example\]\(images\/dog.svg\)/g) ?? []).length, 2);
	assert.equal(updated.replaceAll('\r\n', '').includes('\n'), false);
	assert.equal(await readFile(sourcePath, 'utf8'), '# Images\n');
	for (const marker of ['images/dog.svg)', './images/dog.svg)', '](dog.svg)', '![Four]', 'images/dog.svg "Keep']) {
		const offset = source.indexOf(marker) + 3;
		const before = source.slice(0, offset).split('\n');
		const definition = await getImageDefinitionContext({ documentPath: sourcePath, source, line: before.length - 1, character: before.at(-1).length });
		assert.deepEqual(definition.files, [filePath], marker);
	}
});

test('page movement preserves all local image forms and moves their owned source files', async t => {
	const { root, siteDir } = await createTempSite();
	t.after(() => rm(root, { recursive: true, force: true }));
	await writeFile(path.join(siteDir, 'root/content.md'), '# Home\n');
	const directory = path.join(siteDir, 'root/pages/old');
	await mkdir(path.join(directory, 'images'), { recursive: true });
	await writeFile(path.join(directory, 'images/dog.svg'), svg);
	const references = '![One](images/dog.svg)\n\n![Two](./images/dog.svg)\n\n![Three](dog.svg)\n\n![Four][dog]\n\n[dog]: images/dog.svg "Keep title"\n';
	await writeFile(path.join(directory, 'content.md'), '# Page\n\n' + references);
	await runNorna(['--site-dir', siteDir, 'page:move', '/old/', '/new/', '--write']);
	assert.ok((await readFile(path.join(siteDir, 'root/pages/new/content.md'), 'utf8')).includes(references));
	assert.equal(await readFile(path.join(siteDir, 'root/pages/new/images/dog.svg'), 'utf8'), svg);
	await runNorna(['--site-dir', siteDir, 'images']);
	const manifest = JSON.parse(await readFile(path.join(siteDir, '.norna/generated-images.json'), 'utf8'));
	assert.equal(manifest['root/pages/new/images/dog.svg'].kind, 'static');
	assert.equal(manifest['root/pages/old/images/dog.svg'], undefined);
});

test('a complete build manages local Markdown images and preserves each rendering context', async t => {
	const { root, siteDir } = await createTempSite({ underRepoCache: true });
	t.after(() => rm(root, { recursive: true, force: true }));
	await writeFile(path.join(siteDir, 'site-config/settings.yaml'), 'sourceFormat: 2\nurl: https://example.com/docs/\n');
	await mkdir(path.join(siteDir, 'root/images'), { recursive: true });
	await writeFile(path.join(siteDir, 'root/images/dog.svg'), svg);
	await cp(path.join(fixtureSiteDir, 'root/images/image.jpg'), path.join(siteDir, 'root/images/photo.jpg'));
	await writeFile(path.join(siteDir, 'root/content.md'), ['# Images', '',
		'![Standalone](images/dog.svg "A title, not a caption")', '',
		'Before ![Inline](dog.svg "Inline title") after.', '',
		'[![Linked](images/dog.svg)](https://example.com/destination/ "Link title")', '',
		'> ![Quoted](./images/dog.svg)', '',
		'- ![List](images/dog.svg)', '- Text ![List inline](images/dog.svg) after.', '- [![List link](dog.svg)](https://example.com/list/ "List title")', '',
		'![First](images/dog.svg) ![Second](images/dog.svg)', '',
		'![Raster][photo]', '', '[photo]: images/photo.jpg "Photo title"', '',
		'## Heading ![Heading image][photo]', '',
		'<details>', '<summary>More</summary>', '', '![Details](dog.svg)', '', '</details>', '',
		'![Remote](https://example.com/remote.svg)', '', '![Public](/_norna/shared/logo.svg)', '',
	].join('\n'));
	await mkdir(path.join(siteDir, 'public'), { recursive: true });
	await writeFile(path.join(siteDir, 'public/logo.svg'), svg);
	await runNorna(['--site-dir', siteDir, 'build']);
	const manifest = JSON.parse(await readFile(path.join(siteDir, '.norna/generated-images.json'), 'utf8'));
	assert.equal(manifest['root/images/dog.svg'].kind, 'static');
	assert.ok(manifest['root/images/photo.jpg'].variants.length > 1);
	const html = await readFile(path.join(root, 'dist/index.html'), 'utf8');
	const tree = parseFragment(html);
	const elements = [];
	const visit = (node, ancestors = []) => { if (node.tagName) elements.push({ node, ancestors }); for (const child of node.childNodes ?? []) visit(child, [...ancestors, node]); };
	visit(tree);
	const attr = (node, name) => node.attrs?.find(attr => attr.name === name)?.value;
	const image = alt => elements.find(({ node }) => node.tagName === 'img' && attr(node, 'alt') === alt);
	for (const alt of ['Standalone', 'Inline', 'Linked', 'Quoted', 'List', 'List inline', 'First', 'Second', 'Details']) {
		assert.match(attr(image(alt).node, 'src'), /^\/docs\/_norna\/images\/original\//, alt);
	}
	assert.match(attr(image('Raster').node, 'srcset'), /\/docs\/_norna\/images\/generated\//);
	assert.match(attr(image('Heading image').node, 'srcset'), /\/docs\/_norna\/images\/generated\//);
	assert.equal(attr(image('Standalone').node, 'title'), 'A title, not a caption');
	assert.ok(image('Standalone').ancestors.some(node => attr(node, 'data-image-inspection-trigger') !== undefined));
	assert.equal(attr(image('Linked').ancestors.findLast(node => node.tagName === 'a'), 'href'), 'https://example.com/destination/');
	assert.equal(attr(image('Linked').ancestors.findLast(node => node.tagName === 'a'), 'title'), 'Link title');
	assert.equal(attr(image('List link').ancestors.findLast(node => node.tagName === 'a'), 'title'), 'List title');
	assert.ok(!image('List link').ancestors.some(node => attr(node, 'data-image-inspection-trigger') !== undefined));
	assert.ok(!image('Linked').ancestors.some(node => attr(node, 'data-image-inspection-trigger') !== undefined));
	for (const alt of ['Inline', 'List inline', 'First', 'Second']) assert.ok(!image(alt).ancestors.some(node => node.tagName === 'figure' || node.tagName === 'a'), alt);
	assert.ok(image('Quoted').ancestors.some(node => node.tagName === 'blockquote'));
	assert.ok(image('List').ancestors.some(node => node.tagName === 'li'));
	assert.ok(image('Details').ancestors.some(node => node.tagName === 'details'));
	assert.equal(elements.filter(({ node }) => node.tagName === 'figcaption').length, 0);
	assert.ok(!elements.some(({ node, ancestors }) => node.tagName === 'a' && ancestors.some(parent => parent.tagName === 'a')));
	assert.equal(attr(image('Remote').node, 'src'), 'https://example.com/remote.svg');
	assert.equal(attr(image('Public').node, 'src'), '/docs/_norna/shared/logo.svg');
	assert.doesNotMatch(html, /data-norna-managed-image=/);
	await mkdir(path.join(siteDir, 'root/pages/missing'), { recursive: true });
	await writeFile(path.join(siteDir, 'root/pages/missing/content.md'), '# Missing\n\n![Missing](images/dog.svg)\n');
	await assert.rejects(runContentScript(siteDir, ['--check']), error => /dog.svg/.test(error.output) && /still referenced/.test(error.output));
	await assert.rejects(runNorna(['--site-dir', siteDir, 'images']), error => /Image file does not exist:.*pages\/missing\/images\/dog.svg/.test(error.output) && !/\n\s+at /.test(error.output));
});
