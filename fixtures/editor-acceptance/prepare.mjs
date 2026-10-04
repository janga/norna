import { cp, lstat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { prepareScratchSite } from '../../scripts/review-scratch-site.mjs';

const fixtureRoot = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(fixtureRoot, '../..');
const scratchRoot = path.join(repositoryRoot, '.local/test-sites/editor-review');
const args = process.argv.slice(2);
if (args.length && (args.length !== 1 || args[0] !== '--replace')) {
  throw new Error('Usage: node fixtures/editor-acceptance/prepare.mjs [--replace]');
}
const state = await lstat(path.join(scratchRoot, 'site/.norna/dev/state.json')).catch(error => {
  if (error.code !== 'ENOENT') throw error;
  return null;
});
if (state) throw new Error('Stop this preview before preparing a fresh copy: npm run review:stop -- editor');
const result = await prepareScratchSite({
  repositoryRoot, sourcePath: path.join(fixtureRoot, 'site'), scratchRoot,
  replace: args.includes('--replace'),
});
await cp(path.join(fixtureRoot, 'imports'), path.join(scratchRoot, 'imports'), { recursive: true });
await cp(path.join(fixtureRoot, 'README.md'), path.join(scratchRoot, 'README.md'));
const workspace = path.join(scratchRoot, 'editor-review.code-workspace');
await writeFile(workspace, JSON.stringify({ folders: [{ path: 'site' }, { path: 'imports' }] }, null, 2) + '\n');
console.log(`Review site: ${result.targetDirectory}\nVS Code workspace: ${workspace}\nImport files: ${path.join(scratchRoot, 'imports')}\nStart preview: npm run review:start -- editor`);
