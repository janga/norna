import assert from 'node:assert/strict';
import { cp, mkdtemp, mkdir, readFile, writeFile, rm, unlink } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { load } from 'js-yaml';
import { selectPageTheme } from './lib/theme-packages.mjs';
import { resolveThemeConfig } from './lib/theme-presets.mjs';
import { resolvePagePresentation } from './lib/presentation.mjs';
import { getSourceFileDefinition } from './lib/source-files.mjs';

const fixture = async (run) => {
	const siteRoot = await mkdtemp(path.join(os.tmpdir(), 'norna-theme-inheritance-'));
	const put = async (file, source) => { const filename = path.join(siteRoot, 'root', file); await mkdir(path.dirname(filename), { recursive: true }); await writeFile(filename, source); return filename; };
	const resolve = async (pageDirectory = '.', sources) => selectPageTheme({ siteRoot, pageDirectory, sources });
	try { await run({ siteRoot, put, resolve }); } finally { await rm(siteRoot, { recursive: true, force: true }); }
};

test('root theme and its preset are required, optional empty themes preserve inheritance', () => fixture(async ({ put, resolve }) => {
	await assert.rejects(resolve(), /tree-theme.yaml is required/);
	await put('tree-theme.yaml', 'palette: warm-paper\n');
	await assert.rejects(resolve(), /preset/);
	await put('tree-theme.yaml', 'preset: project\npalette: warm-paper\n');
	await put('pages/010-guide/tree-theme.yaml', '# No modifications\n');
	const result = await resolve('010-guide');
	assert.equal(result.selected.config.palette, 'warm-paper');
	assert.equal(result.selected.config.preset, 'project');
}));

test('nested fields inherit, page themes stay local, and deletion resumes inheritance', () => fixture(async ({ siteRoot, put, resolve }) => {
	await put('tree-theme.yaml', 'preset: project\npalette: warm-paper\nlayout:\n  textWidth: wide\n  contentSpacing: spacious\n');
	await put('page-theme.yaml', 'preset: statement\n');
	const parent = await put('pages/010-guide/tree-theme.yaml', 'layout:\n  textWidth: narrow\n');
	const local = await put('pages/010-guide/page-theme.yaml', 'appearance:\n  default: dark\n');
	const child = '010-guide/pages/020-install';
	await put(`pages/${child}/page-theme.yaml`, 'corners: square\n');
	const own = await resolve('010-guide');
	assert.equal(own.selected.config.appearance.default, 'dark');
	assert.equal(own.selected.config.preset, 'project');
	const before = await resolve(child);
	assert.equal(before.selected.config.appearance, undefined);
	assert.deepEqual(before.selected.config.layout, { textWidth: 'narrow', contentSpacing: 'spacious' });
	assert.equal(before.selected.config.palette, 'warm-paper');
	assert.equal(before.selected.config.corners, 'square');
	// The editor overlay must replace disk content without reading another site.
	const overlay = await resolve(child, new Map([[parent, 'layout:\n  textWidth: normal\n']]));
	assert.equal(overlay.selected.config.layout.textWidth, 'normal');
	assert.equal((await resolve(child)).selected.config.layout.textWidth, 'narrow');
	await unlink(parent); await unlink(local);
	assert.equal((await resolve(child)).selected.config.layout.textWidth, 'wide');
	assert.equal(getSourceFileDefinition(siteRoot, path.join(siteRoot, 'root/tree-theme.yaml')).required, true);
	assert.equal(getSourceFileDefinition(siteRoot, path.join(siteRoot, 'root/page-theme.yaml')).required, false);
	assert.equal(getSourceFileDefinition(siteRoot, path.join(siteRoot, 'root/pages/000-home/tree-theme.yaml')), null);
}));

test('an explicit preset resets every ancestor override, even the same preset; removing it resumes inheritance', () => fixture(async ({ put, resolve }) => {
	await put('tree-theme.yaml', 'preset: project\npalette: warm-paper\nlayout:\n  textWidth: wide\n');
	await put('pages/010-guide/tree-theme.yaml', 'preset: project\ncorners: square\n');
	let theme = (await resolve('010-guide')).selected.config;
	assert.equal(theme.palette, undefined);
	assert.equal(resolveThemeConfig(theme).palette, 'near-monochrome');
	assert.equal(resolveThemeConfig(theme).layout.textWidth, 'normal');
	await put('pages/010-guide/page-theme.yaml', 'preset: documentation\n');
	assert.equal((await resolve('010-guide')).selected.config.preset, 'documentation');
	assert.equal((await resolve('010-guide/pages/020-child')).selected.config.preset, 'project');
	await put('pages/010-guide/tree-theme.yaml', 'corners: square\n');
	theme = (await resolve('010-guide/pages/020-child')).selected.config;
	assert.equal(theme.palette, 'warm-paper');
	assert.equal(theme.layout.textWidth, 'wide');
}));

test('resolved combinations retain image, navigation and typography contracts', () => fixture(async ({ put, resolve }) => {
	await put('tree-theme.yaml', 'preset: portfolio\nimages:\n  maxAvailableHeightPercent: 60\n');
	await put('pages/010-guide/tree-theme.yaml', 'images:\n  presentation: prose-aligned\n');
	assert.equal(resolveThemeConfig((await resolve('010-guide')).selected.config).images.maxAvailableHeightPercent, undefined);
	await put('pages/010-guide/tree-theme.yaml', 'images:\n  presentation: prose-aligned\n  maxAvailableHeightPercent: 70\n');
	await assert.rejects(resolve('010-guide'), /cannot be used with images.presentation/);
	await put('pages/010-guide/tree-theme.yaml', 'typography:\n  overrides:\n    headings:\n      h1:\n        size: small\n      h2:\n        size: xlarge\n');
	await assert.rejects(resolve('010-guide'), /Typography must preserve/);
	await put('pages/010-guide/tree-theme.yaml', 'sections:\n  backgroundPattern: alternating\n');
	const theme = (await resolve('010-guide/pages/020-child')).selected;
	assert.throws(() => resolvePagePresentation(theme.config, theme.label, { navigationMode: 'tree' }), /cannot be used with tree navigation/);
	await put('pages/010-guide/tree-theme.yaml', 'preset: documentation\n');
	assert.doesNotThrow(() => resolvePagePresentation({ preset: 'documentation' }, 'example', { navigationMode: 'tree' }));
}));

test('explicit site roots do not reuse the selected process site', () => fixture(async (first) => fixture(async (second) => {
	await first.put('tree-theme.yaml', 'preset: portfolio\n');
	await second.put('tree-theme.yaml', 'preset: statement\n');
	const [a,b] = await Promise.all([first.resolve(),second.resolve()]);
	assert.equal(a.selected.config.preset, 'portfolio');
	assert.equal(b.selected.config.preset, 'statement');
})));

test('rendered pages use their own complete theme; generated pages use the root tree', async () => {
	const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
	const cacheRoot = path.join(repoRoot, 'node_modules/.cache');
	await mkdir(cacheRoot, { recursive: true });
	const projectRoot = await mkdtemp(path.join(cacheRoot, 'norna-theme-render-'));
	const siteRoot = path.join(projectRoot, 'site');
	try {
		await cp(path.join(repoRoot, 'fixtures/theme-inheritance/site'), siteRoot, {
			recursive: true,
			filter: (filename) => path.basename(filename) !== '.norna',
		});
		const build = spawnSync(process.execPath, [path.join(repoRoot, 'bin/norna.mjs'), '--site-dir', siteRoot, 'build'], {
			cwd: repoRoot,
			encoding: 'utf8',
			maxBuffer: 10 * 1024 * 1024,
		});
		assert.equal(build.status, 0, `${build.stdout}\n${build.stderr}`);
		const html = (route) => readFile(path.join(projectRoot, 'dist', route), 'utf8');
		const root = await html('index.html');
		const inherited = await html('inherited/child/index.html');
		const replaced = await html('replacement/index.html');
		const local = await html('page-only/index.html');
		const localChild = await html('page-only/child/index.html');
		const samePreset = await html('same-preset/index.html');
		assert.match(root, /--palette-light-page-background: #fdf6e3/);
		assert.match(inherited, /--palette-light-page-background: #e8f1f8/);
		assert.match(inherited, /data-reading-width="narrow"/);
		assert.match(replaced, /--font-sans: Georgia, 'Times New Roman', serif/);
		assert.match(replaced, /--palette-dark-page-background: #1b1916/);
		assert.match(local, /--font-sans: 'Trebuchet MS'/);
		assert.match(localChild, /--font-sans: system-ui/);
		assert.match(localChild, /--palette-light-page-background: #e8f1f8/);
		assert.match(localChild, /data-reading-width="wide"/);
		assert.match(samePreset, /--palette-light-page-background: #f7f7f5/);
		assert.match(samePreset, /data-reading-width="standard"/);
		for (const route of ['search/index.html', '404.html']) {
			const generated = await html(route);
			assert.match(generated, /--palette-light-page-background: #e8f1f8/, route);
			assert.match(generated, /--font-sans: system-ui/, route);
		}
		const inspect = spawnSync(process.execPath, [path.join(repoRoot, 'bin/norna.mjs'), '--site-dir', siteRoot, 'typography', 'show'], {
			cwd: repoRoot, encoding: 'utf8',
		});
		assert.equal(inspect.status, 0, inspect.stderr);
		const { pages } = load(inspect.stdout);
		assert.equal(pages['/page-only/'].typography.profile.value, 'statement');
		assert.equal(pages['/page-only/child/'].typography.profile.value, 'reading');
		assert.equal(pages['/inherited/child/'].typography.resolved.body.width.value, 'narrow');
		assert.match(pages['/inherited/child/'].typography.resolved.body.width.source, /010-inherited\/tree-theme\.yaml$/);
		assert.match(pages['/replacement/'].typography.fontFamily.value, /Georgia/);
		assert.match(pages['/same-preset/'].typography.resolved.body.width.source, /preset:project.*040-same-preset\/tree-theme\.yaml/);
	} finally {
		await rm(projectRoot, { recursive: true, force: true });
	}
});
