import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, rm, writeFile, rename, cp, access } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { createRequire } from 'node:module';
import { test } from 'node:test';
import * as engine from '../../../scripts/lib/editor-site-tree.mjs';
const require = createRequire(import.meta.url);
const { registerSiteResourceActions } = require('../site-resource-actions.cjs');
const exists = filename => access(filename).then(() => true, () => false);
const fixture = async t => {
	const root = await mkdtemp(path.join(os.tmpdir(), 'norna-resource-adapter-'));
	t.after(() => rm(root, { recursive: true, force: true }));
	const siteRoot = path.join(root, 'site');
	const write = async (name, text) => { const filename = path.join(siteRoot, name); await mkdir(path.dirname(filename), { recursive: true }); await writeFile(filename, text); return filename; };
	await write('site-config/settings.yaml', 'url: https://example.com/manual/\n');
	await write('root/tree-theme.yaml', 'preset: documentation\n');
	const home = await write('root/content.md', '# Home\n\n```image-stack\nitems:\n  - image: old.png\n```\n');
	const image = await write('root/images/old.png', 'Old image');
	const site = { id: siteRoot, siteRoot, sourcePath: siteRoot, kind: 'site', title: 'Site' };
	const page = { id: home, siteRoot, sourcePath: home, kind: 'page', isHome: true, title: 'Home' };
	const node = { id: image, siteRoot, sourcePath: image, kind: 'file', title: 'old.png' };
	const commands = new Map(), documents = [], inputs = [], warnings = [], open = [], deletes = [];
	let selected = node, failText = false, failMove = false, failRollback = false, beforeConfirmation, moves = 0, refreshes = 0;
	const documentSources = () => new Map(documents.filter(doc => doc.isDirty).map(doc => [doc.uri.fsPath, doc.getText()]));
	const vscode = {
		Uri: { file: fsPath => ({ scheme: 'file', fsPath }) }, Range: class { constructor(start, end) { Object.assign(this, { start, end }); } },
		WorkspaceEdit: class { edits = []; renameFile(from, to) { this.edits.push({ type: 'rename', from: from.fsPath, to: to.fsPath }); } replace(uri, range, text) { this.edits.push({ type: 'replace', filename: uri.fsPath, range, text }); } createFile(uri) { this.edits.push({ type: 'create', filename: uri.fsPath }); } },
		env: { clipboard: { writeText: async text => { vscode.copied = text; } } },
		workspace: { textDocuments: documents,
			openTextDocument: async uri => {
				let doc = documents.find(doc => doc.uri.fsPath === uri.fsPath); if (doc) return doc;
				let text = await readFile(uri.fsPath, 'utf8');
				doc = { uri, version: 1, isDirty: false, isClosed: false, getText: () => text, positionAt: x => x, set: value => { text = value; doc.version++; doc.isDirty = true; } };
				documents.push(doc); return doc;
			},
			applyEdit: async edit => {
				if (edit.edits.some(edit => edit.type === 'replace') && failText) return false;
				for (const item of edit.edits) {
					if (item.type === 'rename') { moves++; if (failMove || failRollback && moves === 2) return false; await rename(item.from, item.to); }
					if (item.type === 'replace') { const doc = documents.find(doc => doc.uri.fsPath === item.filename); doc.set(doc.getText().slice(0,item.range.start)+item.text+doc.getText().slice(item.range.end)); }
					if (item.type === 'create') await writeFile(item.filename, '', { flag: 'wx' });
				} return true;
			},
			fs: { createDirectory: uri => mkdir(uri.fsPath, { recursive: true }), copy: (from,to) => cp(from.fsPath,to.fsPath,{errorOnExist:true,force:false}),
				delete: async (uri, options) => { deletes.push({ filename: uri.fsPath, options }); await rm(uri.fsPath,{recursive:options?.recursive,force:false}); } },
		},
		window: { showInputBox: async options => { const value=inputs.shift(); if(value!==undefined && options.validateInput) assert.equal(await options.validateInput(value),undefined);return value; },
			showWarningMessage: async (_title,_options,...actions) => { await beforeConfirmation?.(); const choice=warnings.shift(); return choice === true ? actions[0] : choice; },
			showOpenDialog: async () => open.shift(), showTextDocument: async doc => ({edit: async callback => { callback({replace:(range,text)=>doc.set(doc.getText().slice(0,range.start)+text+doc.getText().slice(range.end))});return true;}}),
		},
	};
	registerSiteResourceActions({ vscode, context: { globalStorageUri: { fsPath: path.join(root,'storage') } }, chooseNode: async argument => argument ?? selected,
		activeSite: () => site, ownerOf: () => page, serviceFor: async () => engine, documentSources, refresh: async () => {refreshes++;}, register: (name, action) => commands.set(name.split('.').at(-1),action) });
	return { siteRoot, home, image, node, page, site, write, vscode, inputs, warnings, open, deletes, documents, run: (name,argument) => commands.get(name)(argument),
		faults: options => { ({failText = false,failMove = false,failRollback = false,beforeConfirmation} = options); }, moves: () => moves, refreshes: () => refreshes };
};

test('rename coordinates file move and dirty page edits without saving unrelated prose', async t => {
	const f = await fixture(t), doc = await f.vscode.workspace.openTextDocument({fsPath:f.home});
	doc.set(doc.getText()+'\nUnsaved work.\n');
	f.inputs.push('new.png'); f.warnings.push(true); await f.run('renameResource');
	assert.equal(await exists(f.image),false); assert.equal(await exists(path.join(path.dirname(f.image),'new.png')),true);
	assert.match(doc.getText(),/image: "new.png"/); assert.match(doc.getText(),/Unsaved work/); assert.equal(doc.isDirty,true);
	assert.doesNotMatch(await readFile(f.home,'utf8'),/Unsaved|new.png/);
	assert.equal(f.moves(),1); assert.equal(f.refreshes(),1);
});

test('cancel and failed file movement leave sources and image untouched', async t => {
	for (const failMove of [false,true]) {
		const f=await fixture(t);f.inputs.push('new.png');f.warnings.push(failMove);f.faults({failMove});
		if(failMove) await assert.rejects(f.run('renameResource'),/could not rename/); else await f.run('renameResource');
		assert.equal(await exists(f.image),true);assert.match(await readFile(f.home,'utf8'),/old.png/);
	}
});

test('failed text update rolls back file movement; failed rollback names the recovery locations', async t => {
	for(const failRollback of [false,true]) {
		const f=await fixture(t); f.inputs.push('new.png');f.warnings.push(true);f.faults({failText:true,failRollback});
		await assert.rejects(f.run('renameResource'),failRollback?/Recovery needed:.*new.png.*old.png/s:/original resource name was restored/);
		assert.equal(await exists(f.image),!failRollback);assert.equal(f.moves(),2);
		assert.match(f.documents[0].getText(),/old.png/);assert.equal(f.documents[0].isDirty,false);
	}
});

test('changed or dirty resource aborts before mutation', async t => {
	const f=await fixture(t);f.inputs.push('new.png');f.warnings.push(true);f.faults({beforeConfirmation:()=>writeFile(f.image,'changed')});
	await assert.rejects(f.run('renameResource'),/files or references changed/);assert.equal(f.moves(),0);
	f.faults({}); f.inputs.push('new.png'); f.documents.push({uri:{fsPath:f.image},isDirty:true,getText:()=>''});
	await assert.rejects(f.run('renameResource'),/Save or undo/);assert.equal(f.moves(),0);
});

test('public file creation/import works at site level without a homepage; cancellation creates nothing', async t => {
	const f=await fixture(t);await rm(f.home);f.inputs.push(undefined);
	await f.run('newPublicFile',f.site);assert.equal(await exists(path.join(f.siteRoot,'public')),false);
	f.inputs.push('robots.txt');await f.run('newPublicFile',f.site);assert.equal(await readFile(path.join(f.siteRoot,'public/robots.txt'),'utf8'),'');
	const source=await f.write('test-input.txt','public bytes');f.open.push([{scheme:'file',fsPath:source}]);
	await f.run('addSitePublicFiles');assert.equal(await readFile(path.join(f.siteRoot,'public/test-input.txt'),'utf8'),'public bytes');
});

test('folder deletion waits for confirmation, detects changed contents, and uses Trash', async t => {
	const f=await fixture(t);const node={...f.node,kind:'directory',sourcePath:path.dirname(f.image),title:'images'};
	f.warnings.push(undefined);await f.run('removeFolder',node);assert.equal(f.deletes.length,0);
	f.warnings.push(true);f.faults({beforeConfirmation:()=>writeFile(f.image,'changed')});
	await assert.rejects(f.run('removeFolder',node),/files or references changed/);assert.equal(f.deletes.length,0);
	f.faults({});f.warnings.push(true);await f.run('removeFolder',node);
	assert.deepEqual(f.deletes.at(-1),{filename:node.sourcePath,options:{recursive:true,useTrash:true}});
});

test('page rename changes H1 only and leaves the source dirty', async t => {
	const f=await fixture(t);f.inputs.push('New Home');await f.run('renamePage',f.page);
	assert.match(f.documents[0].getText(),/^# New Home/);assert.equal(f.documents[0].isDirty,true);
	assert.match(await readFile(f.home,'utf8'),/^# Home/);
	await f.run('copyPageLink',f.page);assert.equal(f.vscode.copied,'https://example.com/manual/');
});
