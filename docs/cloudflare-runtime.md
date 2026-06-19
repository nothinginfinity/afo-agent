# Cloudflare Runtime Plan

AFO.Agent should be deployable as a Cloudflare-native lead agent runtime.

## Components

### Worker

The Worker is the public HTTP gateway for LLMs and agents.

Suggested routes:

```txt
GET  /status
GET  /registry/tools
POST /registry/search
GET  /registry/tools/:id
POST /agent/:agentId/invoke
GET  /receipts/:requestId
```

### Durable Object

The Durable Object holds session state for an agent conversation or tool workflow.

### D1

D1 stores registry metadata, agent definitions, policies, and receipt indexes.

### R2

R2 stores large manifests, artifacts, generated files, logs, and release bundles.

### Queues

Queues run long tool jobs asynchronously.

### Containers

Containers run sandboxed shell, code, build, or browser tools.

### Vectorize

Vectorize can power semantic tool discovery over manifests and capabilities.

## First Worker target

The first Worker should expose a tool-registry API and a safe invoke endpoint. It should not deploy arbitrary tools yet. It should only route to registered mock tools until policy and receipts are stable.
