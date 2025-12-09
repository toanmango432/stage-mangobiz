-- Migration: Create system_configs table for Control Center settings
-- This table stores tax rates, payment methods, tip settings, etc.

CREATE TABLE IF NOT EXISTS system_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,

  -- Business defaults
  business_type TEXT NOT NULL DEFAULT 'salon' CHECK (business_type IN ('salon', 'spa', 'barbershop', 'other')),
  default_currency TEXT NOT NULL DEFAULT 'USD',
  default_timezone TEXT NOT NULL DEFAULT 'America/Los_Angeles',

  -- Tax settings (JSONB array)
  tax_settings JSONB NOT NULL DEFAULT '[{"id": "tax_1", "name": "Sales Tax", "rate": 8.5, "isDefault": true}]'::jsonb,

  -- Payment methods (JSONB array)
  payment_methods JSONB NOT NULL DEFAULT '[
    {"id": "pay_1", "name": "Cash", "type": "cash", "isActive": true, "sortOrder": 1},
    {"id": "pay_2", "name": "Credit Card", "type": "card", "isActive": true, "sortOrder": 2},
    {"id": "pay_3", "name": "Debit Card", "type": "card", "isActive": true, "sortOrder": 3},
    {"id": "pay_4", "name": "Gift Card", "type": "gift_card", "isActive": true, "sortOrder": 4}
  ]'::jsonb,

  -- Tip settings (JSONB)
  tip_settings JSONB NOT NULL DEFAULT '{"enabled": true, "presetPercentages": [15, 18, 20, 25], "allowCustom": true}'::jsonb,

  -- Checkout settings
  require_client_for_checkout BOOLEAN NOT NULL DEFAULT false,
  auto_print_receipt BOOLEAN NOT NULL DEFAULT false,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_system_configs_tenant ON system_configs(tenant_id);

-- Insert global default config (tenant_id = NULL means global)
INSERT INTO system_configs (
  tenant_id,
  business_type,
  default_currency,
  default_timezone,
  tax_settings,
  payment_methods,
  tip_settings,
  require_client_for_checkout,
  auto_print_receipt
) VALUES (
  NULL,
  'salon',
  'USD',
  'America/Los_Angeles',
  '[{"id": "tax_1", "name": "Sales Tax", "rate": 8.5, "isDefault": true}]'::jsonb,
  '[
    {"id": "pay_1", "name": "Cash", "type": "cash", "isActive": true, "sortOrder": 1},
    {"id": "pay_2", "name": "Credit Card", "type": "card", "isActive": true, "sortOrder": 2},
    {"id": "pay_3", "name": "Debit Card", "type": "card", "isActive": true, "sortOrder": 3},
    {"id": "pay_4", "name": "Gift Card", "type": "gift_card", "isActive": true, "sortOrder": 4}
  ]'::jsonb,
  '{"enabled": true, "presetPercentages": [15, 18, 20, 25], "allowCustom": true}'::jsonb,
  false,
  false
) ON CONFLICT DO NOTHING;
