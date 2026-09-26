const path = require('node:path');

const describeLinks = (usage) => {
	const count = new Set(usage.references.map(({ sourcePath }) => sourcePath)).size;
	return [
		usage.references.length ? `${usage.references.length} internal link(s) from ${count} page(s).`
			: usage.incomplete.length ? 'No links found in the pages that could be checked.' : 'No authored internal links found.',
		'Includes unsaved page content. External URLs and raw HTML are not checked.',
		...(usage.incomplete.length ? ['The check is incomplete:', ...usage.incomplete] : []),
	].join('\n');
};

const showLinks = async (vscode, usage, siteRoot, title) => {
	const selected = await vscode.window.showQuickPick([
		...usage.references.map((reference) => ({ label: reference.title ?? path.basename(reference.sourcePath),
			description: `${path.relative(siteRoot, reference.sourcePath)}:${reference.line}`, detail: reference.text, reference })),
		...usage.incomplete.map((message) => ({ label: '$(warning) Not fully checked', detail: message })),
		...(!usage.references.length && !usage.incomplete.length ? [{ label: 'No authored internal links found' }] : []),
	], { title, placeHolder: 'Select a link to open its source. External URLs and raw HTML are not checked.', matchOnDescription: true, matchOnDetail: true, ignoreFocusOut: true });
	if (!selected?.reference) return;
	const { sourcePath, line, column = 1 } = selected.reference;
	const document = await vscode.workspace.openTextDocument(vscode.Uri.file(sourcePath));
	const position = new vscode.Position(Math.max(0, line - 1), Math.max(0, column - 1));
	await vscode.window.showTextDocument(document, { preview: false, selection: new vscode.Range(position, position) });
};

module.exports = { describeLinks, showLinks };
