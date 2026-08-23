import { readFile } from 'node:fs/promises';
import path from 'node:path';
import {
	validateRouteThemeYamlStructure,
} from '../../scripts/lib/site-content.mjs';
import { siteRoutesDir, siteRoutesLabel, sitewideContentLabel } from '../../scripts/lib/site-paths.mjs';
import { parseYamlConfig } from '../../scripts/lib/yaml-config.mjs';

type RouteTheme = {
	id: string;
	data: Record<string, unknown>;
};

export const getRouteTheme = async (routeDirectory: string | null): Promise<RouteTheme | null> => {
	if (!routeDirectory) return null;

	const segments = routeDirectory.split(/[\\/]/).filter(Boolean);
	for (let length = segments.length; length > 0; length -= 1) {
		const themeSegments = segments.slice(0, length);
		const themePath = path.join(siteRoutesDir, ...themeSegments, 'theme.yaml');
		const source = await readFile(themePath, 'utf8').catch((error) => {
			if (error?.code === 'ENOENT') return null;
			throw error;
		});
		if (!source) continue;
		const themeLabel = `${siteRoutesLabel}/${themeSegments.join('/')}/theme.yaml`;

		const data = parseYamlConfig(source, themeLabel, {
			validateStructure: validateRouteThemeYamlStructure,
		});
		if (Object.hasOwn(data, 'navigation')) {
			throw new Error(`${themeLabel} may not define navigation. The site label and logo settings belong in ${sitewideContentLabel}.`);
		}
		return {
			id: `routes/${themeSegments.join('/')}/theme`,
			data,
		};
	}

	return null;
};
