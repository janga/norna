import { resolveNavigationModel } from './navigation-model.mjs';
import { getSiteLinkGraph } from './site-link-graph.mjs';
import { getSiteNodePathname } from './site-page-urls.mjs';
import {
	flattenSiteNavigationTree,
	getListedSiteNavigationTree,
	getSiteNavigationTree,
} from './site-navigation-tree.mjs';
import { getSiteStructure } from './site-structure.mjs';

export const navigationReviewFormatNames = Object.freeze(['text', 'json']);

export const navigationReviewThresholds = Object.freeze({
	deepBranchLevels: 4,
	sectionCount: 8,
	wideSiblingCount: 10,
});

const plural = (count, singular, pluralForm = `${singular}s`) => (
	`${count} ${count === 1 ? singular : pluralForm}`
);

const logicalPathname = (node) => getSiteNodePathname(node);

const getTreeMetrics = (root) => {
	const nodes = flattenSiteNavigationTree([root]);
	const rootDepth = root.node.depth;
	return {
		categoryCount: nodes.filter(({ node }) => node.kind === 'category').length,
		maximumLevels: nodes.reduce((maximum, { node }) => (
			Math.max(maximum, node.depth - rootDepth + 1)
		), 1),
		nodeCount: nodes.length,
		pageCount: nodes.filter(({ node }) => node.kind === 'page').length,
	};
};

const getSiblingGroups = (roots) => {
	const groups = [];
	const collect = (nodes, parent = null) => {
		if (nodes.length > 0) {
			groups.push({
				count: nodes.length,
				entries: nodes.map(({ node }) => ({
					kind: node.kind,
					path: logicalPathname(node),
					title: node.title,
				})),
				parentPath: parent ? logicalPathname(parent.node) : null,
				parentTitle: parent?.node.title ?? 'Site root',
			});
		}

		for (const node of nodes) collect(node.children, node);
	};

	collect(roots);
	return groups;
};

const toGraphError = (diagnostic) => ({
	code: diagnostic.code,
	...(diagnostic.fix ? { fix: diagnostic.fix } : {}),
	...(diagnostic.reference?.line ? { line: diagnostic.reference.line } : {}),
	message: diagnostic.message,
	...(diagnostic.reference?.sourceContentFile?.contentLabel
		? { source: diagnostic.reference.sourceContentFile.contentLabel }
		: {}),
});

const toStructureObservation = (warning) => ({
	code: warning.code,
	message: warning.message,
	...(warning.label ? { source: warning.label } : {}),
});

const getResolvedPageReferences = (linkGraph) => linkGraph.references.filter(({ resolution }) => (
	resolution?.kind === 'page' || resolution?.kind === 'page-alias'
));

const getNavigationEntries = (siteStructure, linkGraph) => {
	const pagesByDirectory = new Map(linkGraph.pages.map((page) => [
		page.contentFile.pageDirectory,
		page,
	]));

	return siteStructure.nodes.map((siteNode) => {
		const page = siteNode.kind === 'page'
			? pagesByDirectory.get(siteNode.pageDirectory)
			: null;
		if (siteNode.kind === 'page' && !page) {
			throw new Error(`Navigation review could not find parsed content for ${siteNode.contentLabel}.`);
		}

		return {
			headings: page?.document.headings.filter(({ depth }) => depth === 2 || depth === 3) ?? [],
			node: {
				...siteNode,
				navigation: {
					listed: siteNode.isHome || (page?.navigation.listed ?? true),
				},
				pathname: siteNode.kind === 'page' ? page.pathname : null,
				title: siteNode.kind === 'page' ? page.title : siteNode.label,
			},
			page,
			sections: [],
		};
	});
};

const getNavigationModes = ({ entries, listedEntries, requestedNavigationMode }) => {
	const modelNodes = listedEntries.map(({ headings, node }) => ({
		depth: node.depth,
		headings,
		isHome: node.isHome,
		kind: node.kind,
		listed: true,
		pagePath: node.pagePath,
	}));
	const errors = [];
	const modes = new Map();
	const seenErrors = new Set();

	for (const entry of entries.filter(({ node }) => node.kind === 'page')) {
		try {
			const model = resolveNavigationModel({
				currentPage: {
					depth: entry.node.depth,
					headings: entry.headings,
					isHome: entry.node.isHome,
					kind: 'page',
					listed: entry.node.navigation.listed,
					pagePath: entry.node.pagePath,
				},
				mode: requestedNavigationMode,
				nodes: modelNodes,
			});
			modes.set(entry.node.pagePath, model.mode);
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			if (!seenErrors.has(message)) {
				seenErrors.add(message);
				errors.push({
					code: 'invalid-navigation-model',
					message,
				});
			}
			modes.set(entry.node.pagePath, null);
		}
	}

	return { errors, modes };
};

const sortUnique = (values) => [...new Set(values)].sort((left, right) => left.localeCompare(right, 'en'));

export const createNavigationReview = ({
	linkGraph,
	requestedNavigationMode = 'automatic',
	siteStructure,
	thresholds = navigationReviewThresholds,
}) => {
	const entries = getNavigationEntries(siteStructure, linkGraph);
	const completeTree = getSiteNavigationTree(entries);
	const listedTree = getListedSiteNavigationTree(entries);
	const completeEntries = flattenSiteNavigationTree(completeTree);
	const listedEntries = flattenSiteNavigationTree(listedTree);
	const listedPaths = new Set(listedEntries.map(({ node }) => node.pagePath));
	const resolvedPageReferences = getResolvedPageReferences(linkGraph);
	const { errors: navigationErrors, modes } = getNavigationModes({
		entries: completeEntries,
		listedEntries,
		requestedNavigationMode,
	});

	const pages = completeEntries
		.filter(({ node }) => node.kind === 'page')
		.map(({ headings, node, page }) => {
			const incomingPageLinkCount = resolvedPageReferences.filter(({ resolution }) => (
				resolution.page.pathname === page.pathname
			)).length;
			const outgoingReferences = linkGraph.references.filter(({ sourcePage }) => sourcePage.pathname === page.pathname);
			const outgoingPageLinkCount = outgoingReferences.filter(({ resolution }) => (
				resolution?.kind === 'page' || resolution?.kind === 'page-alias'
			)).length;

			return {
				contentFile: node.contentLabel,
				depth: node.depth,
				h2Count: headings.filter(({ depth }) => depth === 2).length,
				h3Count: headings.filter(({ depth }) => depth === 3).length,
				incomingPageLinkCount,
				listed: listedPaths.has(node.pagePath),
				navigationMode: modes.get(node.pagePath) ?? null,
				outgoingInternalReferenceCount: outgoingReferences.length,
				outgoingPageLinkCount,
				parentPath: node.parentPagePath === null ? null : `/${node.parentPagePath}/`,
				pathname: page.pathname,
				title: node.title,
			};
		});

	const categories = completeEntries
		.filter(({ node }) => node.kind === 'category')
		.map(({ children, node }) => ({
			childCount: children.length,
			depth: node.depth,
			listed: listedPaths.has(node.pagePath),
			listedChildCount: listedPaths.has(node.pagePath)
				? (listedEntries.find(({ node: listedNode }) => listedNode.pagePath === node.pagePath)?.children.length ?? 0)
				: 0,
			parentPath: node.parentPagePath === null ? null : `/${node.parentPagePath}/`,
			path: logicalPathname(node),
			source: node.categorySourceLabel,
			title: node.title,
		}));

	const branches = listedTree.map((root) => {
		const metrics = getTreeMetrics(root);
		const branchPaths = new Set(flattenSiteNavigationTree([root]).map(({ node }) => node.pagePath));
		const navigationModes = sortUnique(pages
			.filter((page) => branchPaths.has(page.pathname === '/' ? '' : page.pathname.slice(1, -1)))
			.map(({ navigationMode }) => navigationMode)
			.filter(Boolean));

		return {
			...metrics,
			kind: root.node.kind,
			navigationModes,
			path: logicalPathname(root.node),
			title: root.node.title,
		};
	});

	const siblingGroups = getSiblingGroups(listedTree);
	const widestSiblingCount = siblingGroups.reduce((maximum, group) => Math.max(maximum, group.count), 0);
	const observations = [
		...siteStructure.warnings.map(toStructureObservation),
	];
	const unlistedPages = pages.filter(({ listed }) => !listed);
	if (unlistedPages.length > 0) {
		observations.push({
			code: 'unlisted-pages',
			message: `${plural(unlistedPages.length, 'page')} and any descendants are outside generated navigation: ${unlistedPages.map(({ pathname }) => pathname).join(', ')}.`,
		});
	}

	const recommendations = [];
	for (const category of categories.filter(({ listed, listedChildCount }) => listed && listedChildCount === 1)) {
		recommendations.push({
			code: 'single-child-category',
			message: `${category.title} (${category.path}) has one listed child. Keep the category when its label adds useful orientation; otherwise consider moving the child to the category's parent.`,
			path: category.path,
		});
	}
	for (const branch of branches.filter(({ maximumLevels }) => maximumLevels >= thresholds.deepBranchLevels)) {
		recommendations.push({
			code: 'deep-branch',
			message: `${branch.title} (${branch.path}) has ${branch.maximumLevels} visible levels. Review representative navigation tasks before adding another level.`,
			path: branch.path,
		});
	}
	for (const group of siblingGroups.filter(({ count }) => count >= thresholds.wideSiblingCount)) {
		recommendations.push({
			code: 'wide-sibling-group',
			message: `${group.parentTitle} has ${group.count} listed child entries. Review whether stable, meaningful groups would make scanning easier.`,
			...(group.parentPath ? { path: group.parentPath } : {}),
		});
	}
	for (const page of pages.filter(({ h2Count }) => h2Count >= thresholds.sectionCount)) {
		recommendations.push({
			code: 'section-heavy-page',
			message: `${page.title} (${page.pathname}) has ${page.h2Count} H2 sections. Confirm that they still support one coherent reading task; otherwise consider child pages.`,
			path: page.pathname,
		});
	}

	const effectiveNavigationModes = sortUnique(pages.map(({ navigationMode }) => navigationMode).filter(Boolean));

	return {
		command: 'navigation:review',
		schemaVersion: 1,
		thresholds: {
			deepBranchLevels: thresholds.deepBranchLevels,
			sectionCount: thresholds.sectionCount,
			wideSiblingCount: thresholds.wideSiblingCount,
		},
		site: {
			branchCount: branches.length,
			categoryCount: categories.length,
			effectiveNavigationModes,
			internalReferenceCount: linkGraph.references.length,
			listedCategoryCount: categories.filter(({ listed }) => listed).length,
			listedPageCount: pages.filter(({ listed }) => listed).length,
			maximumDepth: listedEntries.reduce((maximum, { node }) => Math.max(maximum, node.depth), 0),
			pageCount: pages.length,
			requestedNavigationMode,
			resolvedPageLinkCount: resolvedPageReferences.length,
			widestSiblingCount,
		},
		branches,
		siblingGroups,
		pages,
		categories,
		errors: [
			...linkGraph.diagnostics.map(toGraphError),
			...navigationErrors,
		],
		observations,
		recommendations,
	};
};

export const getNavigationReview = async ({ requestedNavigationMode = 'automatic' } = {}) => {
	const siteStructure = await getSiteStructure();
	const linkGraph = await getSiteLinkGraph({ siteStructure });
	return createNavigationReview({ linkGraph, requestedNavigationMode, siteStructure });
};

const formatFindingSection = (title, findings) => [
	title,
	...(findings.length === 0
		? ['- None.']
		: findings.map((finding) => `- [${finding.code}] ${finding.message}${finding.source ? ` (${finding.source}${finding.line ? `:${finding.line}` : ''})` : ''}${finding.fix ? ` Fix: ${finding.fix}` : ''}`)),
];

export const formatNavigationReviewText = (review) => {
	const lines = [
		'Navigation Review',
		'',
		'Site',
		`- Navigation: ${review.site.requestedNavigationMode} configured; ${review.site.effectiveNavigationModes.join(', ') || 'unresolved'} effective`,
		`- Content: ${plural(review.site.pageCount, 'page')} (${review.site.listedPageCount} listed), ${plural(review.site.categoryCount, 'category', 'categories')} (${review.site.listedCategoryCount} listed)`,
		`- Structure: ${plural(review.site.branchCount, 'top-level branch', 'top-level branches')}, ${review.site.maximumDepth} listed ${review.site.maximumDepth === 1 ? 'level' : 'levels'}, widest sibling group ${review.site.widestSiblingCount}`,
		`- Links: ${plural(review.site.internalReferenceCount, 'internal reference')}, ${review.site.resolvedPageLinkCount} resolved to pages`,
		'',
		'Branches',
		...review.branches.map((branch) => (
			`- ${branch.title} (${branch.path}; ${branch.kind}): ${plural(branch.pageCount, 'page')}, ${plural(branch.categoryCount, 'category', 'categories')}, ${plural(branch.maximumLevels, 'visible level')}; navigation ${branch.navigationModes.join(', ') || 'unresolved'}`
		)),
		'',
		'Pages',
		...review.pages.map((page) => (
			`- ${page.title} (${page.pathname}; ${page.listed ? 'listed' : 'not listed'}): H2 ${page.h2Count}, H3 ${page.h3Count}; page links ${page.outgoingPageLinkCount} out / ${page.incomingPageLinkCount} in; navigation ${page.navigationMode ?? 'unresolved'}`
		)),
		'',
		'Categories',
		...(review.categories.length === 0
			? ['- None.']
			: review.categories.map((category) => (
				`- ${category.title} (${category.path}; ${category.listed ? 'listed' : 'not listed'}): ${category.listedChildCount} listed of ${plural(category.childCount, 'direct child', 'direct children')}`
			))),
		'',
		...formatFindingSection('Errors', review.errors),
		'',
		...formatFindingSection('Observations', review.observations),
		'',
		...formatFindingSection('Recommendations', review.recommendations),
	];

	return `${lines.join('\n')}\n`;
};

export const parseNavigationReviewArgs = (args) => {
	let format = 'text';
	let formatSeen = false;
	let help = false;

	for (let index = 0; index < args.length; index += 1) {
		const arg = args[index];
		if (arg === '-h' || arg === '--help') {
			help = true;
			continue;
		}

		let value = null;
		if (arg === '--format') {
			value = args[index + 1];
			if (!value || value.startsWith('-')) throw new Error('--format requires text or json.');
			index += 1;
		} else if (arg.startsWith('--format=')) {
			value = arg.slice('--format='.length);
		} else {
			throw new Error(`Unknown navigation:review option "${arg}". Use --format text or --format json.`);
		}

		if (formatSeen) throw new Error('Specify --format only once.');
		if (!navigationReviewFormatNames.includes(value)) {
			throw new Error(`Unknown navigation:review format "${value}". Use one of: ${navigationReviewFormatNames.join(', ')}.`);
		}
		format = value;
		formatSeen = true;
	}

	return { format, help };
};
