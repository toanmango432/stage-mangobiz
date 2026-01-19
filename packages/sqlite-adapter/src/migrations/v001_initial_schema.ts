/**
 * Migration v001: Initial Schema
 *
 * Creates the core tables for Mango POS:
 * - appointments: Scheduled appointments with staff and clients
 * - tickets: Service tickets with all 45 columns matching TicketSQLiteService (Dexie v16)
 * - clients: Client contact and profile information (50+ columns matching Dexie v16)
 *
 * All tables include syncStatus for offline sync support.
 */

import type { Migration } from './types';

export const migration_001: Migration = {
  version: 1,
  name: 'initial_schema',

  async up(db) {
    console.log('[SQLite] Running migration 1: initial_schema');

    // Create appointments table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS appointments (
        id TEXT PRIMARY KEY,
        storeId TEXT NOT NULL,
        clientId TEXT,
        staffId TEXT,
        status TEXT NOT NULL,
        scheduledStartTime TEXT NOT NULL,
        scheduledEndTime TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        syncStatus TEXT DEFAULT 'local'
      )
    `);

    // Create tickets table - all 45 columns matching TicketSQLiteService interface
    // See: packages/sqlite-adapter/src/services/ticketService.ts for full TicketRow schema
    // Matches Dexie v16: id, storeId, clientId, status, createdAt, syncStatus, appointmentId
    await db.exec(`
      CREATE TABLE IF NOT EXISTS tickets (
        -- Primary fields
        id TEXT PRIMARY KEY,
        number INTEGER,
        store_id TEXT NOT NULL,
        appointment_id TEXT,

        -- Client fields
        client_id TEXT NOT NULL,
        client_name TEXT NOT NULL,
        client_phone TEXT NOT NULL,

        -- Group ticket fields
        is_group_ticket INTEGER DEFAULT 0,
        clients TEXT,

        -- Merged ticket fields
        is_merged_ticket INTEGER DEFAULT 0,
        merged_from_tickets TEXT,
        original_ticket_id TEXT,
        merged_at TEXT,
        merged_by TEXT,

        -- Services and products (JSON arrays)
        services TEXT NOT NULL,
        products TEXT NOT NULL,

        -- Status
        status TEXT NOT NULL,

        -- Pricing fields
        subtotal REAL NOT NULL DEFAULT 0,
        discount REAL NOT NULL DEFAULT 0,
        discount_reason TEXT,
        discount_percent REAL,
        tax REAL NOT NULL DEFAULT 0,
        tax_rate REAL,
        tip REAL NOT NULL DEFAULT 0,
        total REAL NOT NULL DEFAULT 0,

        -- Payments (JSON array)
        payments TEXT NOT NULL,

        -- Timestamps
        created_at TEXT NOT NULL,
        updated_at TEXT,
        completed_at TEXT,

        -- Audit fields
        created_by TEXT NOT NULL,
        last_modified_by TEXT NOT NULL,
        sync_status TEXT DEFAULT 'local',

        -- Draft fields
        is_draft INTEGER DEFAULT 0,
        draft_expires_at TEXT,
        last_auto_save_at TEXT,

        -- Source tracking
        source TEXT,

        -- Service charges
        service_charges TEXT,
        service_charge_total REAL,

        -- Payment method (legacy/convenience field)
        payment_method TEXT,

        -- Staff assignment (primary staff for the ticket)
        staff_id TEXT,
        staff_name TEXT,

        -- Closing fields
        closed_at TEXT,
        closed_by TEXT,

        -- Signature
        signature_base64 TEXT,
        signature_timestamp TEXT
      )
    `);

    // Create clients table - all 50+ columns matching ClientSQLiteService interface
    // See: packages/sqlite-adapter/src/services/clientService.ts for full schema
    // Matches Dexie v16: id, storeId, phone, email, firstName, lastName, isBlocked, isVip, syncStatus, createdAt
    await db.exec(`
      CREATE TABLE IF NOT EXISTS clients (
        -- Primary fields
        id TEXT PRIMARY KEY,
        store_id TEXT NOT NULL,

        -- Name fields
        first_name TEXT,
        last_name TEXT,
        display_name TEXT,
        nickname TEXT,
        name TEXT,

        -- Contact fields
        phone TEXT,
        email TEXT,
        avatar TEXT,

        -- Personal info
        gender TEXT,
        birthday TEXT,
        anniversary TEXT,
        preferred_language TEXT,

        -- Complex fields stored as JSON TEXT
        address TEXT,
        emergency_contacts TEXT,
        staff_alert TEXT,

        -- Block/status fields
        is_blocked INTEGER DEFAULT 0,
        blocked_at TEXT,
        blocked_by TEXT,
        block_reason TEXT,
        block_reason_note TEXT,

        -- Source/referral tracking
        source TEXT,
        source_details TEXT,
        referred_by_client_id TEXT,
        referred_by_client_name TEXT,

        -- Profile JSON fields
        hair_profile TEXT,
        skin_profile TEXT,
        nail_profile TEXT,
        medical_info TEXT,

        -- Preferences JSON fields
        preferences TEXT,
        communication_preferences TEXT,

        -- Loyalty/membership JSON fields
        loyalty_info TEXT,
        loyalty_tier TEXT,
        membership TEXT,
        gift_cards TEXT,

        -- Visit statistics
        visit_summary TEXT,
        last_visit TEXT,
        total_visits INTEGER DEFAULT 0,
        total_spent REAL DEFAULT 0,
        outstanding_balance REAL DEFAULT 0,
        store_credit REAL DEFAULT 0,

        -- Rating/review stats
        average_rating REAL,
        total_reviews INTEGER DEFAULT 0,

        -- Tags and notes (JSON arrays)
        tags TEXT,
        notes TEXT,

        -- VIP status
        is_vip INTEGER DEFAULT 0,

        -- Timestamps and sync
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        sync_status TEXT DEFAULT 'local'
      )
    `);

    // Create indexes for common queries
    // Appointments indexes
    await db.exec(`
      CREATE INDEX IF NOT EXISTS idx_appointments_store_status
      ON appointments(storeId, status)
    `);

    // Tickets indexes - matching Dexie v16 compound indexes
    // [storeId+status] - for status filtering
    await db.exec(`
      CREATE INDEX IF NOT EXISTS idx_tickets_store_status
      ON tickets(store_id, status)
    `);

    // [storeId+createdAt] - for date-based sorting/filtering
    await db.exec(`
      CREATE INDEX IF NOT EXISTS idx_tickets_store_created
      ON tickets(store_id, created_at)
    `);

    // [clientId+createdAt] - for client ticket history
    await db.exec(`
      CREATE INDEX IF NOT EXISTS idx_tickets_client_created
      ON tickets(client_id, created_at)
    `);

    // [storeId+status+createdAt] - for optimized status + date queries (turn queue)
    await db.exec(`
      CREATE INDEX IF NOT EXISTS idx_tickets_store_status_created
      ON tickets(store_id, status, created_at)
    `);

    // [storeId+staffId+createdAt] - for staff ticket reports
    await db.exec(`
      CREATE INDEX IF NOT EXISTS idx_tickets_store_staff_created
      ON tickets(store_id, staff_id, created_at)
    `);

    // [storeId+appointmentId] - for appointment lookup
    await db.exec(`
      CREATE INDEX IF NOT EXISTS idx_tickets_store_appointment
      ON tickets(store_id, appointment_id)
    `);

    // Clients indexes - matching Dexie v16 compound indexes
    // Basic store filter
    await db.exec(`
      CREATE INDEX IF NOT EXISTS idx_clients_store
      ON clients(store_id)
    `);

    // [storeId+lastName] - for alphabetical client lists
    await db.exec(`
      CREATE INDEX IF NOT EXISTS idx_clients_store_lastname
      ON clients(store_id, last_name)
    `);

    // [storeId+isVip] - for VIP client filtering
    await db.exec(`
      CREATE INDEX IF NOT EXISTS idx_clients_store_vip
      ON clients(store_id, is_vip)
    `);

    // [storeId+isBlocked] - for blocked client filtering
    await db.exec(`
      CREATE INDEX IF NOT EXISTS idx_clients_store_blocked
      ON clients(store_id, is_blocked)
    `);

    // [storeId+createdAt] - for date-based sorting/filtering
    await db.exec(`
      CREATE INDEX IF NOT EXISTS idx_clients_store_created
      ON clients(store_id, created_at)
    `);

    // Phone lookup - unique per store for duplicate prevention
    await db.exec(`
      CREATE INDEX IF NOT EXISTS idx_clients_store_phone
      ON clients(store_id, phone)
    `);

    // Email lookup
    await db.exec(`
      CREATE INDEX IF NOT EXISTS idx_clients_store_email
      ON clients(store_id, email)
    `);

    console.log('[SQLite] Migration 1 complete: Created appointments, tickets, clients tables');
  },

  async down(db) {
    console.log('[SQLite] Rolling back migration 1: initial_schema');

    // Drop tables in reverse order (respecting potential future foreign keys)
    await db.exec('DROP TABLE IF EXISTS clients');
    await db.exec('DROP TABLE IF EXISTS tickets');
    await db.exec('DROP TABLE IF EXISTS appointments');

    console.log('[SQLite] Migration 1 rollback complete');
  },
};
