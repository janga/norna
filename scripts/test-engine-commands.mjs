import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdir, mkdtemp, readFile, realpath, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getShortGitStatusPath, parseShortGitStatus } from './lib/git-status.mjs';
import { typographyProfiles, typographyRhythms } from './lib/typography.mjs';

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
	const releaseStatus = parseShortGitStatus(' M package-lock.json\n M schemas/theme.schema.json\n');
	assert.deepEqual(releaseStatus, [' M package-lock.json', ' M schemas/theme.schema.json']);
	assert.equal(getShortGitStatusPath(releaseStatus[0]), 'package-lock.json');

	const versionResult = runCli(['engine:version']);
	assert.equal(versionResult.status, 0, versionResult.stderr || versionResult.stdout);
	assert.match(versionResult.stdout, /norna engine:version/);
	assert.match(versionResult.stdout, new RegExp(`Installed norna: ${packageJson.version.replaceAll('.', '\\.')}`));
	assert.match(versionResult.stdout, /Installed Astro: /);

	const deployHelpResult = runCli(['deploy', '--help']);
	assert.equal(deployHelpResult.status, 0, deployHelpResult.stderr || deployHelpResult.stdout);
	assert.match(deployHelpResult.stdout, /already committed default branch/);
	const deployWatchHelpResult = runCli(['deploy:watch', '--help']);
	assert.equal(deployWatchHelpResult.status, 0, deployWatchHelpResult.stderr || deployWatchHelpResult.stdout);
	assert.match(deployWatchHelpResult.stdout, /Default: current repository/);
	assert.match(deployWatchHelpResult.stdout, /Default: repository default branch/);
	assert.match(deployWatchHelpResult.stdout, /Default: deploy\.yml/);

	const directSiteRoot = path.join(tempRoot, 'current-directory-site');
	await mkdir(directSiteRoot, { recursive: true });
	await writeFile(path.join(directSiteRoot, 'config.yaml'), 'url: https://example.com/\n');
	await writeFile(path.join(directSiteRoot, 'content.md'), '# Direct Site\n\n## Intro {#intro}\n\nText.\n');
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
	assert.match(initResult.stdout, /npm run norna:dev/);

	const initializedPackageJson = JSON.parse(await readFile(path.join(initializedSiteRoot, 'package.json'), 'utf8'));
	assert.equal(initializedPackageJson.dependencies['@janga/norna'], packageJson.version);
	assert.equal(initializedPackageJson.scripts['norna:check'], 'norna check');
	assert.equal(initializedPackageJson.scripts['norna:engine:update'], 'norna engine:update');
	assert.equal(initializedPackageJson.scripts['norna:engine:version'], 'norna engine:version');
	assert.equal(initializedPackageJson.scripts['norna:theme:presets'], 'norna theme:presets');
	assert.equal(initializedPackageJson.scripts['norna:theme:export'], 'norna theme:export');
	assert.equal(initializedPackageJson.scripts['engine:update'], undefined);
	assert.equal(initializedPackageJson.scripts['engine:version'], undefined);
	const checkResult = runCli(['--site-dir', path.join(initializedSiteRoot, 'site'), 'check']);
	assert.equal(checkResult.status, 0, checkResult.stderr || checkResult.stdout);
	assert.match(checkResult.stdout, /Config check passed\./);
	assert.match(checkResult.stdout, /Content check passed\./);

	const profilesResult = runCli(['typography', 'profiles']);
	assert.equal(profilesResult.status, 0, profilesResult.stderr || profilesResult.stdout);
	assert.match(profilesResult.stdout, /restrained:/);
	assert.match(profilesResult.stdout, /reading:/);
	assert.match(profilesResult.stdout, /rhythms:/);
	assert.match(profilesResult.stdout, /normal:/);
	for (const [profileName, profile] of Object.entries(typographyProfiles)) {
		for (const [level, heading] of Object.entries(profile.headings)) {
			assert.equal(heading.size, 'medium', `${profileName} ${level} should use medium size`);
			assert.ok([400, 500, 600, 700].includes(heading.weight), `${profileName} ${level} should use a supported weight`);
		}
		assert.equal(profile.body.size, 'medium', `${profileName} body should use medium size`);
		assert.ok(['narrow', 'normal', 'wide'].includes(profile.body.width), `${profileName} body should use a supported width`);
		assert.equal(profile.caption.size, 'medium', `${profileName} caption should use medium size`);
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
	assert.match(showResult.stdout, /value: restrained/);
	assert.match(showResult.stdout, /source: "site\/theme\.yaml"/);
	assert.match(showResult.stdout, /intro:/);

	const initAgainResult = runCli(['init', initializedSiteRoot]);
	assert.notEqual(initAgainResult.status, 0);
	assert.match(initAgainResult.stderr, /Target directory must be empty/);

	const customStandaloneSiteRoot = path.join(tempRoot, 'custom-standalone-site');
	const customStandaloneInitResult = runCli(['init', customStandaloneSiteRoot, '--type', 'standalone', '--site-dir', 'presentation']);
	assert.equal(customStandaloneInitResult.status, 0, customStandaloneInitResult.stderr || customStandaloneInitResult.stdout);
	const customStandalonePackageJson = JSON.parse(await readFile(path.join(customStandaloneSiteRoot, 'package.json'), 'utf8'));
	assert.equal(customStandalonePackageJson.scripts.dev, 'npm run norna:dev --');
	assert.equal(customStandalonePackageJson.scripts.build, 'npm run norna:build');
	assert.equal(customStandalonePackageJson.scripts['norna:dev'], 'norna --site-dir presentation dev:local');
	assert.equal(customStandalonePackageJson.scripts['norna:check'], 'norna --site-dir presentation check');
	assert.equal(customStandalonePackageJson.scripts['norna:build'], 'norna --site-dir presentation build');
	await readFile(path.join(customStandaloneSiteRoot, 'presentation', 'content.md'));
	await readFile(path.join(customStandaloneSiteRoot, 'presentation', 'config.yaml'));
	await readFile(path.join(customStandaloneSiteRoot, 'presentation', 'theme.yaml'));

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
	assert.equal(mixedPackageJson.scripts['norna:check'], 'norna --site-dir presentation check');
	assert.equal(mixedPackageJson.scripts['norna:engine:update'], 'norna --site-dir presentation engine:update');
	assert.equal(mixedPackageJson.scripts['norna:engine:version'], 'norna --site-dir presentation engine:version');
	await readFile(path.join(mixedProjectRoot, 'presentation', 'content.md'));
	await readFile(path.join(mixedProjectRoot, 'presentation', 'config.yaml'));
	await readFile(path.join(mixedProjectRoot, 'presentation', 'theme.yaml'));

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

	const standaloneIntoExistingProjectResult = runCli(['init', '.', '--type', 'standalone'], {
		cwd: mixedProjectRoot,
	});
	assert.notEqual(standaloneIntoExistingProjectResult.status, 0);
	assert.match(standaloneIntoExistingProjectResult.stderr, /use --type embedded/);

	const updateFromEngineResult = runCli(['engine:update', '--skip-checks']);
	assert.notEqual(updateFromEngineResult.status, 0);
	assert.match(updateFromEngineResult.stderr, /must be run from a site repository/);

	const releaseHelpResult = spawnSync(process.execPath, [path.join(repoRoot, 'scripts', 'release.mjs'), 'patch', '--help'], {
		cwd: repoRoot,
		encoding: 'utf8',
	});
	assert.equal(releaseHelpResult.status, 0, releaseHelpResult.stderr || releaseHelpResult.stdout);
	assert.match(releaseHelpResult.stdout, /Usage: node scripts\/release\.mjs/);
	const releaseSource = await readFile(path.join(repoRoot, 'scripts', 'release.mjs'), 'utf8');
	const releaseSteps = [
		"['version', releaseType, '--no-git-tag-version']",
		"['run', 'schemas:generate']",
		"['test']",
		"['commit', '-m', `Release ${releaseTag}`]",
		"['tag', '-a', releaseTag, '-m', `Release ${releaseTag}`]",
		"['run', 'release:publish']",
		"['push', '--follow-tags']",
	];
	for (const step of releaseSteps) assert.ok(releaseSource.includes(step), `Missing release step: ${step}`);
	for (let index = 1; index < releaseSteps.length; index += 1) {
		assert.ok(
			releaseSource.indexOf(releaseSteps[index - 1]) < releaseSource.indexOf(releaseSteps[index]),
			`Release step is out of order: ${releaseSteps[index]}`,
		);
	}
	assert.match(releaseSource, /rollbackPreparedRelease/);

	console.log('ok - engine commands report versions, initialize sites, guard engine self-updates, and document release usage');
} finally {
	await rm(tempRoot, { force: true, recursive: true });
}
