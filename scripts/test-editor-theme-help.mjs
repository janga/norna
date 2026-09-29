import assert from 'node:assert/strict';
import { cp, mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { readSiteFileTree, planEditorRemoval } from './lib/editor-site-tree.mjs';

const temporary = await mkdtemp(path.join(os.tmpdir(), 'norna-editor-theme-help-'));
const siteRoot = path.join(temporary, 'site');
const rootTheme = path.join(siteRoot, 'root/tree-theme.yaml');
const inherited = 'root/pages/010-inherited';
const replacement = 'root/pages/020-replacement';
const pageOnly = 'root/pages/030-page-only';
const samePreset = 'root/pages/040-same-preset';
const find = (tree, relative) => tree.items.find((item) => item.sourcePath === path.join(siteRoot, relative));
const removal = (relative, sources) => planEditorRemoval({ siteRoot, filePath: path.join(siteRoot, relative),
	sourcePath: path.join(siteRoot, path.dirname(relative), 'content.md'), sources });
try {
	await cp(new URL('../fixtures/theme-inheritance/site', import.meta.url), siteRoot, { recursive: true });
	let tree = await readSiteFileTree({ siteRoot });
	assert.match(find(tree, 'root/tree-theme.yaml').themeHelp, /Preset: project\nPreset source: root\/tree-theme.yaml\nRequired base/);
	assert.equal(find(tree, 'root/tree-theme.yaml').removable, false);
	assert.match(find(tree, `${inherited}/tree-theme.yaml`).themeHelp, /Preset: project\nPreset source: root\/tree-theme.yaml\nModifies inherited/);
	assert.equal(find(tree, `${inherited}/content.md`).themeHelp, find(tree, `${inherited}/pages/010-child/content.md`).themeHelp);
	assert.match(find(tree, `${replacement}/tree-theme.yaml`).themeHelp, /Preset: documentation\nPreset source: root\/pages\/020-replacement\/tree-theme.yaml\nReplaces inherited/);
	assert.match(find(tree, `${samePreset}/tree-theme.yaml`).themeHelp, /Preset: project\nPreset source: root\/pages\/040-same-preset\/tree-theme.yaml\nReplaces inherited/);
	assert.match(find(tree, `${pageOnly}/content.md`).themeHelp, /Preset: statement\nPreset source: .*page-theme.yaml/);
	assert.match(find(tree, `${pageOnly}/pages/010-child/content.md`).themeHelp, /Preset: project\nPreset source: root\/tree-theme.yaml$/);

	const source = await readFile(rootTheme, 'utf8');
	const dirty = new Map([[rootTheme, source.replace('preset: project', 'preset: documentation')]]);
	tree = await readSiteFileTree({ siteRoot, sources: dirty });
	assert.match(find(tree, `${inherited}/content.md`).themeHelp, /Preset: documentation/);
	assert.match(find(tree, `${samePreset}/content.md`).themeHelp, /Preset: project/);
	assert.equal(await readFile(rootTheme, 'utf8'), source, 'Theme help must not write unsaved sources.');

	const pagePath = path.join(siteRoot, pageOnly, 'page-theme.yaml');
	tree = await readSiteFileTree({ siteRoot, sources: new Map([[pagePath, '{}\n']]) });
	assert.match(find(tree, `${pageOnly}/page-theme.yaml`).themeHelp, /Preset: project.*\nPreset source: root\/tree-theme.yaml\nModifies inherited/);
	const invalid = new Map([[rootTheme, 'preset: unknown\n']]);
	tree = await readSiteFileTree({ siteRoot, sources: invalid });
	assert.match(find(tree, `${inherited}/content.md`).themeHelp, /Preset unavailable/);
	assert.ok(find(tree, 'root/tree-theme.yaml').issues.length);
	tree = await readSiteFileTree({ siteRoot, sources: new Map([[pagePath, 'preset: unknown\n']]) });
	assert.match(find(tree, `${pageOnly}/content.md`).themeHelp, /Preset unavailable/);
	assert.match(find(tree, `${pageOnly}/pages/010-child/content.md`).themeHelp, /Preset: project/);

	const branchRemoval = await removal(`${replacement}/tree-theme.yaml`);
	assert.match(branchRemoval.effect, /Overrides on descendants remain/);
	assert.match(branchRemoval.effect, /inherited tree theme is root\/tree-theme.yaml.\nPreset: project/);
	const pageRemoval = await removal(`${pageOnly}/page-theme.yaml`);
	assert.match(pageRemoval.effect, /Other pages are unchanged/);
	assert.match(pageRemoval.effect, /Preset: project\nPreset source: root\/tree-theme.yaml/);
	assert.notEqual((await removal(`${replacement}/tree-theme.yaml`, dirty)).fingerprint, branchRemoval.fingerprint, 'Changed inheritance invalidates a displayed removal plan.');
	assert.match((await removal(`${replacement}/tree-theme.yaml`, invalid)).effect, /cannot be determined/);
	await assert.rejects(removal('root/tree-theme.yaml'), /cannot be removed/);
	console.log('Editor theme help tests passed: preset origins, modifications, replacement, same-preset reset, page-only scope, dirty sources, errors and removal inheritance.');
} finally { await rm(temporary, { recursive: true, force: true }); }
