import { link, lstat, mkdir, readdir, rmdir, unlink } from 'node:fs/promises';
import path from 'node:path';
import { legacyHomePageDirectory } from './site-conventions.mjs';

const inspect = (filename) => lstat(filename).catch((error) => {
	if (error.code === 'ENOENT') return null;
	throw error;
});

// Planning is read-only. Never merge directories or overwrite existing paths.
export const planSiteUpgrade = async (siteRoot) => {
	siteRoot = path.resolve(siteRoot);
	if (!(await inspect(siteRoot))?.isDirectory()) throw new Error(`${siteRoot} must be a site directory, not a symbolic link.`);
	const pagesInfo = await inspect(path.join(siteRoot, 'pages'));
	if (pagesInfo?.isSymbolicLink()) throw new Error(`${siteRoot}/pages is a symbolic link. Convert a physical copy of the site instead.`);
	const oldRoot = path.join(siteRoot, 'pages', legacyHomePageDirectory);
	const oldInfo = await inspect(oldRoot);
	const plan = { siteRoot, oldRoot, moves: [], directories: [], files: [], sourceDirectories: [] };
	if (!oldInfo) {
		if (!(await inspect(path.join(siteRoot, 'content.md')))?.isFile()) {
			throw new Error(`No homepage found. Expected ${siteRoot}/content.md or ${oldRoot}/content.md.`);
		}
		return plan;
	}
	if (!oldInfo.isDirectory()) throw new Error(`${oldRoot} must be a directory, not a symbolic link or file.`);
	if (!(await inspect(path.join(oldRoot, 'content.md')))?.isFile()) throw new Error(`${oldRoot}/content.md is required for conversion.`);
	const entries = await readdir(oldRoot);
	const allowed = new Set(['content.md', 'images', 'theme.yaml', 'pages']);
	for (const entry of entries) {
		if (!allowed.has(entry)) throw new Error(`Cannot convert ${oldRoot}/${entry}. Move this extra file out of the old homepage directory first.`);
	}
	const scan = async (source, destination) => {
		if (await inspect(destination)) throw new Error(`Cannot convert: ${destination} already exists. No source files were changed.`);
		const info = await inspect(source);
		if (info.isFile()) {
			plan.files.push({ source, destination });
		} else if (info.isDirectory()) {
			plan.directories.push({ source, destination });
			for (const entry of (await readdir(source)).sort()) await scan(path.join(source, entry), path.join(destination, entry));
			plan.sourceDirectories.push(source);
		} else {
			throw new Error(`Cannot convert ${source}: symbolic links and special files need manual placement.`);
		}
	};
	for (const [name, target] of [['content.md', 'content.md'], ['images', 'images'], ['theme.yaml', 'page-theme.yaml']]) {
		if (!entries.includes(name)) continue;
		const source = path.join(oldRoot, name);
		const destination = path.join(siteRoot, target);
		const info = await inspect(source);
		if (name === 'images' ? !info.isDirectory() : !info.isFile()) throw new Error(`Unexpected file type at ${source}.`);
		await scan(source, destination);
		plan.moves.push({ source, destination });
	}
	if (entries.includes('pages')) {
		const children = path.join(oldRoot, 'pages');
		if (!(await inspect(children)).isDirectory() || (await readdir(children)).length) {
			throw new Error(`${children} is not empty. Place these child pages under ${siteRoot}/pages/ before converting; resolve any name conflicts yourself.`);
		}
		plan.sourceDirectories.push(children);
	}
	plan.sourceDirectories.push(oldRoot);
	return plan;
};

export const applySiteUpgrade = async (preview) => {
	const plan = await planSiteUpgrade(preview.siteRoot);
	if (JSON.stringify(plan) !== JSON.stringify(preview)) throw new Error('The site structure changed. Preview the conversion again.');
	const createdDirectories = [];
	const linkedFiles = [];
	const removedFiles = [];
	const removedDirectories = [];
	try {
		for (const entry of plan.directories) {
			await mkdir(entry.destination);
			createdDirectories.push(entry.destination);
		}
		// Hard links reserve each destination exclusively and preserve file bytes
		// and metadata. Source and destination are within the same site filesystem.
		for (const entry of plan.files) {
			await link(entry.source, entry.destination);
			linkedFiles.push(entry);
		}
		for (const entry of linkedFiles) {
			const [source, destination] = await Promise.all([lstat(entry.source), lstat(entry.destination)]);
			if (source.ino !== destination.ino || source.dev !== destination.dev) throw new Error(`Source changed during conversion: ${entry.source}.`);
			await unlink(entry.source);
			removedFiles.push(entry);
		}
		for (const directory of plan.sourceDirectories) {
			await rmdir(directory);
			removedDirectories.push(directory);
		}
	} catch (error) {
		// Restore removed sources before releasing the new paths. If rollback
		// meets a concurrent edit, retain the copies and report their locations.
		try {
			for (const directory of removedDirectories.reverse()) await mkdir(directory);
			for (const entry of removedFiles) await link(entry.destination, entry.source);
			for (const entry of linkedFiles.reverse()) await unlink(entry.destination);
			for (const directory of createdDirectories.reverse()) await rmdir(directory);
		} catch (rollbackError) {
			throw new Error(`Conversion stopped: ${error.message} Recovery also stopped: ${rollbackError.message}. Keep both ${plan.oldRoot} and ${plan.siteRoot}; remaining source copies must be reconciled manually.`);
		}
		throw new Error(`Conversion stopped; original files were restored. ${error.message}`);
	}
	return plan;
};
