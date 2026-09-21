import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { basename, dirname } from 'node:path';
import { pathToFileURL } from 'node:url';
import {
	siteDir,
	siteDirLabel,
	siteThemePath,
	sitewideContentPath,
} from '../scripts/lib/site-paths.mjs';
import { encodePageEntryId, getSiteEntryPrefix, parsePageDirectoryPath } from '../scripts/lib/page-model.mjs';
import { homePageDirectory } from '../scripts/lib/site-conventions.mjs';
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
		pattern: ['content.md', 'pages/**/content.md'],
		base: pathToFileURL(siteDir),
		generateId: ({ entry }) => {
			if (entry === 'content.md') return encodePageEntryId(siteDirLabel, homePageDirectory);
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
		base: pathToFileURL(dirname(siteThemePath)),
		generateId: () => `${siteEntryPrefix}-theme`,
	}),
	schema: siteThemeSchema,
});

const sitewide = defineCollection({
	loader: glob({
		pattern: basename(sitewideContentPath),
		base: pathToFileURL(dirname(sitewideContentPath)),
		generateId: () => `${siteEntryPrefix}-sitewide`,
	}),
	schema: sitewideContentSchema,
});

export const collections = { site, theme, sitewide };
