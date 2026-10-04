import { getNodeRange, getInlineLinkTargetRange, getDefinitionTargetRange, visitNodes } from './markdown-links.mjs';
import { managedImageFilenamePattern } from './structured-blocks.mjs';

const filenamePattern = new RegExp(managedImageFilenamePattern);

// Public URLs and remote resources keep their existing rendering rules.
export const classifyMarkdownImage = (target) => {
	if (/^(?:[a-z][a-z0-9+.-]*:|\/|#)/i.test(target)) return { kind: 'external' };
	let decoded;
	try { decoded = decodeURIComponent(target); } catch { return { kind: 'invalid' }; }
	const image = decoded.replace(/^(?:\.\/)?images\//, '');
	return filenamePattern.test(image) ? { kind: 'managed', image } : { kind: 'invalid' };
};

export const getImageDefinitions = (tree) => {
	const definitions = new Map();
	visitNodes(tree, (node) => {
		if (node.type === 'definition' && !definitions.has(node.identifier)) definitions.set(node.identifier, node);
	});
	return definitions;
};

export const extractMarkdownImageReferences = ({ source, tree, lineOffset = 0 }) => {
	const definitions = getImageDefinitions(tree);
	const references = [];
	visitNodes(tree, (node) => {
		if (!['image', 'imageReference'].includes(node.type)) return;
		const destination = node.type === 'image' ? node : definitions.get(node.identifier);
		if (!destination) return;
		const target = destination.url ?? '';
		const classification = classifyMarkdownImage(target);
		if (classification.kind === 'external') return;
		const targetRange = node.type === 'image'
			? getInlineLinkTargetRange(source, node)
			: getDefinitionTargetRange(source, destination);
		references.push({
			...classification,
			target,
			alt: node.alt ?? '',
			title: destination.title,
			line: lineOffset + (node.position?.start.line ?? 1),
			blockType: 'markdown-image',
			blockDisplayType: 'Markdown image',
			range: getNodeRange(node),
			targetRange,
			targetSource: targetRange ? source.slice(targetRange.start, targetRange.end) : target,
			definitionSource: node.type === 'imageReference' ? source.slice(destination.position.start.offset, destination.position.end.offset) : undefined,
		});
	});
	return references;
};

export const markdownImageDiagnostic = (reference, label) => ({
	code: 'invalid-markdown-image',
	severity: 'error',
	line: reference.line,
	message: `${label} line ${reference.line}: Local Markdown image "${reference.target}" must identify a supported file in this page's images/ folder.`,
	fix: 'Use images/name.jpg (or .jpeg, .png, .svg), with a filename containing letters, numbers, dots or hyphens. Norna also accepts ./images/name.jpg and the bare filename.',
});
