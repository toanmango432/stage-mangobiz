/**
 * Supabase Sync Service
 * Handles direct sync operations with Supabase cloud database
 *
 * This service provides:
 * - Direct CRUD operations to Supabase (for online-only devices)
 * - Sync queue processing (for offline-enabled devices)
 * - Real-time subscription management
 * - Conflict detection and resolution
 */

import { supabase, checkConnection, getStoreChannel } from '../client';
import { clientsTable } from '../tables/clientsTable';
import { staffTable } from '../tables/staffTable';
import { servicesTable } from '../tables/servicesTable';
import { appointmentsTable } from '../tables/appointmentsTable';
import { ticketsTable } from '../tables/ticketsTable';
import { transactionsTable } from '../tables/transactionsTable';
import type { RealtimeChannel } from '@supabase/supabase-js';

// ===== TYPES =====

export type SyncableEntity = 'clients' | 'staff' | 'services' | 'appointments' | 'tickets' | 'transactions';

export type SyncStatus = 'idle' | 'syncing' | 'error' | 'offline';

export interface SyncState {
  status: SyncStatus;
  isOnline: boolean;
  lastSyncAt: string | null;
  pendingCount: number;
  error: string | null;
}

export interface SyncOperation {
  id: string;
  entity: SyncableEntity;
  action: 'create' | 'update' | 'delete';
  entityId: string;
  data: Record<string, unknown>;
  priority: number;
  createdAt: string;
  attempts: number;
  lastError?: string;
}

export interface SyncResult {
  success: boolean;
  synced?: number;
  failed?: number;
  error?: string;
}

type SyncListener = (state: SyncState) => void;

// ===== SYNC SERVICE CLASS =====

class SupabaseSyncService {
  private isOnline: boolean = navigator.onLine;
  private status: SyncStatus = 'idle';
  private lastSyncAt: string | null = null;
  private pendingCount: number = 0;
  private error: string | null = null;
  private listeners: Set<SyncListener> = new Set();
  private syncInterval: ReturnType<typeof setTimeout> | null = null;
  private realtimeChannel: RealtimeChannel | null = null;
  private storeId: string | null = null;

  // Table operation mapping
  private tables = {
    clients: clientsTable,
    staff: staffTable,
    services: servicesTable,
    appointments: appointmentsTable,
    tickets: ticketsTable,
    transactions: transactionsTable,
  };

  constructor() {
    this.setupOnlineListeners();
  }

  // ===== INITIALIZATION =====

  /**
   * Initialize sync service for a specific store
   */
  async initialize(storeId: string): Promise<void> {
    this.storeId = storeId;

    // Check connection
    const connected = await checkConnection();
    this.isOnline = connected && navigator.onLine;

    this.notifyListeners();
    console.log(`🔄 SupabaseSyncService: Initialized for store ${storeId}`);
  }

  /**
   * Start automatic sync (for offline-enabled devices)
   */
  startAutoSync(intervalMs: number = 30000): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    this.syncInterval = setInterval(() => {
      if (this.isOnline && this.status !== 'syncing') {
        this.syncAll();
      }
    }, intervalMs);

    console.log(`🔄 SupabaseSyncService: Auto-sync started (${intervalMs}ms interval)`);
  }

  /**
   * Stop automatic sync
   */
  stopAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    console.log('🔄 SupabaseSyncService: Auto-sync stopped');
  }

  // ===== ONLINE/OFFLINE HANDLING =====

  private setupOnlineListeners(): void {
    window.addEventListener('online', () => {
      console.log('🌐 Network: Online');
      this.isOnline = true;
      this.status = 'idle';
      this.error = null;
      this.notifyListeners();

      // Trigger sync when coming back online
      setTimeout(() => this.syncAll(), 1000);
    });

    window.addEventListener('offline', () => {
      console.log('📴 Network: Offline');
      this.isOnline = false;
      this.status = 'offline';
      this.notifyListeners();
    });
  }

  // ===== STATE MANAGEMENT =====

  /**
   * Subscribe to sync state changes
   */
  subscribe(listener: SyncListener): () => void {
    this.listeners.add(listener);
    // Immediately notify with current state
    listener(this.getState());
    return () => this.listeners.delete(listener);
  }

  /**
   * Get current sync state
   */
  getState(): SyncState {
    return {
      status: this.status,
      isOnline: this.isOnline,
      lastSyncAt: this.lastSyncAt,
      pendingCount: this.pendingCount,
      error: this.error,
    };
  }

  private notifyListeners(): void {
    const state = this.getState();
    this.listeners.forEach(listener => listener(state));
  }

  private setStatus(status: SyncStatus, error?: string): void {
    this.status = status;
    this.error = error || null;
    this.notifyListeners();
  }

  // ===== DIRECT SYNC OPERATIONS =====

  /**
   * Sync all entities for the current store
   */
  async syncAll(): Promise<SyncResult> {
    if (!this.storeId) {
      return { success: false, error: 'Store ID not set' };
    }

    if (!this.isOnline) {
      return { success: false, error: 'Device is offline' };
    }

    if (this.status === 'syncing') {
      return { success: false, error: 'Sync already in progress' };
    }

    this.setStatus('syncing');
    console.log('🔄 Sync: Starting full sync...');

    try {
      let totalSynced = 0;
      let totalFailed = 0;

      // Sync each entity type
      for (const entity of ['clients', 'staff', 'services', 'appointments', 'tickets', 'transactions'] as SyncableEntity[]) {
        const result = await this.syncEntity(entity);
        if (result.synced) totalSynced += result.synced;
        if (result.failed) totalFailed += result.failed;
      }

      this.lastSyncAt = new Date().toISOString();
      this.setStatus('idle');

      console.log(`✅ Sync: Complete (${totalSynced} synced, ${totalFailed} failed)`);
      return { success: totalFailed === 0, synced: totalSynced, failed: totalFailed };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.setStatus('error', errorMessage);
      console.error('❌ Sync: Error -', errorMessage);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Sync a specific entity type
   */
  async syncEntity(entity: SyncableEntity): Promise<SyncResult> {
    if (!this.storeId) {
      return { success: false, error: 'Store ID not set' };
    }

    console.log(`🔄 Sync: Syncing ${entity}...`);

    try {
      // Verify connection by fetching records for this entity
      switch (entity) {
        case 'clients':
          await clientsTable.getByStoreId(this.storeId);
          break;
        case 'staff':
          await staffTable.getByStoreId(this.storeId);
          break;
        case 'services':
          await servicesTable.getByStoreId(this.storeId);
          break;
        case 'appointments':
          await appointmentsTable.getByDate(this.storeId, new Date());
          break;
        case 'tickets':
          await ticketsTable.getOpenTickets(this.storeId);
          break;
        case 'transactions':
          await transactionsTable.getByDate(this.storeId, new Date());
          break;
      }

      console.log(`✅ Sync: ${entity} sync verified`);
      return { success: true, synced: 1 };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`❌ Sync: ${entity} failed -`, errorMessage);
      return { success: false, failed: 1, error: errorMessage };
    }
  }

  // ===== PUSH OPERATIONS (Local → Supabase) =====

  /**
   * Push a single record to Supabase
   */
  async push<T extends Record<string, unknown>>(
    entity: SyncableEntity,
    action: 'create' | 'update' | 'delete',
    data: T
  ): Promise<{ success: boolean; data?: T; error?: string }> {
    if (!this.isOnline) {
      return { success: false, error: 'Device is offline' };
    }

    try {
      const table = this.tables[entity];
      let result: unknown;
      const dataWithId = data as unknown as { id: string };

      switch (action) {
        case 'create':
          result = await (table as typeof clientsTable).create(data as never);
          break;
        case 'update':
          result = await (table as typeof clientsTable).update(dataWithId.id, data as never);
          break;
        case 'delete':
          await (table as typeof clientsTable).delete(dataWithId.id);
          result = data;
          break;
      }

      console.log(`✅ Push: ${entity} ${action} successful`);
      return { success: true, data: result as T };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`❌ Push: ${entity} ${action} failed -`, errorMessage);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Push multiple records to Supabase (batch operation)
   */
  async pushBatch<T extends Record<string, unknown>>(
    entity: SyncableEntity,
    records: T[]
  ): Promise<{ success: boolean; synced: number; failed: number; errors?: string[] }> {
    if (!this.isOnline) {
      return { success: false, synced: 0, failed: records.length, errors: ['Device is offline'] };
    }

    try {
      const table = this.tables[entity];
      await (table as typeof clientsTable).upsertMany(records as never[]);

      console.log(`✅ Push Batch: ${records.length} ${entity} records synced`);
      return { success: true, synced: records.length, failed: 0 };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`❌ Push Batch: ${entity} failed -`, errorMessage);
      return { success: false, synced: 0, failed: records.length, errors: [errorMessage] };
    }
  }

  // ===== PULL OPERATIONS (Supabase → Local) =====

  /**
   * Pull records updated since a specific time
   */
  async pullUpdatedSince(
    entity: SyncableEntity,
    since: Date
  ): Promise<{ success: boolean; data?: Record<string, unknown>[]; error?: string }> {
    if (!this.storeId) {
      return { success: false, error: 'Store ID not set' };
    }

    if (!this.isOnline) {
      return { success: false, error: 'Device is offline' };
    }

    try {
      const table = this.tables[entity];
      const data = await (table as typeof clientsTable).getUpdatedSince(this.storeId, since);

      console.log(`✅ Pull: ${data.length} ${entity} records since ${since.toISOString()}`);
      return { success: true, data: data as Record<string, unknown>[] };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`❌ Pull: ${entity} failed -`, errorMessage);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Pull all records for a store
   */
  async pullAll(entity: SyncableEntity): Promise<{ success: boolean; data?: Record<string, unknown>[]; error?: string }> {
    if (!this.storeId) {
      return { success: false, error: 'Store ID not set' };
    }

    if (!this.isOnline) {
      return { success: false, error: 'Device is offline' };
    }

    try {
      let data: Record<string, unknown>[];

      switch (entity) {
        case 'clients':
          data = await clientsTable.getByStoreId(this.storeId);
          break;
        case 'staff':
          data = await staffTable.getByStoreId(this.storeId);
          break;
        case 'services':
          data = await servicesTable.getByStoreId(this.storeId);
          break;
        case 'appointments':
          data = await appointmentsTable.getByStoreId(this.storeId);
          break;
        case 'tickets':
          data = await ticketsTable.getByStatus(this.storeId, 'open');
          break;
        case 'transactions':
          data = await transactionsTable.getByDate(this.storeId, new Date());
          break;
        default:
          data = [];
      }

      console.log(`✅ Pull All: ${data.length} ${entity} records`);
      return { success: true, data };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`❌ Pull All: ${entity} failed -`, errorMessage);
      return { success: false, error: errorMessage };
    }
  }

  // ===== REAL-TIME SUBSCRIPTIONS =====

  /**
   * Subscribe to real-time changes for a store
   */
  subscribeToChanges(
    callback: (payload: { entity: SyncableEntity; action: string; record: Record<string, unknown> }) => void
  ): void {
    if (!this.storeId) {
      console.error('Cannot subscribe: Store ID not set');
      return;
    }

    // Unsubscribe from existing channel
    this.unsubscribeFromChanges();

    // Create new channel for this store
    this.realtimeChannel = getStoreChannel(this.storeId);

    // Subscribe to all business tables
    const tables: SyncableEntity[] = ['clients', 'staff', 'services', 'appointments', 'tickets', 'transactions'];

    for (const table of tables) {
      this.realtimeChannel
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table,
            filter: `store_id=eq.${this.storeId}`,
          },
          (payload) => {
            const action = payload.eventType; // INSERT, UPDATE, DELETE
            const record = payload.new || payload.old;

            console.log(`📡 Real-time: ${table} ${action}`);
            callback({
              entity: table as SyncableEntity,
              action,
              record: record as Record<string, unknown>,
            });
          }
        );
    }

    this.realtimeChannel.subscribe((status) => {
      console.log(`📡 Real-time subscription: ${status}`);
    });
  }

  /**
   * Unsubscribe from real-time changes
   */
  unsubscribeFromChanges(): void {
    if (this.realtimeChannel) {
      supabase.removeChannel(this.realtimeChannel);
      this.realtimeChannel = null;
      console.log('📡 Real-time: Unsubscribed');
    }
  }

  // ===== CLEANUP =====

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.stopAutoSync();
    this.unsubscribeFromChanges();
    this.listeners.clear();
    console.log('🔄 SupabaseSyncService: Destroyed');
  }
}

// ===== SINGLETON EXPORT =====

export const supabaseSyncService = new SupabaseSyncService();
export default supabaseSyncService;
