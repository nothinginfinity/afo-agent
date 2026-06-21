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
    },
    curl: 'curl -X POST https://afo-byok-agent-gateway.jaredtechfit.workers.dev/api/byok/chat -H "content-type: application/json" -d "{...}"'
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
    if (request.method === 'GET' && (url.pathname === '/' || url.pathname === '/health')) {
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
    return json({ ok: false, error: 'not_found', path: url.pathname, method: request.method, available: ['GET /health', 'GET /api/byok/models', 'GET /api/byok/chat', 'POST /api/byok/chat'] }, { status: 404 });
  }
};
