import { getSiteSourcePaths } from './site-conventions.mjs';
import { access, readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { parsePageDirectoryPath } from './page-model.mjs';
import { comparePageOrder, parsePageOrder } from './page-order.mjs';
import { assertSiteSourceFormat } from './site-source-format.mjs';
import { parseContentFrontmatter, splitSiteFile } from './site-content.mjs';
import {
	homePageDirectory,
	siteDir as defaultSiteDir,
	siteDirLabel as defaultSiteDirLabel,
} from './site-paths.mjs';

const fileExists = async (filePath) => access(filePath).then(() => true, () => false);

const readDirectory = async (directory) => readdir(directory, { withFileTypes: true }).catch((error) => {
	if (error?.code === 'ENOENT') return [];
	throw error;
});

const assertLegacyStructureIsAbsent = async ({ siteDir, siteDirLabel }) => {
	for (const name of ['content.md', 'theme.yaml', 'images', 'pages', 'routes']) {
		if (await fileExists(path.join(siteDir, name))) {
			throw new Error(`${siteDirLabel}/${name} uses the former page layout. Put the homepage content.md, tree-theme.yaml, optional page-theme.yaml, images/ and pages/ inside ${siteDirLabel}/root/. Keep site-config/ and public/ at the site level. Stop the development server before moving files.`);
		}
	}
};

const assertUniqueSiblings = (nodes, pagesLabel, warnings) => {
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

		if (node.pageOrder === null) continue;
		const existingOrder = byOrder.get(node.pageOrder);
		if (existingOrder) {
			const message = `${pagesLabel} contains duplicate sibling navigation.order ${node.pageOrder}: ${existingOrder.pageId} and ${node.pageId}. Slug determines their order. Choose different values to set an explicit order.`;
			for (const sibling of [existingOrder, node]) warnings.push({ code: 'duplicate-page-order', message, label: sibling.contentLabel, path: sibling.contentPath });
		}
		byOrder.set(node.pageOrder, node);
	}
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
	const sitePagesDir = getSiteSourcePaths(siteDir).pages;
	const sitePagesLabel = `${siteDirLabel}/root/pages`;
	const siteContentLabel = `${siteDirLabel}/root/content.md`;
	const problems = [];
	const report = (error, node = null) => {
		if (!tolerant) throw error;
		problems.push({ message: error.message, path: node?.contentPath ?? node?.categoryPath ?? siteDir });
		if (node) (node.problems ??= []).push(error.message);
	};
	try {
		await assertLegacyStructureIsAbsent({ siteDir, siteDirLabel, sitePagesLabel });
		await assertSiteSourceFormat(siteDir, readSource);
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

			if (hasCategory) report(new Error(`${nodeLabel}/category.yaml is no longer supported. Create content.md with an H1 and page.listChildren: true instead.`));
			if (!hasContent) {
				report(new Error(`${nodeLabel} has no content.md. Every page directory needs a content.md file.`));
				continue;
			}

			const node = {
				...metadata,
				isHome: false,
				kind: 'page',
				nodeDir,
				nodeLabel,
				pagePath: metadata.pagePath,
				parentPagePath: metadata.parentPagePath,
			};

			Object.assign(node, {
				contentLabel: `${nodeLabel}/content.md`,
				contentPath,
				imagesDir: path.join(nodeDir, 'images'),
				imagesLabel: `${nodeLabel}/images`,
			});

			try {
				const { frontmatterBody } = splitSiteFile(await readSource(contentPath), node.contentLabel);
				node.pageOrder = parsePageOrder(parseContentFrontmatter(frontmatterBody, node.contentLabel).navigation?.order, `${node.contentLabel}: navigation.order`);
			} catch (error) { report(error, node); }
			siblingNodes.push(node);
		}

		try {
			assertUniqueSiblings(siblingNodes, pagesLabel, warnings);
		} catch (error) {
			report(error);
		}

		for (const node of siblingNodes.sort(comparePageOrder)) {
			nodes.push(node);
			const childPagesDir = path.join(node.nodeDir, 'pages');
			const childDirectories = (await readDirectory(childPagesDir)).filter((entry) => entry.isDirectory());

			if (childDirectories.length > 0) {
				await collectNodes(childPagesDir, `${node.nodeLabel}/pages`, node.pageDirectory);
			}
		}
	};

	const rootContentPath = getSiteSourcePaths(siteDir).content;
	if (await fileExists(path.join(getSiteSourcePaths(siteDir).root, 'category.yaml'))) {
		report(new Error(`${siteDirLabel}/root/category.yaml is invalid. The site root must be a page with content.md.`));
	}
	if (await fileExists(rootContentPath)) {
		nodes.push({
			...parsePageDirectoryPath(homePageDirectory),
			kind: 'page', isHome: true, nodeDir: getSiteSourcePaths(siteDir).root, nodeLabel: `${siteDirLabel}/root`,
			contentPath: rootContentPath, contentLabel: siteContentLabel,
			imagesDir: getSiteSourcePaths(siteDir).images, imagesLabel: `${siteDirLabel}/root/images`,
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
