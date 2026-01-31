import { v4 as uuidv4 } from 'uuid';
import { db } from './schema';
import { syncQueueDB } from './database';
import type {
  TeamMemberSettings,
  TimeOffRequest,
  ScheduleOverride,
} from '../components/team-settings/types';
import {
  incrementEntityVersion,
  markEntityDeleted,
  type SyncStatus,
} from '../types/common';
import {
  compareVectorClocks,
  mergeTeamMember,
  createConflictLog,
} from '../utils/conflictResolution';

// ============================================
// SYNC CONFIGURATION FOR TEAM MEMBERS
// See: docs/DATA_STORAGE_STRATEGY.md
// ============================================

const SYNC_CONFIG = {
  entity: 'teamMember' as const,
  priority: 3, // NORMAL priority (same as Staff/Clients)
  tombstoneRetentionMs: 90 * 24 * 60 * 60 * 1000, // 90 days
};

/**
 * Generate idempotency key for sync operations
 */
// function __generateIdempotencyKey(
//   type: string,
//   entityId: string,
//   version: number
// ): string {
//   return `${type}:teamMember:${entityId}:${version}:${Date.now()}`;
// }

/**
 * Add operation to sync queue
 */
async function queueForSync(
  operationType: 'create' | 'update' | 'delete',
  entity: TeamMemberSettings,
  storeId: string
): Promise<void> {
  await syncQueueDB.add({
    type: operationType,
    entity: SYNC_CONFIG.entity,
    entityId: entity.id,
    action: operationType === 'create' ? 'CREATE' : operationType === 'update' ? 'UPDATE' : 'DELETE',
    payload: entity,
    priority: SYNC_CONFIG.priority,
    maxAttempts: 10,
    storeId: storeId, // Using storeId for backwards compatibility with existing sync queue
  });
}

// ============================================
// TEAM MEMBERS DATABASE OPERATIONS
// Production-ready with sync queue integration
// ============================================

export const teamDB = {
  // ---- Read Operations ----
  // Note: All read operations exclude soft-deleted (tombstone) records by default

  /**
   * Get all team members for a store (excludes deleted)
   */
  async getAllMembers(storeId?: string): Promise<TeamMemberSettings[]> {
    let members = await db.teamMembers.toArray();

    // Filter by storeId if provided
    if (storeId) {
      members = members.filter((m) => m.storeId === storeId);
    }

    // Exclude soft-deleted records
    return members.filter((m) => !m.isDeleted);
  },

  /**
   * Get active team members only (excludes deleted and inactive)
   */
  async getActiveMembers(storeId?: string): Promise<TeamMemberSettings[]> {
    const members = await this.getAllMembers(storeId);
    return members.filter((m) => m.isActive);
  },

  /**
   * Get archived (inactive) team members (excludes deleted)
   */
  async getArchivedMembers(storeId?: string): Promise<TeamMemberSettings[]> {
    const members = await this.getAllMembers(storeId);
    return members.filter((m) => !m.isActive);
  },

  /**
   * Get team member by ID (includes deleted for sync purposes)
   */
  async getMemberById(id: string): Promise<TeamMemberSettings | undefined> {
    return await db.teamMembers.get(id);
  },

  /**
   * Get team member by ID (active only, excludes deleted)
   */
  async getActiveMemberById(id: string): Promise<TeamMemberSettings | undefined> {
    const member = await db.teamMembers.get(id);
    if (member && !member.isDeleted) {
      return member;
    }
    return undefined;
  },

  /**
   * Get team member by email (excludes deleted)
   */
  async getMemberByEmail(email: string, storeId?: string): Promise<TeamMemberSettings | undefined> {
    const members = await db.teamMembers
      .filter((member) =>
        member.profile.email.toLowerCase() === email.toLowerCase() &&
        !member.isDeleted &&
        (!storeId || member.storeId === storeId)
      )
      .first();
    return members;
  },

  /**
   * Search team members by name or email (excludes deleted)
   */
  async searchMembers(query: string, storeId?: string, limit = 50): Promise<TeamMemberSettings[]> {
    const lowerQuery = query.toLowerCase();
    return await db.teamMembers
      .filter((member) =>
        !member.isDeleted &&
        (!storeId || member.storeId === storeId) &&
        (
          member.profile.firstName.toLowerCase().includes(lowerQuery) ||
          member.profile.lastName.toLowerCase().includes(lowerQuery) ||
          member.profile.displayName.toLowerCase().includes(lowerQuery) ||
          member.profile.email.toLowerCase().includes(lowerQuery)
        )
      )
      .limit(limit)
      .toArray();
  },

  /**
   * Get bookable team members (for online booking)
   */
  async getBookableMembers(storeId?: string): Promise<TeamMemberSettings[]> {
    return await db.teamMembers
      .filter((member) =>
        !member.isDeleted &&
        member.isActive &&
        member.onlineBooking.isBookableOnline &&
        (!storeId || member.storeId === storeId)
      )
      .toArray();
  },

  /**
   * Get team members by role
   */
  async getMembersByRole(role: string, storeId?: string): Promise<TeamMemberSettings[]> {
    return await db.teamMembers
      .filter((member) =>
        !member.isDeleted &&
        member.permissions.role === role &&
        (!storeId || member.storeId === storeId)
      )
      .toArray();
  },

  /**
   * Get members pending sync (syncStatus = 'pending' or 'local')
   */
  async getMembersPendingSync(storeId?: string): Promise<TeamMemberSettings[]> {
    return await db.teamMembers
      .filter((member) =>
        (member.syncStatus === 'pending' || member.syncStatus === 'local') &&
        (!storeId || member.storeId === storeId)
      )
      .toArray();
  },

  // ---- Write Operations ----
  // All write operations:
  // 1. Increment version and update vector clock
  // 2. Set syncStatus to 'pending'
  // 3. Add to sync queue

  /**
   * Create a new team member
   * The member should already have all BaseSyncableEntity fields set
   */
  async createMember(
    member: TeamMemberSettings,
    userId: string,
    deviceId: string
  ): Promise<string> {
    const now = new Date().toISOString();

    // Ensure required fields are set
    const newMember: TeamMemberSettings = {
      ...member,
      id: member.id || uuidv4(),
      version: 1,
      vectorClock: { [deviceId]: 1 },
      lastSyncedVersion: 0,
      syncStatus: 'local' as SyncStatus,
      createdAt: now,
      updatedAt: now,
      createdBy: userId,
      createdByDevice: deviceId,
      lastModifiedBy: userId,
      lastModifiedByDevice: deviceId,
      isDeleted: false,
    };

    await db.teamMembers.add(newMember);

    // Queue for sync
    await queueForSync('create', newMember, newMember.storeId);

    return newMember.id;
  },

  /**
   * Update an existing team member
   */
  async updateMember(
    id: string,
    updates: Partial<TeamMemberSettings>,
    userId: string,
    deviceId: string
  ): Promise<TeamMemberSettings> {
    const existing = await db.teamMembers.get(id);
    if (!existing) {
      throw new Error(`Team member with id ${id} not found`);
    }

    if (existing.isDeleted) {
      throw new Error(`Cannot update deleted team member ${id}`);
    }

    // Merge updates with existing data
    const merged: TeamMemberSettings = {
      ...existing,
      ...updates,
    };

    // Increment version and update sync metadata
    const updated = incrementEntityVersion(merged, userId, deviceId);

    await db.teamMembers.put(updated);

    // Queue for sync
    await queueForSync('update', updated, updated.storeId);

    return updated;
  },

  /**
   * Archive a team member (sets isActive = false, still syncs)
   */
  async archiveMember(
    id: string,
    userId: string,
    deviceId: string
  ): Promise<TeamMemberSettings> {
    return await this.updateMember(id, { isActive: false }, userId, deviceId);
  },

  /**
   * Restore an archived team member
   */
  async restoreMember(
    id: string,
    userId: string,
    deviceId: string
  ): Promise<TeamMemberSettings> {
    return await this.updateMember(id, { isActive: true }, userId, deviceId);
  },

  /**
   * Soft delete a team member (tombstone pattern)
   * The record is marked as deleted but kept for sync propagation
   */
  async softDeleteMember(
    id: string,
    userId: string,
    deviceId: string
  ): Promise<void> {
    const existing = await db.teamMembers.get(id);
    if (!existing) {
      throw new Error(`Team member with id ${id} not found`);
    }

    const deleted = markEntityDeleted(
      existing,
      userId,
      deviceId,
      SYNC_CONFIG.tombstoneRetentionMs
    );

    await db.teamMembers.put(deleted);

    // Queue for sync
    await queueForSync('delete', deleted, deleted.storeId);
  },

  /**
   * Hard delete a team member (permanent, no sync)
   * Only use for purging expired tombstones
   */
  async hardDeleteMember(id: string): Promise<void> {
    await db.teamMembers.delete(id);
  },

  /**
   * Delete a team member - uses soft delete by default
   * @deprecated Use softDeleteMember for clarity
   */
  async deleteMember(
    id: string,
    userId = 'system',
    deviceId = 'system'
  ): Promise<void> {
    await this.softDeleteMember(id, userId, deviceId);
  },

  // ---- Bulk Operations ----

  /**
   * Create multiple team members at once
   */
  async bulkCreateMembers(
    members: TeamMemberSettings[],
    userId: string,
    deviceId: string
  ): Promise<string[]> {
    const now = new Date().toISOString();
    const membersWithSync = members.map((member) => ({
      ...member,
      id: member.id || uuidv4(),
      version: 1,
      vectorClock: { [deviceId]: 1 },
      lastSyncedVersion: 0,
      syncStatus: 'local' as SyncStatus,
      createdAt: now,
      updatedAt: now,
      createdBy: userId,
      createdByDevice: deviceId,
      lastModifiedBy: userId,
      lastModifiedByDevice: deviceId,
      isDeleted: false,
    }));

    await db.teamMembers.bulkAdd(membersWithSync);

    // Queue all for sync
    for (const member of membersWithSync) {
      await queueForSync('create', member, member.storeId);
    }

    return membersWithSync.map((m) => m.id);
  },

  /**
   * Update multiple team members at once
   */
  async bulkUpdateMembers(
    updates: Array<{ id: string; updates: Partial<TeamMemberSettings> }>,
    userId: string,
    deviceId: string
  ): Promise<void> {
    await db.transaction('rw', db.teamMembers, async () => {
      for (const { id, updates: memberUpdates } of updates) {
        await this.updateMember(id, memberUpdates, userId, deviceId);
      }
    });
  },

  // ---- Time Off Request Operations ----

  /**
   * Save a time off request for a team member
   */
  async saveTimeOffRequest(
    memberId: string,
    request: TimeOffRequest,
    userId: string,
    deviceId: string
  ): Promise<void> {
    const member = await db.teamMembers.get(memberId);
    if (!member) {
      throw new Error(`Team member with id ${memberId} not found`);
    }

    const existingIndex = member.workingHours.timeOffRequests.findIndex((r) => r.id === request.id);
    let updatedRequests: TimeOffRequest[];

    if (existingIndex !== -1) {
      updatedRequests = [...member.workingHours.timeOffRequests];
      updatedRequests[existingIndex] = request;
    } else {
      updatedRequests = [
        ...member.workingHours.timeOffRequests,
        { ...request, id: request.id || uuidv4() },
      ];
    }

    await this.updateMember(
      memberId,
      {
        workingHours: {
          ...member.workingHours,
          timeOffRequests: updatedRequests,
        },
      },
      userId,
      deviceId
    );
  },

  /**
   * Delete a time off request
   */
  async deleteTimeOffRequest(
    memberId: string,
    requestId: string,
    userId: string,
    deviceId: string
  ): Promise<void> {
    const member = await db.teamMembers.get(memberId);
    if (!member) {
      throw new Error(`Team member with id ${memberId} not found`);
    }

    const updatedRequests = member.workingHours.timeOffRequests.filter((r) => r.id !== requestId);

    await this.updateMember(
      memberId,
      {
        workingHours: {
          ...member.workingHours,
          timeOffRequests: updatedRequests,
        },
      },
      userId,
      deviceId
    );
  },

  /**
   * Get all pending time off requests across all team members
   */
  async getAllPendingTimeOffRequests(
    storeId?: string
  ): Promise<Array<{ memberId: string; memberName: string; request: TimeOffRequest }>> {
    const members = await this.getAllMembers(storeId);
    const pendingRequests: Array<{ memberId: string; memberName: string; request: TimeOffRequest }> = [];

    for (const member of members) {
      for (const request of member.workingHours.timeOffRequests) {
        if (request.status === 'pending') {
          pendingRequests.push({
            memberId: member.id,
            memberName: `${member.profile.firstName} ${member.profile.lastName}`,
            request,
          });
        }
      }
    }

    pendingRequests.sort((a, b) => a.request.requestedAt.localeCompare(b.request.requestedAt));
    return pendingRequests;
  },

  // ---- Schedule Override Operations ----

  /**
   * Save a schedule override for a team member
   */
  async saveScheduleOverride(
    memberId: string,
    override: ScheduleOverride,
    userId: string,
    deviceId: string
  ): Promise<void> {
    const member = await db.teamMembers.get(memberId);
    if (!member) {
      throw new Error(`Team member with id ${memberId} not found`);
    }

    const existingIndex = member.workingHours.scheduleOverrides.findIndex((o) => o.id === override.id);
    let updatedOverrides: ScheduleOverride[];

    if (existingIndex !== -1) {
      updatedOverrides = [...member.workingHours.scheduleOverrides];
      updatedOverrides[existingIndex] = override;
    } else {
      updatedOverrides = [
        ...member.workingHours.scheduleOverrides,
        { ...override, id: override.id || uuidv4() },
      ];
    }

    await this.updateMember(
      memberId,
      {
        workingHours: {
          ...member.workingHours,
          scheduleOverrides: updatedOverrides,
        },
      },
      userId,
      deviceId
    );
  },

  /**
   * Delete a schedule override
   */
  async deleteScheduleOverride(
    memberId: string,
    overrideId: string,
    userId: string,
    deviceId: string
  ): Promise<void> {
    const member = await db.teamMembers.get(memberId);
    if (!member) {
      throw new Error(`Team member with id ${memberId} not found`);
    }

    const updatedOverrides = member.workingHours.scheduleOverrides.filter((o) => o.id !== overrideId);

    await this.updateMember(
      memberId,
      {
        workingHours: {
          ...member.workingHours,
          scheduleOverrides: updatedOverrides,
        },
      },
      userId,
      deviceId
    );
  },

  /**
   * Get schedule overrides for a date range
   */
  async getScheduleOverridesByDateRange(
    memberId: string,
    startDate: string,
    endDate: string
  ): Promise<ScheduleOverride[]> {
    const member = await db.teamMembers.get(memberId);
    if (!member) {
      return [];
    }

    return member.workingHours.scheduleOverrides.filter(
      (override) => override.date >= startDate && override.date <= endDate
    );
  },

  // ---- Sync Operations ----

  /**
   * Mark a member as successfully synced
   */
  async markSynced(id: string, serverVersion: number): Promise<void> {
    const member = await db.teamMembers.get(id);
    if (!member) return;

    await db.teamMembers.update(id, {
      syncStatus: 'synced' as SyncStatus,
      lastSyncedVersion: serverVersion,
    });
  },

  /**
   * Mark a member as having a sync conflict
   */
  async markConflict(id: string): Promise<void> {
    await db.teamMembers.update(id, {
      syncStatus: 'conflict' as SyncStatus,
    });
  },

  /**
   * Mark a member as having a sync error
   */
  async markSyncError(id: string): Promise<void> {
    await db.teamMembers.update(id, {
      syncStatus: 'error' as SyncStatus,
    });
  },

  /**
   * Apply a server change (for pull sync) with field-level conflict resolution
   */
  async applyServerChange(serverMember: TeamMemberSettings): Promise<void> {
    const local = await db.teamMembers.get(serverMember.id);

    if (!local) {
      // New record from server
      await db.teamMembers.add({
        ...serverMember,
        syncStatus: 'synced' as SyncStatus,
        lastSyncedVersion: serverMember.version,
      });
      return;
    }

    // Compare vector clocks to determine relationship
    const clockComparison = compareVectorClocks(local.vectorClock, serverMember.vectorClock);

    switch (clockComparison) {
      case 'remote_ahead':
      case 'equal':
        // Server is authoritative or equal, use server version
        await db.teamMembers.put({
          ...serverMember,
          syncStatus: 'synced' as SyncStatus,
          lastSyncedVersion: serverMember.version,
        });
        break;

      case 'local_ahead':
        // Local has changes server doesn't know about
        // Keep local, it will sync on next push
        // Just update lastSyncedVersion to acknowledge we've seen this server version
        break;

      case 'concurrent':
        // Both have changes - need to merge with field-level resolution
        const result = mergeTeamMember(local, serverMember);

        if (result.hadConflicts) {
          // Log conflict for debugging/auditing
          const log = createConflictLog('teamMember', local, serverMember, result);
          console.warn('Resolved team member conflict:', log);

          // Store conflict log (could be sent to analytics/monitoring)
          if (result.conflictedFields.length > 0) {
            console.info(`Merged fields: ${result.conflictedFields.join(', ')}`);
            console.info(`Local overwrote: ${result.localOverwritten.join(', ') || 'none'}`);
            console.info(`Remote overwrote: ${result.remoteOverwritten.join(', ') || 'none'}`);
          }
        }

        await db.teamMembers.put(result.merged);
        break;
    }
  },

  /**
   * Purge expired tombstones
   */
  async purgeExpiredTombstones(): Promise<number> {
    const now = new Date().toISOString();
    const expired = await db.teamMembers
      .filter((m) => {
        return !!m.isDeleted &&
          !!m.tombstoneExpiresAt &&
          m.tombstoneExpiresAt < now &&
          m.syncStatus === 'synced';
      })
      .toArray();

    for (const member of expired) {
      await this.hardDeleteMember(member.id);
    }

    return expired.length;
  },

  // ---- Statistics ----

  /**
   * Get team statistics
   */
  async getTeamStats(storeId?: string): Promise<{
    total: number;
    active: number;
    archived: number;
    bookable: number;
    pendingSync: number;
    byRole: Record<string, number>;
  }> {
    const members = await this.getAllMembers(storeId);
    const active = members.filter((m) => m.isActive);
    const bookable = members.filter((m) => m.isActive && m.onlineBooking.isBookableOnline);
    const pendingSync = members.filter((m) => m.syncStatus === 'pending' || m.syncStatus === 'local');

    const byRole: Record<string, number> = {};
    active.forEach((member) => {
      const role = member.permissions.role;
      byRole[role] = (byRole[role] || 0) + 1;
    });

    return {
      total: members.length,
      active: active.length,
      archived: members.length - active.length,
      bookable: bookable.length,
      pendingSync: pendingSync.length,
      byRole,
    };
  },

  // ---- Upsert Operation ----

  /**
   * Upsert a team member (insert or update)
   * Used for syncing from Supabase to IndexedDB
   */
  async upsertMember(
    member: TeamMemberSettings,
    _userId: string,
    _deviceId: string
  ): Promise<void> {
    const existing = await db.teamMembers.get(member.id);

    if (existing) {
      // Only update if the incoming data is newer or from server (synced status)
      // Preserve local changes that haven't been synced yet
      if (existing.syncStatus === 'pending' || existing.syncStatus === 'local') {
        // Local has pending changes, don't overwrite
        return;
      }

      // Update with server data
      await db.teamMembers.put({
        ...member,
        syncStatus: 'synced' as SyncStatus,
        lastSyncedVersion: member.version,
      });
    } else {
      // Insert new member
      await db.teamMembers.add({
        ...member,
        syncStatus: 'synced' as SyncStatus,
        lastSyncedVersion: member.version,
      });
    }
  },

  // ---- Data Migration / Seeding ----

  /**
   * Check if team data exists
   */
  async hasData(storeId?: string): Promise<boolean> {
    if (storeId) {
      const count = await db.teamMembers.filter((m) => m.storeId === storeId).count();
      return count > 0;
    }
    const count = await db.teamMembers.count();
    return count > 0;
  },

  /**
   * Clear all team data
   */
  async clearAll(): Promise<void> {
    await db.teamMembers.clear();
  },

  /**
   * Seed initial team data (for development/demo)
   */
  async seedInitialData(
    members: TeamMemberSettings[],
    userId = 'system',
    deviceId = 'seed'
  ): Promise<void> {
    const storeId = members[0]?.storeId;
    const hasData = await this.hasData(storeId);
    if (hasData) {
      console.log('Team data already exists, skipping seed');
      return;
    }

    await this.bulkCreateMembers(members, userId, deviceId);
    console.log(`✅ Seeded ${members.length} team members`);
  },
};

export default teamDB;
