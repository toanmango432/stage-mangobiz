-- ============================================================================
-- Migration: 037_mango_identities.sql
-- Description: Multi-store client identity and ecosystem linking
-- Part of: Client Module Phase 5 - Multi-Store Client Sharing
-- Reference: scripts/ralph/runs/client-module-phase5-multistore/prd.json
-- Spec: docs/architecture/MULTI_STORE_CLIENT_SPEC.md
-- ============================================================================

-- ============================================================================
-- TIER 1: MANGO ECOSYSTEM TABLES
-- ============================================================================

-- ============================================================================
-- STEP 1: Create mango_identities table
-- ============================================================================
-- Central identity registry (hashed, no PII)
-- Stores hashed phone/email for cross-brand client sharing (client-controlled)

CREATE TABLE IF NOT EXISTS mango_identities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Hashed identifiers (SHA-256 with salt, no cleartext PII)
  hashed_phone VARCHAR(64) UNIQUE NOT NULL,
  hashed_email VARCHAR(64),

  -- Ecosystem opt-in consent
  ecosystem_opt_in BOOLEAN NOT NULL DEFAULT FALSE,
  opt_in_date TIMESTAMPTZ,
  opt_out_date TIMESTAMPTZ,

  -- Client-controlled sharing preferences
  sharing_preferences JSONB NOT NULL DEFAULT '{
    "basicInfo": true,
    "preferences": true,
    "visitHistory": false,
    "loyaltyData": false
  }',

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_mango_identities_hashed_phone
  ON mango_identities(hashed_phone);

CREATE INDEX IF NOT EXISTS idx_mango_identities_hashed_email
  ON mango_identities(hashed_email)
  WHERE hashed_email IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_mango_identities_opt_in
  ON mango_identities(ecosystem_opt_in)
  WHERE ecosystem_opt_in = TRUE;

-- Add column comments
COMMENT ON TABLE mango_identities IS 'Central identity registry for cross-brand client sharing (Tier 1)';
COMMENT ON COLUMN mango_identities.hashed_phone IS 'SHA-256 hash of normalized phone number';
COMMENT ON COLUMN mango_identities.hashed_email IS 'SHA-256 hash of normalized email address';
COMMENT ON COLUMN mango_identities.ecosystem_opt_in IS 'Client consent for ecosystem-wide profile sharing';
COMMENT ON COLUMN mango_identities.sharing_preferences IS 'Client-controlled data sharing preferences';

-- ============================================================================
-- STEP 2: Create linked_stores table
-- ============================================================================
-- Stores linked to a mango identity

CREATE TABLE IF NOT EXISTS linked_stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign keys
  mango_identity_id UUID NOT NULL REFERENCES mango_identities(id) ON DELETE CASCADE,
  store_id UUID NOT NULL,

  -- Store metadata
  store_name VARCHAR(255) NOT NULL,

  -- Reference to local client record in that store
  local_client_id UUID NOT NULL,

  -- Link metadata
  linked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  linked_by VARCHAR(20) NOT NULL CHECK (linked_by IN ('client', 'request_approved')),
  access_level VARCHAR(20) NOT NULL DEFAULT 'basic' CHECK (access_level IN ('full', 'basic')),

  -- Sync tracking
  last_sync_at TIMESTAMPTZ DEFAULT NOW(),

  -- Unique constraint: one identity per store
  UNIQUE(mango_identity_id, store_id)
);

-- Create indexes for linked_stores
CREATE INDEX IF NOT EXISTS idx_linked_stores_identity
  ON linked_stores(mango_identity_id);

CREATE INDEX IF NOT EXISTS idx_linked_stores_store
  ON linked_stores(store_id);

CREATE INDEX IF NOT EXISTS idx_linked_stores_client
  ON linked_stores(local_client_id);

-- Add column comments
COMMENT ON TABLE linked_stores IS 'Stores linked to a mango identity';
COMMENT ON COLUMN linked_stores.linked_by IS 'How the link was established: client opt-in or approved request';
COMMENT ON COLUMN linked_stores.access_level IS 'Data access level: full or basic (safety only)';

-- ============================================================================
-- STEP 3: Create profile_link_requests table
-- ============================================================================
-- Profile link requests (24-hour expiry)

CREATE TABLE IF NOT EXISTS profile_link_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Requesting store info
  requesting_store_id UUID NOT NULL,
  requesting_store_name VARCHAR(255) NOT NULL,
  requesting_staff_id UUID,

  -- Target identity
  mango_identity_id UUID NOT NULL REFERENCES mango_identities(id) ON DELETE CASCADE,

  -- Request status
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied', 'expired')),

  -- Timestamps
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  responded_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '24 hours',

  -- Approval mechanism
  approval_token VARCHAR(64) UNIQUE,

  -- Notification tracking
  notification_sent_at TIMESTAMPTZ,
  notification_method VARCHAR(10) CHECK (notification_method IN ('sms', 'email', 'both'))
);

-- Create indexes for profile_link_requests
CREATE INDEX IF NOT EXISTS idx_link_requests_status
  ON profile_link_requests(status)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_link_requests_token
  ON profile_link_requests(approval_token)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_link_requests_identity
  ON profile_link_requests(mango_identity_id);

CREATE INDEX IF NOT EXISTS idx_link_requests_requesting_store
  ON profile_link_requests(requesting_store_id);

-- Add column comments
COMMENT ON TABLE profile_link_requests IS 'Pending profile link requests between stores';
COMMENT ON COLUMN profile_link_requests.expires_at IS '24-hour expiration from request time';
COMMENT ON COLUMN profile_link_requests.approval_token IS 'Secure token for client approval link';

-- ============================================================================
-- STEP 4: Create ecosystem_consent_log table
-- ============================================================================
-- Consent audit log for compliance

CREATE TABLE IF NOT EXISTS ecosystem_consent_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign key
  mango_identity_id UUID NOT NULL REFERENCES mango_identities(id) ON DELETE CASCADE,

  -- Action details
  action VARCHAR(50) NOT NULL,  -- 'opt_in', 'opt_out', 'update_preferences', 'link_store', 'unlink_store'
  details JSONB,

  -- Audit metadata
  ip_address INET,
  user_agent TEXT,

  -- Timestamp
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for consent_log
CREATE INDEX IF NOT EXISTS idx_consent_log_identity
  ON ecosystem_consent_log(mango_identity_id);

CREATE INDEX IF NOT EXISTS idx_consent_log_created_at
  ON ecosystem_consent_log(created_at);

-- Add column comments
COMMENT ON TABLE ecosystem_consent_log IS 'Audit log for all ecosystem consent actions';
COMMENT ON COLUMN ecosystem_consent_log.action IS 'Type of consent action performed';
COMMENT ON COLUMN ecosystem_consent_log.details IS 'Additional context (e.g., changed preferences, store ID)';

-- ============================================================================
-- STEP 5: Add mango_identity_id column to clients table
-- ============================================================================

-- Add mango_identity_id to link clients to ecosystem identity
ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS mango_identity_id UUID REFERENCES mango_identities(id) ON DELETE SET NULL;

-- Create index for clients.mango_identity_id
CREATE INDEX IF NOT EXISTS idx_clients_mango_identity
  ON clients(mango_identity_id)
  WHERE mango_identity_id IS NOT NULL;

-- Add column comment
COMMENT ON COLUMN clients.mango_identity_id IS 'Link to Mango ecosystem identity (if client opted in)';

-- ============================================================================
-- STEP 6: Row Level Security (RLS) Policies
-- ============================================================================

-- Enable RLS on mango_identities
ALTER TABLE mango_identities ENABLE ROW LEVEL SECURITY;

-- No direct SELECT access - only via Edge Functions with service role key
-- This protects hashed identifiers from unauthorized access
CREATE POLICY mango_identities_no_public_access ON mango_identities
  FOR ALL USING (FALSE);

-- Enable RLS on linked_stores
ALTER TABLE linked_stores ENABLE ROW LEVEL SECURITY;

-- Stores can see their own links
-- Note: app.store_id is set via Supabase auth.jwt() -> app_metadata
CREATE POLICY linked_stores_select ON linked_stores
  FOR SELECT USING (
    store_id::text = current_setting('request.jwt.claims', true)::json->>'store_id'
  );

-- Enable RLS on profile_link_requests
ALTER TABLE profile_link_requests ENABLE ROW LEVEL SECURITY;

-- Requesting store can see their outgoing requests
CREATE POLICY link_requests_select_outgoing ON profile_link_requests
  FOR SELECT USING (
    requesting_store_id::text = current_setting('request.jwt.claims', true)::json->>'store_id'
  );

-- Store can see incoming requests for their clients
-- (requires JOIN with clients table to verify ownership)
CREATE POLICY link_requests_select_incoming ON profile_link_requests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM linked_stores ls
      WHERE ls.mango_identity_id = profile_link_requests.mango_identity_id
      AND ls.store_id::text = current_setting('request.jwt.claims', true)::json->>'store_id'
    )
  );

-- Enable RLS on ecosystem_consent_log
ALTER TABLE ecosystem_consent_log ENABLE ROW LEVEL SECURITY;

-- Only accessible via Edge Functions (service role)
CREATE POLICY consent_log_no_public_access ON ecosystem_consent_log
  FOR ALL USING (FALSE);

-- ============================================================================
-- STEP 7: Create updated_at trigger function
-- ============================================================================

-- Trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_mango_identity_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to mango_identities
CREATE TRIGGER mango_identities_updated_at
  BEFORE UPDATE ON mango_identities
  FOR EACH ROW
  EXECUTE FUNCTION update_mango_identity_updated_at();

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
