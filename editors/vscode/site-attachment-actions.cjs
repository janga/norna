const path=require('node:path');
const {randomUUID}=require('node:crypto');
const {openAttachmentForm}=require('./attachment-form.cjs');

function registerSiteAttachmentActions({vscode,context,chooseNode,ownerOf,serviceFor,documentSources,refresh,register}) {
 const uri=filename=>vscode.Uri.file(filename);
 let running=false;
 const perform=async(argument,mode)=>{
  const active=vscode.window.activeTextEditor;
  const selected=await chooseNode(argument),page=ownerOf(selected);
  if(page?.kind!=='page')throw new Error('Select a page or one of its attachments.');
  if(mode!=='import'&&path.dirname(selected.sourcePath)!==path.join(path.dirname(page.sourcePath),'downloads'))throw new Error('Select an attachment in this page’s downloads folder.');
  const service=await serviceFor(page.siteRoot);
  if(service.siteAttachmentsApiVersion!==1)throw new Error('Update this project’s Norna engine to use attachments.');
  const document=await vscode.workspace.openTextDocument(uri(page.sourcePath));
  const version=document.version,source=document.getText();
  const atCursor=active?.document===document;
  const offset=atCursor?document.offsetAt(active.selection.active):source.length;
  const originals=new Map();let nextId=0,mutated=false;
  const chooseFiles=async()=>{
   const files=await vscode.window.showOpenDialog({title:mode==='replace'?'Replace attachment':'Add attachments',openLabel:mode==='replace'?'Choose Replacement':'Add Files',canSelectMany:mode!=='replace',canSelectFiles:true,canSelectFolders:false});
   if(!files)return [];
   const rows=[];
   for(const file of files){if(file.scheme!=='file')throw new Error('Choose a local file.');const stat=await vscode.workspace.fs.stat(file);const name=path.basename(file.fsPath);const id=nextId++;originals.set(id,{filePath:file.fsPath,name});rows.push({id,sourceName:name,filename:mode==='replace'?selected.title:name,action:mode==='replace'?'import':'insert',text:name,replace:mode==='replace',edited:mode==='replace',sourceInfo:{size:stat.size,modified:stat.mtime,type:path.extname(name).slice(1).toUpperCase()||'File'}});}
   return rows;
  };
  let rows;
  if(mode==='insert'){
   const stat=await vscode.workspace.fs.stat(uri(selected.sourcePath));originals.set(0,{filePath:selected.sourcePath,name:selected.title});
   rows=[{id:0,sourceName:selected.title,filename:selected.title,action:'insert',text:selected.title,sourceInfo:{size:stat.size,modified:stat.mtime,type:path.extname(selected.title).slice(1).toUpperCase()||'File'}}];
  }else rows=await chooseFiles();
  if(!rows.length)return;
  const stable=async callback=>{const sources=documentSources();const result=await callback(sources);if(JSON.stringify([...sources])!==JSON.stringify([...documentSources()]))throw new Error('Unsaved files changed during the check. Try again.');return result;};
  const collect=async values=>{
   if(!Array.isArray(values)||values.length!==originals.size||new Set(values.map(row=>row.id)).size!==values.length)throw new Error('The file selection changed. Reopen the form.');
   const results=[],plans=[],pending=[];
   for(const row of values){
    const original=originals.get(row.id);if(!original||!['insert','import','ignore'].includes(row.action))throw new Error('Invalid attachment selection. Reopen the form.');
    if(mode==='replace'&&row.filename!==selected.title)throw new Error('Replacement keeps the existing filename. Use Rename separately.');
    if(mode==='insert'&&(row.filename!==original.name||row.action!=='insert'))throw new Error('Use Rename to change an attachment filename.');
    if(row.action==='ignore'){results.push({id:row.id,error:'',existing:null});continue;}
    if(mode==='insert'){await service.getEditorResourceReferences({siteRoot:page.siteRoot,filePath:selected.sourcePath,sources:documentSources()});continue;}
    const options={siteRoot:page.siteRoot,sourcePath:page.sourcePath,filePath:original.filePath,filename:row.filename,pending:[...pending]};
    const planFor=replace=>stable(sources=>service.planEditorAttachmentCopy({...options,replace,sources}));
    try{
     let plan,replace=row.replace===true;
     if(replace)plan=await planFor(true);
     else try{plan=await planFor(false);}catch(error){
      const candidate=await planFor(true).catch(()=>null);
      if(!candidate)throw error;
      const auto=!row.edited&&row.filename===original.name;
      if(!auto){results.push({id:row.id,error:'Choose Replace, a different filename or Ignore.',existing:{...candidate.existingInfo,type:path.extname(row.filename).slice(1).toUpperCase()||'File'}});pending.push(row.filename);continue;}
      replace=true;plan=candidate;
     }
     plans.push({id:row.id,options:{...options,replace},plan});pending.push(row.filename);
     results.push({id:row.id,error:'',replace,existing:plan.existingInfo?{...plan.existingInfo,type:path.extname(row.filename).slice(1).toUpperCase()||'File'}:null});
    }catch(error){results.push({id:row.id,error:error.message});pending.push(row.filename);}
   }
   const inserted=values.filter(row=>row.action==='insert');
   let error='';
   try{if(inserted.length){if(document.isClosed||document.version!==version)throw new Error('The page changed. Close this form and insert again at the intended position.');service.createEditorAttachmentInsertion({source,offset,items:inserted.map(row=>({filename:row.filename,text:row.text}))});}}catch(failure){error=failure.message;}
   return {rows:results,plans,error,blocked:Boolean(error||results.some(row=>row.error)||values.every(row=>row.action==='ignore'))};
  };
  await openAttachmentForm(vscode,context,{title:page.title,rows,insert:mode==='insert',replace:mode==='replace',placement:mode==='replace'?'Replace file; existing links keep their address.':`Insert links: ${atCursor?'at cursor in':'at end of'} ${page.title}`},{
   add:mode==='replace'?async()=>[]:chooseFiles,
   preview:async values=>{const {rows,error,blocked}=await collect(values);return {rows,error,blocked};},
   apply:async values=>{
    if(mutated)throw Object.assign(new Error('This import already changed files. Close the form and check the reported results before retrying.'),{locked:true});
    const result=await collect(values);if(result.blocked)throw new Error(result.error||result.rows.filter(row=>row.error).map(row=>row.error).join('\n'));
    const replacements=result.plans.filter(entry=>entry.plan.replace);
    if(replacements.length&&await vscode.window.showWarningMessage('Replace these attachments?',{modal:true,detail:replacements.map(({plan})=>`${path.basename(plan.source)} → ${plan.filename}`).join('\n')+'\n\nThe previous files go to Trash. Existing links keep their addresses.'},'Replace')!=='Replace')return false;
    await chooseNode(page);
    const fresh=await collect(values);
    if(fresh.blocked||JSON.stringify(fresh.plans.map(entry=>entry.plan.fingerprint))!==JSON.stringify(result.plans.map(entry=>entry.plan.fingerprint)))throw new Error('Files or references changed. Review the import again.');
    const inserted=values.filter(row=>row.action==='insert');
    const edit=service.createEditorAttachmentInsertion({source,offset,items:inserted.map(row=>({filename:row.filename,text:row.text}))});
    const done=[];
    const staging=uri(path.join(context.globalStorageUri.fsPath,'attachments-'+randomUUID()));
    try{
     if(result.plans.length)await vscode.workspace.fs.createDirectory(staging);
     for(const entry of result.plans){const staged=uri(path.join(staging.fsPath,String(entry.id)));await vscode.workspace.fs.copy(uri(entry.plan.source),staged,{overwrite:false});entry.staged=staged;}
     for(const entry of result.plans){
      const {plan,options,staged}=entry;
      const current=await stable(sources=>service.planEditorAttachmentCopy({...options,sources}));
      if(current.fingerprint!==plan.fingerprint)throw new Error('A file changed after review.');
      if(vscode.workspace.textDocuments.some(doc=>doc.isDirty&&[plan.source,plan.destination].includes(doc.uri.fsPath)))throw new Error('Save or undo edits in the attachment file before replacing/importing it.');
      if(inserted.length&&(document.isClosed||document.version!==version))throw new Error('The page changed while importing.');
      await chooseNode(page);
      await vscode.workspace.fs.createDirectory(uri(path.dirname(plan.destination)));mutated=true;
      if(plan.replace)await vscode.workspace.fs.delete(uri(plan.destination),{useTrash:true});
      await vscode.workspace.fs.copy(staged,uri(plan.destination),{overwrite:false});done.push(plan.filename);
     }
     if(inserted.length){
      if(document.isClosed||document.version!==version)throw new Error('The page changed.');
      const editor=await vscode.window.showTextDocument(document,{preview:false});
      if(document.isClosed||document.version!==version)throw new Error('The page changed.');
      if(!await editor.edit(builder=>builder.insert(document.positionAt(edit.start),edit.text),{undoStopBefore:true,undoStopAfter:true}))throw new Error('The links could not be inserted.');
      editor.revealRange(new vscode.Range(document.positionAt(edit.start),document.positionAt(edit.start+edit.text.length)));
     }
     return true;
    }catch(error){if(mutated){error.message+=`\nImported: ${done.join(', ')||'none'}. Links were not inserted. Previous replaced files are in Trash. Close the form and check these files before retrying.`;error.locked=true;}throw error;}
    finally{await vscode.workspace.fs.delete(staging,{recursive:true}).catch(()=>{});await refresh();}
   }
  });
 };
 for(const [name,mode] of [['addAttachments','import'],['insertAttachment','insert'],['replaceAttachment','replace']])register('nornaEditor.'+name,async argument=>{if(running)throw new Error('Finish or cancel the attachment form first.');running=true;try{return await perform(argument,mode);}finally{running=false;}});
}
module.exports={registerSiteAttachmentActions};
