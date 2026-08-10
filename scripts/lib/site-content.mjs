import { access, readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import {
	siteContentLabel,
	siteContentPath,
	siteDir,
	siteImagesDir,
	siteImagesLabel,
	siteRoutesDir,
	siteRoutesLabel,
	siteThemeLabel,
} from './site-paths.mjs';
import { parseRouteDirectory } from './route-model.mjs';

export const supportedImageExtensions = new Set(['.jpg', '.jpeg', '.png']);

const h2Regex = /^##\s+.*$/gm;
const explicitHeadingIdRegex = /\s*\{#([a-z0-9-]+)\}\s*$/;
const inlineStyleReferenceRegex = /\[[^\]\n]+\]\{\.([a-z][a-z0-9-]*)\}/g;
const frontmatterDelimiterRegex = /^---\s*$/;
const knownContentTopLevelFrontmatterKeys = new Set(['title', 'description', 'navigation', 'presentation', 'frame', 'sections']);
const knownThemeTopLevelFrontmatterKeys = new Set(['navigation', 'layout', 'gallery', 'typography', 'presentation', 'frame']);
const knownNestedFrontmatterKeys = new Set([
	'align',
	'alt',
	'backgroundColor',
	'body',
	'bodyToImages',
	'brand',
	'caption',
	'carousel',
	'color',
	'colors',
	'density',
	'desktop',
	'fontFamily',
	'from',
	'finalSectionBottom',
	'gallery',
	'gutter',
	'h1',
	'h2',
	'h3',
	'h4',
	'heading',
	'headings',
	'id',
	'include',
	'image',
	'imageGap',
	'inlineStyles',
	'label',
	'lineHeight',
	'maxAvailableHeightPercent',
	'maxAvailableWidthPercent',
	'mobile',
	'navigation',
	'overrides',
	'paragraphSpacing',
	'pageWidth',
	'preset',
	'presentation',
	'rhythm',
	'sections',
	'sectionGap',
	'size',
	'spacingAfter',
	'spacingBefore',
	'textColor',
	'theme',
	'typography',
	'until',
	'visible',
	'width',
]);

export const toPosixPath = (filePath) => filePath.split(path.sep).join('/');

const fileExists = async (filePath) => access(filePath).then(() => true, () => false);

export const getContentFiles = async () => {
	const contentFiles = [{
		contentLabel: siteContentLabel,
		contentPath: siteContentPath,
		imagesDir: siteImagesDir,
		imagesLabel: siteImagesLabel,
		isHome: true,
		routeDirectory: null,
		routeId: null,
		routeOrder: 0,
	}];
	const routeEntries = await readdir(siteRoutesDir, { withFileTypes: true }).catch((error) => {
		if (error?.code === 'ENOENT') {
			return [];
		}

		throw error;
	});

	for (const entry of routeEntries) {
		if (!entry.isDirectory()) continue;

		const routeDirectory = entry.name;
		const routeDir = path.join(siteRoutesDir, routeDirectory);
		const routeContentPath = path.join(routeDir, 'route-content.md');

		if (!(await fileExists(routeContentPath))) continue;

		const { routeId, routeOrder } = parseRouteDirectory(routeDirectory, `${siteRoutesLabel}/${routeDirectory}`);

		contentFiles.push({
			contentLabel: `${siteRoutesLabel}/${routeDirectory}/route-content.md`,
			contentPath: routeContentPath,
			imagesDir: path.join(routeDir, 'images'),
			imagesLabel: `${siteRoutesLabel}/${routeDirectory}/images`,
			isHome: false,
			routeDirectory,
			routeId,
			routeOrder,
		});
	}

	return contentFiles;
};

export const splitSiteFile = (source, label = siteContentLabel) => {
	const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);

	if (!match) {
		throw new Error(`${label} is missing frontmatter delimited by ---.`);
	}

	return {
		frontmatter: match[0],
		frontmatterBody: match[1],
		body: source.slice(match[0].length),
	};
};

export const readSiteFile = async (sitePath, label = siteContentLabel) => splitSiteFile(await readFile(sitePath, 'utf8'), label);

const getIndentInfo = (line) => {
	const characters = Array.from(line);
	const indentCharacters = [];

	for (const character of characters) {
		if (character === ' ' || character === '\t' || character === '\u00a0' || character === '\uFFFD' || character === '\u00c2') {
			indentCharacters.push(character);
			continue;
		}

		break;
	}

	return {
		indent: indentCharacters.length,
		hasInvalidWhitespace: indentCharacters.some((character) => character !== ' '),
	};
};

const getNextFrontmatterEntry = (lines, startIndex) => {
	for (let index = startIndex + 1; index < lines.length; index += 1) {
		const line = lines[index];
		if (!line.trim() || line.trim().startsWith('#') || frontmatterDelimiterRegex.test(line)) {
			continue;
		}

		return {
			index,
			line,
			...getIndentInfo(line),
		};
	}

	return null;
};

export const validateFrontmatterIndentation = (frontmatter, addIssue) => {
	const lines = frontmatter.split(/\r?\n/);

	for (const [index, line] of lines.entries()) {
		const lineNumber = index + 1;
		const trimmed = line.trim();

		if (!trimmed || trimmed.startsWith('#') || frontmatterDelimiterRegex.test(line)) {
			continue;
		}

		const { indent, hasInvalidWhitespace } = getIndentInfo(line);

		if (hasInvalidWhitespace) {
			addIssue({
				severity: 'error',
				message: `Frontmatter line ${lineNumber} uses tabs, non-breaking spaces, or invalid whitespace for indentation.`,
				fix: 'Replace the indentation on that line with ordinary spaces.',
			});
			continue;
		}

		if (indent % 2 !== 0) {
			addIssue({
				severity: 'error',
				message: `Frontmatter line ${lineNumber} is indented with ${indent} spaces.`,
				fix: 'Use 2-space indentation levels in frontmatter.',
			});
		}

		const keyValueMatch = line.match(/^(\s*)[A-Za-z][A-Za-z0-9-]*:\s+(.+)$/);
		if (!keyValueMatch) continue;

		const value = keyValueMatch[2].trim();
		if (value === '|' || value === '>' || value.startsWith('|') || value.startsWith('>')) {
			continue;
		}

		const nextEntry = getNextFrontmatterEntry(lines, index);
		if (!nextEntry || nextEntry.indent <= indent) continue;

		addIssue({
			severity: 'error',
			message: `Frontmatter line ${nextEntry.index + 1} is indented under line ${lineNumber}, but line ${lineNumber} already has a value.`,
			fix: 'Move the later line to the same indentation level as its sibling, or place it under a key that has no value.',
		});
	}
};

export const validateFrontmatterStructure = (frontmatter, addIssue, {
	knownTopLevelFrontmatterKeys = knownContentTopLevelFrontmatterKeys,
	fileKind = 'content',
} = {}) => {
	const lines = frontmatter.split(/\r?\n/);

	for (const [index, line] of lines.entries()) {
		const lineNumber = index + 1;
		const trimmed = line.trim();

		if (!trimmed || trimmed.startsWith('#') || frontmatterDelimiterRegex.test(line)) {
			continue;
		}

		const { indent, hasInvalidWhitespace } = getIndentInfo(line);
		if (hasInvalidWhitespace || indent !== 0) continue;

		const keyMatch = line.match(/^([A-Za-z][A-Za-z0-9-]*):/);
		if (!keyMatch) continue;

		const key = keyMatch[1];
		if (knownTopLevelFrontmatterKeys.has(key)) continue;

		const fix = knownNestedFrontmatterKeys.has(key)
			? `Indent "${key}:" under the object it belongs to, or move image content into Norna Markdown blocks.`
			: `Move "${key}:" under the correct parent key, or remove it if it is not part of the ${fileKind} schema.`;

		addIssue({
			severity: 'error',
			message: `Frontmatter line ${lineNumber} defines "${key}" at the top level, but it is not a valid top-level ${fileKind} field.`,
			fix,
		});
	}
};

export const validateContentFrontmatterStructure = (frontmatter, addIssue) =>
	validateFrontmatterStructure(frontmatter, addIssue, {
		knownTopLevelFrontmatterKeys: knownContentTopLevelFrontmatterKeys,
		fileKind: 'content',
	});

export const validateThemeFrontmatterStructure = (frontmatter, addIssue) =>
	validateFrontmatterStructure(frontmatter, addIssue, {
		knownTopLevelFrontmatterKeys: knownThemeTopLevelFrontmatterKeys,
		fileKind: 'theme',
	});

export const readThemeFile = async (sitePath) => readSiteFile(sitePath, siteThemeLabel);

export const getFrontmatterSections = (frontmatter) => {
	const sections = [];
	const lines = frontmatter.split(/\r?\n/);
	let inSections = false;

	for (const [index, line] of lines.entries()) {
		if (/^sections:\s*$/.test(line)) {
			inSections = true;
			continue;
		}

		if (!inSections) continue;
		if (/^[a-zA-Z0-9_-]+:/.test(line)) break;

		const sectionMatch = line.match(/^\s{2}([a-z0-9-]+):(?:\s+.*)?\s*$/);
		if (sectionMatch) {
			sections.push({ id: sectionMatch[1], line: index + 1 });
		}
	}

	return sections;
};

export const getFrontmatterInlineStyleNames = (frontmatter) => {
	const names = new Set();
	const lines = frontmatter.split(/\r?\n/);
	let inlineStylesIndent = null;

	for (const line of lines) {
		const inlineStylesMatch = line.match(/^(\s*)inlineStyles:\s*$/);

		if (inlineStylesMatch) {
			inlineStylesIndent = inlineStylesMatch[1].length;
			continue;
		}

		if (inlineStylesIndent === null) continue;
		if (!line.trim() || line.trim().startsWith('#')) continue;

		const indent = line.match(/^\s*/)?.[0].length ?? 0;
		if (indent <= inlineStylesIndent) {
			inlineStylesIndent = null;
			continue;
		}

		const nameMatch = line.match(new RegExp(`^\\s{${inlineStylesIndent + 2}}([a-z][a-z0-9-]*):\\s*$`));
		if (nameMatch) {
			names.add(nameMatch[1]);
		}
	}

	return names;
};

export const getInlineStyleReferences = (body) => Array.from(body.matchAll(inlineStyleReferenceRegex))
	.map((match) => match[1]);

export const getHeadingId = (heading) => heading.match(explicitHeadingIdRegex)?.[1];

export const getBodySections = (body) => {
	const matches = Array.from(body.matchAll(h2Regex));
	const prelude = matches.length > 0 ? body.slice(0, matches[0].index) : body;
	const sections = [];

	for (let index = 0; index < matches.length; index += 1) {
		const match = matches[index];
		const start = match.index ?? 0;
		const next = matches[index + 1];
		const end = next?.index ?? body.length;
		const text = body.slice(start, end).trimEnd();
		const heading = match[0];
		const id = getHeadingId(heading);
		const line = body.slice(0, start).split(/\r?\n/).length;

		sections.push({ id, heading, line, text });
	}

	return { prelude, sections };
};

export const getImageFiles = async (directory) => {
	const entries = await readdir(directory, { withFileTypes: true }).catch((error) => {
		if (error?.code === 'ENOENT') {
			return [];
		}

		throw error;
	});
	const files = [];

	for (const entry of entries) {
		const entryPath = path.join(directory, entry.name);

		if (entry.isDirectory()) {
			files.push(...await getImageFiles(entryPath));
		} else if (entry.isFile() && supportedImageExtensions.has(path.extname(entry.name).toLowerCase())) {
			files.push(entryPath);
		}
	}

	return files;
};

export const getImageIndex = async (contentDir, fail, contentLabel = siteImagesLabel) => {
	const imageFiles = await getImageFiles(contentDir);
	const imagesByName = new Map();

	for (const imagePath of imageFiles) {
		const imageName = path.basename(imagePath);
		const existingPath = imagesByName.get(imageName);

		if (existingPath) {
			fail(`Duplicate image filename "${imageName}" found at ${contentLabel}/${toPosixPath(path.relative(contentDir, existingPath))} and ${contentLabel}/${toPosixPath(path.relative(contentDir, imagePath))}. The filename is ambiguous within this page image root.`);
			continue;
		}

		imagesByName.set(imageName, imagePath);
	}

	return imagesByName;
};

export const getImageCandidatesByName = async (contentDir) => {
	const imageFiles = await getImageFiles(contentDir);
	const imagesByName = new Map();

	for (const imagePath of imageFiles) {
		const imageName = path.basename(imagePath);

		if (!imagesByName.has(imageName)) {
			imagesByName.set(imageName, []);
		}

		imagesByName.get(imageName).push(imagePath);
	}

	for (const candidates of imagesByName.values()) {
		candidates.sort((left, right) => left.localeCompare(right, 'sv'));
	}

	return imagesByName;
};
