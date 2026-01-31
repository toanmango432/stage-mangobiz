/**
 * Sync Data Service
 *
 * LOCAL-FIRST architecture - Sync Queue Operations
 *
 * Manages the offline sync operation queue for background synchronization.
 * This service handles queuing, retrieving, and managing sync operations
 * that need to be synchronized with the server.
 *
 * SQLite routing: When USE_SQLITE=true and running in Electron, uses SQLite
 * via sqliteSyncQueueDB. Otherwise falls back to Dexie.js IndexedDB.
 */

import { shouldUseSQLite } from '@/config/featureFlags';
import { syncQueueDB } from '@/db/database';
import { sqliteSyncQueueDB } from '@/services/sqliteServices';

// Feature flag for SQLite backend
const USE_SQLITE = shouldUseSQLite();

/**
 * Sync Queue data operations - LOCAL-FIRST
 * Manages offline sync operation queue
 *
 * SQLite routing: When USE_SQLITE=true and running in Electron, uses SQLite via sqliteSyncQueueDB
 */
export const syncQueueService = {
  /**
   * Get all sync operations with pagination
   */
  async getAll(limit = 100, offset = 0) {
    if (USE_SQLITE) {
      return sqliteSyncQueueDB.getAll(limit, offset);
    }
    return syncQueueDB.getAll(limit, offset);
  },

  /**
   * Get pending sync operations
   */
  async getPending(limit = 50) {
    if (USE_SQLITE) {
      return sqliteSyncQueueDB.getPending(limit);
    }
    return syncQueueDB.getPending(limit);
  },

  /**
   * Add a new sync operation to the queue
   */
  async add(operation: Parameters<typeof syncQueueDB.add>[0]) {
    if (USE_SQLITE) {
      return sqliteSyncQueueDB.add(operation);
    }
    return syncQueueDB.add(operation);
  },

  /**
   * Update a sync operation status
   */
  async update(id: string, updates: Parameters<typeof syncQueueDB.update>[1]) {
    if (USE_SQLITE) {
      // Map 'success' status to 'complete' for SQLite service compatibility
      const sqliteUpdates: { status?: 'pending' | 'syncing' | 'complete' | 'failed'; lastError?: string } = {};
      if (updates.status) {
        sqliteUpdates.status = updates.status === 'success' ? 'complete' : updates.status as 'pending' | 'syncing' | 'failed';
      }
      if (updates.error) {
        sqliteUpdates.lastError = updates.error;
      }
      await sqliteSyncQueueDB.update(id, sqliteUpdates);
      return;
    }
    await syncQueueDB.update(id, updates);
  },

  /**
   * Remove a sync operation from the queue
   */
  async remove(id: string): Promise<void> {
    if (USE_SQLITE) {
      await sqliteSyncQueueDB.remove(id);
      return;
    }
    await syncQueueDB.remove(id);
  },

  /**
   * Clear all sync operations from the queue
   */
  async clear(): Promise<void> {
    if (USE_SQLITE) {
      await sqliteSyncQueueDB.clear();
      return;
    }
    await syncQueueDB.clear();
  },
};
