const path = require('node:path');
const { randomBytes } = require('node:crypto');

const escape = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);

function imageInsertHtml(model, nonce, cspSource) {
	return `<!doctype html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${cspSource}; style-src 'nonce-${nonce}'; script-src 'nonce-${nonce}'"><style nonce="${nonce}">
body{font-family:var(--vscode-font-family);color:var(--vscode-foreground);background:var(--vscode-editor-background);padding:24px;max-width:760px;margin:auto}h1{font-size:1.5em}.hint{color:var(--vscode-descriptionForeground);line-height:1.5}.image{margin:20px 0}.image-preview{display:block;width:100%;padding:0;border:1px solid var(--vscode-widget-border);background:var(--vscode-sideBar-background);color:var(--vscode-foreground)}.image-preview img{display:block;width:100%;height:min(55vh,480px);min-height:260px;object-fit:contain}.image-preview span{display:block;padding:8px;text-align:center}label{display:block;margin:16px 0 6px}input,button{font:inherit;box-sizing:border-box}input:not([type=checkbox]){width:100%;padding:7px;background:var(--vscode-input-background);color:var(--vscode-input-foreground);border:1px solid var(--vscode-input-border,var(--vscode-widget-border))}input[readonly]{color:var(--vscode-descriptionForeground);cursor:text}input::placeholder{color:var(--vscode-input-placeholderForeground)}input:focus,button:focus{outline:1px solid var(--vscode-focusBorder);outline-offset:2px}button{padding:7px 12px;border:0;background:var(--vscode-button-background);color:var(--vscode-button-foreground);cursor:pointer}button.secondary{background:var(--vscode-button-secondaryBackground);color:var(--vscode-button-secondaryForeground)}button:disabled{opacity:.6;cursor:default}.error{color:var(--vscode-errorForeground)}.error:empty{display:none}footer{display:flex;gap:10px;margin-top:24px}dialog{width:min(94vw,1100px);max-height:94vh;padding:18px;background:var(--vscode-editor-background);color:var(--vscode-foreground);border:1px solid var(--vscode-widget-border)}dialog::backdrop{background:rgba(0,0,0,.8)}.preview-header{display:flex;align-items:center;justify-content:space-between;gap:16px}.preview-header h2{font-size:1em;overflow-wrap:anywhere}dialog img{display:block;width:100%;height:min(78vh,780px);margin:auto;object-fit:contain}
</style></head><body><h1>Insert image</h1><p class="hint">One image block will be added at the end of <strong>${escape(model.pageTitle)}</strong>.</p><div class="image"><button type="button" id="open-preview" class="image-preview" aria-label="View ${escape(model.filename)} larger"><img src="${escape(model.preview)}" alt=""><span>View larger</span></button><label for="fileName">File name</label><input id="fileName" value="${escape(model.filename)}" readonly></div>
<form><label><input id="decorative" type="checkbox"> Decorative image (empty alternative text)</label><div id="altGroup"><label for="alt">Alternative text</label><input id="alt" placeholder="Describe what the image conveys"></div><label for="caption">Caption</label><input id="caption" placeholder="Optional caption"><p id="error" class="error" role="alert"></p><footer><button id="submit" type="submit">Insert image</button><button id="cancel" type="button" class="secondary">Cancel</button></footer></form><dialog id="large-preview"><div class="preview-header"><h2>Preview of ${escape(model.filename)}</h2><button type="button" class="secondary" id="close-preview">Close</button></div><img src="${escape(model.preview)}" alt="Large preview of ${escape(model.filename)}"></dialog>
<script nonce="${nonce}">
const vscode=acquireVsCodeApi();let busy=false;const alt=document.getElementById('alt'),decorative=document.getElementById('decorative'),caption=document.getElementById('caption');
const large=document.getElementById('large-preview'),openPreview=document.getElementById('open-preview');
openPreview.onclick=()=>{large.showModal();document.getElementById('close-preview').focus();};
document.getElementById('close-preview').onclick=()=>large.close();large.addEventListener('close',()=>openPreview.focus());
function render(){document.getElementById('altGroup').hidden=decorative.checked;alt.disabled=decorative.checked||busy;caption.disabled=busy;decorative.disabled=busy;document.getElementById('submit').disabled=busy;}
alt.addEventListener('input',render);decorative.addEventListener('change',render);
document.querySelector('form').onsubmit=(event)=>{event.preventDefault();if(busy)return;busy=true;render();vscode.postMessage({type:'submit',values:{alt:decorative.checked?'':alt.value,decorative:decorative.checked,caption:caption.value}});};
document.getElementById('cancel').onclick=()=>{if(!busy)vscode.postMessage({type:'cancel'});};
window.addEventListener('message',({data})=>{busy=false;document.getElementById('error').textContent=data.error||'';render();});
render();decorative.focus();
</script></body></html>`;
}

function openImageInsertForm(vscode, context, { pageTitle, filename, imagePath }, apply) {
	const panel = vscode.window.createWebviewPanel('nornaImageInsert', `Insert image: ${pageTitle}`, vscode.ViewColumn.Active,
		{ enableScripts: true, retainContextWhenHidden: true, localResourceRoots: [vscode.Uri.file(path.dirname(imagePath))] });
	const nonce = randomBytes(24).toString('hex');
	panel.webview.html = imageInsertHtml({ pageTitle, filename, preview: panel.webview.asWebviewUri(vscode.Uri.file(imagePath)).toString() }, nonce, panel.webview.cspSource);
	let busy = false, disposed = false;
	return new Promise((resolve) => {
		const messages = panel.webview.onDidReceiveMessage(async (message) => {
			if (disposed || busy) return;
			if (message?.type === 'cancel') { panel.dispose(); return; }
			if (message?.type !== 'submit') return;
			busy = true;
			try {
				await apply(message.values);
				if (!disposed) panel.dispose();
			} catch (error) {
				if (!disposed) await panel.webview.postMessage({ error: error.message });
			} finally { busy = false; }
		});
		panel.onDidDispose(() => { disposed = true; messages.dispose(); resolve(); });
		context.subscriptions.push(panel);
	});
}

module.exports = { openImageInsertForm, imageInsertHtml };
