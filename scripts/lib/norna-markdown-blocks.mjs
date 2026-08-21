import { Buffer } from 'node:buffer';

export const nornaBlockTypes = new Set(['norna-image-stack', 'norna-image-carousel', 'norna-card-list']);

const blockTypeLabels = {
	'norna-image-stack': 'norna-image-stack',
	'norna-image-carousel': 'norna-image-carousel',
	'norna-card-list': 'norna-card-list',
};

const knownBlockTypeList = Array.from(nornaBlockTypes).join(', ');
const imageNameRegex = /^[a-z0-9][a-z0-9.-]*\.(jpe?g|png|svg)$/i;
const markerTagName = 'norna-media-block';
const imageStackExample = [
	'```norna-image-stack',
	'- image: filename.jpg',
	'```',
].join('\n');
const cardListExample = [
	'```norna-card-list',
	'layout: image-top',
	'flow: grid',
	'size: m',
	'width: normal',
	'',
	'- title: Adopt',
	'  text: Give a dog a new home.',
	'  image: adopt.jpg',
	'  link: /adopt/',
	'  badge-text: Recommended',
	'```',
].join('\n');
const cardListLayouts = new Set(['image-top', 'image-left', 'image-right']);
const cardListFlows = new Set(['grid', 'stack']);
const cardListSizes = new Set(['s', 'm', 'l', 'xl']);
const cardListWidths = new Set(['text', 'narrow', 'normal', 'wide']);

const formatLocation = ({ label, line } = {}) => [
	label,
	line ? `line ${line}` : null,
].filter(Boolean).join(' ');

const fail = (message, options) => {
	const location = formatLocation(options);
	throw new Error(location ? `${location}: ${message}` : message);
};

const getUnknownNornaBlockMessage = (type) => [
	`Unknown Norna block "${type}". Use one of: ${knownBlockTypeList}.`,
	type === 'norna-gallery-stack'
		? 'Use norna-image-stack for one or more stacked images.'
		: null,
	type === 'norna-carousel'
		? 'Use norna-image-carousel for an image carousel.'
		: null,
	type === 'norna-image'
		? 'Use norna-image-stack for a single image or a stacked list of images.'
		: null,
	'Example:',
	imageStackExample,
].filter(Boolean).join(' ');

const decodeScalar = (value) => {
	const trimmed = value.trim();
	const quoted = trimmed.match(/^(['"])([\s\S]*)\1$/);
	return quoted ? quoted[2] : trimmed;
};

const parseKeyValue = (line, options) => {
	const match = line.match(/^(\s*)([a-z][a-z0-9-]*):\s*(.*?)\s*$/);
	if (!match) {
		fail(`Invalid ${options.type} entry "${line.trim()}". Use "key: value" lines.`, options);
	}

	return {
		indent: match[1].length,
		key: match[2],
		value: decodeScalar(match[3]),
	};
};

const validateImage = (image, options) => {
	if (!image.image) {
		fail(`${options.type} image is missing "image".`, options);
	}

	if (!imageNameRegex.test(image.image)) {
		if (/\.(?:jpe?g|png|svg)\s+[a-z][a-z0-9-]*:/i.test(image.image)) {
			fail(`Image entry "${image.image}" looks like multiple fields on one line. Put image, alt and caption on separate lines. Example:\n${imageStackExample}`, options);
		}

		fail(`Image reference "${image.image}" must be a filename ending in jpg, jpeg, png, or svg.`, options);
	}
};

const validateOptionalImage = (image, options) => {
	if (!image) return;
	validateImage({ image }, options);
};

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

const getNornaLineAttempt = (line) => {
	const match = line.match(/^ {0,3}([`~]{0,2})(norna-[a-z0-9-]+)\s*$/);
	if (!match) return null;

	return {
		marker: match[1],
		type: match[2],
	};
};

const getNornaFenceStartMessage = (type, marker = '') => {
	const example = type === 'norna-card-list' ? cardListExample : `\`\`\`${type}\n- image: filename.jpg\n\`\`\``;
	if (marker) {
		return `Invalid Norna block start for "${type}". Use three backticks or three tildes. Example:\n${example}`;
	}

	return `Found "${type}" outside a code block. Start the block like this:\n${example}`;
};

const getUnclosedNornaBlockMessage = (opening) =>
	`This Norna block was started on line ${opening.line} but not closed. Add a closing ${opening.markerCharacter.repeat(opening.length)} line after the last entry.`;

const scanMarkdownFencedBlocks = (markdown, options = {}) => {
	const lines = normalizeLines(markdown);
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

		const isNornaLike = type.startsWith('norna-');
		if (closingIndex === -1) {
			if (isNornaLike) {
				errors.push({
					blockType: type,
					line: lineNumber,
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
					line: lineNumber,
					source,
					sourceLine: lineNumber + 1,
				});
			} else {
				errors.push({
					blockType: type,
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

const parseImageListBlock = (source, options = {}) => {
	const images = [];
	const allowedKeys = new Set(['alt', 'caption']);
	let current = null;

	for (const [index, line] of normalizeLines(source).entries()) {
		if (!line.trim()) continue;

		const lineNumber = (options.line ?? 1) + index;
		const itemMatch = line.match(/^(\s*)-\s+image:\s*(.*?)\s*$/);
		if (itemMatch) {
			current = { image: decodeScalar(itemMatch[2]) };
			images.push(current);
			continue;
		}

		if (!current) {
			fail(`Invalid ${options.type} entry "${line.trim()}". Start each image with "- image: filename.jpg". Example:\n${imageStackExample}`, { ...options, line: lineNumber });
		}

		const entry = parseKeyValue(line, { ...options, line: lineNumber });
		if (entry.indent !== 2) {
			fail(`Invalid indentation in ${options.type}. Use two spaces before optional image fields such as alt and caption. Example:\n${imageStackExample}`, { ...options, line: lineNumber });
		}

		if (!allowedKeys.has(entry.key)) {
			fail(`Unknown ${options.type} field "${entry.key}".`, { ...options, line: lineNumber });
		}

		current[entry.key] = entry.value;
	}

	for (const image of images) {
		validateImage(image, options);
	}

	if (images.length === 0) {
		fail(`${options.type} must contain at least one image. Example:\n${imageStackExample}`, options);
	}

	return { type: options.type === 'norna-image-carousel' ? 'image-carousel' : 'image-stack', images };
};

const parseCardListBlock = (source, options = {}) => {
	const cards = [];
	const allowedKeys = new Set(['text', 'image', 'link', 'badge-text']);
	let layout = 'image-top';
	let flow = 'grid';
	let size = 'm';
	let width = 'normal';
	let current = null;

	for (const [index, line] of normalizeLines(source).entries()) {
		if (!line.trim()) continue;

		const lineNumber = (options.line ?? 1) + index;
		const itemMatch = line.match(/^(\s*)-\s+title:\s*(.*?)\s*$/);
		if (itemMatch) {
			current = { title: decodeScalar(itemMatch[2]) };
			cards.push(current);
			continue;
		}

		if (!current) {
			if (/^\s*-\s+/.test(line)) {
				fail(`Invalid ${options.type} entry "${line.trim()}". Start each card with "- title: Card title". Example:\n${cardListExample}`, { ...options, line: lineNumber });
			}

			const optionEntry = parseKeyValue(line, { ...options, line: lineNumber });
			if (optionEntry.indent !== 0) {
				fail(`Invalid ${options.type} entry "${line.trim()}". Start each card with "- title: Card title". Example:\n${cardListExample}`, { ...options, line: lineNumber });
			}

			if (optionEntry.key === 'layout') {
				if (!cardListLayouts.has(optionEntry.value)) {
					fail(`Invalid ${options.type} layout "${optionEntry.value}". Use one of: ${Array.from(cardListLayouts).join(', ')}.`, { ...options, line: lineNumber });
				}

				layout = optionEntry.value;
				continue;
			}

			if (optionEntry.key === 'flow') {
				if (!cardListFlows.has(optionEntry.value)) {
					fail(`Invalid ${options.type} flow "${optionEntry.value}". Use one of: ${Array.from(cardListFlows).join(', ')}.`, { ...options, line: lineNumber });
				}

				flow = optionEntry.value;
				continue;
			}

			if (optionEntry.key === 'size') {
				if (!cardListSizes.has(optionEntry.value)) {
					fail(`Invalid ${options.type} size "${optionEntry.value}". Use one of: ${Array.from(cardListSizes).join(', ')}.`, { ...options, line: lineNumber });
				}

				size = optionEntry.value;
				continue;
			}

			if (optionEntry.key === 'width') {
				if (!cardListWidths.has(optionEntry.value)) {
					fail(`Invalid ${options.type} width "${optionEntry.value}". Use one of: ${Array.from(cardListWidths).join(', ')}.`, { ...options, line: lineNumber });
				}

				width = optionEntry.value;
				continue;
			}

			fail(`Unknown ${options.type} option "${optionEntry.key}". Use layout, flow, size, width, or start the first card with "- title: Card title".`, { ...options, line: lineNumber });
		}

		const entry = parseKeyValue(line, { ...options, line: lineNumber });
		if (entry.indent === 0 && (entry.key === 'layout' || entry.key === 'flow' || entry.key === 'size' || entry.key === 'width')) {
			fail(`${options.type} option "${entry.key}" must appear before the first card.`, { ...options, line: lineNumber });
		}

		if (entry.indent !== 2) {
			fail(`Invalid indentation in ${options.type}. Use two spaces before card fields such as text, image, link and badge-text. Example:\n${cardListExample}`, { ...options, line: lineNumber });
		}

		if (!allowedKeys.has(entry.key)) {
			fail(`Unknown ${options.type} field "${entry.key}". Use title, text, image, link, or badge-text.`, { ...options, line: lineNumber });
		}

		current[entry.key] = entry.value;
	}

	for (const card of cards) {
		if (!card.title) {
			fail(`${options.type} card is missing "title".`, options);
		}

		if (!card.text && !card.image && !card.link) {
			fail(`${options.type} card "${card.title}" must specify at least one of text, image, or link.`, options);
		}

		validateOptionalImage(card.image, options);
	}

	if (cards.length === 0) {
		fail(`${options.type} must contain at least one card. Example:\n${cardListExample}`, options);
	}

	return { type: 'card-list', layout, flow, size, width, cards };
};

export const parseNornaMarkdownBlock = (type, source, options = {}) => {
	if (!nornaBlockTypes.has(type)) {
		fail(getUnknownNornaBlockMessage(type), options);
	}

	const parseOptions = { ...options, type: blockTypeLabels[type] };
	return type === 'norna-card-list'
		? parseCardListBlock(source, parseOptions)
		: parseImageListBlock(source, parseOptions);
};

const getLineNumber = (source, index) => source.slice(0, index).split(/\r?\n/).length;

export const extractNornaMarkdownBlocks = (markdown, options = {}) => {
	const blocks = [];
	const { blocks: scannedBlocks, errors } = scanMarkdownFencedBlocks(markdown, options);

	if (errors.length > 0) {
		throw new Error(errors[0].message);
	}

	for (const block of scannedBlocks) {
		blocks.push({
			...parseNornaMarkdownBlock(block.blockType, block.source, { ...options, line: block.sourceLine }),
			blockType: block.blockType,
			line: block.line,
			source: block.source,
		});
	}

	return blocks;
};

export const extractNornaMarkdownBlockDiagnostics = (markdown, options = {}) => {
	const blocks = [];
	const { blocks: scannedBlocks, errors } = scanMarkdownFencedBlocks(markdown, options);

	for (const block of scannedBlocks) {
		try {
			blocks.push({
				...parseNornaMarkdownBlock(block.blockType, block.source, { ...options, line: block.sourceLine }),
				blockType: block.blockType,
				line: block.line,
				source: block.source,
			});
		} catch (error) {
			errors.push({
				blockType: block.blockType,
				line: block.line,
				source: block.source,
				message: error instanceof Error ? error.message : String(error),
			});
		}
	}

	return { blocks, errors };
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

const stripTags = (value) => value.replace(/<[^>]*>/g, '');

const decodeHtmlEntities = (value) =>
	value
		.replace(/&amp;/g, '&')
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/&quot;/g, '"')
		.replace(/&#39;/g, "'")
		.replace(/&#x([0-9a-f]+);/gi, (_match, hex) => String.fromCodePoint(Number.parseInt(hex, 16)))
		.replace(/&#(\d+);/g, (_match, decimal) => String.fromCodePoint(Number.parseInt(decimal, 10)));

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
					line: block.line,
				}));
		}

		return block.images.map((image) => ({
			...image,
			blockType: block.blockType,
			blockDisplayType: block.type,
			line: block.line,
		}));
	});

export const createNornaMarkdownBlockMarker = (type, source) => {
	const encodedSource = Buffer.from(source, 'utf8').toString('base64');
	return `<${markerTagName} data-type="${type}" data-source="${encodedSource}"></${markerTagName}>`;
};

export const splitNornaMarkdownBlockMarkers = (html, options = {}) => {
	const blocks = [];
	const markerRegex = /<norna-media-block\s+data-type="([^"]+)"\s+data-source="([^"]*)"\s*><\/norna-media-block>|<pre\b([^>]*)>\s*<code\b([^>]*)>([\s\S]*?)<\/code>\s*<\/pre>/g;
	let cursor = 0;

	for (const match of html.matchAll(markerRegex)) {
		const start = match.index ?? 0;
		if (start > cursor) {
			blocks.push({ type: 'html', html: html.slice(cursor, start) });
		}

		if (match[1]) {
			const blockType = match[1];
			const source = Buffer.from(match[2] ?? '', 'base64').toString('utf8');
			blocks.push(parseNornaMarkdownBlock(blockType, source, options));
		} else {
			const attributes = `${match[3] ?? ''} ${match[4] ?? ''}`;
			const blockType = attributes.match(/\blanguage-(norna-[a-z0-9-]+)\b/)?.[1]
				?? attributes.match(/\bdata-language="(norna-[a-z0-9-]+)"/)?.[1];
			if (!nornaBlockTypes.has(blockType)) {
				blocks.push({ type: 'html', html: match[0] });
			} else {
				const source = decodeHtmlEntities(stripTags(match[5] ?? ''));
				blocks.push(parseNornaMarkdownBlock(blockType, source, options));
			}
		}

		cursor = start + match[0].length;
	}

	if (cursor < html.length) {
		blocks.push({ type: 'html', html: html.slice(cursor) });
	}

	return blocks.filter((block) => block.type !== 'html' || block.html.trim());
};

const normalizeBlockSource = (source) => source.replace(/\r\n?/g, '\n').trim();

const inlineNoteReferenceRegex = /\{note-ref\}/g;
const inlineNoteDeclarationOpeningRegex = /^\s*\{note:\s*(.*)$/;
const inlineNoteDeclarationClosingRegex = /^(.*?)\}\s*$/;
const inlineNoteDeclarationStartRegex = /\{note(?:\s*:|\s*\})/;

const maskInlineCodeAndComments = (source) => source.replace(
	/<!--[\s\S]*?-->|(`+)([\s\S]*?)\1/g,
	(match) => match.replace(/[^\r\n]/g, ' '),
);

const countInlineNoteReferences = (line) => Array.from(line.matchAll(inlineNoteReferenceRegex)).length;

const formatInlineNoteError = (message, options, line) => ({
	blockType: 'inline-note',
	line,
	message: failMessage(message, { ...options, line }),
});

const getInlineNoteErrorMessage = () => 'Write the note on its own line as "{note: Short text.}", or end a multiline note with "}".';

const findUnescapedInlineNoteConstruct = (source) => {
	const constructRegex = /\{note(?:-ref\}|\s*:|\s*\})/g;

	for (const match of source.matchAll(constructRegex)) {
		const index = match.index ?? 0;
		let precedingBackslashes = 0;
		for (let cursor = index - 1; cursor >= 0 && source[cursor] === '\\'; cursor -= 1) {
			precedingBackslashes += 1;
		}

		if (precedingBackslashes % 2 === 0) {
			return match[0].startsWith('{note-ref') ? 'reference' : 'note';
		}
	}

	return null;
};

const collectInlineNoteDeclaration = (lines, maskedLines, startIndex) => {
	const openingMatch = (lines[startIndex] ?? '').match(inlineNoteDeclarationOpeningRegex);
	if (!openingMatch) return null;
	const maskedOpeningMatch = (maskedLines[startIndex] ?? '').match(inlineNoteDeclarationOpeningRegex);

	const textLines = [];
	let currentLine = openingMatch[1] ?? '';
	let currentMaskedLine = maskedOpeningMatch?.[1] ?? '';

	for (let index = startIndex; index < lines.length; index += 1) {
		const conflictType = findUnescapedInlineNoteConstruct(currentMaskedLine);
		if (conflictType) {
			return {
				closed: false,
				conflictIndex: index,
				conflictType,
				endIndex: index,
				text: textLines.map((line) => line.trim()).filter(Boolean).join(' '),
			};
		}

		const closingMatch = currentLine.match(inlineNoteDeclarationClosingRegex);
		if (closingMatch) {
			textLines.push(closingMatch[1]);
			return {
				closed: true,
				endIndex: index,
				text: textLines.map((line) => line.trim()).filter(Boolean).join(' '),
			};
		}

		textLines.push(currentLine);
		currentLine = lines[index + 1] ?? '';
		currentMaskedLine = maskedLines[index + 1] ?? '';
	}

	return {
		closed: false,
		endIndex: lines.length - 1,
		text: textLines.map((line) => line.trim()).filter(Boolean).join(' '),
	};
};

const getUnclosedInlineNoteMessage = (noteDeclaration, startLine, lineOffset = 0) => {
	if (noteDeclaration.conflictType === 'note') {
		const conflictLine = lineOffset + noteDeclaration.conflictIndex + 1;
		return `The note starting on line ${startLine} is not closed before another note starts on line ${conflictLine}. Close the first note with "}".`;
	}

	if (noteDeclaration.conflictType === 'reference') {
		const conflictLine = lineOffset + noteDeclaration.conflictIndex + 1;
		return `The note starting on line ${startLine} contains "{note-ref}" on line ${conflictLine}. Close the note before adding a note reference.`;
	}

	return `The note starting on line ${startLine} is not closed. End it with "}" on its own line or at the end of the note text.`;
};

/**
 * Finds the deliberately small inline-note syntax while ignoring fenced and
 * inline code. Notes are paired by position, so no user-authored IDs are
 * needed. The caller decides whether diagnostics should be fatal.
 */
export const extractInlineNoteDiagnostics = (markdown, options = {}) => {
	const lines = normalizeLines(markdown);
	const maskedLines = maskInlineCodeAndComments(maskFencedCodeBlocks(markdown)).split('\n');
	const notes = [];
	const errors = [];
	let paragraph = null;
	let pendingParagraph = null;
	let noteJustSeen = false;

	const addError = (message, line) => errors.push(formatInlineNoteError(message, options, line));

	const finishParagraph = () => {
		if (!paragraph) return;
		if (paragraph.referenceCount > 0) {
			pendingParagraph = paragraph;
		}
		paragraph = null;
	};

	const reportMissingNote = () => {
		if (!pendingParagraph) return;
		addError(
			`Paragraph on line ${pendingParagraph.referenceLine} contains "{note-ref}" but has no following "{note: ...}".`,
			pendingParagraph.referenceLine,
		);
		pendingParagraph = null;
	};

	const attachNote = (text, lineNumber) => {
		if (!text) {
			addError(`The note on line ${lineNumber} is empty. ${getInlineNoteErrorMessage()}`, lineNumber);
			pendingParagraph = null;
			return;
		}

		if (/!\[[^\]]*\]\([^)]*\)|<img\b/i.test(text)) {
			addError('Inline notes cannot contain images. Use a Norna image block with a caption instead.', lineNumber);
			pendingParagraph = null;
			return;
		}

		notes.push({
			markdown: text,
			referenceLine: pendingParagraph.referenceLine,
			noteLine: lineNumber,
		});
		pendingParagraph = null;
		noteJustSeen = true;
	};

	for (let index = 0; index < lines.length; index += 1) {
		const line = lines[index] ?? '';
		const maskedLine = maskedLines[index] ?? line;
		const lineNumber = (options.lineOffset ?? 0) + index + 1;
		const fence = getFenceInfo(line);

		if (fence && fence.length >= 3) {
			finishParagraph();
			reportMissingNote();
			let closingIndex = -1;
			for (let candidateIndex = index + 1; candidateIndex < lines.length; candidateIndex += 1) {
				if (getFenceCloseInfo(lines[candidateIndex], fence)) {
					closingIndex = candidateIndex;
					break;
				}
			}
			index = closingIndex === -1 ? lines.length : closingIndex;
			noteJustSeen = false;
			continue;
		}

		const trimmed = line.trim();
		const maskedTrimmed = maskedLine.trim();
		const startsNoteDeclaration = inlineNoteDeclarationOpeningRegex.test(maskedLine);
		const noteDeclaration = startsNoteDeclaration
			? collectInlineNoteDeclaration(lines, maskedLines, index)
			: null;
		const looksLikeNoteDeclaration = inlineNoteDeclarationStartRegex.test(maskedTrimmed);
		const referenceCount = countInlineNoteReferences(maskedLine);
		const isHeading = /^#{1,6}(?:\s|$)/.test(trimmed);

		if (!trimmed) {
			finishParagraph();
			noteJustSeen = false;
			continue;
		}

		if (pendingParagraph) {
			if (noteDeclaration) {
				if (!noteDeclaration.closed) {
					addError(getUnclosedInlineNoteMessage(noteDeclaration, lineNumber, options.lineOffset), lineNumber);
					pendingParagraph = null;
				} else {
					attachNote(noteDeclaration.text, lineNumber);
				}
				index = noteDeclaration.endIndex;
				continue;
			}

			if (looksLikeNoteDeclaration) {
				addError(`Invalid note syntax on line ${lineNumber}. ${getInlineNoteErrorMessage()}`, lineNumber);
				pendingParagraph = null;
			} else {
				reportMissingNote();
			}
		}

		if (noteJustSeen) {
			addError(`Add a blank line after the note on the previous line before starting more text.`, lineNumber);
			noteJustSeen = false;
		}

		if (noteDeclaration || looksLikeNoteDeclaration) {
			addError(
				noteDeclaration
					? noteDeclaration.closed
						? `A "{note: ...}" requires a preceding paragraph containing "{note-ref}".`
						: getUnclosedInlineNoteMessage(noteDeclaration, lineNumber, options.lineOffset)
					: `Invalid note syntax on line ${lineNumber}. ${getInlineNoteErrorMessage()}`,
				lineNumber,
			);
			if (noteDeclaration) index = noteDeclaration.endIndex;
			continue;
		}

		if (isHeading) {
			if (referenceCount > 0) {
				addError('Place "{note-ref}" in a paragraph, not in a heading.', lineNumber);
			}
			finishParagraph();
			reportMissingNote();
			continue;
		}

		if (!paragraph) {
			paragraph = {
				referenceCount: 0,
				referenceLine: lineNumber,
			};
		}

		paragraph.referenceCount += referenceCount;
		if (referenceCount > 0 && paragraph.referenceCount > 1) {
			addError('A paragraph may contain only one "{note-ref}".', lineNumber);
		}
	}

	finishParagraph();
	reportMissingNote();

	return { notes, errors };
};

export const splitNornaRenderedCodeBlocks = (html, rawBlocks, options = {}) => {
	const blocks = [];
	const renderedCodeRegex = /<pre\b[^>]*>\s*<code\b[^>]*>([\s\S]*?)<\/code>\s*<\/pre>/g;
	let cursor = 0;
	let rawIndex = 0;

	for (const match of html.matchAll(renderedCodeRegex)) {
		const start = match.index ?? 0;
		if (start > cursor) {
			blocks.push({ type: 'html', html: html.slice(cursor, start) });
		}

		const rawBlock = rawBlocks[rawIndex];
		const renderedSource = normalizeBlockSource(decodeHtmlEntities(stripTags(match[1] ?? '')));
		const rawSource = normalizeBlockSource(rawBlock?.source ?? '');

		if (rawBlock && renderedSource === rawSource) {
			blocks.push(parseNornaMarkdownBlock(rawBlock.blockType, rawBlock.source, options));
			rawIndex += 1;
		} else {
			blocks.push({ type: 'html', html: match[0] });
		}

		cursor = start + match[0].length;
	}

	if (cursor < html.length) {
		blocks.push({ type: 'html', html: html.slice(cursor) });
	}

	return blocks.filter((block) => block.type !== 'html' || block.html.trim());
};

const visitCodeBlocks = (node) => {
	if (!node || typeof node !== 'object') return;

	if (Array.isArray(node.children)) {
		for (const child of node.children) {
			visitCodeBlocks(child);
		}
	}

	if (node.type !== 'code' || !nornaBlockTypes.has(node.lang)) return;

	node.type = 'html';
	node.value = createNornaMarkdownBlockMarker(node.lang, node.value ?? '');
	delete node.lang;
	delete node.meta;
};

export const nornaMarkdownBlocksRemarkPlugin = () => (tree) => {
	visitCodeBlocks(tree);
};
