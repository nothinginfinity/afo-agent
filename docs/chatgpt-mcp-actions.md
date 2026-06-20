# ChatGPT MCP and Actions Connection

AFO.Agent now exposes both an MCP-style endpoint and an OpenAPI fallback schema.

## Live endpoints

```txt
https://afo-agent-gateway.jaredtechfit.workers.dev/mcp
https://afo-agent-gateway.jaredtechfit.workers.dev/openapi.json
https://afo-agent-gateway.jaredtechfit.workers.dev/actions/openapi.json
```

## MCP tools

```txt
registry.search
registry.inspect
agent.invoke
receipts.list
```

The full live tool list is longer than this (GitHub/Cloudflare inspectors,
approvals, and the `orchestrator.*` routing tools) — call `GET /mcp` or
`GET /registry/tools` for the current set, or see
[`docs/orchestrator.md`](orchestrator.md) for the orchestrator layer specifically.

## OpenAPI fallback

The OpenAPI schema is committed at:

```txt
openapi/afo-agent-actions.json
```

It is also served live at:

```txt
/openapi.json
/.well-known/openapi.json
/actions/openapi.json
```

## Admin token protection

Write/admin routes require a bearer token.

Protected routes:

```txt
POST /agent/agent.afo.lead/invoke
POST /mcp tools/call when name is agent.invoke
/admin/*
```

The token can be sent as:

```txt
Authorization: Bearer <AFO_AGENT_ADMIN_TOKEN>
```

or:

```txt
X-AFO-Admin-Token: <AFO_AGENT_ADMIN_TOKEN>
```

## ChatGPT Actions setup

Use the live schema URL:

```txt
https://afo-agent-gateway.jaredtechfit.workers.dev/openapi.json
```

Set authentication to API Key or Bearer token and use the AFO admin token.
