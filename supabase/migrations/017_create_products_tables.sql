-- Migration 017: Create products and product_categories tables
-- E-commerce product catalog for Online Store

-- Product categories
CREATE TABLE IF NOT EXISTS product_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  parent_id UUID REFERENCES product_categories(id) ON DELETE SET NULL,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(store_id, slug)
);

-- Products
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  category_id UUID REFERENCES product_categories(id) ON DELETE SET NULL,

  -- Basic info
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  short_description TEXT,

  -- Pricing
  price DECIMAL(10,2) NOT NULL,
  compare_at_price DECIMAL(10,2),  -- Original price for sales
  cost_price DECIMAL(10,2),  -- Cost for profit calculations

  -- SKU and inventory
  sku TEXT,
  barcode TEXT,
  track_inventory BOOLEAN DEFAULT true,
  stock_quantity INTEGER DEFAULT 0,
  low_stock_threshold INTEGER DEFAULT 5,
  allow_backorder BOOLEAN DEFAULT false,

  -- Media
  images JSONB DEFAULT '[]',  -- Array of {url, alt, position}
  thumbnail_url TEXT,

  -- Product details
  weight DECIMAL(10,2),
  weight_unit TEXT DEFAULT 'oz',
  dimensions JSONB,  -- {length, width, height, unit}

  -- Variants support (for future)
  has_variants BOOLEAN DEFAULT false,
  variant_options JSONB DEFAULT '[]',

  -- SEO
  meta_title TEXT,
  meta_description TEXT,

  -- Status
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  show_online BOOLEAN DEFAULT true,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(store_id, slug)
);

-- Partial unique index for SKU (only when SKU is not null)
CREATE UNIQUE INDEX idx_products_store_sku
  ON products(store_id, sku)
  WHERE sku IS NOT NULL;

-- Product inventory log (for tracking changes)
CREATE TABLE IF NOT EXISTS product_inventory_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,

  -- Change details
  change_type TEXT NOT NULL
    CHECK (change_type IN ('sale', 'restock', 'adjustment', 'return', 'damaged', 'transfer')),
  quantity_change INTEGER NOT NULL,  -- Positive or negative
  quantity_before INTEGER NOT NULL,
  quantity_after INTEGER NOT NULL,

  -- Reference
  reference_type TEXT,  -- 'order', 'ticket', 'manual'
  reference_id UUID,
  notes TEXT,

  -- Who made the change
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_products_store_category ON products(store_id, category_id);
CREATE INDEX idx_products_store_active ON products(store_id, is_active, show_online);
-- Note: idx_products_store_sku (UNIQUE) already created above for SKU lookup
CREATE INDEX idx_products_barcode ON products(barcode) WHERE barcode IS NOT NULL;
CREATE INDEX idx_product_categories_store ON product_categories(store_id, is_active);
CREATE INDEX idx_product_inventory_log_product ON product_inventory_log(product_id, created_at DESC);

-- RLS
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_inventory_log ENABLE ROW LEVEL SECURITY;

-- Policy: Public can view active product categories
CREATE POLICY "Public view active categories" ON product_categories
  FOR SELECT USING (is_active = true);

-- Policy: Public can view active products
CREATE POLICY "Public view active products" ON products
  FOR SELECT USING (is_active = true AND show_online = true);

-- Triggers
CREATE OR REPLACE FUNCTION update_products_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_products_updated_at();

CREATE TRIGGER product_categories_updated_at
  BEFORE UPDATE ON product_categories
  FOR EACH ROW EXECUTE FUNCTION update_products_updated_at();

COMMENT ON TABLE products IS 'E-commerce products for Online Store';
COMMENT ON TABLE product_categories IS 'Product categorization for Online Store';
