import { execFileSync, spawn } from 'node:child_process';
import { setTimeout as sleep } from 'node:timers/promises';

const servers = new WeakMap();

export const spawnBrowserTestServer = (command, args, options = {}) => {
	const child = spawn(command, args, {
		...options,
		detached: process.platform !== 'win32',
		stdio: ['ignore', 'inherit', 'inherit'],
	});
	const closed = new Promise((resolve) => child.once('close', resolve));
	servers.set(child, { closed, stopping: null });
	return child;
};

const signalGroup = (pid, signal) => {
	try {
		process.kill(-pid, signal);
		return true;
	} catch (error) {
		if (error.code === 'ESRCH') return false;
		throw error;
	}
};

export const stopBrowserTestServer = (child, { timeoutMs = 5_000 } = {}) => {
	if (!child) return Promise.resolve();
	const state = servers.get(child);
	if (!state) throw new Error('Cannot stop a server that this browser test did not start.');
	if (state.stopping) return state.stopping;
	state.stopping = (async () => {
		if (!child.pid) return;
		if (process.platform === 'win32') {
			if (child.exitCode === null && child.signalCode === null) {
				execFileSync('taskkill', ['/pid', String(child.pid), '/T', '/F'], { stdio: 'ignore' });
			}
		} else if (signalGroup(child.pid, 'SIGTERM')) {
			// The CLI can exit before Astro. Keep ownership of the entire group,
			// including descendants that outlive the original child process.
			const deadline = Date.now() + timeoutMs;
			while (signalGroup(child.pid, 0) && Date.now() < deadline) await sleep(50);
			signalGroup(child.pid, 'SIGKILL');
		}
		await state.closed;
	})();
	return state.stopping;
};
