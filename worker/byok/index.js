const BUILD_ID = 'byok-safe-read-tools-2026-06-21-01';
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

const AFO_FUNCTION_DECLARATIONS = [
  {
    name: 'afo_registry_search',
    description: 'Search the AFO Agent Gateway tool registry for available tools by capability and risk level.',
    parameters: {
      type: 'object',
      properties: {
        capability: { type: 'string', description: 'Search phrase such as github, cloudflare, approvals, receipts, registry, deploy.' },
        riskMax: { type: 'string', enum: ['read', 'network', 'write', 'money', 'destructive'], description: 'Maximum risk level. Default read.' }
      },
      required: ['capability']
    }
  },
  {
    name: 'afo_registry_inspect',
    description: 'Inspect one AFO tool manifest by tool id.',
    parameters: {
      type: 'object',
      properties: {
        toolId: { type: 'string', description: 'AFO tool id, for example github.repo.inspect.' }
      },
      required: ['toolId']
    }
  },
  {
    name: 'afo_github_repo_inspect',
    description: 'Read safe metadata for a GitHub repository. Read-only.',
    parameters: {
      type: 'object',
      properties: {
        owner: { type: 'string', description: 'GitHub owner or organization.' },
        repo: { type: 'string', description: 'GitHub repository name.' }
      },
      required: ['owner', 'repo']
    }
  },
  {
    name: 'afo_github_file_read',
    description: 'Read one UTF-8 file from a GitHub repository. Read-only.',
    parameters: {
      type: 'object',
      properties: {
        owner: { type: 'string', description: 'GitHub owner or organization.' },
        repo: { type: 'string', description: 'GitHub repository name.' },
        path: { type: 'string', description: 'Repository file path.' },
        ref: { type: 'string', description: 'Optional branch, tag, or SHA.' }
      },
      required: ['owner', 'repo', 'path']
    }
  },
  {
    name: 'afo_github_workflow_runs',
    description: 'Read recent GitHub Actions workflow runs for a repository. Read-only.',
    parameters: {
      type: 'object',
      properties: {
        owner: { type: 'string', description: 'GitHub owner or organization.' },
        repo: { type: 'string', description: 'GitHub repository name.' },
        limit: { type: 'number', description: 'Maximum number of runs to return, default 10.' }
      },
      required: ['owner', 'repo']
    }
  },
  {
    name: 'afo_agent_invoke',
    description: 'Invoke an AFO Agent Gateway tool through the lead agent. Use only when the user explicitly wants the tool run.',
    parameters: {
      type: 'object',
      properties: {
        toolId: { type: 'string', description: 'AFO tool id to invoke.' },
        purpose: { type: 'string', description: 'Short reason for invoking the tool.' },
        input: { type: 'object', description: 'Tool input JSON.' }
      },
      required: ['toolId', 'purpose']
    }
  }
];

function cors() {
  return {
    'access-control-allow-origin': '*',
    'access-control-allow-methods': 'GET,POST,OPTIONS',
    'access-control-allow-headers': 'content-type,authorization,x-afo-role-token'
  };
}

function json(data, init = {}) {
  return new Response(JSON.stringify(data, null, 2), {
    status: init.status || 200,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      ...cors(),
      ...(init.headers || {})
    }
  });
}

function html(data, init = {}) {
  return new Response(data, {
    status: init.status || 200,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      ...cors(),
      ...(init.headers || {})
    }
  });
}

async function readJson(request) {
  try { return await request.json(); } catch { return {}; }
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

function getMcpUrl(input, env) {
  return input.mcpUrl || env.AFO_MCP_URL || DEFAULT_MCP_URL;
}

function getGatewayBase(input, env) {
  return getMcpUrl(input, env).replace(/\/mcp\/?$/, '');
}

function authHeaders(token) {
  return token ? { authorization: `Bearer ${token}` } : {};
}

function safeArgs(args) {
  if (!args) return {};
  if (typeof args === 'string') {
    try { return JSON.parse(args); } catch { return {}; }
  }
  if (typeof args === 'object') return args;
  return {};
}

function textFromOpenAi(raw) {
  return raw?.choices?.[0]?.message?.content || '';
}

function textBlocks(text) {
  return text ? [{ type: 'text', text }] : [];
}

function extractToolCalls(content) {
  const calls = [];
  for (const block of Array.isArray(content) ? content : []) {
    if (!block || typeof block !== 'object') continue;
    if (block.type === 'mcp_tool_use') calls.push({ type: block.type, name: block.name, input: block.input });
    if (block.type === 'mcp_tool_result') calls.push({ type: block.type, name: 'mcp_tool_result', output: block.content });
    if (block.type === 'tool_use') calls.push({ type: block.type, name: block.name, input: block.input });
  }
  return calls;
}

async function afoFetchJson(url, options) {
  const response = await fetch(url, options);
  const data = await response.json().catch(() => ({}));
  return { ok: response.ok, status: response.status, data };
}

function parseMcpToolResult(data) {
  const text = data?.result?.content?.find?.((item) => item?.type === 'text')?.text;
  if (!text) return data;
  try { return JSON.parse(text); } catch { return { text }; }
}

async function afoMcpToolCall(input, env, request, toolName, args) {
  const token = getAfoRoleToken(input, env, request);
  const response = await fetch(getMcpUrl(input, env), {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...authHeaders(token) },
    body: JSON.stringify({ jsonrpc: '2.0', id: crypto.randomUUID(), method: 'tools/call', params: { name: toolName, arguments: args || {} } })
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.error) return { ok: false, status: response.status || 500, data: { ok: false, error: data.error?.message || 'mcp_tool_call_failed', raw: data } };
  return { ok: true, status: response.status, data: parseMcpToolResult(data) };
}

function arrayFromRegistryPayload(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.tools)) return data.tools;
  if (Array.isArray(data?.matches)) return data.matches;
  if (Array.isArray(data?.result)) return data.result;
  if (Array.isArray(data?.result?.tools)) return data.result.tools;
  if (Array.isArray(data?.data)) return data.data;
  return [];
}

function riskRank(value) {
  return { read: 1, network: 2, write: 3, money: 4, destructive: 5 }[String(value || 'read').toLowerCase()] || 1;
}

function filterRegistryTools(tools, capability, riskMax) {
  const q = String(capability || '').toLowerCase();
  const max = riskRank(riskMax || 'read');
  return tools.filter((tool) => {
    const haystack = JSON.stringify(tool || {}).toLowerCase();
    const risk = riskRank(tool?.risk || tool?.permission || tool?.riskLevel || 'read');
    return (!q || haystack.includes(q)) && risk <= max;
  });
}

async function registrySearchD1(env, body) {
  if (!env.AFO_DB) return { ok: false, status: 0, data: { ok: false, error: 'd1_binding_missing' } };
  try {
    const res = await env.AFO_DB.prepare('SELECT manifest_json FROM tools ORDER BY id').all();
    const rows = res.results || [];
    const tools = rows.map((row) => JSON.parse(row.manifest_json)).filter(Boolean);
    const filtered = filterRegistryTools(tools, body.capability, body.riskMax);
    return { ok: true, status: 200, data: { ok: true, route: 'D1 tools table', tools: filtered.length ? filtered : tools.slice(0, 25), raw: { totalTools: tools.length, filteredTools: filtered.length } } };
  } catch (error) {
    return { ok: false, status: 500, data: { ok: false, error: 'd1_registry_search_failed', message: error.message || String(error) } };
  }
}

async function registryInspectD1(env, toolId) {
  if (!env.AFO_DB) return { ok: false, status: 0, data: { ok: false, error: 'd1_binding_missing' } };
  try {
    const row = await env.AFO_DB.prepare('SELECT manifest_json FROM tools WHERE id = ?').bind(toolId).first();
    if (!row) return { ok: false, status: 404, data: { ok: false, error: 'tool_not_found', toolId } };
    return { ok: true, status: 200, data: { ok: true, route: 'D1 tools table inspect', tool: JSON.parse(row.manifest_json) } };
  } catch (error) {
    return { ok: false, status: 500, data: { ok: false, error: 'd1_registry_inspect_failed', message: error.message || String(error) } };
  }
}

async function registrySearchFallback(env, gatewayBase, headers, body) {
  const directD1 = await registrySearchD1(env, body);
  if (directD1.ok) return directD1;
  const attempts = [];
  const postSearch = await afoFetchJson(`${gatewayBase}/registry/search`, { method: 'POST', headers, body: JSON.stringify(body) });
  attempts.push({ route: 'POST /registry/search', status: postSearch.status, ok: postSearch.ok });
  if (postSearch.ok && arrayFromRegistryPayload(postSearch.data).length) return { ...postSearch, data: { ok: true, route: 'POST /registry/search', tools: arrayFromRegistryPayload(postSearch.data), raw: postSearch.data, attempts } };

  const params = new URLSearchParams({ capability: body.capability || '', riskMax: body.riskMax || 'read' });
  const getSearch = await afoFetchJson(`${gatewayBase}/registry/search?${params.toString()}`, { method: 'GET', headers });
  attempts.push({ route: 'GET /registry/search', status: getSearch.status, ok: getSearch.ok });
  if (getSearch.ok && arrayFromRegistryPayload(getSearch.data).length) return { ...getSearch, data: { ok: true, route: 'GET /registry/search', tools: arrayFromRegistryPayload(getSearch.data), raw: getSearch.data, attempts } };

  const listTools = await afoFetchJson(`${gatewayBase}/registry/tools`, { method: 'GET', headers });
  attempts.push({ route: 'GET /registry/tools', status: listTools.status, ok: listTools.ok });
  const listed = arrayFromRegistryPayload(listTools.data);
  const filtered = filterRegistryTools(listed, body.capability, body.riskMax);
  if (listTools.ok && filtered.length) return { ok: true, status: listTools.status, data: { ok: true, route: 'GET /registry/tools filtered', tools: filtered, raw: listTools.data, attempts } };
  if (listTools.ok && listed.length) return { ok: true, status: listTools.status, data: { ok: true, route: 'GET /registry/tools unfiltered', tools: listed.slice(0, 25), raw: listTools.data, attempts, warning: 'No exact capability match; returned first registry tools.' } };

  const mcpSearch = await afoMcpToolCall({ ...body, mcpUrl: `${gatewayBase}/mcp` }, { AFO_MCP_URL: `${gatewayBase}/mcp` }, { headers: new Headers(headers) }, 'registry.search', body);
  attempts.push({ route: 'MCP tools/call registry.search', status: mcpSearch.status, ok: mcpSearch.ok });
  const mcpTools = arrayFromRegistryPayload(mcpSearch.data?.output || mcpSearch.data);
  if (mcpSearch.ok && mcpTools.length) return { ok: true, status: mcpSearch.status, data: { ok: true, route: 'MCP tools/call registry.search', tools: mcpTools, raw: mcpSearch.data, attempts } };

  return { ok: false, status: postSearch.status || getSearch.status || listTools.status || mcpSearch.status || 404, data: { ok: false, error: 'afo_registry_search_failed', attempts, raw: { postSearch: postSearch.data, getSearch: getSearch.data, listTools: listTools.data, mcpSearch: mcpSearch.data } } };
}

async function executeAfoFunction(name, args, input, env, request) {
  const gatewayBase = getGatewayBase(input, env);
  const token = getAfoRoleToken(input, env, request);
  const headers = { 'content-type': 'application/json', ...authHeaders(token) };
  const parsed = safeArgs(args);

  if (name === 'afo_registry_search') {
    const body = { capability: parsed.capability || input.toolSearch || 'github cloudflare approvals', riskMax: parsed.riskMax || input.riskMax || 'read' };
    return registrySearchFallback(env, gatewayBase, headers, body);
  }

  if (name === 'afo_registry_inspect') {
    const toolId = required(parsed.toolId, 'toolId');
    const directD1 = await registryInspectD1(env, toolId);
    if (directD1.ok) return directD1;
    const rest = await afoFetchJson(`${gatewayBase}/registry/tools/${encodeURIComponent(toolId)}`, { method: 'GET', headers });
    if (rest.ok) return rest;
    const mcp = await afoMcpToolCall(input, env, request, 'registry.inspect', { toolId });
    return mcp.ok ? { ok: true, status: mcp.status, data: { ok: true, route: 'MCP tools/call registry.inspect', raw: mcp.data, tool: mcp.data?.output?.tool || mcp.data?.tool } } : directD1;
  }

  if (name === 'afo_agent_invoke') {
    if (!input.allowAfoInvoke) {
      return { ok: false, status: 403, data: { ok: false, error: 'afo_agent_invoke_requires_allowAfoInvoke_true' } };
    }
    const body = { toolId: required(parsed.toolId, 'toolId'), purpose: parsed.purpose || 'BYOK model requested AFO tool invocation', input: parsed.input || {} };
    return afoFetchJson(`${gatewayBase}/agent/agent.afo.lead/invoke`, { method: 'POST', headers, body: JSON.stringify(body) });
  }

  return { ok: false, status: 400, data: { ok: false, error: `unknown_afo_function:${name}` } };
}

async function getAfoToolContext(input, env, request) {
  if (input.includeAfoContext === false) return '';
  try {
    const result = await executeAfoFunction('afo_registry_search', { capability: input.toolSearch || input.prompt || 'github cloudflare approvals', riskMax: input.riskMax || 'read' }, input, env, request);
    const data = result.data || {};
    const tools = Array.isArray(data.tools) ? data.tools : Array.isArray(data.matches) ? data.matches : Array.isArray(data.result) ? data.result : [];
    const summary = tools.slice(0, 20).map((tool) => `${tool.id || tool.name}: ${tool.description || ''}`).join('\n');
    return summary ? `AFO Gateway tools available:\n${summary}` : `AFO Gateway MCP URL: ${input.mcpUrl || env.AFO_MCP_URL || DEFAULT_MCP_URL}`;
  } catch {
    return `AFO Gateway MCP URL: ${input.mcpUrl || env.AFO_MCP_URL || DEFAULT_MCP_URL}`;
  }
}

function receipt(provider, model, status, toolIds = [], error) {
  return { id: crypto.randomUUID(), provider, model, status, toolIds, approvalIds: [], error, createdAt: new Date().toISOString() };
}

function openAiTools() {
  return AFO_FUNCTION_DECLARATIONS.map((fn) => ({ type: 'function', function: fn }));
}

function geminiTools() {
  return [{ functionDeclarations: AFO_FUNCTION_DECLARATIONS }];
}

function appHtml(env) {
  const boot = JSON.stringify({ buildId: BUILD_ID, providers: Object.keys(MODEL_OPTIONS), modelOptions: MODEL_OPTIONS, labels: PROVIDER_LABELS, mcpUrl: env.AFO_MCP_URL || DEFAULT_MCP_URL }).replace(/</g, '\\u003c');
  return html(`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>AFO BYOK Agent Gateway</title><style>body{margin:0;background:#070b12;color:#eaf1ff;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif}main{max-width:980px;margin:0 auto;padding:24px 14px}h1{font-size:34px;margin:0 0 8px}.muted{color:#9fb2d5;line-height:1.5}.grid{display:grid;grid-template-columns:360px 1fr;gap:14px}@media(max-width:820px){.grid{grid-template-columns:1fr}}.card{background:#0d1525;border:1px solid #253a5d;border-radius:18px;padding:16px}label{display:block;margin:11px 0 5px;color:#c1d1ed;font-size:13px;font-weight:700}select,input,textarea,button{width:100%;box-sizing:border-box;background:#07101e;color:#f6f9ff;border:1px solid #30486d;border-radius:11px;padding:10px;font:inherit}textarea{min-height:150px}button{margin-top:12px;border:0;background:#377dff;font-weight:800;cursor:pointer}.links{display:flex;gap:12px;flex-wrap:wrap;margin:12px 0 18px}a{color:#9cc7ff}.error{background:#3b1019;border:1px solid #8a3143;border-radius:12px;padding:12px;white-space:pre-wrap}.text{white-space:pre-wrap;line-height:1.6}pre{white-space:pre-wrap;word-break:break-word;background:#050a12;border:1px solid #243a5e;border-radius:12px;padding:12px;overflow:auto}summary{cursor:pointer;color:#9cc7ff;font-weight:800}.check{display:flex;gap:8px;align-items:center}.check input{width:auto}</style></head><body><main><h1>AFO BYOK Agent Gateway</h1><p class="muted">Choose a provider and model, paste a BYOK token for this request, and route through AFO Agent Gateway. Build ${BUILD_ID}</p><div class="links"><a href="/health">Health</a><a href="/api/byok/models">Models</a><a href="/api/byok/chat">Chat help</a></div><div class="grid"><div class="card"><form id="f"><label>Provider</label><select id="provider"></select><label>Model preset</label><select id="preset"></select><label>Model ID</label><input id="model"><div id="baseBox" style="display:none"><label>Base URL</label><input id="baseUrl" placeholder="https://provider.example/v1"></div><label>BYOK token</label><input id="token" type="password" autocomplete="off"><label>AFO role token</label><input id="afo" type="password" autocomplete="off" placeholder="optional"><label class="check"><input id="nativeTools" type="checkbox" checked> Enable native AFO tool calls where supported</label><label class="check"><input id="allowInvoke" type="checkbox"> Allow model to invoke AFO tools beyond registry search/inspect</label><label>Prompt</label><textarea id="prompt">Search AFO Agent Gateway for GitHub tools, inspect the most relevant one, and summarize what I can do next.</textarea><button id="send">Send</button></form></div><div class="card"><div id="out" class="muted">Ready.</div></div></div></main><script id="boot" type="application/json">${boot}</script><script>const BOOT=JSON.parse(document.getElementById('boot').textContent);const provider=document.getElementById('provider'),preset=document.getElementById('preset'),model=document.getElementById('model'),baseBox=document.getElementById('baseBox'),out=document.getElementById('out'),send=document.getElementById('send');function e(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}function pre(t,o){return '<details open><summary>'+e(t)+'</summary><pre>'+e(JSON.stringify(o,null,2))+'</pre></details>'}function fillProviders(){provider.innerHTML=BOOT.providers.map(function(p){return '<option value="'+e(p)+'">'+e(BOOT.labels[p]||p)+'</option>'}).join('');provider.value='anthropic';fillModels()}function fillModels(){const p=provider.value,ms=BOOT.modelOptions[p]||['custom-model'];preset.innerHTML=ms.map(function(m){return '<option value="'+e(m)+'">'+e(m)+'</option>'}).join('')+'<option value="custom">Custom model ID</option>';model.value=ms[0];baseBox.style.display=p==='openai-compatible'?'block':'none'}provider.onchange=fillModels;preset.onchange=function(){if(preset.value!=='custom')model.value=preset.value};document.getElementById('f').onsubmit=async function(ev){ev.preventDefault();send.disabled=true;out.className='muted';out.textContent='Running...';const payload={provider:provider.value,model:model.value,baseUrl:document.getElementById('baseUrl').value,providerKey:document.getElementById('token').value,afoRoleToken:document.getElementById('afo').value,prompt:document.getElementById('prompt').value,maxTokens:1000,nativeTools:document.getElementById('nativeTools').checked,allowAfoInvoke:document.getElementById('allowInvoke').checked};try{const r=await fetch('/api/byok/chat',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(payload)});const d=await r.json();if(!r.ok||d.ok===false)throw new Error(d.error||'Request failed');const text=d.text||(Array.isArray(d.content)?d.content.filter(function(b){return b.type==='text'}).map(function(b){return b.text}).join('\\n\\n'):'');out.className='';out.innerHTML=(text?'<div class="text">'+e(text)+'</div>':'<div class="muted">No text returned.</div>')+pre('Native AFO calls',d.afoCalls||[])+pre('Tool calls',d.toolCalls||[])+pre('Receipts',d.receipts||[])+pre('Raw',d.raw||d)}catch(err){out.className='error';out.textContent=err.message||String(err)}finally{send.disabled=false}};fillProviders();</script></body></html>`);
}

function chatHelp(env) {
  return json({ ok: true, buildId: BUILD_ID, endpoint: '/api/byok/chat', method: 'POST', message: 'Send a POST request with JSON to run a BYOK chat request.', supportedProviders: Object.keys(MODEL_OPTIONS), modelOptions: MODEL_OPTIONS, nativeTools: { openai: true, chatgpt: true, gemini: true, note: 'afo_agent_invoke requires allowAfoInvoke=true; registry search and inspect are available when nativeTools=true.' }, mcpUrl: env.AFO_MCP_URL || DEFAULT_MCP_URL, example: { provider: 'openai', model: MODEL_OPTIONS.openai[0], providerKey: 'paste-provider-token-in-ui-or-send-authorization-bearer', afoRoleToken: 'optional-afo-role-token', nativeTools: true, allowAfoInvoke: false, prompt: 'Search AFO Agent Gateway for GitHub tools and inspect the most relevant one.', maxTokens: 1000 } });
}

async function callAnthropic(input, env, request) {
  const credential = getCredential(input, request);
  const model = required(input.model || env.DEFAULT_ANTHROPIC_MODEL || MODEL_OPTIONS.anthropic[0], 'model');
  const prompt = required(input.prompt, 'prompt');
  const headers = { 'content-type': 'application/json', 'x-api-key': credential, 'anthropic-version': env.ANTHROPIC_VERSION || DEFAULT_ANTHROPIC_VERSION };
  if (env.ANTHROPIC_BETA) headers['anthropic-beta'] = env.ANTHROPIC_BETA;
  const tools = AFO_FUNCTION_DECLARATIONS.map((fn) => ({ name: fn.name, description: fn.description, input_schema: fn.parameters }));
  const maxTokens = Math.max(1, Math.min(Number(input.maxTokens || 1000), 8000));
  const firstBody = { model, max_tokens: maxTokens, messages: [{ role: 'user', content: prompt }] };
  if (input.nativeTools !== false) firstBody.tools = tools;
  const firstResponse = await fetch('https://api.anthropic.com/v1/messages', { method: 'POST', headers, body: JSON.stringify(firstBody) });
  const first = await firstResponse.json().catch(() => ({}));
  if (!firstResponse.ok) {
    const error = first.error?.message || `Anthropic API error ${firstResponse.status}`;
    return json({ ok: false, buildId: BUILD_ID, provider: 'anthropic', model, error, raw: first, receipts: [receipt('anthropic', model, 'failed', [], error)] }, { status: firstResponse.status });
  }
  const firstContent = Array.isArray(first.content) ? first.content : [];
  const toolCalls = firstContent.filter((block) => block && block.type === 'tool_use').map((block) => ({ id: block.id, type: block.type, name: block.name, input: block.input || {} }));
  const afoCalls = [];
  if (toolCalls.length) {
    const toolResults = [];
    for (const call of toolCalls) {
      const result = await executeAfoFunction(call.name, call.input || {}, input, env, request);
      afoCalls.push({ name: call.name, input: call.input || {}, status: result.status, ok: result.ok, result: result.data });
      toolResults.push({ type: 'tool_result', tool_use_id: call.id, content: JSON.stringify(result.data) });
    }
    const secondBody = { model, max_tokens: maxTokens, tools, messages: [{ role: 'user', content: prompt }, { role: 'assistant', content: firstContent }, { role: 'user', content: toolResults }] };
    const secondResponse = await fetch('https://api.anthropic.com/v1/messages', { method: 'POST', headers, body: JSON.stringify(secondBody) });
    const raw = await secondResponse.json().catch(() => ({}));
    if (!secondResponse.ok) {
      const error = raw.error?.message || `Anthropic final response error ${secondResponse.status}`;
      return json({ ok: false, buildId: BUILD_ID, provider: 'anthropic', model, error, raw, afoCalls, receipts: [receipt('anthropic', model, 'failed', afoCalls.map((call) => call.name), error)] }, { status: secondResponse.status });
    }
    const finalContent = Array.isArray(raw.content) ? raw.content : [];
    const secondToolCalls = finalContent.filter((block) => block && block.type === 'tool_use').map((block) => ({ id: block.id, type: block.type, name: block.name, input: block.input || {} }));
    if (secondToolCalls.length) {
      const secondToolResults = [];
      for (const call of secondToolCalls) {
        const result = await executeAfoFunction(call.name, call.input || {}, input, env, request);
        toolCalls.push(call);
        afoCalls.push({ name: call.name, input: call.input || {}, status: result.status, ok: result.ok, result: result.data, round: 2 });
        secondToolResults.push({ type: 'tool_result', tool_use_id: call.id, content: JSON.stringify(result.data) });
      }
      const thirdBody = { model, max_tokens: maxTokens, tools, messages: [{ role: 'user', content: prompt }, { role: 'assistant', content: firstContent }, { role: 'user', content: toolResults }, { role: 'assistant', content: finalContent }, { role: 'user', content: secondToolResults }] };
      const thirdResponse = await fetch('https://api.anthropic.com/v1/messages', { method: 'POST', headers, body: JSON.stringify(thirdBody) });
      const thirdRaw = await thirdResponse.json().catch(() => ({}));
      if (!thirdResponse.ok) {
        const error = thirdRaw.error?.message || `Anthropic second follow-up error ${thirdResponse.status}`;
        return json({ ok: false, buildId: BUILD_ID, provider: 'anthropic', model, error, raw: thirdRaw, afoCalls, toolCalls, receipts: [receipt('anthropic', model, 'failed', afoCalls.map((call) => call.name), error)] }, { status: thirdResponse.status });
      }
      const thirdContent = Array.isArray(thirdRaw.content) ? thirdRaw.content : [];
      const thirdText = thirdContent.filter((block) => block && block.type === 'text').map((block) => block.text || '').join('\n\n');
      return json({ ok: true, buildId: BUILD_ID, provider: 'anthropic', model, text: thirdText, content: thirdContent, toolCalls, afoCalls, raw: thirdRaw, receipts: [receipt('anthropic', model, 'executed', afoCalls.map((call) => call.name))] });
    }
    const text = finalContent.filter((block) => block && block.type === 'text').map((block) => block.text || '').join('\n\n');
    return json({ ok: true, buildId: BUILD_ID, provider: 'anthropic', model, text, content: finalContent, toolCalls, afoCalls, raw, receipts: [receipt('anthropic', model, 'executed', afoCalls.map((call) => call.name))] });
  }
  const text = firstContent.filter((block) => block && block.type === 'text').map((block) => block.text || '').join('\n\n');
  return json({ ok: true, buildId: BUILD_ID, provider: 'anthropic', model, text, content: firstContent, toolCalls: [], afoCalls, raw: first, receipts: [receipt('anthropic', model, 'executed')] });
}

async function callOpenAiCompatible(input, env, request, provider) {
  const config = provider === 'openai-compatible' ? { label: 'OpenAI Compatible', endpoint: required(input.baseUrl, 'baseUrl').replace(/\/$/, '') + '/chat/completions', defaultModel: 'custom-model' } : OPENAI_COMPATIBLE[provider];
  if (!config) throw new Error(`provider_not_supported:${provider}`);
  const credential = getCredential(input, request);
  const model = required(input.model || config.defaultModel, 'model');
  const prompt = required(input.prompt, 'prompt');
  const afoContext = await getAfoToolContext(input, env, request);
  const messages = [];
  if (afoContext) messages.push({ role: 'system', content: `You can use AFO tools to answer. Prefer registry search/inspect first. Do not invoke write/deploy tools unless the user explicitly asks.\n\n${afoContext}` });
  messages.push({ role: 'user', content: prompt });
  const body = { model, messages, max_tokens: Math.max(1, Math.min(Number(input.maxTokens || 1000), 8000)), temperature: typeof input.temperature === 'number' ? input.temperature : undefined };
  if (input.nativeTools !== false) body.tools = openAiTools();
  const upstream = await fetch(config.endpoint, { method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${credential}` }, body: JSON.stringify(body) });
  const first = await upstream.json().catch(() => ({}));
  if (!upstream.ok) {
    const error = first.error?.message || first.message || `${config.label} API error ${upstream.status}`;
    return json({ ok: false, buildId: BUILD_ID, provider, model, error, raw: first, receipts: [receipt(provider, model, 'failed', [], error)] }, { status: upstream.status });
  }
  const choice = first.choices?.[0] || {};
  const message = choice.message || {};
  const calls = Array.isArray(message.tool_calls) ? message.tool_calls : [];
  const afoCalls = [];
  if (calls.length) {
    messages.push(message);
    for (const call of calls) {
      const name = call.function?.name;
      const args = call.function?.arguments || '{}';
      const result = await executeAfoFunction(name, args, input, env, request);
      afoCalls.push({ name, input: safeArgs(args), status: result.status, ok: result.ok, result: result.data });
      messages.push({ role: 'tool', tool_call_id: call.id, content: JSON.stringify(result.data) });
    }
    const finalBody = { model, messages, max_tokens: Math.max(1, Math.min(Number(input.maxTokens || 1000), 8000)) };
    const second = await fetch(config.endpoint, { method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${credential}` }, body: JSON.stringify(finalBody) });
    const raw = await second.json().catch(() => ({}));
    if (!second.ok) {
      const error = raw.error?.message || raw.message || `${config.label} final response error ${second.status}`;
      return json({ ok: false, buildId: BUILD_ID, provider, model, error, raw, afoCalls, receipts: [receipt(provider, model, 'failed', afoCalls.map((c) => c.name), error)] }, { status: second.status });
    }
    const text = textFromOpenAi(raw);
    return json({ ok: true, buildId: BUILD_ID, provider, model, text, content: textBlocks(text), toolCalls: calls, afoCalls, raw, receipts: [receipt(provider, model, 'executed', afoCalls.map((c) => c.name))] });
  }
  const text = textFromOpenAi(first);
  return json({ ok: true, buildId: BUILD_ID, provider, model, text, content: textBlocks(text), toolCalls: [], afoCalls, raw: first, receipts: [receipt(provider, model, 'executed')] });
}

function geminiText(raw) {
  return raw.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join('') || '';
}

function geminiFunctionCalls(raw) {
  const parts = raw.candidates?.[0]?.content?.parts || [];
  return parts.filter((part) => part.functionCall).map((part) => part.functionCall);
}

async function callGemini(input, env, request) {
  const credential = getCredential(input, request);
  const model = required(input.model || MODEL_OPTIONS.gemini[0], 'model');
  const prompt = required(input.prompt, 'prompt');
  const afoContext = await getAfoToolContext(input, env, request);
  const text = `${afoContext ? `AFO Gateway context:\n${afoContext}\n\n` : ''}${prompt}`;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(credential)}`;
  const firstBody = { contents: [{ role: 'user', parts: [{ text }] }], generationConfig: { maxOutputTokens: Math.max(1, Math.min(Number(input.maxTokens || 1000), 8000)) } };
  if (input.nativeTools !== false) firstBody.tools = geminiTools();
  const upstream = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(firstBody) });
  const first = await upstream.json().catch(() => ({}));
  if (!upstream.ok) {
    const error = first.error?.message || `Gemini API error ${upstream.status}`;
    return json({ ok: false, buildId: BUILD_ID, provider: 'gemini', model, error, raw: first, receipts: [receipt('gemini', model, 'failed', [], error)] }, { status: upstream.status });
  }
  const calls = geminiFunctionCalls(first);
  const afoCalls = [];
  if (calls.length) {
    const parts = [];
    for (const call of calls) {
      const result = await executeAfoFunction(call.name, call.args || {}, input, env, request);
      afoCalls.push({ name: call.name, input: call.args || {}, status: result.status, ok: result.ok, result: result.data });
      parts.push({ functionResponse: { name: call.name, response: result.data } });
    }
    const secondBody = { contents: [{ role: 'user', parts: [{ text }] }, { role: 'model', parts: calls.map((call) => ({ functionCall: call })) }, { role: 'function', parts }], generationConfig: { maxOutputTokens: Math.max(1, Math.min(Number(input.maxTokens || 1000), 8000)) }, tools: geminiTools() };
    const finalRes = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(secondBody) });
    const raw = await finalRes.json().catch(() => ({}));
    if (!finalRes.ok) {
      const error = raw.error?.message || `Gemini final response error ${finalRes.status}`;
      return json({ ok: false, buildId: BUILD_ID, provider: 'gemini', model, error, raw, afoCalls, receipts: [receipt('gemini', model, 'failed', afoCalls.map((c) => c.name), error)] }, { status: finalRes.status });
    }
    const output = geminiText(raw);
    return json({ ok: true, buildId: BUILD_ID, provider: 'gemini', model, text: output, content: textBlocks(output), toolCalls: calls, afoCalls, raw, receipts: [receipt('gemini', model, 'executed', afoCalls.map((c) => c.name))] });
  }
  const output = geminiText(first);
  return json({ ok: true, buildId: BUILD_ID, provider: 'gemini', model, text: output, content: textBlocks(output), toolCalls: [], afoCalls, raw: first, receipts: [receipt('gemini', model, 'executed')] });
}

async function handleChat(request, env) {
  const input = await readJson(request);
  const provider = (input.provider || 'anthropic').toLowerCase();
  try {
    if (provider === 'anthropic') return await callAnthropic(input, env, request);
    if (provider === 'gemini') return await callGemini(input, env, request);
    if (provider in OPENAI_COMPATIBLE || provider === 'openai-compatible') return await callOpenAiCompatible(input, env, request, provider);
    return json({ ok: false, buildId: BUILD_ID, error: `provider_not_supported_yet:${provider}`, supported: Object.keys(MODEL_OPTIONS) }, { status: 400 });
  } catch (error) {
    return json({ ok: false, buildId: BUILD_ID, error: error.message || String(error) }, { status: 400 });
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === 'OPTIONS') return new Response(null, { headers: cors() });
    if (request.method === 'GET' && (url.pathname === '/' || url.pathname === '/app')) return appHtml(env);
    if (request.method === 'GET' && url.pathname === '/health') return json({ ok: true, buildId: BUILD_ID, name: 'afo-byok-agent-gateway', mode: 'ephemeral-provider-credential', supportedProviders: Object.keys(MODEL_OPTIONS), modelOptions: MODEL_OPTIONS, mcpUrl: env.AFO_MCP_URL || DEFAULT_MCP_URL, storesProviderCredentials: false, nativeToolAdapters: { anthropic: 'claude-tool-calling-basic', openai: 'function-calling', chatgpt: 'function-calling', gemini: 'function-calling' } });
    if (request.method === 'GET' && url.pathname === '/api/byok/models') return json({ ok: true, buildId: BUILD_ID, providers: Object.keys(MODEL_OPTIONS), modelOptions: MODEL_OPTIONS });
    if (request.method === 'GET' && url.pathname === '/api/byok/chat') return chatHelp(env);
    if (request.method === 'POST' && url.pathname === '/api/byok/chat') return handleChat(request, env);
    return json({ ok: false, buildId: BUILD_ID, error: 'not_found', path: url.pathname, method: request.method, available: ['GET /', 'GET /app', 'GET /health', 'GET /api/byok/models', 'GET /api/byok/chat', 'POST /api/byok/chat'] }, { status: 404 });
  }
};
