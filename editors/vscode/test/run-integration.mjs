import { execFileSync } from 'node:child_process';
import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
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
const engineRoot = path.join(workspaceRoot, 'node_modules', '@janga', 'norna');
const commandArguments = process.argv.slice(2);
const versionArgument = commandArguments[0] === '--version' ? commandArguments[1] : undefined;
if (commandArguments.length > 0 && (!versionArgument || commandArguments.length !== 2)) {
	throw new Error('Usage: node test/run-integration.mjs [--version <VS Code version>]');
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
	await write('site/theme.yaml', [
		'preset: ',
		'typography:',
		'  fontFamily: "Inter, sans-serif"',
		'  ',
		'',
	].join('\n'));
	await write('site/sitewide-content.yaml', 'footer:\n  copyrightMessage: Example\n');
	await write('site/pages/000-home/content.md', `---
page:
  description: Editor integration fixture.
---

# Editor fixture

## Intro {#intro}

Text with an unmatched note reference {note-ref}.

\`\`\`norna-image-stack
- image: portrait.jpg
- image: 
\`\`\`
`);
	await write('site/pages/000-home/images/intro/local.svg', '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"/>\n');
	await write('site/pages/010-about/content.md', `# About

## Team {#team}

Team content.
`);
	await write('site/pages/010-about/images/team/portrait.jpg', 'test image');
	await write('site/pages/020-empty/content.md', '');
	await write('site/pages/030-block/content.md', `# Blocks

## Example {#example}

\`\`\`norna-
\`\`\`
`);
	await write('site/pages/040-unclosed/content.md', `# Unclosed block

## Example {#example}

\`\`\`norna-image-stack
- image: missing.jpg
`);
	await write('site/notes.md', '# Ordinary Markdown\n');
	await write('other.yaml', 'preset: \n');
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
installExtension(vscodeExecutablePath, vsixPath);

await runTests({
	extensionDevelopmentPath: path.join(testDirectory, 'harness'),
	extensionTestsEnv: {
		NORNA_EDITOR_TEST_ENGINE_ROOT: engineRoot,
		NORNA_EDITOR_TEST_ENGINE_VERSION: engineVersion,
		NORNA_EDITOR_TEST_EXTENSION_VERSION: extensionVersion,
		NORNA_EDITOR_TEST_EXTENSION_ROOT: extensionRoot,
		NORNA_EDITOR_TEST_WORKSPACE: workspaceRoot,
	},
	extensionTestsPath: path.join(testDirectory, 'suite', 'index.cjs'),
	launchArgs: [
		workspaceRoot,
		`--extensions-dir=${extensionsDirectory}`,
		`--user-data-dir=${userDataDirectory}`,
		'--disable-telemetry',
		'--skip-add-to-recently-opened',
	],
	vscodeExecutablePath,
});
