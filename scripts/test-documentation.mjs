import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { renderThemePresetComparison } from './build-theme-preset-comparison.mjs';
import { presentationPaletteNames } from './lib/presentation-palette-metadata.mjs';
import { themePresetNames, themePresets } from './lib/theme-presets.mjs';

const repoRoot = path.resolve(import.meta.dirname, '..');
const obsoleteSourceReferences = [
	'site/content.md',
	'site/images/',
	'site/config.md',
	'site/theme.md',
	'site/sitewide-content.md',
	'site/routes/',
	'route-content.md',
	'docs/routes.md',
	'docs/site-structure.md',
];
const obsoleteSiteFilenames = new Set([
	'config.md',
	'theme.md',
	'sitewide-content.md',
	'route-content.md',
]);
const ignoredSiteDirectories = new Set(['.astro', '.norna', 'dist', 'node_modules']);
const obsoleteReferenceDocumentation = new Set([
	path.join(repoRoot, 'docs', 'upgrading.md'),
]);

const collectMarkdownFiles = async (directory) => {
	const files = [];
	for (const entry of await readdir(directory, { withFileTypes: true })) {
		const entryPath = path.join(directory, entry.name);
		if (entry.isDirectory()) {
			files.push(...await collectMarkdownFiles(entryPath));
		} else if (entry.name.endsWith('.md')) {
			files.push(entryPath);
		}
	}
	return files;
};

const collectFiles = async (directory) => {
	const files = [];
	for (const entry of await readdir(directory, { withFileTypes: true })) {
		const entryPath = path.join(directory, entry.name);
		if (entry.isDirectory()) {
			if (ignoredSiteDirectories.has(entry.name)) continue;
			files.push(...await collectFiles(entryPath));
		} else {
			files.push(entryPath);
		}
	}
	return files;
};

const checkLocalMarkdownLinks = async () => {
	const markdownFiles = [
		path.join(repoRoot, 'README.md'),
		...await collectMarkdownFiles(path.join(repoRoot, 'docs')),
		...await collectMarkdownFiles(path.join(repoRoot, 'examples')),
	];
	const missing = [];

	for (const markdownPath of markdownFiles) {
		const source = await readFile(markdownPath, 'utf8');
		const prose = source
			.replace(/(```+|~~~+)[\s\S]*?\1/g, '')
			.replace(/`[^`\n]*`/g, '');
		for (const match of prose.matchAll(/!?\[[^\]]*\]\(([^)]+)\)/g)) {
			const target = match[1].trim().replace(/^<|>$/g, '');
			if (/^(?:[a-z]+:|#|\/)/i.test(target)) continue;

			const targetPath = decodeURIComponent(target.split('#', 1)[0].split('?', 1)[0]);
			if (!targetPath) continue;
			const resolved = path.resolve(path.dirname(markdownPath), targetPath);
			if (!existsSync(resolved)) {
				missing.push(`${path.relative(repoRoot, markdownPath)} -> ${target}`);
			}
		}
	}

	assert.deepEqual(missing, [], `Broken local Markdown links:\n${missing.join('\n')}`);
};

const checkObsoleteDocumentationReferences = async () => {
	const markdownFiles = [
		path.join(repoRoot, 'README.md'),
		...await collectMarkdownFiles(path.join(repoRoot, 'docs')),
		...await collectMarkdownFiles(path.join(repoRoot, 'examples')),
		...await collectMarkdownFiles(path.join(repoRoot, 'starters')),
	];
	const obsolete = [];

	for (const markdownPath of markdownFiles) {
		if (obsoleteReferenceDocumentation.has(markdownPath)) continue;
		const source = await readFile(markdownPath, 'utf8');
		for (const reference of obsoleteSourceReferences) {
			if (source.includes(reference)) {
				obsolete.push(`${path.relative(repoRoot, markdownPath)} -> ${reference}`);
			}
		}
	}

	assert.deepEqual(obsolete, [], `Obsolete Norna source references:\n${obsolete.join('\n')}`);
};

const checkObsoleteSiteFiles = async () => {
	const siteRoots = [
		path.join(repoRoot, 'site'),
		path.join(repoRoot, 'starters'),
		path.join(repoRoot, 'examples'),
		path.join(repoRoot, 'fixtures'),
	];
	const files = (await Promise.all(siteRoots.map(collectFiles))).flat();
	const obsolete = files
		.filter((filePath) => (
			obsoleteSiteFilenames.has(path.basename(filePath))
			|| filePath.split(path.sep).includes('routes')
		))
		.map((filePath) => path.relative(repoRoot, filePath));

	assert.deepEqual(obsolete, [], `Obsolete Norna site files:\n${obsolete.join('\n')}`);
};

const formatList = (values) => {
	if (values.length < 2) return values[0] ?? '';
	if (values.length === 2) return values.join(' and ');
	return `${values.slice(0, -1).join(', ')}, and ${values.at(-1)}`;
};

const formatReaderControls = (readerControls) => {
	const labels = {
		appearance: 'Appearance',
		focusReading: 'Focus reading',
	};
	const enabled = Object.keys(labels).filter((name) => readerControls[name] === true).map((name) => labels[name]);
	const disabled = Object.keys(labels).filter((name) => readerControls[name] !== true).map((name) => labels[name]);
	const value = [
		`${formatList(enabled)} enabled`,
		disabled.length > 0 ? `${formatList(disabled)} disabled` : '',
	].filter(Boolean).join('; ');

	return `Reading width always available; ${value}`;
};

const checkThemePresetReference = async () => {
	const source = await readFile(path.join(repoRoot, 'docs', 'theme.md'), 'utf8');
	assert.ok(
		source.includes('https://janga.github.io/norna/examples/theme-presets/'),
		'docs/theme.md is missing the shared theme preset comparison.',
	);

	for (const presetName of themePresetNames) {
		const heading = `### \`${presetName}\``;
		const start = source.indexOf(heading);
		assert.notEqual(start, -1, `docs/theme.md is missing ${heading}.`);
		const remainder = source.slice(start + heading.length);
		const boundary = remainder.search(/\n#{2,3} /);
		const section = source.slice(start, boundary === -1 ? undefined : start + heading.length + boundary);
		const preset = themePresets[presetName];
		const surface = preset.sections.backgroundPattern === 'uniform'
			? '`uniform`'
			: `\`${preset.sections.backgroundPattern}\`; resolves to \`uniform\` with tree navigation`;
		const rows = [
			['palette', `\`${preset.palette}\``],
			['appearance.default', `\`${preset.appearance.default}\``],
			['typography.fontFamily', `\`${preset.typography.fontFamily}\``],
			['typography.profile', `\`${preset.typography.profile}\``],
			['typography.rhythm', `\`${preset.typography.rhythm}\``],
			['layout.textWidth', `\`${preset.layout.textWidth}\``],
			['layout.contentSpacing', `\`${preset.layout.contentSpacing}\``],
			['layout.pageWidth', `\`${preset.layout.pageWidth}\``],
			['layout.gutter', `Desktop \`${preset.layout.gutter.desktop}\`; mobile \`${preset.layout.gutter.mobile}\``],
			['images.presentation', `\`${preset.images.presentation}\``],
			['images.width', `\`${preset.images.width}\``],
			['images.maxAvailableWidthPercent', `Desktop and mobile \`${preset.images.maxAvailableWidthPercent.desktop}\``],
			...(preset.images.maxAvailableHeightPercent
				? [[
					'images.maxAvailableHeightPercent',
					`Desktop \`${preset.images.maxAvailableHeightPercent.desktop}\`; mobile \`${preset.images.maxAvailableHeightPercent.mobile}\``,
				]]
				: []),
			['corners', `\`${preset.corners}\``],
			['sections.backgroundPattern', surface],
			['Reader Display', formatReaderControls(preset.readerControls)],
		];

		for (const [setting, value] of rows) {
			const settingLabel = setting === 'Reader Display' ? setting : `\`${setting}\``;
			const row = `| ${settingLabel} | ${value} |`;
			assert.ok(section.includes(row), `docs/theme.md ${presetName} reference is missing: ${row}`);
		}
		if (!preset.images.maxAvailableHeightPercent) {
			assert.doesNotMatch(
				section,
				/\| `images\.maxAvailableHeightPercent` \|/,
				`docs/theme.md ${presetName} should not document an inactive viewport-height limit.`,
			);
		}

		const exampleUrl = `https://janga.github.io/norna/examples/feature-demos/theme-preset-${presetName}/`;
		assert.ok(section.includes(exampleUrl), `docs/theme.md ${presetName} reference is missing its rendered example.`);
	}

	for (const paletteName of presentationPaletteNames) {
		assert.ok(
			source.includes(`| \`${paletteName}\` |`),
			`docs/theme.md is missing the ${paletteName} palette reference.`,
		);
	}
	assert.ok(!source.includes('`cool-green`'), 'docs/theme.md still documents the removed cool-green palette.');
};

const checkThemeExplorer = () => {
	const source = renderThemePresetComparison();
	for (const presetName of themePresetNames) {
		assert.ok(source.includes(`<option value="${presetName}">`), `Theme explorer is missing preset ${presetName}.`);
	}
	for (const paletteName of presentationPaletteNames) {
		assert.ok(source.includes(`<option value="${paletteName}">`), `Theme explorer is missing palette ${paletteName}.`);
	}
	for (const marker of [
		'data-preset-select',
		'data-palette-select',
		'data-appearance-select',
		'data-theme-config',
		'data-theme-frame',
		"const values = new URLSearchParams",
		"frameDocument.querySelectorAll('[data-reader-appearance]')",
	]) {
		assert.ok(source.includes(marker), `Theme explorer is missing: ${marker}`);
	}
	const scripts = [...source.matchAll(/<script>([\s\S]*?)<\/script>/g)];
	assert.ok(scripts.length > 0, 'Theme explorer is missing its client script.');
	assert.doesNotThrow(
		() => new Function(scripts.at(-1)[1]),
		'Theme explorer client script must be valid JavaScript.',
	);
};

const checkSitemapReference = async () => {
	const publicFiles = await readFile(path.join(repoRoot, 'docs', 'public-files.md'), 'utf8');
	const publishing = await readFile(path.join(repoRoot, 'docs', 'publishing.md'), 'utf8');

	for (const expectedText of [
		'## Generated Sitemap',
		'`navigation.listed: false`',
		'`site/.norna/public/sitemap.xml`',
		'`dist/sitemap.xml`',
	]) {
		assert.ok(publicFiles.includes(expectedText), `Public-files reference is missing: ${expectedText}`);
	}
	assert.doesNotMatch(
		publishing,
		/Site-specific public files[^.]*`sitemap\.xml` belong in the site repository/s,
		'Publishing reference still describes sitemap.xml as a site-owned source file.',
	);
};

await checkLocalMarkdownLinks();
await checkObsoleteDocumentationReferences();
await checkObsoleteSiteFiles();
await checkThemePresetReference();
await checkSitemapReference();
checkThemeExplorer();

const llms = await readFile(path.join(repoRoot, 'site', 'public', 'llms.txt'), 'utf8');
for (const match of llms.matchAll(/https:\/\/raw\.githubusercontent\.com\/janga\/norna\/main\/([^\s)]+)/g)) {
	assert.ok(existsSync(path.join(repoRoot, decodeURIComponent(match[1]))), `llms.txt target is missing: ${match[1]}`);
}

console.log('ok - documentation links, source references, preset defaults, and llms.txt targets resolve');
