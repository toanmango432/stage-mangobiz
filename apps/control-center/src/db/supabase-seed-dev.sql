-- ==============================================================================
-- Mango POS Control Center - Development Seed Data
-- ==============================================================================
-- WARNING: This file contains test credentials for DEVELOPMENT ONLY
-- NEVER run this in production!
--
-- Usage:
-- 1. Run supabase-schema.sql first
-- 2. Then run this file to add test data
-- ==============================================================================

-- ==================== DEVELOPMENT ADMIN USER ====================
-- For testing only - create via Supabase Auth dashboard in production
-- Password: admin123 (SHA-256 hash - DEMO ONLY, use bcrypt in production)
INSERT INTO admin_users (email, password_hash, name, role, is_active)
VALUES (
  'admin@mangobiz.com',
  '240be518fabd2724ddb6f04eeb9d2a1f8e2e9c5b7a3f9b8c4d2e1f0a9b8c7d6e',
  'Super Admin',
  'super_admin',
  true
) ON CONFLICT (email) DO NOTHING;

-- ==================== DEMO TENANT ====================
INSERT INTO tenants (id, name, email, phone, company, status)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'Demo Salon',
  'owner@demosalon.com',
  '555-0100',
  'Demo Salon LLC',
  'active'
) ON CONFLICT DO NOTHING;

-- ==================== DEMO LICENSE ====================
INSERT INTO licenses (id, tenant_id, license_key, tier, status, max_stores)
VALUES (
  'b0000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000001',
  'DEMO-PRO-2024-XXXX',
  'professional',
  'active',
  3
) ON CONFLICT DO NOTHING;

-- ==================== DEMO STORE ====================
-- Password: demo123 (SHA-256 hash - DEMO ONLY)
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

-- ==================== DEMO MEMBERS ====================
-- Owner password: owner123, PIN: 1234 (SHA-256 hash - DEMO ONLY)
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

-- Staff member password: jane123, PIN: 5678 (SHA-256 hash - DEMO ONLY)
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

-- ==================== DONE ====================
SELECT 'Development seed data inserted successfully!' as message;
SELECT 'WARNING: This data is for development only. Do NOT use in production!' as warning;
