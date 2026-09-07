import { cp, mkdir, readdir, rm } from 'node:fs/promises';
import path from 'node:path';
import * as pagefind from 'pagefind';
import projectConfig from './lib/project-config.mjs';
import {
	astroDistDir,
	astroPublicDir,
} from './lib/site-paths.mjs';

const searchDirectoryName = 'pagefind';
const distSearchDirectory = path.join(astroDistDir, searchDirectoryName);
const localSearchDirectory = path.join(astroPublicDir, searchDirectoryName);

if (!projectConfig.search.enabled) {
	await rm(localSearchDirectory, { force: true, recursive: true });
	console.log('Static search is disabled.');
} else {
	await rm(distSearchDirectory, { force: true, recursive: true });

	try {
		const { errors: createErrors, index } = await pagefind.createIndex();
		if (!index || createErrors.length > 0) {
			throw new Error(createErrors.join('\n') || 'Pagefind did not create an index.');
		}

		const { errors: indexingErrors, page_count: scannedPageCount } = await index.addDirectory({
			path: astroDistDir,
		});
		if (indexingErrors.length > 0) throw new Error(indexingErrors.join('\n'));
		if (scannedPageCount === 0) {
			throw new Error('No rendered pages contained searchable editorial content.');
		}

		const { errors: writeErrors } = await index.writeFiles({
			outputPath: distSearchDirectory,
		});
		if (writeErrors.length > 0) throw new Error(writeErrors.join('\n'));
		const fragmentDirectory = path.join(distSearchDirectory, 'fragment');
		const indexedPageCount = (await readdir(fragmentDirectory))
			.filter((filename) => filename.endsWith('.pf_fragment'))
			.length;
		if (indexedPageCount === 0) {
			throw new Error('No rendered pages contained searchable editorial content.');
		}

		await rm(localSearchDirectory, { force: true, recursive: true });
		await mkdir(astroPublicDir, { recursive: true });
		await cp(distSearchDirectory, localSearchDirectory, { recursive: true });

		console.log(`Generated static search index for ${indexedPageCount} page${indexedPageCount === 1 ? '' : 's'}.`);
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		throw new Error(`Could not generate the static search index. ${message}`);
	} finally {
		await pagefind.close();
	}
}
