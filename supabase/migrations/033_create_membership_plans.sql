-- Migration: 033_create_membership_plans.sql
-- Description: Create membership_plans table for catalog management
-- PRD Reference: scripts/ralph/runs/catalog-online-store/prd.json (US-016)
-- Resolves PREREQ-2: No membership_plans table exists

-- ============================================
-- MEMBERSHIP PLANS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS membership_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Multi-tenant isolation
  tenant_id UUID NOT NULL,
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  location_id UUID,

  -- Core business fields
  name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  price_monthly DECIMAL(10,2) NOT NULL DEFAULT 0,
  description TEXT,
  tagline TEXT,

  -- Visual / branding
  image_url TEXT,
  badge_icon TEXT,
  color TEXT,

  -- Benefits & configuration (JSONB for flexibility)
  perks JSONB NOT NULL DEFAULT '[]',           -- Array of perk description strings
  features JSONB NOT NULL DEFAULT '{}',        -- Feature flags and values (e.g., discountPercentage, complimentaryServices)
  rules JSONB NOT NULL DEFAULT '{}',           -- Business rules (e.g., minCommitmentMonths, cancellationNoticeDays)

  -- Display
  is_popular BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,

  -- Sync metadata
  sync_status TEXT NOT NULL DEFAULT 'local',
  version INTEGER NOT NULL DEFAULT 1,
  vector_clock JSONB NOT NULL DEFAULT '{}',
  last_synced_version INTEGER NOT NULL DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Audit trail
  created_by UUID,
  created_by_device TEXT,
  last_modified_by UUID,
  last_modified_by_device TEXT,

  -- Soft delete (tombstone pattern)
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  deleted_at TIMESTAMPTZ,
  deleted_by UUID,
  deleted_by_device TEXT,
  tombstone_expires_at TIMESTAMPTZ
);

-- Add check constraint for valid sync_status
ALTER TABLE membership_plans ADD CONSTRAINT membership_plans_sync_status_check
CHECK (sync_status IN ('local', 'pending', 'synced', 'conflict', 'error'));

-- Create indexes for common queries
CREATE INDEX idx_membership_plans_store_id ON membership_plans(store_id);
CREATE INDEX idx_membership_plans_store_active ON membership_plans(store_id, is_deleted) WHERE is_deleted = false;
CREATE INDEX idx_membership_plans_sort_order ON membership_plans(store_id, sort_order);
CREATE INDEX idx_membership_plans_sync ON membership_plans(store_id, sync_status) WHERE sync_status != 'synced';
CREATE INDEX idx_membership_plans_updated ON membership_plans(store_id, updated_at DESC);

-- Enable Row Level Security
ALTER TABLE membership_plans ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Store members can view membership plans for their stores
CREATE POLICY "Store members can view own store membership plans"
  ON membership_plans FOR SELECT
  USING (
    store_id IN (
      SELECT unnest(store_ids) FROM members WHERE id = auth.uid()
    )
  );

-- Store members can insert membership plans for their stores
CREATE POLICY "Store members can insert own store membership plans"
  ON membership_plans FOR INSERT
  WITH CHECK (
    store_id IN (
      SELECT unnest(store_ids) FROM members WHERE id = auth.uid()
    )
  );

-- Store members can update membership plans for their stores
CREATE POLICY "Store members can update own store membership plans"
  ON membership_plans FOR UPDATE
  USING (
    store_id IN (
      SELECT unnest(store_ids) FROM members WHERE id = auth.uid()
    )
  );

-- Store members can delete membership plans for their stores
CREATE POLICY "Store members can delete own store membership plans"
  ON membership_plans FOR DELETE
  USING (
    store_id IN (
      SELECT unnest(store_ids) FROM members WHERE id = auth.uid()
    )
  );

-- Create function to auto-update updated_at and increment version
CREATE OR REPLACE FUNCTION update_membership_plans_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  NEW.version = OLD.version + 1;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS membership_plans_updated_at_trigger ON membership_plans;
CREATE TRIGGER membership_plans_updated_at_trigger
  BEFORE UPDATE ON membership_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_membership_plans_updated_at();

-- Add comment for documentation
COMMENT ON TABLE membership_plans IS 'Membership plans for salon/spa subscriptions. Includes pricing, perks (JSONB string array), features (JSONB object for discount percentages, complimentary services, etc.), and rules (JSONB object for commitment and cancellation policies). Supports multi-device sync.';
