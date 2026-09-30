import { cp, mkdir, readdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import projectConfig from './lib/project-config.mjs';
import { getReservedPublicEntries } from './lib/public-path-policy.mjs';
import { createSitemapXml, sitemapFilename } from './lib/sitemap.mjs';
import {
	astroPublicDir,
	astroPublicLabel,
	sitePublicDir,
	sitePublicLabel,
} from './lib/site-paths.mjs';
import { getSiteStructure } from './lib/site-structure.mjs';
import { getSiteLinkGraph } from './lib/site-link-graph.mjs';
import { assertCategoryDestinationModel } from './lib/category-destinations.mjs';

const keepAstroPublicEntries = new Set([
	'images',
	...(projectConfig.search.enabled ? ['pagefind'] : []),
]);

const readDirectory = async (directory) => {
	try {
		return await readdir(directory, { withFileTypes: true });
	} catch (error) {
		if (error?.code === 'ENOENT') {
			return [];
		}

		throw error;
	}
};

const sourceEntries = await readDirectory(sitePublicDir);
const generatedPublicFiles = getReservedPublicEntries(projectConfig.search.enabled);
for (const generatedFile of generatedPublicFiles) {
	const conflict = sourceEntries.find(({ name }) => name.toLowerCase() === generatedFile.filename);
	if (!conflict) continue;

	throw new Error([
		`${sitePublicLabel}/${conflict.name} conflicts with Norna's generated ${generatedFile.filename}.`,
		`Remove that source file. ${generatedFile.explanation}`,
	].join('\n'));
}

const siteStructure = await getSiteStructure();
const { categoryModel } = await getSiteLinkGraph({ siteStructure });
const { destinations: categoryDestinations } = assertCategoryDestinationModel(categoryModel);
const sitemapXml = createSitemapXml({
	siteStructure,
	siteUrl: projectConfig.site.url,
	categoryDestinations,
});

await mkdir(astroPublicDir, { recursive: true });

for (const entry of await readDirectory(astroPublicDir)) {
	if (keepAstroPublicEntries.has(entry.name)) {
		continue;
	}

	await rm(path.join(astroPublicDir, entry.name), { force: true, recursive: true });
}

for (const entry of sourceEntries) {
	await cp(
		path.join(sitePublicDir, entry.name),
		path.join(astroPublicDir, entry.name),
		{ force: true, recursive: true },
	);
}

await writeFile(path.join(astroPublicDir, sitemapFilename), sitemapXml);

console.log(`Synced ${sitePublicLabel}/ to ${astroPublicLabel}/.`);
const pageCount = siteStructure.contentFiles.length + categoryDestinations.filter(({ kind }) => kind === 'listing').length;
console.log(`Generated ${astroPublicLabel}/${sitemapFilename} for ${pageCount} public page${pageCount === 1 ? '' : 's'}.`);
