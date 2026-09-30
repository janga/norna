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
assert.deepEqual(extensionManifest.contributes.viewsContainers.activitybar, [
	{ id: 'norna', title: 'Norna', icon: 'media/norna.svg' },
]);
assert.equal(extensionManifest.contributes.views.norna[0].id, 'nornaSiteTree');
assert.equal(extensionManifest.contributes.views.explorer, undefined);
assert.ok(extensionManifest.contributes.commands.some((item) => item.command === 'nornaEditor.chooseSite'));
assert.ok(extensionManifest.contributes.menus['view/title'].some((item) => item.command === 'nornaEditor.chooseSite'
	&& item.when.includes('nornaSiteTree.hasMultipleSites')));
assert.ok(extensionManifest.contributes.viewsWelcome.some((item) => item.view === 'nornaSiteTree'
	&& item.contents.includes('command:nornaEditor.chooseSite')));
const itemMenus = extensionManifest.contributes.menus['view/item/context'];
assert.equal(extensionManifest.contributes.commands.find(item => item.command === 'nornaEditor.toggleUrlPaths').toggled, 'nornaSiteTree.showUrlPaths');
assert.ok(extensionManifest.contributes.menus['view/title'].some(item => item.command === 'nornaEditor.toggleUrlPaths' && item.when === 'view == nornaSiteTree'));

assert.equal(extensionManifest.contributes.commands.find((item) => item.command === 'nornaEditor.movePage').enablement,
	'!nornaSiteTree.moveActive');

assert.ok(!extensionManifest.contributes.menus['view/title'].some(item => item.command === 'nornaEditor.cancelMove'));
assert.ok(itemMenus.some(item => item.command === 'nornaEditor.cancelMove' && item.when.includes('nornaMoveSource')));
assert.ok(itemMenus.every(item => !item.group.startsWith('inline')), 'Resting rows have no inline Add/ellipsis buttons.');
assert.ok(itemMenus.every(item => item.command !== 'nornaEditor.openSiteNode'), 'Opening is row activation, not a context action.');
assert.ok(!extensionManifest.contributes.commands.some(item => /nornaEditor\.(pageActions|fileActions|imageActions)$/.test(item.command)));
const addMenu = extensionManifest.contributes.menus['nornaSiteTree.add'];
assert.ok(addMenu.every(item => !item.submenu), 'Only one submenu level.');
assert.ok(addMenu.some(item => item.command === 'nornaEditor.addChildPage'));
assert.ok(addMenu.some(item => item.command === 'nornaEditor.importImage'));
for (const command of ['renamePage', 'renameResource', 'newPublicFile', 'addPublicFiles', 'newPublicFolder', 'replacePublicFile', 'removeFolder', 'copyResourceLink', 'resourceReferences']) {
	assert.ok(itemMenus.some(item => item.command === 'nornaEditor.' + command), command);
}
for (const command of ['addSiteConfiguration', 'addSitePublicFiles']) assert.ok(extensionManifest.contributes.menus['view/title'].some(item => item.command === 'nornaEditor.' + command && item.when.includes('resourceActions')));

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
	'media/norna.svg',
	'media/page-light.svg',
	'media/page-dark.svg',
	'media/page-list-light.svg',
	'media/page-list-dark.svg',
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
	assert.notEqual(filename, 'site-tree.cjs');
	assert.notEqual(filename, 'site-file-actions.cjs');
	assert.notEqual(filename, 'image-import-form.cjs');
	assert.notEqual(filename, 'image-insert-form.cjs');
	assert.notEqual(filename, 'site-address-actions.cjs');
	assert.notEqual(filename, 'site-link-review.cjs');
	assert.notEqual(filename, 'site-source-actions.cjs');
	assert.notEqual(filename, 'page-form.cjs');
	assert.notEqual(filename, 'page-form-actions.cjs');
}

console.log(`VS Code package contract passed (${files.size} packaged files).`);
