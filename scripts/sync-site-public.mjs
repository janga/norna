import { cp, mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
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
const { categoryModel, attachments, diagnostics } = await getSiteLinkGraph({ siteStructure });
const attachmentErrors = diagnostics.filter(issue => ['invalid-attachment', 'attachment-output-collision'].includes(issue.code));
if (attachmentErrors.length) throw new Error(attachmentErrors.map(issue => issue.message).join('\n'));
const attachmentManifest = path.join(path.dirname(astroPublicDir), 'attachments.json');
const previousAttachments = await readFile(attachmentManifest, 'utf8').then(JSON.parse).catch(error => { if (error.code === 'ENOENT') return []; throw error; });
const { destinations: categoryDestinations } = assertCategoryDestinationModel(categoryModel);
const sitemapXml = createSitemapXml({
	siteStructure,
	siteUrl: projectConfig.site.url,
	categoryDestinations,
});

await mkdir(astroPublicDir, { recursive: true });

for (const relative of previousAttachments) {
	const filename = path.resolve(astroPublicDir, relative);
	if (!filename.startsWith(path.resolve(astroPublicDir) + path.sep)) throw new Error('Invalid generated attachment manifest path.');
	await rm(filename, { force: true });
}
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

for (const file of attachments.files) {
	const destination = path.join(astroPublicDir, file.pathname.slice(1));
	await mkdir(path.dirname(destination), { recursive: true });
	await cp(file.filePath, destination, { force: false, errorOnExist: true });
}
await writeFile(attachmentManifest, JSON.stringify(attachments.files.map(file => file.pathname.slice(1))));
await writeFile(path.join(astroPublicDir, sitemapFilename), sitemapXml);

console.log(`Synced ${sitePublicLabel}/ to ${astroPublicLabel}/.`);
const pageCount = siteStructure.contentFiles.length + categoryDestinations.filter(({ kind }) => kind === 'listing').length;
console.log(`Generated ${astroPublicLabel}/${sitemapFilename} for ${pageCount} public page${pageCount === 1 ? '' : 's'}.`);
