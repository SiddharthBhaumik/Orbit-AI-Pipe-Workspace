import type { Model } from './types';
export const API = 'https://aipipe.org/openrouter/v1';
export function cleanAuthRedirect() {
  const url = new URL(window.location.href);
  const token = url.searchParams.get('aipipe_token');
  const email = url.searchParams.get('aipipe_email') || undefined;
  if (!token) return null;
  url.searchParams.delete('aipipe_token'); url.searchParams.delete('aipipe_email');
  window.history.replaceState({}, document.title, url.pathname + url.search + url.hash);
  return { token, email };
}
export function startAIPipeSignIn() {
  window.location.assign('https://aipipe.org/login?redirect=' + encodeURIComponent(window.location.href));
}
async function errorMessage(r: Response) {
  let detail = ''; try { const j = await r.json(); detail = typeof j.error === 'string' ? j.error : j.error?.message || j.message || ''; } catch {}
  if (r.status === 401 || r.status === 403) return (detail || 'Authentication rejected.') + ' Check your AI Pipe token.';
  return detail || 'Request failed (HTTP ' + r.status + ')';
}
export async function fetchModels(token: string): Promise<Model[]> {
  const r = await fetch(API + '/models', { headers: { Authorization: 'Bearer ' + token } });
  if (!r.ok) throw new Error(await errorMessage(r));
  const j = await r.json() as { data?: Model[] };
  return (j.data || []).filter(m => m && typeof m.id === 'string').sort((a,b) => (a.name || a.id).localeCompare(b.name || b.id));
}
export async function chatCompletion(token: string, model: string, messages: {role: Role; content: string}[], onText: (s:string)=>void, signal?: AbortSignal) {
  const r = await fetch(API + '/chat/completions', { method:'POST', headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'}, body:JSON.stringify({model,messages,stream:true}), signal });
  if (!r.ok) throw new Error(await errorMessage(r));
  if (!r.body) throw new Error('This browser cannot read the response stream.');
  const reader=r.body.getReader(), decoder=new TextDecoder(); let buffer='', full='';
  while(true) {
    const {value,done}=await reader.read(); if(done) break;
    buffer += decoder.decode(value,{stream:true});
    const lines=buffer.split('\n'); buffer=lines.pop() || '';
    for(const raw of lines) {
      const line=raw.trim(); if(!line.startsWith('data:')) continue;
      const payload=line.slice(5).trim(); if(payload==='[DONE]') continue;
      try {
        const data=JSON.parse(payload);
        if(data.error?.message) throw new Error(data.error.message);
        const delta=data.choices?.[0]?.delta?.content;
        const chunk=typeof delta==='string'?delta:Array.isArray(delta)?delta.map((p:any)=>p.text||'').join(''):'';
        if(chunk) { full+=chunk; onText(full); }
      } catch(e) { if(e instanceof Error && !e.message.toLowerCase().includes('json')) throw e; }
    }
  }
  if(!full.trim()) throw new Error('The model returned an empty response.');
  return full;
}
