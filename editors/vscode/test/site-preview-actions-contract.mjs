import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createRequire } from 'node:module';
const { registerSitePreviewActions } = createRequire(import.meta.url)('../site-preview-actions.cjs');

const setup = () => {
 const root = '/project/site', commands = new Map(), opened = [], copied = [], calls = [], logs = [], errors = [], choices = [];
 let site = { siteRoot: root }, start = async options => ({ url: 'http://127.0.0.1:4321/manual/guide/', reused: false });
 const documents = [], service = {
  sitePreviewApiVersion: 1,
  startEditorSitePreview: options => { calls.push(options); return start(options); },
  getEditorPreviewStatus: async () => ({ verified: true }),
  getEditorPreviewLog: async () => 'Site startup log',
  stopEditorSitePreview: async options => calls.push({ stop: options.siteRoot }),
 };
 const vscode = {
  Uri: { parse: url => url }, ProgressLocation: { Notification: 1 },
  workspace: { textDocuments: documents }, commands: { executeCommand: async (...args) => calls.push({ context: args }) },
  env: { openExternal: async url => { opened.push(url); return true; }, clipboard: { writeText: async text => copied.push(text) } },
  window: {
   createOutputChannel: () => ({ append: text => logs.push(text), appendLine: text => logs.push(text), show: () => logs.push('shown'), dispose() {} }),
   showWarningMessage: async () => choices.shift(),
   showErrorMessage: async message => { errors.push(message); return choices.shift(); },
   withProgress: async (_options, callback) => callback({ report() {} }, { isCancellationRequested: false, onCancellationRequested: () => ({ dispose() {} }) }),
  },
 };
 const page = { siteRoot: root, sourcePath: root + '/root/pages/010-guide/content.md', title: 'Guide' };
 registerSitePreviewActions({ vscode, context: { subscriptions: [] }, chooseNode: async arg => arg ?? page, activeSite: () => site,
  ownerOf: node => node, serviceFor: async () => service, register: (name, callback) => commands.set(name.split('.').at(-1), callback),
 });
 return { root, page, vscode, service, documents, choices, opened, copied, calls, logs, errors,
  start: callback => { start = callback; }, select: value => { site = value; },
  run: (name, argument) => commands.get(name)(argument),
  dirty(filename, result = true) {
   const document = { uri: { scheme: 'file', fsPath: filename }, isDirty: true, saves: 0, save: async () => { document.saves++; if(result)document.isDirty=false; return result; } };
   documents.push(document); return document;
  },
 };
};

test('save choice saves only the selected site and resolves preview after saves', async () => {
 const f=setup(), doc=f.dirty(f.page.sourcePath), outside=f.dirty('/project/site-other/content.md');
 f.choices.push('Save Site and Preview');
 f.start(async options => { assert.equal(doc.isDirty,false); assert.equal(options.sourcePath,f.page.sourcePath); return {url:'http://127.0.0.1:4321/changed/guide/'}; });
 await f.run('previewPage'); assert.equal(doc.saves,1); assert.equal(outside.saves,0);
 assert.deepEqual(f.opened,['http://127.0.0.1:4321/changed/guide/']);
});
test('saved-only and native cancel preserve dirty buffers; failed saves do not start', async () => {
 const f=setup(), doc=f.dirty(f.page.sourcePath);
 f.vscode.window.showWarningMessage=async (_message,options,...actions)=>{
  assert.equal(options.modal,true);
  assert.deepEqual(actions,['Save Site and Preview','Preview Saved Files'],'VS Code supplies the modal Cancel button');
  return f.choices.shift();
 };
 await f.run('previewPage');assert.equal(f.opened.length,0);assert.equal(f.calls.length,0);
 f.choices.push('Preview Saved Files');await f.run('previewPage');assert.equal(doc.saves,0);assert.equal(doc.isDirty,true);assert.equal(f.opened.length,1);
 const failed=setup();failed.dirty(failed.page.sourcePath,false);failed.choices.push('Save Site and Preview');
 await assert.rejects(failed.run('previewPage'),/Could not save/);assert.equal(failed.opened.length,0);assert.equal(failed.calls.length,0);
});
test('new dirty edits during save are detected; unsupported engines do not fall back',async()=>{
 const f=setup(),doc=f.dirty(f.page.sourcePath);
 doc.save=async()=>{doc.isDirty=false;f.dirty(f.root+'/site-config/settings.yaml');return true;};f.choices.push('Save Site and Preview');
 await assert.rejects(f.run('previewPage'),/still has unsaved/);assert.equal(f.opened.length,0);
 f.service.sitePreviewApiVersion=undefined;await assert.rejects(f.run('previewSite'),/Update this project/);
});
test('double clicks coalesce while selection changes cannot redirect a pending page',async()=>{
 const f=setup();let release,started;
 const ready=new Promise(resolve=>{started=resolve;});
 f.start(options=>{started();return new Promise(resolve=>{release=()=>resolve({url:'http://127.0.0.1:4321/manual/guide/'});});});
 const first=f.run('previewPage');await ready;
 const second=f.run('previewPage');f.select({siteRoot:'/other/site'});release();await Promise.all([first,second]);
 assert.equal(f.calls.filter(call=>call.sourcePath).length,1);assert.equal(f.opened.length,1);
 assert.equal(f.calls.filter(call=>call.context).length,0,'Do not overwrite another active site\'s menu context');
});
test('browser failure offers a usable URL; errors expose logs and cancellation does not open',async()=>{
 const f=setup();f.vscode.env.openExternal=async()=>false;f.choices.push('Copy URL');await f.run('previewPage');
 assert.deepEqual(f.copied,['http://127.0.0.1:4321/manual/guide/']);
 f.start(async()=>{throw new Error('Preview start failed: invalid settings');});f.choices.push('Show Preview Log');await f.run('previewPage');assert.match(f.errors.at(-1),/invalid settings/);assert.ok(f.logs.includes('shown'));
 f.start(async()=>{throw new Error('Preview cancelled.');});const errors=f.errors.length;await f.run('previewPage');assert.equal(f.errors.length,errors);
 await f.run('stopPreview');assert.ok(f.calls.some(call=>call.stop===f.root));
});
