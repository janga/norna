import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { parseYamlMapping } from './frontmatter-yaml.mjs';
import {
	splitSiteFile,
	validateFrontmatterIndentation,
	validateRouteThemeFrontmatterStructure,
	validateThemeFrontmatterStructure,
} from './site-content.mjs';
import {
	siteRoutesDir,
	siteRoutesLabel,
	siteThemeLabel,
	siteThemePath,
	sitewideContentLabel,
} from './site-paths.mjs';

export const readThemeConfig = async () => {
	const themeFile = await readFile(siteThemePath, 'utf8').catch((error) => {
		if (error?.code === 'ENOENT') {
			throw new Error(`${siteThemeLabel} is required. Create it before running Norna.`);
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

	const config = parseYamlMapping(frontmatterBody);
	if (Object.hasOwn(config, 'navigation')) {
		throw new Error(`${siteThemeLabel} may not define navigation. Brand and logo belong in ${sitewideContentLabel}.`);
	}

	return config;
};

const getRouteThemeFiles = async (directory, relativeDirectory = '') => {
	const entries = await readdir(directory, { withFileTypes: true }).catch((error) => {
		if (error?.code === 'ENOENT') return [];
		throw error;
	});
	const files = [];

	for (const entry of entries) {
		const relativePath = path.join(relativeDirectory, entry.name);
		const absolutePath = path.join(directory, entry.name);
		if (entry.isDirectory()) {
			files.push(...await getRouteThemeFiles(absolutePath, relativePath));
			continue;
		}

		if (entry.name === 'theme.md') {
			files.push({
				path: absolutePath,
				label: `${siteRoutesLabel}/${relativePath.split(path.sep).join('/')}`,
			});
		}
	}

	return files;
};

export const validateRouteThemeFiles = async () => {
	const files = await getRouteThemeFiles(siteRoutesDir);
	const configs = [];

	for (const file of files) {
		const source = await readFile(file.path, 'utf8');
		const { frontmatter, frontmatterBody } = splitSiteFile(source, file.label);
		const issues = [];
		validateFrontmatterIndentation(frontmatter, (issue) => issues.push(issue));
		validateRouteThemeFrontmatterStructure(frontmatter, (issue) => issues.push(issue));

		if (issues.length > 0) {
			throw new Error([
				`${file.label} has invalid frontmatter.`,
				...issues.map((issue) => `- ${issue.message}`),
			].join('\n'));
		}

		const config = parseYamlMapping(frontmatterBody);
		if (Object.hasOwn(config, 'navigation')) {
			throw new Error(`${file.label} may not define navigation. Brand and logo belong in ${sitewideContentLabel}.`);
		}

		configs.push({ ...file, config });
	}

	return configs;
};
