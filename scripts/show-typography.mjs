import { readFile } from 'node:fs/promises';
import {
	defaultTypography,
	resolveTypographyOverride,
	resolveTypographyConfig,
	toYamlLines,
	typographyPresets,
} from './lib/typography.mjs';
import {
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

const readSiteTypography = async () => {
	const { frontmatter, frontmatterBody } = splitSiteFile(await readFile(siteContentPath, 'utf8'));
	const { frontmatter: themeFrontmatter, frontmatterBody: themeFrontmatterBody } = splitSiteFile(await readFile(siteThemePath, 'utf8'), siteThemeLabel);
	const indentationIssues = [];
	validateFrontmatterIndentation(frontmatter, (issue) => indentationIssues.push(issue));
	validateContentFrontmatterStructure(frontmatter, (issue) => indentationIssues.push(issue));
	validateFrontmatterIndentation(themeFrontmatter, (issue) => indentationIssues.push(issue));
	validateThemeFrontmatterStructure(themeFrontmatter, (issue) => indentationIssues.push(issue));
	if (indentationIssues.length > 0) {
		throw new Error([
			`Cannot inspect typography because ${siteContentLabel} or ${siteThemeLabel} has invalid frontmatter.`,
			...indentationIssues.map((issue) => `- ${issue.message}`),
		].join('\n'));
	}

	const lines = frontmatterBody.split(/\r?\n/);
	const themeLines = themeFrontmatterBody.split(/\r?\n/);
	const themePresentation = findMap(themeLines, 'presentation', 0, themeLines.length, 0);
	const themeTypographyConfig = themePresentation
		? findMap(themeLines, 'typography', themePresentation.index + 1, themePresentation.nextIndex)?.value
		: null;
	const pagePresentation = findMap(lines, 'presentation', 0, lines.length, 0);
	const pageTypographyConfig = pagePresentation
		? findMap(lines, 'typography', pagePresentation.index + 1, pagePresentation.nextIndex)?.value
		: null;
	const themeTypography = resolveTypographyConfig(themeTypographyConfig ?? defaultTypography);
	const pageTypography = resolveTypographyOverride(themeTypography, pageTypographyConfig ?? undefined);
	const sections = getSectionBlocks(lines).map((section) => {
		const presentation = findMap(lines, 'presentation', section.start + 1, section.end);
		const typography = presentation
			? findMap(lines, 'typography', presentation.index + 1, presentation.nextIndex)?.value
			: null;

		return {
			id: section.id,
			typography,
			resolved: resolveTypographyOverride(pageTypography, typography ?? undefined),
		};
	});

	return {
		themeTypography,
		pageTypography,
		sections,
	};
};

if (mode === 'presets') {
	console.log(toYamlLines(typographyPresets).join('\n'));
} else if (mode === 'show') {
	const siteTypography = await readSiteTypography();
	const output = {
		source: siteContentLabel,
		theme: {
			source: siteThemeLabel,
			presentation: {
				typography: {
					preset: siteTypography.themeTypography.preset,
					resolved: siteTypography.themeTypography.values,
				},
			},
		},
		page: {
			typography: {
				preset: siteTypography.pageTypography.preset,
				resolved: siteTypography.pageTypography.values,
			},
		},
		sections: Object.fromEntries(siteTypography.sections.map((section) => [
			section.id,
			{
				typography: {
					preset: section.resolved.preset,
					resolved: section.resolved.values,
				},
			},
		])),
	};

	console.log(toYamlLines(output).join('\n'));
} else {
	throw new Error('Usage: cli-gallery typography:presets|typography:show');
}
