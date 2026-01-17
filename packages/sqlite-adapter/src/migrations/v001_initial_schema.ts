/**
 * Migration v001: Initial Schema
 *
 * Creates the core tables for Mango POS:
 * - appointments: Scheduled appointments with staff and clients
 * - tickets: Service tickets with status tracking
 * - clients: Client contact and profile information
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

    // Create tickets table
    // Note: services is stored as JSON TEXT array
    await db.exec(`
      CREATE TABLE IF NOT EXISTS tickets (
        id TEXT PRIMARY KEY,
        storeId TEXT NOT NULL,
        clientId TEXT,
        status TEXT NOT NULL,
        services TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        syncStatus TEXT DEFAULT 'local'
      )
    `);

    // Create clients table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS clients (
        id TEXT PRIMARY KEY,
        storeId TEXT NOT NULL,
        firstName TEXT,
        lastName TEXT,
        phone TEXT,
        email TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        syncStatus TEXT DEFAULT 'local'
      )
    `);

    // Create indexes for common queries
    // Appointments indexes
    await db.exec(`
      CREATE INDEX IF NOT EXISTS idx_appointments_store_status
      ON appointments(storeId, status)
    `);

    // Tickets indexes - optimized for turn queue and aggregation queries
    await db.exec(`
      CREATE INDEX IF NOT EXISTS idx_tickets_store_status_created
      ON tickets(storeId, status, createdAt)
    `);

    // Clients indexes
    await db.exec(`
      CREATE INDEX IF NOT EXISTS idx_clients_store
      ON clients(storeId)
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
