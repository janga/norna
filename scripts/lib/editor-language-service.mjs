import { access, readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { isDeepStrictEqual } from 'node:util';
import { load } from 'js-yaml';
import { isMap, isScalar, isSeq, parseDocument } from 'yaml';
import { markdownToMdast } from 'satteri';
import { parseContentTabs } from './content-tabs.mjs';
import {
	getNornaBlockSchema,
	getOpenMarkdownFenceAtLine,
	nornaMarkdownBlockDefinitions,
} from './norna-markdown-blocks.mjs';
import { resolveNavigationModel } from './navigation-model.mjs';
import {
	inspectPublicAssetFilenames,
	logoAssetFilenames,
	socialImageAssetFilenames,
} from './public-asset-conventions.mjs';
import { parsePageMarkdownSource } from './page-markdown.mjs';
import { siteSchema } from './schema-definitions.mjs';
import { homePageDirectory } from './site-conventions.mjs';

const supportedImageExtensions = new Set(['.jpg', '.jpeg', '.png', '.svg']);
const siteConfigNames = ['config.yaml'];
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

const readEditorYaml = async (filePath) => {
	try {
		const source = await readFile(filePath, 'utf8');
		const data = load(source) ?? {};
		return data && typeof data === 'object' && !Array.isArray(data) ? data : {};
	} catch {
		return null;
	}
};

const readContentFrontmatterForEditor = (source) => {
	const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
	if (!match) return {};
	try {
		const data = load(match[1]) ?? {};
		return data && typeof data === 'object' && !Array.isArray(data) ? data : {};
	} catch {
		return {};
	}
};

const getNavigationNodesForEditor = async (siteRoot) => {
	const nodes = [];

	const visit = async (pagesDirectory, depth = 1) => {
		const entries = (await readdir(pagesDirectory, { withFileTypes: true }).catch((error) => {
			if (error?.code === 'ENOENT') return [];
			throw error;
		}))
			.filter((entry) => entry.isDirectory())
			.sort((left, right) => left.name.localeCompare(right.name, 'en'));

		for (const entry of entries) {
			const nodeDirectory = path.join(pagesDirectory, entry.name);
			const contentPath = path.join(nodeDirectory, 'content.md');
			const categoryPath = path.join(nodeDirectory, 'category.yaml');
			const [hasContent, hasCategory] = await Promise.all([
				fileExists(contentPath),
				fileExists(categoryPath),
			]);

			if (hasContent !== hasCategory) {
				if (hasCategory) {
					nodes.push({
						depth,
						headings: [],
						isHome: false,
						kind: 'category',
						listed: true,
					});
				} else {
					const source = await readFile(contentPath, 'utf8');
					const data = readContentFrontmatterForEditor(source);
					const document = await parsePageMarkdownSource(source, { label: contentPath });
					nodes.push({
						depth,
						headings: document.navigationHeadings,
						isHome: depth === 1 && entry.name === homePageDirectory,
						kind: 'page',
						listed: data.navigation?.listed !== false,
					});
				}
			}

			await visit(path.join(nodeDirectory, 'pages'), depth + 1);
		}
	};

	await visit(path.join(siteRoot, 'pages'));
	return nodes;
};

const getNavigationModeForEditor = async (siteRoot) => {
	const config = await readEditorYaml(path.join(siteRoot, 'config.yaml'));
	if (!config) return null;
	const requestedMode = config.navigation?.mode ?? 'automatic';
	if (requestedMode !== 'automatic') return requestedMode;

	try {
		return resolveNavigationModel({
			mode: requestedMode,
			nodes: await getNavigationNodesForEditor(siteRoot),
		}).mode;
	} catch {
		return null;
	}
};

const findNestedYamlPropertyLine = (source, parentKey, propertyKey) => {
	const lines = source.replace(/\r\n?/g, '\n').split('\n');
	let insideParent = false;
	for (let index = 0; index < lines.length; index += 1) {
		const line = lines[index];
		if (new RegExp(`^${parentKey}:\\s*(?:#.*)?$`).test(line)) {
			insideParent = true;
			continue;
		}
		if (!insideParent) continue;
		if (/^[A-Za-z][A-Za-z0-9-]*:/.test(line)) return 1;
		if (new RegExp(`^  ${propertyKey}:`).test(line)) return index + 1;
	}
	return 1;
};

export const getThemeDiagnostics = async ({ documentPath, source }) => {
	let theme;
	try {
		theme = load(source) ?? {};
	} catch {
		return [];
	}
	if (!theme || typeof theme !== 'object' || Array.isArray(theme)) return [];

	const backgroundPattern = theme.sections?.backgroundPattern;
	if (backgroundPattern === undefined || backgroundPattern === 'uniform') return [];
	const siteRoot = await findNornaSiteRoot(documentPath);
	if (!siteRoot || await getNavigationModeForEditor(siteRoot) !== 'tree') return [];

	return [{
		code: 'tree-section-background-pattern',
		line: findNestedYamlPropertyLine(source, 'sections', 'backgroundPattern'),
		message: `sections.backgroundPattern "${backgroundPattern}" cannot be used because this site resolves to tree navigation. Tree navigation uses one uniform reading surface so the navigation rail and page content remain distinct. Remove sections.backgroundPattern or set it to uniform.`,
		severity: 'error',
	}];
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
	if (inspection.socialImages.length > 1) {
		const message = `Multiple social sharing images were found: ${inspection.socialImages.join(', ')}. Keep exactly one of ${socialImageAssetFilenames.join(', ')} in site/public.`;
		for (const filename of inspection.socialImages) {
			issues.push({
				absolutePath: path.join(publicDirectory, filename),
				code: 'multiple-social-image-files',
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
	const match = relativePath.match(/^pages\/(.+)\/content\.md$/);
	if (!match) return null;

	const pageDirectory = match[1];
	return {
		contentPath: absoluteDocumentPath,
		imagesRoot: path.join(siteRoot, 'pages', ...pageDirectory.split('/'), 'images'),
		pageLabel: pageDirectory,
		pageDirectory,
	};
};

const getBlockField = (definition, schema, key, itemField = false) => {
	const property = (itemField ? schema?.properties?.items?.items?.properties : schema?.properties)?.[key];
	if (!property) return null;
	const metadata = itemField
		? key === definition.item?.start.key ? definition.item.start : definition.item?.fields?.[key]
		: definition.options?.[key];
	return { ...property, ...metadata };
};

const getEmbeddedYaml = (source, line) => {
	const lines = source.replace(/\r\n?/g, '\n').split('\n');
	const fence = getOpenMarkdownFenceAtLine(source, line);
	const definition = fence ? nornaMarkdownBlockDefinitions[fence.type] : null;
	if (!definition || line <= fence.line) return null;
	const close = new RegExp(`^ {0,3}${fence.character}{${fence.length},}\\s*$`);
	let end = fence.line + 1;
	while (end < lines.length && !close.test(lines[end])) end += 1;
	const bodyLines = lines.slice(fence.line + 1, end);
	const bodyLine = line - fence.line - 1;
	return { bodyLines, bodyLine, definition, fence, schema: getNornaBlockSchema(fence.type) };
};

export const getMarkdownCompletionScope = ({ source, line, character }) => {
	const normalized = source.replace(/\r\n?/g, '\n');
	const lines = normalized.split('\n');
	const current = lines[line] ?? '';
	const offset = lines.slice(0, line).reduce((sum, text) => sum + text.length + 1, 0)
		+ Math.min(character ?? current.length, current.length);
	const nodes = [];
	const visit = (node) => {
		if (node.position && (offset < node.position.start.offset || offset > node.position.end.offset)) return;
		nodes.push(node);
		for (const child of node.children ?? []) visit(child);
	};
	visit(markdownToMdast(normalized, { features: { gfm: true, frontmatter: true } }));
	const frontmatterEnd = lines.findIndex((text, index) => index > 0 && /^(?:---|\.\.\.)\s*$/.test(text));
	const frontmatter = lines[0]?.trim() === '---' && line > 0 && (frontmatterEnd === -1 || line < frontmatterEnd);
	const code = nodes.find((node) => node.type === 'code');
	const literal = frontmatter || nodes.some((node) => ['html', 'inlineCode', 'yaml', 'toml'].includes(node.type));
	const nested = nodes.some((node) => ['blockquote', 'list', 'listItem', 'table', 'heading'].includes(node.type));
	const opening = !literal && !nested && code?.position.start.line === line + 1
		&& /^ {0,3}(?:`{3}|~{3})[a-z-]*$/.test(current);
	const embedded = !literal && !nested && code && code.position.start.line < line + 1
		&& Object.hasOwn(nornaMarkdownBlockDefinitions, code.lang ?? '')
		&& !/^ {0,3}(?:`{3,}|~{3,})\s*$/.test(current);
	const tabs = /:{3,}\s*tabs\b/.test(normalized) ? parseContentTabs(normalized).groups : [];
	const inTabs = tabs.some((group) => offset >= group.start && offset < (group.end ?? normalized.length + 1));
	return {
		frontmatter,
		insertBlocks: /^ {0,3}$/.test(current) && !literal && !code && !nested && !inTabs,
		blocks: Boolean(opening),
		embedded: Boolean(embedded),
		callouts: !literal && !code,
		notes: !literal && !code && !nested && !inTabs,
	};
};

const getBlockMaps = (document) => {
	if (!isMap(document.contents)) return [];
	const maps = [{ map: document.contents, itemField: false }];
	const items = document.contents.get('items', true);
	if (isSeq(items)) maps.push(...items.items.filter(isMap).map((map) => ({ map, itemField: true })));
	return maps;
};

const parseEmbeddedYaml = (source) => parseDocument(source, { schema: 'core', prettyErrors: false });

const fieldCandidate = (key, fieldDefinition, options = {}) => ({
	default: fieldDefinition.default,
	description: fieldDefinition.description,
	key,
	kind: options.kind ?? 'field',
	prefix: options.prefix ?? '',
	values: fieldDefinition.values,
	snippet: options.snippet,
});

const newBlockItemCandidate = ({ bodyLines, bodyLine, definition, schema }) => {
	const current = bodyLines[bodyLine] ?? '';
	if (!definition.item || !/^ *$/.test(current)) return null;
	const source = bodyLines.join('\n');
	const marker = '__norna_editor_new_item__';
	if (source.includes(marker)) return null;
	const original = parseEmbeddedYaml(source);
	if (original.errors.length || !isMap(original.contents)) return null;
	const itemsPair = original.contents.items.find((pair) => pair.key?.value === 'items');
	if (!itemsPair) return null;
	const sequence = itemsPair.value;
	if (!(isSeq(sequence) && !sequence.flow) && !(isScalar(sequence) && sequence.value === null)) return null;
	const probeLines = [...bodyLines];
	probeLines[bodyLine] = `${current}${marker}: null`;
	const probe = parseEmbeddedYaml(probeLines.join('\n'));
	if (getBlockMaps(probe).some(({ map }) => map.items.some(({ value }) =>
		isScalar(value) && typeof value.value === 'string' && value.value.includes(marker)))) return null;
	const offset = bodyLines.slice(0, bodyLine).reduce((sum, line) => sum + line.length + 1, 0);
	if (offset <= itemsPair.key.range[0]) return null;
	const position = isSeq(sequence) && sequence.items.length ? sequence.range[0] : itemsPair.key.range[0];
	const column = position - (source.lastIndexOf('\n', position - 1) + 1);
	const indent = ' '.repeat(column + (isSeq(sequence) && sequence.items.length ? 0 : 2));
	const insertion = [...bodyLines];
	insertion[bodyLine] = `${indent}- ${marker}: null`;
	const proposed = parseEmbeddedYaml(insertion.join('\n'));
	if (proposed.errors.length || !isMap(proposed.contents)) return null;
	const updated = proposed.contents.get('items', true);
	if (!isSeq(updated)) return null;
	const addedIndex = updated.items.findIndex((item) => isMap(item) && item.has(marker));
	if (addedIndex < 0 || updated.items[addedIndex].items.length !== 1) return null;
	// Removing the proposed item must recover the original data exactly. This
	// prevents splitting a card or attaching later fields to the new image.
	const before = original.toJS();
	const after = proposed.toJS();
	after.items.splice(addedIndex, 1);
	if (before.items === null) after.items = null;
	if (!isDeepStrictEqual(before, after)) return null;
	const image = definition.item.start.key === 'image';
	return {
		key: image ? 'Add image' : 'Add card',
		kind: 'new-item',
		description: image ? 'Insert another image with alternative text and a caption.' : 'Insert another card with text, an image, and a link.',
		snippet: blockItemSnippetLines(schema, indent).join('\n'),
	};
};

export const getNornaBlockCompletionContext = ({ source, line }) => {
	const embedded = getEmbeddedYaml(source, line);
	if (!embedded) return null;
	const { bodyLines, bodyLine, definition, fence, schema } = embedded;
	const fieldContext = getNornaBlockFieldContext({ source, line });
	if (fieldContext?.field.values) return {
		candidates: Object.entries(fieldContext.field.values).map(([label, value]) => ({ ...value, kind: 'value', label })),
		definition, fence, mode: 'value', value: fieldContext.value, valueRange: fieldContext.valueRange,
	};
	const result = { candidates: [], definition, fence, mode: 'field' };
	const newItem = newBlockItemCandidate(embedded);
	if (newItem) result.candidates.push(newItem);
	const currentLine = bodyLines[bodyLine] ?? '';
	const prefix = currentLine.match(/^( *)(-\s*)?(?:[a-z][a-z0-9-]*)?$/);
	if (!prefix) return result;
	// A temporary key lets YAML, not indentation guesses, identify the owning map.
	const sentinel = '__norna_editor_completion__';
	bodyLines[bodyLine] = `${prefix[1]}${prefix[2] ? '- ' : ''}${sentinel}: null`;
	let document = parseEmbeddedYaml(bodyLines.join('\n'));
	let owner = getBlockMaps(document).find(({ map }) => map.has(sentinel));
	let itemPrefix = Boolean(prefix[2]);
	if ((!owner || document.errors.length) && !itemPrefix && prefix[1]) {
		bodyLines[bodyLine] = `${prefix[1]}- ${sentinel}: null`;
		document = parseEmbeddedYaml(bodyLines.join('\n'));
		owner = getBlockMaps(document).find(({ map, itemField }) => itemField && map.has(sentinel));
		itemPrefix = true;
	}
	if (document.errors.length) return result;
	if (!owner) return result;
	const properties = owner.itemField ? schema?.properties?.items?.items?.properties : schema?.properties;
	result.candidates.unshift(...Object.keys(properties ?? {})
		.filter((key) => !owner.map.has(key))
		.map((key) => fieldCandidate(key, getBlockField(definition, schema, key, owner.itemField), {
			prefix: itemPrefix ? '- ' : '',
			kind: itemPrefix ? 'item' : 'field',
			snippet: key === 'items' ? `items:\n  - ${definition.item.start.key}: \${1:${definition.item.start.key === 'image' ? 'filename.jpg' : 'Card title'}}` : undefined,
		})));
	return result;
};

export const getNornaBlockFieldContext = ({ source, line }) => {
	const embedded = getEmbeddedYaml(source, line);
	if (!embedded) return null;
	const { bodyLines, bodyLine, definition, fence, schema } = embedded;
	const start = bodyLines.slice(0, bodyLine).reduce((sum, text) => sum + text.length + 1, 0);
	const end = start + (bodyLines[bodyLine]?.length ?? 0);
	for (const { map, itemField } of getBlockMaps(parseEmbeddedYaml(bodyLines.join('\n')))) {
		for (const pair of map.items) {
			if (!isScalar(pair.key) || pair.key.range[0] < start || pair.key.range[0] > end) continue;
			const key = pair.key.value;
			const field = getBlockField(definition, schema, key, itemField);
			if (field) return {
				definition, field, fence, key, value: isScalar(pair.value) ? pair.value.value : null,
				valueRange: isScalar(pair.value) && pair.value.range?.[1] <= end
					? { start: pair.value.range[0] - start, end: pair.value.range[1] - start } : null,
			};
		}
	}
	return null;
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
		});
	}
};

const collectPageImageRoots = async (directory, siteRoot, roots) => {
	const entries = await readdir(directory, { withFileTypes: true }).catch((error) => {
		if (error?.code === 'ENOENT') return [];
		throw error;
	});

	for (const entry of entries) {
		if (!entry.isDirectory()) continue;
		const absolutePath = path.join(directory, entry.name);
		if (entry.name === 'images') {
			const pageDirectory = toPosixPath(path.relative(path.join(siteRoot, 'pages'), path.dirname(absolutePath)));
			roots.push({ imageRoot: absolutePath, pageLabel: pageDirectory });
			continue;
		}
		await collectPageImageRoots(absolutePath, siteRoot, roots);
	}
};

const getContentFiles = async (siteRoot) => {
	const files = [];

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

	await visit(path.join(siteRoot, 'pages'));
	return files;
};

const getReferencesByFilename = async (siteRoot) => {
	const references = new Map();
	for (const contentPath of await getContentFiles(siteRoot)) {
		const source = await readFile(contentPath, 'utf8');
		const page = await parsePageMarkdownSource(source, { label: toPosixPath(path.relative(siteRoot, contentPath)) });
		for (const reference of page.managedImages) {
			if (!references.has(reference.image)) references.set(reference.image, []);
			references.get(reference.image).push(toPosixPath(path.relative(siteRoot, contentPath)));
		}
	}
	return references;
};

export const createSiteImageIndex = async (siteRoot) => {
	const files = [];
	const pageRoots = [];
	await collectPageImageRoots(path.join(siteRoot, 'pages'), siteRoot, pageRoots);
	for (const root of pageRoots) {
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

const getEditorImageReferences = (source) => {
	const names = new Set();
	const visit = (node) => {
		if (node.type === 'code' && ['image-stack', 'image-carousel', 'card-list'].includes(node.lang)) {
			// Read partial YAML too: an unfinished image field must not hide earlier items.
			for (const { map, itemField } of getBlockMaps(parseEmbeddedYaml(node.value))) {
				const image = itemField ? map.get('image', true) : null;
				if (isScalar(image) && typeof image.value === 'string') names.add(image.value);
			}
		}
		for (const child of node.children ?? []) visit(child);
	};
	visit(markdownToMdast(source, { features: { gfm: true, frontmatter: true } }));
	return names;
};

export const getImageCompletionContext = async ({ documentPath, source, line }) => {
	const siteRoot = await findNornaSiteRoot(documentPath);
	if (!siteRoot) return null;
	const page = getPageContext(siteRoot, documentPath);
	if (!page) return null;
	const fence = getOpenMarkdownFenceAtLine(source, line);
	if (!fence || !['image-stack', 'image-carousel', 'card-list'].includes(fence.type)) return null;

	const fieldContext = getNornaBlockFieldContext({ source, line });
	if (fieldContext?.key !== 'image' || !fieldContext.valueRange) return null;

	const expectedDirectory = page.imagesRoot;
	const index = await createSiteImageIndex(siteRoot);
	const currentReferences = getEditorImageReferences(source);
	const currentDocument = toPosixPath(path.relative(siteRoot, documentPath));
	const candidates = index.files.map((file) => {
		const isExpected = path.dirname(file.absolutePath) === expectedDirectory;
		const duplicateCount = index.filesByName.get(file.filename)?.length ?? 0;
		const localMatch = index.filesByName.get(file.filename)?.some((match) => path.dirname(match.absolutePath) === expectedDirectory);
		const referenced = currentReferences.has(file.filename);
		const usage = referenced && !localMatch && duplicateCount > 1 ? 'ambiguous'
			: referenced && (isExpected || !localMatch && duplicateCount === 1) ? 'used' : 'unused';
		const referencedBy = [...new Set(index.referencesByFilename.get(file.filename) ?? [])]
			.filter((reference) => reference !== currentDocument);
		if (usage === 'used') referencedBy.push(currentDocument);
		const sortText = `${isExpected ? '0' : '1'}-${{ unused: '0', used: '1', ambiguous: '2' }[usage]}-${file.filename}-${toPosixPath(file.absolutePath)}`;
		return {
			...file,
			duplicateCount,
			isExpected,
			referencedBy,
			usage,
			sortText,
			siteRelativePath: toPosixPath(path.relative(siteRoot, file.absolutePath)),
		};
	}).sort((left, right) => {
		return left.sortText.localeCompare(right.sortText, 'en');
	});

	return {
		candidates,
		valueRange: fieldContext.valueRange,
		expectedDirectory,
		page,
		siteRoot,
	};
};

export const getImageDefinitionContext = async ({ documentPath, source, line }) => {
	const context = getNornaBlockFieldContext({ source, line });
	if (context?.key !== 'image' || typeof context.value !== 'string') return null;
	const filename = context.value;
	if (!/^[a-z0-9][a-z0-9.-]*\.(jpe?g|png|svg)$/i.test(filename)) return null;
	const siteRoot = await findNornaSiteRoot(documentPath);
	const page = siteRoot ? getPageContext(siteRoot, documentPath) : null;
	if (!siteRoot || !page) return null;

	const expectedPath = path.join(page.imagesRoot, filename);
	if (await fileExists(expectedPath)) return { files: [expectedPath], filename, siteRoot };

	const index = await createSiteImageIndex(siteRoot);
	return {
		files: (index.filesByName.get(filename) ?? []).map((candidate) => candidate.absolutePath),
		filename,
		siteRoot,
	};
};

const getContentFrontmatterDiagnostics = (source) => {
	const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
	if (!match) {
		return /^---(?:\r?\n|$)/.test(source)
			? [{ severity: 'error', line: 1, message: 'YAML frontmatter starts with ---, but no closing --- delimiter was found.' }]
			: [];
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

export const getMarkdownDiagnostics = async ({ documentPath, source }) => {
	const document = await parsePageMarkdownSource(source, { label: path.basename(documentPath) });
	const diagnostics = [
		...getContentFrontmatterDiagnostics(source),
		...document.diagnostics.map((diagnostic) => ({
			code: diagnostic.code,
			severity: diagnostic.severity,
			line: diagnostic.line,
			message: diagnostic.fix
				? `${diagnostic.message} ${diagnostic.fix}`
				: diagnostic.message,
		})),
	];
	for (const reference of document.markdownImages) {
		diagnostics.push({
			code: 'local-markdown-image',
			severity: 'warning',
			line: reference.line,
			message: `Local Markdown image "${reference.target}" is not managed by Norna. Use image-stack, image-carousel, or card-list for validated and synchronized site images.`,
		});
	}

	const siteRoot = await findNornaSiteRoot(documentPath);
	const pageContext = siteRoot ? getPageContext(siteRoot, documentPath) : null;
	if (!siteRoot || !pageContext) return diagnostics;

	const index = await createSiteImageIndex(siteRoot);
	for (const reference of document.managedImages) {
		const filename = reference.image;
		const expectedPath = path.join(pageContext.imagesRoot, filename);
		if (await fileExists(expectedPath)) continue;

		const candidates = index.filesByName.get(filename) ?? [];
		if (candidates.length === 0) {
			diagnostics.push({
				code: 'missing-image',
				severity: 'error',
				line: reference.line,
				message: `Image "${filename}" was not found in this page's images folder or elsewhere in this Norna site.`,
			});
			continue;
		}
		if (candidates.length > 1) {
			diagnostics.push({
				code: 'ambiguous-image',
				severity: 'warning',
				line: reference.line,
				message: `Image "${filename}" is ambiguous. Found: ${candidates.map((candidate) => toPosixPath(path.relative(siteRoot, candidate.absolutePath))).join(', ')}.`,
			});
			continue;
		}

		const candidate = candidates[0];
		const referencedBy = index.referencesByFilename.get(filename) ?? [];
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
				? `Image "${filename}" is stored at ${toPosixPath(path.relative(siteRoot, candidate.absolutePath))} and is still referenced by ${otherReferences.join(', ')}. Norna cannot relocate it safely.`
				: `Image "${filename}" is stored at ${toPosixPath(path.relative(siteRoot, candidate.absolutePath))}. Run "norna content:sync" to relocate it to this page's images folder.`,
		});
	}

	return diagnostics;
};

const blockItemSnippetLines = (schema, indent = '  ', startIndex = 0, item = 0) => {
	const examples = { title: 'Card title', text: 'Card text', image: 'filename.jpg', alt: 'Alternative text', caption: 'Caption', link: '/destination/' };
	const properties = schema.properties.items.items.properties;
	return Object.keys(properties).filter((key) => Object.hasOwn(examples, key)).map((key, index) => {
		const example = key === 'image' && item > 0 ? `image-${item + 1}.jpg` : examples[key];
		return `${indent}${index === 0 ? '- ' : '  '}${key}: \${${startIndex + index + 1}:${example}}`;
	});
};

const blockSnippet = (type, definition) => {
	const schema = getNornaBlockSchema(type);
	const lines = [`\`\`\`${type}`];
	let index = 0;
	for (const [key, option] of Object.entries(definition.options ?? {})) {
		if (option.default === undefined) continue;
		lines.push(`${key}: \${${++index}|${Object.keys(option.values).join(',')}|}`);
	}
	if (definition.item) {
		lines.push('items:');
		for (let item = 0; item < (schema.properties.items.minItems ?? 1); item += 1) {
			const itemLines = blockItemSnippetLines(schema, '  ', index, item);
			lines.push(...itemLines);
			index += itemLines.length;
		}
	}
	return [...lines, '```'].join('\n');
};

export const nornaBlockDefinitions = Object.freeze(Object.fromEntries(
	Object.entries(nornaMarkdownBlockDefinitions).map(([type, definition]) => [type, Object.freeze({
		...definition,
		snippet: blockSnippet(type, definition),
	})]),
));
