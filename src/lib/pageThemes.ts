import { readFile } from 'node:fs/promises';
import path from 'node:path';
import {
	validatePageThemeYamlStructure,
} from '../../scripts/lib/site-content.mjs';
import { sitePagesDir, sitePagesLabel } from '../../scripts/lib/site-paths.mjs';
import { parseYamlConfig } from '../../scripts/lib/yaml-config.mjs';

type PageTheme = {
	id: string;
	data: Record<string, unknown>;
};

export const getPageTheme = async (pageDirectory: string | null): Promise<PageTheme | null> => {
	if (!pageDirectory) return null;

	const segments = pageDirectory.split(/[\\/]/).filter(Boolean);
	for (let length = segments.length; length > 0; length -= 1) {
		const themeSegments = segments.slice(0, length);
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
