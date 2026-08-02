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
const tempRoot = await mkdtemp(path.join(tmpdir(), 'cli-gallery-package-check-'));
const packDir = path.join(tempRoot, 'pack');
const unpackDir = path.join(tempRoot, 'unpack');
const siteProjectRoot = path.join(tempRoot, 'site-project');
const initializedSiteRoot = path.join(tempRoot, 'initialized-site');
const npmCachePath = path.resolve(
	repoRoot,
	process.env.CLI_GALLERY_PACKAGE_CHECK_CACHE
		?? path.join('node_modules', '.cache', 'cli-gallery-package-check-npm'),
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
	packageJson.name = 'cli-gallery-package-check-site';
	packageJson.dependencies['@janga/cli-gallery'] = tarballPath;
	await writeFile(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`);

	await runInherit(npmBin, ['install', '--no-audit', '--no-fund', '--prefer-offline', '--fetch-retries=0'], { cwd: siteProjectRoot, env: npmEnv });
	const cliGalleryBinPath = path.join(siteProjectRoot, 'node_modules', '.bin', process.platform === 'win32' ? 'cli-gallery.cmd' : 'cli-gallery');
	await runInherit(cliGalleryBinPath, ['init', initializedSiteRoot], { cwd: tempRoot, env: npmEnv });
	await Promise.all([
		assertFileExists(path.join(initializedSiteRoot, 'package.json')),
		assertFileExists(path.join(initializedSiteRoot, 'site', 'config.mjs')),
		assertFileMissing(path.join(initializedSiteRoot, '.DS_Store')),
		assertFileMissing(path.join(initializedSiteRoot, 'site', '.DS_Store')),
	]);
	await runInherit(npxBin, ['cli-gallery', 'engine:version'], { cwd: path.join(siteProjectRoot, 'site', 'images', 'work'), env: npmEnv });
	await runInherit(npxBin, ['cli-gallery', 'doctor'], { cwd: path.join(siteProjectRoot, 'site', 'images', 'work'), env: npmEnv });
	await runInherit(npxBin, ['cli-gallery', 'config:check'], { cwd: path.join(siteProjectRoot, 'site', 'images', 'work'), env: npmEnv });
	await runInherit(npxBin, ['cli-gallery', 'content:check'], { cwd: siteProjectRoot, env: npmEnv });
	await runInherit(npxBin, ['cli-gallery', 'build'], { cwd: siteProjectRoot, env: npmEnv });
	await assertFileExists(path.join(siteProjectRoot, 'site', '.cli-gallery', 'public', 'robots.txt'));
	await assertFileExists(path.join(siteProjectRoot, 'dist', 'robots.txt'));
	await assertFileMissing(path.join(siteProjectRoot, 'public', 'robots.txt'));
	await assertFileIncludes(
		path.join(siteProjectRoot, 'dist', 'index.html'),
		'--section-heading-font-size-desktop: clamp(1.65rem, 4.6vw, 5.65rem)',
	);
	await assertFileIncludes(
		path.join(siteProjectRoot, 'dist', 'index.html'),
		"--font-sans: Arial, 'Helvetica Neue', Helvetica, sans-serif",
	);
	await assertFileIncludes(
		path.join(siteProjectRoot, 'dist', 'index.html'),
		'--section-body-align-mobile: left',
	);
	await assertFileIncludes(
		path.join(siteProjectRoot, 'dist', 'index.html'),
		'--section-body-line-height: 1.78',
	);
	await assertFileIncludes(
		path.join(siteProjectRoot, 'dist', 'index.html'),
		'--section-body-paragraph-spacing: 1em',
	);
	await assertFileIncludes(
		path.join(siteProjectRoot, 'dist', 'index.html'),
		'--section-background-color: #000000',
	);
	await assertFileIncludes(
		path.join(siteProjectRoot, 'dist', 'index.html'),
		'--site-top-background-color: #000000',
	);
	await assertFileIncludes(
		path.join(siteProjectRoot, 'dist', 'index.html'),
		'--site-top-text-color: #f7f4ee',
	);
	await assertFileIncludes(
		path.join(siteProjectRoot, 'dist', 'index.html'),
		'--site-footer-background-color: #000000',
	);
	await assertFileIncludes(
		path.join(siteProjectRoot, 'dist', 'index.html'),
		'--site-footer-text-color: #f7f4ee',
	);
	await assertFileIncludes(
		path.join(siteProjectRoot, 'dist', 'index.html'),
		'--section-text-color: #f7f4ee',
	);
	const siteContentPath = path.join(siteProjectRoot, 'site', 'content.md');
	const siteContent = await readFile(siteContentPath, 'utf8');
	await writeFile(siteContentPath, siteContent.replace('desktop: center', 'desktop: sideways'));
	await runExpectFailure(
		npxBin,
		['cli-gallery', 'build'],
		{ cwd: siteProjectRoot, env: npmEnv },
		'defaultPresentation.heading.align.desktop',
	);
	await writeFile(
		siteContentPath,
		siteContent.replace('backgroundColor: "#000000"', 'backgroundColor: blue'),
	);
	await runExpectFailure(
		npxBin,
		['cli-gallery', 'build'],
		{ cwd: siteProjectRoot, env: npmEnv },
		'defaultPresentation.backgroundColor',
	);
	await writeFile(
		siteContentPath,
		siteContent.replace('textColor: "#f7f4ee"', 'textColor: white'),
	);
	await runExpectFailure(
		npxBin,
		['cli-gallery', 'build'],
		{ cwd: siteProjectRoot, env: npmEnv },
		'defaultPresentation.textColor',
	);
	await writeFile(
		siteContentPath,
		siteContent.replace('    lineHeight: 1.78', '    lineHeight: tight'),
	);
	await runExpectFailure(
		npxBin,
		['cli-gallery', 'build'],
		{ cwd: siteProjectRoot, env: npmEnv },
		'defaultPresentation.body.lineHeight',
	);
	await writeFile(
		siteContentPath,
		siteContent.replace(
			'      heading:\n        size: large',
			'      body:\n        paragraphSpacing: wide',
		),
	);
	await runExpectFailure(
		npxBin,
		['cli-gallery', 'build'],
		{ cwd: siteProjectRoot, env: npmEnv },
		'sections.0.presentation.body.paragraphSpacing',
	);
	await writeFile(
		siteContentPath,
		siteContent.replace('        size: large', '        size: huge'),
	);
	await runExpectFailure(
		npxBin,
		['cli-gallery', 'build'],
		{ cwd: siteProjectRoot, env: npmEnv },
		'sections.0.presentation.heading.size',
	);
	const siteConfigPath = path.join(siteProjectRoot, 'site', 'config.mjs');
	const siteConfig = await readFile(siteConfigPath, 'utf8');
	await writeFile(
		siteConfigPath,
		siteConfig.replace(
			'fontFamily: "Arial, \'Helvetica Neue\', Helvetica, sans-serif"',
			'fontFamily: "Arial; color: red"',
		),
	);
	await runExpectFailure(
		npxBin,
		['cli-gallery', 'config:check'],
		{ cwd: siteProjectRoot, env: npmEnv },
		'typography.fontFamily',
	);

	console.log('Package check passed.');
} finally {
	await rm(tempRoot, { force: true, recursive: true });
}
