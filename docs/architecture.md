# AFO.Agent Architecture

AFO.Agent is the lead-agent layer for a multi-agent, multi-LLM tool network.

## Roles

### Lead Agent

The lead agent routes work. It discovers tools, child agents, and execution environments. It does not hardcode the full tool universe into its system prompt.

### Tool Registry

The registry is the expandable capability graph. Tools are registered by manifest. A future version should support local JSON manifests, remote MCP manifests, GitHub manifests, Cloudflare-hosted registries, and semantic search.

### Policy Engine

The policy engine decides whether an agent may use a tool based on environment, risk, permission, and purpose.

### Gateway

The gateway validates input schemas, executes handlers, validates output schemas, and writes receipts.

### Receipts

Receipts are the audit layer. Every tool call should have a request ID, agent ID, tool ID, purpose, result, and timestamp.

## Long-term shape

```txt
ChatGPT / Claude / Gemini / Grok / Local LLM
  -> AFO Lead Agent
    -> Tool Registry
    -> Policy Engine
    -> Gateway
    -> Tool Adapter
      -> Cloudflare Worker / MCP / GitHub / Browser / Local / Container
    -> Receipt Ledger
```
