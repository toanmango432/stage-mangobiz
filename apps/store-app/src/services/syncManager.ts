import { syncQueueDB, settingsDB } from '../db/database';
import { syncAPI } from '../api/endpoints';
import { store } from '../store';
import {
  setSyncing,
  setPendingOperations,
  setSyncComplete,
  setSyncError,
  enableSync,
  disableSync,
  selectSyncEnabled,
} from '../store/slices/syncSlice';
import { selectIsOfflineEnabled, selectDeviceMode, selectStoreId } from '../store/slices/authSlice';

// Type definitions for sync operations
interface SyncChange {
  entity: 'appointment' | 'ticket' | 'staff' | 'client' | 'transaction' | 'giftcard' | 'giftcard_transaction';
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  data: {
    id: string;
    updatedAt?: string;
    createdAt?: string;
    lastModifiedBy?: string;
    syncStatus?: string;
    [key: string]: unknown;
  };
}

interface SyncableData {
  id: string;
  updatedAt?: Date | string;
  syncStatus?: string;
  [key: string]: unknown;
}

class SyncManager {
  private isSyncing = false;
  private syncInterval: NodeJS.Timeout | null = null;
  private readonly SYNC_INTERVAL = 120000; // 2 minutes (was 30 seconds - reduced to fix performance)
  private readonly MAX_BATCH_SIZE = 50;

  constructor() {
    // Suppress unused warning for future-use method
    void this._handleConflict;
  }

  /**
   * Check if sync is allowed based on device mode
   */
  private isSyncAllowed(): boolean {
    const state = store.getState();
    const isOfflineEnabled = selectIsOfflineEnabled(state);
    const syncEnabled = selectSyncEnabled(state);
    const mode = selectDeviceMode(state);

    // Only allow sync for offline-enabled devices
    return isOfflineEnabled && syncEnabled && mode === 'offline-enabled';
  }

  /**
   * Start automatic sync process
   * Only starts if device is in offline-enabled mode
   */
  start() {
    // Check if offline mode is enabled
    const state = store.getState();
    const isOfflineEnabled = selectIsOfflineEnabled(state);
    const mode = selectDeviceMode(state);

    if (!isOfflineEnabled || mode !== 'offline-enabled') {
      console.log('🔄 Sync Manager: Skipped (online-only mode)');
      store.dispatch(disableSync('Device is in online-only mode'));
      return;
    }

    console.log('🔄 Sync Manager: Starting (offline-enabled mode)...');
    store.dispatch(enableSync());

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
  stop(reason?: string) {
    console.log('🔄 Sync Manager: Stopping...');

    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }

    window.removeEventListener('online', this.handleOnline);
    window.removeEventListener('offline', this.handleOffline);

    if (reason) {
      store.dispatch(disableSync(reason));
    }
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

    // Check if sync is allowed (offline-enabled mode only)
    if (!this.isSyncAllowed()) {
      console.log('🔄 Sync: Skipped (sync not enabled for this device)');
      return;
    }

    try {
      this.isSyncing = true;
      store.dispatch(setSyncing(true));

      console.log('🔄 Sync: Starting sync process...');

      // Get salon ID from Redux (synced by storeAuthManager)
      const storeId = selectStoreId(store.getState());
      if (!storeId) {
        console.warn('⚠️ Sync: No salon ID found in auth state, skipping sync');
        return;
      }

      // Step 1: Push local changes
      await this.pushLocalChanges(storeId);

      // Step 2: Pull remote changes
      await this.pullRemoteChanges(storeId);

      // Step 3: Update sync status
      store.dispatch(setSyncComplete());
      console.log('✅ Sync: Complete');

    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown sync error';
      console.error('❌ Sync: Error -', message);
      store.dispatch(setSyncError(message));
    } finally {
      this.isSyncing = false;
      store.dispatch(setSyncing(false));
    }
  }

  /**
   * Push local changes to server
   */
  private async pushLocalChanges(_storeId: string) {
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
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : 'Unknown batch error';
          console.error('❌ Sync Push: Batch failed -', message);

          // Update failed operations
          for (const op of batch) {
            await syncQueueDB.update(op.id!, {
              attempts: op.attempts + 1,
              lastAttemptAt: new Date(),
              error: message,
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
  private async pullRemoteChanges(storeId: string) {
    try {
      // Get last sync timestamp
      const lastSyncAt = await settingsDB.get('last_sync_at');

      console.log(`🔄 Sync Pull: Fetching changes since ${lastSyncAt || 'beginning'}`);

      // Fetch changes from server
      const response = await syncAPI.pull(storeId, lastSyncAt);

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
  private async applyRemoteChange(change: SyncChange) {
    try {
      const { entity, action, data } = change;

      // Import database functions dynamically
      const { appointmentsDB, ticketsDB, staffDB, clientsDB, transactionsDB, giftCardsDB } = await import('../db/database');

      // Helper to safely get date for comparison
      const getDateValue = (value: string | Date | undefined): number => {
        if (!value) return 0;
        return new Date(value.toString()).getTime();
      };

      // Helper to create sync update payload
      const createSyncPayload = () => ({
        ...data,
        syncStatus: 'synced' as const,
      });

      switch (entity) {
        case 'appointment':
          if (action === 'CREATE' || action === 'UPDATE') {
            // Check for conflicts
            const existing = await appointmentsDB.getById(data.id);
            const existingTime = getDateValue(existing?.updatedAt);
            const remoteTime = getDateValue(data.updatedAt);
            if (existing && existingTime > remoteTime) {
              console.warn('⚠️ Conflict detected for appointment:', data.id);
              // For now, just log - could implement conflict resolution
            } else {
              // Apply change - cast to expected type
              await appointmentsDB.update(data.id, createSyncPayload() as Parameters<typeof appointmentsDB.update>[1], data.lastModifiedBy ?? 'system');
            }
          } else if (action === 'DELETE') {
            await appointmentsDB.delete(data.id);
          }
          break;

        case 'ticket':
          if (action === 'CREATE' || action === 'UPDATE') {
            const existing = await ticketsDB.getById(data.id);
            const existingTime = getDateValue(existing?.updatedAt);
            const remoteTime = getDateValue(data.updatedAt);
            if (existing && existingTime > remoteTime) {
              console.warn('⚠️ Conflict detected for ticket:', data.id);
            } else {
              await ticketsDB.update(data.id, createSyncPayload() as Parameters<typeof ticketsDB.update>[1], data.lastModifiedBy || 'system');
            }
          }
          break;

        case 'staff':
          if (action === 'UPDATE') {
            await staffDB.update(data.id, createSyncPayload() as Parameters<typeof staffDB.update>[1]);
          }
          break;

        case 'client':
          if (action === 'CREATE' || action === 'UPDATE') {
            await clientsDB.update(data.id, createSyncPayload() as Parameters<typeof clientsDB.update>[1]);
          }
          break;

        case 'transaction':
          if (action === 'CREATE' || action === 'UPDATE') {
            // Check for conflicts - for transactions, server always wins (financial data integrity)
            const existing = await transactionsDB.getById(data.id);
            const existingTime = getDateValue((existing as SyncableData | undefined)?.updatedAt);
            const remoteTime = getDateValue(data.updatedAt || data.createdAt);
            if (existing && existingTime > remoteTime) {
              console.warn('⚠️ Transaction conflict detected:', data.id, '- Server wins for financial data');
            }
            // Always apply server version for transactions (server-wins strategy)
            if (action === 'CREATE') {
              // Add new transaction to local DB
              await transactionsDB.addRaw(createSyncPayload() as Parameters<typeof transactionsDB.addRaw>[0]);
            } else {
              // Update existing transaction
              await transactionsDB.update(data.id, createSyncPayload() as Parameters<typeof transactionsDB.update>[1]);
            }
          } else if (action === 'DELETE') {
            await transactionsDB.delete(data.id);
          }
          break;

        case 'giftcard':
          if (action === 'CREATE' || action === 'UPDATE') {
            // Gift cards use server-wins strategy (financial data)
            const existingGiftCard = await giftCardsDB.getById(data.id);
            const existingGcTime = getDateValue((existingGiftCard as SyncableData | undefined)?.updatedAt);
            const remoteGcTime = getDateValue(data.updatedAt || data.createdAt);
            if (existingGiftCard && existingGcTime > remoteGcTime) {
              console.warn('⚠️ Gift card conflict detected:', data.id, '- Server wins for financial data');
            }
            // Always apply server version (server-wins strategy)
            await giftCardsDB.upsert(createSyncPayload() as Parameters<typeof giftCardsDB.upsert>[0]);
          } else if (action === 'DELETE') {
            await giftCardsDB.delete(data.id);
          }
          break;

        case 'giftcard_transaction':
          if (action === 'CREATE' || action === 'UPDATE') {
            // Gift card transactions use server-wins (financial data, immutable)
            await giftCardsDB.upsertTransaction(createSyncPayload() as Parameters<typeof giftCardsDB.upsertTransaction>[0]);
          }
          // Note: Gift card transactions are immutable, no DELETE case
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
   * Note: Currently unused but kept for future conflict resolution implementation
   */
  private async _handleConflict(
    entity: string,
    entityId: string,
    localData: SyncableData,
    remoteData: SyncableData
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
    const remoteTime = remoteData.updatedAt ? new Date(remoteData.updatedAt.toString()).getTime() : 0;
    const localTime = localData.updatedAt ? new Date(localData.updatedAt.toString()).getTime() : 0;
    if (remoteTime > localTime) {
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
