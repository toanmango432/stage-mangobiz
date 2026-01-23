-- ============================================================================
-- Migration: 034_loyalty_program.sql
-- Description: Add loyalty program configuration and rewards tables
-- Part of: Client Module Phase 4 - Loyalty, Reviews, Referrals
-- Reference: scripts/ralph/runs/client-module-phase4-loyalty/prd.json
-- ============================================================================

-- ============================================================================
-- STEP 1: Create loyalty_programs table
-- ============================================================================
-- Stores loyalty program configuration for each store.
-- Each store has one active loyalty program at a time.

CREATE TABLE IF NOT EXISTS loyalty_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,

  -- Program metadata
  name TEXT NOT NULL,

  -- Points earning configuration
  points_per_dollar DECIMAL(10,2) NOT NULL DEFAULT 1.0,
  eligible_categories JSONB NOT NULL DEFAULT '["services", "products", "gift_cards"]',
  include_tax BOOLEAN NOT NULL DEFAULT FALSE,

  -- Points expiration
  points_expiration_months INTEGER,  -- NULL = never expire

  -- Status
  is_active BOOLEAN NOT NULL DEFAULT TRUE,

  -- Sync fields
  sync_status TEXT NOT NULL DEFAULT 'synced',
  sync_version INTEGER NOT NULL DEFAULT 1,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for loyalty_programs
CREATE INDEX IF NOT EXISTS idx_loyalty_programs_store_id
  ON loyalty_programs(store_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_loyalty_programs_store_active
  ON loyalty_programs(store_id)
  WHERE is_active = TRUE;

-- Add column comments
COMMENT ON TABLE loyalty_programs IS 'Loyalty program configuration for each store';
COMMENT ON COLUMN loyalty_programs.points_per_dollar IS 'Number of loyalty points earned per dollar spent (default 1)';
COMMENT ON COLUMN loyalty_programs.eligible_categories IS 'JSONB array of categories that earn points: services, products, gift_cards';
COMMENT ON COLUMN loyalty_programs.include_tax IS 'Whether to include tax when calculating points earned';
COMMENT ON COLUMN loyalty_programs.points_expiration_months IS 'Months until points expire (NULL = never expire)';

-- ============================================================================
-- STEP 2: Create loyalty_tiers table
-- ============================================================================
-- Stores loyalty tier configuration (e.g., Bronze, Silver, Gold).
-- Tiers define benefits clients receive at different point thresholds.

CREATE TABLE IF NOT EXISTS loyalty_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID NOT NULL REFERENCES loyalty_programs(id) ON DELETE CASCADE,

  -- Tier metadata
  name TEXT NOT NULL,
  threshold_points INTEGER NOT NULL,  -- Points required to reach this tier
  tier_order INTEGER NOT NULL,  -- Display order (1 = first tier, 2 = second, etc.)

  -- Benefits stored as JSONB
  benefits JSONB NOT NULL DEFAULT '{}',

  -- Sync fields
  sync_status TEXT NOT NULL DEFAULT 'synced',
  sync_version INTEGER NOT NULL DEFAULT 1,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT unique_tier_order_per_program UNIQUE (program_id, tier_order),
  CONSTRAINT unique_tier_name_per_program UNIQUE (program_id, name)
);

-- Create indexes for loyalty_tiers
CREATE INDEX IF NOT EXISTS idx_loyalty_tiers_program_id
  ON loyalty_tiers(program_id);

CREATE INDEX IF NOT EXISTS idx_loyalty_tiers_order
  ON loyalty_tiers(program_id, tier_order);

-- Add column comments
COMMENT ON TABLE loyalty_tiers IS 'Loyalty tier definitions with benefits at each threshold';
COMMENT ON COLUMN loyalty_tiers.threshold_points IS 'Minimum points required to reach this tier';
COMMENT ON COLUMN loyalty_tiers.tier_order IS 'Display order (1 = entry level, higher = premium)';
COMMENT ON COLUMN loyalty_tiers.benefits IS 'JSONB object with tier benefits: {percentage_discount: 10, free_shipping: true, early_access: true}';

-- ============================================================================
-- STEP 3: Create loyalty_rewards table
-- ============================================================================
-- Stores redeemable rewards that clients can claim with points.

CREATE TABLE IF NOT EXISTS loyalty_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID NOT NULL REFERENCES loyalty_programs(id) ON DELETE CASCADE,

  -- Reward metadata
  name TEXT NOT NULL,
  description TEXT,
  points_required INTEGER NOT NULL,

  -- Reward configuration
  reward_type TEXT NOT NULL CHECK (reward_type IN ('discount', 'free_service', 'free_product', 'percentage')),
  reward_value DECIMAL(10,2) NOT NULL,  -- Dollar amount or percentage value

  -- Eligibility
  eligible_items JSONB DEFAULT '[]',  -- Array of service/product IDs this reward applies to
  expires_days INTEGER,  -- Days until reward expires after redemption (NULL = never)

  -- Status
  is_active BOOLEAN NOT NULL DEFAULT TRUE,

  -- Sync fields
  sync_status TEXT NOT NULL DEFAULT 'synced',
  sync_version INTEGER NOT NULL DEFAULT 1,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for loyalty_rewards
CREATE INDEX IF NOT EXISTS idx_loyalty_rewards_program_id
  ON loyalty_rewards(program_id);

CREATE INDEX IF NOT EXISTS idx_loyalty_rewards_active
  ON loyalty_rewards(program_id, is_active)
  WHERE is_active = TRUE;

-- Add column comments
COMMENT ON TABLE loyalty_rewards IS 'Redeemable loyalty rewards available to clients';
COMMENT ON COLUMN loyalty_rewards.reward_type IS 'Type of reward: discount ($X off), percentage (X% off), free_service, free_product';
COMMENT ON COLUMN loyalty_rewards.reward_value IS 'Dollar amount (for discount) or percentage (for percentage type)';
COMMENT ON COLUMN loyalty_rewards.eligible_items IS 'JSONB array of service/product IDs this reward can be applied to (empty = all items)';
COMMENT ON COLUMN loyalty_rewards.expires_days IS 'Days until reward expires after redemption (NULL = never expires)';

-- ============================================================================
-- STEP 4: Row Level Security Policies
-- ============================================================================

-- Enable RLS
ALTER TABLE loyalty_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_rewards ENABLE ROW LEVEL SECURITY;

-- Loyalty Programs Policies
CREATE POLICY "Staff can view their store's loyalty program"
  ON loyalty_programs FOR SELECT
  USING (
    store_id IN (
      SELECT store_id FROM staff WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Staff can insert loyalty programs for their store"
  ON loyalty_programs FOR INSERT
  WITH CHECK (
    store_id IN (
      SELECT store_id FROM staff WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Staff can update their store's loyalty program"
  ON loyalty_programs FOR UPDATE
  USING (
    store_id IN (
      SELECT store_id FROM staff WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Staff can delete their store's loyalty program"
  ON loyalty_programs FOR DELETE
  USING (
    store_id IN (
      SELECT store_id FROM staff WHERE auth_user_id = auth.uid()
    )
  );

-- Loyalty Tiers Policies
CREATE POLICY "Staff can view tiers for their store's program"
  ON loyalty_tiers FOR SELECT
  USING (
    program_id IN (
      SELECT id FROM loyalty_programs
      WHERE store_id IN (
        SELECT store_id FROM staff WHERE auth_user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Staff can insert tiers for their store's program"
  ON loyalty_tiers FOR INSERT
  WITH CHECK (
    program_id IN (
      SELECT id FROM loyalty_programs
      WHERE store_id IN (
        SELECT store_id FROM staff WHERE auth_user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Staff can update tiers for their store's program"
  ON loyalty_tiers FOR UPDATE
  USING (
    program_id IN (
      SELECT id FROM loyalty_programs
      WHERE store_id IN (
        SELECT store_id FROM staff WHERE auth_user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Staff can delete tiers for their store's program"
  ON loyalty_tiers FOR DELETE
  USING (
    program_id IN (
      SELECT id FROM loyalty_programs
      WHERE store_id IN (
        SELECT store_id FROM staff WHERE auth_user_id = auth.uid()
      )
    )
  );

-- Loyalty Rewards Policies
CREATE POLICY "Staff can view rewards for their store's program"
  ON loyalty_rewards FOR SELECT
  USING (
    program_id IN (
      SELECT id FROM loyalty_programs
      WHERE store_id IN (
        SELECT store_id FROM staff WHERE auth_user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Staff can insert rewards for their store's program"
  ON loyalty_rewards FOR INSERT
  WITH CHECK (
    program_id IN (
      SELECT id FROM loyalty_programs
      WHERE store_id IN (
        SELECT store_id FROM staff WHERE auth_user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Staff can update rewards for their store's program"
  ON loyalty_rewards FOR UPDATE
  USING (
    program_id IN (
      SELECT id FROM loyalty_programs
      WHERE store_id IN (
        SELECT store_id FROM staff WHERE auth_user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Staff can delete rewards for their store's program"
  ON loyalty_rewards FOR DELETE
  USING (
    program_id IN (
      SELECT id FROM loyalty_programs
      WHERE store_id IN (
        SELECT store_id FROM staff WHERE auth_user_id = auth.uid()
      )
    )
  );

-- ============================================================================
-- STEP 5: Create updated_at trigger function and triggers
-- ============================================================================

-- Trigger for loyalty_programs
CREATE TRIGGER set_loyalty_programs_updated_at
  BEFORE UPDATE ON loyalty_programs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for loyalty_tiers
CREATE TRIGGER set_loyalty_tiers_updated_at
  BEFORE UPDATE ON loyalty_tiers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for loyalty_rewards
CREATE TRIGGER set_loyalty_rewards_updated_at
  BEFORE UPDATE ON loyalty_rewards
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
