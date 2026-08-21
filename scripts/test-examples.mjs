import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
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

	if (['svg', 'png', 'jpg', 'jpeg'].some((extension) => existsSync(path.join(example.siteDirectory, 'public', `logo.${extension}`)))) {
		const homepageHtml = await readFile(path.join(root, 'dist', 'index.html'), 'utf8');
		if (!homepageHtml.includes('class="site-brand-logo"')) {
			throw new Error(`Example ${example.siteLabel} has a logo file that is not rendered on its homepage.`);
		}
	}
}

console.log(`\nok - built ${examples.length} example sites`);
