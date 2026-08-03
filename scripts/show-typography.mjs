import { readFile } from 'node:fs/promises';
import {
	defaultTypography,
	resolveSectionTypography,
	resolveTypographyConfig,
	toYamlLines,
	typographyPresets,
} from './lib/typography.mjs';
import {
	splitSiteFile,
	validateFrontmatterIndentation,
} from './lib/site-content.mjs';
import {
	siteContentLabel,
	siteContentPath,
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

const findMap = (lines, label, parentStart = 0, parentEnd = lines.length) => {
	for (let index = parentStart; index < parentEnd; index += 1) {
		const line = lines[index];
		const match = line.match(/^(\s*)([a-zA-Z][a-zA-Z0-9-]*):\s*$/);
		if (!match || match[2] !== label) continue;

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
	const indentationIssues = [];
	validateFrontmatterIndentation(frontmatter, (issue) => indentationIssues.push(issue));
	if (indentationIssues.length > 0) {
		throw new Error([
			`Cannot inspect typography because ${siteContentLabel} has invalid frontmatter indentation.`,
			...indentationIssues.map((issue) => `- ${issue}`),
		].join('\n'));
	}

	const lines = frontmatterBody.split(/\r?\n/);
	const defaultPresentation = findMap(lines, 'defaultPresentation');
	const defaultTypographyConfig = defaultPresentation
		? findMap(lines, 'typography', defaultPresentation.index + 1, defaultPresentation.nextIndex)?.value
		: null;
	const sections = getSectionBlocks(lines).map((section) => {
		const presentation = findMap(lines, 'presentation', section.start + 1, section.end);
		const typography = presentation
			? findMap(lines, 'typography', presentation.index + 1, presentation.nextIndex)?.value
			: null;

		return {
			id: section.id,
			typography,
			resolved: resolveSectionTypography(defaultTypographyConfig ?? defaultTypography, typography ?? undefined),
		};
	});

	return {
		defaultTypography: resolveTypographyConfig(defaultTypographyConfig ?? defaultTypography),
		sections,
	};
};

if (mode === 'presets') {
	console.log(toYamlLines(typographyPresets).join('\n'));
} else if (mode === 'show') {
	const siteTypography = await readSiteTypography();
	const output = {
		source: siteContentLabel,
		defaultPresentation: {
			typography: {
				preset: siteTypography.defaultTypography.preset,
				resolved: siteTypography.defaultTypography.values,
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
