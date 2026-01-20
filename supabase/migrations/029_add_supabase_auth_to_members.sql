-- ============================================================================
-- Migration: 029_add_supabase_auth_to_members.sql
-- Description: Link members table to Supabase Auth for unified identity
-- Part of: Authentication Migration (Store App → Supabase Auth)
-- Reference: docs/AUTH_MIGRATION_PLAN.md v1.1
-- ============================================================================

-- ============================================================================
-- STEP 1: Add Supabase Auth link column
-- ============================================================================
-- auth_user_id links to Supabase auth.users.id for unified identity
-- Note: We do NOT add a FK constraint to auth.users (cross-schema issues)
ALTER TABLE members
ADD COLUMN IF NOT EXISTS auth_user_id UUID UNIQUE;

-- ============================================================================
-- STEP 2: Add PIN security columns
-- ============================================================================
-- pin_hash stores bcrypt-hashed PIN (replaces plaintext pin column)
ALTER TABLE members
ADD COLUMN IF NOT EXISTS pin_hash TEXT;

-- pin_legacy stores original plaintext PIN for rollback (cleared after migration verified)
ALTER TABLE members
ADD COLUMN IF NOT EXISTS pin_legacy TEXT;

-- pin_attempts tracks failed PIN attempts (resets on success)
ALTER TABLE members
ADD COLUMN IF NOT EXISTS pin_attempts INTEGER DEFAULT 0;

-- pin_locked_until stores lockout timestamp after max failed attempts
ALTER TABLE members
ADD COLUMN IF NOT EXISTS pin_locked_until TIMESTAMPTZ;

-- ============================================================================
-- STEP 3: Add authentication tracking columns
-- ============================================================================
-- last_online_auth tracks last successful Supabase Auth login (for offline grace)
ALTER TABLE members
ADD COLUMN IF NOT EXISTS last_online_auth TIMESTAMPTZ;

-- offline_grace_period defines how long offline PIN access is allowed
ALTER TABLE members
ADD COLUMN IF NOT EXISTS offline_grace_period INTERVAL DEFAULT '7 days';

-- password_changed_at forces re-auth on all devices after password reset
ALTER TABLE members
ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMPTZ;

-- ============================================================================
-- STEP 4: Add multi-store support column
-- ============================================================================
-- default_store_id allows multi-store users to set a preferred store
ALTER TABLE members
ADD COLUMN IF NOT EXISTS default_store_id UUID REFERENCES stores(id) ON DELETE SET NULL;

-- ============================================================================
-- STEP 5: Create index for efficient auth lookups
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_members_auth_user_id
  ON members(auth_user_id)
  WHERE auth_user_id IS NOT NULL;

-- ============================================================================
-- STEP 6: Add RLS policies for auth-based access
-- ============================================================================
-- Policy: Members can read their own profile via Supabase Auth
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'members_read_own_profile_via_auth'
  ) THEN
    CREATE POLICY "members_read_own_profile_via_auth" ON members
      FOR SELECT
      USING (auth.uid() = auth_user_id);
  END IF;
END $$;

-- Policy: Members can update their own profile via Supabase Auth
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'members_update_own_profile_via_auth'
  ) THEN
    CREATE POLICY "members_update_own_profile_via_auth" ON members
      FOR UPDATE
      USING (auth.uid() = auth_user_id)
      WITH CHECK (auth.uid() = auth_user_id);
  END IF;
END $$;

-- ============================================================================
-- STEP 7: Add column comments for documentation
-- ============================================================================
COMMENT ON COLUMN members.auth_user_id IS 'Links to Supabase auth.users.id for unified identity across Store App, Control Center, and other apps';

COMMENT ON COLUMN members.pin_hash IS 'bcrypt hash (cost factor 12) of POS PIN for offline/quick authentication. PIN is 4-6 digits.';

COMMENT ON COLUMN members.pin_legacy IS 'Original plaintext PIN preserved for rollback during migration. Clear after migration verified successful.';

COMMENT ON COLUMN members.pin_attempts IS 'Failed PIN attempts counter. Resets to 0 on successful login. Locks at 5 attempts.';

COMMENT ON COLUMN members.pin_locked_until IS 'PIN locked until this timestamp after 5 failed attempts. 15-minute lockout period.';

COMMENT ON COLUMN members.last_online_auth IS 'Timestamp of last successful Supabase Auth login. Used to calculate offline grace period.';

COMMENT ON COLUMN members.offline_grace_period IS 'How long offline PIN access is allowed after last online auth. Default 7 days.';

COMMENT ON COLUMN members.password_changed_at IS 'Timestamp of last password change. Sessions created before this time are invalidated.';

COMMENT ON COLUMN members.default_store_id IS 'Preferred store for multi-store users. Auto-selected on login if set.';
