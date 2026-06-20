# AFO Agent Admin Token

`AFO_AGENT_ADMIN_TOKEN` protects write/admin routes.

Protected routes:

```txt
POST /agent/agent.afo.lead/invoke
POST /mcp tools/call when name is agent.invoke
/admin/*
```

Add this value as a Cloudflare Worker secret on `afo-agent-gateway`.

The Worker accepts either:

```txt
Authorization: Bearer <token>
```

or:

```txt
X-AFO-Admin-Token: <token>
```

Do not use `CF_API_TOKEN` as the admin token. Generate a separate random value and rotate it if it is exposed.
