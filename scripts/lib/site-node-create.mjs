import { comparePageOrder, parsePageOrder, planPageOrder, assertRenumberingAllowed } from './page-order.mjs';
import { pageOrderFileChanges } from './page-order-source.mjs';
import { writeFileAtomically } from './page-move-apply.mjs';
import { getSiteSourcePaths } from './site-conventions.mjs';
import { mkdir, realpath, rmdir, stat, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { dump as dumpYaml } from 'js-yaml';
import { slugifyAsciiIdentifier } from './heading-ids.mjs';
import { pageDirectoryPattern } from './page-model.mjs';
import { getSiteStructure } from './site-structure.mjs';
import { siteSchema } from './schema-definitions.mjs';
import { readEditorLinkState } from './editor-site-links.mjs';
import { createPageAliasModel, assertPageAliasModel } from './page-aliases.mjs';
import { parseYamlConfig } from './yaml-config.mjs';
import { publicationIssues } from './publication-paths.mjs';

const normalizeParentPath = (value) => {
	if (value === '/') return '';
	if (value.includes('\\') || value.includes('?') || value.includes('#')) {
		throw new Error(`Invalid --parent "${value}". Use a logical path such as /guides/installation/.`);
	}
	const normalized = value.replace(/^\/+|\/+$/g, '');
	if (!normalized || normalized.split('/').some((segment) => !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(segment))) {
		throw new Error(`Invalid --parent "${value}". Use / for the top level or a logical path such as /guides/installation/.`);
	}
	return normalized;
};

export const escapeMarkdownHeading = (value) => value.replace(/([\\`*_[\]{}<>#])/g, '\\$1');

const canonicalDirectory = async (directory) => realpath(directory).catch((error) => {
	if (error?.code === 'ENOENT') return path.resolve(directory);
	throw error;
});

const resolveParent = async ({ nodes, parent, siteRoot, invocationDirectory }) => {
	const sitePagesDir = getSiteSourcePaths(siteRoot).pages;
	if (parent !== null) {
		const parentPath = normalizeParentPath(parent);
		if (!parentPath) {
			return { collectionDir: sitePagesDir, node: null, pagePath: '' };
		}
		const node = nodes.find((candidate) => candidate.pagePath === parentPath);
		if (!node) {
			throw new Error(`Cannot find parent "${parent}". Use an existing page path, or / for the top level.`);
		}
		return { collectionDir: path.join(node.nodeDir, 'pages'), node, pagePath: node.pagePath };
	}

	const currentDirectory = await canonicalDirectory(invocationDirectory);
	if (currentDirectory === await canonicalDirectory(sitePagesDir) || currentDirectory === await canonicalDirectory(siteRoot)) {
		return { collectionDir: sitePagesDir, node: null, pagePath: '' };
	}
	let node = null;
	for (const candidate of nodes) {
		if (await canonicalDirectory(candidate.nodeDir) === currentDirectory) {
			node = candidate;
			break;
		}
	}
	if (!node) {
		throw new Error([
			'Cannot infer where to add the node from the current directory.',
			`Run the command from ${sitePagesDir} for a top-level node, from an existing page directory for a child, or pass --parent.`,
		].join('\n'));
	}
	return { collectionDir: path.join(node.nodeDir, 'pages'), node, pagePath: node.pagePath };
};

// Planning never writes. Callers must present this same destination before applying.
export const planSiteNodeCreation = async ({
	siteRoot, kind, title, slug = null, order = null, parentPath = '/',
	invocationDirectory = siteRoot, metadata, sources = new Map(), placement = null, targetPath = null,
}) => {
	const request = { siteRoot, kind, title, slug, order, parentPath, invocationDirectory, metadata, placement, targetPath };
	if (placement !== null && !['before', 'after', 'first', 'last'].includes(placement)) throw new Error('Choose before, after, first or last.');
	if (placement !== null && order !== null) throw new Error('Do not combine --order with a placement selector.');
	if (kind !== 'page') throw new Error('Choose a page. Navigation categories are no longer supported; use page.listChildren: true for an overview.');
	siteRoot = path.resolve(siteRoot);
	title = String(title ?? '').trim();
	if (!title || /[\r\n]/.test(title)) throw new Error('A one-line page title is required.');
	const generatedSlug = slug === null;
	slug ??= slugifyAsciiIdentifier(title);
	if (!slug || !pageDirectoryPattern.test(slug)) {
		throw new Error(`Invalid ${generatedSlug ? 'generated ' : ''}slug "${slug}". Use lowercase ASCII letters, numbers, and single hyphens; pass --slug when automatic transliteration is unsuitable.`);
	}

	const structure = await getSiteStructure({ siteRoot });
	let relativeTarget = null;
	if (placement === 'before' || placement === 'after') {
		relativeTarget = structure.nodes.find(node => node.contentPath === targetPath || `/${node.pagePath}/` === targetPath);
		if (!relativeTarget || relativeTarget.isHome) throw new Error('Choose an existing sibling page for before/after placement.');
		parentPath = relativeTarget.parentPagePath ? `/${relativeTarget.parentPagePath}/` : '/';
	}
	const parent = await resolveParent({ nodes: structure.nodes, parent: parentPath, siteRoot, invocationDirectory });
	const siblings = structure.nodes.filter((node) => !node.isHome && node.parentPagePath === (parent.pagePath || null)).sort(comparePageOrder);
	if (siblings.some((node) => node.pageId === slug)) {
		throw new Error(`Cannot create "${slug}" below ${parent.pagePath ? `/${parent.pagePath}/` : '/'}. A sibling with that slug already exists.`);
	}
	const dirty = [...sources.keys()].filter(filename => filename === path.join(siteRoot, 'site-config/settings.yaml') || siblings.some(node => node.contentPath === filename));
	if (dirty.length) throw new Error(`Save or undo these unsaved files before choosing page placement:\n${dirty.join('\n')}`);
	const index = placement === 'first' ? 0 : relativeTarget ? siblings.indexOf(relativeTarget) + (placement === 'after' ? 1 : 0) : siblings.length;
	const insertion = order === null ? planPageOrder(siblings, index) : { order: parsePageOrder(Number(order), '--order'), orderChanges: [] };
	order = insertion.order;
	const orderChanges = await pageOrderFileChanges(insertion.orderChanges);
	const directoryName = slug;
	const destination = path.join(parent.collectionDir, directoryName);
	const pagePath = [parent.pagePath, slug].filter(Boolean).join('/');
	const state = await readEditorLinkState({ siteRoot, sources });
	if (state.incomplete.length) throw new Error(`Page addresses could not be checked. ${state.incomplete.join('\n')}`);
	const address = `/${pagePath}/`;
	const owner = state.graph.aliasModel.identitiesByPathname.get(address);
	if (owner?.kind === 'page-alias') {
		const page = owner.source.page;
		throw new Error(`${address} is a previous address for “${page.title}”, now at ${owner.source.targetPathname}. Choose another URL segment, or remove this previous address from “${page.title}” through Addresses and links… → Additional addresses….`);
	}
	if (owner) throw new Error(`Address ${address} is already in use by ${owner.label}. Choose another URL segment.`);
	if (metadata !== undefined) {
		metadata = parseYamlConfig(dumpYaml(metadata), 'Page information', { schema: siteSchema });
		assertPageAliasModel(createPageAliasModel({ pages: [...state.graph.pages,
			{ pathname: `/${pagePath}/`, contentLabel: destination, aliases: metadata.page?.aliases ?? [] }],
			categories: [], publicFiles: state.publicFiles, generatedRoutes: state.generatedRoutes }));
	}
	const publicationErrors = publicationIssues({ pages: [...state.graph.pages,
		{ pathname: address, contentLabel: destination, aliases: metadata?.page?.aliases ?? [] }],
		publicFiles: state.publicFiles, attachments: state.graph.attachments.files, generatedRoutes: state.generatedRoutes });
	if (publicationErrors.length) throw new Error(publicationErrors.map(({ message }) => message).join('\n'));
	metadata = { ...metadata, navigation: { ...metadata?.navigation, order } };
	const fingerprint = JSON.stringify([destination, title, metadata, order, orderChanges, state.settings,
		state.graph.pages.map(page => [page.contentFile.contentPath, page.document.fullSource]), state.publicFiles.map(file => file.filePath)]);
	return { request, fingerprint, orderChanges, siteRoot, kind, title, slug, order, parentPath: parent.pagePath ? `/${parent.pagePath}/` : '/',
		collectionDir: parent.collectionDir, destination, pagePath, url: `/${pagePath}/`, ...(metadata === undefined ? {} : { metadata }) };
};

export const createSiteNode = async (plan, { sources = new Map(), allowRenumber = false, writeSource = writeFileAtomically } = {}) => {
	// Revalidate after the author has inspected the preview. Never change its placement.
	const current = await planSiteNodeCreation({ ...(plan.request ?? plan), sources });
	if (current.destination !== plan.destination || current.fingerprint !== plan.fingerprint) throw new Error('The site changed. Preview the new location before creating the node.');
	assertRenumberingAllowed(current.orderChanges, allowRenumber);
	const written = [];
	let createdCollection = false;
	try {
		const info = await stat(current.collectionDir);
		if (!info.isDirectory()) throw new Error(`${current.collectionDir} exists but is not a directory.`);
	} catch (error) {
		if (error.code !== 'ENOENT') throw error;
		await mkdir(current.collectionDir);
		createdCollection = true;
	}
	const created = [];
	try {
		// Exclusive reservation also protects an empty destination created after planning.
		await mkdir(current.destination);
		created.push({ file: current.destination, directory: true });
		const filename = path.join(current.destination, 'content.md');
		const source = `${current.metadata && Object.keys(current.metadata).length ? `---\n${dumpYaml(current.metadata, { lineWidth: -1, noRefs: true })}---\n\n` : ''}# ${escapeMarkdownHeading(current.title)}\n\n## Introduction\n\nStart writing here.\n`;
		await writeFile(filename, source, { flag: 'wx' });
		created.push({ file: filename });
		const childDirectory = path.join(current.destination, 'images');
		await mkdir(childDirectory);
		created.push({ file: childDirectory, directory: true });
		for (const change of current.orderChanges) {
			await writeSource(change.originalPath, change.updatedSource, change.mode);
			written.push(change);
		}
		return { ...current, sourcePath: filename, renumberedPages: current.orderChanges.length };
	} catch (error) {
		const restoreErrors = [];
		for (const change of written.reverse()) {
			try { await writeFileAtomically(change.originalPath, change.originalSource, change.mode); }
			catch (failure) { restoreErrors.push(`${change.originalPath}: ${failure.message}`); }
		}
		// Remove only entries this operation created; never recursively remove an
		// unexpected file written concurrently by another process.
		for (const entry of created.reverse()) {
			await (entry.directory ? rmdir(entry.file) : unlink(entry.file)).catch(() => {});
		}
		if (createdCollection) await rmdir(current.collectionDir).catch(() => {});
		if (restoreErrors.length) throw new Error(`${error.message}\nRestoration was incomplete:\n${restoreErrors.join('\n')}`);
		throw error;
	}
};
