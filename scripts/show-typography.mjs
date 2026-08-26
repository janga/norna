import {
	defaultTypography,
	resolveTypographyConfig,
	toYamlLines,
	typographyProfiles,
	typographyRhythms,
} from './lib/typography.mjs';
import {
	getBodySections,
	getContentFiles,
	readSiteFile,
	validateContentFrontmatterStructure,
	validateFrontmatterIndentation,
} from './lib/site-content.mjs';
import {
	siteThemeLabel,
} from './lib/site-paths.mjs';
import { readThemeConfig } from './lib/theme-config.mjs';
import { resolveThemeConfig } from './lib/theme-presets.mjs';

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

const resolveAnnotatedTypographyConfig = (typographyConfig, sourceLabel) => {
	const resolved = resolveTypographyConfig(typographyConfig ?? defaultTypography);
	const sources = applyOverrideSources(
		defaultSources(resolved.profile, resolved.rhythm),
		typographyConfig,
		sourceLabel,
	);

	return {
		profile: {
			value: resolved.profile,
			source: typographyConfig?.profile ? sourceLabel : 'engine default',
			...(typographyConfig?.profile ? {} : { inherited: true }),
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

const formatAnnotatedTypography = (annotated) => ({
	profile: annotated.profile,
	rhythm: annotated.rhythm,
	resolved: annotateResolvedValues(annotated.resolved, annotated.sources),
});

const readThemeTypography = async () => {
	const themeConfig = resolveThemeConfig(await readThemeConfig(), siteThemeLabel);
	const themeTypographyConfig = themeConfig.typography;
	return resolveAnnotatedTypographyConfig(themeTypographyConfig ?? defaultTypography, siteThemeLabel);
};

const readPageTypography = async (contentFile, siteThemeTypography) => {
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

	const pageTypography = siteThemeTypography;
	const sections = (await getBodySections(body)).sections
		.filter((section) => section.id)
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
	const pages = await Promise.all((await getContentFiles()).map((contentFile) => readPageTypography(contentFile, themeTypography)));
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
