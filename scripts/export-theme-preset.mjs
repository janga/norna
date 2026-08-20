import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import {
	renderThemePresetReference,
	themePresetNames,
} from './lib/theme-presets.mjs';
import { siteDir, siteThemeLabel } from './lib/site-paths.mjs';

const [presetName, ...extraArgs] = process.argv.slice(2);

if (!presetName || extraArgs.length > 0) {
	throw new Error(`Usage: norna theme:export <preset>\nAvailable presets: ${themePresetNames.join(', ')}`);
}

const filename = `orig-${presetName}-theme.md`;
const outputPath = path.join(siteDir, filename);
const outputLabel = path.posix.join(path.posix.dirname(siteThemeLabel), filename);
const source = renderThemePresetReference(presetName, siteThemeLabel);

try {
	await writeFile(outputPath, source, { encoding: 'utf8', flag: 'wx' });
} catch (error) {
	if (error?.code === 'EEXIST') {
		throw new Error(`${outputLabel} already exists. Norna will not overwrite it.`);
	}

	throw error;
}

console.log(`Exported the ${presetName} theme preset to ${outputLabel}.`);
console.log(`Norna still reads ${siteThemeLabel}; use the exported file as an override reference.`);
