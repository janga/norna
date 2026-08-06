import { existsSync } from 'node:fs';
import { mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';

import { runInherit } from './lib/run-command.mjs';
import { normalizeCiLockfile, verifyCiLockfile } from './lib/ci-lockfile.mjs';
import {
	siteProjectRoot,
	siteProjectRootLabel,
} from './lib/site-paths.mjs';

const packageName = '@janga/norna';
const usage = `
Usage: norna engine:update [version|latest] [--skip-checks]

Examples:
  norna engine:update
  norna engine:update latest
  norna engine:update 0.1.15

Options:
  --skip-checks     Update package files without running config/content/build checks
`.trim();

const args = process.argv.slice(2);
let targetVersion = 'latest';
let hasTargetVersion = false;
let skipChecks = false;

for (const arg of args) {
	if (arg === '--skip-checks') {
		skipChecks = true;
		continue;
	}

	if (arg.startsWith('-')) {
		throw new Error(`Unknown option: ${arg}\n${usage}`);
	}

	if (hasTargetVersion) {
		throw new Error(`Unexpected argument: ${arg}\n${usage}`);
	}

	targetVersion = arg;
	hasTargetVersion = true;
}

const readJson = async (filePath) => JSON.parse(await readFile(filePath, 'utf8'));

const sitePackageJsonPath = path.join(siteProjectRoot, 'package.json');
const sitePackageJson = await readJson(sitePackageJsonPath);
const dependencyVersion = sitePackageJson.dependencies?.[packageName]
	?? sitePackageJson.devDependencies?.[packageName]
	?? sitePackageJson.optionalDependencies?.[packageName];

if (sitePackageJson.name === packageName) {
	throw new Error('engine:update must be run from a site repository, not from the norna engine repository.');
}

if (!dependencyVersion) {
	throw new Error(`${siteProjectRootLabel}/package.json does not declare ${packageName}.`);
}

const npmBin = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const configuredNpmCache = process.env.npm_config_cache ?? process.env.NPM_CONFIG_CACHE;
const npmCachePath = path.resolve(siteProjectRoot, configuredNpmCache ?? path.join('node_modules', '.cache', 'norna-npm'));
const nornaBin = path.join(
	siteProjectRoot,
	'node_modules',
	'.bin',
	process.platform === 'win32' ? 'norna.cmd' : 'norna',
);

console.log(`Updating ${packageName} in ${siteProjectRootLabel}`);
console.log(`Current dependency: ${dependencyVersion}`);
console.log(`Target version: ${targetVersion}`);
console.log(`npm cache: ${npmCachePath}`);

await mkdir(npmCachePath, { recursive: true });
await runInherit(npmBin, [
	'install',
	`${packageName}@${targetVersion}`,
	'--save-exact',
	'--fetch-retries=0',
], {
	cwd: siteProjectRoot,
	env: {
		...process.env,
		npm_config_cache: npmCachePath,
	},
});

console.log('Normalizing package-lock.json for the GitHub Actions Linux npm environment.');
await normalizeCiLockfile(siteProjectRoot, {
	env: {
		...process.env,
		npm_config_cache: npmCachePath,
	},
});

console.log('Verifying package-lock.json with a clean GitHub Actions npm install.');
await verifyCiLockfile(siteProjectRoot, {
	env: {
		...process.env,
		npm_config_cache: npmCachePath,
	},
});

if (skipChecks) {
	console.log('Skipped checks.');
	process.exit(0);
}

if (!existsSync(nornaBin)) {
	throw new Error(`Installed norna binary was not found: ${nornaBin}`);
}

for (const command of ['config:check', 'content:check', 'build']) {
	console.log('');
	console.log(`Running norna ${command}`);
	await runInherit(nornaBin, [command], {
		cwd: siteProjectRoot,
	});
}

console.log('');
console.log('Engine update complete. Commit package.json and package-lock.json together.');
