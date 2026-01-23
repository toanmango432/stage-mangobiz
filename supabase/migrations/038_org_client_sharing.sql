-- ============================================================================
-- Migration: 038_org_client_sharing.sql
-- Description: Organization-level client sharing for multi-location businesses
-- Part of: Client Module Phase 5 - Multi-Store Client Sharing (Tier 2)
-- Reference: scripts/ralph/runs/client-module-phase5-multistore/prd.json
-- Spec: docs/architecture/MULTI_STORE_CLIENT_SPEC.md
-- ============================================================================

-- ============================================================================
-- TIER 2: ORGANIZATION CLIENT SHARING
-- Business-controlled sharing for same-brand multi-location scenarios
-- ============================================================================

-- ============================================================================
-- STEP 1: Create organizations table
-- ============================================================================
-- Central table for multi-location business groupings
-- Note: This extends the tenant concept with client sharing configuration

CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Basic organization info
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE,

  -- Contact info
  email VARCHAR(255),
  phone VARCHAR(50),
  website VARCHAR(255),

  -- Business details
  business_type VARCHAR(50),  -- 'salon', 'spa', 'barbershop', etc.
  timezone VARCHAR(50) DEFAULT 'America/New_York',

  -- Status
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),

  -- Client sharing configuration
  -- Mode: 'full' = all data shared, 'selective' = configurable categories, 'isolated' = safety only
  client_sharing_settings JSONB NOT NULL DEFAULT '{
    "sharingMode": "isolated",
    "sharedCategories": {
      "profiles": false,
      "safetyData": true,
      "visitHistory": false,
      "staffNotes": false,
      "loyaltyData": false,
      "walletData": false
    },
    "loyaltyScope": "location",
    "giftCardScope": "location",
    "membershipScope": "location",
    "allowCrossLocationBooking": false
  }',

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add column comments
COMMENT ON TABLE organizations IS 'Multi-location business organizations (Tier 2 client sharing)';
COMMENT ON COLUMN organizations.slug IS 'URL-friendly unique identifier';
COMMENT ON COLUMN organizations.client_sharing_settings IS 'Client data sharing configuration across organization locations';
COMMENT ON COLUMN organizations.status IS 'Organization status: active, inactive, or suspended';

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_organizations_status
  ON organizations(status)
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_organizations_slug
  ON organizations(slug)
  WHERE slug IS NOT NULL;

-- ============================================================================
-- STEP 2: Add organization_id to stores table
-- ============================================================================
-- Link stores to their organization (if part of a multi-location business)

ALTER TABLE stores
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL;

-- Create index for organization lookups
CREATE INDEX IF NOT EXISTS idx_stores_organization
  ON stores(organization_id)
  WHERE organization_id IS NOT NULL;

-- Add column comment
COMMENT ON COLUMN stores.organization_id IS 'Organization this store belongs to (for multi-location businesses)';

-- ============================================================================
-- STEP 3: Add home_location_id to clients table
-- ============================================================================
-- Track which location is the client's "home" store

ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS home_location_id UUID;

-- Add organization_id to clients for direct org-level queries
ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL;

-- Add organization_visible flag for selective sharing
ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS organization_visible BOOLEAN DEFAULT TRUE;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_clients_home_location
  ON clients(home_location_id)
  WHERE home_location_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_clients_organization
  ON clients(organization_id)
  WHERE organization_id IS NOT NULL;

-- Add column comments
COMMENT ON COLUMN clients.home_location_id IS 'Primary store location for this client';
COMMENT ON COLUMN clients.organization_id IS 'Organization this client belongs to (denormalized for performance)';
COMMENT ON COLUMN clients.organization_visible IS 'Whether client is visible to other org locations';

-- ============================================================================
-- STEP 4: Create cross_location_visits table
-- ============================================================================
-- Track when clients visit locations other than their home store

CREATE TABLE IF NOT EXISTS cross_location_visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign keys
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Location details
  home_store_id UUID NOT NULL,           -- Client's home location
  visiting_store_id UUID NOT NULL,       -- Store being visited

  -- Visit details
  visit_date DATE NOT NULL,
  appointment_id UUID,                    -- Optional link to appointment
  ticket_id UUID,                         -- Optional link to ticket

  -- Metadata
  services_performed TEXT[],              -- Services done during visit
  total_amount DECIMAL(10, 2),           -- Transaction total

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_cross_visits_client
  ON cross_location_visits(client_id);

CREATE INDEX IF NOT EXISTS idx_cross_visits_organization
  ON cross_location_visits(organization_id);

CREATE INDEX IF NOT EXISTS idx_cross_visits_visiting_store
  ON cross_location_visits(visiting_store_id);

CREATE INDEX IF NOT EXISTS idx_cross_visits_client_org
  ON cross_location_visits(client_id, organization_id);

CREATE INDEX IF NOT EXISTS idx_cross_visits_date
  ON cross_location_visits(visit_date);

-- Add column comments
COMMENT ON TABLE cross_location_visits IS 'Track client visits across organization locations';
COMMENT ON COLUMN cross_location_visits.home_store_id IS 'Client''s primary store location';
COMMENT ON COLUMN cross_location_visits.visiting_store_id IS 'Store location being visited';
COMMENT ON COLUMN cross_location_visits.services_performed IS 'Array of services during this visit';

-- ============================================================================
-- STEP 5: Row Level Security (RLS) Policies
-- ============================================================================

-- Enable RLS on organizations
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- Organization members can read their organization
-- Note: Uses JWT claim for store_id, then joins to get organization_id
CREATE POLICY organizations_select ON organizations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM stores s
      WHERE s.organization_id = organizations.id
      AND s.id::text = current_setting('request.jwt.claims', true)::json->>'store_id'
    )
  );

-- Only org admins can update organization settings
CREATE POLICY organizations_update ON organizations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM stores s
      JOIN members m ON m.store_ids @> ARRAY[s.id]
      WHERE s.organization_id = organizations.id
      AND m.auth_user_id = auth.uid()
      AND m.role IN ('owner', 'admin')
    )
  );

-- Enable RLS on cross_location_visits
ALTER TABLE cross_location_visits ENABLE ROW LEVEL SECURITY;

-- Store can see visits to their location
CREATE POLICY cross_visits_select_visiting ON cross_location_visits
  FOR SELECT USING (
    visiting_store_id::text = current_setting('request.jwt.claims', true)::json->>'store_id'
  );

-- Store can see visits by their home clients
CREATE POLICY cross_visits_select_home ON cross_location_visits
  FOR SELECT USING (
    home_store_id::text = current_setting('request.jwt.claims', true)::json->>'store_id'
  );

-- Any org store can insert cross-location visits
CREATE POLICY cross_visits_insert ON cross_location_visits
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM stores s
      WHERE s.organization_id = cross_location_visits.organization_id
      AND s.id::text = current_setting('request.jwt.claims', true)::json->>'store_id'
    )
  );

-- ============================================================================
-- STEP 6: Update clients RLS for organization sharing
-- ============================================================================

-- Add policy for organization client access based on sharing mode
-- Note: This complements existing store-level policies
CREATE POLICY clients_org_select ON clients
  FOR SELECT USING (
    -- Always see own store's clients
    store_id::text = current_setting('request.jwt.claims', true)::json->>'store_id'
    OR
    -- See organization clients based on sharing settings
    (
      organization_id IS NOT NULL
      AND organization_visible = TRUE
      AND EXISTS (
        SELECT 1 FROM organizations o
        JOIN stores s ON s.organization_id = o.id
        WHERE o.id = clients.organization_id
        AND s.id::text = current_setting('request.jwt.claims', true)::json->>'store_id'
        AND (o.client_sharing_settings->>'sharingMode') != 'isolated'
      )
    )
  );

-- ============================================================================
-- STEP 7: Create updated_at trigger for organizations
-- ============================================================================

-- Trigger function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_organization_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to organizations
CREATE TRIGGER organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION update_organization_updated_at();

-- ============================================================================
-- STEP 8: Helper function for organization client sharing check
-- ============================================================================

-- Function to check if a client is accessible to a store based on org sharing
CREATE OR REPLACE FUNCTION can_access_org_client(
  p_client_id UUID,
  p_store_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  v_client_store_id UUID;
  v_client_org_id UUID;
  v_store_org_id UUID;
  v_sharing_mode TEXT;
BEGIN
  -- Get client's store and organization
  SELECT store_id, organization_id INTO v_client_store_id, v_client_org_id
  FROM clients WHERE id = p_client_id;

  -- Same store always has access
  IF v_client_store_id = p_store_id THEN
    RETURN TRUE;
  END IF;

  -- No organization = no cross-store access
  IF v_client_org_id IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Get requesting store's organization
  SELECT organization_id INTO v_store_org_id
  FROM stores WHERE id = p_store_id;

  -- Different organization = no access
  IF v_store_org_id IS NULL OR v_store_org_id != v_client_org_id THEN
    RETURN FALSE;
  END IF;

  -- Get sharing mode
  SELECT client_sharing_settings->>'sharingMode' INTO v_sharing_mode
  FROM organizations WHERE id = v_client_org_id;

  -- Isolated mode = no cross-location access (except safety data via separate function)
  IF v_sharing_mode = 'isolated' THEN
    RETURN FALSE;
  END IF;

  -- Full or selective mode allows access
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add function comment
COMMENT ON FUNCTION can_access_org_client IS 'Check if store can access client based on organization sharing settings';

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
