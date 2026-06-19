# Agent Contract

AFO.Agent separates agent identity from tool implementation.

## Agent definition

```ts
export type AgentDefinition = {
  id: string;
  name: string;
  mission: string;
  instructions: string;
  allowedEnvironments: ToolEnvironment[];
  maxRisk: ToolRisk;
  requiredReceipts: boolean;
};
```

## Lead agent role

The lead agent should:

- discover tools before use
- inspect schemas before invocation
- prefer read-only tools first
- route work to the smallest capable tool or child agent
- obey policy results as binding constraints
- require receipts for every tool call

## Child-agent direction

Child agents should become registry entries too. The lead agent should be able to discover a child agent by capability the same way it discovers a tool.

```txt
Lead Agent
  -> discover tool
  -> discover child agent
  -> delegate or invoke
  -> receipt
```
