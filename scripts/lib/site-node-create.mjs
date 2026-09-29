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

const parseOrder = (value) => {
	if (!/^\d{1,3}$/.test(value)) {
		throw new Error(`Invalid --order "${value}". Use an integer from 1 to 999.`);
	}
	const order = Number.parseInt(value, 10);
	if (order < 1 || order > 999) {
		throw new Error(`Invalid --order "${value}". Use an integer from 1 to 999.`);
	}
	return order;
};

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

const getNextOrder = (siblings) => {
	const highestOrder = siblings.reduce((highest, node) => Math.max(highest, node.pageOrder), 0);
	const nextOrder = Math.floor(highestOrder / 10) * 10 + 10;
	if (nextOrder > 999) {
		throw new Error('No automatic page order remains below 1000. Reorder the sibling nodes before adding another one.');
	}
	return nextOrder;
};

export const escapeMarkdownHeading = (value) => value.replace(/([\\`*_[\]{}<>#])/g, '\\$1');

const canonicalDirectory = async (directory) => realpath(directory).catch((error) => {
	if (error?.code === 'ENOENT') return path.resolve(directory);
	throw error;
});

const resolveParent = async ({ nodes, parent, siteRoot, invocationDirectory }) => {
	const sitePagesDir = path.join(siteRoot, 'pages');
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
	if (currentDirectory === await canonicalDirectory(sitePagesDir)) {
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
	invocationDirectory = siteRoot, metadata, sources = new Map(),
}) => {
	if (kind !== 'page') throw new Error('Choose a page. Navigation categories are no longer supported; use page.listChildren: true for an overview.');
	siteRoot = path.resolve(siteRoot);
	title = String(title ?? '').trim();
	if (!title || /[\r\n]/.test(title)) throw new Error('A one-line page title is required.');
	const generatedSlug = slug === null;
	slug ??= slugifyAsciiIdentifier(title);
	if (!slug || !pageDirectoryPattern.test(`010-${slug}`)) {
		throw new Error(`Invalid ${generatedSlug ? 'generated ' : ''}slug "${slug}". Use lowercase ASCII letters, numbers, and single hyphens; pass --slug when automatic transliteration is unsuitable.`);
	}

	const structure = await getSiteStructure({ siteRoot });
	const parent = await resolveParent({ nodes: structure.nodes, parent: parentPath, siteRoot, invocationDirectory });
	const siblings = structure.nodes.filter((node) => !node.isHome && node.parentPagePath === (parent.pagePath || null));
	if (siblings.some((node) => node.pageId === slug)) {
		throw new Error(`Cannot create "${slug}" below ${parent.pagePath ? `/${parent.pagePath}/` : '/'}. A sibling with that slug already exists.`);
	}
	order = order === null ? getNextOrder(siblings) : parseOrder(String(order));
	if (siblings.some((node) => node.pageOrder === order)) {
		throw new Error(`Cannot use order ${String(order).padStart(3, '0')} below ${parent.pagePath ? `/${parent.pagePath}/` : '/'}. A sibling already uses it.`);
	}

	const directoryName = `${String(order).padStart(3, '0')}-${slug}`;
	const destination = path.join(parent.collectionDir, directoryName);
	const pagePath = [parent.pagePath, slug].filter(Boolean).join('/');
	if (metadata !== undefined) {
		metadata = parseYamlConfig(dumpYaml(metadata), 'Page information', { schema: siteSchema });
		const state = await readEditorLinkState({ siteRoot, sources });
		if (state.incomplete.length) throw new Error(`Page addresses could not be checked. ${state.incomplete.join('\n')}`);
		if (state.graph.aliasModel.identitiesByPathname.has(`/${pagePath}/`)) throw new Error(`Address /${pagePath}/ is already in use. Choose another URL segment.`);
		assertPageAliasModel(createPageAliasModel({ pages: [...state.graph.pages,
			{ pathname: `/${pagePath}/`, contentLabel: destination, aliases: metadata.page?.aliases ?? [] }],
			categories: [], publicFiles: state.publicFiles, generatedRoutes: state.generatedRoutes }));
	}
	return { siteRoot, kind, title, slug, order, parentPath: parent.pagePath ? `/${parent.pagePath}/` : '/',
		collectionDir: parent.collectionDir, destination, pagePath, url: `/${pagePath}/`, ...(metadata === undefined ? {} : { metadata }) };
};

export const createSiteNode = async (plan, { sources = new Map() } = {}) => {
	// Revalidate after the author has inspected the preview. Never change its placement.
	const current = await planSiteNodeCreation({ ...plan, sources });
	if (current.destination !== plan.destination) throw new Error('The site changed. Preview the new location before creating the node.');
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
		return { ...current, sourcePath: filename };
	} catch (error) {
		// Remove only entries this operation created; never recursively remove an
		// unexpected file written concurrently by another process.
		for (const entry of created.reverse()) {
			await (entry.directory ? rmdir(entry.file) : unlink(entry.file)).catch(() => {});
		}
		if (createdCollection) await rmdir(current.collectionDir).catch(() => {});
		throw error;
	}
};
