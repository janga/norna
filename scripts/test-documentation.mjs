import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { mkdir, mkdtemp, readFile, readdir, rm, symlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const repoRoot = path.resolve(import.meta.dirname, '..');
const cliPath = path.join(repoRoot, 'bin', 'norna.mjs');
const tutorialPath = path.join(repoRoot, 'docs', 'getting-started.md');
const scratchRoot = path.join(repoRoot, 'todos');
await mkdir(scratchRoot, { recursive: true });
const tempRoot = await mkdtemp(path.join(scratchRoot, 'norna-documentation-'));
const tutorialSiteRoot = path.join(tempRoot, 'my-site');

const runCli = (args) => spawnSync(process.execPath, [cliPath, ...args], {
	cwd: repoRoot,
	encoding: 'utf8',
});

const assertSuccess = (result, label) => {
	assert.equal(result.status, 0, `${label} failed:\n${result.stderr || result.stdout}`);
};

const extractTutorialFile = (source, label, language) => {
	const escapedLabel = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	const pattern = new RegExp(`${escapedLabel}\\n\\n\\x60{3}${language}\\n([\\s\\S]*?)\\n\\x60{3}`);
	const match = source.match(pattern);
	assert.ok(match, `Could not find the ${label} code block in docs/getting-started.md.`);
	return `${match[1]}\n`;
};

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

try {
	const tutorial = await readFile(tutorialPath, 'utf8');
	const initResult = runCli(['init', tutorialSiteRoot]);
	assertSuccess(initResult, 'Tutorial init');
	await rm(path.join(tutorialSiteRoot, 'node_modules'), { force: true, recursive: true });
	await symlink(path.join(repoRoot, 'node_modules'), path.join(tutorialSiteRoot, 'node_modules'), 'dir');

	await Promise.all([
		writeFile(
			path.join(tutorialSiteRoot, 'site', 'content.md'),
			extractTutorialFile(tutorial, 'Replace `site/content.md` with:', 'md'),
		),
		writeFile(
			path.join(tutorialSiteRoot, 'site', 'sitewide-content.md'),
			extractTutorialFile(tutorial, 'Replace `site/sitewide-content.md` with:', 'yaml'),
		),
		writeFile(
			path.join(tutorialSiteRoot, 'site', 'theme.md'),
			extractTutorialFile(tutorial, 'Replace `site/theme.md` with:', 'yaml'),
		),
	]);

	const siteDirectory = path.join(tutorialSiteRoot, 'site');
	assertSuccess(runCli(['--site-dir', siteDirectory, 'config:check']), 'Tutorial config:check');
	assertSuccess(runCli(['--site-dir', siteDirectory, 'content:check']), 'Tutorial content:check');
	assertSuccess(runCli(['--site-dir', siteDirectory, 'build']), 'Tutorial build');

	const html = await readFile(path.join(tutorialSiteRoot, 'dist', 'index.html'), 'utf8');
	assert.match(html, /My first Norna site/);
	assert.match(html, /Welcome/);
	assert.match(html, /Next/);

	await checkLocalMarkdownLinks();

	const llms = await readFile(path.join(repoRoot, 'site', 'public', 'llms.txt'), 'utf8');
	for (const match of llms.matchAll(/https:\/\/raw\.githubusercontent\.com\/janga\/norna\/main\/([^\s)]+)/g)) {
		assert.ok(existsSync(path.join(repoRoot, decodeURIComponent(match[1]))), `llms.txt target is missing: ${match[1]}`);
	}

	console.log('ok - tutorial source builds and documentation links resolve');
} finally {
	await rm(tempRoot, { force: true, recursive: true });
}
