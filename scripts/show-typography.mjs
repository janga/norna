import { readFile } from 'node:fs/promises';
import {
	defaultTypography,
	resolveTypographyOverride,
	resolveTypographyConfig,
	toYamlLines,
	typographyPresets,
} from './lib/typography.mjs';
import {
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

const typographyRoles = ['heading', 'body', 'caption'];
const typographyFields = {
	heading: ['align', 'size', 'lineHeight', 'spacing'],
	body: ['align', 'size', 'lineHeight', 'paragraphSpacing'],
	caption: ['align', 'size', 'lineHeight', 'spacing'],
};
const responsiveFields = new Set(['align']);

const countIndent = (line) => line.match(/^\s*/)?.[0].length ?? 0;

const parseScalar = (rawValue) => {
	const value = rawValue.trim();

	if (/^-?\d+(?:\.\d+)?$/.test(value)) return Number(value);
	if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
		return value.slice(1, -1);
	}

	return value;
};

const parseMapping = (lines, startIndex, baseIndent) => {
	const value = {};
	let index = startIndex;

	while (index < lines.length) {
		const line = lines[index];
		if (!line.trim() || line.trim().startsWith('#')) {
			index += 1;
			continue;
		}

		const indent = countIndent(line);
		if (indent <= baseIndent) break;
		if (line.trim().startsWith('- ')) break;

		const match = line.trim().match(/^([a-zA-Z][a-zA-Z0-9-]*):(?:\s+(.*))?$/);
		if (!match) break;

		const [, key, rawValue] = match;
		if (rawValue === undefined) {
			const parsed = parseMapping(lines, index + 1, indent);
			value[key] = parsed.value;
			index = parsed.nextIndex;
		} else {
			value[key] = parseScalar(rawValue);
			index += 1;
		}
	}

	return { value, nextIndex: index };
};

const findMap = (lines, label, parentStart = 0, parentEnd = lines.length, requiredIndent = null) => {
	for (let index = parentStart; index < parentEnd; index += 1) {
		const line = lines[index];
		const match = line.match(/^(\s*)([a-zA-Z][a-zA-Z0-9-]*):\s*$/);
		if (!match || match[2] !== label) continue;
		if (requiredIndent !== null && match[1].length !== requiredIndent) continue;

		return {
			index,
			indent: match[1].length,
			...parseMapping(lines, index + 1, match[1].length),
		};
	}

	return null;
};

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

	for (const role of typographyRoles) {
		for (const field of typographyFields[role]) {
			if (responsiveFields.has(field)) {
				for (const viewport of ['desktop', 'mobile']) {
					const path = [role, field, viewport];
					const source = getPath(sources, path);
					setPath(annotated, path, {
						value: getPath(resolved.values, path),
						source: source.source,
						...(source.inherited ? { inherited: true } : {}),
					});
				}
				continue;
			}

			const path = [role, field];
			const source = getPath(sources, path);
			setPath(annotated, path, {
				value: getPath(resolved.values, path),
				source: source.source,
				...(source.inherited ? { inherited: true } : {}),
			});
		}
	}

	return annotated;
};

const presetSources = (presetName) => {
	const sources = {};

	for (const role of typographyRoles) {
		for (const field of typographyFields[role]) {
			if (responsiveFields.has(field)) {
				for (const viewport of ['desktop', 'mobile']) {
					setPath(sources, [role, field, viewport], {
						source: `preset:${presetName}`,
						inherited: false,
					});
				}
				continue;
			}

			setPath(sources, [role, field], {
				source: `preset:${presetName}`,
				inherited: false,
			});
		}
	}

	return sources;
};

const applyOverrideSources = (sources, typographyConfig, sourceLabel) => {
	const overrides = typographyConfig?.overrides;
	if (!overrides) return sources;

	for (const role of typographyRoles) {
		for (const field of typographyFields[role]) {
			if (responsiveFields.has(field)) {
				for (const viewport of ['desktop', 'mobile']) {
					const path = [role, field, viewport];
					if (hasPath(overrides, path)) {
						setPath(sources, path, {
							source: `${sourceLabel} override`,
							inherited: false,
						});
					}
				}
				continue;
			}

			const path = [role, field];
			if (hasPath(overrides, path)) {
				setPath(sources, path, {
					source: `${sourceLabel} override`,
					inherited: false,
				});
			}
		}
	}

	return sources;
};

const inheritedSources = (sources) => {
	const inherited = structuredClone(sources);

	for (const role of typographyRoles) {
		for (const field of typographyFields[role]) {
			if (responsiveFields.has(field)) {
				for (const viewport of ['desktop', 'mobile']) {
					const path = [role, field, viewport];
					setPath(inherited, path, {
						...getPath(sources, path),
						inherited: true,
					});
				}
				continue;
			}

			const path = [role, field];
			setPath(inherited, path, {
				...getPath(sources, path),
				inherited: true,
			});
		}
	}

	return inherited;
};

const resolveAnnotatedTypographyConfig = (typographyConfig, sourceLabel) => {
	const resolved = resolveTypographyConfig(typographyConfig ?? defaultTypography);
	const sources = applyOverrideSources(
		presetSources(resolved.preset),
		typographyConfig,
		sourceLabel,
	);

	return {
		preset: {
			value: resolved.preset,
			source: typographyConfig?.preset ? sourceLabel : 'engine default',
			...(typographyConfig?.preset ? {} : { inherited: true }),
		},
		resolved,
		sources,
	};
};

const resolveAnnotatedTypographyOverride = (baseAnnotated, typographyConfig, sourceLabel) => {
	if (typographyConfig?.preset) {
		return resolveAnnotatedTypographyConfig(typographyConfig, sourceLabel);
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
		resolved: baseAnnotated.resolved,
		sources: inheritedSources(baseAnnotated.sources),
	};
};

const formatAnnotatedTypography = (annotated) => ({
	preset: annotated.preset,
	resolved: annotateResolvedValues(annotated.resolved, annotated.sources),
});

const getSectionBlocks = (lines) => {
	const sectionsMap = findMap(lines, 'sections');
	if (!sectionsMap) return [];

	const sections = [];
	let current = null;

	for (let index = sectionsMap.index + 1; index < lines.length; index += 1) {
		const line = lines[index];
		if (!line.trim()) continue;

		const indent = countIndent(line);
		if (indent <= sectionsMap.indent) break;

		const sectionMatch = line.match(/^\s{2}-\s+id:\s*([a-z0-9-]+)\s*$/);
		if (sectionMatch) {
			if (current) current.end = index;
			current = { id: sectionMatch[1], start: index, end: lines.length };
			sections.push(current);
		}
	}

	const finalSection = sections.at(-1);
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
	const themePresentation = findMap(themeLines, 'presentation', 0, themeLines.length, 0);
	const themeTypographyConfig = themePresentation
		? findMap(themeLines, 'typography', themePresentation.index + 1, themePresentation.nextIndex)?.value
		: null;
	return resolveAnnotatedTypographyConfig(themeTypographyConfig ?? defaultTypography, siteThemeLabel);
};

const readPageTypography = async (contentFile, themeTypography) => {
	const { frontmatter, frontmatterBody } = await readSiteFile(contentFile.contentPath, contentFile.contentLabel);
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
	const sections = getSectionBlocks(lines).map((section) => {
		const presentation = findMap(lines, 'presentation', section.start + 1, section.end);
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
		route: contentFile.isHome ? '/' : `/${contentFile.routeFolder}/`,
		pageTypography,
		sections,
	};
};

if (mode === 'presets') {
	console.log(toYamlLines(typographyPresets).join('\n'));
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
	throw new Error('Usage: norna typography:presets|typography:show');
}
