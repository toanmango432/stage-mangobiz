-- ============================================================================
-- Migration: 032_gdpr_compliance.sql
-- Description: Add GDPR/CCPA compliance tables for data export, deletion, and consent
-- Part of: Client Module Phase 2 - GDPR Compliance
-- Reference: scripts/ralph/runs/client-module-phase2-gdpr/prd.json
-- ============================================================================

-- ============================================================================
-- STEP 1: Create client_data_requests table
-- ============================================================================
-- Tracks data access, export, and deletion requests per GDPR/CCPA requirements.
-- Stores request type, status, and processing metadata.

CREATE TABLE IF NOT EXISTS client_data_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,

  -- Request type and status
  request_type TEXT NOT NULL CHECK (request_type IN ('export', 'delete', 'access')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'rejected')),

  -- Processing metadata
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  processed_by UUID,

  -- Additional information
  notes TEXT,
  export_url TEXT,  -- URL to download exported data (for export requests)

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_client_data_requests_client_id
  ON client_data_requests(client_id);

CREATE INDEX IF NOT EXISTS idx_client_data_requests_store_id
  ON client_data_requests(store_id);

CREATE INDEX IF NOT EXISTS idx_client_data_requests_status
  ON client_data_requests(status)
  WHERE status = 'pending';  -- Partial index for pending requests

-- Add column comments
COMMENT ON TABLE client_data_requests IS 'Tracks GDPR/CCPA data requests (export, deletion, access) from clients';
COMMENT ON COLUMN client_data_requests.request_type IS 'Type of request: export (data portability), delete (right to erasure), access (right to access)';
COMMENT ON COLUMN client_data_requests.status IS 'Request status: pending, processing, completed, rejected';
COMMENT ON COLUMN client_data_requests.export_url IS 'Temporary URL to download exported data (expires after 24 hours)';

-- ============================================================================
-- STEP 2: Create data_retention_logs table
-- ============================================================================
-- Audit log for all data retention actions (exports, deletions, consent changes).
-- Required for GDPR compliance auditing.

CREATE TABLE IF NOT EXISTS data_retention_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,  -- Keep log even if client deleted
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,

  -- Action details
  action TEXT NOT NULL CHECK (action IN (
    'data_exported',
    'data_deleted',
    'data_accessed',
    'consent_updated',
    'consent_marketing_granted',
    'consent_marketing_revoked',
    'consent_data_processing_granted',
    'consent_data_processing_revoked'
  )),
  fields_affected JSONB,  -- Array of field names that were modified

  -- Actor information
  performed_by UUID,
  performed_by_name TEXT,

  -- Timestamps
  performed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for audit queries
CREATE INDEX IF NOT EXISTS idx_data_retention_logs_client_id
  ON data_retention_logs(client_id);

CREATE INDEX IF NOT EXISTS idx_data_retention_logs_store_id
  ON data_retention_logs(store_id);

CREATE INDEX IF NOT EXISTS idx_data_retention_logs_action
  ON data_retention_logs(action);

CREATE INDEX IF NOT EXISTS idx_data_retention_logs_performed_at
  ON data_retention_logs(performed_at);

-- Add column comments
COMMENT ON TABLE data_retention_logs IS 'Immutable audit log for GDPR/CCPA data actions - required for compliance auditing';
COMMENT ON COLUMN data_retention_logs.fields_affected IS 'JSON array of field names that were exported, deleted, or modified';
COMMENT ON COLUMN data_retention_logs.action IS 'The data retention action performed';

-- ============================================================================
-- STEP 3: Add consent and deletion columns to clients table
-- ============================================================================
-- These columns track explicit GDPR consent and data deletion requests.

-- Marketing consent
ALTER TABLE clients ADD COLUMN IF NOT EXISTS consent_marketing BOOLEAN DEFAULT FALSE;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS consent_marketing_at TIMESTAMPTZ;

-- Data processing consent (required for service delivery)
ALTER TABLE clients ADD COLUMN IF NOT EXISTS consent_data_processing BOOLEAN DEFAULT TRUE;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS consent_data_processing_at TIMESTAMPTZ;

-- Data deletion tracking
ALTER TABLE clients ADD COLUMN IF NOT EXISTS data_deletion_requested_at TIMESTAMPTZ;

-- Add column comments
COMMENT ON COLUMN clients.consent_marketing IS 'Client has explicitly consented to marketing communications';
COMMENT ON COLUMN clients.consent_marketing_at IS 'Timestamp when marketing consent was last changed';
COMMENT ON COLUMN clients.consent_data_processing IS 'Client has consented to data processing for service delivery';
COMMENT ON COLUMN clients.consent_data_processing_at IS 'Timestamp when data processing consent was last changed';
COMMENT ON COLUMN clients.data_deletion_requested_at IS 'Timestamp when client requested data deletion (GDPR right to erasure)';

-- ============================================================================
-- STEP 4: Enable Row Level Security (RLS)
-- ============================================================================

-- Enable RLS on new tables
ALTER TABLE client_data_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_retention_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 5: Create RLS policies for store-scoped access
-- ============================================================================

-- client_data_requests policies
CREATE POLICY "Store members can view data requests for their store"
  ON client_data_requests
  FOR SELECT
  USING (store_id IN (
    SELECT store_id FROM staff WHERE auth_user_id = auth.uid()
  ));

CREATE POLICY "Store members can create data requests for their store"
  ON client_data_requests
  FOR INSERT
  WITH CHECK (store_id IN (
    SELECT store_id FROM staff WHERE auth_user_id = auth.uid()
  ));

CREATE POLICY "Store members can update data requests for their store"
  ON client_data_requests
  FOR UPDATE
  USING (store_id IN (
    SELECT store_id FROM staff WHERE auth_user_id = auth.uid()
  ));

-- data_retention_logs policies (read-only for audit purposes)
CREATE POLICY "Store members can view retention logs for their store"
  ON data_retention_logs
  FOR SELECT
  USING (store_id IN (
    SELECT store_id FROM staff WHERE auth_user_id = auth.uid()
  ));

CREATE POLICY "Store members can create retention logs for their store"
  ON data_retention_logs
  FOR INSERT
  WITH CHECK (store_id IN (
    SELECT store_id FROM staff WHERE auth_user_id = auth.uid()
  ));

-- Note: No UPDATE or DELETE policies for data_retention_logs - logs are immutable for compliance

-- ============================================================================
-- STEP 6: Create updated_at trigger for client_data_requests
-- ============================================================================

-- Create or replace the trigger function (if not exists)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for client_data_requests
DROP TRIGGER IF EXISTS update_client_data_requests_updated_at ON client_data_requests;
CREATE TRIGGER update_client_data_requests_updated_at
  BEFORE UPDATE ON client_data_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- STEP 7: Add index for finding clients with pending deletion requests
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_clients_data_deletion_requested
  ON clients(data_deletion_requested_at)
  WHERE data_deletion_requested_at IS NOT NULL;

-- ============================================================================
-- Migration complete
-- ============================================================================
