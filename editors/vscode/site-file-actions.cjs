const path = require('node:path');
const { describeLinks, showLinks } = require('./site-link-review.cjs');
const { openImageImportForm } = require('./image-import-form.cjs');
const { openImageInsertForm } = require('./image-insert-form.cjs');

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
	const target = async (argument, allowSite = false) => {
		const selected = await chooseNode(argument);
		const page = ownerOf(selected);
		if (!page || !(['page', 'category'].includes(page.kind) || allowSite && page.kind === 'site')) throw new Error('Select a page in Site Tree first.');
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
		usage.references.length ? `Found ${usage.references.length} reference${usage.references.length === 1 ? '' : 's'} in Norna content blocks:`
			: 'No references found in Norna content blocks.',
		...usage.references.map((reference) => `${path.relative(siteRoot, reference.sourcePath)}:${reference.line}${reference.unresolved ? ' — may refer to this image' : ''}`),
		...(usage.incomplete.length ? ['Could not check all pages:', ...usage.incomplete] : []),
	].join('\n');

	const appendImage = async (page, service, filename) => {
		if (typeof service.createEditorImageBatchAppend !== 'function') throw new Error('Update this site’s Norna engine to use the combined image form.');
		const imagePath = path.join(path.dirname(page.sourcePath), 'images', filename);
		await service.getEditorImageUsage({ siteRoot: page.siteRoot, sourcePath: page.sourcePath, imagePath });
		const document = await vscode.workspace.openTextDocument(uri(page.sourcePath));
		const version = document.version;
		return openImageInsertForm(vscode, context, { pageTitle: page.title, filename, imagePath }, async (values) => {
			if (!values || typeof values.alt !== 'string' || typeof values.caption !== 'string' || typeof values.decorative !== 'boolean') throw new Error('Enter the image information again.');
			await chooseNode(page);
			if (document.version !== version) throw new Error('The page changed while the image form was open. Open Insert Image again.');
			const edit = await service.createEditorImageBatchAppend({ source: document.getText(), items: [{ filename,
				...(values.alt.trim() || values.decorative ? { alt: values.alt } : {}),
				...(values.caption.trim() ? { caption: values.caption } : {}),
			}] });
			await service.getEditorImageUsage({ siteRoot: page.siteRoot, sourcePath: page.sourcePath, imagePath });
			if (document.version !== version) throw new Error('The page changed. Open Insert Image again.');
			const editor = await vscode.window.showTextDocument(document, { preview: false });
			if (document.version !== version) throw new Error('The page changed. Open Insert Image again.');
			const applied = await editor.edit((builder) => builder.insert(document.positionAt(edit.start), edit.text), { undoStopBefore: true, undoStopAfter: true });
			if (!applied) throw new Error('The image block could not be inserted. The image file remains available.');
			editor.revealRange(new vscode.Range(document.positionAt(edit.start), document.positionAt(document.getText().length)));
		});
	};
	const importImage = async (argument) => {
		const { page, service, options } = await target(argument);
		if (page.kind !== 'page') throw new Error('Choose a content page to import an image.');
		if (typeof service.createEditorImageBatchAppend !== 'function') throw new Error('Update this site’s Norna engine to use the combined image import form.');
		const files = await vscode.window.showOpenDialog({ title: `Import images into “${page.title}”`, openLabel: 'Choose Images', canSelectFiles: true, canSelectFolders: false, canSelectMany: true,
			filters: { Images: ['jpg', 'jpeg', 'png', 'svg'] } });
		if (!files?.length) return;
		if (files.some((file) => file.scheme !== 'file')) throw new Error('Choose images on this computer.');
		const imageDirectory = path.join(path.dirname(page.sourcePath), 'images');
		const rows = [];
		for (const [id, file] of files.entries()) {
			const extension = path.extname(file.fsPath).toLowerCase();
			const base = service.slugifyAsciiIdentifier(path.basename(file.fsPath, path.extname(file.fsPath))) || 'image';
			rows.push({ id, sourcePath: file.fsPath, sourceName: path.basename(file.fsPath), filename: `${base}${extension}` });
		}
		const completed = new Set();
		const getRows = async (values) => {
			const issues = {}, planned = [], names = new Map();
			if (values.length !== rows.length || new Set(values.map((value) => value.id)).size !== rows.length) throw new Error('The image selection changed. Open Import Images again.');
			for (const value of values) {
				if (value.action === 'skip') continue;
				const name = String(value.filename ?? '').trim().toLowerCase();
				names.set(name, [...(names.get(name) ?? []), value.id]);
			}
			for (const value of values) {
				const row = rows.find((candidate) => candidate.id === value.id);
				if (!row) throw new Error('Unknown image selection.');
				if (!['import', 'insert', 'skip'].includes(value.action)) throw new Error('Choose an image action.');
				if (completed.has(value.id) || value.action === 'skip') continue;
				const name = String(value.filename ?? '').trim();
				if (names.get(name.toLowerCase()).length > 1) { issues[value.id] = { error: 'Another selected image has this filename. Choose a different name.' }; continue; }
				try {
					const plan = await service.planEditorImageCopy({ ...options, imagePath: row.sourcePath, filename: name });
					planned.push({ ...value, replace: false, row, plan });
				} catch (error) {
					const collision = error.message === 'An image already has this name on the page. Choose another filename or use Replace Image.';
					if (!collision) { issues[value.id] = { error: error.message }; continue; }
					try {
						const plan = await service.planEditorImageCopy({ ...options, imagePath: row.sourcePath, filename: name, replace: true });
						planned.push({ ...value, replace: true, row, plan });
						issues[value.id] = { collision: true, existingPath: plan.destination };
					} catch (replacementError) { issues[value.id] = { error: replacementError.message }; }
				}
			}
			return { issues, blocked: Object.values(issues).some((issue) => issue.error), planned, values };
		};
		const apply = async (prepared) => {
			const { values, planned } = prepared;
			const replacements = planned.filter((entry) => entry.replace);
			const reviewedUsage = new Map();
			if (replacements.length) {
				const details = [];
				for (const entry of replacements) {
					const usage = await stableSources((sources) => service.getEditorImageUsage({ ...options, imagePath: entry.plan.destination, sources }));
					reviewedUsage.set(entry.id, usage);
					details.push(`${entry.plan.filename}:\n${describeUsage(usage, page.siteRoot)}`);
				}
				if (!await confirm(`Replace ${replacements.length} image${replacements.length === 1 ? '' : 's'} on “${page.title}”?`,
					`${details.join('\n')}\n\nThe old files go to Trash. Existing references keep their filenames.`, 'Replace Images')) {
					return { complete: false, summary: 'Replacement cancelled. No new images were imported.', issues: prepared.issues, blocked: false, done: [...completed] };
				}
			}
			let currentEntry;
			try {
				for (const entry of planned) {
					currentEntry = entry;
					await chooseNode(page);
					clean(entry.plan.source); clean(entry.plan.destination);
					checkPlan(entry.plan, await service.planEditorImageCopy({ ...options, imagePath: entry.row.sourcePath, filename: entry.plan.filename, replace: Boolean(entry.replace) }));
					await vscode.workspace.fs.createDirectory(uri(imageDirectory));
					if (entry.replace) {
						const currentUsage = await stableSources((sources) => service.getEditorImageUsage({ ...options, imagePath: entry.plan.destination, sources }));
						if (JSON.stringify(currentUsage) !== JSON.stringify(reviewedUsage.get(entry.id))) throw new Error('Image references changed. Review the replacement again.');
						const staged = uri(path.join(context.globalStorageUri.fsPath, `image-${Date.now()}-${Math.random().toString(16).slice(2)}${path.extname(entry.plan.filename)}`));
						await vscode.workspace.fs.createDirectory(context.globalStorageUri);
						await vscode.workspace.fs.copy(uri(entry.plan.source), staged, { overwrite: false });
						try {
							checkPlan(entry.plan, await service.planEditorImageCopy({ ...options, imagePath: entry.row.sourcePath, filename: entry.plan.filename, replace: true }));
							await chooseNode(page);
							clean(entry.plan.source); clean(entry.plan.destination);
							await vscode.workspace.fs.delete(uri(entry.plan.destination), { useTrash: true });
							try { await vscode.workspace.fs.copy(staged, uri(entry.plan.destination), { overwrite: false }); }
							catch (error) { throw new Error(`The old ${entry.plan.filename} is in Trash; the replacement could not be written: ${error.message}`); }
						} finally { await vscode.workspace.fs.delete(staged).catch(() => {}); }
					} else await vscode.workspace.fs.copy(uri(entry.plan.source), uri(entry.plan.destination), { overwrite: false });
					completed.add(entry.id);
					currentEntry = undefined;
					await refresh();
				}
				const inserts = values.filter((value) => value.action === 'insert' && completed.has(value.id));
				if (inserts.length) {
					await chooseNode(page);
					const document = await vscode.workspace.openTextDocument(uri(page.sourcePath));
					const version = document.version;
					const edit = await service.createEditorImageBatchAppend({ source: document.getText(), items: inserts.map((value) => ({
						filename: String(value.filename).trim(), ...(value.alt.trim() || value.decorative ? { alt: value.alt } : {}),
						...(value.caption.trim() ? { caption: value.caption } : {}),
					})) });
					if (document.version !== version) throw new Error('The page changed before insertion. Image files were imported; retry insertion.');
					const editor = await vscode.window.showTextDocument(document, { preview: false });
					const applied = await editor.edit((builder) => builder.insert(document.positionAt(edit.start), edit.text), { undoStopBefore: true, undoStopAfter: true });
					if (!applied) throw new Error('Image files were imported, but the page edit failed. Retry insertion.');
				}
				return { complete: true };
			} catch (error) {
				await refresh();
				const succeeded = rows.filter((row) => completed.has(row.id)).map((row) => row.sourceName);
				const pending = rows.filter((row) => !completed.has(row.id) && values.some((value) => value.id === row.id && value.action !== 'skip')).map((row) => row.sourceName);
				return { complete: false, summary: `Imported: ${succeeded.join(', ') || 'none'}.\nPending: ${pending.join(', ') || 'none'}.\n${error.message}`,
					issues: currentEntry ? { [currentEntry.id]: { error: error.message } } : {}, done: [...completed], blocked: false };
			}
		};
		return openImageImportForm(vscode, context, { pageTitle: page.title, destination: path.relative(page.siteRoot, imageDirectory), destinationPath: imageDirectory, rows },
			{ preview: getRows, apply });
	};
	const insertImage = async (argument) => {
		const selected = await target(argument);
		await appendImage(selected.page, selected.service, path.basename(imagePathOf(selected)));
	};
	const remove = async (argument, kind) => {
		const selected = await target(argument, kind === 'file');
		const { page, service, options } = selected;
		const image = kind === 'image';
		if (!image && service.siteRemovalApiVersion !== 1) throw new Error('Update this site’s Norna engine to remove files or review incoming links before page removal.');
		if (image) options.imagePath = imagePathOf(selected);
		else if (kind === 'file') {
			if (selected.selected.kind !== 'file') throw new Error('Select an optional file in Site Tree.');
			options.filePath = selected.selected.sourcePath;
		}
		else if (!['page', 'category'].includes(selected.selected.kind)) throw new Error('Select the page itself to remove it.');
		const plan = await stableSources((sources) => service.planEditorRemoval({ ...options, sources }));
		clean(plan.target);
		const detail = [...(!image ? [plan.target] : []),
			image ? describeUsage(plan.usage, page.siteRoot) : kind === 'file' ? plan.effect
				: `${plan.pages} page/category entries and ${plan.files.length} files, including all descendants. Links from pages that remain are not rewritten.`,
			...(!image && plan.usage ? [describeLinks(plan.usage)] : []),
			...(image && plan.usage.references.length ? ['References in page content will stay unchanged.'] : []),
			image ? 'Restore it in Finder’s Trash if needed; VS Code Undo will not restore the file.'
				: 'Restore through the operating system’s Trash. Editor Undo does not restore these files.',
		].join('\n\n');
		const choice = await vscode.window.showWarningMessage(`Move “${kind === 'page' ? page.title : path.basename(plan.target)}”${image ? ` from “${page.title}”` : ''} to Trash?`,
			{ modal: true, detail }, 'Move to Trash', ...(!image && plan.usage?.references.length ? ['Show links'] : []));
		if (choice === 'Show links') {
			await chooseNode(page);
			return showLinks(vscode, plan.usage, page.siteRoot, 'Links to this selection — removal cancelled');
		}
		if (choice !== 'Move to Trash') return;
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
	for (const [name, action] of Object.entries({ importImage, insertImage, replaceImage,
		removeImage: (node) => remove(node, 'image'), removePage: (node) => remove(node, 'page'), removeFile: (node) => remove(node, 'file') })) {
		register(`nornaEditor.${name}`, async (argument) => {
			if (running) throw new Error('Finish or cancel the current page/image action first.');
			running = true;
			try { return await action(argument); } finally { running = false; }
		});
	}
}

module.exports = { registerSiteFileActions };
