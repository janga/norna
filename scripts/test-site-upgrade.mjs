import assert from 'node:assert/strict';
import { link, mkdtemp, mkdir, readFile, readdir, rename, rm, symlink, writeFile } from 'node:fs/promises';
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
	assert.equal(plan.moves.length, 5);
	assert.deepEqual(await snapshot(site), before, 'planning must not write source or generated state');
	const run = (...args) => execFileSync(process.execPath, [cli, '--site-dir', site, 'site:upgrade', ...args], { encoding: 'utf8', cwd: site });
	assert.match(run(), /Preview only/);
	assert.deepEqual(await snapshot(site), before);
	assert.match(run('--apply'), /Converted the site configuration and homepage files/);
	const after = await snapshot(site);
	assert.deepEqual(after, {
		'site-config/settings.yaml': before['config.yaml'], 'content.md': before['pages/000-home/content.md'],
		'images/hero.svg': before['pages/000-home/images/hero.svg'],
		'theme.yaml': before['pages/000-home/theme.yaml'],
		'pages/010-guide/content.md': before['pages/010-guide/content.md'], 'site-config/site-theme.yaml': before['theme.yaml'],
	});
	assert.match(run('--apply'), /already uses the current configuration and homepage layout/);
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
	for (const override of [false, true]) {
		const current = await makeSite(`root-home-${override}`);
		await rename(path.join(current, 'pages/000-home/content.md'), path.join(current, 'content.md'));
		await rename(path.join(current, 'pages/000-home/images'), path.join(current, 'images'));
		if (override) await rename(path.join(current, 'pages/000-home/theme.yaml'), path.join(current, 'page-theme.yaml'));
		await rm(path.join(current, 'pages/000-home'), { recursive: true });
		await write(path.join(current, 'sitewide-content.yaml'), '# Behåll åäö och kommentarer\r\nfooter:\r\n  copyrightMessage: Exempel\r\n');
		const original = await snapshot(current);
		await applySiteUpgrade(await planSiteUpgrade(current));
		const converted = await snapshot(current);
		assert.equal(converted['site-config/settings.yaml'], original['config.yaml']);
		assert.equal(converted['site-config/site-theme.yaml'], original['theme.yaml']);
		assert.equal(converted['site-config/shared-content.yaml'], original['sitewide-content.yaml']);
		assert.equal(converted['theme.yaml'], original['page-theme.yaml']);
		assert.equal(converted['content.md'], original['content.md']);
		assert.equal((await planSiteUpgrade(current)).moves.length, 0);
		assert.match(execFileSync(process.execPath, [cli, 'site:upgrade'], { cwd: path.join(current, 'site-config'), encoding: 'utf8' }), /already uses the current/);
	}
	for (const failAt of [2, 4, 5]) {
		const interrupted = await makeSite(`rollback-${failAt}`);
		const original = await snapshot(interrupted);
		let count = 0;
		await assert.rejects(applySiteUpgrade(await planSiteUpgrade(interrupted), { link: async (...args) => {
			if (++count === failAt) throw new Error('Simulated filesystem failure');
			return link(...args);
		} }), /original files were restored/);
		assert.deepEqual(await snapshot(interrupted), original);
		assert.equal((await readdir(interrupted)).includes('site-config'), false);
	}
	const rollbackThemes = await makeSite('rollback-themes');
	const originalThemes = await snapshot(rollbackThemes);
	await assert.rejects(applySiteUpgrade(await planSiteUpgrade(rollbackThemes), { rmdir: async () => { throw new Error('Simulated directory removal failure'); } }), /original files were restored/);
	assert.deepEqual(await snapshot(rollbackThemes), originalThemes, 'rollback restores both themes after the homepage theme occupied the former global path');
	const schemaSite = await makeSite('schema-paths');
	const schemaConfig = '# yaml-language-server: $schema=../schemas/config.schema.json\r\n# Behåll åäö\r\nurl: https://example.com/\r\n';
	await write(path.join(schemaSite, 'config.yaml'), schemaConfig);
	await write(path.join(schemaSite, 'theme.yaml'), '# yaml-language-server: $schema=https://example.com/theme.schema.json\npreset: documentation\n');
	await write(path.join(schemaSite, 'pages/000-home/theme.yaml'), '# yaml-language-server: $schema=../../../schemas/page-theme.schema.json\nlayout:\n  textWidth: narrow\n');
	const schemaBefore = await snapshot(schemaSite);
	await assert.rejects(applySiteUpgrade(await planSiteUpgrade(schemaSite), { rmdir: async () => { throw new Error('Simulated failure after schema adjustment'); } }), /original files were restored/);
	assert.deepEqual(await snapshot(schemaSite), schemaBefore, 'Rollback must restore the original schema directives too.');
	await applySiteUpgrade(await planSiteUpgrade(schemaSite));
	assert.equal(await readFile(path.join(schemaSite, 'site-config/settings.yaml'), 'utf8'), schemaConfig.replace('../schemas/', '../../schemas/'));
	assert.equal((await snapshot(schemaSite))['site-config/site-theme.yaml'], schemaBefore['theme.yaml'], 'Absolute schema URLs remain byte-for-byte unchanged.');
	assert.match(await readFile(path.join(schemaSite, 'theme.yaml'), 'utf8'), /\$schema=\.\.\/schemas\/page-theme\.schema\.json/);
	const mixed = await makeSite('mixed');
	await write(path.join(mixed, 'site-config/settings.yaml'), 'url: https://keep.example/\n');
	const mixedBefore = await snapshot(mixed);
	await assert.rejects(planSiteUpgrade(mixed), /mixed configuration layouts/);
	assert.deepEqual(await snapshot(mixed), mixedBefore);
	const linkedConfiguration = await makeSite('linked-config');
	await rm(path.join(linkedConfiguration, 'config.yaml'));
	await symlink(path.join(site, 'site-config'), path.join(linkedConfiguration, 'site-config'));
	await assert.rejects(planSiteUpgrade(linkedConfiguration), /symbolic link/);
	console.log('Site upgrade test passed: both old layouts, preview, bytes, CLI discovery, conflicts, stale plans, symbolic links and rollback including theme ownership.');
} finally {
	await rm(root, { recursive: true, force: true });
}
