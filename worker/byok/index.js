const DEFAULT_MCP_URL = 'https://afo-agent-gateway.jaredtechfit.workers.dev/mcp';
const DEFAULT_ANTHROPIC_VERSION = '2023-06-01';

const MODEL_OPTIONS = {
  anthropic: ['claude-sonnet-4-6', 'claude-opus-4-1', 'claude-sonnet-4-5'],
  openai: ['gpt-4.1-mini', 'gpt-4.1', 'gpt-5-mini'],
  chatgpt: ['gpt-4.1-mini', 'gpt-4.1', 'gpt-5-mini'],
  gemini: ['gemini-2.5-pro', 'gemini-2.5-flash', 'gemini-2.0-flash'],
  xai: ['grok-4', 'grok-3', 'grok-3-mini'],
  deepseek: ['deepseek-chat', 'deepseek-reasoner'],
  kimi: ['moonshot-v1-8k', 'moonshot-v1-32k', 'moonshot-v1-128k'],
  mistral: ['mistral-large-latest', 'mistral-small-latest', 'codestral-latest'],
  groq: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'openai/gpt-oss-120b'],
  cerebras: ['llama3.1-8b', 'llama-3.3-70b', 'qwen-3-coder-480b'],
  'openai-compatible': ['custom-model']
};

const PROVIDER_LABELS = {
  anthropic: 'Anthropic / Claude',
  openai: 'ChatGPT / OpenAI',
  chatgpt: 'ChatGPT / OpenAI',
  gemini: 'Google Gemini',
  xai: 'xAI / Grok',
  deepseek: 'DeepSeek',
  kimi: 'Kimi / Moonshot',
  mistral: 'Mistral',
  groq: 'Groq',
  cerebras: 'Cerebras',
  'openai-compatible': 'Custom OpenAI-Compatible'
};

const OPENAI_COMPATIBLE = {
  openai: { label: 'ChatGPT / OpenAI', endpoint: 'https://api.openai.com/v1/chat/completions', defaultModel: 'gpt-4.1-mini' },
  chatgpt: { label: 'ChatGPT / OpenAI', endpoint: 'https://api.openai.com/v1/chat/completions', defaultModel: 'gpt-4.1-mini' },
  xai: { label: 'xAI', endpoint: 'https://api.x.ai/v1/chat/completions', defaultModel: 'grok-4' },
  deepseek: { label: 'DeepSeek', endpoint: 'https://api.deepseek.com/chat/completions', defaultModel: 'deepseek-chat' },
  kimi: { label: 'Kimi / Moonshot', endpoint: 'https://api.moonshot.ai/v1/chat/completions', defaultModel: 'moonshot-v1-8k' },
  mistral: { label: 'Mistral', endpoint: 'https://api.mistral.ai/v1/chat/completions', defaultModel: 'mistral-small-latest' },
  groq: { label: 'Groq', endpoint: 'https://api.groq.com/openai/v1/chat/completions', defaultModel: 'llama-3.3-70b-versatile' },
  cerebras: { label: 'Cerebras', endpoint: 'https://api.cerebras.ai/v1/chat/completions', defaultModel: 'llama3.1-8b' }
};

function cors() {
  return {
    'access-control-allow-origin': '*',
    'access-control-allow-methods': 'GET,POST,OPTIONS',
    'access-control-allow-headers': 'content-type,authorization,x-afo-role-token'
  };
}

function json(data, init = {}) {
  return new Response(JSON.stringify(data, null, 2), {
    ...init,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      ...cors(),
      ...(init.headers || {})
    }
  });
}

function html(body, init = {}) {
  return new Response(body, {
    ...init,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      ...cors(),
      ...(init.headers || {})
    }
  });
}

async function readJson(request) {
  try {
    return await request.json();
  } catch {
    return {};
  }
}

function required(value, name) {
  if (!value || typeof value !== 'string' || !value.trim()) throw new Error(`${name} is required`);
  return value.trim();
}

function getCredential(input, request) {
  return required(input.providerKey || input.credential || request.headers.get('authorization')?.replace(/^Bearer\s+/i, ''), 'providerKey');
}

function getAfoRoleToken(input, env, request) {
  return input.afoRoleToken || request.headers.get('x-afo-role-token') || env.AFO_AGENT_READ_TOKEN || '';
}

function textFromOpenAi(raw) {
  return raw?.choices?.[0]?.message?.content || '';
}

function openAiBlocks(text) {
  return text ? [{ type: 'text', text }] : [];
}

function extractToolCalls(content) {
  const toolCalls = [];
  for (const block of Array.isArray(content) ? content : []) {
    if (!block || typeof block !== 'object') continue;
    if (block.type === 'mcp_tool_use') toolCalls.push({ type: block.type, name: block.name, input: block.input });
    if (block.type === 'mcp_tool_result') toolCalls.push({ type: block.type, name: 'mcp_tool_result', output: block.content });
    if (block.type === 'tool_use') toolCalls.push({ type: block.type, name: block.name, input: block.input });
  }
  return toolCalls;
}

async function getAfoToolContext(input, env, request) {
  if (input.includeAfoContext === false) return '';
  const mcpUrl = input.mcpUrl || env.AFO_MCP_URL || DEFAULT_MCP_URL;
  const gatewayBase = mcpUrl.replace(/\/mcp\/?$/, '');
  const token = getAfoRoleToken(input, env, request);
  try {
    const response = await fetch(`${gatewayBase}/registry/search`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(token ? { authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ capability: input.toolSearch || input.prompt || 'github cloudflare approvals', riskMax: input.riskMax || 'read' })
    });
    const data = await response.json().catch(() => ({}));
    const tools = Array.isArray(data.tools) ? data.tools : Array.isArray(data.matches) ? data.matches : [];
    const summary = tools.slice(0, 20).map((tool) => `${tool.id}: ${tool.description}`).join('\n');
    if (!summary) return `AFO Gateway MCP URL: ${mcpUrl}`;
    return `AFO Gateway MCP URL: ${mcpUrl}\nAvailable AFO tools from registry search:\n${summary}`;
  } catch {
    return `AFO Gateway MCP URL: ${mcpUrl}`;
  }
}

function receipt(provider, model, status, toolIds = [], error) {
  return {
    id: crypto.randomUUID(),
    provider,
    model,
    status,
    toolIds,
    approvalIds: [],
    error,
    createdAt: new Date().toISOString()
  };
}

function appHtml(env) {
  const boot = JSON.stringify({ providers: Object.keys(MODEL_OPTIONS), modelOptions: MODEL_OPTIONS, labels: PROVIDER_LABELS, mcpUrl: env.AFO_MCP_URL || DEFAULT_MCP_URL });
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>AFO BYOK Agent Gateway</title>
  <style>
    :root { color-scheme: dark; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif; background:#080b12; color:#e8eefc; }
    * { box-sizing: border-box; }
    body { margin:0; min-height:100vh; background: radial-gradient(circle at top left,#15345d 0,#080b12 38%,#05070b 100%); }
    main { max-width: 1120px; margin: 0 auto; padding: 28px 16px 44px; }
    .hero { display:flex; justify-content:space-between; gap:20px; align-items:flex-start; margin-bottom:20px; }
    h1 { margin:0 0 8px; font-size: clamp(28px, 5vw, 54px); letter-spacing:-0.05em; }
    .subtitle { margin:0; color:#9eb2d9; line-height:1.55; max-width:760px; }
    .pill { border:1px solid #2b4772; background:#0d1627cc; padding:8px 12px; border-radius:999px; color:#9ed0ff; white-space:nowrap; font-size:13px; }
    .grid { display:grid; grid-template-columns: minmax(0, 410px) minmax(0, 1fr); gap:18px; }
    @media (max-width: 860px) { .grid { grid-template-columns: 1fr; } .hero { flex-direction:column; } }
    section { border:1px solid #203759; border-radius:20px; background:#0c1321d9; box-shadow:0 20px 80px #0009; overflow:hidden; }
    .card-head { padding:18px 18px 0; }
    .card-title { margin:0 0 5px; font-size:18px; }
    .card-copy { margin:0 0 14px; color:#93a8cd; font-size:13px; line-height:1.5; }
    form { padding:18px; display:grid; gap:13px; }
    label { display:grid; gap:6px; color:#b7c8e8; font-size:13px; font-weight:650; }
    input, select, textarea, button { width:100%; border:1px solid #2a4167; border-radius:12px; background:#08101d; color:#f4f7ff; padding:11px 12px; font:inherit; }
    textarea { min-height:150px; resize:vertical; line-height:1.45; }
    button { cursor:pointer; background:linear-gradient(135deg,#2b7fff,#7a5cff); border:0; font-weight:800; letter-spacing:.01em; }
    button:disabled { opacity:.55; cursor:not-allowed; }
    .row { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
    @media (max-width: 520px) { .row { grid-template-columns: 1fr; } }
    .fine { color:#7990b9; font-size:12px; line-height:1.45; margin-top:-4px; }
    .output { padding:18px; min-height:520px; }
    .status { color:#9eb2d9; font-size:13px; margin-bottom:12px; }
    .error { background:#3a1019; color:#ffd6de; border:1px solid #7c2638; padding:12px; border-radius:12px; white-space:pre-wrap; }
    .text { line-height:1.65; white-space:pre-wrap; }
    pre { overflow:auto; white-space:pre-wrap; word-break:break-word; background:#050b14; border:1px solid #1b304f; border-radius:12px; padding:12px; color:#b9d3ff; }
    details { margin-top:12px; }
    summary { cursor:pointer; color:#9ed0ff; font-weight:700; }
    .links { display:flex; gap:10px; flex-wrap:wrap; margin-top:14px; }
    a { color:#9ed0ff; }
  </style>
</head>
<body>
<main>
  <div class="hero">
    <div>
      <h1>AFO BYOK Agent Gateway</h1>
      <p class="subtitle">Bring your own model token, choose a provider/model, and route requests through the AFO Agent Gateway. Anthropic has remote MCP enabled; other providers currently receive AFO Gateway context until native tool adapters are added.</p>
      <div class="links"><a href="/health">Health</a><a href="/api/byok/models">Models JSON</a><a href="/api/byok/chat">Chat endpoint help</a></div>
    </div>
    <div class="pill">No provider tokens are stored</div>
  </div>
  <div class="grid">
    <section>
      <div class="card-head">
        <h2 class="card-title">Request</h2>
        <p class="card-copy">Token values are sent only with this request. Use a low-scope test token while validating providers.</p>
      </div>
      <form id="form">
        <label>Provider<select id="provider"></select></label>
        <div class="row">
          <label>Model preset<select id="preset"></select></label>
          <label>Model ID<input id="model" autocomplete="off" /></label>
        </div>
        <label id="baseWrap" style="display:none">Custom base URL<input id="baseUrl" placeholder="https://provider.example/v1" autocomplete="off" /></label>
        <label>BYOK token<input id="token" type="password" placeholder="Paste provider token for this request" autocomplete="off" /></label>
        <label>AFO role token<input id="afoToken" type="password" placeholder="Optional AFO read/operator/owner token" autocomplete="off" /></label>
        <label>Prompt<textarea id="prompt">Search AFO Agent Gateway for GitHub tools and summarize what I can do next.</textarea></label>
        <div class="fine">Tip: Anthropic can use remote MCP. DeepSeek, Kimi, xAI, ChatGPT/OpenAI, Gemini, Mistral, Groq, and Cerebras use the context bridge in this build.</div>
        <button id="send" type="submit">Send through BYOK Gateway</button>
      </form>
    </section>
    <section>
      <div class="card-head">
        <h2 class="card-title">Response</h2>
        <p class="card-copy">Tool calls, text, receipts, and raw provider JSON appear here.</p>
      </div>
      <div class="output" id="output"><div class="status">Ready.</div></div>
    </section>
  </div>
</main>
<script>
const BOOT = ${boot};
const providerEl = document.getElementById('provider');
const presetEl = document.getElementById('preset');
const modelEl = document.getElementById('model');
const baseWrap = document.getElementById('baseWrap');
const baseUrlEl = document.getElementById('baseUrl');
const output = document.getElementById('output');
const send = document.getElementById('send');

function esc(s){ return String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function renderPre(label, obj){ return '<details open><summary>'+esc(label)+'</summary><pre>'+esc(JSON.stringify(obj, null, 2))+'</pre></details>'; }
function fillProviders(){
  providerEl.innerHTML = BOOT.providers.map(p => '<option value="'+esc(p)+'">'+esc(BOOT.labels[p] || p)+'</option>').join('');
  providerEl.value = 'anthropic';
  fillModels();
}
function fillModels(){
  const provider = providerEl.value;
  const models = BOOT.modelOptions[provider] || ['custom-model'];
  presetEl.innerHTML = models.map(m => '<option value="'+esc(m)+'">'+esc(m)+'</option>').join('') + '<option value="custom">Custom model ID</option>';
  presetEl.value = models[0];
  modelEl.value = models[0];
  baseWrap.style.display = provider === 'openai-compatible' ? 'grid' : 'none';
}
providerEl.addEventListener('change', fillModels);
presetEl.addEventListener('change', () => { if (presetEl.value !== 'custom') modelEl.value = presetEl.value; });

document.getElementById('form').addEventListener('submit', async (event) => {
  event.preventDefault();
  send.disabled = true;
  output.innerHTML = '<div class="status">Running…</div>';
  const payload = {
    provider: providerEl.value,
    model: modelEl.value,
    baseUrl: baseUrlEl.value,
    providerKey: document.getElementById('token').value,
    afoRoleToken: document.getElementById('afoToken').value,
    prompt: document.getElementById('prompt').value,
    maxTokens: 1000
  };
  try {
    const res = await fetch('/api/byok/chat', { method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify(payload) });
    const data = await res.json();
    if (!res.ok || data.ok === false) throw new Error(data.error || 'Request failed');
    const text = data.text || (Array.isArray(data.content) ? data.content.filter(b => b.type === 'text').map(b => b.text).join('\n\n') : '');
    output.innerHTML = (text ? '<div class="text">'+esc(text)+'</div>' : '<div class="status">No text block returned.</div>') + renderPre('Tool calls', data.toolCalls || []) + renderPre('Receipts', data.receipts || []) + renderPre('Raw JSON', data.raw || data);
  } catch (err) {
    output.innerHTML = '<div class="error">'+esc(err.message || err)+'</div>';
  } finally {
    send.disabled = false;
  }
});
fillProviders();
</script>
</body>
</html>`;
}

function chatHelp(env) {
  return json({
    ok: true,
    endpoint: '/api/byok/chat',
    method: 'POST',
    message: 'This endpoint is working. Send a POST request with JSON to run a BYOK chat request.',
    supportedProviders: Object.keys(MODEL_OPTIONS),
    modelOptions: MODEL_OPTIONS,
    mcpUrl: env.AFO_MCP_URL || DEFAULT_MCP_URL,
    example: {
      provider: 'anthropic',
      model: MODEL_OPTIONS.anthropic[0],
      providerKey: 'paste-provider-token-in-ui-or-send-authorization-bearer',
      afoRoleToken: 'optional-afo-role-token',
      prompt: 'Search AFO Agent Gateway for GitHub tools.',
      maxTokens: 1000
    }
  });
}

async function callAnthropic(input, env, request) {
  const credential = getCredential(input, request);
  const model = required(input.model || env.DEFAULT_ANTHROPIC_MODEL || MODEL_OPTIONS.anthropic[0], 'model');
  const prompt = required(input.prompt, 'prompt');
  const mcpUrl = input.mcpUrl || env.AFO_MCP_URL || DEFAULT_MCP_URL;
  const afoRoleToken = getAfoRoleToken(input, env, request);
  const mcpServer = { type: 'url', url: mcpUrl, name: 'afo-agent-gateway' };
  if (afoRoleToken) mcpServer.headers = { authorization: `Bearer ${afoRoleToken}` };
  const headers = {
    'content-type': 'application/json',
    'x-api-key': credential,
    'anthropic-version': env.ANTHROPIC_VERSION || DEFAULT_ANTHROPIC_VERSION
  };
  if (env.ANTHROPIC_BETA) headers['anthropic-beta'] = env.ANTHROPIC_BETA;
  const upstream = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model,
      max_tokens: Math.max(1, Math.min(Number(input.maxTokens || 1000), 8000)),
      messages: [{ role: 'user', content: prompt }],
      mcp_servers: [mcpServer]
    })
  });
  const raw = await upstream.json().catch(() => ({}));
  if (!upstream.ok) {
    const error = raw.error?.message || `Anthropic API error ${upstream.status}`;
    return json({ ok: false, provider: 'anthropic', model, error, raw, receipts: [receipt('anthropic', model, 'failed', [], error)] }, { status: upstream.status });
  }
  const content = Array.isArray(raw.content) ? raw.content : [];
  const toolCalls = extractToolCalls(content);
  return json({ ok: true, provider: 'anthropic', model, content, toolCalls, raw, receipts: [receipt('anthropic', model, 'executed', toolCalls.map((call) => call.name).filter(Boolean))] });
}

async function callOpenAiCompatible(input, env, request, provider) {
  const config = provider === 'openai-compatible'
    ? { label: 'OpenAI Compatible', endpoint: required(input.baseUrl, 'baseUrl').replace(/\/$/, '') + '/chat/completions', defaultModel: 'custom-model' }
    : OPENAI_COMPATIBLE[provider];
  if (!config) throw new Error(`provider_not_supported:${provider}`);
  const credential = getCredential(input, request);
  const model = required(input.model || config.defaultModel, 'model');
  const prompt = required(input.prompt, 'prompt');
  const afoContext = await getAfoToolContext(input, env, request);
  const messages = [];
  if (afoContext) messages.push({ role: 'system', content: `You are connected to the AFO Agent Gateway context. Use this context to recommend or describe AFO tools. Direct remote MCP execution is currently enabled for Anthropic; this provider uses context bridging until native tool execution is added.\n\n${afoContext}` });
  messages.push({ role: 'user', content: prompt });
  const upstream = await fetch(config.endpoint, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${credential}`
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: Math.max(1, Math.min(Number(input.maxTokens || 1000), 8000)),
      temperature: typeof input.temperature === 'number' ? input.temperature : undefined
    })
  });
  const raw = await upstream.json().catch(() => ({}));
  if (!upstream.ok) {
    const error = raw.error?.message || raw.message || `${config.label} API error ${upstream.status}`;
    return json({ ok: false, provider, model, error, raw, receipts: [receipt(provider, model, 'failed', [], error)] }, { status: upstream.status });
  }
  const text = textFromOpenAi(raw);
  return json({ ok: true, provider, model, text, content: openAiBlocks(text), toolCalls: [], raw, receipts: [receipt(provider, model, 'executed')] });
}

async function callGemini(input, env, request) {
  const credential = getCredential(input, request);
  const model = required(input.model || MODEL_OPTIONS.gemini[0], 'model');
  const prompt = required(input.prompt, 'prompt');
  const afoContext = await getAfoToolContext(input, env, request);
  const text = `${afoContext ? `AFO Gateway context:\n${afoContext}\n\n` : ''}${prompt}`;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(credential)}`;
  const upstream = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text }] }],
      generationConfig: { maxOutputTokens: Math.max(1, Math.min(Number(input.maxTokens || 1000), 8000)) }
    })
  });
  const raw = await upstream.json().catch(() => ({}));
  if (!upstream.ok) {
    const error = raw.error?.message || `Gemini API error ${upstream.status}`;
    return json({ ok: false, provider: 'gemini', model, error, raw, receipts: [receipt('gemini', model, 'failed', [], error)] }, { status: upstream.status });
  }
  const output = raw.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join('') || '';
  return json({ ok: true, provider: 'gemini', model, text: output, content: openAiBlocks(output), toolCalls: [], raw, receipts: [receipt('gemini', model, 'executed')] });
}

async function handleChat(request, env) {
  const input = await readJson(request);
  const provider = (input.provider || 'anthropic').toLowerCase();
  try {
    if (provider === 'anthropic') return await callAnthropic(input, env, request);
    if (provider === 'gemini') return await callGemini(input, env, request);
    if (provider in OPENAI_COMPATIBLE || provider === 'openai-compatible') return await callOpenAiCompatible(input, env, request, provider);
    return json({ ok: false, error: `provider_not_supported_yet:${provider}`, supported: Object.keys(MODEL_OPTIONS) }, { status: 400 });
  } catch (error) {
    return json({ ok: false, error: error.message || String(error) }, { status: 400 });
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === 'OPTIONS') return new Response(null, { headers: cors() });
    if (request.method === 'GET' && (url.pathname === '/' || url.pathname === '/app')) return appHtml(env);
    if (request.method === 'GET' && url.pathname === '/health') {
      return json({
        ok: true,
        name: 'afo-byok-agent-gateway',
        mode: 'ephemeral-provider-credential',
        supportedProviders: Object.keys(MODEL_OPTIONS),
        modelOptions: MODEL_OPTIONS,
        mcpUrl: env.AFO_MCP_URL || DEFAULT_MCP_URL,
        storesProviderCredentials: false,
        notes: {
          anthropic: 'remote MCP enabled',
          others: 'chat completions with AFO Gateway context bridge; native tool execution can be added per provider'
        }
      });
    }
    if (request.method === 'GET' && url.pathname === '/api/byok/models') return json({ ok: true, providers: Object.keys(MODEL_OPTIONS), modelOptions: MODEL_OPTIONS });
    if (request.method === 'GET' && url.pathname === '/api/byok/chat') return chatHelp(env);
    if (request.method === 'POST' && url.pathname === '/api/byok/chat') return handleChat(request, env);
    return json({ ok: false, error: 'not_found', path: url.pathname, method: request.method, available: ['GET /', 'GET /app', 'GET /health', 'GET /api/byok/models', 'GET /api/byok/chat', 'POST /api/byok/chat'] }, { status: 404 });
  }
};
