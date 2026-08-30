import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { access, mkdtemp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const repoRoot = path.resolve(import.meta.dirname, '..');
const root = await mkdtemp(path.join(os.tmpdir(), 'norna-site-node-'));
const siteDir = path.join(root, 'site');
const pagesDir = path.join(siteDir, 'pages');
const homeDir = path.join(pagesDir, '000-home');
const nornaBin = path.join(repoRoot, 'bin', 'norna.mjs');
const exists = (filePath) => access(filePath).then(() => true, () => false);
const runNornaForSite = (targetSiteDir, args, cwd = path.dirname(targetSiteDir)) => execFileAsync(process.execPath, [
	nornaBin,
	'--site-dir',
	targetSiteDir,
	...args,
], { cwd });
const runNorna = (args, cwd = root) => runNornaForSite(siteDir, args, cwd);
const runNornaFailure = async (args, cwd = root) => {
	try {
		await runNorna(args, cwd);
		assert.fail(`Expected command to fail: ${args.join(' ')}`);
	} catch (error) {
		return `${error.stdout ?? ''}\n${error.stderr ?? ''}`;
	}
};
const runNornaFailureForSite = async (targetSiteDir, args) => {
	try {
		await runNornaForSite(targetSiteDir, args);
		assert.fail(`Expected command to fail: ${args.join(' ')}`);
	} catch (error) {
		return `${error.stdout ?? ''}\n${error.stderr ?? ''}`;
	}
};
const createMinimalSite = async (name) => {
	const targetSiteDir = path.join(root, name, 'site');
	const targetHomeDir = path.join(targetSiteDir, 'pages', '000-home');
	await mkdir(targetHomeDir, { recursive: true });
	await writeFile(path.join(targetSiteDir, 'config.yaml'), 'url: https://example.com/\n');
	await writeFile(path.join(targetSiteDir, 'theme.yaml'), 'preset: project\n');
	await writeFile(path.join(targetHomeDir, 'content.md'), '# Home\n\n## Introduction\n\nHome page.\n');
	return targetSiteDir;
};

try {
	await mkdir(path.join(homeDir, 'images'), { recursive: true });
	await writeFile(path.join(siteDir, 'config.yaml'), 'url: https://example.com/\n');
	await writeFile(path.join(siteDir, 'theme.yaml'), 'preset: project\n');
	await writeFile(path.join(homeDir, 'content.md'), '# Home\n\n## Introduction\n\nHome page.\n');

	const firstPage = await runNorna(['page:add', 'Räksmörgås!', '--parent', '/']);
	const sandwichDir = path.join(pagesDir, '010-raksmorgas');
	assert.match(firstPage.stdout, /Created page "Räksmörgås!"/);
	assert.match(firstPage.stdout, /URL: \/raksmorgas\//);
	assert.equal(await exists(path.join(sandwichDir, 'images')), true);
	assert.equal(await readFile(path.join(sandwichDir, 'content.md'), 'utf8'), '# Räksmörgås!\n\n## Introduction\n\nStart writing here.\n');

	const category = await runNorna(['category:add', 'Guides', '--parent=/']);
	const guidesDir = path.join(pagesDir, '020-guides');
	assert.equal(await readFile(path.join(guidesDir, 'category.yaml'), 'utf8'), 'label: Guides\n');
	assert.equal(await exists(path.join(guidesDir, 'pages')), true);
	assert.equal(await exists(path.join(guidesDir, 'images')), false);
	assert.match(category.stdout, /has no page or URL of its own/);
	assert.match(category.stdout, /Child URL prefix: \/guides\//);

	await runNorna(['page:add', 'Installation', '--parent', '/guides/']);
	const installationDir = path.join(guidesDir, 'pages', '010-installation');
	assert.equal(await exists(path.join(installationDir, 'content.md')), true);

	await runNorna(['page:add', 'Workflows'], guidesDir);
	assert.equal(await exists(path.join(guidesDir, 'pages', '020-workflows', 'content.md')), true);

	await runNorna(['page:add', 'API v2', '--slug', 'api', '--order', '015', '--parent', 'guides']);
	assert.equal(await exists(path.join(guidesDir, 'pages', '015-api', 'content.md')), true);
	await runNorna(['page:add', 'Deployment', '--parent', 'guides']);
	assert.equal(await exists(path.join(guidesDir, 'pages', '030-deployment', 'content.md')), true);

	await runNorna(['page:add', 'About'], pagesDir);
	assert.equal(await exists(path.join(pagesDir, '030-about', 'content.md')), true);
	await runNorna(['page:add', "What's {new}?", '--parent', '/']);
	assert.equal(
		await readFile(path.join(pagesDir, '040-whats-new', 'content.md'), 'utf8'),
		"# What's \\{new\\}?\n\n## Introduction\n\nStart writing here.\n",
	);

	const duplicateSlug = await runNornaFailure(['page:add', 'Installation', '--parent', 'guides']);
	assert.match(duplicateSlug, /A sibling with that slug already exists/);
	const duplicateOrder = await runNornaFailure(['page:add', 'Other', '--order', '010', '--parent', 'guides']);
	assert.match(duplicateOrder, /A sibling already uses it/);
	const unknownParent = await runNornaFailure(['page:add', 'Other', '--parent', '/missing/']);
	assert.match(unknownParent, /Cannot find parent "\/missing\/"/);
	const invalidCwd = await runNornaFailure(['page:add', 'Other'], root);
	assert.match(invalidCwd, /Cannot infer where to add the node from the current directory/);
	const homeParent = await runNornaFailure(['page:add', 'Other'], homeDir);
	assert.match(homeParent, /homepage cannot contain child pages or categories/i);
	const invalidSlug = await runNornaFailure(['page:add', 'Other', '--slug', 'Räka', '--parent', '/']);
	assert.match(invalidSlug, /Invalid slug "Räka"/);

	const dryRun = await runNorna(['category:add', 'Drafts', '--parent', '/', '--dry-run']);
	assert.match(dryRun.stdout, /Would create category "Drafts"/);
	assert.equal((await readdir(pagesDir)).some((entry) => entry.endsWith('-drafts')), false);

	await runNorna(['category:add', 'Platforms', '--parent', 'guides']);
	const platformsDir = path.join(guidesDir, 'pages', '040-platforms');
	await runNorna(['page:add', 'Windows'], platformsDir);
	assert.equal(await exists(path.join(platformsDir, 'pages', '010-windows', 'content.md')), true);
	assert.match((await runNorna(['content:check'])).stdout, /Content check passed/);

	const bothSite = await createMinimalSite('invalid-both');
	const bothNode = path.join(bothSite, 'pages', '010-both');
	await mkdir(bothNode);
	await writeFile(path.join(bothNode, 'content.md'), '# Both\n');
	await writeFile(path.join(bothNode, 'category.yaml'), 'label: Both\n');
	assert.match(
		await runNornaFailureForSite(bothSite, ['page:add', 'Test', '--parent', '/', '--dry-run']),
		/contains both content\.md and category\.yaml/,
	);

	const categoryImagesSite = await createMinimalSite('invalid-category-images');
	const categoryImagesNode = path.join(categoryImagesSite, 'pages', '010-guides');
	await mkdir(path.join(categoryImagesNode, 'images'), { recursive: true });
	await writeFile(path.join(categoryImagesNode, 'category.yaml'), 'label: Guides\n');
	assert.match(
		await runNornaFailureForSite(categoryImagesSite, ['page:add', 'Test', '--parent', '/', '--dry-run']),
		/navigation category and cannot contain images/,
	);

	const duplicateSite = await createMinimalSite('invalid-duplicate-id');
	await mkdir(path.join(duplicateSite, 'pages', '010-guides'));
	await mkdir(path.join(duplicateSite, 'pages', '020-guides'));
	await writeFile(path.join(duplicateSite, 'pages', '010-guides', 'category.yaml'), 'label: Guides\n');
	await writeFile(path.join(duplicateSite, 'pages', '020-guides', 'content.md'), '# Guides\n');
	assert.match(
		await runNornaFailureForSite(duplicateSite, ['page:add', 'Test', '--parent', '/', '--dry-run']),
		/duplicate sibling id "guides"/,
	);

	const emptyCategorySite = await createMinimalSite('empty-category');
	await mkdir(path.join(emptyCategorySite, 'pages', '010-guides'));
	await writeFile(path.join(emptyCategorySite, 'pages', '010-guides', 'category.yaml'), 'label: Guides\n');
	const emptyCategoryCheck = await runNornaForSite(emptyCategorySite, ['content:check']);
	assert.match(emptyCategoryCheck.stdout, /Content check completed with warnings/);
	assert.match(emptyCategoryCheck.stdout, /defines an empty navigation category/);

	console.log('Site node command tests passed.');
} finally {
	await rm(root, { recursive: true, force: true });
}
