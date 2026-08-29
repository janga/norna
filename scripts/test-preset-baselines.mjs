import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createServer } from 'node:http';
import {
	cp,
	mkdir,
	mkdtemp,
	readFile,
	rm,
	stat,
	writeFile,
} from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const args = process.argv.slice(2);
const capture = args.includes('--capture');
const unknownArgs = args.filter((arg) => arg !== '--capture');
if (unknownArgs.length > 0) {
	throw new Error('Usage: node scripts/test-preset-baselines.mjs [--capture]');
}

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const cliPath = path.join(repoRoot, 'bin', 'norna.mjs');
const fixtureSiteDir = path.join(repoRoot, 'fixtures', 'preset-baseline', 'site');
const outputDir = path.join(repoRoot, 'tests', 'preset-baselines');
const imageOutputDir = path.join(outputDir, 'images');
const tempParent = path.join(repoRoot, 'node_modules', '.cache');

const presets = Object.freeze({
	portfolio: Object.freeze({
		colorMode: 'dark',
		fontFamily: "'Helvetica Neue', Arial, sans-serif",
		imageWidth: '1000px',
		lightPage: '#f7f7f5',
		darkPage: '#000000',
		pageWidth: '1240px',
		sectionGap: 'clamp(1.4rem, 3vw, 2.75rem)',
		shapeRadius: '0',
		surfaces: ['base'],
		textWidth: 'min(72ch, var(--image-layout-width))',
	}),
	documentation: Object.freeze({
		colorMode: 'system',
		fontFamily: "Georgia, 'Times New Roman', serif",
		imageWidth: '920px',
		lightPage: '#f8f5ee',
		darkPage: '#1b1916',
		pageWidth: '1240px',
		sectionGap: 'clamp(1.2rem, 2.4vw, 2.25rem)',
		shapeRadius: '8px',
		surfaces: ['base', 'soft'],
		textWidth: 'min(60ch, var(--text-width))',
	}),
	project: Object.freeze({
		colorMode: 'system',
		fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
		imageWidth: '840px',
		lightPage: '#ffffff',
		darkPage: '#0f1512',
		pageWidth: '1120px',
		sectionGap: 'clamp(1.2rem, 2.4vw, 2.25rem)',
		shapeRadius: '8px',
		surfaces: ['base', 'soft'],
		textWidth: 'min(72ch, var(--text-width))',
	}),
	statement: Object.freeze({
		colorMode: 'system',
		fontFamily: "'Trebuchet MS', 'Helvetica Neue', Arial, sans-serif",
		imageWidth: '1080px',
		lightPage: '#f8f5ee',
		darkPage: '#1b1916',
		pageWidth: '1280px',
		sectionGap: 'clamp(2.25rem, 5vw, 4.5rem)',
		shapeRadius: '0',
		surfaces: ['base', 'soft', 'emphasis'],
		textWidth: 'min(72ch, var(--text-width))',
	}),
});

const viewports = Object.freeze({
	desktop: Object.freeze({ width: 1440, height: 1000 }),
	mobile: Object.freeze({ width: 390, height: 844 }),
});
const colorModes = Object.freeze(['light', 'dark']);
const captureRoute = 'guide/components/';

const runBuild = (siteDir) => {
	const result = spawnSync(process.execPath, [
		cliPath,
		'--site-dir',
		siteDir,
		'build',
	], {
		cwd: repoRoot,
		encoding: 'utf8',
		env: process.env,
		maxBuffer: 20 * 1024 * 1024,
	});

	if (result.status !== 0) {
		throw new Error(
			'Preset baseline build failed for ' + siteDir + '.\n'
			+ (result.stderr || result.stdout),
		);
	}
};

const buildPresets = async (tempRoot) => {
	const builds = new Map();

	for (const presetName of Object.keys(presets)) {
		const projectRoot = path.join(tempRoot, presetName);
		const siteDir = path.join(projectRoot, 'site');
		await cp(fixtureSiteDir, siteDir, {
			filter: (source) => path.basename(source) !== '.norna',
			recursive: true,
		});
		await writeFile(path.join(siteDir, 'theme.yaml'), 'preset: ' + presetName + '\n');
		runBuild(siteDir);
		builds.set(presetName, path.join(projectRoot, 'dist'));
	}

	return builds;
};

const assertIncludes = (source, expected, label) => {
	assert.ok(source.includes(expected), label + ' must include: ' + expected);
};

const assertPresetOutput = async (presetName, distDir) => {
	const expected = presets[presetName];
	const htmlPath = path.join(distDir, ...captureRoute.split('/').filter(Boolean), 'index.html');
	const html = await readFile(htmlPath, 'utf8');

	assertIncludes(html, 'data-navigation-mode="tree"', presetName);
	assertIncludes(html, 'data-color-mode="' + expected.colorMode + '"', presetName);
	assertIncludes(html, '--page-width: ' + expected.pageWidth, presetName);
	assertIncludes(html, '--font-sans: ' + expected.fontFamily, presetName);
	assertIncludes(html, '--image-width: ' + expected.imageWidth, presetName);
	assertIncludes(html, '--shape-radius-large: ' + expected.shapeRadius, presetName);
	assertIncludes(html, '--space-section-to-section-desktop: ' + expected.sectionGap, presetName);
	assertIncludes(html, '--section-body-width-desktop: ' + expected.textWidth, presetName);
	assertIncludes(html, '--palette-light-page-background: ' + expected.lightPage, presetName);
	assertIncludes(html, '--palette-dark-page-background: ' + expected.darkPage, presetName);

	for (const surface of expected.surfaces) {
		assertIncludes(
			html,
			'--section-background-color: var(--color-surface-' + surface + '-background)',
			presetName,
		);
	}
	if (!expected.surfaces.includes('soft')) {
		assert.ok(
			!html.includes('--section-background-color: var(--color-surface-soft-background)'),
			presetName + ' must retain uniform rendered section surfaces',
		);
	}
	if (!expected.surfaces.includes('emphasis')) {
		assert.ok(
			!html.includes('--section-background-color: var(--color-surface-emphasis-background)'),
			presetName + ' must not render emphasis surfaces',
		);
	}

	for (const marker of [
		'>Components</h1>',
		'>Reading and hierarchy</h2>',
		'>A level-three heading</h3>',
		'>A level-four heading</h4>',
		'class="section-note ',
		'class="image-stack"',
		'data-carousel',
		'class="card-list ',
		'class="site-banner ',
		'class="site-footer"',
	]) {
		assertIncludes(html, marker, presetName);
	}
};

const contentTypes = Object.freeze({
	'.css': 'text/css; charset=utf-8',
	'.html': 'text/html; charset=utf-8',
	'.ico': 'image/x-icon',
	'.jpeg': 'image/jpeg',
	'.jpg': 'image/jpeg',
	'.js': 'text/javascript; charset=utf-8',
	'.json': 'application/json; charset=utf-8',
	'.png': 'image/png',
	'.svg': 'image/svg+xml',
	'.webp': 'image/webp',
});

const startStaticServer = (distDir) => new Promise((resolve, reject) => {
	const root = path.resolve(distDir);
	const server = createServer(async (request, response) => {
		try {
			const pathname = decodeURIComponent(new URL(request.url, 'http://127.0.0.1/').pathname);
			let relativePath = pathname.replace(/^\/+/, '');
			if (relativePath === '' || relativePath.endsWith('/')) {
				relativePath += 'index.html';
			}

			let filePath = path.resolve(root, relativePath);
			if (filePath !== root && !filePath.startsWith(root + path.sep)) {
				response.writeHead(403).end('Forbidden');
				return;
			}

			const fileStat = await stat(filePath).catch(() => null);
			if (fileStat?.isDirectory()) {
				filePath = path.join(filePath, 'index.html');
			}
			const source = await readFile(filePath).catch(() => null);
			if (!source) {
				response.writeHead(404).end('Not found');
				return;
			}

			response.writeHead(200, {
				'Content-Type': contentTypes[path.extname(filePath)] ?? 'application/octet-stream',
			});
			response.end(source);
		} catch (error) {
			response.writeHead(500).end(String(error));
		}
	});

	server.once('error', reject);
	server.listen(0, '127.0.0.1', () => {
		const address = server.address();
		resolve({
			baseUrl: 'http://127.0.0.1:' + address.port + '/',
			close: () => new Promise((closeResolve, closeReject) => {
				server.close((error) => error ? closeReject(error) : closeResolve());
			}),
		});
	});
});

const captureScreenshots = async (builds) => {
	const { chromium } = await import('@playwright/test');
	await mkdir(outputDir, { recursive: true });
	await rm(imageOutputDir, { force: true, recursive: true });
	await mkdir(imageOutputDir, { recursive: true });
	const browser = await chromium.launch({ headless: true });

	try {
		for (const [presetName, distDir] of builds) {
			const server = await startStaticServer(distDir);
			try {
				for (const [viewportName, viewport] of Object.entries(viewports)) {
					for (const mode of colorModes) {
						const page = await browser.newPage({ viewport });
						await page.goto(server.baseUrl + captureRoute, { waitUntil: 'networkidle' });
						await page.evaluate((selectedMode) => {
							document.documentElement.dataset.colorMode = selectedMode;
						}, mode);
						await page.addStyleTag({
							content: '*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}',
						});
						await page.waitForSelector('[data-carousel-ready="true"]');
						await page.waitForFunction(() => (
							Array.from(document.images).every((image) => image.complete)
						));
						await page.evaluate(() => document.fonts.ready);

						const filename = presetName + '-' + viewportName + '-' + mode + '.jpg';
						await page.screenshot({
							animations: 'disabled',
							fullPage: true,
							path: path.join(imageOutputDir, filename),
							quality: 84,
							type: 'jpeg',
						});
						await page.close();
					}
				}
			} finally {
				await server.close();
			}
		}
	} finally {
		await browser.close();
	}

	await writeFile(path.join(outputDir, 'manifest.json'), JSON.stringify({
		colorModes,
		note: 'Reference images only; system-font rendering makes pixel-perfect cross-platform assertions unsuitable.',
		presets: Object.keys(presets),
		route: '/' + captureRoute,
		viewports,
	}, null, 2) + '\n');
};

await mkdir(tempParent, { recursive: true });
const tempRoot = await mkdtemp(path.join(tempParent, 'norna-preset-baselines-'));

try {
	const builds = await buildPresets(tempRoot);
	for (const [presetName, distDir] of builds) {
		await assertPresetOutput(presetName, distDir);
	}

	if (capture) {
		await captureScreenshots(builds);
		console.log('Captured 16 preset baseline screenshots in tests/preset-baselines.');
	} else {
		console.log('ok - all presets build the shared baseline fixture with characterized output');
	}
} finally {
	await rm(tempRoot, { force: true, recursive: true });
}
