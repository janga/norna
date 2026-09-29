import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import * as service from '../../../scripts/lib/editor-site-tree.mjs';
const require=createRequire(import.meta.url);
const {editPageForm}=require('../page-form-actions.cjs');
const {pageFormHtml}=require('../page-form.cjs');
const root=await mkdtemp(path.join(os.tmpdir(),'norna-form-edit-'));
const filename=path.join(root,'root/content.md');
let text='# Home\n\nBody stays.\n', version=1, receive, disposed, lastReply, applied=0, confirmation='Remove addresses';
const document={uri:{fsPath:filename},getText:()=>text,get version(){return version;},positionAt:n=>n};
const vscode={ViewColumn:{Active:1},Range:class{constructor(start,end){Object.assign(this,{start,end});}},window:{
 createWebviewPanel:()=>{disposed=false;let onDispose;return {webview:{html:'',onDidReceiveMessage:fn=>{receive=fn;return{dispose(){}};},postMessage:async reply=>{lastReply=reply;}},onDidDispose:fn=>{onDispose=fn;},dispose(){disposed=true;onDispose?.();}};},
 showTextDocument:async()=>({edit:async callback=>{callback({replace:(range,value)=>{text=text.slice(0,range.start)+value+text.slice(range.end);}});version++;applied++;return true;}}),
 showWarningMessage:async()=>confirmation,
}};
const context={subscriptions:[]};
const node={kind:'page',isHome:true,sourcePath:filename,siteRoot:root,url:'/'};
const open=async()=>{
 const info=await service.getSiteNodeInformation({kind:'page',isHome:true,sourcePath:filename,source:text});
 const promise=editPageForm({vscode,context,service,node,document,info,chooseNode:async()=>node,documentSources:()=>new Map([[filename,text]]),updateDocument:async()=>{}});
 return {promise,info};
};
const send=async(values,type='submit')=>{lastReply=undefined;await receive({type,revision:1,values});};
try {
 await mkdir(path.join(root,'site-config'));await writeFile(path.join(root,'site-config/settings.yaml'),'url: https://example.com/\n');await mkdir(path.dirname(filename));await writeFile(filename,text);
 let opened=await open();
 await send({title:'Changed',description:'Summary',listed:true,listChildren:false,aliases:['bad']});
 assert.match(lastReply.errors.aliases,/Start and end/);assert.equal(applied,0);assert.equal(disposed,false);
 await send({title:'Changed',description:'Summary',listed:true,listChildren:true,aliases:['/old-home/']});
 await opened.promise;assert.equal(applied,1);assert.match(text,/# Changed/);assert.match(text,/old-home/);assert.match(text,/listChildren: true/);assert.match(text,/Body stays/);assert.equal(await readFile(filename,'utf8'),'# Home\n\nBody stays.\n');
 opened=await open();confirmation=undefined;
 await send({...opened.info,aliases:[]});assert.equal(disposed,false);assert.equal(applied,1);
 confirmation='Remove addresses';await send({...opened.info,aliases:[]});await opened.promise;assert.equal(applied,2);assert.doesNotMatch(text,/aliases/);
 opened=await open();text+='Concurrent edit\n';version++;
 await send({...opened.info,title:'Stale'});assert.match(lastReply.errors.form,/source changed/);assert.equal(applied,2);await receive({type:'cancel'});await opened.promise;
 const html=pageFormHtml({edit:true,kind:'page',title:'</script><script>bad()</script>',description:'" test',aliases:[],url:'/'},'test');
 assert.doesNotMatch(html,/<script>bad/);assert.match(html,/default-src 'none'/);assert.match(html,/Add additional address/);assert.match(html,/List direct child pages after this page/);
 console.log('Page form adapter passed: atomic editing, alias validation/removal, cancellation, stale buffers and escaping.');
} finally {await rm(root,{recursive:true,force:true});}
