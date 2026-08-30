import { load } from 'js-yaml';
import {
	validateYamlIndentation,
} from './yaml-indentation.mjs';

const getValueAtPath = (data, path) => path.reduce(
	(value, key) => value?.[key],
	data,
);

const getLegacyThemeHint = (issue, data) => {
	const location = issue.path.join('.');
	const value = getValueAtPath(data, issue.path);

	if (location === 'palette') {
		const replacements = {
			dark: 'near-monochrome',
			light: 'cool-green',
			paper: 'warm-paper',
		};
		if (replacements[value]) {
			return `Palette value "${value}" was replaced by "${replacements[value]}".`;
		}
	}

	if (location === 'corners' && value === 'soft') {
		return 'Corner value "soft" was replaced by "rounded".';
	}

	if (location === 'sections.backgroundPattern' && value === 'cycling') {
		return 'Section background pattern "cycling" was replaced by "accented".';
	}

	if (location === 'readerControls' && issue.keys?.includes('appearance')) {
		return 'Reader control "appearance" was replaced by "colorMode".';
	}

	return undefined;
};

const formatSchemaIssues = (issues, data) => issues.map((issue) => {
	const location = issue.path.join('.') || '(root)';
	return `- ${location}: ${getLegacyThemeHint(issue, data) ?? issue.message}`;
});

export const parseYamlConfig = (source, label, {
	schema,
	validateStructure,
} = {}) => {
	const issues = [];

	validateYamlIndentation(source, (issue) => issues.push(issue));
	validateStructure?.(source, (issue) => issues.push(issue));

	if (issues.length > 0) {
		throw new Error([
			`${label} has invalid YAML structure.`,
			...issues.map((issue) => `- ${issue.message}`),
		].join('\n'));
	}

	let data;
	try {
		data = load(source) ?? {};
	} catch (error) {
		const detail = error instanceof Error ? error.message : String(error);
		throw new Error(`${label} contains invalid YAML.\n${detail}`);
	}

	if (!data || typeof data !== 'object' || Array.isArray(data)) {
		throw new Error(`${label} must contain a YAML mapping at the top level.`);
	}

	if (!schema) return data;

	const parsed = schema.safeParse(data);
	if (!parsed.success) {
		throw new Error([
			`${label} has invalid values.`,
			...formatSchemaIssues(parsed.error.issues, data),
		].join('\n'));
	}

	return parsed.data;
};
