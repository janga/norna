import { access, readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { load } from 'js-yaml';
import {
	extractInlineNoteDiagnostics,
	extractMarkdownImageReferences,
	extractNornaMarkdownBlockDiagnostics,
	getNornaBlockImageReferences,
	nornaMarkdownBlockDefinitions,
} from './norna-markdown-blocks.mjs';
import { inspectPublicAssetFilenames, logoAssetFilenames } from './public-asset-conventions.mjs';
import { siteSchema } from './schema-definitions.mjs';

const supportedImageExtensions = new Set(['.jpg', '.jpeg', '.png', '.svg']);
const siteConfigNames = ['config.yaml'];
const headingIdPattern = /^##\s+.+?\s*\{#([a-z0-9-]+)\}\s*$/;

const fileExists = (filePath) => access(filePath).then(() => true, () => false);
const toPosixPath = (filePath) => filePath.split(path.sep).join('/');

const findFile = async (directory, names) => {
	for (const name of names) {
		if (await fileExists(path.join(directory, name))) return name;
	}
	return null;
};

export const findNornaSiteRoot = async (documentPath) => {
	let current = path.dirname(path.resolve(documentPath));

	while (true) {
		if (await findFile(current, siteConfigNames)) return current;

		const parent = path.dirname(current);
		if (parent === current) return null;
		current = parent;
	}
};

const readSitewideLogoForEditor = async (siteRoot) => {
	const filename = await findFile(siteRoot, ['sitewide-content.yaml']);
	if (!filename) return null;
	const absolutePath = path.join(siteRoot, filename);
	const source = await readFile(absolutePath, 'utf8');

	try {
		const data = load(source) ?? {};
		const logoConfigured = Boolean(
			data
			&& typeof data === 'object'
			&& Object.hasOwn(data, 'logo'),
		);
		const logoLine = source.replace(/\r\n?/g, '\n').split('\n')
			.findIndex((line) => /^logo:\s*(?:#.*)?$/.test(line)) + 1;
		return {
			absolutePath,
			logoConfigured,
			logoLine: logoLine > 0 ? logoLine : 1,
		};
	} catch {
		return null;
	}
};

export const getSitePublicAssetStatus = async (documentPath) => {
	const siteRoot = await findNornaSiteRoot(documentPath);
	if (!siteRoot) return null;

	const publicDirectory = path.join(siteRoot, 'public');
	const entries = await readdir(publicDirectory, { withFileTypes: true }).catch((error) => {
		if (error?.code === 'ENOENT') return [];
		throw error;
	});
	const inspection = inspectPublicAssetFilenames(
		entries.filter((entry) => entry.isFile()).map((entry) => entry.name),
	);
	const sitewideLogo = await readSitewideLogoForEditor(siteRoot);
	const issues = inspection.suspicious.map((issue) => ({
		...issue,
		absolutePath: path.join(publicDirectory, issue.filename),
		severity: 'warning',
	}));

	if (inspection.logos.length > 1) {
		const message = `Multiple navigation logos were found: ${inspection.logos.join(', ')}. Keep exactly one of ${logoAssetFilenames.join(', ')} in site/public.`;
		for (const filename of inspection.logos) {
			issues.push({
				absolutePath: path.join(publicDirectory, filename),
				code: 'multiple-logo-files',
				filename,
				message,
				severity: 'error',
			});
		}
	}
	if (inspection.logos.length === 0 && sitewideLogo?.logoConfigured) {
		const publicLabel = toPosixPath(path.relative(path.dirname(siteRoot), publicDirectory));
		issues.push({
			absolutePath: sitewideLogo.absolutePath,
			code: 'missing-logo-file',
			filename: path.basename(sitewideLogo.absolutePath),
			line: sitewideLogo.logoLine,
			message: `Logo display settings are configured, but no logo file was found. Add exactly one of ${logoAssetFilenames.map((filename) => `${publicLabel}/${filename}`).join(', ')}, or remove logo.`,
			severity: 'error',
		});
	}

	return {
		...inspection,
		issues,
		sitewideLogo,
		publicDirectory,
		siteRoot,
	};
};

const getPageContext = (siteRoot, documentPath) => {
	const absoluteDocumentPath = path.resolve(documentPath);
	const relativePath = toPosixPath(path.relative(siteRoot, absoluteDocumentPath));
	if (relativePath === 'content.md') {
		return {
			contentPath: absoluteDocumentPath,
			imagesRoot: path.join(siteRoot, 'images'),
			pageLabel: 'Home',
			routeDirectory: null,
		};
	}

	const match = relativePath.match(/^routes\/(.+)\/content\.md$/);
	if (!match) return null;

	const routeDirectory = match[1];
	return {
		contentPath: absoluteDocumentPath,
		imagesRoot: path.join(siteRoot, 'routes', ...routeDirectory.split('/'), 'images'),
		pageLabel: routeDirectory,
		routeDirectory,
	};
};

const getSectionAtLine = (source, lineIndex) => {
	const lines = source.replace(/\r\n?/g, '\n').split('\n');
	let section = null;

	for (let index = 0; index <= Math.min(lineIndex, lines.length - 1); index += 1) {
		const match = lines[index].match(headingIdPattern);
		if (match) section = { id: match[1], line: index };
	}

	return section;
};

const getOpenFenceAtLine = (source, lineIndex) => {
	const lines = source.replace(/\r\n?/g, '\n').split('\n');
	let open = null;

	for (let index = 0; index <= Math.min(lineIndex, lines.length - 1); index += 1) {
		const match = lines[index].match(/^ {0,3}(`{3,}|~{3,})([^\r\n]*)$/);
		if (!match) continue;

		if (!open) {
			open = {
				character: match[1][0],
				length: match[1].length,
				line: index,
				type: match[2].trim().split(/\s+/)[0] ?? '',
			};
			continue;
		}

		if (match[1][0] === open.character && match[1].length >= open.length && !match[2].trim()) {
			open = null;
		}
	}

	return open;
};

const getBlockField = (definition, key, itemField = false) => (
	itemField ? definition.item?.fields?.[key] : definition.options?.[key]
);

const getExistingKeys = (lines, startLine, endLine, indent) => {
	const keys = new Set();
	for (let index = startLine; index < endLine; index += 1) {
		const match = lines[index]?.match(/^(\s*)(?:-\s+)?([a-z][a-z0-9-]*):/);
		if (match && match[1].length === indent) keys.add(match[2]);
	}
	return keys;
};

const findCurrentItemLine = (lines, fence, lineIndex, itemKey) => {
	for (let index = lineIndex; index > fence.line; index -= 1) {
		if (new RegExp(`^\\s*-\\s+${itemKey}:`).test(lines[index] ?? '')) return index;
	}
	return null;
};

const fieldCandidate = (key, fieldDefinition, options = {}) => ({
	default: fieldDefinition.default,
	description: fieldDefinition.description,
	key,
	kind: options.kind ?? 'field',
	prefix: options.prefix ?? '',
	values: fieldDefinition.values,
});

export const getNornaBlockCompletionContext = ({ source, line }) => {
	const lines = source.replace(/\r\n?/g, '\n').split('\n');
	const fence = getOpenFenceAtLine(source, line);
	const definition = fence ? nornaMarkdownBlockDefinitions[fence.type] : null;
	if (!fence || !definition) return null;

	const currentLine = lines[line] ?? '';
	const keyMatch = currentLine.match(/^(\s*)(?:-\s+)?([a-z][a-z0-9-]*):\s*(.*)$/);
	if (keyMatch) {
		const indent = keyMatch[1].length;
		const isItemField = indent === 2 || currentLine.trimStart().startsWith('- ');
		const selectedField = currentLine.trimStart().startsWith('- ')
			? keyMatch[2] === definition.item?.start.key ? definition.item.start : null
			: getBlockField(definition, keyMatch[2], isItemField);
		if (selectedField?.values) {
			return {
				candidates: Object.entries(selectedField.values).map(([valueName, valueDefinition]) => ({
					description: valueDefinition.description,
					kind: 'value',
					label: valueName,
					title: valueDefinition.title,
				})),
				definition,
				fence,
				mode: 'value',
				value: keyMatch[3],
			};
		}
	}

	const indent = currentLine.match(/^\s*/)?.[0].length ?? 0;
	const itemKey = definition.item?.start.key;
	const currentItemLine = itemKey ? findCurrentItemLine(lines, fence, line, itemKey) : null;
	let candidates = [];

	if (indent >= 2 && currentItemLine !== null) {
		const existing = getExistingKeys(lines, currentItemLine + 1, line, 2);
		candidates = Object.entries(definition.item.fields)
			.filter(([key]) => !existing.has(key))
			.map(([key, fieldDefinition]) => fieldCandidate(key, fieldDefinition));
	} else if (indent === 0) {
		const hasItem = currentItemLine !== null;
		if (!hasItem && definition.options) {
			const existing = getExistingKeys(lines, fence.line + 1, line, 0);
			candidates.push(...Object.entries(definition.options)
				.filter(([key]) => !existing.has(key))
				.map(([key, fieldDefinition]) => fieldCandidate(key, fieldDefinition)));
		}
		if (definition.item?.start) {
			candidates.push(fieldCandidate(itemKey, definition.item.start, {
				kind: 'item',
				prefix: definition.item.start.prefix,
			}));
		}
	}

	return {
		candidates,
		definition,
		fence,
		mode: 'field',
	};
};

export const getNornaBlockFieldContext = ({ source, line }) => {
	const lines = source.replace(/\r\n?/g, '\n').split('\n');
	const fence = getOpenFenceAtLine(source, line);
	const definition = fence ? nornaMarkdownBlockDefinitions[fence.type] : null;
	if (!fence || !definition) return null;
	const currentLine = lines[line] ?? '';
	const match = currentLine.match(/^(\s*)(-\s+)?([a-z][a-z0-9-]*):/);
	if (!match) return null;

	const key = match[3];
	const fieldDefinition = match[2]
		? key === definition.item?.start.key ? definition.item.start : null
		: getBlockField(definition, key, match[1].length === 2);
	return fieldDefinition ? { definition, field: fieldDefinition, fence, key } : null;
};

const collectImageFiles = async (directory, imageRoot, pageLabel, files) => {
	const entries = await readdir(directory, { withFileTypes: true }).catch((error) => {
		if (error?.code === 'ENOENT') return [];
		throw error;
	});

	for (const entry of entries) {
		const absolutePath = path.join(directory, entry.name);
		if (entry.isDirectory()) {
			await collectImageFiles(absolutePath, imageRoot, pageLabel, files);
			continue;
		}
		if (!entry.isFile() || !supportedImageExtensions.has(path.extname(entry.name).toLowerCase())) continue;

		const relativeToImages = toPosixPath(path.relative(imageRoot, absolutePath));
		files.push({
			absolutePath,
			filename: entry.name,
			pageLabel,
			relativeToImages,
			sectionId: relativeToImages.split('/')[0] ?? '',
		});
	}
};

const collectRouteImageRoots = async (directory, siteRoot, roots) => {
	const entries = await readdir(directory, { withFileTypes: true }).catch((error) => {
		if (error?.code === 'ENOENT') return [];
		throw error;
	});

	for (const entry of entries) {
		if (!entry.isDirectory()) continue;
		const absolutePath = path.join(directory, entry.name);
		if (entry.name === 'images') {
			const routeDirectory = toPosixPath(path.relative(path.join(siteRoot, 'routes'), path.dirname(absolutePath)));
			roots.push({ imageRoot: absolutePath, pageLabel: routeDirectory });
			continue;
		}
		await collectRouteImageRoots(absolutePath, siteRoot, roots);
	}
};

const getContentFiles = async (siteRoot) => {
	const files = [];
	const homePath = path.join(siteRoot, 'content.md');
	if (await fileExists(homePath)) files.push(homePath);

	const visit = async (directory) => {
		const entries = await readdir(directory, { withFileTypes: true }).catch((error) => {
			if (error?.code === 'ENOENT') return [];
			throw error;
		});
		for (const entry of entries) {
			const absolutePath = path.join(directory, entry.name);
			if (entry.isDirectory()) await visit(absolutePath);
			else if (entry.isFile() && entry.name === 'content.md') files.push(absolutePath);
		}
	};

	await visit(path.join(siteRoot, 'routes'));
	return files;
};

const getReferencesByFilename = async (siteRoot) => {
	const references = new Map();
	for (const contentPath of await getContentFiles(siteRoot)) {
		const source = await readFile(contentPath, 'utf8');
		const { blocks } = extractNornaMarkdownBlockDiagnostics(source, { label: toPosixPath(path.relative(siteRoot, contentPath)) });
		for (const reference of getNornaBlockImageReferences(blocks)) {
			if (!references.has(reference.image)) references.set(reference.image, []);
			references.get(reference.image).push(toPosixPath(path.relative(siteRoot, contentPath)));
		}
	}
	return references;
};

export const createSiteImageIndex = async (siteRoot) => {
	const files = [];
	const homeImageRoot = path.join(siteRoot, 'images');
	await collectImageFiles(homeImageRoot, homeImageRoot, 'Home', files);

	const routeRoots = [];
	await collectRouteImageRoots(path.join(siteRoot, 'routes'), siteRoot, routeRoots);
	for (const root of routeRoots) {
		await collectImageFiles(root.imageRoot, root.imageRoot, root.pageLabel, files);
	}

	const referencesByFilename = await getReferencesByFilename(siteRoot);
	const filesByName = new Map();
	for (const file of files) {
		if (!filesByName.has(file.filename)) filesByName.set(file.filename, []);
		filesByName.get(file.filename).push(file);
	}

	for (const candidates of filesByName.values()) {
		candidates.sort((left, right) => left.absolutePath.localeCompare(right.absolutePath, 'en'));
	}

	return { files, filesByName, referencesByFilename };
};

export const getImageCompletionContext = async ({ documentPath, source, line }) => {
	const siteRoot = await findNornaSiteRoot(documentPath);
	if (!siteRoot) return null;
	const page = getPageContext(siteRoot, documentPath);
	if (!page) return null;
	const fence = getOpenFenceAtLine(source, line);
	if (!fence || !['norna-image-stack', 'norna-image-carousel', 'norna-card-list'].includes(fence.type)) return null;

	const currentLine = source.replace(/\r\n?/g, '\n').split('\n')[line] ?? '';
	if (!/^\s*(?:-\s+)?image:\s*[^\s]*$/.test(currentLine)) return null;

	const section = getSectionAtLine(source, line);
	if (!section) return null;
	const expectedDirectory = path.join(page.imagesRoot, section.id);
	const index = await createSiteImageIndex(siteRoot);
	const candidates = index.files.map((file) => {
		const isExpected = path.dirname(file.absolutePath) === expectedDirectory;
		const duplicateCount = index.filesByName.get(file.filename)?.length ?? 0;
		const referencedBy = index.referencesByFilename.get(file.filename) ?? [];
		return {
			...file,
			duplicateCount,
			isExpected,
			referencedBy,
			siteRelativePath: toPosixPath(path.relative(siteRoot, file.absolutePath)),
		};
	}).sort((left, right) => {
		if (left.isExpected !== right.isExpected) return left.isExpected ? -1 : 1;
		return left.filename.localeCompare(right.filename, 'en');
	});

	return {
		candidates,
		expectedDirectory,
		page,
		section,
		siteRoot,
	};
};

export const getImageDefinitionContext = async ({ documentPath, source, line }) => {
	const currentLine = source.replace(/\r\n?/g, '\n').split('\n')[line] ?? '';
	const match = currentLine.match(/^\s*(?:-\s+)?image:\s*([^\s#]+)\s*(?:#.*)?$/);
	if (!match) return null;

	const filename = match[1].replace(/^['"]|['"]$/g, '');
	const siteRoot = await findNornaSiteRoot(documentPath);
	const page = siteRoot ? getPageContext(siteRoot, documentPath) : null;
	const section = getSectionAtLine(source, line);
	if (!siteRoot || !page || !section) return null;

	const expectedPath = path.join(page.imagesRoot, section.id, filename);
	if (await fileExists(expectedPath)) return { files: [expectedPath], filename, siteRoot };

	const index = await createSiteImageIndex(siteRoot);
	return {
		files: (index.filesByName.get(filename) ?? []).map((candidate) => candidate.absolutePath),
		filename,
		siteRoot,
	};
};

const getLineFromMessage = (message, fallback = 1) => {
	const match = String(message).match(/\bline\s+(\d+)\b/i);
	return match ? Number.parseInt(match[1], 10) : fallback;
};

const getImageReferenceLines = (source) => {
	const lines = source.replace(/\r\n?/g, '\n').split('\n');
	const references = [];
	let fence = null;

	for (const [index, line] of lines.entries()) {
		const fenceMatch = line.match(/^ {0,3}(`{3,}|~{3,})([^\r\n]*)$/);
		if (fenceMatch) {
			if (!fence) {
				fence = { character: fenceMatch[1][0], length: fenceMatch[1].length, type: fenceMatch[2].trim().split(/\s+/)[0] ?? '' };
			} else if (fenceMatch[1][0] === fence.character && fenceMatch[1].length >= fence.length && !fenceMatch[2].trim()) {
				fence = null;
			}
			continue;
		}
		if (!fence || !fence.type.startsWith('norna-')) continue;

		const match = line.match(/^\s*(?:-\s+)?image:\s*([^\s#]+)\s*(?:#.*)?$/);
		if (match) references.push({ filename: match[1].replace(/^['"]|['"]$/g, ''), line: index + 1 });
	}

	return references;
};

const getContentFrontmatterDiagnostics = (source) => {
	const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
	if (!match) {
		return [{ severity: 'error', line: 1, message: 'Norna content files must start with YAML frontmatter delimited by ---.' }];
	}

	let data;
	try {
		data = load(match[1]) ?? {};
	} catch (error) {
		return [{
			severity: 'error',
			line: (error?.mark?.line ?? 0) + 2,
			message: `Invalid YAML frontmatter: ${error instanceof Error ? error.message : String(error)}`,
		}];
	}

	const parsed = siteSchema.safeParse(data);
	if (parsed.success) return [];

	return parsed.error.issues.map((issue) => ({
		severity: 'error',
		line: 2,
		message: `${issue.path.join('.') || 'frontmatter'}: ${issue.message}`,
	}));
};

const getSectionHeadingDiagnostics = (source) => source.replace(/\r\n?/g, '\n').split('\n')
	.flatMap((line, index) => {
		if (!/^##(?:\s|$)/.test(line) || headingIdPattern.test(line)) return [];
		return [{
			code: 'missing-section-id',
			severity: 'error',
			line: index + 1,
			message: 'Level 2 Norna section headings require an explicit id, for example "## Introduction {#introduction}".',
		}];
	});

export const getMarkdownDiagnostics = async ({ documentPath, source }) => {
	const diagnostics = [
		...getContentFrontmatterDiagnostics(source),
		...getSectionHeadingDiagnostics(source),
	];
	const blockResult = extractNornaMarkdownBlockDiagnostics(source, { label: path.basename(documentPath) });
	for (const error of blockResult.errors) {
		diagnostics.push({
			code: error.message.includes('but not closed') ? 'unclosed-norna-block' : 'invalid-norna-block',
			severity: 'error',
			line: getLineFromMessage(error.message, error.line),
			message: error.message,
		});
	}
	for (const error of extractInlineNoteDiagnostics(source, { label: path.basename(documentPath) }).errors) {
		diagnostics.push({ severity: 'error', line: error.line ?? getLineFromMessage(error.message), message: error.message });
	}
	for (const reference of extractMarkdownImageReferences(source)) {
		diagnostics.push({
			code: 'local-markdown-image',
			severity: 'warning',
			line: reference.line,
			message: `Local Markdown image "${reference.target}" is not managed by Norna. Use norna-image-stack, norna-image-carousel, or norna-card-list for validated and synchronized site images.`,
		});
	}

	const siteRoot = await findNornaSiteRoot(documentPath);
	const page = siteRoot ? getPageContext(siteRoot, documentPath) : null;
	if (!siteRoot || !page) return diagnostics;

	const index = await createSiteImageIndex(siteRoot);
	for (const reference of getImageReferenceLines(source)) {
		const section = getSectionAtLine(source, reference.line - 1);
		if (!section) continue;
		const expectedPath = path.join(page.imagesRoot, section.id, reference.filename);
		if (await fileExists(expectedPath)) continue;

		const candidates = index.filesByName.get(reference.filename) ?? [];
		if (candidates.length === 0) {
			diagnostics.push({
				code: 'missing-image',
				severity: 'error',
				line: reference.line,
				message: `Image "${reference.filename}" was not found in the expected section folder or elsewhere in this Norna site.`,
			});
			continue;
		}
		if (candidates.length > 1) {
			diagnostics.push({
				code: 'ambiguous-image',
				severity: 'warning',
				line: reference.line,
				message: `Image "${reference.filename}" is ambiguous. Found: ${candidates.map((candidate) => toPosixPath(path.relative(siteRoot, candidate.absolutePath))).join(', ')}.`,
			});
			continue;
		}

		const candidate = candidates[0];
		const referencedBy = index.referencesByFilename.get(reference.filename) ?? [];
		const currentRelativePath = toPosixPath(path.relative(siteRoot, documentPath));
		const otherReferences = referencedBy.filter((contentPath) => contentPath !== currentRelativePath);
		diagnostics.push({
			code: otherReferences.length > 0 ? 'shared-image' : 'image-needs-sync',
			data: {
				imagePath: candidate.absolutePath,
				siteRoot,
			},
			severity: 'warning',
			line: reference.line,
			message: otherReferences.length > 0
				? `Image "${reference.filename}" is stored at ${toPosixPath(path.relative(siteRoot, candidate.absolutePath))} and is still referenced by ${otherReferences.join(', ')}. Norna cannot relocate it safely.`
				: `Image "${reference.filename}" is stored at ${toPosixPath(path.relative(siteRoot, candidate.absolutePath))}. Run "norna content:sync" to relocate it to this section.`,
		});
	}

	return diagnostics;
};

export const nornaBlockDefinitions = Object.freeze({
	'norna-image-stack': Object.freeze({
		...nornaMarkdownBlockDefinitions['norna-image-stack'],
		snippet: '```norna-image-stack\n- image: ${1:filename.jpg}\n  alt: ${2:Alternative text}\n  caption: ${3:Caption}\n```',
	}),
	'norna-image-carousel': Object.freeze({
		...nornaMarkdownBlockDefinitions['norna-image-carousel'],
		snippet: '```norna-image-carousel\n- image: ${1:first.jpg}\n  alt: ${2:Alternative text}\n- image: ${3:second.jpg}\n  alt: ${4:Alternative text}\n```',
	}),
	'norna-card-list': Object.freeze({
		...nornaMarkdownBlockDefinitions['norna-card-list'],
		snippet: '```norna-card-list\nlayout: ${1|image-top,image-left,image-right|}\nflow: ${2|grid,stack|}\nsize: ${3|s,m,l,xl|}\nwidth: ${4|text,narrow,normal,wide|}\n\n- title: ${5:Card title}\n  text: ${6:Card text}\n  image: ${7:filename.jpg}\n```',
	}),
});
