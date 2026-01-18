/**
 * StaffSQLiteService - SQLite service for staff members
 *
 * Provides SQLite-based CRUD operations for staff members with
 * availability queries, status filtering, and schedule management.
 *
 * @module sqlite-adapter/services/staffService
 */

import { BaseSQLiteService, type TableSchema } from './BaseSQLiteService';
import type { SQLiteAdapter } from '../types';

// ==================== TYPES ====================

/**
 * Staff status type
 *
 * Represents the current working status of a staff member.
 */
export type StaffStatus = 'available' | 'busy' | 'break' | 'off';

/**
 * Staff role type
 *
 * Represents the permission/access level of a staff member.
 */
export type StaffRole = 'owner' | 'manager' | 'stylist' | 'technician' | 'receptionist' | 'admin';

/**
 * Weekly schedule entry
 */
export interface ScheduleEntry {
  dayOfWeek: number; // 0-6, Sunday-Saturday
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  isWorking: boolean;
}

/**
 * Staff schedule type
 *
 * Weekly schedule with entries for each day.
 */
export interface StaffSchedule {
  entries: ScheduleEntry[];
  effectiveFrom?: string;
  effectiveUntil?: string;
}

/**
 * Staff entity type
 *
 * Extends Record<string, unknown> to satisfy BaseSQLiteService constraint.
 */
export interface Staff extends Record<string, unknown> {
  id: string;
  storeId: string;
  firstName: string;
  lastName: string;
  displayName?: string;
  email?: string;
  phone?: string;
  avatar?: string;
  status: StaffStatus;
  role: StaffRole;
  schedule?: StaffSchedule;
  skills?: string[];
  color?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  syncStatus?: string;
}

/**
 * Staff SQLite row type
 */
export interface StaffRow {
  id: string;
  store_id: string;
  first_name: string;
  last_name: string;
  display_name: string | null;
  email: string | null;
  phone: string | null;
  avatar: string | null;
  status: string;
  role: string;
  schedule: string | null; // JSON
  skills: string | null; // JSON array
  color: string | null;
  is_active: number; // SQLite boolean (0 or 1)
  created_at: string;
  updated_at: string;
  sync_status: string | null;
}

// ==================== SCHEMA ====================

/**
 * Staff table schema
 *
 * Note: Uses snake_case column names matching the database schema.
 */
const staffSchema: TableSchema = {
  tableName: 'staff',
  primaryKey: 'id',
  columns: {
    id: 'id',
    storeId: 'store_id',
    firstName: 'first_name',
    lastName: 'last_name',
    displayName: 'display_name',
    email: 'email',
    phone: 'phone',
    avatar: 'avatar',
    status: 'status',
    role: 'role',
    schedule: { column: 'schedule', type: 'json', defaultValue: {} },
    skills: { column: 'skills', type: 'json', defaultValue: [] },
    color: 'color',
    isActive: { column: 'is_active', type: 'boolean', defaultValue: true },
    createdAt: { column: 'created_at', type: 'date' },
    updatedAt: { column: 'updated_at', type: 'date' },
    syncStatus: { column: 'sync_status', type: 'string', defaultValue: 'local' },
  },
};

// ==================== SERVICE CLASS ====================

/**
 * SQLite service for staff members
 *
 * Extends BaseSQLiteService with staff-specific query methods:
 * - Availability queries for scheduling
 * - Status filtering for dashboard views
 * - Quick status updates for real-time status changes
 * - Role-based filtering for permissions
 *
 * @example
 * const service = new StaffSQLiteService(db);
 * const availableStaff = await service.getAvailable(storeId);
 * await service.updateStatus(staffId, 'busy');
 */
export class StaffSQLiteService extends BaseSQLiteService<Staff, StaffRow> {
  constructor(db: SQLiteAdapter) {
    super(db, staffSchema);
  }

  /**
   * Get available staff members
   *
   * Retrieves all staff with status != 'off'.
   * Used for scheduling and assignment views.
   *
   * @param storeId - Store ID to filter by
   * @returns Available staff members, ordered by display name
   */
  async getAvailable(storeId: string): Promise<Staff[]> {
    return this.findWhere(
      'store_id = ? AND status != ? AND is_active = 1',
      [storeId, 'off'],
      'display_name ASC, first_name ASC'
    );
  }

  /**
   * Get staff members by status
   *
   * Retrieves all staff with a specific status for a store.
   * Useful for dashboard views (e.g., showing all busy staff).
   *
   * @param storeId - Store ID to filter by
   * @param status - Staff status to filter by
   * @returns Staff members with the given status, ordered by display name
   */
  async getByStatus(storeId: string, status: StaffStatus): Promise<Staff[]> {
    return this.findWhere(
      'store_id = ? AND status = ? AND is_active = 1',
      [storeId, status],
      'display_name ASC, first_name ASC'
    );
  }

  /**
   * Update staff status
   *
   * Quick method to update just the status of a staff member.
   * Also updates the updatedAt timestamp.
   *
   * @param id - Staff ID
   * @param status - New status
   * @returns Updated staff member or undefined if not found
   */
  async updateStatus(id: string, status: StaffStatus): Promise<Staff | undefined> {
    return this.update(id, { status } as Partial<Staff>);
  }

  /**
   * Get active staff members
   *
   * Retrieves all active (not soft-deleted) staff members for a store.
   *
   * @param storeId - Store ID to filter by
   * @returns Active staff members, ordered by display name
   */
  async getActive(storeId: string): Promise<Staff[]> {
    return this.findWhere(
      'store_id = ? AND is_active = 1',
      [storeId],
      'display_name ASC, first_name ASC'
    );
  }

  /**
   * Get staff members by role
   *
   * Retrieves all staff with a specific role for a store.
   * Useful for permission-based views.
   *
   * @param storeId - Store ID to filter by
   * @param role - Staff role to filter by
   * @returns Staff members with the given role, ordered by display name
   */
  async getByRole(storeId: string, role: StaffRole): Promise<Staff[]> {
    return this.findWhere(
      'store_id = ? AND role = ? AND is_active = 1',
      [storeId, role],
      'display_name ASC, first_name ASC'
    );
  }

  /**
   * Get all staff members for a store
   *
   * Retrieves all staff for a store with pagination.
   * Includes inactive staff members (for admin views).
   *
   * @param storeId - Store ID to filter by
   * @param limit - Maximum number of records (default: 1000)
   * @param offset - Number of records to skip (default: 0)
   * @returns Staff members for the store, ordered by display name
   */
  async getByStore(storeId: string, limit: number = 1000, offset: number = 0): Promise<Staff[]> {
    return this.findWhere('store_id = ?', [storeId], 'display_name ASC, first_name ASC', limit, offset);
  }

  /**
   * Count staff by status
   *
   * Returns the count of staff with a specific status for a store.
   * Useful for dashboard metrics.
   *
   * @param storeId - Store ID to filter by
   * @param status - Staff status to count
   * @returns Count of staff with the given status
   */
  async countByStatus(storeId: string, status: StaffStatus): Promise<number> {
    return this.countWhere('store_id = ? AND status = ? AND is_active = 1', [storeId, status]);
  }

  /**
   * Count active staff
   *
   * Returns the count of active staff members for a store.
   *
   * @param storeId - Store ID to filter by
   * @returns Count of active staff
   */
  async countActive(storeId: string): Promise<number> {
    return this.countWhere('store_id = ? AND is_active = 1', [storeId]);
  }

  /**
   * Soft delete a staff member
   *
   * Sets isActive to false instead of deleting.
   * Also sets status to 'off'.
   *
   * @param id - Staff ID
   * @returns Updated staff member or undefined if not found
   */
  async softDelete(id: string): Promise<Staff | undefined> {
    return this.update(id, {
      isActive: false,
      status: 'off',
    } as Partial<Staff>);
  }

  /**
   * Restore a soft-deleted staff member
   *
   * Sets isActive back to true.
   *
   * @param id - Staff ID
   * @returns Updated staff member or undefined if not found
   */
  async restore(id: string): Promise<Staff | undefined> {
    return this.update(id, {
      isActive: true,
      status: 'available',
    } as Partial<Staff>);
  }

  /**
   * Update staff schedule
   *
   * Updates just the schedule field for a staff member.
   *
   * @param id - Staff ID
   * @param schedule - New schedule
   * @returns Updated staff member or undefined if not found
   */
  async updateSchedule(id: string, schedule: StaffSchedule): Promise<Staff | undefined> {
    return this.update(id, { schedule } as Partial<Staff>);
  }

  /**
   * Get staff members with specific skill
   *
   * Uses JSON contains query to find staff with a specific skill.
   * Requires SQLite JSON1 extension.
   *
   * @param storeId - Store ID to filter by
   * @param skill - Skill/service ID to search for
   * @returns Staff members with the skill
   */
  async getBySkill(storeId: string, skill: string): Promise<Staff[]> {
    // Use json_each to search within the skills JSON array
    const sql = `
      SELECT s.*
      FROM staff s, json_each(s.skills) AS skill
      WHERE s.store_id = ?
        AND s.is_active = 1
        AND skill.value = ?
      ORDER BY s.display_name ASC, s.first_name ASC
    `;

    const rows = await this.db.all<StaffRow>(sql, [storeId, skill]);
    return rows.map((row) => this.rowToEntity(row));
  }

  /**
   * Search staff by name
   *
   * Searches for staff by first name, last name, or display name.
   * Uses SQL LIKE for pattern matching.
   *
   * @param storeId - Store ID to filter by
   * @param query - Search query
   * @returns Matching staff members
   */
  async search(storeId: string, query: string): Promise<Staff[]> {
    const pattern = `%${query}%`;
    return this.findWhere(
      'store_id = ? AND is_active = 1 AND (first_name LIKE ? OR last_name LIKE ? OR display_name LIKE ?)',
      [storeId, pattern, pattern, pattern],
      'display_name ASC, first_name ASC'
    );
  }

  /**
   * Get staff status counts
   *
   * Returns counts of staff by status for a store.
   * Uses SQL GROUP BY for efficient aggregation.
   *
   * @param storeId - Store ID to filter by
   * @returns Object with counts by status
   */
  async getStatusCounts(storeId: string): Promise<Record<StaffStatus, number>> {
    const sql = `
      SELECT status, COUNT(*) as count
      FROM staff
      WHERE store_id = ? AND is_active = 1
      GROUP BY status
    `;

    interface CountRow {
      status: string;
      count: number;
    }

    const rows = await this.db.all<CountRow>(sql, [storeId]);

    // Initialize with all statuses at 0
    const counts: Record<StaffStatus, number> = {
      available: 0,
      busy: 0,
      break: 0,
      off: 0,
    };

    // Fill in actual counts
    for (const row of rows) {
      if (row.status in counts) {
        counts[row.status as StaffStatus] = row.count;
      }
    }

    return counts;
  }

  /**
   * Get staff member by email
   *
   * Retrieves a staff member by their email address.
   *
   * @param email - Email address to search for
   * @returns Staff member or undefined if not found
   */
  async getByEmail(email: string): Promise<Staff | undefined> {
    return this.findOneWhere('email = ?', [email]);
  }

  /**
   * Get staff member by phone
   *
   * Retrieves a staff member by their phone number.
   *
   * @param phone - Phone number to search for
   * @returns Staff member or undefined if not found
   */
  async getByPhone(phone: string): Promise<Staff | undefined> {
    return this.findOneWhere('phone = ?', [phone]);
  }
}
