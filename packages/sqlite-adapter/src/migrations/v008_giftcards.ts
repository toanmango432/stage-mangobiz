/**
 * Migration v008: Gift Card Tables
 *
 * Creates SQLite schema for gift card functionality:
 * - gift_card_denominations: Preset gift card amounts for quick sale
 * - gift_card_settings: Per-store gift card configuration
 * - gift_cards: Gift card entities with balance tracking
 * - gift_card_transactions: Transaction history for gift cards
 * - gift_card_designs: Design templates for gift cards
 *
 * Reference: Dexie schema v16 (apps/store-app/src/db/schema.ts)
 * Reference: GiftCardServices (packages/sqlite-adapter/src/services/giftCardServices.ts)
 */

import type { Migration } from './types';

export const migration_008: Migration = {
  version: 8,
  name: 'giftcards',

  async up(db) {
    console.log('[SQLite] Running migration 8: giftcards');

    // =====================================================
    // GIFT CARD DENOMINATIONS TABLE
    // =====================================================
    // Preset gift card amounts for quick sale during checkout
    await db.exec(`
      CREATE TABLE IF NOT EXISTS gift_card_denominations (
        id TEXT PRIMARY KEY,
        store_id TEXT NOT NULL,

        -- Denomination value
        amount REAL NOT NULL,
        label TEXT,

        -- Status
        is_active INTEGER NOT NULL DEFAULT 1,

        -- Display
        display_order INTEGER NOT NULL DEFAULT 0,

        -- Timestamps
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,

        -- Sync
        sync_status TEXT NOT NULL DEFAULT 'local'
      )
    `);

    // Gift card denominations indexes
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_gift_card_denominations_store ON gift_card_denominations(store_id)`);
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_gift_card_denominations_store_active ON gift_card_denominations(store_id, is_active)`);
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_gift_card_denominations_store_order ON gift_card_denominations(store_id, display_order)`);

    // =====================================================
    // GIFT CARD SETTINGS TABLE
    // =====================================================
    // Per-store gift card configuration
    await db.exec(`
      CREATE TABLE IF NOT EXISTS gift_card_settings (
        id TEXT PRIMARY KEY,
        store_id TEXT NOT NULL UNIQUE,

        -- Amount settings
        allow_custom_amount INTEGER NOT NULL DEFAULT 1,
        min_amount REAL NOT NULL DEFAULT 10,
        max_amount REAL NOT NULL DEFAULT 500,

        -- Expiration
        default_expiration_days INTEGER,

        -- Features
        online_enabled INTEGER NOT NULL DEFAULT 0,
        email_delivery_enabled INTEGER NOT NULL DEFAULT 0,

        -- Timestamps
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,

        -- Sync
        sync_status TEXT NOT NULL DEFAULT 'local'
      )
    `);

    // Gift card settings indexes
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_gift_card_settings_store ON gift_card_settings(store_id)`);

    // =====================================================
    // GIFT CARDS TABLE
    // =====================================================
    // Gift card entities with balance tracking and redemption
    await db.exec(`
      CREATE TABLE IF NOT EXISTS gift_cards (
        id TEXT PRIMARY KEY,
        store_id TEXT NOT NULL,

        -- Unique redemption code
        code TEXT NOT NULL,

        -- Card type
        type TEXT NOT NULL DEFAULT 'physical',

        -- Balance tracking
        original_amount REAL NOT NULL,
        current_balance REAL NOT NULL,

        -- Purchaser info
        purchaser_id TEXT,
        purchaser_name TEXT,

        -- Recipient info
        recipient_name TEXT,
        recipient_email TEXT,
        recipient_phone TEXT,
        message TEXT,

        -- Design
        design_id TEXT,

        -- Dates
        issued_at TEXT NOT NULL,
        expires_at TEXT,
        last_used_at TEXT,

        -- Status
        status TEXT NOT NULL DEFAULT 'active',

        -- Purchase link
        purchase_ticket_id TEXT,

        -- Digital delivery
        delivery_method TEXT,
        scheduled_delivery_at TEXT,
        delivered_at TEXT,

        -- Features
        is_reloadable INTEGER DEFAULT 0,

        -- Timestamps
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,

        -- Sync
        sync_status TEXT NOT NULL DEFAULT 'local'
      )
    `);

    // Gift cards indexes - code must be unique across entire table
    await db.exec(`CREATE UNIQUE INDEX IF NOT EXISTS idx_gift_cards_code ON gift_cards(code)`);
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_gift_cards_store ON gift_cards(store_id)`);
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_gift_cards_store_status ON gift_cards(store_id, status)`);
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_gift_cards_store_created ON gift_cards(store_id, created_at)`);
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_gift_cards_purchaser ON gift_cards(purchaser_id)`);
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_gift_cards_store_expires ON gift_cards(store_id, expires_at)`);
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_gift_cards_store_delivered ON gift_cards(store_id, delivered_at)`);

    // =====================================================
    // GIFT CARD TRANSACTIONS TABLE
    // =====================================================
    // Transaction history for gift cards (purchase, redeem, reload, void, refund)
    await db.exec(`
      CREATE TABLE IF NOT EXISTS gift_card_transactions (
        id TEXT PRIMARY KEY,
        store_id TEXT NOT NULL,

        -- Gift card link
        gift_card_id TEXT NOT NULL,

        -- Transaction info
        type TEXT NOT NULL,
        amount REAL NOT NULL,
        balance_after REAL NOT NULL,

        -- Ticket link (for redemption/purchase)
        ticket_id TEXT,

        -- Staff info
        staff_id TEXT,
        staff_name TEXT,

        -- Notes
        notes TEXT,

        -- Timestamps
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,

        -- Sync
        sync_status TEXT NOT NULL DEFAULT 'local'
      )
    `);

    // Gift card transactions indexes
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_gift_card_transactions_store ON gift_card_transactions(store_id)`);
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_gift_card_transactions_card ON gift_card_transactions(gift_card_id)`);
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_gift_card_transactions_ticket ON gift_card_transactions(ticket_id)`);
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_gift_card_transactions_store_created ON gift_card_transactions(store_id, created_at)`);
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_gift_card_transactions_store_type ON gift_card_transactions(store_id, type)`);
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_gift_card_transactions_card_created ON gift_card_transactions(gift_card_id, created_at)`);

    // =====================================================
    // GIFT CARD DESIGNS TABLE
    // =====================================================
    // Design templates for gift cards
    await db.exec(`
      CREATE TABLE IF NOT EXISTS gift_card_designs (
        id TEXT PRIMARY KEY,
        store_id TEXT NOT NULL,

        -- Design info
        name TEXT NOT NULL,
        description TEXT,
        image_url TEXT NOT NULL,
        thumbnail_url TEXT,

        -- Category
        category TEXT NOT NULL DEFAULT 'general',

        -- Status
        is_active INTEGER NOT NULL DEFAULT 1,
        is_default INTEGER DEFAULT 0,

        -- Styling
        background_color TEXT,
        text_color TEXT,

        -- Display
        display_order INTEGER NOT NULL DEFAULT 0,

        -- Timestamps
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,

        -- Sync
        sync_status TEXT NOT NULL DEFAULT 'local'
      )
    `);

    // Gift card designs indexes
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_gift_card_designs_store ON gift_card_designs(store_id)`);
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_gift_card_designs_store_active ON gift_card_designs(store_id, is_active)`);
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_gift_card_designs_store_category ON gift_card_designs(store_id, category)`);
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_gift_card_designs_store_default ON gift_card_designs(store_id, is_default)`);
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_gift_card_designs_store_order ON gift_card_designs(store_id, display_order)`);

    console.log('[SQLite] Migration 8 complete: Gift card tables created');
  },

  async down(db) {
    console.log('[SQLite] Rolling back migration 8: giftcards');

    // Drop indexes first
    // Gift card designs
    await db.exec('DROP INDEX IF EXISTS idx_gift_card_designs_store_order');
    await db.exec('DROP INDEX IF EXISTS idx_gift_card_designs_store_default');
    await db.exec('DROP INDEX IF EXISTS idx_gift_card_designs_store_category');
    await db.exec('DROP INDEX IF EXISTS idx_gift_card_designs_store_active');
    await db.exec('DROP INDEX IF EXISTS idx_gift_card_designs_store');

    // Gift card transactions
    await db.exec('DROP INDEX IF EXISTS idx_gift_card_transactions_card_created');
    await db.exec('DROP INDEX IF EXISTS idx_gift_card_transactions_store_type');
    await db.exec('DROP INDEX IF EXISTS idx_gift_card_transactions_store_created');
    await db.exec('DROP INDEX IF EXISTS idx_gift_card_transactions_ticket');
    await db.exec('DROP INDEX IF EXISTS idx_gift_card_transactions_card');
    await db.exec('DROP INDEX IF EXISTS idx_gift_card_transactions_store');

    // Gift cards
    await db.exec('DROP INDEX IF EXISTS idx_gift_cards_store_delivered');
    await db.exec('DROP INDEX IF EXISTS idx_gift_cards_store_expires');
    await db.exec('DROP INDEX IF EXISTS idx_gift_cards_purchaser');
    await db.exec('DROP INDEX IF EXISTS idx_gift_cards_store_created');
    await db.exec('DROP INDEX IF EXISTS idx_gift_cards_store_status');
    await db.exec('DROP INDEX IF EXISTS idx_gift_cards_store');
    await db.exec('DROP INDEX IF EXISTS idx_gift_cards_code');

    // Gift card settings
    await db.exec('DROP INDEX IF EXISTS idx_gift_card_settings_store');

    // Gift card denominations
    await db.exec('DROP INDEX IF EXISTS idx_gift_card_denominations_store_order');
    await db.exec('DROP INDEX IF EXISTS idx_gift_card_denominations_store_active');
    await db.exec('DROP INDEX IF EXISTS idx_gift_card_denominations_store');

    // Drop tables
    await db.exec('DROP TABLE IF EXISTS gift_card_designs');
    await db.exec('DROP TABLE IF EXISTS gift_card_transactions');
    await db.exec('DROP TABLE IF EXISTS gift_cards');
    await db.exec('DROP TABLE IF EXISTS gift_card_settings');
    await db.exec('DROP TABLE IF EXISTS gift_card_denominations');

    console.log('[SQLite] Migration 8 rollback complete: Gift card tables dropped');
  },
};
