// Probe the AI Pipe OpenAI-compatible chat endpoint and publish an account-specific
// health catalogue. This script never writes the token into files or logs.
const API = 'https://aipipe.org/openai/v1';
const token = process.env.AI_PIPE_TOKEN;
if (!token) {
  console.error('Missing AI_PIPE_TOKEN secret. Add it in Settings > Secrets and variables > Actions.');
  process.exit(1);
}

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
async function fetchJson(url, options = {}) {
  const response = await fetch(url, { ...options, signal: AbortSignal.timeout(25000) });
  const text = await response.text();
  let body;
  try { body = JSON.parse(text); } catch { body = { message: text.slice(0, 300) }; }
  return { response, body };
}
const { response: listResponse, body: catalogue } = await fetchJson(API + '/models', {
  headers: { Authorization: 'Bearer ' + token }
});
if (!listResponse.ok) {
  console.error('Could not fetch OpenAI model catalogue: HTTP ' + listResponse.status);
  process.exit(1);
}

const nonChat = /(?:image|audio|tts|transcri(?:be|ption)|embedding|moderation|sora|whisper|realtime|search|computer-use|instruct|codex|deep-research|cyber)/i;
const candidates = (catalogue.data || [])
  .filter(model => typeof model?.id === 'string')
  .filter(model => /^(gpt-|o1(?:-|$)|o3(?:-|$)|o4(?:-|$))/i.test(model.id))
  .filter(model => !nonChat.test(model.id) && !model.shutdown_date)
  .sort((a, b) => a.id.localeCompare(b.id));

if (!candidates.length) {
  console.error('No eligible chat-model candidates found in the catalogue.');
  process.exit(1);
}

const results = [];
for (const model of candidates) {
  let result = { id: model.id, name: model.name || model.id, status: 'unavailable', reason: 'Probe did not complete' };
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const { response, body } = await fetchJson(API + '/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: model.id,
          messages: [{ role: 'user', content: 'Reply with exactly OK.' }],
          max_completion_tokens: 256,
          stream: false
        })
      });
      if (response.ok) {
        const content = body?.choices?.[0]?.message?.content;
        const answer = typeof content === 'string'
          ? content
          : Array.isArray(content) ? content.map(part => part?.text || '').join('') : '';
        if (answer.trim()) {
          result = { id: model.id, name: model.name || model.id, status: 'working', reason: null };
        } else {
          result = { id: model.id, name: model.name || model.id, status: 'empty_response', reason: 'Request succeeded but returned no text' };
        }
        break;
      }
      const detail = String(body?.error?.message || body?.message || ('HTTP ' + response.status))
        .replace(/Bearer\s+\S+/gi, 'Bearer [redacted]')
        .replace(/[\r\n\t]+/g, ' ')
        .slice(0, 180);
      const status = response.status === 401 || response.status === 403 ? 'access_denied'
        : response.status === 404 ? 'not_found_or_unsupported'
        : response.status === 429 ? 'rate_limited'
        : /deprecat|shut.?down|retired|no longer available/i.test(detail) ? 'deprecated'
        : response.status >= 500 ? 'provider_error' : 'request_error';
      result = { id: model.id, name: model.name || model.id, status, reason: detail };
      if ((response.status === 429 || response.status >= 500) && attempt < 2) {
        await sleep(1500 * attempt);
        continue;
      }
      break;
    } catch (error) {
      result = {
        id: model.id,
        name: model.name || model.id,
        status: 'network_error',
        reason: String(error?.message || error).slice(0, 160)
      };
      if (attempt < 2) { await sleep(1000 * attempt); continue; }
    }
  }
  results.push(result);
  console.log(result.status + '  ' + result.id + (result.reason ? ' — ' + result.reason : ''));
  await sleep(250);
}

const report = {
  generatedAt: new Date().toISOString(),
  endpoint: API,
  tested: results.length,
  working: results.filter(item => item.status === 'working').length,
  models: results
};
await import('node:fs/promises').then(fs => fs.writeFile('public/model-health.json', JSON.stringify(report, null, 2) + '\n'));
console.log('Wrote public/model-health.json: ' + report.working + '/' + report.tested + ' models passed the chat probe.');
