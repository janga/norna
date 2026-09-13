import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { access, mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';
import { load as loadYaml } from 'js-yaml';
import { markdownToMdast } from 'satteri';

const execFileAsync = promisify(execFile);
const repoRoot = path.resolve(import.meta.dirname, '..', '..');
const packageJsonPath = path.join(repoRoot, 'package.json');
const supportedCallouts = new Set(['info', 'note', 'tip', 'important', 'warning', 'caution', 'danger']);
const ignoredDirectoryNames = new Set(['.git', 'node_modules', 'build', '.docusaurus', 'dist', 'cache']);
const sourceFilePattern = /\.(?:md|mdx)$/i;
const navigationFilePattern = /(?:^|\/)(?:docusaurus\.config\.[^/]+|sidebars\.[^/]+|versions\.json)$/i;
const pageClassificationOrder = ['unresolved', 'model-gap', 'feature-gap', 'assist', 'out-of-scope', 'rewrite', 'copy'];

const toPosixPath = (value) => value.split(path.sep).join('/');
const isDirectory = async (directory) => access(directory).then(() => true, () => false);
const isWithin = (parent, child) => {
	const relative = path.relative(parent, child);
	return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
};

const normalizeRepositoryUrl = (value) => {
	if (!value) return null;
	const source = value.trim().replace(/\.git$/, '');
	if (source.startsWith('git@github.com:')) return 'https://github.com/' + source.slice('git@github.com:'.length);
	if (source.startsWith('ssh://git@github.com/')) return 'https://github.com/' + source.slice('ssh://git@github.com/'.length);
	if (/^https?:\/\/github\.com\//i.test(source)) return source.replace(/\/$/, '');
	return null;
};

const readGitValue = async (sourceRoot, args) => {
	try {
		const result = await execFileAsync('git', ['-C', sourceRoot, ...args], { maxBuffer: 1024 * 1024 });
		return result.stdout.trim() || null;
	} catch (error) {
		if (error.status === 128 || error.code === 'ENOENT') return null;
		throw error;
	}
};

const getGitMetadata = async (sourceRoot) => {
	const [revision, repository, commitDate] = await Promise.all([
		readGitValue(sourceRoot, ['rev-parse', 'HEAD']),
		readGitValue(sourceRoot, ['config', '--get', 'remote.origin.url']),
		readGitValue(sourceRoot, ['show', '-s', '--format=%cI', 'HEAD']),
	]);
	return { commitDate, repository: normalizeRepositoryUrl(repository), revision };
};

const collectFiles = async (directory, predicate = () => true) => {
	const entries = (await readdir(directory, { withFileTypes: true }))
		.sort((left, right) => left.name.localeCompare(right.name, 'en'));
	const files = [];
	for (const entry of entries) {
		if (entry.isDirectory() && ignoredDirectoryNames.has(entry.name)) continue;
		const entryPath = path.join(directory, entry.name);
		if (entry.isDirectory()) files.push(...await collectFiles(entryPath, predicate));
		else if (predicate(entryPath, entry.name)) files.push(entryPath);
	}
	return files;
};

const discoverDocsRoots = async (sourceRoot) => {
	const candidates = [
		['website/docs', 'current'],
		['docs', 'current'],
		['website/versioned_docs', 'versioned'],
		['versioned_docs', 'versioned'],
	];
	const roots = [];
	for (const [relativePath, kind] of candidates) {
		const directory = path.join(sourceRoot, relativePath);
		if (await isDirectory(directory) && !roots.some((root) => root.directory === directory)) {
			roots.push({ directory, kind, relativePath });
		}
	}
	return roots;
};

const getVersionFromPath = (relativePath, root) => root.kind === 'versioned'
	? relativePath.split('/').find((segment) => segment.startsWith('version-')) ?? 'versioned'
	: 'current';

const parseFrontmatter = (source) => {
	const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
	if (!match) return { data: {}, present: false };
	try {
		const data = loadYaml(match[1]) ?? {};
		return {
			data: data && typeof data === 'object' && !Array.isArray(data) ? data : {},
			present: true,
		};
	} catch (error) {
		return {
			data: {},
			error: error instanceof Error ? error.message : String(error),
			present: true,
		};
	}
};

const nodeRange = (node) => ({
	line: node.position?.start.line ?? 1,
	start: node.position?.start.offset ?? 0,
	end: node.position?.end.offset ?? node.position?.start.offset ?? 0,
});

const visit = (node, callback) => {
	if (!node || typeof node !== 'object') return;
	callback(node);
	for (const child of node.children ?? []) visit(child, callback);
};

const isInRange = (offset, ranges) => ranges.some((range) => offset >= range.start && offset < range.end);
const findingPriority = (classification) => pageClassificationOrder.indexOf(classification);
const getPageClassification = (findings) => findings.length === 0
	? 'copy'
	: findings.reduce((best, finding) => findingPriority(finding.classification) < findingPriority(best)
		? finding.classification
		: best, 'copy');

const createFindingCollector = (relativePath) => {
	const findings = [];
	const seen = new Set();
	return {
		add({ code, classification, line = 1, message, action }) {
			const key = code + ':' + line;
			if (seen.has(key)) return;
			seen.add(key);
			findings.push({ action, classification, code, line, message, sourceFile: relativePath });
		},
		list() {
			return findings.sort((left, right) => left.line - right.line || left.code.localeCompare(right.code));
		},
	};
};

const inspectHtmlNode = (node, collector) => {
	const value = String(node.value ?? '');
	const line = nodeRange(node).line;
	const knownComponents = [
		['Tabs', 'content-tabs', 'assist', 'Convert the alternatives to Norna content tabs and keep headings outside the tab group.'],
		['TabItem', 'content-tabs', 'assist', 'Convert each alternative to a labelled Norna tab and review the grouping.'],
		['DocCardList', 'generated-child-list', 'assist', 'Review whether the source collection should become a Norna page-list block.'],
		['Details', 'native-details', 'rewrite', 'Convert the component to native HTML details with a concise summary.'],
		['Admonition', 'semantic-callout', 'assist', 'Map the meaning to a closed Norna callout type and review the title.'],
		['BrowserWindow', 'presentation-wrapper', 'assist', 'Remove the source-only wrapper and retain its readable content.'],
		['ThemedImage', 'themed-image', 'assist', 'Choose one managed Norna image or provide explicit image alternatives.'],
	];
	for (const [component, code, classification, action] of knownComponents) {
		if (new RegExp('<' + component + '\\b|</' + component + '>').test(value)) {
			collector.add({
				action,
				classification,
				code,
				line,
				message: 'The source uses the Docusaurus ' + component + ' component.',
			});
		}
	}
	if (/<[A-Z][A-Za-z0-9]*(?:\s|>|\/)/.test(value)
		&& !knownComponents.some(([component]) => value.includes('<' + component))) {
		collector.add({
			action: 'Replace the component with supported Markdown or a reviewed static fallback.',
			classification: 'feature-gap',
			code: 'unsupported-mdx-component',
			line,
			message: 'The source uses an MDX component without a known Norna equivalent.',
		});
	}
};

const inspectFrontmatter = (data, collector) => {
	const directReview = new Set(['slug', 'sidebar_label', 'sidebar_position', 'pagination_next', 'pagination_prev']);
	const presentationGap = new Set(['hide_title', 'hide_table_of_contents', 'toc_min_heading_level', 'toc_max_heading_level', 'image', 'keywords']);
	for (const key of Object.keys(data)) {
		if (['title', 'description'].includes(key)) continue;
		const normalizedKey = key.replaceAll('_', '-');
		if (directReview.has(key)) {
			collector.add({
				action: 'Review the field and express its meaning through Norna page structure or supported metadata.',
				classification: 'assist',
				code: 'frontmatter-' + normalizedKey,
				message: 'Docusaurus frontmatter field "' + key + '" has no guaranteed one-to-one Norna mapping.',
			});
		} else if (presentationGap.has(key)) {
			collector.add({
				action: 'Keep the information explicitly in the report and choose a supported Norna presentation.',
				classification: 'feature-gap',
				code: 'frontmatter-' + normalizedKey,
				message: 'Docusaurus frontmatter field "' + key + '" controls source-specific presentation or metadata.',
			});
		} else {
			collector.add({
				action: 'Review the field instead of copying it into Norna configuration automatically.',
				classification: 'assist',
				code: 'frontmatter-' + normalizedKey,
				message: 'Docusaurus frontmatter field "' + key + '" needs semantic review.',
			});
		}
	}
};

const inspectSourceLines = (source, codeRanges, collector) => {
	let offset = 0;
	for (const [index, line] of source.split('\n').entries()) {
		const lineNumber = index + 1;
		if (!isInRange(offset, codeRanges)) {
			const callout = line.match(/^\s*:::\s*([a-z][a-z0-9-]*)(?:\[([^\]]*)\])?/i);
			if (callout) {
				const type = callout[1].toLowerCase();
				const supported = supportedCallouts.has(type);
				collector.add({
					action: supported
						? 'Convert the meaning to Norna GitHub-style semantic callout syntax.'
						: 'Map the meaning to a supported Norna callout or retain a readable Markdown fallback.',
					classification: supported ? 'rewrite' : 'assist',
					code: supported ? 'semantic-callout' : 'custom-container',
					line: lineNumber,
					message: supported
						? 'The source uses the Docusaurus ' + type + ' admonition.'
						: 'The source uses a custom Docusaurus container named ' + type + '.',
				});
			}
			if (/^\s*(?:import|export)\s+/.test(line)) {
				collector.add({
					action: 'Do not execute it; remove the statement and review the content it provided.',
					classification: 'out-of-scope',
					code: 'mdx-module-statement',
					line: lineNumber,
					message: 'The source contains an MDX module statement.',
				});
			}
			if (/\{\s*[A-Za-z_$][\w$]*(?:\.|\s*[+\-*/])/u.test(line)) {
				collector.add({
					action: 'Replace it with explicit Markdown content or a reviewed static fallback.',
					classification: 'feature-gap',
					code: 'mdx-expression',
					line: lineNumber,
					message: 'The source contains an MDX expression that requires JavaScript evaluation.',
				});
			}
		}
		offset += line.length + 1;
	}
};

const inspectCodeNodes = (tree, collector) => {
	visit(tree, (node) => {
		if (node.type !== 'code' || !node.meta) return;
		const metadata = String(node.meta);
		const line = nodeRange(node).line;
		if (/\b(?:live|playground|noInline|showLineNumbers)\b/i.test(metadata)) {
			collector.add({
				action: 'Retain the code as a static Norna example and document the lost interaction.',
				classification: 'feature-gap',
				code: 'interactive-code-block',
				line,
				message: 'The code block requests Docusaurus-specific interactive or display behavior.',
			});
		} else if (/title\s*=|\{\d/.test(metadata)) {
			collector.add({
				action: 'Normalize the title and highlighted-line metadata to Norna code-fence syntax.',
				classification: 'rewrite',
				code: 'rich-code-metadata',
				line,
				message: 'The code block uses metadata that has a supported Norna presentation equivalent.',
			});
		} else {
			collector.add({
				action: 'Review the metadata and retain the code in a supported static form.',
				classification: 'assist',
				code: 'unsupported-code-metadata',
				line,
				message: 'The code block uses Docusaurus-specific metadata.',
			});
		}
	});
};

const inspectPage = async ({ absolutePath, relativePath, root }) => {
	const source = await readFile(absolutePath, 'utf8');
	const frontmatter = parseFrontmatter(source);
	const collector = createFindingCollector(relativePath);
	if (frontmatter.error) {
		collector.add({
			action: 'Review the frontmatter manually before migration.',
			classification: 'unresolved',
			code: 'invalid-frontmatter',
			message: 'Frontmatter could not be parsed without executing the source project.',
		});
	}
	let tree;
	try {
		tree = await markdownToMdast(source, { features: { frontmatter: true, gfm: true } });
	} catch {
		collector.add({
			action: 'Review the source syntax and choose a supported Norna fallback.',
			classification: 'unresolved',
			code: 'unparseable-markdown',
			message: 'The source document could not be parsed as Markdown without running Docusaurus or MDX.',
		});
		return createPageResult({ frontmatter, relativePath, root, findings: collector.list() });
	}
	const headings = [];
	const codeRanges = [];
	visit(tree, (node) => {
		if (node.type === 'heading') headings.push(node);
		if (node.type === 'code') codeRanges.push(nodeRange(node));
		if (node.type === 'image') {
			collector.add({
				action: 'Move the asset beside the Norna page and convert the reference to image-stack or image-carousel syntax.',
				classification: 'rewrite',
				code: 'managed-image-rewrite',
				line: nodeRange(node).line,
				message: 'A Markdown image needs conversion to a Norna-managed image block.',
			});
		}
		if (node.type === 'html') inspectHtmlNode(node, collector);
	});
	const pageHeadings = headings.filter((heading) => heading.depth === 1);
	if (pageHeadings.length === 0 && typeof frontmatter.data.title === 'string' && frontmatter.data.title.trim()) {
		collector.add({
			action: "Create Norna's single Markdown H1 from the frontmatter title.",
			classification: 'rewrite',
			code: 'frontmatter-page-title',
			message: 'The page title is supplied by Docusaurus frontmatter rather than an H1.',
		});
	} else if (pageHeadings.length === 0) {
		collector.add({
			action: 'Choose the page title before writing the Norna page.',
			classification: 'unresolved',
			code: 'missing-page-title',
			message: 'No H1 or frontmatter title identifies the source page.',
		});
	} else if (pageHeadings.length > 1) {
		collector.add({
			action: 'Keep one H1 and turn the remaining title into an appropriate section heading.',
			classification: 'assist',
			code: 'multiple-page-titles',
			line: nodeRange(pageHeadings[1]).line,
			message: 'The source contains more than one H1, while Norna requires one page title.',
		});
	}
	inspectFrontmatter(frontmatter.data, collector);
	inspectSourceLines(source, codeRanges, collector);
	inspectCodeNodes(tree, collector);
	return createPageResult({
		frontmatter,
		headings,
		relativePath,
		root,
		findings: collector.list(),
	});
};

const createPageResult = ({ frontmatter, headings = [], relativePath, root, findings }) => {
	const title = typeof frontmatter.data.title === 'string' && frontmatter.data.title.trim()
		? frontmatter.data.title.trim()
		: headings.find((heading) => heading.depth === 1)?.children?.map((child) => child.value ?? '').join('').trim()
			|| path.basename(relativePath).replace(/\.(?:md|mdx)$/i, '');
	return {
		classification: getPageClassification(findings),
		documentationVersion: getVersionFromPath(relativePath, root),
		findings,
		relativePath,
		title,
	};
};

const classifyCounts = (items, selector) => Object.fromEntries(pageClassificationOrder.map((classification) => [
	classification,
	items.filter((item) => selector(item) === classification).length,
]));

const problemKey = (finding) => [
	finding.classification,
	finding.code,
	finding.message,
	finding.action,
].join('\u0000');

const aggregateProblemTypes = (pages) => {
	const grouped = new Map();
	for (const page of pages) {
		for (const finding of page.findings) {
			const key = problemKey(finding);
			const group = grouped.get(key) ?? {
				action: finding.action,
				classification: finding.classification,
				code: finding.code,
				fingerprint: createHash('sha256').update(key).digest('hex'),
				message: finding.message,
				occurrences: [],
			};
			group.occurrences.push({
				line: finding.line,
				pageTitle: page.title,
				sourceFile: finding.sourceFile,
			});
			grouped.set(key, group);
		}
	}
	return [...grouped.values()]
		.map((group) => {
			const ranked = [...group.occurrences].sort((left, right) => {
				const leftRank = createHash('sha256')
					.update(group.fingerprint + '\u0000' + left.sourceFile + '\u0000' + left.line)
					.digest('hex');
				const rightRank = createHash('sha256')
					.update(group.fingerprint + '\u0000' + right.sourceFile + '\u0000' + right.line)
					.digest('hex');
				return leftRank.localeCompare(rightRank);
			});
			const sample = ranked.slice(0, 20).sort((left, right) => (
				left.sourceFile.localeCompare(right.sourceFile, 'en') || left.line - right.line
			));
			return {
				action: group.action,
				classification: group.classification,
				code: group.code,
				fingerprint: group.fingerprint,
				id: 'DM-' + group.fingerprint.slice(0, 12).toUpperCase(),
				message: group.message,
				occurrences: group.occurrences.length,
				sample,
			};
		})
		.sort((left, right) => right.occurrences - left.occurrences || left.id.localeCompare(right.id));
};

export const parseMigrationCheckArgs = (args, cwd = process.cwd()) => {
	let sourceSystem = null;
	let sourceRoot = null;
	let reportDir = null;
	let help = false;
	for (let index = 0; index < args.length; index += 1) {
		const arg = args[index];
		if (arg === '--help' || arg === '-h') {
			help = true;
			continue;
		}
		const readOption = (name) => {
			const value = arg === name
				? args[++index]
				: arg.startsWith(name + '=') ? arg.slice(name.length + 1) : null;
			if (!value || value.startsWith('-')) throw new Error(name + ' requires a value.');
			return value;
		};
		if (arg === '--source' || arg.startsWith('--source=')) sourceSystem = readOption('--source');
		else if (arg === '--report-dir' || arg.startsWith('--report-dir=')) reportDir = readOption('--report-dir');
		else if (arg.startsWith('-')) throw new Error('Unknown migrate:check option "' + arg + '".');
		else if (sourceRoot) throw new Error('migrate:check accepts exactly one Docusaurus project root.');
		else sourceRoot = arg;
	}
	if (help) return { help: true };
	if (sourceSystem !== 'docusaurus') throw new Error('migrate:check currently supports only --source docusaurus.');
	if (!sourceRoot) throw new Error('migrate:check requires a Docusaurus project root.');
	if (!reportDir) throw new Error('migrate:check requires --report-dir <empty-directory>.');
	return {
		reportDir: path.resolve(cwd, reportDir),
		sourceRoot: path.resolve(cwd, sourceRoot),
		sourceSystem,
	};
};

export const migrationCheckUsage = 'Usage: norna migrate:check --source docusaurus <project-root> --report-dir <empty-directory>';

export const auditDocusaurusProject = async ({ sourceRoot, analysisTime = new Date().toISOString() }) => {
	if (!(await isDirectory(sourceRoot))) throw new Error('Docusaurus project root does not exist: ' + sourceRoot);
	const [docsRoots, git, packageSource] = await Promise.all([
		discoverDocsRoots(sourceRoot),
		getGitMetadata(sourceRoot),
		readFile(packageJsonPath, 'utf8').then(JSON.parse),
	]);
	if (docsRoots.length === 0) throw new Error('No Docusaurus docs directory found below ' + sourceRoot + '. Expected docs/ or website/docs/.');
	const pages = [];
	for (const root of docsRoots) {
		const files = await collectFiles(root.directory, (absolutePath) => sourceFilePattern.test(absolutePath));
		for (const absolutePath of files) {
			const relativePath = toPosixPath(path.relative(sourceRoot, absolutePath));
			pages.push(await inspectPage({ absolutePath, relativePath, root }));
		}
	}
	pages.sort((left, right) => left.relativePath.localeCompare(right.relativePath, 'en'));
	const allFiles = await collectFiles(sourceRoot);
	const navigationFiles = allFiles
		.filter((absolutePath) => navigationFilePattern.test(toPosixPath(path.relative(sourceRoot, absolutePath))))
		.map((absolutePath) => toPosixPath(path.relative(sourceRoot, absolutePath)))
		.sort((left, right) => left.localeCompare(right, 'en'));
	const findings = pages.flatMap((page) => page.findings);
	const problemTypes = aggregateProblemTypes(pages);
	return {
		analysis: { adapterVersion: 1, analyzedAt: analysisTime, nornaVersion: packageSource.version },
		navigation: { files: navigationFiles, status: 'discovered-not-executed' },
		pages,
		problemTypes,
		source: {
			commitDate: git.commitDate,
			documentationRoots: docsRoots.map(({ kind, relativePath }) => ({ kind, path: relativePath })),
			repository: git.repository,
			revision: git.revision,
			system: 'docusaurus',
		},
		summary: {
			findings: findings.length,
			findingsByClassification: classifyCounts(findings, (finding) => finding.classification),
			pages: pages.length,
			pagesByClassification: classifyCounts(pages, (page) => page.classification),
			pagesWithFindings: pages.filter((page) => page.findings.length > 0).length,
			problemTypes: problemTypes.length,
		},
	};
};

const codeMark = String.fromCharCode(96);
const problemPageId = (problem) => problem.id.toLowerCase();
const problemDescription = (problem) => String(problem.message)
	.replace(/[\r\n:|]/g, ' ')
	.replace(/\.+$/, '')
	.trim();
const sourceLink = (report, occurrence) => report.source.repository && report.source.revision
	? report.source.repository + '/blob/' + report.source.revision + '/' + occurrence.sourceFile + '#L' + occurrence.line
	: null;

const renderReportHome = (report) => {
	const sourceLabel = report.source.repository ? '[' + report.source.repository + '](' + report.source.repository + ')' : 'No public repository was detected.';
	const revision = report.source.revision ? '\n\nSource revision: ' + codeMark + report.source.revision + codeMark + '.' : '';
	const problemRows = report.problemTypes.map((problem) => (
		'| [' + problem.id + '](problems/' + problemPageId(problem) + '/) | ' + problemDescription(problem) + ' | ' + problem.occurrences + ' | ' + problem.classification + ' |'
	)).join('\n');
	return '---\npage:\n  description: Read-only Docusaurus migration audit generated by Norna.\n---\n\n'
		+ '# Docusaurus migration audit\n\n'
		+ 'This report inspects Docusaurus source without installing dependencies or executing MDX, React components, plugins, configuration, or the source website. It reports only pages and constructs that need a migration decision.\n\n'
		+ '## Summary\n\n| Measure | Value |\n| --- | ---: |\n'
		+ '| Source pages | ' + report.summary.pages + ' |\n'
		+ '| Pages requiring attention | ' + report.summary.pagesWithFindings + ' |\n'
		+ '| Findings | ' + report.summary.findings + ' |\n'
		+ '| Problem types | ' + report.summary.problemTypes + ' |\n'
		+ '| Adapter version | ' + report.analysis.adapterVersion + ' |\n'
		+ '| Norna version | ' + report.analysis.nornaVersion + ' |\n\n'
		+ '## Source and provenance\n\nSource system: **Docusaurus**.\n\nRepository: ' + sourceLabel + '.' + revision + '\n\n'
		+ 'The report was generated at ' + report.analysis.analyzedAt + '. A public documentation URL is not guessed; each finding links to the exact Git revision when one is available.\n\n'
		+ 'Documentation roots: ' + report.source.documentationRoots.map((root) => codeMark + root.path + codeMark + ' (' + root.kind + ')').join(', ') + '.\n\n'
		+ 'Navigation files were discovered but not executed: ' + (report.navigation.files.length ? report.navigation.files.map((file) => codeMark + file + codeMark).join(', ') : 'none detected') + '.\n\n'
		+ '## Classification\n\n'
		+ '- **copy**: ordinary Markdown or GFM can be used without syntactic conversion.\n'
		+ '- **rewrite**: a deterministic Norna conversion is available.\n'
		+ '- **assist**: a useful conversion is possible but needs review.\n'
		+ '- **model-gap**: the source uses a data model Norna does not have.\n'
		+ '- **feature-gap**: the concept fits Norna but has no corresponding capability.\n'
		+ '- **unresolved**: the audit cannot determine a safe conversion.\n'
		+ '- **out-of-scope**: source build or application code, not page content.\n\n'
		+ '## Problem types\n\nThe report groups repeated findings by a stable problem ID. Each problem page contains at most 20 deterministic representative occurrences; the JSON report retains every occurrence.\n\n'
		+ '| Problem ID | Description | Occurrences | Classification |\n| --- | --- | ---: | --- |\n'
		+ (problemRows || '| None | No findings | 0 | copy |') + '\n';
};

const renderProblemPage = (report, problem) => {
	const rows = problem.sample.map((occurrence) => {
		const link = sourceLink(report, occurrence);
		return '| ' + occurrence.pageTitle.replaceAll('|', '\\|') + ' | ' + codeMark + occurrence.sourceFile + codeMark + ' | ' + occurrence.line + ' | ' + (link ? '[Open source](' + link + ')' : 'Unavailable') + ' |';
	}).join('\n');
	return '---\npage:\n  description: ' + problemDescription(problem) + '.\n---\n\n'
		+ '# ' + problem.id + '\n\n'
		+ problem.message + '\n\n'
		+ 'Classification: **' + problem.classification + '**. Occurrences: **' + problem.occurrences + '**.\n\n'
		+ 'Problem fingerprint: ' + codeMark + problem.fingerprint + codeMark + '.\n\n'
		+ '## Recommended follow-up\n\n' + problem.action + '\n\n'
		+ '## Representative occurrences\n\n'
		+ '| Page | Source file | Line | Source |\n| --- | --- | ---: | --- |\n'
		+ (rows || '| None | None | 0 | Unavailable |') + '\n';
};

export const writeMigrationReport = async (report, reportDir, { sourceRoot = null } = {}) => {
	const resolvedReportDir = path.resolve(reportDir);
	if (sourceRoot && (isWithin(path.resolve(sourceRoot), resolvedReportDir) || isWithin(resolvedReportDir, path.resolve(sourceRoot)))) {
		throw new Error('The migration report directory must be separate from the Docusaurus project root.');
	}
	if (await isDirectory(resolvedReportDir)) {
		const entries = await readdir(resolvedReportDir);
		if (entries.length > 0) throw new Error('Migration report directory must be empty: ' + resolvedReportDir);
	} else await mkdir(resolvedReportDir, { recursive: true });
	await mkdir(path.join(resolvedReportDir, 'pages', '000-home'), { recursive: true });
	await writeFile(path.join(resolvedReportDir, 'config.yaml'), 'url: https://example.invalid/\n');
	await writeFile(path.join(resolvedReportDir, 'theme.yaml'), 'preset: documentation\n');
	await writeFile(path.join(resolvedReportDir, 'pages', '000-home', 'content.md'), renderReportHome(report));
	if (report.problemTypes.length > 0) {
		const categoryDir = path.join(resolvedReportDir, 'pages', '010-problems');
		await mkdir(path.join(categoryDir, 'pages'), { recursive: true });
		await writeFile(path.join(categoryDir, 'category.yaml'), 'label: Problems\n');
		for (const [index, problem] of report.problemTypes.entries()) {
			const pageDir = path.join(categoryDir, 'pages', String((index + 1) * 10).padStart(3, '0') + '-' + problemPageId(problem));
			await mkdir(pageDir, { recursive: true });
			await writeFile(path.join(pageDir, 'content.md'), renderProblemPage(report, problem));
		}
	}
	await writeFile(path.join(resolvedReportDir, 'migration-report.json'), JSON.stringify(report, null, 2) + '\n');
	return resolvedReportDir;
};
