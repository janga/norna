import { cp, mkdir, mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
	getExampleRelativePublicPath,
	getExampleSites,
	getUnlinkedExampleSites,
} from './lib/example-sites.mjs';
import projectConfig from './lib/project-config.mjs';
import { runInherit } from './lib/run-command.mjs';
import {
	renderThemePresetComparison,
	writeThemePresetComparison,
} from './build-theme-preset-comparison.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const cliPath = path.join(root, 'bin', 'norna.mjs');
const distDirectory = path.join(root, 'dist');
const temporaryDirectory = await mkdtemp(path.join(tmpdir(), 'norna-pages-'));
const artifactDirectory = path.join(temporaryDirectory, 'artifact');
const documentationUrl = new URL(projectConfig.site.url);
const documentationBasePath = projectConfig.site.basePath;
const examples = await getExampleSites(root);
const presetComparisonHtml = renderThemePresetComparison();
let artifactStarted = false;
let documentationExamplesHtml = '';

const readHtmlTree = async (directory) => {
	const entries = await readdir(directory, { withFileTypes: true });
	const contents = await Promise.all(entries.map(async (entry) => {
		const entryPath = path.join(directory, entry.name);
		if (entry.isDirectory()) return readHtmlTree(entryPath);
		if (entry.isFile() && entry.name.endsWith('.html')) return readFile(entryPath, 'utf8');
		return '';
	}));

	return contents.join('\n');
};

const buildSite = (siteDirectory, env = process.env) => runInherit(
	process.execPath,
	[cliPath, ...(siteDirectory ? ['--site-dir', siteDirectory] : []), 'build'],
	{ cwd: root, env },
);

try {
	console.log('Building documentation site');
	await buildSite();
	documentationExamplesHtml = await readHtmlTree(path.join(distDirectory, 'examples'));
	const presetComparisonUrl = new URL('examples/theme-presets/', documentationUrl).href;
	if (!documentationExamplesHtml.includes(`href="${presetComparisonUrl}"`)) {
		throw new Error(`Documentation is missing the theme preset comparison link ${presetComparisonUrl}.`);
	}
	const unlinkedExamples = getUnlinkedExampleSites({
		documentationText: documentationExamplesHtml,
		documentationUrl,
		examples,
		presetComparisonHtml,
		requireHtmlHref: true,
	});
	if (unlinkedExamples.length > 0) {
		const missingUrls = unlinkedExamples.map((example) => (
			new URL(getExampleRelativePublicPath(example), documentationUrl).href
		));
		throw new Error(`Documentation is missing rendered example links:\n${missingUrls.join('\n')}`);
	}
	await cp(distDirectory, artifactDirectory, { recursive: true });
	artifactStarted = true;

	for (const example of examples) {
		const relativePublicPath = getExampleRelativePublicPath(example);
		const siteUrl = new URL(relativePublicPath, documentationUrl).href;
		const exampleDistDirectory = path.join(path.dirname(example.siteDirectory), 'dist');

		console.log(`\nBuilding ${example.siteLabel} for ${siteUrl}`);
		try {
			await buildSite(example.siteDirectory, {
				...process.env,
				NORNA_SITE_URL: siteUrl,
			});

			const destination = path.join(artifactDirectory, relativePublicPath);
			await mkdir(path.dirname(destination), { recursive: true });
			await cp(exampleDistDirectory, destination, { recursive: true });
		} finally {
			await rm(exampleDistDirectory, { recursive: true, force: true });
		}
	}

	await writeThemePresetComparison(path.join(artifactDirectory, 'examples', 'theme-presets'));
} finally {
	if (artifactStarted) {
		await rm(distDirectory, { recursive: true, force: true });
		await cp(artifactDirectory, distDirectory, { recursive: true });
	}
	await rm(temporaryDirectory, { recursive: true, force: true });
}

for (const example of examples) {
	const relativePublicPath = getExampleRelativePublicPath(example);
	const basePath = `${documentationBasePath.replace(/\/$/, '')}/${relativePublicPath}`;
	const exampleHtml = await readFile(path.join(distDirectory, relativePublicPath, 'index.html'), 'utf8');

	if (!exampleHtml.includes(`href="${basePath}`) && !exampleHtml.includes(`src="${basePath}`)) {
		throw new Error(`Rendered example ${relativePublicPath} does not use its deployment base path ${basePath}.`);
	}
}

console.log(`\nok - assembled documentation and ${examples.length} rendered examples in dist/`);
