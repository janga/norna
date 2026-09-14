const assert = require('node:assert/strict');
const vscode = require('vscode');

const labelOf = (item) => typeof item.label === 'string' ? item.label : item.label.label;
const blockNames = ['card-list', 'image-carousel', 'image-stack', 'page-list'];
// The public API does not expose a provider ID. Use Norna's documentation and
// known snippet signatures, not only labels that happen to start with Norna.
const isNorna = (item) => {
	const documentation = typeof item.documentation === 'string' ? item.documentation : item.documentation?.value ?? '';
	return /github\.com\/janga\/norna\//.test(documentation)
		|| /^Norna\b/.test(item.detail ?? '')
		|| /^Norna\b/.test(labelOf(item))
		|| (item.kind === vscode.CompletionItemKind.Snippet && blockNames.includes(labelOf(item)));
};

async function runCompletionRelevance({ openDocument, getCompletions }) {
	const defaultPath = 'site/pages/110-context/content.md';
	const setSource = async (relativePath, source) => {
		const marker = source.indexOf('|CURSOR|');
		assert.notEqual(marker, -1);
		const document = await openDocument(relativePath);
		const editor = vscode.window.activeTextEditor;
		await editor.edit((edit) => edit.replace(new vscode.Range(
			document.positionAt(0), document.positionAt(document.getText().length),
		), source.replace('|CURSOR|', '')));
		const position = document.positionAt(marker);
		editor.selection = new vscode.Selection(position, position);
		return { document, position };
	};
	const read = async ({ document, position }) => (await getCompletions(document, position.line, position.character)).filter(isNorna);
	const check = async (name, source, expected, relativePath = defaultPath) => {
		const context = await setSource(relativePath, source);
		const items = await read(context);
		assert.deepEqual(items.map(labelOf).sort(), [...expected].sort(), `${name}: missing, irrelevant, or duplicate Norna completions.`);
		return context;
	};

	for (const fence of ['```', '~~~']) {
		await check('Opening fence', `# Context\n\n${fence}|CURSOR|`, blockNames);
		await check('Closing fence', `# Context\n\n${fence}image-stack\nitems:\n  - image: a.svg\n${fence}|CURSOR|`, []);
		await check('Outer Markdown example', `# Context\n\n\`\`\`\`md\n${fence}|CURSOR|\n\`\`\`\``, []);
		await check('HTML comment', `# Context\n\n<!--\n${fence}|CURSOR|\n-->`, []);
		await check('Indented code', `# Context\n\n    ${fence}|CURSOR|`, []);
		await check('Recovery after literal example', `# Context\n\n\`\`\`\`md\n${fence}\n\`\`\`\`\n\n${fence}|CURSOR|`, blockNames);
	}
	await check('A fence with an info string does not close ordinary code', '# Context\n\n```md\n```example\n> [!|CURSOR|\n```', []);
	await check('Ordinary prose', '# Context\n\nNormal text |CURSOR|', []);
	const blankCandidates = [...blockNames, 'NOTE', 'TIP', 'IMPORTANT', 'WARNING', 'CAUTION', 'DANGER'];
	await check('Blank body line', '# Context\n\n|CURSOR|', blankCandidates);
	await check('Blank line after literal example', '# Context\n\n````md\n```image-stack\nitems:\n  - image: a.svg\n```\n````\n\n|CURSOR|\n\nFollowing text.', blankCandidates);
	await check('Blank ordinary Markdown', '# Context\n\n|CURSOR|', [], 'site/notes.md');
	for (const source of [
		'# Context\n\n```md\n|CURSOR|\n```',
		'# Context\n\n<!--\n|CURSOR|\n-->',
		'# Context\n\n    |CURSOR|',
		'# Context\n\n- Item\n\n  |CURSOR|\n  More',
		'# Context\n\n:::: tabs\n::: tab "One"\n\n|CURSOR|\n:::\n::::',
	]) await check('No top-level snippets in nested or literal blank lines', source, []);
	for (const line of ['    ```|CURSOR|', '    [^margin:|CURSOR|', '    page|CURSOR|', '    |CURSOR|']) {
		const context = await setSource(defaultPath, `---\npage:\n  description: |-\n${line}\n---\n# Context`);
		assert.deepEqual((await read(context)).map(labelOf), [], 'Frontmatter text must not receive structure suggestions.');
	}
	await check('Page metadata stays in its own map', '---\npage:\n  description: Text\n  |CURSOR|\nnavigation:\n  listed: true\n---\n# Context', ['aliases']);
	await check('Root frontmatter omits existing page', '---\npage:\n  description: Text\n|CURSOR|\n---\n# Context', ['navigation']);
	await check('Navigation metadata stays in its own map', '---\npage:\n  description: Text\nnavigation:\n  |CURSOR|\n---\n# Context', ['listed']);
	await check('Inline code', '# Context\n\nUse `[^margin:|CURSOR|` literally.', []);
	await check('Comment note', '# Context\n\n<!-- [^margin:|CURSOR| -->', []);
	await check('Comment callout', '# Context\n\n<!--\n> [!|CURSOR|\n-->', []);
	await check('Literal callout', '# Context\n\n````md\n> [!|CURSOR|\n````', []);
	await check('Literal note', '# Context\n\n```md\n[^margin:|CURSOR|\n```', []);
	for (const prefix of ['# Heading ', '> Quoted ', '- Listed ']) {
		await check('Note forbidden in this context', `${prefix}[^margin:|CURSOR|`, []);
	}
	await check('Tab note forbidden', '# Context\n\n:::: tabs\n::: tab "One"\n\nText.[^margin:|CURSOR|\n:::\n::::', []);
	await check('Table note forbidden', '# Context\n\n| Header |\n| --- |\n| [^margin:|CURSOR| |', []);
	await check('Body note excludes definition', '# Context\n\nText.[^margin:|CURSOR|', ['[^margin:name]']);
	await check('Top-level note definitions', '# Context\n\n[^margin:|CURSOR|', ['[^margin:name]', '[^margin:name]: ...']);
	await check('Closed callout vocabulary', '# Context\n\n> [!|CURSOR|', ['NOTE', 'TIP', 'IMPORTANT', 'WARNING', 'CAUTION', 'DANGER']);
	await check('Callouts recover after a literal fence with an info string', '# Context\n\n```md\n```example\n```\n\n> [!|CURSOR|', ['NOTE', 'TIP', 'IMPORTANT', 'WARNING', 'CAUTION', 'DANGER']);

	for (const block of ['image-stack', 'image-carousel', 'card-list', 'page-list']) {
		const card = block === 'card-list';
		await check(`${block} root`, `# Context\n\n\`\`\`${block}\n|CURSOR|\n\`\`\``,
			card ? ['items', 'layout', 'flow', 'size', 'width'] : block === 'page-list' ? [] : ['items']);
		if (block === 'page-list') continue;
		await check(`${block} item`, `# Context\n\n\`\`\`${block}\nitems:\n  - |CURSOR|\n\`\`\``,
			card ? ['title', 'text', 'image', 'link', 'badge-text'] : ['image', 'alt', 'caption']);
	}
	await check('Existing fields omitted', '# Context\n\n```image-stack\nitems:\n  - image: a.svg\n    alt: Description\n    |CURSOR|\n```', ['caption', 'Add image']);
	await check('Fully specified item', '# Context\n\n```image-stack\nitems:\n  - image: a.svg\n    alt: Description\n    caption: Caption\n    |CURSOR|\n```', ['Add image']);
	await check('YAML comment', '# Context\n\n```card-list\nitems:\n  - title: Card\n    # |CURSOR|\n```', []);
	for (const scalar of ['|-', '>-']) {
		await check('YAML multiline text', `# Context\n\n\`\`\`card-list\nitems:\n  - title: Card\n    text: ${scalar}\n      image: |CURSOR|\n\`\`\``, []);
	}
	for (const [key, values] of [
		['layout', ['image-top', 'image-left', 'image-right']], ['flow', ['grid', 'stack']],
		['size', ['s', 'm', 'l', 'xl']], ['width', ['text', 'narrow', 'normal', 'wide']],
	]) await check(`Exact ${key} values`, `# Context\n\n\`\`\`card-list\nitems:\n  - title: Card\n${key}: |CURSOR|\n\`\`\``, values);
	await check('Ordinary YAML code block', '# Context\n\n```yaml\nitems:\n  - |CURSOR|\n```', []);

	const markerSource = '# Context\n\n```|CURSOR|';
	const active = await check('Active project before switch', markerSource, blockNames);
	await check('Ordinary Markdown outside page structure', markerSource, [], 'site/notes.md');
	await check('Other project with old editor API', markerSource, [], 'incompatible/site/pages/000-home/content.md');
	await check('Another compatible project', markerSource, blockNames, 'second/site/pages/000-home/content.md');
	await vscode.window.showTextDocument(active.document);
	assert.deepEqual((await read(active)).map(labelOf).sort(), blockNames);
	const imageSource = '# Context\n\n```image-stack\nitems:\n  - image: |CURSOR|\n```';
	await check('Image candidates stay in their own site', imageSource, ['second-only.svg'], 'second/site/pages/000-home/content.md');
	const ownImages = await setSource(defaultPath, imageSource);
	assert.ok(!(await read(ownImages)).some((item) => labelOf(item) === 'second-only.svg'), 'A foreign project image leaked into the original site.');

	const positions = await setSource(defaultPath, '# Context\n\n````md\n```\n````\n\n```|CURSOR|');
	assert.deepEqual((await read(positions)).map(labelOf).sort(), blockNames);
	positions.position = new vscode.Position(3, 3);
	vscode.window.activeTextEditor.selection = new vscode.Selection(positions.position, positions.position);
	assert.deepEqual((await read(positions)).map(labelOf), [], 'Cursor movement retained active snippets inside an example.');
	await positions.document.save();
	await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
	positions.document = await openDocument(defaultPath);
	assert.deepEqual((await read(positions)).map(labelOf), [], 'Reopening retained active snippets inside an example.');
	console.log('PASS completion relevance: exact candidate sets, literal contexts, ownership, cursor/file/project changes, and reopening.');
}

module.exports = { runCompletionRelevance, isNorna };
