import { readFile } from 'node:fs/promises';
import path from 'node:path';
import {
	validatePageThemeYamlStructure,
} from '../../scripts/lib/site-content.mjs';
import { sitePagesDir, sitePagesLabel } from '../../scripts/lib/site-paths.mjs';
import { parseYamlConfig } from '../../scripts/lib/yaml-config.mjs';
import { getPageDirectoryAncestors } from '../../scripts/lib/page-model.mjs';

type PageTheme = {
	id: string;
	data: Record<string, unknown>;
};

export const getPageTheme = async (pageDirectory: string | null): Promise<PageTheme | null> => {
	if (!pageDirectory) return null;

	const pageAncestors = getPageDirectoryAncestors(pageDirectory).reverse();
	for (const pageAncestor of pageAncestors) {
		const themeSegments = pageAncestor.split('/');
		const themePath = path.join(sitePagesDir, ...themeSegments, 'theme.yaml');
		const source = await readFile(themePath, 'utf8').catch((error) => {
			if (error?.code === 'ENOENT') return null;
			throw error;
		});
		if (!source) continue;
		const themeLabel = `${sitePagesLabel}/${themeSegments.join('/')}/theme.yaml`;

		const data = parseYamlConfig(source, themeLabel, {
			validateStructure: validatePageThemeYamlStructure,
		});
		if (Object.hasOwn(data, 'navigation')) {
			throw new Error(`${themeLabel} may not define navigation. Set the site-wide navigation mode in the root theme.yaml.`);
		}
		return {
			id: `pages/${themeSegments.join('/')}/theme`,
			data,
		};
	}

	return null;
};
