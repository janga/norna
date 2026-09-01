import assert from 'node:assert/strict';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parsePageMarkdownSource } from './lib/page-markdown.mjs';
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
});

const categoryNode = ({ directory, pagePath, label }) => ({
	categorySourceLabel: label,
	isHome: false,
	kind: 'category',
	pageDirectory: directory,
	pageId: pagePath.split('/').at(-1),
	pagePath,
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

\`\`\`norna-card-list
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
		categories: [guides],
		contentFiles: [home, installation, workflows],
	},
});

assert.deepEqual(brokenGraph.diagnostics.map(({ code }) => code), [
	'missing-internal-page',
	'missing-internal-anchor',
	'category-has-no-url',
	'missing-public-file',
	'invalid-internal-url',
]);
assert.equal(brokenGraph.referencesByTarget.get('/missing/')?.length, 1);

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
	assert.match(output, /navigation category \/guides\/, which does not have its own page/);
	assert.match(output, /no matching file exists under site\/public\//);
	assert.match(output, /Internal link "\/broken%ZZ\/" on line 7 is invalid/);
} finally {
	await rm(tempRoot, { force: true, recursive: true });
}

const repositoryGraph = await getSiteLinkGraph();
assert.deepEqual(repositoryGraph.diagnostics, []);

console.log('Site link graph tests passed.');
