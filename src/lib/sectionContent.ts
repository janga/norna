import { markdownToHtml } from 'satteri';
import { groupRenderedTabs } from '../../scripts/lib/content-tabs.mjs';
import projectConfig from '../../scripts/lib/project-config.mjs';
import {
	formatHeadingIdentifierIssue,
} from '../../scripts/lib/heading-ids.mjs';
import { splitNornaRenderedBlocks } from '../../scripts/lib/norna-markdown-blocks.mjs';
import { applyBasePathToHtml } from './basePath';
import type { SitePage } from './sitePages';

type ManagedImage = {
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
type ParsedImageBlock = {
	type: 'image-stack' | 'image-carousel';
	images: Array<{ image: string; alt?: string; caption?: string }>;
};
type ParsedCardListBlock = {
	type: 'card-list';
	layout: CardListLayout;
	flow: CardListFlow;
	size: CardListSize;
	width?: CardListWidth;
	cards: CardListItem[];
};
type ParsedPageListBlock = {
	type: 'page-list';
	line: number;
};
type ParsedNornaBlock = ParsedImageBlock | ParsedCardListBlock | ParsedPageListBlock;
type PageListItem = {
	title: string;
	pathname: string;
	description?: string;
};
export type SectionContentBlock =
	| { type: 'html'; html: string }
	| { type: 'tabs'; index: number; panels: Array<{ label: string; contentBlocks: SectionContentBlock[] }> }
	| { type: 'image-stack'; images: ManagedImage[] }
	| { type: 'image-carousel'; images: ManagedImage[] }
	| { type: 'card-list'; layout: CardListLayout; flow: CardListFlow; size: CardListSize; width?: CardListWidth; cards: CardListItem[] }
	| { type: 'page-list'; pages: PageListItem[] };
export type ResolvedSection = {
	id: string | null;
	title: string;
	titleHtml: string;
	headingLevel: 1 | 2;
	contentBlocks: SectionContentBlock[];
};

export type SectionNavigation = {
	id: string;
	title: string;
};

export type HeadingNavigation = SectionNavigation & {
	depth: 2 | 3;
	parentId: string | null;
};

export const flattenContentBlocks = (blocks: SectionContentBlock[]): SectionContentBlock[] =>
	blocks.flatMap((block) => block.type === 'tabs'
		? [block, ...block.panels.flatMap((panel) => flattenContentBlocks(panel.contentBlocks))]
		: [block]);

const explicitHeadingIdRegex = /\s*\{#([a-z0-9-]+)\}\s*$/;
const imageProvenanceCommentRegex = /<!--\s*norna-image-provenance:[\s\S]*?-->/gi;

const stripImageProvenanceComments = (html: string) => html.replace(imageProvenanceCommentRegex, '');

const prepareContentHtml = (html: string) =>
	applyBasePathToHtml(
		projectConfig.site.basePath,
		stripImageProvenanceComments(html),
	);

const applyH3HeadingIds = (
	html: string,
	headings: Array<{ id: string | null }>,
) => {
	let headingIndex = 0;
	const result = html.replace(/<h3\b([^>]*)>([\s\S]*?)<\/h3>/gi, (_match, attributes, headingHtml) => {
		const heading = headings[headingIndex];
		headingIndex += 1;
		if (!heading?.id) throw new Error('Rendered Markdown H3 could not be matched to its heading id.');

		const cleanAttributes = String(attributes).replace(/\s+id=(["']).*?\1/gi, '');
		const cleanHeadingHtml = String(headingHtml).replace(explicitHeadingIdRegex, '').trim();
		return `<h3${cleanAttributes} id="${heading.id}">${cleanHeadingHtml}</h3>`;
	});

	if (headingIndex !== headings.length) {
		throw new Error('Markdown H3 headings could not be matched to the rendered page content.');
	}

	return result;
};

const getImageSourceKey = (page: SitePage, image: string) => `pages/${page.pageDirectory}/images/${image}`;

const renderHeadingTitleHtml = async (headingSource: string) => {
	const headingMarkdown = headingSource
		.replace(/^#{1,6}[ \t]+/, '')
		.replace(explicitHeadingIdRegex, '')
		.trim();
	const result = await markdownToHtml(headingMarkdown, {
		features: {
			gfm: true,
			smartPunctuation: true,
		},
	});
	const paragraph = result.html.trim().match(/^<p>([\s\S]*)<\/p>$/i);
	if (!paragraph) throw new Error('Markdown heading could not be rendered as inline content.');
	return prepareContentHtml(paragraph[1] ?? '');
};

const splitRenderedRegions = (html: string, regionCount: number) => {
	const markerRegex = /<norna-region\s+data-index="(\d+)"\s*><\/norna-region>/g;
	const markers = Array.from(html.matchAll(markerRegex));
	if (markers.length !== regionCount) {
		throw new Error(`Rendered Markdown contains ${markers.length} page region markers, but ${regionCount} regions were parsed.`);
	}

	return markers.map((marker, position) => {
		const index = Number.parseInt(marker[1] ?? '', 10);
		if (index !== position) throw new Error(`Rendered page region ${position + 1} has unexpected index ${index}.`);
		const start = (marker.index ?? 0) + marker[0].length;
		const end = markers[position + 1]?.index ?? html.length;
		return html.slice(start, end).trim();
	});
};

const resolveContentBlocks = async (
	html: string,
	blocks: ParsedNornaBlock[],
	page: SitePage,
	childPages: SitePage[],
) => {
	const splitBlocks = splitNornaRenderedBlocks(html, blocks) as Array<
		{ type: 'html'; html: string } | ParsedNornaBlock
	>;
	const resolvedBlocks: SectionContentBlock[] = [];

	for (const block of splitBlocks) {
		if (block.type === 'html') {
			resolvedBlocks.push({ type: 'html', html: prepareContentHtml(block.html) });
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
					...(card.image ? { src: getImageSourceKey(page, card.image) } : {}),
				})),
			});
			continue;
		}
		if (block.type === 'page-list') {
			if (childPages.length === 0) {
				throw new Error(`${page.contentLabel} line ${block.line}: page-list has no listed direct child pages to display. Navigation categories are not pages. Add a listed direct child page or remove the block.`);
			}
			resolvedBlocks.push({
				type: 'page-list',
				pages: childPages.map((childPage) => ({
					title: childPage.title,
					pathname: childPage.pathname,
					description: childPage.entry.data.page?.description,
				})),
			});
			continue;
		}

		resolvedBlocks.push({
			type: block.type,
			images: block.images.map((image: { image: string; alt?: string; caption?: string }) => ({
				...image,
				src: getImageSourceKey(page, image.image),
			})),
		});
	}

	return resolvedBlocks;
};

export const getSectionsContent = async (
	html: string,
	page: SitePage,
	childPages: SitePage[] = [],
) => {
	const pageDocument = page.markdownDocument;
	const noteError = pageDocument.noteDiagnostics.find((issue) => issue.severity === 'error');
	if (noteError) throw new Error(noteError.message);
	const tabError = pageDocument.diagnostics.find((issue) => issue.code === 'invalid-content-tabs');
	if (tabError) throw new Error(tabError.message);
	const sourceLabel = page.contentLabel;
	const headingIdentifierIssues = pageDocument.headingIssues;
	if (headingIdentifierIssues.length > 0) {
		throw new Error(formatHeadingIdentifierIssue(headingIdentifierIssues[0], sourceLabel));
	}
	const sections: ResolvedSection[] = [];
	const sectionIds = new Set<string>();
	const pageHeadingCount = pageDocument.pageHeadings.length;

	if (pageHeadingCount !== 1 || pageDocument.regions[0]?.kind !== 'page-intro') {
		throw new Error('Each Norna page must start with exactly one Markdown H1 page title, for example "# About".');
	}
	const renderedRegions = splitRenderedRegions(html, pageDocument.regions.length);

	for (let index = 0; index < renderedRegions.length; index += 1) {
		const bodySection = pageDocument.regions[index];
		if (!bodySection) throw new Error(`Parsed page region ${index + 1} is missing.`);
		const headingLevel = bodySection.heading.depth as 1 | 2;
		const id = bodySection.id;
		const h3Headings = bodySection.headings.filter((heading) => heading.depth === 3);
		const content = applyH3HeadingIds(renderedRegions[index] ?? '', h3Headings);
		const title = bodySection.title;

		if (headingLevel === 2 && !id) throw new Error(`Section heading "${title}" cannot produce an automatic ASCII id.`);

		if (id && sectionIds.has(id)) {
			throw new Error(`Duplicate Markdown section heading id: ${id}`);
		}

		if (id) sectionIds.add(id);
		if (bodySection.blockErrors.length > 0) {
			throw new Error(bodySection.blockErrors[0].message);
		}
		if (bodySection.noteErrors.length > 0) {
			throw new Error(bodySection.noteErrors[0].message);
		}
		const calloutErrors = bodySection.calloutErrors.filter((error) => error.severity !== 'warning');
		if (calloutErrors.length > 0) {
			throw new Error(calloutErrors[0].message);
		}

		sections.push({
			id,
			title,
			titleHtml: await renderHeadingTitleHtml(bodySection.heading.source),
			headingLevel,
			contentBlocks: groupRenderedTabs(
				await resolveContentBlocks(content, bodySection.blocks, page, childPages),
				bodySection.tabGroups,
			),
		});
	}

	return sections;
};
