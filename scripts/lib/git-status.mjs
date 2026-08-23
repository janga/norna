export const parseShortGitStatus = (output) => (
	output.split(/\r?\n/u).filter((line) => line.length > 0)
);

export const getShortGitStatusPath = (line) => (
	line.slice(3).split(' -> ').at(-1)
);
