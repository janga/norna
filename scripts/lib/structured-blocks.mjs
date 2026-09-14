import { isAlias, isMap, isScalar, isSeq, LineCounter, parseDocument } from 'yaml';

const stringSchema = (name, definition) => ({
	type: 'string',
	description: definition.description,
	...(definition.default !== undefined ? { default: definition.default } : {}),
	...(definition.values ? { enum: Object.keys(definition.values) } : {}),
	...(name === 'alt' ? {} : { minLength: 1 }),
	pattern: name === 'image'
		? '^[a-zA-Z0-9][a-zA-Z0-9.-]*\\.(?:[jJ][pP][eE]?[gG]|[pP][nN][gG]|[sS][vV][gG])$(?![\\s\\S])'
		: name === 'caption' || name === 'text'
			? '^(?=[\\s\\S]*\\S)[^\\x00-\\x08\\x0B\\x0C\\x0E-\\x1F\\x7F-\\x9F]*$(?![\\s\\S])'
			: name === 'alt'
				? '^(?:|(?=.*\\S)[^\\x00-\\x1F\\x7F-\\x9F\\u2028\\u2029]+)$(?![\\s\\S])'
				: '^(?=.*\\S)[^\\x00-\\x1F\\x7F-\\x9F\\u2028\\u2029]+$(?![\\s\\S])',
});

export const createStructuredBlockSchema = (definition) => {
	if (!definition?.item) return null;
	const fields = { [definition.item.start.key]: definition.item.start, ...definition.item.fields };
	const item = {
		type: 'object',
		additionalProperties: false,
		required: [definition.item.start.key],
		properties: Object.fromEntries(Object.entries(fields).map(([key, field]) => [key, stringSchema(key, field)])),
		...(definition.item.start.key === 'title' ? {
			anyOf: ['text', 'image', 'link'].map((key) => ({ required: [key] })),
		} : {}),
	};
	return {
		$schema: 'https://json-schema.org/draft/2020-12/schema',
		description: definition.description,
		type: 'object',
		additionalProperties: false,
		required: ['items'],
		properties: {
			...Object.fromEntries(Object.entries(definition.options ?? {}).map(([key, field]) => [key, stringSchema(key, field)])),
			items: { type: 'array', minItems: definition.minItems ?? 1, items: item },
		},
	};
};

// Validate the AST directly so errors and later link edits retain exact source ranges.
export const parseStructuredBlock = (source, schema, options = {}) => {
	const lines = new LineCounter();
	const document = parseDocument(source, { schema: 'core', version: '1.2', uniqueKeys: true, lineCounter: lines });
	const lineAt = (node) => (options.line ?? 1) + lines.linePos(node?.range?.[0] ?? 0).line - 1;
	const fail = (message, node) => {
		const line = lineAt(node);
		throw Object.assign(new Error(`${options.label ? `${options.label} ` : ''}line ${line}: ${options.type}: ${message}`), { line });
	};
	if (document.errors.length) {
		const error = document.errors[0];
		fail(`Invalid YAML: ${error.message.split('\n')[0]}`, { range: error.pos });
	}
	if (document.directives.yaml.version !== '1.2') fail('Use YAML 1.2 Core; other YAML versions are not supported.', document.contents);
	const validate = (node, rule, path, depth = 0) => {
		if (depth > 16) fail('YAML nesting is too deep.', node);
		if (node?.anchor || node?.tag || isAlias(node)) fail('YAML anchors, aliases, and explicit tags are not allowed.', node);
		if (rule.type === 'object') {
			if (!isMap(node)) fail(`${path} must be a YAML mapping${path === 'Block' ? ' with an items list' : ''}.`, node);
			const result = {};
			for (const pair of node.items) {
				if (!isScalar(pair.key) || typeof pair.key.value !== 'string') fail(`${path} field names must be strings.`, pair.key);
				if (pair.key.tag || pair.key.anchor) fail('YAML anchors and explicit tags are not allowed.', pair.key);
				const key = pair.key.value;
				if (!Object.hasOwn(rule.properties, key)) fail(`Unknown ${path} field "${key}".`, pair.key);
				result[key] = validate(pair.value, rule.properties[key], `${path}.${key}`, depth + 1);
			}
			for (const key of rule.required ?? []) {
				if (!Object.hasOwn(result, key)) fail(`${path} is missing "${key}".`, node);
			}
			if (rule.anyOf && !rule.anyOf.some((alternative) => alternative.required.every((key) => Object.hasOwn(result, key)))) {
				fail(`${path} must specify at least one of text, image, or link.`, node);
			}
			return result;
		}
		if (rule.type === 'array') {
			if (!isSeq(node)) fail(`${path} must be a YAML list.`, node);
			if (node.items.length < rule.minItems) fail(`${path} must contain at least ${rule.minItems} item.`, node);
			return node.items.map((item, index) => validate(item, rule.items, `${path}[${index + 1}]`, depth + 1));
		}
		if (!isScalar(node) || typeof node.value !== 'string') fail(`${path} must be a string; quote values that YAML would interpret as numbers, booleans, or null.`, node);
		if (rule.enum && !rule.enum.includes(node.value)) fail(`Invalid ${path} "${node.value}". Use one of: ${rule.enum.join(', ')}.`, node);
		if (!new RegExp(rule.pattern).test(node.value)) {
			fail(path.endsWith('.image')
				? 'Image reference must be a filename ending in jpg, jpeg, png, or svg.'
				: `${path} must ${path.endsWith('.alt') ? 'be empty or contain single-line text' : 'contain non-empty text'}${/\.(caption|text)$/.test(path) ? '' : ' without line breaks or control characters'}.`, node);
		}
		return node.value;
	};
	const data = validate(document.contents, schema, 'Block');
	const items = document.get('items', true).items;
	data.items = data.items.map((item, index) => {
		const node = items[index];
		const link = node.get('link', true);
		return {
			...item,
			line: lineAt(node),
			...(link ? {
				linkLine: lineAt(link),
				// A block scalar owns its trailing newline; leave that separator in place when editing the value.
				linkRange: { start: link.range[0], end: source.slice(0, link.range[1]).trimEnd().length },
			} : {}),
		};
	});
	return data;
};
