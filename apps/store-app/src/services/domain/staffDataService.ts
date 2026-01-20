/**
 * Staff Data Service
 *
 * Domain-specific data operations for staff members.
 * Extracted from dataService.ts for better modularity.
 *
 * LOCAL-FIRST architecture:
 * - Reads from IndexedDB or SQLite (instant response)
 * - Writes queue for background sync with server
 *
 * SQLite routing: When USE_SQLITE=true and running in Electron,
 * uses SQLite via sqliteStaffDB
 */

import { store } from '@/store';
import { shouldUseSQLite } from '@/config/featureFlags';
import { staffDB, syncQueueDB } from '@/db/database';
import { sqliteStaffDB } from '@/services/sqliteServices';
import type { Staff } from '@/types';

// ==================== HELPERS ====================

/**
 * Get current store ID from Redux store
 */
function getStoreId(): string {
  const state = store.getState();
  return state.auth.storeId || '';
}

/**
 * Check if SQLite should be used
 */
const USE_SQLITE = shouldUseSQLite();

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
    entity: 'staff',
    entityId,
    action: action.toUpperCase() as 'CREATE' | 'UPDATE' | 'DELETE',
    payload,
    priority: action === 'delete' ? 1 : action === 'create' ? 2 : 3,
    maxAttempts: 5,
  }).catch(error => {
    console.warn('[StaffDataService] Failed to queue sync operation:', error);
    // Don't fail the operation - sync will be retried
  });
}

// ==================== STAFF SERVICE ====================

/**
 * Staff data operations - LOCAL-FIRST
 * Reads from IndexedDB or SQLite, writes queue for background sync
 */
export const staffService = {
  /**
   * Get all staff members for the current store
   */
  async getAll(): Promise<Staff[]> {
    const storeId = getStoreId();
    if (!storeId) return [];

    if (USE_SQLITE) {
      return sqliteStaffDB.getAll(storeId);
    }
    return staffDB.getAll(storeId);
  },

  /**
   * Get a single staff member by ID
   */
  async getById(id: string): Promise<Staff | null> {
    if (USE_SQLITE) {
      const staff = await sqliteStaffDB.getById(id);
      return staff || null;
    }
    const staff = await staffDB.getById(id);
    return staff || null;
  },

  /**
   * Get all active/available staff members
   */
  async getActive(): Promise<Staff[]> {
    const storeId = getStoreId();
    if (!storeId) return [];

    if (USE_SQLITE) {
      return sqliteStaffDB.getAvailable(storeId);
    }
    return staffDB.getAvailable(storeId);
  },

  /**
   * Create a new staff member
   */
  async create(staffData: Omit<Staff, 'id' | 'createdAt' | 'updatedAt'>): Promise<Staff> {
    const storeId = getStoreId();
    if (!storeId) throw new Error('No store ID');

    let created: Staff;
    if (USE_SQLITE) {
      created = await sqliteStaffDB.create({ ...staffData, storeId });
    } else {
      created = await staffDB.create({ ...staffData, storeId });
    }

    // Queue for background sync (non-blocking)
    queueSyncOperation('create', created.id, created);

    return created;
  },

  /**
   * Update an existing staff member
   */
  async update(id: string, updates: Partial<Staff>): Promise<Staff | null> {
    let updated: Staff | null;
    if (USE_SQLITE) {
      updated = await sqliteStaffDB.update(id, updates);
    } else {
      const result = await staffDB.update(id, updates);
      updated = result ?? null;
    }
    if (!updated) return null;

    // Queue for background sync (non-blocking)
    queueSyncOperation('update', id, updated);

    return updated;
  },

  /**
   * Delete a staff member
   */
  async delete(id: string): Promise<void> {
    if (USE_SQLITE) {
      await sqliteStaffDB.delete(id);
    } else {
      await staffDB.delete(id);
    }

    // Queue for background sync (non-blocking)
    queueSyncOperation('delete', id, null);
  },

  /**
   * Clock in a staff member
   */
  async clockIn(id: string): Promise<Staff | null> {
    let updated: Staff | null | undefined;
    if (USE_SQLITE) {
      updated = await sqliteStaffDB.clockIn(id);
    } else {
      updated = await staffDB.clockIn(id);
    }
    if (updated) {
      queueSyncOperation('update', id, updated);
    }
    return updated || null;
  },

  /**
   * Clock out a staff member
   */
  async clockOut(id: string): Promise<Staff | null> {
    let updated: Staff | null | undefined;
    if (USE_SQLITE) {
      updated = await sqliteStaffDB.clockOut(id);
    } else {
      updated = await staffDB.clockOut(id);
    }
    if (updated) {
      queueSyncOperation('update', id, updated);
    }
    return updated || null;
  },
};

export default staffService;
