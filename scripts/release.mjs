import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { execFile } from 'node:child_process';
import { runInherit } from './lib/run-command.mjs';

const execFileAsync = promisify(execFile);
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const npmBin = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const npmRegistry = 'https://registry.npmjs.org/';
const npmCachePath = '/private/tmp/norna-npm-cache';
const releaseTypes = new Set(['patch', 'minor', 'major']);
const releaseArguments = process.argv.slice(2);
const [releaseType] = releaseArguments;
const showHelp = releaseArguments.includes('--help') || releaseArguments.includes('-h');

const printUsage = () => {
	console.log('Usage: node scripts/release.mjs <patch|minor|major>');
	console.log('Checks npm authentication, prepares the version and schemas, runs npm test, creates the release commit and tag, publishes to npm, then pushes.');
};

const run = (command, args) => runInherit(command, args, { cwd: repoRoot });

const readPackageVersion = async () => {
	const packageJson = JSON.parse(await readFile(path.join(repoRoot, 'package.json'), 'utf8'));
	return packageJson.version;
};

const releasePaths = ['package.json', 'package-lock.json', 'schemas'];

const getWorktreeChanges = async () => {
	const { stdout } = await execFileAsync('git', ['status', '--short'], { cwd: repoRoot });
	return stdout.trim() ? stdout.trim().split('\n') : [];
};

const getStatusPath = (line) => line.slice(3).split(' -> ').at(-1);

const isReleasePath = (filePath) => (
	filePath === 'package.json'
	|| filePath === 'package-lock.json'
	|| filePath === 'schemas'
	|| filePath.startsWith('schemas/')
);

const assertOnlyReleaseChanges = async () => {
	const changes = await getWorktreeChanges();
	const unexpected = changes.filter((line) => !isReleasePath(getStatusPath(line)));
	if (unexpected.length > 0) {
		throw new Error(`Release checks changed unexpected files:\n${unexpected.join('\n')}`);
	}
	for (const requiredPath of ['package.json', 'package-lock.json']) {
		if (!changes.some((line) => getStatusPath(line) === requiredPath)) {
			throw new Error(`Release preparation did not update ${requiredPath}.`);
		}
	}
};

const assertTagDoesNotExist = async (tag) => {
	try {
		await execFileAsync('git', ['rev-parse', '--quiet', '--verify', `refs/tags/${tag}`], { cwd: repoRoot });
	} catch (error) {
		if (error?.code === 1) return;
		throw error;
	}
	throw new Error(`Git tag ${tag} already exists.`);
};

const rollbackPreparedRelease = async () => {
	await execFileAsync('git', ['restore', '--staged', '--worktree', '--', ...releasePaths], { cwd: repoRoot });
	console.log('Release preparation failed before commit. Restored package version and generated schemas.');
};

const assertCleanWorktree = async (stage) => {
	const { stdout } = await execFileAsync('git', ['status', '--short'], { cwd: repoRoot });

	if (stdout.trim()) {
		throw new Error(`Working tree must be clean ${stage}. Commit, stash, or discard the listed changes first.\n${stdout.trim()}`);
	}
};

const assertNpmAuthenticated = async () => {
	try {
		const { stdout } = await execFileAsync(npmBin, [
			'whoami',
			`--registry=${npmRegistry}`,
			'--cache',
			npmCachePath,
		], { cwd: repoRoot });
		console.log(`npm registry authentication: ${stdout.trim()}`);
	} catch {
		throw new Error([
			'Cannot publish because npm is not authenticated for the registry/cache used by release:publish.',
			'Run this command, complete the browser login, then start the release again:',
			`npm login --registry=${npmRegistry} --auth-type=web --cache ${npmCachePath}`,
		].join('\n'));
	}
};

if (showHelp || !releaseType) {
	printUsage();
	process.exitCode = showHelp ? 0 : 1;
} else if (!releaseTypes.has(releaseType)) {
	printUsage();
	throw new Error(`Unsupported release type: ${releaseType}`);
} else {
	const previousVersion = await readPackageVersion();
	let preparationStarted = false;
	let releaseCommitCreated = false;
	let releaseTagCreated = false;
	let publishedVersion = null;

	await assertCleanWorktree('before the release checks');
	await assertNpmAuthenticated();
	console.log(`Preparing a ${releaseType} release from ${previousVersion}.`);

	try {
		preparationStarted = true;
		await run(npmBin, ['version', releaseType, '--no-git-tag-version']);
		publishedVersion = await readPackageVersion();
		const releaseTag = `v${publishedVersion}`;
		if (publishedVersion === previousVersion) {
			throw new Error(`Version did not change from ${previousVersion}.`);
		}

		await assertTagDoesNotExist(releaseTag);
		await run(npmBin, ['run', 'schemas:generate']);
		await run(npmBin, ['test']);
		await assertOnlyReleaseChanges();
		await run('git', ['add', ...releasePaths]);
		await run('git', ['commit', '-m', `Release ${releaseTag}`]);
		releaseCommitCreated = true;
		await run('git', ['tag', releaseTag]);
		releaseTagCreated = true;
		await run(npmBin, ['run', 'release:publish']);
		await run('git', ['push', '--follow-tags']);

		console.log(`Released @janga/norna@${publishedVersion}.`);
	} catch (error) {
		if (preparationStarted && !releaseCommitCreated) {
			try {
				await rollbackPreparedRelease();
			} catch (rollbackError) {
				throw new AggregateError([error, rollbackError], 'Release failed and automatic rollback also failed.');
			}
		} else if (releaseCommitCreated) {
			const state = releaseTagCreated
				? `Release commit and tag v${publishedVersion} remain locally.`
				: `Release commit for v${publishedVersion} remains locally, but its tag was not created.`;
			console.error(state);
		}
		throw error;
	}
}
