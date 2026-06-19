# AFO.Agent

AFO.Agent is the lead-agent runtime for Agent Feed Optimization. It is designed to unify tools across local code, GitHub, Cloudflare Workers, Durable Objects, MCP servers, browser actions, and LLM-facing gateways.

The core idea is simple: agents should not hardcode every tool in their prompt. They should discover tools from a live registry, inspect schemas, pass policy checks, execute through a gateway, and write receipts.

```txt
AFO.Agent = lead cognitive router
Agent Definition = identity, mission, constraints
Tool Registry = expandable capability graph
Policy Engine = permission and risk boundary
Gateway = validated execution router
Receipts = audit trail for every tool call
Cloudflare Runtime = edge state, workers, DOs, queues, D1, R2
```

## Why this exists

Most agent systems bind tools directly into prompts or one-off runtime configs. That works for demos, but it breaks when you want many agents, many LLMs, many execution environments, and a growing tool universe.

AFO.Agent is intended to become the lead agent layer that lets ChatGPT, Claude, Grok, Gemini, local agents, Cloudflare Workers, and MCP tools work through the same discovery and execution contract.

## Current v0.1.0

This scaffold includes:

- typed `AfoAgent` intent shell
- in-memory `ToolRegistry`
- `AfoPolicy` risk and environment checks
- `AfoGateway` validated tool execution
- `ReceiptSink` audit logs
- `LeadAfoAgent` definition for orchestrating other agents
- example `ReleaseBlogger` agent
- example tool manifest
- Cloudflare Worker gateway scaffold
- D1 schema seed

## Install

```bash
npm install
```

## Run examples

```bash
npm run dev:lead
npm run dev:example
```

## Build

```bash
npm run build
```

## Worker dev

```bash
npm run worker:dev
```

## Worker routes

```txt
GET  /status
GET  /registry/tools
POST /registry/search
GET  /registry/tools/:id
POST /agent/:agentId/invoke
GET  /receipts
```

## Target architecture

```txt
LLM
  -> AFO.Agent
    -> registry.search(capability)
    -> registry.inspect(toolId)
    -> policy.evaluate(agent, tool, call)
    -> gateway.invoke(tool)
    -> receipts.write(event)
    -> result returned to LLM or agent
```

## Cloudflare direction

The Cloudflare version should use:

- Worker as public gateway
- Durable Object as stateful agent session
- D1 as tool registry and receipt index
- R2 as artifact and manifest storage
- Queues for async execution
- Containers for sandboxed code tools
- Vectorize for semantic tool discovery

See [`docs/cloudflare-runtime.md`](docs/cloudflare-runtime.md).

## Repo status

This repo is intentionally small. It is the seed of the lead-agent layer, not the final platform. The next step is to connect it to real AFO/MCP manifests and Cloudflare Worker endpoints.
