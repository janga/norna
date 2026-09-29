import path from 'node:path';
import { getSourcePageLocation } from './source-files.mjs';
import { selectPageTheme } from './theme-packages.mjs';

const presetHelp = (siteRoot, selection) => {
	const origin = selection.sourceFiles.findLast((file) => file.config.preset !== undefined);
	return `Preset: ${selection.selected.config.preset}\nPreset source: ${path.relative(siteRoot, origin.path)}`;
};

// Cache only within one tree read: dirty buffers and external changes must be
// reflected on the next refresh. The engine resolver owns all inheritance rules.
export const createEditorThemeHelp = ({ siteRoot, sources }) => {
	const selections = new Map();
	return async (directory, filename) => {
		const includePageTheme = !filename || path.basename(filename) === 'page-theme.yaml';
		const key = JSON.stringify([directory, includePageTheme]);
		if (!selections.has(key)) selections.set(key, selectPageTheme({ siteRoot, sources,
			pageDirectory: getSourcePageLocation(siteRoot, directory).pageDirectory, includePageTheme })
			.catch(() => null));
		const selection = await selections.get(key);
		if (!selection) return 'Preset unavailable. Check the theme diagnostics.';
		const file = filename && selection.sourceFiles.find((entry) => entry.path === filename);
		const mode = !file ? '' : file.config.preset === undefined
			? 'Modifies inherited settings. Add preset to replace the base.'
			: getSourcePageLocation(siteRoot, directory).isHome && !includePageTheme
				? 'Required base for the site. Its preset cannot be omitted.'
				: 'Replaces inherited settings, even with the same preset name. Remove preset to resume inheritance.';
		return [presetHelp(siteRoot, selection), mode].filter(Boolean).join('\n');
	};
};

export const getEditorThemeRemovalHelp = async ({ siteRoot, filename, sources }) => {
	const afterRemoval = new Map(sources);
	afterRemoval.set(filename, null);
	try {
		const selection = await selectPageTheme({ siteRoot, sources: afterRemoval,
			pageDirectory: getSourcePageLocation(siteRoot, path.dirname(filename)).pageDirectory,
			includePageTheme: false });
		return `After removal, the inherited tree theme is ${path.relative(siteRoot, selection.treeTheme.path)}.\n${presetHelp(siteRoot, selection)}`;
	} catch {
		return 'The inherited preset cannot be determined until the remaining theme errors are repaired.';
	}
};
