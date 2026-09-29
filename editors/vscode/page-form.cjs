const { randomBytes } = require('node:crypto');

const escape = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);

function pageFormHtml(model, nonce) {
	const field = (name, label, placeholder, value = '') => `<label for="${name}">${label}</label><input id="${name}" name="${name}" placeholder="${placeholder}" value="${escape(value)}" aria-describedby="${name}-error"><p class="error" id="${name}-error"></p>`;
	return `<!doctype html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'nonce-${nonce}'; script-src 'nonce-${nonce}'"><style nonce="${nonce}">
body{font-family:var(--vscode-font-family);color:var(--vscode-foreground);background:var(--vscode-editor-background);padding:24px;max-width:660px;margin:auto}h1{font-size:1.5em}label{display:block;margin:16px 0 6px}input,select,button{font:inherit;box-sizing:border-box}input:not([type=checkbox]),select{width:100%;padding:7px;background:var(--vscode-input-background);color:var(--vscode-input-foreground);border:1px solid var(--vscode-input-border,var(--vscode-widget-border))}input::placeholder{color:var(--vscode-input-placeholderForeground)}input:focus,select:focus,button:focus{outline:1px solid var(--vscode-focusBorder);outline-offset:2px}button{padding:7px 12px;border:0;background:var(--vscode-button-background);color:var(--vscode-button-foreground);cursor:pointer}button.secondary{background:var(--vscode-button-secondaryBackground);color:var(--vscode-button-secondaryForeground)}button:disabled{opacity:.6;cursor:default}.alias{display:flex;gap:8px;margin:8px 0}.alias input{flex:1;min-width:0}.hint{color:var(--vscode-descriptionForeground);line-height:1.5}.error{color:var(--vscode-errorForeground);margin:4px 0}.error:empty{display:none}fieldset{border:0;padding:0;margin:22px 0}legend{font-weight:600}footer{display:flex;gap:10px;margin-top:24px}pre{white-space:pre-wrap;overflow-wrap:anywhere;font-family:var(--vscode-editor-font-family)}
</style></head><body><h1>${model.edit ? 'Page information' : `New ${model.kind}`}</h1><form novalidate>
${field('title', 'Page title', 'For example: Install Norna', model.title)}
${field('description', 'Description (optional)', 'A short introduction to this page', model.description)}
${model.edit ? `<p class="hint">Current address: ${escape(model.url)}. Changing the title does not change this address.</p>` : `<label for="parentPath">Create in</label><select id="parentPath">${model.parents.map((parent) => `<option value="${escape(parent.parentPath)}" ${parent.parentPath === model.parentPath ? 'selected' : ''}>${escape(parent.label)}</option>`).join('')}</select>${field('slug', 'URL segment', 'install-norna', '')}<p class="hint">Lowercase letters, numbers and hyphens. Suggested from the title until you edit it.</p>`}
<label><input id="listed" type="checkbox" ${model.listed !== false ? 'checked' : ''} ${model.isHome ? 'disabled' : ''}> Show in navigation</label><p class="hint">Unlisted pages are still published.${model.isHome ? ' The homepage is always listed.' : ''}</p>
<label><input id="listChildren" type="checkbox" ${model.listChildren ? 'checked' : ''}> List direct child pages after this page</label><p class="hint">Norna keeps this list in navigation order. Unlisted pages are omitted.</p>
<fieldset><legend>Additional addresses (aliases)</legend><p class="hint">These addresses redirect to this page. Start and end with /, and omit the site's deployment prefix.</p><div id="aliases"></div><button type="button" id="add-alias" class="secondary" aria-label="Add additional address" title="Add additional address">+</button><p class="error" id="aliases-error"></p></fieldset>
<div id="preview" aria-live="polite"><pre></pre></div><p id="form-error" class="error" role="alert"></p><footer><button id="submit" type="submit">${model.edit ? 'Save changes' : `Create ${model.kind}`}</button><button id="cancel" type="button" class="secondary">Cancel</button></footer></form>
<script nonce="${nonce}">
const vscode=acquireVsCodeApi(); const initial=${JSON.stringify(model).replace(/</g, '\\u003c')};
const byId=(id)=>document.getElementById(id);let revision=0,busy=false,slugEdited=false,timer;
const values=()=>({title:byId('title').value,description:byId('description').value,listed:byId('listed')?.checked??true,listChildren:byId('listChildren').checked,aliases:[...document.querySelectorAll('.alias input')].map(input=>input.value),...(!initial.edit?{parentPath:byId('parentPath').value,slug:byId('slug').value}: {})});
function send(type){vscode.postMessage({type,revision,values:values(),suggestSlug:!slugEdited});}
function lock(value){for(const element of document.querySelectorAll('input,select,button'))element.disabled=value; if(initial.isHome&&byId('listed'))byId('listed').disabled=true;}
function changed(){revision++;clearTimeout(timer);timer=setTimeout(()=>send('preview'),180);}
function addAlias(value='',focus=true){const row=document.createElement('div');row.className='alias';const input=document.createElement('input');input.value=value;input.placeholder='/old-guide/';input.setAttribute('aria-label','Additional address');input.setAttribute('aria-describedby','aliases-error');const remove=document.createElement('button');remove.type='button';remove.className='secondary';remove.textContent='−';remove.title='Remove additional address';remove.setAttribute('aria-label','Remove additional address');remove.onclick=()=>{row.remove();changed();byId('add-alias').focus();};row.append(input,remove);byId('aliases').append(row);if(focus)input.focus();}
(initial.aliases||[]).forEach(value=>addAlias(value,false));
byId('add-alias')?.addEventListener('click',()=>{addAlias();changed();});
document.querySelector('form').addEventListener('input',(event)=>{if(event.target.id==='slug')slugEdited=true;changed();});
byId('parentPath')?.addEventListener('change',changed);
document.querySelector('form').onsubmit=(event)=>{event.preventDefault();if(busy)return;clearTimeout(timer);busy=true;lock(true);send('submit');};
byId('cancel').onclick=()=>{if(!busy)vscode.postMessage({type:'cancel'});};
window.addEventListener('message',({data})=>{if(data.revision!==revision)return;if(data.slug!==undefined&&!slugEdited)byId('slug').value=data.slug;for(const id of ['title','description','slug','aliases','form']){const error=byId(id+'-error');if(error)error.textContent=data.errors?.[id]||'';byId(id)?.setAttribute('aria-invalid',String(Boolean(data.errors?.[id])));}byId('preview').querySelector('pre').textContent=data.preview||'';if(data.type==='result'){busy=false;lock(false);}});
byId('title').focus();if(initial.edit)send('preview');
</script></body></html>`;
}

function openPageForm(vscode, context, model, { prepare, apply }) {
	const panel = vscode.window.createWebviewPanel('nornaPageForm', model.edit ? `Page information: ${model.title}` : `New ${model.kind}`, vscode.ViewColumn.Active,
		{ enableScripts: true, retainContextWhenHidden: true, localResourceRoots: [] });
	panel.webview.html = pageFormHtml(model, randomBytes(24).toString('hex'));
	let busy = false, disposed = false;
	return new Promise((resolve) => {
		const messages = panel.webview.onDidReceiveMessage(async (message) => {
			if (disposed || busy) return;
			if (message?.type === 'cancel') { panel.dispose(); return; }
			if (!['preview', 'submit'].includes(message?.type) || !Number.isInteger(message.revision)) return;
			const submit = message.type === 'submit';
			if (submit) busy = true;
			try {
				const prepared = await prepare(message.values, Boolean(message.suggestSlug));
				if (disposed) return;
				if (submit) {
					const applied = await apply(prepared, () => !disposed);
					if (applied !== false) { panel.dispose(); return; }
				}
				await panel.webview.postMessage({ type: submit ? 'result' : 'preview', revision: message.revision, preview: prepared.preview, slug: prepared.slug });
			} catch (error) {
				if (!disposed) await panel.webview.postMessage({ type: submit ? 'result' : 'preview', revision: message.revision, errors: { [error.field || 'form']: error.message } });
			} finally { if (submit) busy = false; }
		});
		panel.onDidDispose(() => { disposed = true; messages.dispose(); resolve(); });
		context.subscriptions.push(panel);
	});
}
module.exports = { openPageForm, pageFormHtml };
