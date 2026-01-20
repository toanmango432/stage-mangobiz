-- ============================================================================
-- Migration: 030_create_member_session_revocations.sql
-- Description: Create table to track session revocations for immediate logout
-- Part of: Authentication Migration (Store App → Supabase Auth)
-- Reference: docs/AUTH_MIGRATION_PLAN.md v1.1
-- ============================================================================

-- ============================================================================
-- STEP 1: Create session revocations table
-- ============================================================================
-- This table enables immediate session revocation across all devices.
-- When a record is added, all sessions created before revoke_all_before
-- are considered invalid and the user will be forced to re-authenticate.

CREATE TABLE IF NOT EXISTS member_session_revocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  revoked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reason TEXT,
  revoke_all_before TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- STEP 2: Create index for efficient member lookups
-- ============================================================================
-- Background validation checks this table on every PIN login when online.
-- Index enables fast lookup by member_id.

CREATE INDEX IF NOT EXISTS idx_session_revocations_member
  ON member_session_revocations(member_id);

-- ============================================================================
-- STEP 3: Add RLS policies for secure access
-- ============================================================================
-- Enable RLS on the table
ALTER TABLE member_session_revocations ENABLE ROW LEVEL SECURITY;

-- Policy: Service role can manage all revocations (for admin operations)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'session_revocations_service_role_all'
  ) THEN
    CREATE POLICY "session_revocations_service_role_all" ON member_session_revocations
      FOR ALL
      USING (auth.role() = 'service_role');
  END IF;
END $$;

-- Policy: Members can read their own revocations (for background validation)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'session_revocations_read_own'
  ) THEN
    CREATE POLICY "session_revocations_read_own" ON member_session_revocations
      FOR SELECT
      USING (
        member_id IN (
          SELECT id FROM members WHERE auth_user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- ============================================================================
-- STEP 4: Add table and column comments
-- ============================================================================
COMMENT ON TABLE member_session_revocations IS 'Tracks session revocations for immediate logout across all devices. When a revocation is added, sessions created before revoke_all_before are invalidated.';

COMMENT ON COLUMN member_session_revocations.id IS 'Unique identifier for the revocation record';

COMMENT ON COLUMN member_session_revocations.member_id IS 'Reference to the member whose sessions are being revoked';

COMMENT ON COLUMN member_session_revocations.revoked_at IS 'Timestamp when the revocation was created';

COMMENT ON COLUMN member_session_revocations.reason IS 'Reason for revocation: password_change, admin_revoke, security_concern';

COMMENT ON COLUMN member_session_revocations.revoke_all_before IS 'Sessions created before this timestamp are invalid and require re-authentication';
