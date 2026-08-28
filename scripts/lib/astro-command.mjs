import path from 'node:path';
import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';
import {
	astroRootDir,
	engineRoot,
	siteProjectRoot,
} from './site-paths.mjs';
import { runInherit } from './run-command.mjs';

const require = createRequire(import.meta.url);
const astroPackagePath = require.resolve('astro/package.json');
const astroPackage = require(astroPackagePath);

export const astroBinPath = path.join(path.dirname(astroPackagePath), astroPackage.bin.astro);
export const astroConfigPath = path.relative(astroRootDir, path.join(engineRoot, 'astro.config.mjs'))
	.split(path.sep)
	.join('/');

export const getAstroArgs = (args) => {
	mkdirSync(astroRootDir, { recursive: true });
	return [
		astroBinPath,
		'--root',
		astroRootDir,
		'--config',
		astroConfigPath,
		...args,
	];
};

export const runAstroInherit = (args, options = {}) => runInherit(
	process.execPath,
	getAstroArgs(args),
	{
		cwd: siteProjectRoot,
		...options,
	},
);
