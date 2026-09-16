import assert from 'node:assert/strict';
import { once } from 'node:events';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import net from 'node:net';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { setTimeout as sleep } from 'node:timers/promises';
import { spawnBrowserTestServer, stopBrowserTestServer } from './browser-test-server.mjs';

const waitFor = async (probe, description) => {
	const deadline = Date.now() + 5_000;
	while (Date.now() < deadline) {
		const result = await probe();
		if (result) return result;
		await sleep(25);
	}
	assert.fail(`Timed out waiting for ${description}.`);
};

const canConnect = (port) => new Promise((resolve) => {
	const socket = net.connect({ host: '127.0.0.1', port });
	const finish = (reachable) => {
		socket.destroy();
		resolve(reachable);
	};
	socket.once('connect', () => finish(true));
	socket.once('error', () => finish(false));
	socket.setTimeout(500, () => finish(false));
});

for (const mode of ['normal', 'ignores termination', 'launcher already exited']) {
	test(`browser server cleanup: ${mode}`, { skip: process.platform === 'win32' }, async () => {
		const directory = await mkdtemp(path.join(tmpdir(), 'norna-browser-server-'));
		const statePath = path.join(directory, 'server.json');
		const descendantPath = path.join(directory, 'descendant.mjs');
		const launcherPath = path.join(directory, 'launcher.mjs');
		await writeFile(descendantPath, `
import net from 'node:net';
import { writeFileSync } from 'node:fs';
if (${JSON.stringify(mode)} === 'ignores termination') process.on('SIGTERM', () => {});
const server = net.createServer((socket) => socket.end());
server.listen(0, '127.0.0.1', () => {
  writeFileSync(${JSON.stringify(statePath)}, JSON.stringify({ pid: process.pid, port: server.address().port }));
});
`);
		await writeFile(launcherPath, `
import { spawn } from 'node:child_process';
if (${JSON.stringify(mode)} === 'ignores termination') process.on('SIGTERM', () => {});
spawn(process.execPath, [${JSON.stringify(descendantPath)}], { stdio: 'ignore' });
if (${JSON.stringify(mode)} === 'launcher already exited') process.exit(0);
`);
		const unrelated = net.createServer((socket) => socket.end());
		unrelated.listen(0, '127.0.0.1');
		await once(unrelated, 'listening');
		const child = spawnBrowserTestServer(process.execPath, [launcherPath]);
		let descendant;
		try {
			descendant = await waitFor(async () => {
				try { return JSON.parse(await readFile(statePath, 'utf8')); }
				catch (error) {
					if (error.code === 'ENOENT' || error instanceof SyntaxError) return false;
					throw error;
				}
			}, 'descendant startup');
			assert.equal(await canConnect(descendant.port), true);
			if (mode === 'launcher already exited') {
				await waitFor(() => child.exitCode === 0, 'launcher exit');
			}
			await stopBrowserTestServer(child, { timeoutMs: 100 });
			await waitFor(async () => !(await canConnect(descendant.port)), 'descendant shutdown');
			assert.ok(child.exitCode !== null || child.signalCode !== null, 'The launcher must also exit.');
			assert.equal(await canConnect(unrelated.address().port), true, 'Other servers must remain running.');
			await stopBrowserTestServer(child);
		} finally {
			await stopBrowserTestServer(child, { timeoutMs: 100 });
			if (descendant) {
				try { process.kill(descendant.pid, 'SIGKILL'); }
				catch (error) { if (error.code !== 'ESRCH') throw error; }
			}
			await new Promise((resolve) => unrelated.close(resolve));
			await rm(directory, { recursive: true, force: true });
		}
	});
}
