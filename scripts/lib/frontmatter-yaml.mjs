const countIndent = (line) => line.match(/^\s*/)?.[0].length ?? 0;

const stripInlineComment = (value) => {
	let quote = null;

	for (let index = 0; index < value.length; index += 1) {
		const character = value[index];
		const previous = value[index - 1];

		if ((character === '"' || character === "'") && previous !== '\\') {
			quote = quote === character ? null : quote ?? character;
			continue;
		}

		if (character === '#' && quote === null && /\s/.test(previous ?? '')) {
			return value.slice(0, index).trimEnd();
		}
	}

	return value;
};

const parseScalar = (rawValue) => {
	const value = stripInlineComment(rawValue.trim());

	if (value === 'true') return true;
	if (value === 'false') return false;
	if (/^-?\d+(?:\.\d+)?$/.test(value)) return Number(value);
	if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
		return value.slice(1, -1);
	}

	return value;
};

export const parseMapping = (lines, startIndex = 0, baseIndent = -1) => {
	const value = {};
	let index = startIndex;

	while (index < lines.length) {
		const line = lines[index];
		if (!line.trim() || line.trim().startsWith('#')) {
			index += 1;
			continue;
		}

		const indent = countIndent(line);
		if (indent <= baseIndent) break;
		if (line.trim().startsWith('- ')) break;

		const match = line.trim().match(/^([a-zA-Z][a-zA-Z0-9-]*):(?:\s+(.*))?$/);
		if (!match) break;

		const [, key, rawValue] = match;
		if (rawValue === undefined) {
			const parsed = parseMapping(lines, index + 1, indent);
			value[key] = parsed.value;
			index = parsed.nextIndex;
		} else {
			value[key] = parseScalar(rawValue);
			index += 1;
		}
	}

	return { value, nextIndex: index };
};

export const parseYamlMapping = (source) => parseMapping(source.split(/\r?\n/)).value;

export const findMap = (lines, label, parentStart = 0, parentEnd = lines.length, requiredIndent = null) => {
	for (let index = parentStart; index < parentEnd; index += 1) {
		const line = lines[index];
		const match = line.match(/^(\s*)([a-zA-Z][a-zA-Z0-9-]*):\s*$/);
		if (!match || match[2] !== label) continue;
		if (requiredIndent !== null && match[1].length !== requiredIndent) continue;

		return {
			index,
			indent: match[1].length,
			...parseMapping(lines, index + 1, match[1].length),
		};
	}

	return null;
};
