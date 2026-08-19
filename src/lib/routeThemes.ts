import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { parseYamlMapping } from '../../scripts/lib/frontmatter-yaml.mjs';
import {
	splitSiteFile,
	validateFrontmatterIndentation,
	validateRouteThemeFrontmatterStructure,
} from '../../scripts/lib/site-content.mjs';
import { siteRoutesDir, siteRoutesLabel, siteThemeLabel } from '../../scripts/lib/site-paths.mjs';
import { themeVisualSchema } from '../content.config';

type RouteTheme = {
	id: string;
	data: Record<string, unknown>;
};

export const getRouteTheme = async (routeDirectory: string | null): Promise<RouteTheme | null> => {
	if (!routeDirectory) return null;

	const segments = routeDirectory.split(/[\\/]/).filter(Boolean);
	for (let length = segments.length; length > 0; length -= 1) {
		const themeSegments = segments.slice(0, length);
		const themePath = path.join(siteRoutesDir, ...themeSegments, 'theme.md');
		const themeLabel = `${siteRoutesLabel}/${themeSegments.join('/')}/theme.md`;
		const source = await readFile(themePath, 'utf8').catch((error) => {
			if (error?.code === 'ENOENT') return null;
			throw error;
		});
		if (!source) continue;

		const { frontmatter, frontmatterBody } = splitSiteFile(source, themeLabel);
		const issues: Array<{ message: string }> = [];
		validateFrontmatterIndentation(frontmatter, (issue) => issues.push(issue));
		validateRouteThemeFrontmatterStructure(frontmatter, (issue) => issues.push(issue));
		if (issues.length > 0) {
			throw new Error([
				`${themeLabel} has invalid frontmatter.`,
				...issues.map((issue) => `- ${issue.message}`),
			].join('\n'));
		}

		const data = parseYamlMapping(frontmatterBody);
		if (Object.hasOwn(data, 'navigation')) {
			throw new Error(`${themeLabel} may not define navigation. Brand and logo belong in ${siteThemeLabel}.`);
		}
		const parsed = themeVisualSchema.safeParse(data);
		if (!parsed.success) {
			throw new Error([
				`${themeLabel} has invalid values.`,
				...parsed.error.issues.map((issue) => `- ${issue.path.join('.') || '(root)'}: ${issue.message}`),
			].join('\n'));
		}

		return {
			id: `routes/${themeSegments.join('/')}/theme`,
			data: parsed.data,
		};
	}

	return null;
};
