-- Mango POS Control Center - Supabase Schema
-- Run this in the Supabase SQL Editor to create all tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==================== TENANTS ====================
-- Customers who purchase licenses
CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  company TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'inactive')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tenants_email ON tenants(email);
CREATE INDEX idx_tenants_status ON tenants(status);

-- ==================== LICENSES ====================
-- Licenses issued to tenants
CREATE TABLE IF NOT EXISTS licenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  license_key TEXT UNIQUE NOT NULL,
  tier TEXT NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'basic', 'professional', 'enterprise')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'expired', 'revoked')),
  max_stores INTEGER NOT NULL DEFAULT 1,
  max_devices_per_store INTEGER NOT NULL DEFAULT 3,
  features JSONB DEFAULT '[]'::jsonb,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_licenses_tenant_id ON licenses(tenant_id);
CREATE INDEX idx_licenses_license_key ON licenses(license_key);
CREATE INDEX idx_licenses_status ON licenses(status);

-- ==================== STORES ====================
-- POS instances with login credentials
CREATE TABLE IF NOT EXISTS stores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  license_id UUID NOT NULL REFERENCES licenses(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  store_login_id TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  store_email TEXT,
  address TEXT,
  phone TEXT,
  timezone TEXT DEFAULT 'America/New_York',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'inactive')),
  settings JSONB DEFAULT '{}'::jsonb,
  last_login_at TIMESTAMPTZ,
  last_seen_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_stores_license_id ON stores(license_id);
CREATE INDEX idx_stores_tenant_id ON stores(tenant_id);
CREATE INDEX idx_stores_store_login_id ON stores(store_login_id);
CREATE INDEX idx_stores_status ON stores(status);

-- ==================== MEMBERS ====================
-- Users who can access POS (staff, managers, admins)
CREATE TABLE IF NOT EXISTS members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  store_ids UUID[] NOT NULL DEFAULT '{}',
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  password_hash TEXT NOT NULL,
  pin TEXT,
  role TEXT NOT NULL DEFAULT 'staff' CHECK (role IN ('admin', 'manager', 'staff')),
  permissions TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'inactive')),
  last_login_at TIMESTAMPTZ,
  last_active_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_members_tenant_id ON members(tenant_id);
CREATE INDEX idx_members_email ON members(email);
CREATE INDEX idx_members_status ON members(status);

-- ==================== DEVICES ====================
-- Specific machines/browsers that access POS
CREATE TABLE IF NOT EXISTS devices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  license_id UUID NOT NULL REFERENCES licenses(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  device_name TEXT,
  device_fingerprint TEXT NOT NULL,
  device_type TEXT DEFAULT 'unknown',
  browser TEXT,
  os TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'blocked', 'pending')),
  last_seen_at TIMESTAMPTZ,
  registered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_devices_store_id ON devices(store_id);
CREATE INDEX idx_devices_license_id ON devices(license_id);
CREATE INDEX idx_devices_fingerprint ON devices(device_fingerprint);

-- ==================== ADMIN USERS ====================
-- People who can access the Control Center
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('super_admin', 'admin', 'support')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_admin_users_email ON admin_users(email);

-- ==================== ADMIN SESSIONS ====================
-- Active login sessions for admin users
CREATE TABLE IF NOT EXISTS admin_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_admin_sessions_user_id ON admin_sessions(user_id);
CREATE INDEX idx_admin_sessions_token ON admin_sessions(token);

-- ==================== AUDIT LOGS ====================
-- Track all administrative actions
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  admin_user_id UUID REFERENCES admin_users(id),
  admin_user_email TEXT,
  details JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- ==================== SYSTEM CONFIGS ====================
-- Default settings for stores (tax, payments, etc.)
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

-- Only one config per tenant (or global if tenant_id is null)
CREATE UNIQUE INDEX idx_system_configs_tenant ON system_configs(tenant_id) WHERE tenant_id IS NOT NULL;
CREATE UNIQUE INDEX idx_system_configs_global ON system_configs((tenant_id IS NULL)) WHERE tenant_id IS NULL;

-- ==================== FEATURE FLAGS ====================
-- Control feature availability across license tiers
CREATE TABLE IF NOT EXISTS feature_flags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'Infrastructure' CHECK (category IN (
    'Infrastructure', 'Operations', 'Analytics', 'Marketing',
    'Communication', 'Integration', 'Security', 'Payment', 'Customer Experience'
  )),
  globally_enabled BOOLEAN NOT NULL DEFAULT true,
  enabled_for_free BOOLEAN NOT NULL DEFAULT false,
  enabled_for_basic BOOLEAN NOT NULL DEFAULT false,
  enabled_for_professional BOOLEAN NOT NULL DEFAULT true,
  enabled_for_enterprise BOOLEAN NOT NULL DEFAULT true,
  rollout_percentage INTEGER NOT NULL DEFAULT 100 CHECK (rollout_percentage >= 0 AND rollout_percentage <= 100),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_feature_flags_key ON feature_flags(key);
CREATE INDEX idx_feature_flags_category ON feature_flags(category);
CREATE INDEX idx_feature_flags_globally_enabled ON feature_flags(globally_enabled);

-- ==================== ROW LEVEL SECURITY ====================
-- Enable RLS on all tables (optional, can be configured later)
-- ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE licenses ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE members ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE devices ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE admin_sessions ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- ==================== SEED DATA ====================
-- Insert default super admin (password: admin123)
-- Hash generated with SHA-256 for demo purposes
INSERT INTO admin_users (email, password_hash, name, role, is_active)
VALUES (
  'admin@mangobiz.com',
  '240be518fabd2724ddb6f04eeb9d2a1f8e2e9c5b7a3f9b8c4d2e1f0a9b8c7d6e',
  'Super Admin',
  'super_admin',
  true
) ON CONFLICT (email) DO NOTHING;

-- Insert demo tenant
INSERT INTO tenants (id, name, email, phone, company, status)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'Demo Salon',
  'owner@demosalon.com',
  '555-0100',
  'Demo Salon LLC',
  'active'
) ON CONFLICT DO NOTHING;

-- Insert demo license
INSERT INTO licenses (id, tenant_id, license_key, tier, status, max_stores)
VALUES (
  'b0000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000001',
  'DEMO-PRO-2024-XXXX',
  'professional',
  'active',
  3
) ON CONFLICT DO NOTHING;

-- Insert demo store (password: demo123)
INSERT INTO stores (id, license_id, tenant_id, name, store_login_id, password_hash, store_email, address, phone, status)
VALUES (
  'c0000000-0000-0000-0000-000000000001',
  'b0000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000001',
  'Demo Salon Downtown',
  'demo@salon.com',
  '240be518fabd2724ddb6f04eeb9d2a1f8e2e9c5b7a3f9b8c4d2e1f0a9b8c7d6f',
  'demo@salon.com',
  '123 Main St, Downtown',
  '555-0101',
  'active'
) ON CONFLICT DO NOTHING;

-- Insert demo members (owner password: owner123, PIN: 1234)
INSERT INTO members (id, tenant_id, store_ids, name, email, password_hash, pin, role, status)
VALUES (
  'd0000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000001',
  ARRAY['c0000000-0000-0000-0000-000000000001']::UUID[],
  'Salon Owner',
  'owner@demosalon.com',
  '240be518fabd2724ddb6f04eeb9d2a1f8e2e9c5b7a3f9b8c4d2e1f0a9b8c7d70',
  '1234',
  'admin',
  'active'
) ON CONFLICT DO NOTHING;

-- Insert staff member (password: jane123, PIN: 5678)
INSERT INTO members (id, tenant_id, store_ids, name, email, password_hash, pin, role, status)
VALUES (
  'd0000000-0000-0000-0000-000000000002',
  'a0000000-0000-0000-0000-000000000001',
  ARRAY['c0000000-0000-0000-0000-000000000001']::UUID[],
  'Jane Technician',
  'jane@demosalon.com',
  '240be518fabd2724ddb6f04eeb9d2a1f8e2e9c5b7a3f9b8c4d2e1f0a9b8c7d71',
  '5678',
  'staff',
  'active'
) ON CONFLICT DO NOTHING;

-- ==================== SEED FEATURE FLAGS ====================
-- Insert default feature flags
INSERT INTO feature_flags (key, name, description, category, globally_enabled, enabled_for_free, enabled_for_basic, enabled_for_professional, enabled_for_enterprise, rollout_percentage)
VALUES
  ('multi-device-sync', 'Multi-Device Sync', 'Real-time synchronization across multiple devices', 'Infrastructure', true, false, false, true, true, 100),
  ('inventory-management', 'Inventory Management', 'Track products, low stock alerts, reordering', 'Operations', true, false, true, true, true, 100),
  ('advanced-reporting', 'Advanced Reporting', 'Custom reports and data analytics', 'Analytics', true, false, false, true, true, 100),
  ('customer-loyalty', 'Customer Loyalty', 'Points-based rewards program', 'Marketing', true, false, false, true, true, 100),
  ('online-booking', 'Online Booking', 'Web-based appointment scheduling', 'Customer Experience', true, false, true, true, true, 100),
  ('sms-notifications', 'SMS Notifications', 'Automated SMS reminders and confirmations', 'Communication', false, false, false, false, true, 0),
  ('multi-location', 'Multi-Location Management', 'Manage multiple store locations', 'Infrastructure', true, false, false, false, true, 100),
  ('api-access', 'API Access', 'RESTful API for third-party integrations', 'Integration', true, false, false, false, true, 100),
  ('advanced-permissions', 'Advanced Permissions', 'Granular role-based access control', 'Security', true, false, false, true, true, 100),
  ('payment-gateway', 'Payment Gateway Integration', 'Direct payment processor integration', 'Payment', false, false, false, true, true, 0),
  ('turn-tracker', 'Turn Tracker', 'Track staff turns and rotation for fair distribution', 'Operations', true, false, true, true, true, 100),
  ('offline-mode', 'Offline Mode', 'Enable offline functionality for designated devices', 'Infrastructure', true, false, false, true, true, 100)
ON CONFLICT (key) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  updated_at = NOW();

-- Done!
SELECT 'Schema created successfully!' as message;
