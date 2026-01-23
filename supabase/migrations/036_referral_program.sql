-- ============================================================================
-- Migration: 036_referral_program.sql
-- Description: Add referral program configuration and tracking tables
-- Part of: Client Module Phase 4 - Loyalty, Reviews, Referrals
-- Reference: scripts/ralph/runs/client-module-phase4-loyalty/prd.json
-- ============================================================================

-- ============================================================================
-- STEP 1: Create referral_settings table
-- ============================================================================
-- Stores referral program configuration for each store.
-- Controls rewards for both referrer (existing client) and referee (new client).

CREATE TABLE IF NOT EXISTS referral_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,

  -- Program settings
  enabled BOOLEAN NOT NULL DEFAULT FALSE,
  expires_days INTEGER,  -- Days until referral code expires (NULL = never expires)

  -- Referrer rewards (existing client who refers)
  referrer_reward_type TEXT NOT NULL DEFAULT 'points' CHECK (referrer_reward_type IN ('points', 'credit', 'discount', 'percentage')),
  referrer_reward_value DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  -- points: number of points, credit: dollar amount, discount: dollar amount, percentage: percentage value

  -- Referee rewards (new client being referred)
  referee_discount_type TEXT NOT NULL DEFAULT 'percentage' CHECK (referee_discount_type IN ('percentage', 'fixed')),
  referee_discount_value DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  -- percentage: percentage off, fixed: dollar amount off

  -- Sync fields
  sync_status TEXT NOT NULL DEFAULT 'synced',
  sync_version INTEGER NOT NULL DEFAULT 1,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT unique_referral_settings_per_store UNIQUE (store_id)
);

-- Create index for referral_settings
CREATE INDEX IF NOT EXISTS idx_referral_settings_store_id
  ON referral_settings(store_id);

-- Add column comments
COMMENT ON TABLE referral_settings IS 'Referral program configuration per store';
COMMENT ON COLUMN referral_settings.expires_days IS 'Days until referral code expires (NULL = never expires)';
COMMENT ON COLUMN referral_settings.referrer_reward_type IS 'Type of reward for referrer: points, credit (dollar amount), discount (dollar amount), or percentage';
COMMENT ON COLUMN referral_settings.referrer_reward_value IS 'Value of referrer reward based on type';
COMMENT ON COLUMN referral_settings.referee_discount_type IS 'Type of discount for new client: percentage or fixed dollar amount';
COMMENT ON COLUMN referral_settings.referee_discount_value IS 'Value of referee discount based on type';

-- ============================================================================
-- STEP 2: Add referral_code column to clients table
-- ============================================================================
-- Each client gets a unique referral code per store.
-- Format: {FIRSTNAME}{RANDOM4} e.g., JANE1234

-- Add referral_code column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clients' AND column_name = 'referral_code'
  ) THEN
    ALTER TABLE clients ADD COLUMN referral_code TEXT;
  END IF;
END $$;

-- Create unique index for referral codes (unique per store)
CREATE UNIQUE INDEX IF NOT EXISTS idx_clients_referral_code_store_id
  ON clients(referral_code, store_id) WHERE referral_code IS NOT NULL;

-- Add column comment
COMMENT ON COLUMN clients.referral_code IS 'Unique referral code per client per store. Format: {FIRSTNAME}{RANDOM4} e.g., JANE1234';

-- ============================================================================
-- STEP 3: Create referral_tracking table
-- ============================================================================
-- Tracks referral usage and rewards.
-- Records when a new client uses a referral code and when rewards are issued.

CREATE TABLE IF NOT EXISTS referral_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  referee_client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,

  -- Tracking details
  code_used TEXT NOT NULL,  -- The referral code that was used
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'expired')),
  -- pending: referee registered but hasn't completed first visit
  -- completed: referee completed first visit, reward issued to referrer
  -- expired: referral code expired before completion

  -- Reward tracking
  reward_issued_at TIMESTAMPTZ,  -- When the referrer received their reward

  -- Sync fields
  sync_status TEXT NOT NULL DEFAULT 'synced',
  sync_version INTEGER NOT NULL DEFAULT 1,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Prevent self-referrals at database level
  CONSTRAINT no_self_referral CHECK (referrer_client_id != referee_client_id)
);

-- Create indexes for referral_tracking
CREATE INDEX IF NOT EXISTS idx_referral_tracking_referrer_client_id
  ON referral_tracking(referrer_client_id);

CREATE INDEX IF NOT EXISTS idx_referral_tracking_referee_client_id
  ON referral_tracking(referee_client_id);

CREATE INDEX IF NOT EXISTS idx_referral_tracking_store_id
  ON referral_tracking(store_id);

CREATE INDEX IF NOT EXISTS idx_referral_tracking_status
  ON referral_tracking(store_id, status);

CREATE INDEX IF NOT EXISTS idx_referral_tracking_code_used
  ON referral_tracking(code_used);

CREATE INDEX IF NOT EXISTS idx_referral_tracking_created_at
  ON referral_tracking(created_at);

-- Add column comments
COMMENT ON TABLE referral_tracking IS 'Tracks referral usage and rewards';
COMMENT ON COLUMN referral_tracking.code_used IS 'The referral code that was used by the referee';
COMMENT ON COLUMN referral_tracking.status IS 'Referral status: pending (registered, no visit), completed (first visit done, reward issued), expired (code expired)';
COMMENT ON COLUMN referral_tracking.reward_issued_at IS 'When the referrer received their reward (when status changed to completed)';

-- ============================================================================
-- STEP 4: Row Level Security Policies
-- ============================================================================

-- Enable RLS
ALTER TABLE referral_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_tracking ENABLE ROW LEVEL SECURITY;

-- Referral Settings Policies
CREATE POLICY "Staff can view their store's referral settings"
  ON referral_settings FOR SELECT
  USING (
    store_id IN (
      SELECT store_id FROM staff WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Staff can insert referral settings for their store"
  ON referral_settings FOR INSERT
  WITH CHECK (
    store_id IN (
      SELECT store_id FROM staff WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Staff can update their store's referral settings"
  ON referral_settings FOR UPDATE
  USING (
    store_id IN (
      SELECT store_id FROM staff WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Staff can delete their store's referral settings"
  ON referral_settings FOR DELETE
  USING (
    store_id IN (
      SELECT store_id FROM staff WHERE auth_user_id = auth.uid()
    )
  );

-- Referral Tracking Policies
CREATE POLICY "Staff can view referral tracking for their store"
  ON referral_tracking FOR SELECT
  USING (
    store_id IN (
      SELECT store_id FROM staff WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Staff can insert referral tracking for their store"
  ON referral_tracking FOR INSERT
  WITH CHECK (
    store_id IN (
      SELECT store_id FROM staff WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Staff can update referral tracking for their store"
  ON referral_tracking FOR UPDATE
  USING (
    store_id IN (
      SELECT store_id FROM staff WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Staff can delete referral tracking for their store"
  ON referral_tracking FOR DELETE
  USING (
    store_id IN (
      SELECT store_id FROM staff WHERE auth_user_id = auth.uid()
    )
  );

-- ============================================================================
-- STEP 5: Create updated_at trigger function and triggers
-- ============================================================================

-- Trigger for referral_settings
CREATE TRIGGER set_referral_settings_updated_at
  BEFORE UPDATE ON referral_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for referral_tracking
CREATE TRIGGER set_referral_tracking_updated_at
  BEFORE UPDATE ON referral_tracking
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
