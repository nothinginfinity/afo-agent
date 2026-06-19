# Registry Contract

The registry is the first-class expansion layer for AFO.Agent.

Agents do not permanently hardcode their full tool universe. They ask the registry what capabilities exist, inspect the chosen tool manifest, pass policy, and invoke through the gateway.

## Tool manifest shape

```ts
export type ToolManifest = {
  id: string;
  name: string;
  description: string;
  capabilities: string[];
  inputSchema: unknown;
  outputSchema: unknown;
  permissions: string[];
  environment: "local" | "cloudflare" | "github" | "browser" | "container" | "mcp" | "worker";
  risk: "read" | "network" | "write" | "money" | "destructive";
  version: string;
};
```

## Discovery flow

```txt
agent receives mission
agent searches registry by capability
agent inspects matching manifests
policy evaluates selected tool
agent invokes tool through gateway
gateway writes receipt
```

## Future registry sources

- local `manifests/*.json`
- remote MCP server manifests
- AFO tool index records
- Cloudflare D1 registry rows
- R2 manifest bundles
- GitHub repo manifests
- Vectorize semantic search results
