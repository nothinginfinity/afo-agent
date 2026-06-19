import { z } from "zod";

export type ToolRisk = "read" | "network" | "write" | "money" | "destructive";
export type ToolEnvironment = "local" | "cloudflare" | "github" | "browser" | "container" | "mcp" | "worker";
export type ReceiptStatus = "denied" | "executed" | "failed";

export type ToolManifest<I = unknown, O = unknown> = {
  id: string;
  name: string;
  description: string;
  capabilities: string[];
  inputSchema: z.ZodType<I>;
  outputSchema: z.ZodType<O>;
  permissions: string[];
  environment: ToolEnvironment;
  risk: ToolRisk;
  version: string;
};

export type ToolExecutionContext = {
  agent: AgentDefinition;
  requestId: string;
  purpose: string;
};

export type ToolHandler<I = unknown, O = unknown> = (input: I, context: ToolExecutionContext) => Promise<O> | O;

export type RegisteredTool<I = unknown, O = unknown> = {
  manifest: ToolManifest<I, O>;
  handler: ToolHandler<I, O>;
};

export type ToolSearchQuery = {
  capability?: string;
  environment?: ToolEnvironment;
  riskMax?: ToolRisk;
  permissions?: string[];
};

export type AgentDefinition = {
  id: string;
  name: string;
  mission: string;
  instructions: string;
  allowedEnvironments: ToolEnvironment[];
  maxRisk: ToolRisk;
  requiredReceipts: boolean;
};

export type PolicyDecision = {
  allowed: boolean;
  reason: string;
};

export type ToolCall = {
  toolId: string;
  input: unknown;
  purpose: string;
};

export type ToolReceipt = {
  id: string;
  requestId: string;
  agentId: string;
  toolId: string;
  purpose: string;
  status: ReceiptStatus;
  reason?: string;
  input?: unknown;
  output?: unknown;
  error?: string;
  createdAt: string;
};

export type ReceiptSink = {
  write(receipt: ToolReceipt): Promise<void> | void;
  list?(): Promise<ToolReceipt[]> | ToolReceipt[];
};

export type ToolRegistryLike = {
  register<I, O>(tool: RegisteredTool<I, O>): void;
  get(id: string): RegisteredTool | undefined;
  search(query: ToolSearchQuery): RegisteredTool[];
  list(): RegisteredTool[];
};

export type PolicyLike = {
  evaluate(agent: AgentDefinition, tool: ToolManifest, call: ToolCall): PolicyDecision;
};

export type GatewayLike = {
  invoke(agent: AgentDefinition, call: ToolCall): Promise<unknown>;
};

export type AgentRuntime = {
  registry: ToolRegistryLike;
  policy: PolicyLike;
  gateway: GatewayLike;
  receipts: ReceiptSink;
};

export const riskRank: Record<ToolRisk, number> = {
  read: 1,
  network: 2,
  write: 3,
  money: 4,
  destructive: 5
};
