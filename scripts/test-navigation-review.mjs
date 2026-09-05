import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const cliPath = path.join(repoRoot, 'bin', 'norna-cli.mjs');

const writeFixtureFile = async (root, relativePath, contents) => {
	const filePath = path.join(root, relativePath);
	await mkdir(path.dirname(filePath), { recursive: true });
	await writeFile(filePath, contents);
};

const snapshotFiles = async (root, relativeDirectory = '') => {
	const directory = path.join(root, relativeDirectory);
	const entries = await readdir(directory, { withFileTypes: true });
	const files = [];

	for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name, 'en'))) {
		const relativePath = relativeDirectory
			? path.join(relativeDirectory, entry.name)
			: entry.name;
		if (entry.isDirectory()) {
			files.push(...await snapshotFiles(root, relativePath));
		} else if (entry.isFile()) {
			files.push([relativePath, await readFile(path.join(root, relativePath), 'utf8')]);
		}
	}

	return files;
};

const runReview = (cwd, args = []) => spawnSync(
	process.execPath,
	[cliPath, 'navigation:review', ...args],
	{ cwd, encoding: 'utf8' },
);

const tempRoot = await mkdtemp(path.join(tmpdir(), 'norna-navigation-review-'));

try {
	await writeFixtureFile(tempRoot, 'site/config.yaml', 'url: https://example.com/\n');
	await writeFixtureFile(tempRoot, 'site/theme.yaml', 'preset: documentation\n');
	await writeFixtureFile(tempRoot, 'site/pages/000-home/content.md', `# Home

[Verify macOS](/guides/installation/macos/#verify)

## Introduction {#introduction}

Start here.

### Next step {#next-step}

Continue with the guides.
`);
	await writeFixtureFile(tempRoot, 'site/pages/010-guides/category.yaml', 'label: Guides\n');
	await writeFixtureFile(tempRoot, 'site/pages/010-guides/pages/010-installation/content.md', `# Installation

[Return home](/)

## Choose a platform {#choose-a-platform}

Select the relevant operating system.
`);
	await writeFixtureFile(tempRoot, 'site/pages/010-guides/pages/010-installation/pages/010-macos/content.md', `# macOS

## Verify {#verify}

Check the installed version.

### Shell output {#shell-output}

Read the command output.
`);
	await writeFixtureFile(tempRoot, 'site/pages/010-guides/pages/010-installation/pages/010-macos/pages/010-advanced/content.md', `# Advanced macOS

## Configuration {#configuration}

Change advanced settings.
`);

	await writeFixtureFile(tempRoot, 'site/pages/020-reference/category.yaml', 'label: Reference\n');
	for (let index = 1; index <= 10; index += 1) {
		const order = String(index * 10).padStart(3, '0');
		const sections = index === 1
			? Array.from({ length: 8 }, (_, sectionIndex) => `## Topic ${sectionIndex + 1} {#topic-${sectionIndex + 1}}\n\nReference text.\n`).join('\n')
			: '## Reference {#reference}\n\nReference text.\n';
		await writeFixtureFile(
			tempRoot,
			`site/pages/020-reference/pages/${order}-item-${index}/content.md`,
			`# Item ${index}\n\n${sections}`,
		);
	}

	await writeFixtureFile(tempRoot, 'site/pages/030-hidden/content.md', `---
navigation:
  listed: false
---

# Hidden

## Private entry {#private-entry}

This page remains public but is not listed.
`);
	await writeFixtureFile(tempRoot, 'site/pages/030-hidden/pages/010-child/content.md', `# Hidden child

## Details {#details}

The parent hides this page from navigation too.
`);

	const before = await snapshotFiles(path.join(tempRoot, 'site'));
	const jsonResult = runReview(tempRoot, ['--format', 'json']);
	assert.equal(jsonResult.status, 0, `${jsonResult.stdout}${jsonResult.stderr}`);
	const review = JSON.parse(jsonResult.stdout);

	assert.equal(review.command, 'navigation:review');
	assert.equal(review.schemaVersion, 1);
	assert.deepEqual(review.site.effectiveNavigationModes, ['top', 'tree']);
	assert.equal(review.site.pageCount, 16);
	assert.equal(review.site.listedPageCount, 14);
	assert.equal(review.site.categoryCount, 2);
	assert.equal(review.site.listedCategoryCount, 2);
	assert.equal(review.site.branchCount, 3);
	assert.equal(review.site.maximumDepth, 4);
	assert.equal(review.site.widestSiblingCount, 10);
	assert.equal(review.site.internalReferenceCount, 2);
	assert.equal(review.site.resolvedPageLinkCount, 2);
	assert.deepEqual(review.errors, []);

	const home = review.pages.find(({ pathname }) => pathname === '/');
	assert.deepEqual({
		h2Count: home.h2Count,
		h3Count: home.h3Count,
		incomingPageLinkCount: home.incomingPageLinkCount,
		navigationMode: home.navigationMode,
		outgoingPageLinkCount: home.outgoingPageLinkCount,
	}, {
		h2Count: 1,
		h3Count: 1,
		incomingPageLinkCount: 1,
		navigationMode: 'top',
		outgoingPageLinkCount: 1,
	});
	assert.equal(review.pages.find(({ pathname }) => pathname === '/guides/installation/macos/').navigationMode, 'tree');
	assert.equal(review.pages.find(({ pathname }) => pathname === '/hidden/').listed, false);
	assert.equal(review.pages.find(({ pathname }) => pathname === '/hidden/child/').listed, false);
	assert.equal(review.categories.find(({ path: categoryPath }) => categoryPath === '/guides/').listedChildCount, 1);
	assert.deepEqual(review.recommendations.map(({ code }) => code), [
		'single-child-category',
		'deep-branch',
		'wide-sibling-group',
		'section-heavy-page',
	]);
	assert.equal(review.observations.some(({ code }) => code === 'unlisted-pages'), true);
	assert.deepEqual(await snapshotFiles(path.join(tempRoot, 'site')), before);

	const textResult = runReview(tempRoot);
	assert.equal(textResult.status, 0, `${textResult.stdout}${textResult.stderr}`);
	assert.match(textResult.stdout, /^Navigation Review/m);
	assert.match(textResult.stdout, /Home \(\/; listed\): H2 1, H3 1/);
	assert.match(textResult.stdout, /\[single-child-category\]/);
	assert.match(textResult.stdout, /\[deep-branch\]/);
	assert.match(textResult.stdout, /Errors\n- None\./);

	const helpResult = runReview(tempRoot, ['--help']);
	assert.equal(helpResult.status, 0, helpResult.stderr);
	assert.match(helpResult.stdout, /Usage: norna navigation:review/);
	assert.match(helpResult.stdout, /No files are changed\./);

	const invalidFormatResult = runReview(tempRoot, ['--format', 'yaml']);
	assert.equal(invalidFormatResult.status, 1);
	assert.match(invalidFormatResult.stderr, /Unknown navigation:review format "yaml"/);

	const unknownOptionResult = runReview(tempRoot, ['--write']);
	assert.equal(unknownOptionResult.status, 1);
	assert.match(unknownOptionResult.stderr, /Unknown navigation:review option "--write"/);

	await writeFixtureFile(tempRoot, 'site/pages/000-home/content.md', `# Home

[Missing](/missing/)

## Introduction {#introduction}

Start here.
`);
	const brokenResult = runReview(tempRoot, ['--format=json']);
	assert.equal(brokenResult.status, 1, brokenResult.stderr);
	const brokenReview = JSON.parse(brokenResult.stdout);
	assert.equal(brokenReview.errors.some(({ code }) => code === 'missing-internal-page'), true);
	assert.match(
		brokenReview.errors.find(({ code }) => code === 'missing-internal-page').message,
		/site\/pages\/000-home\/content\.md|Internal link/,
	);
} finally {
	await rm(tempRoot, { force: true, recursive: true });
}

console.log('Navigation review tests passed.');
