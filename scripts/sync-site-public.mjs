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
const generatedPublicFiles = [
	{
		filename: sitemapFilename,
		explanation: `Norna generates ${sitemapFilename} from the public page tree and the URL in site/config.yaml.`,
	},
	{
		filename: '404.html',
		explanation: 'Norna generates 404.html as the site\'s localized missing-page response.',
	},
	...(projectConfig.search.enabled ? [{
		filename: 'pagefind',
		explanation: 'Norna generates pagefind/ from the rendered editorial content when search is enabled.',
	}] : []),
];
for (const generatedFile of generatedPublicFiles) {
	const conflict = sourceEntries.find(({ name }) => name.toLowerCase() === generatedFile.filename);
	if (!conflict) continue;

	throw new Error([
		`${sitePublicLabel}/${conflict.name} conflicts with Norna's generated ${generatedFile.filename}.`,
		`Remove that source file. ${generatedFile.explanation}`,
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
