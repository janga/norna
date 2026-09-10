import { readFile, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runInherit } from './lib/run-command.mjs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const reviewRunner = path.join(repoRoot, 'scripts', 'review-environments.mjs');
const persistentTarget = 'presets';
const persistentUrl = 'http://127.0.0.1:4324/';
const captureDirectory = path.join(repoRoot, '.local', 'review-captures', persistentTarget);
const capturePaths = ['light', 'dark'].map((appearance) => path.join(
	captureDirectory,
	`root-mobile-${appearance}.png`,
));

try {
	await rm(captureDirectory, { recursive: true, force: true });
	await runInherit(process.execPath, [reviewRunner, 'start', persistentTarget], { cwd: repoRoot });
	const assertPersistentServer = async () => {
		const response = await fetch(persistentUrl, { signal: AbortSignal.timeout(5_000) });
		if (!response.ok) {
			throw new Error(`Persistent review server returned ${response.status} for ${persistentUrl}`);
		}
		await response.arrayBuffer();
	};
	await assertPersistentServer();
	await runInherit(process.execPath, [reviewRunner, 'status', persistentTarget], { cwd: repoRoot });

	const suiteResults = await Promise.allSettled(['navigation', 'presets'].map((target) => (
		runInherit(process.execPath, [reviewRunner, 'test', target], { cwd: repoRoot })
	)));
	const failures = suiteResults
		.map((result, index) => ({ result, target: ['navigation', 'presets'][index] }))
		.filter(({ result }) => result.status === 'rejected');
	await assertPersistentServer();

	if (failures.length > 0) {
		throw new Error([
			'Concurrent review environment browser tests failed:',
			...failures.map(({ result, target }) => (
				`${target}: ${result.reason instanceof Error ? result.reason.message : String(result.reason)}`
			)),
		].join('\n'));
	}

	for (const appearance of ['light', 'dark']) {
		await runInherit(process.execPath, [
			reviewRunner,
			'capture',
			persistentTarget,
			'.',
			'--viewport',
			'mobile',
			'--appearance',
			appearance,
		], { cwd: repoRoot });
	}
	for (const capturePath of capturePaths) {
		const contents = await readFile(capturePath);
		if (contents.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a') {
			throw new Error(`Review capture is not a PNG: ${capturePath}`);
		}
	}
} finally {
	await runInherit(process.execPath, [reviewRunner, 'stop', persistentTarget], { cwd: repoRoot });
	await rm(captureDirectory, { recursive: true, force: true });
}

console.log('Concurrent review environment and capture browser tests passed.');
