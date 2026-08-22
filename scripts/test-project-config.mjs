import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const repoRoot = path.resolve(import.meta.dirname, '..');
const projectConfigUrl = pathToFileURL(path.join(repoRoot, 'scripts', 'lib', 'project-config.mjs')).href;
const tempRoot = await mkdtemp(path.join(tmpdir(), 'norna-project-config-'));
const importScript = `
	const { projectConfig } = await import(${JSON.stringify(projectConfigUrl)});
	console.log(JSON.stringify({
		basePath: projectConfig.site.basePath,
		language: projectConfig.locale.lang,
		labels: projectConfig.locale.labels,
		scrollBehavior: projectConfig.navigation.scrollBehavior,
		url: projectConfig.site.url,
	}));
`;

const createSite = async (name, config, { legacy = false } = {}) => {
	const projectRoot = path.join(tempRoot, name);
	const siteDir = path.join(projectRoot, 'site');
	await mkdir(siteDir, { recursive: true });
	await writeFile(path.join(siteDir, legacy ? 'config.mjs' : 'config.md'), config);
	await writeFile(path.join(siteDir, 'content.md'), '---\ntitle: Config test\ndescription: Config test.\n---\n\n## Intro {#intro}\n\nText.\n');
	await writeFile(path.join(siteDir, 'theme.md'), '---\npreset: documentation\n---\n');
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
	const minimalSite = await createSite('minimal', '---\nurl: https://example.com/docs\n---\n');
	const minimalResult = loadConfig(minimalSite);
	assert.equal(minimalResult.status, 0, minimalResult.stderr);
	assert.deepEqual(JSON.parse(minimalResult.stdout), {
		basePath: '/docs/',
		language: 'en',
		labels: {
			dismissBanner: 'Dismiss notice',
			images: 'Images',
			note: 'Note',
			pageNavigation: 'On this page',
			siteBanners: 'Site notices',
			siteNavigation: 'Pages',
			skipToContent: 'Skip to content',
		},
		scrollBehavior: 'instant',
		url: 'https://example.com/docs/',
	});

	const localizedSite = await createSite('localized', '---\nurl: https://example.com/\nlanguage: sv-SE\nscrollBehavior: smooth\n---\n');
	const localizedResult = loadConfig(localizedSite);
	assert.equal(localizedResult.status, 0, localizedResult.stderr);
	const localizedConfig = JSON.parse(localizedResult.stdout);
	assert.equal(localizedConfig.language, 'sv-SE');
	assert.equal(localizedConfig.labels.skipToContent, 'Hoppa till innehållet');
	assert.equal(localizedConfig.scrollBehavior, 'smooth');

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
		loadConfig(await createSite('unknown-field', '---\nurl: https://example.com/\nbasePath: /docs/\n---\n')),
		/not a valid top-level config field/,
	);
	assertFailure(
		loadConfig(await createSite('markdown-body', '---\nurl: https://example.com/\n---\n\nConfiguration prose.\n')),
		/may contain YAML frontmatter only/,
	);
	assertFailure(
		loadConfig(await createSite('unsupported-language', '---\nurl: https://example.com/\nlanguage: de\n---\n')),
		/has no built-in Norna UI text/,
	);
	assertFailure(
		loadConfig(await createSite('invalid-url', '---\nurl: example.com\n---\n')),
		/url must be an absolute URL/,
	);
	assertFailure(
		loadConfig(await createSite('invalid-scroll-behavior', '---\nurl: https://example.com/\nscrollBehavior: slow\n---\n')),
		/scrollBehavior must be one of instant, smooth/,
	);
	assertFailure(
		loadConfig(await createSite('obsolete-smooth-scroll', '---\nurl: https://example.com/\nsmoothScroll: true\n---\n')),
		/not a valid top-level config field/,
	);
	assertFailure(
		loadConfig(await createSite('legacy', 'export default {};\n', { legacy: true })),
		/Replace the obsolete config\.mjs with a frontmatter-only config\.md file/,
	);

	console.log('Project config test passed.');
} finally {
	await rm(tempRoot, { force: true, recursive: true });
}
