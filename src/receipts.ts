import { ReceiptSink, ToolReceipt } from "./types.js";

export class InMemoryReceiptSink implements ReceiptSink {
  private receipts: ToolReceipt[] = [];

  write(receipt: ToolReceipt) {
    this.receipts.push(receipt);
  }

  list() {
    return [...this.receipts];
  }
}

export function createReceipt(input: Omit<ToolReceipt, "id" | "createdAt">): ToolReceipt {
  return {
    ...input,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString()
  };
}
