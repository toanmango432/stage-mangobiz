/**
 * Migration v005: Team and CRM Tables
 *
 * Creates SQLite schema for:
 * - Team Module: teamMembers, timesheets, payRuns
 * - CRM Module: patchTests, formTemplates, formResponses, referrals,
 *               clientReviews, loyaltyRewards, reviewRequests, customSegments
 *
 * Reference: Dexie schema v16 (apps/store-app/src/db/schema.ts)
 * Reference: TeamMemberSQLiteService (packages/sqlite-adapter/src/services/teamMemberService.ts)
 * Reference: CRM services (packages/sqlite-adapter/src/services/crmServices.ts)
 */

import type { Migration } from './types';

export const migration_005: Migration = {
  version: 5,
  name: 'team_crm',

  async up(db) {
    console.log('[SQLite] Running migration 5: team_crm');

    // =====================================================
    // TEAM MEMBERS TABLE
    // =====================================================
    // Comprehensive team member management with soft delete pattern
    // and multi-tenant support. Profile and permissions stored as JSON.
    await db.exec(`
      CREATE TABLE IF NOT EXISTS team_members (
        id TEXT PRIMARY KEY,
        tenant_id TEXT NOT NULL,
        store_id TEXT NOT NULL,
        location_id TEXT,

        -- Profile (stored as JSON TEXT)
        profile TEXT NOT NULL,

        -- Permissions (stored as JSON TEXT)
        permissions TEXT NOT NULL,

        -- Status flags
        is_active INTEGER NOT NULL DEFAULT 1,
        is_deleted INTEGER NOT NULL DEFAULT 0,

        -- Sync metadata
        sync_status TEXT NOT NULL DEFAULT 'local',
        version INTEGER NOT NULL DEFAULT 1,
        vector_clock TEXT,
        last_synced_version INTEGER DEFAULT 0,

        -- Soft delete tombstone
        tombstone_expires_at TEXT,

        -- Audit trail
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        created_by TEXT,
        created_by_device TEXT,
        last_modified_by TEXT,
        last_modified_by_device TEXT
      )
    `);

    // Team members indexes
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_team_members_store ON team_members(store_id)`);
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_team_members_store_active ON team_members(store_id, is_active)`);
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_team_members_store_deleted ON team_members(store_id, is_deleted)`);
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_team_members_store_sync ON team_members(store_id, sync_status)`);
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_team_members_created ON team_members(created_at)`);
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_team_members_updated ON team_members(updated_at)`);

    // =====================================================
    // TIMESHEETS TABLE
    // =====================================================
    // Staff time and attendance tracking (Phase 2: Time & Attendance)
    await db.exec(`
      CREATE TABLE IF NOT EXISTS timesheets (
        id TEXT PRIMARY KEY,
        store_id TEXT NOT NULL,
        staff_id TEXT NOT NULL,
        date TEXT NOT NULL,

        -- Time tracking
        clock_in TEXT,
        clock_out TEXT,
        break_start TEXT,
        break_end TEXT,
        break_duration_minutes INTEGER DEFAULT 0,

        -- Calculated fields
        total_hours REAL DEFAULT 0,
        overtime_hours REAL DEFAULT 0,

        -- Status and approval
        status TEXT NOT NULL DEFAULT 'pending',
        approved_by TEXT,
        approved_at TEXT,

        -- Notes
        notes TEXT,

        -- Sync metadata
        sync_status TEXT NOT NULL DEFAULT 'local',
        is_deleted INTEGER NOT NULL DEFAULT 0,

        -- Timestamps
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `);

    // Timesheets indexes
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_timesheets_store_date ON timesheets(store_id, date)`);
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_timesheets_staff_date ON timesheets(staff_id, date)`);
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_timesheets_store_staff ON timesheets(store_id, staff_id)`);
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_timesheets_store_status ON timesheets(store_id, status)`);
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_timesheets_store_sync ON timesheets(store_id, sync_status)`);

    // =====================================================
    // PAY RUNS TABLE
    // =====================================================
    // Payroll processing (Phase 3: Payroll & Pay Runs)
    await db.exec(`
      CREATE TABLE IF NOT EXISTS pay_runs (
        id TEXT PRIMARY KEY,
        store_id TEXT NOT NULL,

        -- Pay period
        period_start TEXT NOT NULL,
        period_end TEXT NOT NULL,

        -- Status
        status TEXT NOT NULL DEFAULT 'draft',

        -- Totals (calculated)
        total_gross REAL DEFAULT 0,
        total_deductions REAL DEFAULT 0,
        total_net REAL DEFAULT 0,

        -- Staff entries (stored as JSON)
        entries TEXT,

        -- Processing info
        processed_at TEXT,
        processed_by TEXT,

        -- Notes
        notes TEXT,

        -- Sync metadata
        sync_status TEXT NOT NULL DEFAULT 'local',
        is_deleted INTEGER NOT NULL DEFAULT 0,

        -- Timestamps
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `);

    // Pay runs indexes
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_pay_runs_store_period ON pay_runs(store_id, period_start)`);
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_pay_runs_store_status ON pay_runs(store_id, status)`);
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_pay_runs_store_sync ON pay_runs(store_id, sync_status)`);

    // =====================================================
    // PATCH TESTS TABLE (PRD 2.3.3)
    // =====================================================
    // Allergy/sensitivity test records for clients
    await db.exec(`
      CREATE TABLE IF NOT EXISTS patch_tests (
        id TEXT PRIMARY KEY,
        store_id TEXT NOT NULL,
        client_id TEXT NOT NULL,
        service_id TEXT NOT NULL,

        -- Test details
        test_date TEXT NOT NULL,
        result TEXT NOT NULL,
        expires_at TEXT,

        -- Additional info
        administered_by TEXT,
        notes TEXT,
        photo_url TEXT,

        -- Sync metadata
        sync_status TEXT NOT NULL DEFAULT 'local',

        -- Timestamps
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `);

    // Patch tests indexes
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_patch_tests_client ON patch_tests(client_id)`);
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_patch_tests_client_service ON patch_tests(client_id, service_id)`);
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_patch_tests_client_expires ON patch_tests(client_id, expires_at)`);
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_patch_tests_store ON patch_tests(store_id)`);

    // =====================================================
    // FORM TEMPLATES TABLE (PRD 2.3.4)
    // =====================================================
    // Consultation form templates
    await db.exec(`
      CREATE TABLE IF NOT EXISTS form_templates (
        id TEXT PRIMARY KEY,
        store_id TEXT NOT NULL,
        name TEXT NOT NULL,
        description TEXT,

        -- Template content (stored as JSON)
        fields TEXT NOT NULL,

        -- Settings
        is_active INTEGER NOT NULL DEFAULT 1,
        is_required INTEGER NOT NULL DEFAULT 0,
        auto_send_enabled INTEGER NOT NULL DEFAULT 0,
        send_before_hours INTEGER,

        -- Linked services (stored as JSON array)
        linked_service_ids TEXT,

        -- Display
        display_order INTEGER DEFAULT 0,

        -- Sync metadata
        sync_status TEXT NOT NULL DEFAULT 'local',

        -- Timestamps
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `);

    // Form templates indexes
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_form_templates_store ON form_templates(store_id)`);
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_form_templates_store_active ON form_templates(store_id, is_active)`);

    // =====================================================
    // FORM RESPONSES TABLE (PRD 2.3.4)
    // =====================================================
    // Client form submissions
    await db.exec(`
      CREATE TABLE IF NOT EXISTS form_responses (
        id TEXT PRIMARY KEY,
        store_id TEXT NOT NULL,
        form_template_id TEXT NOT NULL,
        client_id TEXT NOT NULL,
        appointment_id TEXT,

        -- Response data (stored as JSON)
        responses TEXT NOT NULL,

        -- Status
        status TEXT NOT NULL DEFAULT 'pending',

        -- Completion info
        completed_at TEXT,
        completed_by TEXT,

        -- Sync metadata
        sync_status TEXT NOT NULL DEFAULT 'local',

        -- Timestamps
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `);

    // Form responses indexes
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_form_responses_client ON form_responses(client_id)`);
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_form_responses_client_status ON form_responses(client_id, status)`);
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_form_responses_client_completed ON form_responses(client_id, completed_at)`);
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_form_responses_template ON form_responses(form_template_id)`);
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_form_responses_appointment ON form_responses(appointment_id)`);

    // =====================================================
    // REFERRALS TABLE (PRD 2.3.8)
    // =====================================================
    // Client referral tracking
    await db.exec(`
      CREATE TABLE IF NOT EXISTS referrals (
        id TEXT PRIMARY KEY,
        store_id TEXT NOT NULL,
        referrer_client_id TEXT NOT NULL,
        referred_client_id TEXT,

        -- Referral code/link
        referral_link_code TEXT,

        -- Status
        status TEXT NOT NULL DEFAULT 'pending',

        -- Reward tracking
        referrer_reward_issued INTEGER NOT NULL DEFAULT 0,
        referred_reward_issued INTEGER NOT NULL DEFAULT 0,
        referrer_reward_issued_at TEXT,
        referred_reward_issued_at TEXT,

        -- Conversion tracking
        converted_at TEXT,
        first_purchase_at TEXT,
        first_purchase_amount REAL,

        -- Sync metadata
        sync_status TEXT NOT NULL DEFAULT 'local',

        -- Timestamps
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `);

    // Referrals indexes
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_client_id)`);
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_referrals_referrer_created ON referrals(referrer_client_id, created_at)`);
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_referrals_code ON referrals(referral_link_code)`);
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_referrals_store ON referrals(store_id)`);
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_referrals_status ON referrals(status)`);

    // =====================================================
    // CLIENT REVIEWS TABLE (PRD 2.3.9)
    // =====================================================
    // Client reviews and ratings
    await db.exec(`
      CREATE TABLE IF NOT EXISTS client_reviews (
        id TEXT PRIMARY KEY,
        store_id TEXT NOT NULL,
        client_id TEXT NOT NULL,
        appointment_id TEXT,
        staff_id TEXT,

        -- Review content
        rating REAL NOT NULL,
        review_text TEXT,
        platform TEXT NOT NULL DEFAULT 'internal',

        -- Staff response
        response_text TEXT,
        response_by TEXT,
        response_at TEXT,

        -- Display
        is_visible INTEGER NOT NULL DEFAULT 1,
        is_featured INTEGER NOT NULL DEFAULT 0,

        -- Sync metadata
        sync_status TEXT NOT NULL DEFAULT 'local',

        -- Timestamps
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `);

    // Client reviews indexes
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_client_reviews_client ON client_reviews(client_id)`);
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_client_reviews_client_created ON client_reviews(client_id, created_at)`);
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_client_reviews_staff ON client_reviews(staff_id)`);
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_client_reviews_staff_rating ON client_reviews(staff_id, rating)`);
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_client_reviews_store ON client_reviews(store_id)`);
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_client_reviews_store_rating ON client_reviews(store_id, rating)`);

    // =====================================================
    // LOYALTY REWARDS TABLE (PRD 2.3.7)
    // =====================================================
    // Loyalty program rewards
    await db.exec(`
      CREATE TABLE IF NOT EXISTS loyalty_rewards (
        id TEXT PRIMARY KEY,
        store_id TEXT NOT NULL,
        client_id TEXT NOT NULL,

        -- Reward details
        type TEXT NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        value REAL,

        -- Redemption
        code TEXT,
        redeemed_at TEXT,
        redeemed_ticket_id TEXT,

        -- Expiration
        expires_at TEXT,

        -- Status
        is_active INTEGER NOT NULL DEFAULT 1,

        -- Source
        earned_from TEXT,
        earned_at TEXT,
        points_cost INTEGER,

        -- Sync metadata
        sync_status TEXT NOT NULL DEFAULT 'local',

        -- Timestamps
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `);

    // Loyalty rewards indexes
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_loyalty_rewards_client ON loyalty_rewards(client_id)`);
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_loyalty_rewards_client_redeemed ON loyalty_rewards(client_id, redeemed_at)`);
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_loyalty_rewards_store ON loyalty_rewards(store_id)`);
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_loyalty_rewards_store_type ON loyalty_rewards(store_id, type)`);
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_loyalty_rewards_store_expires ON loyalty_rewards(store_id, expires_at)`);

    // =====================================================
    // REVIEW REQUESTS TABLE (PRD 2.3.9)
    // =====================================================
    // Review invitation tracking
    await db.exec(`
      CREATE TABLE IF NOT EXISTS review_requests (
        id TEXT PRIMARY KEY,
        store_id TEXT NOT NULL,
        client_id TEXT NOT NULL,
        appointment_id TEXT,
        staff_id TEXT,
        ticket_id TEXT,

        -- Status
        status TEXT NOT NULL DEFAULT 'pending',

        -- Sending info
        sent_at TEXT,
        sent_via TEXT,

        -- Tracking
        opened_at TEXT,
        completed_at TEXT,
        review_id TEXT,

        -- Reminder tracking
        reminder_count INTEGER NOT NULL DEFAULT 0,
        last_reminder_at TEXT,

        -- Expiration
        expires_at TEXT,

        -- Sync metadata
        sync_status TEXT NOT NULL DEFAULT 'local',

        -- Timestamps
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `);

    // Review requests indexes
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_review_requests_store ON review_requests(store_id)`);
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_review_requests_store_status ON review_requests(store_id, status)`);
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_review_requests_client ON review_requests(client_id)`);
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_review_requests_client_status ON review_requests(client_id, status)`);
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_review_requests_store_created ON review_requests(store_id, created_at)`);
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_review_requests_staff_created ON review_requests(staff_id, created_at)`);

    // =====================================================
    // CUSTOM SEGMENTS TABLE (PRD 2.3.10)
    // =====================================================
    // Custom client segmentation
    await db.exec(`
      CREATE TABLE IF NOT EXISTS custom_segments (
        id TEXT PRIMARY KEY,
        store_id TEXT NOT NULL,
        name TEXT NOT NULL,
        description TEXT,

        -- Filter criteria (stored as JSON)
        filters TEXT NOT NULL,

        -- Status
        is_active INTEGER NOT NULL DEFAULT 1,

        -- Caching
        cached_count INTEGER,
        last_calculated_at TEXT,

        -- Display
        color TEXT,
        icon TEXT,

        -- Sync metadata
        sync_status TEXT NOT NULL DEFAULT 'local',

        -- Timestamps
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `);

    // Custom segments indexes
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_custom_segments_store ON custom_segments(store_id)`);
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_custom_segments_store_active ON custom_segments(store_id, is_active)`);
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_custom_segments_store_created ON custom_segments(store_id, created_at)`);

    console.log('[SQLite] Migration 5 complete: Team and CRM tables created');
  },

  async down(db) {
    console.log('[SQLite] Rolling back migration 5: team_crm');

    // Drop indexes first
    // Custom segments
    await db.exec('DROP INDEX IF EXISTS idx_custom_segments_store_created');
    await db.exec('DROP INDEX IF EXISTS idx_custom_segments_store_active');
    await db.exec('DROP INDEX IF EXISTS idx_custom_segments_store');

    // Review requests
    await db.exec('DROP INDEX IF EXISTS idx_review_requests_staff_created');
    await db.exec('DROP INDEX IF EXISTS idx_review_requests_store_created');
    await db.exec('DROP INDEX IF EXISTS idx_review_requests_client_status');
    await db.exec('DROP INDEX IF EXISTS idx_review_requests_client');
    await db.exec('DROP INDEX IF EXISTS idx_review_requests_store_status');
    await db.exec('DROP INDEX IF EXISTS idx_review_requests_store');

    // Loyalty rewards
    await db.exec('DROP INDEX IF EXISTS idx_loyalty_rewards_store_expires');
    await db.exec('DROP INDEX IF EXISTS idx_loyalty_rewards_store_type');
    await db.exec('DROP INDEX IF EXISTS idx_loyalty_rewards_store');
    await db.exec('DROP INDEX IF EXISTS idx_loyalty_rewards_client_redeemed');
    await db.exec('DROP INDEX IF EXISTS idx_loyalty_rewards_client');

    // Client reviews
    await db.exec('DROP INDEX IF EXISTS idx_client_reviews_store_rating');
    await db.exec('DROP INDEX IF EXISTS idx_client_reviews_store');
    await db.exec('DROP INDEX IF EXISTS idx_client_reviews_staff_rating');
    await db.exec('DROP INDEX IF EXISTS idx_client_reviews_staff');
    await db.exec('DROP INDEX IF EXISTS idx_client_reviews_client_created');
    await db.exec('DROP INDEX IF EXISTS idx_client_reviews_client');

    // Referrals
    await db.exec('DROP INDEX IF EXISTS idx_referrals_status');
    await db.exec('DROP INDEX IF EXISTS idx_referrals_store');
    await db.exec('DROP INDEX IF EXISTS idx_referrals_code');
    await db.exec('DROP INDEX IF EXISTS idx_referrals_referrer_created');
    await db.exec('DROP INDEX IF EXISTS idx_referrals_referrer');

    // Form responses
    await db.exec('DROP INDEX IF EXISTS idx_form_responses_appointment');
    await db.exec('DROP INDEX IF EXISTS idx_form_responses_template');
    await db.exec('DROP INDEX IF EXISTS idx_form_responses_client_completed');
    await db.exec('DROP INDEX IF EXISTS idx_form_responses_client_status');
    await db.exec('DROP INDEX IF EXISTS idx_form_responses_client');

    // Form templates
    await db.exec('DROP INDEX IF EXISTS idx_form_templates_store_active');
    await db.exec('DROP INDEX IF EXISTS idx_form_templates_store');

    // Patch tests
    await db.exec('DROP INDEX IF EXISTS idx_patch_tests_store');
    await db.exec('DROP INDEX IF EXISTS idx_patch_tests_client_expires');
    await db.exec('DROP INDEX IF EXISTS idx_patch_tests_client_service');
    await db.exec('DROP INDEX IF EXISTS idx_patch_tests_client');

    // Pay runs
    await db.exec('DROP INDEX IF EXISTS idx_pay_runs_store_sync');
    await db.exec('DROP INDEX IF EXISTS idx_pay_runs_store_status');
    await db.exec('DROP INDEX IF EXISTS idx_pay_runs_store_period');

    // Timesheets
    await db.exec('DROP INDEX IF EXISTS idx_timesheets_store_sync');
    await db.exec('DROP INDEX IF EXISTS idx_timesheets_store_status');
    await db.exec('DROP INDEX IF EXISTS idx_timesheets_store_staff');
    await db.exec('DROP INDEX IF EXISTS idx_timesheets_staff_date');
    await db.exec('DROP INDEX IF EXISTS idx_timesheets_store_date');

    // Team members
    await db.exec('DROP INDEX IF EXISTS idx_team_members_updated');
    await db.exec('DROP INDEX IF EXISTS idx_team_members_created');
    await db.exec('DROP INDEX IF EXISTS idx_team_members_store_sync');
    await db.exec('DROP INDEX IF EXISTS idx_team_members_store_deleted');
    await db.exec('DROP INDEX IF EXISTS idx_team_members_store_active');
    await db.exec('DROP INDEX IF EXISTS idx_team_members_store');

    // Drop tables
    await db.exec('DROP TABLE IF EXISTS custom_segments');
    await db.exec('DROP TABLE IF EXISTS review_requests');
    await db.exec('DROP TABLE IF EXISTS loyalty_rewards');
    await db.exec('DROP TABLE IF EXISTS client_reviews');
    await db.exec('DROP TABLE IF EXISTS referrals');
    await db.exec('DROP TABLE IF EXISTS form_responses');
    await db.exec('DROP TABLE IF EXISTS form_templates');
    await db.exec('DROP TABLE IF EXISTS patch_tests');
    await db.exec('DROP TABLE IF EXISTS pay_runs');
    await db.exec('DROP TABLE IF EXISTS timesheets');
    await db.exec('DROP TABLE IF EXISTS team_members');

    console.log('[SQLite] Migration 5 rollback complete: Team and CRM tables dropped');
  },
};
