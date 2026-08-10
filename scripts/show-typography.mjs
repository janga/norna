import { readFile } from 'node:fs/promises';
import { findMap } from './lib/frontmatter-yaml.mjs';
import {
	defaultTypography,
	resolveTypographyOverride,
	resolveTypographyConfig,
	toYamlLines,
	typographyPresets,
	typographyRhythms,
} from './lib/typography.mjs';
import {
	getBodySections,
	getContentFiles,
	readSiteFile,
	splitSiteFile,
	validateContentFrontmatterStructure,
	validateFrontmatterIndentation,
	validateThemeFrontmatterStructure,
} from './lib/site-content.mjs';
import {
	siteContentLabel,
	siteContentPath,
	siteThemeLabel,
	siteThemePath,
} from './lib/site-paths.mjs';

const mode = process.argv[2] ?? 'show';

const typographyValuePaths = [
	['headings', 'h1', 'align', 'desktop'],
	['headings', 'h1', 'align', 'mobile'],
	['headings', 'h1', 'size'],
	['headings', 'h1', 'lineHeight'],
	['headings', 'h1', 'spacingBefore'],
	['headings', 'h1', 'spacingAfter'],
	['headings', 'h2', 'align', 'desktop'],
	['headings', 'h2', 'align', 'mobile'],
	['headings', 'h2', 'size'],
	['headings', 'h2', 'lineHeight'],
	['headings', 'h2', 'spacingBefore'],
	['headings', 'h2', 'spacingAfter'],
	['headings', 'h3', 'align', 'desktop'],
	['headings', 'h3', 'align', 'mobile'],
	['headings', 'h3', 'size'],
	['headings', 'h3', 'lineHeight'],
	['headings', 'h3', 'spacingBefore'],
	['headings', 'h3', 'spacingAfter'],
	['headings', 'h4', 'align', 'desktop'],
	['headings', 'h4', 'align', 'mobile'],
	['headings', 'h4', 'size'],
	['headings', 'h4', 'lineHeight'],
	['headings', 'h4', 'spacingBefore'],
	['headings', 'h4', 'spacingAfter'],
	['body', 'align', 'desktop'],
	['body', 'align', 'mobile'],
	['body', 'size'],
	['body', 'lineHeight'],
	['body', 'paragraphSpacing'],
	['caption', 'align', 'desktop'],
	['caption', 'align', 'mobile'],
	['caption', 'size'],
	['caption', 'lineHeight'],
	['caption', 'spacingBefore'],
];
const rhythmValuePaths = new Set([
	'headings.h1.spacingBefore',
	'headings.h1.spacingAfter',
	'headings.h2.spacingBefore',
	'headings.h2.spacingAfter',
	'headings.h3.spacingBefore',
	'headings.h3.spacingAfter',
	'headings.h4.spacingBefore',
	'headings.h4.spacingAfter',
	'body.paragraphSpacing',
	'caption.spacingBefore',
]);
const countIndent = (line) => line.match(/^\s*/)?.[0].length ?? 0;

const isPlainObject = (value) => (
	value !== null &&
	typeof value === 'object' &&
	!Array.isArray(value)
);

const hasPath = (value, path) => {
	let current = value;

	for (const segment of path) {
		if (!isPlainObject(current) || !(segment in current)) {
			return false;
		}

		current = current[segment];
	}

	return true;
};

const getPath = (value, path) => path.reduce((current, segment) => current?.[segment], value);

const setPath = (value, path, entry) => {
	let current = value;

	for (const segment of path.slice(0, -1)) {
		current[segment] ??= {};
		current = current[segment];
	}

	current[path.at(-1)] = entry;
};

const annotateResolvedValues = (resolved, sources) => {
	const annotated = {};

	for (const path of typographyValuePaths) {
		const source = getPath(sources, path);
		setPath(annotated, path, {
			value: getPath(resolved.values, path),
			source: source.source,
			...(source.inherited ? { inherited: true } : {}),
		});
	}

	return annotated;
};

const defaultSources = (presetName, rhythmName) => {
	const sources = {};

	for (const path of typographyValuePaths) {
		const pathKey = path.join('.');
		setPath(sources, path, {
			source: rhythmValuePaths.has(pathKey)
				? `rhythm:${rhythmName}`
				: `preset:${presetName}`,
			inherited: false,
		});
	}

	return sources;
};

const applyOverrideSources = (sources, typographyConfig, sourceLabel) => {
	const overrides = typographyConfig?.overrides;
	if (!overrides) return sources;

	for (const path of typographyValuePaths) {
		if (hasPath(overrides, path)) {
			setPath(sources, path, {
				source: `${sourceLabel} override`,
				inherited: false,
			});
		}
	}

	return sources;
};

const inheritedSources = (sources) => {
	const inherited = structuredClone(sources);

	for (const path of typographyValuePaths) {
		setPath(inherited, path, {
			...getPath(sources, path),
			inherited: true,
		});
	}

	return inherited;
};

const resolveAnnotatedTypographyConfig = (typographyConfig, sourceLabel) => {
	const resolved = resolveTypographyConfig(typographyConfig ?? defaultTypography);
	const sources = applyOverrideSources(
		defaultSources(resolved.preset, resolved.rhythm),
		typographyConfig,
		sourceLabel,
	);

	return {
		preset: {
			value: resolved.preset,
			source: typographyConfig?.preset ? sourceLabel : 'engine default',
			...(typographyConfig?.preset ? {} : { inherited: true }),
		},
		rhythm: {
			value: resolved.rhythm,
			source: typographyConfig?.rhythm ? sourceLabel : 'engine default',
			...(typographyConfig?.rhythm ? {} : { inherited: true }),
		},
		resolved,
		sources,
	};
};

const resolveAnnotatedTypographyOverride = (baseAnnotated, typographyConfig, sourceLabel) => {
	if (typographyConfig?.preset || typographyConfig?.rhythm) {
		const resolvedConfig = {
			preset: typographyConfig.preset ?? baseAnnotated.resolved.preset,
			rhythm: typographyConfig.rhythm ?? baseAnnotated.resolved.rhythm,
			overrides: typographyConfig.overrides,
		};
		const resolved = resolveTypographyConfig(resolvedConfig);
		const sources = applyOverrideSources(
			defaultSources(resolved.preset, resolved.rhythm),
			typographyConfig,
			sourceLabel,
		);

		return {
			preset: {
				value: resolved.preset,
				source: typographyConfig.preset ? sourceLabel : baseAnnotated.preset.source,
				...(typographyConfig.preset ? {} : { inherited: true }),
			},
			rhythm: {
				value: resolved.rhythm,
				source: typographyConfig.rhythm ? sourceLabel : baseAnnotated.rhythm.source,
				...(typographyConfig.rhythm ? {} : { inherited: true }),
			},
			resolved,
			sources,
		};
	}

	if (typographyConfig?.overrides) {
		const resolved = resolveTypographyOverride(baseAnnotated.resolved, typographyConfig);
		const sources = applyOverrideSources(
			inheritedSources(baseAnnotated.sources),
			typographyConfig,
			sourceLabel,
		);

		return {
			preset: {
				value: resolved.preset,
				source: baseAnnotated.preset.source,
				inherited: true,
			},
			rhythm: {
				value: resolved.rhythm,
				source: baseAnnotated.rhythm.source,
				inherited: true,
			},
			resolved,
			sources,
		};
	}

	return {
		preset: {
			value: baseAnnotated.resolved.preset,
			source: baseAnnotated.preset.source,
			inherited: true,
		},
		rhythm: {
			value: baseAnnotated.resolved.rhythm,
			source: baseAnnotated.rhythm.source,
			inherited: true,
		},
		resolved: baseAnnotated.resolved,
		sources: inheritedSources(baseAnnotated.sources),
	};
};

const formatAnnotatedTypography = (annotated) => ({
	preset: annotated.preset,
	rhythm: annotated.rhythm,
	resolved: annotateResolvedValues(annotated.resolved, annotated.sources),
});

const getSectionMetadataBlocks = (lines) => {
	const sectionsMap = findMap(lines, 'sections');
	if (!sectionsMap) return new Map();

	const sections = new Map();
	let current = null;

	for (let index = sectionsMap.index + 1; index < lines.length; index += 1) {
		const line = lines[index];
		if (!line.trim()) continue;

		const indent = countIndent(line);
		if (indent <= sectionsMap.indent) break;

		const sectionMatch = line.match(/^\s{2}([a-z0-9-]+):(?:\s+.*)?\s*$/);
		if (sectionMatch) {
			if (current) current.end = index;
			current = { id: sectionMatch[1], start: index, end: lines.length };
			sections.set(current.id, current);
		}
	}

	const sectionList = Array.from(sections.values());
	const finalSection = sectionList.at(-1);
	if (finalSection) {
		const afterSections = lines.findIndex((line, index) => (
			index > finalSection.start &&
			line.trim() &&
			countIndent(line) <= sectionsMap.indent
		));
		finalSection.end = afterSections === -1 ? lines.length : afterSections;
	}

	return sections;
};

const readThemeTypography = async () => {
	const themeFile = await readFile(siteThemePath, 'utf8').catch((error) => {
		if (error?.code === 'ENOENT') {
			return '---\n---\n';
		}

		throw error;
	});
	const { frontmatter: themeFrontmatter, frontmatterBody: themeFrontmatterBody } = splitSiteFile(themeFile, siteThemeLabel);
	const indentationIssues = [];
	validateFrontmatterIndentation(themeFrontmatter, (issue) => indentationIssues.push(issue));
	validateThemeFrontmatterStructure(themeFrontmatter, (issue) => indentationIssues.push(issue));
	if (indentationIssues.length > 0) {
		throw new Error([
			`Cannot inspect typography because ${siteThemeLabel} has invalid frontmatter.`,
			...indentationIssues.map((issue) => `- ${issue.message}`),
		].join('\n'));
	}

	const themeLines = themeFrontmatterBody.split(/\r?\n/);
	const themeTypographyConfig = findMap(themeLines, 'typography', 0, themeLines.length, 0)?.value;
	return resolveAnnotatedTypographyConfig(themeTypographyConfig ?? defaultTypography, siteThemeLabel);
};

const readPageTypography = async (contentFile, themeTypography) => {
	const { frontmatter, frontmatterBody, body } = await readSiteFile(contentFile.contentPath, contentFile.contentLabel);
	const indentationIssues = [];
	validateFrontmatterIndentation(frontmatter, (issue) => indentationIssues.push(issue));
	validateContentFrontmatterStructure(frontmatter, (issue) => indentationIssues.push(issue));
	if (indentationIssues.length > 0) {
		throw new Error([
			`Cannot inspect typography because ${contentFile.contentLabel} has invalid frontmatter.`,
			...indentationIssues.map((issue) => `- ${issue.message}`),
		].join('\n'));
	}

	const lines = frontmatterBody.split(/\r?\n/);
	const pagePresentation = findMap(lines, 'presentation', 0, lines.length, 0);
	const pageTypographyConfig = pagePresentation
		? findMap(lines, 'typography', pagePresentation.index + 1, pagePresentation.nextIndex)?.value
		: null;
	const pageTypography = resolveAnnotatedTypographyOverride(themeTypography, pageTypographyConfig ?? undefined, contentFile.contentLabel);
	const sectionMetadataBlocks = getSectionMetadataBlocks(lines);
	const sections = getBodySections(body).sections
		.filter((section) => section.id)
		.map((section) => {
		const metadata = sectionMetadataBlocks.get(section.id);
		const presentation = metadata
			? findMap(lines, 'presentation', metadata.start + 1, metadata.end)
			: null;
		const typography = presentation
			? findMap(lines, 'typography', presentation.index + 1, presentation.nextIndex)?.value
			: null;

		return {
			id: section.id,
			typography: resolveAnnotatedTypographyOverride(pageTypography, typography ?? undefined, `${contentFile.contentLabel} sections.${section.id}`),
		};
	});

	return {
		source: contentFile.contentLabel,
		route: contentFile.isHome ? '/' : `/${contentFile.routeId}/`,
		pageTypography,
		sections,
	};
};

if (mode === 'presets') {
	console.log(toYamlLines({
		presets: typographyPresets,
		rhythms: typographyRhythms,
	}).join('\n'));
} else if (mode === 'show') {
	const themeTypography = await readThemeTypography();
	const pages = await Promise.all((await getContentFiles()).map((contentFile) => readPageTypography(contentFile, themeTypography)));
	const output = {
		theme: {
			source: siteThemeLabel,
			presentation: {
				typography: formatAnnotatedTypography(themeTypography),
			},
		},
		pages: Object.fromEntries(pages.map((page) => [
			page.route,
			{
				source: page.source,
				typography: formatAnnotatedTypography(page.pageTypography),
				sections: Object.fromEntries(page.sections.map((section) => [
					section.id,
					{
						typography: formatAnnotatedTypography(section.typography),
					},
				])),
			},
		])),
	};

	console.log(toYamlLines(output).join('\n'));
} else {
	throw new Error('Usage: norna typography presets|show');
}
