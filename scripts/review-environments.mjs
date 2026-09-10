import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import yaml from 'js-yaml';
import { runInherit } from './lib/run-command.mjs';
import {
	getReviewEnvironment,
	reviewEnvironmentNames,
} from './review-environment-registry.mjs';
import {
	cleanScratchSite,
	prepareScratchSite,
	readScratchSource,
} from './review-scratch-site.mjs';
import { captureReviewPage } from './review-capture.mjs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const cliPath = path.join(repoRoot, 'bin', 'norna.mjs');
const browserTestRunnerPath = path.join(repoRoot, 'scripts', 'test-navigation.mjs');

const usage = `
Usage:
  npm run review:start -- <target>
  npm run review:status -- <target>
  npm run review:logs -- <target> [--follow]
  npm run review:stop -- <target>
  npm run review:test -- <target>
  npm run review:capture -- <target> <relative-page> [--viewport <profile|WIDTHxHEIGHT>] [--appearance <name>] [--full-page]
  npm run review:scratch -- prepare --from <site-dir> [--replace]
  npm run review:scratch -- clean
  npm run review:scratch -- status

Targets: ${reviewEnvironmentNames.join(', ')}
`.trim();

const normalizeBasePath = (value) => {
	const withLeadingSlash = value.startsWith('/') ? value : `/${value}`;
	return withLeadingSlash.endsWith('/') ? withLeadingSlash : `${withLeadingSlash}/`;
};

export const readConfiguredBasePath = async (siteDirectory) => {
	let source;
	try {
		source = await readFile(path.join(siteDirectory, 'config.yaml'), 'utf8');
	} catch (error) {
		if (error.code === 'ENOENT') {
			throw new Error(`Review site is missing config.yaml: ${siteDirectory}`);
		}

		throw error;
	}

	const config = yaml.load(source);
	if (!config || typeof config !== 'object' || typeof config.url !== 'string') {
		throw new Error(`Review site config must define url: ${path.join(siteDirectory, 'config.yaml')}`);
	}

	try {
		return normalizeBasePath(new URL(config.url).pathname);
	} catch {
		throw new Error(`Review site config has an invalid url: ${path.join(siteDirectory, 'config.yaml')}`);
	}
};

export const resolveReviewEnvironment = async (name, { root = repoRoot } = {}) => {
	const definition = getReviewEnvironment(name);
	const siteDirectory = path.resolve(root, definition.siteDirectory);
	const basePath = await readConfiguredBasePath(siteDirectory);

	if (definition.basePath && basePath !== definition.basePath) {
		throw new Error([
			`Review target "${name}" expected base path ${definition.basePath}, received ${basePath}.`,
			`Update ${path.join(definition.siteDirectory, 'config.yaml')} or the review environment registry.`,
		].join('\n'));
	}

	return {
		...definition,
		name,
		siteDirectory,
		basePath,
		url: `http://127.0.0.1:${definition.port}${basePath}`,
	};
};

const assertArguments = (operation, trailingArguments) => {
	if (operation === 'logs') {
		if (trailingArguments.length === 0) return [];
		if (trailingArguments.length === 1 && trailingArguments[0] === '--follow') return trailingArguments;
	}

	if (trailingArguments.length > 0) {
		throw new Error(`Unexpected ${operation} option: ${trailingArguments[0]}\n${usage}`);
	}

	return [];
};

const devCommandByOperation = {
	start: 'dev:local',
	status: 'dev:status',
	logs: 'dev:logs',
	stop: 'dev:stop',
};

const parseScratchPrepareArguments = (rawArguments) => {
	let sourcePath;
	let replace = false;

	for (let index = 0; index < rawArguments.length; index += 1) {
		const argument = rawArguments[index];
		if (argument === '--replace') {
			replace = true;
			continue;
		}
		if (argument === '--from') {
			sourcePath = rawArguments[index + 1];
			if (!sourcePath || sourcePath.startsWith('--')) {
				throw new Error('--from requires a site-directory path.');
			}
			index += 1;
			continue;
		}

		throw new Error(`Unexpected scratch option: ${argument}\n${usage}`);
	}

	return { replace, sourcePath };
};

const runScratchOperation = async (
	[subcommand, ...rawArguments],
	{
		root,
		write,
		prepare = prepareScratchSite,
		clean = cleanScratchSite,
		readSource = readScratchSource,
		run,
	},
) => {
	const scratchDefinition = getReviewEnvironment('scratch');
	const targetDirectory = path.resolve(root, scratchDefinition.siteDirectory);
	const stopPreparedScratchServer = async () => {
		try {
			await readFile(path.join(targetDirectory, 'config.yaml'));
		} catch (error) {
			if (error.code === 'ENOENT') return;
			throw error;
		}

		await run(process.execPath, [
			cliPath,
			'--site-dir',
			targetDirectory,
			'dev:stop',
		], {
			cwd: root,
			env: {
				...process.env,
				NORNA_DEV_PORT: String(scratchDefinition.port),
				NORNA_NO_OPEN: '1',
			},
		});
	};

	if (subcommand === 'prepare') {
		const options = parseScratchPrepareArguments(rawArguments);
		if (options.replace) await stopPreparedScratchServer();
		const result = await prepare({
			repositoryRoot: root,
			sourcePath: options.sourcePath,
			replace: options.replace,
		});
		const environment = await resolveReviewEnvironment('scratch', { root });
		write(`Copied ${result.sourceDirectory}`);
		write(`Scratch site: ${result.targetDirectory}`);
		write(`Scratch review URL: ${environment.url}`);
		return environment;
	}

	if (subcommand === 'clean') {
		if (rawArguments.length > 0) throw new Error(`Unexpected scratch clean option: ${rawArguments[0]}`);
		await stopPreparedScratchServer();
		await clean({ repositoryRoot: root });
		write(`Scratch site removed. Reserved path: ${targetDirectory}`);
		return null;
	}

	if (subcommand === 'status') {
		if (rawArguments.length > 0) throw new Error(`Unexpected scratch status option: ${rawArguments[0]}`);
		const source = await readSource({ repositoryRoot: root });
		if (!source) {
			write(`No scratch site is prepared. Reserved path: ${targetDirectory}`);
			return null;
		}
		const environment = await resolveReviewEnvironment('scratch', { root });
		write(`Scratch source: ${source.sourceDirectory}`);
		write(`Scratch site: ${targetDirectory}`);
		write(`Scratch review URL: ${environment.url}`);
		return environment;
	}

	throw new Error(`Unknown scratch operation "${subcommand ?? ''}".\n${usage}`);
};

export const runReviewEnvironment = async (
	[operation, targetName, ...trailingArguments],
	{
		root = repoRoot,
		run = runInherit,
		write = console.log,
		prepare = prepareScratchSite,
		clean = cleanScratchSite,
		readSource = readScratchSource,
		capture = captureReviewPage,
	} = {},
) => {
	if (operation === 'scratch') {
		return runScratchOperation([targetName, ...trailingArguments], {
			clean,
			prepare,
			readSource,
			root,
			run,
			write,
		});
	}

	if (
		!operation
		|| !Object.hasOwn(devCommandByOperation, operation)
			&& operation !== 'test'
			&& operation !== 'capture'
	) {
		throw new Error(`Unknown review operation "${operation ?? ''}".\n${usage}`);
	}
	if (!targetName) throw new Error(`Review target is required.\n${usage}`);

	const environment = await resolveReviewEnvironment(targetName, { root });
	if (operation === 'capture') {
		await capture({
			environment,
			rawArguments: trailingArguments,
			root,
			write,
		});
		return environment;
	}
	const options = assertArguments(operation, trailingArguments);

	if (operation === 'test') {
		if (environment.browserSuites.length === 0) {
			const testableTargets = reviewEnvironmentNames.filter((name) => (
				getReviewEnvironment(name).browserSuites.length > 0
			));
			throw new Error([
				`Review target "${targetName}" has no registered browser suite.`,
				`Choose one of: ${testableTargets.join(', ')}.`,
			].join('\n'));
		}

		write(`Running ${environment.label} browser regression on an isolated temporary port.`);
		await run(process.execPath, [
			browserTestRunnerPath,
			'--site-dir',
			environment.siteDirectory,
			...environment.browserSuites,
		], { cwd: root });
		return environment;
	}

	write(`${environment.label}: ${environment.url}`);
	await run(process.execPath, [
		cliPath,
		'--site-dir',
		environment.siteDirectory,
		devCommandByOperation[operation],
		...options,
	], {
		cwd: root,
		env: {
			...process.env,
			NORNA_DEV_PORT: String(environment.port),
			NORNA_NO_OPEN: '1',
		},
	});

	return environment;
};

const mainPath = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : null;
if (mainPath === import.meta.url) {
	try {
		await runReviewEnvironment(process.argv.slice(2));
	} catch (error) {
		console.error(error instanceof Error ? error.message : String(error));
		process.exitCode = 1;
	}
}
