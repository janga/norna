import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { getGeneratedSiteRoutes } from './page-aliases.mjs';
import { parsePageMarkdownSource } from './page-markdown.mjs';
import { configSchema } from './schema-definitions.mjs';
import { parseContentFrontmatter, splitSiteFile } from './site-content.mjs';
import { createSiteLinkGraph, getSitePublicFiles } from './site-link-graph.mjs';
import { getSiteStructure } from './site-structure.mjs';
import { parseYamlConfig } from './yaml-config.mjs';

export const isInside = (root, filename) => {
	const relative = path.relative(root, filename);
	return relative === '' || (relative !== '..' && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative));
};

// The engine remains the only URL resolver. Editor reads overlay unsaved
// buffers and retain useful results when another page needs repair.
export const readEditorLinkState = async ({ siteRoot, sources = new Map() }) => {
	const readSource = (filename) => sources.has(filename) ? sources.get(filename) : readFile(filename, 'utf8');
	const structure = await getSiteStructure({ siteRoot, tolerant: true, readSource });
	const incomplete = structure.problems.map(({ message }) => message);
	let settings;
	const settingsPath = path.join(siteRoot, 'site-config/settings.yaml');
	try { settings = parseYamlConfig(await readSource(settingsPath), settingsPath, { schema: configSchema }); }
	catch (error) { incomplete.push(error.message); }
	const pageDocuments = await Promise.all(structure.contentFiles.map(async (contentFile) => {
		let source = '';
		let data = {};
		try {
			source = await readSource(contentFile.contentPath);
			data = parseContentFrontmatter(splitSiteFile(source, contentFile.contentLabel).frontmatterBody, contentFile.contentLabel);
		} catch (error) { incomplete.push(error.message); }
		let document;
		try {
			document = await parsePageMarkdownSource(source, { label: contentFile.contentLabel });
			for (const diagnostic of document.diagnostics.filter(({ severity }) => severity === 'error')) {
				incomplete.push(`${contentFile.contentLabel}:${diagnostic.line}: ${diagnostic.message}`);
			}
		} catch (error) {
			incomplete.push(error.message);
			document = await parsePageMarkdownSource('# Unavailable page\n', { label: contentFile.contentLabel });
		}
		return { contentFile, data, document };
	}));
	let publicFiles = [];
	try { publicFiles = await getSitePublicFiles(path.join(siteRoot, 'public')); }
	catch (error) { incomplete.push(error.message); }
	const generatedRoutes = getGeneratedSiteRoutes({ searchEnabled: settings?.search });
	const graph = createSiteLinkGraph({ siteStructure: structure, pageDocuments, publicFiles, generatedRoutes });
	// Missing destinations do not make reference discovery incomplete. Ambiguous
	// ownership of an address does, and must never be presented as a clean check.
	incomplete.push(...graph.diagnostics.filter((entry) => !entry.reference && entry.severity === 'error').map(({ message }) => message));
	return { structure, graph, publicFiles, generatedRoutes, settings, incomplete: [...new Set(incomplete)].sort() };
};

export const summarizeReference = (reference) => ({
	sourcePath: reference.sourceContentFile.contentPath,
	title: reference.sourcePage.title,
	line: reference.line,
	column: reference.column ?? 1,
	target: reference.target.kind === 'internal' ? reference.resolution?.pathname ?? reference.target.pathname : '',
	text: reference.sourcePage.document.fullSource.split(/\r?\n/)[reference.line - 1]?.trim() ?? '',
});

export const getEditorIncomingLinks = async ({ siteRoot, sourcePath, sources, descendants = false, excludeBranch = false, filePath, alias }) => {
	const state = await readEditorLinkState({ siteRoot, sources });
	const node = state.structure.nodes.find((entry) => (entry.contentPath ?? entry.categoryPath) === sourcePath);
	if (!node && !(filePath && path.resolve(sourcePath) === path.resolve(siteRoot))) throw new Error('This page is no longer in the selected site. Refresh Site Tree.');
	const directory = node ? path.dirname(sourcePath) : siteRoot;
	const targetPaths = new Set(state.structure.nodes.filter((entry) => entry === node || (descendants && isInside(directory, entry.nodeDir)))
		.map((entry) => entry.isHome ? '/' : `/${entry.pagePath}/`));
	const references = state.graph.references.filter((reference) => {
		if (excludeBranch && isInside(directory, reference.sourceContentFile.contentPath)) return false;
		if (alias) return reference.target.pageLookupPathname === alias;
		if (filePath) return reference.resolution?.kind === 'public-file' && reference.resolution.file.filePath === filePath;
		return targetPaths.has(reference.resolution?.pathname ?? reference.target.pageLookupPathname);
	}).map(summarizeReference);
	return { references, incomplete: state.incomplete };
};
