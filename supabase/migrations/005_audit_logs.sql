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
-- =============================================================================

-- Time-based queries (most common)
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp
ON audit_logs(timestamp DESC);

-- Tenant-level queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant
ON audit_logs(tenant_id, timestamp DESC)
WHERE tenant_id IS NOT NULL;

-- Store-level queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_store
ON audit_logs(store_id, timestamp DESC)
WHERE store_id IS NOT NULL;

-- User activity queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_user
ON audit_logs(user_id, timestamp DESC)
WHERE user_id IS NOT NULL;

-- Entity-specific queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity
ON audit_logs(entity_type, entity_id, timestamp DESC);

-- Action-based queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_action
ON audit_logs(action, timestamp DESC);

-- Severity-based queries (for alerting)
CREATE INDEX IF NOT EXISTS idx_audit_logs_severity
ON audit_logs(severity, timestamp DESC)
WHERE severity IN ('high', 'critical');

-- Full-text search on description
CREATE INDEX IF NOT EXISTS idx_audit_logs_search
ON audit_logs USING GIN (to_tsvector('english', description));

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Tenants can only see their own audit logs
CREATE POLICY "Tenants can view own audit logs"
ON audit_logs FOR SELECT
USING (
  tenant_id = (
    SELECT tenant_id FROM stores
    WHERE id = auth.jwt() ->> 'store_id'::text
  )::UUID
);

-- Only system can insert audit logs
CREATE POLICY "System can insert audit logs"
ON audit_logs FOR INSERT
WITH CHECK (true);

-- No updates or deletes allowed (immutable audit trail)
-- This is enforced by not creating UPDATE or DELETE policies

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

-- Function to clean old audit logs based on tenant tier
CREATE OR REPLACE FUNCTION cleanup_old_audit_logs()
RETURNS void AS $$
BEGIN
  -- Delete logs older than retention period
  -- Free tier: 30 days
  -- Starter: 90 days
  -- Pro: 365 days
  -- Enterprise: Never auto-delete

  DELETE FROM audit_logs
  WHERE timestamp < NOW() - INTERVAL '30 days'
    AND tenant_id IN (
      SELECT id FROM tenants WHERE tier = 'free'
    );

  DELETE FROM audit_logs
  WHERE timestamp < NOW() - INTERVAL '90 days'
    AND tenant_id IN (
      SELECT id FROM tenants WHERE tier = 'starter'
    );

  DELETE FROM audit_logs
  WHERE timestamp < NOW() - INTERVAL '365 days'
    AND tenant_id IN (
      SELECT id FROM tenants WHERE tier = 'pro'
    );

  -- Enterprise logs are never auto-deleted
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE audit_logs IS 'Immutable audit trail for compliance and security';
COMMENT ON COLUMN audit_logs.context IS 'JSONB containing user, store, tenant, and session context';
COMMENT ON COLUMN audit_logs.old_data IS 'State before the change (for updates/deletes)';
COMMENT ON COLUMN audit_logs.new_data IS 'State after the change (for creates/updates)';
COMMENT ON COLUMN audit_logs.changed_fields IS 'Array of field names that were modified';
