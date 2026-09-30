import { lstat, readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { parseDocument, isScalar, isSeq } from 'yaml';
import { checkedPath, snapshot, getEditorImageUsage, planEditorRemoval } from './editor-site-files.mjs';
import { isInside, readEditorLinkState, summarizeReference } from './editor-site-links.mjs';
import { getSourcePageLocation } from './source-files.mjs';
import { parsePageMarkdownSource } from './page-markdown.mjs';
import { inspectPublicAssetFilenames } from './public-asset-conventions.mjs';
import { getReservedPublicEntries } from './public-path-policy.mjs';

export const siteResourceActionsApiVersion = 1;
const stat = (filename) => lstat(filename).catch(error => { if (error.code === 'ENOENT') return null; throw error; });
const imageName = /^[a-z0-9][a-z0-9.-]*\.(jpe?g|png|svg)$/i;
const publicPath = (siteRoot, filename) => '/' + path.relative(path.join(siteRoot, 'public'), filename).split(path.sep).join('/');
const encodePath = (value) => value.split('/').map(encodeURIComponent).join('/');
const checkedName = (name) => {
	if (typeof name !== 'string' || !name || name !== name.trim() || /[\\/\x00-\x1f\x7f<>:"|?*#%]/.test(name) || /^\.{1,2}$/.test(name) || /[. ]$/.test(name)) {
		throw new Error('Enter one filename or folder name, without slashes, URL punctuation or trailing dots/spaces.');
	}
	return name;
};
const available = async (filename) => {
	const entries = await readdir(path.dirname(filename)).catch(error => { if (error.code === 'ENOENT') return []; throw error; });
	if (entries.some(entry => entry.normalize('NFC').toLowerCase() === path.basename(filename).normalize('NFC').toLowerCase())) {
		throw new Error('That name is already in use. Choose another name; existing files will not be overwritten.');
	}
};
const resource = async ({ siteRoot, filePath }) => {
	const filename = await checkedPath(siteRoot, filePath);
	const info = await stat(filename);
	if (!info || !(info.isFile() || info.isDirectory())) throw new Error('This file or folder no longer exists. Refresh Site Tree.');
	const publicRoot = path.join(path.resolve(siteRoot), 'public');
	if (isInside(publicRoot, filename)) return { filename, kind: 'public', directory: info.isDirectory(), fixed: filename === publicRoot };
	const owner = path.dirname(path.dirname(filename));
	if (info.isFile() && path.basename(path.dirname(filename)) === 'images' && getSourcePageLocation(siteRoot, owner) && imageName.test(path.basename(filename))) {
		return { filename, kind: 'image', directory: false, sourcePath: path.join(owner, 'content.md') };
	}
	throw new Error('Choose a managed page image or a resource inside public/.');
};

const validatePublic = (siteRoot, state, filenames, directories = []) => {
	const paths = [...filenames, ...directories].map(filename => publicPath(siteRoot, filename));
	for (const pathname of paths) {
		const first = pathname.split('/')[1].toLowerCase();
		const reserved = getReservedPublicEntries(state.settings?.search !== false).find(entry => entry.filename === first);
		if (reserved) throw new Error(`${pathname} conflicts with Norna's generated ${reserved.filename}. ${reserved.explanation}`);
	}
	const outputPaths = new Set(state.graph.pages.map(page => `${page.pathname}index.html`));
	for (const page of state.graph.pages) for (const alias of page.aliases) outputPaths.add(`${alias}index.html`);
	for (const route of state.generatedRoutes) outputPaths.add(route.pathname.endsWith('/') ? `${route.pathname}index.html` : route.pathname);
	for (const filename of filenames) {
		const pathname = publicPath(siteRoot, filename);
		for (const output of outputPaths) if (pathname.toLowerCase() === output.toLowerCase() || output.toLowerCase().startsWith(pathname.toLowerCase() + '/') || pathname.toLowerCase().startsWith(output.toLowerCase() + '/')) {
			throw new Error(`${pathname} conflicts with the generated page or route ${output}. Choose another name or location.`);
		}
	}
	for (const directory of directories) if ([...outputPaths].some(output => output.toLowerCase() === publicPath(siteRoot, directory).toLowerCase())) throw new Error('This folder would occupy a generated file path. Choose another name.');
	const inspection = inspectPublicAssetFilenames(filenames.filter(filename => path.dirname(filename) === path.join(siteRoot, 'public')).map(filename => path.basename(filename)));
	if (inspection.logos.length > 1) throw new Error(`Keep one navigation logo in public/: ${inspection.logos.join(', ')}. Use Replace on the existing logo.`);
	if (inspection.socialImages.length > 1) throw new Error(`Keep one social image in public/: ${inspection.socialImages.join(', ')}.`);
	return inspection.suspicious.map(entry => entry.message);
};

export const getEditorResourceReferences = async (options) => {
	const selected = await resource(options);
	if (selected.kind === 'image') return { ...await getEditorImageUsage({ ...options, sourcePath: selected.sourcePath, imagePath: selected.filename }), scope: 'Norna image blocks. Ordinary Markdown images, HTML and external references are not checked.' };
	const state = await readEditorLinkState(options);
	return { references: state.graph.references.filter(ref => ref.resolution?.kind === 'public-file' && (selected.directory ? isInside(selected.filename, ref.resolution.file.filePath) : selected.filename === ref.resolution.file.filePath)).map(summarizeReference),
		incomplete: state.incomplete, scope: 'Page-content links. HTML, configuration and external references are not checked.' };
};

// Change YAML scalar ranges, not matching prose or example snippets. Map the
// scanner's normalized offsets back to the original CRLF/LF source.
const renameImageReferences = async (source, oldName, newName) => {
	const normalized = source.replace(/\r\n?/g, '\n');
	const offsets = []; for (let i = 0; i < source.length; i++) { offsets.push(i); if (source[i] === '\r' && source[i + 1] === '\n') i++; } offsets.push(source.length);
	const document = await parsePageMarkdownSource(normalized);
	if (document.diagnostics.some(issue => issue.severity === 'error')) throw new Error('Repair the image blocks before renaming this image.');
	const blocks = document.regions.flatMap(region => region.blocks.map(block => ({ ...block, sourceStartOffset: document.bodyOffset + region.startOffset + block.sourceStartOffset })));
	const edits = [];
	for (const block of blocks) {
		if (!['image-stack', 'image-carousel', 'card-list'].includes(block.blockType)) continue;
		const doc = parseDocument(block.source);
		const items = doc.get('items', true);
		if (!isSeq(items)) continue;
		for (const item of items.items) {
			const image = item?.get?.('image', true);
			if (!isScalar(image) || image.value !== oldName) continue;
			if (!image.range) throw new Error('This image reference has no editable source range.');
			edits.push({ start: offsets[block.sourceStartOffset + image.range[0]], end: offsets[block.sourceStartOffset + image.range[1]], text: JSON.stringify(newName) });
		}
	}
	return edits;
};
const applyText = (source, edits) => [...edits].sort((a,b) => b.start-a.start).reduce((text,edit) => text.slice(0,edit.start)+edit.text+text.slice(edit.end),source);

export const planEditorResourceRename = async ({ siteRoot, filePath, name, destinationDirectory, sources = new Map() }) => {
	siteRoot = path.resolve(siteRoot);
	const selected = await resource({ siteRoot, filePath });
	if (selected.fixed) throw new Error('The public folder has a fixed name and location.');
	const directory = destinationDirectory ?? path.dirname(selected.filename);
	if (selected.kind === 'image' && directory !== path.dirname(selected.filename)) throw new Error('Images stay in their owning page’s images folder.');
	const destination = await checkedPath(siteRoot, path.join(directory, checkedName(name)));
	if (destination === selected.filename) throw new Error('Enter a different name or location, or cancel.');
	if (!(await stat(directory))?.isDirectory()) throw new Error('Choose an existing destination folder.');
	if (selected.kind === 'public' && !isInside(path.join(siteRoot, 'public'), destination)) throw new Error('Public resources must stay inside public/.');
	if (selected.directory && isInside(selected.filename, destination)) throw new Error('A folder cannot be moved inside itself.');
	if (selected.kind === 'image' && (!imageName.test(name) || path.extname(name) !== path.extname(selected.filename))) throw new Error('Use an image filename with letters, numbers, dots or hyphens. Keep the existing extension; rename does not convert images.');
	await available(destination);
	const usage = await getEditorResourceReferences({ siteRoot, filePath, sources });
	if (usage.incomplete.length || usage.references.some(ref => ref.unresolved)) throw new Error(`References could not be resolved safely. Repair them before renaming or moving.\n${usage.incomplete.join('\n')}`);
	const files = await snapshot(selected.filename);
	const changes = [];
	let warnings = [];
	if (selected.kind === 'image') {
		for (const sourcePath of new Set(usage.references.map(ref => ref.sourcePath))) {
			await checkedPath(siteRoot, sourcePath);
			const original = sources.get(sourcePath) ?? await readFile(sourcePath, 'utf8');
			const edits = await renameImageReferences(original, path.basename(selected.filename), name);
			if (!edits.length) throw new Error(`Cannot locate the image reference in ${sourcePath}. No files changed.`);
			changes.push({ sourcePath, original, updated: applyText(original, edits) });
		}
	} else {
		const state = await readEditorLinkState({ siteRoot, sources });
		const mapped = state.publicFiles.map(file => isInside(selected.filename, file.filePath) ? path.join(destination, path.relative(selected.filename, file.filePath)) : file.filePath);
		warnings = validatePublic(siteRoot, state, mapped, selected.directory ? [destination] : []);
		const before = inspectPublicAssetFilenames(state.publicFiles.filter(file => path.dirname(file.filePath) === path.join(siteRoot, 'public')).map(file => path.basename(file.filePath)));
		const after = inspectPublicAssetFilenames(mapped.filter(filename => path.dirname(filename) === path.join(siteRoot, 'public')).map(filename => path.basename(filename)));
		for (const kind of ['logos', 'browserIcons', 'socialImages']) for (const filename of before[kind]) if (!after[kind].includes(filename)) warnings.push(`${filename} will no longer be selected automatically as a site logo, icon or social image.`);
		const bySource = new Map();
		for (const ref of state.graph.references) {
			if (ref.resolution?.kind !== 'public-file' || !isInside(selected.filename, ref.resolution.file.filePath)) continue;
			if (!ref.targetRange) throw new Error(`Cannot safely update the reference on line ${ref.line} in ${ref.sourceContentFile.contentPath}.`);
			const target = publicPath(siteRoot, path.join(destination, path.relative(selected.filename, ref.resolution.file.filePath)));
			const suffix = ref.targetSource.match(/[?#].*$/)?.[0] ?? '';
			const filename = ref.sourceContentFile.contentPath;
			if (!bySource.has(filename)) bySource.set(filename, { original: ref.sourcePage.document.fullSource, edits: new Map() });
			bySource.get(filename).edits.set(ref.targetRange.start, { ...ref.targetRange, text: encodePath(target) + suffix });
		}
		for (const [sourcePath, { original, edits }] of bySource) { await checkedPath(siteRoot, sourcePath); changes.push({ sourcePath, original, updated: applyText(original, [...edits.values()]) }); }
	}
	return { siteRoot, filePath: selected.filename, name, destinationDirectory: directory, destination, changes, usage, warnings,
		fingerprint: JSON.stringify([files, destination, changes, usage, warnings]) };
};

export const planEditorPublicCreation = async ({ siteRoot, directory, name, source, folder = false, replace = false, pending = [], sources = new Map() }) => {
	siteRoot = path.resolve(siteRoot);
	directory = await checkedPath(siteRoot, directory ?? path.join(siteRoot, 'public'));
	const publicRoot = path.join(siteRoot, 'public');
	if (!isInside(publicRoot, directory)) throw new Error('Choose a folder inside public/.');
	if (directory !== publicRoot && !(await stat(directory))?.isDirectory()) throw new Error('The destination folder no longer exists.');
	const destination = await checkedPath(siteRoot, path.join(directory, checkedName(name)));
	if (replace) { if (!(await stat(destination))?.isFile() || folder || !source) throw new Error('Select an existing public file and a replacement file.'); }
	else await available(destination);
	if (source && (!(await stat(source))?.isFile() || (await stat(source)).isSymbolicLink())) throw new Error('Choose a regular file on this computer.');
	if (source && path.resolve(source) === destination) throw new Error('This file already belongs to this folder.');
	const state = await readEditorLinkState({ siteRoot, sources });
	for (const filename of pending) { await checkedPath(siteRoot, filename); if (!isInside(publicRoot, filename)) throw new Error('Pending public files must stay inside public/.'); }
	const filenames = [...new Set([...state.publicFiles.map(file => file.filePath), ...pending])].filter(filename => filename !== destination);
	const warnings = validatePublic(siteRoot, state, [...filenames, ...(!folder ? [destination] : [])], folder ? [destination] : []);
	return { siteRoot, directory, name, source, folder, replace, destination, warnings,
		fingerprint: JSON.stringify([source ? await snapshot(source) : null, replace ? await snapshot(destination) : null, destination, warnings]) };
};

export const planEditorFolderRemoval = async ({ siteRoot, directory, sources = new Map() }) => {
	siteRoot = path.resolve(siteRoot);
	directory = await checkedPath(siteRoot, directory);
	const publicRoot = path.join(siteRoot, 'public');
	const publicFolder = isInside(publicRoot, directory);
	const kind = path.basename(directory);
	const ownerDirectory = path.dirname(directory);
	if (!publicFolder && (!['images', 'pages'].includes(kind) || !getSourcePageLocation(siteRoot, ownerDirectory))) throw new Error('Only optional pages, images and public folders can be deleted.');
	if (!(await stat(directory))?.isDirectory()) throw new Error('The selected folder no longer exists.');
	const files = await snapshot(directory);
	const plans = [];
	if (publicFolder) {
		for (const [relative, type] of files) if (type === 'file') plans.push(await planEditorRemoval({ siteRoot, sourcePath: siteRoot, filePath: path.join(directory, relative), sources }));
	} else {
		for (const entry of await readdir(directory, { withFileTypes: true })) {
			const filename = path.join(directory, entry.name);
			if (kind === 'images' && entry.isFile()) plans.push(await planEditorRemoval({ siteRoot, sourcePath: path.join(ownerDirectory, 'content.md'), imagePath: filename, sources }));
			else if (kind === 'pages' && entry.isDirectory()) plans.push(await planEditorRemoval({ siteRoot, sourcePath: path.join(filename, 'content.md'), sources }));
			else throw new Error(`Cannot delete this folder safely: ${entry.name} is not a supported ${kind === 'pages' ? 'page' : 'image'}. Review it in Explorer first.`);
		}
	}
	const usage = { references: plans.flatMap(plan => plan.usage?.references ?? []).filter(ref => !isInside(directory, ref.sourcePath)), incomplete: [...new Set(plans.flatMap(plan => plan.usage?.incomplete ?? []))] };
	return { target: directory, pages: plans.reduce((total,plan) => total + plan.pages, 0), files: files.filter(([,type]) => type === 'file').length, usage,
		fingerprint: JSON.stringify([files, plans.map(plan => plan.fingerprint), usage]) };
};

export const getEditorResourceAddress = async (options) => {
	const selected = await resource(options);
	if (selected.kind !== 'public' || selected.directory) throw new Error('Select a public file.');
	const { settings } = await readEditorLinkState(options);
	if (!settings) throw new Error('Repair site-config/settings.yaml to copy the published address.');
	return new URL(encodePath(publicPath(options.siteRoot, selected.filename)).slice(1), settings.url.replace(/\/$/, '') + '/').href;
};
