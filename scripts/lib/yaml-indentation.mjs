const yamlDelimiterRegex = /^---\s*$/;

export const getIndentInfo = (line) => {
	const characters = Array.from(line);
	const indentCharacters = [];

	for (const character of characters) {
		if (character === ' ' || character === '\t' || character === '\u00a0' || character === '\uFFFD' || character === '\u00c2') {
			indentCharacters.push(character);
			continue;
		}

		break;
	}

	return {
		indent: indentCharacters.length,
		hasInvalidWhitespace: indentCharacters.some((character) => character !== ' '),
	};
};

const getNextYamlEntry = (lines, startIndex) => {
	for (let index = startIndex + 1; index < lines.length; index += 1) {
		const line = lines[index];
		if (!line.trim() || line.trim().startsWith('#') || yamlDelimiterRegex.test(line)) {
			continue;
		}

		return {
			index,
			line,
			...getIndentInfo(line),
		};
	}

	return null;
};

export const validateYamlIndentation = (source, addIssue) => {
	const lines = source.split(/\r?\n/);

	for (const [index, line] of lines.entries()) {
		const lineNumber = index + 1;
		const trimmed = line.trim();

		if (!trimmed || trimmed.startsWith('#') || yamlDelimiterRegex.test(line)) {
			continue;
		}

		const { indent, hasInvalidWhitespace } = getIndentInfo(line);

		if (hasInvalidWhitespace) {
			addIssue({
				severity: 'error',
				message: `YAML line ${lineNumber} uses tabs, non-breaking spaces, or invalid whitespace for indentation.`,
				fix: 'Replace the indentation on that line with ordinary spaces.',
			});
			continue;
		}

		if (indent % 2 !== 0) {
			addIssue({
				severity: 'error',
				message: `YAML line ${lineNumber} is indented with ${indent} spaces.`,
				fix: 'Use 2-space indentation levels in YAML.',
			});
		}

		const keyValueMatch = line.match(/^(\s*)[A-Za-z][A-Za-z0-9-]*:\s+(.+)$/);
		if (!keyValueMatch) continue;

		const value = keyValueMatch[2].trim();
		if (value === '|' || value === '>' || value.startsWith('|') || value.startsWith('>')) {
			continue;
		}

		const nextEntry = getNextYamlEntry(lines, index);
		if (!nextEntry || nextEntry.indent <= indent) continue;

		addIssue({
			severity: 'error',
			message: `YAML line ${nextEntry.index + 1} is indented under line ${lineNumber}, but line ${lineNumber} already has a value.`,
			fix: 'Move the later line to the same indentation level as its sibling, or place it under a key that has no value.',
		});
	}
};
