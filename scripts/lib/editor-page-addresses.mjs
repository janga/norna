import path from 'node:path';
import { readEditorLinkState, isInside } from './editor-site-links.mjs';
import { checkedPath, snapshot } from './editor-site-files.mjs';
import { createPageMovePlan } from './page-move-plan.mjs';
import { applyPageMovePlan } from './page-move-apply.mjs';

export const siteAddressApiVersion = 1;

export const getEditorPageAddresses = async (options) => {
	const { structure, graph, settings, incomplete } = await readEditorLinkState(options);
	const node = structure.nodes.find((entry) => (entry.contentPath ?? entry.categoryPath) === options.sourcePath);
	if (!node) throw new Error('This page is no longer in the selected site. Refresh Site Tree.');
	const internalLink = node.isHome ? '/' : `/${node.pagePath}/`;
	const base = settings?.url?.replace(/\/$/, '') + '/';
	return {
		internalLink, webAddress: settings ? new URL(internalLink.slice(1), base).href : null,
		segment: node.isHome ? '' : node.pageId,
		aliases: graph.pagesByPathname.get(internalLink)?.aliases ?? [],
		incomplete,
	};
};

export const planEditorPageAddress = async ({ siteRoot, sourcePath, segment, sources = new Map() }) => {
	await checkedPath(siteRoot, sourcePath);
	if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(segment)) throw new Error('Use lowercase letters, numbers and single hyphens, for example install-norna. Enter one URL segment, without slashes.');
	const state = await readEditorLinkState({ siteRoot, sources });
	if (state.incomplete.length) throw new Error(`Repair the site before changing an address. ${state.incomplete.join('\n')}`);
	const node = state.structure.nodes.find((entry) => entry.contentPath === sourcePath);
	if (!node || node.isHome) throw new Error('Choose a content page other than the homepage. Category addresses follow their folders and cannot be changed through this action.');
	const sourcePaths = [...state.structure.nodes.map((entry) => entry.contentPath ?? entry.categoryPath), path.join(siteRoot, 'site-config/settings.yaml')];
	if (sourcePaths.some((filename) => sources.has(filename))) throw new Error('Save or undo unsaved page, category and site-settings edits before changing an address.');
	for (const filename of sourcePaths) await checkedPath(siteRoot, filename);
	const to = `/${node.parentPagePath ? node.parentPagePath + '/' : ''}${segment}/`;
	const plan = await createPageMovePlan({ from: `/${node.pagePath}/`, to,
		graph: state.graph, publicFiles: state.publicFiles, siteStructure: state.structure,
		sitePagesDir: path.join(siteRoot, 'pages'), sitePagesLabel: `${siteRoot}/pages`, generatedRoutes: state.generatedRoutes });
	await checkedPath(siteRoot, plan.destinationDirectory);
	const watched = [...new Set([...sourcePaths, ...state.publicFiles.map(({ filePath }) => filePath)])].sort();
	const snapshots = [];
	for (const filename of watched) snapshots.push([filename, await snapshot(filename)]);
	const addresses = await getEditorPageAddresses({ siteRoot, sourcePath });
	return { ...plan, siteRoot, sourcePath, segment, generatedRoutes: state.generatedRoutes,
		webFrom: addresses.webAddress,
		webTo: new URL(to.slice(1), state.settings.url.replace(/\/$/, '') + '/').href,
		fingerprint: JSON.stringify([await snapshot(plan.sourceDirectory), snapshots, plan.to, plan.fileChanges.map(({ updatedSource }) => updatedSource)]) };
};

export const applyEditorPageAddress = async (plan, { renameDirectory } = {}) => {
	const current = await planEditorPageAddress(plan);
	if (current.fingerprint !== plan.fingerprint) throw new Error('The site changed after the address preview. Start again to review the new result.');
	if (!isInside(plan.siteRoot, current.sourceDirectory) || !isInside(plan.siteRoot, current.destinationDirectory)) throw new Error('The page must remain inside its site.');
	await applyPageMovePlan(current, { siteRoot: plan.siteRoot, generatedRoutes: current.generatedRoutes, renameDirectory });
	return { sourcePath: path.join(current.destinationDirectory, 'content.md'), url: current.to };
};
