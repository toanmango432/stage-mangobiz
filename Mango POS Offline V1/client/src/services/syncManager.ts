import { syncQueueDB, settingsDB } from '../db/database';
import { syncAPI } from '../api/endpoints';
import { store } from '../store';
import { setSyncing, setPendingOperations, setSyncComplete, setSyncError } from '../store/slices/syncSlice';

class SyncManager {
  private isSyncing = false;
  private syncInterval: NodeJS.Timeout | null = null;
  private readonly SYNC_INTERVAL = 30000; // 30 seconds
  private readonly MAX_BATCH_SIZE = 50;

  /**
   * Start automatic sync process
   */
  start() {
    console.log('🔄 Sync Manager: Starting...');
    
    // Initial sync
    this.sync();

    // Set up periodic sync
    this.syncInterval = setInterval(() => {
      this.sync();
    }, this.SYNC_INTERVAL);

    // Listen for online/offline events
    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);
  }

  /**
   * Stop automatic sync process
   */
  stop() {
    console.log('🔄 Sync Manager: Stopping...');
    
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }

    window.removeEventListener('online', this.handleOnline);
    window.removeEventListener('offline', this.handleOffline);
  }

  /**
   * Handle online event
   */
  private handleOnline = () => {
    console.log('🌐 Network: Online');
    store.dispatch(setSyncing(false));
    // Trigger immediate sync when coming back online
    setTimeout(() => this.sync(), 1000);
  };

  /**
   * Handle offline event
   */
  private handleOffline = () => {
    console.log('📴 Network: Offline');
    store.dispatch(setSyncing(false));
  };

  /**
   * Main sync function - Push local changes and pull remote changes
   */
  async sync() {
    // Don't sync if already syncing or offline
    if (this.isSyncing || !navigator.onLine) {
      return;
    }

    try {
      this.isSyncing = true;
      store.dispatch(setSyncing(true));

      console.log('🔄 Sync: Starting sync process...');

      // Get salon ID
      const salonId = await settingsDB.get('salon_id');
      if (!salonId) {
        console.warn('⚠️ Sync: No salon ID found, skipping sync');
        return;
      }

      // Step 1: Push local changes
      await this.pushLocalChanges(salonId);

      // Step 2: Pull remote changes
      await this.pullRemoteChanges(salonId);

      // Step 3: Update sync status
      store.dispatch(setSyncComplete());
      console.log('✅ Sync: Complete');

    } catch (error: any) {
      console.error('❌ Sync: Error -', error.message);
      store.dispatch(setSyncError(error.message));
    } finally {
      this.isSyncing = false;
      store.dispatch(setSyncing(false));
    }
  }

  /**
   * Push local changes to server
   */
  private async pushLocalChanges(salonId: string) {
    try {
      // Get pending operations from sync queue (sorted by priority)
      const pendingOps = await syncQueueDB.getPending();
      
      if (pendingOps.length === 0) {
        console.log('✅ Sync Push: No pending operations');
        return;
      }

      console.log(`🔄 Sync Push: ${pendingOps.length} operations to push`);
      store.dispatch(setPendingOperations(pendingOps.length));

      // Process in batches
      const batches = this.createBatches(pendingOps, this.MAX_BATCH_SIZE);

      for (const batch of batches) {
        try {
          // Send batch to server
          const response = await syncAPI.push(batch);

          // Mark operations as synced
          for (const op of batch) {
            if (response.success) {
              await syncQueueDB.remove(op.id!);
            } else {
              // Increment retry count
              await syncQueueDB.update(op.id!, {
                attempts: op.attempts + 1,
                lastAttemptAt: new Date(),
                error: response.error,
              });
            }
          }

          console.log(`✅ Sync Push: Batch of ${batch.length} operations synced`);
        } catch (error: any) {
          console.error('❌ Sync Push: Batch failed -', error.message);
          
          // Update failed operations
          for (const op of batch) {
            await syncQueueDB.update(op.id!, {
              attempts: op.attempts + 1,
              lastAttemptAt: new Date(),
              error: error.message,
            });
          }
        }
      }

      // Update pending count
      const remainingOps = await syncQueueDB.getPending();
      store.dispatch(setPendingOperations(remainingOps.length));

    } catch (error) {
      console.error('❌ Sync Push: Error -', error);
      throw error;
    }
  }

  /**
   * Pull remote changes from server
   */
  private async pullRemoteChanges(salonId: string) {
    try {
      // Get last sync timestamp
      const lastSyncAt = await settingsDB.get('last_sync_at');

      console.log(`🔄 Sync Pull: Fetching changes since ${lastSyncAt || 'beginning'}`);

      // Fetch changes from server
      const response = await syncAPI.pull(salonId, lastSyncAt);

      if (!response.changes || response.changes.length === 0) {
        console.log('✅ Sync Pull: No remote changes');
        return;
      }

      console.log(`🔄 Sync Pull: ${response.changes.length} changes to apply`);

      // Apply changes to local database
      for (const change of response.changes) {
        await this.applyRemoteChange(change);
      }

      // Update last sync timestamp
      await settingsDB.set('last_sync_at', new Date().toISOString());

      console.log('✅ Sync Pull: Complete');

    } catch (error) {
      console.error('❌ Sync Pull: Error -', error);
      throw error;
    }
  }

  /**
   * Apply a remote change to local database
   */
  private async applyRemoteChange(change: any) {
    try {
      const { entity, action, data } = change;

      // Import database functions dynamically
      const { appointmentsDB, ticketsDB, staffDB, clientsDB } = await import('../db/database');

      switch (entity) {
        case 'appointment':
          if (action === 'CREATE' || action === 'UPDATE') {
            // Check for conflicts
            const existing = await appointmentsDB.getById(data.id);
            if (existing && existing.updatedAt > data.updatedAt) {
              console.warn('⚠️ Conflict detected for appointment:', data.id);
              await this.handleConflict('appointment', data.id, existing, data);
            } else {
              // Apply change
              await appointmentsDB.update(data.id, { ...data, syncStatus: 'synced' }, data.lastModifiedBy);
            }
          } else if (action === 'DELETE') {
            await appointmentsDB.delete(data.id);
          }
          break;

        case 'ticket':
          if (action === 'CREATE' || action === 'UPDATE') {
            const existing = await ticketsDB.getById(data.id);
            if (existing && existing.updatedAt > data.updatedAt) {
              console.warn('⚠️ Conflict detected for ticket:', data.id);
              await this.handleConflict('ticket', data.id, existing, data);
            } else {
              await ticketsDB.update(data.id, { ...data, syncStatus: 'synced' }, data.lastModifiedBy);
            }
          }
          break;

        case 'staff':
          if (action === 'UPDATE') {
            await staffDB.update(data.id, { ...data, syncStatus: 'synced' });
          }
          break;

        case 'client':
          if (action === 'CREATE' || action === 'UPDATE') {
            await clientsDB.update(data.id, { ...data, syncStatus: 'synced' });
          }
          break;

        default:
          console.warn('⚠️ Unknown entity type:', entity);
      }

    } catch (error) {
      console.error('❌ Failed to apply remote change:', error);
    }
  }

  /**
   * Handle sync conflict
   */
  private async handleConflict(
    entity: string,
    entityId: string,
    localData: any,
    remoteData: any
  ) {
    console.log(`⚠️ Conflict Resolution: ${entity} ${entityId}`);

    // Conflict resolution strategy: Last-Write-Wins (LWW)
    // For transactions, always prefer server version (server-wins)
    
    if (entity === 'transaction') {
      // Server wins for transactions (financial data)
      console.log('💰 Transaction conflict: Server wins');
      return remoteData;
    }

    // For other entities, use last-write-wins
    if (remoteData.updatedAt > localData.updatedAt) {
      console.log('🌐 Conflict: Remote wins (newer)');
      return remoteData;
    } else {
      console.log('💻 Conflict: Local wins (newer)');
      // Mark as conflict for manual review
      localData.syncStatus = 'conflict';
      return localData;
    }
  }

  /**
   * Create batches from operations
   */
  private createBatches<T>(items: T[], batchSize: number): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    return batches;
  }

  /**
   * Force sync now
   */
  async syncNow() {
    console.log('🔄 Sync: Manual sync triggered');
    await this.sync();
  }

  /**
   * Get sync status
   */
  async getStatus() {
    const pendingOps = await syncQueueDB.getPending();
    const lastSyncAt = await settingsDB.get('last_sync_at');
    
    return {
      pendingOperations: pendingOps.length,
      lastSyncAt,
      isOnline: navigator.onLine,
      isSyncing: this.isSyncing,
    };
  }
}

// Export singleton instance
export const syncManager = new SyncManager();

export default syncManager;
