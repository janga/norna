import { access, cp, mkdir, mkdtemp, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runInherit } from './lib/run-command.mjs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const fixtureRoot = path.join(repoRoot, 'fixtures', 'basic');
const tempParent = path.join(repoRoot, 'node_modules', '.cache');
await mkdir(tempParent, { recursive: true });
const tempRoot = await mkdtemp(path.join(tempParent, 'norna-basic-fixture-'));
const fixtureCopyRoot = path.join(tempRoot, 'basic');
const siteDir = path.join(fixtureCopyRoot, 'site');
const cliPath = path.join(repoRoot, 'bin', 'norna.mjs');

try {
	await cp(fixtureRoot, fixtureCopyRoot, { recursive: true });
	await runInherit(process.execPath, [cliPath, '--site-dir', siteDir, 'build'], { cwd: repoRoot });
	await access(path.join(fixtureCopyRoot, 'dist', 'index.html'));
	await access(path.join(siteDir, '.norna', '.astro'));
	console.log('Basic fixture build passed with isolated output and cache.');
} finally {
	await rm(tempRoot, { recursive: true, force: true });
}
