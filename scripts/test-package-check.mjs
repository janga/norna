import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
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
	const packagedStarterRoot = path.join(unpackDir, 'package', 'starters', 'basic');
	await Promise.all([
		assertFileExists(path.join(unpackDir, 'package', 'docs', 'README.md')),
		assertFileExists(path.join(unpackDir, 'package', 'docs', 'configuration.md')),
		assertFileExists(path.join(unpackDir, 'package', 'docs', 'images-and-metadata.md')),
		assertFileExists(path.join(packagedStarterRoot, '.github', 'workflows', 'deploy.yml')),
		assertFileExists(path.join(packagedStarterRoot, 'package.json')),
		assertFileExists(path.join(packagedStarterRoot, 'README.md')),
		assertFileExists(path.join(packagedStarterRoot, 'site', 'config.mjs')),
		assertFileExists(path.join(packagedStarterRoot, 'site', 'theme.md')),
		assertFileExists(path.join(packagedStarterRoot, 'site', 'sitewide-content.md')),
		assertFileExists(path.join(packagedStarterRoot, 'site', 'content.md')),
		assertFileExists(path.join(packagedStarterRoot, 'site', 'images', 'work', '.gitkeep')),
		assertFileExists(path.join(packagedStarterRoot, 'site', 'public', 'robots.txt')),
	]);
	await assertFileIncludes(
		path.join(packagedStarterRoot, '.github', 'workflows', 'deploy.yml'),
		'node-version: 24.18.0',
	);
	await cp(packagedStarterRoot, siteProjectRoot, {
		recursive: true,
	});
	const packageJsonPath = path.join(siteProjectRoot, 'package.json');
	const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf8'));
	packageJson.name = 'norna-package-check-site';
	packageJson.dependencies['@janga/norna'] = tarballPath;
	await writeFile(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`);
	const packageCheckConfigPath = path.join(siteProjectRoot, 'site', 'config.mjs');
	const packageCheckConfig = await readFile(packageCheckConfigPath, 'utf8');
	await writeFile(
		packageCheckConfigPath,
		packageCheckConfig
			.replace("url: 'https://example.com/'", "url: 'https://example.com/site/'")
			.replace("basePath: '/'", "basePath: '/site/'"),
	);
	const packageCheckThemePath = path.join(siteProjectRoot, 'site', 'theme.md');
	const packageCheckTheme = await readFile(packageCheckThemePath, 'utf8');
	await writeFile(
		packageCheckThemePath,
		packageCheckTheme.replace('brand: Example Site', 'brand: Package Check Brand\n  logo:\n    alt: Package Check Logo\n    height: 2.6rem'),
	);
	await writeFile(
		path.join(siteProjectRoot, 'site', 'public', 'logo.svg'),
		'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" fill="black"/></svg>\n',
	);
	await writeFile(path.join(siteProjectRoot, 'site', 'content.md'), `---
title: Package Check Site
description: Site used by package checks.
sections:
  intro: {}
  warning: {}
  work: {}
---

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
	await mkdir(path.join(siteProjectRoot, 'site', 'routes', '010-about'), { recursive: true });
	await writeFile(path.join(siteProjectRoot, 'site', 'routes', '010-about', 'route-content.md'), `---
title: About the site
description: Route used by package checks.
navigation:
  label: About
sections:
  about: {}
---

## About {#about}

This route verifies that packaged norna sites can build route pages.
`);

	await runInherit(npmBin, ['install', '--no-audit', '--no-fund', '--prefer-offline', '--fetch-retries=0'], { cwd: siteProjectRoot, env: npmEnv });
	const nornaBinPath = path.join(siteProjectRoot, 'node_modules', '.bin', process.platform === 'win32' ? 'norna.cmd' : 'norna');
	await runInherit(nornaBinPath, ['init', initializedSiteRoot], { cwd: tempRoot, env: npmEnv });
	await Promise.all([
		assertFileExists(path.join(initializedSiteRoot, 'package.json')),
		assertFileExists(path.join(initializedSiteRoot, 'site', 'config.mjs')),
		assertFileExists(path.join(initializedSiteRoot, 'site', 'theme.md')),
		assertFileMissing(path.join(initializedSiteRoot, '.DS_Store')),
		assertFileMissing(path.join(initializedSiteRoot, 'site', '.DS_Store')),
	]);
	await runInherit(npxBin, ['norna', 'engine:version'], { cwd: path.join(siteProjectRoot, 'site', 'images', 'work'), env: npmEnv });
	await runInherit(npxBin, ['norna', 'doctor'], { cwd: path.join(siteProjectRoot, 'site', 'images', 'work'), env: npmEnv });
	await runInherit(npxBin, ['norna', 'config:check'], { cwd: path.join(siteProjectRoot, 'site', 'images', 'work'), env: npmEnv });
	await runInherit(npxBin, ['norna', 'content:check'], { cwd: siteProjectRoot, env: npmEnv });
	await runInherit(npxBin, ['norna', 'build'], { cwd: siteProjectRoot, env: npmEnv });
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
		'--section-heading-font-weight: 400',
	);
	await assertFileIncludes(
		path.join(siteProjectRoot, 'dist', 'index.html'),
		'--section-heading-spacing-after: 0.55em',
	);
	await assertFileIncludes(
		path.join(siteProjectRoot, 'dist', 'index.html'),
		'--section-markdown-h3-spacing-before: 1.5em',
	);
	await assertFileIncludes(
		path.join(siteProjectRoot, 'dist', 'index.html'),
		"--font-sans: Arial, 'Helvetica Neue', Helvetica, sans-serif",
	);
	await assertFileIncludes(
		path.join(siteProjectRoot, 'dist', 'index.html'),
		'<meta name="format-detection" content="telephone=no">',
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
		'<a class="site-brand" href="/site/"><img class="site-brand-logo" src="/site/logo.svg" alt="Package Check Logo">',
	);
	await assertFileIncludes(
		path.join(siteProjectRoot, 'dist', 'index.html'),
		'<div class="site-nav-submenu">',
	);
	await assertFileIncludes(
		path.join(siteProjectRoot, 'dist', 'index.html'),
		'href="/site/#intro">Intro</a>',
	);
	await assertFileIncludes(
		path.join(siteProjectRoot, 'dist', 'index.html'),
		'--section-body-align-mobile: left',
	);
	await assertFileIncludes(
		path.join(siteProjectRoot, 'dist', 'index.html'),
		'--section-body-line-height: 1.5',
	);
	await assertFileIncludes(
		path.join(siteProjectRoot, 'dist', 'index.html'),
		'--section-body-width-desktop: var(--text-width)',
	);
	await assertFileExcludes(
		path.join(siteProjectRoot, 'dist', 'index.html'),
		'norna-image-provenance',
	);
	await assertFileIncludes(
		path.join(siteProjectRoot, 'dist', 'index.html'),
		'--section-body-paragraph-spacing: 0.85em',
	);
	await assertFileIncludes(
		path.join(siteProjectRoot, 'dist', 'index.html'),
		'--section-caption-line-height: 1.35',
	);
	await assertFileIncludes(
		path.join(siteProjectRoot, 'dist', 'index.html'),
		'--section-caption-spacing-before: 0.5em',
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
		'href="/site/#warning">Warning</a>',
	);
	await assertFileIncludes(
		path.join(siteProjectRoot, 'dist', 'index.html'),
		'--section-background-color: #000000',
	);
	await assertFileIncludes(
		path.join(siteProjectRoot, 'dist', 'index.html'),
		'--section-background-color: #171717',
	);
	await assertFileIncludes(
		path.join(siteProjectRoot, 'dist', 'index.html'),
		'--section-background-color: #252525',
	);
	await assertFileIncludes(
		path.join(siteProjectRoot, 'dist', 'index.html'),
		'--site-top-background-color: #000000',
	);
	await assertFileIncludes(
		path.join(siteProjectRoot, 'dist', 'index.html'),
		'--site-top-text-color: #f2eee6',
	);
	await assertFileIncludes(
		path.join(siteProjectRoot, 'dist', 'index.html'),
		'--site-footer-background-color: #000000',
	);
	await assertFileIncludes(
		path.join(siteProjectRoot, 'dist', 'index.html'),
		'--site-footer-text-color: #f2eee6',
	);
	await assertFileIncludes(
		path.join(siteProjectRoot, 'dist', 'index.html'),
		'--section-text-color: #f2eee6',
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
	const siteContentPath = path.join(siteProjectRoot, 'site', 'content.md');
	const siteContent = await readFile(siteContentPath, 'utf8');
	const siteThemePath = path.join(siteProjectRoot, 'site', 'theme.md');
	const siteTheme = await readFile(siteThemePath, 'utf8');
	await writeFile(siteThemePath, siteTheme.replace('\n  preset: quiet-gallery', '\n  preset: noisy-gallery'));
	await runExpectFailure(
		npxBin,
		['norna', 'build'],
		{ cwd: siteProjectRoot, env: npmEnv },
		'typography.preset',
	);
	await writeFile(
		siteThemePath,
		siteTheme.replace('\n  palette: dark', '\n  palette: neon'),
	);
	await runExpectFailure(
		npxBin,
		['norna', 'build'],
		{ cwd: siteProjectRoot, env: npmEnv },
		'presentation.palette',
	);
	await writeFile(
		siteThemePath,
		siteTheme.replace('  sectionSurfaces:\n    mode: cycle', '  sectionSurfaces:\n    mode: glowing'),
	);
	await runExpectFailure(
		npxBin,
		['norna', 'build'],
		{ cwd: siteProjectRoot, env: npmEnv },
		'presentation.sectionSurfaces.mode',
	);
	await writeFile(
		siteThemePath,
		siteTheme.replace(
			'  sectionSurfaces:\n    mode: cycle',
			'  sectionSurfaces:\n    mode: cycle\n    sequence: [base, base]',
		),
	);
	await runExpectFailure(
		npxBin,
		['norna', 'build'],
		{ cwd: siteProjectRoot, env: npmEnv },
		'presentation.sectionSurfaces',
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
			'description: Site used by package checks.\npresentation:\n  typography:\n    overrides:\n      body:\n        lineHeight: tight',
		),
	);
	await runExpectFailure(
		npxBin,
		['norna', 'build'],
		{ cwd: siteProjectRoot, env: npmEnv },
		'presentation',
	);
	await writeFile(
		siteContentPath,
		siteContent.replace(
			'  intro: {}',
			'  intro:\n    presentation:\n      typography:\n        overrides:\n          caption:\n            spacingBefore: wide',
		),
	);
	await runExpectFailure(
		npxBin,
		['norna', 'build'],
		{ cwd: siteProjectRoot, env: npmEnv },
		'sections.intro: Unrecognized key: "presentation"',
	);
	await writeFile(
		siteContentPath,
		siteContent.replace(
			'  intro: {}',
			'  intro:\n    presentation:\n      typography:\n        preset: dramatic',
		),
	);
	await runExpectFailure(
		npxBin,
		['norna', 'build'],
		{ cwd: siteProjectRoot, env: npmEnv },
		'sections.intro: Unrecognized key: "presentation"',
	);
	await writeFile(
		siteThemePath,
		siteTheme.replace(
			'fontFamily: "Arial, \'Helvetica Neue\', Helvetica, sans-serif"',
			'fontFamily: "Arial; color: red"',
		),
	);
	await runExpectFailure(
		npxBin,
		['norna', 'config:check'],
		{ cwd: siteProjectRoot, env: npmEnv },
		'typography.fontFamily',
	);
	await writeFile(siteThemePath, siteTheme);
	const siteConfigPath = path.join(siteProjectRoot, 'site', 'config.mjs');
	const siteConfig = await readFile(siteConfigPath, 'utf8');
	await writeFile(
		siteConfigPath,
		siteConfig.replace("basePath: '/site/'", "basePath: 'site'"),
	);
	await runExpectFailure(
		npxBin,
		['norna', 'config:check'],
		{ cwd: siteProjectRoot, env: npmEnv },
		'site.basePath',
	);

	console.log('Package check passed.');
} finally {
	await rm(tempRoot, { force: true, recursive: true });
}
