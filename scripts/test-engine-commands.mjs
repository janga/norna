import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdir, mkdtemp, readFile, realpath, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { typographyPresets, typographyRhythms } from './lib/typography.mjs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const cliPath = path.join(repoRoot, 'bin', 'norna.mjs');
const packageJson = JSON.parse(await readFile(path.join(repoRoot, 'package.json'), 'utf8'));
const tempRoot = await mkdtemp(path.join(tmpdir(), 'norna-engine-commands-'));

const runCli = (args, options = {}) => spawnSync(process.execPath, [cliPath, ...args], {
	cwd: repoRoot,
	encoding: 'utf8',
	...options,
});

try {
	const versionResult = runCli(['engine:version']);
	assert.equal(versionResult.status, 0, versionResult.stderr || versionResult.stdout);
	assert.match(versionResult.stdout, /norna engine:version/);
	assert.match(versionResult.stdout, new RegExp(`Installed norna: ${packageJson.version.replaceAll('.', '\\.')}`));
	assert.match(versionResult.stdout, /Installed Astro: /);

	const directSiteRoot = path.join(tempRoot, 'current-directory-site');
	await mkdir(directSiteRoot, { recursive: true });
	await writeFile(path.join(directSiteRoot, 'config.mjs'), 'export default { site: { url: "https://example.com/" } };\n');
	await writeFile(path.join(directSiteRoot, 'content.md'), '---\ntitle: Direct Site\ndescription: Direct site fixture.\n---\n\n## Intro {#intro}\n\nText.\n');
	const directSiteProjectRoot = await realpath(tempRoot);
	const directSiteDoctorResult = runCli(['doctor'], {
		cwd: directSiteRoot,
	});
	assert.equal(directSiteDoctorResult.status, 0, directSiteDoctorResult.stderr || directSiteDoctorResult.stdout);
	assert.ok(directSiteDoctorResult.stdout.includes(`Site project root: ${directSiteProjectRoot}`));
	assert.match(directSiteDoctorResult.stdout, /Site directory: current-directory-site/);

	const initializedSiteRoot = path.join(tempRoot, 'initialized-site');
	const initResult = runCli(['init', initializedSiteRoot]);
	assert.equal(initResult.status, 0, initResult.stderr || initResult.stdout);
	assert.match(initResult.stdout, /Created norna site at /);

	const initializedPackageJson = JSON.parse(await readFile(path.join(initializedSiteRoot, 'package.json'), 'utf8'));
	assert.equal(initializedPackageJson.dependencies['@janga/norna'], packageJson.version);
	assert.equal(initializedPackageJson.scripts['norna:engine:update'], 'norna engine:update');
	assert.equal(initializedPackageJson.scripts['norna:engine:version'], 'norna engine:version');
	assert.equal(initializedPackageJson.scripts['engine:update'], undefined);
	assert.equal(initializedPackageJson.scripts['engine:version'], undefined);

	const presetsResult = runCli(['typography', 'presets']);
	assert.equal(presetsResult.status, 0, presetsResult.stderr || presetsResult.stdout);
	assert.match(presetsResult.stdout, /quiet-gallery:/);
	assert.match(presetsResult.stdout, /text-forward:/);
	assert.match(presetsResult.stdout, /rhythms:/);
	assert.match(presetsResult.stdout, /normal:/);
	for (const [presetName, preset] of Object.entries(typographyPresets)) {
		for (const [level, heading] of Object.entries(preset.headings)) {
			assert.equal(heading.size, 'medium', `${presetName} ${level} should use medium size`);
			assert.ok([400, 500, 600, 700].includes(heading.weight), `${presetName} ${level} should use a supported weight`);
		}
		assert.equal(preset.body.size, 'medium', `${presetName} body should use medium size`);
		assert.ok(['narrow', 'normal', 'wide'].includes(preset.body.width), `${presetName} body should use a supported width`);
		assert.equal(preset.caption.size, 'medium', `${presetName} caption should use medium size`);
	}
	for (const [rhythmName, rhythm] of Object.entries(typographyRhythms)) {
		for (const [level, heading] of Object.entries(rhythm.headings)) {
			assert.match(heading.spacingBefore, /^(0|[\d.]+em)$/, `${rhythmName} ${level} spacingBefore should be text-relative`);
			assert.match(heading.spacingAfter, /^[\d.]+em$/, `${rhythmName} ${level} spacingAfter should be text-relative`);
		}
		assert.match(rhythm.body.paragraphSpacing, /^[\d.]+em$/, `${rhythmName} body paragraphSpacing should be text-relative`);
		assert.match(rhythm.caption.spacingBefore, /^[\d.]+em$/, `${rhythmName} caption spacingBefore should be text-relative`);
	}

	const showResult = runCli(['--site-dir', path.join(initializedSiteRoot, 'site'), 'typography', 'show']);
	assert.equal(showResult.status, 0, showResult.stderr || showResult.stdout);
	assert.match(showResult.stdout, /theme:/);
	assert.match(showResult.stdout, /pages:/);
	assert.match(showResult.stdout, /\s+\/:/);
	assert.match(showResult.stdout, /value: quiet-gallery/);
	assert.match(showResult.stdout, /source: "site\/theme\.md"/);
	assert.match(showResult.stdout, /intro:/);

	const initAgainResult = runCli(['init', initializedSiteRoot]);
	assert.notEqual(initAgainResult.status, 0);
	assert.match(initAgainResult.stderr, /Target directory must be empty/);

	const customPureSiteRoot = path.join(tempRoot, 'custom-pure-site');
	const customPureInitResult = runCli(['init', customPureSiteRoot, '--type', 'pure', '--site-dir', 'presentation']);
	assert.equal(customPureInitResult.status, 0, customPureInitResult.stderr || customPureInitResult.stdout);
	const customPurePackageJson = JSON.parse(await readFile(path.join(customPureSiteRoot, 'package.json'), 'utf8'));
	assert.equal(customPurePackageJson.scripts.dev, 'npm run norna:dev --');
	assert.equal(customPurePackageJson.scripts.build, 'npm run norna:build');
	assert.equal(customPurePackageJson.scripts['norna:dev'], 'norna --site-dir presentation dev:local');
	assert.equal(customPurePackageJson.scripts['norna:build'], 'norna --site-dir presentation build');
	await readFile(path.join(customPureSiteRoot, 'presentation', 'content.md'));
	await readFile(path.join(customPureSiteRoot, 'presentation', 'config.mjs'));
	await readFile(path.join(customPureSiteRoot, 'presentation', 'theme.md'));

	const mixedProjectRoot = path.join(tempRoot, 'mixed-project');
	await mkdir(mixedProjectRoot, { recursive: true });
	await writeFile(path.join(mixedProjectRoot, 'package.json'), `${JSON.stringify({
		name: 'mixed-project',
		private: true,
		type: 'module',
		scripts: {
			build: 'node build-app.mjs',
		},
	}, null, 2)}\n`);
	const embeddedInitResult = runCli(['init', '.', '--type', 'embedded', '--site-dir', 'presentation'], {
		cwd: mixedProjectRoot,
	});
	assert.equal(embeddedInitResult.status, 0, embeddedInitResult.stderr || embeddedInitResult.stdout);
	assert.match(embeddedInitResult.stdout, /Added norna site directory at /);
	const mixedPackageJson = JSON.parse(await readFile(path.join(mixedProjectRoot, 'package.json'), 'utf8'));
	assert.equal(mixedPackageJson.dependencies['@janga/norna'], packageJson.version);
	assert.equal(mixedPackageJson.scripts.build, 'node build-app.mjs');
	assert.equal(mixedPackageJson.scripts.dev, undefined);
	assert.equal(mixedPackageJson.scripts['norna:dev'], 'norna --site-dir presentation dev:local');
	assert.equal(mixedPackageJson.scripts['norna:engine:update'], 'norna --site-dir presentation engine:update');
	assert.equal(mixedPackageJson.scripts['norna:engine:version'], 'norna --site-dir presentation engine:version');
	await readFile(path.join(mixedProjectRoot, 'presentation', 'content.md'));
	await readFile(path.join(mixedProjectRoot, 'presentation', 'config.mjs'));
	await readFile(path.join(mixedProjectRoot, 'presentation', 'theme.md'));

	const conflictProjectRoot = path.join(tempRoot, 'conflict-project');
	await mkdir(conflictProjectRoot, { recursive: true });
	await writeFile(path.join(conflictProjectRoot, 'package.json'), `${JSON.stringify({
		name: 'conflict-project',
		private: true,
		scripts: {
			'norna:dev': 'vite --host 0.0.0.0',
		},
	}, null, 2)}\n`);
	const conflictInitResult = runCli(['init', '.', '--type', 'embedded', '--site-dir', 'presentation'], {
		cwd: conflictProjectRoot,
	});
	assert.notEqual(conflictInitResult.status, 0);
	assert.match(conflictInitResult.stderr, /Refusing to overwrite existing npm scripts/);
	assert.match(conflictInitResult.stderr, /norna:dev/);

	const pureIntoExistingProjectResult = runCli(['init', '.', '--type', 'pure'], {
		cwd: mixedProjectRoot,
	});
	assert.notEqual(pureIntoExistingProjectResult.status, 0);
	assert.match(pureIntoExistingProjectResult.stderr, /use --type embedded/);

	const updateFromEngineResult = runCli(['engine:update', '--skip-checks']);
	assert.notEqual(updateFromEngineResult.status, 0);
	assert.match(updateFromEngineResult.stderr, /must be run from a site repository/);

	const releaseHelpResult = spawnSync(process.execPath, [path.join(repoRoot, 'scripts', 'release.mjs'), 'patch', '--help'], {
		cwd: repoRoot,
		encoding: 'utf8',
	});
	assert.equal(releaseHelpResult.status, 0, releaseHelpResult.stderr || releaseHelpResult.stdout);
	assert.match(releaseHelpResult.stdout, /Usage: node scripts\/release\.mjs/);

	console.log('ok - engine commands report versions, initialize sites, guard engine self-updates, and document release usage');
} finally {
	await rm(tempRoot, { force: true, recursive: true });
}
