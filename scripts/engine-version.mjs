import { createRequire } from 'node:module';
import { mkdir, readFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import path from 'node:path';

import {
	engineRoot,
	engineRootLabel,
	siteProjectRoot,
	siteProjectRootLabel,
} from './lib/site-paths.mjs';

const packageName = '@janga/norna';
const requireFromEngine = createRequire(import.meta.url);

const usage = `
Usage: norna engine:version [--latest]

Options:
  --latest      Also query npm for the latest published norna version
`.trim();

const args = process.argv.slice(2);
const includeLatest = args.includes('--latest');
const unknownArgs = args.filter((arg) => arg !== '--latest');

if (unknownArgs.length > 0) {
	throw new Error(`Unknown option: ${unknownArgs[0]}\n${usage}`);
}

const readJson = async (filePath) => JSON.parse(await readFile(filePath, 'utf8'));

const readOptionalJson = async (filePath) => {
	try {
		return await readJson(filePath);
	} catch (error) {
		if (error?.code === 'ENOENT') {
			return null;
		}

		throw error;
	}
};

const getPackageDependency = (packageJson) => {
	if (!packageJson) {
		return null;
	}

	for (const dependencyType of ['dependencies', 'devDependencies', 'optionalDependencies']) {
		const dependencyVersion = packageJson[dependencyType]?.[packageName];

		if (dependencyVersion) {
			return {
				type: dependencyType,
				version: dependencyVersion,
			};
		}
	}

	return null;
};

const runCapture = (command, args, options = {}) => new Promise((resolve, reject) => {
	const child = spawn(command, args, {
		cwd: siteProjectRoot,
		stdio: ['ignore', 'pipe', 'pipe'],
		...options,
	});
	let stdout = '';
	let stderr = '';

	child.stdout?.on('data', (chunk) => {
		stdout += chunk;
	});
	child.stderr?.on('data', (chunk) => {
		stderr += chunk;
	});
	child.once('error', reject);
	child.once('exit', (code, signal) => {
		if (code === 0) {
			resolve(stdout.trim());
			return;
		}

		const commandText = [command, ...args].join(' ');
		reject(new Error(signal
			? `${commandText} exited with signal ${signal}.`
			: `${commandText} exited with code ${code}.\n${stderr.trim()}`));
	});
});

const npmBin = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const configuredNpmCache = process.env.npm_config_cache ?? process.env.NPM_CONFIG_CACHE;
const npmCachePath = path.resolve(siteProjectRoot, configuredNpmCache ?? path.join('node_modules', '.cache', 'norna-npm'));
const sitePackageJson = await readOptionalJson(path.join(siteProjectRoot, 'package.json'));
const enginePackageJson = await readJson(path.join(engineRoot, 'package.json'));
const astroPackageJson = await readJson(requireFromEngine.resolve('astro/package.json'));
const siteDependency = getPackageDependency(sitePackageJson);

console.log('norna engine:version');
console.log(`Site project root: ${siteProjectRootLabel}`);

if (siteDependency) {
	console.log(`Site dependency: ${packageName} ${siteDependency.version} (${siteDependency.type})`);
} else if (sitePackageJson?.name === packageName) {
	console.log('Site dependency: current engine repository');
} else {
	console.log(`Site dependency: ${packageName} not declared`);
}

console.log(`Installed norna: ${enginePackageJson.version}`);
console.log(`Engine root: ${engineRootLabel}`);
console.log(`Astro dependency: ${enginePackageJson.dependencies?.astro ?? 'not declared'}`);
console.log(`Installed Astro: ${astroPackageJson.version}`);

if (includeLatest) {
	try {
		await mkdir(npmCachePath, { recursive: true });
		const latestVersion = await runCapture(npmBin, [
			'view',
			packageName,
			'version',
			'--registry=https://registry.npmjs.org/',
			'--fetch-retries=0',
		], {
			env: {
				...process.env,
				npm_config_cache: npmCachePath,
			},
		});
		console.log(`npm latest: ${latestVersion}`);
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		console.log(`npm latest: unavailable (${message})`);
	}
}
