import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import {
	validatePageThemeYamlStructure,
	validateThemeYamlStructure,
} from './site-content.mjs';
import {
	sitePagesDir,
	sitePagesLabel,
	siteThemeLabel,
	siteThemePath,
} from './site-paths.mjs';
import { resolveThemePresentation } from './presentation.mjs';
import { resolveThemeConfig } from './theme-presets.mjs';
import { pageThemeSchema, themeVisualSchema } from './schema-definitions.mjs';
import { parseYamlConfig } from './yaml-config.mjs';

export const readThemeConfig = async () => {
	const themeFile = await readFile(siteThemePath, 'utf8').catch((error) => {
		if (error?.code === 'ENOENT') {
			throw new Error(`${siteThemeLabel} is required. Create it before running Norna.`);
		}

		throw error;
	});
	const config = parseYamlConfig(themeFile, siteThemeLabel, {
		schema: themeVisualSchema,
		validateStructure: validateThemeYamlStructure,
	});
	resolveThemeConfig(config, siteThemeLabel);
	resolveThemePresentation(config, siteThemeLabel);

	return config;
};

const getPageThemeFiles = async (directory, relativeDirectory = '') => {
	const entries = await readdir(directory, { withFileTypes: true }).catch((error) => {
		if (error?.code === 'ENOENT') return [];
		throw error;
	});
	const files = [];

	for (const entry of entries) {
		const relativePath = path.join(relativeDirectory, entry.name);
		const absolutePath = path.join(directory, entry.name);
		if (entry.isDirectory()) {
			files.push(...await getPageThemeFiles(absolutePath, relativePath));
			continue;
		}

		if (entry.name === 'theme.yaml') {
			files.push({
				path: absolutePath,
				label: `${sitePagesLabel}/${relativePath.split(path.sep).join('/')}`,
			});
		}
	}

	return files;
};

export const validatePageThemeFiles = async () => {
	const files = await getPageThemeFiles(sitePagesDir);
	const configs = [];

	for (const file of files) {
		const source = await readFile(file.path, 'utf8');
		const config = parseYamlConfig(source, file.label, {
			schema: pageThemeSchema,
			validateStructure: validatePageThemeYamlStructure,
		});

		configs.push({ ...file, config });
	}

	return configs;
};
