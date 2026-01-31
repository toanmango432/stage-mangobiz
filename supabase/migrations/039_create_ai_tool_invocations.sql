-- AI Tool Invocations Audit Table
-- Tracks all AI tool invocations for debugging, analytics, and security monitoring
-- Created: 2026-01-30

-- =============================================================================
-- AI TOOL INVOCATIONS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS ai_tool_invocations (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Store and user context
  store_id UUID NOT NULL,
  user_id UUID,

  -- Tool invocation details
  tool_name TEXT NOT NULL,
  parameters JSONB NOT NULL DEFAULT '{}'::jsonb,
  result JSONB,

  -- Execution status
  success BOOLEAN NOT NULL DEFAULT true,
  error_message TEXT,
  execution_time_ms INTEGER,

  -- Timestamp
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Additional metadata (AI model, request source, etc.)
  metadata JSONB DEFAULT '{}'::jsonb
);

-- =============================================================================
-- INDEXES FOR COMMON QUERY PATTERNS
-- =============================================================================

-- Store-level queries (primary filter for dashboard/reporting)
CREATE INDEX IF NOT EXISTS idx_ai_tool_invocations_store_created
ON ai_tool_invocations(store_id, created_at DESC);

-- Tool-based queries (for analyzing tool usage patterns)
CREATE INDEX IF NOT EXISTS idx_ai_tool_invocations_tool_created
ON ai_tool_invocations(tool_name, created_at DESC);

-- User activity tracking
CREATE INDEX IF NOT EXISTS idx_ai_tool_invocations_user
ON ai_tool_invocations(user_id, created_at DESC)
WHERE user_id IS NOT NULL;

-- Failed invocations (for debugging and monitoring)
CREATE INDEX IF NOT EXISTS idx_ai_tool_invocations_failures
ON ai_tool_invocations(store_id, created_at DESC)
WHERE success = false;

-- Slow queries (for performance monitoring)
CREATE INDEX IF NOT EXISTS idx_ai_tool_invocations_slow
ON ai_tool_invocations(store_id, execution_time_ms DESC)
WHERE execution_time_ms > 1000;

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE ai_tool_invocations ENABLE ROW LEVEL SECURITY;

-- Store admins can read their store's AI tool invocation logs
CREATE POLICY "Store admins can view own ai_tool_invocations"
ON ai_tool_invocations FOR SELECT
USING (
  store_id = (auth.jwt() ->> 'store_id')::UUID
);

-- Service role has full access (for edge functions and background jobs)
CREATE POLICY "Service role manages ai_tool_invocations"
ON ai_tool_invocations FOR ALL
USING (auth.role() = 'service_role');

-- Authenticated users can insert invocation logs (via edge functions)
CREATE POLICY "Authenticated can insert ai_tool_invocations"
ON ai_tool_invocations FOR INSERT
WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'service_role');

-- No updates allowed (immutable audit trail)
-- No delete policy for authenticated users (immutable)

-- =============================================================================
-- RETENTION POLICY FUNCTION
-- =============================================================================

-- Function to clean old AI tool invocation logs
CREATE OR REPLACE FUNCTION cleanup_old_ai_tool_invocations(retention_days INTEGER DEFAULT 90)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM ai_tool_invocations
  WHERE created_at < NOW() - (retention_days || ' days')::INTERVAL;

  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE ai_tool_invocations IS 'Audit log of all AI tool invocations for Mango Connect integration';
COMMENT ON COLUMN ai_tool_invocations.store_id IS 'Store context for the invocation';
COMMENT ON COLUMN ai_tool_invocations.user_id IS 'User who triggered the AI action (optional for system-initiated)';
COMMENT ON COLUMN ai_tool_invocations.tool_name IS 'Name of the AI tool invoked (e.g., searchClients, bookAppointment)';
COMMENT ON COLUMN ai_tool_invocations.parameters IS 'Input parameters passed to the tool';
COMMENT ON COLUMN ai_tool_invocations.result IS 'Tool execution result (success data or null on failure)';
COMMENT ON COLUMN ai_tool_invocations.success IS 'Whether the tool executed successfully';
COMMENT ON COLUMN ai_tool_invocations.error_message IS 'Error message if success is false';
COMMENT ON COLUMN ai_tool_invocations.execution_time_ms IS 'Time taken to execute the tool in milliseconds';
COMMENT ON COLUMN ai_tool_invocations.metadata IS 'Additional context: AI model, request source, session ID, etc.';
COMMENT ON FUNCTION cleanup_old_ai_tool_invocations(INTEGER) IS 'Removes AI tool invocation logs older than specified retention period';
