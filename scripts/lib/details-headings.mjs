import { parseFragment } from 'parse5';

export const getDetailsHeadingDiagnostics = (tree, { source, label, lineOffset = 0 }) => {
	if (!/<details[\s/>]/i.test(source)) return [];
	const lines = source.split('\n');
	const lineStarts = [];
	let offset = 0;
	for (const line of lines) {
		lineStarts.push(offset);
		offset += line.length + 1;
	}
	const html = source.replace(/[^\n]/g, ' ').split('');
	const headings = [];
	const visitMarkdown = (node) => {
		if (node.type === 'heading') headings.push(node.position.start.offset);
		if (node.type === 'html') {
			// Keep only parsed HTML, preserving source offsets and stripping list/quote
			// prefixes. Literal HTML in Markdown code or escapes never reaches parse5.
			for (const [index, value] of node.value.split('\n').entries()) {
				const lineIndex = node.position.start.line - 1 + index;
				const column = index === 0 ? node.position.start.column - 1 : lines[lineIndex].indexOf(value);
				const start = lineStarts[lineIndex] + column;
				for (let i = 0; i < value.length; i += 1) html[start + i] = value[i];
			}
		}
		for (const child of node.children ?? []) visitMarkdown(child);
	};
	visitMarkdown(tree);
	const fragment = parseFragment(html.join(''), { sourceCodeLocationInfo: true });
	const disclosures = [];
	const visitHtml = (node) => {
		const location = node.sourceCodeLocation;
		if (location && node.tagName === 'details') {
			disclosures.push({
				start: location.startTag.endOffset,
				end: location.endTag?.startOffset ?? location.endOffset,
			});
		}
		if (location && /^h[1-6]$/.test(node.tagName)) headings.push(location.startOffset);
		for (const child of node.childNodes ?? []) visitHtml(child);
		if (node.content) visitHtml(node.content);
	};
	visitHtml(fragment);
	const fix = 'Move the heading outside <details>, or use bold text inside it.';
	return [...new Set(headings)].sort((a, b) => a - b)
		.filter((start) => disclosures.some((details) => start >= details.start && start < details.end))
		.map((start) => {
			const line = lineOffset + source.slice(0, start).split('\n').length;
			return {
				code: 'heading-inside-details',
				severity: 'error',
				offset: start,
				line,
				message: `${label} line ${line}: Headings H1-H6 are not allowed inside <details>, including <summary>.`,
				fix,
			};
		});
};
