import { db } from '../db/schema';
import { storageMonitorService } from './storageMonitorService';

/**
 * Service for cleaning up old data to prevent infinite database growth
 *
 * CRITICAL: Only deletes records that are synced to cloud (syncStatus === 'synced')
 * to prevent data loss when offline.
 */
export class DataCleanupService {
  // Retention periods optimized for high-volume salons (1000+ tickets/day)
  private readonly APPOINTMENT_RETENTION_DAYS = 60; // Keep 2 months (reduced from 90)
  private readonly TICKET_RETENTION_DAYS = 30; // Keep 1 month (reduced from 180 - cloud has backup)
  private readonly TRANSACTION_RETENTION_DAYS = 30; // Keep 1 month (reduced from 365 - cloud has backup)
  private readonly SYNC_QUEUE_RETENTION_DAYS = 7; // Keep 1 week of completed sync operations
  private readonly STORAGE_WARNING_THRESHOLD = 70; // Warn at 70% usage
  private readonly STORAGE_CRITICAL_THRESHOLD = 90; // Emergency cleanup at 90%

  /**
   * Clean old appointments from the database
   * SAFETY: Only deletes records that are synced to cloud
   */
  async cleanOldAppointments(salonId: string): Promise<{ deleted: number; skipped: number }> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.APPOINTMENT_RETENTION_DAYS);
    const cutoffIso = cutoffDate.toISOString();

    // Get candidates for deletion
    const candidates = await db.appointments
      .where('salonId')
      .equals(salonId)
      .and(apt => apt.scheduledStartTime < cutoffIso)
      .toArray();

    // CRITICAL: Only delete records that are synced to cloud
    const toDelete = candidates.filter(apt => apt.syncStatus === 'synced');
    const skipped = candidates.length - toDelete.length;

    if (toDelete.length > 0) {
      // Delete in batches to avoid memory issues
      const batchSize = 100;
      for (let i = 0; i < toDelete.length; i += batchSize) {
        const batch = toDelete.slice(i, i + batchSize);
        await db.appointments.bulkDelete(batch.map(a => a.id));
      }

      console.log(`[Cleanup] Deleted ${toDelete.length} old appointments (${skipped} skipped - not synced)`);
    }

    return { deleted: toDelete.length, skipped };
  }

  /**
   * Clean old tickets from the database
   * SAFETY: Only deletes completed tickets that are synced to cloud
   */
  async cleanOldTickets(salonId: string): Promise<{ deleted: number; skipped: number }> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.TICKET_RETENTION_DAYS);

    // Get candidates for deletion (completed tickets only)
    const candidates = await db.tickets
      .where('salonId')
      .equals(salonId)
      .and(ticket => new Date(ticket.createdAt) < cutoffDate && ticket.status === 'completed')
      .toArray();

    // CRITICAL: Only delete records that are synced to cloud
    const toDelete = candidates.filter(ticket => ticket.syncStatus === 'synced');
    const skipped = candidates.length - toDelete.length;

    if (toDelete.length > 0) {
      // Delete in batches
      const batchSize = 100;
      for (let i = 0; i < toDelete.length; i += batchSize) {
        const batch = toDelete.slice(i, i + batchSize);
        await db.tickets.bulkDelete(batch.map(t => t.id));
      }
      console.log(`[Cleanup] Deleted ${toDelete.length} old tickets (${skipped} skipped - not synced)`);
    }

    return { deleted: toDelete.length, skipped };
  }

  /**
   * Clean old transactions from the database
   * SAFETY: Only deletes transactions that are synced to cloud
   */
  async cleanOldTransactions(salonId: string): Promise<{ deleted: number; skipped: number }> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.TRANSACTION_RETENTION_DAYS);
    const cutoffIso = cutoffDate.toISOString();

    // Get candidates for deletion
    const candidates = await db.transactions
      .where('salonId')
      .equals(salonId)
      .and(txn => txn.createdAt < cutoffIso)
      .toArray();

    // CRITICAL: Only delete records that are synced to cloud
    const toDelete = candidates.filter(txn => txn.syncStatus === 'synced');
    const skipped = candidates.length - toDelete.length;

    if (toDelete.length > 0) {
      // Delete in batches
      const batchSize = 100;
      for (let i = 0; i < toDelete.length; i += batchSize) {
        const batch = toDelete.slice(i, i + batchSize);
        await db.transactions.bulkDelete(batch.map(t => t.id));
      }
      console.log(`[Cleanup] Deleted ${toDelete.length} old transactions (${skipped} skipped - not synced)`);
    }

    return { deleted: toDelete.length, skipped };
  }

  /**
   * Clean completed sync operations from the queue
   */
  async cleanSyncQueue(): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.SYNC_QUEUE_RETENTION_DAYS);

    // Delete completed operations older than retention period
    const completedCount = await db.syncQueue
      .where('status')
      .equals('synced')
      .and(op => op.createdAt < cutoffDate)
      .delete();

    // Delete failed operations with max attempts (5+)
    const failedCount = await db.syncQueue
      .where('attempts')
      .aboveOrEqual(5)
      .delete();

    const totalDeleted = completedCount + failedCount;
    if (totalDeleted > 0) {
      console.log(`[Cleanup] Deleted ${completedCount} completed and ${failedCount} failed sync operations`);
    }

    return totalDeleted;
  }

  /**
   * Run all cleanup tasks
   */
  async runCleanup(salonId: string): Promise<{
    appointments: number;
    tickets: number;
    transactions: number;
    syncQueue: number;
    skipped: number;
    total: number;
  }> {
    console.log('[Cleanup] Starting data cleanup...');

    try {
      // Run all cleanup tasks in parallel
      const [appointmentResult, ticketResult, transactionResult, syncQueue] = await Promise.all([
        this.cleanOldAppointments(salonId),
        this.cleanOldTickets(salonId),
        this.cleanOldTransactions(salonId),
        this.cleanSyncQueue(),
      ]);

      const total = appointmentResult.deleted + ticketResult.deleted + transactionResult.deleted + syncQueue;
      const skipped = appointmentResult.skipped + ticketResult.skipped + transactionResult.skipped;

      if (total > 0 || skipped > 0) {
        console.log(`[Cleanup] Cleanup complete. Deleted: ${total}, Skipped (not synced): ${skipped}`);
      } else {
        console.log('[Cleanup] No old records to clean');
      }

      return {
        appointments: appointmentResult.deleted,
        tickets: ticketResult.deleted,
        transactions: transactionResult.deleted,
        syncQueue,
        skipped,
        total,
      };
    } catch (error) {
      console.error('[Cleanup] Error during cleanup:', error);
      throw error;
    }
  }

  /**
   * Emergency cleanup - more aggressive, for when storage is critical (>90%)
   * Deletes synced data older than 7 days instead of normal retention period
   */
  async emergencyCleanup(salonId: string): Promise<number> {
    console.warn('[Cleanup] Running EMERGENCY cleanup - storage critical!');

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const cutoffIso = sevenDaysAgo.toISOString();

    let totalDeleted = 0;

    // Emergency cleanup for tickets
    const oldTickets = await db.tickets
      .where('salonId')
      .equals(salonId)
      .and(t => new Date(t.createdAt) < sevenDaysAgo && t.syncStatus === 'synced')
      .toArray();

    if (oldTickets.length > 0) {
      await db.tickets.bulkDelete(oldTickets.map(t => t.id));
      totalDeleted += oldTickets.length;
      console.log(`[Cleanup] Emergency: Deleted ${oldTickets.length} tickets`);
    }

    // Emergency cleanup for transactions
    const oldTransactions = await db.transactions
      .where('salonId')
      .equals(salonId)
      .and(t => t.createdAt < cutoffIso && t.syncStatus === 'synced')
      .toArray();

    if (oldTransactions.length > 0) {
      await db.transactions.bulkDelete(oldTransactions.map(t => t.id));
      totalDeleted += oldTransactions.length;
      console.log(`[Cleanup] Emergency: Deleted ${oldTransactions.length} transactions`);
    }

    // Emergency cleanup for appointments
    const oldAppointments = await db.appointments
      .where('salonId')
      .equals(salonId)
      .and(a => a.scheduledStartTime < cutoffIso && a.syncStatus === 'synced')
      .toArray();

    if (oldAppointments.length > 0) {
      await db.appointments.bulkDelete(oldAppointments.map(a => a.id));
      totalDeleted += oldAppointments.length;
      console.log(`[Cleanup] Emergency: Deleted ${oldAppointments.length} appointments`);
    }

    console.warn(`[Cleanup] Emergency cleanup complete: ${totalDeleted} records deleted`);
    return totalDeleted;
  }

  /**
   * Check database size and warn if approaching limits
   * Uses storageMonitorService for comprehensive metrics
   */
  async checkDatabaseSize(): Promise<{
    usage: number;
    quota: number;
    percentUsed: number;
    warning: boolean;
    critical: boolean;
  }> {
    try {
      const metrics = await storageMonitorService.getStorageMetrics();

      const warning = metrics.usagePercent >= this.STORAGE_WARNING_THRESHOLD;
      const critical = metrics.usagePercent >= this.STORAGE_CRITICAL_THRESHOLD;

      if (critical) {
        console.error(`[Cleanup] CRITICAL: Storage at ${metrics.usagePercent.toFixed(1)}%!`);
      } else if (warning) {
        console.warn(`[Cleanup] WARNING: Storage at ${metrics.usagePercent.toFixed(1)}%`);
      }

      return {
        usage: metrics.usedBytes,
        quota: metrics.quotaBytes,
        percentUsed: metrics.usagePercent,
        warning,
        critical,
      };
    } catch (error) {
      console.warn('[Cleanup] Could not check storage size:', error);
      return {
        usage: 0,
        quota: 0,
        percentUsed: 0,
        warning: false,
        critical: false,
      };
    }
  }

  /**
   * Schedule automatic cleanup to run daily
   * Also starts storage monitoring with emergency cleanup trigger
   */
  scheduleAutoCleanup(salonId: string): NodeJS.Timeout {
    // Run cleanup every 24 hours
    const interval = setInterval(async () => {
      console.log('[Cleanup] Running scheduled cleanup...');
      await this.runCleanup(salonId);

      // Check if storage is critical after cleanup
      const sizeInfo = await this.checkDatabaseSize();
      if (sizeInfo.critical) {
        await this.emergencyCleanup(salonId);
      }
    }, 24 * 60 * 60 * 1000); // 24 hours

    // Run immediately on startup
    this.runCleanupWithStorageCheck(salonId).catch(error => {
      console.error('[Cleanup] Initial cleanup failed:', error);
    });

    // Start storage monitoring (check every 5 minutes)
    storageMonitorService.startMonitoring(5 * 60 * 1000, async (metrics) => {
      if (metrics.warningLevel === 'critical') {
        console.error('[Cleanup] Storage monitor triggered emergency cleanup!');
        await this.emergencyCleanup(salonId);
      }
    });

    return interval;
  }

  /**
   * Run cleanup with storage check - triggers emergency cleanup if needed
   */
  private async runCleanupWithStorageCheck(salonId: string): Promise<void> {
    // First check storage
    const sizeInfo = await this.checkDatabaseSize();

    // If critical, run emergency cleanup first
    if (sizeInfo.critical) {
      await this.emergencyCleanup(salonId);
    }

    // Then run normal cleanup
    await this.runCleanup(salonId);

    // Check storage again after cleanup
    const afterCleanup = await this.checkDatabaseSize();
    if (afterCleanup.critical) {
      console.error('[Cleanup] Storage still critical after cleanup! Manual intervention may be needed.');
    }
  }

  /**
   * Stop storage monitoring (call on app unmount)
   */
  stopMonitoring(): void {
    storageMonitorService.stopMonitoring();
  }
}

// Export singleton instance
export const dataCleanupService = new DataCleanupService();