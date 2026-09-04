import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { getBasePathRedirectLocation } from './lib/base-path-redirect.mjs';

const repoRoot = path.resolve(import.meta.dirname, '..');
const projectConfigUrl = pathToFileURL(path.join(repoRoot, 'scripts', 'lib', 'project-config.mjs')).href;
const tempRoot = await mkdtemp(path.join(tmpdir(), 'norna-project-config-'));
const importScript = `
	const { projectConfig } = await import(${JSON.stringify(projectConfigUrl)});
	console.log(JSON.stringify({
		basePath: projectConfig.site.basePath,
		language: projectConfig.locale.lang,
		labels: projectConfig.locale.labels,
		navigationMode: projectConfig.navigation.mode,
		scrollBehavior: projectConfig.navigation.scrollBehavior,
		url: projectConfig.site.url,
	}));
`;

const createSite = async (name, config) => {
	const projectRoot = path.join(tempRoot, name);
	const siteDir = path.join(projectRoot, 'site');
	await mkdir(path.join(siteDir, 'pages', '000-home'), { recursive: true });
	await writeFile(path.join(siteDir, 'config.yaml'), config);
	await writeFile(path.join(siteDir, 'pages', '000-home', 'content.md'), '# Config test\n\n## Intro {#intro}\n\nText.\n');
	await writeFile(path.join(siteDir, 'theme.yaml'), 'preset: documentation\n');
	return { projectRoot, siteDir };
};

const loadConfig = ({ projectRoot, siteDir }, env = {}) => spawnSync(
	process.execPath,
	['--input-type=module', '--eval', importScript],
	{
		cwd: projectRoot,
		encoding: 'utf8',
		env: {
			...process.env,
			NORNA_INVOCATION_ROOT: projectRoot,
			NORNA_SITE_DIR: siteDir,
			...env,
		},
	},
);

const assertFailure = (result, expectedPattern) => {
	assert.notEqual(result.status, 0, result.stdout);
	assert.match(`${result.stdout}\n${result.stderr}`, expectedPattern);
};

try {
	assert.equal(getBasePathRedirectLocation('/norna/', '/norna'), '/norna/');
	assert.equal(getBasePathRedirectLocation('/norna/', '/norna?source=test'), '/norna/?source=test');
	assert.equal(getBasePathRedirectLocation('/norna/', '/norna/'), undefined);
	assert.equal(getBasePathRedirectLocation('/norna/', '/norna/concepts/'), undefined);
	assert.equal(getBasePathRedirectLocation('/', '/'), undefined);

	const minimalSite = await createSite('minimal', 'url: https://example.com/docs\n');
	const minimalResult = loadConfig(minimalSite);
	assert.equal(minimalResult.status, 0, minimalResult.stderr);
	assert.deepEqual(JSON.parse(minimalResult.stdout), {
		basePath: '/docs/',
		language: 'en',
		labels: {
			breadcrumb: 'Breadcrumb',
			appearance: 'Appearance',
			appearanceDark: 'Dark',
			appearanceLight: 'Light',
			appearanceSystem: 'System',
			codeCopied: 'Copied',
			codeCopyFailed: 'Could not copy code',
			copyCode: 'Copy code',
			displaySettings: 'Display',
			focusReading: 'Focus reading',
			dismissBanner: 'Dismiss notice',
			built: 'Built',
			images: 'Images',
			imageCarousel: 'image carousel',
			navigationChildren: 'Child pages',
			navigationMenu: 'Menu',
			nextImage: 'Next image',
			note: 'Note',
			pageMoved: 'Page moved',
			pageMovedText: 'This address now identifies',
			pageNavigation: 'Page contents',
			previousImage: 'Previous image',
			readingWidth: 'Reading width',
			readingWidthNarrow: 'Narrow',
			readingWidthStandard: 'Standard',
			readingWidthWide: 'Wide',
			resetDisplaySettings: 'Reset',
			siteBanners: 'Site notices',
			siteNavigation: 'Pages',
			skipToContent: 'Skip to content',
		},
		navigationMode: 'automatic',
		scrollBehavior: 'instant',
		url: 'https://example.com/docs/',
	});

	const localizedSite = await createSite('localized', 'url: https://example.com/\nlanguage: sv-SE\nscrollBehavior: smooth\n');
	const localizedResult = loadConfig(localizedSite);
	assert.equal(localizedResult.status, 0, localizedResult.stderr);
	const localizedConfig = JSON.parse(localizedResult.stdout);
	assert.equal(localizedConfig.language, 'sv-SE');
	assert.equal(localizedConfig.labels.built, 'Byggd');
	assert.equal(localizedConfig.labels.copyCode, 'Kopiera kod');
	assert.equal(localizedConfig.labels.pageMoved, 'Sidan har flyttats');
	assert.equal(localizedConfig.labels.pageMovedText, 'Den här adressen identifierar nu');
	assert.equal(localizedConfig.labels.skipToContent, 'Hoppa till innehållet');
	assert.equal(localizedConfig.scrollBehavior, 'smooth');

	const treeNavigationSite = await createSite('tree-navigation', 'url: https://example.com/\nnavigation:\n  mode: tree\n');
	const treeNavigationResult = loadConfig(treeNavigationSite);
	assert.equal(treeNavigationResult.status, 0, treeNavigationResult.stderr);
	assert.equal(JSON.parse(treeNavigationResult.stdout).navigationMode, 'tree');

	const overrideResult = loadConfig(minimalSite, {
		NORNA_SITE_URL: 'http://127.0.0.1:4567/preview',
	});
	assert.equal(overrideResult.status, 0, overrideResult.stderr);
	assert.deepEqual(
		JSON.parse(overrideResult.stdout),
		{
			...JSON.parse(minimalResult.stdout),
			basePath: '/preview/',
			url: 'http://127.0.0.1:4567/preview/',
		},
	);

	assertFailure(
		loadConfig(await createSite('unknown-field', 'url: https://example.com/\nbasePath: /docs/\n')),
		/not a valid top-level config field/,
	);
	assertFailure(
		loadConfig(await createSite('invalid-yaml', 'url: https://example.com/\nConfiguration prose.\n')),
		/contains invalid YAML/,
	);
	assertFailure(
		loadConfig(await createSite('unsupported-language', 'url: https://example.com/\nlanguage: de\n')),
		/has no built-in Norna UI text/,
	);
	assertFailure(
		loadConfig(await createSite('invalid-url', 'url: example.com\n')),
		/url must be an absolute URL/,
	);
	assertFailure(
		loadConfig(await createSite('invalid-scroll-behavior', 'url: https://example.com/\nscrollBehavior: slow\n')),
		/scrollBehavior must be one of instant, smooth/,
	);
	assertFailure(
		loadConfig(await createSite('removed-section-tracking', 'url: https://example.com/\nnavigation:\n  sectionTracking: true\n')),
		/navigation\.sectionTracking is no longer supported[\s\S]*Section tracking is automatic on pages with a contents rail[\s\S]*Remove navigation\.sectionTracking/,
	);
	assertFailure(
		loadConfig(await createSite('obsolete-smooth-scroll', 'url: https://example.com/\nsmoothScroll: true\n')),
		/not a valid top-level config field/,
	);
	console.log('Project config test passed.');
} finally {
	await rm(tempRoot, { force: true, recursive: true });
}
