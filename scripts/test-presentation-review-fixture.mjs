import assert from 'node:assert/strict';
import { cp, mkdir, mkdtemp, readFile, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runInherit } from './lib/run-command.mjs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const fixtureRoot = path.join(repoRoot, 'fixtures', 'presentation-review');
const tempParent = path.join(repoRoot, 'node_modules', '.cache');
await mkdir(tempParent, { recursive: true });
const tempRoot = await mkdtemp(path.join(tempParent, 'norna-presentation-review-'));
const fixtureCopyRoot = path.join(tempRoot, 'presentation-review');
const siteDirectory = path.join(fixtureCopyRoot, 'site');
const cliPath = path.join(repoRoot, 'bin', 'norna.mjs');

try {
	await cp(fixtureRoot, fixtureCopyRoot, {
		filter: (source) => path.basename(source) !== '.norna',
		recursive: true,
	});
	await runInherit(process.execPath, [cliPath, '--site-dir', siteDirectory, 'build'], { cwd: repoRoot });

	const homepage = await readFile(path.join(fixtureCopyRoot, 'dist', 'index.html'), 'utf8');
	const presentationPage = await readFile(path.join(fixtureCopyRoot, 'dist', 'reading-and-images', 'index.html'), 'utf8');
	const deepPage = await readFile(
		path.join(fixtureCopyRoot, 'dist', 'deep-navigation', 'reference', 'data-and-code', 'index.html'),
		'utf8',
	);

	assert.match(homepage, /Presentation Test Plan/);
	assert.match(presentationPage, /class="section-note section-note-margin"/);
	assert.match(presentationPage, /class="image-stack\b/);
	assert.match(deepPage, /class="tree-local-navigation\b/);
	assert.match(deepPage, /data-table-frame/);
	console.log('Presentation review fixture build passed.');
} finally {
	await rm(tempRoot, { recursive: true, force: true });
}
