-- Migration 020: Create orders and order_items tables
-- E-commerce order management for Online Store

-- Orders
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,

  -- Order number (human readable)
  order_number TEXT NOT NULL,

  -- Status workflow
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded')),

  -- Guest checkout info
  guest_email TEXT,
  guest_name TEXT,
  guest_phone TEXT,

  -- Pricing
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  shipping_amount DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL DEFAULT 0,

  -- Discount details
  promotion_id UUID,
  promotion_code TEXT,
  gift_card_id UUID REFERENCES gift_cards(id),
  gift_card_amount DECIMAL(10,2) DEFAULT 0,

  -- Shipping
  shipping_method TEXT,
  shipping_address JSONB,
  tracking_number TEXT,

  -- Billing
  billing_address JSONB,

  -- Payment
  payment_method TEXT,
  payment_status TEXT DEFAULT 'pending'
    CHECK (payment_status IN ('pending', 'authorized', 'captured', 'failed', 'refunded')),
  payment_intent_id TEXT,  -- Stripe payment intent

  -- Fulfillment
  fulfilled_at TIMESTAMPTZ,
  shipped_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,

  -- Notes
  customer_notes TEXT,
  internal_notes TEXT,

  -- Cancellation
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,

  -- Source tracking
  source TEXT DEFAULT 'web'
    CHECK (source IN ('web', 'ios', 'android', 'pos', 'api')),
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(store_id, order_number)
);

-- Order items
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,

  -- Item type
  item_type TEXT NOT NULL
    CHECK (item_type IN ('product', 'gift_card', 'membership', 'service_package')),

  -- Reference to actual item
  product_id UUID REFERENCES products(id),
  gift_card_id UUID REFERENCES gift_cards(id),
  membership_id UUID REFERENCES memberships(id),

  -- Item details (snapshot at time of order)
  name TEXT NOT NULL,
  sku TEXT,
  description TEXT,
  image_url TEXT,

  -- Quantity and pricing
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,

  -- Variant info
  variant_options JSONB,

  -- Fulfillment
  fulfilled_quantity INTEGER DEFAULT 0,
  refunded_quantity INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_orders_store_status ON orders(store_id, status);
CREATE INDEX idx_orders_client ON orders(client_id) WHERE client_id IS NOT NULL;
CREATE INDEX idx_orders_number ON orders(store_id, order_number);
CREATE INDEX idx_orders_created ON orders(store_id, created_at DESC);
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_product ON order_items(product_id) WHERE product_id IS NOT NULL;

-- RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Policy: Clients can view their own orders
CREATE POLICY "Clients view own orders" ON orders
  FOR SELECT USING (
    client_id IN (
      SELECT client_id FROM client_auth WHERE auth_user_id = auth.uid()
    )
    OR guest_email = (SELECT email FROM client_auth WHERE auth_user_id = auth.uid())
  );

-- Policy: Clients can create orders
CREATE POLICY "Clients create orders" ON orders
  FOR INSERT WITH CHECK (
    client_id IN (
      SELECT client_id FROM client_auth WHERE auth_user_id = auth.uid()
    )
    OR auth.uid() IS NOT NULL
  );

-- Policy: Clients can view items of their orders
CREATE POLICY "Clients view own order items" ON order_items
  FOR SELECT USING (
    order_id IN (
      SELECT id FROM orders
      WHERE client_id IN (
        SELECT client_id FROM client_auth WHERE auth_user_id = auth.uid()
      )
    )
  );

-- Triggers
CREATE TRIGGER orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_products_updated_at();

COMMENT ON TABLE orders IS 'E-commerce orders from Online Store';
COMMENT ON TABLE order_items IS 'Individual items within an order';
