import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

export const githubPagesWorkflow = 'deploy.yml';

export const getGitHubRepositoryContext = async ({ cwd, repo } = {}) => {
	const args = [
		'repo',
		'view',
		...(repo ? [repo] : []),
		'--json',
		'nameWithOwner,defaultBranchRef',
	];
	let stdout;

	try {
		({ stdout } = await execFileAsync('gh', args, {
			cwd,
			maxBuffer: 1024 * 1024,
		}));
	} catch (error) {
		throw new Error([
			'Could not discover the GitHub repository and its default branch.',
			'Run this command in a Git repository with a GitHub remote and an authenticated gh CLI, or pass explicit deploy:watch options.',
			error.stderr?.trim(),
			error.message,
		].filter(Boolean).join('\n'));
	}

	const result = JSON.parse(stdout || '{}');
	const defaultBranch = result.defaultBranchRef?.name;
	const nameWithOwner = result.nameWithOwner;

	if (!nameWithOwner || !defaultBranch) {
		throw new Error('GitHub did not report a repository name and default branch.');
	}

	return Object.freeze({
		branch: defaultBranch,
		repo: nameWithOwner,
	});
};
