import { readFile } from 'node:fs/promises';
import { parseYamlMapping } from './frontmatter-yaml.mjs';
import {
	sitewideContentLabel,
	sitewideContentPath,
} from './site-paths.mjs';
import {
	splitSiteFile,
	validateFrontmatterIndentation,
	validateSitewideFrontmatterStructure,
} from './site-content.mjs';

export const readSitewideContent = async () => {
	const source = await readFile(sitewideContentPath, 'utf8').catch((error) => {
		if (error?.code === 'ENOENT') return null;
		throw error;
	});

	if (!source) return {};

	const { frontmatter, frontmatterBody } = splitSiteFile(source, sitewideContentLabel);
	const issues = [];
	validateFrontmatterIndentation(frontmatter, (issue) => issues.push(issue));
	validateSitewideFrontmatterStructure(frontmatter, (issue) => issues.push(issue));

	if (issues.length > 0) {
		throw new Error([
			`${sitewideContentLabel} has invalid frontmatter.`,
			...issues.map((issue) => `- ${issue.message}`),
		].join('\n'));
	}

	return parseYamlMapping(frontmatterBody);
};
