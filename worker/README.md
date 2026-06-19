# AFO.Agent Worker

This Worker is the first Cloudflare-facing shell for AFO.Agent.

## Routes

```txt
GET  /status
GET  /registry/tools
POST /registry/search
GET  /registry/tools/:id
POST /agent/:agentId/invoke
GET  /receipts
```

## Local dev

```bash
npm run worker:dev
```

## Example search

```bash
curl -X POST http://127.0.0.1:8787/registry/search -H 'content-type: application/json' -d '{"capability":"registry","riskMax":"read"}'
```

## Example invoke

```bash
curl -X POST http://127.0.0.1:8787/agent/agent.afo.lead/invoke -H 'content-type: application/json' -d '{"toolId":"registry.search","input":{"capability":"registry","riskMax":"read"},"purpose":"Find registry tools"}'
```
