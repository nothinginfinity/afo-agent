# AFO.Agent Gateway Auth and Approval Model

This gateway uses role tokens at the HTTP boundary before any tool invocation is allowed.

## Roles

- `public`: status, registry search, registry inspect.
- `read`: read-only inspector tools such as GitHub file/repo reads and Cloudflare inventory reads.
- `operator`: receipt reads, approval requests, and write-risk tools that still require approval.
- `owner`: approval decisions and future money/destructive gates.
- `admin`: treated as elevated admin for admin routes and all lower roles.

## Worker secrets

Set these on the Worker before broad use:

- `AFO_AGENT_READ_TOKEN`
- `AFO_AGENT_OPERATOR_TOKEN`
- `AFO_AGENT_OWNER_TOKEN`
- `AFO_AGENT_ADMIN_TOKEN`
- `GITHUB_TOKEN`
- `CF_API_TOKEN`
- `CF_ACCOUNT_ID`
- `AFO_AGENT_D1_DATABASE_ID`

The gateway also expects the existing bindings:

- `AFO_DB`
- `AFO_ARTIFACTS`

## Approval flow

1. Operator calls `approvals.request` with `toolId`, `purpose`, and `input`.
2. Owner reviews pending approvals through `approvals.list`.
3. Owner calls `approvals.decide` with `approved` or `rejected`.
4. Operator calls the write-risk tool with the `approvalId`.
5. The gateway verifies the approval before returning an apply result.

## Safety rule

`cloudflare.worker.deployApply` is intentionally a scaffold in v0.2.0. It verifies approval and returns `approved_but_not_executed`. The actual deployment should still happen through a binding-preserving Cloudflare deploy MCP until the gateway has a hardened native deploy executor.

## Public routes

`/status`, `/registry/tools`, `/registry/search`, `/registry/tools/:id`, `/mcp`, and `/openapi.json` remain public/read oriented. Invocation, receipts, approvals, and admin routes are role-gated.
