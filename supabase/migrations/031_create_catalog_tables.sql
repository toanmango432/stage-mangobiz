-- Migration: 031_create_catalog_tables.sql
-- Description: Create service_categories table for catalog management
-- PRD Reference: docs/PRD-Catalog-Module.md
-- Part of Phase 1: Backend Foundation (US-006)

-- ============================================
-- SERVICE CATEGORIES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS service_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Multi-tenant isolation
  tenant_id UUID NOT NULL,
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  location_id UUID,

  -- Core business fields
  name TEXT NOT NULL,
  description TEXT,
  color TEXT NOT NULL DEFAULT '#6366F1',
  icon TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,

  -- Hierarchy
  parent_category_id UUID REFERENCES service_categories(id),

  -- Online Booking settings (MNU-P1-006)
  show_online_booking BOOLEAN DEFAULT true,

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
ALTER TABLE service_categories ADD CONSTRAINT service_categories_sync_status_check
CHECK (sync_status IN ('local', 'pending', 'synced', 'conflict', 'error'));

-- Create indexes for common queries
CREATE INDEX idx_service_categories_store_id ON service_categories(store_id);
CREATE INDEX idx_service_categories_store_active ON service_categories(store_id, is_deleted) WHERE is_deleted = false;
CREATE INDEX idx_service_categories_display_order ON service_categories(store_id, display_order);
CREATE INDEX idx_service_categories_parent ON service_categories(parent_category_id) WHERE parent_category_id IS NOT NULL;
CREATE INDEX idx_service_categories_sync ON service_categories(store_id, sync_status) WHERE sync_status != 'synced';
CREATE INDEX idx_service_categories_updated ON service_categories(store_id, updated_at DESC);

-- Enable Row Level Security
ALTER TABLE service_categories ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Store members can view categories for their stores
CREATE POLICY "Store members can view own store categories"
  ON service_categories FOR SELECT
  USING (
    store_id IN (
      SELECT unnest(store_ids) FROM members WHERE id = auth.uid()
    )
  );

-- Store members can insert categories for their stores
CREATE POLICY "Store members can insert own store categories"
  ON service_categories FOR INSERT
  WITH CHECK (
    store_id IN (
      SELECT unnest(store_ids) FROM members WHERE id = auth.uid()
    )
  );

-- Store members can update categories for their stores
CREATE POLICY "Store members can update own store categories"
  ON service_categories FOR UPDATE
  USING (
    store_id IN (
      SELECT unnest(store_ids) FROM members WHERE id = auth.uid()
    )
  );

-- Store members can delete categories for their stores
CREATE POLICY "Store members can delete own store categories"
  ON service_categories FOR DELETE
  USING (
    store_id IN (
      SELECT unnest(store_ids) FROM members WHERE id = auth.uid()
    )
  );

-- Create function to auto-update updated_at and increment version
CREATE OR REPLACE FUNCTION update_service_categories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  NEW.version = OLD.version + 1;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS service_categories_updated_at_trigger ON service_categories;
CREATE TRIGGER service_categories_updated_at_trigger
  BEFORE UPDATE ON service_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_service_categories_updated_at();

-- Add comment for documentation
COMMENT ON TABLE service_categories IS 'Service categories for salon/spa menu organization. Supports hierarchical categories, online booking visibility, and multi-device sync.';
