# Single-Connector Strategy

AFO.Agent should be the only MCP connector or ChatGPT Action a calling LLM needs.
Everything behind it — GitHub, Cloudflare, D1, future child agents — should grow
without the calling LLM's tool list growing.

## Why not just expose every backend tool directly

A flat MCP with one entry per backend capability (every GitHub endpoint, every
Cloudflare endpoint, every future integration) has two costs that compound as the
registry grows:

- **Context cost.** Every tool definition sits in the calling LLM's system prompt on
  every turn, whether or not it's relevant to the current task.
- **Drift cost.** Adding a backend tool means touching every client's connector
  config. A role or risk change means re-auditing every client integration that
  might call it directly.

## Why registry.search enables dynamic routing instead

The registry (`worker/standalone/index.js`'s `tools` array, synced from
`manifests/*.json` into D1 via `.github/workflows/sync-d1-manifests.yml`) is the
single place capabilities are declared. A calling LLM never needs to know `tools`
grew from 16 to 40 entries — it asks `registry.search` (directly, or through
`orchestrator.plan`/`orchestrator.route`) for a capability and gets back whatever
currently matches. New backend tools become usable the moment their manifest is
synced, with zero client-side connector changes.

## Why the exposed surface to ChatGPT/Claude should stay small and stable

The tools a calling LLM actually needs to see are:

```txt
registry.search
registry.inspect
orchestrator.plan
orchestrator.route
orchestrator.execute
orchestrator.explain
receipts.list
approvals.list / approvals.decide   (for the human/owner side, not every caller)
```

That list does not need to change as the backend grows. `orchestrator.execute`
is the one tool that actually causes anything to happen; everything else is
discovery, inspection, or audit. A calling LLM with just this surface can still
reach every read tool, every write tool, and every future child agent — it just
never has to be told their names in advance.

## How backend tools and child agents grow behind AFO.Agent

1. Add or edit a `manifests/*.json` file with the new tool's (or child agent's)
   manifest.
2. Add the matching handler branch inside `invokeTool` in
   `worker/standalone/index.js` (the manifest declares the contract; the handler
   implements it — both are required, the sync pipeline does not generate code).
3. Push to `main`. `sync-d1-manifests.yml` validates and syncs the manifest into
   D1's `tools` table.
4. The new tool is immediately findable via `registry.search`, rankable by
   `orchestrator.plan`, and (if its `risk`/`requiredRole` allow it for the caller)
   runnable by `orchestrator.execute` — with no change needed on the ChatGPT,
   Claude, or any other client side.

Child agents follow the same path once they're registered the way
`docs/agent-contract.md` describes: discoverable by capability, invoked or
delegated to the same way a tool is.

## Why role tokens and approvals are what make this safe to leave open-ended

Letting the tool surface grow without bound only works because growth doesn't mean
growth in what any given caller can *do*:

- Every tool still declares its own `risk` and `requiredRole` in its manifest.
  Growing the registry does not loosen those — a new `destructive`-risk tool is
  exactly as locked down as `cloudflare.worker.deployApply` is today.
- `orchestrator.execute` never silently downgrades a gate. If a tool is
  write/money/destructive, or the caller's role doesn't meet the bar, execute
  files an `approvals.request` instead of running it — see
  `docs/orchestrator.md` and `docs/auth-and-approvals.md`.
- Every call, planned or executed, approved or denied, writes a receipt. A bigger
  registry means a bigger audit surface, not a less-audited one.

In short: the *discovery* surface can grow freely because the *execution* surface
stays governed by the same role/risk/approval contract on every call, regardless of
how that call was reached — bespoke REST route, `/mcp`, or the generic
`/agent/agent.afo.lead/invoke` path.
