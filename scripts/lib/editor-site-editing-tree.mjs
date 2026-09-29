import { getSiteSourcePaths } from './site-conventions.mjs';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { editorPageLocation, editorSourceDefinition } from './editor-source-files.mjs';
import { editorFileRemovalPolicy } from './editor-file-policy.mjs';
import { parseYamlConfig } from './yaml-config.mjs';
import { parsePageMarkdownSource } from './page-markdown.mjs';
import { sourceFileDefinitions } from './source-files.mjs';
import { getThemeDiagnostics } from './editor-language-service.mjs';
import { createEditorThemeHelp } from './editor-theme-help.mjs';

const excluded = new Set(['.norna', '.git', '.DS_Store', 'node_modules', 'dist', '.vscode-test']);
const knownNames = new Set([...sourceFileDefinitions.map((entry) => entry.name), 'category.yaml', 'theme.yaml', 'site-theme.yaml']);
const resourceId = (filename) => `resource:${filename}`;

// The physical traversal retains damaged entries that the logical page model
// cannot route. It reuses source schemas and page-path rules, without changing
// build validation.
export const readSiteEditingTree = async ({ siteRoot, sources = new Map(), snapshot, getInformation }) => {
	siteRoot = path.resolve(siteRoot);
	const items = [];
	const themeHelp = createEditorThemeHelp({ siteRoot, sources });
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
				if (['rootTheme', 'theme', 'pageTheme'].includes(definition.schemaKind)) {
					for (const diagnostic of await getThemeDiagnostics({ siteRoot, documentPath: item.sourcePath, source, sources })) issue(item, diagnostic.message, diagnostic.severity, item.sourcePath, diagnostic.line);
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
			if (location?.isHome && error.code === 'ENOENT') entries = [];
			else {
				if (owner) issue(owner, `Cannot read ${directory}: ${error.message}`, 'error', directory);
				return;
			}
		}
		const names = new Map(entries.map((entry) => [entry.name, entry]));
		let container;
		if (location) {
			const hasContent = names.get('content.md')?.isFile();
			const hasCategory = names.get('category.yaml')?.isFile();
			const kind = hasContent ? 'page' : 'incomplete';
			const sourcePath = path.join(directory, 'content.md');
			const logical = byDirectory.get(directory);
			let information = {};
			if (kind !== 'incomplete') {
				try { information = logical?.kind === kind ? logical : await getInformation({ source: await read(sourcePath), sourcePath, kind, isHome: location.isHome, fallbackTitle: location.pageId }); }
				catch (error) { information = { problem: `Cannot read ${sourcePath}: ${error.message}` }; }
			}
			container = { ...logical, ...location, ...information, kind, sourcePath, id: sourcePath, ownerId: sourcePath, parentId,
				directory, title: information.title ?? (location.isHome ? path.basename(siteRoot) : location.pageId),
				url: location.isHome ? '/' : `/${location.pagePath}/`, missingSource: kind === 'incomplete' };
			items.push(container);
			if (kind === 'page') container.themeHelp = await themeHelp(directory);
			if (information.problem) issue(container, information.problem);
			if (kind !== 'incomplete') await validate(container);
			else issue(container, location.isHome ? 'Homepage content.md is missing. Use Add to create it.'
				: 'Page content.md is missing. Use Add to create it.');
			if (hasCategory) issue(container, 'category.yaml is no longer supported. Use content.md with page.listChildren: true for an overview.');
			owner = container;
		} else if (role === 'site') {
			container = { id: null };
		} else {
			container = { id: resourceId(directory), parentId, ownerId: owner.id, sourcePath: directory,
				kind: 'directory', role, title: path.basename(directory), description: role === 'public'
					? 'Files published unchanged with the site, such as robots.txt and icons.' : role === 'configuration' ? 'Settings and content shared by the complete site' : '' };
			items.push(container);
		}
		const order = location ? ['images', 'tree-theme.yaml', 'page-theme.yaml', 'pages']
			: role === 'site' ? ['site-config', 'public', 'root']
			: role === 'configuration' ? ['settings.yaml', 'shared-content.yaml'] : [];
		const rank = (entry) => order.includes(entry.name) ? order.indexOf(entry.name) : order.length;
		entries.sort((a, b) => rank(a) - rank(b) || a.name.localeCompare(b.name, 'en', { numeric: true }));
		for (const entry of entries) {
			const filename = path.join(directory, entry.name);
			if (location && entry.name === 'content.md' && entry.isFile() && owner.kind === 'page') continue;
			if (entry.isDirectory()) {
				const childLocation = role === 'pages' || role === 'site' && entry.name === 'root' ? editorPageLocation(siteRoot, filename) : null;
				const childRole = childLocation ? 'page' : location && entry.name === 'pages' ? 'pages'
					: location && entry.name === 'images' && owner.kind === 'page' ? 'images'
						: role === 'site' && entry.name === 'site-config' ? 'configuration'
							: role === 'public' || role === 'site' && entry.name === 'public' ? 'public' : 'extra';
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
			if (['rootTheme', 'theme', 'pageTheme'].includes(definition?.schemaKind)) file.themeHelp = await themeHelp(directory, filename);
			if (definition) await validate(file);
			else if (role !== 'public' && ['site-config', 'public', 'pages', 'images'].includes(entry.name)) issue(file, `Expected a directory named ${entry.name}, but this is a file. Rename or move this file through Explorer before creating the directory.`, 'warning');
			else if (role !== 'public' && entry.name === 'category.yaml') issue(file, 'category.yaml is no longer supported. Create content.md with page.listChildren: true, then remove this file.', 'warning');
			else if (role !== 'public' && knownNames.has(entry.name)) issue(file, `This source file is in the wrong location. Put content.md, tree-theme.yaml and page-theme.yaml in a valid page directory; put settings.yaml and shared-content.yaml in the site's site-config/.`, 'warning');
			else if (role !== 'public' && !(role === 'images' && /\.(jpe?g|png|svg)$/i.test(entry.name))) file.note = 'Not used by Norna';
		}
	};
	const source = getSiteSourcePaths(siteRoot);
	// Site resources have their own owner even when root/content.md is unreadable.
	// The site context is not a visible row in the physical tree.
	const owner = { id: siteRoot, sourcePath: siteRoot, issues: [] };
	await visit(siteRoot, null, owner, 'site');
	if (!items.some((item) => item.isHome)) await visit(source.root, null, owner, 'page', editorPageLocation(siteRoot, source.root));
	const configuration = items.find((item) => item.role === 'configuration' && item.kind === 'directory');
	const homepage = items.find((item) => item.isHome);
	for (const [filename, target] of [[path.join(siteRoot, 'site-config/settings.yaml'), configuration], [source.theme, homepage]]) {
		try { await read(filename); }
		catch (error) {
			issue(target ?? owner, error.code === 'ENOENT' || error.code === 'ENOTDIR'
				? `Required ${path.relative(siteRoot, filename)} is missing. Use Add to create it.` : error.message, 'error', filename);
		}
	}

	// Keep shared structural diagnostics, including duplicate sibling identifiers.
	for (const problem of snapshot.problems) {
		if (![owner, ...items].some((item) => item.issues?.some((entry) => entry.message === problem.message && entry.path === problem.path))) {
			const target = items.find((item) => item.sourcePath === problem.path || item.directory === problem.path) ?? owner;
			issue(target, problem.message, 'error', problem.path);
		}
	}
	return { ...snapshot, items, problems: owner.issues };
};
