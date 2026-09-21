const path = require('node:path');

// Native dialogs and filesystem operations stay in the extension. The selected
// engine owns path, content and image-reference rules.
function registerSiteFileActions({ vscode, context, chooseNode, ownerOf, serviceFor, documentSources, refresh, register }) {
	const uri = (filename) => vscode.Uri.file(filename);
	const inside = (root, filename) => {
		const relative = path.relative(root, filename);
		return relative === '' || (relative !== '..' && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative));
	};
	const clean = (filename) => {
		if (vscode.workspace.textDocuments.some((document) => document.uri.scheme === 'file' && document.isDirty && inside(filename, document.uri.fsPath))) {
			throw new Error('Save or undo unsaved changes in the affected files before continuing.');
		}
	};
	const target = async (argument) => {
		const selected = await chooseNode(argument);
		const page = ownerOf(selected);
		if (!page || !['page', 'category'].includes(page.kind)) throw new Error('Select a page in Site Tree first.');
		const service = await serviceFor(page.siteRoot);
		if (service.siteFileOperationsApiVersion !== 1) throw new Error('Update this site’s Norna engine to use page and image file actions. Existing page editing remains available.');
		return { selected, page, service, options: { siteRoot: page.siteRoot, sourcePath: page.sourcePath } };
	};
	const imagePathOf = ({ selected, page }) => {
		const filename = selected.sourcePath;
		if (selected.kind !== 'file' || path.dirname(filename) !== path.join(path.dirname(page.sourcePath), 'images')) {
			throw new Error('Select an image in the page’s images folder.');
		}
		return filename;
	};
	const confirm = async (title, detail, action) => (await vscode.window.showWarningMessage(title,
		{ modal: true, detail }, action)) === action;
	const checkPlan = (before, after) => {
		if (before.fingerprint !== after.fingerprint) throw new Error('The affected files or references changed. Start the action again to review the current result.');
	};
	const stableSources = async (read) => {
		const sources = documentSources();
		const result = await read(sources);
		if (JSON.stringify([...sources]) !== JSON.stringify([...documentSources()])) throw new Error('Unsaved page content changed during the check. Start the action again.');
		return result;
	};
	const describeUsage = (usage, siteRoot) => [
		'Managed image references (including unsaved pages):',
		...usage.references.map((reference) => `${path.relative(siteRoot, reference.sourcePath)}:${reference.line}${reference.unresolved ? ' — unresolved; may refer to this file' : ''}`),
		...(!usage.references.length ? ['No managed-image references found.'] : []),
		...(usage.incomplete.length ? ['Some pages could not be fully checked:', ...usage.incomplete] : []),
		'Ordinary Markdown, HTML and external references are not checked. Content is not rewritten.',
	].join('\n');

	const appendImage = async (page, service, filename) => {
		const document = await vscode.workspace.openTextDocument(uri(page.sourcePath));
		const version = document.version;
		const alt = await vscode.window.showInputBox({ title: `Insert image: ${page.title}`, prompt: 'Describe the image (alternative text)',
			validateInput: (value) => !value.trim() ? 'Enter a short description of the image.' : undefined, ignoreFocusOut: true });
		if (alt === undefined) return;
		const caption = await vscode.window.showInputBox({ title: `Insert image: ${page.title}`, prompt: 'Caption (optional). The image block will be added at the end of this page.', ignoreFocusOut: true });
		if (caption === undefined) return;
		await chooseNode(page);
		if (document.version !== version) throw new Error('The page changed while the image dialog was open. Insert the image again.');
		const edit = await service.createEditorImageAppend({ source: document.getText(), filename, alt, caption });
		await service.getEditorImageUsage({ siteRoot: page.siteRoot, sourcePath: page.sourcePath, imagePath: path.join(path.dirname(page.sourcePath), 'images', filename) });
		if (document.version !== version) throw new Error('The page changed. Insert the image again.');
		const editor = await vscode.window.showTextDocument(document, { preview: false });
		if (document.version !== version) throw new Error('The page changed. Insert the image again.');
		const applied = await editor.edit((builder) => builder.insert(document.positionAt(edit.start), edit.text), { undoStopBefore: true, undoStopAfter: true });
		if (!applied) throw new Error('The image block could not be inserted. The image file remains available.');
		editor.revealRange(new vscode.Range(document.positionAt(edit.start), document.positionAt(document.getText().length)));
	};
	const importImage = async (argument) => {
		const { page, service, options } = await target(argument);
		if (page.kind !== 'page') throw new Error('Choose a content page to import an image.');
		const files = await vscode.window.showOpenDialog({ title: `Import image into “${page.title}”`, openLabel: 'Choose Image', canSelectFiles: true, canSelectFolders: false, canSelectMany: false,
			filters: { Images: ['jpg', 'jpeg', 'png', 'svg'] } });
		if (!files?.length) return;
		if (files[0].scheme !== 'file') throw new Error('Choose an image on this computer.');
		const imagePath = files[0].fsPath;
		const extension = path.extname(imagePath).toLowerCase();
		const initial = `${service.slugifyAsciiIdentifier(path.basename(imagePath, path.extname(imagePath))) || 'image'}${extension}`;
		const filename = await vscode.window.showInputBox({ title: `Import image: ${page.title}`, prompt: 'Filename in this page’s images folder; the original is kept', value: initial, ignoreFocusOut: true,
			validateInput: async (filename) => { try { await service.planEditorImageCopy({ ...options, imagePath, filename }); } catch (error) { return error.message; } return undefined; } });
		if (filename === undefined) return;
		await chooseNode(page);
		clean(imagePath);
		const plan = await service.planEditorImageCopy({ ...options, imagePath, filename });
		await vscode.workspace.fs.createDirectory(uri(path.dirname(plan.destination)));
		checkPlan(plan, await service.planEditorImageCopy({ ...options, imagePath, filename }));
		await chooseNode(page);
		clean(plan.source); clean(plan.destination);
		await vscode.workspace.fs.copy(uri(plan.source), uri(plan.destination), { overwrite: false });
		await refresh();
		const choice = await vscode.window.showQuickPick([
			{ label: 'Insert image at end of page', description: page.title, insert: true },
			{ label: 'Keep image file only', description: path.relative(page.siteRoot, plan.destination) },
		], { title: `Imported ${filename}`, placeHolder: 'The original file is unchanged', ignoreFocusOut: true });
		if (choice?.insert) await appendImage(page, service, filename);
	};
	const insertImage = async (argument) => {
		const selected = await target(argument);
		await appendImage(selected.page, selected.service, path.basename(imagePathOf(selected)));
	};
	const remove = async (argument, image) => {
		const selected = await target(argument);
		const { page, service, options } = selected;
		if (image) options.imagePath = imagePathOf(selected);
		else if (!['page', 'category'].includes(selected.selected.kind)) throw new Error('Select the page itself to remove it.');
		const plan = await stableSources((sources) => service.planEditorRemoval({ ...options, sources }));
		clean(plan.target);
		const detail = [plan.target,
			image ? describeUsage(plan.usage, page.siteRoot) : `${plan.pages} page/category entries and ${plan.files.length} files, including all descendants. Links elsewhere are not updated.`,
			'Restore through the operating system’s Trash. Editor Undo does not restore these files.',
		].join('\n\n');
		if (!await confirm(`Move “${image ? path.basename(plan.target) : page.title}” to Trash?`, detail, 'Move to Trash')) return;
		await chooseNode(page);
		clean(plan.target);
		checkPlan(plan, await stableSources((sources) => service.planEditorRemoval({ ...options, sources })));
		await chooseNode(page);
		clean(plan.target);
		await vscode.workspace.fs.delete(uri(plan.target), { recursive: plan.recursive, useTrash: true });
		await refresh();
	};
	const replaceImage = async (argument) => {
		const selected = await target(argument);
		const { page, service, options } = selected;
		const imagePath = imagePathOf(selected);
		const extension = path.extname(imagePath).slice(1);
		const files = await vscode.window.showOpenDialog({ title: `Replace ${path.basename(imagePath)}`, openLabel: 'Choose Replacement', canSelectFiles: true, canSelectFolders: false, canSelectMany: false, filters: { Images: [extension] } });
		if (!files?.length) return;
		if (files[0].scheme !== 'file') throw new Error('Choose an image on this computer.');
		const copyOptions = { ...options, imagePath: files[0].fsPath, filename: path.basename(imagePath), replace: true };
		const plan = await service.planEditorImageCopy(copyOptions);
		const usage = await service.getEditorImageUsage({ ...options, imagePath, sources: documentSources() });
		clean(plan.source); clean(plan.destination);
		if (!await confirm(`Replace “${plan.filename}” on “${page.title}”?`, `${plan.destination}\n\n${describeUsage(usage, page.siteRoot)}\n\nThe old image goes to Trash. Its filename and content references stay the same.`, 'Replace Image')) return;
		await chooseNode(page);
		clean(plan.source); clean(plan.destination);
		checkPlan(plan, await service.planEditorImageCopy(copyOptions));
		const currentUsage = await service.getEditorImageUsage({ ...options, imagePath, sources: documentSources() });
		if (JSON.stringify(usage) !== JSON.stringify(currentUsage)) throw new Error('Image references changed. Review Replace Image again.');
		// Copy the replacement before trashing the old file, so a source read
		// failure leaves the original intact. Never overwrite a new arrival.
		const staged = uri(path.join(context.globalStorageUri.fsPath, `image-${Date.now()}-${Math.random().toString(16).slice(2)}${path.extname(plan.filename)}`));
		await vscode.workspace.fs.createDirectory(context.globalStorageUri);
		await vscode.workspace.fs.copy(uri(plan.source), staged, { overwrite: false });
		try {
			checkPlan(plan, await service.planEditorImageCopy(copyOptions));
			const finalUsage = await stableSources((sources) => service.getEditorImageUsage({ ...options, imagePath, sources }));
			if (JSON.stringify(usage) !== JSON.stringify(finalUsage)) throw new Error('Image references changed. Review Replace Image again.');
			await chooseNode(page);
			clean(plan.source); clean(plan.destination);
			await vscode.workspace.fs.delete(uri(plan.destination), { useTrash: true });
			try { await vscode.workspace.fs.copy(staged, uri(plan.destination), { overwrite: false }); }
			catch (error) { throw new Error(`The old image is in Trash. The replacement could not be written: ${error.message}`); }
		} finally {
			await vscode.workspace.fs.delete(staged).catch(() => {});
			await refresh();
		}
	};
	let running = false;
	for (const [name, action] of Object.entries({ importImage, insertImage, replaceImage, removeImage: (node) => remove(node, true), removePage: (node) => remove(node, false) })) {
		register(`nornaEditor.${name}`, async (argument) => {
			if (running) throw new Error('Finish or cancel the current page/image action first.');
			running = true;
			try { return await action(argument); } finally { running = false; }
		});
	}
}

module.exports = { registerSiteFileActions };
