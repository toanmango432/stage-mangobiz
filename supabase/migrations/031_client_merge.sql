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

-- ============================================================================
-- STEP 4: Create merge_clients RPC function
-- ============================================================================
-- Atomically merges a secondary client into a primary client.
-- All appointments, tickets, and transactions are re-linked to the primary client.
-- Optionally merges notes and loyalty points.
-- The secondary client is marked as merged but not deleted (for audit purposes).

CREATE OR REPLACE FUNCTION merge_clients(
  p_primary_id UUID,
  p_secondary_id UUID,
  p_options JSONB DEFAULT '{}'::JSONB,
  p_merged_by UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_primary_client RECORD;
  v_secondary_client RECORD;
  v_merge_notes BOOLEAN;
  v_merge_loyalty BOOLEAN;
  v_merged_notes JSONB;
  v_merged_loyalty JSONB;
  v_appointments_updated INTEGER;
  v_tickets_updated INTEGER;
  v_transactions_updated INTEGER;
  v_result JSONB;
BEGIN
  -- Validate inputs
  IF p_primary_id IS NULL OR p_secondary_id IS NULL THEN
    RAISE EXCEPTION 'Both primary_id and secondary_id are required';
  END IF;

  IF p_primary_id = p_secondary_id THEN
    RAISE EXCEPTION 'Cannot merge a client with itself';
  END IF;

  -- Extract options (default to false if not specified)
  v_merge_notes := COALESCE((p_options->>'mergeNotes')::BOOLEAN, FALSE);
  v_merge_loyalty := COALESCE((p_options->>'mergeLoyalty')::BOOLEAN, FALSE);

  -- Lock and fetch primary client
  SELECT * INTO v_primary_client
  FROM clients
  WHERE id = p_primary_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Primary client not found: %', p_primary_id;
  END IF;

  -- Lock and fetch secondary client
  SELECT * INTO v_secondary_client
  FROM clients
  WHERE id = p_secondary_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Secondary client not found: %', p_secondary_id;
  END IF;

  -- Check if secondary is already merged
  IF v_secondary_client.merged_into_id IS NOT NULL THEN
    RAISE EXCEPTION 'Secondary client is already merged into another client: %', v_secondary_client.merged_into_id;
  END IF;

  -- Check if primary is a merged client (don't merge into a merged client)
  IF v_primary_client.merged_into_id IS NOT NULL THEN
    RAISE EXCEPTION 'Cannot merge into a client that has already been merged: %', p_primary_id;
  END IF;

  -- Re-link appointments from secondary to primary
  UPDATE appointments
  SET client_id = p_primary_id,
      updated_at = NOW()
  WHERE client_id = p_secondary_id;
  GET DIAGNOSTICS v_appointments_updated = ROW_COUNT;

  -- Re-link tickets from secondary to primary
  UPDATE tickets
  SET client_id = p_primary_id,
      updated_at = NOW()
  WHERE client_id = p_secondary_id;
  GET DIAGNOSTICS v_tickets_updated = ROW_COUNT;

  -- Re-link transactions from secondary to primary
  UPDATE transactions
  SET client_id = p_primary_id,
      updated_at = NOW()
  WHERE client_id = p_secondary_id;
  GET DIAGNOSTICS v_transactions_updated = ROW_COUNT;

  -- Merge notes if requested
  IF v_merge_notes AND v_secondary_client.notes IS NOT NULL AND v_secondary_client.notes != '[]'::JSONB THEN
    -- Concatenate notes arrays
    v_merged_notes := COALESCE(v_primary_client.notes, '[]'::JSONB) || v_secondary_client.notes;

    UPDATE clients
    SET notes = v_merged_notes,
        updated_at = NOW()
    WHERE id = p_primary_id;
  END IF;

  -- Merge loyalty points if requested
  IF v_merge_loyalty AND v_secondary_client.loyalty_info IS NOT NULL THEN
    -- Add loyalty points together
    v_merged_loyalty := jsonb_build_object(
      'points', COALESCE((v_primary_client.loyalty_info->>'points')::INTEGER, 0) +
                COALESCE((v_secondary_client.loyalty_info->>'points')::INTEGER, 0),
      'tier', COALESCE(v_primary_client.loyalty_info->>'tier', v_secondary_client.loyalty_info->>'tier', 'bronze'),
      'visits', COALESCE((v_primary_client.loyalty_info->>'visits')::INTEGER, 0) +
                COALESCE((v_secondary_client.loyalty_info->>'visits')::INTEGER, 0)
    );

    UPDATE clients
    SET loyalty_info = v_merged_loyalty,
        updated_at = NOW()
    WHERE id = p_primary_id;
  END IF;

  -- Mark secondary client as merged
  UPDATE clients
  SET merged_into_id = p_primary_id,
      merged_at = NOW(),
      merged_by = p_merged_by,
      updated_at = NOW()
  WHERE id = p_secondary_id;

  -- Fetch the updated primary client for return
  SELECT * INTO v_primary_client
  FROM clients
  WHERE id = p_primary_id;

  -- Build result object
  v_result := jsonb_build_object(
    'success', TRUE,
    'primary_client_id', p_primary_id,
    'secondary_client_id', p_secondary_id,
    'merged_at', NOW(),
    'records_updated', jsonb_build_object(
      'appointments', v_appointments_updated,
      'tickets', v_tickets_updated,
      'transactions', v_transactions_updated
    ),
    'options_applied', jsonb_build_object(
      'mergeNotes', v_merge_notes,
      'mergeLoyalty', v_merge_loyalty
    ),
    'primary_client', to_jsonb(v_primary_client)
  );

  RETURN v_result;
EXCEPTION
  WHEN OTHERS THEN
    -- Re-raise the exception to rollback the transaction
    RAISE;
END;
$$;

-- Add comment for the function
COMMENT ON FUNCTION merge_clients(UUID, UUID, JSONB, UUID) IS 'Atomically merges a secondary client into a primary client. Re-links appointments, tickets, and transactions. Optionally merges notes and loyalty points. Returns a summary of the merge operation.';
