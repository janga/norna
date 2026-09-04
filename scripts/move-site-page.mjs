import { randomUUID } from 'node:crypto';
import {
	access,
	mkdir,
	readFile,
	rename,
	rm,
	rmdir,
	writeFile,
} from 'node:fs/promises';
import path from 'node:path';
import {
	createPageMovePlan,
	formatPageMovePlan,
} from './lib/page-move-plan.mjs';
import {
	getSiteLinkGraph,
	getSitePublicFiles,
} from './lib/site-link-graph.mjs';
import {
	sitePagesDir,
	sitePagesLabel,
	siteProjectRoot,
} from './lib/site-paths.mjs';
import { getSiteStructure } from './lib/site-structure.mjs';

const usage = `
Usage:
  norna page:move <old-url> <new-url> [--order <NNN>] [--no-aliases] [--write]

Examples:
  norna page:move /guides/install/ /guides/installation/
  norna page:move /guides/install/ /reference/install/ --write

The command is a dry run unless --write is present. If the old page has
already been moved by hand, the same command reconciles its links and aliases.
`.trim();

const parseOrder = (value) => {
	if (!/^\d{1,3}$/.test(value ?? '')) {
		throw new Error(`Invalid --order "${value ?? ''}". Use an integer from 1 to 999.\n${usage}`);
	}
	const order = Number.parseInt(value, 10);
	if (order < 1 || order > 999) {
		throw new Error(`Invalid --order "${value}". Use an integer from 1 to 999.\n${usage}`);
	}
	return order;
};

const parseArgs = (rawArgs) => {
	const options = {
		help: false,
		order: null,
		preserveAliases: true,
		urls: [],
		write: false,
	};
	const seen = new Set();

	for (let index = 0; index < rawArgs.length; index += 1) {
		const arg = rawArgs[index];
		if (arg === '-h' || arg === '--help') {
			options.help = true;
			continue;
		}
		if (arg === '--write') {
			if (seen.has('write')) throw new Error(`--write may be specified only once.\n${usage}`);
			seen.add('write');
			options.write = true;
			continue;
		}
		if (arg === '--no-aliases') {
			if (seen.has('aliases')) throw new Error(`--no-aliases may be specified only once.\n${usage}`);
			seen.add('aliases');
			options.preserveAliases = false;
			continue;
		}
		if (arg === '--order' || arg.startsWith('--order=')) {
			if (seen.has('order')) throw new Error(`--order may be specified only once.\n${usage}`);
			seen.add('order');
			const inlineValue = arg.startsWith('--order=') ? arg.slice('--order='.length) : null;
			const value = inlineValue ?? rawArgs[index + 1];
			if (inlineValue === null) index += 1;
			options.order = parseOrder(value);
			continue;
		}
		if (arg.startsWith('-')) throw new Error(`Unknown option: ${arg}\n${usage}`);
		options.urls.push(arg);
	}

	if (!options.help && options.urls.length !== 2) {
		throw new Error(`page:move requires an old URL and a new URL.\n${usage}`);
	}
	return options;
};

const toDisplayPath = (filePath) => {
	const relativePath = path.relative(siteProjectRoot, filePath);
	return (relativePath && !relativePath.startsWith('..') && !path.isAbsolute(relativePath)
		? relativePath
		: filePath).split(path.sep).join('/');
};

const fileExists = async (filePath) => access(filePath).then(() => true, () => false);

const writeFileAtomically = async (filePath, source, mode) => {
	const temporaryPath = path.join(
		path.dirname(filePath),
		`.${path.basename(filePath)}.norna-${process.pid}-${randomUUID()}.tmp`,
	);
	try {
		await writeFile(temporaryPath, source, { mode: mode & 0o777 });
		await rename(temporaryPath, filePath);
	} finally {
		await rm(temporaryPath, { force: true });
	}
};

const assertSourcesUnchanged = async (plan) => {
	for (const file of plan.sourceFiles) {
		const currentSource = await readFile(file.contentPath, 'utf8');
		if (currentSource !== file.source) {
			throw new Error([
				`Page move stopped because ${file.contentLabel} changed after the plan was created.`,
				'Run the command again to build a fresh plan. No file was changed.',
			].join('\n'));
		}
	}
};

const assertFinalSite = async () => {
	const structure = await getSiteStructure();
	const graph = await getSiteLinkGraph({ siteStructure: structure });
	if (graph.diagnostics.length === 0) return;
	throw new Error([
		'Post-move link validation failed.',
		...graph.diagnostics.flatMap((diagnostic) => [
			`- ${diagnostic.message}`,
			...(diagnostic.fix ? [`  Fix: ${diagnostic.fix}`] : []),
		]),
	].join('\n'));
};

const applyPlan = async (plan) => {
	await assertSourcesUnchanged(plan);
	let collectionCreated = false;
	let directoryMoved = false;
	let fileWritten = false;

	try {
		if (plan.mode === 'move') {
			if (!plan.destinationCollectionExists) {
				await mkdir(plan.destinationCollectionDirectory);
				collectionCreated = true;
			}
			try {
				await rename(plan.sourceDirectory, plan.destinationDirectory);
				directoryMoved = true;
			} catch (error) {
				if (error?.code === 'EXDEV') {
					throw new Error('Page directories must stay on one filesystem so Norna can move the complete subtree atomically.');
				}
				throw error;
			}
		}

		for (const change of plan.fileChanges) {
			await writeFileAtomically(change.finalPath, change.updatedSource, change.mode);
			fileWritten = true;
		}
		await assertFinalSite();
	} catch (error) {
		const changesStarted = directoryMoved || fileWritten;
		const rollbackErrors = [];
		if (directoryMoved) {
			try {
				await rename(plan.destinationDirectory, plan.sourceDirectory);
				directoryMoved = false;
			} catch (rollbackError) {
				rollbackErrors.push(`Could not restore the page directory: ${rollbackError.message}`);
			}
		}

		for (const change of plan.fileChanges) {
			try {
				const restorePath = directoryMoved && change.finalPath !== change.originalPath
					? change.finalPath
					: change.originalPath;
				await writeFileAtomically(restorePath, change.originalSource, change.mode);
			} catch (rollbackError) {
				rollbackErrors.push(`Could not restore ${change.contentLabel}: ${rollbackError.message}`);
			}
		}

		if (collectionCreated && !directoryMoved) {
			try {
				await rmdir(plan.destinationCollectionDirectory);
			} catch (rollbackError) {
				if (rollbackError?.code !== 'ENOENT' && rollbackError?.code !== 'ENOTEMPTY') {
					rollbackErrors.push(`Could not remove the newly created pages directory: ${rollbackError.message}`);
				}
			}
		}

		throw new Error([
			error instanceof Error ? error.message : String(error),
			rollbackErrors.length === 0
				? (changesStarted
					? 'The original page directory and content files were restored.'
					: 'No source file was changed.')
				: 'Rollback was incomplete. Inspect these paths before running page:move again:',
			...rollbackErrors.map((message) => `- ${message}`),
		].join('\n'));
	}
};

const main = async () => {
	const options = parseArgs(process.argv.slice(2));
	if (options.help) {
		console.log(usage);
		return;
	}

	const siteStructure = await getSiteStructure();
	const [graph, publicFiles] = await Promise.all([
		getSiteLinkGraph({ siteStructure }),
		getSitePublicFiles(),
	]);
	const plan = await createPageMovePlan({
		from: options.urls[0],
		graph,
		order: options.order,
		preserveAliases: options.preserveAliases,
		publicFiles,
		sitePagesDir,
		sitePagesLabel,
		siteStructure,
		to: options.urls[1],
	});

	console.log(formatPageMovePlan(plan, toDisplayPath).join('\n'));
	if (!options.write) {
		console.log('\nDry run only. Run the same command with --write to apply this plan.');
		return;
	}

	await applyPlan(plan);
	console.log(`\nPage move completed: ${plan.from} -> ${plan.to}`);
};

try {
	await main();
} catch (error) {
	console.error(error instanceof Error ? error.message : String(error));
	process.exit(1);
}
