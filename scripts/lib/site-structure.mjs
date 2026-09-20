import { access, readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { categorySchema } from './schema-definitions.mjs';
import { parsePageDirectoryPath } from './page-model.mjs';
import {
	homePageDirectory,
	siteDir as defaultSiteDir,
	siteDirLabel as defaultSiteDirLabel,
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

const assertLegacyStructureIsAbsent = async ({ siteDir, siteDirLabel, sitePagesLabel }) => {
	if (await fileExists(path.join(siteDir, 'pages', '000-home'))) {
		throw new Error(`${sitePagesLabel}/000-home uses the former homepage layout. Run norna site:upgrade to preview the conversion, then norna site:upgrade --apply. The homepage now belongs in ${siteDirLabel}/content.md.`);
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

const readCategory = async (categoryPath, categorySourceLabel, readSource) => {
	const source = await readSource(categoryPath);
	return parseYamlConfig(source, categorySourceLabel, { schema: categorySchema });
};

// Editors can inspect several sites in one process and retain malformed nodes
// for repair. Builds and mutation plans keep the strict default contract.
export const getSiteStructure = async ({
	siteRoot = defaultSiteDir,
	tolerant = false,
	readSource = (filePath) => readFile(filePath, 'utf8'),
} = {}) => {
	const siteDir = path.resolve(siteRoot);
	const siteDirLabel = siteDir === defaultSiteDir ? defaultSiteDirLabel : siteDir;
	const sitePagesDir = path.join(siteDir, 'pages');
	const sitePagesLabel = `${siteDirLabel}/pages`;
	const siteContentLabel = `${siteDirLabel}/content.md`;
	const problems = [];
	const report = (error, node = null) => {
		if (!tolerant) throw error;
		problems.push({ message: error.message, path: node?.contentPath ?? node?.categoryPath ?? siteDir });
		if (node) (node.problems ??= []).push(error.message);
	};
	try {
		await assertLegacyStructureIsAbsent({ siteDir, siteDirLabel, sitePagesLabel });
	} catch (error) {
		report(error);
	}

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
			let metadata;
			try {
				metadata = parsePageDirectoryPath(pageDirectory, nodeLabel);
			} catch (error) {
				report(error);
				continue;
			}

			if (hasContent === hasCategory) {
				const problem = hasContent
					? 'contains both content.md and category.yaml'
					: 'contains neither content.md nor category.yaml';
				report(new Error(`${nodeLabel} ${problem}. Keep exactly one: content.md for a page, or category.yaml for a navigation category.`));
				if (!hasContent) continue;
			}

			const node = {
				...metadata,
				isHome: false,
				kind: hasCategory ? 'category' : 'page',
				nodeDir,
				nodeLabel,
				pagePath: metadata.pagePath,
				parentPagePath: metadata.parentPagePath,
			};

			if (hasCategory) {
				if (await fileExists(path.join(nodeDir, 'images'))) {
					report(new Error(`${nodeLabel} is a navigation category and cannot contain images/. Use content.md when the collection needs editorial content or images.`), node);
				}
				Object.assign(node, {
					categorySourceLabel: `${nodeLabel}/category.yaml`,
					categoryPath,
					label: metadata.pageId,
				});
				try {
					const category = await readCategory(categoryPath, node.categorySourceLabel, readSource);
					Object.assign(node, { label: category.label, description: category.description });
				} catch (error) {
					report(error, node);
				}
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

		try {
			assertUniqueSiblings(siblingNodes, pagesLabel);
		} catch (error) {
			report(error);
		}

		for (const node of siblingNodes.sort(compareNodeMetadata)) {
			nodes.push(node);
			const childPagesDir = path.join(node.nodeDir, 'pages');
			const childDirectories = (await readDirectory(childPagesDir)).filter((entry) => entry.isDirectory());

			if (node.kind === 'category' && childDirectories.length === 0) {
				warnings.push({
					code: 'empty-category',
					label: node.categorySourceLabel,
					message: `${node.categorySourceLabel} defines an empty navigation category. Add at least one child page under ${node.nodeLabel}/pages/.`,
				});
			}

			if (childDirectories.length > 0) {
				await collectNodes(childPagesDir, `${node.nodeLabel}/pages`, node.pageDirectory);
			}
		}
	};

	const rootContentPath = path.join(siteDir, 'content.md');
	if (await fileExists(path.join(siteDir, 'category.yaml'))) {
		report(new Error(`${siteDirLabel}/category.yaml is invalid. The site root must be a page with content.md.`));
	}
	if (await fileExists(rootContentPath)) {
		nodes.push({
			...parsePageDirectoryPath(homePageDirectory),
			kind: 'page', isHome: true, nodeDir: siteDir, nodeLabel: siteDirLabel,
			contentPath: rootContentPath, contentLabel: siteContentLabel,
			imagesDir: path.join(siteDir, 'images'), imagesLabel: `${siteDirLabel}/images`,
		});
	} else {
		report(new Error(`Homepage content is missing. Create ${siteContentLabel}.`));
	}
	await collectNodes(sitePagesDir, sitePagesLabel);

	return {
		categories: nodes.filter(({ kind }) => kind === 'category'),
		contentFiles: nodes.filter(({ kind }) => kind === 'page'),
		nodes,
		...(tolerant ? { problems } : {}),
		warnings,
	};
};

export const getContentFiles = async () => (await getSiteStructure()).contentFiles;
