import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, readdir, rm, symlink, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import { planSiteUpgrade } from './lib/site-upgrade.mjs';
import { getSiteStructure } from './lib/site-structure.mjs';

const temporary = await mkdtemp(path.join(os.tmpdir(), 'norna-site-upgrade-'));
const cli = path.resolve(import.meta.dirname, '../bin/norna.mjs');
const write = async (file, text) => { await mkdir(path.dirname(file), { recursive: true }); await writeFile(file, text); };
const snapshot = async (directory) => {
	const result = {};
	const visit = async (dir) => {
		for (const entry of await readdir(dir, { withFileTypes: true })) {
			const filename = path.join(dir, entry.name);
			if (entry.isDirectory()) await visit(filename);
			else result[path.relative(directory, filename)] = entry.isFile() ? (await readFile(filename)).toString('base64') : 'special-file';
		}
	};
	await visit(directory);
	return result;
};
const makeSite = async (name, pageRoot) => {
	const site = path.join(temporary, name, 'custom-site');
	await write(path.join(site, 'site-config/settings.yaml'), 'url: https://example.com/docs/\n');
	await write(path.join(site, 'root/tree-theme.yaml'), 'preset: documentation\n');
	await write(path.join(site, pageRoot, 'content.md'), '# Home\r\nBehåll åäö.\r\n');
	await write(path.join(site, pageRoot, 'pages/010-guide/content.md'), '# Guide\n');
	return site;
};
const run = (site, args = [], cwd = site) => spawnSync(process.execPath, [cli, '--site-dir', site, 'site:upgrade', ...args], { encoding: 'utf8', cwd });
try {
	const site = await makeSite('current', 'root');
	const before = await snapshot(site);
	assert.deepEqual((await planSiteUpgrade(site)).moves, []);
	for (const args of [[], ['--apply']]) {
		const result = run(site, args, path.join(site, 'root/pages/010-guide'));
		assert.equal(result.status, 0, result.stderr);
		assert.match(result.stdout, /already uses the current/);
		assert.deepEqual(await snapshot(site), before, 'Current layouts are checked without writes.');
	}
	const tree = await getSiteStructure({ siteRoot: site });
	assert.deepEqual(tree.nodes.map(node => node.pagePath), ['', 'guide']);
	assert.equal(tree.contentFiles[0].imagesDir, path.join(site, 'root/images'));

	const former = await makeSite('former', '');
	for (const args of [[], ['--apply']]) {
		const original = await snapshot(former);
		const result = run(former, args);
		assert.equal(result.status, 1);
		assert.match(result.stderr, /Automatic conversion to root\/ is not provided/);
		assert.match(result.stderr, /No files changed/);
		assert.deepEqual(await snapshot(former), original);
	}
	const mixed = await makeSite('mixed', 'root');
	await write(path.join(mixed, 'content.md'), '# Preserve this older homepage\n');
	const mixedBefore = await snapshot(mixed);
	await assert.rejects(planSiteUpgrade(mixed), /former source locations/);
	assert.deepEqual(await snapshot(mixed), mixedBefore);

	await rm(path.join(site, 'root/content.md'));
	await assert.rejects(planSiteUpgrade(site), /root\/content.md is required/);
	await symlink(path.join(former, 'content.md'), path.join(site, 'root/content.md'));
	await assert.rejects(planSiteUpgrade(site), /must be a regular file/);
	const linkedRoot = path.join(temporary, 'linked-site');
	await symlink(mixed, linkedRoot);
	await assert.rejects(planSiteUpgrade(linkedRoot), /regular directory/);
	assert.equal(run(site, ['--unknown']).status, 1);
	console.log('Site layout upgrade boundary checks passed.');
} finally {
	await rm(temporary, { recursive: true, force: true });
}
