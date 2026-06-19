import { z } from "zod";
import { createAfoRuntime, LeadAfoAgent } from "../../src/index.js";

export class AfoAgentSession {
  state: DurableObjectState;

  constructor(state: DurableObjectState) {
    this.state = state;
  }

  async fetch() {
    return Response.json({ ok: true, type: "AfoAgentSession" });
  }
}

type Env = {
  AFO_DB?: D1Database;
  AFO_ARTIFACTS?: R2Bucket;
  AFO_AGENT_SESSION?: DurableObjectNamespace;
};

const runtime = createAfoRuntime();

runtime.registry.register({
  manifest: {
    id: "registry.search",
    name: "RegistrySearch",
    description: "Search the AFO tool registry from the Worker gateway.",
    capabilities: ["discover tools", "search registry", "list capabilities"],
    inputSchema: z.object({ capability: z.string(), riskMax: z.enum(["read", "network", "write", "money", "destructive"]).optional() }),
    outputSchema: z.object({ matches: z.array(z.object({ id: z.string(), name: z.string(), risk: z.string(), environment: z.string() })) }),
    permissions: ["registry:read"],
    environment: "worker",
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

async function readJson(request: Request) {
  try {
    return await request.json();
  } catch {
    return {};
  }
}

function notFound() {
  return Response.json({ ok: false, error: "not_found" }, { status: 404 });
}

function bindingStatus(env: Env) {
  return {
    d1: Boolean(env.AFO_DB),
    r2: Boolean(env.AFO_ARTIFACTS),
    durableObject: Boolean(env.AFO_AGENT_SESSION)
  };
}

export default {
  async fetch(request: Request, env: Env) {
    const url = new URL(request.url);
    const lead = LeadAfoAgent.bind(runtime);

    if (request.method === "GET" && url.pathname === "/status") {
      return Response.json({ ok: true, name: "afo-agent-gateway", version: "0.1.0", bindings: bindingStatus(env) });
    }

    if (request.method === "GET" && url.pathname === "/registry/tools") {
      return Response.json({ ok: true, tools: runtime.registry.list().map((tool) => tool.manifest) });
    }

    if (request.method === "POST" && url.pathname === "/registry/search") {
      const body = await readJson(request) as { capability?: string; riskMax?: "read" | "network" | "write" | "money" | "destructive" };
      return Response.json({ ok: true, tools: lead.discover({ capability: body.capability, riskMax: body.riskMax }) });
    }

    const inspectMatch = url.pathname.match(/^\/registry\/tools\/([^/]+)$/);
    if (request.method === "GET" && inspectMatch) {
      try {
        return Response.json({ ok: true, tool: lead.inspect(decodeURIComponent(inspectMatch[1])) });
      } catch (error) {
        return Response.json({ ok: false, error: error instanceof Error ? error.message : String(error) }, { status: 404 });
      }
    }

    const invokeMatch = url.pathname.match(/^\/agent\/([^/]+)\/invoke$/);
    if (request.method === "POST" && invokeMatch) {
      const body = await readJson(request) as { toolId?: string; input?: unknown; purpose?: string };
      if (!body.toolId || !body.purpose) {
        return Response.json({ ok: false, error: "toolId_and_purpose_required" }, { status: 400 });
      }
      try {
        const output = await lead.invoke({ toolId: body.toolId, input: body.input ?? {}, purpose: body.purpose });
        return Response.json({ ok: true, output, receipts: await runtime.receipts.list?.() });
      } catch (error) {
        return Response.json({ ok: false, error: error instanceof Error ? error.message : String(error) }, { status: 400 });
      }
    }

    if (request.method === "GET" && url.pathname === "/receipts") {
      return Response.json({ ok: true, receipts: await runtime.receipts.list?.() });
    }

    return notFound();
  }
};
