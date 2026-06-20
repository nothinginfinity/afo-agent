# BYOK AFO Agent Gateway

## What this is

The BYOK AFO Agent Gateway is a secure broker that lets a user bring their own LLM API keys and connect those models to the same AFO Agent Gateway tool layer.

A user should be able to choose a provider such as Anthropic, OpenAI, Google Gemini, xAI, DeepSeek, or another compatible model endpoint, enter their own key, and ask that model to use AFO Gateway tools through MCP or provider-native tool calling.

The core principle is simple:

```
User prompt
  -> BYOK Broker
    -> selected LLM provider
      -> AFO Agent Gateway tools
        -> receipts, approvals, policy, registry, Cloudflare/GitHub/D1 inspectors
```

The browser must never call provider APIs directly with long-lived API keys. Keys must be handled by a trusted backend or Cloudflare Worker.

## Why this matters

This turns AFO Agent Gateway into a universal tool backplane for many LLMs. Instead of building separate tool integrations for each model, AFO provides one registry, one policy layer, one approval system, and one receipt ledger. Provider-specific adapters translate model requests into AFO tool calls.

## MVP user experience

1. User opens the AFO Gateway Explorer.
2. User adds a provider key under BYOK settings.
3. User selects provider and model.
4. User enters a prompt.
5. Broker sends the prompt to the selected provider with AFO tools enabled.
6. Provider can call public/read/operator tools according to the user's role token.
7. Gateway writes receipts for tool invocations.
8. Approval-gated tools require an approval record before execution.

## Providers

### Phase 1

- Anthropic Claude through remote MCP support.
- OpenAI through Responses/API tool calling adapter.
- Google Gemini through function/tool adapter.

### Phase 2

- xAI Grok.
- DeepSeek.
- OpenRouter-compatible providers.
- Local/self-hosted OpenAI-compatible endpoints.

## Security model

### Key handling

Provider keys must be either:

- session-only and never stored, or
- encrypted before persistence, or
- stored in a dedicated secret manager.

For the Cloudflare Worker MVP, support two modes:

1. Ephemeral key mode: user submits provider key with each request over HTTPS. The Worker uses it for that request and does not persist it.
2. Stored key mode: Worker encrypts the key using a server-side encryption secret and stores ciphertext in D1.

Stored key mode requires:

- `BYOK_ENCRYPTION_SECRET`
- per-key random IV
- provider/account scoping
- never logging raw keys
- redacted receipts
- delete/revoke endpoint

### Gateway role tokens

AFO role tokens remain separate from provider API keys.

Provider API key answers: can this user call Anthropic/OpenAI/Gemini?
AFO role token answers: what AFO tools can this user access?

Roles:

- public: registry/status only
- read: read-only inspectors
- operator: receipts, approval requests, gated write attempts
- owner: approval decisions
- admin: emergency/root operator

### Receipts

Receipts should include:

- provider
- model
- tool ids used
- approval id if relevant
- status
- error class if failed
- redacted input/output summaries where needed

Receipts must never include raw provider keys.

## Runtime architecture

### `/api/byok/chat`

POST endpoint used by the frontend.

Input:

```json
{
  "provider": "anthropic",
  "model": "claude-sonnet-4-6",
  "prompt": "Search AFO for GitHub tools",
  "providerKey": "optional ephemeral key",
  "providerKeyId": "optional stored key id",
  "afoRoleToken": "optional role token",
  "stream": false
}
```

Output:

```json
{
  "ok": true,
  "provider": "anthropic",
  "model": "claude-sonnet-4-6",
  "content": [],
  "toolCalls": [],
  "receipts": []
}
```

### Provider adapters

Adapters normalize provider differences.

Required adapter interface:

```ts
interface ProviderAdapter {
  id: string;
  listModels(): Promise<ModelInfo[]>;
  chat(input: ByokChatInput, context: GatewayContext): Promise<ByokChatOutput>;
}
```

### AFO tools exposure

The broker should discover tools from:

- `https://afo-agent-gateway.jaredtechfit.workers.dev/mcp`
- `/registry/tools`
- `/registry/search`

The provider adapter should only expose tools allowed by the current AFO role.

## D1 tables

See `schemas/byok.sql`.

Core tables:

- `byok_provider_keys`
- `byok_sessions`
- `byok_chat_receipts`

## Frontend explorer

The explorer should include:

- provider selector
- model selector
- key mode selector: ephemeral or stored
- provider key input
- AFO role token input
- prompt textarea
- response blocks
- tool calls
- tool results
- raw JSON
- receipts

## Milestones

### Milestone 1: Safe BYOK proxy

- Add backend endpoint.
- Support Anthropic ephemeral key mode.
- Send AFO MCP URL to Anthropic.
- Render text/tool blocks.
- No key storage.

### Milestone 2: D1 key vault

- Add encrypted stored keys.
- Add key create/list/delete endpoints.
- Redact all keys in logs/receipts.

### Milestone 3: Multi-provider adapters

- Add OpenAI adapter.
- Add Gemini adapter.
- Add xAI/DeepSeek adapters.

### Milestone 4: Marketplace mode

- Users choose their preferred model.
- AFO tracks provider/model/tool usage.
- AFO receipts become billing/audit source.

## Non-negotiables

- Never expose provider keys in browser bundles.
- Never log raw keys.
- AFO role tokens are separate from provider keys.
- Approval-gated tools remain approval-gated regardless of provider.
- Deploy/write tools must remain scaffolded or approval-gated until hardened.
