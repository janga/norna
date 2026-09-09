import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { reserveBrowserTestPort } from './browser-test-port.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const cliPath = path.join(root, 'bin', 'norna.mjs');
const host = '127.0.0.1';
const npmBin = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const cliArguments = process.argv.slice(2);
const siteDirOptionIndex = cliArguments.indexOf('--site-dir');
const configuredSiteDir = siteDirOptionIndex === -1
	? path.join('fixtures', 'top-navigation', 'site')
	: cliArguments[siteDirOptionIndex + 1];
if (!configuredSiteDir || configuredSiteDir.startsWith('--')) {
	throw new Error('Use --site-dir <path> to select a navigation test site.');
}
if (siteDirOptionIndex !== -1) cliArguments.splice(siteDirOptionIndex, 2);
const navigationDemoSiteDir = path.resolve(root, configuredSiteDir);
const testTargets = cliArguments;
const playwrightTargets = testTargets.length > 0 ? testTargets : ['tests/navigation.spec.ts'];

const sleep = (milliseconds) => new Promise((resolve) => {
	setTimeout(resolve, milliseconds);
});

const portReservation = await reserveBrowserTestPort({ host });
const { port } = portReservation;
const url = `http://${host}:${port}/`;
const activeChildren = new Set();
let interruptionSignal = null;

const trackChild = (child) => {
	activeChildren.add(child);
	const remove = () => activeChildren.delete(child);
	child.once('error', remove);
	child.once('exit', remove);
	return child;
};

const handleInterruption = (signal) => {
	if (interruptionSignal) return;
	interruptionSignal = signal;
	for (const child of activeChildren) {
		if (child.exitCode === null && !child.killed) child.kill(signal);
	}
};

for (const signal of ['SIGINT', 'SIGTERM']) {
	process.on(signal, handleInterruption);
}

const isReachable = async () => {
	try {
		const response = await fetch(url, { signal: AbortSignal.timeout(1_000) });
		await response.arrayBuffer();
		return response.ok;
	} catch {
		return false;
	}
};

const waitForServer = async (serverProcess) => {
	const startedAt = Date.now();
	const timeoutMs = 30_000;

	while (Date.now() - startedAt < timeoutMs) {
		if (serverProcess.exitCode !== null) {
			throw new Error(`Navigation test server exited before ${url} became reachable.`);
		}

		if (await isReachable()) {
			return;
		}

		await sleep(500);
	}

	throw new Error(`Timed out waiting for ${url}`);
};

const runInherit = (command, args, options = {}) => new Promise((resolve, reject) => {
	const child = trackChild(spawn(command, args, {
		cwd: root,
		stdio: 'inherit',
		...options,
	}));

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

const startServer = async () => {
	await runInherit(process.execPath, [cliPath, 'site:public'], {
		cwd: navigationDemoSiteDir,
	});
	await runInherit(process.execPath, [cliPath, 'images'], {
		cwd: navigationDemoSiteDir,
	});

	const serverProcess = trackChild(spawn(process.execPath, [
		cliPath,
		'astro',
		'dev',
		'--ignore-lock',
		'--host',
		host,
		'--port',
		String(port),
	], {
		cwd: navigationDemoSiteDir,
		stdio: 'inherit',
		env: {
			...process.env,
			ASTRO_DEV_BACKGROUND: '0',
		},
	}));
	await Promise.race([
		waitForServer(serverProcess),
		new Promise((_, reject) => {
			serverProcess.once('error', reject);
		}),
	]);

	return serverProcess;
};

const stopServer = async (serverProcess) => {
	if (!serverProcess || serverProcess.exitCode !== null) return;

	serverProcess.kill('SIGTERM');
	const stopped = await Promise.race([
		new Promise((resolve) => serverProcess.once('exit', () => resolve(true))),
		sleep(5_000).then(() => false),
	]);

	if (!stopped && serverProcess.exitCode === null) {
		serverProcess.kill('SIGKILL');
	}
};

let serverProcess;

try {
	serverProcess = await startServer();
	await runInherit(npmBin, ['exec', '--', 'playwright', 'test', ...playwrightTargets], {
		env: {
			...process.env,
			PLAYWRIGHT_BASE_URL: url,
		},
	});
} catch (error) {
	if (!interruptionSignal) throw error;
} finally {
	await stopServer(serverProcess);
	await portReservation.release();
	for (const signal of ['SIGINT', 'SIGTERM']) {
		process.removeListener(signal, handleInterruption);
	}
}

if (interruptionSignal) {
	process.exitCode = 128 + (interruptionSignal === 'SIGINT' ? 2 : 15);
}
