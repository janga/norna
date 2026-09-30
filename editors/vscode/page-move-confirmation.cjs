const { randomBytes } = require('node:crypto');
const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);

function pageMoveConfirmationHtml({ title, plan }, nonce) {
	const mappings = plan.movePreview?.mappings ?? [];
	return `<!doctype html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'nonce-${nonce}'; script-src 'nonce-${nonce}'"><style nonce="${nonce}">
body{font-family:var(--vscode-font-family);color:var(--vscode-foreground);background:var(--vscode-editor-background);padding:24px;max-width:660px;margin:auto}h1{font-size:1.5em}pre{white-space:pre-wrap;overflow-wrap:anywhere}label{display:block;margin:20px 0 8px}.hint{color:var(--vscode-descriptionForeground);line-height:1.5}button{font:inherit;padding:7px 12px;border:0;background:var(--vscode-button-background);color:var(--vscode-button-foreground);cursor:pointer}button.secondary{background:var(--vscode-button-secondaryBackground);color:var(--vscode-button-secondaryForeground)}button:focus,input:focus{outline:1px solid var(--vscode-focusBorder);outline-offset:2px}button:disabled{opacity:.6}footer{display:flex;gap:10px;margin-top:24px}.error{color:var(--vscode-errorForeground)}
</style></head><body><h1>Complete page move</h1><p>${escape(title)}</p><pre>${escape(plan.sourceUrl)} → ${escape(plan.destinationUrl)}</pre>
<p>${Math.max(0, mappings.length - 1)} descendant page(s) and ${plan.movePreview?.linkChanges.length ?? 0} authored link(s) will change.</p>
${mappings.length > 1 ? `<details><summary>Affected descendant addresses</summary><pre>${mappings.slice(1).map(({ oldPathname, newPathname }) => escape(`${oldPathname} → ${newPathname}`)).join('\n')}</pre></details>` : ''}
<form><label><input id="preserve-aliases" type="checkbox" checked> Preserve old addresses as aliases</label>
<p id="alias-effect" class="hint" aria-live="polite"></p><p class="hint">Existing aliases remain available. This applies to the page and all affected descendants.</p>
<p>This changes site files. Editor Undo does not reverse the whole move.</p><p id="error" class="error" role="alert"></p>
<footer><button id="complete" type="submit">Complete page move</button><button id="cancel" type="button" class="secondary">Cancel</button></footer></form>
<script nonce="${nonce}">
const vscode=acquireVsCodeApi(), keep=document.getElementById('preserve-aliases');let busy=false;
const effect=()=>{document.getElementById('alias-effect').textContent=keep.checked?'Old page addresses will redirect to the new addresses.':'No new aliases will be created. Old page addresses will stop working after publication.';};
const lock=value=>{busy=value;for(const element of document.querySelectorAll('input,button'))element.disabled=value;};
keep.addEventListener('change',effect);effect();
document.querySelector('form').onsubmit=event=>{event.preventDefault();if(busy)return;lock(true);vscode.postMessage({type:'complete',preserveAliases:keep.checked});};
document.getElementById('cancel').onclick=()=>{if(!busy)vscode.postMessage({type:'cancel'});};
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!busy)vscode.postMessage({type:'cancel'});});
window.addEventListener('message',({data})=>{if(data.type==='error'){document.getElementById('error').textContent=data.message;lock(false);}});
keep.focus();
</script></body></html>`;
}

function confirmPageMove(vscode, context, model, planForChoice) {
	const panel = vscode.window.createWebviewPanel('nornaPageMoveConfirmation', 'Complete page move', vscode.ViewColumn.Active,
		{ enableScripts: true, localResourceRoots: [] });
	panel.webview.html = pageMoveConfirmationHtml(model, randomBytes(24).toString('hex'));
	let busy = false, disposed = false;
	return new Promise(resolve => {
		const messages = panel.webview.onDidReceiveMessage(async message => {
			if (disposed || busy) return;
			if (message?.type === 'cancel') { panel.dispose(); return; }
			if (message?.type !== 'complete' || typeof message.preserveAliases !== 'boolean') return;
			busy = true;
			try {
				const plan = await planForChoice(message.preserveAliases);
				if (disposed) return;
				resolve(plan);
				panel.dispose();
			} catch (error) {
				if (!disposed) await panel.webview.postMessage({ type: 'error', message: error.message });
			} finally { busy = false; }
		});
		panel.onDidDispose(() => { disposed = true; messages.dispose(); resolve(undefined); });
		context.subscriptions.push(panel);
	});
}
module.exports = { confirmPageMove, pageMoveConfirmationHtml };
