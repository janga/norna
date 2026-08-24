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
import { parsePageDirectory } from '../scripts/lib/page-model.mjs';
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
		pattern: ['content.md', 'pages/*/content.md'],
		base: pathToFileURL(siteDir),
		generateId: ({ entry }) => {
			if (entry === 'content.md') {
				return siteEntryId;
			}

			const pageDirectory = entry.match(/^pages\/([^/]+)\/content\.md$/)?.[1];
			return pageDirectory
				? `${siteEntryId.replace(/-content$/, '')}-page-${parsePageDirectory(pageDirectory, `page directory pages/${pageDirectory}`).pageDirectory}`
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
