// @ts-check
import { execFile } from 'node:child_process';
import path from 'node:path';
import { promisify } from 'node:util';
import { defineConfig } from 'astro/config';
import { satteri } from '@astrojs/markdown-satteri';
import { prepareContentTabs } from './scripts/lib/content-tabs.mjs';
import { getBasePathRedirectLocation } from './scripts/lib/base-path-redirect.mjs';
import { nornaCodeFenceTransformer } from './scripts/lib/code-fence-metadata.mjs';
import { nornaMarkdownRenderPlugin } from './scripts/lib/norna-markdown-render-plugin.mjs';
import { nornaNotesRenderPlugin } from './scripts/lib/markdown-notes-render-plugin.mjs';
import { nornaTableRenderPlugin } from './scripts/lib/table-render-plugin.mjs';
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
const navigationPrototype = process.env.NORNA_NAVIGATION_PROTOTYPE === '1';

const isWithinDirectory = (parentDirectory, filePath) => {
	const relativePath = path.relative(parentDirectory, filePath);
	return relativePath === '' || (!relativePath.startsWith('..') && !path.isAbsolute(relativePath));
};

const runGenerateImages = () => execFileAsync(process.execPath, [path.join(engineRoot, 'scripts', 'generate-images.mjs')], {
	cwd: siteProjectRoot,
	maxBuffer: 1024 * 1024 * 10,
});

const nornaBasePathRedirect = () => {
	const middleware = (request, response, next) => {
		if (!request.url) {
			next();
			return;
		}

		const redirectLocation = getBasePathRedirectLocation(projectConfig.site.basePath, request.url);
		if (!redirectLocation) {
			next();
			return;
		}

		response.statusCode = 308;
		response.setHeader('Location', redirectLocation);
		response.end();
	};

	return {
		name: 'norna-base-path-redirect',
		configureServer(server) {
			return () => {
				server.middlewares.stack.unshift({ route: '', handle: middleware });
			};
		},
		configurePreviewServer(server) {
			server.middlewares.use(middleware);
		},
	};
};

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
		let structureReloadTimer;
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

		const scheduleStructureReload = (changedPath) => {
			if (!isRelevantSourcePath(changedPath)) return;
			const filename = path.basename(changedPath);
			if (filename !== 'category.yaml' && filename !== 'theme.yaml') return;

			clearTimeout(structureReloadTimer);
			structureReloadTimer = setTimeout(() => {
				server.ws.send({ type: 'full-reload' });
			}, 300);
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
		server.watcher.on('add', scheduleStructureReload);
		server.watcher.on('change', scheduleStructureReload);
		server.watcher.on('unlink', scheduleStructureReload);
	},
});

const markdownProcessor = satteri({
	features: {
		gfm: { footnotes: {
			label: projectConfig.locale.labels.footnotes,
			backLabel: projectConfig.locale.labels.footnoteBackReference,
		} },
	},
	mdastPlugins: [nornaNotesRenderPlugin, nornaMarkdownRenderPlugin],
	hastPlugins: [nornaTableRenderPlugin],
});
const createMarkdownRenderer = markdownProcessor.createRenderer.bind(markdownProcessor);
markdownProcessor.createRenderer = async (shared) => {
	const renderer = await createMarkdownRenderer(shared);
	return {
		...renderer,
		render(source, options) {
			return renderer.render(prepareContentTabs(source, {
				label: options?.fileURL?.pathname ?? 'Markdown',
			}), options);
		},
	};
};

// https://astro.build/config
export default defineConfig({
	base: projectConfig.site.basePath,
	cacheDir: astroCacheDir,
	prefetch: navigationPrototype
		? { prefetchAll: false, defaultStrategy: 'hover' }
		: false,
	integrations: navigationPrototype ? [{
		name: 'norna-navigation-prototype',
		hooks: {
			'astro:config:setup': ({ injectScript }) => {
				injectScript('page', `
					import { prefetch } from 'astro:prefetch';
					import { setupNavigationPrototype } from ${JSON.stringify(path.join(engineRoot, 'src/lib/navigationPrototype.ts'))};
					if (document.documentElement.hasAttribute('data-navigation-prototype')) {
						setupNavigationPrototype(prefetch);
					}
				`);
			},
		},
	}] : [],
	markdown: {
		shikiConfig: {
			transformers: [nornaCodeFenceTransformer],
		},
		processor: markdownProcessor,
	},
	outDir: astroDistDir,
	publicDir: astroPublicDir,
	srcDir: path.join(engineRoot, 'src'),
	vite: {
		server: {
			strictPort: true,
		},
		plugins: [nornaBasePathRedirect(), nornaGeneratedImagesWatcher()],
	},
});
