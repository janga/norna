import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { isMap, isScalar, isSeq, parseDocument } from 'yaml';
import { getMarkdownHeadings, slugifyAsciiIdentifier } from './heading-ids.mjs';
import { parsePageDirectoryPath } from './page-model.mjs';
import { splitPageMarkdownSource } from './page-markdown.mjs';
import { categorySchema, siteSchema } from './schema-definitions.mjs';
import { homePageDirectory } from './site-conventions.mjs';
import { createSiteNode, escapeMarkdownHeading, planSiteNodeCreation } from './site-node-create.mjs';
import { getSiteStructure } from './site-structure.mjs';
import { parseYamlConfig } from './yaml-config.mjs';
import { editorFileRemovalPolicy } from './editor-file-policy.mjs';
import { readEditorLinkState } from './editor-site-links.mjs';

// Optional capability: older engines keep IntelliSense without exposing writes
// through a site-tree API whose contract they do not implement.
export const siteTreeApiVersion = 1;
export const siteFileTreeApiVersion = 1;
export { createSiteNode, planSiteNodeCreation, slugifyAsciiIdentifier };
export { siteFileOperationsApiVersion, siteRemovalApiVersion, planEditorImageCopy, planEditorRemoval, getEditorImageUsage, createEditorImageAppend } from './editor-site-files.mjs';
export { getEditorIncomingLinks } from './editor-site-links.mjs';
export { siteAddressApiVersion, getEditorPageAddresses, planEditorPageAddress, applyEditorPageAddress } from './editor-page-addresses.mjs';

const sourceParts = (source, kind) => {
	if (kind === 'category') return { yaml: source, offset: 0, body: '', bodyLine: 0 };
	const split = splitPageMarkdownSource(source);
	if (split.frontmatterUnclosed) throw new Error('Close the YAML frontmatter with --- before editing page information.');
	const lines = source.match(/[^\n]*\n|[^\n]+$/g) ?? [];
	const bodyLine = split.lineOffset;
	return {
		yaml: bodyLine ? lines.slice(1, bodyLine - 1).join('') : '',
		offset: bodyLine ? lines[0].length : 0,
		body: split.body,
		bodyLine,
	};
};

const parseInformation = async ({ source, kind, isHome, sourcePath }) => {
	const parts = sourceParts(source, kind);
	const data = parseYamlConfig(parts.yaml, sourcePath, { schema: kind === 'category' ? categorySchema : siteSchema });
	if (kind === 'category') return { title: data.label, description: data.description ?? '', listed: true, aliases: [] };
	const { headings } = await getMarkdownHeadings(parts.body);
	const titles = headings.filter(({ depth }) => depth === 1);
	if (titles.length !== 1) throw new Error('Keep exactly one Markdown H1 title in this page before editing its information.');
	if (isHome && data.navigation?.listed === false) throw new Error('Home must remain listed. Remove navigation.listed: false.');
	return {
		title: titles[0].title,
		description: data.page?.description ?? '',
		listed: data.navigation?.listed !== false,
		aliases: data.page?.aliases ?? [],
		titleLine: parts.bodyLine + titles[0].line - 1,
		titleLineCount: titles[0].source.split('\n').length,
	};
};

export const getSiteNodeInformation = async (input) => {
	try {
		return { ...await parseInformation(input), problem: null };
	} catch (error) {
		return { title: input.fallbackTitle ?? path.basename(path.dirname(input.sourcePath)),
			description: '', listed: true, aliases: [], problem: error.message };
	}
};

export const readSiteTree = async ({ siteRoot, sources = new Map(), cache = new Map() }) => {
	const readSource = (filename) => sources.has(filename) ? sources.get(filename) : readFile(filename, 'utf8');
	const structure = await getSiteStructure({ siteRoot, tolerant: true, readSource });
	const nodes = [];
	const used = new Set();
	for (const node of structure.nodes) {
		const sourcePath = node.contentPath ?? node.categoryPath;
		used.add(sourcePath);
		let information;
		try {
			const source = await readSource(sourcePath);
			const previous = cache.get(sourcePath);
			information = previous?.source === source ? previous.information : await getSiteNodeInformation({
				kind: node.kind, isHome: node.isHome, source, sourcePath, fallbackTitle: node.label ?? node.pageId,
			});
			cache.set(sourcePath, { source, information });
		} catch (error) {
			information = { title: node.label ?? node.pageId, listed: true, aliases: [], problem: error.message };
		}
		nodes.push({ ...node, ...information, sourcePath, url: node.isHome ? '/' : `/${node.pagePath}/`,
			problem: information.problem ?? node.problems?.[0] ?? null });
	}
	for (const filename of cache.keys()) if (!used.has(filename)) cache.delete(filename);
	return { nodes, problems: structure.problems };
};

// Keep the logical page API compatible with older extensions. This optional
// projection supplies physical resource locations without deriving new URLs.
export const readSiteFileTree = async (options) => {
	const siteRoot = path.resolve(options.siteRoot);
	const snapshot = await readSiteTree({ ...options, siteRoot });
	const home = snapshot.nodes.find((node) => node.isHome);
	const items = [];
	const problems = [...snapshot.problems];
	if (!home || home.sourcePath !== path.join(siteRoot, 'content.md')) return { ...snapshot, items: null };
	const resourceId = (filename) => `resource:${filename}`;
	const entriesAt = async (directory) => {
		try { return await readdir(directory, { withFileTypes: true }); }
		catch (error) {
			if (error.code !== 'ENOENT') problems.push({ path: directory, message: `Cannot read ${directory}: ${error.message}` });
			return [];
		}
	};
	const addResource = (owner, parentId, filename, kind, role, description = '') => {
		const item = { id: resourceId(filename), parentId, ownerId: owner.sourcePath,
			kind, role, sourcePath: filename, title: path.basename(filename), description };
		if (kind === 'file') item.removable = Boolean(editorFileRemovalPolicy({ siteRoot, sourcePath: owner.sourcePath, filePath: filename }));
		if (kind === 'file' && filename === owner.sourcePath) item.description += owner.isHome
			? '. Required homepage content; the homepage cannot be removed.' : '. Required for this entry; remove the whole page or category through its actions menu.';
		if (kind === 'file' && ['settings.yaml', 'site-theme.yaml'].some((name) => filename === path.join(siteRoot, 'site-config', name))) {
			item.description = 'Required site configuration; this file cannot be removed through Site Tree.';
		}
		items.push(item);
		return item;
	};
	const addDirectory = async (owner, parentId, filename, role) => {
		const description = role === 'configuration' ? 'Settings and content shared by the complete site'
			: role === 'public' ? 'Files published unchanged with the site, such as robots.txt and icons.' : '';
		const directory = addResource(owner, parentId, filename, 'directory', role, description);
		if (role === 'pages') return;
		const entries = (await entriesAt(filename)).filter((entry) => entry.isDirectory() || entry.isFile());
		const configOrder = ['settings.yaml', 'site-theme.yaml', 'shared-content.yaml'];
		entries.sort((a, b) => role === 'configuration'
			? (configOrder.includes(a.name) ? configOrder.indexOf(a.name) : 3) - (configOrder.includes(b.name) ? configOrder.indexOf(b.name) : 3) || a.name.localeCompare(b.name)
			: Number(b.isDirectory()) - Number(a.isDirectory()) || a.name.localeCompare(b.name, 'en', { numeric: true }));
		for (const entry of entries) {
			const child = path.join(filename, entry.name);
			if (entry.isDirectory()) await addDirectory(owner, directory.id, child, 'assets');
			else addResource(owner, directory.id, child, 'file', role === 'configuration' ? 'configuration' : 'asset');
		}
	};
	for (const page of snapshot.nodes) {
		const directory = path.dirname(page.sourcePath);
		const parentId = page.isHome ? null : resourceId(path.dirname(directory));
		items.push({ ...page, id: page.sourcePath, parentId, ownerId: page.sourcePath });
		const entries = new Map((await entriesAt(directory)).map((entry) => [entry.name, entry]));
		const addExistingDirectory = async (name) => {
			if (entries.get(name)?.isDirectory()) await addDirectory(page, page.sourcePath, path.join(directory, name), name === 'site-config' ? 'configuration' : name);
		};
		if (page.isHome) {
			await addExistingDirectory('site-config');
			await addExistingDirectory('public');
		}
		const configuration = ['theme.yaml', page.kind === 'category' ? 'category.yaml' : 'content.md'];
		for (const filename of configuration) {
			if (!entries.get(filename)?.isFile()) continue;
			const description = filename === 'theme.yaml' ? page.isHome ? 'Visual settings for this page only. Overrides site-config/site-theme.yaml.'
				: page.kind === 'category' ? 'Visual settings for pages in this category, including their child pages. Overrides inherited settings.'
					: 'Visual settings for this page and its child pages. Overrides inherited settings.'
				: filename === 'content.md' ? 'Page content' : 'Category information';
			addResource(page, page.sourcePath, path.join(directory, filename), 'file', filename === 'content.md' ? 'content' : 'configuration', description);
		}
		for (const name of ['images', 'pages']) await addExistingDirectory(name);
	}
	return { ...snapshot, items, problems };
};

const collectComments = (token, start, end, comments = []) => {
	if (!token || typeof token !== 'object') return comments;
	if (token.type === 'comment' && token.offset >= start && token.offset < end) comments.push(token.source);
	for (const value of Object.values(token)) {
		if (Array.isArray(value)) for (const item of value) collectComments(item, start, end, comments);
		else if (value && typeof value === 'object') collectComments(value, start, end, comments);
	}
	return comments;
};

const changeYamlField = (yaml, keys, value, eol) => {
	const document = parseDocument(yaml, { keepSourceTokens: true });
	if (document.errors.length) throw new Error('Repair the YAML before editing page information.');
	if (document.contents && !isMap(document.contents)) throw new Error('Page information requires a YAML mapping.');
	const scalar = (data) => JSON.stringify(data);
	const entryText = (key, data, indent) => {
		const prefix = ' '.repeat(indent);
		if (Array.isArray(data)) return `${prefix}${key}:${eol}${data.map((entry) => `${prefix}  - ${scalar(entry)}${eol}`).join('')}`;
		return data && typeof data === 'object' && !Array.isArray(data)
			? `${prefix}${key}:${eol}${Object.entries(data).map(([child, value]) => entryText(child, value, indent + 2)).join('')}`
			: `${prefix}${key}: ${scalar(data)}${eol}`;
	};
	const edit = (start, end, text) => yaml.slice(0, start) + text + yaml.slice(end);
	const insert = (map, key, data) => {
		if (!map) return yaml + (yaml && !yaml.endsWith('\n') ? eol : '') + entryText(key, data, 0);
		if (map.flow) {
			const position = map.range[1] - 1;
			const separator = map.items.length && !yaml.slice(0, position).trimEnd().endsWith(',') ? ', ' : '';
			return edit(position, position, `${separator}${key}: ${scalar(data)}`);
		}
		const indent = map.items[0]?.key.srcToken.indent ?? 0;
		const position = map.range[2];
		return edit(position, position, `${position && yaml[position - 1] !== '\n' ? eol : ''}${entryText(key, data, indent)}`);
	};
	const visit = (map, remaining, ancestors = []) => {
		const [key, ...rest] = remaining;
		const pair = map?.items.find((item) => item.key.value === key);
		if (!pair) {
			if (value === undefined) return yaml;
			return insert(map, key, rest.reduceRight((child, part) => ({ [part]: child }), value));
		}
		if (rest.length) {
			if (!isMap(pair.value)) throw new Error(`Edit ${key} as a YAML mapping in the source before using Page Information.`);
			return visit(pair.value, rest, [...ancestors, { map, pair }]);
		}
		if (value !== undefined) {
			if ((!isScalar(pair.value) && !(Array.isArray(value) && isSeq(pair.value))) || pair.value.anchor || pair.value.tag
				|| (isSeq(pair.value) && pair.value.items.some((item) => !isScalar(item) || item.anchor || item.tag))) {
				throw new Error(`Edit ${keys.join('.')} in the source; this field uses YAML anchors, tags or values that cannot be changed through Page Information.`);
			}
			if (Array.isArray(value) && !map.flow) {
				// Keep aliases in block form so a later page:move can preserve
				// old addresses without asking the author to reformat our output.
				const start = yaml.lastIndexOf('\n', pair.key.range[0] - 1) + 1;
				const end = pair.value.range[2];
				const indent = pair.key.srcToken.indent ?? 0;
				const comments = collectComments(pair.srcToken, start, end);
				return edit(start, end, comments.map((comment) => `${' '.repeat(indent)}${comment}${eol}`).join('')
					+ entryText(pair.key.value, value, indent));
			}
			const start = pair.value.range[0];
			const end = pair.value.range[1];
			const comments = collectComments(pair.value.srcToken, start, end);
			const trailing = yaml.slice(start, end).endsWith('\n') ? eol : '';
			return edit(start, end, scalar(value) + comments.map((comment) => ` ${comment}`).join('') + trailing);
		}
		return remove(map, pair, ancestors);
	};
	const remove = (map, pair, ancestors) => {
		if (!map.flow && map.items.length === 1 && ancestors.length) {
			const parent = ancestors.pop();
			return remove(parent.map, parent.pair, ancestors);
		}
		let start = pair.key.range[0];
		let end = pair.value?.range[2] ?? pair.key.range[2];
		if (map.flow) {
			end = pair.value?.range[1] ?? pair.key.range[1];
			const index = map.items.indexOf(pair);
			const previousComma = pair.srcToken?.start.find((token) => token.type === 'comma');
			const nextComma = map.items[index + 1]?.srcToken?.start.find((token) => token.type === 'comma');
			if (previousComma) start = previousComma.offset;
			else if (nextComma) end = nextComma.offset + 1;
		} else {
			start = yaml.lastIndexOf('\n', start - 1) + 1;
		}
		const comments = collectComments(pair.srcToken, start, end);
		const indent = pair.key.srcToken.indent ?? 0;
		const replacement = comments.map((comment) => `${' '.repeat(indent)}${comment}${eol}`).join('');
		return edit(start, end, replacement);
	};
	return visit(document.contents, keys);
};

export const editSiteNodeInformation = async ({ siteRoot, sourcePath, source, field, value, sources = new Map() }) => {
	const relative = path.relative(path.join(siteRoot, 'pages'), sourcePath).split(path.sep).join('/');
	const filename = path.posix.basename(relative);
	if (!['content.md', 'category.yaml'].includes(filename)) throw new Error('Choose a page or navigation category source file.');
	const pageDirectory = path.resolve(sourcePath) === path.join(path.resolve(siteRoot), 'content.md')
		? homePageDirectory : path.posix.dirname(relative);
	parsePageDirectoryPath(pageDirectory);
	const kind = filename === 'content.md' ? 'page' : 'category';
	const isHome = pageDirectory === homePageDirectory;
	const info = await parseInformation({ source, kind, isHome, sourcePath });
	const allowed = kind === 'page' ? ['title', 'description', 'listed', 'aliases'] : ['title', 'description'];
	if (!allowed.includes(field)) throw new Error('This information field is read-only.');
	if (field === 'aliases') {
		if (!Array.isArray(value) || value.some((entry) => typeof entry !== 'string')) throw new Error('Enter additional addresses as site-relative paths, such as /old-guide/.');
	} else if (field === 'listed') {
		if (typeof value !== 'boolean') throw new Error('Choose whether this page is listed in navigation.');
		if (isHome && !value) throw new Error('Home must remain listed.');
	} else {
		if (typeof value !== 'string' || /[\r\n]/.test(value)) throw new Error('Use a single line of text.');
		value = value.trim();
		if (field === 'title' && !value) throw new Error('Enter a title.');
	}
	if (info[field] === value) return [];
	const eol = source.includes('\r\n') ? '\r\n' : '\n';
	if (field === 'title' && kind === 'page') {
		const lines = source.match(/[^\n]*\n|[^\n]+$/g) ?? [];
		const start = lines.slice(0, info.titleLine).join('').length;
		const original = lines.slice(info.titleLine, info.titleLine + info.titleLineCount).join('');
		return [{ start, end: start + original.replace(/\r?\n$/, '').length, text: `# ${escapeMarkdownHeading(value)}` }];
	}
	const parts = sourceParts(source, kind);
	const keys = kind === 'category' ? [field === 'title' ? 'label' : field]
		: field === 'listed' ? ['navigation', 'listed'] : ['page', field === 'aliases' ? 'aliases' : 'description'];
	const yaml = changeYamlField(parts.yaml, keys, (field === 'description' && !value) || (field === 'aliases' && !value.length) ? undefined : value, eol);
	const next = kind === 'category' ? yaml
		: parts.bodyLine ? !yaml.trim() ? source.slice(parts.offset + parts.yaml.length).replace(/^---[ \t]*(?:\r?\n|$)/, '')
			: source.slice(0, parts.offset) + yaml + source.slice(parts.offset + parts.yaml.length)
			: `---${eol}${yaml}---${eol}${eol}${source}`;
	// Validate the complete result before offering it to the editor.
	await parseInformation({ source: next, kind, isHome, sourcePath });
	if (field === 'aliases') {
		const state = await readEditorLinkState({ siteRoot, sources: new Map([...sources, [sourcePath, next]]) });
		if (state.incomplete.length) throw new Error(`Additional addresses could not be checked. ${state.incomplete.join('\n')}`);
	}
	let start = 0;
	while (start < source.length && start < next.length && source[start] === next[start]) start++;
	let end = source.length;
	let nextEnd = next.length;
	while (end > start && nextEnd > start && source[end - 1] === next[nextEnd - 1]) { end--; nextEnd--; }
	return [{ start, end, text: next.slice(start, nextEnd) }];
};
