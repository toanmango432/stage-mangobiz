/**
 * TeamMemberSQLiteService - SQLite service for team member management
 *
 * Provides CRUD operations and specialized queries for team members
 * with soft delete pattern for audit trail support.
 *
 * @module sqlite-adapter/services/teamMemberService
 */

import type { SQLiteAdapter } from '../types';
import { BaseSQLiteService, type TableSchema } from './BaseSQLiteService';

// ==================== TYPES ====================

/**
 * Staff role type (from team-settings/types)
 */
export type TeamMemberRole =
  | 'owner'
  | 'manager'
  | 'senior_stylist'
  | 'stylist'
  | 'junior_stylist'
  | 'apprentice'
  | 'receptionist'
  | 'assistant'
  | 'nail_technician'
  | 'esthetician'
  | 'massage_therapist'
  | 'barber'
  | 'colorist'
  | 'makeup_artist';

/**
 * Team member profile (stored as JSON)
 */
export interface TeamMemberProfile {
  id: string;
  firstName: string;
  lastName: string;
  displayName: string;
  email: string;
  phone: string;
  avatar?: string;
  bio?: string;
  title?: string;
  employeeId?: string;
  dateOfBirth?: string;
  hireDate?: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
}

/**
 * Role permissions (stored as JSON)
 */
export interface TeamMemberPermissions {
  role: TeamMemberRole;
  permissions: unknown[];
  canAccessAdminPortal: boolean;
  canAccessReports: boolean;
  canModifyPrices: boolean;
  canProcessRefunds: boolean;
  canDeleteRecords: boolean;
  canManageTeam: boolean;
  canViewOthersCalendar: boolean;
  canBookForOthers: boolean;
  canEditOthersAppointments: boolean;
  pinRequired: boolean;
  pin?: string;
}

/**
 * Sync status for team members
 */
export type TeamMemberSyncStatus = 'local' | 'synced' | 'pending' | 'syncing' | 'conflict' | 'error';

/**
 * Vector clock for conflict detection
 */
export type VectorClock = Record<string, number>;

/**
 * Team member entity (application type)
 */
export interface TeamMember extends Record<string, unknown> {
  id: string;
  tenantId: string;
  storeId: string;
  locationId?: string;

  // Sync metadata
  syncStatus: TeamMemberSyncStatus;
  version: number;
  vectorClock: VectorClock;
  lastSyncedVersion: number;

  // Timestamps
  createdAt: string;
  updatedAt: string;

  // Audit trail
  createdBy: string;
  createdByDevice: string;
  lastModifiedBy: string;
  lastModifiedByDevice: string;

  // Soft delete (tombstone pattern)
  isDeleted: boolean;
  deletedAt?: string;
  deletedBy?: string;
  deletedByDevice?: string;
  tombstoneExpiresAt?: string;

  // Team member specific fields (stored as JSON)
  profile: TeamMemberProfile;
  services: unknown[];
  workingHours: unknown;
  permissions: TeamMemberPermissions;
  commission: unknown;
  payroll: unknown;
  onlineBooking: unknown;
  notifications: unknown;
  performanceGoals: unknown;

  // Active status (separate from isDeleted)
  isActive: boolean;
}

/**
 * SQLite row type for team members
 */
export interface TeamMemberRow {
  id: string;
  tenant_id: string;
  store_id: string;
  location_id: string | null;

  // Sync metadata
  sync_status: string;
  version: number;
  vector_clock: string; // JSON
  last_synced_version: number;

  // Timestamps
  created_at: string;
  updated_at: string;

  // Audit trail
  created_by: string;
  created_by_device: string;
  last_modified_by: string;
  last_modified_by_device: string;

  // Soft delete
  is_deleted: number; // SQLite boolean (0/1)
  deleted_at: string | null;
  deleted_by: string | null;
  deleted_by_device: string | null;
  tombstone_expires_at: string | null;

  // Team member specific fields (JSON)
  profile: string;
  services: string;
  working_hours: string;
  permissions: string;
  commission: string;
  payroll: string;
  online_booking: string;
  notifications: string;
  performance_goals: string;

  // Active status
  is_active: number; // SQLite boolean (0/1)
}

// ==================== SCHEMA ====================

const teamMemberSchema: TableSchema = {
  tableName: 'team_members',
  primaryKey: 'id',
  columns: {
    id: 'id',
    tenantId: 'tenant_id',
    storeId: 'store_id',
    locationId: 'location_id',

    // Sync metadata
    syncStatus: 'sync_status',
    version: { column: 'version', type: 'number', defaultValue: 1 },
    vectorClock: { column: 'vector_clock', type: 'json', defaultValue: {} },
    lastSyncedVersion: { column: 'last_synced_version', type: 'number', defaultValue: 0 },

    // Timestamps
    createdAt: { column: 'created_at', type: 'date' },
    updatedAt: { column: 'updated_at', type: 'date' },

    // Audit trail
    createdBy: 'created_by',
    createdByDevice: 'created_by_device',
    lastModifiedBy: 'last_modified_by',
    lastModifiedByDevice: 'last_modified_by_device',

    // Soft delete
    isDeleted: { column: 'is_deleted', type: 'boolean', defaultValue: false },
    deletedAt: { column: 'deleted_at', type: 'date' },
    deletedBy: 'deleted_by',
    deletedByDevice: 'deleted_by_device',
    tombstoneExpiresAt: { column: 'tombstone_expires_at', type: 'date' },

    // Team member specific fields (JSON)
    profile: { column: 'profile', type: 'json', defaultValue: {} },
    services: { column: 'services', type: 'json', defaultValue: [] },
    workingHours: { column: 'working_hours', type: 'json', defaultValue: {} },
    permissions: { column: 'permissions', type: 'json', defaultValue: {} },
    commission: { column: 'commission', type: 'json', defaultValue: {} },
    payroll: { column: 'payroll', type: 'json', defaultValue: {} },
    onlineBooking: { column: 'online_booking', type: 'json', defaultValue: {} },
    notifications: { column: 'notifications', type: 'json', defaultValue: {} },
    performanceGoals: { column: 'performance_goals', type: 'json', defaultValue: {} },

    // Active status
    isActive: { column: 'is_active', type: 'boolean', defaultValue: true },
  },
};

// ==================== SERVICE ====================

/**
 * SQLite service for team member management
 *
 * Features:
 * - Extends BaseSQLiteService for standard CRUD operations
 * - Soft delete pattern for audit trail
 * - Profile stored as nested JSON column
 * - Role-based filtering through permissions JSON
 */
export class TeamMemberSQLiteService extends BaseSQLiteService<TeamMember, TeamMemberRow> {
  constructor(db: SQLiteAdapter) {
    super(db, teamMemberSchema);
  }

  // ==================== ACTIVE/DELETED QUERIES ====================

  /**
   * Get all active (non-deleted) team members for a store
   *
   * @param storeId - Store ID to filter by
   * @param limit - Maximum number of records (default 1000)
   * @returns Array of active team members
   */
  async getActive(storeId: string, limit: number = 1000): Promise<TeamMember[]> {
    return this.findWhere(
      'store_id = ? AND is_deleted = 0 AND is_active = 1',
      [storeId],
      'created_at DESC',
      limit
    );
  }

  /**
   * Get all team members for a store (including inactive but not deleted)
   *
   * @param storeId - Store ID to filter by
   * @param includeDeleted - Whether to include soft-deleted members (default false)
   * @param limit - Maximum number of records (default 1000)
   * @returns Array of team members
   */
  async getByStore(
    storeId: string,
    includeDeleted: boolean = false,
    limit: number = 1000
  ): Promise<TeamMember[]> {
    const where = includeDeleted
      ? 'store_id = ?'
      : 'store_id = ? AND is_deleted = 0';
    return this.findWhere(where, [storeId], 'created_at DESC', limit);
  }

  // ==================== ROLE-BASED QUERIES ====================

  /**
   * Get team members by permissions role
   *
   * Uses json_extract to query the role field from the permissions JSON column.
   *
   * @param storeId - Store ID to filter by
   * @param role - Role to filter by (e.g., 'manager', 'stylist')
   * @param limit - Maximum number of records (default 1000)
   * @returns Array of team members with the specified role
   */
  async getByRole(
    storeId: string,
    role: TeamMemberRole,
    limit: number = 1000
  ): Promise<TeamMember[]> {
    const sql = `
      SELECT *
      FROM ${teamMemberSchema.tableName}
      WHERE store_id = ?
        AND is_deleted = 0
        AND json_extract(permissions, '$.role') = ?
      ORDER BY created_at DESC
      LIMIT ?
    `;
    return this.rawQuery(sql, [storeId, role, limit]);
  }

  /**
   * Get managers (owners or managers) for a store
   *
   * @param storeId - Store ID to filter by
   * @returns Array of team members with manager or owner role
   */
  async getManagers(storeId: string): Promise<TeamMember[]> {
    const sql = `
      SELECT *
      FROM ${teamMemberSchema.tableName}
      WHERE store_id = ?
        AND is_deleted = 0
        AND is_active = 1
        AND json_extract(permissions, '$.role') IN ('owner', 'manager')
      ORDER BY json_extract(permissions, '$.role') ASC, created_at ASC
    `;
    return this.rawQuery(sql, [storeId]);
  }

  /**
   * Count team members by role
   *
   * @param storeId - Store ID to filter by
   * @returns Object mapping roles to counts
   */
  async countByRole(storeId: string): Promise<Record<TeamMemberRole, number>> {
    const roles: TeamMemberRole[] = [
      'owner', 'manager', 'senior_stylist', 'stylist', 'junior_stylist',
      'apprentice', 'receptionist', 'assistant', 'nail_technician',
      'esthetician', 'massage_therapist', 'barber', 'colorist', 'makeup_artist'
    ];

    // Initialize all roles to 0
    const counts: Record<TeamMemberRole, number> = {} as Record<TeamMemberRole, number>;
    for (const role of roles) {
      counts[role] = 0;
    }

    // Get actual counts from database
    const sql = `
      SELECT json_extract(permissions, '$.role') as role, COUNT(*) as count
      FROM ${teamMemberSchema.tableName}
      WHERE store_id = ?
        AND is_deleted = 0
      GROUP BY json_extract(permissions, '$.role')
    `;
    const rows = await this.db.all<{ role: string; count: number }>(sql, [storeId]);

    for (const row of rows) {
      if (row.role && roles.includes(row.role as TeamMemberRole)) {
        counts[row.role as TeamMemberRole] = row.count;
      }
    }

    return counts;
  }

  // ==================== SOFT DELETE ====================

  /**
   * Soft delete a team member (tombstone pattern)
   *
   * Sets isDeleted=true and isActive=false instead of actually deleting.
   * The tombstoneExpiresAt is set to 30 days from now by default.
   *
   * @param id - Team member ID to delete
   * @param userId - User performing the deletion (for audit)
   * @param deviceId - Device performing the deletion (for audit)
   * @param tombstoneRetentionDays - Days to retain tombstone (default 30)
   * @returns Updated team member or undefined if not found
   */
  async softDelete(
    id: string,
    userId?: string,
    deviceId?: string,
    tombstoneRetentionDays: number = 30
  ): Promise<TeamMember | undefined> {
    const existing = await this.getById(id);
    if (!existing) {
      return undefined;
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + tombstoneRetentionDays * 24 * 60 * 60 * 1000);

    const updates: Partial<TeamMember> = {
      isDeleted: true,
      isActive: false,
      deletedAt: now.toISOString(),
      deletedBy: userId ?? existing.lastModifiedBy,
      deletedByDevice: deviceId ?? existing.lastModifiedByDevice,
      tombstoneExpiresAt: expiresAt.toISOString(),
      syncStatus: 'pending',
      version: existing.version + 1,
      lastModifiedBy: userId ?? existing.lastModifiedBy,
      lastModifiedByDevice: deviceId ?? existing.lastModifiedByDevice,
    };

    // Update vector clock if deviceId is provided
    if (deviceId) {
      updates.vectorClock = {
        ...existing.vectorClock,
        [deviceId]: existing.version + 1,
      };
    }

    return this.update(id, updates);
  }

  /**
   * Restore a soft-deleted team member
   *
   * @param id - Team member ID to restore
   * @param userId - User performing the restore (for audit)
   * @param deviceId - Device performing the restore (for audit)
   * @returns Restored team member or undefined if not found
   */
  async restore(
    id: string,
    userId?: string,
    deviceId?: string
  ): Promise<TeamMember | undefined> {
    const existing = await this.getById(id);
    if (!existing) {
      return undefined;
    }

    const updates: Partial<TeamMember> = {
      isDeleted: false,
      isActive: true,
      deletedAt: undefined,
      deletedBy: undefined,
      deletedByDevice: undefined,
      tombstoneExpiresAt: undefined,
      syncStatus: 'pending',
      version: existing.version + 1,
      lastModifiedBy: userId ?? existing.lastModifiedBy,
      lastModifiedByDevice: deviceId ?? existing.lastModifiedByDevice,
    };

    // Update vector clock if deviceId is provided
    if (deviceId) {
      updates.vectorClock = {
        ...existing.vectorClock,
        [deviceId]: existing.version + 1,
      };
    }

    return this.update(id, updates);
  }

  /**
   * Clean up expired tombstones (hard delete)
   *
   * @param storeId - Store ID to clean up
   * @returns Number of records deleted
   */
  async cleanupExpiredTombstones(storeId: string): Promise<number> {
    const now = new Date().toISOString();
    const sql = `
      DELETE FROM ${teamMemberSchema.tableName}
      WHERE store_id = ?
        AND is_deleted = 1
        AND tombstone_expires_at IS NOT NULL
        AND tombstone_expires_at < ?
    `;
    const result = await this.db.run(sql, [storeId, now]);
    return result.changes;
  }

  // ==================== STATUS QUERIES ====================

  /**
   * Activate a team member
   *
   * @param id - Team member ID
   * @returns Updated team member or undefined if not found
   */
  async activate(id: string): Promise<TeamMember | undefined> {
    return this.update(id, { isActive: true });
  }

  /**
   * Deactivate a team member (without deleting)
   *
   * @param id - Team member ID
   * @returns Updated team member or undefined if not found
   */
  async deactivate(id: string): Promise<TeamMember | undefined> {
    return this.update(id, { isActive: false });
  }

  /**
   * Get inactive (but not deleted) team members
   *
   * @param storeId - Store ID to filter by
   * @param limit - Maximum number of records (default 1000)
   * @returns Array of inactive team members
   */
  async getInactive(storeId: string, limit: number = 1000): Promise<TeamMember[]> {
    return this.findWhere(
      'store_id = ? AND is_deleted = 0 AND is_active = 0',
      [storeId],
      'updated_at DESC',
      limit
    );
  }

  /**
   * Get active and inactive counts
   *
   * @param storeId - Store ID to filter by
   * @returns Object with active and inactive counts
   */
  async getStatusCounts(storeId: string): Promise<{ active: number; inactive: number; deleted: number }> {
    const sql = `
      SELECT
        SUM(CASE WHEN is_deleted = 0 AND is_active = 1 THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN is_deleted = 0 AND is_active = 0 THEN 1 ELSE 0 END) as inactive,
        SUM(CASE WHEN is_deleted = 1 THEN 1 ELSE 0 END) as deleted
      FROM ${teamMemberSchema.tableName}
      WHERE store_id = ?
    `;
    const result = await this.db.get<{ active: number; inactive: number; deleted: number }>(sql, [storeId]);
    return {
      active: result?.active ?? 0,
      inactive: result?.inactive ?? 0,
      deleted: result?.deleted ?? 0,
    };
  }

  // ==================== PROFILE QUERIES ====================

  /**
   * Get team member by email (from profile JSON)
   *
   * @param email - Email to search for
   * @returns Team member or undefined if not found
   */
  async getByEmail(email: string): Promise<TeamMember | undefined> {
    const sql = `
      SELECT *
      FROM ${teamMemberSchema.tableName}
      WHERE json_extract(profile, '$.email') = ?
        AND is_deleted = 0
      LIMIT 1
    `;
    return this.rawQueryOne(sql, [email]);
  }

  /**
   * Get team member by employee ID (from profile JSON)
   *
   * @param storeId - Store ID to filter by
   * @param employeeId - Employee ID to search for
   * @returns Team member or undefined if not found
   */
  async getByEmployeeId(storeId: string, employeeId: string): Promise<TeamMember | undefined> {
    const sql = `
      SELECT *
      FROM ${teamMemberSchema.tableName}
      WHERE store_id = ?
        AND json_extract(profile, '$.employeeId') = ?
        AND is_deleted = 0
      LIMIT 1
    `;
    return this.rawQueryOne(sql, [storeId, employeeId]);
  }

  /**
   * Search team members by name
   *
   * Searches displayName, firstName, and lastName in the profile.
   *
   * @param storeId - Store ID to filter by
   * @param query - Search query
   * @param limit - Maximum number of records (default 50)
   * @returns Array of matching team members
   */
  async search(storeId: string, query: string, limit: number = 50): Promise<TeamMember[]> {
    const searchPattern = `%${query}%`;
    const sql = `
      SELECT *
      FROM ${teamMemberSchema.tableName}
      WHERE store_id = ?
        AND is_deleted = 0
        AND (
          json_extract(profile, '$.displayName') LIKE ?
          OR json_extract(profile, '$.firstName') LIKE ?
          OR json_extract(profile, '$.lastName') LIKE ?
        )
      ORDER BY json_extract(profile, '$.displayName') ASC
      LIMIT ?
    `;
    return this.rawQuery(sql, [storeId, searchPattern, searchPattern, searchPattern, limit]);
  }

  // ==================== UPDATE METHODS ====================

  /**
   * Update team member profile
   *
   * @param id - Team member ID
   * @param profile - Profile updates (partial)
   * @returns Updated team member or undefined if not found
   */
  async updateProfile(id: string, profile: Partial<TeamMemberProfile>): Promise<TeamMember | undefined> {
    const existing = await this.getById(id);
    if (!existing) {
      return undefined;
    }

    return this.update(id, {
      profile: { ...existing.profile, ...profile },
    });
  }

  /**
   * Update team member permissions
   *
   * @param id - Team member ID
   * @param permissions - Permissions updates (partial)
   * @returns Updated team member or undefined if not found
   */
  async updatePermissions(id: string, permissions: Partial<TeamMemberPermissions>): Promise<TeamMember | undefined> {
    const existing = await this.getById(id);
    if (!existing) {
      return undefined;
    }

    return this.update(id, {
      permissions: { ...existing.permissions, ...permissions },
    });
  }

  /**
   * Update team member role
   *
   * @param id - Team member ID
   * @param role - New role
   * @returns Updated team member or undefined if not found
   */
  async updateRole(id: string, role: TeamMemberRole): Promise<TeamMember | undefined> {
    return this.updatePermissions(id, { role });
  }

  // ==================== SYNC QUERIES ====================

  /**
   * Get team members needing sync
   *
   * @param storeId - Store ID to filter by
   * @param limit - Maximum number of records (default 100)
   * @returns Array of team members with pending sync
   */
  async getPendingSync(storeId: string, limit: number = 100): Promise<TeamMember[]> {
    return this.findWhere(
      'store_id = ? AND sync_status IN (?, ?, ?)',
      [storeId, 'pending', 'local', 'error'],
      'updated_at ASC',
      limit
    );
  }

  /**
   * Get team members updated since a timestamp
   *
   * @param storeId - Store ID to filter by
   * @param since - ISO timestamp to filter from
   * @param limit - Maximum number of records (default 1000)
   * @returns Array of recently updated team members
   */
  async getUpdatedSince(storeId: string, since: string, limit: number = 1000): Promise<TeamMember[]> {
    return this.findWhere(
      'store_id = ? AND updated_at > ?',
      [storeId, since],
      'updated_at ASC',
      limit
    );
  }

  /**
   * Mark team member as synced
   *
   * @param id - Team member ID
   * @param syncedVersion - Version that was synced
   * @returns Updated team member or undefined if not found
   */
  async markSynced(id: string, syncedVersion: number): Promise<TeamMember | undefined> {
    return this.update(id, {
      syncStatus: 'synced',
      lastSyncedVersion: syncedVersion,
    });
  }

  // ==================== COUNT METHODS ====================

  /**
   * Count active team members for a store
   *
   * @param storeId - Store ID to count
   * @returns Number of active team members
   */
  async countActive(storeId: string): Promise<number> {
    return this.countWhere('store_id = ? AND is_deleted = 0 AND is_active = 1', [storeId]);
  }

  /**
   * Count all team members for a store (excluding deleted)
   *
   * @param storeId - Store ID to count
   * @returns Number of team members
   */
  async countByStore(storeId: string): Promise<number> {
    return this.countWhere('store_id = ? AND is_deleted = 0', [storeId]);
  }
}
