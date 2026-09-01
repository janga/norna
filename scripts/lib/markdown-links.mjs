const getNodeRange = (node) => {
	const start = node.position?.start.offset;
	const end = node.position?.end.offset;
	return Number.isInteger(start) && Number.isInteger(end)
		? { start, end }
		: null;
};

const visitNodes = (node, visit) => {
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

const getInlineLinkTargetRange = (source, node) => {
	const nodeRange = getNodeRange(node);
	if (!nodeRange) return null;
	const childEnd = Array.isArray(node.children)
		? Math.max(nodeRange.start, ...node.children.map((child) => child.position?.end.offset ?? nodeRange.start))
		: nodeRange.start;
	const delimiter = source.indexOf('](', childEnd);
	if (delimiter < 0 || delimiter >= nodeRange.end) return null;
	return scanDestination(source, delimiter + 2, nodeRange.end);
};

const getDefinitionTargetRange = (source, node) => {
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
		definitions.set(node.identifier, node);
	});

	const links = [];
	visitNodes(tree, (node) => {
		if (node.type === 'link') {
			const range = getNodeRange(node);
			const targetRange = getInlineLinkTargetRange(source, node);
			links.push({
				kind: 'markdown-link',
				column: node.position?.start.column ?? 1,
				line: lineOffset + (node.position?.start.line ?? 1),
				range,
				target: node.url ?? '',
				targetRange,
				targetSource: getSourceTarget(source, targetRange, node.url ?? ''),
			});
			return;
		}

		if (node.type !== 'linkReference') return;
		const definition = definitions.get(node.identifier);
		if (!definition) return;
		const targetRange = getDefinitionTargetRange(source, definition);
		links.push({
			kind: 'markdown-reference-link',
			column: node.position?.start.column ?? 1,
			definitionLine: lineOffset + (definition.position?.start.line ?? 1),
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

const getCardLinkTargetRange = (source, lineStart) => {
	const lineEnd = source.indexOf('\n', lineStart);
	const end = lineEnd < 0 ? source.length : lineEnd;
	const line = source.slice(lineStart, end);
	const match = line.match(/^\s*link:\s*(.*?)\s*$/);
	if (!match) return null;

	const value = match[1] ?? '';
	let valueStart = lineStart + (match.index ?? 0) + match[0].indexOf(value);
	let valueEnd = valueStart + value.length;
	if (
		value.length >= 2
		&& (value[0] === '"' || value[0] === "'")
		&& value.at(-1) === value[0]
	) {
		valueStart += 1;
		valueEnd -= 1;
	}

	return { start: valueStart, end: valueEnd };
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
			const targetRange = Number.isInteger(lineStart)
				? getCardLinkTargetRange(source, lineStart)
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
				targetSource: getSourceTarget(source, targetRange, card.link),
			});
		}
	}

	return links;
};
