// @ts-check
import { execFile } from 'node:child_process';
import path from 'node:path';
import { promisify } from 'node:util';
import { defineConfig } from 'astro/config';
import {
	astroCacheDir,
	astroDistDir,
	astroPublicDir,
	engineRoot,
	generatedImagesManifestPath,
	siteContentPath,
	siteImagesDir,
	siteProjectRoot,
	sitePagesDir,
} from './scripts/lib/site-paths.mjs';
import projectConfig from './scripts/lib/project-config.mjs';

const execFileAsync = promisify(execFile);

const isWithinDirectory = (parentDirectory, filePath) => {
	const relativePath = path.relative(parentDirectory, filePath);
	return relativePath === '' || (!relativePath.startsWith('..') && !path.isAbsolute(relativePath));
};

const runGenerateImages = () => execFileAsync(process.execPath, [path.join(engineRoot, 'scripts', 'generate-images.mjs')], {
	cwd: siteProjectRoot,
	maxBuffer: 1024 * 1024 * 10,
});

const nornaGeneratedImagesWatcher = () => ({
	name: 'norna-generated-images-watcher',
	configureServer(server) {
		const manifestPath = path.resolve(generatedImagesManifestPath);
		const watchedSourcePaths = [
			siteContentPath,
			siteImagesDir,
			sitePagesDir,
		].map((watchedPath) => path.resolve(watchedPath));
		let refreshTimer;
		let refreshPromise = Promise.resolve();

		const isRelevantSourcePath = (changedPath) => {
			const resolvedPath = path.resolve(changedPath);
			return watchedSourcePaths.some((watchedPath) => (
				resolvedPath === watchedPath || isWithinDirectory(watchedPath, resolvedPath)
			));
		};

		const refreshImages = () => {
			refreshPromise = refreshPromise
				.catch(() => {})
				.then(async () => {
					try {
						await runGenerateImages();
					} catch (error) {
						const message = error instanceof Error ? error.message : String(error);
						server.config.logger.error(`Norna image refresh failed:\n${message}`);
					}
				});
		};

		const scheduleRefreshImages = (changedPath) => {
			if (!isRelevantSourcePath(changedPath)) return;

			clearTimeout(refreshTimer);
			refreshTimer = setTimeout(refreshImages, 250);
		};

		server.watcher.add(manifestPath);
		server.watcher.add(watchedSourcePaths);
		server.watcher.on('change', (changedPath) => {
			if (path.resolve(changedPath) !== manifestPath) return;

			server.ws.send({ type: 'full-reload' });
		});
		server.watcher.on('add', scheduleRefreshImages);
		server.watcher.on('change', scheduleRefreshImages);
		server.watcher.on('unlink', scheduleRefreshImages);
		server.watcher.on('addDir', scheduleRefreshImages);
		server.watcher.on('unlinkDir', scheduleRefreshImages);
	},
});

// https://astro.build/config
export default defineConfig({
	base: projectConfig.site.basePath,
	cacheDir: astroCacheDir,
	outDir: astroDistDir,
	publicDir: astroPublicDir,
	srcDir: path.join(engineRoot, 'src'),
	vite: {
		plugins: [nornaGeneratedImagesWatcher()],
	},
});
