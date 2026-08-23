#!/usr/bin/env node
import path from 'node:path';

const args = process.argv.slice(2);
process.env.NORNA_INVOCATION_ROOT ??= process.cwd();

const usage = `
Usage: norna <command> [options]

Commands:
  dev:local              Start local Astro dev server
  dev:lan                Start dev server for this local network
  dev:restart            Restart local Astro dev server
  dev:status             Show local dev server status
  dev:logs               Show local dev server logs
  dev:stop               Stop local dev server
  check                  Validate configuration and content
  config:check           Validate site/config.yaml
  content:check          Validate site/content.md and image references
  content:sync           Move misplaced Norna-managed images and refresh generated images
  theme:presets          List available theme presets and their intended uses
  theme:export           Export a commented theme preset reference
  typography profiles    Show built-in typography profile values
  typography show        Show resolved typography for the selected site
  site:public            Sync site/public/ to public/
  images                 Generate optimized image variants
  engine:update          Update @janga/norna in a site repository
  engine:version         Show installed engine and Astro versions
  init                   Create a new site project from the starter
  build                  Build the selected site
  build:local            Build and restart local dev server
  deploy                 Build and deploy committed branch
  deploy:commit          Build, commit allowed changes, push, and check Pages
  deploy:watch           Watch GitHub Pages workflow
  preview                Preview dist/
  astro                  Run Astro with norna config
  doctor                 Print resolved paths

Global options:
  --site-dir <path>      Use a specific site source directory
  -h, --help             Show this help
`.trim();

const parseArgs = (rawArgs) => {
	const commandArgs = [];
	let siteDir = null;

	for (let index = 0; index < rawArgs.length; index += 1) {
		const arg = rawArgs[index];

		if (arg === '--site-dir') {
			const value = rawArgs[index + 1];
			if (!value || value.startsWith('-')) {
				throw new Error('--site-dir requires a path.');
			}

			siteDir = value;
			index += 1;
			continue;
		}

		if (arg.startsWith('--site-dir=')) {
			siteDir = arg.slice('--site-dir='.length);
			if (!siteDir) {
				throw new Error('--site-dir requires a path.');
			}
			continue;
		}

		commandArgs.push(arg);
	}

	return { commandArgs, siteDir };
};

let parsedArgs;

try {
	parsedArgs = parseArgs(args);
} catch (error) {
	console.error(error instanceof Error ? error.message : String(error));
	process.exit(1);
}

const { commandArgs, siteDir } = parsedArgs;

if (siteDir) {
	process.env.NORNA_SITE_DIR = siteDir;
}

const [command = 'help', ...rest] = commandArgs;
const [subcommand, ...subcommandRest] = rest;

if (command === '-h' || command === '--help' || command === 'help') {
	console.log(usage);
	process.exit(0);
}

const [
	{ runAstroInherit },
	{ engineRoot, siteProjectRoot },
	{ runInherit },
] = await Promise.all([
	import('../scripts/lib/astro-command.mjs'),
	import('../scripts/lib/site-paths.mjs'),
	import('../scripts/lib/run-command.mjs'),
]);

const runScript = (relativePath, scriptArgs = []) => runInherit(
	process.execPath,
	[path.join(engineRoot, relativePath), ...scriptArgs],
	{ cwd: siteProjectRoot },
);

const runBuild = () => runScript('scripts/build-site.mjs');

try {
	if (command === 'dev' || command === 'dev:local') {
		await runScript('scripts/dev-local.mjs', rest);
	} else if (command === 'dev:lan') {
		await runScript('scripts/dev-local.mjs', ['lan', ...rest]);
	} else if (command === 'dev:restart') {
		await runScript('scripts/dev-local.mjs', ['restart', ...rest]);
	} else if (command === 'dev:status') {
		await runScript('scripts/dev-local.mjs', ['status', ...rest]);
	} else if (command === 'dev:logs') {
		await runScript('scripts/dev-local.mjs', ['logs', ...rest]);
	} else if (command === 'dev:stop') {
		await runScript('scripts/dev-local.mjs', ['stop', ...rest]);
	} else if (command === 'check') {
		await runScript('scripts/check-config.mjs', rest);
		await runScript('scripts/sync-content-sections.mjs', ['--check', ...rest]);
	} else if (command === 'config:check') {
		await runScript('scripts/check-config.mjs', rest);
	} else if (command === 'content:check') {
		await runScript('scripts/sync-content-sections.mjs', ['--check', ...rest]);
	} else if (command === 'content:sync') {
		await runScript('scripts/sync-content-sections.mjs', ['--write', ...rest]);
		await runScript('scripts/generate-images.mjs', rest);
	} else if (command === 'theme:presets') {
		await runScript('scripts/list-theme-presets.mjs', rest);
	} else if (command === 'theme:export') {
		await runScript('scripts/export-theme-preset.mjs', rest);
	} else if (command === 'typography:profiles' || (command === 'typography' && subcommand === 'profiles')) {
		const scriptArgs = command === 'typography' ? subcommandRest : rest;
		await runScript('scripts/show-typography.mjs', ['profiles', ...scriptArgs]);
	} else if (command === 'typography:show' || (command === 'typography' && subcommand === 'show')) {
		const scriptArgs = command === 'typography' ? subcommandRest : rest;
		await runScript('scripts/show-typography.mjs', ['show', ...scriptArgs]);
	} else if (command === 'typography') {
		throw new Error(`Unknown typography command: ${subcommand ?? ''}\n${usage}`);
	} else if (command === 'site:public') {
		await runScript('scripts/sync-site-public.mjs', rest);
	} else if (command === 'images') {
		await runScript('scripts/generate-images.mjs', rest);
	} else if (command === 'engine:update') {
		await runScript('scripts/update-engine.mjs', rest);
	} else if (command === 'engine:version') {
		await runScript('scripts/engine-version.mjs', rest);
	} else if (command === 'init') {
		await runScript('scripts/init-site.mjs', rest);
	} else if (command === 'build') {
		await runBuild();
	} else if (command === 'build:local') {
		await runBuild();
		await runScript('scripts/dev-local.mjs', ['restart']);
	} else if (command === 'deploy') {
		await runScript('scripts/deploy-site.mjs', rest);
	} else if (command === 'deploy:commit') {
		await runScript('scripts/deploy-site.mjs', ['commit', ...rest]);
	} else if (command === 'deploy:watch') {
		await runScript('scripts/watch-pages-deploy.mjs', rest);
	} else if (command === 'doctor') {
		await runScript('scripts/doctor.mjs', rest);
	} else if (command === 'astro') {
		await runAstroInherit(rest);
	} else if (command === 'preview') {
		await runAstroInherit(['preview', ...rest]);
	} else {
		throw new Error(`Unknown command: ${command}\n${usage}`);
	}
} catch (error) {
	console.error(error instanceof Error ? error.message : String(error));
	process.exit(1);
}
