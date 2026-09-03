import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { basename } from 'node:path';
import { pathToFileURL } from 'node:url';
import {
	siteDir,
	siteDirLabel,
	siteThemePath,
	sitewideContentPath,
} from '../scripts/lib/site-paths.mjs';
import { encodePageDirectoryPath, parsePageDirectoryPath } from '../scripts/lib/page-model.mjs';
import {
	siteSchema,
	sitewideSchema,
	themeVisualSchema,
} from '../scripts/lib/schema-definitions.mjs';

const siteEntryId = `${siteDirLabel
	.replace(/^[./\\]+/, '')
	.replace(/[^a-zA-Z0-9-]+/g, '-')
	.replace(/^-+|-+$/g, '') || 'site'}-content`;
const emptyYamlMapping = (value: unknown) => value ?? {};
const siteThemeSchema = z.preprocess(emptyYamlMapping, themeVisualSchema);
const sitewideContentSchema = z.preprocess(emptyYamlMapping, sitewideSchema);

const site = defineCollection({
	loader: glob({
		pattern: 'pages/**/content.md',
		base: pathToFileURL(siteDir),
		generateId: ({ entry }) => {
			const pageEntryDirectory = entry.split('/').slice(1, -1).join('/');
			const pageDirectory = pageEntryDirectory
				.split('/')
				.filter((segment) => segment !== 'pages')
				.join('/pages/');
			return `${siteEntryId.replace(/-content$/, '')}-page-${encodePageDirectoryPath(parsePageDirectoryPath(pageDirectory, `page directory pages/${pageEntryDirectory}`).pageDirectory)}`;
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
	schema: sitewideContentSchema,
});

export const collections = { site, theme, sitewide };
