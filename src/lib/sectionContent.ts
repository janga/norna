import type { CollectionEntry } from 'astro:content';
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
type ThemePresentation = CollectionEntry<'theme'>['data']['presentation'];
type InlineStyles = NonNullable<NonNullable<ThemePresentation>['inlineStyles']>;
type GalleryImage = {
	image: string;
	src: string;
	alt?: string;
	caption?: string;
};
type SectionContentBlock =
	| { type: 'html'; html: string }
	| { type: 'image-stack'; images: GalleryImage[] }
	| { type: 'image-carousel'; images: GalleryImage[] };
export type ResolvedSection = SiteSectionMetadata & {
	id: string;
	title: string;
	contentBlocks: SectionContentBlock[];
};

const headingRegex = /<h2\b([^>]*)>([\s\S]*?)<\/h2>/gi;
const explicitHeadingIdRegex = /\s*\{#([a-z0-9-]+)\}\s*$/;
const inlineStyleReferenceRegex = /\[([^\]<]+)\]\{\.([a-z][a-z0-9-]*)\}/g;
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

const applyInlineStyles = (html: string, inlineStyles: InlineStyles | undefined) =>
	html.replace(inlineStyleReferenceRegex, (_match, text: string, styleName: string) => {
		const style = inlineStyles?.[styleName];

		if (!style) {
			throw new Error(`Markdown uses inline style ".${styleName}", but theme.md presentation.inlineStyles.${styleName} is not defined.`);
		}

		return `<span class="inline-style inline-style-${styleName}" style="--inline-style-color: ${style.color}">${text}</span>`;
	});

const stripImageProvenanceComments = (html: string) => html.replace(imageProvenanceCommentRegex, '');

const prepareContentHtml = (html: string, inlineStyles: InlineStyles | undefined) =>
	applyBasePathToHtml(
		projectConfig.site.basePath,
		stripImageProvenanceComments(applyInlineStyles(html, inlineStyles)),
	);

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

const resolveContentBlocks = (
	html: string,
	rawMarkdown: string,
	page: SitePage,
	sectionId: string,
	inlineStyles: InlineStyles | undefined,
) => {
	const rawBlocks = extractNornaMarkdownBlocks(rawMarkdown);
	const splitBlocks = rawBlocks.length > 0
		? splitNornaRenderedCodeBlocks(html, rawBlocks)
		: splitNornaMarkdownBlockMarkers(html);

	return splitBlocks.map((block): SectionContentBlock => {
		if (block.type === 'html') {
			return {
				type: 'html',
				html: prepareContentHtml(block.html, inlineStyles),
			};
		}

		return {
			type: block.type,
			images: block.images.map((image: { image: string; alt?: string; caption?: string }) => ({
				...image,
				src: getImageSourceKey(page, sectionId, image.image),
			})),
		};
	});
};

export const getSectionsContent = (
	html: string,
	rawMarkdown: string,
	sectionMetadata: SiteSectionMetadataMap,
	page: SitePage,
	inlineStyles?: InlineStyles,
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
			contentBlocks: resolveContentBlocks(content, rawSections.get(id) ?? '', page, id, inlineStyles),
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
