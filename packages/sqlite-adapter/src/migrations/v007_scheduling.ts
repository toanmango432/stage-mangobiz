/**
 * Migration v007: Scheduling Tables
 *
 * Creates SQLite schema for scheduling management:
 * - time_off_types: Time-off type configurations (vacation, sick, etc.)
 * - time_off_requests: Staff time-off requests with approval workflow
 * - blocked_time_types: Categories for blocked time (break, meeting, etc.)
 * - blocked_time_entries: Individual blocked time slots with series support
 * - business_closed_periods: Business closure periods (holidays, etc.)
 * - resources: Bookable resources (rooms, equipment)
 * - resource_bookings: Resource-appointment links
 * - staff_schedules: Staff working patterns with effective dates
 *
 * Reference: Dexie schema v16 (apps/store-app/src/db/schema.ts)
 * Reference: SchedulingServices (packages/sqlite-adapter/src/services/schedulingServices.ts)
 */

import type { Migration } from './types';

export const migration_007: Migration = {
  version: 7,
  name: 'scheduling',

  async up(db) {
    console.log('[SQLite] Running migration 7: scheduling');

    // =====================================================
    // TIME OFF TYPES TABLE
    // =====================================================
    // Configuration for different types of time off (vacation, sick, etc.)
    await db.exec(`
      CREATE TABLE IF NOT EXISTS time_off_types (
        id TEXT PRIMARY KEY,
        tenant_id TEXT NOT NULL,
        store_id TEXT NOT NULL,
        location_id TEXT,

        -- Type definition
        name TEXT NOT NULL,
        code TEXT NOT NULL,
        emoji TEXT NOT NULL,
        color TEXT NOT NULL,

        -- Configuration
        is_paid INTEGER NOT NULL DEFAULT 0,
        requires_approval INTEGER NOT NULL DEFAULT 1,
        annual_limit_days INTEGER,
        accrual_enabled INTEGER NOT NULL DEFAULT 0,
        accrual_rate_per_month REAL,
        carry_over_enabled INTEGER NOT NULL DEFAULT 0,
        max_carry_over_days INTEGER,

        -- Display
        display_order INTEGER NOT NULL DEFAULT 0,
        is_active INTEGER NOT NULL DEFAULT 1,
        is_system_default INTEGER NOT NULL DEFAULT 0,

        -- Sync metadata
        sync_status TEXT NOT NULL DEFAULT 'local',
        version INTEGER NOT NULL DEFAULT 1,
        vector_clock TEXT NOT NULL DEFAULT '{}',
        last_synced_version INTEGER NOT NULL DEFAULT 0,

        -- Audit trail
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        created_by TEXT NOT NULL,
        created_by_device TEXT NOT NULL,
        last_modified_by TEXT NOT NULL,
        last_modified_by_device TEXT NOT NULL,

        -- Soft delete
        is_deleted INTEGER NOT NULL DEFAULT 0,
        deleted_at TEXT,
        deleted_by TEXT,
        deleted_by_device TEXT,
        tombstone_expires_at TEXT
      )
    `);

    // Time off types indexes
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_time_off_types_store ON time_off_types(store_id)`);
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_time_off_types_store_active ON time_off_types(store_id, is_active)`);
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_time_off_types_store_code ON time_off_types(store_id, code)`);
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_time_off_types_store_order ON time_off_types(store_id, display_order)`);
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_time_off_types_store_deleted ON time_off_types(store_id, is_deleted)`);

    // =====================================================
    // TIME OFF REQUESTS TABLE
    // =====================================================
    // Staff time-off requests with approval workflow
    await db.exec(`
      CREATE TABLE IF NOT EXISTS time_off_requests (
        id TEXT PRIMARY KEY,
        tenant_id TEXT NOT NULL,
        store_id TEXT NOT NULL,
        location_id TEXT,

        -- Staff info
        staff_id TEXT NOT NULL,
        staff_name TEXT NOT NULL,

        -- Type info (denormalized for performance)
        type_id TEXT NOT NULL,
        type_name TEXT NOT NULL,
        type_emoji TEXT NOT NULL,
        type_color TEXT NOT NULL,
        is_paid INTEGER NOT NULL DEFAULT 0,

        -- Request period
        start_date TEXT NOT NULL,
        end_date TEXT NOT NULL,
        is_all_day INTEGER NOT NULL DEFAULT 1,
        start_time TEXT,
        end_time TEXT,
        total_hours REAL NOT NULL DEFAULT 0,
        total_days REAL NOT NULL DEFAULT 0,

        -- Status
        status TEXT NOT NULL DEFAULT 'pending',
        status_history TEXT NOT NULL DEFAULT '[]',
        notes TEXT,

        -- Approval
        approved_by TEXT,
        approved_by_name TEXT,
        approved_at TEXT,
        approval_notes TEXT,

        -- Denial
        denied_by TEXT,
        denied_by_name TEXT,
        denied_at TEXT,
        denial_reason TEXT,

        -- Cancellation
        cancelled_at TEXT,
        cancelled_by TEXT,
        cancellation_reason TEXT,

        -- Conflict tracking
        has_conflicts INTEGER NOT NULL DEFAULT 0,
        conflicting_appointment_ids TEXT NOT NULL DEFAULT '[]',

        -- Sync metadata
        sync_status TEXT NOT NULL DEFAULT 'local',
        version INTEGER NOT NULL DEFAULT 1,
        vector_clock TEXT NOT NULL DEFAULT '{}',
        last_synced_version INTEGER NOT NULL DEFAULT 0,

        -- Audit trail
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        created_by TEXT NOT NULL,
        created_by_device TEXT NOT NULL,
        last_modified_by TEXT NOT NULL,
        last_modified_by_device TEXT NOT NULL,

        -- Soft delete
        is_deleted INTEGER NOT NULL DEFAULT 0,
        deleted_at TEXT,
        deleted_by TEXT,
        deleted_by_device TEXT,
        tombstone_expires_at TEXT
      )
    `);

    // Time off requests indexes
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_time_off_requests_store ON time_off_requests(store_id)`);
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_time_off_requests_staff ON time_off_requests(staff_id)`);
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_time_off_requests_store_status ON time_off_requests(store_id, status)`);
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_time_off_requests_store_start ON time_off_requests(store_id, start_date)`);
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_time_off_requests_store_end ON time_off_requests(store_id, end_date)`);
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_time_off_requests_staff_date ON time_off_requests(staff_id, start_date)`);
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_time_off_requests_store_deleted ON time_off_requests(store_id, is_deleted)`);

    // =====================================================
    // BLOCKED TIME TYPES TABLE
    // =====================================================
    // Categories for blocked time (break, meeting, training, etc.)
    await db.exec(`
      CREATE TABLE IF NOT EXISTS blocked_time_types (
        id TEXT PRIMARY KEY,
        tenant_id TEXT NOT NULL,
        store_id TEXT NOT NULL,
        location_id TEXT,

        -- Type definition
        name TEXT NOT NULL,
        code TEXT NOT NULL,
        description TEXT,
        emoji TEXT NOT NULL,
        color TEXT NOT NULL,
        default_duration_minutes INTEGER NOT NULL DEFAULT 30,

        -- Configuration
        is_paid INTEGER NOT NULL DEFAULT 0,
        blocks_online_booking INTEGER NOT NULL DEFAULT 1,
        blocks_in_store_booking INTEGER NOT NULL DEFAULT 1,
        requires_approval INTEGER NOT NULL DEFAULT 0,

        -- Display
        display_order INTEGER NOT NULL DEFAULT 0,
        is_active INTEGER NOT NULL DEFAULT 1,
        is_system_default INTEGER NOT NULL DEFAULT 0,

        -- Sync metadata
        sync_status TEXT NOT NULL DEFAULT 'local',
        version INTEGER NOT NULL DEFAULT 1,
        vector_clock TEXT NOT NULL DEFAULT '{}',
        last_synced_version INTEGER NOT NULL DEFAULT 0,

        -- Audit trail
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        created_by TEXT NOT NULL,
        created_by_device TEXT NOT NULL,
        last_modified_by TEXT NOT NULL,
        last_modified_by_device TEXT NOT NULL,

        -- Soft delete
        is_deleted INTEGER NOT NULL DEFAULT 0,
        deleted_at TEXT,
        deleted_by TEXT,
        deleted_by_device TEXT,
        tombstone_expires_at TEXT
      )
    `);

    // Blocked time types indexes
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_blocked_time_types_store ON blocked_time_types(store_id)`);
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_blocked_time_types_store_active ON blocked_time_types(store_id, is_active)`);
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_blocked_time_types_store_order ON blocked_time_types(store_id, display_order)`);
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_blocked_time_types_store_deleted ON blocked_time_types(store_id, is_deleted)`);

    // =====================================================
    // BLOCKED TIME ENTRIES TABLE
    // =====================================================
    // Individual blocked time slots with series support for recurring
    await db.exec(`
      CREATE TABLE IF NOT EXISTS blocked_time_entries (
        id TEXT PRIMARY KEY,
        tenant_id TEXT NOT NULL,
        store_id TEXT NOT NULL,
        location_id TEXT,

        -- Staff info
        staff_id TEXT NOT NULL,
        staff_name TEXT NOT NULL,

        -- Type info (denormalized for performance)
        type_id TEXT NOT NULL,
        type_name TEXT NOT NULL,
        type_emoji TEXT NOT NULL,
        type_color TEXT NOT NULL,
        is_paid INTEGER NOT NULL DEFAULT 0,

        -- Time range
        start_date_time TEXT NOT NULL,
        end_date_time TEXT NOT NULL,
        duration_minutes INTEGER NOT NULL,

        -- Recurrence
        frequency TEXT NOT NULL DEFAULT 'once',
        repeat_end_date TEXT,
        repeat_count INTEGER,
        series_id TEXT,
        is_recurrence_exception INTEGER NOT NULL DEFAULT 0,
        original_date TEXT,

        -- Additional info
        notes TEXT,
        created_by_staff_id TEXT,
        created_by_manager_id TEXT,

        -- Sync metadata
        sync_status TEXT NOT NULL DEFAULT 'local',
        version INTEGER NOT NULL DEFAULT 1,
        vector_clock TEXT NOT NULL DEFAULT '{}',
        last_synced_version INTEGER NOT NULL DEFAULT 0,

        -- Audit trail
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        created_by TEXT NOT NULL,
        created_by_device TEXT NOT NULL,
        last_modified_by TEXT NOT NULL,
        last_modified_by_device TEXT NOT NULL,

        -- Soft delete
        is_deleted INTEGER NOT NULL DEFAULT 0,
        deleted_at TEXT,
        deleted_by TEXT,
        deleted_by_device TEXT,
        tombstone_expires_at TEXT
      )
    `);

    // Blocked time entries indexes
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_blocked_time_entries_store ON blocked_time_entries(store_id)`);
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_blocked_time_entries_staff ON blocked_time_entries(staff_id)`);
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_blocked_time_entries_series ON blocked_time_entries(series_id)`);
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_blocked_time_entries_store_start ON blocked_time_entries(store_id, start_date_time)`);
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_blocked_time_entries_store_end ON blocked_time_entries(store_id, end_date_time)`);
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_blocked_time_entries_staff_start ON blocked_time_entries(staff_id, start_date_time)`);
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_blocked_time_entries_store_deleted ON blocked_time_entries(store_id, is_deleted)`);

    // =====================================================
    // BUSINESS CLOSED PERIODS TABLE
    // =====================================================
    // Business closure periods (holidays, maintenance, etc.)
    await db.exec(`
      CREATE TABLE IF NOT EXISTS business_closed_periods (
        id TEXT PRIMARY KEY,
        tenant_id TEXT NOT NULL,
        store_id TEXT NOT NULL,
        location_id TEXT,

        -- Period definition
        name TEXT NOT NULL,
        applies_to_all_locations INTEGER NOT NULL DEFAULT 1,
        location_ids TEXT NOT NULL DEFAULT '[]',

        -- Date/time range
        start_date TEXT NOT NULL,
        end_date TEXT NOT NULL,
        is_partial_day INTEGER NOT NULL DEFAULT 0,
        start_time TEXT,
        end_time TEXT,

        -- Booking behavior
        blocks_online_booking INTEGER NOT NULL DEFAULT 1,
        blocks_in_store_booking INTEGER NOT NULL DEFAULT 1,

        -- Display
        color TEXT NOT NULL,
        notes TEXT,
        is_annual INTEGER NOT NULL DEFAULT 0,

        -- Sync metadata
        sync_status TEXT NOT NULL DEFAULT 'local',
        version INTEGER NOT NULL DEFAULT 1,
        vector_clock TEXT NOT NULL DEFAULT '{}',
        last_synced_version INTEGER NOT NULL DEFAULT 0,

        -- Audit trail
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        created_by TEXT NOT NULL,
        created_by_device TEXT NOT NULL,
        last_modified_by TEXT NOT NULL,
        last_modified_by_device TEXT NOT NULL,

        -- Soft delete
        is_deleted INTEGER NOT NULL DEFAULT 0,
        deleted_at TEXT,
        deleted_by TEXT,
        deleted_by_device TEXT,
        tombstone_expires_at TEXT
      )
    `);

    // Business closed periods indexes
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_business_closed_periods_store ON business_closed_periods(store_id)`);
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_business_closed_periods_store_start ON business_closed_periods(store_id, start_date)`);
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_business_closed_periods_store_end ON business_closed_periods(store_id, end_date)`);
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_business_closed_periods_store_annual ON business_closed_periods(store_id, is_annual)`);
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_business_closed_periods_store_deleted ON business_closed_periods(store_id, is_deleted)`);

    // =====================================================
    // RESOURCES TABLE
    // =====================================================
    // Bookable resources (rooms, equipment, stations)
    await db.exec(`
      CREATE TABLE IF NOT EXISTS resources (
        id TEXT PRIMARY KEY,
        tenant_id TEXT NOT NULL,
        store_id TEXT NOT NULL,
        location_id TEXT,

        -- Resource definition
        name TEXT NOT NULL,
        description TEXT,
        category TEXT NOT NULL,
        capacity INTEGER NOT NULL DEFAULT 1,

        -- Booking settings
        is_bookable INTEGER NOT NULL DEFAULT 1,

        -- Display
        color TEXT NOT NULL,
        image_url TEXT,
        display_order INTEGER NOT NULL DEFAULT 0,
        is_active INTEGER NOT NULL DEFAULT 1,

        -- Service associations
        linked_service_ids TEXT NOT NULL DEFAULT '[]',

        -- Sync metadata
        sync_status TEXT NOT NULL DEFAULT 'local',
        version INTEGER NOT NULL DEFAULT 1,
        vector_clock TEXT NOT NULL DEFAULT '{}',
        last_synced_version INTEGER NOT NULL DEFAULT 0,

        -- Audit trail
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        created_by TEXT NOT NULL,
        created_by_device TEXT NOT NULL,
        last_modified_by TEXT NOT NULL,
        last_modified_by_device TEXT NOT NULL,

        -- Soft delete
        is_deleted INTEGER NOT NULL DEFAULT 0,
        deleted_at TEXT,
        deleted_by TEXT,
        deleted_by_device TEXT,
        tombstone_expires_at TEXT
      )
    `);

    // Resources indexes
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_resources_store ON resources(store_id)`);
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_resources_store_active ON resources(store_id, is_active)`);
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_resources_store_category ON resources(store_id, category)`);
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_resources_store_bookable ON resources(store_id, is_bookable)`);
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_resources_store_order ON resources(store_id, display_order)`);
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_resources_store_deleted ON resources(store_id, is_deleted)`);

    // =====================================================
    // RESOURCE BOOKINGS TABLE
    // =====================================================
    // Resource-appointment links for scheduling
    await db.exec(`
      CREATE TABLE IF NOT EXISTS resource_bookings (
        id TEXT PRIMARY KEY,
        tenant_id TEXT NOT NULL,
        store_id TEXT NOT NULL,
        location_id TEXT,

        -- Resource info
        resource_id TEXT NOT NULL,
        resource_name TEXT NOT NULL,

        -- Appointment link
        appointment_id TEXT NOT NULL,

        -- Time range
        start_date_time TEXT NOT NULL,
        end_date_time TEXT NOT NULL,

        -- Staff info
        staff_id TEXT NOT NULL,
        staff_name TEXT NOT NULL,

        -- Assignment
        assignment_type TEXT NOT NULL DEFAULT 'auto',
        assigned_by TEXT,

        -- Sync metadata
        sync_status TEXT NOT NULL DEFAULT 'local',
        version INTEGER NOT NULL DEFAULT 1,
        vector_clock TEXT NOT NULL DEFAULT '{}',
        last_synced_version INTEGER NOT NULL DEFAULT 0,

        -- Audit trail
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        created_by TEXT NOT NULL,
        created_by_device TEXT NOT NULL,
        last_modified_by TEXT NOT NULL,
        last_modified_by_device TEXT NOT NULL,

        -- Soft delete
        is_deleted INTEGER NOT NULL DEFAULT 0,
        deleted_at TEXT,
        deleted_by TEXT,
        deleted_by_device TEXT,
        tombstone_expires_at TEXT
      )
    `);

    // Resource bookings indexes
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_resource_bookings_store ON resource_bookings(store_id)`);
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_resource_bookings_resource ON resource_bookings(resource_id)`);
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_resource_bookings_appointment ON resource_bookings(appointment_id)`);
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_resource_bookings_resource_start ON resource_bookings(resource_id, start_date_time)`);
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_resource_bookings_store_start ON resource_bookings(store_id, start_date_time)`);
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_resource_bookings_store_end ON resource_bookings(store_id, end_date_time)`);
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_resource_bookings_store_deleted ON resource_bookings(store_id, is_deleted)`);

    // =====================================================
    // STAFF SCHEDULES TABLE
    // =====================================================
    // Staff working patterns with effective dates
    await db.exec(`
      CREATE TABLE IF NOT EXISTS staff_schedules (
        id TEXT PRIMARY KEY,
        tenant_id TEXT NOT NULL,
        store_id TEXT NOT NULL,
        location_id TEXT,

        -- Staff info
        staff_id TEXT NOT NULL,
        staff_name TEXT NOT NULL,

        -- Schedule pattern
        pattern_type TEXT NOT NULL DEFAULT 'fixed',
        pattern_weeks INTEGER NOT NULL DEFAULT 1,
        weeks TEXT NOT NULL DEFAULT '[]',

        -- Effective period
        effective_from TEXT NOT NULL,
        effective_until TEXT,
        pattern_anchor_date TEXT NOT NULL,

        -- Flags
        is_default INTEGER NOT NULL DEFAULT 0,
        copied_from_schedule_id TEXT,

        -- Sync metadata
        sync_status TEXT NOT NULL DEFAULT 'local',
        version INTEGER NOT NULL DEFAULT 1,
        vector_clock TEXT NOT NULL DEFAULT '{}',
        last_synced_version INTEGER NOT NULL DEFAULT 0,

        -- Audit trail
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        created_by TEXT NOT NULL,
        created_by_device TEXT NOT NULL,
        last_modified_by TEXT NOT NULL,
        last_modified_by_device TEXT NOT NULL,

        -- Soft delete
        is_deleted INTEGER NOT NULL DEFAULT 0,
        deleted_at TEXT,
        deleted_by TEXT,
        deleted_by_device TEXT,
        tombstone_expires_at TEXT
      )
    `);

    // Staff schedules indexes
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_staff_schedules_store ON staff_schedules(store_id)`);
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_staff_schedules_staff ON staff_schedules(staff_id)`);
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_staff_schedules_staff_effective ON staff_schedules(staff_id, effective_from)`);
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_staff_schedules_store_effective ON staff_schedules(store_id, effective_from)`);
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_staff_schedules_store_default ON staff_schedules(store_id, is_default)`);
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_staff_schedules_store_deleted ON staff_schedules(store_id, is_deleted)`);

    console.log('[SQLite] Migration 7 complete: Scheduling tables created');
  },

  async down(db) {
    console.log('[SQLite] Rolling back migration 7: scheduling');

    // Drop indexes first
    // Staff schedules
    await db.exec('DROP INDEX IF EXISTS idx_staff_schedules_store_deleted');
    await db.exec('DROP INDEX IF EXISTS idx_staff_schedules_store_default');
    await db.exec('DROP INDEX IF EXISTS idx_staff_schedules_store_effective');
    await db.exec('DROP INDEX IF EXISTS idx_staff_schedules_staff_effective');
    await db.exec('DROP INDEX IF EXISTS idx_staff_schedules_staff');
    await db.exec('DROP INDEX IF EXISTS idx_staff_schedules_store');

    // Resource bookings
    await db.exec('DROP INDEX IF EXISTS idx_resource_bookings_store_deleted');
    await db.exec('DROP INDEX IF EXISTS idx_resource_bookings_store_end');
    await db.exec('DROP INDEX IF EXISTS idx_resource_bookings_store_start');
    await db.exec('DROP INDEX IF EXISTS idx_resource_bookings_resource_start');
    await db.exec('DROP INDEX IF EXISTS idx_resource_bookings_appointment');
    await db.exec('DROP INDEX IF EXISTS idx_resource_bookings_resource');
    await db.exec('DROP INDEX IF EXISTS idx_resource_bookings_store');

    // Resources
    await db.exec('DROP INDEX IF EXISTS idx_resources_store_deleted');
    await db.exec('DROP INDEX IF EXISTS idx_resources_store_order');
    await db.exec('DROP INDEX IF EXISTS idx_resources_store_bookable');
    await db.exec('DROP INDEX IF EXISTS idx_resources_store_category');
    await db.exec('DROP INDEX IF EXISTS idx_resources_store_active');
    await db.exec('DROP INDEX IF EXISTS idx_resources_store');

    // Business closed periods
    await db.exec('DROP INDEX IF EXISTS idx_business_closed_periods_store_deleted');
    await db.exec('DROP INDEX IF EXISTS idx_business_closed_periods_store_annual');
    await db.exec('DROP INDEX IF EXISTS idx_business_closed_periods_store_end');
    await db.exec('DROP INDEX IF EXISTS idx_business_closed_periods_store_start');
    await db.exec('DROP INDEX IF EXISTS idx_business_closed_periods_store');

    // Blocked time entries
    await db.exec('DROP INDEX IF EXISTS idx_blocked_time_entries_store_deleted');
    await db.exec('DROP INDEX IF EXISTS idx_blocked_time_entries_staff_start');
    await db.exec('DROP INDEX IF EXISTS idx_blocked_time_entries_store_end');
    await db.exec('DROP INDEX IF EXISTS idx_blocked_time_entries_store_start');
    await db.exec('DROP INDEX IF EXISTS idx_blocked_time_entries_series');
    await db.exec('DROP INDEX IF EXISTS idx_blocked_time_entries_staff');
    await db.exec('DROP INDEX IF EXISTS idx_blocked_time_entries_store');

    // Blocked time types
    await db.exec('DROP INDEX IF EXISTS idx_blocked_time_types_store_deleted');
    await db.exec('DROP INDEX IF EXISTS idx_blocked_time_types_store_order');
    await db.exec('DROP INDEX IF EXISTS idx_blocked_time_types_store_active');
    await db.exec('DROP INDEX IF EXISTS idx_blocked_time_types_store');

    // Time off requests
    await db.exec('DROP INDEX IF EXISTS idx_time_off_requests_store_deleted');
    await db.exec('DROP INDEX IF EXISTS idx_time_off_requests_staff_date');
    await db.exec('DROP INDEX IF EXISTS idx_time_off_requests_store_end');
    await db.exec('DROP INDEX IF EXISTS idx_time_off_requests_store_start');
    await db.exec('DROP INDEX IF EXISTS idx_time_off_requests_store_status');
    await db.exec('DROP INDEX IF EXISTS idx_time_off_requests_staff');
    await db.exec('DROP INDEX IF EXISTS idx_time_off_requests_store');

    // Time off types
    await db.exec('DROP INDEX IF EXISTS idx_time_off_types_store_deleted');
    await db.exec('DROP INDEX IF EXISTS idx_time_off_types_store_order');
    await db.exec('DROP INDEX IF EXISTS idx_time_off_types_store_code');
    await db.exec('DROP INDEX IF EXISTS idx_time_off_types_store_active');
    await db.exec('DROP INDEX IF EXISTS idx_time_off_types_store');

    // Drop tables
    await db.exec('DROP TABLE IF EXISTS staff_schedules');
    await db.exec('DROP TABLE IF EXISTS resource_bookings');
    await db.exec('DROP TABLE IF EXISTS resources');
    await db.exec('DROP TABLE IF EXISTS business_closed_periods');
    await db.exec('DROP TABLE IF EXISTS blocked_time_entries');
    await db.exec('DROP TABLE IF EXISTS blocked_time_types');
    await db.exec('DROP TABLE IF EXISTS time_off_requests');
    await db.exec('DROP TABLE IF EXISTS time_off_types');

    console.log('[SQLite] Migration 7 rollback complete: Scheduling tables dropped');
  },
};
