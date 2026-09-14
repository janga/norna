import { execFileSync } from 'node:child_process';
import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import net from 'node:net';
import { fileURLToPath } from 'node:url';
import {
	downloadAndUnzipVSCode,
	resolveCliArgsFromVSCodeExecutablePath,
	runTests,
} from '@vscode/test-electron';

const testDirectory = path.dirname(fileURLToPath(import.meta.url));
const extensionRoot = path.dirname(testDirectory);
const repositoryRoot = path.resolve(extensionRoot, '..', '..');
const cacheRoot = path.join(extensionRoot, '.vscode-test');
const workspaceRoot = path.join(cacheRoot, 'workspace');
const extensionsDirectory = path.join(cacheRoot, 'extensions');
const userDataDirectory = path.join(cacheRoot, 'user-data');
const inspectorPort = 9238;
const engineRoot = path.join(workspaceRoot, 'node_modules', '@janga', 'norna');
const commandArguments = process.argv.slice(2);
const suiteIndex = commandArguments.indexOf('--suite');
const suite = suiteIndex === -1 ? 'all' : commandArguments[suiteIndex + 1];
if (!['all', 'constructions', 'priority'].includes(suite)) throw new Error('Use --suite all, --suite constructions, or --suite priority.');
if (suiteIndex !== -1) commandArguments.splice(suiteIndex, 2);
const prettierIndex = commandArguments.indexOf('--with-prettier');
const withPrettier = prettierIndex !== -1;
if (withPrettier) commandArguments.splice(prettierIndex, 1);
const versionArgument = commandArguments[0] === '--version' ? commandArguments[1] : undefined;
if (commandArguments.length > 0 && (!versionArgument || commandArguments.length !== 2)) {
	throw new Error('Usage: node test/run-integration.mjs [--version <VS Code version>] [--with-prettier] [--suite all|constructions|priority]');
}
const version = versionArgument ?? process.env.NORNA_VSCODE_TEST_VERSION ?? 'stable';
let engineVersion;

const write = async (relativePath, source) => {
	const filename = path.join(workspaceRoot, relativePath);
	await mkdir(path.dirname(filename), { recursive: true });
	await writeFile(filename, source);
};

const prepareWorkspace = async () => {
	await rm(workspaceRoot, { force: true, recursive: true });
	await mkdir(engineRoot, { recursive: true });
	await cp(path.join(repositoryRoot, 'schemas'), path.join(engineRoot, 'schemas'), { recursive: true });
	await cp(path.join(repositoryRoot, 'scripts', 'lib'), path.join(engineRoot, 'scripts', 'lib'), { recursive: true });
	const repositoryPackage = JSON.parse(await readFile(path.join(repositoryRoot, 'package.json'), 'utf8'));
	engineVersion = repositoryPackage.version;
	await writeFile(path.join(engineRoot, 'package.json'), JSON.stringify({
		name: repositoryPackage.name,
		type: 'module',
		version: repositoryPackage.version,
	}, null, 2));
	await write('package.json', JSON.stringify({
		name: 'norna-vscode-integration-site',
		private: true,
		version: '1.0.0',
	}, null, 2));
	await write('site/config.yaml', 'url: https://example.com/\n');
	await write('.vscode/settings.json', JSON.stringify({
		...(withPrettier ? { 'editor.defaultFormatter': 'esbenp.prettier-vscode', 'editor.formatOnSave': true } : {}),
		'[markdown]': { 'editor.formatOnSave': false },
		'[yaml]': { 'editor.defaultFormatter': 'redhat.vscode-yaml' },
	}));
	await write('site/theme.yaml', [
		'preset: ',
		'typography:',
		'  fontFamily: "Inter, sans-serif"',
		'  ',
		'sections:',
		'  backgroundPattern: alternating',
		'',
	].join('\n'));
	await write('site/sitewide-content.yaml', 'footer:\n  copyrightMessage: Example\n');
	await write('site/pages/000-home/content.md', `---
page:
  description: Editor integration fixture.
---

# Editor fixture

## Intro {#intro}

Text with an unmatched note reference [^margin:missing].

\`\`\`image-stack
items:
  - image: portrait.jpg
  - image:${' '}
\`\`\`
`);
	await write('site/pages/000-home/images/intro/local.svg', '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"/>\n');
	await write('site/pages/010-about/content.md', `# About

## Team {#team}

Team content.
`);
	await write('site/pages/010-about/pages/010-team/content.md', `# Team

## People {#people}

Team members.
`);
	await write('site/pages/010-about/images/team/portrait.jpg', 'test image');
	await write('site/pages/020-empty/content.md', '');
	await write('site/pages/030-block/content.md', `# Blocks

## Example {#example}

\`\`\`
\`\`\`
`);
	await write('site/pages/040-unclosed/content.md', `# Unclosed block

## Example {#example}

\`\`\`image-stack
items:
  - image: missing.jpg
`);
	await write('site/pages/050-callouts/content.md', `# Callouts

## Completion {#completion}

> [!
`);
await write('site/pages/060-save-callout/content.md', `# Save callout

## Example {#example}

> [!TIP]
> Use a tip for helpful guidance.

> [!INFO]
> An unknown type remains a neutral blockquote.

> [!WARNING]
> A warning keeps its body on the next quoted line.

\`\`\`\`md
> [!TIP]
> This example is inside a code fence.
\`\`\`\`

\`\`\`card-list
items:
  - text: |-
      First line.
      Second line.
    title: "Quoted: title"
layout: image-top
\`\`\`

:::: tabs

::: tab "First"

> [!TIP]
> Inside an alternative.

:::

::: tab "Second"

Another option.

:::

::::

Body text.[^margin:context]

[^margin:context]: A single paragraph.
`);
	await write('site/notes.md', '# Ordinary Markdown\n');
	await write('site/settings.yaml', '');
	await write('ordinary/content.md', '# Ordinary Markdown\n');
	await write('ordinary/theme.yaml', '');
	await write('examples/complete-sites/priority/site/config.yaml', 'url: https://example.com/\n');
	await write('examples/complete-sites/priority/site/pages/000-home/content.md', '# Example\n');
	await write('site/pages/070-embedded/content.md', [
		'# Embedded YAML', '', '```card-list', 'items:',
		'  - text: |-', '      First line.', '      Second line.',
		'    title: "Card: first"', '    ', 'layout: image-top', '```', '',
	].join('\n'));
	await write('other.yaml', 'preset: \n');
	await write('site/pages/080-authoring/content.md', '# Authoring\n\n```image-st');
	await write('site/pages/080-authoring/images/local.svg', '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"/>\n');
	const roundTripSource = await readFile(path.join(workspaceRoot, 'site/pages/060-save-callout/content.md'), 'utf8');
	await write('site/pages/090-roundtrip/content.md', roundTripSource);
	await write('site/pages/100-crlf/content.md', roundTripSource.replaceAll('\n', '\r\n'));
	await write('formatter-probe.md', '# Probe\n\n**bold**    text\n');
	await write('site/pages/110-context/content.md', '# Context\n');
	await write('site/pages/120-widget/content.md', '# Widget checks\n');
	await write('site/pages/120-widget/images/local.svg', '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"/>\n');
	await write('widget-site/config.yaml', 'url: https://example.com/\n');
	await write('widget-site/pages/000-home/content.md', '# Widget checks\n');
	await write('widget-site/theme.yaml', '');
	await write('widget-site/sitewide-content.yaml', '');
	await write('widget-site/pages/010-category/category.yaml', '');
	await write('usage-site/config.yaml', 'url: https://example.com/\n');
	await write('usage-site/pages/000-home/content.md', '# Image usage\n');
	await write('usage-site/pages/010-other/content.md', '# Other\n');
	for (const [page, files] of [['000-home', ['a-used.svg', 'z-unused.svg']], ['010-other', ['b-used.svg', 'y-other.svg']]]) {
		for (const file of files) await write(`usage-site/pages/${page}/images/${file}`, '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"/>\n');
	}
	for (const [project, editorApiVersion] of [['second', 2], ['incompatible', 1]]) {
		const projectEngine = path.join(workspaceRoot, project, 'node_modules', '@janga', 'norna');
		await cp(engineRoot, projectEngine, { recursive: true });
		const manifestPath = path.join(projectEngine, 'schemas', 'manifest.json');
		const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
		await writeFile(manifestPath, JSON.stringify({ ...manifest, editorApiVersion }));
		await write(`${project}/site/config.yaml`, 'url: https://example.com/\n');
		await write(`${project}/site/pages/000-home/content.md`, '# Context\n');
		await write(`${project}/site/pages/000-home/images/second-only.svg`, '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"/>\n');
	}
};

const packageExtension = () => {
	const extensionVersion = execFileSync(process.execPath, [
		'-e',
		`process.stdout.write(require(${JSON.stringify(path.join(extensionRoot, 'package.json'))}).version)`,
	], { encoding: 'utf8' }).trim();
	const vsixPath = path.join(cacheRoot, `norna-vscode-${extensionVersion}.vsix`);
	const vsce = path.join(extensionRoot, 'node_modules', '.bin', process.platform === 'win32' ? 'vsce.cmd' : 'vsce');
	execFileSync(vsce, ['package', '--out', vsixPath], {
		cwd: extensionRoot,
		stdio: 'inherit',
		shell: process.platform === 'win32',
	});
	return vsixPath;
};

const installExtension = (vscodeExecutablePath, extension) => {
	const [command, ...baseArguments] = resolveCliArgsFromVSCodeExecutablePath(vscodeExecutablePath);
	const cleanBaseArguments = baseArguments.filter((argument) => (
		!argument.startsWith('--extensions-dir=')
		&& !argument.startsWith('--user-data-dir=')
	));
	execFileSync(command, [
		...cleanBaseArguments,
		`--extensions-dir=${extensionsDirectory}`,
		`--user-data-dir=${userDataDirectory}`,
		'--install-extension',
		extension,
		'--force',
	], {
		stdio: 'inherit',
		shell: process.platform === 'win32',
	});
};

await prepareWorkspace();
await mkdir(cacheRoot, { recursive: true });
const vsixPath = packageExtension();
const extensionVersion = path.basename(vsixPath).match(/norna-vscode-(.+)\.vsix$/)?.[1];
const vscodeExecutablePath = await downloadAndUnzipVSCode({ cachePath: cacheRoot, version });
await rm(extensionsDirectory, { force: true, recursive: true });
await rm(userDataDirectory, { force: true, recursive: true });
installExtension(vscodeExecutablePath, 'redhat.vscode-yaml');
if (withPrettier) installExtension(vscodeExecutablePath, 'esbenp.prettier-vscode');
installExtension(vscodeExecutablePath, vsixPath);

// Fail instead of attaching UI checks to another VS Code instance.
await new Promise((resolve, reject) => {
	const probe = net.createServer();
	probe.once('error', reject);
	probe.listen(inspectorPort, '127.0.0.1', () => probe.close(resolve));
});
await runTests({
	extensionDevelopmentPath: path.join(testDirectory, 'harness'),
	extensionTestsEnv: {
		NORNA_EDITOR_TEST_SUITE: suite,
		NORNA_EDITOR_TEST_INSPECTOR: `http://127.0.0.1:${inspectorPort}`,
		NORNA_EDITOR_TEST_ENGINE_ROOT: engineRoot,
		NORNA_EDITOR_TEST_ENGINE_VERSION: engineVersion,
		NORNA_EDITOR_TEST_EXTENSION_VERSION: extensionVersion,
		NORNA_EDITOR_TEST_EXTENSION_ROOT: extensionRoot,
		NORNA_EDITOR_TEST_WORKSPACE: workspaceRoot,
		NORNA_EDITOR_TEST_PRETTIER: String(withPrettier),
	},
	extensionTestsPath: path.join(testDirectory, 'suite', 'index.cjs'),
	launchArgs: [
		'--remote-debugging-address=127.0.0.1',
		`--remote-debugging-port=${inspectorPort}`,
		workspaceRoot,
		`--extensions-dir=${extensionsDirectory}`,
		`--user-data-dir=${userDataDirectory}`,
		'--disable-telemetry',
		'--skip-add-to-recently-opened',
	],
	vscodeExecutablePath,
});
