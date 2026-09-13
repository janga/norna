import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import {
	auditDocusaurusProject,
	parseMigrationCheckArgs,
	writeMigrationReport,
} from './lib/docusaurus-migration-audit.mjs';

const execFileAsync = promisify(execFile);
const root = await mkdtemp(path.join(os.tmpdir(), 'norna-migration-check-'));
const sourceRoot = path.join(root, 'docusaurus');
const reportDir = path.join(root, 'report');
const repoRoot = path.resolve(import.meta.dirname, '..');
const runGit = (args) => execFileAsync('git', args, { cwd: sourceRoot });

try {
	await mkdir(path.join(sourceRoot, 'docs'), { recursive: true });
	await mkdir(path.join(sourceRoot, 'website', 'versioned_docs', 'version-1.0'), { recursive: true });
	await writeFile(path.join(sourceRoot, 'package.json'), '{"name":"test-docusaurus","version":"1.0.0"}\n');
	await writeFile(path.join(sourceRoot, 'sidebars.ts'), 'export default {};\n');
	await writeFile(path.join(sourceRoot, 'versions.json'), '["1.0"]\n');
	await writeFile(path.join(sourceRoot, 'docs', 'plain.md'), '# Plain\n\n## Text\n\nOrdinary Markdown.\n');
	await writeFile(path.join(sourceRoot, 'docs', 'needs-review.mdx'), [
		'---',
		'title: Installation',
		'description: Install the tool.',
		'sidebar_position: 1',
		'---',
		'',
		':::tip',
		'Use the package manager.',
		':::',
		'',
		'![Package diagram](./img/package.svg)',
		'',
		'<Tabs>',
		'  <TabItem value="npm">npm install</TabItem>',
		'</Tabs>',
		'',
		String.fromCharCode(96).repeat(3) + 'js title="src/install.js" {2}',
		'const install = true;',
		String.fromCharCode(96).repeat(3),
		'',
	].join('\n'));
	for (let index = 0; index < 21; index += 1) {
		await writeFile(path.join(sourceRoot, 'docs', 'repeated-' + String(index).padStart(2, '0') + '.md'), [
			'# Repeated ' + index,
			'',
			':::tip',
			'Use the package manager.',
			':::',
			'',
		].join('\n'));
	}
	await writeFile(path.join(sourceRoot, 'website', 'versioned_docs', 'version-1.0', 'old.md'), '# Old\n\nHistorical text.\n');
	await runGit(['init', '-q']);
	await runGit(['config', 'user.email', 'norna@example.test']);
	await runGit(['config', 'user.name', 'Norna Test']);
	await runGit(['add', '.']);
	await runGit(['commit', '-qm', 'fixture']);
	await runGit(['remote', 'add', 'origin', 'https://github.com/example/docs.git']);

	const report = await auditDocusaurusProject({ sourceRoot, analysisTime: '2026-09-12T00:00:00.000Z' });
	assert.equal(report.source.system, 'docusaurus');
	assert.equal(report.source.repository, 'https://github.com/example/docs');
	assert.match(report.source.revision, /^[0-9a-f]{40}$/);
	assert.deepEqual(report.source.documentationRoots, [
		{ kind: 'current', path: 'docs' },
		{ kind: 'versioned', path: 'website/versioned_docs' },
	]);
	assert.equal(report.summary.pages, 24);
	assert.equal(report.summary.pagesByClassification.copy, 2);
	const semanticCalloutProblem = report.problemTypes.find((problem) => problem.code === 'semantic-callout');
	assert.equal(semanticCalloutProblem.occurrences, 22);
	assert.match(semanticCalloutProblem.id, /^DM-[A-F0-9]{12}$/);
	assert.equal(semanticCalloutProblem.sample.length, 20);
	const reviewPage = report.pages.find((page) => page.relativePath === 'docs/needs-review.mdx');
	assert.equal(reviewPage.classification, 'assist');
	assert.deepEqual(reviewPage.findings.map(({ code }) => code), [
		'frontmatter-page-title',
		'frontmatter-sidebar-position',
		'semantic-callout',
		'managed-image-rewrite',
		'content-tabs',
		'rich-code-metadata',
	]);
	assert.equal(report.navigation.files.includes('sidebars.ts'), true);

	await writeMigrationReport(report, reportDir, { sourceRoot });
	const reportJson = JSON.parse(await readFile(path.join(reportDir, 'migration-report.json'), 'utf8'));
	assert.equal(reportJson.summary.findings, report.summary.findings);
	assert.match(await readFile(path.join(reportDir, 'pages', '000-home', 'content.md'), 'utf8'), /Docusaurus migration audit/);
	assert.match(await readFile(path.join(reportDir, 'pages', '000-home', 'content.md'), 'utf8'), /problems\/dm-[a-f0-9]{12}\//);
	assert.match(await readFile(path.join(reportDir, 'pages', '010-problems', 'pages', '010-' + semanticCalloutProblem.id.toLowerCase(), 'content.md'), 'utf8'), /Representative occurrences/);
	const check = await execFileAsync(process.execPath, [
		path.join(repoRoot, 'bin', 'norna.mjs'),
		'--site-dir',
		reportDir,
		'config:check',
	], { cwd: repoRoot });
	assert.match(check.stdout, /Config check passed/);
	await assert.rejects(writeMigrationReport(report, reportDir, { sourceRoot }), /Migration report directory must be empty/);
	assert.deepEqual(parseMigrationCheckArgs([
		'--source',
		'docusaurus',
		'project',
		'--report-dir',
		'report',
	], root), {
		reportDir: path.join(root, 'report'),
		sourceRoot: path.join(root, 'project'),
		sourceSystem: 'docusaurus',
	});
	const cliReportDir = path.join(root, 'cli-report');
	const cliRun = await execFileAsync(process.execPath, [
		path.join(repoRoot, 'bin', 'norna.mjs'),
		'migrate:check',
		'--source',
		'docusaurus',
		sourceRoot,
		'--report-dir',
		cliReportDir,
	], { cwd: repoRoot });
	assert.match(cliRun.stdout, /Docusaurus migration audit written/);
	assert.match(await readFile(path.join(cliReportDir, 'migration-report.json'), 'utf8'), /"problemTypes"/);
	console.log('Docusaurus migration audit tests passed.');
} finally {
	await rm(root, { recursive: true, force: true });
}
