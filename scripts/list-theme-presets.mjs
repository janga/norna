import {
	getThemePresetMetadata,
	themePresetNames,
} from './lib/theme-presets.mjs';

const args = process.argv.slice(2);
if (args.length > 0) {
	throw new Error('Usage: norna theme:presets');
}

console.log('Theme presets\n');
for (const name of themePresetNames) {
	const preset = getThemePresetMetadata(name);
	console.log(`${name}\n  ${preset.description}`);
}
