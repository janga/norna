import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import yaml from 'js-yaml';
import { markdownToMdast } from 'satteri';
import { configSchema, siteSchema, sitewideSchema, themeVisualSchema } from './lib/schema-definitions.mjs';
import { parseContentTabs } from './lib/content-tabs.mjs';
import { readImageDimensions } from './lib/image-dimensions.mjs';
import {
	extractInlineNoteDiagnostics,
	extractNornaMarkdownBlockDiagnostics,
} from './lib/norna-markdown-blocks.mjs';
import { parsePageMarkdownSource } from './lib/page-markdown.mjs';
import { getSemanticCalloutDiagnostics } from './lib/semantic-callouts.mjs';
import { renderThemePresetComparison } from './build-theme-preset-comparison.mjs';
import {
	getExampleRelativePublicPath,
	getExampleSites,
	getUnlinkedExampleSites,
} from './lib/example-sites.mjs';
import { presentationPaletteNames } from './lib/presentation-palette-metadata.mjs';
import projectConfig from './lib/project-config.mjs';
import { themePresetNames, themePresets } from './lib/theme-presets.mjs';
import { localeDefinitions } from './lib/locale-registry.mjs';
import documentationRoutes from './lib/documentation-routes.json' with { type: 'json' };
import * as documentationLinks from './lib/documentation-links.mjs';

const repoRoot = path.resolve(import.meta.dirname, '..');
const obsoleteSourceReferences = [
	'site/content.md',
	'site/images/',
	'site/config.md',
	'site/theme.md',
	'site/sitewide-content.md',
	'site/routes/',
	'route-content.md',
	'docs/routes.md',
	'docs/site-structure.md',
];
const obsoleteSiteFilenames = new Set([
	'config.md',
	'theme.md',
	'sitewide-content.md',
	'route-content.md',
]);
const ignoredSiteDirectories = new Set(['.astro', '.norna', 'dist', 'node_modules']);
const obsoleteReferenceDocumentation = new Set([
	path.join(repoRoot, 'site/pages/032-reference/pages/060-workflows/pages/050-legacy-source/content.md'),
]);

const collectMarkdownFiles = async (directory) => {
	const files = [];
	for (const entry of await readdir(directory, { withFileTypes: true })) {
		const entryPath = path.join(directory, entry.name);
		if (entry.isDirectory()) {
			files.push(...await collectMarkdownFiles(entryPath));
		} else if (entry.name.endsWith('.md')) {
			files.push(entryPath);
		}
	}
	return files;
};

const collectFiles = async (directory) => {
	const files = [];
	for (const entry of await readdir(directory, { withFileTypes: true })) {
		const entryPath = path.join(directory, entry.name);
		if (entry.isDirectory()) {
			if (ignoredSiteDirectories.has(entry.name)) continue;
			files.push(...await collectFiles(entryPath));
		} else {
			files.push(entryPath);
		}
	}
	return files;
};

const checkLocalMarkdownLinks = async () => {
	const markdownFiles = [
		path.join(repoRoot, 'README.md'),
		...await collectMarkdownFiles(path.join(repoRoot, 'docs')),
		...await collectMarkdownFiles(path.join(repoRoot, 'examples')),
	];
	const missing = [];

	for (const markdownPath of markdownFiles) {
		const source = await readFile(markdownPath, 'utf8');
		const prose = source
			.replace(/(```+|~~~+)[\s\S]*?\1/g, '')
			.replace(/`[^`\n]*`/g, '');
		for (const match of prose.matchAll(/!?\[[^\]]*\]\(([^)]+)\)/g)) {
			const target = match[1].trim().replace(/^<|>$/g, '');
			if (/^(?:[a-z]+:|#|\/)/i.test(target)) continue;

			const targetPath = decodeURIComponent(target.split('#', 1)[0].split('?', 1)[0]);
			if (!targetPath) continue;
			const resolved = path.resolve(path.dirname(markdownPath), targetPath);
			if (!existsSync(resolved)) {
				missing.push(`${path.relative(repoRoot, markdownPath)} -> ${target}`);
			}
		}
	}

	assert.deepEqual(missing, [], `Broken local Markdown links:\n${missing.join('\n')}`);
};

const checkObsoleteDocumentationReferences = async () => {
	const markdownFiles = [
		path.join(repoRoot, 'README.md'),
		...await collectMarkdownFiles(path.join(repoRoot, 'docs')),
		...await collectMarkdownFiles(path.join(repoRoot, 'examples')),
		...await collectMarkdownFiles(path.join(repoRoot, 'starters')),
	];
	const obsolete = [];

	for (const markdownPath of markdownFiles) {
		if (obsoleteReferenceDocumentation.has(markdownPath)) continue;
		const source = await readFile(markdownPath, 'utf8');
		for (const reference of obsoleteSourceReferences) {
			const escaped = reference.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
			if (new RegExp(`(?<![\\w/.-])${escaped}`).test(source)) {
				obsolete.push(`${path.relative(repoRoot, markdownPath)} -> ${reference}`);
			}
		}
	}

	assert.deepEqual(obsolete, [], `Obsolete Norna source references:\n${obsolete.join('\n')}`);
};

const checkObsoleteSiteFiles = async () => {
	const siteRoots = [
		path.join(repoRoot, 'site'),
		path.join(repoRoot, 'starters'),
		path.join(repoRoot, 'examples'),
		path.join(repoRoot, 'fixtures'),
	];
	const files = (await Promise.all(siteRoots.map(collectFiles))).flat();
	const obsolete = files
		.filter((filePath) => (
			obsoleteSiteFilenames.has(path.basename(filePath))
			|| filePath.split(path.sep).includes('routes')
		))
		.map((filePath) => path.relative(repoRoot, filePath));

	assert.deepEqual(obsolete, [], `Obsolete Norna site files:\n${obsolete.join('\n')}`);
};

const checkDocumentedContentSyntax = async () => {
	const documentationFiles = (await readdir(path.join(repoRoot, 'docs')))
		.filter((name) => name.endsWith('.md'))
		.map((name) => path.join(repoRoot, 'docs', name));
	documentationFiles.push(path.join(repoRoot, 'docs', 'design', 'norna-diagram-design.md'));
	const siteFiles = await collectMarkdownFiles(path.join(repoRoot, 'site', 'pages'));
	let blockCount = 0;

	const checkMarkdown = (source, label) => {
		const blocks = extractNornaMarkdownBlockDiagnostics(source, { label });
		const tabs = parseContentTabs(source, { label });
		const notes = extractInlineNoteDiagnostics(source, { label, tabResult: tabs });
		const tree = markdownToMdast(source);
		const errors = [
			...blocks.errors,
			...tabs.diagnostics,
			...notes.errors,
			...getSemanticCalloutDiagnostics(tree, { label }),
		].filter((issue) => issue.severity !== 'warning');
		assert.deepEqual(errors, [], `${label}: invalid documented content syntax.`);
		blockCount += blocks.blocks.length;

		const visit = (node) => {
			if (node.type === 'code' && ['md', 'markdown', null].includes(node.lang)) {
				checkMarkdown(node.value, `${label}, sample at line ${node.position.start.line}`);
			}
			for (const child of node.children ?? []) visit(child);
		};
		visit(tree);
	};

	for (const filePath of [...documentationFiles, ...siteFiles]) {
		checkMarkdown(await readFile(filePath, 'utf8'), path.relative(repoRoot, filePath));
	}
	assert.ok(blockCount > 0, 'Documentation must exercise structured content blocks.');

	for (const filePath of siteFiles.filter((filePath) => path.basename(filePath) === 'content.md')) {
		const model = await parsePageMarkdownSource(await readFile(filePath, 'utf8'));
		assert.deepEqual(model.diagnostics.filter((issue) => issue.severity === 'error'), [],
			`${path.relative(repoRoot, filePath)} must remain a valid maintained page.`);
		for (const image of model.regions.flatMap((region) => region.managedImages)) {
			const imagePath = path.join(path.dirname(filePath), 'images', image.image);
			assert.ok(existsSync(imagePath), `Missing documentation image: ${path.relative(repoRoot, imagePath)}`);
			const dimensions = await readImageDimensions(imagePath);
			assert.ok(dimensions?.width > 0 && dimensions?.height > 0,
				`Documentation image must have intrinsic dimensions: ${path.relative(repoRoot, imagePath)}`);
		}
	}
};

const checkSinglePageDiagramSource = async () => {
	const directory = path.join(repoRoot, 'site', 'pages', '020-getting-started', 'pages', '020-grow-your-site');
	const model = await parsePageMarkdownSource(await readFile(path.join(directory, 'content.md'), 'utf8'));
	const section = model.sections.find((section) => section.id === 'single-page-site');
	const tree = markdownToMdast(section.bodyMarkdown);
	const sample = tree.children.find((node) => node.type === 'code' && node.lang === 'md');
	assert.ok(sample, 'The single-page diagram needs its corresponding Markdown sample.');
	const blocks = markdownToMdast(sample.value).children.filter((node) => node.type === 'code' && node.lang === 'image-stack');
	assert.equal(blocks.length, 2, 'The single-page diagram demonstrates two image stacks.');
	const diagram = await readFile(path.join(directory, 'images', 'single-page-site.svg'), 'utf8');
	for (const block of blocks) {
		const lines = ['```image-stack', ...block.value.split('\n').map((line) => line.trim()), '```'];
		const pattern = lines.map((line) => (
			`<text class="code" [^>]*>${line.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}</text>`
		)).join('\\s*');
		assert.match(diagram, new RegExp(pattern), 'SVG image-block text must match the guide\'s YAML example in order.');
	}
};

const checkEditorFormattingGuidance = async () => {
	for (const relativePath of [
		'site/pages/032-reference/pages/060-workflows/pages/010-editor/content.md',
		'site/pages/035-faq/pages/030-content-and-images/content.md',
	]) {
		const source = await readFile(path.join(repoRoot, relativePath), 'utf8');
		const tree = markdownToMdast(source);
		const settings = tree.children.filter((node) => (
			node.type === 'code' && node.lang === 'json' && node.value.includes('editor.formatOnSave')
		));
		assert.equal(settings.length, 1, `${relativePath}: show one scoped Markdown formatting setting.`);
		assert.deepEqual(JSON.parse(settings[0].value), { '[markdown]': { 'editor.formatOnSave': false } },
			`${relativePath}: disable only Markdown format-on-save, without prescribing a formatter.`);
		const prose = source.replace(/\s+/g, ' ');
		assert.match(prose, /Norna does not (?:repair Markdown during saves|register a Markdown formatter or rewrite Markdown on save)/,
			`${relativePath}: do not promise save-time syntax repair.`);
		assert.match(prose, /(?:supported setup uses VS Code and Red Hat YAML without a Markdown formatter|verified setup uses VS Code and Red Hat YAML without automatic Markdown formatting)/);
		assert.match(prose, /(?:does not guarantee compatibility with arbitrary formatter settings|arbitrary Markdown formatters is outside the verified setup)/);
		assert.doesNotMatch(prose, /normalizes a recognized `content\.md` when it is saved/);
	}
};

const formatReaderDisplay = () => 'Reading width and Appearance always available; Focus reading when navigation resolves to tree';

const checkThemePresetReference = async () => {
	const source = await readFile(path.join(repoRoot, documentationRoutes.sources['configuration/presets/']), 'utf8');
	const palettes = await readFile(path.join(repoRoot, documentationRoutes.sources['configuration/palettes/']), 'utf8');
	assert.ok(
		palettes.includes('https://janga.github.io/norna/examples/theme-presets/'),
		'The palette reference is missing the shared theme preset comparison.',
	);

	for (const presetName of themePresetNames) {
		const heading = `## ${presetName}`;
		const start = source.indexOf(heading);
		assert.notEqual(start, -1, `The preset reference is missing ${heading}.`);
		const remainder = source.slice(start + heading.length);
		const boundary = remainder.search(/\n#{2,3} /);
		const section = source.slice(start, boundary === -1 ? undefined : start + heading.length + boundary);
		const preset = themePresets[presetName];
		const surface = preset.sections.backgroundPattern === 'uniform'
			? '`uniform`'
			: `\`${preset.sections.backgroundPattern}\`; resolves to \`uniform\` with tree navigation`;
		const rows = [
			['palette', `\`${preset.palette}\``],
			['appearance.default', `\`${preset.appearance.default}\``],
			['typography.fontFamily', `\`${preset.typography.fontFamily}\``],
			['typography.profile', `\`${preset.typography.profile}\``],
			['typography.rhythm', `\`${preset.typography.rhythm}\``],
			['layout.textWidth', `\`${preset.layout.textWidth}\``],
			['layout.contentSpacing', `\`${preset.layout.contentSpacing}\``],
			['layout.pageWidth', `\`${preset.layout.pageWidth}\``],
			['layout.gutter', `Desktop \`${preset.layout.gutter.desktop}\`; mobile \`${preset.layout.gutter.mobile}\``],
			['images.presentation', `\`${preset.images.presentation}\``],
			['images.width', `\`${preset.images.width}\``],
			['images.maxAvailableWidthPercent', `Desktop and mobile \`${preset.images.maxAvailableWidthPercent.desktop}\``],
			...(preset.images.maxAvailableHeightPercent
				? [[
					'images.maxAvailableHeightPercent',
					`Desktop \`${preset.images.maxAvailableHeightPercent.desktop}\`; mobile \`${preset.images.maxAvailableHeightPercent.mobile}\``,
				]]
				: []),
			['corners', `\`${preset.corners}\``],
			['sections.backgroundPattern', surface],
			['Reader Display', formatReaderDisplay()],
		];

		for (const [setting, value] of rows) {
			const settingLabel = setting === 'Reader Display' ? setting : `\`${setting}\``;
			const row = `| ${settingLabel} | ${value} |`;
			assert.ok(section.includes(row), `The preset reference ${presetName} reference is missing: ${row}`);
		}
		if (!preset.images.maxAvailableHeightPercent) {
			assert.doesNotMatch(
				section,
				/\| `images\.maxAvailableHeightPercent` \|/,
				`The preset reference ${presetName} should not document an inactive viewport-height limit.`,
			);
		}

		const exampleUrl = `https://janga.github.io/norna/examples/feature-demos/theme-preset-${presetName}/`;
		assert.ok(section.includes(exampleUrl), `The preset reference ${presetName} reference is missing its rendered example.`);
	}

	for (const paletteName of presentationPaletteNames) {
		assert.ok(
			palettes.includes(`| \`${paletteName}\` |`),
			`The palette reference is missing the ${paletteName} palette reference.`,
		);
	}
	assert.ok(!palettes.includes('`cool-green`'), 'The palette reference still documents the removed cool-green palette.');
};

const checkThemeExplorer = () => {
	const source = renderThemePresetComparison();
	for (const presetName of themePresetNames) {
		assert.ok(source.includes(`<option value="${presetName}">`), `Theme explorer is missing preset ${presetName}.`);
	}
	for (const paletteName of presentationPaletteNames) {
		assert.ok(source.includes(`<option value="${paletteName}">`), `Theme explorer is missing palette ${paletteName}.`);
	}
	for (const marker of [
		'data-preset-select',
		'data-palette-select',
		'data-appearance-select',
		'data-theme-config',
		'data-theme-frame',
		"const values = new URLSearchParams",
		"frameDocument.querySelectorAll('[data-reader-appearance]')",
	]) {
		assert.ok(source.includes(marker), `Theme explorer is missing: ${marker}`);
	}
	const scripts = [...source.matchAll(/<script>([\s\S]*?)<\/script>/g)];
	assert.ok(scripts.length > 0, 'Theme explorer is missing its client script.');
	assert.doesNotThrow(
		() => new Function(scripts.at(-1)[1]),
		'Theme explorer client script must be valid JavaScript.',
	);
};

const checkSitemapReference = async () => {
	const publicFiles = await readFile(path.join(repoRoot, documentationRoutes.sources['site/public-files/']), 'utf8');
	const publishing = await readFile(path.join(repoRoot, documentationRoutes.sources['workflows/publishing/']), 'utf8');

	for (const expectedText of [
		'## Generated sitemap',
		'even unlisted ones',
		'`site/.norna/public/sitemap.xml`',
		'`dist/sitemap.xml`',
	]) {
		assert.ok(publicFiles.includes(expectedText), `Public-files reference is missing: ${expectedText}`);
	}
	assert.doesNotMatch(
		publishing,
		/Site-specific public files[^.]*`sitemap\.xml` belong in the site repository/s,
		'Publishing reference still describes sitemap.xml as a site-owned source file.',
	);
};

const checkProductTour = async () => {
	const tourDirectory = path.join(repoRoot, 'site', 'pages', '010-features');
	const source = await readFile(path.join(tourDirectory, 'content.md'), 'utf8');
	const orderedSections = [
		'# What Norna Does',
		'## Write With Markdown',
		'## Let Files Become A Site',
		'## Change Structure Safely',
		'## Extend Markdown Only Where It Helps',
		'## Start With A Coherent Presentation',
		'## Keep Difficult Content Readable',
		'## Useful Before JavaScript',
		'## Build Ordinary Static Output',
	];
	let previousIndex = -1;
	for (const heading of orderedSections) {
		const index = source.indexOf(heading);
		assert.ok(index > previousIndex, `Product tour is missing or has misplaced heading: ${heading}`);
		previousIndex = index;
	}

	for (const statement of [
		'One page uses section navigation',
		'Top-level pages use top navigation',
		'Related child pages introduce a page tree',
		'There is no second sidebar file to keep synchronized',
	]) {
		assert.ok(source.includes(statement), `Product tour is missing its navigation explanation: ${statement}`);
	}

	for (const imageName of [
		'navigation-single-desktop.png',
		'navigation-top-desktop.png',
		'navigation-nested-desktop.png',
	]) {
		const image = await readFile(path.join(tourDirectory, 'images', imageName));
		assert.ok(source.includes(`image: ${imageName}`), `Product tour does not reference ${imageName}.`);
		assert.equal(image.subarray(1, 4).toString(), 'PNG', `${imageName} must be a real page capture.`);
	}
};

const checkPublishedExampleReferences = async () => {
	const documentationUrl = new URL(projectConfig.site.url);
	const exampleFiles = await collectMarkdownFiles(path.join(repoRoot, 'site', 'pages', '030-examples'));
	const documentationText = (await Promise.all(exampleFiles.map((filePath) => readFile(filePath, 'utf8')))).join('\n');
	assert.equal(exampleFiles.length, 1, 'Focused Examples documentation must remain one result-first page.');
	const examplesModel = await parsePageMarkdownSource(documentationText);
	for (const id of ['standard-markdown', 'single-image', 'image-stacks', 'image-carousels', 'card-lists', 'semantic-callouts', 'sidenotes', 'code-blocks', 'tabs', 'tables']) {
		const section = examplesModel.sections.find((section) => section.id === id);
		assert.ok(section, `Missing live/source example: ${id}`);
		const tree = await markdownToMdast(section.bodyMarkdown);
		const sourceBlock = tree.children.find((node) => node.type === 'code' && node.lang === 'md');
		assert.ok(sourceBlock, `${id} must show its Markdown source.`);
		const liveSource = section.bodyMarkdown.slice(0, sourceBlock.position.start.offset).trim();
		assert.equal(sourceBlock.value.trim(), liveSource, `${id}: shown source must exactly match the live example.`);
		if (id === 'image-carousels') {
			assert.deepEqual(section.blocks[0].images.map((image) => image.caption), [
				'First frame: a broad direction.',
				'Second frame: a closer relationship.',
				'Third frame: a denser detail.',
			], 'Quoted YAML captions must preserve the displayed text, including colons.');
		}
		if (id === 'sidenotes') {
			assert.deepEqual(section.notes.map(({ identifier, marker }) => ({ identifier, marker })), [
				{ identifier: 'margin:available-space', marker: 'a' },
			], 'The live named sidenote must use a letter without counting its source sample.');
		}
	}
	for (const [id, language, relativePath] of [
		['page-list', 'md', 'fixtures/child-page-list/site/pages/010-help-a-dog/content.md'],
		['site-wide-elements', 'yaml', 'examples/feature-demos/sitewide-content/site/sitewide-content.yaml'],
	]) {
		const section = examplesModel.sections.find((section) => section.id === id);
		assert.ok(section, `Missing source-backed example: ${id}`);
		const tree = await markdownToMdast(section.bodyMarkdown);
		const sourceBlock = tree.children.find((node) => node.type === 'code' && node.lang === language);
		assert.ok(sourceBlock, `${id} must show its source.`);
		assert.equal(sourceBlock.value.trim(), (await readFile(path.join(repoRoot, relativePath), 'utf8')).trim(),
			`${id}: displayed source differs from the maintained example ${relativePath}.`);
		if (id === 'page-list') {
			const excerpts = tree.children.filter((node) => node.type === 'code' && node.lang === 'md').slice(1);
			assert.equal(excerpts.length, 3, 'Show the metadata behind all three child-page choices.');
			for (const [index, directory] of ['010-adoption', '020-fostering', '030-sponsorship'].entries()) {
				const childPath = path.join(repoRoot, path.dirname(relativePath), 'pages', directory, 'content.md');
				const childSource = await readFile(childPath, 'utf8');
				assert.ok(childSource.startsWith(excerpts[index].value.trim()), `Child source differs: ${directory}`);
			}
		}
	}

	const orderedSections = [
		'## Add a single image',
		'## Image stacks',
		'## Image carousels',
		'## Card lists',
		'## Semantic callouts',
		'## Sidenotes',
		'## Code blocks',
		'## Get readable tables from standard Markdown',
		'## List child pages automatically',
		'## Automatic responsive navigation',
		'## Move pages without breaking links',
		'## Add static search',
		'## Set the site language',
		'## Brand your site',
		'## Add site-wide notices and a footer',
		'## Get coherent defaults from a preset',
		'## Choose a coordinated color palette',
		'## Let readers adapt the display',
		'## Write with standard Markdown',
		'## Check before publishing',
		'## Complete sites',
	];
	let previousSectionIndex = -1;
	for (const heading of orderedSections) {
		const sectionIndex = documentationText.indexOf(heading);
		assert.ok(sectionIndex > previousSectionIndex, `Examples is missing or has misplaced heading: ${heading}`);
		previousSectionIndex = sectionIndex;
	}
	assert.equal(examplesModel.sections[0]?.id, 'single-image',
		'Examples must open with a visual example rather than a publishing checklist.');
	const checksSection = examplesModel.sections.find((section) => section.id === 'source-checks');
	const checksTree = await markdownToMdast(checksSection.bodyMarkdown);
	const checkCommands = checksTree.children.filter((node) => node.type === 'code' && node.lang === 'sh')
		.flatMap((node) => node.value.split('\n').map((line) => line.trim()).filter((line) => line && !line.startsWith('#')));
	assert.deepEqual(checkCommands, ['norna check', 'norna config:check', 'norna content:check']);
	assert.ok(checksSection.bodyMarkdown.includes('npm run norna:check'), 'Checks must work without a global launcher.');
	assert.equal(checksTree.children.find((node) => node.type === 'list')?.children.length, 4,
		'Demonstrate four source mistakes beside their corrections.');
	assert.ok(!documentationText.includes('### Before publishing'), 'Do not use generic publishing advice as a Markdown example.');

	for (const requiredText of [
		'**Source:** Standard Markdown.',
		'**Source:** Norna Markdown extension.',
		'author must review it in the context where the image appears',
		'/reference/content/tables/',
		'/reference/reader/display/',
	]) {
		assert.ok(documentationText.includes(requiredText), `Examples is missing required result-first content: ${requiredText}`);
	}

	for (const imageName of [
		'child-page-list.png',
		'navigation-single-desktop.png',
		'navigation-top-desktop.png',
		'navigation-nested-desktop.png',
		'navigation-documentation-desktop.png',
	]) {
		assert.ok(
			existsSync(path.join(repoRoot, 'site', 'pages', '030-examples', 'images', imageName)),
			`Examples is missing ${imageName}.`,
		);
	}

	const documentationTree = await markdownToMdast(documentationText);
	const navigationSources = documentationTree.children.flatMap((node, index) => {
		if (node.type !== 'html') return [];
		const source = node.value.match(/^<!-- navigation-source: ([^\n]+) -->$/);
		if (!source) return [];
		const code = documentationTree.children[index + 1];
		assert.ok(code?.type === 'code' && code.lang === 'md', 'Navigation source marker must precede its Markdown example.');
		return [[source[1], code.value]];
	});
	assert.equal(navigationSources.length, 4, 'Each navigation scenario must display its maintained source.');
	for (const [relativePath, shownSource] of navigationSources) {
		assert.equal(shownSource.trim(), (await readFile(path.join(repoRoot, relativePath), 'utf8')).trim(),
			`Navigation illustration source differs from ${relativePath}. Regenerate its capture after editing.`);
	}

	const presetComparisonUrl = new URL('examples/theme-presets/', documentationUrl).href;
	assert.ok(
		documentationText.includes(presetComparisonUrl),
		`Examples documentation is missing the theme preset comparison link ${presetComparisonUrl}.`,
	);

	const examples = await getExampleSites(repoRoot);
	const unlinkedExamples = getUnlinkedExampleSites({
		documentationText,
		documentationUrl,
		examples,
		presetComparisonHtml: renderThemePresetComparison(),
	});
	assert.deepEqual(
		unlinkedExamples.map((example) => getExampleRelativePublicPath(example)),
		[],
		'Every public example must be linked from the Examples documentation or the theme comparison.',
	);
};

const checkReferenceTree = async () => {
	const referenceRoot = path.join(repoRoot, 'site/pages/032-reference');
	const files = await collectMarkdownFiles(referenceRoot);
	assert.deepEqual(files.map((file) => path.relative(repoRoot, file)).sort(),
		Object.values(documentationRoutes.sources).sort(), 'Every reference page needs a source route.');
	const models = new Map();
	let checkedYaml = 0;
	for (const [route, relativePath] of Object.entries(documentationRoutes.sources)) {
		const source = await readFile(path.join(repoRoot, relativePath), 'utf8');
		const model = await parsePageMarkdownSource(source, { label: relativePath });
		assert.equal(model.pageHeadings.length, 1, `${route}: one H1`);
		assert.deepEqual(model.diagnostics.filter((issue) => issue.severity === 'error'), [], route);
		models.set(route, model);
		const tree = markdownToMdast(source);
		for (const node of tree.children) {
			if (node.type !== 'code' || node.lang !== 'yaml') continue;
			const title = node.meta?.match(/^title="([^"\n]+)"/)?.[1] ?? '';
			const schema = /^site\/config\.yaml/.test(title) ? configSchema
				: /^(?:site\/)?theme\.yaml/.test(title) ? themeVisualSchema
					: /^site\/sitewide-content\.yaml/.test(title) ? sitewideSchema : null;
			if (!schema) continue;
			const result = schema.safeParse(yaml.load(node.value));
			assert.ok(result.success, `${route}: invalid YAML example at ${node.position.start.line}: ${JSON.stringify(result.error?.issues)}`);
			checkedYaml += 1;
		}
	}
	assert.ok(checkedYaml >= 15, 'Validate complete configuration examples across the reference.');
	for (const [legacy, target] of Object.entries(documentationRoutes.legacy)) {
		const [route, anchor] = target.split('#');
		const model = models.get(route);
		assert.ok(model, `${legacy}: missing reference page ${route}`);
		if (anchor) assert.ok(model.sections.some((section) => section.id === anchor), `${legacy}: missing anchor ${target}`);
	}
	const language = await readFile(path.join(repoRoot, documentationRoutes.sources['configuration/language/']), 'utf8');
	for (const { tag } of localeDefinitions) assert.ok(language.includes(`| \`${tag}\` |`), `Missing language ${tag}`);
	const llms = await readFile(path.join(repoRoot, 'site/public/llms.txt'), 'utf8');
	for (const source of Object.values(documentationRoutes.sources)) assert.ok(llms.includes(`/main/${source}`), `llms.txt omits ${source}`);
	for (const version of ['0.7.25', '0.7.26']) {
		const link = documentationLinks.documentationLinkForVersion(version, 'Images', 'content.md', 'image-stack');
		assert.ok(link.includes(`/blob/v${version}/docs/content.md#image-stack`), 'Older installations must keep existing tag paths.');
		assert.ok(link.includes('/reference/content/images/#image-stack'), 'Current reference stays separately identified.');
	}
	for (const version of ['0.7.27', '0.8.0', '1.0.0']) {
		const link = documentationLinks.documentationLinkForVersion(version, 'Images', 'content.md', 'image-stack');
		assert.ok(link.includes(`/blob/v${version}/${documentationRoutes.sources['content/images/']}#image-stack`));
		assert.ok(!link.includes('/docs/'), 'Future releases must use the sole authored reference source.');
	}
	const source = await readFile(path.join(repoRoot, documentationRoutes.sources['content/sidenotes/']), 'utf8');
	const renderedNotes = extractInlineNoteDiagnostics(source).notes;
	const sidenoteTree = markdownToMdast(source);
	let demonstratedNotes = 0;
	for (const node of sidenoteTree.children) {
		if (node.type !== 'code' || node.lang !== 'md') continue;
		const sample = extractInlineNoteDiagnostics(node.value);
		assert.deepEqual(sample.diagnostics, []);
		for (const note of sample.notes) {
			assert.equal(renderedNotes.find((actual) => actual.identifier === note.identifier)?.markdown, note.markdown,
				'The approved sidenote example must match its live note.');
			demonstratedNotes += 1;
		}
		for (const paragraph of markdownToMdast(node.value).children.filter((entry) => entry.type === 'paragraph')) {
			const text = node.value.slice(paragraph.position.start.offset, paragraph.position.end.offset);
			assert.ok(sidenoteTree.children.some((entry) => entry.type === 'paragraph'
				&& source.slice(entry.position.start.offset, entry.position.end.offset) === text),
			'The displayed sidenote paragraph must match the rendered example.');
		}
	}
	assert.equal(demonstratedNotes, 3, 'Preserve the approved one-note and two-note examples.');
};

await checkReferenceTree();
await checkLocalMarkdownLinks();
await checkObsoleteDocumentationReferences();
await checkObsoleteSiteFiles();
await checkDocumentedContentSyntax();
await checkSinglePageDiagramSource();
await checkEditorFormattingGuidance();
await checkThemePresetReference();
await checkSitemapReference();
await checkProductTour();
await checkPublishedExampleReferences();
checkThemeExplorer();

const llms = await readFile(path.join(repoRoot, 'site', 'public', 'llms.txt'), 'utf8');
for (const match of llms.matchAll(/https:\/\/raw\.githubusercontent\.com\/janga\/norna\/main\/([^\s)]+)/g)) {
	assert.ok(existsSync(path.join(repoRoot, decodeURIComponent(match[1]))), `llms.txt target is missing: ${match[1]}`);
}

console.log('ok - documentation links, content syntax, source snippets, images, preset defaults, and llms.txt targets resolve');
