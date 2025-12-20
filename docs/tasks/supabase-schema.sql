-- ============================================================================
-- MANGO POS - SUPABASE DATABASE SCHEMA
-- Direct Supabase Sync Architecture - Phase 1
-- ============================================================================
--
-- HOW TO RUN:
-- 1. Go to https://supabase.com/dashboard/project/cpaldkcvdcdyzytosntc
-- 2. Click "SQL Editor" in the left sidebar
-- 3. Click "New Query"
-- 4. Copy and paste this entire file
-- 5. Click "Run" (or Cmd+Enter)
--
-- IMPORTANT: Run this ONCE. If you need to re-run, first drop the tables.
-- ============================================================================

-- ============================================================================
-- HELPER FUNCTION: Auto-update updated_at timestamp
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- ============================================================================
-- TABLE 1: CLIENTS
-- ============================================================================
CREATE TABLE IF NOT EXISTS clients (
    -- Primary key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Multi-tenant isolation (REQUIRED - links to stores table)
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,

    -- Basic info
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    display_name VARCHAR(200),
    nickname VARCHAR(50),
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255),
    avatar TEXT,
    gender VARCHAR(20), -- 'female', 'male', 'non_binary', 'prefer_not_to_say'
    birthday DATE,
    anniversary DATE,
    preferred_language VARCHAR(10),

    -- Address (JSONB for flexibility)
    address JSONB DEFAULT '{}',

    -- Emergency contacts (array of JSONB)
    emergency_contacts JSONB DEFAULT '[]',

    -- Staff alert
    staff_alert JSONB,

    -- Blocking
    is_blocked BOOLEAN DEFAULT FALSE,
    blocked_at TIMESTAMPTZ,
    blocked_by UUID,
    block_reason VARCHAR(50),
    block_reason_note TEXT,

    -- Source tracking
    source VARCHAR(50),
    source_details TEXT,
    referred_by_client_id UUID,

    -- Beauty profiles (JSONB for complex nested data)
    hair_profile JSONB DEFAULT '{}',
    skin_profile JSONB DEFAULT '{}',
    nail_profile JSONB DEFAULT '{}',
    medical_info JSONB DEFAULT '{}',

    -- Preferences
    preferences JSONB DEFAULT '{}',
    communication_preferences JSONB DEFAULT '{
        "allowEmail": true,
        "allowSms": true,
        "allowPhone": true,
        "allowMarketing": false,
        "appointmentReminders": true,
        "reminderTiming": 24,
        "birthdayGreetings": true,
        "promotionalOffers": false,
        "newsletterSubscribed": false
    }',

    -- Loyalty & membership
    loyalty_info JSONB DEFAULT '{
        "tier": "bronze",
        "pointsBalance": 0,
        "lifetimePoints": 0,
        "referralCount": 0,
        "rewardsRedeemed": 0
    }',
    membership JSONB,
    gift_cards JSONB DEFAULT '[]',

    -- Financial summary
    visit_summary JSONB DEFAULT '{
        "totalVisits": 0,
        "totalSpent": 0,
        "averageTicket": 0,
        "noShowCount": 0,
        "lateCancelCount": 0
    }',
    outstanding_balance DECIMAL(10,2) DEFAULT 0,
    store_credit DECIMAL(10,2) DEFAULT 0,

    -- Reviews
    average_rating DECIMAL(2,1),
    total_reviews INTEGER DEFAULT 0,

    -- Tags & notes (JSONB arrays)
    tags JSONB DEFAULT '[]',
    notes JSONB DEFAULT '[]',

    -- Status
    is_vip BOOLEAN DEFAULT FALSE,

    -- Sync metadata
    sync_status VARCHAR(20) DEFAULT 'synced',
    sync_version INTEGER DEFAULT 1,
    last_synced_at TIMESTAMPTZ,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for clients
CREATE INDEX idx_clients_store_id ON clients(store_id);
CREATE INDEX idx_clients_phone ON clients(store_id, phone);
CREATE INDEX idx_clients_email ON clients(store_id, email);
CREATE INDEX idx_clients_name ON clients(store_id, last_name, first_name);
CREATE INDEX idx_clients_is_blocked ON clients(store_id, is_blocked);
CREATE INDEX idx_clients_is_vip ON clients(store_id, is_vip);
CREATE INDEX idx_clients_created_at ON clients(store_id, created_at);

-- Trigger for updated_at
CREATE TRIGGER update_clients_updated_at
    BEFORE UPDATE ON clients
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies for clients
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Stores can view own clients"
    ON clients FOR SELECT
    USING (store_id IN (
        SELECT id FROM stores WHERE id = store_id
    ));

CREATE POLICY "Stores can insert own clients"
    ON clients FOR INSERT
    WITH CHECK (store_id IS NOT NULL);

CREATE POLICY "Stores can update own clients"
    ON clients FOR UPDATE
    USING (store_id IN (
        SELECT id FROM stores WHERE id = store_id
    ));

CREATE POLICY "Stores can delete own clients"
    ON clients FOR DELETE
    USING (store_id IN (
        SELECT id FROM stores WHERE id = store_id
    ));

-- ============================================================================
-- TABLE 2: STAFF
-- ============================================================================
CREATE TABLE IF NOT EXISTS staff (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,

    -- Basic info
    name VARCHAR(200) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    avatar TEXT,

    -- Role & skills
    role VARCHAR(50),
    specialties TEXT[], -- Array of service IDs
    skills TEXT[], -- Skill tags

    -- Status
    status VARCHAR(20) DEFAULT 'available', -- 'available', 'busy', 'off', 'break'
    is_active BOOLEAN DEFAULT TRUE,

    -- Employment
    hire_date DATE,
    commission_rate DECIMAL(4,3), -- e.g., 0.300 for 30%

    -- Current state
    clocked_in_at TIMESTAMPTZ,
    current_ticket_id UUID,
    turn_queue_position INTEGER,

    -- Daily stats (reset daily)
    services_count_today INTEGER DEFAULT 0,
    revenue_today DECIMAL(10,2) DEFAULT 0,
    tips_today DECIMAL(10,2) DEFAULT 0,

    -- Performance
    rating DECIMAL(2,1),
    vip_preferred BOOLEAN DEFAULT FALSE,

    -- Schedule (JSONB array of weekly schedule)
    schedule JSONB DEFAULT '[
        {"dayOfWeek": 0, "startTime": "09:00", "endTime": "17:00", "isAvailable": false},
        {"dayOfWeek": 1, "startTime": "09:00", "endTime": "17:00", "isAvailable": true},
        {"dayOfWeek": 2, "startTime": "09:00", "endTime": "17:00", "isAvailable": true},
        {"dayOfWeek": 3, "startTime": "09:00", "endTime": "17:00", "isAvailable": true},
        {"dayOfWeek": 4, "startTime": "09:00", "endTime": "17:00", "isAvailable": true},
        {"dayOfWeek": 5, "startTime": "09:00", "endTime": "17:00", "isAvailable": true},
        {"dayOfWeek": 6, "startTime": "09:00", "endTime": "17:00", "isAvailable": false}
    ]',

    -- Sync metadata
    sync_status VARCHAR(20) DEFAULT 'synced',
    sync_version INTEGER DEFAULT 1,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for staff
CREATE INDEX idx_staff_store_id ON staff(store_id);
CREATE INDEX idx_staff_status ON staff(store_id, status);
CREATE INDEX idx_staff_is_active ON staff(store_id, is_active);
CREATE INDEX idx_staff_email ON staff(store_id, email);

-- Trigger for updated_at
CREATE TRIGGER update_staff_updated_at
    BEFORE UPDATE ON staff
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies for staff
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Stores can view own staff"
    ON staff FOR SELECT
    USING (store_id IN (SELECT id FROM stores));

CREATE POLICY "Stores can insert own staff"
    ON staff FOR INSERT
    WITH CHECK (store_id IS NOT NULL);

CREATE POLICY "Stores can update own staff"
    ON staff FOR UPDATE
    USING (store_id IN (SELECT id FROM stores));

CREATE POLICY "Stores can delete own staff"
    ON staff FOR DELETE
    USING (store_id IN (SELECT id FROM stores));

-- ============================================================================
-- TABLE 3: SERVICE_CATEGORIES
-- ============================================================================
CREATE TABLE IF NOT EXISTS service_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,

    name VARCHAR(100) NOT NULL,
    description TEXT,
    parent_category_id UUID REFERENCES service_categories(id),
    display_order INTEGER DEFAULT 0,
    color VARCHAR(7), -- Hex color
    icon VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,

    -- Sync metadata
    sync_status VARCHAR(20) DEFAULT 'synced',
    sync_version INTEGER DEFAULT 1,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_service_categories_store_id ON service_categories(store_id);
CREATE INDEX idx_service_categories_parent ON service_categories(parent_category_id);
CREATE INDEX idx_service_categories_order ON service_categories(store_id, display_order);

-- Trigger
CREATE TRIGGER update_service_categories_updated_at
    BEFORE UPDATE ON service_categories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE service_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Stores can manage own categories"
    ON service_categories FOR ALL
    USING (store_id IN (SELECT id FROM stores));

-- ============================================================================
-- TABLE 4: SERVICES
-- ============================================================================
CREATE TABLE IF NOT EXISTS services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,

    name VARCHAR(200) NOT NULL,
    category_id UUID REFERENCES service_categories(id),
    category VARCHAR(100), -- Legacy field
    description TEXT,
    duration INTEGER NOT NULL, -- minutes
    price DECIMAL(10,2) NOT NULL,
    commission_rate DECIMAL(4,3), -- e.g., 0.300 for 30%
    is_active BOOLEAN DEFAULT TRUE,
    display_order INTEGER DEFAULT 0,

    -- Sync metadata
    sync_status VARCHAR(20) DEFAULT 'synced',
    sync_version INTEGER DEFAULT 1,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_services_store_id ON services(store_id);
CREATE INDEX idx_services_category ON services(store_id, category_id);
CREATE INDEX idx_services_active ON services(store_id, is_active);

-- Trigger
CREATE TRIGGER update_services_updated_at
    BEFORE UPDATE ON services
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Stores can manage own services"
    ON services FOR ALL
    USING (store_id IN (SELECT id FROM stores));

-- ============================================================================
-- TABLE 5: APPOINTMENTS
-- ============================================================================
CREATE TABLE IF NOT EXISTS appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,

    -- Client info
    client_id UUID REFERENCES clients(id),
    client_name VARCHAR(200) NOT NULL,
    client_phone VARCHAR(20),
    client_email VARCHAR(255),

    -- Staff
    staff_id UUID REFERENCES staff(id),
    staff_name VARCHAR(200),

    -- Services (JSONB array)
    services JSONB DEFAULT '[]',

    -- Status
    status VARCHAR(30) DEFAULT 'scheduled', -- 'scheduled', 'confirmed', 'checked-in', 'in-progress', 'completed', 'cancelled', 'no-show'

    -- Times
    scheduled_start_time TIMESTAMPTZ NOT NULL,
    scheduled_end_time TIMESTAMPTZ NOT NULL,
    actual_start_time TIMESTAMPTZ,
    actual_end_time TIMESTAMPTZ,
    check_in_time TIMESTAMPTZ,

    -- Additional info
    notes TEXT,
    source VARCHAR(30) DEFAULT 'walk-in', -- 'walk-in', 'phone', 'online', 'app', 'referral'

    -- Audit
    created_by VARCHAR(100),
    last_modified_by VARCHAR(100),

    -- Sync metadata
    sync_status VARCHAR(20) DEFAULT 'synced',
    sync_version INTEGER DEFAULT 1,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_appointments_store_id ON appointments(store_id);
CREATE INDEX idx_appointments_client ON appointments(store_id, client_id);
CREATE INDEX idx_appointments_staff ON appointments(store_id, staff_id);
CREATE INDEX idx_appointments_status ON appointments(store_id, status);
CREATE INDEX idx_appointments_scheduled ON appointments(store_id, scheduled_start_time);
CREATE INDEX idx_appointments_date ON appointments(store_id, DATE(scheduled_start_time));

-- Trigger
CREATE TRIGGER update_appointments_updated_at
    BEFORE UPDATE ON appointments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Stores can manage own appointments"
    ON appointments FOR ALL
    USING (store_id IN (SELECT id FROM stores));

-- ============================================================================
-- TABLE 6: TICKETS
-- ============================================================================
CREATE TABLE IF NOT EXISTS tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    appointment_id UUID REFERENCES appointments(id),

    -- Primary client
    client_id UUID REFERENCES clients(id),
    client_name VARCHAR(200) NOT NULL,
    client_phone VARCHAR(20),

    -- Group ticket support
    is_group_ticket BOOLEAN DEFAULT FALSE,
    clients JSONB DEFAULT '[]', -- Array of {clientId, clientName, clientPhone, services}

    -- Merge support
    is_merged_ticket BOOLEAN DEFAULT FALSE,
    merged_from_tickets TEXT[],
    original_ticket_id UUID,
    merged_at TIMESTAMPTZ,
    merged_by VARCHAR(100),

    -- Services & products (JSONB arrays)
    services JSONB DEFAULT '[]',
    products JSONB DEFAULT '[]',

    -- Status
    status VARCHAR(30) DEFAULT 'open', -- 'open', 'in-progress', 'completed', 'voided', 'refunded'

    -- Totals
    subtotal DECIMAL(10,2) DEFAULT 0,
    discount DECIMAL(10,2) DEFAULT 0,
    discount_reason TEXT,
    discount_percent DECIMAL(5,2),
    tax DECIMAL(10,2) DEFAULT 0,
    tax_rate DECIMAL(5,2),
    tip DECIMAL(10,2) DEFAULT 0,
    total DECIMAL(10,2) DEFAULT 0,

    -- Payments (JSONB array)
    payments JSONB DEFAULT '[]',

    -- Audit
    created_by VARCHAR(100),
    last_modified_by VARCHAR(100),
    completed_at TIMESTAMPTZ,

    -- Sync metadata
    sync_status VARCHAR(20) DEFAULT 'synced',
    sync_version INTEGER DEFAULT 1,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_tickets_store_id ON tickets(store_id);
CREATE INDEX idx_tickets_client ON tickets(store_id, client_id);
CREATE INDEX idx_tickets_appointment ON tickets(appointment_id);
CREATE INDEX idx_tickets_status ON tickets(store_id, status);
CREATE INDEX idx_tickets_created ON tickets(store_id, created_at);

-- Trigger
CREATE TRIGGER update_tickets_updated_at
    BEFORE UPDATE ON tickets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Stores can manage own tickets"
    ON tickets FOR ALL
    USING (store_id IN (SELECT id FROM stores));

-- ============================================================================
-- TABLE 7: TRANSACTIONS (Payment records)
-- ============================================================================
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    ticket_id UUID REFERENCES tickets(id),
    client_id UUID REFERENCES clients(id),

    -- Transaction type
    type VARCHAR(30) NOT NULL, -- 'sale', 'refund', 'void', 'deposit'

    -- Payment details
    payment_method VARCHAR(30) NOT NULL, -- 'cash', 'credit-card', 'debit-card', 'gift-card', 'store-credit'
    card_type VARCHAR(20),
    card_last4 VARCHAR(4),

    -- Amounts
    amount DECIMAL(10,2) NOT NULL,
    tip DECIMAL(10,2) DEFAULT 0,
    total DECIMAL(10,2) NOT NULL,

    -- Processing
    transaction_ref VARCHAR(100), -- External transaction ID
    status VARCHAR(20) DEFAULT 'completed', -- 'pending', 'completed', 'failed', 'refunded'

    -- Audit
    processed_at TIMESTAMPTZ DEFAULT NOW(),
    processed_by VARCHAR(100),
    notes TEXT,

    -- Sync metadata
    sync_status VARCHAR(20) DEFAULT 'synced',
    sync_version INTEGER DEFAULT 1,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_transactions_store_id ON transactions(store_id);
CREATE INDEX idx_transactions_ticket ON transactions(ticket_id);
CREATE INDEX idx_transactions_client ON transactions(store_id, client_id);
CREATE INDEX idx_transactions_type ON transactions(store_id, type);
CREATE INDEX idx_transactions_date ON transactions(store_id, created_at);

-- Trigger
CREATE TRIGGER update_transactions_updated_at
    BEFORE UPDATE ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Stores can manage own transactions"
    ON transactions FOR ALL
    USING (store_id IN (SELECT id FROM stores));

-- ============================================================================
-- ENABLE REAL-TIME SUBSCRIPTIONS
-- ============================================================================
-- Enable real-time for all business tables
ALTER PUBLICATION supabase_realtime ADD TABLE clients;
ALTER PUBLICATION supabase_realtime ADD TABLE staff;
ALTER PUBLICATION supabase_realtime ADD TABLE services;
ALTER PUBLICATION supabase_realtime ADD TABLE service_categories;
ALTER PUBLICATION supabase_realtime ADD TABLE appointments;
ALTER PUBLICATION supabase_realtime ADD TABLE tickets;
ALTER PUBLICATION supabase_realtime ADD TABLE transactions;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================
-- Run these after creating tables to verify:

-- Check all tables exist:
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('clients', 'staff', 'services', 'service_categories', 'appointments', 'tickets', 'transactions');

-- Check RLS is enabled:
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('clients', 'staff', 'services', 'service_categories', 'appointments', 'tickets', 'transactions');

-- Check indexes:
-- SELECT indexname, tablename FROM pg_indexes WHERE schemaname = 'public' AND tablename IN ('clients', 'staff', 'services', 'appointments', 'tickets', 'transactions');
