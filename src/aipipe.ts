import type { Model, Role } from './types';
export const API = 'https://aipipe.org/openai/v1';
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
  // The OpenAI catalogue also contains image, audio, embedding and other
  // non-chat models. Keep this first phase focused on text/chat-capable models.
  const nonChat = /(?:image|audio|tts|transcri(?:be|ption)|embedding|moderation|sora|whisper|realtime|search|computer-use)/i;
  return (j.data || [])
    .filter(m => typeof m?.id === 'string' && /^(gpt-|o1(?:-|$)|o3(?:-|$)|o4(?:-|$))/i.test(m.id) && !nonChat.test(m.id))
    .sort((a, b) => (a.name || a.id).localeCompare(b.name || b.id));
}

export async function chatCompletion(token: string, model: string, messages: {role: Role; content: string}[], onText: (s:string)=>void, signal?: AbortSignal) {
  // Orbit is intentionally OpenAI-only: model IDs are sent unchanged to the
  // AI Pipe OpenAI-compatible endpoint. No OpenRouter fallback is attempted.
  const r = await fetch(API + '/chat/completions', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, messages, stream: false, max_completion_tokens: 2048 }),
    signal
  });
  if (!r.ok) throw new Error('AI Pipe OpenAI route: ' + await errorMessage(r));
  const data = await r.json() as {
    error?: { message?: string };
    choices?: { message?: { content?: string | {type?:string;text?:string}[] } }[];
  };
  if (data.error?.message) throw new Error(data.error.message);
  const value = data.choices?.[0]?.message?.content;
  const full = typeof value === 'string' ? value : Array.isArray(value) ? value.map(p => p.text || '').join('') : '';
  if (!full.trim()) throw new Error('The model returned an empty response. If this is a reasoning model, try a larger output budget or another model.');
  onText(full);
  return full;
}
