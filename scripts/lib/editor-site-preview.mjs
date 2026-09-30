import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { readFile, realpath } from 'node:fs/promises';
import net from 'node:net';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { verifyDevServer } from './dev-server-identity.mjs';
import { getEditorPageAddresses } from './editor-page-addresses.mjs';

export const sitePreviewApiVersion = 1;
const engineRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const queues = new Map();
const serialize = (key, action) => {
	const task = (queues.get(key) ?? Promise.resolve()).catch(() => {}).then(action);
	queues.set(key, task);
	void task.finally(() => { if (queues.get(key) === task) queues.delete(key); }).catch(() => {});
	return task;
};
const readState = async root => {
	try { return JSON.parse(await readFile(path.join(root, '.norna/dev/state.json'), 'utf8')); }
	catch (error) { if (error.code === 'ENOENT') return null; throw new Error('The preview server record is unreadable. Inspect Show Preview Log before restarting.', { cause: error }); }
};
const registryEntry = async siteRoot => {
	let registry;
	try { registry = await import(pathToFileURL(path.join(engineRoot, 'scripts/review-environment-registry.mjs')).href); }
	catch (error) { if (error.code === 'ERR_MODULE_NOT_FOUND') return null; throw error; }
	for (const [target, definition] of Object.entries(registry.reviewEnvironments)) {
		const root = await realpath(path.join(engineRoot, definition.siteDirectory)).catch(() => null);
		if (root === siteRoot) return { target, ...definition };
	}
	return null;
};
export const getEditorPreviewConfiguration = async ({ siteRoot, environment = process.env }) => {
	const root = await realpath(siteRoot);
	const registered = await registryEntry(root);
	const value = registered ? String(registered.port) : environment.NORNA_DEV_PORT ?? '4321';
	const port = /^\d+$/.test(value) ? Number(value) : NaN;
	if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('NORNA_DEV_PORT must be an integer from 1 through 65535. Correct the VS Code launch environment and restart VS Code.');
	return { siteRoot: root, port, registered, source: registered ? `review registry (${registered.target})` : environment.NORNA_DEV_PORT === undefined ? 'default' : 'NORNA_DEV_PORT' };
};
export const getEditorPreviewStatus = async ({ siteRoot }) => {
	const root = await realpath(siteRoot);
	const state = await readState(root);
	return { state, verified: await verifyDevServer(state, root) };
};
export const getEditorPreviewLog = async ({ siteRoot }) => {
	const root = await realpath(siteRoot);
	const files = ['dev/preparation.log', '.astro/dev.log', 'dev/state.json'];
	const logs = await Promise.all(files.map(async name => {
		try { return `${name}\n${(await readFile(path.join(root, '.norna', name), 'utf8')).slice(-64000)}`; }
		catch (error) { if (error.code === 'ENOENT') return ''; throw error; }
	}));
	return logs.filter(Boolean).join('\n\n') || 'No preview log exists for this site yet.';
};
const runManager = (config, operation, { token, environment, onOutput = () => {} } = {}) => new Promise((resolve, reject) => {
	const args = config.registered
		? [path.join(engineRoot, 'scripts/review-environments.mjs'), operation === 'stop' ? 'stop' : 'start', config.registered.target]
		: [path.join(engineRoot, 'bin/norna.mjs'), '--site-dir', config.siteRoot, operation === 'stop' ? 'dev:stop' : 'dev:local'];
	const env = { ...process.env, ...environment, NORNA_DEV_PORT: String(config.port), NORNA_SITE_DIR: config.siteRoot,
		NORNA_NO_OPEN: '1', NORNA_DEV_NO_RESTART: '1', ELECTRON_RUN_AS_NODE: '1' };
	// The extension may itself have been launched while another site was selected.
	delete env.NORNA_INTERNAL_STATE_DIR;
	delete env.NORNA_INVOCATION_ROOT;
	delete env.NORNA_DEV_EXPECT_TOKEN;
	delete env.NORNA_DEV_START_TOKEN;
	if (operation === 'stop') env.NORNA_DEV_EXPECT_TOKEN = token;
	else env.NORNA_DEV_START_TOKEN = token;
	const child = spawn(process.execPath, args, { cwd: engineRoot, env, stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true });
	let output = '';
	const capture = chunk => { output = (output + chunk).slice(-64000); onOutput(String(chunk)); };
	child.stdout.on('data', capture); child.stderr.on('data', capture);
	child.once('error', reject);
	child.once('exit', code => code === 0 ? resolve() : reject(new Error(`Preview ${operation} failed. ${output.replace(/\n\s+at [\s\S]*$/, '').trim().slice(-2500) || 'Show Preview Log for details.'}`)));
});
const portOccupied = (port, host) => new Promise((resolve, reject) => {
	const socket = net.connect({ port, host });
	socket.once('connect', () => { socket.destroy(); resolve(true); });
	socket.once('error', error => { socket.destroy(); ['ECONNREFUSED', 'EADDRNOTAVAIL', 'ENETUNREACH', 'EHOSTUNREACH'].includes(error.code) ? resolve(false) : reject(error); });
	socket.setTimeout(1000, () => { socket.destroy(); resolve(true); });
});
const cancelled = signal => { if (signal?.aborted) throw new Error('Preview cancelled.'); };
const stopVerified = async (config, state, options) => {
	if (!(await verifyDevServer(state, config.siteRoot))) throw new Error('Cannot verify this site’s preview server. No process was stopped. Use Show Preview Log to inspect its record.');
	if (config.registered && config.registered.port !== state.port) throw new Error('The registered port differs from the tracked server. Restore its registry port before stopping through the registered review command.');
	await runManager({ ...config, port: state.port }, 'stop', { ...options, token: state.token });
};
export const stopEditorSitePreview = async (options) => {
	const root = await realpath(options.siteRoot);
	return serialize(root, async () => {
		const state = await readState(root);
		if (!state) return { stopped: false };
		await stopVerified({ siteRoot: root, registered: await registryEntry(root) }, state, options);
		return { stopped: true };
	});
};
export const startEditorSitePreview = async (options) => {
	const config = await getEditorPreviewConfiguration(options);
	return serialize(config.siteRoot, async () => {
		cancelled(options.signal);
		// Read saved sources now, after any explicit Save Site action.
		const addresses = await getEditorPageAddresses({ siteRoot: config.siteRoot, sourcePath: options.sourcePath ?? path.join(config.siteRoot, 'root/content.md') });
		if (!addresses.webAddress || addresses.incomplete.length) throw new Error(`Repair the site before previewing it. ${addresses.incomplete.join('\n')}`);
		let state = await readState(config.siteRoot);
		let created = false;
		if (await verifyDevServer(state, config.siteRoot)) {
			if (state.port !== config.port) throw new Error(`This site is already running on port ${state.port}, but ${config.source} selects ${config.port}. Use Stop Preview Server before starting on the new port.`);
			if (state.mode !== 'local') throw new Error('This site is running in LAN mode. Stop that server explicitly before starting a local preview.');
		} else {
			if (state) throw new Error('The tracked preview server cannot be verified. It may be stopped or belong to an older engine. Inspect Show Preview Log and stop/restart it through the site’s dev commands; preview did not stop any process.');
			if (await portOccupied(config.port, '127.0.0.1') || await portOccupied(config.port, '::1')) throw new Error(`Port ${config.port} is used by another or unverified server. Stop it yourself or configure NORNA_DEV_PORT in the VS Code launch environment. No port fallback was attempted.`);
			cancelled(options.signal);
			const token = randomUUID();
			try {
				await runManager(config, 'start', { ...options, token });
				state = await readState(config.siteRoot);
				if (state?.token !== token || !(await verifyDevServer(state, config.siteRoot))) throw new Error('The new preview server did not provide a matching site identity. Inspect Show Preview Log.');
				created = true;
			} catch (error) {
				const failed = await readState(config.siteRoot);
				if (failed?.token === token && await verifyDevServer(failed, config.siteRoot)) {
					try { await stopVerified(config, failed, options); } catch (cleanup) { throw new Error(`${error.message}\nCleanup failed: ${cleanup.message}`); }
				}
				throw error;
			}
		}
		const url = new URL(addresses.webAddress);
		url.protocol = 'http:'; url.hostname = '127.0.0.1'; url.port = String(state.port);
		try {
			cancelled(options.signal);
			const timeout = AbortSignal.timeout(30_000);
			const signal = options.signal ? AbortSignal.any([timeout, options.signal]) : timeout;
			const response = await fetch(url, { signal, redirect: 'manual' });
			await response.arrayBuffer();
			if (!response.ok) throw new Error(`The preview page returned HTTP ${response.status}: ${url.href}. Repair the page and use Show Preview Log for details.`);
			cancelled(options.signal);
			if (!(await verifyDevServer(state, config.siteRoot))) throw new Error('The preview server identity changed while loading the page. No browser was opened.');
		} catch (failure) {
			const message = options.signal?.aborted ? 'Preview cancelled.'
				: failure.name === 'TimeoutError' ? `Timed out loading the preview page ${url.href}. Use Show Preview Log.`
				: failure.message;
			if (created) {
				try { await stopVerified(config, state, options); }
				catch (cleanup) { throw new Error(`${message}\nCleanup failed: ${cleanup.message} Use Stop Preview Server after inspecting the log.`); }
			}
			throw new Error(message, { cause: failure });
		}
		return { url: url.href, reused: !created, siteRoot: config.siteRoot, port: state.port };
	});
};
