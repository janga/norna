import { access, constants, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import {
	createSiteLinkGraph,
	resolveInternalTarget,
} from './site-link-graph.mjs';
import { parsePageMarkdownSource } from './page-markdown.mjs';
import {
	parseContentFrontmatter,
	splitSiteFile,
	toPosixPath,
} from './site-content.mjs';
import { getSiteNodePathname } from './site-page-urls.mjs';

const pagePathPattern = /^\/(?:[a-z0-9]+(?:-[a-z0-9]+)*\/)+$/;

const exists = async (filePath) => access(filePath).then(() => true, (error) => {
	if (error?.code === 'ENOENT') return false;
	throw error;
});

const getParentPagePath = (pagePath) => {
	const segments = pagePath.split('/');
	return segments.length > 1 ? segments.slice(0, -1).join('/') : null;
};

const isPathInSubtree = (pagePath, rootPagePath) => (
	pagePath === rootPagePath || pagePath.startsWith(`${rootPagePath}/`)
);

const replacePagePathPrefix = (pagePath, fromPagePath, toPagePath) => {
	if (pagePath === fromPagePath) return toPagePath;
	return `${toPagePath}${pagePath.slice(fromPagePath.length)}`;
};

const replaceFilePathPrefix = (filePath, fromDirectory, toDirectory) => (
	path.join(toDirectory, path.relative(fromDirectory, filePath))
);

const getNextOrder = (siblings) => {
	const highestOrder = siblings.reduce((highest, node) => Math.max(highest, node.pageOrder), 0);
	const nextOrder = Math.floor(highestOrder / 10) * 10 + 10;
	if (nextOrder > 999) {
		throw new Error('No automatic page order remains below 1000. Reorder the destination siblings or pass --order.');
	}
	return nextOrder;
};

const getTargetSuffix = (target) => {
	const queryIndex = target.indexOf('?');
	const fragmentIndex = target.indexOf('#');
	const indexes = [queryIndex, fragmentIndex].filter((index) => index >= 0);
	return indexes.length > 0 ? target.slice(Math.min(...indexes)) : '';
};

const applyReplacements = (source, replacements) => {
	let updated = source;
	for (const replacement of [...replacements].sort((left, right) => right.start - left.start)) {
		updated = `${updated.slice(0, replacement.start)}${replacement.value}${updated.slice(replacement.end)}`;
	}
	return updated;
};

const insertBeforeTrailingBlankLines = (lines, additions) => {
	let index = lines.length;
	while (index > 0 && !lines[index - 1].trim()) index -= 1;
	lines.splice(index, 0, ...additions);
};

const addPageAliasToSource = (source, alias, label) => {
	const eol = source.includes('\r\n') ? '\r\n' : '\n';
	const { body, frontmatter, frontmatterBody } = splitSiteFile(source, label);
	const data = parseContentFrontmatter(frontmatterBody, label);
	if (data.page?.aliases?.includes(alias)) return { changed: false, source };

	if (!frontmatter) {
		return {
			changed: true,
			source: [
				'---',
				'page:',
				'  aliases:',
				`    - ${alias}`,
				'---',
				'',
				source,
			].join(eol),
		};
	}

	const lines = frontmatterBody.split(/\r?\n/);
	const pageIndex = lines.findIndex((line) => /^page:\s*(?:#.*)?$/.test(line));
	if (data.page && pageIndex < 0) {
		throw new Error([
			`Cannot add ${alias} to ${label} without rewriting its flow-style page metadata.`,
			'Use block YAML beginning with "page:" on its own line, or rerun with --no-aliases.',
		].join('\n'));
	}

	if (pageIndex < 0) {
		insertBeforeTrailingBlankLines(lines, [
			'page:',
			'  aliases:',
			`    - ${alias}`,
		]);
	} else {
		let pageEnd = lines.length;
		for (let index = pageIndex + 1; index < lines.length; index += 1) {
			const line = lines[index];
			if (!line.trim() || line.trimStart().startsWith('#')) continue;
			if (!line.startsWith(' ')) {
				pageEnd = index;
				break;
			}
		}

		const aliasesIndex = lines.findIndex((line, index) => (
			index > pageIndex
			&& index < pageEnd
			&& /^ {2}aliases:\s*(?:#.*)?$/.test(line)
		));
		if (data.page?.aliases && aliasesIndex < 0) {
			throw new Error([
				`Cannot add ${alias} to ${label} without rewriting its flow-style aliases list.`,
				'Use a block list below "  aliases:", or rerun with --no-aliases.',
			].join('\n'));
		}

		if (aliasesIndex < 0) {
			lines.splice(pageIndex + 1, 0, '  aliases:', `    - ${alias}`);
		} else {
			let lastAliasIndex = -1;
			for (let index = aliasesIndex + 1; index < pageEnd; index += 1) {
				if (/^ {4}-\s+/.test(lines[index])) lastAliasIndex = index;
			}
			if (lastAliasIndex < 0) {
				throw new Error(`Cannot find the block-list entries below "aliases:" in ${label}.`);
			}
			lines.splice(lastAliasIndex + 1, 0, `    - ${alias}`);
		}
	}

	return {
		changed: true,
		source: `---${eol}${lines.join(eol)}${eol}---${eol}${body}`,
	};
};

const normalizeMovePathname = (value, optionName) => {
	if (value === '/') return { pagePath: '', pathname: '/' };
	if (typeof value !== 'string' || !pagePathPattern.test(value)) {
		throw new Error(`Invalid ${optionName} "${value ?? ''}". Use a site-relative page URL such as /guides/install/.`);
	}
	return {
		pagePath: value.slice(1, -1),
		pathname: value,
	};
};

const getVirtualNode = ({
	destinationDirectory,
	destinationOrder,
	destinationPagePath,
	node,
	sitePagesDir,
	sitePagesLabel,
	sourceDirectory,
	sourcePagePath,
}) => {
	if (!isPathInSubtree(node.pagePath, sourcePagePath)) return node;

	const pagePath = replacePagePathPrefix(node.pagePath, sourcePagePath, destinationPagePath);
	const nodeDir = replaceFilePathPrefix(node.nodeDir, sourceDirectory, destinationDirectory);
	const pageDirectory = toPosixPath(path.relative(sitePagesDir, nodeDir));
	const nodeLabel = `${sitePagesLabel}/${pageDirectory}`;
	const isRoot = node.pagePath === sourcePagePath;
	const pageId = pagePath.split('/').at(-1);
	const common = {
		...node,
		nodeDir,
		nodeLabel,
		pageDirectory,
		pageId,
		pageOrder: isRoot ? destinationOrder : node.pageOrder,
		pagePath,
		parentPagePath: getParentPagePath(pagePath),
	};

	if (node.kind === 'category') {
		return {
			...common,
			categoryPath: path.join(nodeDir, 'category.yaml'),
			categorySourceLabel: `${nodeLabel}/category.yaml`,
		};
	}

	return {
		...common,
		contentLabel: `${nodeLabel}/content.md`,
		contentPath: path.join(nodeDir, 'content.md'),
		imagesDir: path.join(nodeDir, 'images'),
		imagesLabel: `${nodeLabel}/images`,
	};
};

const getResolvedReferenceIntent = ({
	movedCurrentToNew,
	movedOldToNew,
	pagesByNewPathname,
	reference,
}) => {
	const { resolution, target } = reference;
	if (resolution?.kind === 'page') {
		const currentPathname = resolution.page.pathname;
		const pathname = movedCurrentToNew.get(currentPathname) ?? currentPathname;
		return {
			kind: 'page',
			lookupPathname: pathname,
			page: pagesByNewPathname.get(pathname) ?? resolution.page,
		};
	}

	if (resolution?.kind === 'page-alias') {
		const movedAliasTarget = movedOldToNew.get(target.pageLookupPathname);
		if (movedAliasTarget) {
			return {
				kind: 'page',
				lookupPathname: movedAliasTarget,
				page: pagesByNewPathname.get(movedAliasTarget) ?? resolution.page,
			};
		}
		return {
			kind: 'page',
			lookupPathname: target.pageLookupPathname,
			page: resolution.page,
		};
	}

	if (resolution?.kind === 'public-file') {
		return { kind: 'public-file', lookupPathname: target.pathname };
	}

	if (resolution?.kind === 'missing-page') {
		const movedPathname = movedOldToNew.get(target.pageLookupPathname);
		if (movedPathname) {
			return {
				kind: 'page',
				lookupPathname: movedPathname,
				page: pagesByNewPathname.get(movedPathname),
			};
		}
	}

	return null;
};

const getTargetIntent = ({ graph, movedCurrentToNew, movedOldToNew, pagesByNewPathname, target }) => {
	if (target.kind !== 'internal') return null;
	if (target.pageLookupPathname) {
		const pathname = movedOldToNew.get(target.pageLookupPathname) ?? target.pageLookupPathname;
		const page = pagesByNewPathname.get(pathname) ?? graph.pagesByPathname.get(pathname);
		if (page) return { kind: 'page', lookupPathname: pathname, page };
		const alias = graph.aliasesByPathname.get(target.pageLookupPathname);
		if (alias) {
			const aliasTarget = movedCurrentToNew.get(alias.targetPathname) ?? alias.targetPathname;
			return {
				kind: 'page',
				lookupPathname: target.pageLookupPathname,
				page: pagesByNewPathname.get(aliasTarget) ?? graph.pagesByPathname.get(alias.targetPathname),
			};
		}
	}
	if (graph.publicFilesByPathname.has(target.pathname)) {
		return { kind: 'public-file', lookupPathname: target.pathname };
	}
	return null;
};

const getReferenceIntent = ({
	graph,
	mappingByCurrentPathname,
	movedCurrentToNew,
	movedOldToNew,
	pagesByNewPathname,
	reference,
}) => {
	const currentIntent = getResolvedReferenceIntent({
		movedCurrentToNew,
		movedOldToNew,
		pagesByNewPathname,
		reference,
	});
	const sourceMapping = mappingByCurrentPathname.get(reference.sourcePage.pathname);
	if (!sourceMapping || sourceMapping.oldPathname === sourceMapping.currentPathname) return currentIntent;

	const oldTarget = resolveInternalTarget(reference.targetSource, sourceMapping.oldPathname);
	const oldIntent = getTargetIntent({
		graph,
		movedCurrentToNew,
		movedOldToNew,
		pagesByNewPathname,
		target: oldTarget,
	});
	if (currentIntent && oldIntent && (
		currentIntent.kind !== oldIntent.kind
		|| currentIntent.lookupPathname !== oldIntent.lookupPathname
	)) {
		throw new Error([
			`Cannot safely reconcile "${reference.targetSource}" on line ${reference.line} in ${reference.sourceContentFile.contentLabel}.`,
			`From the old page location it identifies ${oldIntent.lookupPathname}, but from the new location it identifies ${currentIntent.lookupPathname}.`,
			'Make the intended link site-relative, then run page:move again.',
		].join('\n'));
	}

	return currentIntent ?? oldIntent;
};

const createReferenceChanges = ({ graph, mappings }) => {
	const movedCurrentToNew = new Map(mappings.map((mapping) => [mapping.currentPathname, mapping.newPathname]));
	const movedOldToNew = new Map(mappings.map((mapping) => [mapping.oldPathname, mapping.newPathname]));
	const pagesByNewPathname = new Map(mappings.map((mapping) => [mapping.newPathname, mapping.page]));
	const mappingByCurrentPathname = new Map(mappings.map((mapping) => [mapping.currentPathname, mapping]));
	const changesByPath = new Map();
	const changeKeys = new Map();

	for (const reference of graph.references) {
		const intent = getReferenceIntent({
			graph,
			mappingByCurrentPathname,
			movedCurrentToNew,
			movedOldToNew,
			pagesByNewPathname,
			reference,
		});
		if (!intent) continue;

		if (reference.target.fragment && intent.kind === 'page') {
			if (!intent.page?.anchors.has(reference.target.fragment)) {
				throw new Error(
					`Cannot update "${reference.targetSource}" on line ${reference.line} in ${reference.sourceContentFile.contentLabel}. `
					+ `The destination ${intent.lookupPathname} has no #${reference.target.fragment} heading.`,
				);
			}
		}

		const sourcePathname = movedCurrentToNew.get(reference.sourcePage.pathname)
			?? reference.sourcePage.pathname;
		const resolvedAfterMove = resolveInternalTarget(reference.targetSource, sourcePathname);
		const stillResolves = resolvedAfterMove.kind === 'internal'
			&& (intent.kind === 'public-file'
				? resolvedAfterMove.pathname === intent.lookupPathname
				: resolvedAfterMove.pageLookupPathname === intent.lookupPathname);
		if (stillResolves) continue;

		if (!reference.targetRange) {
			throw new Error(
				`Cannot safely edit "${reference.targetSource}" on line ${reference.line} in ${reference.sourceContentFile.contentLabel} because its source range is unavailable.`,
			);
		}

		const value = `${intent.lookupPathname}${getTargetSuffix(reference.targetSource)}`;
		const key = `${reference.sourceContentFile.contentPath}:${reference.targetRange.start}:${reference.targetRange.end}`;
		const existing = changeKeys.get(key);
		if (existing && existing.value !== value) {
			throw new Error(`One link target in ${reference.sourceContentFile.contentLabel} produced conflicting page-move edits.`);
		}
		if (existing) continue;

		const change = {
			end: reference.targetRange.end,
			from: reference.targetSource,
			line: reference.definitionLine ?? reference.line,
			start: reference.targetRange.start,
			to: value,
			value,
		};
		changeKeys.set(key, change);
		if (!changesByPath.has(reference.sourceContentFile.contentPath)) {
			changesByPath.set(reference.sourceContentFile.contentPath, []);
		}
		changesByPath.get(reference.sourceContentFile.contentPath).push(change);
	}

	return changesByPath;
};

const formatGraphDiagnostics = (diagnostics) => diagnostics.flatMap((diagnostic) => [
	`- ${diagnostic.message}`,
	...(diagnostic.fix ? [`  Fix: ${diagnostic.fix}`] : []),
]);

export const createPageMovePlan = async ({
	from,
	graph,
	order = null,
	preserveAliases = true,
	publicFiles,
	sitePagesDir,
	sitePagesLabel,
	siteStructure,
	to,
}) => {
	const source = normalizeMovePathname(from, 'source URL');
	const destination = normalizeMovePathname(to, 'destination URL');
	if (source.pathname === '/') throw new Error('The homepage cannot be moved.');
	if (destination.pathname === '/') throw new Error('A page cannot replace the homepage URL /.');
	if (source.pathname === destination.pathname) {
		throw new Error('Source and destination URLs must be different.');
	}

	const sourceNode = siteStructure.nodes.find((node) => node.pagePath === source.pagePath);
	const destinationNode = siteStructure.nodes.find((node) => node.pagePath === destination.pagePath);
	if (sourceNode?.kind === 'category') {
		throw new Error(`Cannot move ${source.pathname} because it is a navigation category, not a page.`);
	}
	if (sourceNode?.isHome) throw new Error('The homepage cannot be moved.');
	if (destinationNode?.kind === 'category') {
		throw new Error(`Cannot use ${destination.pathname} because a navigation category already owns that path.`);
	}
	if (sourceNode && destinationNode) {
		throw new Error(`Cannot move ${source.pathname} to ${destination.pathname} because both pages exist.`);
	}
	if (!sourceNode && !destinationNode) {
		throw new Error(`Cannot move or reconcile the page because neither ${source.pathname} nor ${destination.pathname} exists.`);
	}

	const mode = sourceNode ? 'move' : 'reconcile';
	if (mode === 'reconcile' && order !== null) {
		throw new Error('--order cannot be used when reconciling a page that is already at its destination.');
	}

	const activeRoot = sourceNode ?? destinationNode;
	const activeRootPath = activeRoot.pagePath;
	const subtreeNodes = siteStructure.nodes.filter((node) => isPathInSubtree(node.pagePath, activeRootPath));
	const subtreePages = subtreeNodes.filter((node) => node.kind === 'page');
	let destinationDirectory = null;
	let destinationOrder = activeRoot.pageOrder;
	let destinationCollectionDirectory = null;
	let destinationCollectionExists = true;
	let virtualNodes = siteStructure.nodes;

	if (mode === 'move') {
		const destinationParentPath = getParentPagePath(destination.pagePath);
		const destinationParent = destinationParentPath
			? siteStructure.nodes.find((node) => node.pagePath === destinationParentPath)
			: null;
		if (destinationParentPath && !destinationParent) {
			throw new Error(`Cannot find destination parent /${destinationParentPath}/.`);
		}
		if (destinationParent && isPathInSubtree(destinationParent.pagePath, source.pagePath)) {
			throw new Error('A page cannot be moved below itself or one of its descendants.');
		}

		const destinationSiblings = siteStructure.nodes.filter((node) => (
			node.parentPagePath === destinationParentPath
			&& !isPathInSubtree(node.pagePath, source.pagePath)
		));
		const sameParent = sourceNode.parentPagePath === destinationParentPath;
		destinationOrder = order ?? (sameParent ? sourceNode.pageOrder : getNextOrder(destinationSiblings));
		if (destinationSiblings.some((node) => node.pageOrder === destinationOrder)) {
			throw new Error(`Destination order ${String(destinationOrder).padStart(3, '0')} is already used below ${destinationParentPath ? `/${destinationParentPath}/` : '/'}.`);
		}

		const destinationSlug = destination.pagePath.split('/').at(-1);
		destinationCollectionDirectory = destinationParent
			? path.join(destinationParent.nodeDir, 'pages')
			: sitePagesDir;
		destinationDirectory = path.join(
			destinationCollectionDirectory,
			`${String(destinationOrder).padStart(3, '0')}-${destinationSlug}`,
		);
		if (await exists(destinationDirectory)) {
			throw new Error(`Destination directory ${destinationDirectory} already exists.`);
		}
		destinationCollectionExists = await exists(destinationCollectionDirectory);

		virtualNodes = siteStructure.nodes.map((node) => getVirtualNode({
			destinationDirectory,
			destinationOrder,
			destinationPagePath: destination.pagePath,
			node,
			sitePagesDir,
			sitePagesLabel,
			sourceDirectory: sourceNode.nodeDir,
			sourcePagePath: source.pagePath,
		}));
		const virtualPaths = new Set();
		for (const node of virtualNodes) {
			if (virtualPaths.has(node.pagePath)) {
				throw new Error(`The move would give more than one page or category the path /${node.pagePath}/.`);
			}
			virtualPaths.add(node.pagePath);
		}
	}

	const nodeMappings = siteStructure.nodes.map((node, index) => ({
		originalNode: node,
		virtualNode: virtualNodes[index],
	}));
	const virtualNodeByOriginalDirectory = new Map(nodeMappings.map(({ originalNode, virtualNode }) => [
		originalNode.pageDirectory,
		virtualNode,
	]));
	const originalNodeByVirtualDirectory = new Map(nodeMappings.map(({ originalNode, virtualNode }) => [
		virtualNode.pageDirectory,
		originalNode,
	]));
	const mappings = subtreePages.map((node) => {
		const page = graph.pagesByPathname.get(getSiteNodePathname(node));
		if (!page) throw new Error(`Cannot find parsed page data for ${node.contentLabel}.`);
		const currentPathname = page.pathname;
		const oldPathname = mode === 'move'
			? currentPathname
			: `/${replacePagePathPrefix(node.pagePath, destination.pagePath, source.pagePath)}/`;
		const newPathname = mode === 'move'
			? `/${replacePagePathPrefix(node.pagePath, source.pagePath, destination.pagePath)}/`
			: currentPathname;
		return {
			currentPathname,
			newPathname,
			node,
			oldPathname,
			page,
			virtualNode: virtualNodeByOriginalDirectory.get(node.pageDirectory),
		};
	});

	const referenceChangesByPath = createReferenceChanges({ graph, mappings });
	const mappingByContentPath = new Map(mappings.map((mapping) => [mapping.node.contentPath, mapping]));
	const fileChanges = [];
	const updatedSources = new Map();
	const aliasChanges = [];
	const linkChanges = [];

	for (const page of graph.pages) {
		const contentPath = page.contentFile.contentPath;
		const replacements = referenceChangesByPath.get(contentPath) ?? [];
		let updatedSource = applyReplacements(page.document.fullSource, replacements);
		linkChanges.push(...replacements.map((replacement) => ({
			...replacement,
			contentLabel: page.contentFile.contentLabel,
		})));

		const mapping = mappingByContentPath.get(contentPath);
		if (mapping && preserveAliases) {
			const aliasResult = addPageAliasToSource(updatedSource, mapping.oldPathname, page.contentFile.contentLabel);
			updatedSource = aliasResult.source;
			if (aliasResult.changed) {
				aliasChanges.push({
					alias: mapping.oldPathname,
					contentLabel: mapping.virtualNode.contentLabel,
				});
			}
		}

		updatedSources.set(contentPath, updatedSource);
		if (updatedSource !== page.document.fullSource) {
			const fileStat = await stat(contentPath);
			fileChanges.push({
				contentLabel: page.contentFile.contentLabel,
				finalPath: mapping?.virtualNode.contentPath ?? contentPath,
				mode: fileStat.mode,
				originalPath: contentPath,
				originalSource: page.document.fullSource,
				updatedSource,
			});
		}
	}

	const virtualContentFiles = virtualNodes.filter((node) => node.kind === 'page');
	const virtualPageDocuments = await Promise.all(virtualContentFiles.map(async (contentFile) => {
		const originalContentFile = originalNodeByVirtualDirectory.get(contentFile.pageDirectory);
		if (!originalContentFile) throw new Error(`Cannot map proposed content file ${contentFile.contentLabel} to its source.`);
		const sourceText = updatedSources.get(originalContentFile.contentPath)
			?? await readFile(originalContentFile.contentPath, 'utf8');
		const { frontmatterBody } = splitSiteFile(sourceText, contentFile.contentLabel);
		const document = await parsePageMarkdownSource(sourceText, { label: contentFile.contentLabel });
		if (document.diagnostics.length > 0) {
			throw new Error([
				`Page move preflight found invalid Markdown in ${contentFile.contentLabel}.`,
				...document.diagnostics.map((diagnostic) => `- line ${diagnostic.line}: ${diagnostic.message}`),
			].join('\n'));
		}
		return {
			contentFile,
			data: parseContentFrontmatter(frontmatterBody, contentFile.contentLabel),
			document,
		};
	}));
	const virtualStructure = {
		categories: virtualNodes.filter((node) => node.kind === 'category'),
		contentFiles: virtualContentFiles,
		nodes: virtualNodes,
		warnings: siteStructure.warnings,
	};
	const virtualGraph = createSiteLinkGraph({
		pageDocuments: virtualPageDocuments,
		publicFiles,
		siteStructure: virtualStructure,
	});
	if (virtualGraph.diagnostics.length > 0) {
		throw new Error([
			'Page move preflight failed. No file was changed.',
			...formatGraphDiagnostics(virtualGraph.diagnostics),
		].join('\n'));
	}

	if (mode === 'move') {
		await access(sourceNode.nodeDir, constants.R_OK);
		await access(path.dirname(sourceNode.nodeDir), constants.W_OK);
		await access(destinationCollectionExists ? destinationCollectionDirectory : path.dirname(destinationCollectionDirectory), constants.W_OK);
	}
	for (const change of fileChanges) {
		await access(change.originalPath, constants.R_OK);
		await access(path.dirname(change.originalPath), constants.W_OK);
	}

	return {
		aliasChanges,
		destinationCollectionDirectory,
		destinationCollectionExists,
		destinationDirectory,
		fileChanges,
		from: source.pathname,
		linkChanges,
		mappings,
		mode,
		preserveAliases,
		sourceFiles: graph.pages.map((page) => ({
			contentLabel: page.contentFile.contentLabel,
			contentPath: page.contentFile.contentPath,
			source: page.document.fullSource,
		})),
		sourceDirectory: mode === 'move' ? sourceNode.nodeDir : null,
		to: destination.pathname,
	};
};

export const formatPageMovePlan = (plan, displayPath) => {
	const lines = [
		'Page move plan',
		`Mode: ${plan.mode === 'move' ? 'move page directory' : 'reconcile an already moved page'}`,
	];
	if (plan.mode === 'move') {
		lines.push(`Directory: ${displayPath(plan.sourceDirectory)} -> ${displayPath(plan.destinationDirectory)}`);
	}
	lines.push('', 'Page URLs:');
	for (const mapping of plan.mappings) lines.push(`- ${mapping.oldPathname} -> ${mapping.newPathname}`);
	lines.push('', 'Link updates:');
	if (plan.linkChanges.length === 0) lines.push('- none');
	for (const change of plan.linkChanges) {
		lines.push(`- ${change.contentLabel} line ${change.line}: ${change.from} -> ${change.to}`);
	}
	lines.push('', 'Aliases:');
	if (!plan.preserveAliases) lines.push('- skipped by --no-aliases');
	else if (plan.aliasChanges.length === 0) lines.push('- none needed');
	else for (const change of plan.aliasChanges) lines.push(`- ${change.contentLabel}: add ${change.alias}`);
	return lines;
};
