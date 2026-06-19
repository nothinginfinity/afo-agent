import { AgentRuntime } from "./types.js";
import { AfoGateway } from "./gateway.js";
import { AfoPolicy } from "./policy.js";
import { InMemoryReceiptSink } from "./receipts.js";
import { InMemoryToolRegistry } from "./registry.js";

export function createAfoRuntime(): AgentRuntime {
  const registry = new InMemoryToolRegistry();
  const policy = new AfoPolicy();
  const receipts = new InMemoryReceiptSink();
  const gateway = new AfoGateway(registry, policy, receipts);

  return { registry, policy, receipts, gateway };
}
