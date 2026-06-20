# Orchestrator Layer

The orchestrator is the routing brain in front of the registry. It turns a natural
language task into a concrete, policy-checked tool call, without making the calling
LLM aware of which backend tool actually ran.

```txt
User/task input
  -> extractCapability(task)
  -> registry.search(capability, riskMax)
  -> rankCandidates(...)
  -> registry.inspect(selected tool)        (orchestrator.route)
  -> evaluate role, risk, environment, approval
  -> if safe/read + role satisfied: agent.invoke
  -> if write/money/destructive or role-restricted: approvals.request
  -> write receipt
  -> return result + receipt summary
```

It does not bypass any existing layer. `orchestrator.execute` calls the same
`invokeTool` / `createApproval` / `writeReceipt` functions that `agent.invoke` and
`approvals.request` already use. It is a routing convenience, not a new privilege
boundary.

## Tools

| Tool | Risk | Required role | Ever invokes? |
| --- | --- | --- | --- |
| `orchestrator.plan` | read | public | No |
| `orchestrator.route` | read | public | No |
| `orchestrator.execute` | write | operator | Yes (or files an approval) |
| `orchestrator.explain` | read | operator | No (reads receipts only) |

## orchestrator.plan

Input: `{ task, riskMax?, environment?, requiredRole?, requireApproval?, dryRun? }`

Never invokes anything. It extracts a capability phrase, searches the live
registry, ranks the matches, and returns:

- `capability` — the cleaned phrase used for the search
- `candidates` — top 5 ranked tools with a numeric score and human-readable reasons
- `selected` — the top candidate's summary, or `null` if nothing matched
- `riskSummary` — risk tier, required role, whether the caller's role satisfies it,
  whether the tool is within the lead agent's `maxRisk`
- `approvalRequired` — whether `orchestrator.execute` would have to file an approval
  instead of running it directly
- `proposedNextAction` — a plain-text suggestion for what to call next

## orchestrator.route

Input: `{ task, toolId?, riskMax?, environment?, requiredRole? }`

Same search and ranking as `plan`, but commits to one tool (either the top-ranked
candidate, or an explicit `toolId` you already know you want) and returns its full
manifest, mirroring `registry.inspect`. Still never invokes. Useful when a caller
already has a rough idea what it wants and just needs the policy evaluation before
deciding whether to call `execute`.

## orchestrator.execute

Input: `{ task, input?, riskMax?, environment?, requiredRole? }`

1. Calls `plan` internally to select a tool.
2. If no tool matched: returns `{ executed: false, reason: "no_matching_tool" }`.
3. If the tool is `write`/`money`/`destructive` risk, **or** the caller's role does
   not satisfy the tool's `requiredRole`, **or** the tool manifest sets
   `requiresApproval: true`: it calls `approvals.request` on the caller's behalf and
   returns `{ executed: false, approvalRequired: true, approval }`. It never tries to
   force execution past a role or risk gate.
4. Otherwise it calls `agent.invoke` equivalent logic (`invokeTool`) directly and
   returns `{ executed: true, result, innerReceiptId }`.

`orchestrator.execute` itself requires the `operator` role to be called at all — the
same floor as `agent.invoke`. Routing through the orchestrator does not lower that
bar.

Every run writes one receipt with `toolId: 'orchestrator.execute'` whose `output`
carries the original task, the extracted capability, the candidates considered, the
selected tool, and either the result, the approval record, or a `reason` string. If
the selected tool actually ran, that tool's own normal receipt is also written, so
the audit trail shows both "orchestrator decided to run X" and "X ran."

## orchestrator.explain

Input: `{ requestId }`

Looks up receipts by `request_id` (indexed in `schemas/d1.sql`) and returns a
plain-English `summary` line plus the raw, JSON-parsed receipt rows. Useful for a
human or a calling agent to ask "what actually happened with run abc-123" without
re-deriving it from raw receipt JSON.

## Capability extraction (current implementation)

`extractCapability` is intentionally simple and deterministic — no LLM call:

1. Lowercase the task, strip punctuation.
2. Remove a small stopword list (`the`, `please`, `can`, `my`, ...).
3. Join the remaining words into a phrase and use it as a `registry.search` query.

`searchCandidates` improves recall on top of that: it first tries the full phrase
against `registry.search`, and if that comes back empty (or to broaden the
candidate pool), it also searches each significant word individually and merges the
results, tracking how many of the words each tool actually matched. `rankCandidates`
uses that hit ratio as the strongest scoring signal, then layers in risk tier, role
fit, environment fit, manifest completeness, and the `requiresApproval` flag — each
with a reason string attached so a plan/route response is self-explanatory.

## Known follow-ups

- There is no minimum-score cutoff yet — a task with no real match still returns the
  least-bad candidate rather than `selected: null`. Worth adding a threshold once
  there's a feel for real score distributions across a bigger registry.
- `network` risk is currently treated as "safe enough to execute directly" alongside
  `read`, since no shipped tool uses that tier yet. Revisit `approvalRequiredFor` if
  that assumption stops holding.
- If `orchestrator.execute` routes to an approval, there's no automatic re-execution
  once an owner approves it — the caller (or a future `orchestrator.resume`) still
  has to invoke the tool again with the approved `approvalId`, the same as any other
  approval-gated tool today.
- Capability extraction has no synonym or embedding layer. A Vectorize-backed
  semantic search (already on the long-term roadmap in `docs/registry-contract.md`)
  would be a natural upgrade path without changing the orchestrator's public shape.

## Routes

```txt
POST /orchestrator/plan      (public)
POST /orchestrator/route     (public)
POST /orchestrator/execute   (operator role token required)
```

All four tools are also callable through `POST /mcp` (`tools/call`) and through the
generic `POST /agent/agent.afo.lead/invoke` route, with identical role gating —
the bespoke REST routes above are thin wrappers around the same `invokeTool`
dispatch, not a separate code path. There is no bespoke `/orchestrator/explain`
route by design; call it via `/mcp` or `/agent/agent.afo.lead/invoke` with
`toolId: "orchestrator.explain"`.
