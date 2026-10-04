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
import { parsePageMarkdownSource } from './lib/page-markdown.mjs';
import { parseFragment } from 'parse5';
const fixture=async t=>{
 const temp=await mkdtemp(path.join(os.tmpdir(),'norna-attachments-'));t.after(()=>rm(temp,{recursive:true,force:true}));const root=path.join(temp,'site');
 const write=async(name,text)=>{const file=path.join(root,name);await mkdir(path.dirname(file),{recursive:true});await writeFile(file,text);return file;};
 await write('site-config/settings.yaml','sourceFormat: 2\nurl: https://example.com/manual/\n');await write('root/tree-theme.yaml','preset: documentation\n');const home=await write('root/content.md','# Home\n\n[Local](checklist.pdf)\n\n[Shared](/guide/downloads/checklist.pdf#page=2)\n');
 await write('root/downloads/checklist.pdf','home PDF');const guide=await write('root/pages/guide/content.md','# Guide\n\n[File](checklist.pdf?mode=view#page=1)\n\n[Unicode](<r%C3%A4kningar%20ett.zip>)\n');const pdf=await write('root/pages/guide/downloads/checklist.pdf','guide PDF');await write('root/pages/guide/downloads/räkningar ett.zip','ZIP');
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
 await f.write('root/pages/guide/downloads/nested/file.txt','unsupported');assert.ok((await f.state()).incomplete.some(message=>message.includes('subfolders')));
});
test('empty images/downloads disappear while page retains Add; folder removal reports incoming links',async t=>{
 const f=await fixture(t);await mkdir(path.join(f.root,'root/images'));const tree=await readSiteFileTree({siteRoot:f.root});assert.ok(!tree.items.some(item=>item.role==='images'));assert.ok(tree.items.find(item=>item.isHome).actions.includes('addAttachments'));
 const plan=await planEditorFolderRemoval({siteRoot:f.root,directory:path.dirname(f.pdf)});assert.equal(plan.files,2);assert.equal(plan.usage.references.length,3);
});
test('insertion escapes text, respects CRLF and rejects code/frontmatter positions',()=>{
 const items=[{filename:'räkningar ett.zip',text:'A [file]'}];const source='# Home\r\n\r\nText';assert.match(createEditorAttachmentInsertion({source,items}).text,/\[A \\\[file\\\]\]\(downloads\/r%C3%A4kningar%20ett.zip\)/);
 assert.throws(()=>createEditorAttachmentInsertion({source:'# Home\n\n```js\ncode\n```\n',offset:15,items}),/ordinary page text/);
 const batch=createEditorAttachmentInsertion({source,items:[...items,{filename:'next.txt',text:'Next'}]});assert.match(batch.text,/\r\n- \[Next\]/);
});
test('moving a page carries attachments and updates sharing while retaining local shorthand',async t=>{
 const f=await fixture(t),state=await f.state();const plan=await createPageMovePlan({from:'/guide/',to:'/renamed/',graph:state.graph,publicFiles:state.publicFiles,siteStructure:state.structure,sitePagesDir:path.join(f.root,'root/pages'),sitePagesLabel:'site/root/pages',generatedRoutes:state.generatedRoutes});
 assert.match(plan.fileChanges.find(change=>change.originalPath===f.home).updatedSource,/\/renamed\/downloads\/checklist.pdf#page=2/);
 await applyPageMovePlan(plan,{siteRoot:f.root,generatedRoutes:state.generatedRoutes});const after=await f.state();assert.equal(after.graph.diagnostics.length,0);assert.equal(after.graph.attachments.files.length,3);
});

test('all local attachment paths and reference forms retain ownership, titles and editable ranges', async t => {
 const f = await fixture(t);
 const source = ['---', 'page:', '  description: Attachment forms', '---', '# Guide', '',
  '[Explicit](downloads/checklist.pdf?view=1#page=2 "Inline title")',
  '[Dotted](./downloads/checklist.pdf)', '[Short](checklist.pdf)',
  '[Full][checklist]', '[checklist][]', '[checklist]',
  '[Unicode](<./downloads/räkningar ett.zip> "Unicode title")', '',
  '## Later definitions', '', '[checklist]: downloads/checklist.pdf "Reference title"',
  '[checklist]: ignored.pdf', '', '`[Example](downloads/ignored.pdf)`',
  '[Public](/public.pdf)', '[External](https://example.org/checklist.pdf)', '',
 ].join('\r\n');
 await f.write('root/pages/guide/content.md', source);
 await f.write('public/public.pdf', 'Public file');
 const state = await f.state();
 assert.deepEqual(state.graph.diagnostics, []);
 const refs = state.graph.references.filter(ref => ref.sourceContentFile.contentPath === f.guide && ref.resolution?.kind === 'attachment');
 assert.equal(refs.length, 7);
 assert.ok(refs.every(ref => ref.resolution.file.ownerPathname === '/guide/'));
 const rendered = await rewriteAttachmentLinks(source, pathToFileURL(f.guide), f.root);
 assert.ok(rendered.includes('[Explicit](/guide/downloads/checklist.pdf?view=1#page=2 "Inline title")'));
 assert.ok(rendered.includes('[checklist]: /guide/downloads/checklist.pdf "Reference title"'));
 assert.ok(rendered.includes('[Unicode](</guide/downloads/r%C3%A4kningar%20ett.zip> "Unicode title")'));
 assert.ok(rendered.includes('[checklist]: ignored.pdf'));
 const dirty = source + '\r\nUnsaved prose.\r\n';
 const plan = await planEditorResourceRename({ siteRoot: f.root, filePath: f.pdf, name: 'ny rapport).pdf', sources: new Map([[f.guide, dirty]]) });
 const updated = plan.changes.find(change => change.sourcePath === f.guide).updated;
 assert.ok(updated.includes('[Explicit](downloads/ny%20rapport%29.pdf?view=1#page=2 "Inline title")'));
 assert.ok(updated.includes('[Dotted](./downloads/ny%20rapport%29.pdf)'));
 assert.ok(updated.includes('[Short](ny%20rapport%29.pdf)'));
 assert.ok(updated.includes('[checklist]: downloads/ny%20rapport%29.pdf "Reference title"'));
 assert.equal((updated.match(/ny%20rapport%29.pdf/g) ?? []).length, 4, 'Shared definition changes once');
 assert.ok(updated.includes('`[Example](downloads/ignored.pdf)`'));
 assert.ok(updated.includes('[Public](/public.pdf)'));
 assert.ok(updated.endsWith('\r\nUnsaved prose.\r\n'));
 assert.equal(updated.replaceAll('\r\n', '').includes('\n'), false);
 assert.equal((await parsePageMarkdownSource(updated)).links.length, 9);
 assert.equal(await readFile(f.guide, 'utf8'), source, 'Planning preserves the saved source');
 const usage = await planEditorFolderRemoval({ siteRoot: f.root, directory: path.dirname(f.pdf) });
 assert.equal(usage.usage.references.length, 8, 'Seven local uses and one explicit incoming link');
});

test('missing explicit local attachments cannot resolve to another owner or a public file', async t => {
 const f = await fixture(t);
 await f.write('root/downloads/home-only.txt', 'Owned by Home');
 await f.write('public/guide/downloads/home-only.txt', 'Public file');
 await f.write('root/pages/guide/content.md', '# Guide\n\n[Missing](downloads/home-only.txt)\n\n[Missing too](./downloads/home-only.txt)\n\n[Public](/guide/downloads/home-only.txt)\n');
 const state = await f.state();
 assert.deepEqual(state.graph.diagnostics.map(issue => issue.code), ['missing-attachment', 'missing-attachment']);
 assert.ok(state.graph.diagnostics.every(issue => issue.message.includes(path.join(f.root, 'root/pages/guide/downloads/home-only.txt'))));
 assert.equal(state.graph.references.at(-1).resolution.kind, 'public-file');
});

test('a deeper page move keeps local source paths and shared definitions while updating incoming URLs', async t => {
 const f = await fixture(t);
 await f.write('root/pages/parent/content.md', '# Parent\n');
 await f.write('root/pages/guide/downloads/paren).txt', 'Escaped filename');
 const local = '[One](downloads/checklist.pdf?x=1#page=2 "Keep title")\n\n[Two](./downloads/checklist.pdf)\n\n[Three](checklist.pdf)\n\n[Four][file]\n\n[file]: ./downloads/checklist.pdf "Shared title"\n\n[Escaped](downloads/paren\\).txt)\n';
 await f.write('root/pages/guide/content.md', '# Guide\n\n' + local);
 const state = await f.state();
 const plan = await createPageMovePlan({ from: '/guide/', to: '/parent/guide/', graph: state.graph, publicFiles: state.publicFiles, siteStructure: state.structure, sitePagesDir: path.join(f.root, 'root/pages'), sitePagesLabel: 'site/root/pages', generatedRoutes: state.generatedRoutes });
 await applyPageMovePlan(plan, { siteRoot: f.root, generatedRoutes: state.generatedRoutes });
 assert.ok((await readFile(path.join(f.root, 'root/pages/parent/pages/guide/content.md'), 'utf8')).includes(local));
 assert.equal(await readFile(path.join(f.root, 'root/pages/parent/pages/guide/downloads/checklist.pdf'), 'utf8'), 'guide PDF');
 assert.match(await readFile(f.home, 'utf8'), /\/parent\/guide\/downloads\/checklist.pdf#page=2/);
 assert.deepEqual((await f.state()).graph.diagnostics, []);
});
test('build renders local card and Markdown attachment URLs with the deployment prefix', async t => {
 const engineRoot = new URL('../', import.meta.url);
 const cache = new URL('../node_modules/.cache/', import.meta.url);
 await mkdir(cache, { recursive: true });
 const directory = await mkdtemp(path.join(fileURLToPath(cache), 'norna-attachment-build-'));
 t.after(() => rm(directory, { recursive: true, force: true }));
 const siteRoot = path.join(directory, 'site');
 const page = path.join(siteRoot, 'root/pages/guide');
 await mkdir(path.join(siteRoot, 'site-config'), { recursive: true });
 await mkdir(path.join(page, 'downloads'), { recursive: true });
 await writeFile(path.join(siteRoot, 'site-config/settings.yaml'), 'sourceFormat: 2\nurl: https://example.com/manual/\n');
 await writeFile(path.join(siteRoot, 'root/tree-theme.yaml'), 'preset: documentation\n');
 await writeFile(path.join(siteRoot, 'root/content.md'), '# Home\n');
 await writeFile(path.join(page, 'content.md'), ['# Guide', '',
  '[File](<räkningar ett.txt>)', '', '[Relative](<downloads/räkningar ett.txt> "Inline title")', '',
  '[Dotted](./downloads/r%C3%A4kningar%20ett.txt?mode=view#part)', '',
  '[Full][file]', '[file][]', '[file]', '',
  '> [Quoted](downloads/r%C3%A4kningar%20ett.txt)', '',
  '- [Listed](./downloads/r%C3%A4kningar%20ett.txt)', '',
  '[Parenthesis](<downloads/data).txt>)', '',
  '## Download [Heading][file]', '',
  '[file]: <./downloads/räkningar ett.txt> "Reference title"', '',
  '```card-list', 'items:', '  - title: Download example', '    text: An unchanged source file.',
  '    link: "downloads/räkningar ett.txt?mode=view#part"', '```', '',
 ].join('\n'));
 const bytes = Buffer.from([0, 1, 127, 128, 255]);
 await writeFile(path.join(page, 'downloads/räkningar ett.txt'), bytes);
 await writeFile(path.join(page, 'downloads/data).txt'), 'Parenthesis filename');
 await promisify(execFile)(process.execPath, ['bin/norna.mjs', 'build'], {
  cwd: engineRoot, env: { ...process.env, NORNA_SITE_DIR: siteRoot, NORNA_INTERNAL_STATE_DIR: path.join(directory, 'state') },
  timeout: 60_000, maxBuffer: 2_000_000,
 });
 const html = await readFile(path.join(directory, 'state/dist/guide/index.html'), 'utf8');
 assert.ok(html.includes('href="/manual/guide/downloads/r%C3%A4kningar%20ett.txt"'));
 assert.ok(html.includes('href="/manual/guide/downloads/r%C3%A4kningar%20ett.txt?mode=view#part"'));
 assert.deepEqual(await readFile(path.join(directory, 'state/dist/guide/downloads/räkningar ett.txt')), bytes);
 const links = [];
 const visit = node => { if (node.tagName === 'a') links.push(node); for (const child of node.childNodes ?? []) visit(child); };
 visit(parseFragment(html));
 const text = node => node.value ?? (node.childNodes ?? []).map(text).join('');
 const attr = (node, name) => node.attrs.find(attr => attr.name === name)?.value;
 for (const label of ['File', 'Relative', 'Full', 'Quoted', 'Listed', 'Heading']) {
  const link = links.find(link => text(link) === label);
  assert.ok(link, label);
  assert.equal(attr(link, 'href'), '/manual/guide/downloads/r%C3%A4kningar%20ett.txt', label);
  assert.equal(attr(link, 'download'), undefined, label);
 }
 assert.equal(links.filter(link => text(link) === 'file' && attr(link, 'href') === '/manual/guide/downloads/r%C3%A4kningar%20ett.txt').length, 2);
 assert.equal(attr(links.find(link => text(link) === 'Relative'), 'title'), 'Inline title');
 assert.equal(attr(links.find(link => text(link) === 'Full'), 'title'), 'Reference title');
 assert.equal(attr(links.find(link => text(link) === 'Heading'), 'title'), 'Reference title');
 assert.equal(attr(links.find(link => text(link) === 'Parenthesis'), 'href'), '/manual/guide/downloads/data%29.txt');
});
