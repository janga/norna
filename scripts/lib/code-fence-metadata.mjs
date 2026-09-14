const titlePrefix = 'title="';
const lineSelectorPattern = /^\{(\d+(?:-\d+)?(?:,\d+(?:-\d+)?)*)\}$/;

const invalidMetadata = (message, fix) => ({
	error: {
		code: 'invalid-code-fence-metadata',
		fix,
		message,
	},
});

export const parseQuotedContentString = (source) => {
	const quoted = source.match(/^"(?:[^"\\]|\\[\s\S])*"/)?.[0];
	if (!quoted) return { error: 'Use a JSON double-quoted string with a closing double quote.' };
	let value;
	try { value = JSON.parse(quoted); } catch {
		return { error: 'Use valid JSON escapes inside the double-quoted string.' };
	}
	if (/[\u0000-\u001f\u007f-\u009f\u2028\u2029]/u.test(value)) {
		return { error: 'Quoted labels and titles cannot contain control characters, including line breaks and tabs.' };
	}
	return { value, rest: source.slice(quoted.length) };
};

const parseHighlightedLines = (selector, lineCount) => {
	const match = selector.match(lineSelectorPattern);
	if (!match) {
		return invalidMetadata(
			`Invalid code line selector "${selector}".`,
			'Use positive line numbers and inclusive ranges without spaces, for example {2,4-6}.',
		);
	}

	const highlightedLines = new Set();
	for (const part of match[1].split(',')) {
		const [startSource, endSource = startSource] = part.split('-');
		const start = Number.parseInt(startSource, 10);
		const end = Number.parseInt(endSource, 10);

		if (start < 1 || end < start) {
			return invalidMetadata(
				`Invalid code line range "${part}".`,
				'Use positive line numbers with the lower number first, for example {2,4-6}.',
			);
		}
		if (Number.isInteger(lineCount) && end > lineCount) {
			return invalidMetadata(
				`Code line selector "${part}" refers to line ${end}, but the block has ${lineCount} ${lineCount === 1 ? 'line' : 'lines'}.`,
				`Select only lines 1-${lineCount}.`,
			);
		}

		for (let line = start; line <= end; line += 1) {
			if (highlightedLines.has(line)) {
				return invalidMetadata(
					`Code line ${line} is selected more than once.`,
					'Remove overlapping or repeated line numbers from the selector.',
				);
			}
			highlightedLines.add(line);
		}
	}

	return { highlightedLines: [...highlightedLines].sort((left, right) => left - right) };
};

export const parseCodeFenceMetadata = (rawMetadata, options = {}) => {
	const source = String(rawMetadata ?? '').trim();
	if (!source) return { highlightedLines: [], title: null };

	let rest = source;
	let title = null;
	if (rest.startsWith(titlePrefix)) {
		const titleResult = parseQuotedContentString(rest.slice('title='.length));
		if (titleResult.error) return invalidMetadata(`Invalid code title. ${titleResult.error}`, 'Write a single-line title, for example title="src/config.js".');
		if (!titleResult.value.trim()) {
			return invalidMetadata(
				'Code title cannot be empty.',
				'Remove title="" or provide a short filename or label.',
			);
		}
		title = titleResult.value;
		rest = titleResult.rest;
		if (rest && !rest.startsWith(' ')) {
			return invalidMetadata(
				'Code title must be separated from the line selector by one space.',
				'Write metadata as title="src/config.js" {2,4-6}.',
			);
		}
		rest = rest.trim();
	}

	if (!rest) return { highlightedLines: [], title };
	if (!rest.startsWith('{')) {
		return invalidMetadata(
			`Unknown code fence metadata "${rest}".`,
			'Use an optional title followed by an optional line selector: title="src/config.js" {2,4-6}.',
		);
	}
	if (/^\{[^}]*\}\s+/.test(rest)) {
		return invalidMetadata(
			'The code line selector must come after the optional title.',
			'Write metadata as title="src/config.js" {2,4-6}.',
		);
	}

	const linesResult = parseHighlightedLines(rest, options.lineCount);
	if (linesResult.error) return linesResult;
	return {
		highlightedLines: linesResult.highlightedLines,
		title,
	};
};

const formatDiagnostic = ({ error, label, line, offset }) => ({
	...error,
	line,
	message: `${label} line ${line}: ${error.message}`,
	offset,
});

export const getCodeFenceMetadataDiagnostics = (tree, options = {}) => {
	const diagnostics = [];
	const label = options.label ?? 'Markdown';
	const lineOffset = options.lineOffset ?? 0;
	const excludedLanguages = options.excludedLanguages ?? new Set();

	const visit = (node) => {
		if (!node || typeof node !== 'object') return;
		if (node.type === 'code' && !excludedLanguages.has(node.lang)) {
			const metadataWithoutLanguage = typeof node.lang === 'string'
				&& (node.lang.startsWith('title=') || node.lang.startsWith('{'));
			const result = metadataWithoutLanguage
				? invalidMetadata(
					'Code fence metadata requires a language before it.',
					'Add a language first, for example ```js title="src/config.js" {2}.',
				)
				: parseCodeFenceMetadata(node.meta, {
				lineCount: String(node.value ?? '').split('\n').length,
				});
			if (result.error) {
				const line = lineOffset + (node.position?.start.line ?? 1);
				diagnostics.push(formatDiagnostic({
					error: result.error,
					label,
					line,
					offset: node.position?.start.offset ?? 0,
				}));
			}
		}

		for (const child of node.children ?? []) visit(child);
	};

	visit(tree);
	return diagnostics;
};

const getTransformerMetadata = (context) => {
	if (!context.meta.nornaCodeFence) {
		const result = parseCodeFenceMetadata(context.options.meta?.__raw, {
			lineCount: context.tokens?.length,
		});
		if (result.error) throw new Error(`${result.error.message} ${result.error.fix}`);
		context.meta.nornaCodeFence = result;
	}
	return context.meta.nornaCodeFence;
};

export const nornaCodeFenceTransformer = {
	name: 'norna-code-fence-metadata',
	line(node, line) {
		const metadata = getTransformerMetadata(this);
		if (!metadata.highlightedLines.includes(line)) return;
		this.addClassToHast(node, 'norna-code-line-highlighted');
		node.properties.dataLine = String(line);
	},
	pre(node) {
		const metadata = getTransformerMetadata(this);
		if (metadata.highlightedLines.length > 0) {
			this.addClassToHast(node, 'norna-code-has-highlighted-lines');
		}
		if (!metadata.title) return;

		return {
			type: 'element',
			tagName: 'figure',
			properties: { className: ['norna-code-example'] },
			children: [
					{
						type: 'element',
						tagName: 'figcaption',
						properties: { className: ['norna-code-title'] },
						children: [{
							type: 'element',
							tagName: 'span',
							properties: { className: ['norna-code-title-text'] },
							children: [{ type: 'text', value: metadata.title }],
						}],
					},
				node,
			],
		};
	},
};
