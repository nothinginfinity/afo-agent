CREATE TABLE IF NOT EXISTS byok_credentials (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  provider TEXT NOT NULL,
  label TEXT,
  ciphertext TEXT,
  credential_hint TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_used_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_byok_credentials_user ON byok_credentials(user_id);
CREATE INDEX IF NOT EXISTS idx_byok_credentials_provider ON byok_credentials(provider);
CREATE INDEX IF NOT EXISTS idx_byok_credentials_status ON byok_credentials(status);

CREATE TABLE IF NOT EXISTS byok_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  credential_id TEXT,
  credential_mode TEXT NOT NULL DEFAULT 'ephemeral',
  afo_role TEXT NOT NULL DEFAULT 'public',
  status TEXT NOT NULL DEFAULT 'open',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  closed_at TEXT,
  FOREIGN KEY (credential_id) REFERENCES byok_credentials(id)
);

CREATE INDEX IF NOT EXISTS idx_byok_sessions_user ON byok_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_byok_sessions_provider ON byok_sessions(provider);
CREATE INDEX IF NOT EXISTS idx_byok_sessions_status ON byok_sessions(status);

CREATE TABLE IF NOT EXISTS byok_chat_receipts (
  id TEXT PRIMARY KEY,
  session_id TEXT,
  user_id TEXT NOT NULL,
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  prompt_hash TEXT,
  status TEXT NOT NULL,
  tool_ids_json TEXT,
  approval_ids_json TEXT,
  input_summary TEXT,
  output_summary TEXT,
  error TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES byok_sessions(id)
);

CREATE INDEX IF NOT EXISTS idx_byok_chat_receipts_session ON byok_chat_receipts(session_id);
CREATE INDEX IF NOT EXISTS idx_byok_chat_receipts_user ON byok_chat_receipts(user_id);
CREATE INDEX IF NOT EXISTS idx_byok_chat_receipts_provider ON byok_chat_receipts(provider);
CREATE INDEX IF NOT EXISTS idx_byok_chat_receipts_created ON byok_chat_receipts(created_at);
