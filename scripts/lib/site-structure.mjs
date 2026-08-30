import { access, readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { categorySchema } from './schema-definitions.mjs';
import { parsePageDirectoryPath } from './page-model.mjs';
import {
	homePageDirectory,
	siteContentLabel,
	siteDir,
	siteDirLabel,
	sitePagesDir,
	sitePagesLabel,
} from './site-paths.mjs';
import { parseYamlConfig } from './yaml-config.mjs';

const fileExists = async (filePath) => access(filePath).then(() => true, () => false);

const readDirectory = async (directory) => readdir(directory, { withFileTypes: true }).catch((error) => {
	if (error?.code === 'ENOENT') return [];
	throw error;
});

const compareNodeMetadata = (left, right) => (
	left.pageOrder - right.pageOrder
	|| left.pageId.localeCompare(right.pageId, 'en')
);

const assertLegacyStructureIsAbsent = async () => {
	const legacyContentPath = path.join(siteDir, 'content.md');
	const legacyImagesPath = path.join(siteDir, 'images');
	const legacyPaths = [];
	if (await fileExists(legacyContentPath)) legacyPaths.push(`${siteDirLabel}/content.md`);
	if (await fileExists(legacyImagesPath)) legacyPaths.push(`${siteDirLabel}/images`);
	if (legacyPaths.length > 0) {
		throw new Error([
			`The old root-page structure is no longer supported: ${legacyPaths.join(', ')}.`,
			`Move the homepage content to ${sitePagesLabel}/${homePageDirectory}/content.md and its images to ${sitePagesLabel}/${homePageDirectory}/images/.`,
		].join('\n'));
	}

	if (await fileExists(path.join(siteDir, 'routes'))) {
		throw new Error(`${siteDirLabel}/routes is no longer supported. Rename it to ${sitePagesLabel} and use NNN-page-id directory names.`);
	}
};

const assertUniqueSiblings = (nodes, pagesLabel) => {
	const byId = new Map();
	const byOrder = new Map();

	for (const node of nodes) {
		const existingId = byId.get(node.pageId);
		if (existingId) {
			throw new Error([
				`${pagesLabel} contains duplicate sibling id "${node.pageId}".`,
				`- ${existingId.nodeLabel}`,
				`- ${node.nodeLabel}`,
			].join('\n'));
		}
		byId.set(node.pageId, node);

		const existingOrder = byOrder.get(node.pageOrder);
		if (existingOrder) {
			throw new Error([
				`${pagesLabel} contains duplicate sibling order "${String(node.pageOrder).padStart(3, '0')}".`,
				`- ${existingOrder.nodeLabel}`,
				`- ${node.nodeLabel}`,
			].join('\n'));
		}
		byOrder.set(node.pageOrder, node);
	}
};

const readCategory = async (categoryPath, categorySourceLabel) => {
	const source = await readFile(categoryPath, 'utf8');
	return parseYamlConfig(source, categorySourceLabel, { schema: categorySchema });
};

export const getSiteStructure = async () => {
	await assertLegacyStructureIsAbsent();

	const nodes = [];
	const warnings = [];

	const collectNodes = async (pagesDir, pagesLabel, parentNodeDirectory = '') => {
		const entries = (await readDirectory(pagesDir))
			.filter((entry) => entry.isDirectory())
			.sort((left, right) => left.name.localeCompare(right.name, 'en'));
		const siblingNodes = [];

		for (const entry of entries) {
			const pageDirectory = parentNodeDirectory
				? `${parentNodeDirectory}/pages/${entry.name}`
				: entry.name;
			const nodeLabel = `${pagesLabel}/${entry.name}`;
			const nodeDir = path.join(pagesDir, entry.name);
			const contentPath = path.join(nodeDir, 'content.md');
			const categoryPath = path.join(nodeDir, 'category.yaml');
			const [hasContent, hasCategory] = await Promise.all([
				fileExists(contentPath),
				fileExists(categoryPath),
			]);
			const metadata = parsePageDirectoryPath(pageDirectory, nodeLabel);

			if (hasContent === hasCategory) {
				const problem = hasContent
					? 'contains both content.md and category.yaml'
					: 'contains neither content.md nor category.yaml';
				throw new Error(`${nodeLabel} ${problem}. Keep exactly one: content.md for a page, or category.yaml for a navigation category.`);
			}

			const isHome = pageDirectory === homePageDirectory;
			if (isHome && hasCategory) {
				throw new Error(`${nodeLabel}/category.yaml is invalid. The homepage must be a page with content.md.`);
			}

			const node = {
				...metadata,
				isHome,
				kind: hasCategory ? 'category' : 'page',
				nodeDir,
				nodeLabel,
				pagePath: isHome ? '' : metadata.pagePath,
				parentPagePath: isHome ? null : metadata.parentPagePath,
			};

			if (hasCategory) {
				if (await fileExists(path.join(nodeDir, 'images'))) {
					throw new Error(`${nodeLabel} is a navigation category and cannot contain images/. Use content.md when the collection needs editorial content or images.`);
				}
				const category = await readCategory(categoryPath, `${nodeLabel}/category.yaml`);
				Object.assign(node, {
					categorySourceLabel: `${nodeLabel}/category.yaml`,
					categoryPath,
					label: category.label,
				});
			} else {
				Object.assign(node, {
					contentLabel: `${nodeLabel}/content.md`,
					contentPath,
					imagesDir: path.join(nodeDir, 'images'),
					imagesLabel: `${nodeLabel}/images`,
				});
			}

			siblingNodes.push(node);
		}

		assertUniqueSiblings(siblingNodes, pagesLabel);

		for (const node of siblingNodes.sort(compareNodeMetadata)) {
			nodes.push(node);
			const childPagesDir = path.join(node.nodeDir, 'pages');
			const childDirectories = (await readDirectory(childPagesDir)).filter((entry) => entry.isDirectory());

			if (node.isHome && childDirectories.length > 0) {
				throw new Error([
					`${node.nodeLabel} is the homepage and cannot contain child pages.`,
					`Move these page directories beside ${homePageDirectory} under ${sitePagesLabel}/, or below another non-home page:`,
					...childDirectories.map(({ name }) => `- ${node.nodeLabel}/pages/${name}`),
				].join('\n'));
			}

			if (node.kind === 'category' && childDirectories.length === 0) {
				warnings.push({
					code: 'empty-category',
					label: node.categorySourceLabel,
					message: `${node.categorySourceLabel} defines an empty navigation category. Add at least one child page under ${node.nodeLabel}/pages/.`,
				});
			}

			if (!node.isHome && childDirectories.length > 0) {
				await collectNodes(childPagesDir, `${node.nodeLabel}/pages`, node.pageDirectory);
			}
		}
	};

	await collectNodes(sitePagesDir, sitePagesLabel);
	if (!nodes.some(({ isHome }) => isHome)) {
		throw new Error(`Homepage content is missing. Create ${siteContentLabel}.`);
	}

	return {
		categories: nodes.filter(({ kind }) => kind === 'category'),
		contentFiles: nodes.filter(({ kind }) => kind === 'page'),
		nodes,
		warnings,
	};
};

export const getContentFiles = async () => (await getSiteStructure()).contentFiles;
