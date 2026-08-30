import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import projectContext from '../editors/vscode/norna-project.cjs';
import yamlSchemaCompletions from '../editors/vscode/yaml-schema-completions.cjs';
import { documentationRef } from './lib/documentation-links.mjs';
import {
	findNornaSiteRoot,
	getImageDefinitionContext,
	getImageCompletionContext,
	getMarkdownDiagnostics,
	getNornaBlockCompletionContext,
	getNornaBlockFieldContext,
	getSitePublicAssetStatus,
	nornaBlockDefinitions,
} from './lib/editor-language-service.mjs';

const root = await mkdtemp(path.join(os.tmpdir(), 'norna-editor-language-'));
const siteRoot = path.join(root, 'site');
const homeContentPath = path.join(siteRoot, 'pages', '000-home', 'content.md');
const pageContentPath = path.join(siteRoot, 'pages', '010-about', 'content.md');
const pageThemePath = path.join(siteRoot, 'pages', '010-about', 'theme.yaml');
const categoryPath = path.join(siteRoot, 'pages', '020-guides', 'category.yaml');
const nestedPageContentPath = path.join(siteRoot, 'pages', '010-about', 'pages', '020-team', 'content.md');
const nestedPageThemePath = path.join(siteRoot, 'pages', '010-about', 'pages', '020-team', 'theme.yaml');
const installedNornaRoot = path.join(root, 'node_modules', '@janga', 'norna');
const packageManifestPath = path.join(installedNornaRoot, 'schemas', 'manifest.json');
const {
	getNornaDocumentContext,
	getNornaProjectContext,
	supportedEditorApiVersion,
	supportedSchemaVersion,
} = projectContext;
const { getYamlSchemaSnippetCompletions } = yamlSchemaCompletions;

const homeSource = `---
page:
  description: Exercises project-local image discovery.
---

# Editor fixture

## Intro {#intro}

Text with a missing note {note-ref}.

\`\`\`norna-image-stack
- image: local.jpg
- image: portrait.jpg
\`\`\`
`;
const pageSource = `---
page:
  description: About this fixture.
---

# About

## Team {#team}

Page content.
`;

try {
	await mkdir(path.join(installedNornaRoot, 'schemas'), { recursive: true });
	await mkdir(path.join(siteRoot, 'pages', '000-home', 'images'), { recursive: true });
	await mkdir(path.join(siteRoot, 'pages', '010-about', 'images'), { recursive: true });
	await mkdir(path.dirname(nestedPageContentPath), { recursive: true });
	await mkdir(path.join(siteRoot, 'public'), { recursive: true });
	await writeFile(path.join(root, 'package.json'), JSON.stringify({ name: 'editor-fixture', version: '1.0.0' }));
	await writeFile(path.join(installedNornaRoot, 'package.json'), JSON.stringify({ name: '@janga/norna', version: '9.8.7' }));
	await writeFile(packageManifestPath, JSON.stringify({
		editorApiVersion: supportedEditorApiVersion,
		files: {
			category: 'category.schema.json',
			config: 'config.schema.json',
			contentFrontmatter: 'content-frontmatter.schema.json',
			pageTheme: 'page-theme.schema.json',
			sitewideContent: 'sitewide-content.schema.json',
			theme: 'theme.schema.json',
		},
		schemaVersion: supportedSchemaVersion,
	}));
	await writeFile(path.join(siteRoot, 'config.yaml'), 'url: https://example.com/\n');
	await writeFile(path.join(siteRoot, 'theme.yaml'), 'preset: project\n');
	await writeFile(path.join(siteRoot, 'sitewide-content.yaml'), `logo:
  height: 2rem
`);
	await writeFile(path.join(siteRoot, 'pages', '000-home', 'images', 'local.jpg'), 'local');
	await writeFile(path.join(siteRoot, 'pages', '010-about', 'images', 'portrait.jpg'), 'portrait');
	await writeFile(path.join(siteRoot, 'public', 'logo.svg'), '<svg/>');
	await writeFile(path.join(siteRoot, 'public', 'logo.png'), 'logo');
	await writeFile(path.join(siteRoot, 'public', 'favicon.svg'), '<svg/>');
	await writeFile(path.join(siteRoot, 'public', 'Logo.JPG'), 'wrong case');
	await writeFile(path.join(siteRoot, 'public', 'favion.ico'), 'typo');
	await writeFile(path.join(siteRoot, 'public', 'favicon-32x32.png'), 'unrecognized');
	await writeFile(homeContentPath, homeSource);
	await writeFile(pageContentPath, pageSource);
	await writeFile(pageThemePath, 'layout:\n  textWidth: wide\n');
	await mkdir(path.dirname(categoryPath), { recursive: true });
	await writeFile(categoryPath, 'label: Guides\n');
	await writeFile(nestedPageContentPath, pageSource.replace('# About', '# Team'));
	await writeFile(nestedPageThemePath, 'layout:\n  contentSpacing: compact\n');

	assert.equal(await findNornaSiteRoot(homeContentPath), siteRoot);
	assert.equal(getNornaDocumentContext(homeContentPath).schemaKind, 'contentFrontmatter');
	assert.equal(getNornaDocumentContext(homeContentPath).pageDirectory, '000-home');
	assert.equal(getNornaDocumentContext(homeContentPath).nornaPackage.root, installedNornaRoot);
	assert.equal(getNornaDocumentContext(path.join(siteRoot, 'config.yaml')).schemaKind, 'config');
	assert.equal(getNornaDocumentContext(path.join(siteRoot, 'theme.yaml')).schemaKind, 'theme');
	assert.equal(getNornaDocumentContext(path.join(siteRoot, 'sitewide-content.yaml')).schemaKind, 'sitewideContent');
	assert.equal(getNornaDocumentContext(pageContentPath).pageDirectory, '010-about');
	assert.equal(getNornaDocumentContext(pageThemePath).schemaKind, 'pageTheme');
	assert.equal(getNornaDocumentContext(categoryPath).schemaKind, 'category');
	assert.equal(getNornaDocumentContext(nestedPageContentPath).pageDirectory, '010-about/pages/020-team');
	assert.equal(getNornaDocumentContext(nestedPageContentPath).schemaKind, 'contentFrontmatter');
	assert.equal(getNornaDocumentContext(nestedPageThemePath).schemaKind, 'pageTheme');
	assert.equal(getNornaProjectContext(path.join(siteRoot, 'public', 'logo.svg')).siteRoot, siteRoot);
	assert.equal(getNornaDocumentContext(path.join(siteRoot, 'public', 'logo.svg')), null);
	assert.equal(getNornaDocumentContext(path.join(root, 'README.md')), null);
	assert.equal(getNornaDocumentContext(path.join(root, 'docs', 'content.md')), null);
	await mkdir(path.join(siteRoot, 'pages', 'about'), { recursive: true });
	await writeFile(path.join(siteRoot, 'pages', 'about', 'content.md'), pageSource);
	assert.equal(getNornaDocumentContext(path.join(siteRoot, 'pages', 'about', 'content.md')), null);
	assert.equal(getNornaDocumentContext(path.join(siteRoot, 'pages', '000-home', 'pages', '010-news', 'content.md')), null);
	await mkdir(path.join(siteRoot, 'pages', '010-about', 'nested'), { recursive: true });
	await writeFile(path.join(siteRoot, 'pages', '010-about', 'nested', 'content.md'), pageSource);
	assert.equal(getNornaDocumentContext(path.join(siteRoot, 'pages', '010-about', 'nested', 'content.md')), null);

	const compatibleManifest = await readFile(packageManifestPath, 'utf8');
	await writeFile(packageManifestPath, JSON.stringify({
		...JSON.parse(compatibleManifest),
		editorApiVersion: supportedEditorApiVersion + 1,
	}));
	assert.equal(getNornaDocumentContext(homeContentPath).schemaCompatible, true);
	assert.equal(getNornaDocumentContext(homeContentPath).editorCompatible, false);
	await writeFile(packageManifestPath, JSON.stringify({
		...JSON.parse(compatibleManifest),
		schemaVersion: supportedSchemaVersion + 1,
	}));
	assert.equal(getNornaDocumentContext(homeContentPath).schemaCompatible, false);
	await writeFile(packageManifestPath, compatibleManifest);

	const sitewideSchema = JSON.parse(await readFile(path.join(process.cwd(), 'schemas', 'sitewide-content.schema.json'), 'utf8'));
	const bannerSource = 'banners:\n  - ';
	const bannerSnippets = getYamlSchemaSnippetCompletions({
		lineText: '  - ',
		offset: bannerSource.length,
		schema: sitewideSchema,
		source: bannerSource,
	});
	assert.equal(bannerSnippets.length, 1);
	assert.equal(bannerSnippets[0].label, 'Norna: Warning banner');
	assert.equal(bannerSnippets[0].text, `  - id: \${1:project-status}
    tone: warning
    title: \${2:Important notice}
    text: \${3:Brief explanation.}`);
	assert.deepEqual(getYamlSchemaSnippetCompletions({
		lineText: '  - id: existing',
		offset: bannerSource.length,
		schema: sitewideSchema,
		source: bannerSource,
	}), []);
	const unrelatedSequence = 'other:\n  - ';
	assert.deepEqual(getYamlSchemaSnippetCompletions({
		lineText: '  - ',
		offset: unrelatedSequence.length,
		schema: sitewideSchema,
		source: unrelatedSequence,
	}), []);
	const themeSchema = JSON.parse(await readFile(path.join(process.cwd(), 'schemas', 'theme.schema.json'), 'utf8'));
	const gutterSource = 'layout:\n  gutter: ';
	const gutterSnippets = getYamlSchemaSnippetCompletions({
		lineText: '  gutter: ',
		offset: gutterSource.length,
		schema: themeSchema,
		source: gutterSource,
	});
	assert.equal(gutterSnippets[0].label, 'Norna: Responsive page gutter');
	assert.equal(gutterSnippets[0].text, `  gutter:
    desktop: \${1:clamp(1.25rem, 4vw, 3rem)}
    mobile: \${2:1rem}`);
	const typographySource = 'typography:\n  overrides: ';
	const typographySnippets = getYamlSchemaSnippetCompletions({
		lineText: '  overrides: ',
		offset: typographySource.length,
		schema: themeSchema,
		source: typographySource,
	});
	assert.equal(typographySnippets[0].label, 'Norna: Typography overrides');
	assert.match(typographySnippets[0].text, /headings:\n      h2:/);
	const readerControlsSource = 'readerControls: ';
	const readerControlSnippets = getYamlSchemaSnippetCompletions({
		lineText: 'readerControls: ',
		offset: readerControlsSource.length,
		schema: themeSchema,
		source: readerControlsSource,
	});
	assert.equal(readerControlSnippets[0].label, 'Norna: Configure the Display panel');
	assert.match(readerControlSnippets[0].text, /colorMode: \$\{1:true\}/);
	const buildInfoSource = 'footer:\n  buildInfo: ';
	const buildInfoSnippets = getYamlSchemaSnippetCompletions({
		lineText: '  buildInfo: ',
		offset: buildInfoSource.length,
		schema: sitewideSchema,
		source: buildInfoSource,
	});
	assert.deepEqual(buildInfoSnippets, []);

	const publicAssetStatus = await getSitePublicAssetStatus(homeContentPath);
	assert.deepEqual(publicAssetStatus.logos, ['logo.png', 'logo.svg']);
	assert.deepEqual(publicAssetStatus.browserIcons, ['favicon.svg']);
	assert.equal(publicAssetStatus.issues.filter(({ code }) => code === 'multiple-logo-files').length, 2);
	assert.ok(publicAssetStatus.issues.some(({ code }) => code === 'possible-favicon-typo'));
	assert.ok(publicAssetStatus.issues.some(({ code }) => code === 'unrecognized-favicon-file'));
	assert.ok(publicAssetStatus.issues.some(({ code, filename }) => code === 'public-asset-case' && filename === 'Logo.JPG'));
	await rm(path.join(siteRoot, 'public', 'logo.svg'), { force: true });
	await rm(path.join(siteRoot, 'public', 'logo.png'), { force: true });
	const missingLogoStatus = await getSitePublicAssetStatus(homeContentPath);
	assert.ok(missingLogoStatus.issues.some(({ code, line }) => code === 'missing-logo-file' && line === 1));
	assert.equal(nornaBlockDefinitions['norna-image-stack'].description.includes('vertical stack'), true);
	assert.match(
		nornaBlockDefinitions['norna-image-stack'].documentation,
		new RegExp(`/blob/${documentationRef.replaceAll('.', '\\.')}\/docs/content\\.md#image-stack`),
	);
	assert.match(nornaBlockDefinitions['norna-image-carousel'].documentation, /docs\/content\.md#image-carousel/);
	assert.match(nornaBlockDefinitions['norna-card-list'].documentation, /docs\/content\.md#card-list/);
	assert.equal(nornaBlockDefinitions['norna-card-list'].options.layout.default, 'image-top');

	const stackFieldSource = homeSource.replace('- image: portrait.jpg', '- image: portrait.jpg\n  ');
	const stackFieldLine = stackFieldSource.split('\n').findIndex((line) => line === '  ');
	const stackFieldCompletion = getNornaBlockCompletionContext({ source: stackFieldSource, line: stackFieldLine });
	assert.deepEqual(stackFieldCompletion.candidates.map(({ key }) => key), ['alt', 'caption']);

	const cardValueSource = `${homeSource}\n\`\`\`norna-card-list\nlayout: \n\`\`\`\n`;
	const cardValueLine = cardValueSource.split('\n').findIndex((line) => line === 'layout: ');
	const cardValueCompletion = getNornaBlockCompletionContext({ source: cardValueSource, line: cardValueLine });
	assert.equal(cardValueCompletion.mode, 'value');
	assert.deepEqual(cardValueCompletion.candidates.map(({ label }) => label), ['image-top', 'image-left', 'image-right']);
	assert.equal(
		getNornaBlockFieldContext({ source: cardValueSource, line: cardValueLine }).field.default,
		'image-top',
	);

	const completionSource = homeSource.replace('- image: portrait.jpg', '- image: ');
	const completionLine = completionSource.split('\n').findIndex((line) => line === '- image: ');
	const completion = await getImageCompletionContext({
		documentPath: homeContentPath,
		line: completionLine,
		source: completionSource,
	});
	assert.ok(completion);
	assert.deepEqual(
		completion.candidates.map(({ filename, isExpected }) => [filename, isExpected]),
		[['local.jpg', true], ['portrait.jpg', false]],
	);
	const localDefinitionLine = homeSource.split('\n').findIndex((line) => line === '- image: local.jpg');
	const localDefinition = await getImageDefinitionContext({
		documentPath: homeContentPath,
		line: localDefinitionLine,
		source: homeSource,
	});
	assert.deepEqual(localDefinition.files, [path.join(siteRoot, 'pages', '000-home', 'images', 'local.jpg')]);

	const diagnostics = await getMarkdownDiagnostics({ documentPath: homeContentPath, source: homeSource });
	assert.ok(diagnostics.some(({ code, message }) => code === 'image-needs-sync' && message.includes('Run "norna content:sync"')));
	assert.ok(diagnostics.some(({ message }) => message.includes('has no following "{note: ...}"')));
	const missingIdDiagnostics = await getMarkdownDiagnostics({
		documentPath: homeContentPath,
		source: homeSource.replace('## Intro {#intro}', '## Intro'),
	});
	assert.equal(missingIdDiagnostics.some(({ code }) => code === 'missing-section-id'), false);
	const duplicateIdDiagnostics = await getMarkdownDiagnostics({
		documentPath: homeContentPath,
		source: homeSource.replace('## Intro {#intro}', '## Intro\n\n### Intro'),
	});
	assert.ok(duplicateIdDiagnostics.some(({ code }) => code === 'duplicate-heading-id'));
	const missingTitleDiagnostics = await getMarkdownDiagnostics({
		documentPath: homeContentPath,
		source: homeSource.replace('# Editor fixture', '## Editor fixture {#editor-fixture}'),
	});
	assert.ok(missingTitleDiagnostics.some(({ code }) => code === 'missing-page-title'));
	const codeHeadingDiagnostics = await getMarkdownDiagnostics({
		documentPath: homeContentPath,
		source: `${homeSource}\n\`\`\`md\n# Example title\n## Example section\n\`\`\`\n`,
	});
	assert.equal(codeHeadingDiagnostics.some(({ code }) => code === 'duplicate-page-title'), false);
	assert.equal(codeHeadingDiagnostics.some(({ code }) => code === 'duplicate-heading-id'), false);
	const unclosedBlockDiagnostics = await getMarkdownDiagnostics({
		documentPath: homeContentPath,
		source: homeSource.replace(/\n```\n$/, '\n'),
	});
	assert.ok(unclosedBlockDiagnostics.some(({ code }) => code === 'unclosed-norna-block'));
	const markdownImageDiagnostics = await getMarkdownDiagnostics({
		documentPath: homeContentPath,
		source: homeSource.replace('Text with a missing note {note-ref}.', '![Portrait](portrait.jpg)'),
	});
	assert.ok(markdownImageDiagnostics.some(({ code }) => code === 'local-markdown-image'));

	await writeFile(pageContentPath, pageSource.replace('Page content.', `\`\`\`norna-image-stack
- image: portrait.jpg
\`\`\``));
	const sharedDiagnostics = await getMarkdownDiagnostics({ documentPath: homeContentPath, source: homeSource });
	assert.ok(sharedDiagnostics.some(({ message }) => message.includes('is still referenced by')));

	await mkdir(path.join(siteRoot, 'pages', '020-contact', 'images'), { recursive: true });
	await writeFile(path.join(siteRoot, 'pages', '020-contact', 'images', 'portrait.jpg'), 'duplicate');
	const ambiguousDiagnostics = await getMarkdownDiagnostics({ documentPath: homeContentPath, source: homeSource });
	assert.ok(ambiguousDiagnostics.some(({ message }) => message.includes('is ambiguous')));

	const missingSource = homeSource.replace('portrait.jpg', 'missing.jpg');
	const missingDiagnostics = await getMarkdownDiagnostics({ documentPath: homeContentPath, source: missingSource });
	assert.ok(missingDiagnostics.some(({ message }) => message.includes('was not found')));

	console.log('Editor language service tests passed.');
} finally {
	await rm(root, { recursive: true, force: true });
}
