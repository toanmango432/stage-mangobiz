/**
 * Script to create the feature_flags table in Supabase
 * Run with: npx ts-node scripts/create-feature-flags-table.ts
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://cpaldkcvdcdyzytosntc.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNwYWxka2N2ZGNkeXp5dG9zbnRjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDA4MzM3MiwiZXhwIjoyMDc5NjU5MzcyfQ.4Uub2qn-CTPBhTYN0HGlHx5ua0mHdJVIr0x9lVuUiAY';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const DEFAULT_FLAGS = [
  {
    key: 'multi-device-sync',
    name: 'Multi-Device Sync',
    description: 'Real-time synchronization across multiple devices',
    category: 'Infrastructure',
    globally_enabled: true,
    enabled_for_free: false,
    enabled_for_basic: false,
    enabled_for_professional: true,
    enabled_for_enterprise: true,
    rollout_percentage: 100,
  },
  {
    key: 'inventory-management',
    name: 'Inventory Management',
    description: 'Track products, low stock alerts, reordering',
    category: 'Operations',
    globally_enabled: true,
    enabled_for_free: false,
    enabled_for_basic: true,
    enabled_for_professional: true,
    enabled_for_enterprise: true,
    rollout_percentage: 100,
  },
  {
    key: 'turn-tracker',
    name: 'Turn Tracker',
    description: 'Track staff turns and rotation for fair distribution',
    category: 'Operations',
    globally_enabled: true,
    enabled_for_free: false,
    enabled_for_basic: true,
    enabled_for_professional: true,
    enabled_for_enterprise: true,
    rollout_percentage: 100,
  },
  {
    key: 'offline-mode',
    name: 'Offline Mode',
    description: 'Enable offline functionality for designated devices',
    category: 'Infrastructure',
    globally_enabled: true,
    enabled_for_free: false,
    enabled_for_basic: false,
    enabled_for_professional: true,
    enabled_for_enterprise: true,
    rollout_percentage: 100,
  },
  {
    key: 'advanced-reporting',
    name: 'Advanced Reporting',
    description: 'Custom reports and data analytics',
    category: 'Analytics',
    globally_enabled: true,
    enabled_for_free: false,
    enabled_for_basic: false,
    enabled_for_professional: true,
    enabled_for_enterprise: true,
    rollout_percentage: 100,
  },
  {
    key: 'customer-loyalty',
    name: 'Customer Loyalty',
    description: 'Points-based rewards program',
    category: 'Marketing',
    globally_enabled: true,
    enabled_for_free: false,
    enabled_for_basic: false,
    enabled_for_professional: true,
    enabled_for_enterprise: true,
    rollout_percentage: 100,
  },
  {
    key: 'online-booking',
    name: 'Online Booking',
    description: 'Web-based appointment scheduling',
    category: 'Customer Experience',
    globally_enabled: true,
    enabled_for_free: false,
    enabled_for_basic: true,
    enabled_for_professional: true,
    enabled_for_enterprise: true,
    rollout_percentage: 100,
  },
  {
    key: 'sms-notifications',
    name: 'SMS Notifications',
    description: 'Automated SMS reminders and confirmations',
    category: 'Communication',
    globally_enabled: false,
    enabled_for_free: false,
    enabled_for_basic: false,
    enabled_for_professional: false,
    enabled_for_enterprise: true,
    rollout_percentage: 0,
  },
];

async function main() {
  console.log('🚀 Creating feature_flags table and seeding data...\n');

  // First, check if table exists by trying to query it
  const { data: existingFlags, error: checkError } = await supabase
    .from('feature_flags')
    .select('key')
    .limit(1);

  if (checkError && checkError.code === '42P01') {
    console.log('❌ Table does not exist. You need to create it via Supabase SQL Editor.');
    console.log('\nRun this SQL in Supabase Dashboard → SQL Editor:\n');
    console.log(`
CREATE TABLE IF NOT EXISTS feature_flags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'Infrastructure',
  globally_enabled BOOLEAN NOT NULL DEFAULT true,
  enabled_for_free BOOLEAN NOT NULL DEFAULT false,
  enabled_for_basic BOOLEAN NOT NULL DEFAULT false,
  enabled_for_professional BOOLEAN NOT NULL DEFAULT true,
  enabled_for_enterprise BOOLEAN NOT NULL DEFAULT true,
  rollout_percentage INTEGER NOT NULL DEFAULT 100,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_feature_flags_key ON feature_flags(key);
CREATE INDEX IF NOT EXISTS idx_feature_flags_category ON feature_flags(category);
    `);
    return;
  }

  if (checkError) {
    console.error('Error checking table:', checkError);
    return;
  }

  console.log('✅ Table exists! Seeding default feature flags...\n');

  // Upsert default flags
  for (const flag of DEFAULT_FLAGS) {
    const { error: upsertError } = await supabase
      .from('feature_flags')
      .upsert(flag, { onConflict: 'key' });

    if (upsertError) {
      console.error(`❌ Failed to upsert ${flag.key}:`, upsertError.message);
    } else {
      console.log(`✅ ${flag.key}`);
    }
  }

  // Verify
  const { data: flags, error: fetchError } = await supabase
    .from('feature_flags')
    .select('key, name, globally_enabled')
    .order('key');

  if (fetchError) {
    console.error('\nError fetching flags:', fetchError);
  } else {
    console.log('\n📋 Current feature flags:');
    console.table(flags);
  }
}

main().catch(console.error);
