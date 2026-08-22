import { existsSync } from 'node:fs';
import { readdir } from 'node:fs/promises';
import path from 'node:path';

export const exampleCategories = ['complete-sites', 'feature-demos'];

export const getExampleSites = async (root) => {
	const examples = [];

	for (const category of exampleCategories) {
		const categoryDirectory = path.join(root, 'examples', category);
		const entries = await readdir(categoryDirectory, { withFileTypes: true });

		for (const entry of entries.filter((candidate) => candidate.isDirectory()).sort((a, b) => a.name.localeCompare(b.name))) {
			const siteDirectory = path.join(categoryDirectory, entry.name, 'site');
			if (!existsSync(path.join(siteDirectory, 'config.md'))) {
				throw new Error(`Example ${path.relative(root, siteDirectory)} is missing config.md.`);
			}
			if (!existsSync(path.join(siteDirectory, 'content.md'))) {
				throw new Error(`Example ${path.relative(root, siteDirectory)} is missing content.md.`);
			}

			examples.push({
				category,
				name: entry.name,
				siteDirectory,
				siteLabel: path.relative(root, siteDirectory),
			});
		}
	}

	if (examples.length === 0) {
		throw new Error('No example sites were found.');
	}

	return examples;
};
