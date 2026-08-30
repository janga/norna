import { randomUUID } from 'node:crypto';
import { mkdir, realpath, rename, rm, rmdir, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { dump as dumpYaml } from 'js-yaml';
import { slugifyAsciiIdentifier } from './lib/heading-ids.mjs';
import { pageDirectoryPattern } from './lib/page-model.mjs';
import {
	invocationRoot,
	siteDir,
	sitePagesDir,
	siteProjectRoot,
} from './lib/site-paths.mjs';
import { getSiteStructure } from './lib/site-structure.mjs';

const usage = `
Usage:
  norna page:add <title> [--parent <path>] [--slug <slug>] [--order <NNN>] [--dry-run]
  norna category:add <label> [--parent <path>] [--slug <slug>] [--order <NNN>] [--dry-run]

Parent selection:
  --parent /                 Add a top-level node
  --parent /guides/         Add a child below the guides node
  no --parent               Use the current node directory, or site/pages/
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

const parseOrder = (value) => {
	if (!/^\d{1,3}$/.test(value)) {
		throw new Error(`Invalid --order "${value}". Use an integer from 1 to 999.`);
	}
	const order = Number.parseInt(value, 10);
	if (order < 1 || order > 999) {
		throw new Error(`Invalid --order "${value}". Use an integer from 1 to 999.`);
	}
	return order;
};

const normalizeParentPath = (value) => {
	if (value === '/') return '';
	if (value.includes('\\') || value.includes('?') || value.includes('#')) {
		throw new Error(`Invalid --parent "${value}". Use a logical path such as /guides/installation/.`);
	}
	const normalized = value.replace(/^\/+|\/+$/g, '');
	if (!normalized || normalized.split('/').some((segment) => !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(segment))) {
		throw new Error(`Invalid --parent "${value}". Use / for the top level or a logical path such as /guides/installation/.`);
	}
	return normalized;
};

const getNextOrder = (siblings) => {
	const highestOrder = siblings.reduce((highest, node) => Math.max(highest, node.pageOrder), 0);
	const nextOrder = Math.floor(highestOrder / 10) * 10 + 10;
	if (nextOrder > 999) {
		throw new Error('No automatic page order remains below 1000. Reorder the sibling nodes before adding another one.');
	}
	return nextOrder;
};

const toDisplayPath = (filePath) => {
	const relativePath = path.relative(siteProjectRoot, filePath);
	return (relativePath && !relativePath.startsWith('..') && !path.isAbsolute(relativePath)
		? relativePath
		: filePath).split(path.sep).join('/');
};

const escapeMarkdownHeading = (value) => value.replace(/([\\`*_[\]{}<>#])/g, '\\$1');

const canonicalDirectory = async (directory) => realpath(directory).catch((error) => {
	if (error?.code === 'ENOENT') return path.resolve(directory);
	throw error;
});

const resolveParent = async ({ nodes, parent }) => {
	if (parent !== null) {
		const parentPath = normalizeParentPath(parent);
		if (!parentPath) {
			return { collectionDir: sitePagesDir, node: null, pagePath: '' };
		}
		const node = nodes.find((candidate) => candidate.pagePath === parentPath);
		if (!node) {
			throw new Error(`Cannot find parent "${parent}". Use an existing logical page/category path, or / for the top level.`);
		}
		if (node.isHome) throw new Error('The homepage cannot contain child pages or categories.');
		return { collectionDir: path.join(node.nodeDir, 'pages'), node, pagePath: node.pagePath };
	}

	const currentDirectory = await canonicalDirectory(invocationRoot);
	if (currentDirectory === await canonicalDirectory(sitePagesDir)) {
		return { collectionDir: sitePagesDir, node: null, pagePath: '' };
	}
	let node = null;
	for (const candidate of nodes) {
		if (await canonicalDirectory(candidate.nodeDir) === currentDirectory) {
			node = candidate;
			break;
		}
	}
	if (!node) {
		throw new Error([
			'Cannot infer where to add the node from the current directory.',
			`Run the command from ${toDisplayPath(sitePagesDir)} for a top-level node, from an existing page/category directory for a child, or pass --parent.`,
		].join('\n'));
	}
	if (node.isHome) throw new Error('The homepage cannot contain child pages or categories.');
	return { collectionDir: path.join(node.nodeDir, 'pages'), node, pagePath: node.pagePath };
};

const assertCollectionDirectory = async (collectionDir) => {
	try {
		const info = await stat(collectionDir);
		if (!info.isDirectory()) throw new Error(`${toDisplayPath(collectionDir)} exists but is not a directory.`);
		return false;
	} catch (error) {
		if (error?.code !== 'ENOENT') throw error;
		await mkdir(collectionDir);
		return true;
	}
};

const writeNode = async ({ destination, kind, title }) => {
	const stagingRoot = path.join(siteDir, '.norna', 'create');
	await mkdir(stagingRoot, { recursive: true });
	const stagingDirectory = path.join(stagingRoot, `node-${process.pid}-${randomUUID()}`);
	await mkdir(stagingDirectory);

	try {
		if (kind === 'page') {
			await writeFile(path.join(stagingDirectory, 'content.md'), `# ${escapeMarkdownHeading(title)}\n\n## Introduction\n\nStart writing here.\n`);
			await mkdir(path.join(stagingDirectory, 'images'));
		} else {
			await writeFile(path.join(stagingDirectory, 'category.yaml'), dumpYaml({ label: title }, {
				lineWidth: -1,
				noRefs: true,
			}));
			await mkdir(path.join(stagingDirectory, 'pages'));
		}
		await rename(stagingDirectory, destination);
	} finally {
		await rm(stagingDirectory, { force: true, recursive: true });
	}
};

const [kind, ...rawArgs] = process.argv.slice(2);
if (!['category', 'page'].includes(kind)) throw new Error(usage);
const options = parseArgs(rawArgs);
if (options.help) {
	console.log(usage);
	process.exit(0);
}

const title = options.titleParts.join(' ').trim();
if (!title || /[\r\n]/.test(title)) throw new Error(`A one-line ${kind === 'page' ? 'page title' : 'category label'} is required.\n${usage}`);
const slug = options.slug ?? slugifyAsciiIdentifier(title);
if (!slug || !pageDirectoryPattern.test(`010-${slug}`)) {
	throw new Error(`Invalid ${options.slug === null ? 'generated ' : ''}slug "${slug}". Use lowercase ASCII letters, numbers, and single hyphens; pass --slug when automatic transliteration is unsuitable.`);
}

const structure = await getSiteStructure();
const parent = await resolveParent({ nodes: structure.nodes, parent: options.parent });
const siblings = structure.nodes.filter((node) => node.parentPagePath === (parent.pagePath || null) && !node.isHome);
if (siblings.some((node) => node.pageId === slug)) {
	throw new Error(`Cannot create "${slug}" below ${parent.pagePath ? `/${parent.pagePath}/` : '/'}. A sibling with that slug already exists.`);
}
const order = options.order === null ? getNextOrder(siblings) : parseOrder(options.order);
if (siblings.some((node) => node.pageOrder === order)) {
	throw new Error(`Cannot use order ${String(order).padStart(3, '0')} below ${parent.pagePath ? `/${parent.pagePath}/` : '/'}. A sibling already uses it.`);
}

const directoryName = `${String(order).padStart(3, '0')}-${slug}`;
const destination = path.join(parent.collectionDir, directoryName);
const pagePath = [parent.pagePath, slug].filter(Boolean).join('/');
const action = options.dryRun ? 'Would create' : 'Created';

if (!options.dryRun) {
	const createdCollection = await assertCollectionDirectory(parent.collectionDir);
	try {
		await writeNode({ destination, kind, title });
	} catch (error) {
		if (createdCollection) await rmdir(parent.collectionDir).catch(() => {});
		throw error;
	}
}

console.log(`${action} ${kind} "${title}" at ${toDisplayPath(destination)}.`);
if (kind === 'page') {
	console.log(`URL: /${pagePath}/`);
} else {
	console.log('This navigation category has no page or URL of its own.');
	console.log(`Child URL prefix: /${pagePath}/`);
}
