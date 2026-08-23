import { load } from 'js-yaml';
import {
	validateFrontmatterIndentation,
} from './site-content.mjs';

const formatSchemaIssues = (issues) => issues.map((issue) => {
	const location = issue.path.join('.') || '(root)';
	return `- ${location}: ${issue.message}`;
});

export const parseYamlConfig = (source, label, {
	schema,
	validateStructure,
} = {}) => {
	const issues = [];

	validateFrontmatterIndentation(source, (issue) => issues.push(issue));
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
			...formatSchemaIssues(parsed.error.issues),
		].join('\n'));
	}

	return parsed.data;
};
