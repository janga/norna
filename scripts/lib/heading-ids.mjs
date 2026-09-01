import { markdownToMdast } from 'satteri';

export const explicitHeadingIdPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const reservedHeadingIds = new Set(['page-title']);

const explicitHeadingIdSuffixPattern = /\s*\{#([^{}]*)\}\s*$/;
const transliterations = new Map([
	['æ', 'ae'],
	['đ', 'd'],
	['ð', 'd'],
	['ħ', 'h'],
	['ı', 'i'],
	['ł', 'l'],
	['ø', 'o'],
	['œ', 'oe'],
	['ß', 'ss'],
	['þ', 'th'],
]);

const transliterateToAscii = (value) => Array.from(value)
	.map((character) => transliterations.get(character) ?? character)
	.join('');

export const slugifyAsciiIdentifier = (value) => transliterateToAscii(value
	.normalize('NFKD')
	.toLowerCase())
	.replace(/\p{Mark}+/gu, '')
	.replace(/['’]/g, '')
	.replace(/[^a-z0-9]+/g, '-')
	.replace(/^-+|-+$/g, '');

export const slugifyHeadingText = slugifyAsciiIdentifier;

const getNodeText = (node) => {
	if (!node || typeof node !== 'object') return '';
	if (node.type === 'text' || node.type === 'inlineCode') return node.value ?? '';
	if (node.type === 'image') return node.alt ?? '';
	if (!Array.isArray(node.children)) return '';
	return node.children.map(getNodeText).join('');
};

export const resolveHeadingIdentifier = (headingText, depth) => {
	const explicitMatch = headingText.match(explicitHeadingIdSuffixPattern);
	const explicitSource = explicitMatch?.[1];
	const title = explicitMatch
		? headingText.slice(0, explicitMatch.index).trim()
		: headingText.trim();
	const explicitId = explicitSource && explicitHeadingIdPattern.test(explicitSource)
		? explicitSource
		: null;

	return {
		depth,
		explicitId,
		explicitSource: explicitSource ?? null,
		id: depth === 1 ? null : explicitId ?? slugifyHeadingText(title),
		title,
	};
};

export const getMarkdownHeadings = async (source) => {
	const normalizedSource = source.replace(/\r\n?/g, '\n');
	const tree = await markdownToMdast(normalizedSource, {
		features: {
			frontmatter: true,
			gfm: true,
		},
	});

	const headings = tree.children
		.filter((node) => node.type === 'heading' && node.depth >= 1 && node.depth <= 3)
		.map((node) => ({
			...resolveHeadingIdentifier(getNodeText(node), node.depth),
			index: node.position?.start.offset ?? 0,
			line: node.position?.start.line ?? 1,
			source: normalizedSource.slice(
				node.position?.start.offset ?? 0,
				node.position?.end.offset ?? node.position?.start.offset ?? 0,
			),
		}));

	return { headings, source: normalizedSource, tree };
};

export const getHeadingIdentifierIssues = (headings) => {
	const issues = [];
	const headingsById = new Map();

	for (const heading of headings) {
		if (heading.depth === 1) {
			if (heading.explicitSource !== null) {
				issues.push({
					code: 'page-title-id',
					heading,
					message: 'The Markdown H1 is the page title and must not have an id.',
					fix: 'Remove the {#...} suffix. Heading ids apply to H2 and H3.',
				});
			}
			continue;
		}

		if (heading.explicitSource !== null && !heading.explicitId) {
			issues.push({
				code: 'invalid-heading-id',
				heading,
				message: `Heading "${heading.title}" has an invalid explicit id "${heading.explicitSource}".`,
				fix: 'Use lowercase ASCII letters, numbers, and single hyphens, for example {#getting-started}.',
			});
			continue;
		}

		if (!heading.id) {
			issues.push({
				code: 'empty-heading-id',
				heading,
				message: `Heading "${heading.title}" cannot produce an automatic ASCII id.`,
				fix: `Add an explicit id, for example ${'#'.repeat(heading.depth)} ${heading.title} {#section-id}.`,
			});
			continue;
		}

		if (reservedHeadingIds.has(heading.id)) {
			issues.push({
				code: 'reserved-heading-id',
				heading,
				message: `Heading id "${heading.id}" is reserved by Norna.`,
				fix: 'Choose another explicit id.',
			});
			continue;
		}

		const existing = headingsById.get(heading.id);
		if (existing) {
			issues.push({
				code: 'duplicate-heading-id',
				heading,
				otherHeading: existing,
				message: `Two headings resolve to id "${heading.id}".`,
				fix: `Add a unique explicit id to at least one heading, for example {#${heading.id}-details}.`,
			});
			continue;
		}

		headingsById.set(heading.id, heading);
	}

	return issues;
};

export const formatHeadingIdentifierIssue = (issue, sourceLabel = 'Markdown') => {
	const lines = [`${sourceLabel}: ${issue.message}`];
	if (issue.otherHeading) {
		lines.push(
			`- line ${issue.otherHeading.line}: "${issue.otherHeading.title}"`,
			`- line ${issue.heading.line}: "${issue.heading.title}"`,
		);
	} else {
		lines.push(`- line ${issue.heading.line}: "${issue.heading.title}"`);
	}
	if (issue.fix) lines.push(issue.fix);

	return lines.join('\n');
};
