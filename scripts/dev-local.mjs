import { execFile, spawn } from 'node:child_process';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import net from 'node:net';
import { networkInterfaces } from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { getAstroArgs, runAstroInherit } from './lib/astro-command.mjs';
import projectConfig from './lib/project-config.mjs';
import { astroCacheDir, engineRoot, siteProjectRoot } from './lib/site-paths.mjs';

const execFileAsync = promisify(execFile);

const port = 4321;
const localHost = '127.0.0.1';
const localUrl = `http://${localHost}:${port}${projectConfig.site.basePath}`;
const probeUrls = [
	localUrl,
	`http://localhost:${port}${projectConfig.site.basePath}`,
];
const skipOpen = process.env.WALDE_NO_OPEN === '1';
const statePath = path.join(astroCacheDir, 'dev-local.json');
const logPath = path.join(astroCacheDir, 'dev.log');
const args = process.argv.slice(2);
const knownCommands = new Set(['start', 'lan', 'status', 'logs', 'restart', 'stop']);
const command = args.find((arg) => knownCommands.has(arg)) ?? args.find((arg) => !arg.startsWith('-')) ?? 'start';
const shouldKillBlockingPort = args.includes('--kill');
const shouldFollowLogs = args.includes('--follow');

const runAstro = async (args, options = {}) => execFileAsync(process.execPath, getAstroArgs(args), {
	cwd: siteProjectRoot,
	maxBuffer: 1024 * 1024 * 10,
	...options,
});

const syncSitePublic = async () => execFileAsync(process.execPath, [path.join(engineRoot, 'scripts', 'sync-site-public.mjs')], {
	cwd: siteProjectRoot,
	maxBuffer: 1024 * 1024 * 10,
});

const generateImages = async () => execFileAsync(process.execPath, [path.join(engineRoot, 'scripts', 'generate-images.mjs')], {
	cwd: siteProjectRoot,
	maxBuffer: 1024 * 1024 * 10,
});

const getPortPids = async () => {
	try {
		const { stdout } = await execFileAsync('lsof', ['-nP', `-iTCP:${port}`, '-sTCP:LISTEN', '-t']);
		return [...new Set(stdout.trim().split(/\s+/).map(Number).filter(Number.isInteger))];
	} catch (error) {
		if (error.code === 1 || error.code === 'ENOENT') {
			return [];
		}

		throw error;
	}
};

const readState = async () => {
	try {
		return JSON.parse(await readFile(statePath, 'utf8'));
	} catch (error) {
		if (error.code === 'ENOENT') {
			return null;
		}

		throw error;
	}
};

const getLanUrls = () => Object.values(networkInterfaces())
	.flat()
	.filter((network) => network?.family === 'IPv4' && !network.internal)
	.map((network) => `http://${network.address}:${port}${projectConfig.site.basePath}`);

const writeState = async (pid, host) => {
	await mkdir(path.dirname(statePath), { recursive: true });
	await writeFile(statePath, `${JSON.stringify({
		pid,
		port,
		host,
		mode: host === '0.0.0.0' ? 'lan' : 'local',
		url: localUrl,
		startedAt: new Date().toISOString(),
	}, null, 2)}\n`);
};

const removeState = async () => {
	await rm(statePath, { force: true });
};

const isPortFreeOnHost = (loopbackHost) => new Promise((resolve, reject) => {
	const server = net.createServer();

	server.once('error', (error) => {
		if (error.code === 'EADDRINUSE') {
			resolve(false);
			return;
		}

		if (error.code === 'EADDRNOTAVAIL') {
			resolve(true);
			return;
		}

		reject(error);
	});
	server.once('listening', () => {
		server.close(() => resolve(true));
	});
	server.listen({ port, host: loopbackHost, ipv6Only: loopbackHost === '::1' });
});

const isPortFree = async () => {
	for (const loopbackHost of ['127.0.0.1']) {
		if (!(await isPortFreeOnHost(loopbackHost))) {
			return false;
		}
	}

	return true;
};

const sleep = (milliseconds) => new Promise((resolve) => {
	setTimeout(resolve, milliseconds);
});

const isServerReachable = async () => {
	for (const probeUrl of probeUrls) {
		try {
			const response = await fetch(probeUrl, { signal: AbortSignal.timeout(1_000) });
			await response.arrayBuffer();
			return true;
		} catch {
			// Try the next loopback address.
		}
	}

	return false;
};

const waitForServer = async () => {
	const startedAt = Date.now();
	const timeoutMs = 30_000;

	while (Date.now() - startedAt < timeoutMs) {
		if (await isServerReachable()) {
			return;
		}

		await sleep(500);
	}

	throw new Error(`Timed out waiting for ${localUrl}`);
};

const waitForPidToStopListening = async (pid) => {
	const startedAt = Date.now();
	const timeoutMs = 5_000;

	while (Date.now() - startedAt < timeoutMs) {
		if (!(await getPortPids()).includes(pid)) {
			return true;
		}

		await sleep(250);
	}

	return false;
};

const killPortPids = async (pids) => {
	for (const pid of pids) {
		console.log(`Stopping process ${pid} on port ${port}.`);
		try {
			process.kill(pid, 'SIGTERM');
		} catch (error) {
			if (error.code !== 'ESRCH') {
				throw error;
			}
		}
	}

	for (const pid of pids) {
		if (await waitForPidToStopListening(pid)) {
			continue;
		}

		console.log(`Process ${pid} did not stop; sending SIGKILL.`);
		try {
			process.kill(pid, 'SIGKILL');
		} catch (error) {
			if (error.code !== 'ESRCH') {
				throw error;
			}
		}
		await waitForPidToStopListening(pid);
	}
};

const openBrowser = async () => {
	if (skipOpen) {
		console.log(`Browser open skipped. Open ${localUrl}`);
		return;
	}

	if (process.platform === 'darwin') {
		await execFileAsync('open', [localUrl]);
		return;
	}

	if (process.platform === 'win32') {
		await execFileAsync('cmd', ['/c', 'start', '', localUrl]);
		return;
	}

	await execFileAsync('xdg-open', [localUrl]);
};

const stopServer = async ({ quiet = false } = {}) => {
	const state = await readState();

	await runAstro(['dev', 'stop']).catch(() => {});

	if (!state?.pid) {
		if (!quiet) {
			console.log('No dev:local server is tracked.');
		}
		return;
	}

	const listeningPids = await getPortPids();

	if (!listeningPids.includes(state.pid)) {
		await removeState();
		if (!quiet) {
			console.log('No tracked dev:local server is running.');
		}
		return;
	}

	process.kill(state.pid, 'SIGTERM');

	if (!(await waitForPidToStopListening(state.pid))) {
		process.kill(state.pid, 'SIGKILL');
		await waitForPidToStopListening(state.pid);
	}

	await removeState();

	if (!quiet) {
		console.log(`Stopped dev server on ${localUrl}.`);
	}
};

const startServer = async ({ host = localHost, open = true, killBlockingPort = false } = {}) => {
	await stopServer({ quiet: true });

	let existingPids = await getPortPids();
	if (existingPids.length > 0 || !(await isPortFree())) {
		if (!killBlockingPort || existingPids.length === 0) {
			throw new Error(`Port ${port} is already in use. Stop the process using it, then rerun the dev command, or pass --kill.`);
		}

		await killPortPids(existingPids);
		await removeState();
		existingPids = await getPortPids();

		if (existingPids.length > 0 || !(await isPortFree())) {
			throw new Error(`Port ${port} is still in use after trying to stop ${existingPids.join(', ')}.`);
		}
	}

	await syncSitePublic();
	await generateImages();
	await runAstroInherit(['dev', '--background', '--host', host, '--port', String(port)]);
	await waitForServer();

	const startedPids = await getPortPids();
	await writeState(startedPids[0] ?? null, host);
	if (open) {
		await openBrowser();
	} else {
		console.log(`Browser open skipped. Open ${localUrl}`);
	}

	console.log(`Astro dev server is running at ${localUrl}`);
	if (host === '0.0.0.0') {
		const lanUrls = getLanUrls();
		console.log(lanUrls.length > 0
			? `On this local network: ${lanUrls.join(', ')}`
			: 'No local IPv4 address was found for LAN access.');
	}
	console.log('Manage it with norna dev:status, norna dev:logs, norna dev:restart, and norna dev:stop.');
};

const showStatus = async () => {
	const state = await readState();
	const listeningPids = await getPortPids();
	const reachable = await isServerReachable();

	if (state?.pid && listeningPids.includes(state.pid)) {
		const reachability = reachable ? '' : ' The listener is active, but the URL probe did not respond.';
		console.log(`dev:${state.mode ?? 'local'} is running at ${localUrl} (pid ${state.pid}).${reachability}`);
		if (state.host === '0.0.0.0') {
			const lanUrls = getLanUrls();
			if (lanUrls.length > 0) console.log(`On this local network: ${lanUrls.join(', ')}`);
		}
		return;
	}

	if (reachable) {
		const detail = state?.pid
			? `the tracked pid ${state.pid} is not listening`
			: 'no dev:local state file was found';
		console.log(`A server is responding at ${localUrl}, but ${detail}.`);
		return;
	}

	if (state) {
		await removeState();
	}

	console.log(`No dev server is running at ${localUrl}.`);
};

const showLogs = async () => {
	if (shouldFollowLogs) {
		const tail = spawn('tail', ['-n', '80', '-f', logPath], { stdio: 'inherit' });
		await new Promise((resolve, reject) => {
			tail.once('exit', resolve);
			tail.once('error', reject);
		});
		return;
	}

	try {
		const lines = (await readFile(logPath, 'utf8')).trimEnd().split('\n');
		console.log(lines.slice(-80).join('\n'));
	} catch (error) {
		if (error.code === 'ENOENT') {
			console.log('No dev log found.');
			return;
		}

		throw error;
	}
};

if (command === 'start') {
	await startServer({ open: !skipOpen, killBlockingPort: shouldKillBlockingPort });
} else if (command === 'lan') {
	await startServer({ host: '0.0.0.0', open: !skipOpen, killBlockingPort: shouldKillBlockingPort });
} else if (command === 'status') {
	await showStatus();
} else if (command === 'logs') {
	await showLogs();
} else if (command === 'restart') {
	const state = await readState();
	await startServer({
		host: state?.host === '0.0.0.0' ? '0.0.0.0' : localHost,
		open: false,
		killBlockingPort: shouldKillBlockingPort,
	});
} else if (command === 'stop') {
	await stopServer();
} else {
	throw new Error(`Unknown dev-local command: ${command}`);
}
