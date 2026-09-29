import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, readdir, rename, rm, symlink, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createSiteNode, editSiteNodeInformation, getSiteNodeInformation, planSiteNodeCreation, readSiteFileTree, readSiteTree } from './lib/editor-site-tree.mjs';

const root = await mkdtemp(path.join(os.tmpdir(), 'norna-site-tree-'));
const firstSite = path.join(root, 'custom-content');
const secondSite = path.join(root, 'other', 'site');
const write = async (filename, source) => { await mkdir(path.dirname(filename), { recursive: true }); await writeFile(filename, source); };
const page = path.join(firstSite, 'pages', '010-guide', 'content.md');
const overview = path.join(firstSite, 'pages', '020-topics', 'content.md');
const edit = async (source, field, value, sourcePath = page) => {
	const changes = await editSiteNodeInformation({ siteRoot: firstSite, sourcePath, source, field, value });
	return changes.sort((a, b) => b.start - a.start).reduce((text, change) => text.slice(0, change.start) + change.text + text.slice(change.end), source);
};

try {
	for (const site of [firstSite, secondSite]) {
		await write(path.join(site, 'site-config/settings.yaml'), 'url: https://example.com/\n');
		await write(path.join(site, 'content.md'), '# Home\n');
	}
	await write(page, '---\npage:\n  aliases: [/old-guide/]\nnavigation:\n  listed: false\n---\n\n# Guide\n\n[Authored label](/guide/).\n');
	await write(overview, '---\npage:\n  listChildren: true\n  description: Topic choices.\n---\n# Topics\n');
	await write(path.join(firstSite, 'pages', '020-topics', 'pages', '010-child', 'content.md'), '# Child\n');
	const [first, second] = await Promise.all([readSiteTree({ siteRoot: firstSite }), readSiteTree({ siteRoot: secondSite })]);
	assert.deepEqual(first.nodes.map((node) => [node.title, node.url, node.kind]), [
		['Home', '/', 'page'], ['Guide', '/guide/', 'page'], ['Topics', '/topics/', 'page'], ['Child', '/topics/child/', 'page'],
	]);
	assert.equal(first.nodes[1].listed, false);
	assert.deepEqual(first.nodes[1].aliases, ['/old-guide/']);
	assert.equal(second.nodes.length, 1, 'Sites must not share a process-global root.');
	const sources = new Map([[page, '# Unsaved title\n'], [overview, '---\npage:\n  listChildren: true\n---\n# Unsaved overview\n']]);
	const overlaid = await readSiteTree({ siteRoot: firstSite, sources });
	assert.equal(overlaid.nodes[1].title, 'Unsaved title');
	assert.equal(overlaid.nodes[2].title, 'Unsaved overview');
	assert.equal(overlaid.nodes[2].listChildren, true);
	assert.match(await readFile(page, 'utf8'), /# Guide/);

	await write(overview, '---\npage: [broken\n---\n# Topics\n');
	const broken = await readSiteTree({ siteRoot: firstSite });
	assert.equal(broken.nodes.length, 4, 'A broken overview must not hide its child or valid neighbors.');
	assert.ok(broken.nodes[2].problem);
	assert.equal(broken.nodes[3].title, 'Child');
	await write(overview, '# Topics\n');
	await write(page, '# One\n\n# Two\n');
	assert.match((await readSiteTree({ siteRoot: firstSite })).nodes[1].problem, /exactly one/);
	await write(page, '# Guide\n');
	await rename(path.dirname(page), path.join(firstSite, 'pages', '015-renamed'));
	assert.equal((await readSiteTree({ siteRoot: firstSite })).nodes[1].url, '/renamed/');
	await rename(path.join(firstSite, 'pages', '015-renamed'), path.dirname(page));

	const crlf = '---\r\n# Metadata comment\r\npage:\r\n  description: "Old: text" # keep\r\n  aliases: [/legacy/]\r\n---\r\n\r\n# Guide\r\n\r\nUnsaved prose [keep this label](/guide/).\r\n';
	assert.equal(await edit(crlf, 'title', 'New [title]'), crlf.replace('# Guide\r\n', '# New \\[title\\]\r\n'));
	assert.equal(await edit(crlf, 'description', 'New: text'), crlf.replace('"Old: text"', '"New: text"'));
	assert.equal(await edit(crlf, 'description', ''), crlf.replace('  description: "Old: text" # keep\r\n', '  # keep\r\n'));
	assert.equal(await edit(crlf, 'listed', false), crlf.replace('---\r\n\r\n# Guide', 'navigation:\r\n  listed: false\r\n---\r\n\r\n# Guide'));
	assert.equal(await edit('Title\n=====\n\nBody.\n', 'title', 'Renamed'), '# Renamed\n\nBody.\n');
	assert.equal(await edit('# Guide\n\nBody.\n', 'description', 'A guide.'), '---\npage:\n  description: "A guide."\n---\n\n# Guide\n\nBody.\n');
	assert.equal(await edit('---\npage:\n  description: Old\n---\n# Guide\n', 'description', ''), '# Guide\n');
	assert.equal(await edit('---\npage: {description: "Old", aliases: [/legacy/]}\n---\n# Guide\n', 'description', 'New'), '---\npage: {description: "New", aliases: [/legacy/]}\n---\n# Guide\n');
	assert.equal(await edit('---\npage: {description: "Old", aliases: [/legacy/]}\n---\n# Guide\n', 'description', ''), '---\npage: { aliases: [/legacy/]}\n---\n# Guide\n');
	const block = '---\npage:\n  description: >- # retain\n    Old long\n    description.\n  aliases: [/old/]\n---\n# Guide\n';
	assert.equal(await edit(block, 'description', 'New description.'), '---\npage:\n  description: "New description." # retain\n  aliases: [/old/]\n---\n# Guide\n');
	assert.equal(await edit('# Same\n', 'title', 'Same'), '# Same\n');
	assert.equal(await edit('# Only one\n\n```md\n# Example\n```\n', 'title', 'Title'), '# Title\n\n```md\n# Example\n```\n');
	assert.equal(await edit('# Topics\n', 'title', 'Subjects', overview), '# Subjects\n');
	assert.equal(await edit('# Topics\n', 'description', 'Choose a topic.', overview), '---\npage:\n  description: "Choose a topic."\n---\n\n# Topics\n');
	assert.equal(await edit('---\npage:\n  description: Old\n---\n# Topics\n', 'description', '', overview), '# Topics\n');
	assert.match(await edit('# Topics\n', 'listChildren', true, overview), /listChildren: true/);
	await assert.rejects(edit('# Home\n', 'listed', false, path.join(firstSite, 'content.md')), /Home must remain listed/);
	await assert.rejects(edit('# Guide\n', 'url', '/new/'), /read-only/);
	await assert.rejects(edit('# Guide\n', 'title', 'bad\nheading'), /single line/);
	await assert.rejects(edit('# Other\n', 'title', 'Bad', path.join(secondSite, 'content.md')), /Invalid/);
	await assert.rejects(edit('---\npage: [broken\n---\n# Guide\n', 'description', 'No'), /invalid YAML/);
	assert.equal((await getSiteNodeInformation({ source: '# Title\n', kind: 'page', isHome: false, sourcePath: page })).title, 'Title');

	const before = await readdir(path.join(firstSite, 'pages'));
	const plan = await planSiteNodeCreation({ siteRoot: firstSite, kind: 'page', title: 'Räksmörgås', parentPath: '/' });
	assert.equal(plan.url, '/raksmorgas/');
	assert.deepEqual(await readdir(path.join(firstSite, 'pages')), before, 'Preview and cancellation must not create files.');
	const created = await createSiteNode(plan);
	assert.match(await readFile(created.sourcePath, 'utf8'), /^# Räksmörgås\n/);
	await assert.rejects(createSiteNode(plan), /sibling with that slug already exists/);
	const overviewPlan = await planSiteNodeCreation({ siteRoot: secondSite, kind: 'page', title: 'Guides', parentPath: '/', metadata: { page: { listChildren: true } } });
	await createSiteNode(overviewPlan);
	const childPlan = await planSiteNodeCreation({ siteRoot: secondSite, kind: 'page', title: 'Nested', parentPath: '/guides/' });
	assert.equal((await createSiteNode(childPlan)).url, '/guides/nested/');
	assert.equal((await readSiteTree({ siteRoot: firstSite })).nodes.some((node) => node.title === 'Nested'), false);
	const rootChild = await planSiteNodeCreation({ siteRoot: firstSite, kind: 'page', title: 'Root child', parentPath: null, invocationDirectory: firstSite });
	assert.equal(rootChild.collectionDir, path.join(firstSite, 'pages'));
	await assert.rejects(planSiteNodeCreation({ siteRoot: firstSite, kind: 'page', title: 'Bad', slug: '../escape' }), /Invalid slug/);
	assert.equal((await planSiteNodeCreation({ siteRoot: firstSite, kind: 'page', title: 'Home' })).url, '/home/');
	const stale = await planSiteNodeCreation({ siteRoot: secondSite, kind: 'page', title: 'Reserved', parentPath: '/' });
	await createSiteNode(await planSiteNodeCreation({ siteRoot: secondSite, kind: 'page', title: 'Another', parentPath: '/' }));
	await assert.rejects(createSiteNode(stale), /sibling already uses it/);

	const child = path.join(firstSite, 'pages/020-topics/pages/010-child/content.md');
	for (const [filename, source] of [
		['site-config/site-theme.yaml', 'preset: documentation\n'], ['theme.yaml', 'layout:\n  textWidth: narrow\n'], ['site-config/shared-content.yaml', 'footer: {}\n'],
		['images/shared.svg', '<svg/>'], ['pages/010-guide/theme.yaml', 'layout:\n  contentSpacing: compact\n'],
		['pages/010-guide/images/shared.svg', '<svg><title>Guide</title></svg>'],
		['pages/020-topics/theme.yaml', 'layout:\n  contentSpacing: compact\n'],
		['pages/020-topics/pages/010-child/images/shared.svg', '<svg><title>Child</title></svg>'],
		['public/robots.txt', 'User-agent: *\n'], ['public/icons/icon.svg', '<svg/>'],
		['.norna/public/generated.svg', '<svg/>'],
	]) await write(path.join(firstSite, filename), source);
	await mkdir(path.join(firstSite, 'public/empty'), { recursive: true });
	await symlink(secondSite, path.join(firstSite, 'public/outside'));
	const inventory = async (directory) => {
		const result = [];
		for (const entry of (await readdir(directory, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))) {
			const filename = path.join(directory, entry.name);
			result.push([filename, entry.isDirectory() ? 'directory' : entry.isSymbolicLink() ? 'symlink' : (await readFile(filename)).toString('hex')]);
			if (entry.isDirectory()) result.push(...await inventory(filename));
		}
		return result;
	};
	const beforeBrowse = await inventory(firstSite);
	const files = await readSiteFileTree({ siteRoot: firstSite, sources });
	const resourceId = (relative) => `resource:${path.join(firstSite, relative)}`;
	const at = (relative) => files.items.find((item) => item.id === resourceId(relative));
	const childrenOf = (id) => files.items.filter((item) => item.parentId === id);
	const home = path.join(firstSite, 'content.md');
	assert.deepEqual(files.items.filter((item) => item.parentId === null).map((item) => item.sourcePath), [home], 'One root page, with no synthetic site container.');
	assert.deepEqual(childrenOf(home).map((item) => item.title), ['site-config', 'public', 'theme.yaml', 'content.md', 'images', 'pages']);
	assert.deepEqual(childrenOf(page).map((item) => item.title), ['theme.yaml', 'content.md', 'images'], 'A leaf must not gain a fictional pages directory.');
	assert.deepEqual(childrenOf(overview).map((item) => item.title), ['theme.yaml', 'content.md', 'pages']);
	assert.equal(files.items.find((item) => item.id === page).parentId, resourceId('pages'));
	assert.equal(files.items.find((item) => item.id === child).parentId, resourceId('pages/020-topics/pages'));
	assert.equal(at('pages/020-topics/pages/010-child/images/shared.svg').ownerId, child);
	assert.equal(at('pages/010-guide/images/shared.svg').ownerId, page);
	assert.equal(at('images/shared.svg').ownerId, home);
	assert.equal(at('public/icons/icon.svg').parentId, resourceId('public/icons'));
	assert.equal(at('public/empty').kind, 'directory');
	assert.equal(at('public/outside'), undefined, 'Do not follow symbolic links outside the displayed source tree.');
	assert.equal(at('.norna/public/generated.svg'), undefined);
	assert.equal(at('content.md').parentId, home, 'The source file is visible directly under its page.');
	assert.deepEqual(childrenOf(resourceId('site-config')).map((item) => item.title), ['settings.yaml', 'site-theme.yaml', 'shared-content.yaml']);
	assert.equal(at('site-config/site-theme.yaml').ownerId, home);
	assert.equal(files.items.find((item) => item.id === page).title, 'Unsaved title');
	assert.equal(files.items.find((item) => item.id === overview).title, 'Unsaved overview');
	assert.match(at('site-config').description, /shared by the complete site/);
	assert.match(at('theme.yaml').description, /this page only.*site-config\/site-theme\.yaml/);
	assert.match(at('pages/010-guide/theme.yaml').description, /this page and its child pages.*inherited settings/);
	assert.match(at('pages/020-topics/theme.yaml').description, /this page and its child pages/);
	assert.match(at('public').description, /published unchanged.*robots\.txt and icons/);
	assert.equal(new Set(files.items.map((item) => item.id)).size, files.items.length, 'Resource and page identities must be unique.');
	assert.deepEqual(files.items.filter((item) => item.kind === 'page').map((item) => item.url), files.nodes.map((item) => item.url));
	assert.deepEqual(await inventory(firstSite), beforeBrowse, 'Browsing may not change source bytes, create directories or generated state.');
	const otherFiles = await readSiteFileTree({ siteRoot: secondSite });
	assert.ok(otherFiles.items.every((item) => item.sourcePath.startsWith(secondSite + path.sep)), 'Resource discovery must remain local to the selected site.');
	await write(path.join(firstSite, 'public/new.txt'), 'New\n');
	assert.ok((await readSiteFileTree({ siteRoot: firstSite })).items.some((item) => item.id === resourceId('public/new.txt')));
	await rename(path.join(firstSite, 'public/new.txt'), path.join(firstSite, 'public/renamed.txt'));
	const renamedFiles = await readSiteFileTree({ siteRoot: firstSite });
	assert.ok(renamedFiles.items.some((item) => item.id === resourceId('public/renamed.txt')));
	assert.equal(renamedFiles.items.some((item) => item.id === resourceId('public/new.txt')), false);
	await rm(path.join(firstSite, 'public/renamed.txt'));
	assert.equal((await readSiteFileTree({ siteRoot: firstSite })).items.some((item) => item.id === resourceId('public/renamed.txt')), false);
	await write(overview, '---\npage: [broken\n---\n# Topics\n');
	const brokenFiles = await readSiteFileTree({ siteRoot: firstSite });
	assert.ok(brokenFiles.items.find((item) => item.id === overview).problem);
	assert.ok(brokenFiles.items.find((item) => item.id === resourceId('pages/020-topics/content.md')));
	assert.ok(brokenFiles.items.find((item) => item.id === child));
	await write(overview, '# Topics\n');
	assert.equal((await readSiteFileTree({ siteRoot: firstSite })).items.find((item) => item.id === overview).problem, null);
	const emptySite = path.join(root, 'empty-site');
	await write(path.join(emptySite, 'content.md'), '# Empty\n');
	await write(path.join(emptySite, 'site-config/settings.yaml'), 'url: https://example.com/\n');
	await mkdir(path.join(emptySite, 'pages'));
	const empty = await readSiteFileTree({ siteRoot: emptySite });
	assert.deepEqual(empty.items.map((item) => item.title), ['Empty', 'site-config', 'settings.yaml', 'content.md', 'pages']);
	console.log('Site tree engine tests passed: metadata, dirty overlays, isolated roots, malformed nodes, physical files, themes, public resources, read-only browsing, refresh and creation.');
} finally {
	await rm(root, { recursive: true, force: true });
}
