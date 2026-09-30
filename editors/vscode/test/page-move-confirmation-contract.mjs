import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createRequire } from 'node:module';
const { confirmPageMove } = createRequire(import.meta.url)('../page-move-confirmation.cjs');
const model = { title: 'Guide <script>bad()</script>', plan: { sourceUrl: '/guide/', destinationUrl: '/topics/guide/', movePreview: { mappings: [{ oldPathname: '/guide/', newPathname: '/topics/guide/' }], linkChanges: [] } } };
function open(planForChoice) {
	let receive, onDispose, html;
	const replies = [];
	const panel = { webview: { set html(value) { html = value; }, onDidReceiveMessage(fn) { receive = fn; return { dispose() {} }; }, postMessage: async reply => replies.push(reply) }, onDidDispose(fn) { onDispose = fn; }, dispose() { onDispose(); } };
	const vscode = { ViewColumn: { Active: 1 }, window: { createWebviewPanel: () => panel } };
	const promise = confirmPageMove(vscode, { subscriptions: [] }, model, planForChoice);
	return { promise, panel, replies, html, send: message => receive(message) };
}

test('move confirmation defaults to preserving aliases and returns the checked choice only after planning succeeds', async () => {
	const choices = [];
	const f = open(async preserveAliases => { choices.push(preserveAliases); if (choices.length === 1) throw new Error('The site changed.'); return { preserveAliases }; });
	assert.match(f.html, /id="preserve-aliases"[^>]*checked/);
	assert.doesNotMatch(f.html, /<script>bad/);
	await f.send({ type: 'complete', preserveAliases: 'false' });
	assert.deepEqual(choices, []);
	await f.send({ type: 'complete', preserveAliases: false });
	assert.deepEqual(f.replies, [{ type: 'error', message: 'The site changed.' }]);
	await f.send({ type: 'complete', preserveAliases: true });
	assert.deepEqual(await f.promise, { preserveAliases: true });
	assert.deepEqual(choices, [false, true]);
});

test('closing a confirmation while planning discards the plan without applying it', async () => {
	const pending = Promise.withResolvers();
	const f = open(() => pending.promise);
	const submit = f.send({ type: 'complete', preserveAliases: false });
	f.panel.dispose();
	pending.resolve({ preserveAliases: false });
	await submit;
	assert.equal(await f.promise, undefined);
	const cancelled = open(() => { throw new Error('Cancellation must not plan.'); });
	await cancelled.send({ type: 'cancel' });
	assert.equal(await cancelled.promise, undefined);
});
