import { z } from "zod";
import { createAfoRuntime, defineAgent } from "../src/index.js";

const ReleaseBlogger = defineAgent({
  id: "agent.afo.release-blogger",
  name: "Release Blogger",
  mission: "Create clean release posts by discovering repository tools instead of hardcoding them into the prompt.",
  instructions: [
    "Find the latest release context using read-only tools first.",
    "Inspect files and diffs only after discovering matching tools.",
    "Create a draft only through policy-approved write tools.",
    "Write receipts for all tool calls."
  ].join("\n"),
  allowedEnvironments: ["local", "github", "container", "mcp"],
  maxRisk: "write",
  requiredReceipts: true
});

const runtime = createAfoRuntime();

runtime.registry.register({
  manifest: {
    id: "repo.readFile",
    name: "ReadFile",
    description: "Read a repository file by path.",
    capabilities: ["read repository files", "inspect source", "read docs"],
    inputSchema: z.object({ path: z.string() }),
    outputSchema: z.object({ path: z.string(), content: z.string() }),
    permissions: ["repo:read"],
    environment: "github",
    risk: "read",
    version: "0.1.0"
  },
  handler: async (input) => ({ path: input.path, content: `mock content for ${input.path}` })
});

runtime.registry.register({
  manifest: {
    id: "repo.writeFile",
    name: "WriteFile",
    description: "Write a repository file by path.",
    capabilities: ["write repository files", "create docs", "create release post"],
    inputSchema: z.object({ path: z.string(), content: z.string() }),
    outputSchema: z.object({ path: z.string(), written: z.boolean() }),
    permissions: ["repo:write"],
    environment: "github",
    risk: "write",
    version: "0.1.0"
  },
  handler: async (input) => ({ path: input.path, written: true })
});

const agent = ReleaseBlogger.bind(runtime);

const tools = agent.discover({ capability: "repository files", riskMax: "read" });
console.log(tools);
console.log(await agent.invoke({
  toolId: "repo.readFile",
  input: { path: "CHANGELOG.md" },
  purpose: "Read release notes before drafting"
}));
console.log(await agent.invoke({
  toolId: "repo.writeFile",
  input: { path: "website/src/content/releases/example.md", content: "# Example Release" },
  purpose: "Create release post draft"
}));
console.log(await runtime.receipts.list?.());
