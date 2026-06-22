const BUILD_ID = 'byok-thread-crud-2026-06-21-01';
const DEFAULT_MCP_URL = 'https://afo-agent-gateway.jaredtechfit.workers.dev/mcp';
const DEFAULT_CAIRNSTONE_URL = 'https://cairnstone-v5.jaredtechfit.workers.dev';
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

const NATIVE_TOOL_PROVIDERS = new Set(['anthropic', 'openai', 'chatgpt', 'gemini']);

const OPENAI_COMPATIBLE = {
  openai: { endpoint: 'https://api.openai.com/v1/chat/completions', defaultModel: 'gpt-4.1-mini' },
  chatgpt: { endpoint: 'https://api.openai.com/v1/chat/completions', defaultModel: 'gpt-4.1-mini' },
  xai: { endpoint: 'https://api.x.ai/v1/chat/completions', defaultModel: 'grok-4' },
  deepseek: { endpoint: 'https://api.deepseek.com/chat/completions', defaultModel: 'deepseek-chat' },
  kimi: { endpoint: 'https://api.moonshot.ai/v1/chat/completions', defaultModel: 'moonshot-v1-8k' },
  mistral: { endpoint: 'https://api.mistral.ai/v1/chat/completions', defaultModel: 'mistral-small-latest' },
  groq: { endpoint: 'https://api.groq.com/openai/v1/chat/completions', defaultModel: 'llama-3.3-70b-versatile' },
  cerebras: { endpoint: 'https://api.cerebras.ai/v1/chat/completions', defaultModel: 'llama3.1-8b' }
};

function providerCapability(provider) {
  const native = NATIVE_TOOL_PROVIDERS.has(provider);
  return {
    chat: true,
    native_tools: native,
    streaming: true,
    roles: native ? ['chat'] : ['judge', 'side_task']
  };
}

function providerCapabilities() {
  return Object.fromEntries(Object.keys(MODEL_OPTIONS).map((provider) => [provider, providerCapability(provider)]));
}

function cors() {
  return {
    'access-control-allow-origin': '*',
    'access-control-allow-methods': 'GET,POST,PATCH,DELETE,OPTIONS',
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

function safeText(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
}

function appHtml(env) {
  const boot = JSON.stringify({
    buildId: BUILD_ID,
    providers: Object.keys(MODEL_OPTIONS),
    modelOptions: MODEL_OPTIONS,
    labels: PROVIDER_LABELS,
    capabilities: providerCapabilities(),
    mcpUrl: env.AFO_MCP_URL || DEFAULT_MCP_URL
  }).replace(/</g, '\\u003c');
  return html(`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>AFO BYOK Agent Gateway</title><style>body{margin:0;background:#070b12;color:#eaf1ff;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif}main{max-width:980px;margin:0 auto;padding:20px 12px}h1{font-size:30px;margin:0 0 8px}.muted{color:#9fb2d5;line-height:1.45}.grid{display:grid;grid-template-columns:340px 1fr;gap:12px}@media(max-width:820px){.grid{grid-template-columns:1fr}}.card{background:#0d1525;border:1px solid #253a5d;border-radius:18px;padding:14px}label{display:block;margin:10px 0 5px;color:#c1d1ed;font-size:13px;font-weight:700}select,input,textarea,button{width:100%;box-sizing:border-box;background:#07101e;color:#f6f9ff;border:1px solid #30486d;border-radius:11px;padding:10px;font:inherit}textarea{min-height:130px}button{margin-top:12px;border:0;background:#377dff;font-weight:800}.links{display:flex;gap:10px;flex-wrap:wrap;margin:12px 0 16px}a{color:#9cc7ff}.pill{display:inline-flex;border:1px solid #2d466d;border-radius:999px;padding:3px 8px;margin:2px;color:#bfd2ef}.error{background:#3b1019;border:1px solid #8a3143;border-radius:12px;padding:12px;white-space:pre-wrap}.text{white-space:pre-wrap;line-height:1.55}pre{white-space:pre-wrap;word-break:break-word;background:#050a12;border:1px solid #243a5e;border-radius:12px;padding:12px;overflow:auto}</style></head><body><main><h1>AFO BYOK Agent Gateway</h1><p class="muted">Ephemeral BYOK chat shell. Keys are used only for the request. Build ${safeText(BUILD_ID)}</p><div class="links"><a href="/health">Health</a><a href="/api/byok/providers/check">Providers</a><a href="/api/byok/models">Models</a><a href="/api/byok/selftest">Selftest</a><a href="/api/byok/tools/check">Tools</a><a href="/stones">Stones</a></div><div class="grid"><section class="card"><form id="f"><label>Provider</label><select id="provider"></select><div id="caps" class="muted"></div><label>Model</label><select id="preset"></select><input id="model"><div id="baseWrap" style="display:none"><label>Base URL</label><input id="baseUrl" placeholder="https://provider.example/v1"></div><label>BYOK token</label><input id="token" type="password" autocomplete="off"><label>Prompt</label><textarea id="prompt">Give me a concise status of this BYOK gateway.</textarea><button id="send">Send</button></form></section><section class="card"><div id="out" class="muted">Ready.</div></section></div></main><script id="boot" type="application/json">${boot}</script><script>const BOOT=JSON.parse(document.getElementById('boot').textContent);const provider=document.getElementById('provider'),preset=document.getElementById('preset'),model=document.getElementById('model'),baseWrap=document.getElementById('baseWrap'),caps=document.getElementById('caps'),out=document.getElementById('out');function e(s){return String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}function renderCaps(){const c=BOOT.capabilities[provider.value]||{};caps.innerHTML='<span class="pill">chat '+!!c.chat+'</span><span class="pill">tools '+!!c.native_tools+'</span><span class="pill">stream '+!!c.streaming+'</span><span class="pill">'+e((c.roles||[]).join(', '))+'</span>'}function fillModels(){const p=provider.value,ms=BOOT.modelOptions[p]||['custom-model'];preset.innerHTML=ms.map(m=>'<option value="'+e(m)+'">'+e(m)+'</option>').join('')+'<option value="custom">Custom</option>';model.value=ms[0];baseWrap.style.display=p==='openai-compatible'?'block':'none';renderCaps()}provider.innerHTML=BOOT.providers.map(p=>'<option value="'+e(p)+'">'+e(BOOT.labels[p]||p)+'</option>').join('');provider.onchange=fillModels;preset.onchange=()=>{if(preset.value!=='custom')model.value=preset.value};fillModels();document.getElementById('f').onsubmit=async ev=>{ev.preventDefault();out.className='muted';out.textContent='Running...';try{const r=await fetch('/api/byok/chat',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({provider:provider.value,model:model.value,baseUrl:document.getElementById('baseUrl').value,providerKey:document.getElementById('token').value,prompt:document.getElementById('prompt').value,maxTokens:900})});const d=await r.json();if(!r.ok||d.ok===false)throw new Error(d.error||'Request failed');out.className='';out.innerHTML='<div class="text">'+e(d.text||'')+'</div><pre>'+e(JSON.stringify(d,null,2))+'</pre>'}catch(err){out.className='error';out.textContent=err.message||String(err)}};</script></body></html>`);
}

async function publicGithub(path) {
  const response = await fetch(`https://api.github.com${path}`, {
    headers: { accept: 'application/vnd.github+json', 'user-agent': 'afo-byok-agent-gateway' }
  });
  const text = await response.text();
  let data;
  try { data = JSON.parse(text); } catch { data = { text }; }
  if (!response.ok) return { ok: false, status: response.status, data: { ok: false, error: data.message || `github_${response.status}`, raw: data } };
  return { ok: true, status: response.status, data };
}

function repoPath(path) {
  return String(path || '').split('/').map(encodeURIComponent).join('/');
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

async function executeAfoFunction(name, args, input, env) {
  if (name === 'afo_registry_search') return registrySearchD1(env, { capability: args.capability || input.toolSearch || 'github', riskMax: args.riskMax || input.riskMax || 'read' });
  if (name === 'afo_registry_inspect') return registryInspectD1(env, required(args.toolId, 'toolId'));
  if (name === 'afo_github_repo_inspect') {
    const owner = required(args.owner, 'owner');
    const repo = required(args.repo, 'repo');
    const result = await publicGithub(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`);
    if (!result.ok) return result;
    const r = result.data;
    return { ok: true, status: result.status, data: { ok: true, route: 'Public GitHub repo inspect', repository: { id: r.id, full_name: r.full_name, private: r.private, visibility: r.visibility, default_branch: r.default_branch, html_url: r.html_url, updated_at: r.updated_at, pushed_at: r.pushed_at } } };
  }
  if (name === 'afo_github_file_read') {
    const owner = required(args.owner, 'owner');
    const repo = required(args.repo, 'repo');
    const path = required(args.path, 'path');
    const ref = args.ref ? `?ref=${encodeURIComponent(args.ref)}` : '';
    const result = await publicGithub(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/${repoPath(path)}${ref}`);
    if (!result.ok) return result;
    const f = result.data;
    const content = f.encoding === 'base64' && typeof f.content === 'string' ? atob(f.content.replace(/\s/g, '')) : String(f.content || '');
    return { ok: true, status: result.status, data: { ok: true, route: 'Public GitHub file read', file: { path: f.path, sha: f.sha, size: f.size, html_url: f.html_url, encoding: f.encoding, content: content.slice(0, 20000), truncated: content.length > 20000 } } };
  }
  if (name === 'afo_github_workflow_runs') {
    const owner = required(args.owner, 'owner');
    const repo = required(args.repo, 'repo');
    const limit = Math.max(1, Math.min(Number(args.limit || 10), 30));
    const result = await publicGithub(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/actions/runs?per_page=${limit}`);
    if (!result.ok) return result;
    const runs = Array.isArray(result.data.workflow_runs) ? result.data.workflow_runs : [];
    return { ok: true, status: result.status, data: { ok: true, route: 'Public GitHub workflow runs', total_count: result.data.total_count || runs.length, runs: runs.map((run) => ({ id: run.id, name: run.name, status: run.status, conclusion: run.conclusion, head_branch: run.head_branch, head_sha: run.head_sha, event: run.event, run_started_at: run.run_started_at, updated_at: run.updated_at, html_url: run.html_url })).slice(0, limit) } };
  }
  return { ok: false, status: 400, data: { ok: false, error: `unknown_afo_function:${name}` } };
}

function checkStatus(result) {
  if (result?.ok) return 'callable';
  if (result?.status === 401 || result?.status === 403) return 'needs_auth';
  if (result?.status === 0) return 'not_configured';
  return 'failed';
}

function summarizeChecks(checks) {
  const summary = { total: checks.length, callable: 0, needs_auth: 0, not_configured: 0, failed: 0, skipped: 0 };
  for (const check of checks) summary[check.status] = (summary[check.status] || 0) + 1;
  return summary;
}

async function runSelfCheck(label, fn, args, input, env) {
  const started = Date.now();
  try {
    const result = await executeAfoFunction(fn, args, input, env);
    return { label, fn, status: checkStatus(result), httpStatus: result?.status || 0, ms: Date.now() - started, result: result?.data || null };
  } catch (error) {
    return { label, fn, status: 'failed', httpStatus: 0, ms: Date.now() - started, error: error.message || String(error) };
  }
}

async function handleSelfTest(request, env) {
  const url = new URL(request.url);
  const owner = url.searchParams.get('owner') || 'nothinginfinity';
  const repo = url.searchParams.get('repo') || 'afo-agent';
  const filePath = url.searchParams.get('path') || 'package.json';
  const input = { mcpUrl: env.AFO_MCP_URL || DEFAULT_MCP_URL, includeAfoContext: false, allowAfoInvoke: false, riskMax: 'read' };
  const checks = [];
  checks.push({ label: 'AFO_DB binding', fn: 'binding.AFO_DB', status: env.AFO_DB ? 'callable' : 'not_configured', httpStatus: env.AFO_DB ? 200 : 0, ms: 0, result: { present: !!env.AFO_DB } });
  checks.push(await runSelfCheck('Registry search: github', 'afo_registry_search', { capability: 'github', riskMax: 'read' }, input, env));
  checks.push(await runSelfCheck('Registry inspect: github.repo.inspect', 'afo_registry_inspect', { toolId: 'github.repo.inspect' }, input, env));
  checks.push(await runSelfCheck('GitHub repo inspect', 'afo_github_repo_inspect', { owner, repo }, input, env));
  checks.push(await runSelfCheck('GitHub file read', 'afo_github_file_read', { owner, repo, path: filePath }, input, env));
  checks.push(await runSelfCheck('GitHub workflow runs', 'afo_github_workflow_runs', { owner, repo, limit: 5 }, input, env));
  return json({ ok: checks.every((check) => check.status === 'callable'), buildId: BUILD_ID, target: { owner, repo, filePath }, summary: summarizeChecks(checks), checks });
}

function localImplementationForTool(toolId) {
  const map = {
    'registry.search': 'afo_registry_search',
    'registry.inspect': 'afo_registry_inspect',
    'github.repo.inspect': 'afo_github_repo_inspect',
    'github.file.read': 'afo_github_file_read',
    'github.workflow.runs': 'afo_github_workflow_runs'
  };
  return map[toolId] || null;
}

async function handleToolCheck(request, env) {
  const url = new URL(request.url);
  const capability = url.searchParams.get('capability') || '';
  const result = await registrySearchD1(env, { capability, riskMax: 'destructive' });
  const tools = arrayFromRegistryPayload(result.data);
  const checks = tools.map((tool) => {
    const toolId = tool.id || tool.name || '';
    const implementation = localImplementationForTool(toolId);
    return {
      toolId,
      name: tool.name || toolId,
      risk: tool.risk || tool.permission || tool.riskLevel || 'read',
      status: implementation ? 'callable' : 'not_implemented_yet',
      implementation,
      description: tool.description || ''
    };
  });
  const summary = checks.reduce((acc, check) => {
    acc.total += 1;
    acc[check.status] = (acc[check.status] || 0) + 1;
    return acc;
  }, { total: 0, callable: 0, not_implemented_yet: 0 });
  return json({ ok: true, buildId: BUILD_ID, source: result.ok ? 'D1 tools table' : 'unavailable', capability, summary, checks });
}

function dbRequired(env) {
  if (!env.AFO_DB) {
    const error = new Error('AFO_DB binding missing');
    error.status = 503;
    throw error;
  }
  return env.AFO_DB;
}

function threadIdFromPath(pathname) {
  const match = /^\/api\/byok\/threads\/([^/]+)$/.exec(pathname);
  return match ? decodeURIComponent(match[1]) : '';
}

function threadJson(row) {
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    provider: row.provider,
    model: row.model,
    created_at: row.created_at,
    updated_at: row.updated_at,
    status: row.status,
    token_count: row.token_count || 0
  };
}

function messageJson(row) {
  let content = null;
  try { content = row.content_json ? JSON.parse(row.content_json) : null; } catch { content = row.content_json; }
  return {
    id: row.id,
    thread_id: row.thread_id,
    role: row.role,
    content,
    parent_id: row.parent_id,
    tokens_in: row.tokens_in,
    tokens_out: row.tokens_out,
    compacted: !!row.compacted,
    archive_url: row.archive_url,
    created_at: row.created_at
  };
}

function safeThreadStatus(status) {
  const value = String(status || 'active').toLowerCase();
  return ['active', 'archived', 'deleted'].includes(value) ? value : 'active';
}

async function handleListThreads(request, env) {
  try {
    const db = dbRequired(env);
    const url = new URL(request.url);
    const limit = Math.max(1, Math.min(Number(url.searchParams.get('limit') || 20), 100));
    const offset = Math.max(0, Number(url.searchParams.get('offset') || 0));
    const includeDeleted = url.searchParams.get('include_deleted') === '1';
    const where = includeDeleted ? '1 = 1' : "status != 'deleted'";
    const rows = await db.prepare(`SELECT id, title, provider, model, created_at, updated_at, status, token_count FROM byok_threads WHERE ${where} ORDER BY updated_at DESC LIMIT ? OFFSET ?`).bind(limit, offset).all();
    return json({ ok: true, buildId: BUILD_ID, threads: (rows.results || []).map(threadJson), page: { limit, offset, next_offset: (rows.results || []).length === limit ? offset + limit : null } });
  } catch (error) {
    return json({ ok: false, buildId: BUILD_ID, error: error.message || String(error) }, { status: error.status || 500 });
  }
}

async function handleCreateThread(request, env) {
  try {
    const db = dbRequired(env);
    const input = await readJson(request);
    const now = Date.now();
    const id = crypto.randomUUID();
    const title = String(input.title || 'New BYOK thread').slice(0, 240);
    const provider = input.provider ? String(input.provider).slice(0, 80) : null;
    const model = input.model ? String(input.model).slice(0, 160) : null;
    await db.prepare('INSERT INTO byok_threads (id, title, provider, model, created_at, updated_at, status, token_count) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').bind(id, title, provider, model, now, now, 'active', 0).run();
    const row = await db.prepare('SELECT id, title, provider, model, created_at, updated_at, status, token_count FROM byok_threads WHERE id = ?').bind(id).first();
    return json({ ok: true, buildId: BUILD_ID, thread: threadJson(row) }, { status: 201 });
  } catch (error) {
    return json({ ok: false, buildId: BUILD_ID, error: error.message || String(error) }, { status: error.status || 500 });
  }
}

async function handleGetThread(threadId, env) {
  try {
    const db = dbRequired(env);
    const thread = await db.prepare('SELECT id, title, provider, model, created_at, updated_at, status, token_count FROM byok_threads WHERE id = ?').bind(threadId).first();
    if (!thread || thread.status === 'deleted') return json({ ok: false, buildId: BUILD_ID, error: 'thread_not_found', threadId }, { status: 404 });
    const messages = await db.prepare('SELECT id, thread_id, role, content_json, parent_id, tokens_in, tokens_out, compacted, archive_url, created_at FROM byok_messages WHERE thread_id = ? ORDER BY created_at ASC').bind(threadId).all();
    return json({ ok: true, buildId: BUILD_ID, thread: threadJson(thread), messages: (messages.results || []).map(messageJson) });
  } catch (error) {
    return json({ ok: false, buildId: BUILD_ID, error: error.message || String(error) }, { status: error.status || 500 });
  }
}

async function handlePatchThread(threadId, request, env) {
  try {
    const db = dbRequired(env);
    const input = await readJson(request);
    const existing = await db.prepare('SELECT id, title, provider, model, created_at, updated_at, status, token_count FROM byok_threads WHERE id = ?').bind(threadId).first();
    if (!existing || existing.status === 'deleted') return json({ ok: false, buildId: BUILD_ID, error: 'thread_not_found', threadId }, { status: 404 });
    const title = input.title === undefined ? existing.title : String(input.title || '').slice(0, 240);
    const provider = input.provider === undefined ? existing.provider : (input.provider ? String(input.provider).slice(0, 80) : null);
    const model = input.model === undefined ? existing.model : (input.model ? String(input.model).slice(0, 160) : null);
    const status = input.status === undefined ? existing.status : safeThreadStatus(input.status);
    const now = Date.now();
    await db.prepare('UPDATE byok_threads SET title = ?, provider = ?, model = ?, status = ?, updated_at = ? WHERE id = ?').bind(title, provider, model, status, now, threadId).run();
    const row = await db.prepare('SELECT id, title, provider, model, created_at, updated_at, status, token_count FROM byok_threads WHERE id = ?').bind(threadId).first();
    return json({ ok: true, buildId: BUILD_ID, thread: threadJson(row) });
  } catch (error) {
    return json({ ok: false, buildId: BUILD_ID, error: error.message || String(error) }, { status: error.status || 500 });
  }
}

async function handleDeleteThread(threadId, env) {
  try {
    const db = dbRequired(env);
    const existing = await db.prepare('SELECT id FROM byok_threads WHERE id = ? AND status != ?').bind(threadId, 'deleted').first();
    if (!existing) return json({ ok: false, buildId: BUILD_ID, error: 'thread_not_found', threadId }, { status: 404 });
    const now = Date.now();
    await db.prepare('UPDATE byok_threads SET status = ?, updated_at = ? WHERE id = ?').bind('deleted', now, threadId).run();
    return json({ ok: true, buildId: BUILD_ID, deleted: true, threadId });
  } catch (error) {
    return json({ ok: false, buildId: BUILD_ID, error: error.message || String(error) }, { status: error.status || 500 });
  }
}

function chatHelp(env) {
  return json({
    ok: true,
    buildId: BUILD_ID,
    endpoint: '/api/byok/chat',
    method: 'POST',
    mode: 'non_streaming_text_until_step_5',
    supportedProviders: Object.keys(MODEL_OPTIONS),
    modelOptions: MODEL_OPTIONS,
    providerCapabilities: providerCapabilities(),
    mcpUrl: env.AFO_MCP_URL || DEFAULT_MCP_URL,
    threadEndpoints: {
      list: 'GET /api/byok/threads?limit=20&offset=0',
      create: 'POST /api/byok/threads',
      read: 'GET /api/byok/threads/:id',
      update: 'PATCH /api/byok/threads/:id',
      delete: 'DELETE /api/byok/threads/:id'
    },
    example: { provider: 'openai', model: MODEL_OPTIONS.openai[0], providerKey: 'request-only-token', prompt: 'Hello', maxTokens: 500 }
  });
}

function openAiText(raw) {
  return raw?.choices?.[0]?.message?.content || '';
}

async function callOpenAiCompatible(input, request, provider) {
  const config = provider === 'openai-compatible'
    ? { endpoint: required(input.baseUrl, 'baseUrl').replace(/\/$/, '') + '/chat/completions', defaultModel: 'custom-model' }
    : OPENAI_COMPATIBLE[provider];
  if (!config) throw new Error(`provider_not_supported:${provider}`);
  const credential = getCredential(input, request);
  const model = required(input.model || config.defaultModel, 'model');
  const prompt = required(input.prompt, 'prompt');
  const body = {
    model,
    messages: [{ role: 'user', content: prompt }],
    max_tokens: Math.max(1, Math.min(Number(input.maxTokens || 1000), 8000))
  };
  const upstream = await fetch(config.endpoint, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${credential}` },
    body: JSON.stringify(body)
  });
  const raw = await upstream.json().catch(() => ({}));
  if (!upstream.ok) {
    const error = raw.error?.message || raw.message || `${provider} API error ${upstream.status}`;
    return json({ ok: false, buildId: BUILD_ID, provider, model, error, raw }, { status: upstream.status });
  }
  return json({ ok: true, buildId: BUILD_ID, provider, model, text: openAiText(raw), raw });
}

async function callAnthropic(input, env, request) {
  const credential = getCredential(input, request);
  const model = required(input.model || env.DEFAULT_ANTHROPIC_MODEL || MODEL_OPTIONS.anthropic[0], 'model');
  const prompt = required(input.prompt, 'prompt');
  const upstream = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': credential, 'anthropic-version': env.ANTHROPIC_VERSION || DEFAULT_ANTHROPIC_VERSION },
    body: JSON.stringify({ model, max_tokens: Math.max(1, Math.min(Number(input.maxTokens || 1000), 8000)), messages: [{ role: 'user', content: prompt }] })
  });
  const raw = await upstream.json().catch(() => ({}));
  if (!upstream.ok) {
    const error = raw.error?.message || `Anthropic API error ${upstream.status}`;
    return json({ ok: false, buildId: BUILD_ID, provider: 'anthropic', model, error, raw }, { status: upstream.status });
  }
  const text = Array.isArray(raw.content) ? raw.content.filter((block) => block.type === 'text').map((block) => block.text || '').join('\n\n') : '';
  return json({ ok: true, buildId: BUILD_ID, provider: 'anthropic', model, text, raw });
}

async function callGemini(input, request) {
  const credential = getCredential(input, request);
  const model = required(input.model || MODEL_OPTIONS.gemini[0], 'model');
  const prompt = required(input.prompt, 'prompt');
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(credential)}`;
  const upstream = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: prompt }] }], generationConfig: { maxOutputTokens: Math.max(1, Math.min(Number(input.maxTokens || 1000), 8000)) } })
  });
  const raw = await upstream.json().catch(() => ({}));
  if (!upstream.ok) {
    const error = raw.error?.message || `Gemini API error ${upstream.status}`;
    return json({ ok: false, buildId: BUILD_ID, provider: 'gemini', model, error, raw }, { status: upstream.status });
  }
  const text = raw.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join('') || '';
  return json({ ok: true, buildId: BUILD_ID, provider: 'gemini', model, text, raw });
}

async function handleChat(request, env) {
  const input = await readJson(request);
  const provider = String(input.provider || 'anthropic').toLowerCase();
  try {
    if (provider === 'anthropic') return await callAnthropic(input, env, request);
    if (provider === 'gemini') return await callGemini(input, request);
    if (provider in OPENAI_COMPATIBLE || provider === 'openai-compatible') return await callOpenAiCompatible(input, request, provider);
    return json({ ok: false, buildId: BUILD_ID, error: `provider_not_supported:${provider}`, supported: Object.keys(MODEL_OPTIONS) }, { status: 400 });
  } catch (error) {
    return json({ ok: false, buildId: BUILD_ID, error: error.message || String(error) }, { status: 400 });
  }
}

function health(env) {
  return json({
    ok: true,
    buildId: BUILD_ID,
    name: 'afo-byok-agent-gateway',
    mode: 'ephemeral-provider-credential',
    supportedProviders: Object.keys(MODEL_OPTIONS),
    modelOptions: MODEL_OPTIONS,
    mcpUrl: env.AFO_MCP_URL || DEFAULT_MCP_URL,
    storesProviderCredentials: false,
    nativeToolAdapters: { anthropic: 'claude-tool-calling-basic', openai: 'function-calling', chatgpt: 'function-calling', gemini: 'function-calling' }
  });
}

function providersCheck() {
  return json({
    ok: true,
    buildId: BUILD_ID,
    mode: 'ephemeral-provider-credential',
    providers: providerCapabilities()
  });
}

function cairnstoneBase(env) {
  return String(env.CAIRNSTONE_URL || DEFAULT_CAIRNSTONE_URL).replace(/\/$/, '');
}

async function proxyCairn(path, requestInit, env) {
  const response = await fetch(`${cairnstoneBase(env)}${path}`, requestInit);
  const text = await response.text();
  return new Response(text, {
    status: response.status,
    headers: {
      'content-type': response.headers.get('content-type') || 'application/json; charset=utf-8',
      ...cors()
    }
  });
}

async function handleCairnProxy(request, env, url) {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors() });
  const suffix = url.pathname.replace('/api/cairn', '') || '/';
  if (request.method === 'GET' && suffix === '/health') return proxyCairn('/health', { method: 'GET' }, env);
  if (request.method === 'GET' && suffix === '/stones') return proxyCairn(`/v1/stones${url.search}`, { method: 'GET' }, env);
  if (request.method === 'GET' && suffix.startsWith('/stone/')) {
    const hash = encodeURIComponent(decodeURIComponent(suffix.slice('/stone/'.length)));
    return proxyCairn(`/v1/stones/${hash}`, { method: 'GET' }, env);
  }
  if (request.method === 'POST' && suffix === '/create-github') {
    return proxyCairn('/v1/stones/github', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(await readJson(request)) }, env);
  }
  if (request.method === 'POST' && suffix === '/query-expand') {
    return proxyCairn('/v1/query-expand', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(await readJson(request)) }, env);
  }
  return json({ ok: false, error: 'unknown_cairn_proxy_route', route: suffix }, { status: 404 });
}

function cairnStonesHtml(env) {
  const boot = JSON.stringify({
    buildId: BUILD_ID,
    cairnstoneUrl: cairnstoneBase(env),
    providers: Object.keys(MODEL_OPTIONS),
    modelOptions: MODEL_OPTIONS,
    labels: PROVIDER_LABELS
  }).replace(/</g, '\\u003c');
  return html(`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>AFO BYOK Stones</title><style>body{margin:0;background:#070b12;color:#eaf1ff;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif}main{max-width:1120px;margin:0 auto;padding:18px 12px}h1{font-size:30px;margin:0 0 8px}.muted{color:#9fb2d5;line-height:1.45}.grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}@media(max-width:860px){.grid{grid-template-columns:1fr}}.card,.stone{background:#0d1525;border:1px solid #253a5d;border-radius:18px;padding:14px;margin:10px 0}label{display:block;margin:10px 0 5px;color:#c1d1ed;font-size:13px;font-weight:700}select,input,textarea,button{width:100%;box-sizing:border-box;background:#07101e;color:#f6f9ff;border:1px solid #30486d;border-radius:11px;padding:10px;font:inherit}textarea{min-height:120px}button{margin-top:10px;border:0;background:#377dff;font-weight:800;cursor:pointer}.ok{background:#56e3ad;color:#06130c}.warn{background:#3b1019;border-color:#8a3143;color:#ffd9df}.links{display:flex;gap:10px;flex-wrap:wrap;margin:12px 0 16px}a{color:#9cc7ff}.pill{display:inline-flex;border:1px solid #2d466d;border-radius:999px;padding:3px 8px;margin:2px;color:#bfd2ef}.mono,pre{font-family:ui-monospace,Menlo,monospace;font-size:12px;white-space:pre-wrap;word-break:break-word}.text{white-space:pre-wrap;line-height:1.55}</style></head><body><main><h1>🪨 AFO BYOK Stones</h1><p class="muted">Proxy-mode CairnStone workbench inside your existing BYOK app. Create GitHub file stones, select stones, retrieve only matching chunks, then attach the retrieved context to BYOK chat.</p><div class="links"><a href="/">BYOK Chat</a><a href="/health">Health</a><a href="${cairnstoneBase(env)}/health" target="_blank">Cairn health</a><a href="${cairnstoneBase(env)}/v1/stones" target="_blank">Stones JSON</a></div><div class="grid"><section class="card"><h2>Stone Vault</h2><input id="q" placeholder="Search stones"><button class="ok" onclick="loadStones()">Load / Search Stones</button><button onclick="copySelected()">Copy selected hashes</button><label>Manual stone hashes</label><textarea id="manualHashes" placeholder="Paste one or more stone hashes here">ae60e6833ae2fc7121a2fabf331938df57c67c26dff59bfd733ff47ba71e0402</textarea><button onclick="useManualHashes()">Use manual hashes</button><div id="stats" class="muted">Loading...</div><pre id="debug" class="muted"></pre><div id="stones"></div></section><section class="card"><h2>Stone Brain</h2><label>Provider</label><select id="provider" onchange="fillModels()"></select><label>Model</label><select id="preset" onchange="syncModel()"></select><input id="model"><div id="baseWrap" style="display:none"><label>Base URL</label><input id="baseUrl" placeholder="https://provider.example/v1"></div><label>BYOK token</label><input id="token" type="password" autocomplete="off"><label>Question</label><textarea id="prompt">Review the selected stones and tell me what to inspect next.</textarea><label>Top K chunks per stone</label><input id="topK" type="number" min="1" max="5" value="1"><button class="ok" onclick="askStoneBrain()">Attach selected stones to chat</button><button onclick="queryOnly()">Query selected only</button><pre id="out">Select stones, then ask.</pre></section></div><section class="card"><h2>Create GitHub Stone</h2><div class="grid"><div><label>Owner</label><input id="owner" value="nothinginfinity"></div><div><label>Repo</label><input id="repo" placeholder="contractor-v005-dev"></div><div><label>Path</label><input id="path" placeholder="workers/name/file.js"></div><div><label>Ref</label><input id="ref" value="main"></div><div><label>Title</label><input id="title" placeholder="Repo file stone"></div><div><label>Author</label><input id="author" value="jared"></div></div><button class="ok" onclick="createStone()">Create stone server-side</button><pre id="created"></pre></section></main><script id="boot" type="application/json">${boot}</script><script>const BOOT=JSON.parse(document.getElementById('boot').textContent);const E=id=>document.getElementById(id);const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));let stones=[];let selected=new Set(JSON.parse(localStorage.getItem('cairn_selected_stones')||'[]'));function saveSel(){localStorage.setItem('cairn_selected_stones',JSON.stringify([...selected]))}function logDebug(msg,obj){const box=E('debug');if(!box)return;box.textContent='['+new Date().toLocaleTimeString()+'] '+msg+(obj?'\n'+JSON.stringify(obj,null,2):'')}function manualHashes(){return String(E('manualHashes')?.value||'').split(/[\s,]+/).map(x=>x.trim()).filter(x=>x.length>20)}function allHashes(){const merged=new Set([...selected,...manualHashes()]);return [...merged]}function useManualHashes(){for(const h of manualHashes())selected.add(h);saveSel();renderShare();E('out').textContent='Manual hashes ready:\n'+allHashes().join('\n')}function fillProviders(){E('provider').innerHTML=BOOT.providers.map(p=>'<option value="'+esc(p)+'">'+esc(BOOT.labels[p]||p)+'</option>').join('');fillModels()}function fillModels(){const p=E('provider').value;const ms=BOOT.modelOptions[p]||['custom-model'];E('preset').innerHTML=ms.map(m=>'<option value="'+esc(m)+'">'+esc(m)+'</option>').join('')+'<option value="custom">Custom</option>';E('model').value=ms[0]||'';E('baseWrap').style.display=p==='openai-compatible'?'block':'none'}function syncModel(){if(E('preset').value!=='custom')E('model').value=E('preset').value}function render(){E('stones').innerHTML=stones.map(s=>'<div class="stone"><label><input type="checkbox" '+(selected.has(s.hash)?'checked':'')+' onchange="this.checked?selected.add(\''+s.hash+'\'):selected.delete(\''+s.hash+'\');saveSel();renderShare()"> <b>'+esc(s.title||s.hash)+'</b></label><div class="muted">'+esc(s.repo||'')+' '+esc(s.path||'')+'</div><div class="mono">'+esc(s.hash)+'</div><span class="pill">refs '+esc(s.refs_count)+'</span><span class="pill">ratio '+esc(s.ratio)+'x</span><span class="pill">raw '+Number(s.original_bytes||0).toLocaleString()+'</span><div class="muted">'+esc(s.lod4||s.lod5||'')+'</div></div>').join('')||'<div class="stone muted">No stones found.</div>';renderShare()}function renderShare(){E('stats').textContent=stones.length+' stones loaded · '+allHashes().length+' selected/manual'}async function fetchJsonWithTimeout(url,options={},ms=12000){const ctrl=new AbortController();const timer=setTimeout(()=>ctrl.abort('timeout'),ms);try{const r=await fetch(url,{...options,cache:'no-store',signal:ctrl.signal});const text=await r.text();let d;try{d=JSON.parse(text)}catch{d={ok:false,error:'non_json_response',status:r.status,preview:text.slice(0,800)}}if(!r.ok&&d.ok!==false)d.ok=false;d.http_status=r.status;return d}finally{clearTimeout(timer)}}async function loadStones(){E('stats').textContent='Loading stones...';logDebug('Fetching stones from CairnStone',{url:BOOT.cairnstoneUrl+'/v1/stones'});try{let d=await fetchJsonWithTimeout(BOOT.cairnstoneUrl+'/v1/stones?q='+encodeURIComponent(E('q').value)+'&t='+Date.now());if(!d.ok){logDebug('Direct CairnStone load failed, trying same-origin proxy',d);d=await fetchJsonWithTimeout('/api/cairn/stones?q='+encodeURIComponent(E('q').value)+'&t='+Date.now())}if(!d.ok){E('stats').textContent='Stone list failed. Use manual hashes below.';E('stones').innerHTML='<div class="card warn">'+esc(JSON.stringify(d,null,2))+'</div>';return}stones=d.stones||[];logDebug('Loaded stones',{total:d.total,stones:stones.length});render()}catch(e){E('stats').textContent='Stone list failed. Use manual hashes below.';logDebug('Stone list exception',{message:e.message||String(e)});E('stones').innerHTML='<div class="card warn">'+esc(e.message||String(e))+'</div>'}}async function createStone(){E('created').textContent='Creating...';const body={owner:E('owner').value,repo:E('repo').value,path:E('path').value,ref:E('ref').value,title:E('title').value,author:E('author').value,metadata:{created_from:'afo_byok_stones'}};const d=await (await fetch(BOOT.cairnstoneUrl+'/v1/stones/github',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)})).json();E('created').textContent=JSON.stringify(d,null,2);if(d.stone_hash){selected.add(d.stone_hash);saveSel();await loadStones()}}async function retrieveContexts(){const q=E('prompt').value||'summary';const out=[];const hashes=allHashes();if(!hashes.length)throw new Error('Select a stone or paste a stone hash first.');for(const hash of hashes){logDebug('Querying stone',{hash,query:q});const d=await fetchJsonWithTimeout(BOOT.cairnstoneUrl+'/v1/query-expand',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({stone_hash:hash,query:q,top_k:Number(E('topK').value||1),context_lines:0,include_metadata:true})});out.push({hash,result:d})}return out}async function queryOnly(){E('out').textContent='Querying selected stones...';E('out').textContent=JSON.stringify(await retrieveContexts(),null,2)}async function askStoneBrain(){try{E('out').textContent='Retrieving stone context...';const contexts=await retrieveContexts();const contextText=contexts.map((c,i)=>'STONE '+(i+1)+' '+c.hash+'\\n'+(c.result.text||'No matching context.')).join('\\n\\n====\\n\\n');const prompt='Use the retrieved CairnStone context below. Cite stone hashes when useful.\\n\\n'+contextText+'\\n\\nUser question:\\n'+E('prompt').value;E('out').textContent='Calling BYOK chat...';const d=await fetchJsonWithTimeout('/api/byok/chat',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({provider:E('provider').value,model:E('model').value,baseUrl:E('baseUrl').value,providerKey:E('token').value,prompt,maxTokens:1200})},30000);E('out').innerHTML=d.ok!==false?'<div class="text">'+esc(d.text||'')+'</div><pre>'+esc(JSON.stringify(d,null,2))+'</pre>':'<pre>'+esc(JSON.stringify(d,null,2))+'</pre>'}catch(e){E('out').innerHTML='<pre>'+esc(e.message||String(e))+'</pre>';logDebug('Stone Brain exception',{message:e.message||String(e)})}}async function copySelected(){await navigator.clipboard.writeText([...selected].join('\\n'));alert('copied')}fillProviders();loadStones().catch(e=>{E('stones').innerHTML='<div class="card warn">'+esc(e.message||String(e))+'</div>'})</script></body></html>`);
}

export default {
  async fetch(request, env) {
    const cairnPathUrl = new URL(request.url);
    if (request.method === 'GET' && cairnPathUrl.pathname === '/stones') return cairnStonesHtml(env);
    if (cairnPathUrl.pathname.startsWith('/api/cairn/')) return handleCairnProxy(request, env, cairnPathUrl);
    const url = new URL(request.url);
    if (request.method === 'OPTIONS') return new Response(null, { headers: cors() });
    if (request.method === 'GET' && (url.pathname === '/' || url.pathname === '/app')) return appHtml(env);
    if (request.method === 'GET' && url.pathname === '/health') return health(env);
    if (request.method === 'GET' && url.pathname === '/api/byok/models') return json({ ok: true, buildId: BUILD_ID, providers: Object.keys(MODEL_OPTIONS), modelOptions: MODEL_OPTIONS });
    if (request.method === 'GET' && url.pathname === '/api/byok/providers/check') return providersCheck();
    if (request.method === 'GET' && url.pathname === '/api/byok/selftest') return handleSelfTest(request, env);
    if (request.method === 'GET' && url.pathname === '/api/byok/tools/check') return handleToolCheck(request, env);
    if (url.pathname === '/api/byok/threads' && request.method === 'GET') return handleListThreads(request, env);
    if (url.pathname === '/api/byok/threads' && request.method === 'POST') return handleCreateThread(request, env);
    const threadId = threadIdFromPath(url.pathname);
    if (threadId && request.method === 'GET') return handleGetThread(threadId, env);
    if (threadId && request.method === 'PATCH') return handlePatchThread(threadId, request, env);
    if (threadId && request.method === 'DELETE') return handleDeleteThread(threadId, env);
    if (request.method === 'GET' && url.pathname === '/api/byok/chat') return chatHelp(env);
    if (request.method === 'POST' && url.pathname === '/api/byok/chat') return handleChat(request, env);
    return json({ ok: false, buildId: BUILD_ID, error: 'not_found', path: url.pathname, method: request.method, available: ['GET /', 'GET /app', 'GET /health', 'GET /api/byok/models', 'GET /api/byok/providers/check', 'GET /api/byok/selftest', 'GET /api/byok/tools/check', 'GET /api/byok/threads', 'POST /api/byok/threads', 'GET /api/byok/threads/:id', 'PATCH /api/byok/threads/:id', 'DELETE /api/byok/threads/:id', 'GET /api/byok/chat', 'POST /api/byok/chat'] }, { status: 404 });
  }
};
