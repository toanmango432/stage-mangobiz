/**
 * Migration v006: Catalog Tables
 *
 * Creates SQLite schema for catalog/menu management:
 * - service_categories: Hierarchical category management
 * - menu_services: Enhanced services with variants support
 * - service_variants: Pricing/duration variations
 * - service_packages: Grouped service offerings (bundles)
 * - add_on_groups: Groups of optional add-ons
 * - add_on_options: Individual add-on items within groups
 * - staff_service_assignments: Staff-service capability mapping
 * - catalog_settings: Per-salon catalog configuration
 * - products: Retail and backbar inventory items
 *
 * Reference: Dexie schema v16 (apps/store-app/src/db/schema.ts)
 * Reference: CatalogServices (packages/sqlite-adapter/src/services/catalogServices.ts)
 */

import type { Migration } from './types';

export const migration_006: Migration = {
  version: 6,
  name: 'catalog',

  async up(db) {
    console.log('[SQLite] Running migration 6: catalog');

    // =====================================================
    // SERVICE CATEGORIES TABLE
    // =====================================================
    // Hierarchical category management with parent/child support
    // and online booking configuration
    await db.exec(`
      CREATE TABLE IF NOT EXISTS service_categories (
        id TEXT PRIMARY KEY,
        store_id TEXT NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        color TEXT NOT NULL,
        icon TEXT,
        display_order INTEGER NOT NULL DEFAULT 0,
        is_active INTEGER NOT NULL DEFAULT 1,
        parent_category_id TEXT,
        show_online_booking INTEGER DEFAULT 1,

        -- Audit trail
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        created_by TEXT,
        last_modified_by TEXT,

        -- Sync metadata
        sync_status TEXT NOT NULL DEFAULT 'local'
      )
    `);

    // Service categories indexes
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_service_categories_store ON service_categories(store_id)`);
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_service_categories_store_active ON service_categories(store_id, is_active)`);
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_service_categories_store_order ON service_categories(store_id, display_order)`);
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_service_categories_parent ON service_categories(parent_category_id)`);

    // =====================================================
    // MENU SERVICES TABLE
    // =====================================================
    // Enhanced services with comprehensive pricing, booking,
    // and configuration options
    await db.exec(`
      CREATE TABLE IF NOT EXISTS menu_services (
        id TEXT PRIMARY KEY,
        store_id TEXT NOT NULL,
        category_id TEXT NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        sku TEXT,

        -- Pricing
        pricing_type TEXT NOT NULL DEFAULT 'fixed',
        price REAL NOT NULL DEFAULT 0,
        price_max REAL,
        cost REAL,
        taxable INTEGER NOT NULL DEFAULT 1,

        -- Duration
        duration INTEGER NOT NULL DEFAULT 60,
        extra_time INTEGER,
        extra_time_type TEXT,

        -- Service settings
        aftercare_instructions TEXT,
        requires_patch_test INTEGER DEFAULT 0,
        has_variants INTEGER NOT NULL DEFAULT 0,
        all_staff_can_perform INTEGER NOT NULL DEFAULT 1,

        -- Online booking
        booking_availability TEXT NOT NULL DEFAULT 'both',
        online_booking_enabled INTEGER NOT NULL DEFAULT 1,
        requires_deposit INTEGER NOT NULL DEFAULT 0,
        deposit_amount REAL,
        deposit_percentage REAL,
        online_booking_buffer_minutes INTEGER,
        advance_booking_days_min INTEGER,
        advance_booking_days_max INTEGER,
        rebook_reminder_days INTEGER,

        -- Turn tracking
        turn_weight REAL,

        -- Commission
        commission_rate REAL,

        -- Display
        color TEXT,
        images TEXT,
        tags TEXT,
        status TEXT NOT NULL DEFAULT 'active',
        display_order INTEGER NOT NULL DEFAULT 0,
        show_price_online INTEGER NOT NULL DEFAULT 1,
        allow_custom_duration INTEGER NOT NULL DEFAULT 0,

        -- Audit trail
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        created_by TEXT,
        last_modified_by TEXT,

        -- Sync metadata
        sync_status TEXT NOT NULL DEFAULT 'local'
      )
    `);

    // Menu services indexes
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_menu_services_store ON menu_services(store_id)`);
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_menu_services_store_category ON menu_services(store_id, category_id)`);
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_menu_services_store_status ON menu_services(store_id, status)`);
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_menu_services_category_order ON menu_services(category_id, display_order)`);
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_menu_services_store_order ON menu_services(store_id, display_order)`);

    // =====================================================
    // SERVICE VARIANTS TABLE
    // =====================================================
    // Pricing/duration variations for services
    await db.exec(`
      CREATE TABLE IF NOT EXISTS service_variants (
        id TEXT PRIMARY KEY,
        store_id TEXT NOT NULL,
        service_id TEXT NOT NULL,
        name TEXT NOT NULL,
        duration INTEGER NOT NULL,
        price REAL NOT NULL,
        extra_time INTEGER,
        extra_time_type TEXT,
        is_default INTEGER NOT NULL DEFAULT 0,
        display_order INTEGER NOT NULL DEFAULT 0,
        is_active INTEGER NOT NULL DEFAULT 1,

        -- Timestamps
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,

        -- Sync metadata
        sync_status TEXT NOT NULL DEFAULT 'local'
      )
    `);

    // Service variants indexes
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_service_variants_store ON service_variants(store_id)`);
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_service_variants_service ON service_variants(service_id)`);
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_service_variants_service_active ON service_variants(service_id, is_active)`);
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_service_variants_service_order ON service_variants(service_id, display_order)`);

    // =====================================================
    // SERVICE PACKAGES TABLE
    // =====================================================
    // Grouped service offerings (bundles) with pricing
    await db.exec(`
      CREATE TABLE IF NOT EXISTS service_packages (
        id TEXT PRIMARY KEY,
        store_id TEXT NOT NULL,
        name TEXT NOT NULL,
        description TEXT,

        -- Package contents (JSON array of PackageServiceItem)
        services TEXT NOT NULL,

        -- Pricing
        original_price REAL NOT NULL DEFAULT 0,
        package_price REAL NOT NULL DEFAULT 0,
        discount_type TEXT NOT NULL DEFAULT 'fixed',
        discount_value REAL NOT NULL DEFAULT 0,

        -- Booking mode
        booking_mode TEXT NOT NULL DEFAULT 'single-session',
        validity_days INTEGER,
        usage_limit INTEGER,

        -- Online booking
        booking_availability TEXT NOT NULL DEFAULT 'both',
        online_booking_enabled INTEGER NOT NULL DEFAULT 1,

        -- Restrictions
        restricted_staff_ids TEXT,

        -- Display
        is_active INTEGER NOT NULL DEFAULT 1,
        display_order INTEGER NOT NULL DEFAULT 0,
        color TEXT,
        images TEXT,

        -- Audit trail
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        created_by TEXT,
        last_modified_by TEXT,

        -- Sync metadata
        sync_status TEXT NOT NULL DEFAULT 'local'
      )
    `);

    // Service packages indexes
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_service_packages_store ON service_packages(store_id)`);
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_service_packages_store_active ON service_packages(store_id, is_active)`);
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_service_packages_store_order ON service_packages(store_id, display_order)`);

    // =====================================================
    // ADD-ON GROUPS TABLE
    // =====================================================
    // Groups of optional add-ons with selection rules
    await db.exec(`
      CREATE TABLE IF NOT EXISTS add_on_groups (
        id TEXT PRIMARY KEY,
        store_id TEXT NOT NULL,
        name TEXT NOT NULL,
        description TEXT,

        -- Selection rules
        selection_mode TEXT NOT NULL DEFAULT 'single',
        min_selections INTEGER NOT NULL DEFAULT 0,
        max_selections INTEGER,
        is_required INTEGER NOT NULL DEFAULT 0,

        -- Applicability
        applicable_to_all INTEGER NOT NULL DEFAULT 1,
        applicable_category_ids TEXT NOT NULL DEFAULT '[]',
        applicable_service_ids TEXT NOT NULL DEFAULT '[]',

        -- Display
        is_active INTEGER NOT NULL DEFAULT 1,
        display_order INTEGER NOT NULL DEFAULT 0,
        online_booking_enabled INTEGER NOT NULL DEFAULT 1,

        -- Timestamps
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,

        -- Sync metadata
        sync_status TEXT NOT NULL DEFAULT 'local'
      )
    `);

    // Add-on groups indexes
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_add_on_groups_store ON add_on_groups(store_id)`);
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_add_on_groups_store_active ON add_on_groups(store_id, is_active)`);
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_add_on_groups_store_order ON add_on_groups(store_id, display_order)`);

    // =====================================================
    // ADD-ON OPTIONS TABLE
    // =====================================================
    // Individual add-on items within groups
    await db.exec(`
      CREATE TABLE IF NOT EXISTS add_on_options (
        id TEXT PRIMARY KEY,
        store_id TEXT NOT NULL,
        group_id TEXT NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        price REAL NOT NULL DEFAULT 0,
        duration INTEGER NOT NULL DEFAULT 0,
        is_active INTEGER NOT NULL DEFAULT 1,
        display_order INTEGER NOT NULL DEFAULT 0,

        -- Timestamps
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,

        -- Sync metadata
        sync_status TEXT NOT NULL DEFAULT 'local'
      )
    `);

    // Add-on options indexes
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_add_on_options_store ON add_on_options(store_id)`);
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_add_on_options_group ON add_on_options(group_id)`);
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_add_on_options_group_active ON add_on_options(group_id, is_active)`);
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_add_on_options_group_order ON add_on_options(group_id, display_order)`);

    // =====================================================
    // STAFF SERVICE ASSIGNMENTS TABLE
    // =====================================================
    // Staff-service capability mapping with custom pricing
    await db.exec(`
      CREATE TABLE IF NOT EXISTS staff_service_assignments (
        id TEXT PRIMARY KEY,
        store_id TEXT NOT NULL,
        staff_id TEXT NOT NULL,
        service_id TEXT NOT NULL,
        custom_price REAL,
        custom_duration INTEGER,
        custom_commission_rate REAL,
        is_active INTEGER NOT NULL DEFAULT 1,

        -- Timestamps
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,

        -- Sync metadata
        sync_status TEXT NOT NULL DEFAULT 'local'
      )
    `);

    // Staff service assignments indexes
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_staff_service_assignments_store ON staff_service_assignments(store_id)`);
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_staff_service_assignments_staff ON staff_service_assignments(staff_id)`);
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_staff_service_assignments_service ON staff_service_assignments(service_id)`);
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_staff_service_assignments_store_staff ON staff_service_assignments(store_id, staff_id)`);
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_staff_service_assignments_store_service ON staff_service_assignments(store_id, service_id)`);
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_staff_service_assignments_staff_service ON staff_service_assignments(staff_id, service_id)`);

    // =====================================================
    // CATALOG SETTINGS TABLE
    // =====================================================
    // Per-salon catalog configuration
    await db.exec(`
      CREATE TABLE IF NOT EXISTS catalog_settings (
        id TEXT PRIMARY KEY,
        store_id TEXT NOT NULL UNIQUE,

        -- Default values
        default_duration INTEGER NOT NULL DEFAULT 60,
        default_extra_time INTEGER NOT NULL DEFAULT 0,
        default_extra_time_type TEXT NOT NULL DEFAULT 'processing',
        default_tax_rate REAL NOT NULL DEFAULT 0,

        -- Currency
        currency TEXT NOT NULL DEFAULT 'USD',
        currency_symbol TEXT NOT NULL DEFAULT '$',

        -- Online booking
        show_prices_online INTEGER NOT NULL DEFAULT 1,
        require_deposit_for_online_booking INTEGER NOT NULL DEFAULT 0,
        default_deposit_percentage REAL NOT NULL DEFAULT 0,

        -- Feature toggles
        enable_packages INTEGER NOT NULL DEFAULT 1,
        enable_add_ons INTEGER NOT NULL DEFAULT 1,
        enable_variants INTEGER NOT NULL DEFAULT 1,
        allow_custom_pricing INTEGER NOT NULL DEFAULT 1,
        booking_sequence_enabled INTEGER NOT NULL DEFAULT 0,

        -- Timestamps
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,

        -- Sync metadata
        sync_status TEXT NOT NULL DEFAULT 'local'
      )
    `);

    // Catalog settings indexes
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_catalog_settings_store ON catalog_settings(store_id)`);

    // =====================================================
    // PRODUCTS TABLE
    // =====================================================
    // Retail and backbar inventory items
    await db.exec(`
      CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        store_id TEXT NOT NULL,
        sku TEXT NOT NULL,
        barcode TEXT,
        name TEXT NOT NULL,
        brand TEXT NOT NULL,
        category TEXT NOT NULL,
        description TEXT,

        -- Pricing
        retail_price REAL NOT NULL DEFAULT 0,
        cost_price REAL NOT NULL DEFAULT 0,
        margin REAL NOT NULL DEFAULT 0,

        -- Type flags
        is_retail INTEGER NOT NULL DEFAULT 1,
        is_backbar INTEGER NOT NULL DEFAULT 0,

        -- Inventory
        min_stock_level INTEGER NOT NULL DEFAULT 0,
        reorder_quantity INTEGER,
        supplier_id TEXT,
        supplier_name TEXT,

        -- Display
        image_url TEXT,
        size TEXT,

        -- Backbar specific
        backbar_unit TEXT,
        backbar_uses_per_unit INTEGER,

        -- Status
        is_active INTEGER NOT NULL DEFAULT 1,
        is_tax_exempt INTEGER DEFAULT 0,
        commission_rate REAL,

        -- Timestamps
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,

        -- Sync metadata
        sync_status TEXT NOT NULL DEFAULT 'local'
      )
    `);

    // Products indexes
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_products_store ON products(store_id)`);
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_products_store_active ON products(store_id, is_active)`);
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_products_store_category ON products(store_id, category)`);
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_products_store_retail ON products(store_id, is_retail)`);
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_products_store_backbar ON products(store_id, is_backbar)`);
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_products_store_sku ON products(store_id, sku)`);
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode)`);

    console.log('[SQLite] Migration 6 complete: Catalog tables created');
  },

  async down(db) {
    console.log('[SQLite] Rolling back migration 6: catalog');

    // Drop indexes first
    // Products
    await db.exec('DROP INDEX IF EXISTS idx_products_barcode');
    await db.exec('DROP INDEX IF EXISTS idx_products_store_sku');
    await db.exec('DROP INDEX IF EXISTS idx_products_store_backbar');
    await db.exec('DROP INDEX IF EXISTS idx_products_store_retail');
    await db.exec('DROP INDEX IF EXISTS idx_products_store_category');
    await db.exec('DROP INDEX IF EXISTS idx_products_store_active');
    await db.exec('DROP INDEX IF EXISTS idx_products_store');

    // Catalog settings
    await db.exec('DROP INDEX IF EXISTS idx_catalog_settings_store');

    // Staff service assignments
    await db.exec('DROP INDEX IF EXISTS idx_staff_service_assignments_staff_service');
    await db.exec('DROP INDEX IF EXISTS idx_staff_service_assignments_store_service');
    await db.exec('DROP INDEX IF EXISTS idx_staff_service_assignments_store_staff');
    await db.exec('DROP INDEX IF EXISTS idx_staff_service_assignments_service');
    await db.exec('DROP INDEX IF EXISTS idx_staff_service_assignments_staff');
    await db.exec('DROP INDEX IF EXISTS idx_staff_service_assignments_store');

    // Add-on options
    await db.exec('DROP INDEX IF EXISTS idx_add_on_options_group_order');
    await db.exec('DROP INDEX IF EXISTS idx_add_on_options_group_active');
    await db.exec('DROP INDEX IF EXISTS idx_add_on_options_group');
    await db.exec('DROP INDEX IF EXISTS idx_add_on_options_store');

    // Add-on groups
    await db.exec('DROP INDEX IF EXISTS idx_add_on_groups_store_order');
    await db.exec('DROP INDEX IF EXISTS idx_add_on_groups_store_active');
    await db.exec('DROP INDEX IF EXISTS idx_add_on_groups_store');

    // Service packages
    await db.exec('DROP INDEX IF EXISTS idx_service_packages_store_order');
    await db.exec('DROP INDEX IF EXISTS idx_service_packages_store_active');
    await db.exec('DROP INDEX IF EXISTS idx_service_packages_store');

    // Service variants
    await db.exec('DROP INDEX IF EXISTS idx_service_variants_service_order');
    await db.exec('DROP INDEX IF EXISTS idx_service_variants_service_active');
    await db.exec('DROP INDEX IF EXISTS idx_service_variants_service');
    await db.exec('DROP INDEX IF EXISTS idx_service_variants_store');

    // Menu services
    await db.exec('DROP INDEX IF EXISTS idx_menu_services_store_order');
    await db.exec('DROP INDEX IF EXISTS idx_menu_services_category_order');
    await db.exec('DROP INDEX IF EXISTS idx_menu_services_store_status');
    await db.exec('DROP INDEX IF EXISTS idx_menu_services_store_category');
    await db.exec('DROP INDEX IF EXISTS idx_menu_services_store');

    // Service categories
    await db.exec('DROP INDEX IF EXISTS idx_service_categories_parent');
    await db.exec('DROP INDEX IF EXISTS idx_service_categories_store_order');
    await db.exec('DROP INDEX IF EXISTS idx_service_categories_store_active');
    await db.exec('DROP INDEX IF EXISTS idx_service_categories_store');

    // Drop tables
    await db.exec('DROP TABLE IF EXISTS products');
    await db.exec('DROP TABLE IF EXISTS catalog_settings');
    await db.exec('DROP TABLE IF EXISTS staff_service_assignments');
    await db.exec('DROP TABLE IF EXISTS add_on_options');
    await db.exec('DROP TABLE IF EXISTS add_on_groups');
    await db.exec('DROP TABLE IF EXISTS service_packages');
    await db.exec('DROP TABLE IF EXISTS service_variants');
    await db.exec('DROP TABLE IF EXISTS menu_services');
    await db.exec('DROP TABLE IF EXISTS service_categories');

    console.log('[SQLite] Migration 6 rollback complete: Catalog tables dropped');
  },
};
