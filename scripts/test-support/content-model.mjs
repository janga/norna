import { execFile } from 'node:child_process';
import { access, cp, mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const repoRoot = path.resolve(import.meta.dirname, '..', '..');
const nodeBin = process.execPath;
const nornaBin = path.join(repoRoot, 'bin', 'norna.mjs');
const contentScript = path.join(repoRoot, 'scripts', 'sync-content-sections.mjs');

export const fixtureSiteDir = path.join(repoRoot, 'fixtures', 'content-model-v2', 'site');

const fixtureRoot = path.dirname(fixtureSiteDir);

export const runNorna = async (args, options = {}) => {
	try {
		return await execFileAsync(nodeBin, [nornaBin, ...args], {
			cwd: repoRoot,
			maxBuffer: 1024 * 1024 * 10,
			...options,
		});
	} catch (error) {
		error.output = `${error.stdout ?? ''}${error.stderr ?? ''}`;
		throw error;
	}
};

export const runContentScript = async (siteDir, args) => {
	try {
		return await execFileAsync(nodeBin, [contentScript, ...args], {
			cwd: repoRoot,
			env: {
				...process.env,
				NORNA_SITE_DIR: siteDir,
			},
			maxBuffer: 1024 * 1024 * 10,
		});
	} catch (error) {
		error.output = `${error.stdout ?? ''}${error.stderr ?? ''}`;
		throw error;
	}
};

export const createTempSite = async ({ underRepoCache = false } = {}) => {
	const tempParent = underRepoCache
		? path.join(repoRoot, 'node_modules', '.cache')
		: os.tmpdir();
	await mkdir(tempParent, { recursive: true });
	const root = await mkdtemp(path.join(tempParent, 'norna-content-model-v2-'));
	const siteDir = path.join(root, 'site');
	await mkdir(path.join(siteDir, 'pages', '000-home'), { recursive: true });
	await writeFile(path.join(siteDir, 'config.yaml'), 'url: https://example.com/\n');
	await writeFile(path.join(siteDir, 'theme.yaml'), `typography:
  profile: reading
`);
	return { root, siteDir };
};

export const fileExists = async (filePath) => access(filePath).then(() => true, () => false);

const runGit = async (cwd, args) => execFileAsync('git', args, {
	cwd,
	env: {
		...process.env,
		GIT_AUTHOR_NAME: 'Norna Test',
		GIT_AUTHOR_EMAIL: 'norna@example.test',
		GIT_COMMITTER_NAME: 'Norna Test',
		GIT_COMMITTER_EMAIL: 'norna@example.test',
	},
	maxBuffer: 1024 * 1024,
});

export const initCleanGitWorktree = async (root) => {
	await runGit(root, ['init']);
	await runGit(root, ['config', 'user.email', 'norna@example.test']);
	await runGit(root, ['config', 'user.name', 'Norna Test']);
	await runGit(root, ['add', '.']);
	await runGit(root, ['commit', '-m', 'initial']);
};

export const createTempFixtureCopy = async () => {
	const tempParent = path.join(repoRoot, 'node_modules', '.cache');
	await mkdir(tempParent, { recursive: true });
	const root = await mkdtemp(path.join(tempParent, 'norna-content-model-v2-fixture-'));
	const fixtureCopyRoot = path.join(root, 'content-model-v2');

	await cp(fixtureRoot, fixtureCopyRoot, {
		recursive: true,
		filter: (source) => ![
			path.join(fixtureRoot, '.astro'),
			path.join(fixtureRoot, 'dist'),
			path.join(fixtureRoot, 'node_modules'),
			path.join(fixtureSiteDir, '.norna'),
		].some((ignoredPath) => source === ignoredPath || source.startsWith(`${ignoredPath}${path.sep}`)),
	});

	return {
		root,
		siteDir: path.join(fixtureCopyRoot, 'site'),
	};
};
