/**
 * Script to create the system_configs table in Supabase
 * Run with: npx tsx scripts/create-system-configs-table.ts
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://cpaldkcvdcdyzytosntc.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNwYWxka2N2ZGNkeXp5dG9zbnRjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDA4MzM3MiwiZXhwIjoyMDc5NjU5MzcyfQ.4Uub2qn-CTPBhTYN0HGlHx5ua0mHdJVIr0x9lVuUiAY';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const DEFAULT_CONFIG = {
  tenant_id: null, // Global default config
  business_type: 'salon',
  default_currency: 'USD',
  default_timezone: 'America/Los_Angeles',
  tax_settings: [
    { id: 'tax_1', name: 'Sales Tax', rate: 8.5, isDefault: true },
  ],
  payment_methods: [
    { id: 'pay_1', name: 'Cash', type: 'cash', isActive: true, sortOrder: 1 },
    { id: 'pay_2', name: 'Credit Card', type: 'card', isActive: true, sortOrder: 2 },
    { id: 'pay_3', name: 'Debit Card', type: 'card', isActive: true, sortOrder: 3 },
    { id: 'pay_4', name: 'Gift Card', type: 'gift_card', isActive: true, sortOrder: 4 },
  ],
  tip_settings: {
    enabled: true,
    presetPercentages: [15, 18, 20, 25],
    allowCustom: true,
  },
  require_client_for_checkout: false,
  auto_print_receipt: false,
};

async function main() {
  console.log('🚀 Creating system_configs table and seeding data...\n');

  // First, check if table exists by trying to query it
  const { data: existingConfig, error: checkError } = await supabase
    .from('system_configs')
    .select('id')
    .limit(1);

  if (checkError && checkError.code === '42P01') {
    console.log('❌ Table does not exist. You need to create it via Supabase SQL Editor.');
    console.log('\nRun this SQL in Supabase Dashboard → SQL Editor:\n');
    console.log(`
CREATE TABLE IF NOT EXISTS system_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  business_type TEXT NOT NULL DEFAULT 'salon',
  default_currency TEXT NOT NULL DEFAULT 'USD',
  default_timezone TEXT NOT NULL DEFAULT 'America/Los_Angeles',
  tax_settings JSONB NOT NULL DEFAULT '[{"id": "tax_1", "name": "Sales Tax", "rate": 8.5, "isDefault": true}]'::jsonb,
  payment_methods JSONB NOT NULL DEFAULT '[]'::jsonb,
  tip_settings JSONB NOT NULL DEFAULT '{"enabled": true, "presetPercentages": [15, 18, 20, 25], "allowCustom": true}'::jsonb,
  require_client_for_checkout BOOLEAN NOT NULL DEFAULT false,
  auto_print_receipt BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
    `);
    return;
  }

  if (checkError) {
    console.error('Error checking table:', checkError);
    return;
  }

  console.log('✅ Table exists!\n');

  // Check if global config exists
  const { data: globalConfig } = await supabase
    .from('system_configs')
    .select('*')
    .is('tenant_id', null)
    .single();

  if (globalConfig) {
    console.log('✅ Global config already exists:');
    console.log('   Tax Rate:', globalConfig.tax_settings?.[0]?.rate || 'N/A');
    console.log('   Payment Methods:', globalConfig.payment_methods?.length || 0);
    console.log('   Tip Enabled:', globalConfig.tip_settings?.enabled);
  } else {
    console.log('📝 Creating global default config...');

    const { error: insertError } = await supabase
      .from('system_configs')
      .insert(DEFAULT_CONFIG);

    if (insertError) {
      console.error('❌ Failed to create config:', insertError.message);
    } else {
      console.log('✅ Global config created successfully!');
    }
  }

  // Verify
  const { data: configs, error: fetchError } = await supabase
    .from('system_configs')
    .select('id, tenant_id, business_type, default_currency, tax_settings, tip_settings');

  if (fetchError) {
    console.error('\nError fetching configs:', fetchError);
  } else {
    console.log('\n📋 Current system configs:');
    configs?.forEach((config, i) => {
      console.log(`\n[${i + 1}] ${config.tenant_id ? 'Tenant: ' + config.tenant_id : 'GLOBAL DEFAULT'}`);
      console.log(`    Business Type: ${config.business_type}`);
      console.log(`    Currency: ${config.default_currency}`);
      console.log(`    Tax Rate: ${config.tax_settings?.[0]?.rate}%`);
      console.log(`    Tips Enabled: ${config.tip_settings?.enabled}`);
    });
  }
}

main().catch(console.error);
