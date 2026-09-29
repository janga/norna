import { randomUUID } from 'node:crypto';
import { rename } from 'node:fs/promises';
import path from 'node:path';
import { checkedPath, snapshot } from './editor-site-files.mjs';
import { readEditorLinkState } from './editor-site-links.mjs';
import { createPageMovePlan } from './page-move-plan.mjs';
import { applyPageMovePlan } from './page-move-apply.mjs';
import { getSiteSourcePaths } from './site-conventions.mjs';
import { getSiteStructure } from './site-structure.mjs';

export const sitePagePlacementApiVersion = 1;

const urlFor = (node) => node.isHome ? '/' : `/${node.pagePath}/`;
const childOf = (node, parent) => node.parentPagePath === (parent.pagePath || null);
const inBranch = (node, ancestor) => node.pagePath === ancestor.pagePath || node.pagePath.startsWith(`${ancestor.pagePath}/`);
const pad = (order) => String(order).padStart(3, '0');
const renamedDirectory = (node, order) => path.join(path.dirname(node.nodeDir), `${pad(order)}-${node.pageId}`);

const explainDestination = (owner, address) => {
	if (owner.kind === 'page') return `Cannot move here. ${address} already belongs to “${owner.source.title}”. Choose another location.`;
	if (owner.kind === 'page-alias') return `Cannot move here. ${address} is a previous address for “${owner.source.page.title}” at ${owner.source.targetPathname}. Choose another location.`;
	if (owner.kind === 'public-file') return `Cannot move here. ${address} is used by public file ${owner.label}. Choose another location.`;
	if (owner.kind === 'generated-route') return `Cannot move here. ${address} is used by generated route ${owner.label}. Choose another location.`;
	return `Cannot move here. ${address} is already used by ${owner.label}. Choose another location.`;
};

const orderForInsertion = (siblings, index) => {
	const before = siblings[index - 1]?.pageOrder ?? 0;
	const after = siblings[index]?.pageOrder ?? 1000;
	return after - before > 1 ? Math.floor((before + after) / 2) : null;
};

const applyDirectoryRenames = async (changes, renameDirectory) => {
	const staged = changes.map((change) => ({ ...change,
		temporary: path.join(path.dirname(change.from), `.${path.basename(change.from)}.norna-order-${randomUUID()}.tmp`),
		current: change.from }));
	const restore = async () => {
		const failures = [];
		for (const change of staged.filter((entry) => entry.current === entry.to).reverse()) {
			try { await renameDirectory(change.to, change.temporary); change.current = change.temporary; }
			catch (error) { failures.push(`${change.to}: ${error.message}`); }
		}
		for (const change of staged.filter((entry) => entry.current === entry.temporary).reverse()) {
			try { await renameDirectory(change.temporary, change.from); change.current = change.from; }
			catch (error) { failures.push(`${change.from}: ${error.message}`); }
		}
		return failures;
	};
	try {
		for (const change of staged) {
			await renameDirectory(change.from, change.temporary);
			change.current = change.temporary;
		}
		for (const change of staged) {
			await renameDirectory(change.temporary, change.to);
			change.current = change.to;
		}
	} catch (error) {
		const failures = await restore();
		throw new Error(`${error.message}${failures.length ? `\nRestoration was incomplete. Inspect:\n${failures.join('\n')}` : '\nThe original page order was restored.'}`);
	}
	return restore;
};

export const planEditorPagePlacement = async ({ siteRoot, sourcePath, targetPath, placement, sources = new Map() }) => {
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
		.sort((left, right) => left.pageOrder - right.pageOrder);
	const targetIndex = existing.findIndex((node) => node.contentPath === targetPath);
	if ((placement === 'before' || placement === 'after') && targetIndex < 0) throw new Error('The destination page changed. Refresh Site Tree and try again.');
	const index = placement === 'first' ? 0 : placement === 'last' ? existing.length
		: targetIndex + (placement === 'after' ? 1 : 0);
	const current = state.structure.nodes.filter((node) => node.kind === 'page' && !node.isHome && node.parentPagePath === source.parentPagePath)
		.sort((left, right) => left.pageOrder - right.pageOrder);
	if (sameParent && current[index]?.contentPath === sourcePath) throw new Error('This page is already in that position.');
	if (existing.length >= 999) throw new Error('This parent already has the maximum of 999 pages. Choose another parent.');
	const inserted = [...existing];
	inserted.splice(index, 0, source);
	let sourceOrder = orderForInsertion(existing, index);
	const orderChanges = [];
	if (sourceOrder === null) {
		const step = Math.floor(999 / inserted.length);
		for (let position = 0; position < inserted.length; position += 1) {
			const node = inserted[position];
			const order = (position + 1) * step;
			if (node.contentPath === sourcePath) sourceOrder = order;
			else if (node.pageOrder !== order) orderChanges.push({ from: node.nodeDir, to: renamedDirectory(node, order) });
		}
	}
	const sourceDestination = sameParent ? renamedDirectory(source, sourceOrder) : null;
	if (sameParent && sourceDestination !== source.nodeDir) orderChanges.push({ from: source.nodeDir, to: sourceDestination });
	const dirtyRenamedFiles = [...sources.keys()].filter((filename) => orderChanges.some(({ from }) => filename.startsWith(from + path.sep)));
	if (dirtyRenamedFiles.length) throw new Error(dirtyPaths(dirtyRenamedFiles));
	const to = sameParent ? urlFor(source) : `${urlFor(parent)}${source.pageId}/`;
	let movePreview = null;
	if (!sameParent) {
		const owner = state.graph.aliasModel.identitiesByPathname.get(to);
		if (owner && !(owner.kind === 'page-alias' && owner.source.page.contentFile.contentPath === sourcePath)) {
			throw new Error(explainDestination(owner, to));
		}
		const occupied = new Set(existing.map((node) => node.pageOrder));
		const provisionalOrder = occupied.has(sourceOrder)
			? Array.from({ length: 999 }, (_, position) => position + 1).find((order) => !occupied.has(order))
			: sourceOrder;
		movePreview = await createPageMovePlan({ from: urlFor(source), to, order: provisionalOrder,
			graph: state.graph, publicFiles: state.publicFiles, siteStructure: state.structure,
			sitePagesDir: getSiteSourcePaths(siteRoot).pages,
			sitePagesLabel: `${siteRoot}/root/pages`, generatedRoutes: state.generatedRoutes });
	}
	const watched = new Set([source.nodeDir, path.join(siteRoot, 'site-config/settings.yaml'),
		...orderChanges.map(({ from }) => from),
		...state.structure.nodes.map((node) => node.contentPath ?? node.categoryPath),
		...state.publicFiles.map((file) => file.filePath)]);
	const fingerprints = [];
	for (const filename of [...watched].sort()) fingerprints.push([filename, await snapshot(filename)]);
	return {
		siteRoot, sourcePath, targetPath, placement, sourceDirectory: source.nodeDir,
		sameParent, sourceOrder, sourceUrl: urlFor(source), destinationUrl: to,
		sourceDestination, orderChanges, movePreview,
		fingerprint: JSON.stringify(fingerprints),
	};
};

export const applyEditorPagePlacement = async (plan, { renameDirectory = rename } = {}) => {
	const current = await planEditorPagePlacement(plan);
	if (current.fingerprint !== plan.fingerprint || current.sourceOrder !== plan.sourceOrder
		|| JSON.stringify(current.orderChanges) !== JSON.stringify(plan.orderChanges)) {
		throw new Error('The site changed since this move was previewed. Review the placement and addresses again.');
	}
	if (current.sameParent) {
		await applyDirectoryRenames(current.orderChanges, renameDirectory);
		try { await getSiteStructure({ siteRoot: plan.siteRoot }); }
		catch (error) {
			const reversed = current.orderChanges.map(({ from, to }) => ({ from: to, to: from }));
			const restoreErrors = await applyDirectoryRenames(reversed, renameDirectory).then(() => [], (failure) => [failure.message]);
			throw new Error(`${error.message}${restoreErrors.length ? `\nRestoration was incomplete: ${restoreErrors.join('\n')}` : '\nThe original page order was restored.'}`);
		}
		return { sourcePath: path.join(current.sourceDestination, 'content.md'), url: current.sourceUrl };
	}
	const restoreOrder = await applyDirectoryRenames(current.orderChanges, renameDirectory);
	try {
		const state = await readEditorLinkState({ siteRoot: plan.siteRoot });
		const move = await createPageMovePlan({ from: current.sourceUrl, to: current.destinationUrl, order: current.sourceOrder,
			graph: state.graph, publicFiles: state.publicFiles, siteStructure: state.structure,
			sitePagesDir: getSiteSourcePaths(plan.siteRoot).pages,
			sitePagesLabel: `${plan.siteRoot}/root/pages`, generatedRoutes: state.generatedRoutes });
		await applyPageMovePlan(move, { siteRoot: plan.siteRoot, generatedRoutes: state.generatedRoutes, renameDirectory });
		return { sourcePath: path.join(move.destinationDirectory, 'content.md'), url: current.destinationUrl };
	} catch (error) {
		const failures = await restoreOrder();
		throw new Error(`${error.message}${failures.length ? `\nPage order restoration was incomplete. Inspect:\n${failures.join('\n')}` : ''}`);
	}
};
