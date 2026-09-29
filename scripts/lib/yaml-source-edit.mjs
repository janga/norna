import { isMap, isScalar, isSeq, parseDocument } from 'yaml';

const collectComments = (token, start, end, comments = []) => {
	if (!token || typeof token !== 'object') return comments;
	if (token.type === 'comment' && token.offset >= start && token.offset < end) comments.push(token.source);
	for (const value of Object.values(token)) {
		if (Array.isArray(value)) for (const item of value) collectComments(item, start, end, comments);
		else if (value && typeof value === 'object') collectComments(value, start, end, comments);
	}
	return comments;
};

export const changeYamlField = (yaml, keys, value, eol) => {
	const document = parseDocument(yaml, { keepSourceTokens: true });
	if (document.errors.length) throw new Error('Repair the YAML before editing it automatically.');
	if (document.contents && !isMap(document.contents)) throw new Error('This YAML document requires a mapping.');
	const scalar = (data) => JSON.stringify(data);
	const entryText = (key, data, indent) => {
		const prefix = ' '.repeat(indent);
		if (Array.isArray(data)) return `${prefix}${key}:${eol}${data.map((entry) => `${prefix}  - ${scalar(entry)}${eol}`).join('')}`;
		return data && typeof data === 'object' && !Array.isArray(data)
			? `${prefix}${key}:${eol}${Object.entries(data).map(([child, value]) => entryText(child, value, indent + 2)).join('')}`
			: `${prefix}${key}: ${scalar(data)}${eol}`;
	};
	const edit = (start, end, text) => yaml.slice(0, start) + text + yaml.slice(end);
	const insert = (map, key, data) => {
		if (!map) return yaml + (yaml && !yaml.endsWith('\n') ? eol : '') + entryText(key, data, 0);
		if (map.flow) {
			const position = map.range[1] - 1;
			const separator = map.items.length && !yaml.slice(0, position).trimEnd().endsWith(',') ? ', ' : '';
			return edit(position, position, `${separator}${key}: ${scalar(data)}`);
		}
		const indent = map.items[0]?.key.srcToken.indent ?? 0;
		const position = map.range[2];
		return edit(position, position, `${position && yaml[position - 1] !== '\n' ? eol : ''}${entryText(key, data, indent)}`);
	};
	const visit = (map, remaining, ancestors = []) => {
		const [key, ...rest] = remaining;
		const pair = map?.items.find((item) => item.key.value === key);
		if (!pair) {
			if (value === undefined) return yaml;
			return insert(map, key, rest.reduceRight((child, part) => ({ [part]: child }), value));
		}
		if (rest.length) {
			if (!isMap(pair.value)) throw new Error(`Edit ${key} as a YAML mapping in the source before editing it automatically.`);
			return visit(pair.value, rest, [...ancestors, { map, pair }]);
		}
		if (value !== undefined) {
			if ((!isScalar(pair.value) && !(Array.isArray(value) && isSeq(pair.value))) || pair.value.anchor || pair.value.tag
				|| (isSeq(pair.value) && pair.value.items.some((item) => !isScalar(item) || item.anchor || item.tag))) {
				throw new Error(`Edit ${keys.join('.')} in the source; this field uses YAML anchors, tags or values that cannot be changed automatically.`);
			}
			if (Array.isArray(value) && !map.flow) {
				// Keep aliases in block form so a later page:move can preserve
				// old addresses without asking the author to reformat our output.
				const start = yaml.lastIndexOf('\n', pair.key.range[0] - 1) + 1;
				const end = pair.value.range[2];
				const indent = pair.key.srcToken.indent ?? 0;
				const comments = collectComments(pair.srcToken, start, end);
				return edit(start, end, comments.map((comment) => `${' '.repeat(indent)}${comment}${eol}`).join('')
					+ entryText(pair.key.value, value, indent));
			}
			const start = pair.value.range[0];
			const end = pair.value.range[1];
			const comments = collectComments(pair.value.srcToken, start, end);
			const trailing = yaml.slice(start, end).endsWith('\n') ? eol : '';
			return edit(start, end, scalar(value) + comments.map((comment) => ` ${comment}`).join('') + trailing);
		}
		return remove(map, pair, ancestors);
	};
	const remove = (map, pair, ancestors) => {
		if (!map.flow && map.items.length === 1 && ancestors.length) {
			const parent = ancestors.pop();
			return remove(parent.map, parent.pair, ancestors);
		}
		let start = pair.key.range[0];
		let end = pair.value?.range[2] ?? pair.key.range[2];
		if (map.flow) {
			end = pair.value?.range[1] ?? pair.key.range[1];
			const index = map.items.indexOf(pair);
			const previousComma = pair.srcToken?.start.find((token) => token.type === 'comma');
			const nextComma = map.items[index + 1]?.srcToken?.start.find((token) => token.type === 'comma');
			if (previousComma) start = previousComma.offset;
			else if (nextComma) end = nextComma.offset + 1;
		} else {
			start = yaml.lastIndexOf('\n', start - 1) + 1;
		}
		const comments = collectComments(pair.srcToken, start, end);
		const indent = pair.key.srcToken.indent ?? 0;
		const replacement = comments.map((comment) => `${' '.repeat(indent)}${comment}${eol}`).join('');
		return edit(start, end, replacement);
	};
	return visit(document.contents, keys);
};
