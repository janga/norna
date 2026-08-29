import assert from 'node:assert/strict';
import { access, cp, mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const run = (command, args, options = {}) => new Promise((resolve, reject) => {
	const child = spawn(command, args, {
		cwd: repoRoot,
		stdio: ['ignore', 'pipe', 'pipe'],
		...options,
	});
	let stdout = '';
	let stderr = '';

	child.stdout?.on('data', (chunk) => {
		stdout += chunk;
	});
	child.stderr?.on('data', (chunk) => {
		stderr += chunk;
	});
	child.once('error', reject);
	child.once('exit', (code, signal) => {
		if (code === 0) {
			resolve({ stdout, stderr });
			return;
		}

		const commandText = [command, ...args].join(' ');
		reject(new Error([
			signal
				? `${commandText} exited with signal ${signal}.`
				: `${commandText} exited with code ${code}.`,
			stdout.trim(),
			stderr.trim(),
		].filter(Boolean).join('\n')));
	});
});

const runInherit = (command, args, options = {}) => new Promise((resolve, reject) => {
	const child = spawn(command, args, {
		cwd: repoRoot,
		stdio: 'inherit',
		...options,
	});

	child.once('error', reject);
	child.once('exit', (code, signal) => {
		if (code === 0) {
			resolve();
			return;
		}

		const commandText = [command, ...args].join(' ');
		reject(new Error(signal
			? `${commandText} exited with signal ${signal}.`
			: `${commandText} exited with code ${code}.`));
	});
});

const runExpectFailure = async (command, args, options = {}, expectedText) => {
	try {
		await run(command, args, options);
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);

		if (message.includes(expectedText)) {
			return;
		}

		throw new Error(`Expected failing command output to include "${expectedText}".\n${message}`);
	}

	throw new Error(`Expected command to fail: ${[command, ...args].join(' ')}`);
};

const npmBin = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const npxBin = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const tempRoot = await mkdtemp(path.join(tmpdir(), 'norna-package-check-'));
const packDir = path.join(tempRoot, 'pack');
const unpackDir = path.join(tempRoot, 'unpack');
const siteProjectRoot = path.join(tempRoot, 'site-project');
const initializedSiteRoot = path.join(tempRoot, 'initialized-site');
const npmCachePath = path.resolve(
	repoRoot,
	process.env.NORNA_PACKAGE_CHECK_CACHE
		?? path.join('node_modules', '.cache', 'norna-package-check-npm'),
);
const npmEnv = {
	...process.env,
	npm_config_cache: npmCachePath,
};

const assertFileExists = async (filePath) => {
	try {
		await readFile(filePath);
	} catch (error) {
		if (error?.code === 'ENOENT') {
			throw new Error(`Packed package is missing ${path.relative(unpackDir, filePath)}.`);
		}

		throw error;
	}
};

const assertFileMissing = async (filePath) => {
	try {
		await readFile(filePath);
	} catch (error) {
		if (error?.code === 'ENOENT') {
			return;
		}

		throw error;
	}

	throw new Error(`Unexpected file exists: ${filePath}.`);
};

const assertPathExists = async (filePath) => {
	await access(filePath);
};

const assertPathMissing = async (filePath) => {
	try {
		await access(filePath);
	} catch (error) {
		if (error?.code === 'ENOENT') return;
		throw error;
	}

	throw new Error(`Unexpected path exists: ${filePath}.`);
};

const assertFileIncludes = async (filePath, expectedText) => {
	const fileContent = await readFile(filePath, 'utf8');

	if (!fileContent.includes(expectedText)) {
		throw new Error(`Expected ${filePath} to include: ${expectedText}`);
	}
};

const assertFileExcludes = async (filePath, unexpectedText) => {
	const fileContent = await readFile(filePath, 'utf8');

	if (fileContent.includes(unexpectedText)) {
		throw new Error(`Expected ${filePath} not to include: ${unexpectedText}`);
	}
};

const listFiles = async (directoryPath, relativeDirectory = '') => {
	const entries = await readdir(path.join(directoryPath, relativeDirectory), { withFileTypes: true });
	const files = [];

	for (const entry of entries) {
		const relativePath = path.join(relativeDirectory, entry.name);

		if (entry.isDirectory()) {
			files.push(...await listFiles(directoryPath, relativePath));
		} else {
			files.push(relativePath.split(path.sep).join('/'));
		}
	}

	return files.sort();
};

const assertPackageContents = async (packageRoot) => {
	const files = await listFiles(packageRoot);
	const fileSet = new Set(files);
	const requiredFiles = [
		'LICENSE',
		'README.md',
		'astro.config.mjs',
		'bin/norna-cli.mjs',
		'bin/norna.mjs',
		'package.json',
		'schemas/config.schema.json',
		'schemas/content-frontmatter.schema.json',
		'schemas/manifest.json',
		'schemas/page-theme.schema.json',
		'schemas/sitewide-content.schema.json',
		'schemas/theme.schema.json',
		'scripts/build-site.mjs',
		'scripts/check-config.mjs',
		'scripts/deploy-site.mjs',
		'scripts/dev-local.mjs',
		'scripts/doctor.mjs',
		'scripts/engine-version.mjs',
		'scripts/export-theme-preset.mjs',
		'scripts/generate-images.mjs',
		'scripts/generate-schemas.mjs',
		'scripts/init-site.mjs',
		'scripts/lib/astro-command.mjs',
		'scripts/lib/documentation-links.mjs',
		'scripts/lib/editor-language-service.mjs',
		'scripts/lib/site-paths.mjs',
		'scripts/list-theme-presets.mjs',
		'scripts/show-typography.mjs',
		'scripts/sync-content-sections.mjs',
		'scripts/sync-site-public.mjs',
		'scripts/update-engine.mjs',
		'scripts/watch-pages-deploy.mjs',
		'src/pages/index.astro',
		'starters/basic/.github/workflows/deploy.yml',
		'starters/basic/package.json',
		'starters/basic/site/pages/000-home/content.md',
	];
	const missingFiles = requiredFiles.filter((filePath) => !fileSet.has(filePath));

	assert.deepEqual(missingFiles, [], `Packed package is missing runtime files:\n${missingFiles.join('\n')}`);

	const forbiddenPrefixes = [
		'docs/',
		'editors/',
		'examples/',
		'fixtures/',
		'starters/project/',
		'test-results/',
		'tests/',
	];
	const forbiddenExactFiles = new Set([
		'scripts/build-demo.mjs',
		'scripts/build-pages.mjs',
		'scripts/lib/documentation-preset-candidates.mjs',
		'scripts/lib/example-sites.mjs',
		'scripts/lib/git-status.mjs',
		'scripts/release.mjs',
		'scripts/review-documentation-preset.mjs',
		'tsconfig.json',
	]);
	const forbiddenFiles = files.filter((filePath) => (
		forbiddenPrefixes.some((prefix) => filePath.startsWith(prefix))
		|| forbiddenExactFiles.has(filePath)
		|| filePath.startsWith('scripts/test-')
		|| filePath.split('/').some((segment) => ['.astro', '.norna', 'node_modules'].includes(segment))
	));

	assert.deepEqual(forbiddenFiles, [], `Packed package contains repository-only files:\n${forbiddenFiles.join('\n')}`);
	assert.ok(files.length < 250, `Packed package unexpectedly contains ${files.length} files (limit: 249).`);
};

try {
	await mkdir(packDir, { recursive: true });
	await mkdir(npmCachePath, { recursive: true });
	const packResult = await run(npmBin, ['pack', '--pack-destination', packDir], {
		env: npmEnv,
	});
	const tarballName = packResult.stdout.trim().split('\n').at(-1);

	if (!tarballName?.endsWith('.tgz')) {
		throw new Error(`npm pack did not report a tarball name.\n${packResult.stdout}${packResult.stderr}`);
	}

	const tarballPath = path.join(packDir, tarballName);
	await mkdir(unpackDir, { recursive: true });
	await runInherit('tar', ['-xzf', tarballPath, '-C', unpackDir]);
	const packageRoot = path.join(unpackDir, 'package');
	await assertPackageContents(packageRoot);
	const packagedStarterRoot = path.join(packageRoot, 'starters', 'basic');
	await Promise.all([
		assertFileExists(path.join(packagedStarterRoot, '.github', 'workflows', 'deploy.yml')),
		assertFileExists(path.join(packagedStarterRoot, 'package.json')),
		assertFileExists(path.join(packagedStarterRoot, 'README.md')),
		assertFileExists(path.join(packagedStarterRoot, 'site', 'config.yaml')),
		assertFileExists(path.join(packagedStarterRoot, 'site', 'theme.yaml')),
		assertFileExists(path.join(packagedStarterRoot, 'site', 'sitewide-content.yaml')),
		assertFileExists(path.join(packagedStarterRoot, 'site', 'pages', '000-home', 'content.md')),
		assertFileExists(path.join(packagedStarterRoot, 'site', 'pages', '000-home', 'images', '.gitkeep')),
		assertFileExists(path.join(packagedStarterRoot, 'site', 'public', 'robots.txt')),
	]);
	await assertFileIncludes(
		path.join(packagedStarterRoot, '.github', 'workflows', 'deploy.yml'),
		'node-version: 24.18.0',
	);
	await assertFileIncludes(
		path.join(packagedStarterRoot, '.github', 'workflows', 'deploy.yml'),
		'run: npm run norna:build',
	);
	await cp(packagedStarterRoot, siteProjectRoot, {
		recursive: true,
	});
	const packageJsonPath = path.join(siteProjectRoot, 'package.json');
	const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf8'));
	assert.equal(packageJson.scripts['norna:check'], 'norna check');
	packageJson.name = 'norna-package-check-site';
	packageJson.dependencies['@janga/norna'] = tarballPath;
	await writeFile(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`);
	const packageCheckConfigPath = path.join(siteProjectRoot, 'site', 'config.yaml');
	const packageCheckConfig = await readFile(packageCheckConfigPath, 'utf8');
	await writeFile(
		packageCheckConfigPath,
		packageCheckConfig.replace('url: https://example.com/', 'url: https://example.com/site/'),
	);
	const packageCheckSitewidePath = path.join(siteProjectRoot, 'site', 'sitewide-content.yaml');
	const packageCheckSitewide = await readFile(packageCheckSitewidePath, 'utf8');
	await writeFile(
		packageCheckSitewidePath,
		`logo:\n  height: 2.6rem\n${packageCheckSitewide}`,
	);
	await writeFile(
		path.join(siteProjectRoot, 'site', 'public', 'logo.svg'),
		'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" fill="black"/></svg>\n',
	);
	await writeFile(path.join(siteProjectRoot, 'site', 'pages', '000-home', 'content.md'), `---
page:
  description: Site used by package checks.
---

# Package Check Site

## Intro {#intro}

This page verifies that **packaged norna sites** can build with the current content model.

<!-- norna-image-provenance:
image: package-check.svg
source: package check fixture
-->

## **Warning** {#warning}

This section verifies styled section headings.

## Work {#work}

This section keeps the package check independent from user-facing starter copy.
`);
	await mkdir(path.join(siteProjectRoot, 'site', 'pages', '010-about'), { recursive: true });
	await writeFile(path.join(siteProjectRoot, 'site', 'pages', '010-about', 'content.md'), `---
page:
  description: Page used by package checks.
---

# About the site

## About {#about}

This page verifies that packaged norna sites can build additional pages.
`);

	await runInherit(npmBin, ['install', '--no-audit', '--no-fund', '--prefer-offline', '--fetch-retries=0'], { cwd: siteProjectRoot, env: npmEnv });
	const nornaBinPath = path.join(siteProjectRoot, 'node_modules', '.bin', process.platform === 'win32' ? 'norna.cmd' : 'norna');
	await runInherit(nornaBinPath, ['init', initializedSiteRoot], { cwd: tempRoot, env: npmEnv });
	await Promise.all([
		assertFileExists(path.join(initializedSiteRoot, 'package.json')),
		assertFileExists(path.join(initializedSiteRoot, 'site', 'config.yaml')),
		assertFileExists(path.join(initializedSiteRoot, 'site', 'theme.yaml')),
		assertFileExists(path.join(initializedSiteRoot, 'site', 'pages', '000-home', 'content.md')),
		assertFileMissing(path.join(initializedSiteRoot, '.DS_Store')),
		assertFileMissing(path.join(initializedSiteRoot, 'site', '.DS_Store')),
	]);
	await assertFileIncludes(
		path.join(initializedSiteRoot, '.gitignore'),
		'**/.norna/.astro/',
	);
	await assertFileIncludes(
		path.join(initializedSiteRoot, 'site', '.gitignore'),
		'.norna/.astro/',
	);
	const homeImagesDir = path.join(siteProjectRoot, 'site', 'pages', '000-home', 'images');
	await runInherit(npxBin, ['norna', 'engine:version'], { cwd: homeImagesDir, env: npmEnv });
	await runInherit(npxBin, ['norna', 'doctor'], { cwd: homeImagesDir, env: npmEnv });
	await runInherit(npxBin, ['norna', 'config:check'], { cwd: homeImagesDir, env: npmEnv });
	await runInherit(npxBin, ['norna', 'content:check'], { cwd: siteProjectRoot, env: npmEnv });
	await runInherit(npxBin, ['norna', 'check'], { cwd: siteProjectRoot, env: npmEnv });
	await runInherit(npxBin, ['norna', 'build'], { cwd: siteProjectRoot, env: npmEnv });
	await assertPathExists(path.join(siteProjectRoot, 'site', '.norna', '.astro'));
	await assertPathMissing(path.join(siteProjectRoot, '.astro'));
	await assertFileExists(path.join(siteProjectRoot, 'site', '.norna', 'public', 'robots.txt'));
	await assertFileExists(path.join(siteProjectRoot, 'dist', 'robots.txt'));
	await assertFileExists(path.join(siteProjectRoot, 'dist', 'about', 'index.html'));
	await assertFileMissing(path.join(siteProjectRoot, 'public', 'robots.txt'));
	await assertFileExcludes(
		path.join(siteProjectRoot, 'dist', 'index.html'),
		'href="/favicon.svg"',
	);
	await assertFileExcludes(
		path.join(siteProjectRoot, 'dist', 'index.html'),
		'href="/favicon.ico"',
	);
	await assertFileIncludes(
		path.join(siteProjectRoot, 'dist', 'index.html'),
		'--section-heading-font-size-desktop: clamp(1.35rem, 1.1rem + 0.9vw, 2rem)',
	);
	await assertFileIncludes(
		path.join(siteProjectRoot, 'dist', 'index.html'),
		'--section-heading-font-weight: 500',
	);
	await assertFileIncludes(
		path.join(siteProjectRoot, 'dist', 'index.html'),
		'--section-heading-spacing-after: 0.45em',
	);
	await assertFileIncludes(
		path.join(siteProjectRoot, 'dist', 'index.html'),
		'--section-markdown-h3-spacing-before: 1.2em',
	);
	await assertFileIncludes(
		path.join(siteProjectRoot, 'dist', 'index.html'),
		"--font-sans: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
	);
	await assertFileIncludes(
		path.join(siteProjectRoot, 'dist', 'index.html'),
		'<meta name="format-detection" content="telephone=no">',
	);
	await assertFileIncludes(
		path.join(siteProjectRoot, 'dist', 'index.html'),
		'style="scroll-behavior: auto;',
	);
	await assertFileExcludes(
		path.join(siteProjectRoot, 'dist', 'index.html'),
		'data-smooth-scroll=',
	);
	await assertFileIncludes(
		path.join(siteProjectRoot, 'dist', 'about', 'index.html'),
		'<link rel="canonical" href="https://example.com/site/about/">',
	);
	await assertFileIncludes(
		path.join(siteProjectRoot, 'dist', 'about', 'index.html'),
		'href="/site/about/" aria-current="page"',
	);
	await assertFileIncludes(
		path.join(siteProjectRoot, 'dist', 'index.html'),
		'<a class="site-brand" href="/site/"><img class="site-brand-logo" src="/site/logo.svg" alt="Package Check Site">',
	);
	await assertFileExcludes(
		path.join(siteProjectRoot, 'dist', 'index.html'),
		'<div class="site-nav-submenu">',
	);
	await assertFileIncludes(
		path.join(siteProjectRoot, 'dist', 'index.html'),
		'href="/site/about/">About the site</a>',
	);
	await assertFileIncludes(
		path.join(siteProjectRoot, 'dist', 'index.html'),
		'<nav class="page-nav" aria-label="Page contents">',
	);
	await assertFileIncludes(
		path.join(siteProjectRoot, 'dist', 'index.html'),
		'href="#intro">Intro</a>',
	);
	await assertFileIncludes(
		path.join(siteProjectRoot, 'dist', 'index.html'),
		'--section-body-align-mobile: left',
	);
	await assertFileIncludes(
		path.join(siteProjectRoot, 'dist', 'index.html'),
		'--section-body-line-height: 1.62',
	);
	await assertFileIncludes(
		path.join(siteProjectRoot, 'dist', 'index.html'),
		'--section-body-width-desktop: min(72ch, var(--text-width))',
	);
	await assertFileExcludes(
		path.join(siteProjectRoot, 'dist', 'index.html'),
		'norna-image-provenance',
	);
	await assertFileIncludes(
		path.join(siteProjectRoot, 'dist', 'index.html'),
		'--section-body-paragraph-spacing: 0.65em',
	);
	await assertFileIncludes(
		path.join(siteProjectRoot, 'dist', 'index.html'),
		'--section-caption-line-height: 1.4',
	);
	await assertFileIncludes(
		path.join(siteProjectRoot, 'dist', 'index.html'),
		'--section-caption-spacing-before: 0.35em',
	);
	await assertFileIncludes(
		path.join(siteProjectRoot, 'dist', 'index.html'),
		'--section-caption-font-size-desktop: clamp(0.86rem, 0.84rem + 0.08vw, 0.92rem)',
	);
	await assertFileExcludes(
		path.join(siteProjectRoot, 'dist', 'index.html'),
		'class="inline-style',
	);
	await assertFileIncludes(
		path.join(siteProjectRoot, 'dist', 'index.html'),
		'data-section-title="Warning"',
	);
	await assertFileIncludes(
		path.join(siteProjectRoot, 'dist', 'index.html'),
		'href="#warning">Warning</a>',
	);
	await assertFileIncludes(
		path.join(siteProjectRoot, 'dist', 'index.html'),
		'--section-background-color: var(--color-surface-base-background)',
	);
	await assertFileIncludes(
		path.join(siteProjectRoot, 'dist', 'index.html'),
		'--section-background-color: var(--color-surface-soft-background)',
	);
	await assertFileIncludes(
		path.join(siteProjectRoot, 'dist', 'index.html'),
		'--site-top-background-color: var(--color-frame-background)',
	);
	await assertFileIncludes(
		path.join(siteProjectRoot, 'dist', 'index.html'),
		'--site-top-text-color: var(--color-frame-text)',
	);
	await assertFileIncludes(
		path.join(siteProjectRoot, 'dist', 'index.html'),
		'--site-footer-background-color: var(--color-frame-background)',
	);
	await assertFileIncludes(
		path.join(siteProjectRoot, 'dist', 'index.html'),
		'--site-footer-text-color: var(--color-frame-text)',
	);
	await assertFileIncludes(
		path.join(siteProjectRoot, 'dist', 'index.html'),
		'--section-text-color: var(--color-surface-base-text)',
	);
	await writeFile(path.join(siteProjectRoot, 'site', 'public', 'favicon.ico'), 'fake icon');
	await runInherit(npxBin, ['norna', 'build'], { cwd: siteProjectRoot, env: npmEnv });
	await assertFileExists(path.join(siteProjectRoot, 'dist', 'favicon.ico'));
	await assertFileIncludes(
		path.join(siteProjectRoot, 'dist', 'index.html'),
		'<link rel="icon" sizes="any" href="/site/favicon.ico">',
	);
	await assertFileExcludes(
		path.join(siteProjectRoot, 'dist', 'index.html'),
		'href="/favicon.svg"',
	);
	const siteContentPath = path.join(siteProjectRoot, 'site', 'pages', '000-home', 'content.md');
	const siteContent = await readFile(siteContentPath, 'utf8');
	const siteThemePath = path.join(siteProjectRoot, 'site', 'theme.yaml');
	const siteTheme = await readFile(siteThemePath, 'utf8');
	await writeFile(siteThemePath, `${siteTheme.trim()}\ntypography:\n  profile: noisy\n`);
	await runExpectFailure(
		npxBin,
		['norna', 'build'],
		{ cwd: siteProjectRoot, env: npmEnv },
		'typography.profile',
	);
	await writeFile(siteThemePath, `${siteTheme.trim()}\npalette: neon\n`);
	await runExpectFailure(
		npxBin,
		['norna', 'build'],
		{ cwd: siteProjectRoot, env: npmEnv },
		'palette',
	);
	await writeFile(siteThemePath, siteTheme);
	await writeFile(
		siteContentPath,
		siteContent.replace(
			'This page verifies that **packaged norna sites** can build with the current content model.',
			'This page verifies that [packaged norna sites]{.highlight} can build with the current content model.',
		),
	);
	await runExpectFailure(
		npxBin,
		['norna', 'build'],
		{ cwd: siteProjectRoot, env: npmEnv },
		'Inline color style ".highlight" is no longer supported',
	);
	await writeFile(siteContentPath, siteContent);
	await writeFile(
		siteContentPath,
		siteContent.replace(
			'description: Site used by package checks.',
			'description: Site used by package checks.\ntypography:\n  overrides:\n    body:\n      lineHeight: tight',
		),
	);
	await runExpectFailure(
		npxBin,
		['norna', 'build'],
		{ cwd: siteProjectRoot, env: npmEnv },
		'typography',
	);
	await writeFile(
		siteContentPath,
		siteContent.replace(
			'description: Site used by package checks.',
			'description: Site used by package checks.\nsections:\n  intro: {}',
		),
	);
	await runExpectFailure(
		npxBin,
		['norna', 'build'],
		{ cwd: siteProjectRoot, env: npmEnv },
		'defines "sections" at the top level, but it is not a valid top-level content field',
	);
	await writeFile(siteThemePath, `${siteTheme.trim()}\ntypography:\n  fontFamily: "Arial; color: red"\n`);
	await runExpectFailure(
		npxBin,
		['norna', 'config:check'],
		{ cwd: siteProjectRoot, env: npmEnv },
		'typography.fontFamily',
	);
	await writeFile(siteThemePath, siteTheme);
	const siteConfigPath = path.join(siteProjectRoot, 'site', 'config.yaml');
	const siteConfig = await readFile(siteConfigPath, 'utf8');
	await writeFile(
		siteConfigPath,
		siteConfig.replace('url: https://example.com/site/', 'url: example.com/site/'),
	);
	await runExpectFailure(
		npxBin,
		['norna', 'config:check'],
		{ cwd: siteProjectRoot, env: npmEnv },
		'url must be an absolute URL',
	);

	console.log('Package check passed.');
} finally {
	await rm(tempRoot, { force: true, recursive: true });
}
