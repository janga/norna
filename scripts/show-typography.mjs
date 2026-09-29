import {
	toYamlLines,
	typographyProfiles,
	typographyRhythms,
} from './lib/typography.mjs';
import {
	getContentFiles,
	readSiteFile,
	validateContentFrontmatterStructure,
	validateFrontmatterIndentation,
} from './lib/site-content.mjs';
import { parsePageMarkdown } from './lib/page-markdown.mjs';
import {
	siteDir,
	siteThemeLabel,
} from './lib/site-paths.mjs';
import { readThemeConfig } from './lib/theme-config.mjs';
import { resolveThemeConfig } from './lib/theme-presets.mjs';
import { selectPageTheme } from './lib/theme-packages.mjs';
import { resolveThemePresentation } from './lib/presentation.mjs';

const mode = process.argv[2] ?? 'show';

const typographyValuePaths = [
	['headings', 'h1', 'align', 'desktop'],
	['headings', 'h1', 'align', 'mobile'],
	['headings', 'h1', 'size'],
	['headings', 'h1', 'weight'],
	['headings', 'h1', 'lineHeight'],
	['headings', 'h1', 'spacingBefore'],
	['headings', 'h1', 'spacingAfter'],
	['headings', 'h2', 'align', 'desktop'],
	['headings', 'h2', 'align', 'mobile'],
	['headings', 'h2', 'size'],
	['headings', 'h2', 'weight'],
	['headings', 'h2', 'lineHeight'],
	['headings', 'h2', 'spacingBefore'],
	['headings', 'h2', 'spacingAfter'],
	['headings', 'h3', 'align', 'desktop'],
	['headings', 'h3', 'align', 'mobile'],
	['headings', 'h3', 'size'],
	['headings', 'h3', 'weight'],
	['headings', 'h3', 'lineHeight'],
	['headings', 'h3', 'spacingBefore'],
	['headings', 'h3', 'spacingAfter'],
	['headings', 'h4', 'align', 'desktop'],
	['headings', 'h4', 'align', 'mobile'],
	['headings', 'h4', 'size'],
	['headings', 'h4', 'weight'],
	['headings', 'h4', 'lineHeight'],
	['headings', 'h4', 'spacingBefore'],
	['headings', 'h4', 'spacingAfter'],
	['body', 'align', 'desktop'],
	['body', 'align', 'mobile'],
	['body', 'size'],
	['body', 'width'],
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

const defaultSources = (profileName, rhythmName) => {
	const sources = {};

	for (const path of typographyValuePaths) {
		const pathKey = path.join('.');
		setPath(sources, path, {
			source: rhythmValuePaths.has(pathKey)
				? `rhythm:${rhythmName}`
				: `profile:${profileName}`,
			inherited: false,
		});
	}

	return sources;
};

const applyOverrideSources = (sources, typographyConfig, sourceFor) => {
	const overrides = typographyConfig?.overrides;
	if (!overrides) return sources;

	for (const path of typographyValuePaths) {
		if (hasPath(overrides, path)) {
			setPath(sources, path, {
				source: `${sourceFor(['typography', 'overrides', ...path])} override`,
				inherited: false,
			});
		}
	}

	return sources;
};

const resolveAnnotatedTypographyConfig = (theme, sourceLabel, sourceFiles) => {
	const normalized = resolveThemeConfig(theme, sourceLabel);
	const typographyConfig = normalized.typography;
	const resolved = resolveThemePresentation(theme, sourceLabel).typography;
	// Attribute a value to its last authored setting, stopping at the preset
	// that replaced its base. The resolver still determines all effective values.
	const sourceFor = (propertyPath) => {
		for (const file of sourceFiles.toReversed()) {
			if (hasPath(file.config, propertyPath)) return file.label;
			if (file.config.preset !== undefined) return `preset:${file.config.preset} (${file.label})`;
		}
		return 'engine default';
	};
	const sources = applyOverrideSources(
		defaultSources(resolved.profile, resolved.rhythm),
		typographyConfig,
		sourceFor,
	);
	if (normalized.layout?.textWidth !== undefined) {
		setPath(sources, ['body', 'width'], { source: sourceFor(['layout', 'textWidth']), inherited: false });
	}

	return {
		profile: {
			value: resolved.profile,
			source: sourceFor(['typography', 'profile']),
		},
		rhythm: {
			value: resolved.rhythm,
			source: sourceFor(['typography', 'rhythm']),
		},
		fontFamily: { value: typographyConfig.fontFamily, source: sourceFor(['typography', 'fontFamily']) },
		resolved,
		sources,
	};
};

const formatAnnotatedTypography = (annotated) => ({
	profile: annotated.profile,
	rhythm: annotated.rhythm,
	fontFamily: annotated.fontFamily,
	resolved: annotateResolvedValues(annotated.resolved, annotated.sources),
});

const readThemeTypography = async () => {
	const config = await readThemeConfig();
	return resolveAnnotatedTypographyConfig(config, siteThemeLabel, [{ config, label: siteThemeLabel }]);
};

const readPageTypography = async (contentFile) => {
	const { frontmatter, body } = await readSiteFile(contentFile.contentPath, contentFile.contentLabel);
	const indentationIssues = [];
	validateFrontmatterIndentation(frontmatter, (issue) => indentationIssues.push(issue));
	validateContentFrontmatterStructure(frontmatter, (issue) => indentationIssues.push(issue));
	if (indentationIssues.length > 0) {
		throw new Error([
			`Cannot inspect typography because ${contentFile.contentLabel} has invalid frontmatter.`,
			...indentationIssues.map((issue) => `- ${issue.message}`),
		].join('\n'));
	}

	const { selected, sourceFiles } = await selectPageTheme({ siteRoot: siteDir, pageDirectory: contentFile.pageDirectory });
	const pageTypography = resolveAnnotatedTypographyConfig(selected.config, selected.label, sourceFiles);
	const sections = (await parsePageMarkdown(body, { label: contentFile.contentLabel })).sections
		.map((section) => {
		return {
			id: section.id,
			typography: pageTypography,
		};
	});

	return {
		source: contentFile.contentLabel,
		pathname: contentFile.isHome ? '/' : `/${contentFile.pagePath}/`,
		pageTypography,
		sections,
	};
};

if (mode === 'profiles') {
	console.log(toYamlLines({
		profiles: typographyProfiles,
		rhythms: typographyRhythms,
	}).join('\n'));
} else if (mode === 'show') {
	const themeTypography = await readThemeTypography();
	const pages = await Promise.all((await getContentFiles()).map(readPageTypography));
	const output = {
		theme: {
			source: siteThemeLabel,
			typography: formatAnnotatedTypography(themeTypography),
		},
		pages: Object.fromEntries(pages.map((page) => [
			page.pathname,
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
	throw new Error('Usage: norna typography profiles|show');
}
