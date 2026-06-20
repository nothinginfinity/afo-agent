CREATE TABLE IF NOT EXISTS approvals (
  id TEXT PRIMARY KEY,
  request_id TEXT,
  agent_id TEXT,
  tool_id TEXT NOT NULL,
  purpose TEXT NOT NULL,
  input_json TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  requested_by TEXT,
  decided_by TEXT,
  decision_reason TEXT,
  created_at TEXT NOT NULL,
  decided_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_approvals_status ON approvals(status);
CREATE INDEX IF NOT EXISTS idx_approvals_tool ON approvals(tool_id);
CREATE INDEX IF NOT EXISTS idx_approvals_created ON approvals(created_at);
