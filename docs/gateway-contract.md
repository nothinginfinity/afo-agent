# Gateway Contract

The gateway is the execution boundary between agents and tools.

It should:

- resolve tool ID to manifest and handler
- validate input schema
- run policy before execution
- execute the handler
- validate output schema
- write a receipt
- return structured output or structured error

## Flow

```txt
ToolCall
  -> registry.get(toolId)
  -> policy.evaluate(agent, tool, call)
  -> inputSchema.parse(input)
  -> handler(input, context)
  -> outputSchema.parse(output)
  -> receipts.write(receipt)
```

## Failure modes

```txt
tool_not_found
purpose_required
environment_denied:<environment>
risk_denied:<risk>
input_schema_error
output_schema_error
handler_error
```
