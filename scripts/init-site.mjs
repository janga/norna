import { cp, mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

import {
	engineRoot,
	invocationRoot,
} from './lib/site-paths.mjs';

const usage = `
Usage: cli-gallery init <target-dir>

Creates a new site project by copying the packaged basic starter.
The target directory must not exist or must be empty.
`.trim();

const args = process.argv.slice(2);
const [targetDirectory, ...extraArgs] = args;

if (!targetDirectory || extraArgs.length > 0 || targetDirectory.startsWith('-')) {
	throw new Error(usage);
}

const starterRoot = path.join(engineRoot, 'starters', 'basic');
const targetRoot = path.resolve(invocationRoot, targetDirectory);
const enginePackageJsonPath = path.join(engineRoot, 'package.json');
const targetPackageJsonPath = path.join(targetRoot, 'package.json');
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

const existingEntries = await readDirectoryEntries(targetRoot);

if (existingEntries && existingEntries.length > 0) {
	throw new Error(`Target directory must be empty: ${targetRoot}`);
}

await mkdir(path.dirname(targetRoot), { recursive: true });
await cp(starterRoot, targetRoot, {
	filter: (source) => path.basename(source) !== '.DS_Store',
	recursive: true,
});

const enginePackageJson = JSON.parse(await readFile(enginePackageJsonPath, 'utf8'));
const targetPackageJson = JSON.parse(await readFile(targetPackageJsonPath, 'utf8'));
targetPackageJson.dependencies['@janga/cli-gallery'] = enginePackageJson.version;
await writeFile(targetPackageJsonPath, `${JSON.stringify(targetPackageJson, null, 2)}\n`);

console.log(`Created cli-gallery site at ${targetRoot}`);
if (isInsideEngineRoot(targetRoot)) {
	console.warn('');
	console.warn('Warning: This site was created inside the cli-gallery engine repository.');
	console.warn('For normal site projects, create the site next to the engine repository instead, for example as a sibling directory under your Projects folder.');
	console.warn('That keeps site content, npm installs, commits, and releases separate from engine development.');
}
console.log('');
console.log('Next steps:');
console.log(`  cd ${targetRoot}`);
console.log('  npm install');
console.log('  npm run gallery:dev');
