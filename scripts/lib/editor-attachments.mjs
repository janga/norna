import { lstat, readdir } from 'node:fs/promises';
import path from 'node:path';
import { markdownToMdast } from 'satteri';
import { checkedPath, snapshot } from './editor-site-files.mjs';
import { readEditorLinkState } from './editor-site-links.mjs';
import { attachmentPathname, attachmentOutputIssues, validateAttachmentName } from './page-attachments.mjs';

export const siteAttachmentsApiVersion = 1;
const info = filename => lstat(filename).catch(error => { if (error.code === 'ENOENT') return null; throw error; });
export const planEditorAttachmentCopy = async ({ siteRoot, sourcePath, filePath, filename, replace = false, pending = [], sources = new Map() }) => {
	validateAttachmentName(filename);
	await checkedPath(siteRoot, sourcePath);
	const state = await readEditorLinkState({ siteRoot, sources });
	if (state.incomplete.length) throw new Error(`Repair the site before importing attachments. ${state.incomplete.join('\n')}`);
	const page = state.graph.pages.find(page => page.contentFile.contentPath === sourcePath);
	if (!page) throw new Error('Choose a content page for these attachments.');
	const source = path.resolve(filePath), sourceInfo = await info(source);
	if (!sourceInfo?.isFile() || sourceInfo.isSymbolicLink()) throw new Error('Choose a regular file to import.');
	const directory = path.join(path.dirname(sourcePath), 'downloads');
	const destination = await checkedPath(siteRoot, path.join(directory, filename));
	if (source === destination) throw new Error('This attachment is already on the page. Use Insert Link in Page.');
	const key = value => value.normalize('NFC').toLowerCase();
	const entries = await readdir(directory).catch(error => { if (error.code === 'ENOENT') return []; throw error; });
	const occupied = entries.find(name => key(name) === key(filename));
	const existing = await info(destination);
	if (replace ? !existing?.isFile() || existing.isSymbolicLink() : Boolean(occupied)) throw new Error(replace ? 'The file to replace no longer exists.' : `“${occupied}” already exists. Choose Replace, another filename or Ignore.`);
	if (occupied && occupied !== filename) throw new Error(`Use the exact existing filename “${occupied}” to replace it, or choose a different name.`);
	if (pending.some(name => key(name) === key(filename))) throw new Error('Two selected files use this name. Rename or ignore one.');
	const pendingPaths = new Set(pending.map(name => path.join(directory, name)));
	const files = state.graph.attachments.files.filter(file => file.filePath !== destination && !pendingPaths.has(file.filePath));
	for (const name of [...pending, filename]) files.push({ filePath: path.join(directory, name), pathname: attachmentPathname(page.pathname, name) });
	const problems = attachmentOutputIssues({ files, pages: state.graph.pages, publicFiles: state.publicFiles, generatedRoutes: state.generatedRoutes });
	if (problems.length) throw new Error(problems.map(issue => issue.message).join('\n'));
	return { source, sourcePath, destination, filename, replace,
		sourceInfo: { size: sourceInfo.size, modified: sourceInfo.mtimeMs },
		existingInfo: existing ? { size: existing.size, modified: existing.mtimeMs } : null,
		fingerprint: JSON.stringify([await snapshot(source), existing ? await snapshot(destination) : null, state.graph.pages.map(page => [page.pathname, page.document.fullSource]), files.map(file => file.pathname).sort()]) };
};

export const createEditorAttachmentInsertion = ({ source, items, offset = source.length }) => {
	if (!items.length) return { start: offset, text: '' };
	if (!Number.isInteger(offset) || offset < 0 || offset > source.length) throw new Error('The insertion position is no longer valid.');
	const ast = markdownToMdast(source, { features: { gfm: true, frontmatter: true } });
	const visit = node => {
		if (node.position && offset >= node.position.start.offset && offset < node.position.end.offset && ['yaml', 'toml', 'code', 'inlineCode', 'html', 'link', 'image', 'definition', 'linkReference', 'imageReference', 'table'].includes(node.type)) throw new Error('Place the cursor in ordinary page text, outside code, links, HTML, tables and page settings, then insert again.');
		for (const child of node.children ?? []) visit(child);
	};
	visit(ast);
	const newline = source.includes('\r\n') ? '\r\n' : '\n';
	const links = items.map(item => {
		validateAttachmentName(item.filename);
		if (typeof item.text !== 'string' || !item.text.trim() || /[\r\n]/.test(item.text)) throw new Error('Enter link text on one line for each inserted attachment.');
		const text = item.text.replace(/[\\`*_[\]<>]/g, '\\$&');
		const href = encodeURIComponent(item.filename).replace(/[()']/g, char => '%' + char.charCodeAt(0).toString(16));
		return `[${text}](${href})`;
	});
	const multiple = links.length > 1;
	const text = multiple ? links.map(link => '- ' + link).join(newline) : links[0];
	const insertion = multiple ? newline + newline + text + newline + newline : (offset === source.length ? newline + newline : '') + text + (offset === source.length ? newline : '');
	const result = markdownToMdast(source.slice(0, offset) + insertion + source.slice(offset), { features: { gfm: true, frontmatter: true } });
	const inserted = [];
	const collect = node => {
		if (node.type === 'link' && node.position.start.offset >= offset && node.position.end.offset <= offset + insertion.length) inserted.push(node);
		for (const child of node.children ?? []) collect(child);
	};
	collect(result);
	if (inserted.length !== items.length) throw new Error('Place the cursor in ordinary page text outside code, HTML and page settings, then insert again.');
	return { start: offset, text: insertion };
};
