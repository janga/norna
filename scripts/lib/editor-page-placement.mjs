import { rename } from 'node:fs/promises';
import path from 'node:path';
import { checkedPath, snapshot } from './editor-site-files.mjs';
import { readEditorLinkState } from './editor-site-links.mjs';
import { createPageMovePlan } from './page-move-plan.mjs';
import { applyPageMovePlan } from './page-move-apply.mjs';
import { getSiteSourcePaths } from './site-conventions.mjs';
import { comparePageOrder, planPageOrder, assertRenumberingAllowed } from './page-order.mjs';
import { pageOrderFileChanges } from './page-order-source.mjs';

export const sitePagePlacementApiVersion = 2;
export const sitePagePlacementOptionsApiVersion = 1;

const urlFor = (node) => node.isHome ? '/' : `/${node.pagePath}/`;
const childOf = (node, parent) => node.parentPagePath === (parent.pagePath || null);
const inBranch = (node, ancestor) => node.pagePath === ancestor.pagePath || node.pagePath.startsWith(`${ancestor.pagePath}/`);
const explainDestination = (owner, address) => {
	if (owner.kind === 'page') return `Cannot move here. ${address} already belongs to “${owner.source.title}”. Choose another location.`;
	if (owner.kind === 'page-alias') return `Cannot move here. ${address} is a previous address for “${owner.source.page.title}” at ${owner.source.targetPathname}. Choose another location.`;
	if (owner.kind === 'public-file') return `Cannot move here. ${address} is used by public file ${owner.label}. Choose another location.`;
	if (owner.kind === 'generated-route') return `Cannot move here. ${address} is used by generated route ${owner.label}. Choose another location.`;
	return `Cannot move here. ${address} is already used by ${owner.label}. Choose another location.`;
};

export const planEditorPagePlacement = async ({ siteRoot, sourcePath, targetPath, placement, preserveAliases = true, sources = new Map() }) => {
	if (typeof preserveAliases !== 'boolean') throw new Error('Choose whether to preserve old addresses as aliases.');
	if (!['before', 'after', 'first', 'last'].includes(placement)) throw new Error('Choose before, after, first child or last child.');
	siteRoot = path.resolve(siteRoot);
	await checkedPath(siteRoot, sourcePath);
	await checkedPath(siteRoot, targetPath);
	const state = await readEditorLinkState({ siteRoot, sources });
	if (state.incomplete.length) throw new Error(`Repair the site before moving a page. ${state.incomplete.join('\n')}`);
	const contentPaths = new Set(state.structure.nodes.map((node) => node.contentPath ?? node.categoryPath));
	const dirtyPaths = (files) => `Save or undo these unsaved files before moving:\n${files.map((filename) => `- ${path.relative(siteRoot, filename)}`).join('\n')}`;
	const dirtySiteFiles = [...sources.keys()].filter((filename) => contentPaths.has(filename)
		|| filename === path.join(siteRoot, 'site-config/settings.yaml')
		|| filename === sourcePath || filename.startsWith(path.dirname(sourcePath) + path.sep));
	if (dirtySiteFiles.length) throw new Error(dirtyPaths(dirtySiteFiles));
	const source = state.structure.nodes.find((node) => node.contentPath === sourcePath);
	const target = state.structure.nodes.find((node) => node.contentPath === targetPath);
	if (!source || source.isHome || !target) throw new Error('Select an existing page below the homepage and an existing destination page.');
	const parent = placement === 'first' || placement === 'last' ? target
		: state.structure.nodes.find((node) => node.pagePath === target.parentPagePath)
			?? state.structure.nodes.find((node) => node.isHome && !target.parentPagePath);
	if (!parent || inBranch(parent, source)) throw new Error('A page cannot move inside its own branch. Choose another destination.');
	const sameParent = source.parentPagePath === (parent.pagePath || null);
	const existing = state.structure.nodes.filter((node) => node.kind === 'page' && !node.isHome && childOf(node, parent) && node.contentPath !== sourcePath)
		.sort(comparePageOrder);
	const targetIndex = existing.findIndex((node) => node.contentPath === targetPath);
	if ((placement === 'before' || placement === 'after') && targetIndex < 0) throw new Error('The destination page changed. Refresh Site Tree and try again.');
	const index = placement === 'first' ? 0 : placement === 'last' ? existing.length
		: targetIndex + (placement === 'after' ? 1 : 0);
	const current = state.structure.nodes.filter((node) => node.kind === 'page' && !node.isHome && node.parentPagePath === source.parentPagePath)
		.sort(comparePageOrder);
	if (sameParent && current[index]?.contentPath === sourcePath) throw new Error('This page is already in that position.');
	const insertion = planPageOrder(existing, index);
	const sourceOrder = insertion.order;
	const orderChanges = await pageOrderFileChanges(insertion.orderChanges);
	const sourceDestination = sameParent ? source.nodeDir : null;
	const to = sameParent ? urlFor(source) : `${urlFor(parent)}${source.pageId}/`;
	let movePreview = null;
	if (!sameParent) {
		const owner = state.graph.aliasModel.identitiesByPathname.get(to);
		if (owner && !(owner.kind === 'page-alias' && owner.source.page.contentFile.contentPath === sourcePath)) {
			throw new Error(explainDestination(owner, to));
		}
		movePreview = await createPageMovePlan({ from: urlFor(source), to, order: sourceOrder, siblingOrderChanges: insertion.orderChanges, preserveAliases,
			graph: state.graph, publicFiles: state.publicFiles, siteStructure: state.structure,
			sitePagesDir: getSiteSourcePaths(siteRoot).pages,
			sitePagesLabel: `${siteRoot}/root/pages`, generatedRoutes: state.generatedRoutes });
	}
	const watched = new Set([source.nodeDir, path.join(siteRoot, 'site-config/settings.yaml'),
		...orderChanges.map(({ contentPath }) => contentPath),
		...state.structure.nodes.map((node) => node.contentPath ?? node.categoryPath),
		...state.publicFiles.map((file) => file.filePath)]);
	const fingerprints = [];
	for (const filename of [...watched].sort()) fingerprints.push([filename, await snapshot(filename)]);
	return {
		siteRoot, sourcePath, targetPath, placement, sourceDirectory: source.nodeDir,
		sameParent, sourceOrder, sourceUrl: urlFor(source), destinationUrl: to,
		sourceDestination, orderChanges, movePreview, preserveAliases,
		fileChanges: sameParent ? [...orderChanges, ...await pageOrderFileChanges([{ node: source, oldOrder: source.pageOrder, newOrder: sourceOrder }])] : movePreview.fileChanges,
		stateFingerprint: JSON.stringify(fingerprints),
		fingerprint: JSON.stringify([fingerprints, preserveAliases]),
	};
};

export const applyEditorPagePlacement = async (plan, { renameDirectory = rename, writeSource, allowRenumber = false, sources = new Map() } = {}) => {
	const current = await planEditorPagePlacement({ ...plan, sources });
	if (current.fingerprint !== plan.fingerprint || current.sourceOrder !== plan.sourceOrder
		|| JSON.stringify(current.orderChanges) !== JSON.stringify(plan.orderChanges)) {
		throw new Error('The site changed since this move was previewed. Review the placement and addresses again.');
	}
	assertRenumberingAllowed(current.orderChanges, allowRenumber);
	const mutation = current.sameParent ? {
		mode: 'reorder', orderChanges: current.orderChanges, fileChanges: current.fileChanges,
		sourceFiles: current.fileChanges.map(change => ({ contentPath: change.originalPath, contentLabel: change.contentLabel, source: change.originalSource })),
	} : current.movePreview;
	await applyPageMovePlan(mutation, { siteRoot: plan.siteRoot, generatedRoutes: current.movePreview?.generatedRoutes, renameDirectory, writeSource, allowRenumber });
	return { sourcePath: path.join(current.sameParent ? current.sourceDirectory : mutation.destinationDirectory, 'content.md'),
		url: current.destinationUrl, renumberedPages: current.orderChanges.length };
};
