import path from 'node:path';
import { invocationRoot, siteDir, siteProjectRoot } from './lib/site-paths.mjs';
import { createSiteNode, planSiteNodeCreation } from './lib/site-node-create.mjs';

const usage = `
Usage:
  norna page:add <title> [--parent <path>] [--slug <slug>] [--order <NNN>] [--dry-run]

Parent selection:
  --parent /                 Add a top-level node
  --parent /guides/         Add a child below the guides node
  no --parent               Use the site root, current node directory, or site/pages/
`.trim();

const parseValueOption = (rawArgs, index, name) => {
	const arg = rawArgs[index];
	if (arg === name) {
		const value = rawArgs[index + 1];
		if (!value || value.startsWith('-')) throw new Error(`${name} requires a value.\n${usage}`);
		return { consumed: 2, value };
	}
	if (arg.startsWith(`${name}=`)) {
		const value = arg.slice(name.length + 1);
		if (!value) throw new Error(`${name} requires a value.\n${usage}`);
		return { consumed: 1, value };
	}
	return null;
};

const parseArgs = (rawArgs) => {
	const options = {
		dryRun: false,
		help: false,
		order: null,
		parent: null,
		slug: null,
		titleParts: [],
	};
	const seen = new Set();

	for (let index = 0; index < rawArgs.length;) {
		const arg = rawArgs[index];
		if (arg === '-h' || arg === '--help') {
			options.help = true;
			index += 1;
			continue;
		}
		if (arg === '--dry-run') {
			if (seen.has('dryRun')) throw new Error(`--dry-run may be specified only once.\n${usage}`);
			seen.add('dryRun');
			options.dryRun = true;
			index += 1;
			continue;
		}

		let matched = false;
		for (const [name, key] of [['--order', 'order'], ['--parent', 'parent'], ['--slug', 'slug']]) {
			const parsed = parseValueOption(rawArgs, index, name);
			if (!parsed) continue;
			if (seen.has(key)) throw new Error(`${name} may be specified only once.\n${usage}`);
			seen.add(key);
			options[key] = parsed.value;
			index += parsed.consumed;
			matched = true;
			break;
		}
		if (matched) continue;

		if (arg.startsWith('-')) throw new Error(`Unknown option: ${arg}\n${usage}`);
		options.titleParts.push(arg);
		index += 1;
	}

	return options;
};

const toDisplayPath = (filePath) => {
	const relativePath = path.relative(siteProjectRoot, filePath);
	return (relativePath && !relativePath.startsWith('..') && !path.isAbsolute(relativePath)
		? relativePath
		: filePath).split(path.sep).join('/');
};

const [kind, ...rawArgs] = process.argv.slice(2);
if (kind !== 'page') throw new Error(usage);
const options = parseArgs(rawArgs);
if (options.help) {
	console.log(usage);
	process.exit(0);
}

const title = options.titleParts.join(' ').trim();
if (!title || /[\r\n]/.test(title)) throw new Error(`A one-line page title is required.\n${usage}`);
const plan = await planSiteNodeCreation({
	siteRoot: siteDir, kind, title, slug: options.slug, order: options.order,
	parentPath: options.parent, invocationDirectory: invocationRoot,
});
const { destination, pagePath } = plan;
const action = options.dryRun ? 'Would create' : 'Created';
if (!options.dryRun) await createSiteNode(plan);

console.log(`${action} page "${title}" at ${toDisplayPath(destination)}.`);
console.log(`URL: /${pagePath}/`);
