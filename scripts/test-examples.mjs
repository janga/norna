import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getExampleSites } from './lib/example-sites.mjs';
import { runInherit } from './lib/run-command.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const cliPath = path.join(root, 'bin', 'norna.mjs');
const examples = await getExampleSites(root);

for (const example of examples) {
	console.log(`\nBuilding ${example.siteLabel}`);
	await runInherit(process.execPath, [cliPath, '--site-dir', example.siteLabel, 'build'], { cwd: root });
}

console.log(`\nok - built ${examples.length} example sites`);
