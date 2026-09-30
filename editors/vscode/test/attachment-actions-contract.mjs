import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtemp, mkdir, readFile, writeFile, rm, lstat, cp, rename } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { createRequire } from 'node:module';
import * as engine from '../../../scripts/lib/editor-site-tree.mjs';
const require=createRequire(import.meta.url);
const {attachmentFormHtml}=require('../attachment-form.cjs');
const moduleSource=await readFile(new URL('../site-attachment-actions.cjs',import.meta.url),'utf8');
const setup=async t=>{
 const temp=await mkdtemp(path.join(os.tmpdir(),'norna-attachment-adapter-'));t.after(()=>rm(temp,{recursive:true,force:true}));const root=path.join(temp,'site');
 const write=async(name,text)=>{const file=path.join(temp,name);await mkdir(path.dirname(file),{recursive:true});await writeFile(file,text);return file;};
 await write('site/site-config/settings.yaml','url: https://example.com/manual/\n');await write('site/root/tree-theme.yaml','preset: documentation\n');const home=await write('site/root/content.md','# Home\n\nText\n');
 let form,callbacks,failCopy=false;const documents=[],commands=new Map(),open=[],warnings=[],trashed=[];
 const document=async filename=>{let doc=documents.find(doc=>doc.uri.fsPath===filename);if(doc)return doc;let text=await readFile(filename,'utf8');doc={uri:{scheme:'file',fsPath:filename},version:1,isDirty:false,isClosed:false,getText:()=>text,positionAt:x=>x,offsetAt:x=>x,set(value){text=value;this.version++;this.isDirty=true;}};documents.push(doc);return doc;};
 const vscode={ViewColumn:{Active:1},Range:class{constructor(start,end){Object.assign(this,{start,end});}},Uri:{file:fsPath=>({fsPath,scheme:'file'})},workspace:{textDocuments:documents,openTextDocument:uri=>document(uri.fsPath),fs:{
  stat:async uri=>{const s=await lstat(uri.fsPath);return {size:s.size,mtime:s.mtimeMs};},createDirectory:uri=>mkdir(uri.fsPath,{recursive:true}),
  copy:async(a,b)=>{if(failCopy&&b.fsPath.includes('/downloads/'))throw new Error('Injected copy failure');await cp(a.fsPath,b.fsPath,{force:false,errorOnExist:true});},
  delete:async(uri,options)=>{if(options?.useTrash){const target=path.join(temp,'trash-'+trashed.length);await rename(uri.fsPath,target);trashed.push(target);}else await rm(uri.fsPath,{recursive:options?.recursive});},
 }},window:{showOpenDialog:async()=>open.shift(),showWarningMessage:async()=>warnings.shift(),showTextDocument:async doc=>({edit:async fn=>{fn({insert:(offset,text)=>doc.set(doc.getText().slice(0,offset)+text+doc.getText().slice(offset))});return true;},revealRange(){}})}};
 const localModule={exports:{}};new Function('require','module','exports',moduleSource)(name=>name==='./attachment-form.cjs'?{openAttachmentForm:async(_v,_c,model,handler)=>{form=model;callbacks=handler;}}:require(name),localModule,localModule.exports);
 const page={kind:'page',title:'Home',siteRoot:root,sourcePath:home};
 localModule.exports.registerSiteAttachmentActions({vscode,context:{globalStorageUri:{fsPath:path.join(temp,'storage')}},chooseNode:async node=>node??page,ownerOf:()=>page,serviceFor:async()=>engine,documentSources:()=>new Map(documents.filter(doc=>doc.isDirty).map(doc=>[doc.uri.fsPath,doc.getText()])),refresh:async()=>{},register:(name,callback)=>commands.set(name.split('.').at(-1),callback)});
 return {temp,root,home,page,write,document,vscode,open,warnings,trashed,run:(name,node)=>commands.get(name)(node),get form(){return form;},get callbacks(){return callbacks;},fail:()=>{failCopy=true;}};
};
test('one form imports a batch, preserves dirty prose and inserts only chosen links at captured cursor',async t=>{
 const f=await setup(t),doc=await f.document(f.home);doc.set('# Home\n\nUnsaved text\n');f.vscode.window.activeTextEditor={document:doc,selection:{active:8}};
 const a=await f.write('inputs/a.txt','A'),b=await f.write('inputs/b.zip','B');f.open.push([f.vscode.Uri.file(a),f.vscode.Uri.file(b)]);await f.run('addAttachments');assert.match(f.form.placement,/at cursor/);assert.ok(f.form.rows[0].sourceInfo.modified>0);
 const rows=f.form.rows.map((row,i)=>({...row,action:i?'import':'insert'}));assert.equal((await f.callbacks.preview(rows)).blocked,false);assert.equal(await f.callbacks.apply(rows),true);
 assert.equal(await readFile(path.join(f.root,'root/downloads/a.txt'),'utf8'),'A');assert.equal(await readFile(path.join(f.root,'root/downloads/b.zip'),'utf8'),'B');assert.match(doc.getText(),/\[a.txt\]\(a.txt\)Unsaved text/);assert.doesNotMatch(doc.getText(),/b.zip/);assert.equal(await readFile(f.home,'utf8'),'# Home\n\nText\n');
});
test('initial replacement is preselected; a changed colliding filename requires an active choice',async t=>{
 const f=await setup(t);await f.write('site/root/downloads/a.txt','old A');await f.write('site/root/downloads/b.txt','old B');const incoming=await f.write('inputs/a.txt','new');f.open.push([f.vscode.Uri.file(incoming)]);await f.run('addAttachments');const [row]=f.form.rows;
 const initial=await f.callbacks.preview([row]);assert.equal(initial.rows[0].replace,true);
 const changed={...row,filename:'b.txt',edited:true,replace:false};assert.equal((await f.callbacks.preview([changed])).blocked,true);
 f.warnings.push(undefined);assert.equal(await f.callbacks.apply([{...changed,replace:true}]),false);assert.equal(await readFile(path.join(f.root,'root/downloads/b.txt'),'utf8'),'old B');
 f.warnings.push('Replace');assert.equal(await f.callbacks.apply([{...changed,replace:true}]),true);assert.equal(await readFile(f.trashed[0],'utf8'),'old B');
});
test('cancel and stale page create nothing; ignored files create no links',async t=>{
 const f=await setup(t),a=await f.write('inputs/a.txt','A');f.open.push(undefined);await f.run('addAttachments');assert.equal(f.form,undefined);
 f.open.push([f.vscode.Uri.file(a)]);await f.run('addAttachments');const doc=await f.document(f.home);doc.set('# Home\n\nChanged\n');assert.equal((await f.callbacks.preview(f.form.rows)).blocked,true);await assert.rejects(f.callbacks.apply(f.form.rows),/page changed/);
 assert.equal((await f.callbacks.preview(f.form.rows.map(row=>({...row,action:'ignore'})))).blocked,true);
 await assert.rejects(lstat(path.join(f.root,'root/downloads')),/ENOENT/);
});
test('failed replacement keeps the old bytes in Trash and gives a locked, accurate recovery report',async t=>{
 const f=await setup(t),file=await f.write('site/root/downloads/a.txt','original'),incoming=await f.write('inputs/a.txt','new');f.open.push([f.vscode.Uri.file(incoming)]);await f.run('replaceAttachment',{kind:'file',title:'a.txt',sourcePath:file});f.warnings.push('Replace');f.fail();
 await assert.rejects(f.callbacks.apply(f.form.rows),error=>error.locked&&/Imported: none/.test(error.message)&&/Trash/.test(error.message));assert.equal(await readFile(f.trashed[0],'utf8'),'original');assert.equal(await readFile(f.home,'utf8'),'# Home\n\nText\n');
});
test('insertion targets owning page even with a different active editor; form script is valid and metadata escaped',async t=>{
 const f=await setup(t),file=await f.write('site/root/downloads/image.svg','<svg/>');f.vscode.window.activeTextEditor={document:{uri:{fsPath:'/another/content.md'}},selection:{active:0}};
 await f.run('insertAttachment',{kind:'file',title:'image.svg',sourcePath:file});assert.match(f.form.placement,/at end/);await f.callbacks.apply(f.form.rows);assert.match((await f.document(f.home)).getText(),/\[image.svg\]\(image.svg\)/);
 const html=attachmentFormHtml({...f.form,title:'<script>bad</script>'},'nonce');assert.ok(!html.includes('<h1>Insert attachment link: <script>'));const script=html.match(/<script nonce="nonce">([\s\S]*)<\/script>/)[1];new Function(script);
});
