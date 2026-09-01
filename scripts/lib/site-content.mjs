import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import {
	schemaTopLevelKeys,
	siteSchema,
} from './schema-definitions.mjs';
import {
	siteContentLabel,
	sitewideContentLabel,
} from './site-paths.mjs';
import { getIndentInfo, validateYamlIndentation } from './yaml-indentation.mjs';
import { parseYamlConfig } from './yaml-config.mjs';

export { getContentFiles } from './site-structure.mjs';

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
	'aliases',
	'alt',
	'body',
	'blockGap',
	'caption',
	'colorMode',
	'carousel',
	'contentSpacing',
	'desktop',
	'default',
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
	'readerControls',
	'readingWidth',
	'rhythm',
	'sectionGap',
	'backgroundPattern',
	'sections',
	'corners',
	'focusReading',
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

export const readSiteFile = async (sitePath, label = siteContentLabel) => {
	const source = await readFile(sitePath, 'utf8');
	return { ...splitSiteFile(source, label), source };
};

export const validateFrontmatterIndentation = (frontmatter, addIssue) => {
	validateYamlIndentation(frontmatter, (issue) => addIssue({
		...issue,
		message: issue.message.replace(/^YAML/, 'Frontmatter'),
		fix: issue.fix.replace(/YAML/g, 'frontmatter'),
	}));
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
		} else if ((fileKind === 'theme' || fileKind === 'page theme') && key === 'shape') {
			message = fileKind === 'page theme'
				? `Frontmatter line ${lineNumber}: "shape" was replaced by the site-wide "corners" setting, which page themes cannot override.`
				: `Frontmatter line ${lineNumber}: "shape" was replaced by "corners". Use "square" or replace the old "soft" value with "rounded".`;
			fix = fileKind === 'page theme'
				? 'Remove "shape:" from this page theme. Set "corners: square" or "corners: rounded" in the root theme.yaml when an override is needed.'
				: 'Replace "shape:" with "corners:". Use "square" or replace the old "soft" value with "rounded".';
		} else if (fileKind === 'page theme' && ['preset', 'corners', 'palette', 'typography'].includes(key)) {
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

export const parseContentFrontmatter = (frontmatterBody, label = siteContentLabel) => parseYamlConfig(
	frontmatterBody,
	`${label} frontmatter`,
	{
		schema: siteSchema,
		validateStructure: validateContentFrontmatterStructure,
	},
);

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
