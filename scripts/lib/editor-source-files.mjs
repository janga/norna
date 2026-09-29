import { getSiteSourcePaths } from './site-conventions.mjs';
import { lstat, mkdir, open, rmdir, unlink } from 'node:fs/promises';
import path from 'node:path';
import { getSourcePageLocation, getSourceFileDefinition, sourceFileDefinitions } from './source-files.mjs';
import { parseYamlConfig } from './yaml-config.mjs';
import { checkedPath } from './editor-site-files.mjs';
import { escapeMarkdownHeading } from './site-node-create.mjs';

export const siteTreeEditingApiVersion = 1;
const stat = (filename) => lstat(filename).catch((error) => {
	if (error.code === 'ENOENT') return null;
	throw error;
});

export const editorPageLocation = getSourcePageLocation;
export const editorSourceDefinition = getSourceFileDefinition;

export const getEditorSourceFileChoices = async ({ siteRoot, directory }) => {
	siteRoot = path.resolve(siteRoot);
	directory = await checkedPath(siteRoot, directory);
	const location = editorPageLocation(siteRoot, directory);
	const directoryInfo = await stat(directory);
	if ((!location && directory !== siteRoot) || (!directoryInfo?.isDirectory() && !(location?.isHome && !directoryInfo))) {
		throw new Error('Select an existing page directory at a permitted location in this site.');
	}
	const content = await stat(path.join(directory, 'content.md'));
	const names = location ? sourceFileDefinitions.filter((entry) => entry.location === 'page' && (entry.input === 'title' ? !content : content?.isFile() || location.isHome)).map((entry) => entry.name) : [];
	if (directory === siteRoot || location?.isHome) {
		names.push(...sourceFileDefinitions.filter((entry) => entry.location === 'site-config').map((entry) => `site-config/${entry.name}`));
	}
	if (directory === siteRoot) names.push('root/content.md', 'root/tree-theme.yaml');
	const choices = [];
	for (const name of names) {
		const filename = path.join(name.startsWith('site-config/') || name.startsWith('root/') ? siteRoot : directory, name);
		if (await stat(filename)) continue;
		// A file or symlink occupying site-config must be repaired, not replaced.
		const parent = await stat(path.dirname(filename));
		if (parent && (!parent.isDirectory() || parent.isSymbolicLink())) continue;
		const definition = editorSourceDefinition(siteRoot, filename);
		choices.push({ filename, name, description: definition.description, input: definition.input,
			required: Boolean(definition.required), effect: definition.description });
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
