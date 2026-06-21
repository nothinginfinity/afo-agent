CREATE TABLE IF NOT EXISTS byok_threads (
  id TEXT PRIMARY KEY,
  title TEXT,
  provider TEXT,
  model TEXT,
  created_at INTEGER,
  updated_at INTEGER,
  status TEXT DEFAULT 'active',
  token_count INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS byok_messages (
  id TEXT PRIMARY KEY,
  thread_id TEXT,
  role TEXT,
  content_json TEXT,
  parent_id TEXT,
  tokens_in INTEGER,
  tokens_out INTEGER,
  compacted INTEGER DEFAULT 0,
  archive_url TEXT,
  created_at INTEGER,
  FOREIGN KEY (thread_id) REFERENCES byok_threads(id)
);

CREATE TABLE IF NOT EXISTS byok_tool_calls (
  id TEXT PRIMARY KEY,
  thread_id TEXT,
  message_id TEXT,
  tool_id TEXT,
  input_json TEXT,
  output_json TEXT,
  status TEXT,
  ms INTEGER,
  risk TEXT,
  error TEXT,
  FOREIGN KEY (thread_id) REFERENCES byok_threads(id),
  FOREIGN KEY (message_id) REFERENCES byok_messages(id)
);

CREATE TABLE IF NOT EXISTS byok_run_receipts (
  id TEXT PRIMARY KEY,
  thread_id TEXT,
  message_id TEXT,
  kind TEXT,
  provider TEXT,
  model TEXT,
  ms INTEGER,
  status TEXT,
  payload_json TEXT,
  created_at INTEGER
);

CREATE TABLE IF NOT EXISTS byok_thread_summaries (
  id TEXT PRIMARY KEY,
  thread_id TEXT,
  covers_from_msg_id TEXT,
  covers_to_msg_id TEXT,
  summary_text TEXT,
  tokens INTEGER,
  vector_id TEXT,
  created_at INTEGER
);

CREATE TABLE IF NOT EXISTS byok_side_runs (
  id TEXT PRIMARY KEY,
  thread_id TEXT,
  parent_msg_id TEXT,
  kind TEXT,
  provider TEXT,
  model TEXT,
  input_json TEXT,
  output_json TEXT,
  ms INTEGER,
  status TEXT,
  created_at INTEGER
);

CREATE TABLE IF NOT EXISTS byok_vector_index (
  id TEXT PRIMARY KEY,
  thread_id TEXT,
  message_id TEXT,
  summary_id TEXT,
  kind TEXT,
  vectorize_id TEXT,
  content_preview TEXT,
  created_at INTEGER
);

CREATE INDEX IF NOT EXISTS idx_byok_threads_updated_at ON byok_threads(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_byok_threads_status_updated_at ON byok_threads(status, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_byok_messages_thread_id ON byok_messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_byok_messages_thread_created_at ON byok_messages(thread_id, created_at);
CREATE INDEX IF NOT EXISTS idx_byok_messages_created_at ON byok_messages(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_byok_tool_calls_thread_id ON byok_tool_calls(thread_id);
CREATE INDEX IF NOT EXISTS idx_byok_tool_calls_message_id ON byok_tool_calls(message_id);
CREATE INDEX IF NOT EXISTS idx_byok_tool_calls_status ON byok_tool_calls(status);

CREATE INDEX IF NOT EXISTS idx_byok_run_receipts_thread_id ON byok_run_receipts(thread_id);
CREATE INDEX IF NOT EXISTS idx_byok_run_receipts_message_id ON byok_run_receipts(message_id);
CREATE INDEX IF NOT EXISTS idx_byok_run_receipts_created_at ON byok_run_receipts(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_byok_thread_summaries_thread_id ON byok_thread_summaries(thread_id);
CREATE INDEX IF NOT EXISTS idx_byok_thread_summaries_created_at ON byok_thread_summaries(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_byok_side_runs_thread_id ON byok_side_runs(thread_id);
CREATE INDEX IF NOT EXISTS idx_byok_side_runs_parent_msg_id ON byok_side_runs(parent_msg_id);
CREATE INDEX IF NOT EXISTS idx_byok_side_runs_created_at ON byok_side_runs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_byok_vector_index_thread_id ON byok_vector_index(thread_id);
CREATE INDEX IF NOT EXISTS idx_byok_vector_index_message_id ON byok_vector_index(message_id);
CREATE INDEX IF NOT EXISTS idx_byok_vector_index_summary_id ON byok_vector_index(summary_id);
CREATE INDEX IF NOT EXISTS idx_byok_vector_index_created_at ON byok_vector_index(created_at DESC);
