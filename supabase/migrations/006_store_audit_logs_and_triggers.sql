-- Store Audit Logs Table & Database Triggers (Phase 0 - Hybrid Auto-Logging)
-- For store-level audit logging (salon owners/managers)
-- Created: 2025-12-30

-- =============================================================================
-- STORE AUDIT LOGS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS store_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Timestamp
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Action details
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
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
  store_id UUID GENERATED ALWAYS AS ((context->>'storeId')::UUID) STORED,
  user_id TEXT GENERATED ALWAYS AS (context->>'userId') STORED
);

-- =============================================================================
-- INDEXES FOR STORE AUDIT QUERIES
-- =============================================================================

-- Time-based queries (most common)
CREATE INDEX IF NOT EXISTS idx_store_audit_logs_timestamp
ON store_audit_logs(timestamp DESC);

-- Store-level queries (primary filter)
CREATE INDEX IF NOT EXISTS idx_store_audit_logs_store
ON store_audit_logs(store_id, timestamp DESC)
WHERE store_id IS NOT NULL;

-- User activity queries
CREATE INDEX IF NOT EXISTS idx_store_audit_logs_user
ON store_audit_logs(user_id, timestamp DESC)
WHERE user_id IS NOT NULL;

-- Entity-specific queries
CREATE INDEX IF NOT EXISTS idx_store_audit_logs_entity
ON store_audit_logs(entity_type, entity_id, timestamp DESC);

-- Action-based queries
CREATE INDEX IF NOT EXISTS idx_store_audit_logs_action
ON store_audit_logs(action, timestamp DESC);

-- Severity-based queries (for alerting)
CREATE INDEX IF NOT EXISTS idx_store_audit_logs_severity
ON store_audit_logs(severity, timestamp DESC)
WHERE severity IN ('high', 'critical');

-- Full-text search on description
CREATE INDEX IF NOT EXISTS idx_store_audit_logs_search
ON store_audit_logs USING GIN (to_tsvector('english', description));

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE store_audit_logs ENABLE ROW LEVEL SECURITY;

-- Stores can only see their own audit logs
CREATE POLICY "Stores can view own audit logs"
ON store_audit_logs FOR SELECT
USING (
  store_id = (auth.jwt() ->> 'store_id')::UUID
);

-- Service role and authenticated users can insert audit logs
CREATE POLICY "Authenticated users can insert audit logs"
ON store_audit_logs FOR INSERT
WITH CHECK (true);

-- No updates or deletes allowed (immutable audit trail)
-- This is enforced by not creating UPDATE or DELETE policies

-- =============================================================================
-- DATABASE TRIGGERS FOR AUTOMATIC LOGGING (SAFETY NET)
-- =============================================================================

-- Generic trigger function that logs all changes
CREATE OR REPLACE FUNCTION store_audit_trigger_function()
RETURNS TRIGGER AS $$
DECLARE
  v_store_id UUID;
  v_entity_id TEXT;
  v_action TEXT;
BEGIN
  -- Determine action type
  v_action := CASE TG_OP
    WHEN 'INSERT' THEN 'create'
    WHEN 'UPDATE' THEN 'update'
    WHEN 'DELETE' THEN 'delete'
  END;

  -- Get store_id and entity_id from record
  v_store_id := COALESCE(
    (NEW.store_id)::UUID,
    (OLD.store_id)::UUID
  );
  v_entity_id := COALESCE(
    (NEW.id)::TEXT,
    (OLD.id)::TEXT
  );

  -- Skip if store_id is null (system tables without store context)
  IF v_store_id IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  -- Insert audit log entry
  INSERT INTO store_audit_logs (
    timestamp,
    action,
    entity_type,
    entity_id,
    severity,
    description,
    old_data,
    new_data,
    context,
    success,
    metadata
  ) VALUES (
    NOW(),
    v_action,
    TG_TABLE_NAME,
    v_entity_id,
    CASE
      WHEN TG_OP = 'DELETE' THEN 'medium'
      ELSE 'low'
    END,
    TG_TABLE_NAME || ' ' || v_action || 'd via database trigger',
    CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD) END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) END,
    jsonb_build_object(
      'storeId', v_store_id::TEXT,
      'source', 'database_trigger'
    ),
    true,
    jsonb_build_object(
      'trigger_name', TG_NAME,
      'trigger_operation', TG_OP
    )
  );

  RETURN COALESCE(NEW, OLD);
EXCEPTION WHEN OTHERS THEN
  -- Don't fail the original operation if audit logging fails
  RAISE WARNING 'Audit trigger failed: %', SQLERRM;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- CREATE TRIGGERS ON KEY TABLES
-- =============================================================================

-- Clients table
DROP TRIGGER IF EXISTS audit_clients_trigger ON clients;
CREATE TRIGGER audit_clients_trigger
  AFTER INSERT OR UPDATE OR DELETE ON clients
  FOR EACH ROW EXECUTE FUNCTION store_audit_trigger_function();

-- Tickets table
DROP TRIGGER IF EXISTS audit_tickets_trigger ON tickets;
CREATE TRIGGER audit_tickets_trigger
  AFTER INSERT OR UPDATE OR DELETE ON tickets
  FOR EACH ROW EXECUTE FUNCTION store_audit_trigger_function();

-- Staff table
DROP TRIGGER IF EXISTS audit_staff_trigger ON staff;
CREATE TRIGGER audit_staff_trigger
  AFTER INSERT OR UPDATE OR DELETE ON staff
  FOR EACH ROW EXECUTE FUNCTION store_audit_trigger_function();

-- Transactions table
DROP TRIGGER IF EXISTS audit_transactions_trigger ON transactions;
CREATE TRIGGER audit_transactions_trigger
  AFTER INSERT OR UPDATE OR DELETE ON transactions
  FOR EACH ROW EXECUTE FUNCTION store_audit_trigger_function();

-- Appointments table
DROP TRIGGER IF EXISTS audit_appointments_trigger ON appointments;
CREATE TRIGGER audit_appointments_trigger
  AFTER INSERT OR UPDATE OR DELETE ON appointments
  FOR EACH ROW EXECUTE FUNCTION store_audit_trigger_function();

-- Services table
DROP TRIGGER IF EXISTS audit_services_trigger ON services;
CREATE TRIGGER audit_services_trigger
  AFTER INSERT OR UPDATE OR DELETE ON services
  FOR EACH ROW EXECUTE FUNCTION store_audit_trigger_function();

-- =============================================================================
-- RETENTION POLICY FUNCTION
-- =============================================================================

-- Function to clean old store audit logs based on age
CREATE OR REPLACE FUNCTION cleanup_old_store_audit_logs(retention_days INTEGER DEFAULT 90)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM store_audit_logs
  WHERE timestamp < NOW() - (retention_days || ' days')::INTERVAL;

  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE store_audit_logs IS 'Store-level immutable audit trail for compliance and security';
COMMENT ON COLUMN store_audit_logs.context IS 'JSONB containing store, user, and session context';
COMMENT ON COLUMN store_audit_logs.old_data IS 'State before the change (for updates/deletes)';
COMMENT ON COLUMN store_audit_logs.new_data IS 'State after the change (for creates/updates)';
COMMENT ON COLUMN store_audit_logs.changed_fields IS 'Array of field names that were modified';
COMMENT ON FUNCTION store_audit_trigger_function() IS 'Database trigger function for automatic audit logging (safety net layer)';
