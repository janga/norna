const path = require('node:path');
const { describeLinks, showLinks } = require('./site-link-review.cjs');

function registerSiteAddressActions({ vscode, chooseNode, ownerOf, serviceFor, documentSources, refresh, register }) {
	const target = async (argument) => {
		const page = ownerOf(await chooseNode(argument));
		if (!page || !['page', 'category'].includes(page.kind)) throw new Error('Select a page or category in Site Tree.');
		const service = await serviceFor(page.siteRoot);
		if (service.siteAddressApiVersion !== 1) throw new Error('Update this site’s Norna engine to use Addresses and links. Existing page information remains available.');
		return { page, service, options: { siteRoot: page.siteRoot, sourcePath: page.sourcePath } };
	};
	const stable = async (callback) => {
		const sources = documentSources();
		const result = await callback(sources);
		if (JSON.stringify([...sources]) !== JSON.stringify([...documentSources()])) throw new Error('Unsaved content changed during the check. Open Addresses and links again.');
		return result;
	};
	const incoming = async ({ page, service, options }) => {
		const usage = await stable((sources) => service.getEditorIncomingLinks({ ...options, sources }));
		await chooseNode(page);
		await showLinks(vscode, usage, page.siteRoot, `Incoming links: ${page.title}`);
	};
	const aliases = async ({ page, service, options }, addresses) => {
		const selected = await vscode.window.showQuickPick([
			{ label: '$(add) Add additional address…', add: true, detail: `Redirect another address to ${addresses.internalLink}` },
			...addresses.aliases.map((alias) => ({ label: alias, description: 'Select to copy or remove', alias })),
		], { title: `Additional addresses: ${page.title}`, placeHolder: 'These addresses redirect to the current page; they do not move it.', ignoreFocusOut: true });
		if (!selected) return;
		const document = await vscode.workspace.openTextDocument(vscode.Uri.file(page.sourcePath));
		const version = document.version;
		const source = document.getText();
		const info = await service.getSiteNodeInformation({ ...options, kind: page.kind, isHome: page.isHome, source });
		if (info.problem || JSON.stringify(info.aliases) !== JSON.stringify(addresses.aliases)) throw new Error('The page addresses changed or need repair. Open Addresses and links again.');
		let values;
		const editsFor = (values) => stable((sources) => service.editSiteNodeInformation({ ...options, source, field: 'aliases', value: values, sources }));
		if (selected.add) {
			const value = await vscode.window.showInputBox({ title: `Additional address: ${page.title}`, placeHolder: '/old-guide/',
				prompt: `Begin and end with /. Omit the site's deployment prefix. This address will redirect to ${addresses.internalLink}.`, ignoreFocusOut: true,
				validateInput: async (value) => {
					try { await editsFor([...addresses.aliases, value]); } catch (error) { return error.message; }
					return undefined;
				} });
			if (value === undefined) return;
			values = [...addresses.aliases, value];
		} else {
			const action = await vscode.window.showQuickPick([
				{ label: 'Copy internal link', copy: true }, { label: 'Remove additional address…', remove: true },
			], { title: selected.alias, ignoreFocusOut: true });
			if (action?.copy) return vscode.env.clipboard.writeText(selected.alias);
			if (!action?.remove) return;
			const usage = await stable((sources) => service.getEditorIncomingLinks({ ...options, sources, alias: selected.alias }));
			const choice = await vscode.window.showWarningMessage(`Remove ${selected.alias}?`, { modal: true,
				detail: `This address will stop redirecting to ${addresses.internalLink}. The page stays in place.\n\n${describeLinks(usage)}` }, 'Remove address', ...(usage.references.length ? ['Show links'] : []));
			if (choice === 'Show links') return showLinks(vscode, usage, page.siteRoot, 'Links to this address — removal cancelled');
			if (choice !== 'Remove address') return;
			const current = await stable((sources) => service.getEditorIncomingLinks({ ...options, sources, alias: selected.alias }));
			if (JSON.stringify(usage) !== JSON.stringify(current)) throw new Error('Links changed while the confirmation was open. Review the address again.');
			values = addresses.aliases.filter((value) => value !== selected.alias);
		}
		await chooseNode(page);
		if (document.version !== version) throw new Error('The page changed while the address dialog was open. Open it again.');
		const edits = await editsFor(values);
		const editor = await vscode.window.showTextDocument(document, { preview: false });
		await chooseNode(page);
		if (document.version !== version) throw new Error('The page changed. Open Addresses and links again.');
		if (!await editor.edit((builder) => {
			for (const edit of edits) builder.replace(new vscode.Range(document.positionAt(edit.start), document.positionAt(edit.end)), edit.text);
		}, { undoStopBefore: true, undoStopAfter: true })) throw new Error('The additional address could not be edited. Try again.');
	};
	const rename = async ({ page, service, options }, addresses) => {
		const prefix = addresses.internalLink.slice(0, -(addresses.segment.length + 1));
		const segment = await vscode.window.showInputBox({ title: `Change URL segment: ${page.title}`, value: addresses.segment,
			prompt: `Changes the final part after ${prefix}. The title stays the same. Child addresses change too; old page addresses will redirect.`, ignoreFocusOut: true,
			validateInput: async (segment) => {
				if (segment === addresses.segment) return 'Enter a different URL segment, or press Escape to cancel.';
				try { await stable((sources) => service.planEditorPageAddress({ ...options, segment, sources })); }
				catch (error) { return error.message; }
				return undefined;
			} });
		if (segment === undefined) return;
		const plan = await stable((sources) => service.planEditorPageAddress({ ...options, segment, sources }));
		const clean = () => {
			const current = documentSources();
			if ([...current.keys()].some((filename) => filename === path.join(page.siteRoot, 'site-config/settings.yaml')
				|| plan.sourceFiles.some((file) => file.contentPath === filename)
				|| filename === plan.sourceDirectory || filename.startsWith(plan.sourceDirectory + path.sep))) {
				throw new Error('Save or undo unsaved edits in the affected files before changing the address.');
			}
		};
		clean();
		const choice = await vscode.window.showWarningMessage(`Change the address of “${page.title}”?`, { modal: true,
			detail: `${plan.webFrom}\n→ ${plan.webTo}\n\n${plan.mappings.length - 1} descendant page(s) and ${plan.linkChanges.length} authored link(s) will change.\nOld page addresses are kept as redirects. Nested category addresses follow the folder move but have no redirects.\n\nDirectory: ${plan.sourceDirectory}\n→ ${plan.destinationDirectory}\n\nThis writes the directory and affected content files. Editor Undo does not reverse the whole operation. To return to an old address, first remove conflicting additional addresses on this page and its descendants, save, then change the URL segment again.` }, 'Change address');
		if (choice !== 'Change address') return;
		await chooseNode(page);
		clean();
		const result = await service.applyEditorPageAddress(plan, { renameDirectory: async (from, to) => {
			if (from === plan.sourceDirectory) { await chooseNode(page); clean(); }
			const edit = new vscode.WorkspaceEdit();
			edit.renameFile(vscode.Uri.file(from), vscode.Uri.file(to), { overwrite: false });
			if (!await vscode.workspace.applyEdit(edit)) throw new Error('VS Code could not move the page directory.');
		} });
		await refresh();
		await vscode.window.showTextDocument(vscode.Uri.file(result.sourcePath), { preview: false });
	};
	let running = false;
	for (const [name, action] of Object.entries({ incomingLinks: incoming, addressesAndLinks: async (target) => {
		const { page, service, options } = target;
		const addresses = await stable((sources) => service.getEditorPageAddresses({ ...options, sources }));
		const selected = await vscode.window.showQuickPick([
			{ label: 'Web address', description: addresses.webAddress ?? 'Repair site-config/settings.yaml to show the public address', detail: 'Select to copy the full address for sharing', copy: addresses.webAddress },
			{ label: 'Internal link', description: addresses.internalLink, detail: 'Select to copy for content.md; the deployment prefix is omitted', copy: addresses.internalLink },
			...(page.kind === 'page' && !page.isHome ? [{ label: 'Change URL segment…', description: addresses.segment, action: 'rename', detail: 'Rename the page folder within its current parent; preview links and child addresses first' }]
				: [{ label: page.isHome ? 'Homepage address is fixed' : 'Category address follows its folders', detail: page.isHome ? 'The domain and deployment prefix belong in site-config/settings.yaml.' : 'This action changes content-page addresses only.' }]),
			...(page.kind === 'page' ? [{ label: 'Additional addresses…', description: `${addresses.aliases.length} redirect(s)`, action: 'aliases' }] : []),
			{ label: 'Incoming links…', detail: 'Find authored links pointing to this page or category', action: 'incoming' },
			{ label: 'Help: page addresses and links', action: 'help' },
		], { title: `Addresses and links: ${page.title}`, ignoreFocusOut: true, matchOnDescription: true });
		if (!selected) return;
		await chooseNode(page);
		if (selected.copy) return vscode.env.clipboard.writeText(selected.copy);
		if (selected.action === 'incoming') return incoming(target);
		if (selected.action === 'aliases') return aliases(target, addresses);
		if (selected.action === 'rename') return rename(target, addresses);
		if (selected.action === 'help') return vscode.env.openExternal(vscode.Uri.parse('https://janga.github.io/norna/reference/site/urls/'));
	} })) register(`nornaEditor.${name}`, async (argument) => {
		if (running) throw new Error('Finish or cancel the current address action first.');
		running = true;
		try { return await action(await target(argument)); } finally { running = false; }
	});
}

module.exports = { registerSiteAddressActions };
