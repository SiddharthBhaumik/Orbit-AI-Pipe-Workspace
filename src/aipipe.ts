import type { Model, Role } from './types';
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
  // Keep the exact current GitHub Pages URL as the return target.
  // Match AI Pipe's documented redirect pattern exactly. The current URL is
  // encoded as the redirect query value by the browser when it navigates.
  window.location.href = 'https://aipipe.org/login?redirect=' + window.location.href;
}

export async function getAIPipeProfile(): Promise<{ token: string | null; email?: string | null }> {
  // AI Pipe's official helper consumes the callback and retains the profile for later visits.
  const sdkUrl = 'https://aipipe.org/aipipe.js';
  const sdk = await import(/* @vite-ignore */ sdkUrl) as { getProfile: () => { token: string | null; email?: string | null } };
  return sdk.getProfile();
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
  // The user's proven working script uses AI Pipe's OpenAI-compatible route.
  // Route OpenAI model IDs there, and keep OpenRouter for other providers.
  const isOpenAI = model.startsWith('openai/');
  const endpoint = isOpenAI ? 'https://aipipe.org/openai/v1/chat/completions' : API + '/chat/completions';
  const apiModel = isOpenAI ? model.slice('openai/'.length) : model;
  const r = await fetch(endpoint, { method:'POST', headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'}, body:JSON.stringify(isOpenAI ? {model:apiModel,messages,stream:false,max_tokens:1024} : {model:apiModel,messages,stream:true}), signal });
  if (!r.ok) throw new Error('AI Pipe ' + (isOpenAI ? 'OpenAI' : 'OpenRouter') + ' route: ' + await errorMessage(r));
  if (isOpenAI) {
    const data = await r.json() as { error?: { message?: string }; choices?: { message?: { content?: string | {type?:string;text?:string}[] } }[] };
    if(data.error?.message) throw new Error(data.error.message);
    const value=data.choices?.[0]?.message?.content;
    const full=typeof value==='string'?value:Array.isArray(value)?value.map(p=>p.text||'').join(''):'';
    if(!full.trim()) throw new Error('The model returned an empty response.');
    onText(full);
    return full;
  }
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
