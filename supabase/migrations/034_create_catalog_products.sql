-- Migration 034: Create catalog_products table
--
-- Resolves PREREQ-1: products table schema conflict between migration 017 (e-commerce)
-- and migration 031 (inventory).
--
-- Background:
--   - Migration 017 created `products` with e-commerce schema (slug, compare_at_price,
--     images JSONB, has_variants, show_online, is_featured) for Online Store product catalog
--   - Migration 031 attempted to CREATE TABLE IF NOT EXISTS products with inventory schema
--     (sku NOT NULL, brand, is_retail, is_backbar, min_stock_level, sync metadata) for
--     Store App inventory — but this was a no-op since 017 already created the table
--   - Store App code already queries `catalog_products` (not `products`) — see
--     apps/store-app/src/services/supabase/tables/productsTable.ts
--   - Store App types already define CatalogProductRow — see
--     apps/store-app/src/services/supabase/types.ts
--
-- Resolution:
--   - `products` table (migration 017) = e-commerce catalog for Online Store
--   - `catalog_products` table (this migration) = retail/backbar inventory for Store App
--   - Existing FK references (orders, reviews, memberships) stay on `products`
--
-- ============================================
-- CATALOG PRODUCTS TABLE (Store App Inventory)
-- Retail and backbar products for salon inventory management
-- ============================================

CREATE TABLE IF NOT EXISTS catalog_products (
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
ALTER TABLE catalog_products ADD CONSTRAINT catalog_products_sync_status_check
CHECK (sync_status IN ('local', 'pending', 'synced', 'conflict', 'error'));

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_catalog_products_store_id ON catalog_products(store_id);
CREATE INDEX IF NOT EXISTS idx_catalog_products_store_active ON catalog_products(store_id, is_deleted) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_catalog_products_sku ON catalog_products(store_id, sku);
CREATE INDEX IF NOT EXISTS idx_catalog_products_barcode ON catalog_products(store_id, barcode) WHERE barcode IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_catalog_products_category ON catalog_products(store_id, category) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_catalog_products_brand ON catalog_products(store_id, brand) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_catalog_products_sync ON catalog_products(store_id, sync_status) WHERE sync_status != 'synced';
CREATE INDEX IF NOT EXISTS idx_catalog_products_updated ON catalog_products(store_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_catalog_products_retail ON catalog_products(store_id, is_retail) WHERE is_deleted = false AND is_active = true;
CREATE INDEX IF NOT EXISTS idx_catalog_products_backbar ON catalog_products(store_id, is_backbar) WHERE is_deleted = false AND is_active = true;

-- Enable Row Level Security
ALTER TABLE catalog_products ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Store members can view own store catalog products"
  ON catalog_products FOR SELECT
  USING (
    store_id IN (
      SELECT unnest(store_ids) FROM members WHERE id = auth.uid()
    )
  );

CREATE POLICY "Store members can insert own store catalog products"
  ON catalog_products FOR INSERT
  WITH CHECK (
    store_id IN (
      SELECT unnest(store_ids) FROM members WHERE id = auth.uid()
    )
  );

CREATE POLICY "Store members can update own store catalog products"
  ON catalog_products FOR UPDATE
  USING (
    store_id IN (
      SELECT unnest(store_ids) FROM members WHERE id = auth.uid()
    )
  );

CREATE POLICY "Store members can delete own store catalog products"
  ON catalog_products FOR DELETE
  USING (
    store_id IN (
      SELECT unnest(store_ids) FROM members WHERE id = auth.uid()
    )
  );

-- Create function for auto-updating updated_at and incrementing version
CREATE OR REPLACE FUNCTION update_catalog_products_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  NEW.version = OLD.version + 1;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS catalog_products_updated_at_trigger ON catalog_products;
CREATE TRIGGER catalog_products_updated_at_trigger
  BEFORE UPDATE ON catalog_products
  FOR EACH ROW
  EXECUTE FUNCTION update_catalog_products_updated_at();

-- Service role policy for admin operations
CREATE POLICY "Service role manages catalog products" ON catalog_products
  FOR ALL USING (true) WITH CHECK (true);

-- Add comment for documentation
COMMENT ON TABLE catalog_products IS 'Retail and backbar products for Store App inventory management. Separate from the e-commerce `products` table (migration 017) used by Online Store. Store App code queries this table via productsTable.ts.';
