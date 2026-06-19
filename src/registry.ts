import { RegisteredTool, riskRank, ToolRegistryLike, ToolSearchQuery } from "./types.js";

export class InMemoryToolRegistry implements ToolRegistryLike {
  private tools = new Map<string, RegisteredTool>();

  register<I, O>(tool: RegisteredTool<I, O>) {
    this.tools.set(tool.manifest.id, tool as RegisteredTool);
  }

  get(id: string) {
    return this.tools.get(id);
  }

  list() {
    return [...this.tools.values()];
  }

  search(query: ToolSearchQuery) {
    return this.list().filter((tool) => {
      const manifest = tool.manifest;
      const capabilityMatch = !query.capability ||
        manifest.capabilities.some((capability) => capability.toLowerCase().includes(query.capability!.toLowerCase())) ||
        manifest.description.toLowerCase().includes(query.capability.toLowerCase()) ||
        manifest.name.toLowerCase().includes(query.capability.toLowerCase());
      const environmentMatch = !query.environment || manifest.environment === query.environment;
      const riskMatch = !query.riskMax || riskRank[manifest.risk] <= riskRank[query.riskMax];
      const permissionMatch = !query.permissions || query.permissions.every((permission) => manifest.permissions.includes(permission));
      return capabilityMatch && environmentMatch && riskMatch && permissionMatch;
    });
  }
}
