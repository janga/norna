import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import {
	access,
	mkdir,
	mkdtemp,
	readdir,
	readFile,
	rename,
	rm,
	writeFile,
} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const repoRoot = path.resolve(import.meta.dirname, '..');
const nornaBin = path.join(repoRoot, 'bin', 'norna.mjs');
const root = await mkdtemp(path.join(os.tmpdir(), 'norna-page-move-'));
const exists = (filePath) => access(filePath).then(() => true, () => false);

const writeFixtureFile = async (rootDirectory, relativePath, source) => {
	const filePath = path.join(rootDirectory, relativePath);
	await mkdir(path.dirname(filePath), { recursive: true });
	await writeFile(filePath, source);
};

const createFixture = async (name) => {
	const projectRoot = path.join(root, name);
	const siteDir = path.join(projectRoot, 'site');
	await writeFixtureFile(siteDir, 'config.yaml', 'url: https://example.com/\n');
	await writeFixtureFile(siteDir, 'theme.yaml', 'preset: documentation\n');
	await writeFixtureFile(siteDir, 'public/manual.pdf', 'manual');
	await writeFixtureFile(siteDir, 'pages/000-home/content.md', `# Home

## Start {#start}

[Install](/guides/install/?mode=fast#steps)
[Install once][install]
[Install twice][install]

[install]: /guides/install/#steps

\`\`\`card-list
- title: Installation reference
  text: Open the detailed reference.
  link: /guides/install/reference/#details
\`\`\`
`);
	await writeFixtureFile(siteDir, 'pages/010-guides/category.yaml', 'label: Guides\n');
	await writeFixtureFile(siteDir, 'pages/010-guides/pages/010-install/content.md', `---
page:
  description: Installation instructions.
---

# Install

## Steps {#steps}

[Workflow](../workflows/#local)
[Child](reference/#details)
[Manual](../../manual.pdf)

\`\`\`image-stack
- image: example.svg
  alt: Example diagram.
\`\`\`
`);
	await writeFixtureFile(siteDir, 'pages/010-guides/pages/010-install/images/example.svg', '<svg viewBox="0 0 10 10"></svg>\n');
	await writeFixtureFile(siteDir, 'pages/010-guides/pages/010-install/pages/010-reference/content.md', `# Install reference

## Details {#details}

[Parent](../#steps)
`);
	await writeFixtureFile(siteDir, 'pages/010-guides/pages/020-workflows/content.md', `# Workflows

## Local {#local}

[Install](/guides/install/)
`);
	await writeFixtureFile(siteDir, 'pages/020-reference/category.yaml', 'label: Reference\n');
	await writeFixtureFile(siteDir, 'pages/020-reference/pages/010-overview/content.md', `# Reference overview

## Summary {#summary}

Reference material.
`);
	return { projectRoot, siteDir };
};

const runNorna = (siteDir, args) => execFileAsync(process.execPath, [
	nornaBin,
	'--site-dir',
	siteDir,
	...args,
], { cwd: path.dirname(siteDir) });

const runFailure = async (siteDir, args) => {
	try {
		await runNorna(siteDir, args);
		assert.fail(`Expected command to fail: ${args.join(' ')}`);
	} catch (error) {
		return `${error.stdout ?? ''}\n${error.stderr ?? ''}`;
	}
};

const listFiles = async (directory, relativeDirectory = '') => {
	const entries = await readdir(directory, { withFileTypes: true });
	const files = [];
	for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name, 'en'))) {
		const relativePath = relativeDirectory ? path.join(relativeDirectory, entry.name) : entry.name;
		if (entry.isDirectory()) files.push(...await listFiles(path.join(directory, entry.name), relativePath));
		else if (entry.isFile()) files.push(relativePath.split(path.sep).join('/'));
	}
	return files;
};

const snapshotSite = async (siteDir) => {
	const files = await listFiles(siteDir);
	return new Map(await Promise.all(files.map(async (relativePath) => [
		relativePath,
		await readFile(path.join(siteDir, relativePath), 'utf8'),
	])));
};

const assertSuccessfulResult = async (siteDir) => {
	const movedDir = path.join(siteDir, 'pages/020-reference/pages/010-overview/pages/010-install');
	const movedSource = await readFile(path.join(movedDir, 'content.md'), 'utf8');
	const childSource = await readFile(path.join(movedDir, 'pages/010-reference/content.md'), 'utf8');
	const homeSource = await readFile(path.join(siteDir, 'pages/000-home/content.md'), 'utf8');
	const workflowSource = await readFile(path.join(siteDir, 'pages/010-guides/pages/020-workflows/content.md'), 'utf8');

	assert.equal(await exists(path.join(siteDir, 'pages/010-guides/pages/010-install')), false);
	assert.equal(await exists(path.join(movedDir, 'images/example.svg')), true);
	assert.match(movedSource, /aliases:\n    - \/guides\/install\//);
	assert.match(movedSource, /\[Workflow\]\(\/guides\/workflows\/#local\)/);
	assert.match(movedSource, /\[Child\]\(reference\/#details\)/);
	assert.match(movedSource, /\[Manual\]\(\/manual\.pdf\)/);
	assert.match(childSource, /aliases:\n    - \/guides\/install\/reference\//);
	assert.match(childSource, /\[Parent\]\(\.\.\/#steps\)/);
	assert.match(homeSource, /\/reference\/overview\/install\/\?mode=fast#steps/);
	assert.equal((homeSource.match(/^\[install\]:/gm) ?? []).length, 1);
	assert.match(homeSource, /^\[install\]: \/reference\/overview\/install\/#steps$/m);
	assert.match(homeSource, /link: \/reference\/overview\/install\/reference\/#details/);
	assert.match(workflowSource, /\[Install\]\(\/reference\/overview\/install\/\)/);

	const check = await runNorna(siteDir, ['content:check']);
	assert.match(check.stdout, /Content check passed\./);
};

try {
	const normal = await createFixture('normal');
	const beforeDryRun = await snapshotSite(normal.siteDir);
	const dryRun = await runNorna(normal.siteDir, [
		'page:move',
		'/guides/install/',
		'/reference/overview/install/',
	]);
	assert.match(dryRun.stdout, /Mode: move page directory/);
	assert.match(dryRun.stdout, /\/guides\/install\/reference\/ -> \/reference\/overview\/install\/reference\//);
	assert.match(dryRun.stdout, /Dry run only/);
	assert.deepEqual(await snapshotSite(normal.siteDir), beforeDryRun);

	const moved = await runNorna(normal.siteDir, [
		'page:move',
		'/guides/install/',
		'/reference/overview/install/',
		'--write',
	]);
	assert.match(moved.stdout, /Page move completed: \/guides\/install\/ -> \/reference\/overview\/install\//);
	await assertSuccessfulResult(normal.siteDir);
	const normalResult = await snapshotSite(normal.siteDir);

	const reconciled = await createFixture('reconciled');
	await mkdir(path.join(reconciled.siteDir, 'pages/020-reference/pages/010-overview/pages'));
	await rename(
		path.join(reconciled.siteDir, 'pages/010-guides/pages/010-install'),
		path.join(reconciled.siteDir, 'pages/020-reference/pages/010-overview/pages/010-install'),
	);
	const reconciliation = await runNorna(reconciled.siteDir, [
		'page:move',
		'/guides/install/',
		'/reference/overview/install/',
		'--write',
	]);
	assert.match(reconciliation.stdout, /Mode: reconcile an already moved page/);
	await assertSuccessfulResult(reconciled.siteDir);
	assert.deepEqual(await snapshotSite(reconciled.siteDir), normalResult);

	const noAliases = await createFixture('no-aliases');
	await runNorna(noAliases.siteDir, [
		'page:move',
		'/guides/install/',
		'/reference/overview/install/',
		'--no-aliases',
		'--write',
	]);
	const noAliasSource = await readFile(
		path.join(noAliases.siteDir, 'pages/020-reference/pages/010-overview/pages/010-install/content.md'),
		'utf8',
	);
	assert.doesNotMatch(noAliasSource, /aliases:/);
	assert.match((await runNorna(noAliases.siteDir, ['content:check'])).stdout, /Content check passed\./);

	const failures = await createFixture('failures');
	const initialFailureState = await snapshotSite(failures.siteDir);
	assert.match(
		await runFailure(failures.siteDir, ['page:move', '/guides/install/', '/guides/workflows/']),
		/both pages exist/,
	);
	assert.match(
		await runFailure(failures.siteDir, ['page:move', '/missing/', '/also-missing/']),
		/neither \/missing\/ nor \/also-missing\/ exists/,
	);
	assert.match(
		await runFailure(failures.siteDir, ['page:move', '/guides/', '/reference/new/']),
		/navigation category, not a page/,
	);
	assert.match(
		await runFailure(failures.siteDir, ['page:move', '/guides/install/', '/reference/']),
		/navigation category already owns that path/,
	);
	assert.match(
		await runFailure(failures.siteDir, ['page:move', '/guides/install/', '/guides/install/reference/new/']),
		/cannot be moved below itself/i,
	);
	assert.match(
		await runFailure(failures.siteDir, ['page:move', '/guides/install/', '/reference/install/', '--order', '10']),
		/Destination order 010 is already used/,
	);
	assert.match(
		await runFailure(failures.siteDir, ['page:move', '/guides/install/', '/missing-parent/install/']),
		/Cannot find destination parent \/missing-parent\//,
	);
	assert.match(
		await runFailure(failures.siteDir, ['page:move', '/', '/welcome/']),
		/homepage cannot be moved/i,
	);
	assert.deepEqual(await snapshotSite(failures.siteDir), initialFailureState);

	await writeFile(
		path.join(failures.siteDir, 'pages/000-home/content.md'),
		`${initialFailureState.get('pages/000-home/content.md')}\n[Broken](/missing-page/)\n`,
	);
	const beforeBrokenPreflight = await snapshotSite(failures.siteDir);
	assert.match(
		await runFailure(failures.siteDir, ['page:move', '/guides/install/', '/reference/overview/install/', '--write']),
		/Page move preflight failed\. No file was changed/,
	);
	assert.deepEqual(await snapshotSite(failures.siteDir), beforeBrokenPreflight);

	const reconcileOrder = await createFixture('reconcile-order');
	await mkdir(path.join(reconcileOrder.siteDir, 'pages/020-reference/pages/010-overview/pages'));
	await rename(
		path.join(reconcileOrder.siteDir, 'pages/010-guides/pages/010-install'),
		path.join(reconcileOrder.siteDir, 'pages/020-reference/pages/010-overview/pages/010-install'),
	);
	assert.match(
		await runFailure(reconcileOrder.siteDir, [
			'page:move',
			'/guides/install/',
			'/reference/overview/install/',
			'--order',
			'30',
		]),
		/--order cannot be used when reconciling/,
	);

	const ambiguous = await createFixture('ambiguous-reconciliation');
	const ambiguousDestination = path.join(
		ambiguous.siteDir,
		'pages/020-reference/pages/010-overview/pages',
	);
	await writeFixtureFile(
		ambiguousDestination,
		'020-workflows/content.md',
		'# Other workflows\n\n## Local {#local}\n\nDifferent target.\n',
	);
	await rename(
		path.join(ambiguous.siteDir, 'pages/010-guides/pages/010-install'),
		path.join(ambiguousDestination, '010-install'),
	);
	const beforeAmbiguousReconciliation = await snapshotSite(ambiguous.siteDir);
	assert.match(
		await runFailure(ambiguous.siteDir, [
			'page:move',
			'/guides/install/',
			'/reference/overview/install/',
			'--write',
		]),
		/Cannot safely reconcile.*From the old page location it identifies \/guides\/workflows\/, but from the new location it identifies \/reference\/overview\/workflows\//s,
	);
	assert.deepEqual(await snapshotSite(ambiguous.siteDir), beforeAmbiguousReconciliation);

	console.log('Page move tests passed.');
} finally {
	await rm(root, { force: true, recursive: true });
}
