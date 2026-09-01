import { cp, mkdir, readdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import projectConfig from './lib/project-config.mjs';
import { createSitemapXml, sitemapFilename } from './lib/sitemap.mjs';
import {
	astroPublicDir,
	astroPublicLabel,
	sitePublicDir,
	sitePublicLabel,
} from './lib/site-paths.mjs';
import { getSiteStructure } from './lib/site-structure.mjs';

const keepAstroPublicEntries = new Set(['images']);

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
const sitemapConflict = sourceEntries.find(({ name }) => name.toLowerCase() === sitemapFilename);
if (sitemapConflict) {
	throw new Error([
		`${sitePublicLabel}/${sitemapConflict.name} conflicts with Norna's generated ${sitemapFilename}.`,
		`Remove that source file. Norna generates ${sitemapFilename} from the public page tree and the URL in site/config.yaml.`,
	].join('\n'));
}

const siteStructure = await getSiteStructure();
const sitemapXml = createSitemapXml({
	siteStructure,
	siteUrl: projectConfig.site.url,
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
console.log(`Generated ${astroPublicLabel}/${sitemapFilename} for ${siteStructure.contentFiles.length} public page${siteStructure.contentFiles.length === 1 ? '' : 's'}.`);
