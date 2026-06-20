const DEFAULT_MCP_URL = 'https://afo-agent-gateway.jaredtechfit.workers.dev/mcp';
const DEFAULT_ANTHROPIC_VERSION = '2023-06-01';

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

async function callAnthropic(input, env, request) {
  const providerKey = required(input.providerKey || request.headers.get('authorization')?.replace(/^Bearer\s+/i, ''), 'providerKey');
  const model = required(input.model || env.DEFAULT_ANTHROPIC_MODEL || 'claude-sonnet-4-6', 'model');
  const prompt = required(input.prompt, 'prompt');
  const mcpUrl = input.mcpUrl || env.AFO_MCP_URL || DEFAULT_MCP_URL;
  const afoRoleToken = input.afoRoleToken || request.headers.get('x-afo-role-token') || env.AFO_AGENT_READ_TOKEN || '';

  const mcpServer = {
    type: 'url',
    url: mcpUrl,
    name: 'afo-agent-gateway'
  };

  if (afoRoleToken) {
    mcpServer.headers = {
      authorization: `Bearer ${afoRoleToken}`
    };
  }

  const headers = {
    'content-type': 'application/json',
    'x-api-key': providerKey,
    'anthropic-version': env.ANTHROPIC_VERSION || DEFAULT_ANTHROPIC_VERSION
  };

  if (env.ANTHROPIC_BETA) headers['anthropic-beta'] = env.ANTHROPIC_BETA;

  const body = {
    model,
    max_tokens: Math.max(1, Math.min(Number(input.maxTokens || 1000), 8000)),
    messages: [{ role: 'user', content: prompt }],
    mcp_servers: [mcpServer]
  };

  const upstream = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers,
    body: JSON.stringify(body)
  });

  const raw = await upstream.json().catch(() => ({}));
  if (!upstream.ok) {
    return json({ ok: false, provider: 'anthropic', model, error: raw.error?.message || `Anthropic API error ${upstream.status}`, raw }, { status: upstream.status });
  }

  const content = Array.isArray(raw.content) ? raw.content : [];
  const toolCalls = extractToolCalls(content);
  return json({
    ok: true,
    provider: 'anthropic',
    model,
    content,
    toolCalls,
    raw,
    receipts: [{
      id: crypto.randomUUID(),
      provider: 'anthropic',
      model,
      status: 'executed',
      toolIds: toolCalls.map((call) => call.name).filter(Boolean),
      approvalIds: [],
      createdAt: new Date().toISOString()
    }]
  });
}

async function handleChat(request, env) {
  const input = await readJson(request);
  const provider = input.provider || 'anthropic';
  if (provider !== 'anthropic') {
    return json({ ok: false, error: `provider_not_supported_yet:${provider}`, supported: ['anthropic'] }, { status: 400 });
  }
  try {
    return await callAnthropic(input, env, request);
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
        mode: 'ephemeral-provider-key',
        supportedProviders: ['anthropic'],
        mcpUrl: env.AFO_MCP_URL || DEFAULT_MCP_URL,
        storesProviderKeys: false
      });
    }
    if (request.method === 'POST' && url.pathname === '/api/byok/chat') return handleChat(request, env);
    return json({ ok: false, error: 'not_found' }, { status: 404 });
  }
};
