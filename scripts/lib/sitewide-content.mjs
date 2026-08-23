import { readFile } from 'node:fs/promises';
import { sitewideSchema } from './schema-definitions.mjs';
import {
	sitewideContentLabel,
	sitewideContentPath,
} from './site-paths.mjs';
import {
	validateSitewideYamlStructure,
} from './site-content.mjs';
import { parseYamlConfig } from './yaml-config.mjs';

export const readSitewideContent = async () => {
	const source = await readFile(sitewideContentPath, 'utf8').catch((error) => {
		if (error?.code === 'ENOENT') return null;
		throw error;
	});

	if (!source) return {};

	return parseYamlConfig(source, sitewideContentLabel, {
		schema: sitewideSchema,
		validateStructure: validateSitewideYamlStructure,
	});
};
