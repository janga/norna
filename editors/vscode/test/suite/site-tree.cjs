const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');
const vscode = require('vscode');
const { chromium } = require('@playwright/test');

async function runSiteTree({ openDocument, waitFor }) {
	const root = process.env.NORNA_EDITOR_TEST_WORKSPACE;
	const browser = await chromium.connectOverCDP(process.env.NORNA_EDITOR_TEST_INSPECTOR);
	let window;
	const results = [];
	const passed = (name) => { results.push(name); console.log(`PASS site tree: ${name}`); };
	try {
		window = await waitFor(async () => {
			for (const page of browser.contexts().flatMap((context) => context.pages())) if (await page.locator('.monaco-workbench').count()) return page;
			return null;
		}, Boolean, 'The isolated VS Code workbench did not appear.');
		window.setDefaultTimeout(10_000);
		if (process.env.NORNA_EDITOR_TEST_PRETTIER === 'true') {
			const prettier = vscode.extensions.getExtension('esbenp.prettier-vscode');
			assert.ok(prettier, 'Formatter coexistence requires real Prettier.');
			await prettier.activate();
			const probe = await openDocument('formatter-probe.md');
			await vscode.commands.executeCommand('editor.action.formatDocument');
			await waitFor(() => probe.getText(), (source) => source === '# Probe\n\n**bold** text\n', 'Prettier did not format the probe.');
			console.log(`Formatter coexistence: Prettier ${prettier.packageJSON.version} formatted the probe; Markdown save formatting scoped off.`);
		}
		const quick = window.locator('.quick-input-widget');
		const pick = async (label) => {
			await quick.locator('.quick-input-list .monaco-list-row').filter({ has: window.locator('.label-name').getByText(label, { exact: true }) }).click();
		};
		const chooseSite = async (title) => {
			const choosing = vscode.commands.executeCommand('nornaEditor.chooseSite');
			await quick.waitFor({ state: 'visible' });
			await pick(title);
			await choosing;
		};
		await openDocument('tree-content/pages/010-guide/content.md');
		await vscode.commands.executeCommand('nornaSiteTree.focus');
		await chooseSite('Tree Home');
		await waitFor(() => window.locator('.monaco-list-row').allTextContents(), (texts) => texts.some((text) => text.includes('Tree Guide')), 'The site tree did not reveal the active page.');
		const tree = window.getByRole('tree', { name: 'Site Tree', exact: true });
		await vscode.commands.executeCommand('notifications.clearAll');
		const row = (title) => tree.locator('.monaco-list-row').filter({ has: window.getByText(title, { exact: true }) });
		const sourceRow = (relative) => tree.locator(`.monaco-list-row[aria-label*=${JSON.stringify(path.join(root, relative))}]`)
			.filter({ has: window.getByText(path.basename(relative), { exact: true }) });
		const expandDirectory = async (relative) => {
			const item = sourceRow(relative);
			await item.waitFor({ state: 'visible' });
			if (await item.getAttribute('aria-expanded') === 'false') await item.locator('.monaco-tl-twistie').click();
		};
		const input = async (value, prompt, accept = true) => {
			await waitFor(() => quick.locator('.quick-input-message').allTextContents(), (texts) => texts.some((text) => text.includes(prompt)), `Missing input prompt: ${prompt}`);
			await quick.locator('.quick-input-box input').fill(value);
			if (accept) await quick.locator('.quick-input-box input').press('Enter');
		};
		const contextAction = async (title, action) => {
			await window.bringToFront();
			if (vscode.workspace.getConfiguration('window').inspect('menuStyle')?.defaultValue !== undefined) {
				await row(title).click({ button: 'right' });
				const menuItem = window.getByRole('menuitem', { name: new RegExp(action) });
				const position = Number(await menuItem.getAttribute('aria-posinset'));
				await window.keyboard.press('Home');
				for (let index = 1; index < position; index++) await window.keyboard.press('ArrowDown');
				await window.keyboard.press('Enter');
				await menuItem.waitFor({ state: 'hidden' });
			} else {
				const filename = (await row(title).getAttribute('aria-label')).split('\n').find((line) => line.startsWith(root));
				await row(title).getByText(title, { exact: true }).click();
				await waitFor(() => vscode.window.activeTextEditor?.document.uri.fsPath, (actual) => actual === filename, 'The command target source did not open.');
				await waitFor(() => window.evaluate(() => Boolean(document.activeElement?.closest('.monaco-editor'))), Boolean, 'Source opening did not finish transferring focus to the editor.');
				await waitFor(() => row(title).getAttribute('aria-selected'), (value) => value === 'true', 'The command target was not selected.');
				await vscode.commands.executeCommand('workbench.action.showCommands');
				await quick.locator('.quick-input-box input').fill(`>Norna: ${action}`);
				await quick.locator('.quick-input-list .monaco-list-row').filter({ hasText: `Norna: ${action}` }).first().click();
			}
			await waitFor(async () => await quick.isVisible() ? await quick.locator('.quick-input-title').textContent() : '',
				(text) => action === 'Page Information' ? text.startsWith('Page Information:') : text.startsWith(action === 'New Page' ? 'New page' : 'New category'),
				`The ${action} dialog did not open.`);
		};
		const activeIs = (relative) => waitFor(() => vscode.window.activeTextEditor?.document.uri.fsPath, (filename) => filename === path.join(root, relative), `Wrong source opened: ${relative}`);
		const guidePath = 'tree-content/pages/010-guide/content.md';
		const topicPath = 'tree-content/pages/020-topics/category.yaml';
		await sourceRow('tree-content/content.md').click();
		await activeIs('tree-content/content.md');
		await sourceRow('tree-content/theme.yaml').click();
		await activeIs('tree-content/theme.yaml');
		await expandDirectory('tree-content/site-config');
		for (const filename of ['settings.yaml', 'site-theme.yaml']) {
			await sourceRow(`tree-content/site-config/${filename}`).click();
			await activeIs(`tree-content/site-config/${filename}`);
		}
		passed('Homepage content and local theme are visible; physical site-config files open');
		await row('Tree Topics').getByText('Tree Topics', { exact: true }).click();
		await activeIs(topicPath);
		assert.equal(await row('Tree Topics').getAttribute('aria-expanded'), 'false', 'Opening a category must not expand it.');
		await row('Tree Topics').locator('.monaco-tl-twistie').click();
		await expandDirectory('tree-content/pages/020-topics/pages');
		await row('Tree Child').waitFor({ state: 'visible' });
		await activeIs(topicPath);
		await row('Tree Child').getByText('Tree Child', { exact: true }).click();
		await activeIs('tree-content/pages/020-topics/pages/010-child/content.md');
		passed('Label opens source; chevron expands independently');
		await vscode.commands.executeCommand('nornaSiteTree.focus');
		await tree.press('ArrowLeft');
		await tree.press('ArrowLeft');
		await tree.press('ArrowLeft');
		await tree.press('ArrowLeft');
		await waitFor(() => row('Tree Topics').getAttribute('aria-expanded'), (value) => value === 'false', 'Keyboard collapse did not work.');
		await tree.press('ArrowRight');
		await tree.press('Enter');
		await activeIs(topicPath);
		passed('Keyboard expansion, collapse and opening');
		await openDocument(guidePath);
		await waitFor(() => row('Tree Guide').getAttribute('aria-selected'), (value) => value === 'true', 'Active source was not selected.');
		assert.equal(await row('Tree Topics').getAttribute('aria-expanded'), 'true', 'Following another page reset expansion.');
		passed('Active-file reveal preserves unrelated expanded branches');
		// Resource rows use their actual source locations, even with equal names.
		await row('Tree Guide').locator('.monaco-tl-twistie').click();
		await sourceRow('tree-content/pages/010-guide/theme.yaml').click();
		await activeIs('tree-content/pages/010-guide/theme.yaml');
		await expandDirectory('tree-content/pages/010-guide/images');
		await sourceRow('tree-content/pages/010-guide/images/example.png').click();
		await waitFor(() => vscode.window.tabGroups.activeTabGroup.activeTab?.input, (input) => input instanceof vscode.TabInputCustom
			&& input.uri.fsPath === path.join(root, 'tree-content/pages/010-guide/images/example.png'), 'The page image did not open in the normal image editor.');
		await expandDirectory('tree-content/images');
		await sourceRow('tree-content/images/example.png').click();
		await waitFor(() => vscode.window.tabGroups.activeTabGroup.activeTab?.input?.uri?.fsPath,
			(filename) => filename === path.join(root, 'tree-content/images/example.png'), 'Equal image names opened the wrong owner’s file.');
		await expandDirectory('tree-content/public');
		await expandDirectory('tree-content/public/downloads');
		await sourceRow('tree-content/public/downloads/notes.txt').click();
		await activeIs('tree-content/public/downloads/notes.txt');
		assert.equal(vscode.window.activeTextEditor.document.getText(), 'Public download\n');
		passed('Owned YAML, image previews, duplicate image names and nested public files');
		await openDocument(guidePath);

		const guide = vscode.window.activeTextEditor.document;
		const diskOriginal = fs.readFileSync(guide.uri.fsPath, 'utf8');
		await vscode.window.activeTextEditor.edit((builder) => builder.insert(guide.positionAt(guide.getText().length), '\nUnsaved sentence.\n'));
		const dirtyOriginal = guide.getText();
		const information = async (title, field, value) => {
			const beforeLabel = await row(title).getAttribute('aria-label');
			const filename = beforeLabel.split('\n').find((line) => line.startsWith(root));
			await contextAction(title, 'Page Information');
			const oldDescription = field === 'Description' ? await quick.locator('.quick-input-list .monaco-list-row').filter({ has: window.locator('.label-name').getByText(field, { exact: true }) }).locator('.label-description').innerText() : '';
			await pick(field);
			if (field === 'Navigation') await pick(value);
			else await input(value, field === 'Description' ? 'A short introduction' : 'Changes the displayed title');
			await waitFor(() => quick.isVisible(), (visible) => !visible, 'Page Information did not close.');
			await waitFor(() => vscode.window.activeTextEditor?.document.uri.fsPath, (actual) => actual === filename, 'The edited source was not opened.');
			const newRow = row(['Title', 'Label'].includes(field) ? value : title);
			await waitFor(async () => await newRow.count() ? field === 'Navigation' ? await newRow.innerText() : await newRow.getAttribute('aria-label') : '', (label) => {
				if (!label) return false;
				if (field === 'Navigation') return label.includes('unlisted') === (value === 'Unlisted');
				if (field === 'Description') return value ? label.includes(value) : oldDescription === 'Not set' || !label.includes(oldDescription);
				return label.startsWith(value);
			}, 'The tree did not reflect the edited information.');
		};
		await information('Tree Guide', 'Title', 'Renamed Guide');
		const renamed = dirtyOriginal.replace('# Tree Guide\n', '# Renamed Guide\n');
		await waitFor(() => guide.getText(), (text) => text === renamed, 'Title editing changed unrelated source.');
		assert.equal(fs.readFileSync(guide.uri.fsPath, 'utf8'), diskOriginal, 'Metadata editing force-saved a dirty buffer.');
		await vscode.commands.executeCommand('undo');
		assert.equal(guide.getText(), dirtyOriginal, 'Undo must retain the earlier unsaved sentence.');
		await waitFor(() => row('Tree Guide').count(), (count) => count === 1, 'Undo did not refresh the title.');
		await information('Tree Guide', 'Title', 'Renamed Guide');
		await information('Renamed Guide', 'Description', 'Updated description');
		const described = renamed.replace('"Original description"', '"Updated description"');
		await waitFor(() => guide.getText(), (text) => text === described, 'Description editing changed other metadata.');
		await information('Renamed Guide', 'Navigation', 'Unlisted');
		const hidden = described.replace('---\n\n# Renamed Guide', 'navigation:\n  listed: false\n---\n\n# Renamed Guide');
		await waitFor(() => guide.getText(), (text) => text === hidden, 'Visibility editing changed unrelated source.');
		await waitFor(() => row('Renamed Guide').innerText(), (text) => text.includes('unlisted'), 'The tree did not show updated visibility.');
		assert.ok(await guide.save());
		assert.equal(fs.readFileSync(guide.uri.fsPath, 'utf8'), hidden);
		await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
		const reopened = await openDocument(guidePath);
		assert.equal(reopened.getText(), hidden);
		await information('Renamed Guide', 'Description', 'Second saved description');
		const secondSave = hidden.replace('"Updated description"', '"Second saved description"');
		await waitFor(() => reopened.getText(), (text) => text === secondSave, 'Editing after reopening failed.');
		await reopened.save();
		assert.equal(fs.readFileSync(reopened.uri.fsPath, 'utf8'), secondSave);
		await information('Renamed Guide', 'Description', '');
		const cleared = secondSave.replace('  description: "Second saved description" # keep\n', '  # keep\n');
		await waitFor(() => reopened.getText(), (text) => text === cleared, 'Clearing the description did not preserve its comment.');
		await reopened.save();
		passed('Title, description and visibility through Page Information; dirty undo and two save/reopen cycles');

		await information('Tree Topics', 'Label', 'Renamed Topics');
		await information('Renamed Topics', 'Description', 'Updated category description');
		const categoryDocument = vscode.window.activeTextEditor.document;
		assert.equal(categoryDocument.getText(), 'label: "Renamed Topics"\ndescription: "Updated category description"\n');
		await categoryDocument.save();
		passed('Category label and description through Page Information');

		const create = async ({ selected, kind, placement, title, slug, cancel = false }) => {
			await contextAction(selected, kind === 'page' ? 'New Page' : 'New Category');
			if (placement) await pick(placement);
			await input(title, kind === 'page' ? 'Page title' : 'Navigation category label');
			await input(slug, 'URL segment');
			await quick.locator('.quick-input-list .monaco-list-row').filter({ has: window.getByText(`Create ${kind}`, { exact: true }) }).waitFor({ state: 'visible' });
			if (cancel) {
				await quick.locator('.quick-input-box input').press('Escape');
				await quick.waitFor({ state: 'hidden' });
			}
			else await pick(`Create ${kind}`);
		};
		const childDir = path.join(root, 'tree-content/pages/020-topics/pages');
		const before = fs.readdirSync(childDir);
		await create({ selected: 'Renamed Topics', kind: 'page', placement: 'Inside “Renamed Topics”', title: 'Cancelled Page', slug: 'cancelled', cancel: true });
		assert.deepEqual(fs.readdirSync(childDir), before);
		passed('Cancelling the location preview creates no files');
		await create({ selected: 'Renamed Topics', kind: 'page', placement: 'Inside “Renamed Topics”', title: 'Created Child', slug: 'created-child' });
		await activeIs('tree-content/pages/020-topics/pages/020-created-child/content.md');
		assert.equal(vscode.window.activeTextEditor.document.getText(), '# Created Child\n\n## Introduction\n\nStart writing here.\n');
		await create({ selected: 'Created Child', kind: 'page', placement: 'Beside “Created Child”', title: 'Created Sibling', slug: 'created-sibling' });
		await activeIs('tree-content/pages/020-topics/pages/030-created-sibling/content.md');
		await create({ selected: 'Created Sibling', kind: 'category', placement: 'At site root', title: 'New Categories', slug: 'new-categories' });
		await activeIs('tree-content/pages/050-new-categories/category.yaml');
		assert.equal(vscode.window.activeTextEditor.document.getText(), 'label: New Categories\n');
		passed('Create child, sibling and root category through tree actions');
		await openDocument('tree-content/pages/020-topics/pages/010-child/content.md');
		const pagesRow = sourceRow('tree-content/pages/020-topics/pages');
		await pagesRow.hover();
		await pagesRow.getByRole('button', { name: 'Norna: Add Page…', exact: true }).click();
		await input('Added Directly', 'Page title');
		await input('added-directly', 'URL segment');
		assert.match(await quick.innerText(), /\/topics\/added-directly\//);
		await pick('Create page');
		await activeIs('tree-content/pages/020-topics/pages/040-added-directly/content.md');
		passed('Add Page inline action selects the physical pages folder without a location prompt');
		await create({ selected: 'Added Directly', kind: 'page', placement: 'Inside “Added Directly”', title: 'First Nested Page', slug: 'first-nested-page' });
		await activeIs('tree-content/pages/020-topics/pages/040-added-directly/pages/010-first-nested-page/content.md');
		await waitFor(() => row('First Nested Page').getAttribute('aria-selected'), (value) => value === 'true', 'The first child was not revealed under its new pages folder.');
		assert.equal(await window.getByText(/Norna: Cannot resolve tree item/).count(), 0, 'Creation and filesystem refresh must not invalidate an active reveal.');
		passed('First-child creation adds its physical pages folder and reveals the source without a tree error');

		await openDocument('tree-content/content.md');
		await waitFor(() => row('Tree Home').getAttribute('aria-selected'), (value) => value === 'true', 'Home was not revealed before its actions were tested.');
		await contextAction('Tree Home', 'New Page');
		assert.ok((await quick.locator('.monaco-list-row').allTextContents()).some((text) => text.includes('Inside “Tree Home”')));
		await quick.locator('.quick-input-box input').press('Escape');
		await contextAction('Tree Home', 'Page Information');
		assert.match(await quick.innerText(), /Home is always listed/);
		await pick('Navigation');
		assert.equal(vscode.window.activeTextEditor.document.getText(), '# Tree Home\n');
		passed('Home offers child creation and remains listed');

		await contextAction('Renamed Guide', 'New Page');
		await pick('Beside “Renamed Guide”');
		await input('Duplicate', 'Page title');
		await input('guide', 'URL segment', false);
		await waitFor(() => quick.innerText(), (text) => text.includes('A sibling with that slug already exists'), 'A colliding URL was not rejected in the input.');
		await quick.locator('.quick-input-box input').press('Escape');
		assert.equal(fs.readFileSync(path.join(root, guidePath), 'utf8'), cleared);
		passed('URL collisions are rejected without overwriting files');

		await row('Tree Hidden').locator('.monaco-tl-twistie').click();
		await expandDirectory('tree-content/pages/030-hidden/pages');
		assert.match(await row('Tree Hidden Child').innerText(), /unlisted/);
		const external = path.join(root, 'tree-content/pages/060-external');
		fs.mkdirSync(external);
		fs.writeFileSync(path.join(external, 'content.md'), '# External Page\n');
		await waitFor(() => row('External Page').count(), (count) => count === 1, 'External creation did not refresh the tree.');
		fs.writeFileSync(path.join(external, 'content.md'), '# External Rename\n');
		await waitFor(() => row('External Rename').count(), (count) => count === 1, 'External title editing did not refresh the tree.');
		fs.renameSync(external, path.join(root, 'tree-content/pages/060-moved'));
		await waitFor(() => row('External Rename').getAttribute('aria-label'), (label) => label.includes('060-moved'), 'External directory rename retained the old source path.');
		fs.rmSync(path.join(root, 'tree-content/pages/060-moved'), { recursive: true });
		await waitFor(() => row('External Rename').count(), (count) => count === 0, 'External deletion did not refresh the tree.');
		passed('Unlisted descendants and external create/edit/rename/delete refresh');
		await openDocument('tree-content/pages/040-broken/content.md');
		assert.ok(vscode.languages.getDiagnostics(vscode.window.activeTextEditor.document.uri).some((diagnostic) => diagnostic.source === 'Norna site tree'));
		await openDocument(guidePath);
		assert.equal(vscode.window.activeTextEditor.document.getText(), cleared);
		passed('Malformed page remains openable without disabling valid pages');

		await openDocument('second/tree-content/content.md');
		assert.equal(await row('Other Tree Home').count(), 0, 'Opening another site’s source must not add it to Site Tree.');
		assert.equal(await row('Tree Home').count(), 1);
		await chooseSite('Other Tree Home');
		await waitFor(() => row('Other Tree Home').getAttribute('aria-selected'), (value) => value === 'true', 'The second site was not revealed.');
		assert.equal(await row('Tree Home').count(), 0, 'Choosing another site must show exactly one tree.');
		assert.match(await row('Other Tree Home').innerText(), /Homepage/);
		await information('Other Tree Home', 'Title', 'Second Site Home');
		await vscode.window.activeTextEditor.document.save();
		assert.equal(fs.readFileSync(path.join(root, 'tree-content/content.md'), 'utf8'), '# Tree Home\n');
		passed('Switching sites keeps metadata edits within the selected site');

		await openDocument(guidePath);
		await chooseSite('Tree Home');
		await waitFor(() => row('Renamed Guide').getAttribute('aria-selected'), (value) => value === 'true', 'The captured source was not selected.');
		const settings = vscode.workspace.getConfiguration('workbench');
		for (const [appearance, theme] of [['dark', 'Default Dark Modern'], ['light', 'Default Light Modern']]) {
			await settings.update('colorTheme', theme, vscode.ConfigurationTarget.Workspace);
			await waitFor(() => window.locator('.monaco-workbench').getAttribute('class'), (classes) => appearance === 'dark' ? classes.includes('vs-dark') : !classes.includes('vs-dark'), `Theme did not change to ${appearance}.`);
			await window.screenshot({ path: path.join(root, '..', `site-tree-${vscode.version}-${appearance}.png`) });
		}
		await window.setViewportSize({ width: 960, height: 720 });
		await contextAction('Renamed Guide', 'Page Information');
		await window.screenshot({ path: path.join(root, '..', `site-tree-${vscode.version}-compact.png`) });
		await quick.locator('.quick-input-box input').press('Escape');
		fs.writeFileSync(path.join(root, '..', `site-tree-${vscode.version}.json`), JSON.stringify({
			vscode: vscode.version, extension: process.env.NORNA_EDITOR_TEST_EXTENSION_VERSION,
			bundleSha256: createHash('sha256').update(fs.readFileSync(path.join(vscode.extensions.getExtension('janga.norna-vscode').extensionPath, 'dist/extension.cjs'))).digest('hex'),
			passed: results,
		}, null, 2));
		console.log(`Packaged site tree UI tests passed (${results.length} workflows).`);
	} catch (error) {
		if (window) {
			console.log('TREE FAILURE', await window.locator('.monaco-list-row').allTextContents());
			console.log('QUICK INPUT FAILURE', await window.locator('.quick-input-title, .quick-input-message, .quick-input-list .label-name').allTextContents());
			await window.screenshot({ path: path.join(root, '..', 'site-tree-failure.png') });
		}
		throw error;
	} finally {
		await browser.close();
	}
}

module.exports = { runSiteTree };
