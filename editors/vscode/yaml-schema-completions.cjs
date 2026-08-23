const { isMap, isPair, isSeq, parseDocument, stringify } = require('yaml');

const containsOffset = (node, offset) => (
	Array.isArray(node?.range)
	&& node.range[0] <= offset
	&& offset <= node.range[2]
);

const findSchemaContext = (node, schema, offset) => {
	if (!node || !schema || !containsOffset(node, offset)) return null;

	if (isMap(node)) {
		for (const pair of node.items) {
			if (!isPair(pair) || typeof pair.key?.value !== 'string' || !containsOffset(pair.value, offset)) continue;
			const propertySchema = schema.properties?.[pair.key.value] ?? schema.additionalProperties;
			return findSchemaContext(pair.value, propertySchema, offset) ?? { node: pair.value, schema: propertySchema };
		}
	}

	if (isSeq(node)) {
		for (const item of node.items) {
			if (!containsOffset(item, offset)) continue;
			return findSchemaContext(item, schema.items, offset) ?? { node: item, schema: schema.items };
		}
	}

	return { node, schema };
};

const indentBlock = (source, indent, continuationIndent) => source
	.split('\n')
	.map((line, index) => `${index === 0 ? indent : continuationIndent}${line}`)
	.join('\n');

const renderSequenceItem = (body, indent) => {
	const source = stringify(body).trimEnd();
	const lines = source.split('\n');
	return `${indent}- ${lines[0]}${lines.length > 1 ? `\n${indentBlock(lines.slice(1).join('\n'), `${indent}  `, `${indent}  `)}` : ''}`;
};

const renderProperty = (key, body, indent) => {
	const source = stringify(body).trimEnd();
	return `${indent}${key}:\n${indentBlock(source, `${indent}  `, `${indent}  `)}`;
};

const getYamlSchemaSnippetCompletions = ({ schema, source, offset, lineText }) => {
	const itemMatch = lineText.match(/^(\s*)-\s*$/);
	const propertyMatch = lineText.match(/^(\s*)([a-zA-Z][a-zA-Z0-9]*):\s*$/);
	if (!itemMatch && !propertyMatch) return [];

	const document = parseDocument(source, { keepSourceTokens: true, strict: false });
	if (document.errors.length > 0 || !document.contents) return [];
	const context = findSchemaContext(document.contents, schema, offset);
	if (!context || !Array.isArray(context.schema?.defaultSnippets)) return [];

	return context.schema.defaultSnippets
		.filter((snippet) => snippet && typeof snippet === 'object' && snippet.body !== undefined)
		.map((snippet) => ({
			documentation: snippet.markdownDescription ?? context.schema.markdownDescription ?? context.schema.description ?? '',
			label: `Norna: ${snippet.label ?? context.schema.title ?? 'Insert item'}`,
			text: itemMatch
				? renderSequenceItem(snippet.body, itemMatch[1])
				: renderProperty(propertyMatch[2], snippet.body, propertyMatch[1]),
		}));
};

module.exports = { getYamlSchemaSnippetCompletions };
