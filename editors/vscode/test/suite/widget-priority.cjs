const assert = require('node:assert/strict');
const vscode = require('vscode');

const labelOf = (item) => typeof item.label === 'string' ? item.label : item.label.label;
const isPrioritized = (item) => item.sortText?.startsWith('0000-norna-');
const genericLabel = 'AAA generic suggestion';
const blocks = ['card-list', 'image-carousel', 'image-stack', 'page-list'];
const constructors = [...blocks, 'NOTE', 'TIP', 'IMPORTANT', 'WARNING', 'CAUTION', 'DANGER'];

async function runWidgetPriority({ window, widget, openDocument, waitFor, getCompletions }) {
	const results = [];
	const settings = vscode.workspace.getConfiguration('editor');
	const originalPlacement = settings.inspect('snippetSuggestions').workspaceValue;
	let target;
	// A deterministic, equally matching competitor makes ranking observable even
	// when the installed language service has nothing to suggest on a blank line.
	const competitor = vscode.languages.registerCompletionItemProvider([
		{ language: 'markdown', scheme: 'file' }, { language: 'yaml', scheme: 'file' },
	], {
		provideCompletionItems(document, position) {
			if (document.uri.toString() !== target?.document.uri.toString() || !position.isEqual(target.position)) return [];
			const item = new vscode.CompletionItem(genericLabel, vscode.CompletionItemKind.Text);
			item.sortText = '0010-generic';
			item.range = target.reference?.range ?? new vscode.Range(position, position);
			if (target.reference) item.filterText = target.reference.filterText ?? labelOf(target.reference);
			item.insertText = 'generic';
			return [item];
		},
	});
	const setSource = async (source, relativePath = 'site/pages/120-widget/content.md') => {
		await vscode.commands.executeCommand('hideSuggestWidget');
		await vscode.commands.executeCommand('leaveSnippet');
		const document = await openDocument(relativePath);
		const editor = vscode.window.activeTextEditor;
		const cursor = source.indexOf('|CURSOR|');
		assert.ok(cursor >= 0);
		await editor.edit((edit) => edit.replace(new vscode.Range(
			document.positionAt(0), document.positionAt(document.getText().length),
		), source.replace('|CURSOR|', '')));
		const position = document.positionAt(cursor);
		editor.selection = new vscode.Selection(position, position);
		target = { document, position };
		return document;
	};
	const read = () => getCompletions(target.document, target.position.line, target.position.character);
	const openWidget = async () => {
		await vscode.commands.executeCommand('editor.action.triggerSuggest');
		await widget.locator('.monaco-list-row').first().waitFor({ state: 'visible', timeout: 10000 });
		await vscode.commands.executeCommand('selectFirstSuggestion');
		await waitFor(() => widget.locator('.monaco-list-row.focused').first().getAttribute('data-index'),
			(index) => index === '0', 'The widget did not select its first row.');
	};
	const selectedLabel = () => widget.locator('.monaco-list-row.focused .label-name').first().innerText();
	const check = async (name, source, expected, relativePath, inserted) => {
		const document = await setSource(source, relativePath);
		const items = await waitFor(read, (items) => items.some((item) => labelOf(item) === genericLabel)
			&& expected.every((label) => items.some((item) => labelOf(item) === label && isPrioritized(item))), `${name}: expected providers did not respond.`);
		assert.equal(items.find((item) => labelOf(item) === genericLabel).sortText, '0010-generic');
		// Use the same replacement range and matching text as the Norna item:
		// differences in prefix matching must not be mistaken for sort priority.
		target.reference = items.find((item) => labelOf(item) === expected[0] && isPrioritized(item));
		if (!expected.length) assert.deepEqual(items.filter(isPrioritized), [], `${name}: priority leaked outside Norna context.`);
		await openWidget();
		// Read rendered row positions together. Arrow-key traversal can restart
		// when another provider updates the list; it is not a stable ranking sample.
		const rows = await waitFor(() => widget.locator('.monaco-list-row').evaluateAll((rows) => rows.map((row) => ({
			index: Number(row.getAttribute('data-index')), label: row.querySelector('.label-name')?.textContent,
		})).sort((a, b) => a.index - b.index)), (rows) => rows[0]?.index === 0
			&& rows.some((row) => row.label === genericLabel)
			&& rows.length >= expected.length + 1, `${name}: competing items did not appear in the visible widget.`);
		const labels = rows.slice(0, Math.max(1, expected.length)).map((row) => row.label);
		assert.deepEqual([...labels].sort(), expected.length ? [...expected].sort() : [genericLabel], `${name}: incorrect visible ranking.`);
		if (inserted !== undefined) {
			await vscode.commands.executeCommand('selectFirstSuggestion');
			await vscode.commands.executeCommand('acceptSelectedSuggestion');
			await waitFor(() => document.getText(), (text) => text === inserted, `${name}: ranked suggestion did not insert expected source.`);
			await vscode.commands.executeCommand('leaveSnippet');
			assert.ok(await document.save());
			assert.equal(document.getText(), inserted);
		}
		results.push({ name, status: 'passed' });
		console.log(`PASS priority: ${name}`);
	};
	try {
		await settings.update('snippetSuggestions', 'inline', vscode.ConfigurationTarget.Workspace);
		await check('Blank Norna body', '# Priority\n\n|CURSOR|', constructors);
		await check('Image item fields', '# Priority\n\n```image-stack\nitems:\n  - image: local.svg\n    |CURSOR|\n```', ['alt', 'caption', 'Add image'], undefined,
			'# Priority\n\n```image-stack\nitems:\n  - image: local.svg\n    alt: value\n```');
		await check('Card layout values', '# Priority\n\n```card-list\nlayout: |CURSOR|\n```', ['image-top', 'image-left', 'image-right'], undefined,
			'# Priority\n\n```card-list\nlayout: image-top\n```');
		await check('Frontmatter fields', '---\npage:\n  |CURSOR|\n---\n# Priority', ['description', 'aliases']);
		await check('Example site discovery', '# Priority\n\n|CURSOR|', constructors,
			'examples/complete-sites/priority/site/pages/000-home/content.md');
		await check('Second project images', '# Priority\n\n```image-stack\nitems:\n  - image: |CURSOR|\n```', ['second-only.svg'], 'second/site/pages/000-home/content.md',
			'# Priority\n\n```image-stack\nitems:\n  - image: second-only.svg\n```');
		await check('YAML banner template', 'banners:\n  - |CURSOR|\n', ['Norna: Warning banner'], 'widget-site/sitewide-content.yaml',
			'banners:\n  - id: project-status\n    tone: warning\n    title: Important notice\n    text: Brief explanation.\n');
		for (const [name, source, relativePath] of [
			['Adjacent Markdown', '# Ordinary\n\n|CURSOR|', 'site/notes.md'],
			['Unrecognized content.md', '# Ordinary\n\n|CURSOR|', 'ordinary/content.md'],
			['Adjacent YAML', '|CURSOR|', 'site/settings.yaml'],
			['Unrecognized theme.yaml', '|CURSOR|', 'ordinary/theme.yaml'],
			['Incompatible project', '# Priority\n\n|CURSOR|', 'incompatible/site/pages/000-home/content.md'],
			['Literal YAML', '# Priority\n\n```yaml\n|CURSOR|\n```'],
			['Literal JavaScript', '# Priority\n\n```js\n|CURSOR|\n```'],
			['Literal Markdown example', '# Priority\n\n````md\n|CURSOR|\n````'],
		]) await check(name, source, [], relativePath);
		await check('Return to Norna', '# Priority\n\n|CURSOR|', constructors);
		// Explicit user placement must still override Norna's sort preference.
		await settings.update('snippetSuggestions', 'bottom', vscode.ConfigurationTarget.Workspace);
		await setSource('|CURSOR|');
		assert.ok((await read()).some((item) => labelOf(item) === 'Norna content page'
			&& item.kind === vscode.CompletionItemKind.Snippet && isPrioritized(item)));
		await openWidget();
		assert.equal(await selectedLabel(), genericLabel, 'Snippet placement preference was overridden.');
		results.push({ name: 'User snippet placement respected', status: 'passed' });
		console.log('PASS priority: user snippet placement respected.');
	} catch (error) {
		console.error('Priority widget state:', await widget.locator('.monaco-list-row').evaluateAll((rows) => rows.map((row) => ({
			index: row.getAttribute('data-index'), label: row.querySelector('.label-name')?.textContent, focused: row.classList.contains('focused'),
		}))));
		throw error;
	} finally {
		competitor.dispose();
		await vscode.commands.executeCommand('hideSuggestWidget');
		await settings.update('snippetSuggestions', originalPlacement, vscode.ConfigurationTarget.Workspace);
	}
	return results;
}

module.exports = { runWidgetPriority };
