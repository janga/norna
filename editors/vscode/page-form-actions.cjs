const path = require('node:path');
const { openPageForm } = require('./page-form.cjs');
const { describeLinks } = require('./site-link-review.cjs');
const fail = (field, message) => { throw Object.assign(new Error(message), { field }); };
function validate(values, kind, isHome) {
	if (!values || typeof values.title !== 'string' || !values.title.trim() || /[\r\n]/.test(values.title)) fail('title', 'Enter a non-empty title on one line.');
	if (typeof values.description !== 'string' || /[\r\n]/.test(values.description)) fail('description', 'Use a single line of text.');
	if (typeof values.listed !== 'boolean' || (isHome && !values.listed)) fail('form', 'The homepage must remain listed.');
	if (typeof values.listChildren !== 'boolean') fail('form', 'Choose whether to list child pages.');
	if (!Array.isArray(values.aliases) || values.aliases.some(value => typeof value !== 'string')) fail('aliases', 'Enter additional addresses as paths.');
	const aliases = values.aliases.map(value => value.trim());
	if (aliases.some(value => !/^\/(?:[a-z0-9]+(?:-[a-z0-9]+)*\/)+$/.test(value))) fail('aliases', 'Start and end each address with /, for example /old-guide/. Remove unused rows.');
	if (new Set(aliases).size !== aliases.length) fail('aliases', 'Each additional address must be unique.');
	return { ...values, title: values.title.trim(), description: values.description.trim(), aliases };
}
const applyEdits = (source, edits) => [...edits].sort((a,b) => b.start-a.start).reduce((text, edit) => text.slice(0,edit.start)+edit.text+text.slice(edit.end),source);

function createPageForm({ vscode, context, service, kind, selected, target, insideSelected, ownerOf, chooseNode, documentSources, refresh, revealActive }) {
	const parents = [{ label: `Inside “${selected.title}”`, parentPath: selected.url ?? '/' }];
	if (!insideSelected && target.role !== 'pages' && !selected.isHome && selected.kind !== 'site') {
		const parent = ownerOf(selected.parent);
		parents.push({ label: `Beside “${selected.title}”`, parentPath: parent?.url ?? '/' });
		if (parent?.url && parent.url !== '/') parents.push({ label: 'At site root', parentPath: '/' });
	}
	return openPageForm(vscode, context, { kind, parents, parentPath: parents[0].parentPath, aliases: [] }, {
		prepare: async (raw, suggestSlug) => {
			const values = validate(raw, kind, false);
			if (!parents.some(parent => parent.parentPath === values.parentPath)) fail('form', 'Choose a listed destination.');
			const slug = suggestSlug ? service.slugifyAsciiIdentifier(values.title) : values.slug;
			if (typeof slug !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) fail('slug', 'Use lowercase letters, numbers and single hyphens.');
			const metadata = { ...(values.description || values.aliases.length || values.listChildren ? { page: { ...(values.description ? { description: values.description } : {}), ...(values.aliases.length ? { aliases: values.aliases } : {}), ...(values.listChildren ? { listChildren: true } : {}) } } : {}), ...(!values.listed ? { navigation: { listed: false } } : {}) };
			await chooseNode(target);
			let plan;
			try { plan = await service.planSiteNodeCreation({ siteRoot: selected.siteRoot, kind, title: values.title, slug, parentPath: values.parentPath, metadata, sources: documentSources() }); }
			catch (error) { error.field = /alias/i.test(error.message) ? 'aliases' : 'form'; throw error; }
			return { plan, slug, preview: `Address: ${plan.url}\nSource: ${path.join(plan.destination, 'content.md')}` };
		},
		apply: async ({ plan }, isOpen) => {
			await chooseNode(target);
			if (!isOpen()) return false;
			const sourcePath = path.join(plan.destination, 'content.md');
			if (vscode.workspace.textDocuments.some(document => document.uri.fsPath === sourcePath && document.isDirty)) throw new Error('Save or close the unsaved destination file before creating this page.');
			const created = await service.createSiteNode(plan, { sources: documentSources() });
			await refresh();
			await vscode.window.showTextDocument(vscode.Uri.file(created.sourcePath), { preview: false });
			await revealActive();
		},
	});
}

function editPageForm({ vscode, context, service, node, document, info, chooseNode, documentSources, updateDocument }) {
	const original = document.getText(), version = document.version;
	const unchanged = async () => {
		await chooseNode(node);
		if (document.isClosed || document.version !== version || document.getText() !== original) throw new Error('The source changed while this form was open. Close it and reopen Page Information to load the current values.');
	};
	return openPageForm(vscode, context, { ...info, kind: node.kind, isHome: node.isHome, url: node.url, edit: true }, {
		prepare: async raw => {
			const values = validate(raw, node.kind, node.isHome);
			await unchanged();
			let source = original;
			for (const field of ['title', 'description', 'listed', 'listChildren', 'aliases']) {
				if (JSON.stringify(values[field]) === JSON.stringify(info[field])) continue;
				try { source = applyEdits(source, await service.editSiteNodeInformation({ siteRoot: node.siteRoot, sourcePath: node.sourcePath, source, field, value: values[field], sources: documentSources() })); }
				catch (error) { error.field = field; throw error; }
			}
			return { source, values, preview: `Source: ${node.sourcePath}\nChanges stay in the editor until you save the file.` };
		},
		apply: async ({ source, values }, isOpen) => {
			await unchanged();
			const removed = info.aliases.filter(alias => !values.aliases.includes(alias));
			if (removed.length) {
				const usage = async () => Promise.all(removed.map(alias => service.getEditorIncomingLinks({ siteRoot: node.siteRoot, sourcePath: node.sourcePath, sources: documentSources(), alias })));
				const before = await usage();
				const answer = await vscode.window.showWarningMessage('Remove additional addresses?', { modal: true, detail: removed.map((alias,index) => `${alias}\n${describeLinks(before[index])}`).join('\n\n') + '\n\nThese addresses will stop redirecting when you save and publish.' }, 'Remove addresses');
				if (answer !== 'Remove addresses') return false;
				if (JSON.stringify(before) !== JSON.stringify(await usage())) throw new Error('Links changed while confirmation was open. Review and save again.');
			}
			await unchanged();
			// Recheck aliases against the latest unsaved sources before applying.
			if (JSON.stringify(info.aliases) !== JSON.stringify(values.aliases)) await service.editSiteNodeInformation({ siteRoot: node.siteRoot, sourcePath: node.sourcePath, source: original, field: 'aliases', value: values.aliases, sources: documentSources() });
			const editor = await vscode.window.showTextDocument(document, { preview: false });
			await unchanged();
			if (!isOpen()) return false;
			if (source !== original && !await editor.edit(builder => builder.replace(new vscode.Range(document.positionAt(0),document.positionAt(original.length)),source), { undoStopBefore: true, undoStopAfter: true })) throw new Error('The page information could not be applied. Try again.');
			await updateDocument(document);
		},
	});
}
module.exports = { createPageForm, editPageForm, validate };
