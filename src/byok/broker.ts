import type { ByokBrokerOptions, ByokChatInput, ByokChatOutput, ProviderAdapter } from './types.js';
import { AnthropicMcpAdapter } from './adapters/anthropic.js';

export class ByokBroker {
  private readonly adapters = new Map<string, ProviderAdapter>();
  private readonly options: ByokBrokerOptions;

  constructor(options: ByokBrokerOptions) {
    this.options = options;
    const configured = options.adapters || [new AnthropicMcpAdapter()];
    for (const adapter of configured) this.adapters.set(adapter.id, adapter);
  }

  listProviders(): string[] {
    return [...this.adapters.keys()].sort();
  }

  async chat(input: ByokChatInput): Promise<ByokChatOutput> {
    const adapter = this.adapters.get(input.provider);
    if (!adapter) {
      return {
        ok: false,
        provider: input.provider,
        model: input.model,
        content: [],
        toolCalls: [],
        receipts: [],
        error: `Unsupported BYOK provider: ${input.provider}`
      };
    }

    if (!input.prompt || !input.prompt.trim()) {
      return {
        ok: false,
        provider: input.provider,
        model: input.model,
        content: [],
        toolCalls: [],
        receipts: [],
        error: 'prompt is required'
      };
    }

    return adapter.chat(input, {
      mcpUrl: input.mcpUrl || this.options.mcpUrl,
      afoRoleToken: input.afoRoleToken,
      anthropicVersion: this.options.anthropicVersion,
      anthropicBeta: this.options.anthropicBeta
    });
  }
}

export function createByokBroker(options: ByokBrokerOptions): ByokBroker {
  return new ByokBroker(options);
}
