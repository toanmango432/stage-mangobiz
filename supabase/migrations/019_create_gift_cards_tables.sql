-- Migration 019: Create gift_cards and client_gift_cards tables
-- Gift card management for Online Store

-- Gift card templates/definitions
CREATE TABLE IF NOT EXISTS gift_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,

  -- Card details
  code TEXT NOT NULL,  -- Unique redemption code
  initial_balance DECIMAL(10,2) NOT NULL,
  current_balance DECIMAL(10,2) NOT NULL,

  -- Status
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'used', 'expired', 'cancelled', 'pending')),

  -- Type
  card_type TEXT DEFAULT 'standard'
    CHECK (card_type IN ('standard', 'promotional', 'reward', 'refund')),

  -- Purchase info
  purchased_by UUID REFERENCES clients(id),
  purchased_at TIMESTAMPTZ,
  purchase_amount DECIMAL(10,2),
  order_id UUID,  -- If purchased through e-commerce

  -- Recipient
  recipient_email TEXT,
  recipient_name TEXT,
  recipient_phone TEXT,
  personal_message TEXT,

  -- Delivery
  delivery_method TEXT DEFAULT 'email'
    CHECK (delivery_method IN ('email', 'sms', 'print', 'physical')),
  delivered_at TIMESTAMPTZ,
  delivery_scheduled_at TIMESTAMPTZ,

  -- Design
  design_template TEXT DEFAULT 'default',
  custom_image_url TEXT,

  -- Validity
  expires_at TIMESTAMPTZ,
  is_reloadable BOOLEAN DEFAULT false,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(store_id, code)
);

-- Gift card transactions (usage history)
CREATE TABLE IF NOT EXISTS gift_card_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gift_card_id UUID NOT NULL REFERENCES gift_cards(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,

  -- Transaction type
  transaction_type TEXT NOT NULL
    CHECK (transaction_type IN ('purchase', 'redemption', 'reload', 'refund', 'adjustment', 'expiry')),

  -- Amounts
  amount DECIMAL(10,2) NOT NULL,  -- Positive for credits, negative for debits
  balance_before DECIMAL(10,2) NOT NULL,
  balance_after DECIMAL(10,2) NOT NULL,

  -- Reference
  ticket_id UUID REFERENCES tickets(id),
  order_id UUID,
  client_id UUID REFERENCES clients(id),

  -- Details
  notes TEXT,
  performed_by TEXT,  -- Staff ID or 'customer' or 'system'

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Client's gift cards (wallet view)
CREATE TABLE IF NOT EXISTS client_gift_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  gift_card_id UUID NOT NULL REFERENCES gift_cards(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,

  -- How they got it
  acquisition_type TEXT DEFAULT 'received'
    CHECK (acquisition_type IN ('purchased', 'received', 'reward', 'refund')),

  -- Display
  nickname TEXT,
  is_favorite BOOLEAN DEFAULT false,

  -- Timestamps
  added_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(client_id, gift_card_id)
);

-- Indexes
CREATE INDEX idx_gift_cards_store ON gift_cards(store_id, status);
CREATE INDEX idx_gift_cards_code ON gift_cards(code) WHERE status = 'active';
CREATE INDEX idx_gift_cards_recipient ON gift_cards(recipient_email) WHERE recipient_email IS NOT NULL;
CREATE INDEX idx_gift_card_transactions ON gift_card_transactions(gift_card_id, created_at DESC);
CREATE INDEX idx_client_gift_cards ON client_gift_cards(client_id);

-- RLS
ALTER TABLE gift_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE gift_card_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_gift_cards ENABLE ROW LEVEL SECURITY;

-- Policy: Clients can view gift cards they own or received
CREATE POLICY "Clients view own gift cards" ON gift_cards
  FOR SELECT USING (
    id IN (
      SELECT gift_card_id FROM client_gift_cards
      WHERE client_id IN (
        SELECT client_id FROM client_auth WHERE auth_user_id = auth.uid()
      )
    )
    OR recipient_email = (SELECT email FROM client_auth WHERE auth_user_id = auth.uid())
  );

-- Policy: Anyone can look up a gift card by code (for redemption)
CREATE POLICY "Public lookup by code" ON gift_cards
  FOR SELECT USING (
    code = current_setting('app.gift_card_code', true)
    AND status = 'active'
  );

-- Policy: Clients can view their gift card transactions
CREATE POLICY "Clients view own transactions" ON gift_card_transactions
  FOR SELECT USING (
    gift_card_id IN (
      SELECT gift_card_id FROM client_gift_cards
      WHERE client_id IN (
        SELECT client_id FROM client_auth WHERE auth_user_id = auth.uid()
      )
    )
  );

-- Policy: Clients can view their wallet
CREATE POLICY "Clients view own wallet" ON client_gift_cards
  FOR SELECT USING (
    client_id IN (
      SELECT client_id FROM client_auth WHERE auth_user_id = auth.uid()
    )
  );

-- Triggers
CREATE TRIGGER gift_cards_updated_at
  BEFORE UPDATE ON gift_cards
  FOR EACH ROW EXECUTE FUNCTION update_products_updated_at();

COMMENT ON TABLE gift_cards IS 'Gift cards for Online Store';
COMMENT ON TABLE gift_card_transactions IS 'Gift card usage history';
COMMENT ON TABLE client_gift_cards IS 'Client gift card wallet';
