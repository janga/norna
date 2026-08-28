import { markdownToHtml } from 'satteri';
import projectConfig from '../../scripts/lib/project-config.mjs';
import {
	formatHeadingIdentifierIssue,
	getHeadingIdentifierIssues,
} from '../../scripts/lib/heading-ids.mjs';
import { getBodySections } from '../../scripts/lib/site-content.mjs';
import {
	extractInlineNoteDiagnostics,
	extractNornaMarkdownBlocks,
	splitNornaMarkdownBlockMarkers,
	splitNornaRenderedCodeBlocks,
} from '../../scripts/lib/norna-markdown-blocks.mjs';
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
	| { type: 'card-list'; layout: CardListLayout; flow: CardListFlow; size: CardListSize; width: CardListWidth; cards: CardListItem[] };
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

const contentHeadingRegex = /<h([12])\b([^>]*)>([\s\S]*?)<\/h\1>/gi;
const explicitHeadingIdRegex = /\s*\{#([a-z0-9-]+)\}\s*$/;
const imageProvenanceCommentRegex = /<!--\s*norna-image-provenance:[\s\S]*?-->/gi;

const stripTags = (html: string) => html.replace(/<[^>]*>/g, '');

const decodeHtmlEntities = (value: string) =>
	value
		.replace(/&amp;/g, '&')
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/&quot;/g, '"')
		.replace(/&#39;/g, "'");

const getHeadingTitle = (headingHtml: string) =>
	decodeHtmlEntities(stripTags(headingHtml)).replace(explicitHeadingIdRegex, '').trim();

const getHeadingTitleHtml = (headingHtml: string) =>
	prepareContentHtml(headingHtml.replace(explicitHeadingIdRegex, '').trim());

export const getHeadingNavigation = async (
	markdown: string,
	sourceLabel = 'Markdown',
): Promise<HeadingNavigation[]> => {
	const bodyStructure = await getBodySections(markdown);
	const issues = getHeadingIdentifierIssues(bodyStructure.headings);
	if (issues.length > 0) throw new Error(formatHeadingIdentifierIssue(issues[0], sourceLabel));

	let parentId: string | null = null;
	return bodyStructure.headings.flatMap((heading) => {
		if (heading.depth === 1 || !heading.id) return [];
		if (heading.depth === 2) parentId = heading.id;

		return [{
			depth: heading.depth,
			id: heading.id,
			parentId: heading.depth === 3 ? parentId : null,
			title: heading.title,
		}];
	});
};

export const getSectionNavigation = async (
	markdown: string,
	sourceLabel = 'Markdown',
): Promise<SectionNavigation[]> => (
	(await getHeadingNavigation(markdown, sourceLabel))
		.filter((heading) => heading.depth === 2)
		.map(({ id, title }) => ({ id, title }))
);

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

const getRawMarkdownSections = (bodySections: Awaited<ReturnType<typeof getBodySections>>['sections']) => {
	const sections = new Map<string, string>();

	for (const section of bodySections) {
		const id = section.isPageTitle ? '__page-title' : section.id;
		if (!id) continue;
		sections.set(id, section.text);
	}

	return sections;
};

const applyH3HeadingIds = (
	html: string,
	headings: Awaited<ReturnType<typeof getBodySections>>['headings'],
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

const resolveContentBlocks = async (
	html: string,
	rawMarkdown: string,
	page: SitePage,
	inlineNotes: InlineNote[] = [],
) => {
	const rawBlocks = extractNornaMarkdownBlocks(rawMarkdown);
	const renderedNotes = await Promise.all(inlineNotes.map(async (note) => ({
		...note,
		html: await renderInlineNoteMarkdown(note.markdown),
	})));
	const renderedHtml = applyInlineNoteMarkup(html, renderedNotes);
	const splitBlocks = rawBlocks.length > 0
		? splitNornaRenderedCodeBlocks(renderedHtml, rawBlocks)
		: splitNornaMarkdownBlockMarkers(renderedHtml);
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
	rawMarkdown: string,
	page: SitePage,
	sourceLabel = 'Markdown',
) => {
	const matches = Array.from(html.matchAll(contentHeadingRegex));
	const bodyStructure = await getBodySections(rawMarkdown);
	const headingIdentifierIssues = getHeadingIdentifierIssues(bodyStructure.headings);
	if (headingIdentifierIssues.length > 0) {
		throw new Error(formatHeadingIdentifierIssue(headingIdentifierIssues[0], sourceLabel));
	}
	const rawSections = getRawMarkdownSections(bodyStructure.sections);
	const sections: ResolvedSection[] = [];
	const sectionIds = new Set<string>();
	let nextNoteNumber = 1;
	const pageHeadingCount = matches.filter((match) => match[1] === '1').length;

	if (pageHeadingCount !== 1 || matches[0]?.[1] !== '1') {
		throw new Error('Each Norna page must start with exactly one Markdown H1 page title, for example "# About".');
	}

	for (let index = 0; index < matches.length; index += 1) {
		const match = matches[index];
		const bodySection = bodyStructure.sections[index];
		const headingLevel = Number.parseInt(match[1] ?? '', 10) as 1 | 2;
		const headingHtml = match[3] ?? '';
		if (!bodySection || bodySection.level !== headingLevel) {
			throw new Error('Markdown H1/H2 headings could not be matched to the rendered page content.');
		}
		const id = bodySection.id;
		const contentStart = (match.index ?? 0) + match[0].length;
		const nextMatch = matches[index + 1];
		const contentEnd = nextMatch?.index ?? html.length;
		const nextBodySection = bodyStructure.sections[index + 1];
		const h3Headings = bodyStructure.headings.filter((heading) => (
			heading.depth === 3
			&& heading.index > bodySection.index
			&& heading.index < (nextBodySection?.index ?? Number.POSITIVE_INFINITY)
		));
		const content = applyH3HeadingIds(html.slice(contentStart, contentEnd).trim(), h3Headings);
		const title = getHeadingTitle(headingHtml);

		if (headingLevel === 2 && !id) throw new Error(`Section heading "${title}" cannot produce an automatic ASCII id.`);

		if (id && sectionIds.has(id)) {
			throw new Error(`Duplicate Markdown section heading id: ${id}`);
		}

		if (id) sectionIds.add(id);
		const rawSection = rawSections.get(id ?? '__page-title') ?? '';
		const inlineNoteDiagnostics = extractInlineNoteDiagnostics(rawSection, {
			label: 'Markdown section',
		});
		if (inlineNoteDiagnostics.errors.length > 0) {
			throw new Error(inlineNoteDiagnostics.errors[0].message);
		}

		const inlineNotes = inlineNoteDiagnostics.notes.map((note) => {
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
			titleHtml: getHeadingTitleHtml(headingHtml),
			headingLevel,
			contentBlocks: await resolveContentBlocks(content, rawSection, page, inlineNotes),
		});
	}

	return sections;
};
