import { cp, mkdir, readFile, readdir, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';

import {
	engineRoot,
	invocationRoot,
	siteDirectoryEnv,
} from './lib/site-paths.mjs';

const packageName = '@janga/norna';
const cliExecutableName = 'norna';

const usage = `
Usage: norna init <target-dir> [--type pure|embedded] [--site-dir <path>]

Creates a new site project or adds a Norna site directory to an existing
project.

Examples:
  norna init my-site
  norna init my-site --type pure
  norna init . --type embedded --site-dir presentation
`.trim();

const args = process.argv.slice(2);
const parseArgs = (rawArgs) => {
	const options = {
		siteDirectory: process.env[siteDirectoryEnv] ?? 'site',
		targetDirectory: null,
		type: 'pure',
	};

	for (let index = 0; index < rawArgs.length; index += 1) {
		const arg = rawArgs[index];

		if (arg === '--type') {
			const value = rawArgs[index + 1];
			if (!value || value.startsWith('-')) {
				throw new Error('--type requires "pure" or "embedded".');
			}
			options.type = value;
			index += 1;
			continue;
		}

		if (arg.startsWith('--type=')) {
			options.type = arg.slice('--type='.length);
			continue;
		}

		if (arg === '--site-dir') {
			const value = rawArgs[index + 1];
			if (!value || value.startsWith('-')) {
				throw new Error('--site-dir requires a relative path.');
			}
			options.siteDirectory = value;
			index += 1;
			continue;
		}

		if (arg.startsWith('--site-dir=')) {
			options.siteDirectory = arg.slice('--site-dir='.length);
			continue;
		}

		if (arg.startsWith('-')) {
			throw new Error(`Unknown option: ${arg}\n${usage}`);
		}

		if (options.targetDirectory) {
			throw new Error(usage);
		}

		options.targetDirectory = arg;
	}

	return options;
};

const {
	siteDirectory,
	targetDirectory,
	type,
} = parseArgs(args);

if (!targetDirectory) {
	throw new Error(usage);
}

if (!['pure', 'embedded'].includes(type)) {
	throw new Error(`Invalid --type "${type}". Use "pure" or "embedded".`);
}

if (!siteDirectory || path.isAbsolute(siteDirectory) || siteDirectory.split(/[\\/]/).includes('..')) {
	throw new Error('--site-dir must be a non-empty relative path without "..".');
}

const starterRoot = path.join(engineRoot, 'starters', 'basic');
const starterSiteRoot = path.join(starterRoot, 'site');
const targetRoot = path.resolve(invocationRoot, targetDirectory);
const enginePackageJsonPath = path.join(engineRoot, 'package.json');
const targetPackageJsonPath = path.join(targetRoot, 'package.json');
const targetSiteDir = path.join(targetRoot, siteDirectory);
const isInsideEngineRoot = (candidatePath) => {
	const relativePath = path.relative(engineRoot, candidatePath);
	return relativePath && !relativePath.startsWith('..') && !path.isAbsolute(relativePath);
};

const readDirectoryEntries = async (directoryPath) => {
	try {
		return await readdir(directoryPath);
	} catch (error) {
		if (error?.code === 'ENOENT') {
			return null;
		}

		throw error;
	}
};

const readJsonFile = async (filePath) => JSON.parse(await readFile(filePath, 'utf8'));

const siteDirArg = siteDirectory === 'site' ? [] : ['--site-dir', siteDirectory];
const cliCommand = (command) => [cliExecutableName, ...siteDirArg, command].join(' ');
const galleryScripts = {
	'norna:dev': cliCommand('dev:local'),
	'norna:dev:lan': cliCommand('dev:lan'),
	'norna:dev:restart': cliCommand('dev:restart'),
	'norna:dev:status': cliCommand('dev:status'),
	'norna:dev:logs': cliCommand('dev:logs'),
	'norna:dev:stop': cliCommand('dev:stop'),
	'norna:check': 'npm run norna:config:check && npm run norna:content:check',
	'norna:config:check': cliCommand('config:check'),
	'norna:content:check': cliCommand('content:check'),
	'norna:sync': cliCommand('content:sync'),
	'norna:typography:presets': cliCommand('typography presets'),
	'norna:typography:show': cliCommand('typography show'),
	'norna:public': cliCommand('site:public'),
	'norna:images': cliCommand('images'),
	'norna:build': cliCommand('build'),
	'norna:build:local': cliCommand('build:local'),
	'norna:deploy': cliCommand('deploy'),
	'norna:deploy:commit': cliCommand('deploy:commit'),
	'norna:deploy:watch': cliCommand('deploy:watch'),
	'norna:doctor': cliCommand('doctor'),
	'norna:preview': cliCommand('preview'),
	'norna:engine:update': cliCommand('engine:update'),
	'norna:engine:version': cliCommand('engine:version'),
};

const addGalleryDependency = (packageJson, version) => {
	packageJson.dependencies ??= {};
	packageJson.dependencies[packageName] ??= version;
};

const addGalleryScripts = (packageJson, scripts, { includePureAliases }) => {
	packageJson.scripts ??= {};
	const wantedScripts = {
		...(includePureAliases ? { dev: 'npm run norna:dev --' } : {}),
		...scripts,
		...(includePureAliases ? { build: 'npm run norna:build' } : {}),
	};
	const conflicts = Object.entries(wantedScripts).filter(([name, value]) => (
		packageJson.scripts[name] !== undefined && packageJson.scripts[name] !== value
	));

	if (conflicts.length > 0) {
		throw new Error([
			'Refusing to overwrite existing npm scripts:',
			...conflicts.map(([name, value]) => `- ${name}: existing "${packageJson.scripts[name]}", wanted "${value}"`),
		].join('\n'));
	}

	Object.assign(packageJson.scripts, wantedScripts);
};

const enginePackageJson = await readJsonFile(enginePackageJsonPath);
const existingEntries = await readDirectoryEntries(targetRoot);

if (type === 'pure') {
	if (existingEntries && existingEntries.length > 0) {
		const existingPackageJson = existingEntries.includes('package.json')
			? ' The target already contains package.json; use --type embedded to add a Norna site to an existing project.'
			: '';
		throw new Error(`Target directory must be empty for --type pure: ${targetRoot}.${existingPackageJson}`);
	}

	await mkdir(path.dirname(targetRoot), { recursive: true });
	await cp(starterRoot, targetRoot, {
		filter: (source) => path.basename(source) !== '.DS_Store',
		recursive: true,
	});

	if (siteDirectory !== 'site') {
		await mkdir(path.dirname(targetSiteDir), { recursive: true });
		await rename(path.join(targetRoot, 'site'), targetSiteDir);
	}

	const targetPackageJson = await readJsonFile(targetPackageJsonPath);
	targetPackageJson.dependencies[packageName] = enginePackageJson.version;
	if (siteDirectory !== 'site') {
		targetPackageJson.scripts = {};
		addGalleryScripts(targetPackageJson, galleryScripts, { includePureAliases: true });
	}
	await writeFile(targetPackageJsonPath, `${JSON.stringify(targetPackageJson, null, 2)}\n`);
} else {
	if (!existingEntries) {
		throw new Error(`Target directory must exist for --type embedded: ${targetRoot}`);
	}

	const targetPackageJson = await readJsonFile(targetPackageJsonPath).catch((error) => {
		if (error?.code === 'ENOENT') {
			throw new Error(`Embedded setup requires an existing package.json in ${targetRoot}.`);
		}

		throw error;
	});
	const existingSiteEntries = await readDirectoryEntries(targetSiteDir);

	if (existingSiteEntries && existingSiteEntries.length > 0) {
		throw new Error(`Norna site directory must be empty for --type embedded: ${targetSiteDir}`);
	}

	addGalleryDependency(targetPackageJson, enginePackageJson.version);
	addGalleryScripts(targetPackageJson, galleryScripts, { includePureAliases: false });
	await mkdir(path.dirname(targetSiteDir), { recursive: true });
	await cp(starterSiteRoot, targetSiteDir, {
		filter: (source) => path.basename(source) !== '.DS_Store',
		recursive: true,
	});
	await writeFile(targetPackageJsonPath, `${JSON.stringify(targetPackageJson, null, 2)}\n`);
}

console.log(type === 'embedded'
	? `Added norna site directory at ${targetSiteDir}`
	: `Created norna site at ${targetRoot}`);
if (isInsideEngineRoot(targetRoot)) {
	console.warn('');
	console.warn('Warning: This site was created inside the norna engine repository.');
	console.warn('For normal site projects, create the site next to the engine repository instead, for example as a sibling directory under your Projects folder.');
	console.warn('That keeps site content, npm installs, commits, and releases separate from engine development.');
}
console.log('');
console.log('Next steps:');
console.log(`  cd ${targetRoot}`);
console.log(type === 'embedded'
	? '  npm install'
	: '  npm install');
console.log(type === 'embedded'
	? '  npm run norna:dev'
	: '  npm run dev');
