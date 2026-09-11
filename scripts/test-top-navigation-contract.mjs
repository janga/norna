import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';

const root = path.resolve(import.meta.dirname, '..');
const parent = path.join(root, 'node_modules', '.cache');
await mkdir(parent, { recursive: true });
const temporary = await mkdtemp(path.join(parent, 'norna-top-contract-'));
const site = path.join(temporary, 'site');
try {
	await cp(path.join(root, 'fixtures/navigation-examples/nested/site'), site, { recursive: true });
	await writeFile(path.join(site, 'config.yaml'), 'url: https://example.test/docs/\nnavigation:\n  mode: top\n');
	const dogsPath = path.join(site, 'pages/010-dogs/content.md');
	await writeFile(dogsPath, `${await readFile(dogsPath, 'utf8')}\n### Daily checklist\n\nH3 remains in the document, not in the top section menu.\n`);
	await promisify(execFile)(process.execPath, [path.join(root, 'bin/norna.mjs'), '--site-dir', site, 'build'], {
		cwd: root, maxBuffer: 10 * 1024 * 1024,
	});
	const html = await readFile(path.join(temporary, 'dist/dogs/adult-dogs/index.html'), 'utf8');
	assert.ok(html.includes('data-navigation-mode="top"'));
	const menus = html.match(/<details class="top-page-menu">[\s\S]*?<\/details>/g) ?? [];
	assert.equal(menus.length, 3);
	const dogsMenu = menus.find((menu) => menu.includes('Menu: Dogs'));
	assert.ok(dogsMenu, 'Dogs must have a section and child-page disclosure.');
	for (const href of ['/docs/dogs/#meet-the-dogs', '/docs/dogs/#before-you-adopt', '/docs/dogs/adult-dogs/', '/docs/dogs/senior-dogs/']) {
		assert.ok(dogsMenu.includes(`href="${href}"`), `Missing base-path-aware destination: ${href}`);
	}
	assert.ok(dogsMenu.includes('class="top-page-sections"'));
	assert.ok(dogsMenu.includes('class="top-page-children"'));
	assert.ok(!dogsMenu.includes('#daily-checklist'), 'H3 must not leak into top section navigation.');
	console.log('Top navigation base-path and nested-child contract passed.');
} finally {
	await rm(temporary, { recursive: true, force: true });
}
