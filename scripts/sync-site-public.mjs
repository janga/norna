import { cp, mkdir, readdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import projectConfig from './lib/project-config.mjs';
import { createSitemapXml, sitemapFilename } from './lib/sitemap.mjs';
import {
	astroPublicDir,
	astroPublicLabel,
	sitePublicLabel,
} from './lib/site-paths.mjs';
import { getSiteStructure } from './lib/site-structure.mjs';
import { getSiteLinkGraph } from './lib/site-link-graph.mjs';
import { assertCategoryDestinationModel } from './lib/category-destinations.mjs';

const main = async () => {
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

	const siteStructure = await getSiteStructure();
	const { categoryModel, attachments, diagnostics, publicFilesByPathname } = await getSiteLinkGraph({ siteStructure });
	const outputErrors = diagnostics.filter(issue => !issue.reference && issue.severity === 'error');
	if (outputErrors.length) throw new Error(outputErrors.map(issue => issue.message).join('\n'));
	const { destinations: categoryDestinations } = assertCategoryDestinationModel(categoryModel);
	const sitemapXml = createSitemapXml({
		siteStructure,
		siteUrl: projectConfig.site.url,
		categoryDestinations,
	});

	await mkdir(astroPublicDir, { recursive: true });

	for (const entry of await readDirectory(astroPublicDir)) {
		if (entry.name !== '_norna') await rm(path.join(astroPublicDir, entry.name), { force: true, recursive: true });
	}
	const resources = path.join(astroPublicDir, '_norna');
	for (const entry of await readDirectory(resources)) {
		if (entry.name === 'images' || entry.name === 'search' && projectConfig.search.enabled) continue;
		await rm(path.join(resources, entry.name), { force: true, recursive: true });
	}
	for (const file of new Set(publicFilesByPathname.values())) {
		const destination = path.join(astroPublicDir, file.pathname.slice(1));
		await mkdir(path.dirname(destination), { recursive: true });
		await cp(file.filePath, destination, { force: false, errorOnExist: true });
	}

	for (const file of attachments.files) {
		const destination = path.join(astroPublicDir, file.pathname.slice(1));
		await mkdir(path.dirname(destination), { recursive: true });
		await cp(file.filePath, destination, { force: false, errorOnExist: true });
	}
	await writeFile(path.join(astroPublicDir, sitemapFilename), sitemapXml);

	console.log(`Synced ${sitePublicLabel}/ to ${astroPublicLabel}/.`);
	const pageCount = siteStructure.contentFiles.length + categoryDestinations.filter(({ kind }) => kind === 'listing').length;
	console.log(`Generated ${astroPublicLabel}/${sitemapFilename} for ${pageCount} public page${pageCount === 1 ? '' : 's'}.`);
};

await main().catch(error => { console.error(error.message); process.exitCode = 1; });
