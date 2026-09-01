import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const testDirectory = path.dirname(fileURLToPath(import.meta.url));
const extensionRoot = path.dirname(testDirectory);
const repositoryRoot = path.resolve(extensionRoot, '..', '..');
const require = createRequire(import.meta.url);
const extensionManifest = JSON.parse(readFileSync(path.join(extensionRoot, 'package.json'), 'utf8'));
const engineManifest = JSON.parse(readFileSync(path.join(repositoryRoot, 'schemas', 'manifest.json'), 'utf8'));
const projectSupport = require(path.join(extensionRoot, 'norna-project.cjs'));

assert.equal(extensionManifest.publisher, 'janga');
assert.equal(extensionManifest.name, 'norna-vscode');
assert.match(extensionManifest.version, /^\d+\.\d+\.\d+$/);
assert.deepEqual(extensionManifest.extensionKind, ['workspace']);
assert.equal(extensionManifest.capabilities?.untrustedWorkspaces?.supported, false);
assert.equal(extensionManifest.capabilities?.virtualWorkspaces?.supported, false);
assert.deepEqual(extensionManifest.extensionDependencies, ['redhat.vscode-yaml']);
assert.ok(existsSync(path.join(extensionRoot, extensionManifest.icon)));
assert.equal(projectSupport.supportedSchemaVersion, engineManifest.schemaVersion);
assert.equal(projectSupport.supportedEditorApiVersion, engineManifest.editorApiVersion);

const executable = path.join(
	extensionRoot,
	'node_modules',
	'.bin',
	process.platform === 'win32' ? 'vsce.cmd' : 'vsce',
);
const result = spawnSync(executable, ['ls'], {
	cwd: extensionRoot,
	encoding: 'utf8',
	shell: process.platform === 'win32',
});
if (result.status !== 0) {
	throw new Error(`Unable to inspect the VSIX contents:\n${result.stderr || result.stdout}`);
}

const files = new Set(result.stdout.trim().split(/\r?\n/).filter(Boolean));
for (const required of [
	'CHANGELOG.md',
	'LICENSE',
	'README.md',
	'dist/extension.cjs',
	'icon.png',
	'package.json',
]) {
	assert.ok(files.has(required), `Packaged extension is missing ${required}.`);
}
for (const filename of files) {
	assert.doesNotMatch(filename, /^(?:\.vscode|\.vscode-test|node_modules|test)\//);
	assert.notEqual(filename, 'package-lock.json');
	assert.notEqual(filename, 'extension.cjs');
	assert.notEqual(filename, 'norna-project.cjs');
	assert.notEqual(filename, 'yaml-schema-completions.cjs');
}

console.log(`VS Code package contract passed (${files.size} packaged files).`);
