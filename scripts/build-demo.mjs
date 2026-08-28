import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runInherit } from './lib/run-command.mjs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const demoRoot = path.join(repoRoot, 'examples', 'feature-demos', 'media-and-surfaces');
const cliPath = path.join(repoRoot, 'bin', 'norna.mjs');

await runInherit(process.execPath, [cliPath, 'build'], { cwd: demoRoot });
console.log(`Demo output: ${path.join(demoRoot, 'dist')}`);
