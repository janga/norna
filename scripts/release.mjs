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
const npmCachePath = '/private/tmp/cli-gallery-npm-cache';
const releaseTypes = new Set(['patch', 'minor', 'major']);
const releaseArguments = process.argv.slice(2);
const [releaseType] = releaseArguments;
const showHelp = releaseArguments.includes('--help') || releaseArguments.includes('-h');

const printUsage = () => {
	console.log('Usage: node scripts/release.mjs <patch|minor|major>');
	console.log('Checks npm authentication, runs npm test, creates the version commit and tag, publishes to npm, then pushes the commit and tag.');
};

const run = (command, args) => runInherit(command, args, { cwd: repoRoot });

const readPackageVersion = async () => {
	const packageJson = JSON.parse(await readFile(path.join(repoRoot, 'package.json'), 'utf8'));
	return packageJson.version;
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

	await assertCleanWorktree('before the release checks');
	await assertNpmAuthenticated();
	console.log(`Preparing a ${releaseType} release from ${previousVersion}.`);
	await run(npmBin, ['test']);
	await assertCleanWorktree('after the release checks');
	await run(npmBin, ['version', releaseType, '--message', 'Release %s']);

	const publishedVersion = await readPackageVersion();
	await run(npmBin, ['run', 'release:publish']);
	await run('git', ['push', '--follow-tags']);

	console.log(`Released @janga/cli-gallery@${publishedVersion}.`);
}
