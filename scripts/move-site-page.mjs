import { applyPageMovePlan } from './lib/page-move-apply.mjs';
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
	siteDir,
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

	await applyPageMovePlan(plan, { siteRoot: siteDir });
	console.log(`\nPage move completed: ${plan.from} -> ${plan.to}`);
};

try {
	await main();
} catch (error) {
	console.error(error instanceof Error ? error.message : String(error));
	process.exit(1);
}
