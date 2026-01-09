-- Chat logs table for audit and improvement
CREATE TABLE chat_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  document_ids UUID[] DEFAULT '{}',
  chunk_count INTEGER,
  processing_time_ms INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE chat_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policy (service role has full access)
CREATE POLICY "Service role full access to chat_logs"
  ON chat_logs USING (true) WITH CHECK (true);

-- Index for user lookups and time-based queries
CREATE INDEX idx_chat_logs_user_id ON chat_logs(user_id);
CREATE INDEX idx_chat_logs_created_at ON chat_logs(created_at DESC);
