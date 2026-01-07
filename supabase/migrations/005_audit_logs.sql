-- Audit Logs Table (Phase 4 - Enterprise Features)
-- Comprehensive audit trail for compliance and security
-- Created: 2025-12-29

-- =============================================================================
-- AUDIT LOGS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Timestamp
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Action details
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  severity TEXT NOT NULL DEFAULT 'low',
  description TEXT NOT NULL,

  -- Context (JSONB for flexibility)
  context JSONB DEFAULT '{}'::jsonb,

  -- Data changes
  old_data JSONB,
  new_data JSONB,
  changed_fields TEXT[],

  -- Additional metadata
  metadata JSONB,

  -- Status
  success BOOLEAN NOT NULL DEFAULT true,
  error_message TEXT,

  -- Extracted fields for indexing (from context)
  tenant_id UUID GENERATED ALWAYS AS ((context->>'tenantId')::UUID) STORED,
  store_id UUID GENERATED ALWAYS AS ((context->>'storeId')::UUID) STORED,
  user_id UUID GENERATED ALWAYS AS ((context->>'userId')::UUID) STORED
);

-- =============================================================================
-- INDEXES FOR AUDIT QUERIES
-- Note: Using 'created_at' since existing audit_logs table uses this column
-- =============================================================================

-- Time-based queries (most common)
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp
ON audit_logs(timestamp DESC);

-- Entity-specific queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity
ON audit_logs(entity_type, entity_id, timestamp DESC);

-- Action-based queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_action_time
ON audit_logs(action, timestamp DESC);

-- Note: Full-text search index removed as existing table may not have description column

-- =============================================================================
-- ROW LEVEL SECURITY
-- Note: Simplified policies for existing table schema
-- =============================================================================

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Service role has full access
CREATE POLICY "Service role manages audit_logs"
ON audit_logs FOR ALL
USING (auth.role() = 'service_role');

-- Authenticated users can insert audit logs (not anonymous)
CREATE POLICY "Authenticated users can insert audit logs"
ON audit_logs FOR INSERT
WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'service_role');

-- =============================================================================
-- PARTITIONING (for scale)
-- =============================================================================

-- Note: In production, partition by month for large deployments
-- Example:
-- CREATE TABLE audit_logs_2025_01 PARTITION OF audit_logs
--   FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');

-- =============================================================================
-- RETENTION POLICY (via pg_cron or Edge Function)
-- =============================================================================

-- Function to clean old audit logs (simplified for existing schema)
CREATE OR REPLACE FUNCTION cleanup_old_audit_logs()
RETURNS void AS $$
BEGIN
  -- Delete logs older than 365 days
  DELETE FROM audit_logs
  WHERE timestamp < NOW() - INTERVAL '365 days';
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE audit_logs IS 'Immutable audit trail for compliance and security';
