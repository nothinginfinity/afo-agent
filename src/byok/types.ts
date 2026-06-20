export type ByokProvider = 'anthropic' | 'openai' | 'gemini' | 'xai' | 'deepseek' | 'openai-compatible';
export type ByokCredentialMode = 'ephemeral' | 'stored';
export type AfoGatewayRole = 'public' | 'read' | 'operator' | 'owner' | 'admin';

export type ByokChatInput = {
  provider: ByokProvider;
  model: string;
  prompt: string;
  providerKey?: string;
  credentialId?: string;
  credentialMode?: ByokCredentialMode;
  afoRoleToken?: string;
  afoRole?: AfoGatewayRole;
  mcpUrl?: string;
  maxTokens?: number;
  stream?: boolean;
  metadata?: Record<string, unknown>;
};

export type ByokToolCall = {
  provider: ByokProvider;
  name: string;
  input?: unknown;
  output?: unknown;
};

export type ByokChatReceipt = {
  id: string;
  provider: ByokProvider;
  model: string;
  status: 'executed' | 'failed' | 'denied';
  toolIds: string[];
  approvalIds: string[];
  error?: string;
  createdAt: string;
};

export type ByokChatOutput = {
  ok: boolean;
  provider: ByokProvider;
  model: string;
  content: unknown[];
  raw?: unknown;
  toolCalls: ByokToolCall[];
  receipts: ByokChatReceipt[];
  error?: string;
};

export type GatewayContext = {
  mcpUrl: string;
  afoRoleToken?: string;
  anthropicVersion?: string;
  anthropicBeta?: string;
};

export type ProviderAdapter = {
  id: ByokProvider;
  chat(input: ByokChatInput, context: GatewayContext): Promise<ByokChatOutput>;
};

export type ByokBrokerOptions = {
  mcpUrl: string;
  anthropicVersion?: string;
  anthropicBeta?: string;
  adapters?: ProviderAdapter[];
};

export function redactCredential(value?: string): string | undefined {
  if (!value) return undefined;
  if (value.length <= 8) return '[redacted]';
  return `${value.slice(0, 4)}…${value.slice(-4)}`;
}
