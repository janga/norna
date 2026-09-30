const { randomBytes } = require('node:crypto');
const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
function attachmentFormHtml(model, nonce) {
 return `<!doctype html><html><head><meta charset="UTF-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'nonce-${nonce}'; script-src 'nonce-${nonce}'"><style nonce="${nonce}">
 body{font-family:var(--vscode-font-family);color:var(--vscode-foreground);background:var(--vscode-editor-background);padding:24px;max-width:850px;margin:auto}h1{font-size:1.5em}h2{font-size:1.1em;overflow-wrap:anywhere}.hint{color:var(--vscode-descriptionForeground)}article{border-top:1px solid var(--vscode-widget-border);padding:16px 0}label{display:block;margin:12px 0 5px}input:not([type=checkbox]),select{display:block;width:100%;box-sizing:border-box;padding:8px;color:var(--vscode-input-foreground);background:var(--vscode-input-background);border:1px solid var(--vscode-input-border,var(--vscode-widget-border));font:inherit}button{font:inherit;padding:7px 12px;margin:8px 6px 0 0;border:0;background:var(--vscode-button-background);color:var(--vscode-button-foreground);cursor:pointer}button.secondary{background:var(--vscode-button-secondaryBackground);color:var(--vscode-button-secondaryForeground)}button:disabled{opacity:.5;cursor:default}button:focus,input:focus,select:focus{outline:1px solid var(--vscode-focusBorder)}.collision{border-left:3px solid var(--vscode-editorWarning-foreground);padding:8px 14px;margin-top:12px}.error{color:var(--vscode-errorForeground);white-space:pre-wrap}.error:empty{display:none}footer{position:sticky;bottom:0;background:var(--vscode-editor-background);padding:12px 0;display:flex;justify-content:space-between}.order{display:flex;gap:8px}.metadata{overflow-wrap:anywhere}
 </style></head><body><h1>${model.insert ? 'Insert attachment link' : 'Add attachments'}: ${escape(model.title)}</h1><p class="hint">${escape(model.placement)}</p><div id="rows"></div><p id="error" class="error" role="alert"></p><footer><span>${model.insert || model.replace ? '' : '<button id="add" class="secondary">Add more files</button>'}</span><span><button id="cancel" class="secondary">Cancel</button><button id="apply" disabled>${model.insert ? 'Insert link' : 'Import'}</button></span></footer>
 <script nonce="${nonce}">
 const vscode=acquireVsCodeApi(), initial=${JSON.stringify(model.rows).replace(/</g,'\\u003c')}, inserting=${Boolean(model.insert)},replacing=${Boolean(model.replace)};
 let rows=initial,busy=false,locked=false,request=0,blocked=true;const root=document.getElementById('rows');
 const safe=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const metadata=x=>x ? safe(x.type)+' · '+safe(x.size)+' bytes · Modified '+safe(new Date(x.modified).toLocaleString()) : '';
 // Validation replaces rows. Keep keyboard focus and text selection on the same field.
 function refresh(){
  const active=document.activeElement, article=active?.closest('article');
  const focus=article?{id:article.dataset.id,field:active.classList[0],start:active.selectionStart,end:active.selectionEnd}:null;
  render();
  if(!focus)return;
  const control=root.querySelector('article[data-id="'+focus.id+'"] .'+focus.field);
  control?.focus();
  if(typeof control?.setSelectionRange==='function'&&Number.isInteger(focus.start))control.setSelectionRange(focus.start,focus.end);
 }
 function values(){return rows.map(r=>({id:r.id,filename:r.filename,action:r.action,text:r.text,replace:r.replace,edited:r.edited}));}
 function send(type){vscode.postMessage({type,request:++request,rows:values()});}
 function controls(){document.getElementById('apply').disabled=busy||locked||blocked;document.getElementById('cancel').disabled=busy;const add=document.getElementById('add');if(add)add.disabled=busy||locked;root.querySelectorAll('input,select,button').forEach(e=>e.disabled=busy||locked);}
 function render(){root.innerHTML=rows.map((r,i)=>'<article data-id="'+r.id+'"><h2>'+safe(r.sourceName)+'</h2><p class="hint metadata">'+metadata(r.sourceInfo)+'</p><label>File name<input class="name" value="'+safe(r.filename)+'" '+(inserting||replacing?'readonly':'')+'></label>'+(inserting||replacing?'':'<label>Action<select class="action"><option value="insert" '+(r.action==='insert'?'selected':'')+'>Import and insert link</option><option value="import" '+(r.action==='import'?'selected':'')+'>Import</option><option value="ignore" '+(r.action==='ignore'?'selected':'')+'>Ignore</option></select></label>')+'<div class="link" '+(r.action!=='insert'?'hidden':'')+'><label>Link text<input class="text" value="'+safe(r.text)+'"></label>'+(rows.filter(x=>x.action==='insert').length>1?'<div class="order"><button class="up secondary">Move up</button><button class="down secondary">Move down</button></div>':'')+'</div><div class="collision" '+(!r.existing||r.action==='ignore'?'hidden':'')+'><strong>Existing file</strong><p>'+safe(r.filename)+'<br>'+metadata(r.existing)+'</p><strong>New file</strong><p>'+safe(r.sourceName)+'<br>'+metadata(r.sourceInfo)+'</p><p>Replace this file, enter a different file name, or choose Ignore.</p><label><input class="replace" type="checkbox" '+(r.replace?'checked':'')+'> Replace existing file</label></div><p class="row-error error">'+safe(r.error)+'</p></article>').join('');
 root.querySelectorAll('article').forEach(el=>{const r=rows.find(x=>x.id===Number(el.dataset.id));el.querySelector('.name').oninput=e=>{r.filename=e.target.value;r.edited=true;r.replace=false;blocked=true;send('preview');};el.querySelector('.text').oninput=e=>{r.text=e.target.value;blocked=true;send('preview');};const a=el.querySelector('.action');if(a)a.onchange=e=>{r.action=e.target.value;blocked=true;refresh();send('preview');};const c=el.querySelector('.replace');if(c)c.onchange=e=>{r.replace=e.target.checked;r.edited=true;blocked=true;send('preview');};for(const [cls,delta] of [['up',-1],['down',1]]){const b=el.querySelector('.'+cls);if(b)b.onclick=()=>{const i=rows.indexOf(r);let j=i+delta;while(j>=0&&j<rows.length&&rows[j].action!=='insert')j+=delta;if(j<0||j>=rows.length)return;[rows[i],rows[j]]=[rows[j],rows[i]];blocked=true;refresh();send('preview');};}});controls();}
 document.getElementById('apply').onclick=()=>{busy=true;controls();send('apply');};document.getElementById('cancel').onclick=()=>send('cancel');if(document.getElementById('add'))document.getElementById('add').onclick=()=>send('add');
 window.addEventListener('message',({data})=>{if(data.request!==request)return;busy=false;locked=Boolean(data.locked);blocked=Boolean(data.blocked);document.getElementById('error').textContent=data.error||'';
 if(data.added)rows.push(...data.added);if(data.rows)for(const result of data.rows){const r=rows.find(x=>x.id===result.id);if(r)Object.assign(r,result);}
 refresh();
 if(data.added)send('preview');});render();send('preview');
 </script></body></html>`;
}
function openAttachmentForm(vscode, context, model, callbacks) {
 const panel=vscode.window.createWebviewPanel('nornaAttachments', `${model.insert?'Insert link':'Add attachments'}: ${model.title}`,vscode.ViewColumn.Active,{enableScripts:true,retainContextWhenHidden:true,localResourceRoots:[]});
 panel.webview.html=attachmentFormHtml(model,randomBytes(24).toString('hex'));
 let busy=false,disposed=false;
 return new Promise(resolve=>{
 const subscription=panel.webview.onDidReceiveMessage(async message=>{
  if(disposed||busy)return;
  if(message.type==='cancel'){panel.dispose();return;}
  try{
   if(message.type==='apply'){busy=true;const done=await callbacks.apply(message.rows);if(done&&!disposed)panel.dispose();else if(!disposed)await panel.webview.postMessage({request:message.request,blocked:false});}
   else if(message.type==='preview')await panel.webview.postMessage({request:message.request,...await callbacks.preview(message.rows)});
   else if(message.type==='add')await panel.webview.postMessage({request:message.request,added:await callbacks.add(),blocked:true});
  }catch(error){if(!disposed)await panel.webview.postMessage({request:message.request,error:error.message,blocked:true,locked:Boolean(error.locked)});}finally{busy=false;}
 });panel.onDidDispose(()=>{disposed=true;subscription.dispose();resolve();});context.subscriptions.push(panel);
 });
}
module.exports={openAttachmentForm,attachmentFormHtml};
