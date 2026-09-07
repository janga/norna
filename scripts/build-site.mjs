import path from 'node:path';
import { engineRoot, siteProjectRoot } from './lib/site-paths.mjs';
import { runAstroInherit } from './lib/astro-command.mjs';
import { runInherit } from './lib/run-command.mjs';

const runScript = (relativePath, args = []) => runInherit(
	process.execPath,
	[path.join(engineRoot, relativePath), ...args],
	{ cwd: siteProjectRoot },
);

await runScript('scripts/check-config.mjs');
await runScript('scripts/sync-content-sections.mjs', ['--check']);
await runScript('scripts/sync-site-public.mjs');
await runScript('scripts/generate-images.mjs');
await runAstroInherit(['build']);
await runScript('scripts/generate-search-index.mjs');
