# Manifest Sync Pipeline

The manifest sync pipeline turns `manifests/*.json` into live AFO.Agent runtime data.

## Source

```txt
manifests/*.json
```

A file may contain one of these shapes:

```txt
ToolManifest
ToolManifest[]
AgentDefinition
{ tools: ToolManifest[], agents: AgentDefinition[] }
```

## Validation

The sync script validates required fields before touching D1.

Tool manifests require:

```txt
id
name
description
capabilities
permissions
environment
risk
version
```

Risk must be one of:

```txt
read
network
write
money
destructive
```

Environment must be one of:

```txt
local
cloudflare
github
browser
container
mcp
worker
```

## Runtime sync

The GitHub Action runs on push to `main` when manifests or the sync script change.

It executes:

```txt
npm run manifests:validate
npm run manifests:sync
```

## Required GitHub secrets

```txt
CF_ACCOUNT_ID
CF_API_TOKEN
AFO_AGENT_D1_DATABASE_ID
INNGEST_EVENT_KEY
```

`INNGEST_EVENT_KEY` is optional for D1 sync, but required for background event traces.

## D1 targets

```txt
agents
tools
receipts
```

The sync writes a receipt with:

```txt
tool_id = github.manifestSync
status = executed
reason = manifest_sync_completed
```
