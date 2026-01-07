-- Migration 018: Create memberships and client_memberships tables
-- Subscription-based membership plans for salons

-- Membership plans
CREATE TABLE IF NOT EXISTS memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,

  -- Plan details
  name TEXT NOT NULL,
  description TEXT,
  short_description TEXT,

  -- Pricing
  price DECIMAL(10,2) NOT NULL,
  billing_period TEXT NOT NULL DEFAULT 'monthly'
    CHECK (billing_period IN ('weekly', 'monthly', 'quarterly', 'yearly')),
  setup_fee DECIMAL(10,2) DEFAULT 0,

  -- Benefits
  benefits JSONB DEFAULT '[]',  -- Array of benefit descriptions
  discount_percentage INTEGER,  -- Global discount on services
  discount_services JSONB DEFAULT '[]',  -- Specific service discounts
  included_services JSONB DEFAULT '[]',  -- Free services included
  monthly_service_credits INTEGER,  -- Number of free services per month

  -- Product discounts
  product_discount_percentage INTEGER,

  -- Priority and perks
  priority_booking BOOLEAN DEFAULT false,
  priority_booking_days INTEGER DEFAULT 0,  -- Days in advance
  free_cancellations INTEGER,  -- Per month
  guest_passes INTEGER DEFAULT 0,  -- Per month

  -- Limits
  max_members INTEGER,  -- NULL = unlimited
  current_members INTEGER DEFAULT 0,

  -- Display
  display_order INTEGER DEFAULT 0,
  badge_color TEXT,
  badge_text TEXT,
  image_url TEXT,

  -- Status
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  show_online BOOLEAN DEFAULT true,

  -- Terms
  terms_and_conditions TEXT,
  minimum_commitment_months INTEGER DEFAULT 0,
  cancellation_notice_days INTEGER DEFAULT 30,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Client memberships (subscriptions)
CREATE TABLE IF NOT EXISTS client_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  membership_id UUID NOT NULL REFERENCES memberships(id) ON DELETE RESTRICT,
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,

  -- Status
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'paused', 'cancelled', 'expired', 'pending')),

  -- Billing
  current_period_start TIMESTAMPTZ NOT NULL,
  current_period_end TIMESTAMPTZ NOT NULL,
  next_billing_at TIMESTAMPTZ,
  billing_amount DECIMAL(10,2) NOT NULL,

  -- Payment
  payment_method_id TEXT,  -- Stripe payment method
  stripe_subscription_id TEXT,

  -- Usage tracking
  services_used_this_period INTEGER DEFAULT 0,
  credits_remaining INTEGER,
  guest_passes_remaining INTEGER DEFAULT 0,

  -- Pause info
  paused_at TIMESTAMPTZ,
  pause_reason TEXT,
  resume_at TIMESTAMPTZ,

  -- Cancellation info
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,
  cancellation_feedback TEXT,
  cancel_at_period_end BOOLEAN DEFAULT false,

  -- History
  started_at TIMESTAMPTZ DEFAULT now(),
  renewal_count INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Membership usage log
CREATE TABLE IF NOT EXISTS membership_usage_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_membership_id UUID NOT NULL REFERENCES client_memberships(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,

  -- Usage details
  usage_type TEXT NOT NULL
    CHECK (usage_type IN ('service', 'product', 'guest_pass', 'credit')),
  service_id UUID REFERENCES services(id),
  product_id UUID REFERENCES products(id),
  ticket_id UUID REFERENCES tickets(id),

  -- Value
  regular_price DECIMAL(10,2),
  discount_applied DECIMAL(10,2),
  credits_used INTEGER,

  -- Timestamps
  used_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_memberships_store ON memberships(store_id, is_active);
CREATE INDEX idx_client_memberships_client ON client_memberships(client_id, status);
CREATE INDEX idx_client_memberships_store ON client_memberships(store_id, status);
CREATE INDEX idx_client_memberships_billing ON client_memberships(next_billing_at)
  WHERE status = 'active';
CREATE INDEX idx_membership_usage_log ON membership_usage_log(client_membership_id, used_at DESC);

-- RLS
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE membership_usage_log ENABLE ROW LEVEL SECURITY;

-- Policy: Public can view active memberships
CREATE POLICY "Public view active memberships" ON memberships
  FOR SELECT USING (is_active = true AND show_online = true);

-- Policy: Clients can view their own memberships
CREATE POLICY "Clients view own memberships" ON client_memberships
  FOR SELECT USING (
    client_id IN (
      SELECT client_id FROM client_auth WHERE auth_user_id = auth.uid()
    )
  );

-- Policy: Clients can view their own usage
CREATE POLICY "Clients view own usage" ON membership_usage_log
  FOR SELECT USING (
    client_membership_id IN (
      SELECT id FROM client_memberships
      WHERE client_id IN (
        SELECT client_id FROM client_auth WHERE auth_user_id = auth.uid()
      )
    )
  );

-- Triggers
CREATE TRIGGER memberships_updated_at
  BEFORE UPDATE ON memberships
  FOR EACH ROW EXECUTE FUNCTION update_products_updated_at();

CREATE TRIGGER client_memberships_updated_at
  BEFORE UPDATE ON client_memberships
  FOR EACH ROW EXECUTE FUNCTION update_products_updated_at();

COMMENT ON TABLE memberships IS 'Subscription membership plans';
COMMENT ON TABLE client_memberships IS 'Client membership subscriptions';
