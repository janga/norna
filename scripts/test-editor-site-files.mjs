import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, rm, stat, symlink, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { createEditorImageAppend, getEditorImageUsage, planEditorImageCopy, planEditorRemoval } from './lib/editor-site-files.mjs';

const block = (name) => `\n\`\`\`image-stack\nitems:\n  - image: ${name}\n    alt: Example\n\`\`\`\n`;
const fixture = async (t) => {
	const root = await mkdtemp(path.join(os.tmpdir(), 'norna-site-files-'));
	t.after(() => rm(root, { recursive: true, force: true }));
	const siteRoot = path.join(root, 'site');
	const write = async (relative, text) => {
		const filename = path.join(siteRoot, relative);
		await mkdir(path.dirname(filename), { recursive: true });
		await writeFile(filename, text);
		return filename;
	};
	await write('site-config/settings.yaml', 'url: https://example.com/\n');
	const home = await write('root/content.md', '# Home\n');
	const sourcePath = await write('root/pages/010-page/content.md', '# Page\n');
	const external = path.join(root, 'outside.svg');
	await writeFile(external, '<svg/>');
	return { root, siteRoot, home, sourcePath, external, write };
};

test('image copy plans choose the page-owned folder and never overwrite or rename formats', async (t) => {
	const f = await fixture(t);
	const options = { ...f, imagePath: f.external, filename: 'example.svg' };
	const planned = await planEditorImageCopy(options);
	assert.equal(planned.destination, path.join(path.dirname(f.sourcePath), 'images/example.svg'));
	assert.equal(await readFile(f.external, 'utf8'), '<svg/>');
	await assert.rejects(planEditorImageCopy({ ...options, filename: '../escape.svg' }), /filename/);
	await assert.rejects(planEditorImageCopy({ ...options, filename: 'example.png' }), /extension/);
	await assert.rejects(planEditorImageCopy({ ...options, replace: true }), /no longer exists/);
	await f.write('root/pages/010-page/images/example.svg', 'existing');
	await assert.rejects(planEditorImageCopy(options), /already has this name/);
	const replacement = await planEditorImageCopy({ ...options, replace: true });
	await writeFile(f.external, 'changed source');
	assert.notEqual((await planEditorImageCopy({ ...options, replace: true })).fingerprint, replacement.fingerprint);
});

test('file operations reject other sites, homepage deletion and symbolic links', async (t) => {
	const f = await fixture(t);
	await assert.rejects(planEditorRemoval({ ...f, sourcePath: f.home }), /homepage/);
	await assert.rejects(planEditorRemoval({ ...f, sourcePath: f.external }), /selected site/);
	await symlink(f.root, path.join(path.dirname(f.sourcePath), 'images'));
	await assert.rejects(planEditorImageCopy({ ...f, imagePath: f.external, filename: 'example.svg' }), /Symbolic links/);
	await assert.rejects(planEditorRemoval(f), /symbolic link/);
});

test('page removal includes descendants and owned files, and detects changed contents', async (t) => {
	const f = await fixture(t);
	await f.write('root/pages/010-page/pages/010-child/content.md', '# Child\n');
	await f.write('root/pages/010-page/tree-theme.yaml', 'layout:\n  textWidth: narrow\n');
	const plan = await planEditorRemoval(f);
	assert.equal(plan.pages, 2);
	assert.deepEqual(plan.files, ['content.md', 'pages/010-child/content.md', 'tree-theme.yaml']);
	await f.write('root/pages/010-page/pages/010-child/content.md', '# A changed child\n');
	assert.notEqual((await planEditorRemoval(f)).fingerprint, plan.fingerprint);
	assert.equal(await readFile(f.sourcePath, 'utf8'), '# Page\n', 'Planning does not delete anything.');
});

test('image usage observes local precedence, dirty buffers, literal examples and unresolved references', async (t) => {
	const f = await fixture(t);
	const imagePath = await f.write('root/pages/010-page/images/example.svg', '<svg/>');
	await f.write('root/images/example.svg', '<svg/>');
	await writeFile(f.home, '# Home\n' + block('example.svg'));
	const other = await f.write('root/pages/020-other/content.md', '# Other\n' + block('example.svg'));
	const source = '# Page\n' + block('example.svg') + '\n````md\n' + block('example.svg') + '````\n';
	const options = { ...f, imagePath, sources: new Map([[f.sourcePath, source]]) };
	const usage = await getEditorImageUsage(options);
	assert.deepEqual(usage.references.map(({ sourcePath, unresolved }) => [sourcePath, unresolved]), [[f.sourcePath, false], [other, true]]);
	assert.deepEqual(usage.incomplete, []);
	const caseInsensitive = await stat(path.join(path.dirname(imagePath), 'EXAMPLE.SVG')).then(() => true, () => false);
	const caseUsage = await getEditorImageUsage({ ...options, sources: new Map([[f.sourcePath, '# Page\n' + block('EXAMPLE.SVG')]]) });
	assert.equal(caseUsage.references.some((entry) => entry.sourcePath === f.sourcePath), caseInsensitive, 'Resolve case like the actual filesystem.');
	const plan = await planEditorRemoval(options);
	options.sources.set(f.sourcePath, '# Page\n');
	assert.notEqual((await planEditorRemoval(options)).fingerprint, plan.fingerprint);
	options.sources.set(f.sourcePath, '# Page\n\n```image-stack\nitems: [\n');
	assert.ok((await getEditorImageUsage(options)).incomplete.includes(f.sourcePath));
});

test('image insertion preserves existing LF/CRLF source and quotes user text safely', async () => {
	for (const eol of ['\n', '\r\n']) {
		const source = ['# Page', '', 'Dirty prose.', ''].join(eol);
		const edit = await createEditorImageAppend({ source, filename: 'example.svg', alt: 'A "quoted" image: yes', caption: 'åäö\nsecond line' });
		assert.equal(edit.start, source.length);
		assert.equal(edit.end, source.length);
		assert.equal(edit.text, ['', '```image-stack', 'items:', '  - image: example.svg', '    alt: "A \\"quoted\\" image: yes"', '    caption: "åäö\\nsecond line"', '```', ''].join(eol));
	}
	for (const source of ['# Page\n\n```image-stack\nitems: [\n', '---\npage: [\n', 'No page title\n']) {
		await assert.rejects(createEditorImageAppend({ source, filename: 'example.svg', alt: 'Example' }), /Repair this page/);
	}
	for (const source of ['# Page\n\n````md\nAn unfinished example.', '# Page\n\n<!-- unfinished comment']) {
		await assert.rejects(createEditorImageAppend({ source, filename: 'example.svg', alt: 'Example' }), /Close the open Markdown/);
	}
});
