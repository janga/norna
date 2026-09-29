const { randomBytes } = require('node:crypto');

const escape = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);

function imageImportHtml(model, nonce, cspSource) {
	const rows = model.rows.map((row) => `<article class="row" data-id="${row.id}">
<div class="previews"><button type="button" class="preview-open" aria-label="View new image ${escape(row.sourceName)} larger"><span class="preview-label"><strong>New image</strong><small>${escape(row.sourceName)}</small></span><img class="incoming" src="${escape(row.preview)}" alt=""><span class="preview-action">View larger</span></button><button type="button" class="preview-open existing-button" aria-label="View existing image ${escape(row.filename)} larger"><span class="preview-label"><strong>Existing image</strong><small class="existing-name">${escape(row.filename)}</small></span><img class="existing" alt=""><span class="preview-action">View larger</span></button></div>
<div class="fields"><h2>${escape(row.sourceName)}</h2>
<label>Action <select class="action"><option value="import">Import</option><option value="insert">Import and insert</option><option value="skip">Ignore</option></select></label>
<label>Filename in this page <input class="filename" value="${escape(row.filename)}" spellcheck="false"></label>
<p class="replacement-status" role="status"></p>
<div class="metadata"><label><input class="decorative" type="checkbox"> Decorative image (empty alternative text)</label>
<div class="alt-group"><label>Alternative text <input class="alt" placeholder="Describe what the image conveys"></label></div>
<label>Caption <input class="caption" placeholder="Optional caption"></label>
</div>
<p class="error" role="status"></p></div><div class="order"><button type="button" class="up secondary" aria-label="Move ${escape(row.sourceName)} up">↑</button><button type="button" class="down secondary" aria-label="Move ${escape(row.sourceName)} down">↓</button></div></article>`).join('');
	return `<!doctype html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${cspSource}; style-src 'nonce-${nonce}'; script-src 'nonce-${nonce}'"><style nonce="${nonce}">
body{font-family:var(--vscode-font-family);color:var(--vscode-foreground);background:var(--vscode-editor-background);padding:24px;max-width:850px;margin:auto}h1{font-size:1.5em}.hint{color:var(--vscode-descriptionForeground);line-height:1.45}.row{display:grid;grid-template-columns:minmax(220px,280px) minmax(0,1fr) 36px;gap:16px;padding:16px 0;border-top:1px solid var(--vscode-widget-border);align-items:start}.previews{display:grid;gap:10px}.previews .preview-open{display:block;width:100%;padding:0;border:1px solid var(--vscode-widget-border);background:var(--vscode-sideBar-background);color:var(--vscode-foreground);text-align:left}.previews .preview-open img{display:block;width:100%;height:220px;object-fit:contain}.previews .preview-label{display:grid;gap:2px;padding:8px;text-align:left}.previews .preview-label small{font-size:.85em;color:var(--vscode-descriptionForeground);overflow-wrap:anywhere}.previews .preview-action{display:block;padding:7px;text-align:center}.previews .existing-button{display:none}.row[data-collision=true] .existing-button{display:block}.fields{min-width:0}.fields h2{font-size:1em;margin:0 0 8px;overflow-wrap:anywhere}label{display:block;margin:8px 0}input,select,button{font:inherit;box-sizing:border-box}input:not([type=checkbox]),select{display:block;width:100%;padding:6px;background:var(--vscode-input-background);color:var(--vscode-input-foreground);border:1px solid var(--vscode-input-border,var(--vscode-widget-border))}input:focus,select:focus,button:focus{outline:1px solid var(--vscode-focusBorder);outline-offset:2px}button{padding:6px 10px;border:0;background:var(--vscode-button-background);color:var(--vscode-button-foreground);cursor:pointer}.secondary{background:var(--vscode-button-secondaryBackground);color:var(--vscode-button-secondaryForeground)}button:disabled{opacity:.5;cursor:default}.order{display:flex;flex-direction:column;gap:5px}.metadata{display:none}.row[data-action=insert] .metadata{display:block}.row[data-action=skip] .filename{opacity:.6}.row[data-done=true]{opacity:.65}.replacement-status{color:var(--vscode-editorWarning-foreground);font-size:.9em;margin:6px 0}.replacement-status:empty,.error:empty{display:none}.error{color:var(--vscode-errorForeground);margin:4px 0}.summary{margin:18px 0;white-space:pre-wrap}footer{display:flex;gap:10px;background:var(--vscode-editor-background);padding:14px 0}dialog{width:min(94vw,1100px);max-height:94vh;padding:18px;background:var(--vscode-editor-background);color:var(--vscode-foreground);border:1px solid var(--vscode-widget-border)}dialog::backdrop{background:rgba(0,0,0,.8)}.preview-header{display:flex;align-items:center;justify-content:space-between;gap:16px}.preview-header h2{font-size:1em;overflow-wrap:anywhere}dialog img{display:block;width:100%;height:min(78vh,780px);margin:auto;object-fit:contain}@media(max-width:720px){.row{grid-template-columns:minmax(0,1fr) 36px;gap:8px}.previews{grid-column:1 / -1}.previews .preview-open img{height:min(45vh,340px)}.fields{grid-column:1}.order{grid-column:2;grid-row:2}}
</style></head><body><h1>Import images</h1><p class="hint">Page: ${escape(model.pageTitle)} · Folder: ${escape(model.destination)}. Originals stay in place. Inserted images form one block at the end of the page.</p><div id="rows">${rows}</div><p id="summary" class="summary" role="status"></p><footer><button id="submit" type="button">Import images</button><button id="cancel" type="button" class="secondary">Cancel</button></footer><dialog id="large-preview"><div class="preview-header"><h2></h2><button type="button" class="secondary close-preview">Close</button></div><img alt="Large image preview"></dialog>
<script nonce="${nonce}">
const vscode=acquireVsCodeApi();let revision=0,busy=false,timer;const rows=document.getElementById('rows');
const all=()=>[...rows.querySelectorAll('.row')];
const values=()=>all().map(row=>({id:Number(row.dataset.id),action:row.querySelector('.action').value,filename:row.querySelector('.filename').value,alt:row.querySelector('.decorative').checked?'':row.querySelector('.alt').value,decorative:row.querySelector('.decorative').checked,caption:row.querySelector('.caption').value}));
const send=(type)=>vscode.postMessage({type,revision,rows:values()});
function changed(){revision++;clearTimeout(timer);timer=setTimeout(()=>send('preview'),150);render();}
function render(){const list=all();list.forEach((row,index)=>{const action=row.querySelector('.action').value,decorative=row.querySelector('.decorative').checked,alt=row.querySelector('.alt');row.dataset.action=action;row.querySelector('.alt-group').hidden=decorative;alt.disabled=decorative||busy;row.querySelector('.up').disabled=busy||index===0;row.querySelector('.down').disabled=busy||index===list.length-1;});}
const large=document.getElementById('large-preview');let previewTrigger;
function showLarge(button){previewTrigger=button;large.querySelector('h2').textContent=button.getAttribute('aria-label');large.querySelector('img').src=button.querySelector('img').src;large.showModal();large.querySelector('.close-preview').focus();}
large.querySelector('.close-preview').onclick=()=>large.close();large.addEventListener('close',()=>previewTrigger?.focus());
rows.addEventListener('input',changed);rows.addEventListener('change',changed);rows.addEventListener('click',event=>{const button=event.target.closest('button');if(!button||busy)return;if(button.classList.contains('preview-open')){showLarge(button);return;}const row=button.closest('.row');if(button.classList.contains('up')&&row.previousElementSibling)rows.insertBefore(row,row.previousElementSibling);if(button.classList.contains('down')&&row.nextElementSibling)rows.insertBefore(row.nextElementSibling,row);changed();button.focus();});
document.getElementById('cancel').onclick=()=>{if(!busy)vscode.postMessage({type:'cancel'});};
document.getElementById('submit').onclick=()=>{if(busy)return;clearTimeout(timer);busy=true;document.getElementById('submit').disabled=true;send('submit');};
window.addEventListener('message',({data})=>{if(data.revision!==revision)return;for(const row of all()){const issue=data.issues?.[row.dataset.id],name=row.querySelector('.filename').value.trim();row.querySelector('.error').textContent=issue?.error||'';row.dataset.collision=String(Boolean(issue?.collision));row.querySelector('.replacement-status').textContent=issue?.collision?'Will replace the existing image “'+name+'” after confirmation. Enter an unused filename to keep both images.':'';const existing=row.querySelector('.existing');if(issue?.existingPreview)existing.src=issue.existingPreview;else existing.removeAttribute('src');row.querySelector('.existing-name').textContent=name;row.querySelector('.existing-button').setAttribute('aria-label','View existing image '+name+' larger');row.querySelector('.filename').setAttribute('aria-invalid',String(Boolean(issue?.error)));if(data.done?.includes(Number(row.dataset.id))){row.dataset.done='true';row.querySelector('.action').disabled=true;row.querySelector('.filename').disabled=true;}}document.getElementById('summary').textContent=data.summary||'';document.getElementById('submit').disabled=Boolean(data.blocked);if(data.type==='result'){busy=false;document.getElementById('submit').disabled=Boolean(data.blocked);}render();});
render();send('preview');
</script></body></html>`;
}

function openImageImportForm(vscode, context, model, { preview, apply }) {
	const roots = [...new Set([...model.rows.map((row) => require('node:path').dirname(row.sourcePath)), model.destinationPath])].map((folder) => vscode.Uri.file(folder));
	const panel = vscode.window.createWebviewPanel('nornaImageImport', `Import images: ${model.pageTitle}`, vscode.ViewColumn.Active,
		{ enableScripts: true, retainContextWhenHidden: true, localResourceRoots: roots });
	const nonce = randomBytes(24).toString('hex');
	panel.webview.html = imageImportHtml({ ...model, rows: model.rows.map((row) => ({ ...row, preview: panel.webview.asWebviewUri(vscode.Uri.file(row.sourcePath)).toString() })) }, nonce, panel.webview.cspSource);
	let disposed = false, busy = false;
	return new Promise((resolve) => {
		const messages = panel.webview.onDidReceiveMessage(async (message) => {
			if (disposed || busy) return;
			if (message?.type === 'cancel') { panel.dispose(); return; }
			if (!['preview', 'submit'].includes(message?.type) || !Number.isInteger(message.revision) || !Array.isArray(message.rows)) return;
			const submit = message.type === 'submit';
			if (submit) busy = true;
			try {
				const prepared = await preview(message.rows);
				const display = (result) => ({ ...result, issues: Object.fromEntries(Object.entries(result.issues ?? {}).map(([id, issue]) => [id, {
					...issue, ...(issue.existingPath ? { existingPreview: panel.webview.asWebviewUri(vscode.Uri.file(issue.existingPath)).toString() } : {}),
				}])) });
				if (disposed) return;
				if (submit && !prepared.blocked) {
					const result = await apply(prepared);
					if (result.complete) { panel.dispose(); return; }
					await panel.webview.postMessage({ type: 'result', revision: message.revision, ...display(result) });
				} else await panel.webview.postMessage({ type: submit ? 'result' : 'preview', revision: message.revision, ...display(prepared) });
			} catch (error) {
				if (!disposed) await panel.webview.postMessage({ type: submit ? 'result' : 'preview', revision: message.revision, summary: error.message, blocked: false });
			} finally { if (submit) busy = false; }
		});
		panel.onDidDispose(() => { disposed = true; messages.dispose(); resolve(); });
		context.subscriptions.push(panel);
	});
}

module.exports = { openImageImportForm, imageImportHtml };
