import type { CollectionEntry } from 'astro:content';

type SiteSection = CollectionEntry<'site'>['data']['sections'][number];
type SiteDefaultPresentation = CollectionEntry<'site'>['data']['defaultPresentation'];
type InlineStyles = NonNullable<NonNullable<SiteDefaultPresentation>['inlineStyles']>;

const headingRegex = /<h2\b([^>]*)>([\s\S]*?)<\/h2>/gi;
const explicitHeadingIdRegex = /\s*\{#([a-z0-9-]+)\}\s*$/;
const inlineStyleReferenceRegex = /\[([^\]<]+)\]\{\.([a-z][a-z0-9-]*)\}/g;

const stripTags = (html: string) => html.replace(/<[^>]*>/g, '');

const decodeHtmlEntities = (value: string) =>
	value
		.replace(/&amp;/g, '&')
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/&quot;/g, '"')
		.replace(/&#39;/g, "'");

const slugify = (value: string) =>
	decodeHtmlEntities(stripTags(value))
		.trim()
		.toLowerCase()
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.replace(/å/g, 'a')
		.replace(/ä/g, 'a')
		.replace(/ö/g, 'o')
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '');

const getHeadingId = (attributes: string, headingHtml: string) => {
	const headingText = decodeHtmlEntities(stripTags(headingHtml)).trim();
	const explicitId = headingText.match(explicitHeadingIdRegex)?.[1];
	if (explicitId) return explicitId;

	const id = attributes.match(/\sid=(["'])(.*?)\1/i)?.[2];
	return id ? decodeHtmlEntities(id) : slugify(headingHtml);
};

const getExplicitHeadingId = (headingHtml: string) =>
	decodeHtmlEntities(stripTags(headingHtml)).trim().match(explicitHeadingIdRegex)?.[1];

const getHeadingTitle = (headingHtml: string) =>
	decodeHtmlEntities(stripTags(headingHtml)).replace(explicitHeadingIdRegex, '').trim();

const applyInlineStyles = (html: string, inlineStyles: InlineStyles | undefined) =>
	html.replace(inlineStyleReferenceRegex, (_match, text: string, styleName: string) => {
		const style = inlineStyles?.[styleName];

		if (!style) {
			throw new Error(`Markdown uses inline style ".${styleName}", but defaultPresentation.inlineStyles.${styleName} is not defined.`);
		}

		return `<span class="inline-style inline-style-${styleName}" style="--inline-style-color: ${style.color}">${text}</span>`;
	});

export const getSectionsContent = (
	html: string,
	sections: SiteSection[],
	defaultPresentation?: SiteDefaultPresentation,
) => {
	const matches = Array.from(html.matchAll(headingRegex));
	const contentById = new Map<string, { title: string; contentHtml: string }>();
	const sectionIds = new Set(sections.map((section) => section.id));
	const markdownSectionIds: string[] = [];
	const inlineStyles = defaultPresentation?.inlineStyles;

	for (let index = 0; index < matches.length; index += 1) {
		const match = matches[index];
		const attributes = match[1] ?? '';
		const headingHtml = match[2] ?? '';
		const explicitId = getExplicitHeadingId(headingHtml);
		const id = getHeadingId(attributes, headingHtml);
		const contentStart = (match.index ?? 0) + match[0].length;
		const nextMatch = matches[index + 1];
		const contentEnd = nextMatch?.index ?? html.length;
		const content = html.slice(contentStart, contentEnd).trim();
		const title = getHeadingTitle(headingHtml);

		if (!explicitId) {
			console.warn(`Markdown section is missing an explicit heading id: "${title}". Write for example "## ${title} {#${id}}".`);
		}

		if (contentById.has(id)) {
			throw new Error(`Duplicate Markdown section heading id: ${id}`);
		}

		contentById.set(id, {
			title,
			contentHtml: applyInlineStyles(content, inlineStyles),
		});
		markdownSectionIds.push(id);
	}

	for (const id of contentById.keys()) {
		if (!sectionIds.has(id)) {
			console.warn(`Markdown section exists but is not used in frontmatter: ${id}`);
		}
	}

	const orderedMarkdownSectionIds = markdownSectionIds.filter((id) => sectionIds.has(id));
	const frontmatterSectionIds = sections.map((section) => section.id);
	const hasOrderMismatch = frontmatterSectionIds.some((id, index) => id !== orderedMarkdownSectionIds[index]);

	if (hasOrderMismatch) {
		console.warn('Markdown section order differs from frontmatter. Run npm run content:sync to sort Markdown according to frontmatter.');
	}

	return sections.map((section) => {
		const content = contentById.get(section.id);

		if (!content) {
			throw new Error(
				`Cannot find heading for "${section.id}". Each frontmatter section must have a matching level 2 Markdown heading, for example: ## Heading {#${section.id}}`,
			);
		}

		return {
			...section,
			title: content.title,
			contentHtml: content.contentHtml,
		};
	});
};
