import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { editorPageLocation, editorSourceDefinition } from './editor-source-files.mjs';
import { editorFileRemovalPolicy } from './editor-file-policy.mjs';
import { parseYamlConfig } from './yaml-config.mjs';
import { parsePageMarkdownSource } from './page-markdown.mjs';
import { getThemeDiagnostics } from './editor-language-service.mjs';

const excluded = new Set(['.norna', '.git', '.DS_Store', 'node_modules', 'dist', '.vscode-test']);
const knownNames = new Set(['content.md', 'category.yaml', 'theme.yaml', 'settings.yaml', 'site-theme.yaml', 'shared-content.yaml']);
const resourceId = (filename) => `resource:${filename}`;

// The physical traversal retains damaged entries that the logical page model
// cannot route. It reuses source schemas and page-path rules, without changing
// build validation or the older file-tree projection.
export const readSiteEditingTree = async ({ siteRoot, sources = new Map(), snapshot, getInformation }) => {
	siteRoot = path.resolve(siteRoot);
	const items = [];
	const byDirectory = new Map(snapshot.nodes.map((node) => [path.dirname(node.sourcePath), node]));
	const read = (filename) => sources.has(filename) ? sources.get(filename) : readFile(filename, 'utf8');
	const entriesAt = async (directory) => (await readdir(directory, { withFileTypes: true }))
		.filter((entry) => !excluded.has(entry.name) && !entry.name.startsWith('._') && (entry.isFile() || entry.isDirectory()));
	const issue = (item, message, severity = 'error', filename = item.sourcePath, line = 1) => {
		(item.issues ??= []).push({ message, severity, path: filename, line });
	};
	const validate = async (item) => {
		const definition = editorSourceDefinition(siteRoot, item.sourcePath);
		if (!definition) return;
		try {
			const source = await read(item.sourcePath);
			if (definition.schema) {
				parseYamlConfig(source, item.sourcePath, { schema: definition.schema });
				if (['theme.yaml', 'site-theme.yaml'].includes(path.basename(item.sourcePath))) {
					for (const diagnostic of await getThemeDiagnostics({ documentPath: item.sourcePath, source })) issue(item, diagnostic.message, diagnostic.severity, item.sourcePath, diagnostic.line);
				}
			} else {
				const document = await parsePageMarkdownSource(source, { label: item.sourcePath });
				for (const diagnostic of document.diagnostics) issue(item, diagnostic.message, diagnostic.severity, item.sourcePath, diagnostic.line);
			}
		} catch (error) { issue(item, error.message); }
	};
	const visit = async (directory, parentId, owner, role, location = null) => {
		let entries;
		try { entries = await entriesAt(directory); }
		catch (error) {
			if (owner) issue(owner, `Cannot read ${directory}: ${error.message}`);
			else {
				const sourcePath = path.join(siteRoot, 'content.md');
				const root = { id: sourcePath, ownerId: sourcePath, parentId: null, sourcePath, directory: siteRoot,
					kind: 'incomplete', isHome: true, missingSource: true, title: path.basename(siteRoot) };
				issue(root, `Cannot read ${directory}: ${error.message}`); items.push(root);
			}
			return;
		}
		const names = new Map(entries.map((entry) => [entry.name, entry]));
		let container;
		if (location) {
			const hasContent = names.get('content.md')?.isFile();
			const hasCategory = names.get('category.yaml')?.isFile();
			const conflict = Boolean(hasContent && hasCategory);
			const kind = !hasContent && (location.isHome || !hasCategory) ? 'incomplete' : hasCategory && !location.isHome ? 'category' : 'page';
			const sourcePath = path.join(directory, kind === 'category' ? 'category.yaml' : 'content.md');
			const logical = byDirectory.get(directory);
			let information = {};
			if (kind !== 'incomplete') {
				try { information = logical?.kind === kind ? logical : await getInformation({ source: await read(sourcePath), sourcePath, kind, isHome: location.isHome, fallbackTitle: location.pageId }); }
				catch (error) { information = { problem: `Cannot read ${sourcePath}: ${error.message}` }; }
			}
			container = { ...logical, ...location, ...information, kind, sourcePath, id: sourcePath, ownerId: sourcePath, parentId,
				directory, title: information.title ?? (location.isHome ? path.basename(siteRoot) : location.pageId),
				url: location.isHome ? '/' : `/${location.pagePath}/`, missingSource: kind === 'incomplete', conflict };
			items.push(container);
			if (information.problem) issue(container, information.problem);
			if (kind !== 'incomplete') await validate(container);
			else issue(container, location.isHome ? 'Homepage content.md is missing. Use Add to create it.'
				: 'Neither content.md nor category.yaml exists. Use Add to choose a page or category source.');
			if (conflict) issue(container, 'Both content.md and category.yaml exist. Keep one source: page content or category information.');
			if (location.isHome) for (const name of ['settings.yaml', 'site-theme.yaml']) {
				try { await read(path.join(directory, 'site-config', name)); }
				catch (error) { if (error.code === 'ENOENT' || error.code === 'ENOTDIR') issue(container, `Required site-config/${name} is missing. Use Add to create it.`, 'error', path.join(directory, 'site-config', name)); else issue(container, error.message); }
			}
			owner = container;
		} else {
			container = { id: resourceId(directory), parentId, ownerId: owner.id, sourcePath: directory,
				kind: 'directory', role, title: path.basename(directory), description: role === 'public'
					? 'Files published unchanged with the site, such as robots.txt and icons.' : role === 'configuration' ? 'Settings and content shared by the complete site' : '' };
			items.push(container);
		}
		const order = location ? ['theme.yaml', 'site-config', 'public', 'category.yaml', 'images', 'pages']
			: role === 'configuration' ? ['settings.yaml', 'site-theme.yaml', 'shared-content.yaml'] : [];
		const rank = (entry) => order.includes(entry.name) ? order.indexOf(entry.name) : order.length;
		entries.sort((a, b) => rank(a) - rank(b) || a.name.localeCompare(b.name, 'en', { numeric: true }));
		for (const entry of entries) {
			const filename = path.join(directory, entry.name);
			if (location && entry.name === 'content.md' && entry.isFile() && owner.kind === 'page' && !owner.conflict) continue;
			if (entry.isDirectory()) {
				const childLocation = role === 'pages' ? editorPageLocation(siteRoot, filename) : null;
				const childRole = location && entry.name === 'pages' ? 'pages'
					: location && entry.name === 'images' && owner.kind === 'page' ? 'images'
						: location?.isHome && entry.name === 'site-config' ? 'configuration'
							: role === 'public' || location?.isHome && entry.name === 'public' ? 'public' : 'extra';
				await visit(filename, container.id, owner, childRole, childLocation);
				const child = items.find((item) => item.sourcePath === filename);
				if (child && childRole === 'extra' && (knownNames.has(entry.name) || ['images', 'pages', 'site-config', 'public'].includes(entry.name) || role === 'pages')) {
					issue(child, `This directory is not at a permitted Norna location: ${filename}. Use pages/NNN-page-id for child entries, images/ beside page content, and site-config/ or public/ only at the site root.`, 'warning');
				}
				continue;
			}
			const definition = role !== 'public' ? editorSourceDefinition(siteRoot, filename) : null;
			const file = { id: resourceId(filename), parentId: container.id, ownerId: owner.id, kind: 'file', sourcePath: filename,
				title: entry.name, role: definition ? 'configuration' : 'asset', description: definition?.description ?? '',
				removable: Boolean(editorFileRemovalPolicy({ siteRoot, sourcePath: owner.sourcePath, filePath: filename })) };
			items.push(file);
			if (definition) await validate(file);
			else if (role !== 'public' && ['site-config', 'public', 'pages', 'images'].includes(entry.name)) issue(file, `Expected a directory named ${entry.name}, but this is a file. Rename or move this file through Explorer before creating the directory.`, 'warning');
			else if (role !== 'public' && knownNames.has(entry.name)) issue(file, `This source file is in the wrong location. Put content.md, category.yaml and theme.yaml in a valid page directory; put settings.yaml, site-theme.yaml and shared-content.yaml in the site's site-config/.`, 'warning');
			else if (role !== 'public' && !(role === 'images' && /\.(jpe?g|png|svg)$/i.test(entry.name))) file.note = 'Not used by Norna';
		}
	};
	await visit(siteRoot, null, null, null, editorPageLocation(siteRoot, siteRoot));
	const home = items[0];
	// Keep shared structural diagnostics, including duplicate sibling identifiers.
	for (const problem of snapshot.problems) {
		if (home && !items.some((item) => item.issues?.some((entry) => entry.message === problem.message))) {
			const target = items.find((item) => item.sourcePath === problem.path) ?? home;
			issue(target, problem.message);
		}
	}
	return { ...snapshot, items, problems: [] };
};
