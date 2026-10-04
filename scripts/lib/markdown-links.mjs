export const getNodeRange = (node) => {
	const start = node.position?.start.offset;
	const end = node.position?.end.offset;
	return Number.isInteger(start) && Number.isInteger(end)
		? { start, end }
		: null;
};

export const visitNodes = (node, visit) => {
	if (!node || typeof node !== 'object') return;
	visit(node);
	if (!Array.isArray(node.children)) return;
	for (const child of node.children) visitNodes(child, visit);
};

const scanDestination = (source, start, end) => {
	let cursor = start;
	while (cursor < end && /\s/.test(source[cursor] ?? '')) cursor += 1;

	if (source[cursor] === '<') {
		const targetStart = cursor + 1;
		for (cursor = targetStart; cursor < end; cursor += 1) {
			if (source[cursor] === '>' && source[cursor - 1] !== '\\') {
				return { start: targetStart, end: cursor };
			}
		}
		return null;
	}

	const targetStart = cursor;
	let parenthesisDepth = 0;
	let escaped = false;
	for (; cursor < end; cursor += 1) {
		const character = source[cursor] ?? '';
		if (escaped) {
			escaped = false;
			continue;
		}
		if (character === '\\') {
			escaped = true;
			continue;
		}
		if (character === '(') {
			parenthesisDepth += 1;
			continue;
		}
		if (character === ')') {
			if (parenthesisDepth === 0) break;
			parenthesisDepth -= 1;
			continue;
		}
		if (/\s/.test(character) && parenthesisDepth === 0) break;
	}

	return { start: targetStart, end: cursor };
};

export const getInlineLinkTargetRange = (source, node) => {
	const nodeRange = getNodeRange(node);
	if (!nodeRange) return null;
	if (node.type === 'image') {
		let depth = 1;
		for (let cursor = nodeRange.start + 2; cursor < nodeRange.end; cursor += 1) {
			if (source[cursor] === '\\') { cursor += 1; continue; }
			if (source[cursor] === '`') {
				const run = source.slice(cursor).match(/^`+/)[0];
				const followingRuns = source.slice(cursor + run.length, nodeRange.end).matchAll(/`+/g);
				const closing = [...followingRuns].find((match) => match[0].length === run.length);
				if (closing) { cursor += run.length + closing.index + run.length - 1; continue; }
				cursor += run.length - 1;
				continue;
			}
			if (source[cursor] === '[') depth += 1;
			if (source[cursor] === ']' && --depth === 0) {
				return source[cursor + 1] === '(' ? scanDestination(source, cursor + 2, nodeRange.end) : null;
			}
		}
		return null;
	}
	const childEnd = Array.isArray(node.children)
		? Math.max(nodeRange.start, ...node.children.map((child) => child.position?.end.offset ?? nodeRange.start))
		: nodeRange.start;
	const delimiter = source.indexOf('](', childEnd);
	if (delimiter < 0 || delimiter >= nodeRange.end) return null;
	return scanDestination(source, delimiter + 2, nodeRange.end);
};

export const getDefinitionTargetRange = (source, node) => {
	const nodeRange = getNodeRange(node);
	if (!nodeRange) return null;
	const delimiter = source.indexOf(']:', nodeRange.start);
	if (delimiter < 0 || delimiter >= nodeRange.end) return null;
	return scanDestination(source, delimiter + 2, nodeRange.end);
};

const getSourceTarget = (source, range, fallback) => range
	? source.slice(range.start, range.end)
	: fallback;

export const extractMarkdownLinks = ({ source, tree, lineOffset = 0 }) => {
	const definitions = new Map();
	visitNodes(tree, (node) => {
		if (node.type !== 'definition') return;
		if (!definitions.has(node.identifier)) definitions.set(node.identifier, node);
	});

	const links = [];
	visitNodes(tree, (node) => {
		if (node.type === 'link' || node.type === 'image' && /^(?:\/|https?:)/i.test(node.url ?? '')) {
			const range = getNodeRange(node);
			const targetRange = getInlineLinkTargetRange(source, node);
			links.push({
				kind: node.type === 'image' ? 'markdown-image-link' : 'markdown-link',
				column: node.position?.start.column ?? 1,
				line: lineOffset + (node.position?.start.line ?? 1),
				range,
				target: node.url ?? '',
				targetRange,
				targetSource: getSourceTarget(source, targetRange, node.url ?? ''),
			});
			return;
		}

		if (!['linkReference', 'imageReference'].includes(node.type)) return;
		const definition = definitions.get(node.identifier);
		if (!definition || node.type === 'imageReference' && !/^(?:\/|https?:)/i.test(definition.url ?? '')) return;
		const targetRange = getDefinitionTargetRange(source, definition);
		links.push({
			kind: 'markdown-reference-link',
			column: node.position?.start.column ?? 1,
			definitionLine: lineOffset + (definition.position?.start.line ?? 1),
			definitionSource: source.slice(definition.position.start.offset, definition.position.end.offset),
			line: lineOffset + (node.position?.start.line ?? 1),
			range: getNodeRange(node),
			target: definition.url ?? '',
			targetRange,
			targetSource: getSourceTarget(source, targetRange, definition.url ?? ''),
		});
	});

	return links;
};

const getLineOffsets = (source) => {
	const offsets = [0];
	for (let index = 0; index < source.length; index += 1) {
		if (source[index] === '\n') offsets.push(index + 1);
	}
	return offsets;
};

export const extractNornaBlockLinks = ({ source, blocks, lineOffset = 0 }) => {
	const lineOffsets = getLineOffsets(source);
	const links = [];

	for (const block of blocks) {
		if (block.type !== 'card-list') continue;
		for (const card of block.cards) {
			if (!card.link || !card.linkLine) continue;
			const localLine = card.linkLine - lineOffset;
			const lineStart = lineOffsets[localLine - 1];
			const targetRange = card.linkRange && Number.isInteger(block.sourceStartOffset)
				? { start: block.sourceStartOffset + card.linkRange.start, end: block.sourceStartOffset + card.linkRange.end }
				: null;
			links.push({
				kind: 'card-link',
				column: targetRange && Number.isInteger(lineStart)
					? targetRange.start - lineStart + 1
					: 3,
				line: card.linkLine,
				range: targetRange,
				target: card.link,
				targetRange,
				targetSource: card.link,
				yamlScalar: true,
			});
		}
	}

	return links;
};
