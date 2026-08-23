import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { basename } from 'node:path';
import { pathToFileURL } from 'node:url';
import {
	siteDir,
	siteDirLabel,
	siteThemePath,
	sitewideContentPath,
} from '../scripts/lib/site-paths.mjs';
import { parseRouteDirectory } from '../scripts/lib/route-model.mjs';
import {
	siteSchema,
	sitewideSchema,
	themeVisualSchema,
} from '../scripts/lib/schema-definitions.mjs';

const siteEntryId = `${siteDirLabel
	.replace(/^[./\\]+/, '')
	.replace(/[^a-zA-Z0-9-]+/g, '-')
	.replace(/^-+|-+$/g, '') || 'site'}-content`;
const siteThemeSchema = themeVisualSchema;

const site = defineCollection({
	loader: glob({
		pattern: ['content.md', 'routes/*/content.md'],
		base: pathToFileURL(siteDir),
		generateId: ({ entry }) => {
			if (entry === 'content.md') {
				return siteEntryId;
			}

			const routeDirectory = entry.match(/^routes\/([^/]+)\/content\.md$/)?.[1];
			return routeDirectory
				? `${siteEntryId.replace(/-content$/, '')}-route-${parseRouteDirectory(routeDirectory, `route directory routes/${routeDirectory}`).routeDirectory}`
				: entry.replace(/[^a-zA-Z0-9-]+/g, '-').replace(/^-+|-+$/g, '');
		},
	}),
	schema: siteSchema,
});

const theme = defineCollection({
	loader: glob({
		pattern: basename(siteThemePath),
		base: pathToFileURL(siteDir),
		generateId: () => `${siteEntryId.replace(/-content$/, '')}-theme`,
	}),
	schema: siteThemeSchema,
});

const sitewide = defineCollection({
	loader: glob({
		pattern: basename(sitewideContentPath),
		base: pathToFileURL(siteDir),
		generateId: () => `${siteEntryId.replace(/-content$/, '')}-sitewide`,
	}),
	schema: sitewideSchema,
});

export const collections = { site, theme, sitewide };
