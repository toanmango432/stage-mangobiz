/**
 * Script to create business tables in Supabase
 * Run with: node scripts/create-supabase-tables.mjs
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://cpaldkcvdcdyzytosntc.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNwYWxka2N2ZGNkeXp5dG9zbnRjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDA4MzM3MiwiZXhwIjoyMDc5NjU5MzcyfQ.4Uub2qn-CTPBhTYN0HGlHx5ua0mHdJVIr0x9lVuUiAY';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// SQL statements to create tables
const SQL_STATEMENTS = [
  // Helper function
  `CREATE OR REPLACE FUNCTION update_updated_at_column()
   RETURNS TRIGGER AS $$
   BEGIN
       NEW.updated_at = NOW();
       RETURN NEW;
   END;
   $$ language 'plpgsql'`,

  // CLIENTS table
  `CREATE TABLE IF NOT EXISTS clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    display_name VARCHAR(200),
    nickname VARCHAR(50),
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255),
    avatar TEXT,
    gender VARCHAR(20),
    birthday DATE,
    anniversary DATE,
    preferred_language VARCHAR(10),
    address JSONB DEFAULT '{}',
    emergency_contacts JSONB DEFAULT '[]',
    staff_alert JSONB,
    is_blocked BOOLEAN DEFAULT FALSE,
    blocked_at TIMESTAMPTZ,
    blocked_by UUID,
    block_reason VARCHAR(50),
    block_reason_note TEXT,
    source VARCHAR(50),
    source_details TEXT,
    referred_by_client_id UUID,
    hair_profile JSONB DEFAULT '{}',
    skin_profile JSONB DEFAULT '{}',
    nail_profile JSONB DEFAULT '{}',
    medical_info JSONB DEFAULT '{}',
    preferences JSONB DEFAULT '{}',
    communication_preferences JSONB DEFAULT '{}',
    loyalty_info JSONB DEFAULT '{}',
    membership JSONB,
    gift_cards JSONB DEFAULT '[]',
    visit_summary JSONB DEFAULT '{}',
    outstanding_balance DECIMAL(10,2) DEFAULT 0,
    store_credit DECIMAL(10,2) DEFAULT 0,
    average_rating DECIMAL(2,1),
    total_reviews INTEGER DEFAULT 0,
    tags JSONB DEFAULT '[]',
    notes JSONB DEFAULT '[]',
    is_vip BOOLEAN DEFAULT FALSE,
    sync_status VARCHAR(20) DEFAULT 'synced',
    sync_version INTEGER DEFAULT 1,
    last_synced_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  // STAFF table
  `CREATE TABLE IF NOT EXISTS staff (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    avatar TEXT,
    role VARCHAR(50),
    specialties TEXT[],
    skills TEXT[],
    status VARCHAR(20) DEFAULT 'available',
    is_active BOOLEAN DEFAULT TRUE,
    hire_date DATE,
    commission_rate DECIMAL(4,3),
    clocked_in_at TIMESTAMPTZ,
    current_ticket_id UUID,
    turn_queue_position INTEGER,
    services_count_today INTEGER DEFAULT 0,
    revenue_today DECIMAL(10,2) DEFAULT 0,
    tips_today DECIMAL(10,2) DEFAULT 0,
    rating DECIMAL(2,1),
    vip_preferred BOOLEAN DEFAULT FALSE,
    schedule JSONB DEFAULT '[]',
    sync_status VARCHAR(20) DEFAULT 'synced',
    sync_version INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  // SERVICE_CATEGORIES table
  `CREATE TABLE IF NOT EXISTS service_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    parent_category_id UUID REFERENCES service_categories(id),
    display_order INTEGER DEFAULT 0,
    color VARCHAR(7),
    icon VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    sync_status VARCHAR(20) DEFAULT 'synced',
    sync_version INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  // SERVICES table
  `CREATE TABLE IF NOT EXISTS services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    category_id UUID REFERENCES service_categories(id),
    category VARCHAR(100),
    description TEXT,
    duration INTEGER NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    commission_rate DECIMAL(4,3),
    is_active BOOLEAN DEFAULT TRUE,
    display_order INTEGER DEFAULT 0,
    sync_status VARCHAR(20) DEFAULT 'synced',
    sync_version INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  // APPOINTMENTS table
  `CREATE TABLE IF NOT EXISTS appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    client_id UUID REFERENCES clients(id),
    client_name VARCHAR(200) NOT NULL,
    client_phone VARCHAR(20),
    client_email VARCHAR(255),
    staff_id UUID REFERENCES staff(id),
    staff_name VARCHAR(200),
    services JSONB DEFAULT '[]',
    status VARCHAR(30) DEFAULT 'scheduled',
    scheduled_start_time TIMESTAMPTZ NOT NULL,
    scheduled_end_time TIMESTAMPTZ NOT NULL,
    actual_start_time TIMESTAMPTZ,
    actual_end_time TIMESTAMPTZ,
    check_in_time TIMESTAMPTZ,
    notes TEXT,
    source VARCHAR(30) DEFAULT 'walk-in',
    created_by VARCHAR(100),
    last_modified_by VARCHAR(100),
    sync_status VARCHAR(20) DEFAULT 'synced',
    sync_version INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  // TICKETS table
  `CREATE TABLE IF NOT EXISTS tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    appointment_id UUID REFERENCES appointments(id),
    client_id UUID REFERENCES clients(id),
    client_name VARCHAR(200) NOT NULL,
    client_phone VARCHAR(20),
    is_group_ticket BOOLEAN DEFAULT FALSE,
    clients JSONB DEFAULT '[]',
    is_merged_ticket BOOLEAN DEFAULT FALSE,
    merged_from_tickets TEXT[],
    original_ticket_id UUID,
    merged_at TIMESTAMPTZ,
    merged_by VARCHAR(100),
    services JSONB DEFAULT '[]',
    products JSONB DEFAULT '[]',
    status VARCHAR(30) DEFAULT 'open',
    subtotal DECIMAL(10,2) DEFAULT 0,
    discount DECIMAL(10,2) DEFAULT 0,
    discount_reason TEXT,
    discount_percent DECIMAL(5,2),
    tax DECIMAL(10,2) DEFAULT 0,
    tax_rate DECIMAL(5,2),
    tip DECIMAL(10,2) DEFAULT 0,
    total DECIMAL(10,2) DEFAULT 0,
    payments JSONB DEFAULT '[]',
    created_by VARCHAR(100),
    last_modified_by VARCHAR(100),
    completed_at TIMESTAMPTZ,
    sync_status VARCHAR(20) DEFAULT 'synced',
    sync_version INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  // TRANSACTIONS table
  `CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    ticket_id UUID REFERENCES tickets(id),
    client_id UUID REFERENCES clients(id),
    type VARCHAR(30) NOT NULL,
    payment_method VARCHAR(30) NOT NULL,
    card_type VARCHAR(20),
    card_last4 VARCHAR(4),
    amount DECIMAL(10,2) NOT NULL,
    tip DECIMAL(10,2) DEFAULT 0,
    total DECIMAL(10,2) NOT NULL,
    transaction_ref VARCHAR(100),
    status VARCHAR(20) DEFAULT 'completed',
    processed_at TIMESTAMPTZ DEFAULT NOW(),
    processed_by VARCHAR(100),
    notes TEXT,
    sync_status VARCHAR(20) DEFAULT 'synced',
    sync_version INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  )`
];

// Index creation statements
const INDEX_STATEMENTS = [
  // Clients indexes
  `CREATE INDEX IF NOT EXISTS idx_clients_store_id ON clients(store_id)`,
  `CREATE INDEX IF NOT EXISTS idx_clients_phone ON clients(store_id, phone)`,
  `CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(store_id, email)`,
  `CREATE INDEX IF NOT EXISTS idx_clients_name ON clients(store_id, last_name, first_name)`,
  `CREATE INDEX IF NOT EXISTS idx_clients_is_blocked ON clients(store_id, is_blocked)`,
  `CREATE INDEX IF NOT EXISTS idx_clients_is_vip ON clients(store_id, is_vip)`,

  // Staff indexes
  `CREATE INDEX IF NOT EXISTS idx_staff_store_id ON staff(store_id)`,
  `CREATE INDEX IF NOT EXISTS idx_staff_status ON staff(store_id, status)`,
  `CREATE INDEX IF NOT EXISTS idx_staff_is_active ON staff(store_id, is_active)`,

  // Service categories indexes
  `CREATE INDEX IF NOT EXISTS idx_service_categories_store_id ON service_categories(store_id)`,
  `CREATE INDEX IF NOT EXISTS idx_service_categories_parent ON service_categories(parent_category_id)`,

  // Services indexes
  `CREATE INDEX IF NOT EXISTS idx_services_store_id ON services(store_id)`,
  `CREATE INDEX IF NOT EXISTS idx_services_category ON services(store_id, category_id)`,
  `CREATE INDEX IF NOT EXISTS idx_services_active ON services(store_id, is_active)`,

  // Appointments indexes
  `CREATE INDEX IF NOT EXISTS idx_appointments_store_id ON appointments(store_id)`,
  `CREATE INDEX IF NOT EXISTS idx_appointments_client ON appointments(store_id, client_id)`,
  `CREATE INDEX IF NOT EXISTS idx_appointments_staff ON appointments(store_id, staff_id)`,
  `CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(store_id, status)`,
  `CREATE INDEX IF NOT EXISTS idx_appointments_scheduled ON appointments(store_id, scheduled_start_time)`,

  // Tickets indexes
  `CREATE INDEX IF NOT EXISTS idx_tickets_store_id ON tickets(store_id)`,
  `CREATE INDEX IF NOT EXISTS idx_tickets_client ON tickets(store_id, client_id)`,
  `CREATE INDEX IF NOT EXISTS idx_tickets_appointment ON tickets(appointment_id)`,
  `CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(store_id, status)`,
  `CREATE INDEX IF NOT EXISTS idx_tickets_created ON tickets(store_id, created_at)`,

  // Transactions indexes
  `CREATE INDEX IF NOT EXISTS idx_transactions_store_id ON transactions(store_id)`,
  `CREATE INDEX IF NOT EXISTS idx_transactions_ticket ON transactions(ticket_id)`,
  `CREATE INDEX IF NOT EXISTS idx_transactions_client ON transactions(store_id, client_id)`,
  `CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(store_id, type)`
];

// Trigger statements
const TRIGGER_STATEMENTS = [
  `DROP TRIGGER IF EXISTS update_clients_updated_at ON clients`,
  `CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()`,

  `DROP TRIGGER IF EXISTS update_staff_updated_at ON staff`,
  `CREATE TRIGGER update_staff_updated_at BEFORE UPDATE ON staff FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()`,

  `DROP TRIGGER IF EXISTS update_service_categories_updated_at ON service_categories`,
  `CREATE TRIGGER update_service_categories_updated_at BEFORE UPDATE ON service_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()`,

  `DROP TRIGGER IF EXISTS update_services_updated_at ON services`,
  `CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON services FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()`,

  `DROP TRIGGER IF EXISTS update_appointments_updated_at ON appointments`,
  `CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()`,

  `DROP TRIGGER IF EXISTS update_tickets_updated_at ON tickets`,
  `CREATE TRIGGER update_tickets_updated_at BEFORE UPDATE ON tickets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()`,

  `DROP TRIGGER IF EXISTS update_transactions_updated_at ON transactions`,
  `CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()`
];

// RLS statements
const RLS_STATEMENTS = [
  // Enable RLS
  `ALTER TABLE clients ENABLE ROW LEVEL SECURITY`,
  `ALTER TABLE staff ENABLE ROW LEVEL SECURITY`,
  `ALTER TABLE service_categories ENABLE ROW LEVEL SECURITY`,
  `ALTER TABLE services ENABLE ROW LEVEL SECURITY`,
  `ALTER TABLE appointments ENABLE ROW LEVEL SECURITY`,
  `ALTER TABLE tickets ENABLE ROW LEVEL SECURITY`,
  `ALTER TABLE transactions ENABLE ROW LEVEL SECURITY`,

  // Policies for clients
  `DROP POLICY IF EXISTS "Enable all for service role" ON clients`,
  `CREATE POLICY "Enable all for service role" ON clients FOR ALL USING (true)`,

  // Policies for staff
  `DROP POLICY IF EXISTS "Enable all for service role" ON staff`,
  `CREATE POLICY "Enable all for service role" ON staff FOR ALL USING (true)`,

  // Policies for service_categories
  `DROP POLICY IF EXISTS "Enable all for service role" ON service_categories`,
  `CREATE POLICY "Enable all for service role" ON service_categories FOR ALL USING (true)`,

  // Policies for services
  `DROP POLICY IF EXISTS "Enable all for service role" ON services`,
  `CREATE POLICY "Enable all for service role" ON services FOR ALL USING (true)`,

  // Policies for appointments
  `DROP POLICY IF EXISTS "Enable all for service role" ON appointments`,
  `CREATE POLICY "Enable all for service role" ON appointments FOR ALL USING (true)`,

  // Policies for tickets
  `DROP POLICY IF EXISTS "Enable all for service role" ON tickets`,
  `CREATE POLICY "Enable all for service role" ON tickets FOR ALL USING (true)`,

  // Policies for transactions
  `DROP POLICY IF EXISTS "Enable all for service role" ON transactions`,
  `CREATE POLICY "Enable all for service role" ON transactions FOR ALL USING (true)`
];

async function executeSQL(sql, description) {
  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
    if (error) {
      // If exec_sql doesn't exist, we need to use raw query
      throw error;
    }
    console.log(`✅ ${description}`);
    return true;
  } catch (error) {
    console.log(`⚠️ ${description}: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('🚀 Creating Supabase tables for Mango POS...\n');

  // Note: Supabase JS client can't execute raw SQL directly
  // We need to use the SQL editor or a database migration tool
  console.log('⚠️ The Supabase JS client cannot execute raw SQL statements.');
  console.log('');
  console.log('📋 Please copy the SQL from tasks/supabase-schema.sql and run it in:');
  console.log('   https://supabase.com/dashboard/project/cpaldkcvdcdyzytosntc/sql/new');
  console.log('');
  console.log('Alternatively, let me try inserting a test record to verify connection...\n');

  // Test connection by checking if we can read from stores
  const { data: stores, error: storesError } = await supabase
    .from('stores')
    .select('id, name')
    .limit(1);

  if (storesError) {
    console.log('❌ Failed to connect:', storesError.message);
    return;
  }

  console.log('✅ Connected to Supabase successfully!');
  console.log('📦 Found stores:', stores);

  // Check if clients table exists
  const { data: clientsCheck, error: clientsError } = await supabase
    .from('clients')
    .select('id')
    .limit(1);

  if (clientsError && clientsError.code === '42P01') {
    console.log('\n❌ Clients table does not exist yet.');
    console.log('📋 Please run the SQL from tasks/supabase-schema.sql in the Supabase SQL Editor.');
  } else if (clientsError) {
    console.log('\n⚠️ Clients table check error:', clientsError.message);
  } else {
    console.log('\n✅ Clients table already exists!');
  }
}

main().catch(console.error);
