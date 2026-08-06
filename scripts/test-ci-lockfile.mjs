import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { normalizeCiLockfile, verifyCiLockfile } from './lib/ci-lockfile.mjs';

const execFileAsync = promisify(execFile);
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const tempRoot = await mkdtemp(path.join(tmpdir(), 'norna-ci-lockfile-'));
const npmCachePath = path.join(repoRoot, 'node_modules', '.cache', 'norna-npm');
const npmEnv = {
	...process.env,
	npm_config_cache: npmCachePath,
};

function escapeRegExp(value) {
	return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

try {
	await writeFile(path.join(tempRoot, 'package.json'), `${JSON.stringify({
		name: 'norna-ci-lockfile-test',
		private: true,
		dependencies: {
			astro: '^7.1.3',
		},
	}, null, 2)}\n`);

	const quietOptions = { env: npmEnv, stdio: 'ignore' };
	await normalizeCiLockfile(tempRoot, quietOptions);
	const lockfilePath = path.join(tempRoot, 'package-lock.json');
	const corruptedLockfile = JSON.parse(await readFile(lockfilePath, 'utf8'));
	const emnapiCoreVersion = corruptedLockfile.packages['node_modules/@emnapi/core']?.version;
	assert.ok(emnapiCoreVersion, 'expected npm to include @emnapi/core in the normalized lockfile');
	delete corruptedLockfile.packages['node_modules/@emnapi/core'];
	await writeFile(lockfilePath, `${JSON.stringify(corruptedLockfile, null, 2)}\n`);

	await assert.rejects(
		execFileAsync(process.platform === 'win32' ? 'npx.cmd' : 'npx', [
			'--yes',
			'npm@11.16.0',
			'ci',
			'--dry-run',
			'--ignore-scripts',
			'--no-audit',
			'--no-fund',
			'--os=linux',
			'--cpu=x64',
			'--libc=glibc',
		], { cwd: tempRoot, env: npmEnv }),
		new RegExp(`Missing: @emnapi\\/core@${escapeRegExp(emnapiCoreVersion)} from lock file`),
	);

	await normalizeCiLockfile(tempRoot, quietOptions);
	await verifyCiLockfile(tempRoot, quietOptions);

	const repairedLockfile = JSON.parse(await readFile(lockfilePath, 'utf8'));
	assert.equal(repairedLockfile.packages['node_modules/@emnapi/core']?.version, emnapiCoreVersion);
	console.log('ok - CI lockfile normalization repairs missing optional npm peers');
} finally {
	await rm(tempRoot, { force: true, recursive: true });
}
