import { spawn } from 'node:child_process';
import { spawnBrowserTestServer, stopBrowserTestServer } from './browser-test-server.mjs';

const root = process.cwd();
const host = 'localhost';
const port = 4322;
const url = `http://${host}:${port}/`;
const probeUrls = [url, `http://127.0.0.1:${port}/`, `http://[::1]:${port}/`];
const npmBin = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const activeChildren = new Set();
let interruptionSignal = null;
let previewProcess;

const handleInterruption = (signal) => {
	if (interruptionSignal) return;
	interruptionSignal = signal;
	stopBrowserTestServer(previewProcess).catch(() => {});
	for (const child of activeChildren) {
		if (child.exitCode === null && !child.killed) child.kill(signal);
	}
};
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, handleInterruption);

const sleep = (milliseconds) => new Promise((resolve) => {
	setTimeout(resolve, milliseconds);
});

const runInherit = (command, args, options = {}) => new Promise((resolve, reject) => {
	const child = spawn(command, args, {
		cwd: root,
		stdio: 'inherit',
		...options,
	});
	activeChildren.add(child);
	child.once('close', () => activeChildren.delete(child));

	child.once('error', reject);
	child.once('exit', (code, signal) => {
		if (code === 0) {
			resolve();
			return;
		}

		const commandText = [command, ...args].join(' ');
		reject(new Error(signal
			? `${commandText} exited with signal ${signal}.`
			: `${commandText} exited with code ${code}.`));
	});
});

const isReachable = async () => {
	for (const probeUrl of probeUrls) {
		try {
			const response = await fetch(probeUrl, { signal: AbortSignal.timeout(1_000) });
			await response.arrayBuffer();
			return response.ok;
		} catch {
			// Try the next loopback address.
		}
	}

	return false;
};

const waitForPreview = async (previewProcess) => {
	const startedAt = Date.now();
	const timeoutMs = 30_000;

	while (Date.now() - startedAt < timeoutMs) {
		if (interruptionSignal) throw new Error('Navigation preview tests interrupted.');
		if (previewProcess.exitCode !== null || previewProcess.signalCode !== null) {
			throw new Error(`astro preview exited before ${url} became reachable.`);
		}

		if (await isReachable()) {
			return;
		}

		await sleep(500);
	}

	throw new Error(`Timed out waiting for ${url}`);
};

try {
	await runInherit(npmBin, ['run', 'build']);

	previewProcess = spawnBrowserTestServer(npmBin, ['run', 'astro', '--', 'preview', '--host', host, '--port', String(port)], {
		cwd: root,
	});

	await Promise.race([
		waitForPreview(previewProcess),
		new Promise((_, reject) => previewProcess.once('error', reject)),
	]);
	await runInherit(npmBin, ['exec', '--', 'playwright', 'test', 'tests/navigation-preview.spec.ts'], {
		env: {
			...process.env,
			PLAYWRIGHT_BASE_URL: url,
		},
	});
} catch (error) {
	if (!interruptionSignal) throw error;
} finally {
	await stopBrowserTestServer(previewProcess);
	for (const signal of ['SIGINT', 'SIGTERM']) process.removeListener(signal, handleInterruption);
}

if (interruptionSignal) process.exitCode = 128 + (interruptionSignal === 'SIGINT' ? 2 : 15);
