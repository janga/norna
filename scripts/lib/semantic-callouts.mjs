export const semanticCalloutTypes = Object.freeze([
	'NOTE',
	'TIP',
	'IMPORTANT',
	'WARNING',
	'CAUTION',
	'DANGER',
]);

const semanticCalloutTypeSet = new Set(semanticCalloutTypes);
const markerPattern = /^\[!([A-Za-z][A-Za-z0-9-]*)\]([^\n]*)(?:\n|$)/;

const hasMeaningfulContent = (node) => {
	if (!node || typeof node !== 'object') return false;
	if ('value' in node && typeof node.value === 'string') return node.value.trim().length > 0;
	if (node.type === 'image') return Boolean(node.alt);
	return Array.isArray(node.children) && node.children.some(hasMeaningfulContent);
};

export const getSemanticCalloutMarker = (node) => {
	if (node?.type !== 'blockquote') return null;
	const firstParagraph = node.children?.[0];
	const firstText = firstParagraph?.type === 'paragraph' ? firstParagraph.children?.[0] : null;
	if (firstText?.type !== 'text') return null;

	const match = firstText.value.match(markerPattern);
	if (!match) {
		return firstText.value.startsWith('[!')
			? { malformed: true, firstParagraph, firstText }
			: null;
	}

	const rawType = match[1] ?? '';
	const type = rawType.toUpperCase();
	const markerSource = match[0];
	const title = (match[2] ?? '').trim();
	const firstTextRemainder = firstText.value.slice(markerSource.length);
	const firstParagraphRemainder = [
		{ ...firstText, value: firstTextRemainder },
		...(firstParagraph.children?.slice(1) ?? []),
	];
	const hasBody = firstParagraphRemainder.some(hasMeaningfulContent)
		|| (node.children?.slice(1) ?? []).some(hasMeaningfulContent);

	return {
		firstParagraph,
		firstText,
		firstTextRemainder,
		hasBody,
		malformed: false,
		markerSource,
		rawType,
		supported: semanticCalloutTypeSet.has(type),
		title,
		type,
	};
};

const formatDiagnostic = ({ code, fix, label, line, message, offset }) => ({
	code,
	fix,
	line,
	message: `${label} line ${line}: ${message}`,
	offset,
});

export const getSemanticCalloutDiagnostics = (tree, options = {}) => {
	const diagnostics = [];
	const label = options.label ?? 'Markdown';
	const lineOffset = options.lineOffset ?? 0;

	const visit = (node, blockquoteDepth = 0) => {
		if (!node || typeof node !== 'object') return;
		const nextBlockquoteDepth = blockquoteDepth + (node.type === 'blockquote' ? 1 : 0);
		const marker = getSemanticCalloutMarker(node);

		if (marker) {
			const line = lineOffset + (node.position?.start.line ?? 1);
			const offset = node.position?.start.offset ?? 0;
			let issue = null;

			if (blockquoteDepth > 0) {
				issue = {
					code: 'nested-semantic-callout',
					message: 'Semantic callouts cannot be nested inside another blockquote or callout.',
					fix: 'Move the inner callout after the surrounding blockquote.',
				};
			} else if (marker.malformed) {
				issue = {
					code: 'invalid-semantic-callout-marker',
					message: 'This blockquote starts like a semantic callout but its marker is incomplete.',
					fix: 'Write the marker on its own first line, for example "> [!WARNING]".',
				};
			} else if (marker.rawType !== marker.type) {
				issue = {
					code: 'invalid-semantic-callout-type-case',
					message: `Semantic callout type "${marker.rawType}" must use uppercase ASCII letters.`,
					fix: `Write "> [!${marker.type}]".`,
				};
			} else if (!marker.supported) {
				issue = {
					code: 'unknown-semantic-callout-type',
					message: `Unknown semantic callout type "${marker.rawType}".`,
					fix: `Use one of: ${semanticCalloutTypes.join(', ')}.`,
				};
			} else if (marker.title) {
				issue = {
					code: 'unsupported-semantic-callout-title',
					message: `Semantic callout markers cannot contain a custom title ("${marker.title}").`,
					fix: `Keep "> [!${marker.type}]" on its own line. Begin the callout body with bold text when local emphasis is useful.`,
				};
			} else if (!marker.hasBody) {
				issue = {
					code: 'empty-semantic-callout',
					message: `${marker.type} callout has no content.`,
					fix: 'Add at least one quoted content line after the marker.',
				};
			}

			if (issue) diagnostics.push(formatDiagnostic({ ...issue, label, line, offset }));
		}

		for (const child of node.children ?? []) visit(child, nextBlockquoteDepth);
	};

	visit(tree);
	return diagnostics;
};
