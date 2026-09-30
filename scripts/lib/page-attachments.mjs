import { lstat, readdir } from 'node:fs/promises';
import path from 'node:path';
import { getSiteNodePathname } from './site-page-urls.mjs';
import { getReservedPublicEntries } from './public-path-policy.mjs';

export const attachmentPathname = (pagePathname, filename) => `${pagePathname}downloads/${filename}`;
export const encodeAttachmentPath = value => value.split('/').map(encodeURIComponent).join('/');
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

// A bare target is local shorthand only when it identifies an attachment.
// Other existing page/public links retain their meaning; the graph diagnoses
// shorthand which would refer to both instead of silently choosing one.
export const localAttachmentName = target => {
	const raw = target.split(/[?#]/, 1)[0];
	if (!raw || raw.includes('/') || /^[a-z][a-z\d+.-]*:/i.test(raw)) return null;
	try { const name = decodeURIComponent(raw); validateAttachmentName(name); return name; } catch { return null; }
};
export const resolveAttachment = (target, sourcePathname, files, resolvedPathname) => {
	const name = localAttachmentName(target);
	return name ? files.find(file => file.ownerPathname === sourcePathname && file.filename === name)
		: files.find(file => file.pathname === resolvedPathname);
};
export const attachmentHref = (file, target) => encodeAttachmentPath(file.pathname) + (target.match(/[?#].*$/)?.[0] ?? '');

export const attachmentOutputIssues = ({ files, pages, publicFiles, generatedRoutes }) => {
	const outputs = [
		...pages.flatMap(page => [page.pathname, ...(page.aliases ?? [])].map(route => route + 'index.html')),
		...publicFiles.map(file => file.pathname),
		...generatedRoutes.map(route => route.pathname.endsWith('/') ? route.pathname + 'index.html' : route.pathname),
	];
	const key = value => value.normalize('NFC').toLowerCase();
	const overlaps = (a, b) => a === b || a.startsWith(b + '/') || b.startsWith(a + '/');
	return files.flatMap((file, index) => {
		const pathname = key(file.pathname);
		const collision = [...outputs, ...files.slice(0, index).map(entry => entry.pathname)].find(output => overlaps(pathname, key(output)));
		const reserved = getReservedPublicEntries(true).find(entry => pathname.split('/')[1] === entry.filename);
		if (!collision && !reserved) return [];
		return [{ severity: 'error', code: 'attachment-output-collision', message: `Attachment ${file.pathname} conflicts with ${collision ?? reserved.filename}.`, fix: 'Rename the attachment or change the conflicting page/public path.' }];
	});
};
