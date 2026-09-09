import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runInherit } from './lib/run-command.mjs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const reviewRunner = path.join(repoRoot, 'scripts', 'review-environments.mjs');
const presentationUrl = 'http://127.0.0.1:4322/';

try {
	await runInherit(process.execPath, [reviewRunner, 'start', 'presentation'], { cwd: repoRoot });
	const response = await fetch(presentationUrl, { signal: AbortSignal.timeout(5_000) });
	if (!response.ok) {
		throw new Error(`Presentation review server returned ${response.status} for ${presentationUrl}`);
	}
	await response.arrayBuffer();
	await runInherit(process.execPath, [reviewRunner, 'status', 'presentation'], { cwd: repoRoot });
} finally {
	await runInherit(process.execPath, [reviewRunner, 'stop', 'presentation'], { cwd: repoRoot });
}

const suiteResults = await Promise.allSettled(['navigation', 'presets'].map((target) => (
	runInherit(process.execPath, [reviewRunner, 'test', target], { cwd: repoRoot })
)));
const failures = suiteResults
	.map((result, index) => ({ result, target: ['navigation', 'presets'][index] }))
	.filter(({ result }) => result.status === 'rejected');

if (failures.length > 0) {
	throw new Error([
		'Concurrent review environment browser tests failed:',
		...failures.map(({ result, target }) => (
			`${target}: ${result.reason instanceof Error ? result.reason.message : String(result.reason)}`
		)),
	].join('\n'));
}

console.log('Concurrent review environment browser tests passed.');
