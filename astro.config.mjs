// @ts-check
import path from 'node:path';
import { defineConfig } from 'astro/config';
import {
	astroCacheDir,
	astroDistDir,
	astroPublicDir,
	engineRoot,
} from './scripts/lib/site-paths.mjs';
import projectConfig from './scripts/lib/project-config.mjs';

// https://astro.build/config
export default defineConfig({
	base: projectConfig.site.basePath,
	cacheDir: astroCacheDir,
	outDir: astroDistDir,
	publicDir: astroPublicDir,
	srcDir: path.join(engineRoot, 'src'),
});
