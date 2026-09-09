import { randomUUID } from 'node:crypto';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import net from 'node:net';
import { tmpdir } from 'node:os';
import path from 'node:path';

const defaultHost = '127.0.0.1';
const defaultLockRoot = path.join(tmpdir(), 'norna-browser-test-ports');

export const getAvailableBrowserTestPort = (host = defaultHost) => new Promise((resolve, reject) => {
	const server = net.createServer();
	server.unref();
	server.once('error', reject);
	server.listen(0, host, () => {
		const address = server.address();
		const port = typeof address === 'object' && address ? address.port : null;
		server.close((error) => {
			if (error) reject(error);
			else if (port) resolve(port);
			else reject(new Error('Could not allocate a browser-test port.'));
		});
	});
});

const isProcessAlive = (pid) => {
	if (!Number.isInteger(pid) || pid < 1) return false;
	try {
		process.kill(pid, 0);
		return true;
	} catch (error) {
		if (error.code === 'ESRCH') return false;
		if (error.code === 'EPERM') return true;
		throw error;
	}
};

const readLock = async (lockPath) => {
	try {
		return JSON.parse(await readFile(lockPath, 'utf8'));
	} catch (error) {
		if (error.code === 'ENOENT') return null;
		if (error instanceof SyntaxError) return { invalid: true };
		throw error;
	}
};

const claimPort = async ({ lockRoot, port }) => {
	const lockPath = path.join(lockRoot, `${port}.json`);
	const token = randomUUID();
	const record = {
		pid: process.pid,
		token,
		createdAt: new Date().toISOString(),
	};

	try {
		await writeFile(lockPath, `${JSON.stringify(record)}\n`, { flag: 'wx' });
	} catch (error) {
		if (error.code !== 'EEXIST') throw error;

		const existing = await readLock(lockPath);
		if (existing && !existing.invalid && isProcessAlive(existing.pid)) return null;
		await rm(lockPath, { force: true });
		return claimPort({ lockRoot, port });
	}

	return {
		port,
		release: async () => {
			const current = await readLock(lockPath);
			if (current?.token === token) await rm(lockPath, { force: true });
		},
	};
};

export const reserveBrowserTestPort = async ({
	host = defaultHost,
	lockRoot = defaultLockRoot,
	getPort = () => getAvailableBrowserTestPort(host),
	maximumAttempts = 50,
} = {}) => {
	await mkdir(lockRoot, { recursive: true });

	for (let attempt = 0; attempt < maximumAttempts; attempt += 1) {
		const port = await getPort();
		const reservation = await claimPort({ lockRoot, port });
		if (reservation) return reservation;
	}

	throw new Error(`Could not reserve a unique browser-test port after ${maximumAttempts} attempts.`);
};
