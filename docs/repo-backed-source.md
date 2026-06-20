# Repo-Backed Worker Source

The live `afo-agent-gateway` Worker is now tracked in this repository at:

```txt
worker/standalone/index.js
```

This file is the deployable edge runtime source for the current hardened Worker.

## Deployment target

```txt
script_name: afo-agent-gateway
compatibility_date: 2026-06-19
workers.dev: enabled
```

## Required bindings

```txt
AFO_AGENT_VERSION = plain_text
AFO_DB = D1 database binding for afo-agent-db
AFO_ARTIFACTS = R2 bucket binding for afo-agent-artifacts
```

## Live routes

```txt
GET  /status
GET  /registry/tools
POST /registry/search
GET  /registry/tools/:id
POST /agent/agent.afo.lead/invoke
GET  /receipts
```

## Source of truth direction

GitHub should become the source of truth for:

- Worker source
- tool manifests
- schema migrations
- deploy receipts
- registry sync scripts
- GitHub Actions CI

D1 should become the live runtime registry and receipt index.
R2 should become the artifact and long-form receipt archive.
