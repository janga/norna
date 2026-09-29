import { lstat, readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { markdownToMdast } from 'satteri';
import { parsePageMarkdownSource } from './page-markdown.mjs';
import { getSiteStructure } from './site-structure.mjs';
import { getEditorIncomingLinks } from './editor-site-links.mjs';
import { editorFileRemovalPolicy } from './editor-file-policy.mjs';
import { getEditorThemeRemovalHelp } from './editor-theme-help.mjs';

export const siteFileOperationsApiVersion = 1;
export const siteRemovalApiVersion = 1;
const imageName = /^[a-z0-9][a-z0-9.-]*\.(jpe?g|png|svg)$/i;
const stat = (filename) => lstat(filename).catch((error) => {
	if (error.code === 'ENOENT') return null;
	throw error;
});

export const checkedPath = async (siteRoot, filename) => {
	const root = path.resolve(siteRoot);
	const target = path.resolve(filename);
	const relative = path.relative(root, target);
	if (relative === '..' || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
		throw new Error('Choose a file in the selected site.');
	}
	let current = root;
	for (const segment of ['', ...relative.split(path.sep).filter(Boolean)]) {
		current = path.join(current, segment);
		if ((await stat(current))?.isSymbolicLink()) throw new Error('Symbolic links cannot be changed through Site Tree. Use the real source directory.');
	}
	return target;
};

const pageTarget = async ({ siteRoot, sourcePath }) => {
	const filename = await checkedPath(siteRoot, sourcePath);
	const structure = await getSiteStructure({ siteRoot, tolerant: true });
	const page = structure.nodes.find((node) => (node.contentPath ?? node.categoryPath) === filename);
	if (!page) throw new Error('The selected page is no longer in this site. Refresh Site Tree and select it again.');
	return { page, structure, directory: path.dirname(filename), sourcePath: filename };
};

export const snapshot = async (filename) => {
	const result = [];
	const visit = async (current) => {
		const information = await stat(current);
		if (!information) throw new Error('The selected file no longer exists. Refresh Site Tree.');
		if (information.isSymbolicLink()) throw new Error('This selection contains a symbolic link. Remove it through the ordinary Explorer instead.');
		if (!information.isFile() && !information.isDirectory()) throw new Error('This selection contains an unsupported filesystem entry.');
		result.push([path.relative(filename, current), information.isDirectory() ? 'directory' : 'file', information.size, information.mtimeMs, information.ctimeMs, information.ino]);
		if (information.isDirectory()) for (const entry of (await readdir(current)).sort()) await visit(path.join(current, entry));
	};
	await visit(filename);
	return result;
};

export const planEditorImageCopy = async ({ siteRoot, sourcePath, imagePath, filename, replace = false }) => {
	const target = await pageTarget({ siteRoot, sourcePath });
	if (target.page.kind !== 'page') throw new Error('Choose a content page for this image.');
	if (!imageName.test(filename)) throw new Error('Use a filename starting with a letter or number, followed by letters, numbers, dots or hyphens, ending in .jpg, .jpeg, .png or .svg.');
	const source = path.resolve(imagePath);
	const information = await stat(source);
	if (!information?.isFile() || information.isSymbolicLink()) throw new Error('Choose a regular image file to copy.');
	if (!/\.(jpe?g|png|svg)$/i.test(source) || path.extname(source).toLowerCase() !== path.extname(filename).toLowerCase()) {
		throw new Error('Keep the source image extension. This action does not convert image formats.');
	}
	const destination = await checkedPath(siteRoot, path.join(target.directory, 'images', filename));
	if (source === destination) throw new Error('This image already belongs to the selected page. Use Insert Image instead.');
	const existing = await stat(destination);
	if (replace ? !existing?.isFile() : existing !== null) {
		throw new Error(replace ? 'The image to replace no longer exists.' : 'An image already has this name on the page. Choose another filename or use Replace Image.');
	}
	return { source, destination, sourcePath: target.sourcePath, filename,
		fingerprint: JSON.stringify([await snapshot(source), existing ? await snapshot(destination) : null]) };
};

export const getEditorImageUsage = async ({ siteRoot, sourcePath, imagePath, sources = new Map() }) => {
	const { page, structure, directory } = await pageTarget({ siteRoot, sourcePath });
	const target = await checkedPath(siteRoot, imagePath);
	const targetStat = await stat(target);
	if (page.kind !== 'page' || path.dirname(target) !== path.join(directory, 'images') || !imageName.test(path.basename(target)) || !targetStat?.isFile()) {
		throw new Error('Choose an image directly inside this page’s images folder.');
	}
	const references = [];
	const incomplete = structure.problems.map((problem) => problem.message);
	for (const node of structure.nodes.filter((node) => node.contentPath)) {
		try {
			const source = sources.has(node.contentPath) ? sources.get(node.contentPath) : await readFile(node.contentPath, 'utf8');
			const document = await parsePageMarkdownSource(source, { label: node.contentPath });
			if (document.diagnostics.some(({ severity }) => severity === 'error')) incomplete.push(node.contentPath);
			for (const reference of document.managedImages.filter((reference) => reference.image.toLowerCase() === path.basename(target).toLowerCase())) {
				const localPath = path.join(path.dirname(node.contentPath), 'images', reference.image);
				const local = await stat(localPath);
				if (local ? local.dev !== targetStat.dev || local.ino !== targetStat.ino : reference.image !== path.basename(target)) continue;
				references.push({ sourcePath: node.contentPath, line: reference.line, unresolved: !local });
			}
		} catch (error) { incomplete.push(`${node.contentPath}: ${error.message}`); }
	}
	return { references, incomplete };
};

export const planEditorRemoval = async ({ siteRoot, sourcePath, imagePath, filePath, sources }) => {
	siteRoot = path.resolve(siteRoot);
	const siteFile = filePath && !imagePath && path.resolve(sourcePath) === siteRoot;
	const target = siteFile ? { sourcePath: await checkedPath(siteRoot, sourcePath) } : await pageTarget({ siteRoot, sourcePath });
	if (!imagePath && !filePath && target.page.isHome) throw new Error('The homepage is required and cannot be removed.');
	const filename = imagePath || filePath ? await checkedPath(siteRoot, imagePath ?? filePath) : target.directory;
	const policy = filePath ? editorFileRemovalPolicy({ siteRoot: path.resolve(siteRoot), sourcePath: target.sourcePath, filePath: filename }) : null;
	if (filePath && (!policy || !(await stat(filename))?.isFile())) throw new Error('This file cannot be removed separately. Required page files belong to their page; required site settings must remain.');
	const usage = imagePath ? await getEditorImageUsage({ siteRoot, sourcePath, imagePath, sources })
		: !filePath || policy.kind === 'public' ? await getEditorIncomingLinks({ siteRoot, sourcePath, sources,
			descendants: !filePath, excludeBranch: !filePath, filePath }) : null;
	const files = await snapshot(filename);
	const effect = policy?.kind === 'theme'
		? `${policy.effect}\n\n${await getEditorThemeRemovalHelp({ siteRoot, filename, sources })}` : policy?.effect;
	return { target: filename, recursive: !imagePath && !filePath, effect,
		files: files.filter(([, kind]) => kind === 'file').map(([relative]) => relative || path.basename(filename)),
		pages: imagePath || filePath ? 0 : target.structure.nodes.filter((node) => {
			const relative = path.relative(filename, node.contentPath ?? node.categoryPath);
			return relative !== '..' && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative);
		}).length,
		usage, fingerprint: JSON.stringify([files, usage, effect]) };
};

export const createEditorImageAppend = async ({ source, filename, alt, caption = '' }) => {
	if (typeof alt !== 'string' || !alt.trim()) throw new Error('Describe the image before inserting it.');
	return createEditorImageBatchAppend({ source, items: [{ filename, alt, caption }] });
};

export const createEditorImageBatchAppend = async ({ source, items }) => {
	if (!Array.isArray(items) || !items.length) throw new Error('Choose at least one image to insert.');
	for (const item of items) {
		if (!imageName.test(item.filename)) throw new Error('Choose a managed image filename.');
		if (item.alt !== undefined && typeof item.alt !== 'string') throw new Error('Alternative text must be text.');
		if (item.caption !== undefined && typeof item.caption !== 'string') throw new Error('Caption must be text.');
	}
	const document = await parsePageMarkdownSource(source, { label: 'content.md' });
	if (document.diagnostics.some(({ severity }) => severity === 'error')) {
		throw new Error('Repair this page’s content errors before appending an image block. The imported file remains available.');
	}
	const eol = source.includes('\r\n') ? '\r\n' : '\n';
	const block = ['```image-stack', 'items:', ...items.flatMap(({ filename, alt, caption }) => [
		`  - image: ${filename}`,
		...(alt !== undefined ? [`    alt: ${JSON.stringify(alt)}`] : []),
		...(caption ? [`    caption: ${JSON.stringify(caption)}`] : []),
	]), '```', ''].join(eol);
	const text = `${source.endsWith(eol + eol) ? '' : source.endsWith(eol) ? eol : eol + eol}${block}`;
	const result = await parsePageMarkdownSource(source + text, { label: 'content.md' });
	const appended = markdownToMdast(source + text, { features: { gfm: true, frontmatter: true } }).children.at(-1);
	if (appended?.type !== 'code' || appended.lang !== 'image-stack' || appended.position.start.offset < source.length
		|| result.managedImages.length !== document.managedImages.length + items.length || result.diagnostics.some(({ severity }) => severity === 'error')) {
		throw new Error('Close the open Markdown block or comment before appending an image. The imported file remains available.');
	}
	return { start: source.length, end: source.length, text };
};
