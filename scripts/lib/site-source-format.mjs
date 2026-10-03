import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { load } from 'js-yaml';

export const assertSiteSourceFormat = async (siteRoot, readSource = filename => readFile(filename, 'utf8')) => {
	const filename = path.join(siteRoot, 'site-config/settings.yaml');
	const source = await readSource(filename);
	let settings;
	try { settings = load(source); }
	catch (error) { throw new Error(`${filename} contains invalid YAML: ${error.reason ?? error.message}`); }
	if (settings?.sourceFormat !== 2) throw new Error(`${filename} needs sourceFormat: 2 after converting the site: move numeric page-directory prefixes into navigation.order frontmatter and remove those prefixes. Keep this site on its previous engine until converted. No files changed.`);
};
