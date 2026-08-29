import { spawn } from 'node:child_process';
import net from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

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

const getAvailablePort = () => new Promise((resolve, reject) => {
	const server = net.createServer();
	server.unref();
	server.once('error', reject);
	server.listen(0, host, () => {
		const address = server.address();
		const port = typeof address === 'object' && address ? address.port : null;
		server.close((error) => {
			if (error) {
				reject(error);
				return;
			}
			resolve(port);
		});
	});
});

const port = await getAvailablePort();
if (!port) throw new Error('Could not reserve a port for the navigation test server.');
const url = `http://${host}:${port}/`;

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
	const child = spawn(command, args, {
		cwd: root,
		stdio: 'inherit',
		...options,
	});

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

	const serverProcess = spawn(process.execPath, [
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
	});
	serverProcess.once('error', (error) => {
		throw error;
	});
	await waitForServer(serverProcess);

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
} finally {
	await stopServer(serverProcess);
}
