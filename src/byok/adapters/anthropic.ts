import type { ByokChatInput, ByokChatOutput, ByokToolCall, GatewayContext, ProviderAdapter } from '../types.js';

const ANTHROPIC_MESSAGES_URL = 'https://api.anthropic.com/v1/messages';
const DEFAULT_ANTHROPIC_VERSION = '2023-06-01';

function requireEphemeralKey(input: ByokChatInput): string {
  if (!input.providerKey) throw new Error('providerKey is required for ephemeral Anthropic BYOK mode');
  return input.providerKey;
}

function extractToolCalls(content: unknown[], provider: 'anthropic'): ByokToolCall[] {
  const calls: ByokToolCall[] = [];
  for (const block of content) {
    if (!block || typeof block !== 'object') continue;
    const item = block as Record<string, unknown>;
    if (item.type === 'mcp_tool_use' && typeof item.name === 'string') {
      calls.push({ provider, name: item.name, input: item.input });
    }
    if (item.type === 'mcp_tool_result') {
      calls.push({ provider, name: 'mcp_tool_result', output: item.content });
    }
    if (item.type === 'tool_use' && typeof item.name === 'string') {
      calls.push({ provider, name: item.name, input: item.input });
    }
  }
  return calls;
}

export class AnthropicMcpAdapter implements ProviderAdapter {
  id = 'anthropic' as const;

  async chat(input: ByokChatInput, context: GatewayContext): Promise<ByokChatOutput> {
    const providerKey = requireEphemeralKey(input);
    const mcpUrl = input.mcpUrl || context.mcpUrl;
    const mcpServer: Record<string, unknown> = {
      type: 'url',
      url: mcpUrl,
      name: 'afo-agent-gateway'
    };

    if (input.afoRoleToken || context.afoRoleToken) {
      mcpServer.headers = {
        authorization: `Bearer ${input.afoRoleToken || context.afoRoleToken}`
      };
    }

    const body = {
      model: input.model,
      max_tokens: input.maxTokens || 1000,
      messages: [{ role: 'user', content: input.prompt }],
      mcp_servers: [mcpServer]
    };

    const headers: Record<string, string> = {
      'content-type': 'application/json',
      'x-api-key': providerKey,
      'anthropic-version': context.anthropicVersion || DEFAULT_ANTHROPIC_VERSION
    };

    if (context.anthropicBeta) headers['anthropic-beta'] = context.anthropicBeta;

    const response = await fetch(ANTHROPIC_MESSAGES_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    });

    const raw = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message = typeof raw === 'object' && raw && 'error' in raw
        ? JSON.stringify((raw as Record<string, unknown>).error)
        : `Anthropic API error ${response.status}`;
      return {
        ok: false,
        provider: 'anthropic',
        model: input.model,
        content: [],
        raw,
        toolCalls: [],
        receipts: [],
        error: message
      };
    }

    const content = Array.isArray((raw as Record<string, unknown>).content)
      ? (raw as Record<string, unknown>).content as unknown[]
      : [];

    const toolCalls = extractToolCalls(content, 'anthropic');
    return {
      ok: true,
      provider: 'anthropic',
      model: input.model,
      content,
      raw,
      toolCalls,
      receipts: [{
        id: crypto.randomUUID(),
        provider: 'anthropic',
        model: input.model,
        status: 'executed',
        toolIds: toolCalls.map((call) => call.name),
        approvalIds: [],
        createdAt: new Date().toISOString()
      }]
    };
  }
}
