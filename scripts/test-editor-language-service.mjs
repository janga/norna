import assert from 'node:assert/strict';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
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
const homeContentPath = path.join(siteRoot, 'content.md');
const routeContentPath = path.join(siteRoot, 'routes', '010-about', 'content.md');

const homeSource = `---
title: Editor fixture
description: Exercises project-local image discovery.
---

## Intro {#intro}

Text with a missing note {note-ref}.

\`\`\`norna-image-stack
- image: local.jpg
- image: portrait.jpg
\`\`\`
`;
const routeSource = `---
title: About
description: About this fixture.
---

## Team {#team}

Route content.
`;

try {
	await mkdir(path.join(siteRoot, 'images', 'intro'), { recursive: true });
	await mkdir(path.join(siteRoot, 'routes', '010-about', 'images', 'team'), { recursive: true });
	await mkdir(path.join(siteRoot, 'public'), { recursive: true });
	await writeFile(path.join(siteRoot, 'config.yaml'), 'url: https://example.com/\n');
	await writeFile(path.join(siteRoot, 'sitewide-content.yaml'), `navigation:
  label: Editor fixture
  logo:
    height: 2rem
`);
	await writeFile(path.join(siteRoot, 'images', 'intro', 'local.jpg'), 'local');
	await writeFile(path.join(siteRoot, 'routes', '010-about', 'images', 'team', 'portrait.jpg'), 'portrait');
	await writeFile(path.join(siteRoot, 'public', 'logo.svg'), '<svg/>');
	await writeFile(path.join(siteRoot, 'public', 'logo.png'), 'logo');
	await writeFile(path.join(siteRoot, 'public', 'favicon.svg'), '<svg/>');
	await writeFile(path.join(siteRoot, 'public', 'Logo.JPG'), 'wrong case');
	await writeFile(path.join(siteRoot, 'public', 'favion.ico'), 'typo');
	await writeFile(path.join(siteRoot, 'public', 'favicon-32x32.png'), 'unrecognized');
	await writeFile(homeContentPath, homeSource);
	await writeFile(routeContentPath, routeSource);

	assert.equal(await findNornaSiteRoot(homeContentPath), siteRoot);
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
	assert.ok(missingLogoStatus.issues.some(({ code, line }) => code === 'missing-logo-file' && line === 3));
	assert.equal(nornaBlockDefinitions['norna-image-stack'].description.includes('vertical stack'), true);
	assert.match(
		nornaBlockDefinitions['norna-image-stack'].documentation,
		new RegExp(`/blob/${documentationRef.replaceAll('.', '\\.')}\/docs/content\\.md#norna-blocks`),
	);
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
	assert.deepEqual(localDefinition.files, [path.join(siteRoot, 'images', 'intro', 'local.jpg')]);

	const diagnostics = await getMarkdownDiagnostics({ documentPath: homeContentPath, source: homeSource });
	assert.ok(diagnostics.some(({ code, message }) => code === 'image-needs-sync' && message.includes('Run "norna content:sync"')));
	assert.ok(diagnostics.some(({ message }) => message.includes('has no following "{note: ...}"')));
	const missingIdDiagnostics = await getMarkdownDiagnostics({
		documentPath: homeContentPath,
		source: homeSource.replace('## Intro {#intro}', '## Intro'),
	});
	assert.ok(missingIdDiagnostics.some(({ code }) => code === 'missing-section-id'));
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

	await writeFile(routeContentPath, routeSource.replace('Route content.', `\`\`\`norna-image-stack
- image: portrait.jpg
\`\`\``));
	const sharedDiagnostics = await getMarkdownDiagnostics({ documentPath: homeContentPath, source: homeSource });
	assert.ok(sharedDiagnostics.some(({ message }) => message.includes('is still referenced by')));

	await mkdir(path.join(siteRoot, 'routes', '020-contact', 'images', 'people'), { recursive: true });
	await writeFile(path.join(siteRoot, 'routes', '020-contact', 'images', 'people', 'portrait.jpg'), 'duplicate');
	const ambiguousDiagnostics = await getMarkdownDiagnostics({ documentPath: homeContentPath, source: homeSource });
	assert.ok(ambiguousDiagnostics.some(({ message }) => message.includes('is ambiguous')));

	const missingSource = homeSource.replace('portrait.jpg', 'missing.jpg');
	const missingDiagnostics = await getMarkdownDiagnostics({ documentPath: homeContentPath, source: missingSource });
	assert.ok(missingDiagnostics.some(({ message }) => message.includes('was not found')));

	console.log('Editor language service tests passed.');
} finally {
	await rm(root, { recursive: true, force: true });
}
