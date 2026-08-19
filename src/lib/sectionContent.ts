import type { CollectionEntry } from 'astro:content';
import { markdownToHtml } from 'satteri';
import projectConfig from '../../scripts/lib/project-config.mjs';
import {
	extractNornaMarkdownBlocks,
	splitNornaMarkdownBlockMarkers,
	splitNornaRenderedCodeBlocks,
} from '../../scripts/lib/norna-markdown-blocks.mjs';
import { applyBasePathToHtml } from './basePath';
import type { SitePage } from './sitePages';

type SiteSectionMetadataMap = CollectionEntry<'site'>['data']['sections'];
type SiteSectionMetadata = SiteSectionMetadataMap[string];
type GalleryImage = {
	image: string;
	src: string;
	alt?: string;
	caption?: string;
};
type CardListItem = {
	title: string;
	text?: string;
	image?: string;
	src?: string;
	link?: string;
	'badge-text'?: string;
};
type CardListLayout = 'image-top' | 'image-left' | 'image-right';
type CardListFlow = 'grid' | 'stack';
type CardListSize = 's' | 'm' | 'l' | 'xl';
type CardListWidth = 'text' | 'narrow' | 'normal' | 'wide';
type NotePlacement = 'margin' | 'inline';
type SectionContentBlock =
	| { type: 'html'; html: string }
	| { type: 'image-stack'; images: GalleryImage[] }
	| { type: 'image-carousel'; images: GalleryImage[] }
	| { type: 'card-list'; layout: CardListLayout; flow: CardListFlow; size: CardListSize; width: CardListWidth; cards: CardListItem[] }
	| { type: 'note'; html: string; placement: NotePlacement };
export type ResolvedSection = SiteSectionMetadata & {
	id: string;
	title: string;
	titleHtml: string;
	contentBlocks: SectionContentBlock[];
};

export type SectionNavigation = {
	id: string;
	title: string;
};

const headingRegex = /<h2\b([^>]*)>([\s\S]*?)<\/h2>/gi;
const explicitHeadingIdRegex = /\s*\{#([a-z0-9-]+)\}\s*$/;
const markdownH2Regex = /^##\s+.*$/gm;
const imageProvenanceCommentRegex = /<!--\s*norna-image-provenance:[\s\S]*?-->/gi;

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

const getHeadingTitleHtml = (headingHtml: string) =>
	prepareContentHtml(headingHtml.replace(explicitHeadingIdRegex, '').trim());

export const getSectionNavigation = (html: string, sectionMetadata: SiteSectionMetadataMap): SectionNavigation[] => {
	const matches = Array.from(html.matchAll(headingRegex));
	const sectionIds = new Set<string>();
	const sections = matches.map((match) => {
		const attributes = match[1] ?? '';
		const headingHtml = match[2] ?? '';
		const explicitId = getExplicitHeadingId(headingHtml);
		const id = getHeadingId(attributes, headingHtml);
		const title = getHeadingTitle(headingHtml);

		if (!explicitId) {
			throw new Error(`Section heading "${title}" is missing an explicit id. Write it as: ## ${title} {#${id}}`);
		}

		if (sectionIds.has(id)) {
			throw new Error(`Duplicate Markdown section heading id: ${id}`);
		}

		sectionIds.add(id);
		return { id, title };
	});

	for (const id of Object.keys(sectionMetadata)) {
		if (!sectionIds.has(id)) {
			throw new Error(
				`Section metadata "${id}" does not match any Markdown section. Add "## Heading {#${id}}" or remove sections.${id}.`,
			);
		}
	}

	return sections;
};

const stripImageProvenanceComments = (html: string) => html.replace(imageProvenanceCommentRegex, '');

const prepareContentHtml = (html: string) =>
	applyBasePathToHtml(
		projectConfig.site.basePath,
		stripImageProvenanceComments(html),
	);

const htmlVoidElements = new Set([
	'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link',
	'meta', 'param', 'source', 'track', 'wbr',
]);

// Keep notes aligned with the Markdown block immediately before them instead of
// aligning them with a whole run of paragraphs rendered as one HTML fragment.
const splitHtmlIntoBlocks = (html: string) => {
	const tagRegex = /<!--[\s\S]*?-->|<\/?([a-z][\w:-]*)(?:\s[^<>]*?)?\/?>/gi;
	const blocks: string[] = [];
	let blockStart = -1;
	let depth = 0;
	let cursor = 0;

	for (const match of html.matchAll(tagRegex)) {
		const start = match.index ?? 0;
		const token = match[0] ?? '';
		const tagName = match[1]?.toLowerCase();
		if (!tagName) continue;

		const isClosing = /^<\//.test(token);
		const isSelfClosing = /\/\s*>$/.test(token) || htmlVoidElements.has(tagName);

		if (isClosing) {
			if (depth > 0) depth -= 1;
			if (depth === 0 && blockStart >= 0) {
				blocks.push(html.slice(blockStart, start + token.length));
				cursor = start + token.length;
				blockStart = -1;
			}
			continue;
		}

		if (depth === 0) {
			if (blockStart < 0) blockStart = start;
			if (isSelfClosing) {
				blocks.push(html.slice(blockStart, start + token.length));
				cursor = start + token.length;
				blockStart = -1;
			}
		}

		if (!isSelfClosing) depth += 1;
	}

	if (blockStart >= 0) {
		blocks.push(html.slice(blockStart).trim());
		cursor = html.length;
	}

	const prefix = html.slice(0, blocks.length > 0 ? html.indexOf(blocks[0]!) : html.length).trim();
	const suffix = html.slice(cursor).trim();
	return [prefix, ...blocks, suffix].filter(Boolean);
};

const getRawMarkdownSections = (markdown: string) => {
	const matches = Array.from(markdown.matchAll(markdownH2Regex));
	const sections = new Map<string, string>();

	for (let index = 0; index < matches.length; index += 1) {
		const match = matches[index];
		const heading = match[0] ?? '';
		const id = heading.match(explicitHeadingIdRegex)?.[1];
		if (!id) continue;

		const start = match.index ?? 0;
		const next = matches[index + 1];
		const end = next?.index ?? markdown.length;
		sections.set(id, markdown.slice(start, end));
	}

	return sections;
};

const getImageSourceKey = (page: SitePage, sectionId: string, image: string) => (
	page.routeDirectory
		? `routes/${page.routeDirectory}/images/${sectionId}/${image}`
		: `images/${sectionId}/${image}`
);

const renderNoteMarkdown = async (markdown: string) => {
	const result = await markdownToHtml(markdown, {
		features: {
			gfm: true,
			smartPunctuation: true,
		},
	});

	if (/<img\b/i.test(result.html)) {
		throw new Error('norna-note cannot contain images. Use a Norna image block with a caption instead.');
	}

	return prepareContentHtml(result.html);
};

const resolveContentBlocks = async (
	html: string,
	rawMarkdown: string,
	page: SitePage,
	sectionId: string,
) => {
	const rawBlocks = extractNornaMarkdownBlocks(rawMarkdown);
	const splitBlocks = rawBlocks.length > 0
		? splitNornaRenderedCodeBlocks(html, rawBlocks)
		: splitNornaMarkdownBlockMarkers(html);
	const hasNotes = rawBlocks.some((block) => block.blockType === 'norna-note');
	const contentBlocks = hasNotes
		? splitBlocks.flatMap((block) => block.type === 'html'
			? splitHtmlIntoBlocks(block.html).map((htmlBlock) => ({ type: 'html' as const, html: htmlBlock }))
			: [block])
		: splitBlocks;
	const resolvedBlocks: SectionContentBlock[] = [];

	for (const block of contentBlocks) {
		if (block.type === 'html') {
			resolvedBlocks.push({
				type: 'html',
				html: prepareContentHtml(block.html),
			});
			continue;
		}

		if (block.type === 'note') {
			const previousBlock = resolvedBlocks.at(-1);
			resolvedBlocks.push({
				type: 'note',
				html: await renderNoteMarkdown(block.markdown),
				placement: previousBlock?.type === 'image-stack'
					|| previousBlock?.type === 'image-carousel'
					|| previousBlock?.type === 'card-list'
					? 'inline'
					: 'margin',
			});
			continue;
		}

		if (block.type === 'card-list') {
			resolvedBlocks.push({
				type: 'card-list',
				layout: block.layout,
				flow: block.flow,
				size: block.size,
				width: block.width,
				cards: block.cards.map((card: CardListItem) => ({
					...card,
					...(card.image ? { src: getImageSourceKey(page, sectionId, card.image) } : {}),
				})),
			});
			continue;
		}

		resolvedBlocks.push({
			type: block.type,
			images: block.images.map((image: { image: string; alt?: string; caption?: string }) => ({
				...image,
				src: getImageSourceKey(page, sectionId, image.image),
			})),
		});
	}

	return resolvedBlocks;
};

export const getSectionsContent = async (
	html: string,
	rawMarkdown: string,
	sectionMetadata: SiteSectionMetadataMap,
	page: SitePage,
) => {
	const matches = Array.from(html.matchAll(headingRegex));
	const rawSections = getRawMarkdownSections(rawMarkdown);
	const metadataIds = new Set(Object.keys(sectionMetadata));
	const sections: ResolvedSection[] = [];
	const sectionIds = new Set<string>();

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
			throw new Error(`Section heading "${title}" is missing an explicit id. Write it as: ## ${title} {#${id}}`);
		}

		if (sectionIds.has(id)) {
			throw new Error(`Duplicate Markdown section heading id: ${id}`);
		}

		sectionIds.add(id);
		sections.push({
			...(sectionMetadata[id] ?? {}),
			id,
			title,
			titleHtml: getHeadingTitleHtml(headingHtml),
			contentBlocks: await resolveContentBlocks(content, rawSections.get(id) ?? '', page, id),
		});
	}

	for (const id of metadataIds) {
		if (!sectionIds.has(id)) {
			throw new Error(
				`Section metadata "${id}" does not match any Markdown section. Add "## Heading {#${id}}" or remove sections.${id}.`,
			);
		}
	}

	return sections;
};
