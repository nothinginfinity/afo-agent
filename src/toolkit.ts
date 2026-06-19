import { z } from "zod";
import { AgentRuntime } from "./types.js";

export function registerDefaultAfoTools(runtime: AgentRuntime) {
  runtime.registry.register({
    manifest: {
      id: "registry.search",
      name: "RegistrySearch",
      description: "Search the live AFO tool registry for tools and child agents by capability.",
      capabilities: ["discover tools", "search tool registry", "find child agents", "list capabilities"],
      inputSchema: z.object({ capability: z.string(), riskMax: z.enum(["read", "network", "write", "money", "destructive"]).optional() }),
      outputSchema: z.object({ matches: z.array(z.object({ id: z.string(), name: z.string(), risk: z.string(), environment: z.string() })) }),
      permissions: ["registry:read"],
      environment: "mcp",
      risk: "read",
      version: "0.1.0"
    },
    handler: async (input) => ({
      matches: runtime.registry.search({ capability: input.capability, riskMax: input.riskMax }).map((tool) => ({
        id: tool.manifest.id,
        name: tool.manifest.name,
        risk: tool.manifest.risk,
        environment: tool.manifest.environment
      }))
    })
  });

  runtime.registry.register({
    manifest: {
      id: "cloudflare.worker.deployPlan",
      name: "CloudflareWorkerDeployPlan",
      description: "Create a safe deployment plan for a Cloudflare Worker without deploying it.",
      capabilities: ["plan cloudflare worker", "edge worker planning", "deployment planning"],
      inputSchema: z.object({ workerName: z.string(), purpose: z.string() }),
      outputSchema: z.object({ workerName: z.string(), steps: z.array(z.string()) }),
      permissions: ["cloudflare:plan"],
      environment: "cloudflare",
      risk: "read",
      version: "0.1.0"
    },
    handler: async (input) => ({
      workerName: input.workerName,
      steps: [
        "load tool manifests",
        "bind Durable Object session state",
        "bind D1 registry index",
        "bind R2 manifest storage",
        "route tool calls through policy gateway",
        "write receipts"
      ]
    })
  });
}
