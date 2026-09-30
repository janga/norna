import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { getMarkdownHeadings, slugifyAsciiIdentifier } from './heading-ids.mjs';
import { parsePageDirectoryPath } from './page-model.mjs';
import { splitPageMarkdownSource } from './page-markdown.mjs';
import { siteSchema } from './schema-definitions.mjs';
import { getSiteSourcePaths, homePageDirectory } from './site-conventions.mjs';
import { createSiteNode, escapeMarkdownHeading, planSiteNodeCreation } from './site-node-create.mjs';
import { getSiteStructure } from './site-structure.mjs';
import { parseYamlConfig } from './yaml-config.mjs';
import { changeYamlField } from './yaml-source-edit.mjs';
import { readEditorLinkState } from './editor-site-links.mjs';
import { readSiteEditingTree } from './editor-site-editing-tree.mjs';

// Optional capability: older engines keep IntelliSense without exposing writes
// through a site-tree API whose contract they do not implement.
export const siteTreeApiVersion = 1;
export const siteFileTreeApiVersion = 1;
export const sitePageFormApiVersion = 1;
export { siteTreeEditingApiVersion, getEditorSourceFileChoices, planEditorSourceFileCreation, createEditorSourceFile } from './editor-source-files.mjs';
export { createSiteNode, planSiteNodeCreation, slugifyAsciiIdentifier };
export { siteFileOperationsApiVersion, siteRemovalApiVersion, planEditorImageCopy, planEditorRemoval, getEditorImageUsage, createEditorImageAppend, createEditorImageBatchAppend } from './editor-site-files.mjs';
export { getEditorIncomingLinks } from './editor-site-links.mjs';
export { siteAddressApiVersion, getEditorPageAddresses, planEditorPageAddress, applyEditorPageAddress } from './editor-page-addresses.mjs';
export { sitePagePlacementApiVersion, planEditorPagePlacement, applyEditorPagePlacement } from './editor-page-placement.mjs';

const sourceParts = (source, kind) => {
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
	const data = parseYamlConfig(parts.yaml, sourcePath, { schema: siteSchema });
	const { headings } = await getMarkdownHeadings(parts.body);
	const titles = headings.filter(({ depth }) => depth === 1);
	if (titles.length !== 1) throw new Error('Keep exactly one Markdown H1 title in this page before editing its information.');
	if (isHome && data.navigation?.listed === false) throw new Error('Home must remain listed. Remove navigation.listed: false.');
	return {
		title: titles[0].title,
		description: data.page?.description ?? '',
		listed: data.navigation?.listed !== false,
		aliases: data.page?.aliases ?? [],
		listChildren: data.page?.listChildren === true,
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

// One physical projection preserves resources and repairable entries even when
// the logical structure cannot be read. The logical page API remains separate.
export const readSiteFileTree = async (options) => {
	const siteRoot = path.resolve(options.siteRoot);
	const snapshot = await readSiteTree({ ...options, siteRoot }).catch((error) => ({
		nodes: [], problems: [{ path: siteRoot, message: error.message }],
	}));
	return readSiteEditingTree({ ...options, siteRoot, snapshot, getInformation: getSiteNodeInformation });
};

export const editSiteNodeInformation = async ({ siteRoot, sourcePath, source, field, value, sources = new Map() }) => {
	const relative = path.relative(getSiteSourcePaths(siteRoot).pages, sourcePath).split(path.sep).join('/');
	const filename = path.posix.basename(relative);
	if (filename !== 'content.md') throw new Error('Choose a page content.md source file.');
	const pageDirectory = path.resolve(sourcePath) === getSiteSourcePaths(path.resolve(siteRoot)).content
		? homePageDirectory : path.posix.dirname(relative);
	parsePageDirectoryPath(pageDirectory);
	const kind = 'page';
	const isHome = pageDirectory === homePageDirectory;
	const info = await parseInformation({ source, kind, isHome, sourcePath });
	const allowed = ['title', 'description', 'listed', 'aliases', 'listChildren'];
	if (!allowed.includes(field)) throw new Error('This information field is read-only.');
	if (field === 'aliases') {
		if (!Array.isArray(value) || value.some((entry) => typeof entry !== 'string')) throw new Error('Enter additional addresses as site-relative paths, such as /old-guide/.');
	} else if (field === 'listed' || field === 'listChildren') {
		if (typeof value !== 'boolean') throw new Error(field === 'listed' ? 'Choose whether this page is listed in navigation.' : 'Choose whether to append the list of child pages.');
		if (field === 'listed' && isHome && !value) throw new Error('Home must remain listed.');
	} else {
		if (typeof value !== 'string' || /[\r\n]/.test(value)) throw new Error('Use a single line of text.');
		value = value.trim();
		if (field === 'title' && !value) throw new Error('Enter a title.');
	}
	if (info[field] === value) return [];
	const eol = source.includes('\r\n') ? '\r\n' : '\n';
	if (field === 'title') {
		const lines = source.match(/[^\n]*\n|[^\n]+$/g) ?? [];
		const start = lines.slice(0, info.titleLine).join('').length;
		const original = lines.slice(info.titleLine, info.titleLine + info.titleLineCount).join('');
		return [{ start, end: start + original.replace(/\r?\n$/, '').length, text: `# ${escapeMarkdownHeading(value)}` }];
	}
	const parts = sourceParts(source, kind);
	const keys = field === 'listed' ? ['navigation', 'listed'] : ['page', field === 'aliases' ? 'aliases' : field === 'listChildren' ? 'listChildren' : 'description'];
	const yaml = changeYamlField(parts.yaml, keys, (field === 'description' && !value) || (field === 'aliases' && !value.length) || (field === 'listChildren' && !value) ? undefined : value, eol);
	const next = parts.bodyLine ? !yaml.trim() ? source.slice(parts.offset + parts.yaml.length).replace(/^---[ \t]*(?:\r?\n|$)/, '')
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

export { siteResourceActionsApiVersion, getEditorResourceReferences, planEditorResourceRename, planEditorPublicCreation, planEditorFolderRemoval, getEditorResourceAddress } from './editor-resource-actions.mjs';

export { siteAttachmentsApiVersion, planEditorAttachmentCopy, createEditorAttachmentInsertion } from './editor-attachments.mjs';

export { sitePreviewApiVersion, getEditorPreviewConfiguration, getEditorPreviewStatus, getEditorPreviewLog, startEditorSitePreview, stopEditorSitePreview } from './editor-site-preview.mjs';
