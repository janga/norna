import { access, readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import {
	siteContentLabel,
	siteDir,
	siteDirLabel,
	homePageDirectory,
	siteImagesLabel,
	sitePagesDir,
	sitePagesLabel,
	sitewideContentLabel,
} from './site-paths.mjs';
import { parsePageDirectoryPath } from './page-model.mjs';
import { getMarkdownHeadings } from './heading-ids.mjs';
import { schemaTopLevelKeys } from './schema-definitions.mjs';

export const rasterImageExtensions = new Set(['.jpg', '.jpeg', '.png']);
export const staticImageExtensions = new Set(['.svg']);
export const supportedImageExtensions = new Set([...rasterImageExtensions, ...staticImageExtensions]);

const deprecatedInlineStyleReferenceRegex = /\[[^\]\n]+\]\{\.([a-z][a-z0-9-]*)\}/g;
const frontmatterDelimiterRegex = /^---\s*$/;
const knownConfigTopLevelFrontmatterKeys = new Set(schemaTopLevelKeys.config);
const knownContentTopLevelFrontmatterKeys = new Set(schemaTopLevelKeys.content);
const knownThemeTopLevelFrontmatterKeys = new Set(schemaTopLevelKeys.theme);
const knownPageThemeTopLevelFrontmatterKeys = new Set(
	schemaTopLevelKeys.pageTheme,
);
const knownSitewideTopLevelFrontmatterKeys = new Set(schemaTopLevelKeys.sitewide);
const knownNestedFrontmatterKeys = new Set([
	'align',
	'alt',
	'body',
	'blockGap',
	'caption',
	'carousel',
	'contentSpacing',
	'desktop',
	'fontFamily',
	'from',
	'finalSectionBottom',
	'gutter',
	'headingToBlock',
	'h1',
	'h2',
	'h3',
	'h4',
	'heading',
	'headings',
	'id',
	'image',
	'imageGap',
	'images',
	'listed',
	'logo',
	'lineHeight',
	'maxAvailableHeightPercent',
	'maxAvailableWidthPercent',
	'mobile',
	'navigation',
	'overrides',
	'paragraphSpacing',
	'pageWidth',
	'palette',
	'preset',
	'profile',
	'rhythm',
	'sectionGap',
	'backgroundPattern',
	'sections',
	'shape',
	'size',
	'spacingAfter',
	'spacingBefore',
	'theme',
	'textWidth',
	'typography',
	'until',
	'visible',
	'width',
]);

export const toPosixPath = (filePath) => filePath.split(path.sep).join('/');

const fileExists = async (filePath) => access(filePath).then(() => true, () => false);

export const getContentFiles = async () => {
	const legacyContentPath = path.join(siteDir, 'content.md');
	const legacyImagesPath = path.join(siteDir, 'images');
	const legacyPaths = [];
	if (await fileExists(legacyContentPath)) legacyPaths.push(`${siteDirLabel}/content.md`);
	if (await fileExists(legacyImagesPath)) legacyPaths.push(`${siteDirLabel}/images`);
	if (legacyPaths.length > 0) {
		throw new Error([
			`The old root-page structure is no longer supported: ${legacyPaths.join(', ')}.`,
			`Move the homepage content to ${sitePagesLabel}/${homePageDirectory}/content.md and its images to ${sitePagesLabel}/${homePageDirectory}/images/.`,
		].join('\n'));
	}

	const legacyRoutesDir = path.join(siteDir, 'routes');
	const legacyRoutes = await readdir(legacyRoutesDir).catch((error) => {
		if (error?.code === 'ENOENT') return null;
		throw error;
	});
	if (legacyRoutes !== null) {
		throw new Error(`${siteDirLabel}/routes is no longer supported. Rename it to ${sitePagesLabel} and use NNN-page-id directory names.`);
	}

	const contentFiles = [];
	const collectPageContentFiles = async (pagesDir, pagesLabel, parentPageDirectory = '') => {
		const pageEntries = await readdir(pagesDir, { withFileTypes: true }).catch((error) => {
		if (error?.code === 'ENOENT') {
			return [];
		}

		throw error;
		});

		for (const entry of pageEntries.sort((left, right) => left.name.localeCompare(right.name, 'en'))) {
			if (!entry.isDirectory()) continue;

			const pageDirectory = parentPageDirectory
				? `${parentPageDirectory}/pages/${entry.name}`
				: entry.name;
			const pageLabel = `${pagesLabel}/${entry.name}`;
			const pageDir = path.join(pagesDir, entry.name);
			const pageContentPath = path.join(pageDir, 'content.md');

			if (!(await fileExists(pageContentPath))) {
				const childPageEntries = await readdir(path.join(pageDir, 'pages'), { withFileTypes: true }).catch((error) => {
					if (error?.code === 'ENOENT') return [];
					throw error;
				});
				if (childPageEntries.some((childEntry) => childEntry.isDirectory())) {
					throw new Error(`${pageLabel} contains nested pages but has no content.md of its own.`);
				}
				continue;
			}
			const pageMetadata = parsePageDirectoryPath(pageDirectory, pageLabel);
			const isHome = pageDirectory === homePageDirectory;

			contentFiles.push({
				contentLabel: `${pageLabel}/content.md`,
				contentPath: pageContentPath,
				imagesDir: path.join(pageDir, 'images'),
				imagesLabel: `${pageLabel}/images`,
				isHome,
				...pageMetadata,
				pagePath: isHome ? '' : pageMetadata.pagePath,
				parentPagePath: isHome ? null : pageMetadata.parentPagePath,
			});

			if (isHome) {
				const homePagesDir = path.join(pageDir, 'pages');
				const homeChildEntries = await readdir(homePagesDir, { withFileTypes: true }).catch((error) => {
					if (error?.code === 'ENOENT') return [];
					throw error;
				});
				const homeChildDirectories = homeChildEntries.filter((childEntry) => childEntry.isDirectory());
				if (homeChildDirectories.length > 0) {
					throw new Error([
						`${pageLabel} is the homepage and cannot contain child pages.`,
						`Move these page directories beside ${homePageDirectory} under ${sitePagesLabel}/, or below another non-home page:`,
						...homeChildDirectories.map(({ name }) => `- ${pageLabel}/pages/${name}`),
					].join('\n'));
				}
				continue;
			}

			await collectPageContentFiles(
				path.join(pageDir, 'pages'),
				`${pageLabel}/pages`,
				pageDirectory,
			);
		}
	};

	await collectPageContentFiles(sitePagesDir, sitePagesLabel);
	if (!contentFiles.some(({ isHome }) => isHome)) {
		throw new Error(`Homepage content is missing. Create ${siteContentLabel}.`);
	}

	return contentFiles;
};

export const splitSiteFile = (source, label = siteContentLabel) => {
	const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);

	if (!match) {
		if (/^---(?:\r?\n|$)/.test(source)) {
			throw new Error(`${label} starts YAML frontmatter with ---, but no closing --- delimiter was found.`);
		}

		return {
			frontmatter: '',
			frontmatterBody: '',
			body: source,
		};
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

		let fix;
		let message = `Frontmatter line ${lineNumber} defines "${key}" at the top level, but it is not a valid top-level ${fileKind} field.`;
		if (fileKind === 'content' && key === 'title') {
			fix = 'Remove "title:" and write the page title as the single Markdown H1 after frontmatter, for example "# About".';
		} else if (fileKind === 'content' && key === 'description') {
			fix = 'Indent "description:" under "page:". The optional meta description belongs in the page object.';
		} else if (fileKind === 'content' && key === 'images') {
			fix = 'Put local image references in norna-image-stack or norna-image-carousel blocks in the Markdown body.';
		} else if (fileKind === 'content' && knownThemeTopLevelFrontmatterKeys.has(key)) {
			fix = `Move "${key}:" to theme.yaml. Visual settings do not belong in content frontmatter.`;
		} else if ((fileKind === 'theme' || fileKind === 'page theme') && key === 'navigation') {
			message = `Frontmatter line ${lineNumber}: navigation is technical, site-wide configuration and does not belong in ${fileKind}. Set it in config.yaml.`;
			fix = 'Set the navigation mode under "navigation:" in config.yaml.';
		} else if (fileKind === 'page theme' && ['preset', 'shape', 'palette', 'typography'].includes(key)) {
			message = `Frontmatter line ${lineNumber}: page themes may not define site-wide visual identity through "${key}".`;
			fix = `Move "${key}:" to the root theme.yaml. Page themes may set only layout.textWidth, layout.contentSpacing, images, and sections.backgroundPattern.`;
		} else if ((fileKind === 'theme' || fileKind === 'page theme') && ['logo', 'site'].includes(key)) {
			message = `Frontmatter line ${lineNumber}: ${fileKind} may not define navigation logo settings. Optional logo display settings belong under "logo:" in ${sitewideContentLabel}.`;
			fix = `Move only the logo display settings under "logo:" in ${sitewideContentLabel}; the homepage Markdown H1 supplies navigation text and logo alternative text.`;
		} else if (fileKind === 'sitewide content' && (key === 'navigation' || key === 'site')) {
			message = `Frontmatter line ${lineNumber}: "${key}:" no longer defines site identity.`;
			fix = 'Use the homepage Markdown H1 for navigation text and logo alternative text. Move only an optional logo height to top-level "logo:".';
		} else if (knownNestedFrontmatterKeys.has(key)) {
			fix = `Indent "${key}:" under the object it belongs to.`;
		} else {
			fix = `Move "${key}:" under the correct parent key, or remove it if it is not part of the ${fileKind} schema.`;
		}

		addIssue({
			severity: 'error',
			message,
			fix,
		});
	}
};

export const validateContentFrontmatterStructure = (frontmatter, addIssue) =>
	validateFrontmatterStructure(frontmatter, addIssue, {
		knownTopLevelFrontmatterKeys: knownContentTopLevelFrontmatterKeys,
		fileKind: 'content',
	});

export const validateConfigYamlStructure = (frontmatter, addIssue) =>
	validateFrontmatterStructure(frontmatter, addIssue, {
		knownTopLevelFrontmatterKeys: knownConfigTopLevelFrontmatterKeys,
		fileKind: 'config',
	});

export const validateThemeYamlStructure = (frontmatter, addIssue) =>
	validateFrontmatterStructure(frontmatter, addIssue, {
		knownTopLevelFrontmatterKeys: knownThemeTopLevelFrontmatterKeys,
		fileKind: 'theme',
	});

export const validatePageThemeYamlStructure = (frontmatter, addIssue) =>
	validateFrontmatterStructure(frontmatter, addIssue, {
		knownTopLevelFrontmatterKeys: knownPageThemeTopLevelFrontmatterKeys,
		fileKind: 'page theme',
	});

export const validateSitewideYamlStructure = (frontmatter, addIssue) =>
	validateFrontmatterStructure(frontmatter, addIssue, {
		knownTopLevelFrontmatterKeys: knownSitewideTopLevelFrontmatterKeys,
		fileKind: 'sitewide content',
	});

export const readThemeFile = async (sitePath) => {
	const source = await readFile(sitePath, 'utf8');
	return { frontmatter: source, frontmatterBody: source, body: '' };
};

export const getDeprecatedInlineStyleReferences = (body) => Array.from(body.matchAll(deprecatedInlineStyleReferenceRegex))
	.map((match) => match[1]);

export const getBodySections = async (body) => {
	const { headings, source } = await getMarkdownHeadings(body);
	const structuralHeadings = headings.filter((heading) => heading.depth <= 2);
	const prelude = structuralHeadings.length > 0 ? source.slice(0, structuralHeadings[0].index) : source;
	const sections = structuralHeadings.map((heading, index) => {
		const next = structuralHeadings[index + 1];
		const end = next?.index ?? source.length;

		return {
			...heading,
			heading: heading.source,
			isPageTitle: heading.depth === 1,
			level: heading.depth,
			text: source.slice(heading.index, end).trimEnd(),
		};
	});

	return {
		headings,
		pageHeadings: sections.filter((section) => section.isPageTitle),
		prelude,
		sections,
	};
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
