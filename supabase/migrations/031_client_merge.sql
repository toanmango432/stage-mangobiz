-- ============================================================================
-- Migration: 031_client_merge.sql
-- Description: Add columns to track merged clients for Client Module Phase 1
-- Part of: Client Safety & Booking Controls (Client Merging)
-- Reference: scripts/ralph/runs/client-module-phase1/prd.json
-- ============================================================================

-- ============================================================================
-- STEP 1: Add merge tracking columns to clients table
-- ============================================================================
-- These columns track when a client has been merged into another client.
-- The secondary (merged) client retains its data but is marked as merged.
-- All future lookups should use the primary (merged_into_id) client.

-- Add merged_into_id: References the primary client this client was merged into
ALTER TABLE clients ADD COLUMN IF NOT EXISTS merged_into_id UUID REFERENCES clients(id);

-- Add merged_at: Timestamp when the merge occurred
ALTER TABLE clients ADD COLUMN IF NOT EXISTS merged_at TIMESTAMPTZ;

-- Add merged_by: Staff member who performed the merge operation
ALTER TABLE clients ADD COLUMN IF NOT EXISTS merged_by UUID;

-- ============================================================================
-- STEP 2: Create index for efficient merged client lookups
-- ============================================================================
-- This index optimizes queries that need to find all clients merged into a primary client.
-- Uses partial index (WHERE merged_into_id IS NOT NULL) to save space since most clients
-- are not merged.

CREATE INDEX IF NOT EXISTS idx_clients_merged_into_id
  ON clients(merged_into_id)
  WHERE merged_into_id IS NOT NULL;

-- ============================================================================
-- STEP 3: Add column comments for documentation
-- ============================================================================

COMMENT ON COLUMN clients.merged_into_id IS 'UUID of the primary client this client was merged into. NULL if not merged.';

COMMENT ON COLUMN clients.merged_at IS 'Timestamp when this client was merged into another client. NULL if not merged.';

COMMENT ON COLUMN clients.merged_by IS 'UUID of the staff member who performed the merge. NULL if not merged.';
