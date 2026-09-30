import assert from 'node:assert/strict';
import { test } from 'node:test';
import http from 'node:http';
import net from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdtemp, mkdir, writeFile, readFile, rm, realpath } from 'node:fs/promises';
import { getEditorPreviewConfiguration, getEditorPreviewStatus, startEditorSitePreview, stopEditorSitePreview, getEditorPreviewLog } from './lib/editor-site-preview.mjs';
import { devServerIdentityPlugin } from './lib/dev-server-identity.mjs';
const fixture = async t => {
 // Like test-dev-local, use the engine's installed dependency tree. An empty
 // OS-temporary directory has no project installation for Astro to resolve.
 const cache = fileURLToPath(new URL('../node_modules/.cache/', import.meta.url));
 await mkdir(cache, { recursive: true });
 const root = await realpath(await mkdtemp(path.join(cache,'norna-preview-')));
 const siteRoot = path.join(root,'site');
 const write = async (name,text) => { const file=path.join(siteRoot,name);await mkdir(path.dirname(file),{recursive:true});await writeFile(file,text);return file; };
 await write('site-config/settings.yaml','url: https://example.com/manual/\n');await write('root/tree-theme.yaml','preset: documentation\n');await write('root/content.md','# Home\n');const page=await write('root/pages/010-guide/content.md','---\nnavigation:\n  listed: false\n---\n# Guide\n');
 t.after(async()=>{
  const state=await readFile(path.join(siteRoot,'.norna/dev/state.json'),'utf8').then(JSON.parse).catch(()=>null);
  if(state?.pid!==process.pid)await stopEditorSitePreview({siteRoot}).catch(()=>{});
  await rm(root,{recursive:true,force:true});
 });
 return {siteRoot,page,write};
};
const listen = server => new Promise(resolve=>server.listen(0,'127.0.0.1',()=>resolve(server.address().port)));
const freePort = async () => { const server=net.createServer();const port=await listen(server);await new Promise(resolve=>server.close(resolve));return String(port); };
test('port precedence validates full environment and registered review identity',async t=>{
 const f=await fixture(t);
 assert.equal((await getEditorPreviewConfiguration({...f,environment:{}})).port,4321);
 assert.equal((await getEditorPreviewConfiguration({...f,environment:{NORNA_DEV_PORT:'4388'}})).port,4388);
 for(const value of ['','4321junk','0','65536','1.5',' 4321']) await assert.rejects(getEditorPreviewConfiguration({...f,environment:{NORNA_DEV_PORT:value}}),/integer/);
 const docs=await getEditorPreviewConfiguration({siteRoot:path.resolve('site'),environment:{NORNA_DEV_PORT:'bad'}});assert.equal(docs.port,4321);assert.equal(docs.registered.target,'docs');
});
test('unrelated port and stale identity never open or stop another server',async t=>{
 const f=await fixture(t);let identity={};const server=http.createServer((req,res)=>{res.setHeader('content-type','application/json');res.end(JSON.stringify(identity));});const port=await listen(server);t.after(()=>new Promise(resolve=>server.close(resolve)));
 const options={...f,environment:{NORNA_DEV_PORT:String(port)}};
 await assert.rejects(startEditorSitePreview(options),/used by another/);
 await f.write('.norna/dev/state.json',JSON.stringify({port,pid:process.pid,token:'wrong',mode:'local'}));
 identity={token:'different',pid:process.pid,siteRoot:f.siteRoot};
 assert.equal((await getEditorPreviewStatus(f)).verified,false);
 await assert.rejects(stopEditorSitePreview(f),/Cannot verify/);
 await assert.rejects(startEditorSitePreview(options),/cannot be verified/);
 assert.equal((await fetch(`http://127.0.0.1:${port}`)).status,200);
});
test('actual startup, coalescing, saved canonical URL, reuse, cancellation and explicit stop',async t=>{
 const f=await fixture(t),port=await freePort();const options={...f,sourcePath:f.page,environment:{NORNA_DEV_PORT:port}};
 const [first,second]=await Promise.all([startEditorSitePreview(options),startEditorSitePreview(options)]);
 assert.equal(first.url,`http://127.0.0.1:${port}/manual/guide/`);assert.equal(first.reused,false);assert.equal(second.reused,true);
 const state=(await getEditorPreviewStatus(f)).state;assert.equal((await getEditorPreviewStatus(f)).verified,true);
 assert.equal((await fetch(first.url)).status,200);
 assert.equal((await startEditorSitePreview({...options,sourcePath:undefined})).url,`http://127.0.0.1:${port}/manual/`);
 await assert.rejects(startEditorSitePreview({...options,environment:{NORNA_DEV_PORT:await freePort()}}),/already running/);
 const controller=new AbortController();controller.abort();await assert.rejects(startEditorSitePreview({...options,signal:controller.signal}),/cancelled/);assert.equal((await getEditorPreviewStatus(f)).state.pid,state.pid);
 assert.match(await getEditorPreviewLog(f),/dev.log/);
 assert.equal((await stopEditorSitePreview(f)).stopped,true);assert.equal((await getEditorPreviewStatus(f)).verified,false);
 const cancel=new AbortController();await assert.rejects(startEditorSitePreview({...options,signal:cancel.signal,onOutput:()=>cancel.abort()}),/cancelled/);assert.equal((await getEditorPreviewStatus(f)).verified,false);
});
test('failed target rendering cleans up its new server; invalid theme never starts one',async t=>{
 const f=await fixture(t),port=await freePort(),options={...f,sourcePath:f.page,environment:{NORNA_DEV_PORT:port}};
 // Valid source can still fail at render time (tree navigation plus explicit
 // alternating surfaces). A successful identity probe alone is insufficient.
 await f.write('root/pages/010-guide/content.md','# Guide\n');
 await f.write('root/pages/010-guide/pages/010-child/content.md','# Child\n');
 await f.write('root/tree-theme.yaml','preset: documentation\nsections:\n  backgroundPattern: alternating\n');
 await assert.rejects(startEditorSitePreview({...options,sourcePath:undefined}),/HTTP 500/);
 assert.equal((await getEditorPreviewStatus(f)).verified,false);
 await f.write('root/tree-theme.yaml','preset: nonexistent-preset\n');await assert.rejects(startEditorSitePreview(options),/failed|Repair/);assert.equal((await getEditorPreviewStatus(f)).verified,false);
});
test('a reused server with a failing target page remains running and does not produce a preview URL',async t=>{
 const f=await fixture(t);let identity,status=500;
 const server=http.createServer((req,res)=>{
  if(req.url==='/.well-known/norna-dev'){res.setHeader('content-type','application/json');res.end(JSON.stringify(identity));}
  else {res.statusCode=status;res.end(status===500?'Rendering failed':'<h1>Guide</h1>');}
 });
 const port=await listen(server);t.after(()=>new Promise(resolve=>server.close(resolve)));
 const state={port,pid:process.pid,token:'test-owned-identity',mode:'local',siteRoot:f.siteRoot};
 identity=state;await f.write('.norna/dev/state.json',JSON.stringify(state));
 await assert.rejects(startEditorSitePreview({...f,sourcePath:f.page,environment:{NORNA_DEV_PORT:String(port)}}),/HTTP 500/);
 assert.equal((await getEditorPreviewStatus(f)).verified,true);
 status=200;await f.write('site-config/settings.yaml','url: https://example.com/\n');
 assert.equal((await startEditorSitePreview({...f,sourcePath:f.page,environment:{NORNA_DEV_PORT:String(port)}})).url,`http://127.0.0.1:${port}/guide/`);
 // Prevent fixture cleanup from treating this deliberately simulated identity
 // as a real child process owned by the dev manager.
 await rm(path.join(f.siteRoot,'.norna/dev/state.json'));
});
test('startup cleans its verified process when writing the server record fails',async t=>{
 const f=await fixture(t),port=await freePort();
 await mkdir(path.join(f.siteRoot,'.norna/dev/state.json'),{recursive:true});
 const env={...process.env,NORNA_SITE_DIR:f.siteRoot,NORNA_DEV_PORT:port,NORNA_NO_OPEN:'1',NORNA_DEV_NO_RESTART:'1'};
 delete env.NORNA_INTERNAL_STATE_DIR;delete env.NORNA_INVOCATION_ROOT;
 const manager=fileURLToPath(new URL('./dev-local.mjs',import.meta.url));
 await assert.rejects(promisify(execFile)(process.execPath,[manager,'start'],{env,timeout:60_000}),error=>/Could not start the dev server/.test(error.stderr));
 await assert.rejects(fetch(`http://127.0.0.1:${port}/.well-known/norna-dev`,{signal:AbortSignal.timeout(1000)}));
});
test('the development identity endpoint is local-only and never leaks into an unconfigured server',async t=>{
 const f=await fixture(t),stack=[];
 const install=await devServerIdentityPlugin(f.siteRoot).configureServer({middlewares:{stack}});install();
 const old=process.env.NORNA_DEV_TOKEN;process.env.NORNA_DEV_TOKEN='identity-test';
 t.after(()=>{if(old===undefined)delete process.env.NORNA_DEV_TOKEN;else process.env.NORNA_DEV_TOKEN=old;});
 let body,passed=0;
 const response={setHeader(){},end(value){body=value;}};
 const request=address=>({url:'/.well-known/norna-dev',method:'GET',socket:{remoteAddress:address}});
 stack[0].handle(request('192.0.2.5'),response,()=>passed++);assert.equal(body,undefined);assert.equal(passed,1);
 stack[0].handle(request('127.0.0.1'),response,()=>passed++);assert.equal(JSON.parse(body).siteRoot,f.siteRoot);
 delete process.env.NORNA_DEV_TOKEN;body=undefined;
 stack[0].handle(request('127.0.0.1'),response,()=>passed++);assert.equal(body,undefined);assert.equal(passed,2);
});
