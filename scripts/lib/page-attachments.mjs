import { lstat, readdir } from 'node:fs/promises';
import path from 'node:path';
import { getSiteNodePathname } from './site-page-urls.mjs';
import { attachmentPublicationPath, publicationIssues } from './publication-paths.mjs';

export const attachmentPathname = attachmentPublicationPath;
export const encodeAttachmentPath = value => value.split('/').map(segment => encodeURIComponent(segment).replace(/[()']/g, char => '%' + char.charCodeAt(0).toString(16))).join('/');
export const validateAttachmentName = name => {
	if (typeof name !== 'string' || !name || name !== name.trim() || /[\\/\x00-\x1f\x7f<>:"|?*#%]/.test(name) || /^\.{1,2}$/.test(name) || /[. ]$/.test(name)) throw new Error('Use one filename without slashes, URL punctuation or trailing dots/spaces.');
	return name;
};

export const readPageAttachments = async contentFile => {
	const directory = path.join(path.dirname(contentFile.contentPath), 'downloads');
	const info = await lstat(directory).catch(error => { if (error.code === 'ENOENT') return null; throw error; });
	if (!info) return { files: [], diagnostics: [] };
	const diagnostics = [], files = [];
	const problem = message => diagnostics.push({ severity: 'error', code: 'invalid-attachment', contentFile, message, fix: 'Keep regular files directly in the page’s downloads/ folder; remove unsupported entries.' });
	if (!info.isDirectory() || info.isSymbolicLink()) { problem(`${directory} must be a real directory.`); return { files, diagnostics }; }
	const names = new Set();
	for (const entry of await readdir(directory, { withFileTypes: true })) {
		if (entry.name === '.DS_Store' || entry.name.startsWith('._')) continue;
		const filePath = path.join(directory, entry.name);
		try { validateAttachmentName(entry.name); } catch (error) { problem(`${filePath}: ${error.message}`); continue; }
		if (!entry.isFile()) { problem(`${filePath}: attachment subfolders and symbolic links are not supported.`); continue; }
		const key = entry.name.normalize('NFC').toLowerCase();
		if (names.has(key)) problem(`${directory}: attachment filenames must be unique regardless of case or Unicode normalization.`);
		names.add(key);
		files.push({ filePath, filename: entry.name, contentPath: contentFile.contentPath, ownerPathname: getSiteNodePathname(contentFile), pathname: attachmentPathname(getSiteNodePathname(contentFile), entry.name) });
	}
	return { files, diagnostics };
};
export const getSiteAttachments = async siteStructure => {
	const results = await Promise.all(siteStructure.contentFiles.map(readPageAttachments));
	return { files: results.flatMap(result => result.files), diagnostics: results.flatMap(result => result.diagnostics) };
};

// Explicit downloads paths identify page-owned files. Bare names retain the
// existing shorthand rules, including ambiguity with page/public links.
export const parseLocalAttachmentTarget = target => {
	const raw = target.split(/[?#]/, 1)[0];
	if (!raw || /^[a-z][a-z\d+.-]*:/i.test(raw)) return null;
	const prefix = raw.match(/^(?:\.\/)?downloads\//)?.[0] ?? '';
	try {
		const filename = decodeURIComponent(raw.slice(prefix.length));
		validateAttachmentName(filename);
		return { filename, prefix };
	} catch { return null; }
};
export const localAttachmentName = target => parseLocalAttachmentTarget(target)?.filename ?? null;
export const resolveAttachment = (target, sourcePathname, files, resolvedPathname) => {
	const name = localAttachmentName(target);
	return name ? files.find(file => file.ownerPathname === sourcePathname && file.filename === name)
		: files.find(file => file.pathname === resolvedPathname);
};
export const attachmentHref = (file, target) => encodeAttachmentPath(file.pathname) + (target.match(/[?#].*$/)?.[0] ?? '');

export const attachmentOutputIssues = ({ files, pages, publicFiles, generatedRoutes }) =>
	publicationIssues({ attachments: files, pages, publicFiles, generatedRoutes });
