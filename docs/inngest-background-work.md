# Inngest Background Work

Inngest is available for AFO.Agent background execution and trace events.

Current verified bindings:

```txt
INNGEST_API_KEY
INNGEST_EVENT_KEY
```

## Event names

The manifest sync pipeline emits:

```txt
afo.agent.manifest_sync.started
afo.agent.manifest_sync.completed
afo.agent.manifest_sync.failed
```

These events let us attach asynchronous background functions later without coupling them to GitHub Actions.

## Useful background jobs

```txt
manifest schema validation
D1 registry compaction
R2 receipt archive rollups
tool health checks
agent capability indexing
Vectorize manifest embedding
Cloudflare deployment verification
nightly receipt audit
```

## Recommended flow

```txt
GitHub push
  -> GitHub Action validates manifests
  -> GitHub Action syncs D1
  -> GitHub Action emits Inngest event
  -> Inngest runs background checks and enrichment
  -> AFO.Agent reads updated registry from D1
```
