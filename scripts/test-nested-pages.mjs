import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { access, cp, mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const repoRoot = path.resolve(import.meta.dirname, '..');
const fixtureRoot = path.join(repoRoot, 'fixtures', 'nested-pages');
const tempParent = path.join(repoRoot, 'node_modules', '.cache');
await mkdir(tempParent, { recursive: true });
const tempRoot = await mkdtemp(path.join(tempParent, 'norna-nested-pages-'));
const fixtureCopyRoot = path.join(tempRoot, 'nested-pages');
const nornaBin = path.join(repoRoot, 'bin', 'norna.mjs');
const runNorna = (siteDir, ...args) => execFileAsync(process.execPath, [
	nornaBin,
	'--site-dir',
	siteDir,
	...args,
], {
	cwd: repoRoot,
	maxBuffer: 1024 * 1024 * 10,
});
const runGit = (args) => execFileAsync('git', args, {
	cwd: fixtureCopyRoot,
	env: {
		...process.env,
		GIT_AUTHOR_NAME: 'Norna Test',
		GIT_AUTHOR_EMAIL: 'norna@example.test',
		GIT_COMMITTER_NAME: 'Norna Test',
		GIT_COMMITTER_EMAIL: 'norna@example.test',
	},
});
const fileExists = (filePath) => access(filePath).then(() => true, () => false);

try {
	await cp(fixtureRoot, fixtureCopyRoot, { recursive: true });
	const siteDir = path.join(fixtureCopyRoot, 'site');
	await runNorna(siteDir, 'content:check');
	await runNorna(siteDir, 'build');

	const distDir = path.join(fixtureCopyRoot, 'dist');
	const expectedPages = [
		'index.html',
		'guides/installation/index.html',
		'guides/installation/macos/index.html',
		'guides/workflows/index.html',
		'guides/release-notes/index.html',
		'reference/index.html',
		'reference/installation/index.html',
	];
	for (const pagePath of expectedPages) {
		assert.match(await readFile(path.join(distDir, pagePath), 'utf8'), /<main\b[^>]*id="main-content"/);
	}
	assert.equal(await fileExists(path.join(distDir, 'guides', 'index.html')), false);

	const rootHtml = await readFile(path.join(distDir, 'index.html'), 'utf8');
	const installationHtml = await readFile(path.join(distDir, 'guides', 'installation', 'index.html'), 'utf8');
	const macosHtml = await readFile(path.join(distDir, 'guides', 'installation', 'macos', 'index.html'), 'utf8');
	const referenceInstallationHtml = await readFile(
		path.join(distDir, 'reference', 'installation', 'index.html'),
		'utf8',
	);
	for (const html of [rootHtml, installationHtml, macosHtml]) {
		assert.match(html, /--palette-light-page-background: #f8f5ee/);
		assert.match(html, /--font-sans: Georgia, 'Times New Roman', serif/);
	}
	assert.match(rootHtml, /--image-width: 920px/);
	assert.match(rootHtml, /--space-section-to-section-desktop: clamp\(1\.2rem, 2\.4vw, 2\.25rem\)/);
	assert.match(rootHtml, /data-navigation-mode="tree"/);
	assert.match(rootHtml, /<p class="edit-source-link"[^>]*>[\s\S]*?href="https:\/\/github\.com\/example\/docs\/edit\/release-2\/packages\/docs\/site\/pages\/000-home\/content\.md"[\s\S]*?Edit this page/);
	assert.doesNotMatch(rootHtml, /vscode:\/\/file|\/Users\/|[A-Za-z]:%5C/);
	assert.match(rootHtml, /data-page-contents-placement="page-tree"/);
	assert.match(rootHtml, /<aside id="tree-local-navigation" class="tree-local-navigation" data-navigation-root="\/">/);
	assert.match(rootHtml, /aria-label="Page contents: Nested pages"/);
	assert.match(rootHtml, /href="#start-here">Start here<\/a>/);
	assert.match(rootHtml, /href="#what-to-inspect">What to inspect<\/a>/);
	assert.doesNotMatch(rootHtml, /<nav class="page-nav"/);
	assert.match(installationHtml, /--image-width: 760px/);
	assert.match(installationHtml, /--space-section-to-section-desktop: clamp\(2\.25rem, 5vw, 4\.5rem\)/);
	assert.match(installationHtml, /--section-body-width-desktop: min\(60ch,/);
	assert.match(macosHtml, /--section-body-width-desktop: min\(60ch,/);
	assert.match(installationHtml, /Three nested page levels connected in sequence/);
	assert.match(installationHtml, /<nav class="child-page-list" aria-label="Child pages">/);
	assert.match(installationHtml, /href="\/guides\/installation\/macos\/"[\s\S]*?<strong>macOS<\/strong>[\s\S]*?A third-level macOS installation page\./);
	assert.match(installationHtml, /href="\/guides\/installation\/linux\/"[\s\S]*?<strong>Linux<\/strong>[\s\S]*?A third-level Linux installation page\./);
	assert.match(installationHtml, /href="\/guides\/installation\/windows\/"[\s\S]*?<strong>Windows<\/strong>\s*<\/span>\s*<svg/);
	assert.ok(
		installationHtml.indexOf('<strong>macOS</strong>') < installationHtml.indexOf('<strong>Linux</strong>')
		&& installationHtml.indexOf('<strong>Linux</strong>') < installationHtml.indexOf('<strong>Windows</strong>'),
		'Child page lists should follow navigation order.',
	);
	assert.match(installationHtml, /\/original\/pages\/010-guides\/pages\/010-installation\/images\/diagram-[a-f0-9]+\.svg/);
	assert.doesNotMatch(installationHtml, /rel="prev"/);
	assert.match(installationHtml, /href="\/guides\/installation\/macos\/" rel="next"/);
	assert.doesNotMatch(rootHtml, /class="page-sequence-navigation"/);
	assert.match(macosHtml, /data-navigation-mode="tree"/);
	assert.match(macosHtml, /href="https:\/\/github\.com\/example\/docs\/edit\/release-2\/packages\/docs\/site\/pages\/010-guides\/pages\/010-installation\/pages\/010-macos\/content\.md"/);
	assert.match(macosHtml, /data-page-contents-placement="contents-rail"/);
	assert.match(macosHtml, /data-section-tracking="enabled"/);
	assert.match(rootHtml, /data-section-tracking="enabled"/);
	assert.match(macosHtml, /class="site-nav-item site-nav-item-current-branch"/);
	assert.match(macosHtml, /<a href="\/guides\/installation\/">Guides<\/a>/);
	assert.doesNotMatch(macosHtml, /class="site-nav-submenu"/);
	assert.match(macosHtml, /href="\/guides\/installation\/macos\/" aria-current="page"/);
	assert.match(macosHtml, /<nav class="page-sequence-navigation" aria-label="Page sequence">/);
	assert.match(macosHtml, /href="\/guides\/installation\/" rel="prev"[\s\S]*?Previous page[\s\S]*?Installation/);
	assert.match(macosHtml, /href="\/guides\/installation\/linux\/" rel="next"[\s\S]*?Next page[\s\S]*?Linux/);
	assert.doesNotMatch(macosHtml, /data-tree-navigation-toggle/);
	assert.match(macosHtml, /<details\b[^>]*data-display-settings/);
	assert.match(macosHtml, /<input\b[^>]*data-reader-focus/);
	assert.match(macosHtml, /"focusReading":true/);
	assert.match(macosHtml, /<aside id="tree-local-navigation" class="tree-local-navigation" data-navigation-root="\/guides\/">/);
	const treeNavigationStart = macosHtml.indexOf('<aside id="tree-local-navigation"');
	const treeNavigationEnd = macosHtml.indexOf('</aside>', treeNavigationStart);
	const treeNavigationHtml = macosHtml.slice(treeNavigationStart, treeNavigationEnd);
	assert.doesNotMatch(treeNavigationHtml, /class="navigation-page-sections"/);
	assert.doesNotMatch(treeNavigationHtml, /class="page-contents-links/);
	assert.match(macosHtml, /<ul class="navigation-page-tree navigation-page-tree-sidebar">/);
	assert.match(macosHtml, /<details class="navigation-page-branch navigation-page-disclosure navigation-category-disclosure navigation-page-disclosure-sidebar" data-page-path="guides" data-current-branch="true"/);
	assert.match(macosHtml, /<summary class="navigation-page-summary"[^>]*><span class="navigation-page-summary-title">Guides<\/span>/);
	assert.doesNotMatch(macosHtml, /class="navigation-category-disclosure"[^>]*>[\s\S]*?class="navigation-page-open-link"[^>]*>Guides<\/a>/);
	assert.match(macosHtml, /<nav class="site-breadcrumbs" aria-label="Breadcrumb"><ol><li><span>Guides<\/span><\/li><li><a href="\/guides\/installation\/">Installation<\/a><\/li><li><span aria-current="page">macOS<\/span>/);
	assert.match(macosHtml, /<aside class="page-contents-navigation page-contents-navigation-inline"><nav aria-label="Page contents: macOS">/);
	assert.match(macosHtml, /<aside class="page-contents-navigation page-contents-navigation-rail"><nav aria-label="Page contents: macOS">/);
	assert.match(macosHtml, /href="#install">Install<\/a><ol><li><a href="#prerequisites">Prerequisites<\/a>/);
	assert.doesNotMatch(macosHtml, /<nav class="page-nav"/);
	assert.ok(
		macosHtml.indexOf('href="/guides/installation/"') < macosHtml.indexOf('href="/guides/workflows/"'),
		'Nested sibling navigation should follow page directory order.',
	);
	assert.match(referenceInstallationHtml, /data-navigation-mode="tree"/);
	assert.match(referenceInstallationHtml, /data-page-contents-placement="page-tree"/);
	assert.doesNotMatch(referenceInstallationHtml, /class="page-contents-navigation/);
	const referenceTreeStart = referenceInstallationHtml.indexOf('<aside id="tree-local-navigation"');
	const referenceTreeEnd = referenceInstallationHtml.indexOf('</aside>', referenceTreeStart);
	const referenceTreeHtml = referenceInstallationHtml.slice(referenceTreeStart, referenceTreeEnd);
	assert.match(referenceTreeHtml, /class="navigation-page-sections"/);
	assert.doesNotMatch(referenceTreeHtml, /navigation-page-sections-label/);
	assert.match(referenceTreeHtml, /aria-label="Page contents: Reference installation"/);
	assert.match(referenceTreeHtml, /href="#install">Install<\/a><ol><li><a href="#prerequisites">Prerequisites<\/a>/);
	assert.match(referenceTreeHtml, /href="#verify">Verify<\/a>/);
	assert.doesNotMatch(referenceTreeHtml, /href="\/guides\/installation\/macos\/"/);
	assert.match(referenceInstallationHtml, /href="\/reference\/" rel="prev"/);
	assert.doesNotMatch(referenceInstallationHtml, /rel="next"/);

	await runGit(['init']);
	await runGit(['add', '.']);
	await runGit(['commit', '-m', 'Initial nested fixture']);
	const installationContentPath = path.join(
		siteDir,
		'pages',
		'010-guides',
		'pages',
		'010-installation',
		'content.md',
	);
	const workflowsContentPath = path.join(siteDir, 'pages', '010-guides', 'pages', '020-workflows', 'content.md');
	const imageBlockPattern = /\n```image-stack\n[\s\S]*?\n```\n/;
	const installationContent = await readFile(installationContentPath, 'utf8');
	const imageBlock = installationContent.match(imageBlockPattern)?.[0];
	assert.ok(imageBlock, 'The nested fixture needs a managed image block to exercise content:sync.');
	await writeFile(installationContentPath, installationContent.replace(imageBlockPattern, '\n'));
	await writeFile(workflowsContentPath, `${await readFile(workflowsContentPath, 'utf8')}${imageBlock}`);
	await runGit(['add', '.']);
	await runGit(['commit', '-m', 'Move nested image reference']);
	await runNorna(siteDir, 'content:sync', '--yes');

	const previousImagePath = path.join(siteDir, 'pages', '010-guides', 'pages', '010-installation', 'images', 'diagram.svg');
	const nextImagePath = path.join(siteDir, 'pages', '010-guides', 'pages', '020-workflows', 'images', 'diagram.svg');
	assert.equal(await fileExists(previousImagePath), false);
	assert.equal(await fileExists(nextImagePath), true);
	await runNorna(siteDir, 'content:check');

	console.log('Nested pages fixture check passed.');
} finally {
	await rm(tempRoot, { recursive: true, force: true });
}
