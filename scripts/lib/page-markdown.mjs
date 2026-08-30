import {
	getHeadingIdentifierIssues,
	getMarkdownHeadings,
} from './heading-ids.mjs';
import {
	extractInlineNoteDiagnostics,
	extractMarkdownImageReferences,
	extractNornaMarkdownBlockDiagnostics,
	getNornaBlockImageReferences,
} from './norna-markdown-blocks.mjs';

const normalizeMarkdown = (source) => source.replace(/\r\n?/g, '\n');

const hasContent = (source) => source.trim().length > 0;

export const splitPageMarkdownSource = (source) => {
	const normalizedSource = normalizeMarkdown(source);
	const lines = normalizedSource.split('\n');
	if (lines[0]?.trim() !== '---') {
		return {
			body: normalizedSource,
			bodyOffset: 0,
			frontmatter: '',
			frontmatterUnclosed: false,
			lineOffset: 0,
		};
	}

	const closingIndex = lines.findIndex((line, index) => index > 0 && line.trim() === '---');
	if (closingIndex < 0) {
		return {
			body: '',
			bodyOffset: normalizedSource.length,
			frontmatter: normalizedSource,
			frontmatterUnclosed: true,
			lineOffset: lines.length,
		};
	}

	const frontmatterLines = lines.slice(0, closingIndex + 1);
	const frontmatter = frontmatterLines.join('\n');
	const bodyOffset = frontmatter.length + (closingIndex < lines.length - 1 ? 1 : 0);
	return {
		body: normalizedSource.slice(bodyOffset),
		bodyOffset,
		frontmatter,
		frontmatterUnclosed: false,
		lineOffset: closingIndex + 1,
	};
};

const getPageStructureDiagnostics = ({ headings, pageHeadings, prelude }, lineOffset) => {
	const diagnostics = [];

	if (pageHeadings.length === 0) {
		diagnostics.push({
			code: 'missing-page-title',
			line: lineOffset + 1,
			message: 'The page is missing its Markdown H1 title.',
			severity: 'error',
			fix: 'Add exactly one page title before any sections, for example "# About".',
		});
	} else if (pageHeadings.length > 1) {
		for (const heading of pageHeadings.slice(1)) {
			diagnostics.push({
				code: 'duplicate-page-title',
				line: lineOffset + heading.line,
				message: `The page contains ${pageHeadings.length} Markdown H1 headings.`,
				severity: 'error',
				fix: 'Keep exactly one H1 page title. Use level 2 headings with explicit ids for sections.',
			});
		}
	}

	if (headings[0] && headings[0].depth !== 1) {
		diagnostics.push({
			code: 'page-title-order',
			line: lineOffset + headings[0].line,
			message: `The first content heading is "${headings[0].title}", but a Norna page must start with its H1 title.`,
			severity: 'error',
			fix: 'Move the single H1 page title before every section.',
		});
	}

	if (hasContent(prelude)) {
		diagnostics.push({
			code: 'page-title-order',
			line: lineOffset + 1,
			message: 'The page contains content before its first heading.',
			severity: 'error',
			fix: 'Make the Markdown H1 page title the first content after optional frontmatter.',
		});
	}

	return diagnostics;
};

const getHeadingDiagnostics = (headings, lineOffset) => getHeadingIdentifierIssues(headings).map((issue) => ({
	code: issue.code,
	heading: issue.heading,
	line: lineOffset + issue.heading.line,
	message: issue.message,
	otherHeading: issue.otherHeading,
	otherLine: issue.otherHeading ? lineOffset + issue.otherHeading.line : null,
	severity: 'error',
	fix: issue.fix,
}));

const getRegionContent = (regionMarkdown, blocks, regionOffset) => {
	const content = [];
	let cursor = 0;

	for (const block of blocks) {
		if (block.startOffset > cursor) {
			content.push({
				kind: 'markdown',
				markdown: regionMarkdown.slice(cursor, block.startOffset),
				range: {
					start: regionOffset + cursor,
					end: regionOffset + block.startOffset,
				},
			});
		}

		content.push({
			kind: 'norna-block',
			block,
			range: {
				start: regionOffset + block.startOffset,
				end: regionOffset + block.endOffset,
			},
		});
		cursor = block.endOffset;
	}

	if (cursor < regionMarkdown.length) {
		content.push({
			kind: 'markdown',
			markdown: regionMarkdown.slice(cursor),
			range: {
				start: regionOffset + cursor,
				end: regionOffset + regionMarkdown.length,
			},
		});
	}

	return content.filter((item) => item.kind !== 'markdown' || item.markdown.length > 0);
};

const createRegion = ({ heading, nextHeading, headings, source, label, lineOffset }) => {
	const endOffset = nextHeading?.index ?? source.length;
	const markdown = source.slice(heading.index, endOffset).trimEnd();
	const regionLineOffset = lineOffset + heading.line - 1;
	const blockResult = extractNornaMarkdownBlockDiagnostics(markdown, {
		label,
		lineOffset: regionLineOffset,
	});
	const noteResult = extractInlineNoteDiagnostics(markdown, {
		label,
		lineOffset: regionLineOffset,
	});
	const markdownImages = extractMarkdownImageReferences(markdown).map((reference) => ({
		...reference,
		line: regionLineOffset + reference.line,
	}));
	const regionHeadings = headings.filter((candidate) => (
		candidate.index >= heading.index
		&& candidate.index < endOffset
	));

	return {
		bodyMarkdown: source.slice(heading.index + heading.source.length, endOffset).trimEnd(),
		blocks: blockResult.blocks,
		blockErrors: blockResult.errors,
		content: getRegionContent(markdown, blockResult.blocks, heading.index),
		endOffset,
		heading,
		headings: regionHeadings,
		id: heading.id,
		kind: heading.depth === 1 ? 'page-intro' : 'section',
		bodyLine: heading.line,
		line: lineOffset + heading.line,
		managedImages: getNornaBlockImageReferences(blockResult.blocks),
		markdown,
		markdownImages,
		notes: noteResult.notes,
		noteErrors: noteResult.errors,
		startOffset: heading.index,
		title: heading.title,
	};
};

export const parsePageMarkdown = async (markdown, options = {}) => {
	const source = normalizeMarkdown(markdown);
	const label = options.label ?? 'Markdown';
	const lineOffset = options.lineOffset ?? 0;
	const { headings } = await getMarkdownHeadings(source);
	const structuralHeadings = headings.filter((heading) => heading.depth <= 2);
	const prelude = structuralHeadings.length > 0
		? source.slice(0, structuralHeadings[0].index)
		: source;
	const pageHeadings = structuralHeadings.filter((heading) => heading.depth === 1);
	const regions = structuralHeadings.map((heading, index) => createRegion({
		heading,
		nextHeading: structuralHeadings[index + 1],
		headings,
		label,
		lineOffset,
		source,
	}));
	const headingIssues = getHeadingIdentifierIssues(headings);
	const headingDiagnostics = getHeadingDiagnostics(headings, lineOffset);
	const structureDiagnostics = getPageStructureDiagnostics({ headings, pageHeadings, prelude }, lineOffset);
	const blockDiagnostics = regions.flatMap((region) => region.blockErrors.map((error) => ({
		code: error.code ?? 'invalid-norna-block',
		line: error.line,
		message: error.message,
		regionId: region.id,
		severity: 'error',
	})));
	const noteDiagnostics = regions.flatMap((region) => region.noteErrors.map((error) => ({
		code: 'invalid-inline-note',
		line: error.line,
		message: error.message,
		regionId: region.id,
		severity: 'error',
	})));
	const navigationHeadings = [];
	let parentId = null;
	for (const heading of headings) {
		if (heading.depth === 2) parentId = heading.id;
		if ((heading.depth !== 2 && heading.depth !== 3) || !heading.id) continue;
		navigationHeadings.push({
			depth: heading.depth,
			id: heading.id,
			line: lineOffset + heading.line,
			parentId: heading.depth === 3 ? parentId : null,
			title: heading.title,
		});
	}

	return {
		blocks: regions.flatMap((region) => region.blocks),
		diagnostics: [
			...structureDiagnostics,
			...headingDiagnostics,
			...blockDiagnostics,
			...noteDiagnostics,
		],
		headings,
		headingIssues,
		intro: regions.find((region) => region.kind === 'page-intro') ?? null,
		label,
		lineOffset,
		managedImages: regions.flatMap((region) => region.managedImages),
		markdownImages: regions.flatMap((region) => region.markdownImages),
		navigationHeadings,
		notes: regions.flatMap((region) => region.notes),
		pageTitle: pageHeadings[0] ?? null,
		pageHeadings,
		prelude,
		regions,
		sections: regions.filter((region) => region.kind === 'section'),
		source,
	};
};

export const parsePageMarkdownSource = async (source, options = {}) => {
	const split = splitPageMarkdownSource(source);
	const model = await parsePageMarkdown(split.body, {
		...options,
		lineOffset: (options.lineOffset ?? 0) + split.lineOffset,
	});

	return {
		...model,
		bodyOffset: split.bodyOffset,
		frontmatter: split.frontmatter,
		frontmatterUnclosed: split.frontmatterUnclosed,
		fullSource: normalizeMarkdown(source),
	};
};
