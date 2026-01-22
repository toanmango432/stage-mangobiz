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

-- ============================================
-- MENU SERVICES TABLE (US-007)
-- ============================================

CREATE TABLE IF NOT EXISTS menu_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Multi-tenant isolation
  tenant_id UUID NOT NULL,
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  location_id UUID,

  -- Foreign key to category
  category_id UUID NOT NULL REFERENCES service_categories(id) ON DELETE CASCADE,

  -- Core fields
  name TEXT NOT NULL,
  description TEXT,
  sku TEXT,

  -- Pricing
  pricing_type TEXT NOT NULL DEFAULT 'fixed',
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  price_max DECIMAL(10,2),
  cost DECIMAL(10,2),
  taxable BOOLEAN NOT NULL DEFAULT true,

  -- Duration
  duration INTEGER NOT NULL DEFAULT 30,

  -- Extra time (Fresha-style)
  extra_time INTEGER,
  extra_time_type TEXT,

  -- Client care
  aftercare_instructions TEXT,
  requires_patch_test BOOLEAN DEFAULT false,

  -- Variants
  has_variants BOOLEAN NOT NULL DEFAULT false,
  variant_count INTEGER NOT NULL DEFAULT 0,

  -- Staff assignment
  all_staff_can_perform BOOLEAN NOT NULL DEFAULT true,

  -- Booking settings
  booking_availability TEXT NOT NULL DEFAULT 'both',
  online_booking_enabled BOOLEAN NOT NULL DEFAULT true,
  requires_deposit BOOLEAN NOT NULL DEFAULT false,
  deposit_amount DECIMAL(10,2),
  deposit_percentage INTEGER,

  -- Online booking limits
  online_booking_buffer_minutes INTEGER,
  advance_booking_days_min INTEGER,
  advance_booking_days_max INTEGER,

  -- Rebook reminder
  rebook_reminder_days INTEGER,

  -- Turn weight for queue calculations
  turn_weight DECIMAL(3,1) DEFAULT 1.0,

  -- Additional settings
  commission_rate DECIMAL(5,2),
  color TEXT,
  images TEXT[],
  tags TEXT[],

  -- Visibility & Status
  status TEXT NOT NULL DEFAULT 'active',
  display_order INTEGER NOT NULL DEFAULT 0,
  show_price_online BOOLEAN NOT NULL DEFAULT true,
  allow_custom_duration BOOLEAN NOT NULL DEFAULT false,

  -- Archive fields
  archived_at TIMESTAMPTZ,
  archived_by UUID,

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

-- Add check constraints
ALTER TABLE menu_services ADD CONSTRAINT menu_services_sync_status_check
CHECK (sync_status IN ('local', 'pending', 'synced', 'conflict', 'error'));

ALTER TABLE menu_services ADD CONSTRAINT menu_services_pricing_type_check
CHECK (pricing_type IN ('fixed', 'from', 'free', 'varies', 'hourly'));

ALTER TABLE menu_services ADD CONSTRAINT menu_services_status_check
CHECK (status IN ('active', 'inactive', 'archived'));

ALTER TABLE menu_services ADD CONSTRAINT menu_services_booking_availability_check
CHECK (booking_availability IN ('online', 'in-store', 'both', 'disabled'));

ALTER TABLE menu_services ADD CONSTRAINT menu_services_extra_time_type_check
CHECK (extra_time_type IS NULL OR extra_time_type IN ('processing', 'blocked', 'finishing'));

-- Create indexes for common queries
CREATE INDEX idx_menu_services_store_id ON menu_services(store_id);
CREATE INDEX idx_menu_services_category_id ON menu_services(category_id);
CREATE INDEX idx_menu_services_store_active ON menu_services(store_id, is_deleted) WHERE is_deleted = false;
CREATE INDEX idx_menu_services_store_status ON menu_services(store_id, status) WHERE is_deleted = false;
CREATE INDEX idx_menu_services_display_order ON menu_services(store_id, category_id, display_order);
CREATE INDEX idx_menu_services_sync ON menu_services(store_id, sync_status) WHERE sync_status != 'synced';
CREATE INDEX idx_menu_services_updated ON menu_services(store_id, updated_at DESC);
CREATE INDEX idx_menu_services_sku ON menu_services(store_id, sku) WHERE sku IS NOT NULL;
CREATE INDEX idx_menu_services_booking ON menu_services(store_id, online_booking_enabled) WHERE is_deleted = false AND status = 'active';

-- Enable Row Level Security
ALTER TABLE menu_services ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Store members can view own store services"
  ON menu_services FOR SELECT
  USING (
    store_id IN (
      SELECT unnest(store_ids) FROM members WHERE id = auth.uid()
    )
  );

CREATE POLICY "Store members can insert own store services"
  ON menu_services FOR INSERT
  WITH CHECK (
    store_id IN (
      SELECT unnest(store_ids) FROM members WHERE id = auth.uid()
    )
  );

CREATE POLICY "Store members can update own store services"
  ON menu_services FOR UPDATE
  USING (
    store_id IN (
      SELECT unnest(store_ids) FROM members WHERE id = auth.uid()
    )
  );

CREATE POLICY "Store members can delete own store services"
  ON menu_services FOR DELETE
  USING (
    store_id IN (
      SELECT unnest(store_ids) FROM members WHERE id = auth.uid()
    )
  );

-- Create function for auto-updating updated_at and incrementing version
CREATE OR REPLACE FUNCTION update_menu_services_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  NEW.version = OLD.version + 1;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS menu_services_updated_at_trigger ON menu_services;
CREATE TRIGGER menu_services_updated_at_trigger
  BEFORE UPDATE ON menu_services
  FOR EACH ROW
  EXECUTE FUNCTION update_menu_services_updated_at();

-- Add comment for documentation
COMMENT ON TABLE menu_services IS 'Services offered by salon/spa. Includes pricing, duration, booking settings, and staff assignment. Supports variants for different service levels (e.g., short/medium/long hair).';

-- ============================================
-- SERVICE VARIANTS TABLE (US-007)
-- ============================================

CREATE TABLE IF NOT EXISTS service_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Multi-tenant isolation
  tenant_id UUID NOT NULL,
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  location_id UUID,

  -- Foreign key to service
  service_id UUID NOT NULL REFERENCES menu_services(id) ON DELETE CASCADE,

  -- Core fields
  name TEXT NOT NULL,
  duration INTEGER NOT NULL,
  price DECIMAL(10,2) NOT NULL,

  -- Extra time (Fresha-style)
  extra_time INTEGER,
  extra_time_type TEXT,

  -- Status
  is_default BOOLEAN NOT NULL DEFAULT false,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,

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

-- Add check constraints
ALTER TABLE service_variants ADD CONSTRAINT service_variants_sync_status_check
CHECK (sync_status IN ('local', 'pending', 'synced', 'conflict', 'error'));

ALTER TABLE service_variants ADD CONSTRAINT service_variants_extra_time_type_check
CHECK (extra_time_type IS NULL OR extra_time_type IN ('processing', 'blocked', 'finishing'));

-- Create indexes for common queries
CREATE INDEX idx_service_variants_store_id ON service_variants(store_id);
CREATE INDEX idx_service_variants_service_id ON service_variants(service_id);
CREATE INDEX idx_service_variants_store_active ON service_variants(store_id, is_deleted) WHERE is_deleted = false;
CREATE INDEX idx_service_variants_display_order ON service_variants(service_id, display_order);
CREATE INDEX idx_service_variants_sync ON service_variants(store_id, sync_status) WHERE sync_status != 'synced';
CREATE INDEX idx_service_variants_updated ON service_variants(store_id, updated_at DESC);
CREATE INDEX idx_service_variants_default ON service_variants(service_id, is_default) WHERE is_default = true;

-- Enable Row Level Security
ALTER TABLE service_variants ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Store members can view own store variants"
  ON service_variants FOR SELECT
  USING (
    store_id IN (
      SELECT unnest(store_ids) FROM members WHERE id = auth.uid()
    )
  );

CREATE POLICY "Store members can insert own store variants"
  ON service_variants FOR INSERT
  WITH CHECK (
    store_id IN (
      SELECT unnest(store_ids) FROM members WHERE id = auth.uid()
    )
  );

CREATE POLICY "Store members can update own store variants"
  ON service_variants FOR UPDATE
  USING (
    store_id IN (
      SELECT unnest(store_ids) FROM members WHERE id = auth.uid()
    )
  );

CREATE POLICY "Store members can delete own store variants"
  ON service_variants FOR DELETE
  USING (
    store_id IN (
      SELECT unnest(store_ids) FROM members WHERE id = auth.uid()
    )
  );

-- Create function for auto-updating updated_at and incrementing version
CREATE OR REPLACE FUNCTION update_service_variants_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  NEW.version = OLD.version + 1;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS service_variants_updated_at_trigger ON service_variants;
CREATE TRIGGER service_variants_updated_at_trigger
  BEFORE UPDATE ON service_variants
  FOR EACH ROW
  EXECUTE FUNCTION update_service_variants_updated_at();

-- Add comment for documentation
COMMENT ON TABLE service_variants IS 'Service variants for different pricing/duration options (e.g., Short Hair, Medium Hair, Long Hair). Each variant belongs to a parent service.';

-- ============================================
-- SERVICE PACKAGES TABLE (US-008)
-- ============================================

CREATE TABLE IF NOT EXISTS service_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Multi-tenant isolation
  tenant_id UUID NOT NULL,
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  location_id UUID,

  -- Core fields
  name TEXT NOT NULL,
  description TEXT,

  -- Services included (stored as JSONB array - PackageServiceItem[])
  -- Each item: { serviceId, serviceName, variantId, variantName, quantity, originalPrice }
  services JSONB NOT NULL DEFAULT '[]',

  -- Pricing
  original_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  package_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  discount_type TEXT NOT NULL DEFAULT 'fixed',
  discount_value DECIMAL(10,2) NOT NULL DEFAULT 0,

  -- Booking mode (Fresha-style)
  booking_mode TEXT NOT NULL DEFAULT 'single-session',

  -- Validity
  validity_days INTEGER,
  usage_limit INTEGER,

  -- Booking settings
  booking_availability TEXT NOT NULL DEFAULT 'both',
  online_booking_enabled BOOLEAN NOT NULL DEFAULT true,

  -- Staff restrictions
  restricted_staff_ids TEXT[],

  -- Status
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,

  -- Visual
  color TEXT,
  images TEXT[],

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

-- Add check constraints
ALTER TABLE service_packages ADD CONSTRAINT service_packages_sync_status_check
CHECK (sync_status IN ('local', 'pending', 'synced', 'conflict', 'error'));

ALTER TABLE service_packages ADD CONSTRAINT service_packages_discount_type_check
CHECK (discount_type IN ('fixed', 'percentage'));

ALTER TABLE service_packages ADD CONSTRAINT service_packages_booking_mode_check
CHECK (booking_mode IN ('single-session', 'multiple-visits'));

ALTER TABLE service_packages ADD CONSTRAINT service_packages_booking_availability_check
CHECK (booking_availability IN ('online', 'in-store', 'both', 'disabled'));

-- Create indexes for common queries
CREATE INDEX idx_service_packages_store_id ON service_packages(store_id);
CREATE INDEX idx_service_packages_store_active ON service_packages(store_id, is_deleted) WHERE is_deleted = false;
CREATE INDEX idx_service_packages_display_order ON service_packages(store_id, display_order);
CREATE INDEX idx_service_packages_sync ON service_packages(store_id, sync_status) WHERE sync_status != 'synced';
CREATE INDEX idx_service_packages_updated ON service_packages(store_id, updated_at DESC);
CREATE INDEX idx_service_packages_booking ON service_packages(store_id, online_booking_enabled) WHERE is_deleted = false AND is_active = true;

-- Enable Row Level Security
ALTER TABLE service_packages ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Store members can view own store packages"
  ON service_packages FOR SELECT
  USING (
    store_id IN (
      SELECT unnest(store_ids) FROM members WHERE id = auth.uid()
    )
  );

CREATE POLICY "Store members can insert own store packages"
  ON service_packages FOR INSERT
  WITH CHECK (
    store_id IN (
      SELECT unnest(store_ids) FROM members WHERE id = auth.uid()
    )
  );

CREATE POLICY "Store members can update own store packages"
  ON service_packages FOR UPDATE
  USING (
    store_id IN (
      SELECT unnest(store_ids) FROM members WHERE id = auth.uid()
    )
  );

CREATE POLICY "Store members can delete own store packages"
  ON service_packages FOR DELETE
  USING (
    store_id IN (
      SELECT unnest(store_ids) FROM members WHERE id = auth.uid()
    )
  );

-- Create function for auto-updating updated_at and incrementing version
CREATE OR REPLACE FUNCTION update_service_packages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  NEW.version = OLD.version + 1;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS service_packages_updated_at_trigger ON service_packages;
CREATE TRIGGER service_packages_updated_at_trigger
  BEFORE UPDATE ON service_packages
  FOR EACH ROW
  EXECUTE FUNCTION update_service_packages_updated_at();

-- Add comment for documentation
COMMENT ON TABLE service_packages IS 'Service packages/bundles for discounted service combinations. Services array stores PackageServiceItem[] as JSONB. Supports single-session or multiple-visits booking modes.';

-- ============================================
-- ADD-ON GROUPS TABLE (US-009)
-- ============================================

CREATE TABLE IF NOT EXISTS add_on_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Multi-tenant isolation
  tenant_id UUID NOT NULL,
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  location_id UUID,

  -- Core fields
  name TEXT NOT NULL,
  description TEXT,

  -- Selection rules
  selection_mode TEXT NOT NULL DEFAULT 'single',
  min_selections INTEGER NOT NULL DEFAULT 0,
  max_selections INTEGER,
  is_required BOOLEAN NOT NULL DEFAULT false,

  -- Applicability (which services/categories this add-on group applies to)
  applicable_to_all BOOLEAN NOT NULL DEFAULT false,
  applicable_category_ids TEXT[] DEFAULT '{}',
  applicable_service_ids TEXT[] DEFAULT '{}',

  -- Status
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  online_booking_enabled BOOLEAN NOT NULL DEFAULT true,

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

-- Add check constraints
ALTER TABLE add_on_groups ADD CONSTRAINT add_on_groups_sync_status_check
CHECK (sync_status IN ('local', 'pending', 'synced', 'conflict', 'error'));

ALTER TABLE add_on_groups ADD CONSTRAINT add_on_groups_selection_mode_check
CHECK (selection_mode IN ('single', 'multiple'));

-- Create indexes for common queries
CREATE INDEX idx_add_on_groups_store_id ON add_on_groups(store_id);
CREATE INDEX idx_add_on_groups_store_active ON add_on_groups(store_id, is_deleted) WHERE is_deleted = false;
CREATE INDEX idx_add_on_groups_display_order ON add_on_groups(store_id, display_order);
CREATE INDEX idx_add_on_groups_sync ON add_on_groups(store_id, sync_status) WHERE sync_status != 'synced';
CREATE INDEX idx_add_on_groups_updated ON add_on_groups(store_id, updated_at DESC);
CREATE INDEX idx_add_on_groups_applicable_all ON add_on_groups(store_id, applicable_to_all) WHERE is_deleted = false AND is_active = true;

-- Enable Row Level Security
ALTER TABLE add_on_groups ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Store members can view own store add-on groups"
  ON add_on_groups FOR SELECT
  USING (
    store_id IN (
      SELECT unnest(store_ids) FROM members WHERE id = auth.uid()
    )
  );

CREATE POLICY "Store members can insert own store add-on groups"
  ON add_on_groups FOR INSERT
  WITH CHECK (
    store_id IN (
      SELECT unnest(store_ids) FROM members WHERE id = auth.uid()
    )
  );

CREATE POLICY "Store members can update own store add-on groups"
  ON add_on_groups FOR UPDATE
  USING (
    store_id IN (
      SELECT unnest(store_ids) FROM members WHERE id = auth.uid()
    )
  );

CREATE POLICY "Store members can delete own store add-on groups"
  ON add_on_groups FOR DELETE
  USING (
    store_id IN (
      SELECT unnest(store_ids) FROM members WHERE id = auth.uid()
    )
  );

-- Create function for auto-updating updated_at and incrementing version
CREATE OR REPLACE FUNCTION update_add_on_groups_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  NEW.version = OLD.version + 1;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS add_on_groups_updated_at_trigger ON add_on_groups;
CREATE TRIGGER add_on_groups_updated_at_trigger
  BEFORE UPDATE ON add_on_groups
  FOR EACH ROW
  EXECUTE FUNCTION update_add_on_groups_updated_at();

-- Add comment for documentation
COMMENT ON TABLE add_on_groups IS 'Add-on groups for upselling services. Each group has selection rules (single/multiple, min/max) and can be applied to all services or specific categories/services.';

-- ============================================
-- ADD-ON OPTIONS TABLE (US-009)
-- ============================================

CREATE TABLE IF NOT EXISTS add_on_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Multi-tenant isolation
  tenant_id UUID NOT NULL,
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  location_id UUID,

  -- Foreign key to add-on group
  group_id UUID NOT NULL REFERENCES add_on_groups(id) ON DELETE CASCADE,

  -- Core fields
  name TEXT NOT NULL,
  description TEXT,

  -- Pricing & Duration
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  duration INTEGER NOT NULL DEFAULT 0, -- minutes

  -- Status
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,

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

-- Add check constraints
ALTER TABLE add_on_options ADD CONSTRAINT add_on_options_sync_status_check
CHECK (sync_status IN ('local', 'pending', 'synced', 'conflict', 'error'));

-- Create indexes for common queries
CREATE INDEX idx_add_on_options_store_id ON add_on_options(store_id);
CREATE INDEX idx_add_on_options_group_id ON add_on_options(group_id);
CREATE INDEX idx_add_on_options_store_active ON add_on_options(store_id, is_deleted) WHERE is_deleted = false;
CREATE INDEX idx_add_on_options_display_order ON add_on_options(group_id, display_order);
CREATE INDEX idx_add_on_options_sync ON add_on_options(store_id, sync_status) WHERE sync_status != 'synced';
CREATE INDEX idx_add_on_options_updated ON add_on_options(store_id, updated_at DESC);

-- Enable Row Level Security
ALTER TABLE add_on_options ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Store members can view own store add-on options"
  ON add_on_options FOR SELECT
  USING (
    store_id IN (
      SELECT unnest(store_ids) FROM members WHERE id = auth.uid()
    )
  );

CREATE POLICY "Store members can insert own store add-on options"
  ON add_on_options FOR INSERT
  WITH CHECK (
    store_id IN (
      SELECT unnest(store_ids) FROM members WHERE id = auth.uid()
    )
  );

CREATE POLICY "Store members can update own store add-on options"
  ON add_on_options FOR UPDATE
  USING (
    store_id IN (
      SELECT unnest(store_ids) FROM members WHERE id = auth.uid()
    )
  );

CREATE POLICY "Store members can delete own store add-on options"
  ON add_on_options FOR DELETE
  USING (
    store_id IN (
      SELECT unnest(store_ids) FROM members WHERE id = auth.uid()
    )
  );

-- Create function for auto-updating updated_at and incrementing version
CREATE OR REPLACE FUNCTION update_add_on_options_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  NEW.version = OLD.version + 1;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS add_on_options_updated_at_trigger ON add_on_options;
CREATE TRIGGER add_on_options_updated_at_trigger
  BEFORE UPDATE ON add_on_options
  FOR EACH ROW
  EXECUTE FUNCTION update_add_on_options_updated_at();

-- Add comment for documentation
COMMENT ON TABLE add_on_options IS 'Individual add-on options within a group. Each option has a name, price, and duration that gets added to the service when selected.';

-- ============================================
-- STAFF SERVICE ASSIGNMENTS TABLE (US-010)
-- ============================================

CREATE TABLE IF NOT EXISTS staff_service_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Multi-tenant isolation
  tenant_id UUID NOT NULL,
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  location_id UUID,

  -- Assignment relationship
  staff_id UUID NOT NULL,
  service_id UUID NOT NULL REFERENCES menu_services(id) ON DELETE CASCADE,

  -- Custom pricing/duration for this staff member
  custom_price DECIMAL(10,2),
  custom_duration INTEGER,

  -- Commission override
  custom_commission_rate DECIMAL(5,2),

  -- Status
  is_active BOOLEAN NOT NULL DEFAULT true,

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
  tombstone_expires_at TIMESTAMPTZ,

  -- Unique constraint: one assignment per staff/service pair
  CONSTRAINT staff_service_assignments_unique UNIQUE (store_id, staff_id, service_id)
);

-- Add check constraint for valid sync_status
ALTER TABLE staff_service_assignments ADD CONSTRAINT staff_service_assignments_sync_status_check
CHECK (sync_status IN ('local', 'pending', 'synced', 'conflict', 'error'));

-- Create indexes for common queries
CREATE INDEX idx_staff_service_assignments_store_id ON staff_service_assignments(store_id);
CREATE INDEX idx_staff_service_assignments_staff_id ON staff_service_assignments(staff_id);
CREATE INDEX idx_staff_service_assignments_service_id ON staff_service_assignments(service_id);
CREATE INDEX idx_staff_service_assignments_store_active ON staff_service_assignments(store_id, is_deleted) WHERE is_deleted = false;
CREATE INDEX idx_staff_service_assignments_sync ON staff_service_assignments(store_id, sync_status) WHERE sync_status != 'synced';
CREATE INDEX idx_staff_service_assignments_updated ON staff_service_assignments(store_id, updated_at DESC);

-- Enable Row Level Security
ALTER TABLE staff_service_assignments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Store members can view own store staff assignments"
  ON staff_service_assignments FOR SELECT
  USING (
    store_id IN (
      SELECT unnest(store_ids) FROM members WHERE id = auth.uid()
    )
  );

CREATE POLICY "Store members can insert own store staff assignments"
  ON staff_service_assignments FOR INSERT
  WITH CHECK (
    store_id IN (
      SELECT unnest(store_ids) FROM members WHERE id = auth.uid()
    )
  );

CREATE POLICY "Store members can update own store staff assignments"
  ON staff_service_assignments FOR UPDATE
  USING (
    store_id IN (
      SELECT unnest(store_ids) FROM members WHERE id = auth.uid()
    )
  );

CREATE POLICY "Store members can delete own store staff assignments"
  ON staff_service_assignments FOR DELETE
  USING (
    store_id IN (
      SELECT unnest(store_ids) FROM members WHERE id = auth.uid()
    )
  );

-- Create function for auto-updating updated_at and incrementing version
CREATE OR REPLACE FUNCTION update_staff_service_assignments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  NEW.version = OLD.version + 1;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS staff_service_assignments_updated_at_trigger ON staff_service_assignments;
CREATE TRIGGER staff_service_assignments_updated_at_trigger
  BEFORE UPDATE ON staff_service_assignments
  FOR EACH ROW
  EXECUTE FUNCTION update_staff_service_assignments_updated_at();

-- Add comment for documentation
COMMENT ON TABLE staff_service_assignments IS 'Links staff members to services they can perform. Supports custom pricing, duration, and commission overrides per staff/service combination.';

-- ============================================
-- CATALOG SETTINGS TABLE (US-010)
-- One record per store for catalog configuration
-- ============================================

CREATE TABLE IF NOT EXISTS catalog_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Multi-tenant isolation
  tenant_id UUID NOT NULL,
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  location_id UUID,

  -- Default values
  default_duration INTEGER NOT NULL DEFAULT 30,
  default_extra_time INTEGER NOT NULL DEFAULT 0,
  default_extra_time_type TEXT NOT NULL DEFAULT 'processing',

  -- Pricing defaults
  default_tax_rate DECIMAL(5,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  currency_symbol TEXT NOT NULL DEFAULT '$',

  -- Online booking defaults
  show_prices_online BOOLEAN NOT NULL DEFAULT true,
  require_deposit_for_online_booking BOOLEAN NOT NULL DEFAULT false,
  default_deposit_percentage INTEGER NOT NULL DEFAULT 25,

  -- Feature toggles
  enable_packages BOOLEAN NOT NULL DEFAULT true,
  enable_add_ons BOOLEAN NOT NULL DEFAULT true,
  enable_variants BOOLEAN NOT NULL DEFAULT true,
  allow_custom_pricing BOOLEAN NOT NULL DEFAULT true,
  booking_sequence_enabled BOOLEAN NOT NULL DEFAULT false,

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
  tombstone_expires_at TIMESTAMPTZ,

  -- One settings record per store
  CONSTRAINT catalog_settings_store_unique UNIQUE (store_id)
);

-- Add check constraints
ALTER TABLE catalog_settings ADD CONSTRAINT catalog_settings_sync_status_check
CHECK (sync_status IN ('local', 'pending', 'synced', 'conflict', 'error'));

ALTER TABLE catalog_settings ADD CONSTRAINT catalog_settings_extra_time_type_check
CHECK (default_extra_time_type IN ('processing', 'blocked', 'finishing'));

-- Create indexes for common queries
CREATE INDEX idx_catalog_settings_store_id ON catalog_settings(store_id);
CREATE INDEX idx_catalog_settings_sync ON catalog_settings(store_id, sync_status) WHERE sync_status != 'synced';

-- Enable Row Level Security
ALTER TABLE catalog_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Store members can view own store catalog settings"
  ON catalog_settings FOR SELECT
  USING (
    store_id IN (
      SELECT unnest(store_ids) FROM members WHERE id = auth.uid()
    )
  );

CREATE POLICY "Store members can insert own store catalog settings"
  ON catalog_settings FOR INSERT
  WITH CHECK (
    store_id IN (
      SELECT unnest(store_ids) FROM members WHERE id = auth.uid()
    )
  );

CREATE POLICY "Store members can update own store catalog settings"
  ON catalog_settings FOR UPDATE
  USING (
    store_id IN (
      SELECT unnest(store_ids) FROM members WHERE id = auth.uid()
    )
  );

CREATE POLICY "Store members can delete own store catalog settings"
  ON catalog_settings FOR DELETE
  USING (
    store_id IN (
      SELECT unnest(store_ids) FROM members WHERE id = auth.uid()
    )
  );

-- Create function for auto-updating updated_at and incrementing version
CREATE OR REPLACE FUNCTION update_catalog_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  NEW.version = OLD.version + 1;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS catalog_settings_updated_at_trigger ON catalog_settings;
CREATE TRIGGER catalog_settings_updated_at_trigger
  BEFORE UPDATE ON catalog_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_catalog_settings_updated_at();

-- Add comment for documentation
COMMENT ON TABLE catalog_settings IS 'Per-store catalog configuration. One record per store containing default durations, tax rates, feature toggles, and online booking defaults.';

-- ============================================
-- BOOKING SEQUENCES TABLE (US-010)
-- Defines the order services should be performed
-- ============================================

CREATE TABLE IF NOT EXISTS booking_sequences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Multi-tenant isolation
  tenant_id UUID NOT NULL,
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  location_id UUID,

  -- Ordered list of service IDs (stored as JSONB array)
  service_order JSONB NOT NULL DEFAULT '[]',

  -- Whether this sequence is enabled
  is_enabled BOOLEAN NOT NULL DEFAULT true,

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
ALTER TABLE booking_sequences ADD CONSTRAINT booking_sequences_sync_status_check
CHECK (sync_status IN ('local', 'pending', 'synced', 'conflict', 'error'));

-- Create indexes for common queries
CREATE INDEX idx_booking_sequences_store_id ON booking_sequences(store_id);
CREATE INDEX idx_booking_sequences_store_active ON booking_sequences(store_id, is_deleted) WHERE is_deleted = false;
CREATE INDEX idx_booking_sequences_sync ON booking_sequences(store_id, sync_status) WHERE sync_status != 'synced';
CREATE INDEX idx_booking_sequences_updated ON booking_sequences(store_id, updated_at DESC);

-- Enable Row Level Security
ALTER TABLE booking_sequences ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Store members can view own store booking sequences"
  ON booking_sequences FOR SELECT
  USING (
    store_id IN (
      SELECT unnest(store_ids) FROM members WHERE id = auth.uid()
    )
  );

CREATE POLICY "Store members can insert own store booking sequences"
  ON booking_sequences FOR INSERT
  WITH CHECK (
    store_id IN (
      SELECT unnest(store_ids) FROM members WHERE id = auth.uid()
    )
  );

CREATE POLICY "Store members can update own store booking sequences"
  ON booking_sequences FOR UPDATE
  USING (
    store_id IN (
      SELECT unnest(store_ids) FROM members WHERE id = auth.uid()
    )
  );

CREATE POLICY "Store members can delete own store booking sequences"
  ON booking_sequences FOR DELETE
  USING (
    store_id IN (
      SELECT unnest(store_ids) FROM members WHERE id = auth.uid()
    )
  );

-- Create function for auto-updating updated_at and incrementing version
CREATE OR REPLACE FUNCTION update_booking_sequences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  NEW.version = OLD.version + 1;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS booking_sequences_updated_at_trigger ON booking_sequences;
CREATE TRIGGER booking_sequences_updated_at_trigger
  BEFORE UPDATE ON booking_sequences
  FOR EACH ROW
  EXECUTE FUNCTION update_booking_sequences_updated_at();

-- Add comment for documentation
COMMENT ON TABLE booking_sequences IS 'Defines the order services should be performed (e.g., Cut → Color → Style). Used to ensure services are booked in a logical order.';

-- ============================================
-- PRODUCTS TABLE (US-010)
-- Retail and backbar products for inventory management
-- ============================================

CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Multi-tenant isolation
  tenant_id UUID NOT NULL,
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  location_id UUID,

  -- Identifiers
  sku TEXT NOT NULL,
  barcode TEXT,

  -- Core fields
  name TEXT NOT NULL,
  brand TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,

  -- Pricing
  retail_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  cost_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  margin DECIMAL(5,2) NOT NULL DEFAULT 0,

  -- Product type
  is_retail BOOLEAN NOT NULL DEFAULT true,
  is_backbar BOOLEAN NOT NULL DEFAULT false,

  -- Inventory management
  min_stock_level INTEGER NOT NULL DEFAULT 0,
  reorder_quantity INTEGER,

  -- Supplier
  supplier_id UUID,
  supplier_name TEXT,

  -- Visual
  image_url TEXT,

  -- Size/unit
  size TEXT,
  backbar_unit TEXT,
  backbar_uses_per_unit INTEGER,

  -- Status
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_tax_exempt BOOLEAN DEFAULT false,

  -- Commission
  commission_rate DECIMAL(5,2),

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
ALTER TABLE products ADD CONSTRAINT products_sync_status_check
CHECK (sync_status IN ('local', 'pending', 'synced', 'conflict', 'error'));

-- Create indexes for common queries
CREATE INDEX idx_products_store_id ON products(store_id);
CREATE INDEX idx_products_store_active ON products(store_id, is_deleted) WHERE is_deleted = false;
CREATE INDEX idx_products_sku ON products(store_id, sku);
CREATE INDEX idx_products_barcode ON products(store_id, barcode) WHERE barcode IS NOT NULL;
CREATE INDEX idx_products_category ON products(store_id, category) WHERE is_deleted = false;
CREATE INDEX idx_products_brand ON products(store_id, brand) WHERE is_deleted = false;
CREATE INDEX idx_products_sync ON products(store_id, sync_status) WHERE sync_status != 'synced';
CREATE INDEX idx_products_updated ON products(store_id, updated_at DESC);
CREATE INDEX idx_products_retail ON products(store_id, is_retail) WHERE is_deleted = false AND is_active = true;
CREATE INDEX idx_products_backbar ON products(store_id, is_backbar) WHERE is_deleted = false AND is_active = true;

-- Enable Row Level Security
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Store members can view own store products"
  ON products FOR SELECT
  USING (
    store_id IN (
      SELECT unnest(store_ids) FROM members WHERE id = auth.uid()
    )
  );

CREATE POLICY "Store members can insert own store products"
  ON products FOR INSERT
  WITH CHECK (
    store_id IN (
      SELECT unnest(store_ids) FROM members WHERE id = auth.uid()
    )
  );

CREATE POLICY "Store members can update own store products"
  ON products FOR UPDATE
  USING (
    store_id IN (
      SELECT unnest(store_ids) FROM members WHERE id = auth.uid()
    )
  );

CREATE POLICY "Store members can delete own store products"
  ON products FOR DELETE
  USING (
    store_id IN (
      SELECT unnest(store_ids) FROM members WHERE id = auth.uid()
    )
  );

-- Create function for auto-updating updated_at and incrementing version
CREATE OR REPLACE FUNCTION update_products_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  NEW.version = OLD.version + 1;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS products_updated_at_trigger ON products;
CREATE TRIGGER products_updated_at_trigger
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_products_updated_at();

-- Add comment for documentation
COMMENT ON TABLE products IS 'Retail and backbar products for inventory management. Includes pricing, inventory levels, supplier info, and stock alerts.';

-- ============================================
-- GIFT CARD DENOMINATIONS TABLE (US-010)
-- Preset gift card amounts for quick sale
-- ============================================

CREATE TABLE IF NOT EXISTS gift_card_denominations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Multi-tenant isolation
  tenant_id UUID NOT NULL,
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  location_id UUID,

  -- Core fields
  amount DECIMAL(10,2) NOT NULL,
  label TEXT,

  -- Status
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,

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
ALTER TABLE gift_card_denominations ADD CONSTRAINT gift_card_denominations_sync_status_check
CHECK (sync_status IN ('local', 'pending', 'synced', 'conflict', 'error'));

-- Create indexes for common queries
CREATE INDEX idx_gift_card_denominations_store_id ON gift_card_denominations(store_id);
CREATE INDEX idx_gift_card_denominations_store_active ON gift_card_denominations(store_id, is_deleted) WHERE is_deleted = false;
CREATE INDEX idx_gift_card_denominations_display_order ON gift_card_denominations(store_id, display_order);
CREATE INDEX idx_gift_card_denominations_sync ON gift_card_denominations(store_id, sync_status) WHERE sync_status != 'synced';

-- Enable Row Level Security
ALTER TABLE gift_card_denominations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Store members can view own store gift card denominations"
  ON gift_card_denominations FOR SELECT
  USING (
    store_id IN (
      SELECT unnest(store_ids) FROM members WHERE id = auth.uid()
    )
  );

CREATE POLICY "Store members can insert own store gift card denominations"
  ON gift_card_denominations FOR INSERT
  WITH CHECK (
    store_id IN (
      SELECT unnest(store_ids) FROM members WHERE id = auth.uid()
    )
  );

CREATE POLICY "Store members can update own store gift card denominations"
  ON gift_card_denominations FOR UPDATE
  USING (
    store_id IN (
      SELECT unnest(store_ids) FROM members WHERE id = auth.uid()
    )
  );

CREATE POLICY "Store members can delete own store gift card denominations"
  ON gift_card_denominations FOR DELETE
  USING (
    store_id IN (
      SELECT unnest(store_ids) FROM members WHERE id = auth.uid()
    )
  );

-- Create function for auto-updating updated_at and incrementing version
CREATE OR REPLACE FUNCTION update_gift_card_denominations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  NEW.version = OLD.version + 1;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS gift_card_denominations_updated_at_trigger ON gift_card_denominations;
CREATE TRIGGER gift_card_denominations_updated_at_trigger
  BEFORE UPDATE ON gift_card_denominations
  FOR EACH ROW
  EXECUTE FUNCTION update_gift_card_denominations_updated_at();

-- Add comment for documentation
COMMENT ON TABLE gift_card_denominations IS 'Preset gift card amounts for quick sale (e.g., $25, $50, $100). Each denomination has an amount and optional label.';

-- ============================================
-- GIFT CARD SETTINGS TABLE (US-010)
-- Per-salon gift card configuration
-- ============================================

CREATE TABLE IF NOT EXISTS gift_card_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Multi-tenant isolation
  tenant_id UUID NOT NULL,
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  location_id UUID,

  -- Custom amount settings
  allow_custom_amount BOOLEAN NOT NULL DEFAULT true,
  min_amount DECIMAL(10,2) NOT NULL DEFAULT 10,
  max_amount DECIMAL(10,2) NOT NULL DEFAULT 500,

  -- Expiration
  default_expiration_days INTEGER,

  -- Online settings
  online_enabled BOOLEAN NOT NULL DEFAULT false,
  email_delivery_enabled BOOLEAN NOT NULL DEFAULT false,

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
  tombstone_expires_at TIMESTAMPTZ,

  -- One settings record per store
  CONSTRAINT gift_card_settings_store_unique UNIQUE (store_id)
);

-- Add check constraint for valid sync_status
ALTER TABLE gift_card_settings ADD CONSTRAINT gift_card_settings_sync_status_check
CHECK (sync_status IN ('local', 'pending', 'synced', 'conflict', 'error'));

-- Create indexes for common queries
CREATE INDEX idx_gift_card_settings_store_id ON gift_card_settings(store_id);
CREATE INDEX idx_gift_card_settings_sync ON gift_card_settings(store_id, sync_status) WHERE sync_status != 'synced';

-- Enable Row Level Security
ALTER TABLE gift_card_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Store members can view own store gift card settings"
  ON gift_card_settings FOR SELECT
  USING (
    store_id IN (
      SELECT unnest(store_ids) FROM members WHERE id = auth.uid()
    )
  );

CREATE POLICY "Store members can insert own store gift card settings"
  ON gift_card_settings FOR INSERT
  WITH CHECK (
    store_id IN (
      SELECT unnest(store_ids) FROM members WHERE id = auth.uid()
    )
  );

CREATE POLICY "Store members can update own store gift card settings"
  ON gift_card_settings FOR UPDATE
  USING (
    store_id IN (
      SELECT unnest(store_ids) FROM members WHERE id = auth.uid()
    )
  );

CREATE POLICY "Store members can delete own store gift card settings"
  ON gift_card_settings FOR DELETE
  USING (
    store_id IN (
      SELECT unnest(store_ids) FROM members WHERE id = auth.uid()
    )
  );

-- Create function for auto-updating updated_at and incrementing version
CREATE OR REPLACE FUNCTION update_gift_card_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  NEW.version = OLD.version + 1;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS gift_card_settings_updated_at_trigger ON gift_card_settings;
CREATE TRIGGER gift_card_settings_updated_at_trigger
  BEFORE UPDATE ON gift_card_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_gift_card_settings_updated_at();

-- Add comment for documentation
COMMENT ON TABLE gift_card_settings IS 'Per-salon gift card configuration including custom amount limits, expiration settings, and online/email delivery options.';
