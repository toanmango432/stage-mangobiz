import { db } from '../db/schema';

/**
 * Service for cleaning up old data to prevent infinite database growth
 */
export class DataCleanupService {
  private readonly APPOINTMENT_RETENTION_DAYS = 90; // Keep 3 months of appointments
  private readonly TICKET_RETENTION_DAYS = 180; // Keep 6 months of tickets
  private readonly TRANSACTION_RETENTION_DAYS = 365; // Keep 1 year of transactions
  private readonly SYNC_QUEUE_RETENTION_DAYS = 7; // Keep 1 week of completed sync operations

  /**
   * Clean old appointments from the database
   */
  async cleanOldAppointments(salonId: string): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.APPOINTMENT_RETENTION_DAYS);

    // Count records to be deleted
    const toDelete = await db.appointments
      .where('salonId')
      .equals(salonId)
      .and(apt => apt.scheduledStartTime < cutoffDate)
      .toArray();

    if (toDelete.length > 0) {
      // Delete in batches to avoid memory issues
      const batchSize = 100;
      for (let i = 0; i < toDelete.length; i += batchSize) {
        const batch = toDelete.slice(i, i + batchSize);
        await db.appointments.bulkDelete(batch.map(a => a.id));
      }

      console.log(`[Cleanup] Deleted ${toDelete.length} old appointments`);
    }

    return toDelete.length;
  }

  /**
   * Clean old tickets from the database
   */
  async cleanOldTickets(salonId: string): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.TICKET_RETENTION_DAYS);

    const toDelete = await db.tickets
      .where('salonId')
      .equals(salonId)
      .and(ticket => ticket.createdAt < cutoffDate && ticket.status === 'completed')
      .toArray();

    if (toDelete.length > 0) {
      await db.tickets.bulkDelete(toDelete.map(t => t.id));
      console.log(`[Cleanup] Deleted ${toDelete.length} old tickets`);
    }

    return toDelete.length;
  }

  /**
   * Clean old transactions from the database
   */
  async cleanOldTransactions(salonId: string): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.TRANSACTION_RETENTION_DAYS);

    const toDelete = await db.transactions
      .where('salonId')
      .equals(salonId)
      .and(txn => txn.createdAt < cutoffDate)
      .toArray();

    if (toDelete.length > 0) {
      await db.transactions.bulkDelete(toDelete.map(t => t.id));
      console.log(`[Cleanup] Deleted ${toDelete.length} old transactions`);
    }

    return toDelete.length;
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
    total: number;
  }> {
    console.log('[Cleanup] Starting data cleanup...');

    try {
      // Run all cleanup tasks in parallel
      const [appointments, tickets, transactions, syncQueue] = await Promise.all([
        this.cleanOldAppointments(salonId),
        this.cleanOldTickets(salonId),
        this.cleanOldTransactions(salonId),
        this.cleanSyncQueue(),
      ]);

      const total = appointments + tickets + transactions + syncQueue;

      if (total > 0) {
        console.log(`[Cleanup] Cleanup complete. Total records deleted: ${total}`);
      } else {
        console.log('[Cleanup] No old records to clean');
      }

      return {
        appointments,
        tickets,
        transactions,
        syncQueue,
        total,
      };
    } catch (error) {
      console.error('[Cleanup] Error during cleanup:', error);
      throw error;
    }
  }

  /**
   * Check database size and warn if approaching limits
   */
  async checkDatabaseSize(): Promise<{
    usage: number;
    quota: number;
    percentUsed: number;
    warning: boolean;
  }> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      const usage = estimate.usage || 0;
      const quota = estimate.quota || 0;
      const percentUsed = quota > 0 ? (usage / quota) * 100 : 0;

      // Warn if using more than 80% of quota
      const warning = percentUsed > 80;

      if (warning) {
        console.warn(`[Cleanup] Database storage warning: ${percentUsed.toFixed(1)}% used`);
      }

      return {
        usage,
        quota,
        percentUsed,
        warning,
      };
    }

    // Fallback if storage API not available
    return {
      usage: 0,
      quota: 0,
      percentUsed: 0,
      warning: false,
    };
  }

  /**
   * Schedule automatic cleanup to run daily
   */
  scheduleAutoCleanup(salonId: string): NodeJS.Timeout {
    // Run cleanup every 24 hours
    const interval = setInterval(async () => {
      console.log('[Cleanup] Running scheduled cleanup...');
      await this.runCleanup(salonId);
    }, 24 * 60 * 60 * 1000); // 24 hours

    // Also run immediately on startup
    this.runCleanup(salonId).catch(error => {
      console.error('[Cleanup] Initial cleanup failed:', error);
    });

    return interval;
  }
}

// Export singleton instance
export const dataCleanupService = new DataCleanupService();