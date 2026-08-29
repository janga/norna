import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { documentationPresetCandidates } from './lib/documentation-preset-candidates.mjs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const reviewRoot = path.join(repoRoot, 'node_modules', '.cache', 'norna-documentation-preset-review');
const result = spawnSync(process.execPath, [
	path.join(repoRoot, 'scripts', 'review-documentation-preset.mjs'),
	'--build-only',
], {
	cwd: repoRoot,
	encoding: 'utf8',
	maxBuffer: 30 * 1024 * 1024,
});

assert.equal(result.status, 0, result.stderr || result.stdout);
const reviewHtml = await readFile(path.join(reviewRoot, 'index.html'), 'utf8');
assert.match(reviewHtml, /data-candidate-select/);
assert.match(reviewHtml, /history\.replaceState/);

for (const [index, candidate] of documentationPresetCandidates.entries()) {
	assert.match(reviewHtml, new RegExp(`<option value="${candidate.id}">`));
	assert.match(reviewHtml, new RegExp(`data-candidate-frame="${candidate.id}"`));
	if (index > 0) {
		assert.match(reviewHtml, new RegExp(`<iframe hidden data-candidate-frame="${candidate.id}"`));
	}

	const pageHtml = await readFile(path.join(
		reviewRoot,
		'candidates',
		candidate.id,
		'dist',
		'guide',
		'components',
		'index.html',
	), 'utf8');
	assert.match(pageHtml, /data-display-settings/);
	assert.match(pageHtml, new RegExp(`/candidates/${candidate.id}/`));
}

console.log('Documentation preset review test passed.');
