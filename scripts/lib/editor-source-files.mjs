import { lstat, mkdir, open, rmdir, unlink } from 'node:fs/promises';
import path from 'node:path';
import { parsePageDirectoryPath } from './page-model.mjs';
import { configSchema, pageThemeSchema, sitewideSchema, themeVisualSchema } from './schema-definitions.mjs';
import { parseYamlConfig } from './yaml-config.mjs';
import { checkedPath } from './editor-site-files.mjs';
import { escapeMarkdownHeading } from './site-node-create.mjs';

export const siteTreeEditingApiVersion = 1;
const stat = (filename) => lstat(filename).catch((error) => {
	if (error.code === 'ENOENT') return null;
	throw error;
});

export const editorPageLocation = (siteRoot, directory) => {
	const relative = path.relative(siteRoot, directory);
	if (!relative) return { isHome: true, pageId: 'home', pagePath: '' };
	if (!relative.startsWith(`pages${path.sep}`)) return null;
	try {
		const value = relative.slice(6).split(path.sep).join('/');
		if (value === '000-home') return null;
		return { ...parsePageDirectoryPath(value), isHome: false };
	} catch { return null; }
};

export const editorSourceDefinition = (siteRoot, filename) => {
	const relative = path.relative(siteRoot, filename).split(path.sep).join('/');
	const shared = {
		'site-config/settings.yaml': { schema: configSchema, required: true, input: 'url', description: 'Required public URL and technical site settings.' },
		'site-config/site-theme.yaml': { schema: themeVisualSchema, required: true, text: 'preset: documentation\n', description: 'Shared visual defaults for the complete site. Starts with the documentation preset.' },
		'site-config/shared-content.yaml': { schema: sitewideSchema, text: 'banners: []\n', description: 'Shared notices and footer content for the complete site.' },
	};
	if (shared[relative]) return shared[relative];
	const location = editorPageLocation(siteRoot, path.dirname(filename));
	if (!location) return null;
	if (path.basename(filename) === 'content.md') return { input: 'title', required: true, description: 'Required page content.' };
	if (path.basename(filename) === 'theme.yaml') return { schema: pageThemeSchema, text: 'layout:\n  textWidth: normal\n', description: location.isHome
		? 'Visual settings for this page only. Overrides site-config/site-theme.yaml.'
		: 'Visual settings for this page and its child pages. Overrides inherited settings.' };
	return null;
};

export const getEditorSourceFileChoices = async ({ siteRoot, directory }) => {
	siteRoot = path.resolve(siteRoot);
	directory = await checkedPath(siteRoot, directory);
	const location = editorPageLocation(siteRoot, directory);
	if (!location || !(await stat(directory))?.isDirectory()) throw new Error('Select an existing page directory at a permitted location in this site.');
	const content = await stat(path.join(directory, 'content.md'));
	const names = [
		...(!content ? ['content.md'] : []),
		...(content?.isFile() ? ['theme.yaml'] : []),
		...(location.isHome ? ['site-config/settings.yaml', 'site-config/site-theme.yaml', 'site-config/shared-content.yaml'] : []),
	];
	const choices = [];
	for (const name of names) {
		const filename = path.join(directory, name);
		if (await stat(filename)) continue;
		// A file or symlink occupying site-config must be repaired, not replaced.
		const parent = await stat(path.dirname(filename));
		if (parent && (!parent.isDirectory() || parent.isSymbolicLink())) continue;
		const definition = editorSourceDefinition(siteRoot, filename);
		choices.push({ filename, name, description: definition.description, input: definition.input,
			required: Boolean(definition.required), effect: name === 'theme.yaml' ? `${definition.description} Starts with normal body text width. Edit the new file to choose other overrides.` : definition.description });
	}
	return choices;
};

export const planEditorSourceFileCreation = async ({ siteRoot, directory, filename, value }) => {
	siteRoot = path.resolve(siteRoot);
	const choices = await getEditorSourceFileChoices({ siteRoot, directory });
	const choice = choices.find((entry) => entry.filename === filename);
	if (!choice) throw new Error('This file already exists or is not allowed here. Refresh Site Tree and review Add again.');
	await checkedPath(siteRoot, filename);
	const definition = editorSourceDefinition(siteRoot, filename);
	let text = definition.text;
	if (definition.input) {
		if (typeof value !== 'string' || !value.trim() || /[\r\n]/.test(value)) throw new Error('Enter a non-empty, single line of text.');
		text = definition.input === 'title' ? `# ${escapeMarkdownHeading(value.trim())}\n`
			: `${definition.input}: ${JSON.stringify(value.trim())}\n`;
	}
	if (definition.schema) parseYamlConfig(text, filename, { schema: definition.schema });
	const identity = async (location) => { const entry = await stat(location); return entry ? [entry.dev, entry.ino] : null; };
	return { siteRoot, directory: path.resolve(directory), filename, value, text,
		fingerprint: JSON.stringify([await identity(siteRoot), await identity(directory), filename, text]) };
};

export const createEditorSourceFile = async (plan) => {
	const current = await planEditorSourceFileCreation(plan);
	if (plan.fingerprint !== current.fingerprint) throw new Error('The selected directory changed. Review Add again.');
	const parent = path.dirname(current.filename);
	let createdDirectory = false;
	let handle;
	try {
		if (!await stat(parent)) { await mkdir(parent); createdDirectory = true; }
		await checkedPath(current.siteRoot, current.filename);
		handle = await open(current.filename, 'wx');
		await handle.writeFile(current.text, 'utf8');
	} catch (error) {
		if (handle) {
			const owned = await handle.stat();
			await handle.close(); handle = null;
			const existing = await stat(current.filename);
			if (existing?.ino === owned.ino && existing?.dev === owned.dev) await unlink(current.filename);
		}
		if (createdDirectory) await rmdir(parent).catch(() => {});
		throw error;
	} finally { await handle?.close(); }
	return { sourcePath: current.filename };
};
