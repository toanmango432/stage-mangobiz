/**
 * Team Data Service
 *
 * Domain-specific data operations for team members.
 * Follows the staffDataService.ts pattern for consistency.
 *
 * LOCAL-FIRST architecture:
 * - Reads from IndexedDB (instant response)
 * - Writes queue for background sync with server
 *
 * Note: Team members use IndexedDB only (no SQLite equivalent yet).
 * When SQLite support is needed, add routing similar to staffDataService.
 */

import { store } from '@/store';
import { syncQueueDB } from '@/db/database';
import { teamDB } from '@/db/teamOperations';
import type { TeamMemberSettings } from '@/components/team-settings/types';

// ==================== HELPERS ====================

/**
 * Get current store ID from Redux store
 */
function getStoreId(): string {
  const state = store.getState();
  return state.auth.storeId || '';
}

/**
 * Get current user ID from Redux store
 */
function getUserId(): string {
  const state = store.getState();
  return state.auth.user?.id || 'system';
}

/**
 * Get device ID from Redux store or generate one
 */
function getDeviceId(): string {
  const state = store.getState();
  return state.auth.device?.id || 'web-client';
}

/**
 * Queue a sync operation for background processing
 * LOCAL-FIRST: Non-blocking, fire-and-forget
 */
function queueSyncOperation(
  action: 'create' | 'update' | 'delete',
  entityId: string,
  payload: unknown
): void {
  // Don't await - queue async
  syncQueueDB.add({
    type: action,
    entity: 'teamMember',
    entityId,
    action: action.toUpperCase() as 'CREATE' | 'UPDATE' | 'DELETE',
    payload,
    priority: action === 'delete' ? 1 : action === 'create' ? 2 : 3,
    maxAttempts: 5,
  }).catch(error => {
    console.warn('[TeamDataService] Failed to queue sync operation:', error);
    // Don't fail the operation - sync will be retried
  });
}

// ==================== TEAM SERVICE ====================

/**
 * Team data operations - LOCAL-FIRST
 * Reads from IndexedDB, writes queue for background sync
 */
export const teamService = {
  /**
   * Get all team members for the current store
   */
  async getAll(): Promise<TeamMemberSettings[]> {
    const storeId = getStoreId();
    if (!storeId) return [];

    return teamDB.getAllMembers(storeId);
  },

  /**
   * Get a single team member by ID
   */
  async getById(id: string): Promise<TeamMemberSettings | null> {
    const member = await teamDB.getMemberById(id);
    return member || null;
  },

  /**
   * Get all active team members
   */
  async getActive(): Promise<TeamMemberSettings[]> {
    const storeId = getStoreId();
    if (!storeId) return [];

    return teamDB.getActiveMembers(storeId);
  },

  /**
   * Get archived (inactive) team members
   */
  async getArchived(): Promise<TeamMemberSettings[]> {
    const storeId = getStoreId();
    if (!storeId) return [];

    return teamDB.getArchivedMembers(storeId);
  },

  /**
   * Get team member by email
   */
  async getByEmail(email: string): Promise<TeamMemberSettings | null> {
    const storeId = getStoreId();
    const member = await teamDB.getMemberByEmail(email, storeId);
    return member || null;
  },

  /**
   * Search team members by name or email
   */
  async search(query: string, limit: number = 50): Promise<TeamMemberSettings[]> {
    const storeId = getStoreId();
    return teamDB.searchMembers(query, storeId, limit);
  },

  /**
   * Get bookable team members (for online booking)
   */
  async getBookable(): Promise<TeamMemberSettings[]> {
    const storeId = getStoreId();
    return teamDB.getBookableMembers(storeId);
  },

  /**
   * Get team members by role
   */
  async getByRole(role: string): Promise<TeamMemberSettings[]> {
    const storeId = getStoreId();
    return teamDB.getMembersByRole(role, storeId);
  },

  /**
   * Create a new team member
   */
  async create(memberData: TeamMemberSettings): Promise<TeamMemberSettings> {
    const storeId = getStoreId();
    if (!storeId) throw new Error('No store ID');

    const userId = getUserId();
    const deviceId = getDeviceId();

    // Ensure storeId is set
    const memberWithStore: TeamMemberSettings = {
      ...memberData,
      storeId,
    };

    const id = await teamDB.createMember(memberWithStore, userId, deviceId);

    // Fetch the created member to return
    const created = await teamDB.getMemberById(id);
    if (!created) throw new Error('Failed to create team member');

    // Queue for background sync (non-blocking)
    queueSyncOperation('create', created.id, created);

    return created;
  },

  /**
   * Update an existing team member
   */
  async update(id: string, updates: Partial<TeamMemberSettings>): Promise<TeamMemberSettings | null> {
    const userId = getUserId();
    const deviceId = getDeviceId();

    try {
      const updated = await teamDB.updateMember(id, updates, userId, deviceId);

      // Queue for background sync (non-blocking)
      queueSyncOperation('update', id, updated);

      return updated;
    } catch (error) {
      console.error('[TeamDataService] Failed to update team member:', error);
      return null;
    }
  },

  /**
   * Archive a team member (sets isActive = false)
   */
  async archive(id: string): Promise<TeamMemberSettings | null> {
    const userId = getUserId();
    const deviceId = getDeviceId();

    try {
      const archived = await teamDB.archiveMember(id, userId, deviceId);
      queueSyncOperation('update', id, archived);
      return archived;
    } catch (error) {
      console.error('[TeamDataService] Failed to archive team member:', error);
      return null;
    }
  },

  /**
   * Restore an archived team member
   */
  async restore(id: string): Promise<TeamMemberSettings | null> {
    const userId = getUserId();
    const deviceId = getDeviceId();

    try {
      const restored = await teamDB.restoreMember(id, userId, deviceId);
      queueSyncOperation('update', id, restored);
      return restored;
    } catch (error) {
      console.error('[TeamDataService] Failed to restore team member:', error);
      return null;
    }
  },

  /**
   * Delete a team member (soft delete with tombstone)
   */
  async delete(id: string): Promise<void> {
    const userId = getUserId();
    const deviceId = getDeviceId();

    await teamDB.softDeleteMember(id, userId, deviceId);

    // Queue for background sync (non-blocking)
    queueSyncOperation('delete', id, null);
  },

  /**
   * Get team statistics
   */
  async getStats(): Promise<{
    total: number;
    active: number;
    archived: number;
    bookable: number;
    pendingSync: number;
    byRole: Record<string, number>;
  }> {
    const storeId = getStoreId();
    return teamDB.getTeamStats(storeId);
  },

  /**
   * Bulk create team members
   */
  async bulkCreate(members: TeamMemberSettings[]): Promise<string[]> {
    const storeId = getStoreId();
    if (!storeId) throw new Error('No store ID');

    const userId = getUserId();
    const deviceId = getDeviceId();

    // Ensure storeId is set on all members
    const membersWithStore = members.map(m => ({ ...m, storeId }));

    const ids = await teamDB.bulkCreateMembers(membersWithStore, userId, deviceId);

    // Queue each for sync
    for (let i = 0; i < ids.length; i++) {
      const created = await teamDB.getMemberById(ids[i]);
      if (created) {
        queueSyncOperation('create', created.id, created);
      }
    }

    return ids;
  },

  /**
   * Upsert a team member (for syncing from server)
   */
  async upsert(member: TeamMemberSettings): Promise<void> {
    const userId = getUserId();
    const deviceId = getDeviceId();

    await teamDB.upsertMember(member, userId, deviceId);
  },
};

export default teamService;
