-- Performance Indexes for Scale (Phase 3)
-- Target: 50,000+ salons with sub-200ms queries
-- Created: 2025-12-29

-- =============================================================================
-- COMPOSITE INDEXES FOR COMMON QUERIES
-- =============================================================================

-- Appointments: Store + date range queries (most common)
CREATE INDEX IF NOT EXISTS idx_appointments_store_date
ON appointments(store_id, appointment_date);

-- Appointments: Store + status for filtering
CREATE INDEX IF NOT EXISTS idx_appointments_store_status
ON appointments(store_id, status);

-- Appointments: Staff scheduling queries
CREATE INDEX IF NOT EXISTS idx_appointments_staff_date
ON appointments(staff_id, appointment_date);

-- Tickets: Store + status (dashboard views)
CREATE INDEX IF NOT EXISTS idx_tickets_store_status
ON tickets(store_id, status);

-- Tickets: Store + created date (history/reports)
CREATE INDEX IF NOT EXISTS idx_tickets_store_created
ON tickets(store_id, created_at DESC);

-- Transactions: Store + date (daily reports)
CREATE INDEX IF NOT EXISTS idx_transactions_store_created
ON transactions(store_id, created_at DESC);

-- Transactions: Store + payment method (reporting)
CREATE INDEX IF NOT EXISTS idx_transactions_store_payment
ON transactions(store_id, payment_method);

-- Clients: Store + name search (alphabetical lists)
CREATE INDEX IF NOT EXISTS idx_clients_store_name
ON clients(store_id, last_name, first_name);

-- Clients: Store + phone lookup
CREATE INDEX IF NOT EXISTS idx_clients_store_phone
ON clients(store_id, phone);

-- Clients: Store + email lookup
CREATE INDEX IF NOT EXISTS idx_clients_store_email
ON clients(store_id, email);

-- Staff: Store + active status (for selectors)
CREATE INDEX IF NOT EXISTS idx_staff_store_active
ON staff(store_id, is_active);

-- Services: Store + category (menu display)
CREATE INDEX IF NOT EXISTS idx_services_store_category
ON services(store_id, category_id);

-- =============================================================================
-- PARTIAL INDEXES FOR ACTIVE/RECENT DATA
-- =============================================================================

-- Active clients only (most queries filter deleted)
CREATE INDEX IF NOT EXISTS idx_clients_active
ON clients(store_id)
WHERE is_deleted = false OR is_deleted IS NULL;

-- Active staff only
CREATE INDEX IF NOT EXISTS idx_staff_active_only
ON staff(store_id)
WHERE is_active = true;

-- Open tickets (dashboard priority)
CREATE INDEX IF NOT EXISTS idx_tickets_open
ON tickets(store_id, created_at DESC)
WHERE status IN ('waiting', 'in-service', 'completed');

-- Today's appointments (most accessed)
CREATE INDEX IF NOT EXISTS idx_appointments_today
ON appointments(store_id, start_time)
WHERE appointment_date = CURRENT_DATE;

-- =============================================================================
-- SYNC-RELATED INDEXES
-- =============================================================================

-- Pending sync items (background sync service)
CREATE INDEX IF NOT EXISTS idx_appointments_pending_sync
ON appointments(store_id, updated_at)
WHERE sync_status = 'pending';

CREATE INDEX IF NOT EXISTS idx_tickets_pending_sync
ON tickets(store_id, updated_at)
WHERE sync_status = 'pending';

CREATE INDEX IF NOT EXISTS idx_clients_pending_sync
ON clients(store_id, updated_at)
WHERE sync_status = 'pending';

CREATE INDEX IF NOT EXISTS idx_transactions_pending_sync
ON transactions(store_id, updated_at)
WHERE sync_status = 'pending';

-- =============================================================================
-- FULL-TEXT SEARCH (for client lookup)
-- =============================================================================

-- GIN index for fast text search on clients
-- Combines first_name, last_name, email, phone for unified search
CREATE INDEX IF NOT EXISTS idx_clients_search
ON clients
USING GIN (
  to_tsvector('english',
    COALESCE(first_name, '') || ' ' ||
    COALESCE(last_name, '') || ' ' ||
    COALESCE(email, '') || ' ' ||
    COALESCE(phone, '')
  )
);

-- =============================================================================
-- ANALYZE TABLES (update statistics for query planner)
-- =============================================================================

ANALYZE appointments;
ANALYZE tickets;
ANALYZE transactions;
ANALYZE clients;
ANALYZE staff;
ANALYZE services;

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON INDEX idx_appointments_store_date IS 'Primary lookup for calendar views';
COMMENT ON INDEX idx_tickets_store_status IS 'Dashboard ticket filtering';
COMMENT ON INDEX idx_transactions_store_created IS 'Transaction history and reports';
COMMENT ON INDEX idx_clients_search IS 'Full-text search for client lookup';
