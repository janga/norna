import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { test } from 'node:test';
import { getSiteStructure } from './lib/site-structure.mjs';
import { readSiteFileTree, createSiteNode, planSiteNodeCreation } from './lib/editor-site-tree.mjs';
import { parsePlacementArguments } from './lib/page-placement-cli.mjs';
const exec = promisify(execFile);
const fixture = async t => {
 const root = await mkdtemp(path.join(os.tmpdir(), 'norna-frontmatter-order-'));
 t.after(() => rm(root, { recursive: true, force: true }));
 const write = async (file, source) => { const full = path.join(root, file); await mkdir(path.dirname(full), { recursive: true }); await writeFile(full, source); return full; };
 await write('site-config/settings.yaml', 'sourceFormat: 2\nurl: https://example.com/\n');
 await write('root/tree-theme.yaml', 'preset: documentation\n');
 await write('root/content.md', '# Home\n');
 const page = (slug, order) => write(`root/pages/${slug}/content.md`, `${order === null ? '' : `---\n# Keep this comment\nnavigation:\n  order: ${order} # position\n  listed: true\n---\n`}# ${slug}\n\nBody stays.\n`);
 const run = args => exec(process.execPath, [path.resolve('bin/norna.mjs'), '--site-dir', root, ...args], { cwd: root });
 return { root, write, page, run };
};

test('engine and editor agree on duplicate and missing order; reads do not edit files', async t => {
 const f = await fixture(t);
 const files = await Promise.all([f.page('zebra', null), f.page('beta', 5), f.page('alpha', 5), f.page('pages', null), f.page('root', 1), f.page('123-guide', null)]);
 const before = await Promise.all(files.map(file => readFile(file, 'utf8')));
 const structure = await getSiteStructure({ siteRoot: f.root });
 assert.deepEqual(structure.nodes.filter(n => !n.isHome).map(n => n.pageId), ['root', 'alpha', 'beta', '123-guide', 'pages', 'zebra']);
 assert.equal(structure.warnings.length, 2);
 const editor = await readSiteFileTree({ siteRoot: f.root });
 assert.deepEqual(editor.items.filter(n => n.kind === 'page' && !n.isHome).map(n => n.pageId), ['root', 'alpha', 'beta', '123-guide', 'pages', 'zebra']);
 assert.equal(editor.items.find(n => n.pageId === 'alpha').issues[0].severity, 'warning');
 assert.deepEqual(await Promise.all(files.map(file => readFile(file, 'utf8'))), before);
 await f.write('site-config/settings.yaml', 'url: https://example.com/\n');
 await assert.rejects(getSiteStructure({ siteRoot: f.root }), /needs sourceFormat: 2 after converting/);
});

test('creation shows renumbering, requires permission, preserves comments and rejects stale plans', async t => {
 const f = await fixture(t), a = await f.page('a', 1), b = await f.page('b', 2);
 const options = { siteRoot: f.root, kind: 'page', title: 'New', placement: 'before', targetPath: b };
 const plan = await planSiteNodeCreation(options);
 assert.deepEqual(plan.orderChanges.map(c => [c.oldOrder, c.newOrder]), [[1, 1000], [2, 3000]]);
 await assert.rejects(createSiteNode(plan), /requires confirmation/);
 assert.deepEqual((await readdir(path.join(f.root, 'root/pages'))).sort(), ['a', 'b']);
 let writes = 0;
 await assert.rejects(createSiteNode(plan, { allowRenumber: true, writeSource: async (file, source) => { if (++writes === 2) throw new Error('simulated write failure'); await writeFile(file, source); } }), /simulated write failure/);
 assert.match(await readFile(a, 'utf8'), /order: 1 # position/);
 assert.deepEqual((await readdir(path.join(f.root, 'root/pages'))).sort(), ['a', 'b']);
 const result = await createSiteNode(plan, { allowRenumber: true });
 assert.equal(result.renumberedPages, 2);
 assert.match(await readFile(a, 'utf8'), /# Keep this comment[\s\S]*order: 1000 # position[\s\S]*Body stays/);
 assert.deepEqual((await getSiteStructure({ siteRoot: f.root })).nodes.filter(n => !n.isHome).map(n => n.pageId), ['a', 'new', 'b']);
 const stale = await planSiteNodeCreation({ ...options, title: 'Later' });
 await writeFile(a, (await readFile(a, 'utf8')) + 'Concurrent edit\n');
 await assert.rejects(createSiteNode(stale, { allowRenumber: true }), /site changed/i);
 const dirty = new Map([[b, '# Unsaved\n']]);
 await assert.rejects(planSiteNodeCreation({ ...options, title: 'Dirty placement', sources: dirty }), /unsaved files/);
});

test('CLI previews, refuses unattended renumbering and accepts explicit consent for create and move', async t => {
 const f = await fixture(t), a = await f.page('a', 1), b = await f.page('b', 2);
 const before = await Promise.all([readFile(a, 'utf8'), readFile(b, 'utf8')]);
 const preview = await f.run(['page:add', 'Inserted', '--after', '/a/', '--dry-run']);
 assert.match(preview.stdout, /2 existing sibling page/);
 await assert.rejects(f.run(['page:add', 'Inserted', '--after', '/a/']), /--allow-renumber/);
 assert.deepEqual(await Promise.all([readFile(a, 'utf8'), readFile(b, 'utf8')]), before);
 await f.run(['page:add', 'Inserted', '--after', '/a/', '--allow-renumber']);
 const moved = await f.run(['page:move', '/b/', '--before', '/a/', '--write']);
 assert.match(moved.stdout, /Page move completed/);
 assert.deepEqual((await getSiteStructure({ siteRoot: f.root })).nodes.filter(n => !n.isHome).map(n => n.pageId), ['b', 'a', 'inserted']);
 await f.page('b', 1); await f.page('a', 2);
 await assert.rejects(f.run(['page:move', '/inserted/', '--after', '/b/', '--write']), /--allow-renumber/);
 await f.run(['page:move', '/inserted/', '--after', '/b/', '--write', '--allow-renumber']);
 assert.deepEqual((await getSiteStructure({ siteRoot: f.root })).nodes.filter(n => !n.isHome).map(n => n.pageId), ['b', 'inserted', 'a']);
});

test('CLI rejects contradictory placement selectors', () => {
 for (const args of [['--before', '/a/', '--after', '/b/'], ['--before', '/a/', '--parent', '/'], ['--first', '--order', '10'], ['--write', '--dry-run']]) assert.throws(() => parsePlacementArguments(args));
});
