import { markdownToMdast } from 'satteri';
import { parseContentTabs } from './content-tabs.mjs';

const features = { gfm: true, frontmatter: true };
const walk = (node, visit, ancestors = []) => {
	visit(node, ancestors);
	for (const child of node.children ?? []) walk(child, visit, [...ancestors, node]);
};
const start = (node) => node.position?.start.offset ?? 0;
const end = (node) => node.position?.end.offset ?? 0;
const isMargin = (identifier) => identifier.startsWith('margin:');
const inlineTypes = new Set(['text', 'emphasis', 'strong', 'link', 'linkReference', 'inlineCode']);
const voidTags = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr']);

export const noteMarker = (index) => {
	let result = '';
	for (let value = index + 1; value > 0; value = Math.floor((value - 1) / 26)) {
		result = String.fromCharCode(97 + (value - 1) % 26) + result;
	}
	return result;
};

// Satteri owns identity: its AST case-folds names (including ss/eszett), but
// does not NFC-normalize Unicode. Hex is injective and ':' cannot be a heading id.
export const noteTargetKey = (identifier) => Buffer.from(identifier, 'utf8').toString('hex');

const unescapedMatches = (source, pattern) => [...source.matchAll(pattern)].filter((match) => {
	let slashes = 0;
	for (let index = match.index - 1; index >= 0 && source[index] === '\\'; index -= 1) slashes += 1;
	return slashes % 2 === 0;
});

export const extractInlineNoteDiagnostics = (markdown, options = {}) => {
	const source = String(markdown).replace(/\r\n?/g, '\n');
	const tabs = options.tabResult ?? parseContentTabs(source, options);
	const parsedSource = tabs.maskedSource;
	const tree = markdownToMdast(parsedSource, { features });
	const diagnostics = [];
	const definitions = new Map();
	const candidates = new Set();
	const htmlScopes = [];
	const htmlStack = [];
	const colonMarkers = [];
	const lineAt = (offset) => (options.lineOffset ?? 0) + source.slice(0, offset).split('\n').length;
	const issue = (code, message, node, severity = 'error') => {
		const offset = typeof node === 'number' ? node : start(node);
		const line = lineAt(offset);
		diagnostics.push({ code, severity, offset, line, blockType: 'inline-note', message: `${options.label ?? 'Markdown'} line ${line}: ${message}` });
	};
	const checkName = (node) => {
		if (!isMargin(node.identifier)) return;
		if (!node.label.startsWith('margin:')) issue('invalid-note-prefix', 'Write the reserved sidenote prefix in lowercase: "[^margin:name]".', node);
		if (node.identifier === 'margin:') issue('empty-note-name', 'Add a nonempty name after "margin:".', node);
	};

	walk(tree, (node, ancestors) => {
		if (node.type === 'html') {
			const value = node.value.replace(/<!--[\s\S]*?-->/g, (match) => ' '.repeat(match.length));
			for (const match of value.matchAll(/<\/?([a-z][a-z0-9-]*)\b[^>]*>/gi)) {
				const tag = match[1].toLowerCase();
				if (match[0].startsWith('</')) {
					const index = htmlStack.findLastIndex((entry) => entry.tag === tag);
					if (index >= 0) for (const entry of htmlStack.splice(index)) htmlScopes.push({ start: entry.start, end: start(node) + match.index + match[0].length });
				} else if (!voidTags.has(tag) && !match[0].endsWith('/>')) htmlStack.push({ tag, start: start(node) + match.index });
			}
		}
		if (node.type === 'text') {
			const raw = parsedSource.slice(start(node), end(node));
			for (const match of raw.matchAll(/^ {0,3}:{3,}(?:[ \t]+([^\n]+?))?[ \t]*$/gm)) {
				colonMarkers.push({ start: start(node) + match.index, opening: Boolean(match[1]) });
			}
			for (const match of unescapedMatches(raw, /\[\^([^\]\r\n]+)\]/g)) candidates.add(match[1]);
			for (const match of unescapedMatches(raw, /\{note(?:-ref\}|\s*:)/g)) {
				issue('removed-positional-note', 'Positional notes are no longer supported. Use "[^margin:name]" with a matching top-level definition.', start(node) + match.index);
			}
		}
		if (node.type !== 'footnoteDefinition') return;
		checkName(node);
		if (definitions.has(node.identifier)) issue('duplicate-note-definition', `Duplicate definition for "[^${node.label}]". Keep one definition per name.`, node);
		else definitions.set(node.identifier, { node, ancestors, references: [] });
	});
	for (const entry of htmlStack) htmlScopes.push({ start: entry.start, end: source.length });
	const colonStack = [];
	for (const marker of colonMarkers) {
		if (marker.opening) colonStack.push(marker.start);
		else if (colonStack.length) htmlScopes.push({ start: colonStack.pop(), end: marker.start });
	}
	for (const offset of colonStack) htmlScopes.push({ start: offset, end: source.length });
	const inContainer = (node) => htmlScopes.some((scope) => start(node) >= scope.start && start(node) < scope.end)
		|| tabs.groups.some((group) => start(node) >= group.start && start(node) < (group.end ?? source.length));

	// Undefined references are text in MDAST. Supply temporary definitions and
	// parse again so escaped text, code, and identifier matching still belong to
	// Satteri, rather than treating every bracket-shaped string as a reference.
	const referenceTree = candidates.size ? markdownToMdast(`${parsedSource}\n\n${[...candidates].map((name) => `[^${name}]: norna-note-probe`).join('\n')}`, { features }) : tree;
	const references = [];
	walk(referenceTree, (node, ancestors) => {
		if (node.type !== 'footnoteReference' || start(node) >= source.length) return;
		checkName(node);
		const reference = { node, ancestors };
		references.push(reference);
		const definition = definitions.get(node.identifier);
		if (!definition) issue('missing-note-definition', `Missing definition for "[^${node.label}]". Add its definition at the page's top level.`, node);
		else definition.references.push(reference);
		if (isMargin(node.identifier) && (inContainer(node) || ancestors[1]?.type !== 'paragraph'
			|| ancestors.some((ancestor) => !['root', 'paragraph', 'emphasis', 'strong', 'delete'].includes(ancestor.type)))) {
			issue('invalid-sidenote-placement', 'Sidenote references belong in ordinary body paragraphs, outside headings, lists, tables, tabs, and other containers.', node);
		}
	});

	for (const { node, ancestors, references: uses } of definitions.values()) {
		if (ancestors.length !== 1 || inContainer(node)) issue('invalid-note-definition-placement', 'Note definitions belong at the page\'s top level, outside all containers.', node);
		if (uses.length === 0) issue('unused-note-definition', `The definition "[^${node.label}]" is unused. Reference it or remove it.`, node, 'warning');
		if (!isMargin(node.identifier)) continue;
		for (const reference of uses.slice(1)) issue('reused-sidenote', `Sidenote "[^${node.label}]" may be referenced only once. Use an ordinary footnote for reusable material.`, reference.node);
		let valid = node.children.length === 1 && node.children[0].type === 'paragraph';
		for (const child of node.children[0]?.children ?? []) walk(child, (inline) => {
			if (!inlineTypes.has(inline.type)) valid = false;
			if (inline.type === 'text' && /^\s*:{3,}/m.test(inline.value)) valid = false;
		});
		// The augmented tree exposes unresolved nested note references as well.
		if (references.some((reference) => start(reference.node) >= start(node) && start(reference.node) < end(node))) valid = false;
		if (!valid) issue('invalid-sidenote-body', 'A sidenote contains one paragraph with only text, emphasis, strong emphasis, links, and inline code. Move blocks, images, and note references into the page content.', node);
	}

	const notes = [];
	for (const reference of references) {
		const definition = definitions.get(reference.node.identifier);
		if (!definition || !isMargin(reference.node.identifier) || definition.references[0] !== reference) continue;
		const node = definition.node;
		const paragraph = node.children[0];
		const key = noteTargetKey(node.identifier);
		notes.push({
			identifier: node.identifier,
			marker: noteMarker(notes.length),
			id: `norna-note:margin:${key}`,
			referenceId: `norna-note:ref:${key}`,
			referenceOffset: start(reference.node),
			referenceLine: lineAt(start(reference.node)),
			noteLine: lineAt(start(node)),
			markdown: paragraph ? source.slice(start(paragraph), end(paragraph)).replace(/\n {1,4}/g, '\n') : '',
		});
	}
	return { notes, references: references.map(({ node }) => node), definitions: [...definitions.values()].map(({ node }) => node), diagnostics,
		errors: diagnostics.filter((item) => item.severity === 'error'), warnings: diagnostics.filter((item) => item.severity === 'warning') };
};

export const getStructuredSidenoteDiagnostics = (blocks, { label = 'Markdown', regionOffset = 0 } = {}) => {
	const diagnostics = [];
	for (const block of blocks) for (const item of block.images ?? block.cards ?? []) {
		for (const field of ['caption', 'alt', 'title', 'text', 'badge-text']) {
			const value = item[field];
			if (typeof value !== 'string' || !value.includes('[^')) continue;
			const parsed = extractInlineNoteDiagnostics(value);
			if (!parsed.references.some((reference) => isMargin(reference.identifier))) continue;
			const line = item.line ?? block.line;
			diagnostics.push({
				code: 'invalid-sidenote-placement', severity: 'error', line,
				offset: regionOffset + block.startOffset, blockType: 'inline-note',
				message: `${label} line ${line}: Sidenote references are not allowed in the "${field}" field of ${block.type}. Put the reference in an ordinary body paragraph.`,
			});
		}
	}
	return diagnostics;
};
