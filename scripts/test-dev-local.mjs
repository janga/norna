import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { cp, mkdir, mkdtemp, readFile, rm } from 'node:fs/promises';
import net from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const scriptPath = path.join(repoRoot, 'scripts', 'dev-local.mjs');
const tempParent = path.join(repoRoot, 'node_modules', '.cache');
await mkdir(tempParent, { recursive: true });
const tempRoot = await mkdtemp(path.join(tempParent, 'norna-dev-local-'));
const siteDir = path.join(tempRoot, 'site');

const getFreePort = () => new Promise((resolve, reject) => {
	const server = net.createServer();
	server.once('error', reject);
	server.listen({ host: '127.0.0.1', port: 0 }, () => {
		const address = server.address();
		if (!address || typeof address === 'string') {
			server.close();
			reject(new Error('Could not reserve a local test port.'));
			return;
		}

		server.close((error) => error ? reject(error) : resolve(address.port));
	});
});

const port = await getFreePort();
const environment = {
	...process.env,
	NORNA_DEV_PORT: String(port),
	NORNA_INVOCATION_ROOT: tempRoot,
	NORNA_NO_OPEN: '1',
	NORNA_SITE_DIR: siteDir,
};
const run = (command, extraArgs = []) => spawnSync(
	process.execPath,
	[scriptPath, command, ...extraArgs],
	{
		cwd: tempRoot,
		encoding: 'utf8',
		env: environment,
		timeout: 60_000,
	},
);
const assertSucceeded = (result, label) => {
	assert.equal(
		result.status,
		0,
		`${label} failed:\n${result.stdout}\n${result.stderr}`,
	);
};

try {
	await cp(path.join(repoRoot, 'starters', 'basic', 'site'), siteDir, { recursive: true });

	const source = await readFile(scriptPath, 'utf8');
	assert.doesNotMatch(source, /\blsof\b/u);
	assert.doesNotMatch(source, /spawn\(['"]tail['"]/u);
	assert.doesNotMatch(source, /process\.kill/u);

	const start = run('start');
	assertSucceeded(start, 'dev start');
	assert.match(start.stdout, new RegExp(`Astro dev server is running at http://127\\.0\\.0\\.1:${port}/`, 'u'));

	const state = JSON.parse(await readFile(path.join(siteDir, '.norna', '.astro', 'dev-local.json'), 'utf8'));
	assert.equal(state.port, port);
	assert.equal(state.host, '127.0.0.1');
	assert.equal(Object.hasOwn(state, 'pid'), false);

	const status = run('status');
	assertSucceeded(status, 'dev status');
	assert.match(status.stdout, new RegExp(`dev:local is running at http://127\\.0\\.0\\.1:${port}/`, 'u'));

	const logs = run('logs');
	assertSucceeded(logs, 'dev logs');
	assert.match(logs.stdout, /astro\s+v|watching for file changes/iu);

	const stop = run('stop');
	assertSucceeded(stop, 'dev stop');
	assert.match(stop.stdout, /Stopped dev server/u);

	const stoppedStatus = run('status');
	assertSucceeded(stoppedStatus, 'stopped dev status');
	assert.match(stoppedStatus.stdout, /No dev server is running/u);

	console.log('Platform-independent local dev lifecycle test passed.');
} finally {
	run('stop');
	await rm(tempRoot, { recursive: true, force: true });
}
