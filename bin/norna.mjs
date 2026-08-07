#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { readFile, realpath } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const packageName = '@janga/norna';
const currentEntrypoint = fileURLToPath(import.meta.url);
const implementationEntrypoint = new URL('./norna-cli.mjs', import.meta.url);

const readJson = async (filePath) => JSON.parse(await readFile(filePath, 'utf8'));

const readJsonOptional = async (filePath) => {
	try {
		return await readJson(filePath);
	} catch (error) {
		if (error.code === 'ENOENT') {
			return null;
		}

		throw error;
	}
};

const realpathOptional = async (filePath) => {
	try {
		return await realpath(filePath);
	} catch (error) {
		if (error.code === 'ENOENT') {
			return null;
		}

		throw error;
	}
};

const findNearestProjectRoot = (startDirectory) => {
	let current = path.resolve(startDirectory);

	while (true) {
		if (existsSync(path.join(current, 'package.json'))) {
			return current;
		}

		const parent = path.dirname(current);
		if (parent === current) {
			return null;
		}

		current = parent;
	}
};

const isWithinDirectory = (parentDirectory, childDirectory) => {
	const relativePath = path.relative(parentDirectory, childDirectory);
	return relativePath === '' || (!relativePath.startsWith('..') && !path.isAbsolute(relativePath));
};

const declaresNornaDependency = (packageJson) => [
	'dependencies',
	'devDependencies',
	'optionalDependencies',
	'peerDependencies',
].some((field) => Object.hasOwn(packageJson[field] ?? {}, packageName));

const getPackageBinEntrypoint = (packageRoot, packageJson) => {
	const bin = packageJson.bin;
	const binPath = typeof bin === 'string' ? bin : bin?.norna;

	if (!binPath) {
		throw new Error(`${packageName} does not define a norna bin entrypoint.`);
	}

	return path.resolve(packageRoot, binPath);
};

const resolveLocalEntrypoint = async () => {
	const currentPackageRoot = findNearestProjectRoot(path.dirname(currentEntrypoint));
	const currentPackageJson = currentPackageRoot
		? await readJsonOptional(path.join(currentPackageRoot, 'package.json'))
		: null;

	if (
		currentPackageJson?.name === packageName
		&& isWithinDirectory(currentPackageRoot, process.cwd())
	) {
		return null;
	}

	const projectRoot = findNearestProjectRoot(process.cwd());
	if (!projectRoot) {
		return null;
	}

	const projectPackageJson = await readJsonOptional(path.join(projectRoot, 'package.json'));
	if (!projectPackageJson || projectPackageJson.name === packageName || !declaresNornaDependency(projectPackageJson)) {
		return null;
	}

	let localPackageJsonPath;
	try {
		const requireFromProject = createRequire(path.join(projectRoot, 'package.json'));
		localPackageJsonPath = requireFromProject.resolve(`${packageName}/package.json`);
	} catch (error) {
		if (error.code === 'MODULE_NOT_FOUND') {
			return null;
		}

		throw error;
	}

	const localPackageJson = await readJson(localPackageJsonPath);
	const localPackageRoot = path.dirname(localPackageJsonPath);
	return getPackageBinEntrypoint(localPackageRoot, localPackageJson);
};

const runLocalEntrypoint = (entrypoint) => {
	const child = spawn(process.execPath, [entrypoint, ...process.argv.slice(2)], {
		cwd: process.cwd(),
		env: process.env,
		stdio: 'inherit',
	});

	const forwardSignal = (signal) => {
		if (!child.killed) {
			child.kill(signal);
		}
	};
	const signals = ['SIGINT', 'SIGTERM'];
	for (const signal of signals) {
		process.once(signal, forwardSignal);
	}

	child.once('exit', (code, signal) => {
		for (const forwardedSignal of signals) {
			process.removeListener(forwardedSignal, forwardSignal);
		}

		if (signal) {
			process.kill(process.pid, signal);
			return;
		}

		process.exit(code ?? 1);
	});

	child.once('error', (error) => {
		console.error(error instanceof Error ? error.message : String(error));
		process.exit(1);
	});
};

const localEntrypoint = await resolveLocalEntrypoint();
if (localEntrypoint) {
	const [currentRealpath, localRealpath] = await Promise.all([
		realpathOptional(currentEntrypoint),
		realpathOptional(localEntrypoint),
	]);

	if (localRealpath && currentRealpath !== localRealpath) {
		runLocalEntrypoint(localEntrypoint);
	} else {
		await import(implementationEntrypoint.href);
	}
} else {
	await import(implementationEntrypoint.href);
}
