import { AgentDefinition, AgentRuntime, ToolCall, ToolSearchQuery } from "./types.js";

export class AfoAgent {
  constructor(readonly definition: AgentDefinition, private runtime: AgentRuntime) {}

  systemPrompt() {
    return [
      `Agent: ${this.definition.name}`,
      `Mission: ${this.definition.mission}`,
      this.definition.instructions,
      "Discover tools through the registry before execution.",
      "Inspect tool schemas before invoking tools.",
      "Prefer read-only tools before write tools.",
      "Every tool call must include a purpose.",
      "Every execution must produce a receipt."
    ].join("\n\n");
  }

  discover(query: ToolSearchQuery) {
    return this.runtime.registry.search(query).map((tool) => tool.manifest);
  }

  inspect(toolId: string) {
    const tool = this.runtime.registry.get(toolId);
    if (!tool) throw new Error("tool_not_found");
    return tool.manifest;
  }

  invoke(call: ToolCall) {
    return this.runtime.gateway.invoke(this.definition, call);
  }
}

export function defineAgent(definition: AgentDefinition) {
  return {
    bind(runtime: AgentRuntime) {
      return new AfoAgent(definition, runtime);
    }
  };
}
