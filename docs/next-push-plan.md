# Next Push Plan

This repo now has the lead-agent runtime seed. The next push should move from in-memory mocks into connected AFO infrastructure.

## Priority 1

Connect the registry to live manifests.

Targets:

- AFO tool index
- MCP manifest URLs
- GitHub repo manifests
- Cloudflare Worker hosted registry
- local JSON manifests

## Priority 2

Persist receipts.

Targets:

- D1 receipt index
- R2 large receipt artifacts
- request ID lookup route
- per-agent audit trail

## Priority 3

Create Cloudflare Worker registry API.

Routes:

```txt
GET  /status
GET  /registry/tools
POST /registry/search
GET  /registry/tools/:id
POST /agent/:agentId/invoke
GET  /receipts
GET  /receipts/:requestId
```

## Priority 4

Add adapters.

Adapters:

- GitHub file read/write
- Cloudflare Worker deploy plan
- AFO MCP tool lookup
- browser action adapter
- local container adapter

## Priority 5

Add child-agent registry.

The lead agent should discover child agents the same way it discovers tools.
