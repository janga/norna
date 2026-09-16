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
import { encodePageEntryId, getSiteEntryPrefix, parsePageDirectoryPath } from '../scripts/lib/page-model.mjs';
import {
	siteSchema,
	sitewideSchema,
	themeVisualSchema,
} from '../scripts/lib/schema-definitions.mjs';

const siteEntryPrefix = getSiteEntryPrefix(siteDirLabel);
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
			return encodePageEntryId(siteDirLabel, parsePageDirectoryPath(pageDirectory, `page directory pages/${pageEntryDirectory}`).pageDirectory);
		},
	}),
	schema: siteSchema,
});

const theme = defineCollection({
	loader: glob({
		pattern: basename(siteThemePath),
		base: pathToFileURL(siteDir),
		generateId: () => `${siteEntryPrefix}-theme`,
	}),
	schema: siteThemeSchema,
});

const sitewide = defineCollection({
	loader: glob({
		pattern: basename(sitewideContentPath),
		base: pathToFileURL(siteDir),
		generateId: () => `${siteEntryPrefix}-sitewide`,
	}),
	schema: sitewideContentSchema,
});

export const collections = { site, theme, sitewide };
