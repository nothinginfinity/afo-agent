import { AgentDefinition, PolicyDecision, PolicyLike, riskRank, ToolCall, ToolManifest } from "./types.js";

export class AfoPolicy implements PolicyLike {
  evaluate(agent: AgentDefinition, tool: ToolManifest, call: ToolCall): PolicyDecision {
    if (!agent.allowedEnvironments.includes(tool.environment)) {
      return { allowed: false, reason: `environment_denied:${tool.environment}` };
    }

    if (riskRank[tool.risk] > riskRank[agent.maxRisk]) {
      return { allowed: false, reason: `risk_denied:${tool.risk}` };
    }

    if (!call.purpose || call.purpose.trim().length < 3) {
      return { allowed: false, reason: "purpose_required" };
    }

    return { allowed: true, reason: "allowed" };
  }
}
