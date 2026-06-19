import { AgentDefinition, GatewayLike, PolicyLike, ReceiptSink, ToolCall, ToolRegistryLike } from "./types.js";
import { createReceipt } from "./receipts.js";

export class AfoGateway implements GatewayLike {
  constructor(
    private registry: ToolRegistryLike,
    private policy: PolicyLike,
    private receipts: ReceiptSink
  ) {}

  async invoke(agent: AgentDefinition, call: ToolCall) {
    const requestId = crypto.randomUUID();
    const tool = this.registry.get(call.toolId);

    if (!tool) {
      await this.receipts.write(createReceipt({
        requestId,
        agentId: agent.id,
        toolId: call.toolId,
        purpose: call.purpose,
        status: "failed",
        reason: "tool_not_found",
        input: call.input
      }));
      throw new Error("tool_not_found");
    }

    const decision = this.policy.evaluate(agent, tool.manifest, call);

    if (!decision.allowed) {
      await this.receipts.write(createReceipt({
        requestId,
        agentId: agent.id,
        toolId: call.toolId,
        purpose: call.purpose,
        status: "denied",
        reason: decision.reason,
        input: call.input
      }));
      throw new Error(decision.reason);
    }

    const parsedInput = tool.manifest.inputSchema.parse(call.input);

    try {
      const rawOutput = await tool.handler(parsedInput, { agent, requestId, purpose: call.purpose });
      const output = tool.manifest.outputSchema.parse(rawOutput);
      await this.receipts.write(createReceipt({
        requestId,
        agentId: agent.id,
        toolId: call.toolId,
        purpose: call.purpose,
        status: "executed",
        reason: decision.reason,
        input: parsedInput,
        output
      }));
      return output;
    } catch (error) {
      await this.receipts.write(createReceipt({
        requestId,
        agentId: agent.id,
        toolId: call.toolId,
        purpose: call.purpose,
        status: "failed",
        reason: decision.reason,
        input: parsedInput,
        error: error instanceof Error ? error.message : String(error)
      }));
      throw error;
    }
  }
}
