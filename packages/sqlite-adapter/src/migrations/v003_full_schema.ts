/**
 * Migration v003: Full Schema - Infrastructure and CRM Tables
 *
 * Creates infrastructure tables:
 * - settings: Key-value settings storage
 * - syncQueue: Offline sync operation queue
 * - deviceSettings: Device-specific configuration
 * - transactions: Payment transaction records
 *
 * All tables include appropriate indexes matching Dexie v16 schema.
 */

import type { Migration } from './types';

export const migration_003: Migration = {
  version: 3,
  name: 'full_schema',

  async up(db) {
    console.log('[SQLite] Running migration 3: full_schema');

    // =====================================================
    // INFRASTRUCTURE TABLES
    // =====================================================

    // Settings table - simple key-value store
    // Dexie: settings: 'key'
    await db.exec(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `);

    // SyncQueue table - offline sync operation queue
    // Dexie: syncQueue: 'id, priority, createdAt, status, entity, [status+createdAt]'
    await db.exec(`
      CREATE TABLE IF NOT EXISTS sync_queue (
        id TEXT PRIMARY KEY,
        entity TEXT NOT NULL,
        entity_id TEXT NOT NULL,
        operation TEXT NOT NULL,
        data TEXT NOT NULL,
        priority INTEGER NOT NULL DEFAULT 2,
        status TEXT NOT NULL DEFAULT 'pending',
        error_message TEXT,
        retry_count INTEGER DEFAULT 0,
        max_retries INTEGER DEFAULT 3,
        created_at TEXT NOT NULL,
        updated_at TEXT,
        completed_at TEXT
      )
    `);

    // SyncQueue indexes
    await db.exec(`
      CREATE INDEX IF NOT EXISTS idx_sync_queue_status
      ON sync_queue(status)
    `);

    await db.exec(`
      CREATE INDEX IF NOT EXISTS idx_sync_queue_priority
      ON sync_queue(priority)
    `);

    await db.exec(`
      CREATE INDEX IF NOT EXISTS idx_sync_queue_status_created
      ON sync_queue(status, created_at)
    `);

    await db.exec(`
      CREATE INDEX IF NOT EXISTS idx_sync_queue_entity
      ON sync_queue(entity)
    `);

    // DeviceSettings table - device-specific configuration
    // Dexie: deviceSettings: 'deviceId'
    await db.exec(`
      CREATE TABLE IF NOT EXISTS device_settings (
        device_id TEXT PRIMARY KEY,
        mode TEXT NOT NULL,
        offline_mode_enabled INTEGER DEFAULT 0,
        last_sync_at TEXT,
        registered_at TEXT,
        settings TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `);

    // =====================================================
    // TRANSACTIONS TABLE
    // =====================================================

    // Transactions table - payment transaction records
    // Dexie: transactions: 'id, storeId, ticketId, clientId, createdAt, syncStatus, status, [storeId+createdAt], [clientId+createdAt]'
    await db.exec(`
      CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY,
        store_id TEXT NOT NULL,
        ticket_id TEXT NOT NULL,
        client_id TEXT,

        -- Payment info
        type TEXT NOT NULL,
        payment_method TEXT NOT NULL,
        amount REAL NOT NULL,
        tip_amount REAL DEFAULT 0,

        -- Card details (masked)
        card_last_four TEXT,
        card_brand TEXT,
        card_holder_name TEXT,

        -- Authorization
        authorization_code TEXT,
        reference_number TEXT,
        processor_response TEXT,

        -- Status
        status TEXT NOT NULL DEFAULT 'pending',

        -- Refund tracking
        refunded_amount REAL DEFAULT 0,
        refund_reason TEXT,
        refunded_at TEXT,
        refunded_by TEXT,
        original_transaction_id TEXT,

        -- Void tracking
        voided_at TEXT,
        voided_by TEXT,
        void_reason TEXT,

        -- Staff
        processed_by TEXT,

        -- Metadata
        metadata TEXT,

        -- Timestamps
        created_at TEXT NOT NULL,
        updated_at TEXT,
        sync_status TEXT DEFAULT 'local'
      )
    `);

    // Transaction indexes matching Dexie v16
    await db.exec(`
      CREATE INDEX IF NOT EXISTS idx_transactions_store
      ON transactions(store_id)
    `);

    await db.exec(`
      CREATE INDEX IF NOT EXISTS idx_transactions_ticket
      ON transactions(ticket_id)
    `);

    await db.exec(`
      CREATE INDEX IF NOT EXISTS idx_transactions_client
      ON transactions(client_id)
    `);

    await db.exec(`
      CREATE INDEX IF NOT EXISTS idx_transactions_store_created
      ON transactions(store_id, created_at)
    `);

    await db.exec(`
      CREATE INDEX IF NOT EXISTS idx_transactions_client_created
      ON transactions(client_id, created_at)
    `);

    await db.exec(`
      CREATE INDEX IF NOT EXISTS idx_transactions_status
      ON transactions(status)
    `);

    await db.exec(`
      CREATE INDEX IF NOT EXISTS idx_transactions_store_status
      ON transactions(store_id, status)
    `);

    await db.exec(`
      CREATE INDEX IF NOT EXISTS idx_transactions_payment_method
      ON transactions(store_id, payment_method)
    `);

    console.log('[SQLite] Migration 3 complete: Created settings, sync_queue, device_settings, transactions tables');
  },

  async down(db) {
    console.log('[SQLite] Rolling back migration 3: full_schema');

    // Drop tables in reverse order
    await db.exec('DROP TABLE IF EXISTS transactions');
    await db.exec('DROP TABLE IF EXISTS device_settings');
    await db.exec('DROP TABLE IF EXISTS sync_queue');
    await db.exec('DROP TABLE IF EXISTS settings');

    console.log('[SQLite] Migration 3 rollback complete');
  },
};
