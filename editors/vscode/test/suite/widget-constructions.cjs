const assert = require('node:assert/strict');
const fs = require('node:fs');
const { createHash } = require('node:crypto');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const vscode = require('vscode');
const { chromium } = require('@playwright/test');
const { isNorna } = require('./completion-relevance.cjs');

const blockNames = ['card-list', 'image-carousel', 'image-stack', 'page-list'];
const callouts = ['NOTE', 'TIP', 'IMPORTANT', 'WARNING', 'CAUTION', 'DANGER'];
const bodies = {
	'image-stack': 'items:\n  - image: filename.jpg\n    alt: Alternative text\n    caption: Caption',
	'image-carousel': 'items:\n  - image: filename.jpg\n    alt: Alternative text\n    caption: Caption\n  - image: image-2.jpg\n    alt: Alternative text\n    caption: Caption',
	'card-list': 'layout: image-top\nflow: grid\nsize: s\nitems:\n  - title: Card title\n    text: Card text\n    image: filename.jpg\n    link: /destination/',
	'page-list': '',
};

async function runWidgetConstructions({ openDocument, waitFor, getCompletions }) {
	const results = [];
	const markdownPath = 'site/pages/120-widget/content.md';
	const { extractNornaMarkdownBlockDiagnostics, nornaBlockTypes } = await import(pathToFileURL(
		path.join(process.env.NORNA_EDITOR_TEST_ENGINE_ROOT, 'scripts/lib/norna-markdown-blocks.mjs'),
	));
	assert.deepEqual([...nornaBlockTypes].sort(), blockNames, 'Update widget coverage for the engine block vocabulary.');
	const browser = await chromium.connectOverCDP(process.env.NORNA_EDITOR_TEST_INSPECTOR);
	try {
		const window = await waitFor(async () => {
			for (const page of browser.contexts().flatMap((context) => context.pages())) {
				if (await page.locator('.monaco-workbench').count()) return page;
			}
			return null;
		}, Boolean, 'The isolated VS Code workbench did not appear.');
		const widget = window.locator('.suggest-widget.visible');
		const settings = vscode.workspace.getConfiguration('editor');
		// This suite exercises manual discovery, not asynchronous automatic triggers.
		await settings.update('quickSuggestions', false, vscode.ConfigurationTarget.Workspace);
		await settings.update('suggestOnTriggerCharacters', false, vscode.ConfigurationTarget.Workspace);
		// VS Code 1.96's sticky editor headings can retain removed line numbers
		// while this fixture replaces a whole document between cases.
		await settings.update('stickyScroll.enabled', false, vscode.ConfigurationTarget.Workspace);
		if (process.env.NORNA_EDITOR_TEST_SUITE === 'priority') {
			await require('./widget-priority.cjs').runWidgetPriority({ window, widget, openDocument, waitFor, getCompletions });
			return;
		}

		// Select by moving in the real widget, never by passing a provider item to
		// insertSnippet. Each accepted result must match an independent source fixture.
		const accept = async (name, source, expected, label, relativePath = markdownPath, inspect = null) => {
			await vscode.commands.executeCommand('hideSuggestWidget');
			await vscode.commands.executeCommand('leaveSnippet');
			const document = await openDocument(relativePath);
			const editor = vscode.window.activeTextEditor;
			const cursor = source.indexOf('|CURSOR|');
			assert.notEqual(cursor, -1, name);
			const initial = source.replace('|CURSOR|', '');
			await editor.edit((edit) => edit.replace(new vscode.Range(
				document.positionAt(0), document.positionAt(document.getText().length),
			), initial));
			const position = document.positionAt(cursor);
			editor.selection = new vscode.Selection(position, position);
			await waitFor(() => getCompletions(document, position.line, position.character),
				(items) => items.some((item) => (typeof item.label === 'string' ? item.label : item.label.label) === label),
				`${name}: provider did not become ready after the document edit.`);
			await vscode.commands.executeCommand('editor.action.triggerSuggest');
			await widget.locator('.monaco-list-row').first().waitFor({ state: 'visible', timeout: 10000 });
			await vscode.commands.executeCommand('selectFirstSuggestion');
			if (inspect) await inspect();
			const visited = new Set();
			for (let attempt = 0; ; attempt++) {
				const focused = widget.locator('.monaco-list-row.focused .label-name').first();
				await focused.waitFor({ state: 'visible' });
				const selected = await focused.innerText();
				if (selected === label) break;
				assert.ok(attempt < 100, `${name}: ${label} is not selectable; saw ${[...visited].join(', ')}.`);
				visited.add(selected);
				await vscode.commands.executeCommand('selectNextSuggestion');
				await new Promise((resolve) => setTimeout(resolve, 100));
			}
			// Resolve the label again at click time: a slower YAML provider may have
			// updated the list since keyboard navigation selected this row.
			const kind = callouts.includes(label) ? 'enum-member' : 'snippet';
			const rows = label.endsWith('.svg') ? widget.locator('.monaco-list-row') : widget.locator('.monaco-list-row').filter({
				has: window.locator(`.codicon-symbol-${kind}`),
			});
			const row = rows.filter({ has: window.locator('.label-name').getByText(label, { exact: true }) });
			try {
				await row.click({ timeout: 5000 });
			} catch (error) {
				// Accepting an item removes the widget; older Electron versions can
				// report detachment after the click has already inserted the text.
				if (document.getText() !== expected) {
					await window.screenshot({ path: path.join(process.env.NORNA_EDITOR_TEST_WORKSPACE, '..', 'widget-constructions-failure.png') });
					throw error;
				}
			}
			await waitFor(() => document.getText(), (text) => text !== initial, `${name}: no insertion through the suggestion widget.`);
			assert.equal(document.getText(), expected, `${name}: widget selected the wrong item or changed surrounding text.`);
			await vscode.commands.executeCommand('hideSuggestWidget');
			await vscode.commands.executeCommand('leaveSnippet');
			assert.ok(await document.save(), name);
			assert.equal(fs.readFileSync(document.uri.fsPath, 'utf8'), expected, `${name}: save changed inserted source.`);
			results.push({ name, status: 'passed' });
			console.log(`PASS widget: ${name}`);
			return document;
		};

		const usagePath = 'usage-site/pages/000-home/content.md';
		for (const type of ['image-stack', 'image-carousel', 'card-list']) {
			for (const filename of ['z-unused.svg', 'a-used.svg', 'y-other.svg', 'b-used.svg']) {
				const source = `# Image usage\n\n\`\`\`${type}\nitems:\n  - image: a-used.svg\n  - image: b-used.svg\n  - image: |CURSOR|\n\`\`\`\n`;
				await accept(`${type}: choose ${filename} with usage badge`, source,
					source.replace('|CURSOR|', filename), filename, usagePath, async () => {
					const rows = await waitFor(() => widget.locator('.monaco-list-row').evaluateAll((elements) => elements
						.map((element) => ({ index: Number(element.getAttribute('data-index')), text: element.textContent, label: element.querySelector('.label-name')?.textContent }))
						.filter(({ label }) => ['z-unused.svg', 'a-used.svg', 'y-other.svg', 'b-used.svg'].includes(label))
						.sort((a, b) => a.index - b.index)), (rows) => rows.length === 4, 'Image suggestions did not appear.');
					assert.deepEqual(rows.map(({ label }) => label), ['z-unused.svg', 'a-used.svg', 'y-other.svg', 'b-used.svg']);
					for (const [index, row] of rows.entries()) {
						assert.ok(row.text.includes(index % 2 ? 'Already used on this page' : 'Unused on this page'), row.text);
					}
				});
			}
		}

		// Match the Examples-page context: a live image followed by a literal sample.
		const before = '# Widget checks\n\n```image-stack\nitems:\n  - image: local.svg\n```\n\n````md\n```image-stack\nitems:\n  - image: local.svg\n```\n````\n\n';
		const after = '\n\nSurrounding text must remain unchanged.\n';
		for (const name of blockNames) {
			const snippet = `\`\`\`${name}\n${bodies[name] ? `${bodies[name]}\n` : ''}\`\`\``;
			for (const [entry, prefix] of [
				['blank line', ''], ['backticks', '```'], ['tildes', '~~~'],
				['partial name', `\`\`\`${name.slice(0, -1)}`],
			]) {
				const document = await accept(`${name}: ${entry}`, `${before}${prefix}|CURSOR|${after}`, `${before}${snippet}${after}`, name);
				assert.equal(extractNornaMarkdownBlockDiagnostics(document.getText()).errors.length, 0, `${name}: inserted block is invalid.`);
			}
		}
		for (const type of callouts) {
			const snippet = `> [!${type}]\n> Callout text`;
			for (const [entry, prefix] of [
				['blank line', ''], ['alert prefix', '> [!'], ['partial type', `> [!${type.slice(0, -1)}`],
			]) await accept(`${type}: ${entry}`, `${before}${prefix}|CURSOR|${after}`, `${before}${snippet}${after}`, type);
		}
		for (const type of ['image-stack', 'image-carousel', 'card-list']) {
			const card = type === 'card-list';
			const entry = card ? 'title: Existing\n    text: Keep this text.' : 'image: local.svg\n    alt: Existing text\n    caption: Existing caption';
			const added = card
				? '  - title: Card title\n    text: Card text\n    image: filename.jpg\n    link: /destination/'
				: '  - image: filename.jpg\n    alt: Alternative text\n    caption: Caption';
			const start = `# Widget checks\n\n\`\`\`${type}\nitems:\n  - ${entry}\n`;
			for (const indent of ['', '  ', '    ']) {
				await accept(`${type}: add entry at ${indent.length}-space indent`, `${start}${indent}|CURSOR|\n\`\`\``, `${start}${added}\n\`\`\``, card ? 'Add card' : 'Add image');
			}
			await accept(`${type}: add first entry`, `# Widget checks\n\n\`\`\`${type}\nitems:\n|CURSOR|\n\`\`\``, `# Widget checks\n\n\`\`\`${type}\nitems:\n${added}\n\`\`\``, card ? 'Add card' : 'Add image');
		}
		await accept('Image entry between existing entries', '# Widget checks\n\n```image-stack\nitems:\n  - image: first.svg\n|CURSOR|\n  - image: second.svg\n```',
			'# Widget checks\n\n```image-stack\nitems:\n  - image: first.svg\n  - image: filename.jpg\n    alt: Alternative text\n    caption: Caption\n  - image: second.svg\n```', 'Add image');
		await accept('Image entry with four-space list indentation', '# Widget checks\n\n```image-stack\nitems:\n    - image: first.svg\n|CURSOR|\n```',
			'# Widget checks\n\n```image-stack\nitems:\n    - image: first.svg\n    - image: filename.jpg\n      alt: Alternative text\n      caption: Caption\n```', 'Add image');
		for (const prefix of ['[^', '[^margin:']) {
			await accept(`Sidenote reference: ${prefix}`, `# Widget checks\n\nText.${prefix}|CURSOR|`, '# Widget checks\n\nText.[^margin:name]', '[^margin:name]');
			await accept(`Sidenote definition: ${prefix}`, `# Widget checks\n\n${prefix}|CURSOR|`, '# Widget checks\n\n[^margin:name]: Explanatory text', '[^margin:name]: ...');
		}
		await accept('Empty content page', '|CURSOR|', '---\npage:\n  description: Short page description.\n---\n\n# Page title\n\n## Introduction {#introduction}\n\n', 'Norna content page');

		// Separate YAML files leave project discovery for the Markdown fixture intact.
		for (const [kind, filename, body] of [
			['config', 'config.yaml', 'url: https://example.com/\n'],
			['theme', 'theme.yaml', 'preset: portfolio\n'],
			['sitewideContent', 'sitewide-content.yaml', 'footer:\n  copyrightMessage: Copyright owner.\n'],
			['category', 'pages/010-category/category.yaml', 'label: Category label\n'],
		]) {
			const relativePath = `widget-site/${filename}`;
			const schemaFile = { config: 'config', theme: 'theme', sitewideContent: 'sitewide-content', category: 'category' }[kind];
			let schemaPath = path.relative(path.dirname(path.join(process.env.NORNA_EDITOR_TEST_WORKSPACE, relativePath)),
				path.join(process.env.NORNA_EDITOR_TEST_ENGINE_ROOT, 'schemas', `${schemaFile}.schema.json`)).split(path.sep).join('/');
			if (!schemaPath.startsWith('.')) schemaPath = `./${schemaPath}`;
			const label = { config: 'Norna site configuration', theme: 'Norna theme', sitewideContent: 'Norna site-wide content', category: 'Norna page category' }[kind];
			await accept(`Empty ${filename}`, '|CURSOR|', `# yaml-language-server: $schema=${schemaPath}\n\n${body}`, label, relativePath);
		}

		// Explicit coverage gaps, not successful widget tests. Changes here should
		// promote the feature to an acceptance case rather than silently ignoring it.
		results.push(...await require('./widget-priority.cjs').runWidgetPriority({ window, widget, openDocument, waitFor, getCompletions }));
		const gaps = [
			{ name: 'Tabs', source: '# Widget checks\n\n:::: ta', label: 'tabs' },
			{ name: 'Code title', source: '# Widget checks\n\n```js title=', label: 'title' },
			{ name: 'Code line emphasis', source: '# Widget checks\n\n```js {', label: 'line emphasis' },
		];
		for (const gap of gaps) {
			const document = await openDocument(markdownPath);
			await vscode.window.activeTextEditor.edit((edit) => edit.replace(new vscode.Range(document.positionAt(0), document.positionAt(document.getText().length)), gap.source));
			const items = (await getCompletions(document, document.lineCount - 1)).filter(isNorna);
			assert.ok(!items.some((item) => (typeof item.label === 'string' ? item.label : item.label.label) === gap.label), `${gap.name}: support appeared; replace the gap with a widget acceptance test.`);
			results.push({ name: gap.name, status: 'not implemented', reason: 'No Norna completion provider for this construction.' });
			console.log(`GAP: ${gap.name} has no Norna completion.`);
		}
		fs.writeFileSync(path.join(process.env.NORNA_EDITOR_TEST_WORKSPACE, '..', `widget-constructions-${vscode.version}.json`), JSON.stringify({
			runAt: new Date().toISOString(),
			vscodeVersion: vscode.version,
			extensionVersion: process.env.NORNA_EDITOR_TEST_EXTENSION_VERSION,
			extensionBundleSha256: createHash('sha256').update(fs.readFileSync(path.join(
				vscode.extensions.getExtension('janga.norna-vscode').extensionPath, 'dist/extension.cjs',
			))).digest('hex'),
			results,
		}, null, 2));
	} finally {
		await browser.close();
	}
}

module.exports = { runWidgetConstructions };
