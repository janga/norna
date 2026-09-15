import assert from 'node:assert/strict';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parsePageMarkdownSource } from './lib/page-markdown.mjs';
import { createCategoryDestinationModel } from './lib/category-destinations.mjs';
import {
	createSiteLinkGraph,
	getSiteLinkGraph,
	resolveInternalTarget,
} from './lib/site-link-graph.mjs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const contentScript = path.join(repoRoot, 'scripts', 'sync-content-sections.mjs');

const pageNode = ({ directory, pagePath, label, home = false }) => ({
	contentLabel: label,
	isHome: home,
	kind: 'page',
	pageDirectory: directory,
	pageId: home ? 'home' : pagePath.split('/').at(-1),
	pagePath,
	parentPagePath: pagePath.includes('/') ? pagePath.slice(0, pagePath.lastIndexOf('/')) : null,
});

const categoryNode = ({ directory, pagePath, label }) => ({
	categorySourceLabel: label,
	isHome: false,
	kind: 'category',
	pageDirectory: directory,
	pageId: pagePath.split('/').at(-1),
	pagePath,
	parentPagePath: pagePath.includes('/') ? pagePath.slice(0, pagePath.lastIndexOf('/')) : null,
});

const home = pageNode({
	directory: '000-home',
	home: true,
	label: 'site/pages/000-home/content.md',
	pagePath: '',
});
const guides = categoryNode({
	directory: '010-guides',
	label: 'site/pages/010-guides/category.yaml',
	pagePath: 'guides',
});
const installation = pageNode({
	directory: '010-guides/pages/010-installation',
	label: 'site/pages/010-guides/pages/010-installation/content.md',
	pagePath: 'guides/installation',
});
const workflows = pageNode({
	directory: '010-guides/pages/020-workflows',
	label: 'site/pages/010-guides/pages/020-workflows/content.md',
	pagePath: 'guides/workflows',
});

const homeSource = `---
page:
  description: Link graph fixture.
---

# Home

[Intro](#intro)
[Install](/guides/installation)
[Install index](/guides/installation/index.html?from=home#verify)
[Old install URL](/install/#verify)
[Home index](/index.html#intro)
[Reference link][workflow]
[Public file](/downloads/guide%20one.pdf?download=1)
[External](https://example.com/missing/)

## Intro

The checker ignores links shown as code: \`[Missing](/not-a-link/)\`.

\`\`\`md
[Missing](/also-not-a-link/)
\`\`\`

[workflow]: /guides/workflows/#local
`;

const installationSource = `# Installation

[Verify this section](#verify)
[Sibling workflow](../workflows/#local)

## Verify

### Details
`;

const workflowsSource = `# Workflows

## Local work {#local}

\`\`\`card-list
items:
  - title: Installation
    link: /guides/installation/#details
\`\`\`
`;

const pageDocuments = await Promise.all([
	{ contentFile: home, source: homeSource },
	{
		contentFile: installation,
		data: { page: { aliases: ['/install/'] } },
		source: installationSource,
	},
	{ contentFile: workflows, source: workflowsSource },
].map(async ({ contentFile, data, source }) => ({
	contentFile,
	data,
	document: await parsePageMarkdownSource(source, { label: contentFile.contentLabel }),
})));

const validGraph = createSiteLinkGraph({
	pageDocuments,
	publicFiles: [{
		label: 'site/public/downloads/guide one.pdf',
		pathname: '/downloads/guide one.pdf',
	}],
	siteStructure: {
		nodes: [home, guides, installation, workflows],
		categories: [guides],
		contentFiles: [home, installation, workflows],
	},
});

assert.deepEqual(validGraph.diagnostics, []);
assert.equal(validGraph.references.length, 10);
assert.equal(validGraph.referencesByTarget.get('/guides/installation/#verify')?.length, 2);
assert.equal(validGraph.referencesByTarget.get('/guides/workflows/#local')?.length, 2);
assert.equal(validGraph.referencesByTarget.get('/install/#verify')?.length, 1);
assert.equal(
	validGraph.references.find(({ targetSource }) => targetSource === '/install/#verify')?.resolution?.kind,
	'page-alias',
);
assert.equal(validGraph.references.some(({ target: { kind } }) => kind === 'external'), false);

const searchSource = '# Search link\n\n[Search the site](/search/)\n';
const searchGraph = createSiteLinkGraph({
	pageDocuments: [{
		contentFile: home,
		document: await parsePageMarkdownSource(searchSource, { label: home.contentLabel }),
	}],
	generatedRoutes: [{
		kind: 'generated-route',
		label: 'Norna generated search page',
		pathname: '/search/',
	}],
	siteStructure: {
		nodes: [home],
		categories: [],
		contentFiles: [home],
	},
});
assert.deepEqual(searchGraph.diagnostics, []);
assert.equal(searchGraph.references[0].resolution.kind, 'generated-route');

const searchDisabledGraph = createSiteLinkGraph({
	pageDocuments: [{
		contentFile: home,
		document: await parsePageMarkdownSource(searchSource, { label: home.contentLabel }),
	}],
	siteStructure: {
		nodes: [home],
		categories: [],
		contentFiles: [home],
	},
});
assert.equal(searchDisabledGraph.diagnostics[0].code, 'missing-internal-page');

const allSources = new Map([
	[home.contentLabel, homeSource],
	[installation.contentLabel, installationSource],
	[workflows.contentLabel, workflowsSource],
]);
for (const reference of validGraph.references) {
	assert.ok(reference.targetRange, `Expected an editable target range for ${reference.targetSource}`);
	const source = allSources.get(reference.sourceContentFile.contentLabel);
	assert.equal(
		source.slice(reference.targetRange.start, reference.targetRange.end),
		reference.targetSource,
	);
}

assert.deepEqual(resolveInternalTarget('/guides/installation/', '/docs/current/'), {
	fragment: '',
	kind: 'internal',
	pageLookupPathname: '/guides/installation/',
	pathname: '/guides/installation/',
	query: '',
});

const crlfSource = '# CRLF\r\n\r\n[Install](/guides/installation/)\r\n';
const crlfDocument = await parsePageMarkdownSource(crlfSource);
assert.equal(
	crlfSource.slice(crlfDocument.links[0].targetRange.start, crlfDocument.links[0].targetRange.end),
	'/guides/installation/',
);

const brokenSource = `# Broken links

[Missing page](/missing/)
[Missing anchor](/guides/installation/#absent)
[Category](/guides/)
[Missing public file](/downloads/missing.pdf)
[Invalid encoding](/broken%ZZ/)
`;
const brokenDocument = await parsePageMarkdownSource(brokenSource, { label: home.contentLabel });
const brokenGraph = createSiteLinkGraph({
	pageDocuments: [
		{ contentFile: home, document: brokenDocument },
		...pageDocuments.filter(({ contentFile }) => contentFile !== home),
	],
	publicFiles: [],
	siteStructure: {
		nodes: [home, guides, installation, workflows],
		categories: [guides],
		contentFiles: [home, installation, workflows],
	},
});

assert.deepEqual(brokenGraph.diagnostics.map(({ code }) => code), [
	'missing-internal-page',
	'missing-internal-anchor',
	'missing-public-file',
	'invalid-internal-url',
]);
assert.equal(brokenGraph.referencesByTarget.get('/missing/')?.length, 1);
assert.equal(brokenGraph.referencesByTarget.get('/guides/')[0].resolution.kind, 'category');

const subcategory = categoryNode({ directory: '010-guides/pages/010-setup', pagePath: 'guides/setup', label: 'setup/category.yaml' });
const nestedPage = pageNode({ directory: '010-guides/pages/010-setup/pages/010-install', pagePath: 'guides/setup/install', label: 'install/content.md' });
const categoryModel = createCategoryDestinationModel([home, guides, subcategory, nestedPage, workflows]);
assert.deepEqual(categoryModel.diagnostics, []);
assert.equal(categoryModel.byPathname.get('/guides/').kind, 'listing');
assert.deepEqual(categoryModel.byPathname.get('/guides/').children.map(({ pagePath }) => pagePath), ['guides/setup', 'guides/workflows']);
assert.equal(categoryModel.byPathname.get('/guides/setup/').target.pagePath, 'guides/setup/install');
assert.equal(createCategoryDestinationModel([home, guides, workflows, subcategory, nestedPage]).byPathname.get('/guides/').target, workflows);
assert.equal(createCategoryDestinationModel([guides]).diagnostics[0].code, 'category-without-listed-content');
assert.equal(createCategoryDestinationModel([guides, { ...installation, navigation: { listed: false } }]).diagnostics.length, 1);
const excluded = createCategoryDestinationModel([
	{ ...installation, parentPagePath: null, navigation: { listed: false } },
	{ ...subcategory, parentPagePath: installation.pagePath },
]);
assert.equal(excluded.destinations.length, 0);
assert.deepEqual(excluded.diagnostics, []);

const categoryGraphOptions = {
	pageDocuments: [
		{ contentFile: home, document: await parsePageMarkdownSource(`# Home

[Category](/guides/)
[Category title](/guides/#page-title)
[Unknown category anchor](/guides/#missing)
[Redirect anchor](/guides/setup/#page-title)
[Encoded category](/%67uides/)
`) },
		{ contentFile: nestedPage, document: await parsePageMarkdownSource('# Install\n') },
		{ contentFile: workflows, document: await parsePageMarkdownSource('# Workflows\n') },
	],
	siteStructure: {
		nodes: [home, guides, subcategory, nestedPage, workflows],
		categories: [guides, subcategory],
		contentFiles: [home, nestedPage, workflows],
	},
};
const categoryGraph = createSiteLinkGraph(categoryGraphOptions);
assert.deepEqual(categoryGraph.diagnostics.map(({ code }) => code), ['missing-internal-anchor', 'missing-internal-anchor']);
assert.equal(categoryGraph.references.at(-1).resolution.pathname, '/guides/');
const conflictingCategoryGraph = createSiteLinkGraph({
	...categoryGraphOptions,
	publicFiles: [{ pathname: '/guides/index.html', label: 'site/public/guides/index.html' }],
});
assert.ok(conflictingCategoryGraph.diagnostics.some(({ code }) => code === 'category-route-collision'));

const writeFixtureFile = async (root, relativePath, contents) => {
	const filePath = path.join(root, relativePath);
	await mkdir(path.dirname(filePath), { recursive: true });
	await writeFile(filePath, contents);
};

const tempRoot = await mkdtemp(path.join(tmpdir(), 'norna-site-links-'));
try {
	await writeFixtureFile(tempRoot, 'site/config.yaml', 'url: https://example.com/docs/\n');
	await writeFixtureFile(tempRoot, 'site/theme.yaml', 'preset: documentation\n');
	await writeFixtureFile(tempRoot, 'site/pages/000-home/content.md', brokenSource);
	await writeFixtureFile(tempRoot, 'site/pages/010-guides/category.yaml', 'label: Guides\n');
	await writeFixtureFile(tempRoot, 'site/pages/010-guides/pages/010-installation/content.md', installationSource);
	await writeFixtureFile(tempRoot, 'site/pages/010-guides/pages/020-workflows/content.md', workflowsSource);

	const result = spawnSync(process.execPath, [contentScript, '--check'], {
		cwd: tempRoot,
		encoding: 'utf8',
	});
	const output = `${result.stdout}${result.stderr}`;
	assert.equal(result.status, 1, output);
	assert.match(output, /Content check failed\./);
	assert.match(output, /\[site\/pages\/000-home\/content\.md\]/);
	assert.match(output, /Internal link "\/missing\/" on line 3 points to page "\/missing\/"/);
	assert.match(output, /missing heading anchor "#absent" on \/guides\/installation\//);
	assert.doesNotMatch(output, /category-has-no-url/);
	assert.match(output, /no matching file exists under site\/public\//);
	assert.match(output, /Internal link "\/broken%ZZ\/" on line 7 is invalid/);
} finally {
	await rm(tempRoot, { force: true, recursive: true });
}

const repositoryGraph = await getSiteLinkGraph();
assert.deepEqual(repositoryGraph.diagnostics, []);

console.log('Site link graph tests passed.');
