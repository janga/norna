import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { cp, mkdir, mkdtemp, readFile, rename, rm, stat, utimes, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { promisify } from 'node:util';

const run = promisify(execFile);
const repoRoot = path.resolve(import.meta.dirname, '..');
const [mode, requestedDirectory = '.local/image-installation-bundle'] = process.argv.slice(2);
const bundle = path.resolve(requestedDirectory);
const npmCli = process.env.npm_execpath;
assert.ok(npmCli, 'Run through npm run test:image-installation -- prepare|check [bundle-directory].');
assert.ok(['prepare', 'check'].includes(mode), 'Choose prepare or check.');
const node = (args, cwd, env = process.env) => run(process.execPath, args, { cwd, env, maxBuffer: 20 * 1024 * 1024 }).catch(error => {
	throw new Error([error.message, error.stdout, error.stderr].filter(Boolean).join('\n'));
});
const npm = (args, cwd) => node([npmCli, ...args, '--no-audit', '--no-fund'], cwd);
const readJson = async filename => JSON.parse(await readFile(filename, 'utf8'));
const saveJson = (filename, data) => writeFile(filename, JSON.stringify(data, null, 2) + '\n');
// Loading a native DLL in this process would keep Windows from removing the
// temporary installation. Let a child exit and release it before cleanup.
const withInstalledSharp = (project, source, args = []) => node(['--input-type=module', '-e', `
import { createRequire } from 'node:module';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
const require = createRequire(path.resolve('node_modules/@janga/norna/package.json'));
const sharp = (await import(pathToFileURL(require.resolve('sharp')).href)).default;
${source}
`, ...args], project);

if (mode === 'prepare') {
	// Fail rather than overwrite an earlier bundle or its test results.
	await mkdir(path.dirname(bundle), { recursive: true });
	await mkdir(bundle);
	const project = path.join(bundle, 'project');
	const packageInfo = JSON.parse((await npm(['pack', '--json', '--pack-destination', bundle], repoRoot)).stdout);
	await rename(path.join(bundle, packageInfo[0].filename), path.join(bundle, 'norna.tgz'));
	const bootstrap = await mkdtemp(path.join(tmpdir(), 'norna-image-bootstrap-'));
	try {
		await saveJson(path.join(bootstrap, 'package.json'), { private: true, dependencies: { '@janga/norna': pathToFileURL(path.join(bundle, 'norna.tgz')).href } });
		await npm(['install', '--include=optional'], bootstrap);
		const cli = path.join(bootstrap, 'node_modules/@janga/norna/bin/norna.mjs');
		await node([cli, 'init', project], bootstrap);
		const packagePath = path.join(project, 'package.json');
		const config = await readJson(packagePath);
		config.dependencies['@janga/norna'] = 'file:../norna.tgz';
		await saveJson(packagePath, config);
		// Created without node_modules: this one lockfile is transported to all OS jobs.
		await npm(['install', '--package-lock-only', '--include=optional', '--ignore-scripts'], project);
		const imageDir = path.join(project, 'site/root/images');
		await mkdir(imageDir, { recursive: true });
		await cp(path.join(repoRoot, 'fixtures/content-model-v2/site/root/images/image.jpg'), path.join(imageDir, 'photo.jpg'));
		await withInstalledSharp(bootstrap, `
await sharp({ create: { width: 960, height: 600, channels: 4, background: { r: 30, g: 140, b: 80, alpha: 0.5 } } })
 .png().toFile(process.argv[1]);`, [path.join(imageDir, 'alpha.png')]);
		await writeFile(path.join(project, 'site/root/content.md'), '# Installation test\n\n![Photograph](images/photo.jpg)\n\n```image-stack\nitems:\n  - image: alpha.png\n    alt: Transparent sample\n```\n');
		const workflow = await readFile(path.join(project, '.github/workflows/deploy.yml'), 'utf8');
		assert.doesNotMatch(workflow, /imagemagick/i);
		assert.match(workflow, /site\/\.norna\/public\/_norna\/images/);
		console.log(`Prepared candidate tarball, site and shared lockfile in ${bundle}`);
	} finally { await rm(bootstrap, { recursive: true, force: true }); }
} else {
	const temporary = await mkdtemp(path.join(tmpdir(), 'norna-image-installation-'));
	try {
		await cp(bundle, temporary, { recursive: true });
		const project = path.join(temporary, 'project');
		assert.equal((await readJson(path.join(project, 'package.json'))).dependencies['@janga/norna'], 'file:../norna.tgz');
		await npm(['ci', '--include=optional'], project);
		const engineRoot = path.join(project, 'node_modules/@janga/norna');
		const engine = await readJson(path.join(engineRoot, 'package.json'));
		assert.ok(engine.dependencies.sharp, 'The packed engine must declare Sharp directly.');
		const cli = path.join(engineRoot, 'bin/norna.mjs');
		// Exercise the candidate's init on this OS too, without fetching a release.
		const created = path.join(temporary, 'created');
		await node([cli, 'init', created], project);
		assert.equal((await readJson(path.join(created, 'package.json'))).dependencies['@janga/norna'], engine.version);
		const guard = path.join(temporary, 'no-imagemagick.mjs');
		const attempts = path.join(temporary, 'image-command-attempts.txt');
		await writeFile(guard, `import childProcess from 'node:child_process';
import { syncBuiltinESMExports } from 'node:module';
import { appendFileSync } from 'node:fs';
for (const name of ['spawn', 'spawnSync', 'execFile', 'execFileSync', 'exec', 'execSync']) {
 const original = childProcess[name];
 childProcess[name] = function(command, ...args) {
  if (/(?:^|[\\\\/\\s"'])(?:magick|identify|convert)(?:\\.exe|\\.cmd)?(?:$|[\\s"'])/i.test(String(command))) {
   appendFileSync(process.env.NORNA_IMAGE_COMMAND_ATTEMPTS, String(command) + '\\n');
   throw new Error('ImageMagick is forbidden in this installation test');
  }
  return original.call(this, command, ...args);
 };
}
syncBuiltinESMExports();
`);
		const env = { ...process.env, NODE_OPTIONS: `--import=${pathToFileURL(guard).href}`, NORNA_IMAGE_COMMAND_ATTEMPTS: attempts };
		await node(['--input-type=module', '-e', "import assert from 'node:assert/strict'; import { execFileSync } from 'node:child_process'; assert.throws(() => execFileSync('magick'), /forbidden/);"], project, env);
		await rm(attempts);
		await node([cli, 'build'], project, env);
		const manifestPath = path.join(project, 'site/.norna/generated-images.json');
		const manifest = await readJson(manifestPath);
		const filenames = Object.values(manifest).flatMap(entry => entry.variants.map(variant => path.join(project, 'site/.norna/public', variant.src)));
		const probe = JSON.parse((await withInstalledSharp(project, `
const metadata = await Promise.all(JSON.parse(process.argv[1]).map(filename => sharp(filename).metadata()));
console.log(JSON.stringify({ version: sharp.versions.sharp, metadata }));`, [JSON.stringify(filenames)])).stdout);
		let metadataIndex = 0;
		const oldTime = new Date('2000-01-01');
		const html = await readFile(path.join(project, 'dist/index.html'), 'utf8');
		for (const [source, entry] of Object.entries(manifest)) {
			assert.ok(entry.variants.length > 0);
			for (const variant of entry.variants) {
				const filename = path.join(project, 'site/.norna/public', variant.src);
				const meta = probe.metadata[metadataIndex++];
				assert.equal(meta.format, 'webp');
				assert.equal(meta.width, variant.width);
				if (source.endsWith('alpha.png')) assert.equal(meta.hasAlpha, true);
				assert.ok(html.includes(variant.src));
				await utimes(filename, oldTime, oldTime);
			}
		}
		assert.equal(Object.keys(manifest).length, 2);
		await node([cli, 'build'], project, env);
		assert.deepEqual(await readJson(manifestPath), manifest);
		for (const entry of Object.values(manifest)) for (const variant of entry.variants) {
			assert.equal((await stat(path.join(project, 'site/.norna/public', variant.src))).mtimeMs, oldTime.getTime());
		}
		await assert.rejects(stat(attempts), { code: 'ENOENT' });
		console.log(`Image installation passed: ${process.platform}/${process.arch}, Node ${process.version}, npm ${(await npm(['--version'], project)).stdout.trim()}, Norna ${engine.version}, Sharp ${probe.version}`);
	} finally { await rm(temporary, { recursive: true, force: true }); }
}
