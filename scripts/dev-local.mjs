import { execFile } from 'node:child_process';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import net from 'node:net';
import { networkInterfaces } from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { getAstroArgs, runAstroInherit } from './lib/astro-command.mjs';
import projectConfig from './lib/project-config.mjs';
import { astroCacheDir, engineRoot, siteProjectRoot } from './lib/site-paths.mjs';

const execFileAsync = promisify(execFile);

const port = Number.parseInt(process.env.NORNA_DEV_PORT ?? '4321', 10);
if (!Number.isInteger(port) || port < 1 || port > 65_535) {
	throw new Error('NORNA_DEV_PORT must be an integer from 1 through 65535.');
}
const localHost = '127.0.0.1';
const localUrl = `http://${localHost}:${port}${projectConfig.site.basePath}`;
const probeUrls = [
	localUrl,
	`http://localhost:${port}${projectConfig.site.basePath}`,
];
const skipOpen = process.env.NORNA_NO_OPEN === '1';
const statePath = path.join(astroCacheDir, 'dev-local.json');
const logPath = path.join(astroCacheDir, 'dev.log');
const args = process.argv.slice(2);
const knownCommands = new Set(['start', 'lan', 'status', 'logs', 'restart', 'stop']);
const command = args.find((arg) => knownCommands.has(arg)) ?? args.find((arg) => !arg.startsWith('-')) ?? 'start';
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

const writeState = async (host) => {
	await mkdir(path.dirname(statePath), { recursive: true });
	await writeFile(statePath, `${JSON.stringify({
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

const waitForPortToBeFree = async () => {
	const startedAt = Date.now();
	const timeoutMs = 5_000;

	while (Date.now() - startedAt < timeoutMs) {
		if (await isPortFree()) {
			return true;
		}

		await sleep(250);
	}

	return false;
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
	const { stdout = '', stderr = '' } = await runAstro(['dev', 'stop']);
	const stopped = `${stdout}\n${stderr}`.includes('Stopped dev server');
	if (stopped) await waitForPortToBeFree();
	await removeState();

	if (!quiet) {
		console.log(stopped
			? `Stopped dev server on ${localUrl}.`
			: 'No dev server is tracked for this site.');
	}
};

const startServer = async ({ host = localHost, open = true } = {}) => {
	await stopServer({ quiet: true });

	if (!(await isPortFree())) {
		throw new Error(`Port ${port} is already in use after stopping the dev server tracked for this site. Norna will not terminate an unrelated process automatically. Stop the process using the port, then rerun the dev command.`);
	}

	await syncSitePublic();
	await generateImages();
	await runAstroInherit(['dev', '--background', '--host', host, '--port', String(port)]);
	await waitForServer();

	await writeState(host);
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
	const { stdout = '', stderr = '' } = await runAstro(['dev', 'status']);
	const tracked = `${stdout}\n${stderr}`.includes('Dev server running at');
	const reachable = await isServerReachable();

	if (tracked) {
		const reachability = reachable ? '' : ' The server is tracked, but the site URL probe did not respond.';
		console.log(`dev:${state?.mode ?? 'local'} is running at ${localUrl}.${reachability}`);
		if (state?.host === '0.0.0.0') {
			const lanUrls = getLanUrls();
			if (lanUrls.length > 0) console.log(`On this local network: ${lanUrls.join(', ')}`);
		}
		return;
	}

	if (reachable) {
		console.log(`A server is responding at ${localUrl}, but Astro does not track it for this site.`);
		return;
	}

	if (state) {
		await removeState();
	}

	console.log(`No dev server is running at ${localUrl}.`);
};

const showLogs = async () => {
	if (shouldFollowLogs) {
		await runAstroInherit(['dev', 'logs', '--follow']);
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
	await startServer({ open: !skipOpen });
} else if (command === 'lan') {
	await startServer({ host: '0.0.0.0', open: !skipOpen });
} else if (command === 'status') {
	await showStatus();
} else if (command === 'logs') {
	await showLogs();
} else if (command === 'restart') {
	const state = await readState();
	await startServer({
		host: state?.host === '0.0.0.0' ? '0.0.0.0' : localHost,
		open: false,
	});
} else if (command === 'stop') {
	await stopServer();
} else {
	throw new Error(`Unknown dev-local command: ${command}`);
}
