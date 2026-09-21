import { link, lstat, mkdir, readFile, readdir, rmdir, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { legacyHomePageDirectory } from './site-conventions.mjs';

const inspect = (filename) => lstat(filename).catch((error) => {
	if (error.code === 'ENOENT') return null;
	throw error;
});

const relocatedSchemaSource = (source, from, to) => source.replace(
	/^(\uFEFF?#\s*yaml-language-server:\s*\$schema=)([^\s\r\n]+)/gm,
	(match, prefix, schema) => {
		if (path.isAbsolute(schema) || /^[a-z][a-z0-9+.-]*:/i.test(schema)) return match;
		const target = path.resolve(path.dirname(from), schema);
		const relative = path.relative(path.dirname(to), target).split(path.sep).join('/');
		return prefix + (relative.startsWith('.') ? relative : `./${relative}`);
	},
);

// Planning is read-only. A destination may exist only when an earlier move
// vacates it: the former global theme becomes the homepage theme's new path.
export const planSiteUpgrade = async (siteRoot) => {
	siteRoot = path.resolve(siteRoot);
	if (!(await inspect(siteRoot))?.isDirectory()) throw new Error(`${siteRoot} must be a site directory, not a symbolic link.`);
	const pagesInfo = await inspect(path.join(siteRoot, 'pages'));
	if (pagesInfo?.isSymbolicLink()) throw new Error(`${siteRoot}/pages is a symbolic link. Convert a physical copy of the site instead.`);
	const oldRoot = path.join(siteRoot, 'pages', legacyHomePageDirectory);
	const plan = { siteRoot, oldRoot, moves: [], directories: [], files: [], sourceDirectories: [] };
	const vacatedPaths = new Set();
	const requireFile = async (filename) => {
		if (!(await inspect(filename))?.isFile()) throw new Error(`${filename} must be a regular file, not a symbolic link, for conversion.`);
	};
	const scan = async (source, destination) => {
		if (await inspect(destination) && !vacatedPaths.has(destination)) throw new Error(`Cannot convert: ${destination} already exists. No source files were changed.`);
		const info = await inspect(source);
		if (info?.isFile()) {
			const file = { source, destination, device: info.dev, inode: info.ino };
			if (path.extname(source) === '.yaml') {
				const original = await readFile(source, 'utf8');
				const replacement = relocatedSchemaSource(original, source, destination);
				if (replacement !== original) Object.assign(file, { original, replacement, mode: info.mode });
			}
			plan.files.push(file);
			vacatedPaths.add(source);
		} else if (info?.isDirectory()) {
			plan.directories.push(destination);
			for (const entry of (await readdir(source)).sort()) await scan(path.join(source, entry), path.join(destination, entry));
			plan.sourceDirectories.push(source);
		} else {
			throw new Error(`Cannot convert ${source}: symbolic links and special files need manual placement.`);
		}
	};
	const move = async (source, destination) => {
		await scan(source, destination);
		plan.moves.push({ source, destination });
	};
	const configDirectory = path.join(siteRoot, 'site-config');
	const oldConfig = path.join(siteRoot, 'config.yaml');
	if (await inspect(oldConfig)) {
		await requireFile(oldConfig);
		await requireFile(path.join(siteRoot, 'theme.yaml'));
		if (await inspect(configDirectory)) throw new Error(`Cannot convert: ${configDirectory} already exists. Resolve the mixed configuration layouts before conversion. No source files were changed.`);
		plan.directories.push(configDirectory);
		for (const [oldName, newName] of [['config.yaml', 'settings.yaml'], ['theme.yaml', 'site-theme.yaml'], ['sitewide-content.yaml', 'shared-content.yaml']]) {
			const source = path.join(siteRoot, oldName);
			if (!(await inspect(source))) continue;
			await requireFile(source);
			await move(source, path.join(configDirectory, newName));
		}
	} else {
		if (!(await inspect(configDirectory))?.isDirectory()) throw new Error(`Expected ${configDirectory}/settings.yaml or the former ${oldConfig}. The configuration directory must not be a symbolic link.`);
		await requireFile(path.join(configDirectory, 'settings.yaml'));
		await requireFile(path.join(configDirectory, 'site-theme.yaml'));
		if (await inspect(path.join(siteRoot, 'sitewide-content.yaml'))) throw new Error('Resolve the mixed shared-content locations before conversion. No source files were changed.');
	}
	const oldInfo = await inspect(oldRoot);
	const oldHomepageTheme = path.join(siteRoot, 'page-theme.yaml');
	if (oldInfo) {
		if (!oldInfo.isDirectory()) throw new Error(`${oldRoot} must be a directory, not a symbolic link or file.`);
		await requireFile(path.join(oldRoot, 'content.md'));
		if (await inspect(oldHomepageTheme)) throw new Error(`Cannot convert: ${oldHomepageTheme} already exists alongside the former homepage folder. Resolve the two homepage themes first.`);
		const entries = await readdir(oldRoot);
		const allowed = new Set(['content.md', 'images', 'theme.yaml', 'pages']);
		for (const entry of entries) {
			if (!allowed.has(entry)) throw new Error(`Cannot convert ${oldRoot}/${entry}. Move this extra file out of the old homepage directory first.`);
		}
		for (const name of ['content.md', 'images', 'theme.yaml']) {
			if (!entries.includes(name)) continue;
			const source = path.join(oldRoot, name);
			const info = await inspect(source);
			if (name === 'images' ? !info.isDirectory() : !info.isFile()) throw new Error(`Unexpected file type at ${source}; symbolic links need manual placement.`);
			await move(source, path.join(siteRoot, name));
		}
		if (entries.includes('pages')) {
			const children = path.join(oldRoot, 'pages');
			if (!(await inspect(children)).isDirectory() || (await readdir(children)).length) {
				throw new Error(`${children} is not empty. Place these child pages under ${siteRoot}/pages/ before converting; resolve any name conflicts yourself.`);
			}
			plan.sourceDirectories.push(children);
		}
		plan.sourceDirectories.push(oldRoot);
	} else {
		await requireFile(path.join(siteRoot, 'content.md'));
		if (await inspect(oldHomepageTheme)) {
			await requireFile(oldHomepageTheme);
			await move(oldHomepageTheme, path.join(siteRoot, 'theme.yaml'));
		}
	}
	return plan;
};

export const applySiteUpgrade = async (preview, operations = {}) => {
	const linkFile = operations.link ?? link;
	const removeDirectory = operations.rmdir ?? rmdir;
	const plan = await planSiteUpgrade(preview.siteRoot);
	if (JSON.stringify(plan) !== JSON.stringify(preview)) throw new Error('The site structure changed. Preview the conversion again.');
	const createdDirectories = [];
	const movedFiles = [];
	const removedDirectories = [];
	let pendingLink;
	try {
		for (const directory of plan.directories) {
			await mkdir(directory);
			createdDirectories.push(directory);
		}
		// Reserve each destination exclusively before removing its source. This
		// also handles theme.yaml changing ownership without overwriting it.
		for (const entry of plan.files) {
			if (entry.replacement !== undefined) await writeFile(entry.destination, entry.replacement, { flag: 'wx', mode: entry.mode });
			else await linkFile(entry.source, entry.destination);
			pendingLink = entry;
			const [source, destination] = await Promise.all([lstat(entry.source), lstat(entry.destination)]);
			const unchanged = entry.replacement === undefined
				? source.ino === destination.ino && source.dev === destination.dev
				: await readFile(entry.source, 'utf8') === entry.original && await readFile(entry.destination, 'utf8') === entry.replacement;
			if (source.ino !== entry.inode || source.dev !== entry.device || !unchanged) throw new Error(`Source changed during conversion: ${entry.source}.`);
			await unlink(entry.source);
			movedFiles.push(entry);
			pendingLink = undefined;
		}
		for (const directory of plan.sourceDirectories) {
			await removeDirectory(directory);
			removedDirectories.push(directory);
		}
	} catch (error) {
		try {
			for (const directory of removedDirectories.reverse()) await mkdir(directory);
			if (pendingLink) await unlink(pendingLink.destination);
			for (const entry of movedFiles.reverse()) {
				if (entry.original !== undefined) await writeFile(entry.source, entry.original, { flag: 'wx', mode: entry.mode });
				else await link(entry.destination, entry.source);
				await unlink(entry.destination);
			}
			for (const directory of createdDirectories.reverse()) await rmdir(directory);
		} catch (rollbackError) {
			throw new Error(`Conversion stopped: ${error.message} Recovery also stopped: ${rollbackError.message}. Keep the remaining source copies in ${plan.siteRoot}; reconcile them manually before retrying.`);
		}
		throw new Error(`Conversion stopped; original files were restored. ${error.message}`);
	}
	return plan;
};
