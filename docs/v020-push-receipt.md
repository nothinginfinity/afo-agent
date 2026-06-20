# v0.2 GitZip Push Receipt

Files pushed through GitZip:

- `worker/standalone/index.js`
- `manifests/inspectors.read.json`
- `schemas/approvals.sql`
- `docs/auth-and-approvals.md`

Local validation before push:

- `node --check worker/standalone/index.js`

Status:

- source committed to `main`
- deploy not yet run
- D1 approvals schema not yet applied
- Cloudflare preserve-bindings deploy still required
