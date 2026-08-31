import { markdownToHtml } from 'satteri';
import projectConfig from '../../scripts/lib/project-config.mjs';
import {
	formatHeadingIdentifierIssue,
} from '../../scripts/lib/heading-ids.mjs';
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
type ParsedNornaBlock = ParsedImageBlock | ParsedCardListBlock;
type InlineNote = {
	markdown: string;
	number: number;
	id: string;
	referenceId: string;
	html?: string;
};
type SectionContentBlock =
	| { type: 'html'; html: string }
	| { type: 'image-stack'; images: ManagedImage[] }
	| { type: 'image-carousel'; images: ManagedImage[] }
	| { type: 'card-list'; layout: CardListLayout; flow: CardListFlow; size: CardListSize; width?: CardListWidth; cards: CardListItem[] };
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

const explicitHeadingIdRegex = /\s*\{#([a-z0-9-]+)\}\s*$/;
const imageProvenanceCommentRegex = /<!--\s*norna-image-provenance:[\s\S]*?-->/gi;

const stripImageProvenanceComments = (html: string) => html.replace(imageProvenanceCommentRegex, '');

const prepareContentHtml = (html: string) =>
	applyBasePathToHtml(
		projectConfig.site.basePath,
		stripImageProvenanceComments(html),
	);

const noteDeclarationParagraphRegex = /<p>\s*\{note:\s*[\s\S]*?\}\s*<\/p>/gi;
const htmlCodeRegionRegex = /<pre\b[\s\S]*?<\/pre>|<code\b[\s\S]*?<\/code>/gi;

const replaceHtmlOutsideCode = (html: string, transform: (value: string) => string) => {
	let result = '';
	let cursor = 0;

	for (const match of html.matchAll(htmlCodeRegionRegex)) {
		const start = match.index ?? 0;
		result += transform(html.slice(cursor, start));
		result += match[0];
		cursor = start + match[0].length;
	}

	return result + transform(html.slice(cursor));
};

const applyInlineNoteMarkup = (html: string, notes: InlineNote[]) => {
	let referenceIndex = 0;
	const withReferences = replaceHtmlOutsideCode(html, (value) => value.replace(/\{note-ref\}/g, () => {
		const note = notes[referenceIndex];
		if (!note) return '{note-ref}';

		referenceIndex += 1;
		return [
			'\u2060',
			`<sup class="section-note-ref"><a id="${note.referenceId}" href="#${note.id}" aria-label="Note ${note.number}" aria-describedby="${note.id}">${note.number}</a></sup>`,
			`<span class="section-note section-note-margin" id="${note.id}" aria-label="Note ${note.number}" role="note">`,
			`<a class="section-note-number" href="#${note.referenceId}" aria-label="Note ${note.number}">${note.number}</a>`,
			`<span class="section-note-content">${note.html ?? ''}</span>`,
			'</span>',
		].join('');
	}));

	return withReferences.replace(noteDeclarationParagraphRegex, '');
};

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

const renderInlineNoteMarkdown = async (markdown: string) => {
	const result = await markdownToHtml(markdown, {
		features: {
			gfm: true,
			smartPunctuation: true,
		},
	});

	if (/<img\b/i.test(result.html)) {
		throw new Error('Inline notes cannot contain images. Use a Norna image block with a caption instead.');
	}

	const inlineHtml = result.html.trim();
	const paragraph = inlineHtml.match(/^<p>([\s\S]*)<\/p>$/i);
	if (!paragraph) {
		throw new Error('Inline notes support inline Markdown only. Move headings, lists, and separate paragraphs into the page content.');
	}

	return paragraph[1] ?? '';
};

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

const splitNornaBlockMarkers = (html: string, blocks: ParsedNornaBlock[]) => {
	const result: Array<{ type: 'html'; html: string } | ParsedNornaBlock> = [];
	const markerRegex = /<norna-block\s+data-index="(\d+)"\s*><\/norna-block>/g;
	const seen = new Set<number>();
	let cursor = 0;

	for (const match of html.matchAll(markerRegex)) {
		const start = match.index ?? 0;
		if (start > cursor) result.push({ type: 'html', html: html.slice(cursor, start) });

		const index = Number.parseInt(match[1] ?? '', 10);
		const block = blocks[index];
		if (!block) throw new Error(`Rendered Norna block ${index + 1} has no matching parsed block.`);
		seen.add(index);
		result.push(block);
		cursor = start + match[0].length;
	}

	if (cursor < html.length) result.push({ type: 'html', html: html.slice(cursor) });
	if (seen.size !== blocks.length) {
		throw new Error(`Rendered Markdown contains ${seen.size} Norna block markers, but ${blocks.length} blocks were parsed.`);
	}

	return result.filter((block) => block.type !== 'html' || block.html.trim());
};

const resolveContentBlocks = async (
	html: string,
	blocks: ParsedNornaBlock[],
	page: SitePage,
	inlineNotes: InlineNote[] = [],
) => {
	const renderedNotes = await Promise.all(inlineNotes.map(async (note) => ({
		...note,
		html: await renderInlineNoteMarkdown(note.markdown),
	})));
	const renderedHtml = applyInlineNoteMarkup(html, renderedNotes);
	const splitBlocks = splitNornaBlockMarkers(renderedHtml, blocks);
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
) => {
	const pageDocument = page.markdownDocument;
	const sourceLabel = page.contentLabel;
	const headingIdentifierIssues = pageDocument.headingIssues;
	if (headingIdentifierIssues.length > 0) {
		throw new Error(formatHeadingIdentifierIssue(headingIdentifierIssues[0], sourceLabel));
	}
	const sections: ResolvedSection[] = [];
	const sectionIds = new Set<string>();
	let nextNoteNumber = 1;
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

		const inlineNotes = bodySection.notes.map((note) => {
			const number = nextNoteNumber;
			nextNoteNumber += 1;
			const pageKey = page.pageId || 'home';
			const noteKey = `${pageKey}-${id ?? 'page-title'}-${number}`;
			return {
				...note,
				number,
				id: `note-${noteKey}`,
				referenceId: `note-ref-${noteKey}`,
			};
		});

		sections.push({
			id,
			title,
			titleHtml: await renderHeadingTitleHtml(bodySection.heading.source),
			headingLevel,
			contentBlocks: await resolveContentBlocks(content, bodySection.blocks, page, inlineNotes),
		});
	}

	return sections;
};
