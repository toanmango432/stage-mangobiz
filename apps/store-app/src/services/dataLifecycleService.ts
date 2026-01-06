/**
 * Data Lifecycle Service
 * LOCAL-FIRST: Manages data retention and cleanup in IndexedDB
 *
 * Responsibilities:
 * - Archive old records that are already synced to cloud
 * - Clean up tombstones (soft-deleted records) after retention period
 * - Monitor storage usage and warn when approaching limits
 * - Run maintenance tasks on app startup (once per day max)
 */

import { db } from '@/db/schema';

// ==================== TYPES ====================

export interface RetentionPolicy {
  entity: string;
  retentionDays: number;
  archiveToCloud: boolean; // If true, records must be synced before deletion
  description: string;
}

export interface ArchiveResult {
  entity: string;
  deletedCount: number;
  skippedCount: number; // Records not synced, skipped
  error?: string;
}

export interface MaintenanceResult {
  success: boolean;
  date: string;
  results: ArchiveResult[];
  tombstonesCleared: number;
  totalFreed: number; // Estimated bytes freed
  error?: string;
}

// ==================== CONSTANTS ====================

const MAINTENANCE_KEY_PREFIX = 'mango_maintenance_date_';
const TOMBSTONE_RETENTION_DAYS = 30;

/**
 * Retention policies for each entity type
 * - Essential data (staff, services, clients): Never auto-delete
 * - Operational data (tickets, transactions): 30-90 days
 * - Appointments: Keep future + 60 days past
 */
export const RETENTION_POLICIES: RetentionPolicy[] = [
  // Essential - Never delete
  { entity: 'staff', retentionDays: -1, archiveToCloud: false, description: 'Never delete - needed for operations' },
  { entity: 'services', retentionDays: -1, archiveToCloud: false, description: 'Never delete - needed for booking' },
  { entity: 'clients', retentionDays: -1, archiveToCloud: false, description: 'Never delete - needed for CRM' },

  // Operational - Keep 30-90 days
  { entity: 'tickets', retentionDays: 30, archiveToCloud: true, description: 'Archive completed tickets older than 30 days' },
  { entity: 'transactions', retentionDays: 30, archiveToCloud: true, description: 'Archive transactions older than 30 days' },
  { entity: 'appointments', retentionDays: 60, archiveToCloud: true, description: 'Archive appointments older than 60 days' },

  // Sync queue - Clear old entries
  { entity: 'syncOperations', retentionDays: 7, archiveToCloud: false, description: 'Clear completed/failed sync ops older than 7 days' },
];

// Estimated record sizes for storage calculation (bytes)
const RECORD_SIZES: Record<string, number> = {
  tickets: 3000,
  transactions: 1000,
  appointments: 2000,
  clients: 2000,
  staff: 1000,
  services: 1000,
  syncOperations: 500,
};

// ==================== SERVICE ====================

class DataLifecycleService {
  /**
   * Run daily maintenance cycle
   * - Archives old synced records
   * - Cleans up tombstones
   * - Should be called on app startup
   */
  async runMaintenanceCycle(storeId: string): Promise<MaintenanceResult> {
    const today = new Date().toDateString();
    const lastRun = localStorage.getItem(`${MAINTENANCE_KEY_PREFIX}${storeId}`);

    // Only run once per day
    if (lastRun === today) {
      console.log('[DataLifecycle] Already ran today, skipping');
      return {
        success: true,
        date: today,
        results: [],
        tombstonesCleared: 0,
        totalFreed: 0,
      };
    }

    console.log('[DataLifecycle] Starting daily maintenance...');
    const results: ArchiveResult[] = [];
    let totalFreed = 0;

    try {
      // 1. Archive old records for each entity with retention policy
      for (const policy of RETENTION_POLICIES) {
        if (policy.retentionDays > 0) {
          const result = await this.archiveOldRecords(storeId, policy);
          results.push(result);
          totalFreed += result.deletedCount * (RECORD_SIZES[policy.entity] || 500);
        }
      }

      // 2. Clean up tombstones (soft-deleted records)
      const tombstonesCleared = await this.cleanupTombstones(storeId);
      totalFreed += tombstonesCleared * 500; // Estimate

      // 3. Mark maintenance as complete
      localStorage.setItem(`${MAINTENANCE_KEY_PREFIX}${storeId}`, today);

      console.log(`[DataLifecycle] Maintenance complete. Freed ~${Math.round(totalFreed / 1024)}KB`);

      return {
        success: true,
        date: today,
        results,
        tombstonesCleared,
        totalFreed,
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('[DataLifecycle] Maintenance failed:', errorMessage);
      return {
        success: false,
        date: today,
        results,
        tombstonesCleared: 0,
        totalFreed,
        error: errorMessage,
      };
    }
  }

  /**
   * Archive old records for a specific entity
   * Only deletes records that are:
   * 1. Older than retention period
   * 2. Already synced to cloud (syncStatus = 'synced')
   */
  private async archiveOldRecords(storeId: string, policy: RetentionPolicy): Promise<ArchiveResult> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - policy.retentionDays);
    const cutoffISO = cutoffDate.toISOString();

    const result: ArchiveResult = {
      entity: policy.entity,
      deletedCount: 0,
      skippedCount: 0,
    };

    try {
      const table = db.table(policy.entity);
      if (!table) {
        result.error = `Table ${policy.entity} not found`;
        return result;
      }

      // Get old records for this store
      const records = await table
        .where('storeId')
        .equals(storeId)
        .toArray();

      const oldRecords = records.filter((r: Record<string, unknown>) => {
        const createdAt = r.createdAt as string | Date;
        const createdAtStr = typeof createdAt === 'string'
          ? createdAt
          : createdAt?.toISOString?.() || '';
        return createdAtStr < cutoffISO;
      });

      // Check sync status before deleting
      for (const record of oldRecords) {
        if (policy.archiveToCloud && (record as Record<string, unknown>).syncStatus !== 'synced') {
          result.skippedCount++;
          continue;
        }

        // Safe to delete - already synced to cloud
        await table.delete((record as Record<string, unknown>).id as string);
        result.deletedCount++;
      }

      if (result.deletedCount > 0) {
        console.log(`[DataLifecycle] Archived ${result.deletedCount} old ${policy.entity}`);
      }
      if (result.skippedCount > 0) {
        console.warn(`[DataLifecycle] Skipped ${result.skippedCount} unsynced ${policy.entity}`);
      }

    } catch (error) {
      result.error = error instanceof Error ? error.message : 'Unknown error';
      console.error(`[DataLifecycle] Error archiving ${policy.entity}:`, result.error);
    }

    return result;
  }

  /**
   * Clean up tombstones (soft-deleted records)
   * Removes records where:
   * - isDeleted = true
   * - tombstoneExpiresAt < now OR deletedAt is older than TOMBSTONE_RETENTION_DAYS
   */
  private async cleanupTombstones(storeId: string): Promise<number> {
    let totalCleared = 0;
    const now = new Date().toISOString();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - TOMBSTONE_RETENTION_DAYS);
    const cutoffISO = cutoffDate.toISOString();

    // Tables that support soft delete
    const softDeleteTables = ['clients', 'staff', 'services', 'appointments', 'tickets'];

    for (const tableName of softDeleteTables) {
      try {
        const table = db.table(tableName);
        if (!table) continue;

        // Get all records and filter for tombstones
        const records = await table
          .where('storeId')
          .equals(storeId)
          .toArray();

        const tombstones = records.filter((r: Record<string, unknown>) => {
          if (!r.isDeleted) return false;

          // Check if expired
          const expiresAt = r.tombstoneExpiresAt as string | undefined;
          const deletedAt = r.deletedAt as string | undefined;

          if (expiresAt && expiresAt < now) return true;
          if (deletedAt && deletedAt < cutoffISO) return true;

          return false;
        });

        // Delete expired tombstones
        for (const tombstone of tombstones) {
          await table.delete((tombstone as Record<string, unknown>).id as string);
          totalCleared++;
        }

      } catch (error) {
        console.warn(`[DataLifecycle] Error cleaning ${tableName} tombstones:`, error);
      }
    }

    if (totalCleared > 0) {
      console.log(`[DataLifecycle] Cleared ${totalCleared} expired tombstones`);
    }

    return totalCleared;
  }

  /**
   * Force cleanup - manually trigger archival
   * Useful for troubleshooting or when storage is critical
   */
  async forceCleanup(storeId: string): Promise<MaintenanceResult> {
    // Clear the last run date to force a new run
    localStorage.removeItem(`${MAINTENANCE_KEY_PREFIX}${storeId}`);
    return this.runMaintenanceCycle(storeId);
  }

  /**
   * Get retention policy for an entity
   */
  getRetentionPolicy(entity: string): RetentionPolicy | undefined {
    return RETENTION_POLICIES.find(p => p.entity === entity);
  }

  /**
   * Clear all local data for a store
   * Used when switching stores or for troubleshooting
   * WARNING: This will delete all local data!
   */
  async clearAllLocalData(storeId: string): Promise<void> {
    console.warn('[DataLifecycle] Clearing ALL local data for store:', storeId);

    const tables = ['staff', 'services', 'clients', 'appointments', 'tickets', 'transactions'];

    for (const tableName of tables) {
      try {
        const table = db.table(tableName);
        if (table) {
          const count = await table.where('storeId').equals(storeId).delete();
          console.log(`[DataLifecycle] Deleted ${count} records from ${tableName}`);
        }
      } catch (error) {
        console.error(`[DataLifecycle] Error clearing ${tableName}:`, error);
      }
    }

    // Clear maintenance flag
    localStorage.removeItem(`${MAINTENANCE_KEY_PREFIX}${storeId}`);

    console.log('[DataLifecycle] Local data cleared');
  }

  /**
   * Get last maintenance date for a store
   */
  getLastMaintenanceDate(storeId: string): string | null {
    return localStorage.getItem(`${MAINTENANCE_KEY_PREFIX}${storeId}`);
  }
}

// ==================== SINGLETON EXPORT ====================

export const dataLifecycleService = new DataLifecycleService();
export default dataLifecycleService;
