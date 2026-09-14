import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parseCodeFenceMetadata, nornaCodeFenceTransformer } from './lib/code-fence-metadata.mjs';
import { parseContentTabs } from './lib/content-tabs.mjs';

const tabsWithLabel = (label) => `:::: tabs\n\n::: tab ${label}\n\nFirst.\n\n:::\n\n::: tab "Other"\n\nSecond.\n\n:::\n\n::::`;

for (const [quoted, expected] of [
	['"Plain title"', 'Plain title'],
	[String.raw`"src\/config.js"`, 'src/config.js'],
	[String.raw`"A \"quote\" and \\ slash"`, 'A "quote" and \\ slash'],
	[String.raw`"F\u00f6r Windows"`, 'F\u00f6r Windows'],
	[String.raw`"\uD83D\uDE80 release"`, '\uD83D\uDE80 release'],
]) test(`code titles and tab labels share JSON decoding: ${quoted}`, () => {
	assert.deepEqual(parseCodeFenceMetadata(`title=${quoted} {1,3-4}`, { lineCount: 4 }), {
		highlightedLines: [1, 3, 4], title: expected,
	});
	const parsed = parseContentTabs(tabsWithLabel(quoted));
	assert.deepEqual(parsed.diagnostics, []);
	assert.equal(parsed.groups[0].panels[0].label, expected);
});

for (const quoted of [
	'""', '"   "', '"unclosed', "'single'", '42',
	String.raw`"bad\x41"`, String.raw`"bad\uXYZ1"`,
	...['n', 'r', 't', 'b', 'f', 'u0000', 'u001f', 'u007f', 'u0085', 'u009f', 'u2028', 'u2029'].map((escape) => `"bad\\${escape}"`),
	'"raw\tcontrol"', '"raw\u007fcontrol"',
]) test(`code titles and tab labels reject invalid or control-bearing strings: ${JSON.stringify(quoted)}`, () => {
	assert.equal(parseCodeFenceMetadata(`title=${quoted}`).error.code, 'invalid-code-fence-metadata');
	assert.ok(parseContentTabs(tabsWithLabel(quoted)).diagnostics.length > 0);
});

test('metadata ordering and line-selector validation remain unchanged', () => {
	for (const source of ['{1} title="late"', 'title="ok"{1}', '{0}', '{3-2}', '{1,1}', '{5}']) {
		assert.ok(parseCodeFenceMetadata(source, { lineCount: 4 }).error, source);
	}
	assert.ok(parseContentTabs(tabsWithLabel('"valid" extra')).diagnostics.length);
});

test('rendering uses the decoded title as text', () => {
	const context = { meta: {}, options: { meta: { __raw: String.raw`title="\u003cconfig\u003e"` } }, tokens: [[]] };
	const figure = nornaCodeFenceTransformer.pre.call(context, { type: 'element', tagName: 'pre' });
	assert.deepEqual(figure.children[0].children[0].children, [{ type: 'text', value: '<config>' }]);
});
