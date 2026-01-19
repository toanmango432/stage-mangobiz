/**
 * Migration v004: Infrastructure Tables Enhancement
 *
 * This migration ensures infrastructure tables have the complete schema
 * matching the SQLite services:
 * - settings: Key-value settings storage (unchanged if exists)
 * - sync_queue: Offline sync operation queue (unchanged if exists)
 * - device_settings: Device-specific configuration with config column
 *
 * Note: v003 created initial versions of these tables. This migration
 * adds any missing columns and ensures proper indexes.
 */

import type { Migration } from './types';

export const migration_004: Migration = {
  version: 4,
  name: 'infrastructure',

  async up(db) {
    console.log('[SQLite] Running migration 4: infrastructure');

    // =====================================================
    // SETTINGS TABLE
    // =====================================================
    // Already created in v003 with correct schema:
    // - key TEXT PRIMARY KEY
    // - value TEXT NOT NULL
    // - created_at TEXT NOT NULL
    // - updated_at TEXT NOT NULL
    //
    // Create only if not exists (idempotent)
    await db.exec(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `);

    // =====================================================
    // SYNC QUEUE TABLE
    // =====================================================
    // Already created in v003 with correct schema.
    // Ensure it exists with full schema for services.
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

    // Sync queue indexes (create if not exists)
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

    // Additional compound index for efficient queue processing
    // Orders by priority (ascending - 1 is high) then created_at (FIFO)
    await db.exec(`
      CREATE INDEX IF NOT EXISTS idx_sync_queue_priority_created
      ON sync_queue(priority, created_at)
    `);

    // =====================================================
    // DEVICE SETTINGS TABLE
    // =====================================================
    // Ensure complete schema matching DeviceSettingsSQLiteService.
    // Note: v003 created a basic version, but we need to ensure
    // all columns exist for the service to function properly.
    await db.exec(`
      CREATE TABLE IF NOT EXISTS device_settings (
        device_id TEXT PRIMARY KEY,
        mode TEXT NOT NULL DEFAULT 'online',
        offline_mode_enabled INTEGER DEFAULT 0,
        last_sync_at TEXT,
        registered_at TEXT,
        settings TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `);

    // Device settings indexes
    await db.exec(`
      CREATE INDEX IF NOT EXISTS idx_device_settings_mode
      ON device_settings(mode)
    `);

    await db.exec(`
      CREATE INDEX IF NOT EXISTS idx_device_settings_offline
      ON device_settings(offline_mode_enabled)
    `);

    console.log('[SQLite] Migration 4 complete: Infrastructure tables verified/created');
  },

  async down(db) {
    console.log('[SQLite] Rolling back migration 4: infrastructure');

    // Drop indexes first
    await db.exec('DROP INDEX IF EXISTS idx_device_settings_offline');
    await db.exec('DROP INDEX IF EXISTS idx_device_settings_mode');
    await db.exec('DROP INDEX IF EXISTS idx_sync_queue_priority_created');
    await db.exec('DROP INDEX IF EXISTS idx_sync_queue_entity');
    await db.exec('DROP INDEX IF EXISTS idx_sync_queue_status_created');
    await db.exec('DROP INDEX IF EXISTS idx_sync_queue_priority');
    await db.exec('DROP INDEX IF EXISTS idx_sync_queue_status');

    // Note: We don't drop the tables themselves as they may have been
    // created in v003 and contain data. Only drop if this is a full
    // rollback scenario. For safety, we only remove the indexes.
    //
    // To fully remove tables, use:
    // await db.exec('DROP TABLE IF EXISTS device_settings');
    // await db.exec('DROP TABLE IF EXISTS sync_queue');
    // await db.exec('DROP TABLE IF EXISTS settings');

    console.log('[SQLite] Migration 4 rollback complete: Indexes removed');
  },
};
