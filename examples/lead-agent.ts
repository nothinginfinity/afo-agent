import { createAfoRuntime, LeadAfoAgent, registerDefaultAfoTools } from "../src/index.js";

const runtime = createAfoRuntime();
registerDefaultAfoTools(runtime);

const lead = LeadAfoAgent.bind(runtime);

console.log(lead.systemPrompt());
console.log(await lead.invoke({
  toolId: "registry.search",
  input: { capability: "cloudflare worker", riskMax: "read" },
  purpose: "Find edge runtime planning tools"
}));
console.log(await lead.invoke({
  toolId: "cloudflare.worker.deployPlan",
  input: { workerName: "afo-agent-gateway", purpose: "LLM-facing tool gateway" },
  purpose: "Plan first Cloudflare AFO gateway"
}));
console.log(await runtime.receipts.list?.());
