import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
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
const run = (command, extraArgs = [], environmentOverrides = {}) => spawnSync(
	process.execPath,
	[scriptPath, command, ...extraArgs],
	{
		cwd: tempRoot,
		encoding: 'utf8',
		env: { ...environment, ...environmentOverrides },
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

const startPortBlocker = () => new Promise((resolve, reject) => {
	const child = spawn(process.execPath, [
		'--input-type=module',
		'-e',
		[
			"import net from 'node:net';",
			'const server = net.createServer();',
			"server.listen({ host: '127.0.0.1', port: 0 }, () => {",
			'  const address = server.address();',
			"  if (!address || typeof address === 'string') process.exit(2);",
			'  console.log(address.port);',
			'});',
		].join('\n'),
	], {
		stdio: ['ignore', 'pipe', 'pipe'],
	});
	let stderr = '';
	child.stderr.setEncoding('utf8');
	child.stderr.on('data', (chunk) => {
		stderr += chunk;
	});
	child.once('error', reject);
	child.once('exit', (code) => {
		if (code && code !== 0) reject(new Error(`Port blocker exited with code ${code}: ${stderr}`));
	});
	child.stdout.setEncoding('utf8');
	child.stdout.once('data', (chunk) => {
		const blockerPort = Number.parseInt(chunk.trim(), 10);
		if (!Number.isInteger(blockerPort)) {
			reject(new Error(`Port blocker returned an invalid port: ${chunk}`));
			return;
		}

		resolve({ child, port: blockerPort });
	});
});

const waitForChildExit = (child) => new Promise((resolve) => {
	if (child.exitCode !== null || child.signalCode !== null) {
		resolve();
		return;
	}

	const timeout = setTimeout(resolve, 5_000);
	child.once('exit', () => {
		clearTimeout(timeout);
		resolve();
	});
});

let blocker;
let cleanupPort = port;

try {
	await cp(path.join(repoRoot, 'starters', 'basic', 'site'), siteDir, { recursive: true });

	const source = await readFile(scriptPath, 'utf8');
	assert.doesNotMatch(source, /spawn\(['"]tail['"]/u);
	const astroConfigSource = await readFile(path.join(repoRoot, 'astro.config.mjs'), 'utf8');
	assert.match(astroConfigSource, /strictPort:\s*true/u);

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

	blocker = await startPortBlocker();
	cleanupPort = blocker.port;
	const blockedEnvironment = { NORNA_DEV_PORT: String(blocker.port) };
	const blockedStart = run('start', [], blockedEnvironment);
	assert.notEqual(blockedStart.status, 0, 'dev start unexpectedly replaced a process without --kill');
	assert.match(
		`${blockedStart.stdout}\n${blockedStart.stderr}`,
		new RegExp(`Port ${blocker.port} is already in use.*--kill`, 'su'),
	);

	const killedStart = run('start', ['--kill'], blockedEnvironment);
	assertSucceeded(killedStart, 'dev start --kill');
	assert.match(killedStart.stdout, new RegExp(`Stopping process \\d+ on port ${blocker.port}\\.`, 'u'));
	assert.match(killedStart.stdout, new RegExp(`Astro dev server is running at http://127\\.0\\.0\\.1:${blocker.port}/`, 'u'));
	await waitForChildExit(blocker.child);

	const killedState = JSON.parse(await readFile(path.join(siteDir, '.norna', '.astro', 'dev-local.json'), 'utf8'));
	assert.equal(killedState.port, blocker.port);

	const killedStatus = run('status', [], blockedEnvironment);
	assertSucceeded(killedStatus, 'dev status after --kill');
	assert.match(killedStatus.stdout, new RegExp(`dev:local is running at http://127\\.0\\.0\\.1:${blocker.port}/`, 'u'));

	const killedStop = run('stop', [], blockedEnvironment);
	assertSucceeded(killedStop, 'dev stop after --kill');
	assert.match(killedStop.stdout, new RegExp(`Stopped dev server on http://127\\.0\\.0\\.1:${blocker.port}/`, 'u'));

	console.log('Platform-independent local dev lifecycle test passed.');
} finally {
	run('stop', [], { NORNA_DEV_PORT: String(cleanupPort) });
	if (blocker?.child.exitCode === null && blocker.child.signalCode === null) {
		blocker.child.kill('SIGKILL');
		await waitForChildExit(blocker.child);
	}
	await rm(tempRoot, { recursive: true, force: true });
}
