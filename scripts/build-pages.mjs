import { cp, mkdir, mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getExampleSites } from './lib/example-sites.mjs';
import projectConfig from './lib/project-config.mjs';
import { runInherit } from './lib/run-command.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const cliPath = path.join(root, 'bin', 'norna.mjs');
const distDirectory = path.join(root, 'dist');
const temporaryDirectory = await mkdtemp(path.join(tmpdir(), 'norna-pages-'));
const artifactDirectory = path.join(temporaryDirectory, 'artifact');
const documentationUrl = new URL(projectConfig.site.url);
const documentationBasePath = projectConfig.site.basePath;
const examples = await getExampleSites(root);
let artifactStarted = false;

const buildSite = (siteLabel, env = process.env) => runInherit(
	process.execPath,
	[cliPath, ...(siteLabel ? ['--site-dir', siteLabel] : []), 'build'],
	{ cwd: root, env },
);

try {
	console.log('Building documentation site');
	await buildSite();
	await cp(distDirectory, artifactDirectory, { recursive: true });
	artifactStarted = true;

	for (const example of examples) {
		const relativePublicPath = `examples/${example.category}/${example.name}/`;
		const siteUrl = new URL(relativePublicPath, documentationUrl).href;

		console.log(`\nBuilding ${example.siteLabel} for ${siteUrl}`);
		await buildSite(example.siteLabel, {
			...process.env,
			NORNA_SITE_URL: siteUrl,
		});

		const destination = path.join(artifactDirectory, relativePublicPath);
		await mkdir(path.dirname(destination), { recursive: true });
		await cp(distDirectory, destination, { recursive: true });
	}
} finally {
	if (artifactStarted) {
		await rm(distDirectory, { recursive: true, force: true });
		await cp(artifactDirectory, distDirectory, { recursive: true });
	}
	await rm(temporaryDirectory, { recursive: true, force: true });
}

const documentationExamplesHtml = await readFile(path.join(distDirectory, 'examples', 'index.html'), 'utf8');

for (const example of examples) {
	const relativePublicPath = `examples/${example.category}/${example.name}/`;
	const basePath = `${documentationBasePath.replace(/\/$/, '')}/${relativePublicPath}`;
	const siteUrl = new URL(relativePublicPath, documentationUrl).href;
	const exampleHtml = await readFile(path.join(distDirectory, relativePublicPath, 'index.html'), 'utf8');

	if (!documentationExamplesHtml.includes(`href="${siteUrl}"`)) {
		throw new Error(`Documentation is missing the rendered example link ${siteUrl}.`);
	}
	if (!exampleHtml.includes(`href="${basePath}`) && !exampleHtml.includes(`src="${basePath}`)) {
		throw new Error(`Rendered example ${relativePublicPath} does not use its deployment base path ${basePath}.`);
	}
}

console.log(`\nok - assembled documentation and ${examples.length} rendered examples in dist/`);
