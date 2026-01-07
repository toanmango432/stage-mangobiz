-- Migration 022: Create promotions table
-- Discount codes and promotional offers for Online Store

CREATE TABLE IF NOT EXISTS promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,

  -- Basic info
  name TEXT NOT NULL,
  description TEXT,
  code TEXT,  -- Discount code (NULL for automatic promos)

  -- Discount type
  discount_type TEXT NOT NULL
    CHECK (discount_type IN ('percentage', 'fixed_amount', 'buy_x_get_y', 'free_shipping', 'free_service')),

  -- Discount value
  discount_value DECIMAL(10,2),  -- Amount or percentage
  max_discount_amount DECIMAL(10,2),  -- Cap for percentage discounts

  -- Buy X Get Y specifics
  buy_quantity INTEGER,
  get_quantity INTEGER,
  get_item_type TEXT,  -- 'same', 'specific', 'cheapest'
  get_item_id UUID,  -- Product or service ID if specific

  -- Applicability
  applies_to TEXT NOT NULL DEFAULT 'all'
    CHECK (applies_to IN ('all', 'services', 'products', 'memberships', 'specific_items')),
  applicable_items JSONB DEFAULT '[]',  -- Array of product/service IDs
  excluded_items JSONB DEFAULT '[]',  -- Array of excluded IDs

  -- Minimum requirements
  minimum_purchase DECIMAL(10,2) DEFAULT 0,
  minimum_quantity INTEGER DEFAULT 0,

  -- Usage limits
  usage_limit INTEGER,  -- Total uses allowed (NULL = unlimited)
  usage_count INTEGER DEFAULT 0,
  usage_limit_per_customer INTEGER DEFAULT 1,

  -- Customer targeting
  customer_eligibility TEXT DEFAULT 'all'
    CHECK (customer_eligibility IN ('all', 'new_customers', 'existing_customers', 'members', 'specific_clients')),
  eligible_client_ids JSONB DEFAULT '[]',
  eligible_membership_ids JSONB DEFAULT '[]',

  -- Validity period
  starts_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ends_at TIMESTAMPTZ,

  -- Scheduling
  valid_days JSONB DEFAULT '["mon","tue","wed","thu","fri","sat","sun"]',
  valid_hours_start TIME,
  valid_hours_end TIME,

  -- Stacking
  can_combine BOOLEAN DEFAULT false,
  priority INTEGER DEFAULT 0,  -- Higher = applied first

  -- Display
  is_active BOOLEAN DEFAULT true,
  show_on_storefront BOOLEAN DEFAULT false,
  banner_text TEXT,
  banner_color TEXT,

  -- Auto-apply
  auto_apply BOOLEAN DEFAULT false,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Promotion usage tracking
CREATE TABLE IF NOT EXISTS promotion_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promotion_id UUID NOT NULL REFERENCES promotions(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  ticket_id UUID REFERENCES tickets(id) ON DELETE SET NULL,

  -- Applied discount
  discount_amount DECIMAL(10,2) NOT NULL,

  -- Timestamps
  used_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_promotions_store_active ON promotions(store_id, is_active);
CREATE INDEX idx_promotions_code ON promotions(store_id, code)
  WHERE code IS NOT NULL AND is_active = true;
CREATE INDEX idx_promotions_dates ON promotions(store_id, starts_at, ends_at)
  WHERE is_active = true;
CREATE INDEX idx_promotions_auto_apply ON promotions(store_id, auto_apply)
  WHERE auto_apply = true AND is_active = true;
CREATE INDEX idx_promotion_usage_promotion ON promotion_usage(promotion_id);
CREATE INDEX idx_promotion_usage_client ON promotion_usage(client_id)
  WHERE client_id IS NOT NULL;

-- RLS
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotion_usage ENABLE ROW LEVEL SECURITY;

-- Policy: Public can view active, visible promotions
CREATE POLICY "Public view active promotions" ON promotions
  FOR SELECT USING (
    is_active = true
    AND show_on_storefront = true
    AND (starts_at IS NULL OR starts_at <= now())
    AND (ends_at IS NULL OR ends_at >= now())
  );

-- Policy: Anyone can validate a promo code
CREATE POLICY "Validate promo codes" ON promotions
  FOR SELECT USING (
    code = current_setting('app.promo_code', true)
    AND is_active = true
  );

-- Policy: Clients can view their own usage
CREATE POLICY "Clients view own promotion usage" ON promotion_usage
  FOR SELECT USING (
    client_id IN (
      SELECT client_id FROM client_auth WHERE auth_user_id = auth.uid()
    )
  );

-- Triggers
CREATE TRIGGER promotions_updated_at
  BEFORE UPDATE ON promotions
  FOR EACH ROW EXECUTE FUNCTION update_products_updated_at();

-- Function to validate and apply promotion
CREATE OR REPLACE FUNCTION validate_promotion(
  p_code TEXT,
  p_store_id UUID,
  p_client_id UUID DEFAULT NULL,
  p_subtotal DECIMAL DEFAULT 0
)
RETURNS JSONB AS $$
DECLARE
  v_promo RECORD;
  v_usage_count INTEGER;
  v_result JSONB;
BEGIN
  -- Find the promotion
  SELECT * INTO v_promo
  FROM promotions
  WHERE store_id = p_store_id
    AND code = p_code
    AND is_active = true
    AND (starts_at IS NULL OR starts_at <= now())
    AND (ends_at IS NULL OR ends_at >= now());

  IF v_promo IS NULL THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Invalid or expired code');
  END IF;

  -- Check usage limit
  IF v_promo.usage_limit IS NOT NULL AND v_promo.usage_count >= v_promo.usage_limit THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Promotion usage limit reached');
  END IF;

  -- Check per-customer limit
  IF p_client_id IS NOT NULL AND v_promo.usage_limit_per_customer IS NOT NULL THEN
    SELECT COUNT(*) INTO v_usage_count
    FROM promotion_usage
    WHERE promotion_id = v_promo.id AND client_id = p_client_id;

    IF v_usage_count >= v_promo.usage_limit_per_customer THEN
      RETURN jsonb_build_object('valid', false, 'error', 'You have already used this promotion');
    END IF;
  END IF;

  -- Check minimum purchase
  IF p_subtotal < v_promo.minimum_purchase THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error', format('Minimum purchase of $%s required', v_promo.minimum_purchase)
    );
  END IF;

  -- Promotion is valid
  RETURN jsonb_build_object(
    'valid', true,
    'promotion_id', v_promo.id,
    'discount_type', v_promo.discount_type,
    'discount_value', v_promo.discount_value,
    'max_discount_amount', v_promo.max_discount_amount,
    'applies_to', v_promo.applies_to
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON TABLE promotions IS 'Discount codes and promotional offers';
COMMENT ON TABLE promotion_usage IS 'Tracking of promotion redemptions';
COMMENT ON FUNCTION validate_promotion IS 'Validates a promotion code and returns discount details';
