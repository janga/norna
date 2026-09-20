import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, readdir, rm, symlink, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import { applySiteUpgrade, planSiteUpgrade } from './lib/site-upgrade.mjs';
import { getSiteStructure } from './lib/site-structure.mjs';

const root = await mkdtemp(path.join(os.tmpdir(), 'norna-site-upgrade-'));
const cli = path.resolve(import.meta.dirname, '../bin/norna.mjs');
const write = async (file, text) => { await mkdir(path.dirname(file), { recursive: true }); await writeFile(file, text); };
const snapshot = async (directory) => {
	const result = {};
	const visit = async (dir) => {
		for (const entry of (await readdir(dir, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))) {
			const filename = path.join(dir, entry.name);
			if (entry.isDirectory()) await visit(filename);
			else if (entry.isFile()) result[path.relative(directory, filename)] = (await readFile(filename)).toString('base64');
			else result[path.relative(directory, filename)] = 'special-file';
		}
	};
	await visit(directory);
	return result;
};
const makeSite = async (name) => {
	const site = path.join(root, name, 'custom-site');
	await write(path.join(site, 'config.yaml'), 'url: https://example.com/docs/\n');
	await write(path.join(site, 'theme.yaml'), 'preset: documentation\n');
	await write(path.join(site, 'pages/000-home/content.md'), '---\r\npage:\r\n  aliases: [/welcome/]\r\n---\r\n# Home\r\n[Guide](/guide/)\r\n');
	await write(path.join(site, 'pages/000-home/theme.yaml'), 'layout:\n  textWidth: narrow\n');
	await write(path.join(site, 'pages/000-home/images/hero.svg'), '<svg/>\n');
	await write(path.join(site, 'pages/010-guide/content.md'), '# Guide\n[Home](/)\n');
	return site;
};

try {
	const site = await makeSite('success');
	const before = await snapshot(site);
	const plan = await planSiteUpgrade(site);
	assert.equal(plan.moves.length, 3);
	assert.deepEqual(await snapshot(site), before, 'planning must not write source or generated state');
	const run = (...args) => execFileSync(process.execPath, [cli, '--site-dir', site, 'site:upgrade', ...args], { encoding: 'utf8', cwd: site });
	assert.match(run(), /Preview only/);
	assert.deepEqual(await snapshot(site), before);
	assert.match(run('--apply'), /Converted the homepage/);
	const after = await snapshot(site);
	assert.deepEqual(after, {
		'config.yaml': before['config.yaml'], 'content.md': before['pages/000-home/content.md'],
		'images/hero.svg': before['pages/000-home/images/hero.svg'],
		'page-theme.yaml': before['pages/000-home/theme.yaml'],
		'pages/010-guide/content.md': before['pages/010-guide/content.md'], 'theme.yaml': before['theme.yaml'],
	});
	assert.match(run('--apply'), /already uses a root homepage/);
	assert.deepEqual(await snapshot(site), after);
	const tree = await getSiteStructure({ siteRoot: site });
	assert.deepEqual(tree.nodes.map(({ pagePath, isHome, depth }) => ({ pagePath, isHome, depth })), [
		{ pagePath: '', isHome: true, depth: 0 }, { pagePath: 'guide', isHome: false, depth: 1 },
	]);
	assert.equal(tree.contentFiles[0].imagesDir, path.join(site, 'images'));

	for (const destination of ['content.md', 'images/other.svg', 'page-theme.yaml']) {
		const conflict = await makeSite(`conflict-${destination.replaceAll('/', '-')}`);
		await write(path.join(conflict, destination), 'Keep my existing file.');
		const original = await snapshot(conflict);
		await assert.rejects(planSiteUpgrade(conflict), /already exists/);
		assert.deepEqual(await snapshot(conflict), original);
	}
	for (const extra of ['notes.md', 'pages/010-child/content.md']) {
		const site = await makeSite(`extra-${extra.replaceAll('/', '-')}`);
		await write(path.join(site, 'pages/000-home', extra), '# Keep me\n');
		const original = await snapshot(site);
		await assert.rejects(planSiteUpgrade(site), /extra file|not empty/);
		assert.deepEqual(await snapshot(site), original);
	}
	const stale = await makeSite('stale');
	const preview = await planSiteUpgrade(stale);
	await write(path.join(stale, 'pages/000-home/images/new.svg'), '<svg/>');
	const staleBefore = await snapshot(stale);
	await assert.rejects(applySiteUpgrade(preview), /structure changed/);
	assert.deepEqual(await snapshot(stale), staleBefore);
	const symbolic = await makeSite('symbolic');
	await symlink(path.join(symbolic, 'theme.yaml'), path.join(symbolic, 'pages/000-home/images/link.svg'));
	await assert.rejects(planSiteUpgrade(symbolic), /symbolic links/);
	const linkedRoot = path.join(root, 'linked-site');
	await symlink(symbolic, linkedRoot);
	await assert.rejects(planSiteUpgrade(linkedRoot), /symbolic link/);
	const linkedPages = path.join(root, 'linked-pages');
	await mkdir(linkedPages);
	await symlink(path.join(symbolic, 'pages'), path.join(linkedPages, 'pages'));
	await assert.rejects(planSiteUpgrade(linkedPages), /pages is a symbolic link/);
	const emptyPages = await makeSite('empty-pages');
	await mkdir(path.join(emptyPages, 'pages/000-home/pages'));
	await applySiteUpgrade(await planSiteUpgrade(emptyPages));
	assert.deepEqual((await getSiteStructure({ siteRoot: emptyPages })).nodes.map((node) => node.pagePath), ['', 'guide']);
	console.log('Site upgrade test passed: preview, conversion, bytes, root discovery, conflicts, stale plans and symbolic links.');
} finally {
	await rm(root, { recursive: true, force: true });
}
