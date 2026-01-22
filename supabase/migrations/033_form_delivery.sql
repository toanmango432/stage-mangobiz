-- ============================================================================
-- Migration: 033_form_delivery.sql
-- Description: Add form templates, submissions, and delivery tracking tables
-- Part of: Client Module Phase 3 - Forms, Segments, Import/Export
-- Reference: scripts/ralph/runs/client-module-phase3-forms/prd.json
-- ============================================================================

-- ============================================================================
-- STEP 1: Create form_templates table
-- ============================================================================
-- Stores form template definitions that can be sent to clients.
-- Templates include sections, fields, and configuration for delivery.

CREATE TABLE IF NOT EXISTS form_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,

  -- Form metadata
  name TEXT NOT NULL,
  description TEXT,
  category TEXT CHECK (category IN ('health', 'consent', 'consultation', 'feedback', 'custom')),

  -- Send mode and frequency
  send_mode TEXT NOT NULL DEFAULT 'manual' CHECK (send_mode IN ('automatic', 'manual')),
  frequency TEXT DEFAULT 'every_time' CHECK (frequency IN ('every_time', 'once')),

  -- Linked services (for automatic sending)
  linked_service_ids UUID[] DEFAULT '{}',

  -- Form configuration
  requires_signature BOOLEAN NOT NULL DEFAULT FALSE,
  send_before_hours INTEGER DEFAULT 24,  -- Hours before appointment to send
  reminder_enabled BOOLEAN DEFAULT FALSE,
  reminder_interval_hours INTEGER DEFAULT 12,
  expiration_hours INTEGER DEFAULT 24,  -- Form link expiration (default 24 hours)

  -- Sections stored as JSONB array
  sections JSONB NOT NULL DEFAULT '[]',

  -- Status
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_built_in BOOLEAN NOT NULL DEFAULT FALSE,  -- Pre-built templates

  -- Sync fields
  sync_status TEXT NOT NULL DEFAULT 'synced',
  sync_version INTEGER NOT NULL DEFAULT 1,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for form_templates
CREATE INDEX IF NOT EXISTS idx_form_templates_store_id
  ON form_templates(store_id);

CREATE INDEX IF NOT EXISTS idx_form_templates_category
  ON form_templates(store_id, category)
  WHERE is_active = TRUE;

CREATE INDEX IF NOT EXISTS idx_form_templates_send_mode
  ON form_templates(store_id, send_mode)
  WHERE is_active = TRUE;

-- Add column comments
COMMENT ON TABLE form_templates IS 'Form template definitions for client consultation, consent, and feedback forms';
COMMENT ON COLUMN form_templates.frequency IS 'For automatic forms: every_time sends on each appointment, once sends only if not already completed';
COMMENT ON COLUMN form_templates.linked_service_ids IS 'Service IDs that trigger automatic form sending when booked';
COMMENT ON COLUMN form_templates.sections IS 'JSONB array of form sections with fields and configuration';
COMMENT ON COLUMN form_templates.send_before_hours IS 'Hours before appointment to automatically send the form';

-- ============================================================================
-- STEP 2: Create form_submissions table
-- ============================================================================
-- Stores client responses to form templates.

CREATE TABLE IF NOT EXISTS form_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  form_template_id UUID NOT NULL REFERENCES form_templates(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,

  -- Submission data
  responses JSONB NOT NULL DEFAULT '{}',

  -- Signature
  signature_image TEXT,  -- Base64 encoded signature image
  signature_type TEXT CHECK (signature_type IN ('draw', 'type')),
  signature_typed_name TEXT,

  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'expired')),

  -- Timestamps for tracking
  sent_at TIMESTAMPTZ,
  sent_via TEXT CHECK (sent_via IN ('email', 'sms', 'in_app')),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,

  -- Completion metadata
  completed_by TEXT,  -- 'client' or staff ID
  ip_address TEXT,
  user_agent TEXT,

  -- Sync fields
  sync_status TEXT NOT NULL DEFAULT 'synced',
  sync_version INTEGER NOT NULL DEFAULT 1,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for form_submissions
CREATE INDEX IF NOT EXISTS idx_form_submissions_store_id
  ON form_submissions(store_id);

CREATE INDEX IF NOT EXISTS idx_form_submissions_client_id
  ON form_submissions(client_id)
  WHERE client_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_form_submissions_appointment_id
  ON form_submissions(appointment_id)
  WHERE appointment_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_form_submissions_template_id
  ON form_submissions(form_template_id);

CREATE INDEX IF NOT EXISTS idx_form_submissions_status
  ON form_submissions(store_id, status)
  WHERE status IN ('pending', 'in_progress');

-- Add column comments
COMMENT ON TABLE form_submissions IS 'Client submissions/responses to form templates';
COMMENT ON COLUMN form_submissions.responses IS 'JSONB object mapping section IDs to response values';
COMMENT ON COLUMN form_submissions.signature_image IS 'Base64 encoded PNG of drawn signature';
COMMENT ON COLUMN form_submissions.completed_by IS 'Either "client" for self-submission or staff ID for in-person completion';

-- ============================================================================
-- STEP 3: Create form_deliveries table
-- ============================================================================
-- Tracks form delivery status via email/SMS with unique tokens for secure access.

CREATE TABLE IF NOT EXISTS form_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  form_template_id UUID NOT NULL REFERENCES form_templates(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
  form_submission_id UUID REFERENCES form_submissions(id) ON DELETE SET NULL,

  -- Delivery method and token
  delivery_method TEXT NOT NULL CHECK (delivery_method IN ('email', 'sms')),
  token UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),  -- Unique token for form link

  -- Contact info at time of delivery (for audit)
  delivery_email TEXT,
  delivery_phone TEXT,

  -- Delivery status tracking
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  opened_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL,

  -- Delivery result
  delivery_status TEXT NOT NULL DEFAULT 'pending' CHECK (delivery_status IN ('pending', 'sent', 'delivered', 'failed', 'bounced')),
  delivery_error TEXT,
  message_id TEXT,  -- External message ID from email/SMS provider

  -- Reminder tracking
  reminder_sent_at TIMESTAMPTZ,
  reminder_count INTEGER NOT NULL DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for form_deliveries
CREATE INDEX IF NOT EXISTS idx_form_deliveries_store_id
  ON form_deliveries(store_id);

CREATE INDEX IF NOT EXISTS idx_form_deliveries_client_id
  ON form_deliveries(client_id);

CREATE INDEX IF NOT EXISTS idx_form_deliveries_appointment_id
  ON form_deliveries(appointment_id)
  WHERE appointment_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_form_deliveries_token
  ON form_deliveries(token);

CREATE INDEX IF NOT EXISTS idx_form_deliveries_status
  ON form_deliveries(store_id, delivery_status)
  WHERE delivery_status IN ('pending', 'sent');

-- Partial index for pending deliveries (for reminder jobs)
CREATE INDEX IF NOT EXISTS idx_form_deliveries_pending_reminders
  ON form_deliveries(expires_at, reminder_count)
  WHERE completed_at IS NULL AND delivery_status = 'delivered';

-- Add column comments
COMMENT ON TABLE form_deliveries IS 'Tracks form delivery via email/SMS with secure token-based links';
COMMENT ON COLUMN form_deliveries.token IS 'Unique UUID token for secure form access link';
COMMENT ON COLUMN form_deliveries.delivery_email IS 'Email address used at time of delivery (snapshot for audit)';
COMMENT ON COLUMN form_deliveries.delivery_phone IS 'Phone number used at time of delivery (snapshot for audit)';
COMMENT ON COLUMN form_deliveries.message_id IS 'External message ID from Resend/Twilio for tracking';

-- ============================================================================
-- STEP 4: Add auto_send_form_ids to services table
-- ============================================================================
-- Array of form template IDs that are automatically sent when service is booked.

ALTER TABLE services ADD COLUMN IF NOT EXISTS auto_send_form_ids UUID[] DEFAULT '{}';

COMMENT ON COLUMN services.auto_send_form_ids IS 'Form template IDs to automatically send when this service is booked';

-- ============================================================================
-- STEP 5: Enable Row Level Security (RLS)
-- ============================================================================

ALTER TABLE form_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_deliveries ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 6: Create RLS policies for form_templates
-- ============================================================================

CREATE POLICY "Store members can view form templates for their store"
  ON form_templates
  FOR SELECT
  USING (store_id IN (
    SELECT store_id FROM staff WHERE auth_user_id = auth.uid()
  ));

CREATE POLICY "Store members can create form templates for their store"
  ON form_templates
  FOR INSERT
  WITH CHECK (store_id IN (
    SELECT store_id FROM staff WHERE auth_user_id = auth.uid()
  ));

CREATE POLICY "Store members can update form templates for their store"
  ON form_templates
  FOR UPDATE
  USING (store_id IN (
    SELECT store_id FROM staff WHERE auth_user_id = auth.uid()
  ));

CREATE POLICY "Store members can delete form templates for their store"
  ON form_templates
  FOR DELETE
  USING (store_id IN (
    SELECT store_id FROM staff WHERE auth_user_id = auth.uid()
  ));

-- ============================================================================
-- STEP 7: Create RLS policies for form_submissions
-- ============================================================================

CREATE POLICY "Store members can view form submissions for their store"
  ON form_submissions
  FOR SELECT
  USING (store_id IN (
    SELECT store_id FROM staff WHERE auth_user_id = auth.uid()
  ));

CREATE POLICY "Store members can create form submissions for their store"
  ON form_submissions
  FOR INSERT
  WITH CHECK (store_id IN (
    SELECT store_id FROM staff WHERE auth_user_id = auth.uid()
  ));

CREATE POLICY "Store members can update form submissions for their store"
  ON form_submissions
  FOR UPDATE
  USING (store_id IN (
    SELECT store_id FROM staff WHERE auth_user_id = auth.uid()
  ));

-- ============================================================================
-- STEP 8: Create RLS policies for form_deliveries
-- ============================================================================

CREATE POLICY "Store members can view form deliveries for their store"
  ON form_deliveries
  FOR SELECT
  USING (store_id IN (
    SELECT store_id FROM staff WHERE auth_user_id = auth.uid()
  ));

CREATE POLICY "Store members can create form deliveries for their store"
  ON form_deliveries
  FOR INSERT
  WITH CHECK (store_id IN (
    SELECT store_id FROM staff WHERE auth_user_id = auth.uid()
  ));

CREATE POLICY "Store members can update form deliveries for their store"
  ON form_deliveries
  FOR UPDATE
  USING (store_id IN (
    SELECT store_id FROM staff WHERE auth_user_id = auth.uid()
  ));

-- ============================================================================
-- STEP 9: Create updated_at triggers
-- ============================================================================

-- Trigger for form_templates
DROP TRIGGER IF EXISTS update_form_templates_updated_at ON form_templates;
CREATE TRIGGER update_form_templates_updated_at
  BEFORE UPDATE ON form_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for form_submissions
DROP TRIGGER IF EXISTS update_form_submissions_updated_at ON form_submissions;
CREATE TRIGGER update_form_submissions_updated_at
  BEFORE UPDATE ON form_submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for form_deliveries
DROP TRIGGER IF EXISTS update_form_deliveries_updated_at ON form_deliveries;
CREATE TRIGGER update_form_deliveries_updated_at
  BEFORE UPDATE ON form_deliveries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Migration complete
-- ============================================================================
