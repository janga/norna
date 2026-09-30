import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { readEditorLinkState } from './lib/editor-site-links.mjs';
import { rewriteAttachmentLinks } from './lib/attachment-render.mjs';
import { planEditorAttachmentCopy, createEditorAttachmentInsertion } from './lib/editor-attachments.mjs';
import { planEditorResourceRename, planEditorFolderRemoval } from './lib/editor-resource-actions.mjs';
import { readSiteFileTree } from './lib/editor-site-tree.mjs';
import { createPageMovePlan } from './lib/page-move-plan.mjs';
import { applyPageMovePlan } from './lib/page-move-apply.mjs';
const fixture=async t=>{
 const temp=await mkdtemp(path.join(os.tmpdir(),'norna-attachments-'));t.after(()=>rm(temp,{recursive:true,force:true}));const root=path.join(temp,'site');
 const write=async(name,text)=>{const file=path.join(root,name);await mkdir(path.dirname(file),{recursive:true});await writeFile(file,text);return file;};
 await write('site-config/settings.yaml','url: https://example.com/manual/\n');await write('root/tree-theme.yaml','preset: documentation\n');const home=await write('root/content.md','# Home\n\n[Local](checklist.pdf)\n\n[Shared](/guide/downloads/checklist.pdf#page=2)\n');
 await write('root/downloads/checklist.pdf','home PDF');const guide=await write('root/pages/010-guide/content.md','# Guide\n\n[File](checklist.pdf?mode=view#page=1)\n\n[Unicode](<r%C3%A4kningar%20ett.zip>)\n');const pdf=await write('root/pages/010-guide/downloads/checklist.pdf','guide PDF');await write('root/pages/010-guide/downloads/räkningar ett.zip','ZIP');
 return {temp,root,write,home,guide,pdf,state:()=>readEditorLinkState({siteRoot:root})};
};
test('local attachment lookup, rendering, explicit sharing and distinct missing links',async t=>{
 const f=await fixture(t),state=await f.state();assert.equal(state.incomplete.length,0);assert.equal(state.graph.diagnostics.length,0);
 assert.equal(state.graph.references[0].resolution.file.filePath,path.join(f.root,'root/downloads/checklist.pdf'));assert.equal(state.graph.references[1].resolution.file.filePath,f.pdf);
 const source=await readFile(f.guide,'utf8');const rendered=await rewriteAttachmentLinks(source,pathToFileURL(f.guide),f.root);assert.match(rendered,/\/guide\/downloads\/checklist.pdf\?mode=view#page=1/);assert.match(rendered,/\/guide\/downloads\/r%C3%A4kningar%20ett.zip/);
 await f.write('root/content.md','# Home\n\n[Missing](/guide/downloads/missing.pdf)\n[Page](/absent/)\n[Outside](https://example.org/a.pdf)\n');const graph=(await f.state()).graph;assert.deepEqual(graph.diagnostics.map(x=>x.code),['missing-attachment','missing-internal-page']);
});
test('rename rewrites local and shared links, preserving dirty text and query/fragments',async t=>{
 const f=await fixture(t);const dirty=(await readFile(f.home,'utf8'))+'\nUnsaved prose\n';
 const plan=await planEditorResourceRename({siteRoot:f.root,filePath:f.pdf,name:'new name.pdf',sources:new Map([[f.home,dirty]])});assert.equal(plan.changes.length,2);assert.match(plan.changes.find(x=>x.sourcePath===f.home).updated,/\/guide\/downloads\/new%20name.pdf#page=2/);assert.match(plan.changes.find(x=>x.sourcePath===f.home).updated,/Unsaved prose/);assert.match(plan.changes.find(x=>x.sourcePath===f.guide).updated,/new%20name.pdf\?mode=view#page=1/);assert.equal(await readFile(f.pdf,'utf8'),'guide PDF');
});
test('import validation, original modification date, pending duplicates and publication collisions',async t=>{
 const f=await fixture(t);const source=path.join(f.temp,'source.html');await writeFile(source,'<h1>HTML</h1>');
 const options={siteRoot:f.root,sourcePath:f.guide,filePath:source,filename:'example.html'};const plan=await planEditorAttachmentCopy(options);assert.ok(plan.sourceInfo.modified>0);assert.equal(plan.sourceInfo.size,13);
 await assert.rejects(planEditorAttachmentCopy({...options,filename:'../escape.html'}),/filename/);await assert.rejects(planEditorAttachmentCopy({...options,pending:['EXAMPLE.html']}),/Two selected/);
 await f.write('public/guide/downloads/example.html','public conflict');await assert.rejects(planEditorAttachmentCopy(options),/conflicts/);
 await f.write('root/pages/010-guide/downloads/nested/file.txt','unsupported');assert.ok((await f.state()).incomplete.some(message=>message.includes('subfolders')));
});
test('empty images/downloads disappear while page retains Add; folder removal reports incoming links',async t=>{
 const f=await fixture(t);await mkdir(path.join(f.root,'root/images'));const tree=await readSiteFileTree({siteRoot:f.root});assert.ok(!tree.items.some(item=>item.role==='images'));assert.ok(tree.items.find(item=>item.isHome).actions.includes('addAttachments'));
 const plan=await planEditorFolderRemoval({siteRoot:f.root,directory:path.dirname(f.pdf)});assert.equal(plan.files,2);assert.equal(plan.usage.references.length,3);
});
test('insertion escapes text, respects CRLF and rejects code/frontmatter positions',()=>{
 const items=[{filename:'räkningar ett.zip',text:'A [file]'}];const source='# Home\r\n\r\nText';assert.match(createEditorAttachmentInsertion({source,items}).text,/\[A \\\[file\\\]\]\(r%C3%A4kningar%20ett.zip\)/);
 assert.throws(()=>createEditorAttachmentInsertion({source:'# Home\n\n```js\ncode\n```\n',offset:15,items}),/ordinary page text/);
 const batch=createEditorAttachmentInsertion({source,items:[...items,{filename:'next.txt',text:'Next'}]});assert.match(batch.text,/\r\n- \[Next\]/);
});
test('moving a page carries attachments and updates sharing while retaining local shorthand',async t=>{
 const f=await fixture(t),state=await f.state();const plan=await createPageMovePlan({from:'/guide/',to:'/renamed/',graph:state.graph,publicFiles:state.publicFiles,siteStructure:state.structure,sitePagesDir:path.join(f.root,'root/pages'),sitePagesLabel:'site/root/pages',generatedRoutes:state.generatedRoutes});
 assert.match(plan.fileChanges.find(change=>change.originalPath===f.home).updatedSource,/\/renamed\/downloads\/checklist.pdf#page=2/);
 await applyPageMovePlan(plan,{siteRoot:f.root,generatedRoutes:state.generatedRoutes});const after=await f.state();assert.equal(after.graph.diagnostics.length,0);assert.equal(after.graph.attachments.files.length,3);
});
test('build renders local card and Markdown attachment URLs with the deployment prefix', async t => {
 const engineRoot = new URL('../', import.meta.url);
 const cache = new URL('../node_modules/.cache/', import.meta.url);
 await mkdir(cache, { recursive: true });
 const directory = await mkdtemp(path.join(fileURLToPath(cache), 'norna-attachment-build-'));
 t.after(() => rm(directory, { recursive: true, force: true }));
 const siteRoot = path.join(directory, 'site');
 const page = path.join(siteRoot, 'root/pages/010-guide');
 await mkdir(path.join(siteRoot, 'site-config'), { recursive: true });
 await mkdir(path.join(page, 'downloads'), { recursive: true });
 await writeFile(path.join(siteRoot, 'site-config/settings.yaml'), 'url: https://example.com/manual/\n');
 await writeFile(path.join(siteRoot, 'root/tree-theme.yaml'), 'preset: documentation\n');
 await writeFile(path.join(siteRoot, 'root/content.md'), '# Home\n');
 await writeFile(path.join(page, 'content.md'), '# Guide\n\n[File](<räkningar ett.txt>)\n\n```card-list\nitems:\n  - title: Download example\n    text: An unchanged source file.\n    link: "räkningar ett.txt?mode=view#part"\n```\n');
 const bytes = Buffer.from([0, 1, 127, 128, 255]);
 await writeFile(path.join(page, 'downloads/räkningar ett.txt'), bytes);
 await promisify(execFile)(process.execPath, ['bin/norna.mjs', 'build'], {
  cwd: engineRoot, env: { ...process.env, NORNA_SITE_DIR: siteRoot, NORNA_INTERNAL_STATE_DIR: path.join(directory, 'state') },
  timeout: 60_000, maxBuffer: 2_000_000,
 });
 const html = await readFile(path.join(directory, 'state/dist/guide/index.html'), 'utf8');
 assert.ok(html.includes('href="/manual/guide/downloads/r%C3%A4kningar%20ett.txt"'));
 assert.ok(html.includes('href="/manual/guide/downloads/r%C3%A4kningar%20ett.txt?mode=view#part"'));
 assert.deepEqual(await readFile(path.join(directory, 'state/dist/guide/downloads/räkningar ett.txt')), bytes);
});
