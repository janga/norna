import { readFile } from 'node:fs/promises';
import { parseYamlMapping } from './frontmatter-yaml.mjs';
import {
	splitSiteFile,
	validateFrontmatterIndentation,
	validateThemeFrontmatterStructure,
} from './site-content.mjs';
import { siteThemeLabel, siteThemePath } from './site-paths.mjs';

const emptyThemeFile = '---\n---\n';

export const readThemeConfig = async () => {
	const themeFile = await readFile(siteThemePath, 'utf8').catch((error) => {
		if (error?.code === 'ENOENT') {
			return emptyThemeFile;
		}

		throw error;
	});
	const { frontmatter, frontmatterBody } = splitSiteFile(themeFile, siteThemeLabel);
	const issues = [];

	validateFrontmatterIndentation(frontmatter, (issue) => issues.push(issue));
	validateThemeFrontmatterStructure(frontmatter, (issue) => issues.push(issue));

	if (issues.length > 0) {
		throw new Error([
			`${siteThemeLabel} has invalid frontmatter.`,
			...issues.map((issue) => `- ${issue.message}`),
		].join('\n'));
	}

	return parseYamlMapping(frontmatterBody);
};
