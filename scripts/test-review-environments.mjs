import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { lstat, mkdir, mkdtemp, readFile, readdir, realpath, rename, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import {
	getReviewEnvironment,
	reviewEnvironmentNames,
	reviewEnvironments,
} from './review-environment-registry.mjs';
import {
	resolveReviewEnvironment,
	runReviewEnvironment,
} from './review-environments.mjs';
import {
	cleanScratchSite,
	prepareScratchSite,
	readScratchSource,
} from './review-scratch-site.mjs';
import { reserveBrowserTestPort } from './browser-test-port.mjs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const temporaryRoot = await mkdtemp(path.join(tmpdir(), 'norna-review-environments-'));

const expectFailure = async (operation, pattern) => {
	try {
		await operation();
	} catch (error) {
		assert.match(error instanceof Error ? error.message : String(error), pattern);
		return;
	}

	assert.fail(`Expected failure matching ${pattern}`);
};

const createSite = async (siteDirectory, { title = 'Scratch page' } = {}) => {
	await mkdir(path.join(siteDirectory, 'pages', '000-home'), { recursive: true });
	await writeFile(path.join(siteDirectory, 'config.yaml'), 'url: https://example.com/scratch/\n');
	await writeFile(path.join(siteDirectory, 'theme.yaml'), 'preset: documentation\n');
	await writeFile(path.join(siteDirectory, 'pages', '000-home', 'content.md'), `# ${title}\n`);
};

try {
	assert.deepEqual(reviewEnvironmentNames, ['docs', 'presentation', 'navigation', 'presets', 'scratch']);
	assert.equal(
		new Set(Object.values(reviewEnvironments).map(({ port }) => port)).size,
		reviewEnvironmentNames.length,
		'Every review target must have a distinct manual-review port.',
	);
	assert.equal(
		new Set(Object.values(reviewEnvironments).map(({ siteDirectory }) => siteDirectory)).size,
		reviewEnvironmentNames.length,
		'Every review target must have a distinct site directory.',
	);
	assert.throws(() => getReviewEnvironment('missing'), /Choose one of: docs, presentation, navigation, presets, scratch/);

	const docsEnvironment = await resolveReviewEnvironment('docs', { root: repoRoot });
	assert.equal(docsEnvironment.url, 'http://127.0.0.1:4321/norna/');
	const navigationEnvironment = await resolveReviewEnvironment('navigation', { root: repoRoot });
	assert.equal(navigationEnvironment.url, 'http://127.0.0.1:4323/');

	const isolatedStateDirectory = path.join(temporaryRoot, 'isolated-state');
	const sitePathsUrl = pathToFileURL(path.join(repoRoot, 'scripts', 'lib', 'site-paths.mjs')).href;
	const isolatedPathsResult = spawnSync(process.execPath, [
		'--input-type=module',
		'--eval',
		`const paths = await import(${JSON.stringify(sitePathsUrl)}); console.log(JSON.stringify({
			astroCacheDir: paths.astroCacheDir,
			astroDistDir: paths.astroDistDir,
			astroPublicDir: paths.astroPublicDir,
			siteDir: paths.siteDir,
			siteStateDir: paths.siteStateDir,
		}));`,
	], {
		cwd: repoRoot,
		encoding: 'utf8',
		env: {
			...process.env,
			NORNA_INTERNAL_STATE_DIR: isolatedStateDirectory,
			NORNA_INVOCATION_ROOT: repoRoot,
			NORNA_SITE_DIR: navigationEnvironment.siteDirectory,
		},
	});
	assert.equal(isolatedPathsResult.status, 0, isolatedPathsResult.stderr);
	assert.deepEqual(JSON.parse(isolatedPathsResult.stdout), {
		astroCacheDir: path.join(isolatedStateDirectory, '.astro'),
		astroDistDir: path.join(isolatedStateDirectory, 'dist'),
		astroPublicDir: path.join(isolatedStateDirectory, 'public'),
		siteDir: navigationEnvironment.siteDirectory,
		siteStateDir: isolatedStateDirectory,
	});

	const calls = [];
	const messages = [];
	const run = async (command, args, options) => {
		calls.push({ command, args, options });
	};
	const write = (message) => messages.push(message);

	await runReviewEnvironment(['start', 'docs'], { root: repoRoot, run, write });
	assert.equal(calls.length, 1);
	assert.equal(calls[0].args.at(-1), 'dev:local');
	assert.equal(calls[0].args.includes('--kill'), false);
	assert.equal(calls[0].options.env.NORNA_DEV_PORT, '4321');
	assert.equal(calls[0].options.env.NORNA_NO_OPEN, '1');
	assert.ok(messages.includes('Documentation site: http://127.0.0.1:4321/norna/'));

	calls.length = 0;
	await runReviewEnvironment(['logs', 'navigation', '--follow'], { root: repoRoot, run, write });
	assert.deepEqual(calls[0].args.slice(-2), ['dev:logs', '--follow']);

	calls.length = 0;
	await runReviewEnvironment(['test', 'navigation'], { root: repoRoot, run, write });
	assert.equal(calls.length, 1);
	assert.ok(calls[0].args[0].endsWith(path.join('scripts', 'test-navigation.mjs')));
	assert.deepEqual(calls[0].args.slice(-2), [
		'tests/navigation-tree.spec.ts',
		'tests/page-contents-placement.spec.ts',
	]);
	assert.equal(Object.hasOwn(calls[0].options.env ?? {}, 'NORNA_DEV_PORT'), false);

	await expectFailure(
		() => runReviewEnvironment(['test', 'docs'], { root: repoRoot, run, write }),
		/has no registered browser suite[\s\S]*navigation, presets/,
	);
	await expectFailure(
		() => runReviewEnvironment(['start', 'docs', '--kill'], { root: repoRoot, run, write }),
		/Unexpected start option: --kill/,
	);

	const portLockRoot = path.join(temporaryRoot, 'port-locks');
	const proposedPorts = [45001, 45001, 45002];
	const getPort = async () => proposedPorts.shift();
	const firstReservation = await reserveBrowserTestPort({ lockRoot: portLockRoot, getPort });
	const secondReservation = await reserveBrowserTestPort({ lockRoot: portLockRoot, getPort });
	assert.equal(firstReservation.port, 45001);
	assert.equal(secondReservation.port, 45002);
	await Promise.all([firstReservation.release(), secondReservation.release()]);

	await writeFile(path.join(portLockRoot, '45003.json'), `${JSON.stringify({
		pid: 2_147_483_647,
		token: 'stale-reservation',
		createdAt: new Date(0).toISOString(),
	})}\n`);
	const recoveredReservation = await reserveBrowserTestPort({
		lockRoot: portLockRoot,
		getPort: async () => 45003,
	});
	assert.equal(recoveredReservation.port, 45003);
	await recoveredReservation.release();

	const workspaceRoot = path.join(temporaryRoot, 'workspace');
	const sourceDirectory = path.join(workspaceRoot, 'source site');
	const scratchRoot = path.join(workspaceRoot, '.local', 'test-sites', 'scratch');
	const targetDirectory = path.join(scratchRoot, 'site');
	await createSite(sourceDirectory);
	await mkdir(path.join(sourceDirectory, '.norna', 'public'), { recursive: true });
	await mkdir(path.join(sourceDirectory, 'node_modules', 'dependency'), { recursive: true });
	await mkdir(path.join(sourceDirectory, 'dist'), { recursive: true });
	await mkdir(path.join(sourceDirectory, 'test-results'), { recursive: true });
	await writeFile(path.join(sourceDirectory, '.norna', 'public', 'generated.txt'), 'generated\n');
	await writeFile(path.join(sourceDirectory, 'node_modules', 'dependency', 'index.js'), 'generated\n');
	await writeFile(path.join(sourceDirectory, 'dist', 'index.html'), 'generated\n');
	await writeFile(path.join(sourceDirectory, 'test-results', 'result.txt'), 'generated\n');
	await writeFile(path.join(sourceDirectory, 'preview.log'), 'generated\n');

	const originalContent = await readFile(path.join(sourceDirectory, 'pages', '000-home', 'content.md'), 'utf8');
	const canonicalSourceDirectory = await realpath(sourceDirectory);
	const prepared = await prepareScratchSite({
		repositoryRoot: workspaceRoot,
		sourcePath: 'source site',
		scratchRoot,
	});
	assert.equal(prepared.sourceDirectory, canonicalSourceDirectory);
	assert.equal(prepared.targetDirectory, targetDirectory);
	assert.equal(await readFile(path.join(targetDirectory, 'pages', '000-home', 'content.md'), 'utf8'), originalContent);
	for (const excludedPath of ['.norna', 'node_modules', 'dist', 'test-results', 'preview.log']) {
		await assert.rejects(lstat(path.join(targetDirectory, excludedPath)), { code: 'ENOENT' });
	}
	assert.equal(await readFile(path.join(sourceDirectory, 'pages', '000-home', 'content.md'), 'utf8'), originalContent);
	const sourceRecord = await readScratchSource({ repositoryRoot: workspaceRoot, scratchRoot });
	assert.equal(sourceRecord.sourceDirectory, canonicalSourceDirectory);

	await expectFailure(
		() => prepareScratchSite({ repositoryRoot: workspaceRoot, sourcePath: 'source site', scratchRoot }),
		/Scratch site already exists[\s\S]*--replace/,
	);

	await writeFile(path.join(sourceDirectory, 'pages', '000-home', 'content.md'), '# Replaced page\n');
	await prepareScratchSite({
		repositoryRoot: workspaceRoot,
		sourcePath: 'source site',
		scratchRoot,
		replace: true,
	});
	assert.equal(await readFile(path.join(targetDirectory, 'pages', '000-home', 'content.md'), 'utf8'), '# Replaced page\n');

	const brokenSource = path.join(workspaceRoot, 'broken site');
	await mkdir(path.join(brokenSource, 'pages'), { recursive: true });
	await writeFile(path.join(brokenSource, 'config.yaml'), 'url: https://example.com/\n');
	await expectFailure(
		() => prepareScratchSite({
			repositoryRoot: workspaceRoot,
			sourcePath: 'broken site',
			scratchRoot,
			replace: true,
		}),
		/missing theme.yaml/,
	);
	assert.equal(await readFile(path.join(targetDirectory, 'pages', '000-home', 'content.md'), 'utf8'), '# Replaced page\n');

	const stalePrevious = path.join(scratchRoot, '.previous-stale');
	await rename(targetDirectory, stalePrevious);
	await mkdir(path.join(scratchRoot, '.incoming-stale'), { recursive: true });
	await expectFailure(
		() => prepareScratchSite({ repositoryRoot: workspaceRoot, sourcePath: 'source site', scratchRoot }),
		/Scratch site already exists/,
	);
	assert.equal(await readFile(path.join(targetDirectory, 'pages', '000-home', 'content.md'), 'utf8'), '# Replaced page\n');
	await assert.rejects(lstat(path.join(scratchRoot, '.incoming-stale')), { code: 'ENOENT' });

	const cleanedTarget = await cleanScratchSite({ repositoryRoot: workspaceRoot, scratchRoot });
	assert.equal(cleanedTarget, targetDirectory);
	assert.deepEqual(await lstat(targetDirectory).then((stats) => stats.isDirectory()), true);
	assert.deepEqual(await readScratchSource({ repositoryRoot: workspaceRoot, scratchRoot }), null);

	calls.length = 0;
	messages.length = 0;
	await runReviewEnvironment([
		'scratch',
		'prepare',
		'--from',
		'source site',
	], { root: workspaceRoot, run, write });
	assert.equal(calls.length, 0);
	assert.ok(messages.some((message) => message === 'Scratch review URL: http://127.0.0.1:4399/scratch/'));

	calls.length = 0;
	await runReviewEnvironment([
		'scratch',
		'prepare',
		'--from',
		'source site',
		'--replace',
	], { root: workspaceRoot, run, write });
	assert.equal(calls.length, 1);
	assert.equal(calls[0].args.at(-1), 'dev:stop');
	assert.equal(calls[0].options.env.NORNA_DEV_PORT, '4399');

	calls.length = 0;
	await runReviewEnvironment(['scratch', 'clean'], { root: workspaceRoot, run, write });
	assert.equal(calls.length, 1);
	assert.equal(calls[0].args.at(-1), 'dev:stop');
	assert.deepEqual(await lstat(targetDirectory).then((stats) => stats.isDirectory()), true);
	assert.deepEqual(await readdir(targetDirectory), []);

	console.log('Review environment tests passed.');
} finally {
	await rm(temporaryRoot, { recursive: true, force: true });
}
