import assert from 'node:assert/strict';
import { parseRouteDirectory } from './lib/route-model.mjs';

assert.deepEqual(parseRouteDirectory('010-getting-started'), {
	routeDirectory: '010-getting-started',
	routeOrder: 10,
	routeId: 'getting-started',
});

assert.deepEqual(parseRouteDirectory('120-api-reference'), {
	routeDirectory: '120-api-reference',
	routeOrder: 120,
	routeId: 'api-reference',
});

for (const routeDirectory of [
	'000-home',
	'10-about',
	'010_About',
	'010-About',
	'010-about-',
	'010-about--team',
	'010-om-oss!',
]) {
	assert.throws(
		() => parseRouteDirectory(routeDirectory),
		/Route directories must use the form NNN-route-id/,
		`${routeDirectory} should be rejected`,
	);
}

console.log('Route model test passed.');
