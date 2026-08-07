import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdir, mkdtemp, realpath, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const launcherPath = path.join(repoRoot, 'bin', 'norna.mjs');
const tempRoot = await mkdtemp(path.join(tmpdir(), 'norna cli discovery-'));

const runLauncher = (args, cwd) => spawnSync(process.execPath, [launcherPath, ...args], {
	cwd,
	encoding: 'utf8',
});

const writeJson = (filePath, value) => writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`);

const createFakeNornaInstall = async (projectRoot, version = '1.7.0') => {
	const packageRoot = path.join(projectRoot, 'node_modules', '@janga', 'norna');
	const binDir = path.join(packageRoot, 'bin');
	await mkdir(binDir, { recursive: true });
	await writeJson(path.join(packageRoot, 'package.json'), {
		name: '@janga/norna',
		version,
		type: 'module',
		bin: {
			norna: 'bin/norna.mjs',
		},
	});
	await writeFile(path.join(binDir, 'norna.mjs'), `#!/usr/bin/env node
const payload = {
  marker: 'fake-local-norna',
  version: ${JSON.stringify(version)},
  argv: process.argv.slice(2),
  cwd: process.cwd()
};
console.log(JSON.stringify(payload));
if (process.argv.includes('--exit-7')) process.exit(7);
`);
};

const createProject = async (directoryName, {
	declareDependency = true,
	installNorna = true,
	version = '1.7.0',
} = {}) => {
	const projectRoot = path.join(tempRoot, directoryName);
	await mkdir(projectRoot, { recursive: true });
	await writeJson(path.join(projectRoot, 'package.json'), {
		name: directoryName.toLowerCase().replaceAll(/\s+/g, '-'),
		private: true,
		type: 'module',
		...(declareDependency
			? { dependencies: { '@janga/norna': version } }
			: {}),
	});

	if (installNorna) {
		await createFakeNornaInstall(projectRoot, version);
	}

	return projectRoot;
};

try {
	const noProjectResult = runLauncher(['--help'], tempRoot);
	assert.equal(noProjectResult.status, 0, noProjectResult.stderr || noProjectResult.stdout);
	assert.match(noProjectResult.stdout, /Usage: norna <command>/);
	assert.doesNotMatch(noProjectResult.stdout, /fake-local-norna/);

	const undeclaredProject = await createProject('undeclared project', {
		declareDependency: false,
		installNorna: true,
	});
	const undeclaredResult = runLauncher(['--help'], undeclaredProject);
	assert.equal(undeclaredResult.status, 0, undeclaredResult.stderr || undeclaredResult.stdout);
	assert.match(undeclaredResult.stdout, /Usage: norna <command>/);
	assert.doesNotMatch(undeclaredResult.stdout, /fake-local-norna/);

	const localProject = await createProject('local project', { version: '1.7.0' });
	const localResult = runLauncher(['build', '--flag', 'value with spaces'], localProject);
	assert.equal(localResult.status, 0, localResult.stderr || localResult.stdout);
	const localPayload = JSON.parse(localResult.stdout.trim());
	assert.equal(localPayload.marker, 'fake-local-norna');
	assert.equal(localPayload.version, '1.7.0');
	assert.deepEqual(localPayload.argv, ['build', '--flag', 'value with spaces']);
	assert.equal(await realpath(localPayload.cwd), await realpath(localProject));

	const subdirectory = path.join(localProject, 'site', 'images', 'work');
	await mkdir(subdirectory, { recursive: true });
	const subdirectoryResult = runLauncher(['doctor'], subdirectory);
	assert.equal(subdirectoryResult.status, 0, subdirectoryResult.stderr || subdirectoryResult.stdout);
	const subdirectoryPayload = JSON.parse(subdirectoryResult.stdout.trim());
	assert.equal(subdirectoryPayload.marker, 'fake-local-norna');
	assert.deepEqual(subdirectoryPayload.argv, ['doctor']);
	assert.equal(await realpath(subdirectoryPayload.cwd), await realpath(subdirectory));

	const spacedProject = await createProject('project with spaces', { version: '1.9.0' });
	const spacedResult = runLauncher(['engine:version'], spacedProject);
	assert.equal(spacedResult.status, 0, spacedResult.stderr || spacedResult.stdout);
	const spacedPayload = JSON.parse(spacedResult.stdout.trim());
	assert.equal(spacedPayload.version, '1.9.0');
	assert.equal(await realpath(spacedPayload.cwd), await realpath(spacedProject));

	const exitResult = runLauncher(['build', '--exit-7'], localProject);
	assert.equal(exitResult.status, 7, exitResult.stderr || exitResult.stdout);
	const exitPayload = JSON.parse(exitResult.stdout.trim());
	assert.deepEqual(exitPayload.argv, ['build', '--exit-7']);

	const engineRepoResult = runLauncher(['--help'], repoRoot);
	assert.equal(engineRepoResult.status, 0, engineRepoResult.stderr || engineRepoResult.stdout);
	assert.match(engineRepoResult.stdout, /Usage: norna <command>/);
	assert.doesNotMatch(engineRepoResult.stdout, /fake-local-norna/);

	const engineStarterResult = runLauncher(['--help'], path.join(repoRoot, 'starters', 'basic'));
	assert.equal(engineStarterResult.status, 0, engineStarterResult.stderr || engineStarterResult.stdout);
	assert.match(engineStarterResult.stdout, /Usage: norna <command>/);
	assert.doesNotMatch(engineStarterResult.stdout, /fake-local-norna/);

	console.log('ok - cli launcher discovers local norna installations and avoids self-delegation');
} finally {
	await rm(tempRoot, { force: true, recursive: true });
}
