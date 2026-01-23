-- ============================================================================
-- Migration: 035_review_requests.sql
-- Description: Add review request automation and tracking tables
-- Part of: Client Module Phase 4 - Loyalty, Reviews, Referrals
-- Reference: scripts/ralph/runs/client-module-phase4-loyalty/prd.json
-- ============================================================================

-- ============================================================================
-- STEP 1: Create review_settings table
-- ============================================================================
-- Stores review automation configuration for each store.
-- Controls when and how review requests are sent to clients.

CREATE TABLE IF NOT EXISTS review_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,

  -- Automation settings
  enabled BOOLEAN NOT NULL DEFAULT FALSE,
  delay_hours INTEGER NOT NULL DEFAULT 24,  -- Hours after checkout before sending
  reminder_days INTEGER,  -- Days after initial request to send reminder (NULL = no reminder)

  -- Review platforms with URLs
  platforms JSONB NOT NULL DEFAULT '{}',
  -- Example: {"google": "https://g.page/...", "yelp": "https://yelp.com/...", "facebook": "https://facebook.com/..."}

  -- Sync fields
  sync_status TEXT NOT NULL DEFAULT 'synced',
  sync_version INTEGER NOT NULL DEFAULT 1,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT unique_review_settings_per_store UNIQUE (store_id)
);

-- Create index for review_settings
CREATE INDEX IF NOT EXISTS idx_review_settings_store_id
  ON review_settings(store_id);

-- Add column comments
COMMENT ON TABLE review_settings IS 'Review request automation configuration per store';
COMMENT ON COLUMN review_settings.delay_hours IS 'Hours after checkout before sending first review request';
COMMENT ON COLUMN review_settings.reminder_days IS 'Days after initial request to send reminder (NULL = no reminder)';
COMMENT ON COLUMN review_settings.platforms IS 'JSONB object mapping platform names to review URLs: {google: "url", yelp: "url", facebook: "url"}';

-- ============================================================================
-- STEP 2: Create review_requests table
-- ============================================================================
-- Tracks individual review requests sent to clients after appointments.

CREATE TABLE IF NOT EXISTS review_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,

  -- Request status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'completed', 'expired')),
  sent_via TEXT CHECK (sent_via IN ('email', 'sms')),

  -- Tracking
  sent_at TIMESTAMPTZ,
  reminder_sent_at TIMESTAMPTZ,
  review_platform TEXT,  -- Which platform the client reviewed on (if completed)
  review_url TEXT,  -- Link to the actual review (if available)

  -- Sync fields
  sync_status TEXT NOT NULL DEFAULT 'synced',
  sync_version INTEGER NOT NULL DEFAULT 1,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for review_requests
CREATE INDEX IF NOT EXISTS idx_review_requests_client_id
  ON review_requests(client_id);

CREATE INDEX IF NOT EXISTS idx_review_requests_appointment_id
  ON review_requests(appointment_id);

CREATE INDEX IF NOT EXISTS idx_review_requests_store_id
  ON review_requests(store_id);

CREATE INDEX IF NOT EXISTS idx_review_requests_status
  ON review_requests(store_id, status);

CREATE INDEX IF NOT EXISTS idx_review_requests_created_at
  ON review_requests(created_at);

-- Add column comments
COMMENT ON TABLE review_requests IS 'Individual review requests sent to clients';
COMMENT ON COLUMN review_requests.status IS 'Request status: pending (scheduled), sent (delivered), completed (client reviewed), expired (too old)';
COMMENT ON COLUMN review_requests.sent_via IS 'Delivery method: email or sms';
COMMENT ON COLUMN review_requests.sent_at IS 'When the review request was sent';
COMMENT ON COLUMN review_requests.reminder_sent_at IS 'When the reminder was sent (if applicable)';
COMMENT ON COLUMN review_requests.review_platform IS 'Platform where client left review (google, yelp, facebook)';
COMMENT ON COLUMN review_requests.review_url IS 'Direct link to the client review (if available)';

-- ============================================================================
-- STEP 3: Row Level Security Policies
-- ============================================================================

-- Enable RLS
ALTER TABLE review_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_requests ENABLE ROW LEVEL SECURITY;

-- Review Settings Policies
CREATE POLICY "Staff can view their store's review settings"
  ON review_settings FOR SELECT
  USING (
    store_id IN (
      SELECT store_id FROM staff WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Staff can insert review settings for their store"
  ON review_settings FOR INSERT
  WITH CHECK (
    store_id IN (
      SELECT store_id FROM staff WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Staff can update their store's review settings"
  ON review_settings FOR UPDATE
  USING (
    store_id IN (
      SELECT store_id FROM staff WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Staff can delete their store's review settings"
  ON review_settings FOR DELETE
  USING (
    store_id IN (
      SELECT store_id FROM staff WHERE auth_user_id = auth.uid()
    )
  );

-- Review Requests Policies
CREATE POLICY "Staff can view review requests for their store"
  ON review_requests FOR SELECT
  USING (
    store_id IN (
      SELECT store_id FROM staff WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Staff can insert review requests for their store"
  ON review_requests FOR INSERT
  WITH CHECK (
    store_id IN (
      SELECT store_id FROM staff WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Staff can update review requests for their store"
  ON review_requests FOR UPDATE
  USING (
    store_id IN (
      SELECT store_id FROM staff WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Staff can delete review requests for their store"
  ON review_requests FOR DELETE
  USING (
    store_id IN (
      SELECT store_id FROM staff WHERE auth_user_id = auth.uid()
    )
  );

-- ============================================================================
-- STEP 4: Create updated_at trigger function and triggers
-- ============================================================================

-- Trigger for review_settings
CREATE TRIGGER set_review_settings_updated_at
  BEFORE UPDATE ON review_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for review_requests
CREATE TRIGGER set_review_requests_updated_at
  BEFORE UPDATE ON review_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
