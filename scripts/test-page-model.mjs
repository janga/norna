import assert from 'node:assert/strict';
import { parsePageDirectory } from './lib/page-model.mjs';

assert.deepEqual(parsePageDirectory('010-getting-started'), {
	pageDirectory: '010-getting-started',
	pageOrder: 10,
	pageId: 'getting-started',
});

assert.deepEqual(parsePageDirectory('120-api-reference'), {
	pageDirectory: '120-api-reference',
	pageOrder: 120,
	pageId: 'api-reference',
});

for (const pageDirectory of [
	'000-home',
	'10-about',
	'010_About',
	'010-About',
	'010-about-',
	'010-about--team',
	'010-om-oss!',
]) {
	assert.throws(
		() => parsePageDirectory(pageDirectory),
		/Page directories must use the form NNN-page-id/,
		`${pageDirectory} should be rejected`,
	);
}

console.log('Page model test passed.');
