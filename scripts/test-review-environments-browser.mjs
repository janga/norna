import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runInherit } from './lib/run-command.mjs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const reviewRunner = path.join(repoRoot, 'scripts', 'review-environments.mjs');

await Promise.all(['navigation', 'presets'].map((target) => (
	runInherit(process.execPath, [reviewRunner, 'test', target], { cwd: repoRoot })
)));

console.log('Concurrent review environment browser tests passed.');
