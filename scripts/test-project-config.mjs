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
		editLink: projectConfig.editLink,
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
		editLink: null,
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
			editSource: 'Edit this page',
			displaySettings: 'Display',
			focusReading: 'Focus reading',
			footnoteBackReference: 'Back to reference {reference}',
			footnotes: 'Footnotes',
			dismissBanner: 'Dismiss notice',
			built: 'Built',
			images: 'Images',
			imageCarousel: 'image carousel',
			navigationChildren: 'Child pages',
			navigationMenu: 'Menu',
			nextImage: 'Next image',
			nextPage: 'Next page',
			note: 'Note',
			notFound: 'Page not found',
			notFoundText: 'The requested page does not exist or may have moved.',
			pageMoved: 'Page moved',
			pageMovedText: 'This address now identifies',
			pageNavigation: 'Page contents',
			pageSequence: 'Page sequence',
			pageSections: 'Sections',
			previousImage: 'Previous image',
			previousPage: 'Previous page',
			readingWidth: 'Reading width',
			readingWidthNarrow: 'Narrow',
			readingWidthStandard: 'Standard',
			readingWidthWide: 'Wide',
			resetDisplaySettings: 'Reset',
			returnHome: 'Go to the homepage',
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
	assert.equal(localizedConfig.labels.editSource, 'Redigera den här sidan');
	assert.equal(localizedConfig.labels.footnoteBackReference, 'Tillbaka till referens {reference}');
	assert.equal(localizedConfig.labels.footnotes, 'Fotnoter');
	assert.equal(localizedConfig.labels.notFound, 'Sidan hittades inte');
	assert.equal(localizedConfig.labels.notFoundText, 'Den begärda sidan finns inte eller kan ha flyttats.');
	assert.equal(localizedConfig.labels.pageMoved, 'Sidan har flyttats');
	assert.equal(localizedConfig.labels.pageMovedText, 'Den här adressen identifierar nu');
	assert.equal(localizedConfig.labels.nextPage, 'Nästa sida');
	assert.equal(localizedConfig.labels.pageSequence, 'Sidföljd');
	assert.equal(localizedConfig.labels.pageSections, 'Avsnitt');
	assert.equal(localizedConfig.labels.previousPage, 'Föregående sida');
	assert.equal(localizedConfig.labels.returnHome, 'Gå till startsidan');
	assert.equal(localizedConfig.labels.skipToContent, 'Hoppa till innehållet');
	assert.equal(localizedConfig.scrollBehavior, 'smooth');

	const treeNavigationSite = await createSite('tree-navigation', 'url: https://example.com/\nnavigation:\n  mode: tree\n');
	const treeNavigationResult = loadConfig(treeNavigationSite);
	assert.equal(treeNavigationResult.status, 0, treeNavigationResult.stderr);
	assert.equal(JSON.parse(treeNavigationResult.stdout).navigationMode, 'tree');

	const editLinkSite = await createSite(
		'edit-link',
		'url: https://example.com/\neditLink:\n  baseUrl: https://github.com/example/project/edit/release-2/packages/docs\n',
	);
	const editLinkResult = loadConfig(editLinkSite);
	assert.equal(editLinkResult.status, 0, editLinkResult.stderr);
	assert.deepEqual(JSON.parse(editLinkResult.stdout).editLink, {
		baseUrl: 'https://github.com/example/project/edit/release-2/packages/docs/',
	});

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
		loadConfig(await createSite('missing-edit-base-url', 'url: https://example.com/\neditLink: {}\n')),
		/editLink\.baseUrl is required when editLink is configured/,
	);
	assertFailure(
		loadConfig(await createSite('invalid-edit-url', 'url: https://example.com/\neditLink:\n  baseUrl: file:\/\/\/tmp\/site\n')),
		/editLink\.baseUrl must use http or https/,
	);
	assertFailure(
		loadConfig(await createSite('edit-url-query', 'url: https://example.com/\neditLink:\n  baseUrl: https:\/\/example.com\/edit\/main\/?preview=true\n')),
		/editLink\.baseUrl must not contain a query string or fragment/,
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
