/**
 * Sync Service
 * Handles offline/online synchronization with backend
 */

import {
  db,
  addToSyncQueue,
  getPendingSyncItems,
  removeSyncQueueItem,
  updateSyncQueueItem,
  SyncQueueEntry,
} from './db';

class SyncService {
  private isOnline: boolean = navigator.onLine;
  private isSyncing: boolean = false;
  private syncInterval: NodeJS.Timeout | null = null;
  private listeners: Set<(status: SyncStatus) => void> = new Set();

  constructor() {
    this.setupOnlineListener();
    this.startAutoSync();
  }

  // ===== ONLINE/OFFLINE DETECTION =====

  private setupOnlineListener() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.notifyListeners({ isOnline: true, isSyncing: false });
      this.syncNow();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.notifyListeners({ isOnline: false, isSyncing: false });
    });
  }

  // ===== SYNC STATUS MANAGEMENT =====

  subscribe(listener: (status: SyncStatus) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(status: SyncStatus) {
    this.listeners.forEach(listener => listener(status));
  }

  getStatus(): SyncStatus {
    return {
      isOnline: this.isOnline,
      isSyncing: this.isSyncing,
    };
  }

  // ===== AUTO SYNC =====

  private startAutoSync() {
    // Sync every 30 seconds when online
    this.syncInterval = setInterval(() => {
      if (this.isOnline && !this.isSyncing) {
        this.syncNow();
      }
    }, 30000);
  }

  stopAutoSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  // ===== QUEUE OPERATIONS =====

  async queueCreate(entity: 'appointment' | 'client' | 'service', data: any, priority: number = 3) {
    const entry: Omit<SyncQueueEntry, 'id'> = {
      action: 'create',
      entity,
      entityId: data.id,
      data,
      priority,
      timestamp: Date.now(),
      retryCount: 0,
    };

    await addToSyncQueue(entry);
    
    // Try to sync immediately if online
    if (this.isOnline) {
      this.syncNow();
    }
  }

  async queueUpdate(entity: 'appointment' | 'client' | 'service', data: any, priority: number = 3) {
    const entry: Omit<SyncQueueEntry, 'id'> = {
      action: 'update',
      entity,
      entityId: data.id,
      data,
      priority,
      timestamp: Date.now(),
      retryCount: 0,
    };

    await addToSyncQueue(entry);
    
    if (this.isOnline) {
      this.syncNow();
    }
  }

  async queueDelete(entity: 'appointment' | 'client' | 'service', entityId: string, priority: number = 3) {
    const entry: Omit<SyncQueueEntry, 'id'> = {
      action: 'delete',
      entity,
      entityId,
      data: { id: entityId },
      priority,
      timestamp: Date.now(),
      retryCount: 0,
    };

    await addToSyncQueue(entry);
    
    if (this.isOnline) {
      this.syncNow();
    }
  }

  // ===== SYNC EXECUTION =====

  async syncNow(): Promise<SyncResult> {
    if (!this.isOnline) {
      return { success: false, error: 'Device is offline' };
    }

    if (this.isSyncing) {
      return { success: false, error: 'Sync already in progress' };
    }

    this.isSyncing = true;
    this.notifyListeners({ isOnline: true, isSyncing: true });

    try {
      const pendingItems = await getPendingSyncItems();
      
      if (pendingItems.length === 0) {
        this.isSyncing = false;
        this.notifyListeners({ isOnline: true, isSyncing: false });
        return { success: true, synced: 0 };
      }

      let syncedCount = 0;
      const errors: string[] = [];

      for (const item of pendingItems) {
        try {
          await this.syncItem(item);
          await removeSyncQueueItem(item.id!);
          syncedCount++;
        } catch (error) {
          console.error('Sync error for item:', item, error);
          errors.push(`${item.entity} ${item.action} failed`);
          
          // Update retry count
          await updateSyncQueueItem(item.id!, {
            retryCount: item.retryCount + 1,
            lastError: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      this.isSyncing = false;
      this.notifyListeners({ isOnline: true, isSyncing: false });

      return {
        success: errors.length === 0,
        synced: syncedCount,
        errors: errors.length > 0 ? errors : undefined,
      };
    } catch (error) {
      this.isSyncing = false;
      this.notifyListeners({ isOnline: true, isSyncing: false });
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Sync failed',
      };
    }
  }

  private async syncItem(item: SyncQueueEntry): Promise<void> {
    // TODO: Replace with actual API calls
    console.log('Syncing item:', item);

    const endpoint = this.getEndpoint(item.entity, item.action);
    const method = this.getMethod(item.action);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 100));

    // In production, this would be:
    // const response = await fetch(endpoint, {
    //   method,
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(item.data),
    // });
    // 
    // if (!response.ok) {
    //   throw new Error(`HTTP ${response.status}`);
    // }
  }

  private getEndpoint(entity: string, action: string): string {
    const baseUrl = '/api/v1';
    
    switch (entity) {
      case 'appointment':
        return `${baseUrl}/appointments`;
      case 'client':
        return `${baseUrl}/clients`;
      case 'service':
        return `${baseUrl}/services`;
      default:
        return baseUrl;
    }
  }

  private getMethod(action: string): string {
    switch (action) {
      case 'create':
        return 'POST';
      case 'update':
        return 'PUT';
      case 'delete':
        return 'DELETE';
      default:
        return 'GET';
    }
  }
}

// ===== TYPES =====

export interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
}

export interface SyncResult {
  success: boolean;
  synced?: number;
  error?: string;
  errors?: string[];
}

// ===== SINGLETON INSTANCE =====
export const syncService = new SyncService();
export default syncService;
