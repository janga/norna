// @ts-check
import path from 'node:path';
import { defineConfig } from 'astro/config';
import {
	astroCacheDir,
	astroDistDir,
	astroPublicDir,
	engineRoot,
	generatedImagesManifestPath,
} from './scripts/lib/site-paths.mjs';
import projectConfig from './scripts/lib/project-config.mjs';

const nornaGeneratedImagesWatcher = () => ({
	name: 'norna-generated-images-watcher',
	configureServer(server) {
		const manifestPath = path.resolve(generatedImagesManifestPath);
		server.watcher.add(manifestPath);
		server.watcher.on('change', (changedPath) => {
			if (path.resolve(changedPath) !== manifestPath) return;

			server.ws.send({ type: 'full-reload' });
		});
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
