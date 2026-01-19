/**
 * Migration v002: Staff and Services Tables
 *
 * Creates tables for staff and services data:
 * - staff: Team members with skills, ratings, and scheduling info
 * - services: Service catalog with pricing and duration
 *
 * All tables include syncStatus for offline sync support.
 */

import type { Migration } from './types';

export const migration_002: Migration = {
  version: 2,
  name: 'staff_services',

  async up(db) {
    console.log('[SQLite] Running migration 2: staff_services');

    // Create staff table
    // Note: skills and schedule are stored as JSON TEXT arrays
    await db.exec(`
      CREATE TABLE IF NOT EXISTS staff (
        id TEXT PRIMARY KEY,
        storeId TEXT NOT NULL,
        name TEXT NOT NULL,
        email TEXT,
        phone TEXT,
        avatar TEXT,
        specialties TEXT,
        specialty TEXT,
        skills TEXT,
        status TEXT NOT NULL,
        isActive INTEGER,
        role TEXT,
        hireDate TEXT,
        commissionRate REAL,
        clockedInAt TEXT,
        currentTicketId TEXT,
        schedule TEXT,
        turnQueuePosition INTEGER,
        servicesCountToday INTEGER DEFAULT 0,
        revenueToday REAL DEFAULT 0,
        tipsToday REAL DEFAULT 0,
        rating REAL,
        vipPreferred INTEGER,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        syncStatus TEXT DEFAULT 'local'
      )
    `);

    // Create services table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS services (
        id TEXT PRIMARY KEY,
        storeId TEXT NOT NULL,
        name TEXT NOT NULL,
        category TEXT,
        description TEXT,
        duration INTEGER NOT NULL,
        price REAL NOT NULL,
        commissionRate REAL,
        isActive INTEGER DEFAULT 1,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        syncStatus TEXT DEFAULT 'local'
      )
    `);

    // Create indexes for common queries
    // Staff indexes
    await db.exec(`
      CREATE INDEX IF NOT EXISTS idx_staff_store
      ON staff(storeId)
    `);

    await db.exec(`
      CREATE INDEX IF NOT EXISTS idx_staff_store_status
      ON staff(storeId, status)
    `);

    // Services indexes
    await db.exec(`
      CREATE INDEX IF NOT EXISTS idx_services_store
      ON services(storeId)
    `);

    await db.exec(`
      CREATE INDEX IF NOT EXISTS idx_services_store_category
      ON services(storeId, category)
    `);

    await db.exec(`
      CREATE INDEX IF NOT EXISTS idx_services_store_active
      ON services(storeId, isActive)
    `);

    console.log('[SQLite] Migration 2 complete: Created staff, services tables');
  },

  async down(db) {
    console.log('[SQLite] Rolling back migration 2: staff_services');

    // Drop tables in reverse order
    await db.exec('DROP TABLE IF EXISTS services');
    await db.exec('DROP TABLE IF EXISTS staff');

    console.log('[SQLite] Migration 2 rollback complete');
  },
};
