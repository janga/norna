import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getExampleSites } from './lib/example-sites.mjs';
import { runInherit } from './lib/run-command.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const cliPath = path.join(root, 'bin', 'norna.mjs');
const examples = await getExampleSites(root);

const discoveryRoot = await mkdtemp(path.join(tmpdir(), 'norna-example-discovery-'));
try {
	for (const category of ['complete-sites', 'feature-demos']) {
		await mkdir(path.join(discoveryRoot, 'examples', category), { recursive: true });
	}
	const validSite = path.join(discoveryRoot, 'examples', 'complete-sites', 'valid', 'site');
	await mkdir(path.join(validSite, 'pages', '000-home'), { recursive: true });
	await writeFile(path.join(validSite, 'config.yaml'), 'url: https://example.com/\n');
	await writeFile(path.join(validSite, 'pages', '000-home', 'content.md'), '# Example\n');
	await mkdir(path.join(
		discoveryRoot,
		'examples',
		'feature-demos',
		'removed-example',
		'site',
		'.norna',
		'public',
		'images',
		'generated',
	), { recursive: true });

	const discovered = await getExampleSites(discoveryRoot);
	assert.deepEqual(discovered.map(({ name }) => name), ['valid']);
} finally {
	await rm(discoveryRoot, { recursive: true, force: true });
}

for (const example of examples) {
	console.log(`\nBuilding ${example.siteLabel}`);
	await runInherit(process.execPath, [cliPath, '--site-dir', example.siteLabel, 'build'], { cwd: root });

	if (['svg', 'png', 'jpg', 'jpeg'].some((extension) => existsSync(path.join(example.siteDirectory, 'public', `logo.${extension}`)))) {
		const homepageHtml = await readFile(path.join(root, 'dist', 'index.html'), 'utf8');
		if (!homepageHtml.includes('class="site-brand-logo"')) {
			throw new Error(`Example ${example.siteLabel} has a logo file that is not rendered on its homepage.`);
		}
	}

	if (example.name.startsWith('theme-preset-')) {
		const homepageHtml = await readFile(path.join(root, 'dist', 'index.html'), 'utf8');
		assert.match(homepageHtml, /data-navigation-mode="sections"/);
		assert.match(homepageHtml, /class="page-nav-page-top"[^>]*>[^<]+<\/a>/);
		for (const sectionId of ['preset-purpose', 'reading-rhythm', 'images-and-captions']) {
			assert.match(homepageHtml, new RegExp(`href="#${sectionId}"`));
		}
	}

	if (example.name === 'media-and-surfaces') {
		const mediaHtml = await readFile(path.join(root, 'dist', 'media', 'index.html'), 'utf8');
		assert.match(mediaHtml, /data-navigation-mode="tree"/);
		assert.match(mediaHtml, /class="tree-local-navigation"/);
	}
}

console.log(`\nok - built ${examples.length} example sites`);
