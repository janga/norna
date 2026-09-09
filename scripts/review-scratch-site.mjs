import { randomUUID } from 'node:crypto';
import {
	cp,
	lstat,
	mkdir,
	readFile,
	readdir,
	realpath,
	rename,
	rm,
	writeFile,
} from 'node:fs/promises';
import path from 'node:path';

const excludedDirectoryNames = new Set([
	'.astro',
	'.norna',
	'blob-report',
	'dist',
	'node_modules',
	'playwright-report',
	'test-results',
]);

const pathExists = async (filePath) => {
	try {
		await lstat(filePath);
		return true;
	} catch (error) {
		if (error.code === 'ENOENT') return false;
		throw error;
	}
};

const isWithinDirectory = (parentDirectory, childDirectory) => {
	const relativePath = path.relative(parentDirectory, childDirectory);
	return relativePath === '' || (!relativePath.startsWith('..') && !path.isAbsolute(relativePath));
};

const assertFile = async (filePath, label) => {
	let stats;
	try {
		stats = await lstat(filePath);
	} catch (error) {
		if (error.code === 'ENOENT') throw new Error(`Scratch source is missing ${label}: ${filePath}`);
		throw error;
	}

	if (!stats.isFile()) throw new Error(`Scratch source ${label} is not a file: ${filePath}`);
};

const assertDirectory = async (directoryPath, label) => {
	let stats;
	try {
		stats = await lstat(directoryPath);
	} catch (error) {
		if (error.code === 'ENOENT') throw new Error(`Scratch source is missing ${label}: ${directoryPath}`);
		throw error;
	}

	if (!stats.isDirectory()) throw new Error(`Scratch source ${label} is not a directory: ${directoryPath}`);
};

const assertNornaSite = async (siteDirectory) => {
	await Promise.all([
		assertFile(path.join(siteDirectory, 'config.yaml'), 'config.yaml'),
		assertFile(path.join(siteDirectory, 'theme.yaml'), 'theme.yaml'),
		assertDirectory(path.join(siteDirectory, 'pages'), 'pages/'),
	]);
};

const getExistingTargetState = async (targetDirectory) => {
	try {
		const stats = await lstat(targetDirectory);
		if (!stats.isDirectory() || stats.isSymbolicLink()) return 'occupied';
		return (await readdir(targetDirectory)).length === 0 ? 'empty' : 'occupied';
	} catch (error) {
		if (error.code === 'ENOENT') return 'missing';
		throw error;
	}
};

const recoverScratchWorkspace = async ({ scratchRoot, targetDirectory }) => {
	await mkdir(scratchRoot, { recursive: true });
	const entries = await readdir(scratchRoot, { withFileTypes: true });
	const incomingNames = entries
		.filter((entry) => entry.name.startsWith('.incoming-'))
		.map((entry) => entry.name);
	const previousNames = entries
		.filter((entry) => entry.name.startsWith('.previous-'))
		.map((entry) => entry.name);

	await Promise.all(incomingNames.map((name) => (
		rm(path.join(scratchRoot, name), { recursive: true, force: true })
	)));

	const targetExists = await pathExists(targetDirectory);
	if (targetExists) {
		await Promise.all(previousNames.map((name) => (
			rm(path.join(scratchRoot, name), { recursive: true, force: true })
		)));
		return;
	}

	if (previousNames.length > 1) {
		throw new Error([
			'Scratch recovery found multiple previous sites and cannot choose one safely:',
			...previousNames.map((name) => `- ${path.join(scratchRoot, name)}`),
		].join('\n'));
	}

	if (previousNames.length === 1) {
		await rename(path.join(scratchRoot, previousNames[0]), targetDirectory);
	}
};

const createCopyFilter = (sourceDirectory) => async (candidatePath) => {
	if (candidatePath === sourceDirectory) return true;

	const relativePath = path.relative(sourceDirectory, candidatePath);
	const pathSegments = relativePath.split(path.sep);
	if (pathSegments.some((segment) => excludedDirectoryNames.has(segment))) return false;
	if (path.basename(candidatePath).endsWith('.log')) return false;

	const stats = await lstat(candidatePath);
	if (stats.isSymbolicLink()) {
		throw new Error(`Scratch source contains a symbolic link; copy a physical site instead: ${candidatePath}`);
	}

	return true;
};

export const prepareScratchSite = async ({
	repositoryRoot,
	sourcePath,
	scratchRoot = path.join(repositoryRoot, '.local', 'test-sites', 'scratch'),
	replace = false,
}) => {
	if (!sourcePath) throw new Error('Scratch preparation requires --from <site-dir>.');

	const resolvedRepositoryRoot = await realpath(repositoryRoot);
	let sourceDirectory;
	try {
		sourceDirectory = await realpath(path.resolve(repositoryRoot, sourcePath));
	} catch (error) {
		if (error.code === 'ENOENT') throw new Error(`Scratch source does not exist: ${path.resolve(repositoryRoot, sourcePath)}`);
		throw error;
	}

	if (!isWithinDirectory(resolvedRepositoryRoot, sourceDirectory)) {
		throw new Error(`Scratch source must be inside the repository: ${sourceDirectory}`);
	}

	const resolvedScratchRoot = path.resolve(scratchRoot);
	if (isWithinDirectory(resolvedScratchRoot, sourceDirectory)) {
		throw new Error('Scratch source cannot be inside the scratch workspace.');
	}

	await assertNornaSite(sourceDirectory);
	const targetDirectory = path.join(resolvedScratchRoot, 'site');
	await recoverScratchWorkspace({ scratchRoot: resolvedScratchRoot, targetDirectory });

	const targetState = await getExistingTargetState(targetDirectory);
	if (targetState === 'occupied' && !replace) {
		throw new Error([
			`Scratch site already exists: ${targetDirectory}`,
			'Use --replace to replace it, or run npm run review:scratch -- clean first.',
		].join('\n'));
	}

	const token = `${process.pid}-${randomUUID()}`;
	const incomingDirectory = path.join(resolvedScratchRoot, `.incoming-${token}`);
	const previousDirectory = path.join(resolvedScratchRoot, `.previous-${token}`);
	let previousSaved = false;
	let targetInstalled = false;

	try {
		await cp(sourceDirectory, incomingDirectory, {
			recursive: true,
			filter: createCopyFilter(sourceDirectory),
		});

		if (targetState === 'empty') {
			await rm(targetDirectory, { recursive: true });
		} else if (targetState === 'occupied') {
			await rename(targetDirectory, previousDirectory);
			previousSaved = true;
		}

		await rename(incomingDirectory, targetDirectory);
		targetInstalled = true;
		await writeFile(path.join(resolvedScratchRoot, 'source.json'), `${JSON.stringify({
			sourceDirectory,
			copiedAt: new Date().toISOString(),
		}, null, 2)}\n`);

		if (previousSaved) {
			await rm(previousDirectory, { recursive: true, force: true });
		}
	} catch (error) {
		await rm(incomingDirectory, { recursive: true, force: true });
		if (targetInstalled) {
			await rm(targetDirectory, { recursive: true, force: true });
		}
		if (previousSaved && !await pathExists(targetDirectory)) {
			await rename(previousDirectory, targetDirectory);
		}
		throw error;
	}

	return {
		sourceDirectory,
		targetDirectory,
	};
};

export const cleanScratchSite = async ({
	repositoryRoot,
	scratchRoot = path.join(repositoryRoot, '.local', 'test-sites', 'scratch'),
}) => {
	const resolvedScratchRoot = path.resolve(scratchRoot);
	await rm(resolvedScratchRoot, { recursive: true, force: true });
	const targetDirectory = path.join(resolvedScratchRoot, 'site');
	await mkdir(targetDirectory, { recursive: true });
	return targetDirectory;
};

export const readScratchSource = async ({
	repositoryRoot,
	scratchRoot = path.join(repositoryRoot, '.local', 'test-sites', 'scratch'),
}) => {
	try {
		return JSON.parse(await readFile(path.join(scratchRoot, 'source.json'), 'utf8'));
	} catch (error) {
		if (error.code === 'ENOENT') return null;
		throw error;
	}
};
