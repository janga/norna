import assert from 'node:assert/strict';
import { test } from 'node:test';
import { comparePageOrder, maximumPageOrder, parsePageOrder, planPageOrder } from './lib/page-order.mjs';

const nodes = values => values.map((pageOrder, i) => ({ pageOrder, pageId: String.fromCharCode(97 + i) }));
test('missing order follows explicit values; ties use slug and never title or date', () => {
	const pages = [{ pageId: 'z', pageOrder: 5 }, { pageId: 'b', pageOrder: null }, { pageId: 'a', pageOrder: null }, { pageId: 'a', pageOrder: 5 }];
	assert.deepEqual(pages.sort(comparePageOrder).map(({ pageId }) => pageId), ['a', 'z', 'a', 'b']);
	for (const invalid of [0, -1, 1.5, '10', Infinity, maximumPageOrder + 1]) assert.throws(() => parsePageOrder(invalid), /positive safe integer/);
	assert.equal(parsePageOrder(undefined), null);
});
test('insertion uses an available gap, including the boundary before unordered pages', () => {
	assert.deepEqual(planPageOrder(nodes([1000, 2000]), 1), { order: 1500, orderChanges: [] });
	assert.deepEqual(planPageOrder(nodes([1000, null]), 1), { order: 2000, orderChanges: [] });
	assert.deepEqual(planPageOrder(nodes([null]), 0), { order: 1000, orderChanges: [] });
});
test('exhausted gaps, duplicate bounds and insertion after an unordered page renumber only changed siblings', () => {
	for (const values of [[1, 2], [1, 1]]) {
		const plan = planPageOrder(nodes(values), 1);
		assert.equal(plan.order, 2000);
		assert.deepEqual(plan.orderChanges.map(c => c.newOrder), [1000, 3000]);
	}
	const plan = planPageOrder(nodes([1000, null]), 2);
	assert.equal(plan.order, 3000);
	assert.deepEqual(plan.orderChanges.map(c => [c.node.pageId, c.newOrder]), [['b', 2000]]);
	assert.equal(planPageOrder(nodes([maximumPageOrder]), 1).order, 2000);
});
