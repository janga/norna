import { documentationLink } from './documentation-links.mjs';
import { createStructuredBlockSchema, parseStructuredBlock } from './structured-blocks.mjs';

const field = (description, options = {}) => Object.freeze({ description, ...options });
const value = (title, description) => Object.freeze({ title, description });

export const nornaMarkdownBlockDefinitions = Object.freeze({
	'image-stack': Object.freeze({
		description: 'Display one or more managed images in a vertical stack.',
		documentation: documentationLink('Image stack reference', 'content.md', 'image-stack'),
		item: Object.freeze({
			start: field('Start another managed image.', { key: 'image', prefix: '- ' }),
			fields: Object.freeze({
				alt: field('Optional alternative text for the image.'),
				caption: field('Optional visible caption below the image.'),
			}),
		}),
	}),
	'image-carousel': Object.freeze({
		minItems: 2,
		description: 'Display two or more managed images in an interactive carousel.',
		documentation: documentationLink('Image carousel reference', 'content.md', 'image-carousel'),
		item: Object.freeze({
			start: field('Start another managed carousel image.', { key: 'image', prefix: '- ' }),
			fields: Object.freeze({
				alt: field('Optional alternative text for the image.'),
				caption: field('Optional visible caption for the image.'),
			}),
		}),
	}),
	'card-list': Object.freeze({
		description: 'Show related choices as cards with optional images and links. Set link to make the whole card clickable.',
		documentation: documentationLink('Card list reference', 'content.md', 'card-list'),
		options: Object.freeze({
			layout: field('Place each card image above, left, or right of its text. Defaults to image-top.', {
				default: 'image-top',
				values: Object.freeze({
					'image-top': value('Image above', 'Place the image above the card text.'),
					'image-left': value('Image left', 'Place the image to the left of the card text.'),
					'image-right': value('Image right', 'Place the image to the right of the card text.'),
				}),
			}),
			flow: field('Arrange cards as a responsive grid or a vertical stack. Defaults to grid.', {
				default: 'grid',
				values: Object.freeze({
					grid: value('Grid', 'Arrange cards in a responsive grid.'),
					stack: value('Stack', 'Arrange cards in one vertical column.'),
				}),
			}),
			size: field('Set the coordinated card and image size. Defaults to m.', {
				default: 'm',
				values: Object.freeze({
					s: value('Small', 'Use compact cards and images.'),
					m: value('Medium', 'Use the balanced default card size.'),
					l: value('Large', 'Use larger cards and images.'),
					xl: value('Extra large', 'Use the largest card and image size.'),
				}),
			}),
			width: field('Override the root theme\'s maximum width for this card list.', {
				values: Object.freeze({
					text: value('Text', 'Match the active body-text width, including a reader-selected reading width.'),
					narrow: value('Narrow', 'Limit the complete card list to at most 48rem.'),
					normal: value('Normal', 'Limit the complete card list to at most 56rem.'),
					wide: value('Wide', 'Allow the complete card list to use the available page-layout width.'),
				}),
			}),
		}),
		item: Object.freeze({
			start: field('Start another card. Every card requires a title.', { key: 'title', prefix: '- ' }),
			fields: Object.freeze({
				text: field('Optional card text.'),
				image: field('Optional managed image filename.'),
				link: field('Optional URL opened when the card is activated.'),
				'badge-text': field('Optional short badge displayed on the card.'),
			}),
		}),
	}),
	'page-list': Object.freeze({
		description: 'Display the current page\'s listed direct child pages in navigation order.',
		documentation: documentationLink('Child page list reference', 'content.md', 'child-page-list'),
	}),
});

export const nornaBlockTypes = new Set(Object.keys(nornaMarkdownBlockDefinitions));

const renamedNornaBlockTypes = Object.freeze({
	'norna-image-stack': 'image-stack',
	'norna-image-carousel': 'image-carousel',
	'norna-carousel': 'image-carousel',
	carousel: 'image-carousel',
	'norna-card-list': 'card-list',
	'norna-page-list': 'page-list',
});

const blockTypeLabels = {
	'image-stack': 'image-stack',
	'image-carousel': 'image-carousel',
	'card-list': 'card-list',
	'page-list': 'page-list',
};

const knownBlockTypeList = Array.from(nornaBlockTypes).join(', ');
const imageStackExample = [
	'```image-stack',
	'items:',
	'  - image: filename.jpg',
	'```',
].join('\n');
const carouselExample = [
	'```image-carousel',
	'items:',
	'  - image: first.jpg',
	'  - image: second.jpg',
	'```',
].join('\n');
const cardListExample = [
	'```card-list',
	'layout: image-top',
	'flow: grid',
	'size: m',
	'items:',
	'  - title: Adopt',
	'    text: Give a dog a new home.',
	'    image: adopt.jpg',
	'    link: /adopt/',
	'    badge-text: Recommended',
	'```',
].join('\n');
const pageListExample = [
	'```page-list',
	'```',
].join('\n');
const blockExamples = Object.freeze({
	'image-stack': imageStackExample,
	'image-carousel': carouselExample,
	'card-list': cardListExample,
	'page-list': pageListExample,
});
const cardListDefinition = nornaMarkdownBlockDefinitions['card-list'];

const formatLocation = ({ label, line } = {}) => [
	label,
	line ? `line ${line}` : null,
].filter(Boolean).join(' ');

const fail = (message, options) => {
	const location = formatLocation(options);
	throw new Error(location ? `${location}: ${message}` : message);
};

const getUnknownNornaBlockMessage = (type) => [
	renamedNornaBlockTypes[type]
		? `Norna block "${type}" was renamed to "${renamedNornaBlockTypes[type]}".`
		: `Unknown Norna block "${type}". Use one of: ${knownBlockTypeList}.`,
	type === 'norna-gallery-stack'
		? 'Use image-stack for one or more stacked images.'
		: null,
	type === 'norna-image-carousel' || type === 'norna-carousel' || type === 'carousel'
		? 'Use image-carousel for an image carousel.'
		: null,
	type === 'norna-image'
		? 'Use image-stack for a single image or a stacked list of images.'
		: null,
	'Example:',
	blockExamples[renamedNornaBlockTypes[type] ?? type] ?? imageStackExample,
].filter(Boolean).join(' ');

const normalizeLines = (source) => source.replace(/\r\n?/g, '\n').split('\n');

const getFenceInfo = (line) => {
	const match = line.match(/^ {0,3}(`+|~+)([^\r\n]*)$/);
	if (!match) return null;

	const marker = match[1];
	const markerCharacter = marker[0];
	const info = match[2].trim();

	return {
		info,
		length: marker.length,
		marker,
		markerCharacter,
	};
};

const getFenceCloseInfo = (line, opening) => {
	const fence = getFenceInfo(line);
	if (!fence) return null;
	if (fence.markerCharacter !== opening.markerCharacter) return null;
	if (fence.length < opening.length) return null;
	if (fence.info) return null;
	return fence;
};

export const getOpenMarkdownFenceAtLine = (markdown, lineIndex) => {
	const lines = normalizeLines(markdown);
	let open = null;

	for (let index = 0; index <= Math.min(lineIndex, lines.length - 1); index += 1) {
		const fence = getFenceInfo(lines[index]);
		if (!fence || fence.length < 3) continue;

		if (!open) {
			open = {
				character: fence.markerCharacter,
				length: fence.length,
				line: index,
				type: fence.info.split(/\s+/)[0] ?? '',
			};
			continue;
		}

		if (getFenceCloseInfo(lines[index], {
			length: open.length,
			markerCharacter: open.character,
		})) {
			open = null;
		}
	}

	return open;
};

const getNornaLineAttempt = (line) => {
	const match = line.match(/^ {0,3}([`~]{0,2})([a-z][a-z0-9-]+)\s*$/);
	if (!match) return null;
	const marker = match[1];
	const type = match[2];
	const isNamespacedAttempt = type.startsWith('norna-');
	if (!isNamespacedAttempt && !nornaBlockTypes.has(type) && !renamedNornaBlockTypes[type]) return null;
	if (!marker && type === 'carousel') return null;

	return {
		marker,
		type,
	};
};

const getNornaFenceStartMessage = (type, marker = '') => {
	const supportedType = renamedNornaBlockTypes[type] ?? type;
	const example = blockExamples[supportedType] ?? imageStackExample;
	if (marker) {
		return `Invalid Norna block start for "${type}". Use three backticks or three tildes. Example:\n${example}`;
	}

	return `Found "${type}" outside a code block. Start the block like this:\n${example}`;
};

const getUnclosedNornaBlockMessage = (opening) =>
	`This Norna block was started on line ${opening.line} but not closed. Add a closing ${opening.markerCharacter.repeat(opening.length)} line after the last entry.`;

const scanMarkdownFencedBlocks = (markdown, options = {}) => {
	const normalizedMarkdown = markdown.replace(/\r\n?/g, '\n');
	const lines = normalizedMarkdown.split('\n');
	const lineOffsets = [];
	let nextLineOffset = 0;
	for (const line of lines) {
		lineOffsets.push(nextLineOffset);
		nextLineOffset += line.length + 1;
	}
	const lineOffset = options.lineOffset ?? 0;
	const blocks = [];
	const errors = [];
	let index = 0;

	while (index < lines.length) {
		const line = lines[index];
		const fence = getFenceInfo(line);
		const lineNumber = lineOffset + index + 1;

		if (!fence) {
			const attempt = getNornaLineAttempt(line);
			if (attempt) {
				errors.push({
					blockType: attempt.type,
					code: 'invalid-norna-block-start',
					line: lineNumber,
					source: '',
					message: failMessage(getNornaFenceStartMessage(attempt.type, attempt.marker), { ...options, line: lineNumber }),
				});
			}

			index += 1;
			continue;
		}

		const attempt = getNornaLineAttempt(line);
		if (fence.length < 3) {
			if (attempt) {
				errors.push({
					blockType: attempt.type,
					code: 'invalid-norna-block-start',
					line: lineNumber,
					source: '',
					message: failMessage(getNornaFenceStartMessage(attempt.type, attempt.marker), { ...options, line: lineNumber }),
				});
			}

			index += 1;
			continue;
		}

		const type = fence.info.split(/\s+/)[0] ?? '';
		const opening = {
			...fence,
			line: lineNumber,
			type,
		};
		const bodyStartIndex = index + 1;
		let closingIndex = -1;

		for (let candidateIndex = bodyStartIndex; candidateIndex < lines.length; candidateIndex += 1) {
			if (getFenceCloseInfo(lines[candidateIndex], opening)) {
				closingIndex = candidateIndex;
				break;
			}
		}

		const isNornaLike = type.startsWith('norna-') || nornaBlockTypes.has(type) || Boolean(renamedNornaBlockTypes[type]);
		if (closingIndex === -1) {
			if (isNornaLike) {
				errors.push({
					blockType: type,
					code: 'unclosed-norna-block',
					endOffset: normalizedMarkdown.length,
					line: lineNumber,
					startOffset: lineOffsets[index],
					source: lines.slice(bodyStartIndex).join('\n'),
					message: failMessage(getUnclosedNornaBlockMessage(opening), { ...options, line: lineNumber }),
				});
			}
			break;
		}

		const source = lines.slice(bodyStartIndex, closingIndex).join('\n');
		if (isNornaLike) {
			if (nornaBlockTypes.has(type)) {
				blocks.push({
					blockType: type,
					endLine: lineOffset + closingIndex + 1,
					endOffset: lineOffsets[closingIndex] + lines[closingIndex].length,
					line: lineNumber,
					startOffset: lineOffsets[index],
					source,
					sourceEndOffset: lineOffsets[closingIndex],
					sourceLine: lineNumber + 1,
					sourceStartOffset: lineOffsets[bodyStartIndex],
				});
			} else {
				errors.push({
					blockType: type,
					code: renamedNornaBlockTypes[type] ? 'renamed-norna-block' : 'unknown-norna-block',
					line: lineNumber,
					source,
					message: failMessage(getUnknownNornaBlockMessage(type), { ...options, line: lineNumber }),
				});
			}
		}

		index = closingIndex + 1;
	}

	return { blocks, errors };
};

const failMessage = (message, options) => {
	const location = formatLocation(options);
	return location ? `${location}: ${message}` : message;
};

const blockSchemas = new Map(Object.entries(nornaMarkdownBlockDefinitions)
	.map(([type, definition]) => [type, createStructuredBlockSchema(definition)]));

export const getNornaBlockSchema = (type) => blockSchemas.get(type) ?? null;

const parseImageListBlock = (source, options = {}) => {
	const { items } = parseStructuredBlock(source, getNornaBlockSchema(options.type), options);
	return { type: options.type, images: items };
};

const parseCardListBlock = (source, options = {}) => {
	const { items, ...data } = parseStructuredBlock(source, getNornaBlockSchema('card-list'), options);
	return {
		type: 'card-list',
		layout: cardListDefinition.options.layout.default,
		flow: cardListDefinition.options.flow.default,
		size: cardListDefinition.options.size.default,
		width: undefined,
		...data,
		cards: items,
	};
};

const parsePageListBlock = (source, options = {}) => {
	if (source.trim()) {
		fail(`${options.type} does not accept options or items. Leave the block empty. Example:\n${pageListExample}`, options);
	}

	return { type: 'page-list' };
};

export const parseNornaMarkdownBlock = (type, source, options = {}) => {
	if (!nornaBlockTypes.has(type)) {
		fail(getUnknownNornaBlockMessage(type), options);
	}

	const parseOptions = { ...options, type: blockTypeLabels[type] };
	if (type === 'card-list') return parseCardListBlock(source, parseOptions);
	if (type === 'page-list') return parsePageListBlock(source, parseOptions);
	return parseImageListBlock(source, parseOptions);
};

const getLineNumber = (source, index) => source.slice(0, index).split(/\r?\n/).length;

export const extractNornaMarkdownBlockDiagnostics = (markdown, options = {}) => {
	const blocks = [];
	const { blocks: scannedBlocks, errors } = scanMarkdownFencedBlocks(markdown, options);

	for (const block of scannedBlocks) {
		try {
			blocks.push({
				...parseNornaMarkdownBlock(block.blockType, block.source, { ...options, line: block.sourceLine }),
				blockType: block.blockType,
				endLine: block.endLine,
				endOffset: block.endOffset,
				line: block.line,
				startOffset: block.startOffset,
				source: block.source,
				sourceEndOffset: block.sourceEndOffset,
				sourceStartOffset: block.sourceStartOffset,
			});
		} catch (error) {
			errors.push({
				blockType: block.blockType,
				code: 'invalid-norna-block',
				line: error?.line ?? block.line,
				source: block.source,
				message: error instanceof Error ? error.message : String(error),
			});
		}
	}

	return { blocks, errors };
};

const stripRenderedTags = (value) => value.replace(/<[^>]*>/g, '');
const decodeRenderedEntities = (value) => value
	.replace(/&amp;/g, '&')
	.replace(/&lt;/g, '<')
	.replace(/&gt;/g, '>')
	.replace(/&quot;/g, '"')
	.replace(/&#39;/g, "'");
const normalizeRenderedBlockSource = (value) => value.replace(/\r\n?/g, '\n').trim();

/**
 * Splits rendered HTML at Norna markers. During an Astro content hot reload,
 * custom code nodes can occasionally arrive as highlighted code instead of
 * their marker; match that output against the already validated source block.
 *
 * @template {{ type: string, source?: string }} Block
 * @param {string} html
 * @param {Block[]} blocks
 * @returns {Array<{ type: 'html', html: string } | Block>}
 */
export const splitNornaRenderedBlocks = (html, blocks) => {
	const markerRegex = /<norna-block\s+data-index="(\d+)"\s*><\/norna-block>/g;
	const markerMatches = [...html.matchAll(markerRegex)];
	let replacements;

	if (markerMatches.length > 0) {
		const seen = new Set();
		replacements = markerMatches.map((match) => {
			const blockIndex = Number.parseInt(match[1] ?? '', 10);
			if (!blocks[blockIndex]) {
				throw new Error(`Rendered Norna block ${blockIndex + 1} has no matching parsed block.`);
			}
			if (seen.has(blockIndex)) {
				throw new Error(`Rendered Norna block ${blockIndex + 1} appears more than once.`);
			}
			seen.add(blockIndex);
			return { match, blockIndex };
		});

		if (seen.size !== blocks.length) {
			throw new Error(`Rendered Markdown contains ${seen.size} Norna block markers, but ${blocks.length} blocks were parsed.`);
		}
	} else {
		const codeRegex = /<pre\b[^>]*>\s*<code\b[^>]*>([\s\S]*?)<\/code>\s*<\/pre>/g;
		const candidates = [...html.matchAll(codeRegex)].map((match) => ({
			match,
			source: normalizeRenderedBlockSource(decodeRenderedEntities(stripRenderedTags(match[1] ?? ''))),
		}));
		const solutions = [];
		const findSolutions = (blockIndex, candidateIndex, selected) => {
			if (solutions.length > 1) return;
			if (blockIndex === blocks.length) {
				solutions.push([...selected]);
				return;
			}

			const source = normalizeRenderedBlockSource(blocks[blockIndex]?.source ?? '');
			for (let index = candidateIndex; index < candidates.length; index += 1) {
				if (candidates[index].source !== source) continue;
				selected.push(index);
				findSolutions(blockIndex + 1, index + 1, selected);
				selected.pop();
			}
		};
		findSolutions(0, 0, []);

		if (solutions.length === 0) {
			throw new Error(`Rendered Markdown contains 0 Norna block markers, but ${blocks.length} blocks were parsed.`);
		}
		if (solutions.length > 1) {
			throw new Error('Rendered Markdown contains ambiguous plain-code matches for Norna blocks. Restart the local preview to rebuild the Markdown content cache.');
		}

		replacements = solutions[0].map((candidateIndex, blockIndex) => ({
			match: candidates[candidateIndex].match,
			blockIndex,
		}));
	}

	const result = [];
	let cursor = 0;
	for (const { match, blockIndex } of replacements) {
		const start = match.index ?? 0;
		if (start > cursor) result.push({ type: 'html', html: html.slice(cursor, start) });
		result.push(blocks[blockIndex]);
		cursor = start + match[0].length;
	}
	if (cursor < html.length) result.push({ type: 'html', html: html.slice(cursor) });

	return result.filter((block) => block.type !== 'html' || block.html.trim());
};

const maskFencedCodeBlocks = (markdown) => {
	const lines = normalizeLines(markdown);
	const maskedLines = [];
	let index = 0;

	while (index < lines.length) {
		const fence = getFenceInfo(lines[index]);
		if (!fence || fence.length < 3) {
			maskedLines.push(lines[index]);
			index += 1;
			continue;
		}

		let closingIndex = -1;
		for (let candidateIndex = index + 1; candidateIndex < lines.length; candidateIndex += 1) {
			if (getFenceCloseInfo(lines[candidateIndex], fence)) {
				closingIndex = candidateIndex;
				break;
			}
		}

		if (closingIndex === -1) {
			maskedLines.push(lines[index]);
			index += 1;
			continue;
		}

		for (let maskedIndex = index; maskedIndex <= closingIndex; maskedIndex += 1) {
			maskedLines.push(lines[maskedIndex].replace(/[^\r\n]/g, ' '));
		}
		index = closingIndex + 1;
	}

	return maskedLines.join('\n');
};

const isExternalImageTarget = (target) => /^[a-z][a-z0-9+.-]*:/i.test(target) || target.startsWith('//');
const isRootRelativePublicTarget = (target) => target.startsWith('/');

export const extractMarkdownImageReferences = (markdown) => {
	const masked = maskFencedCodeBlocks(markdown);
	const references = [];
	const imageRegex = /!\[[^\]\n]*\]\(([^)\s]+)(?:\s+["'][^"']*["'])?\)/g;

	for (const match of masked.matchAll(imageRegex)) {
		const target = match[1] ?? '';
		if (!target || target.startsWith('#') || isExternalImageTarget(target) || isRootRelativePublicTarget(target)) continue;

		references.push({
			target,
			line: getLineNumber(markdown, match.index ?? 0),
		});
	}

	return references;
};

export const getNornaBlockImageReferences = (blocks) =>
	blocks.flatMap((block) => {
		if (block.type === 'card-list') {
			return block.cards
				.filter((card) => card.image)
				.map((card) => ({
					image: card.image,
					alt: card.title,
					blockType: block.blockType,
					blockDisplayType: block.type,
					line: card.line ?? block.line,
				}));
		}
		if (block.type === 'page-list') return [];

		return block.images.map((image) => ({
			...image,
			blockType: block.blockType,
			blockDisplayType: block.type,
			line: image.line ?? block.line,
		}));
	});

export { extractInlineNoteDiagnostics } from './markdown-notes.mjs';
