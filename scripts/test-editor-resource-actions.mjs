import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, rm, writeFile, symlink } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { planEditorResourceRename, planEditorPublicCreation, planEditorFolderRemoval, getEditorResourceReferences, getEditorResourceAddress } from './lib/editor-resource-actions.mjs';
import { readSiteFileTree } from './lib/editor-site-tree.mjs';
import { readEditorLinkState } from './lib/editor-site-links.mjs';

const fixture = async t => {
	const siteRoot = await mkdtemp(path.join(os.tmpdir(), 'norna-resource-actions-'));
	t.after(() => rm(siteRoot, { recursive: true, force: true }));
	const write = async (relative, text) => { const filename = path.join(siteRoot, relative); await mkdir(path.dirname(filename), { recursive: true }); await writeFile(filename, text); return filename; };
	await write('site-config/settings.yaml', 'sourceFormat: 2\nurl: https://example.com/manual/\n');
	await write('root/tree-theme.yaml', 'preset: documentation\n');
	const home = await write('root/content.md', '# Home\n');
	const page = await write('root/pages/guide/content.md', '# Guide\n');
	return { siteRoot, home, page, write };
};
const stack = filename => '```image-stack\nitems:\n  - image: ' + filename + '\n    alt: An image\n```\n';

test('image rename updates only managed scalar references, preserving CRLF, comments and dirty source', async t => {
	const { siteRoot, home, page, write } = await fixture(t);
	const filePath = await write('root/images/picture.png', 'Image bytes');
	await write('root/pages/guide/images/picture.png', 'Different image');
	await writeFile(page, '# Guide\n\n' + stack('picture.png'));
	const dirty = ('# Home\n\nMention picture.png in prose.\n\n' + stack('picture.png') + '\n## More\n\n' + stack('"picture.png" # keep comment')).replaceAll('\n', '\r\n');
	const options = { siteRoot, filePath, name: 'renamed.png', sources: new Map([[home, dirty]]) };
	const plan = await planEditorResourceRename(options);
	assert.equal(plan.changes.length, 1);
	assert.equal(plan.changes[0].sourcePath, home);
	assert.equal(plan.changes[0].original, dirty);
	assert.equal(plan.changes[0].updated, dirty.replaceAll('image: picture.png', 'image: "renamed.png"').replaceAll('image: "picture.png"', 'image: "renamed.png"'));
	assert.equal(await readFile(home, 'utf8'), '# Home\n', 'Planning never saves dirty buffers.');
	assert.equal(await readFile(filePath, 'utf8'), 'Image bytes');
	await assert.rejects(planEditorResourceRename({ ...options, name: 'renamed.jpg' }), /extension/);
	await assert.rejects(planEditorResourceRename({ ...options, name: '../escaped.png' }), /filename/);
	await write('root/images/RENAMED.png', 'collision');
	await assert.rejects(planEditorResourceRename(options), /already in use/);
});

test('image rename ignores another owner’s missing file and refuses incomplete local analysis', async t => {
	const { siteRoot, home, page, write } = await fixture(t);
	const filePath = await write('root/images/picture.png', 'Image bytes');
	await writeFile(page, '# Guide\n\n' + stack('picture.png'));
	assert.equal((await planEditorResourceRename({ siteRoot, filePath, name: 'new.png' })).changes.length, 0);
	await writeFile(page, '# Guide\n');
	await writeFile(home, '# Home\n\n```image-stack\nbad: true\n```\n');
	await assert.rejects(planEditorResourceRename({ siteRoot, filePath, name: 'new.png' }), /References could not be resolved/);
});

test('public rename/move rewrites Markdown and card links, definitions, suffixes and nested folders', async t => {
	const { siteRoot, home, page, write } = await fixture(t);
	const filePath = await write('public/images/files/guide.svg', 'PDF');
	await write('public/images/files/nested/check.svg', 'Text');
	await write('public/images/other/stay.svg', 'Other');
	await writeFile(home, '# Home\n\n[PDF](/_norna/shared/images/files/guide.svg?q=1#page=2)\n\n[Again][pdf]\n\n[pdf]: /_norna/shared/images/files/guide.svg\n');
	await writeFile(page, '# Guide\n\n```card-list\nitems:\n  - title: Read\n    text: Read the PDF\n    link: ../_norna/shared/images/files/guide.svg\n```\n');
	const usage = await getEditorResourceReferences({ siteRoot, filePath });
	assert.equal(usage.references.length, 3);
	const plan = await planEditorResourceRename({ siteRoot, filePath: path.dirname(filePath), name: 'documents', destinationDirectory: path.join(siteRoot, 'public/images/other') });
	assert.equal(plan.changes.length, 2);
	assert.match(plan.changes.find(change => change.sourcePath === home).updated, /\/_norna\/shared\/images\/other\/documents\/guide.svg\?q=1#page=2/);
	assert.match(plan.changes.find(change => change.sourcePath === home).updated, /\[pdf\]: \/_norna\/shared\/images\/other\/documents\/guide.svg/);
	assert.match(plan.changes.find(change => change.sourcePath === page).updated, /link: \/_norna\/shared\/images\/other\/documents\/guide.svg/);
	assert.equal(await getEditorResourceAddress({ siteRoot, filePath }), 'https://example.com/manual/_norna/shared/images/files/guide.svg');
	await assert.rejects(planEditorResourceRename({ siteRoot, filePath: path.join(siteRoot, 'public'), name: 'other' }), /fixed name/);
	await assert.rejects(planEditorResourceRename({ siteRoot, filePath: path.dirname(filePath), name: 'nested', destinationDirectory: path.dirname(filePath) }), /inside itself/);
	await assert.rejects(planEditorResourceRename({ siteRoot, filePath, name: 'guide.svg', destinationDirectory: path.join(siteRoot, 'root') }), /inside public/);
});

test('copied same-site URLs participate in public file moves without guessing other destinations', async t => {
	const { siteRoot, page, write } = await fixture(t);
	const filePath = await write('public/images/created-here/note.svg', 'Original bytes');
	await write('public/images/destination/keep.svg', 'Keep destination');
	const copied = await getEditorResourceAddress({ siteRoot, filePath });
	const untouched = [
		'[Relative](manual/created-here/note.svg)',
		'[Other site](https://other.example/manual/created-here/note.svg)',
		'[Outside base](https://example.com/created-here/note.svg)',
		'[Similar base](https://example.com/manual-copy/created-here/note.svg)',
	];
	const source = ['# Guide', '', `[Copied](${copied}?view=1#part "Keep title")`,
		'[First][note]', '[Second][note]', '', `[note]: ${copied} "Definition title"`,
		...untouched, '', 'Unsaved prose.', ''].join('\r\n');
	const options = { siteRoot, sources: new Map([[page, source]]) };
	const state = await readEditorLinkState(options);
	assert.equal(state.graph.diagnostics.length, 1, 'The incorrectly relative link remains a missing target');
	assert.equal(state.graph.diagnostics[0].reference.target.pathname, '/guide/manual/created-here/note.svg');
	assert.equal((await getEditorResourceReferences({ ...options, filePath })).references.length, 3);
	const plan = await planEditorResourceRename({ ...options, filePath, name: 'renamed note.svg', destinationDirectory: path.join(siteRoot, 'public/images/destination') });
	assert.equal(plan.changes.length, 1);
	const updated = plan.changes[0].updated;
	assert.ok(updated.includes('[Copied](https://example.com/manual/_norna/shared/images/destination/renamed%20note.svg?view=1#part "Keep title")'));
	assert.ok(updated.includes('[note]: https://example.com/manual/_norna/shared/images/destination/renamed%20note.svg "Definition title"'));
	assert.equal((updated.match(/renamed%20note.svg/g) ?? []).length, 2, 'Definition is edited only once');
	for (const line of untouched) assert.ok(updated.includes(line));
	assert.ok(updated.endsWith('\r\nUnsaved prose.\r\n'));
	assert.equal(updated.replaceAll('\r\n', '').includes('\n'), false);
	assert.equal(await readFile(page, 'utf8'), '# Guide\n', 'Planning does not save dirty buffers');
});

test('public creation checks generated paths, page and alias output, conventions and physical collisions', async t => {
	const { siteRoot, home, write } = await fixture(t);
	await write('site-config/settings.yaml', 'sourceFormat: 2\nurl: https://example.com/manual/\nsearch: true\n');
	const directory = path.join(siteRoot, 'public');
	const create = (name, rest = {}) => planEditorPublicCreation({ siteRoot, directory, name, ...rest });
	for (const name of ['sitemap.xml', 'SITEMAP.XML', '404.html', 'pagefind', 'index.html', 'guide']) await assert.rejects(create(name), /conflict|supported public/);
	await assert.rejects(create('guide', { folder: true, directory: siteRoot }), /inside public/);
	await writeFile(home, '---\npage:\n  aliases: [/old/]\n---\n# Home\n');
	await assert.rejects(create('old'), /conflict|supported public/);
	await write('public/logo.svg', '<svg/>');
	await assert.rejects(create('logo.png'), /one navigation logo/);
	await assert.rejects(create('LOGO.SVG'), /already in use/);
	await assert.rejects(create('favicon.jpeg'), /supported public file/);
	assert.equal((await create('robots.txt')).destination, path.join(directory, 'robots.txt'));
	assert.equal((await create('.well-known', { folder: true })).folder, true);
	await symlink(path.join(siteRoot, 'root'), path.join(directory, 'shortcut'));
	await assert.rejects(create('file.txt', { directory: path.join(directory, 'shortcut') }), /Symbolic/);
});

test('optional folder removal composes child policy and incoming references; required folders stay protected', async t => {
	const { siteRoot, home, page, write } = await fixture(t);
	await writeFile(home, '# Home\n\n[Guide](/guide/)\n\n[Public](/robots.txt)\n');
	await writeFile(page, '# Guide\n\n' + stack('image.png'));
	await write('root/pages/guide/images/image.png', 'Image');
	await write('public/robots.txt', 'Text');
	const pages = await planEditorFolderRemoval({ siteRoot, directory: path.join(siteRoot, 'root/pages') });
	assert.equal(pages.pages, 1); assert.equal(pages.files, 2); assert.equal(pages.usage.references.length, 1);
	const images = await planEditorFolderRemoval({ siteRoot, directory: path.join(path.dirname(page), 'images') });
	assert.equal(images.usage.references.length, 1);
	const publicPlan = await planEditorFolderRemoval({ siteRoot, directory: path.join(siteRoot, 'public') });
	assert.equal(publicPlan.files, 1); assert.equal(publicPlan.usage.references.length, 1);
	for (const directory of [siteRoot, path.join(siteRoot, 'root'), path.join(siteRoot, 'site-config')]) await assert.rejects(planEditorFolderRemoval({ siteRoot, directory }), /Only optional/);
	await write('root/pages/guide/images/unexpected.txt', 'Not an image');
	await assert.rejects(planEditorFolderRemoval({ siteRoot, directory: path.join(path.dirname(page), 'images') }), /Choose an image/);
});

test('role action matrix follows physical ownership, singleton absence and damaged homepage', async t => {
	const { siteRoot, home, write } = await fixture(t);
	await write('public/robots.txt', 'Text');
	await write('root/images/example.png', 'Image');
	const tree = await readSiteFileTree({ siteRoot });
	const row = relative => tree.items.find(item => item.sourcePath === path.join(siteRoot, relative));
	assert.deepEqual(row('root/pages').actions, ['addPage', 'deleteFolder']);
	assert.deepEqual(row('root/images').actions, ['addImages', 'deleteFolder']);
	assert.ok(row('root/content.md').actions.includes('add_page_theme_yaml'));
	assert.ok(!row('root/content.md').actions.includes('add_tree_theme_yaml'));
	assert.ok(!row('root/content.md').actions.includes('deletePage'));
	assert.ok(row('root/pages/guide/content.md').actions.includes('deletePage'));
	assert.deepEqual(row('root/tree-theme.yaml').actions, []);
	assert.ok(row('public/robots.txt').actions.includes('renameResource'));
	assert.ok(!row('public').actions.includes('renameResource'));
	await rm(home);
	await rm(path.join(siteRoot, 'site-config/settings.yaml'));
	const damaged = await readSiteFileTree({ siteRoot });
	assert.ok(damaged.items.find(item => item.isHome).actions.includes('add_content_md'));
	assert.ok(damaged.items.find(item => item.role === 'configuration').actions.includes('add_settings_yaml'));
	assert.equal((await planEditorPublicCreation({ siteRoot, name: 'llms.txt' })).destination, path.join(siteRoot, 'public/llms.txt'));
});
