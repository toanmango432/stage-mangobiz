/**
 * Background Sync Service
 * LOCAL-FIRST: Processes sync queue without blocking UI
 *
 * Responsibilities:
 * - Process pending sync operations from IndexedDB queue
 * - Push changes to Supabase in the background
 * - Handle retries and error recovery
 * - Sync on interval, network reconnect, and app focus
 */

import { syncQueueDB } from '@/db/database';
import { supabase, withTimeout, CircuitBreakerOpenError, TimeoutError } from './supabase/client';
import {
  toClientInsert,
  toClientUpdate,
  toAppointmentInsert,
  toAppointmentUpdate,
  toTicketInsert,
  toTicketUpdate,
  toTransactionInsert,
  toTransactionUpdate,
  toStaffUpdate,
} from './supabase/adapters';
import type { Client, Appointment, Ticket, Transaction, Staff, SyncOperation } from '@/types';

// ==================== TYPES ====================

export interface SyncStats {
  pending: number;
  synced: number;
  failed: number;
  lastSyncAt: Date | null;
}

export interface BackgroundSyncState {
  isRunning: boolean;
  isSyncing: boolean;
  stats: SyncStats;
  error: string | null;
}

type SyncStateListener = (state: BackgroundSyncState) => void;

// ==================== CONSTANTS ====================

const SYNC_INTERVAL_MS = 30000; // 30 seconds
const BATCH_SIZE = 10;
const MAX_RETRY_ATTEMPTS = 5;

// Edge Function batch sync configuration
const USE_BATCH_SYNC = true; // Enable batch sync via Edge Function for scale
const BATCH_SYNC_ENDPOINT = '/functions/v1/batch-sync';

// ==================== SERVICE ====================

class BackgroundSyncService {
  private syncInterval: ReturnType<typeof setInterval> | null = null;
  private isSyncing = false;
  private isRunning = false;
  private listeners: Set<SyncStateListener> = new Set();
  private stats: SyncStats = {
    pending: 0,
    synced: 0,
    failed: 0,
    lastSyncAt: null,
  };
  private lastError: string | null = null;

  /**
   * Start the background sync service
   */
  start(): void {
    if (this.isRunning) {
      console.log('[BackgroundSync] Already running');
      return;
    }

    this.isRunning = true;
    console.log('[BackgroundSync] Starting...');

    // Initial sync
    this.processQueue();

    // Periodic sync
    this.syncInterval = setInterval(() => {
      this.processQueue();
    }, SYNC_INTERVAL_MS);

    // Sync on network reconnect
    if (typeof window !== 'undefined') {
      window.addEventListener('online', this.handleOnline);
      document.addEventListener('visibilitychange', this.handleVisibilityChange);
    }

    this.notifyListeners();
    console.log('[BackgroundSync] Started');
  }

  /**
   * Stop the background sync service
   */
  stop(): void {
    if (!this.isRunning) return;

    this.isRunning = false;

    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }

    if (typeof window !== 'undefined') {
      window.removeEventListener('online', this.handleOnline);
      document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    }

    this.notifyListeners();
    console.log('[BackgroundSync] Stopped');
  }

  /**
   * Trigger an immediate sync (non-blocking)
   */
  triggerSync(): void {
    if (!this.isSyncing) {
      queueMicrotask(() => this.processQueue());
    }
  }

  /**
   * Subscribe to sync state changes
   */
  subscribe(listener: SyncStateListener): () => void {
    this.listeners.add(listener);
    // Immediately notify with current state
    listener(this.getState());
    return () => this.listeners.delete(listener);
  }

  /**
   * Get current sync state
   */
  getState(): BackgroundSyncState {
    return {
      isRunning: this.isRunning,
      isSyncing: this.isSyncing,
      stats: { ...this.stats },
      error: this.lastError,
    };
  }

  /**
   * Get pending operation count
   */
  async getPendingCount(): Promise<number> {
    const pending = await syncQueueDB.getPending(1000);
    return pending.length;
  }

  // ==================== PRIVATE METHODS ====================

  private handleOnline = (): void => {
    console.log('[BackgroundSync] Network reconnected - syncing');
    this.processQueue();
  };

  private handleVisibilityChange = (): void => {
    if (document.visibilityState === 'visible') {
      console.log('[BackgroundSync] App focused - syncing');
      this.processQueue();
    }
  };

  private notifyListeners(): void {
    const state = this.getState();
    this.listeners.forEach(listener => listener(state));
  }

  /**
   * Process pending operations from the sync queue
   */
  private async processQueue(): Promise<void> {
    if (this.isSyncing || !navigator.onLine) {
      return;
    }

    this.isSyncing = true;
    this.notifyListeners();

    try {
      const pending = await syncQueueDB.getPending(BATCH_SIZE);
      this.stats.pending = pending.length;

      if (pending.length === 0) {
        return;
      }

      console.log(`[BackgroundSync] Processing ${pending.length} operations`);

      for (const operation of pending) {
        try {
          await this.processOperation(operation);
          await syncQueueDB.remove(operation.id);
          this.stats.synced++;
          console.log(`[BackgroundSync] Synced: ${operation.entity} ${operation.action} ${operation.entityId}`);
        } catch (error) {
          // Handle circuit breaker - stop processing this batch
          if (error instanceof CircuitBreakerOpenError) {
            console.warn('[BackgroundSync] Circuit breaker open, stopping batch');
            this.lastError = 'Circuit breaker open - will retry later';
            break; // Stop processing, try again later
          }

          // Handle timeout - don't increment retry count too aggressively
          if (error instanceof TimeoutError) {
            console.warn(`[BackgroundSync] Timeout: ${operation.entity} ${operation.action}`);
            this.lastError = 'Network timeout - will retry';
            // Don't increment attempt count for timeouts (network issue, not data issue)
            continue;
          }

          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          console.error(`[BackgroundSync] Failed: ${operation.entity} ${operation.action}`, errorMessage);

          // Increment retry count for data errors
          const newAttempts = (operation.attempts || 0) + 1;

          if (newAttempts >= MAX_RETRY_ATTEMPTS) {
            // Move to dead letter (just remove for now)
            console.error(`[BackgroundSync] Max retries reached, removing operation:`, operation);
            await syncQueueDB.remove(operation.id);
            this.stats.failed++;
          } else {
            // Update with error and retry count
            await syncQueueDB.update(operation.id, {
              attempts: newAttempts,
              error: errorMessage,
              lastAttemptAt: new Date(),
              status: 'pending', // Keep as pending for retry
            });
          }

          this.lastError = errorMessage;
        }
      }

      this.stats.lastSyncAt = new Date();

      // Check if there are more pending operations
      const remaining = await syncQueueDB.getPending(1);
      this.stats.pending = remaining.length > 0 ? remaining.length : 0;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('[BackgroundSync] Queue processing error:', errorMessage);
      this.lastError = errorMessage;
    } finally {
      this.isSyncing = false;
      this.notifyListeners();
    }
  }

  /**
   * Process a single sync operation
   */
  private async processOperation(operation: SyncOperation): Promise<void> {
    const { entity, action, entityId, payload } = operation;
    // Convert uppercase action to lowercase for switch
    const actionLower = action.toLowerCase() as 'create' | 'update' | 'delete';

    switch (entity) {
      case 'client':
        await this.syncClient(actionLower, entityId, payload as Client);
        break;
      case 'appointment':
        await this.syncAppointment(actionLower, entityId, payload as Appointment);
        break;
      case 'ticket':
        await this.syncTicket(actionLower, entityId, payload as Ticket);
        break;
      case 'transaction':
        await this.syncTransaction(actionLower, entityId, payload as Transaction);
        break;
      case 'staff':
        await this.syncStaff(actionLower, entityId, payload as Staff);
        break;
      default:
        console.warn(`[BackgroundSync] Unknown entity: ${entity}`);
    }
  }

  // ==================== ENTITY SYNC METHODS ====================

  private async syncClient(action: string, id: string, data: Client): Promise<void> {
    switch (action) {
      case 'create': {
        const insert = toClientInsert(data, data.storeId);
        const { error } = await withTimeout(async () =>
          await supabase.from('clients').upsert({ ...insert, id }, { onConflict: 'id' })
        );
        if (error) throw error;
        break;
      }
      case 'update': {
        const update = toClientUpdate(data);
        const { error } = await withTimeout(async () =>
          await supabase.from('clients').update(update).eq('id', id)
        );
        if (error) throw error;
        break;
      }
      case 'delete': {
        const { error } = await withTimeout(async () =>
          await supabase.from('clients').delete().eq('id', id)
        );
        if (error) throw error;
        break;
      }
    }
  }

  private async syncAppointment(action: string, id: string, data: Appointment): Promise<void> {
    switch (action) {
      case 'create': {
        const insert = toAppointmentInsert(data, data.storeId);
        const { error } = await withTimeout(async () =>
          await supabase.from('appointments').upsert({ ...insert, id }, { onConflict: 'id' })
        );
        if (error) throw error;
        break;
      }
      case 'update': {
        const update = toAppointmentUpdate(data);
        const { error } = await withTimeout(async () =>
          await supabase.from('appointments').update(update).eq('id', id)
        );
        if (error) throw error;
        break;
      }
      case 'delete': {
        const { error } = await withTimeout(async () =>
          await supabase.from('appointments').delete().eq('id', id)
        );
        if (error) throw error;
        break;
      }
    }
  }

  private async syncTicket(action: string, id: string, data: Ticket): Promise<void> {
    switch (action) {
      case 'create': {
        const insert = toTicketInsert(data, data.storeId);
        const { error } = await withTimeout(async () =>
          await supabase.from('tickets').upsert({ ...insert, id }, { onConflict: 'id' })
        );
        if (error) throw error;
        break;
      }
      case 'update': {
        const update = toTicketUpdate(data);
        const { error } = await withTimeout(async () =>
          await supabase.from('tickets').update(update).eq('id', id)
        );
        if (error) throw error;
        break;
      }
      case 'delete': {
        const { error } = await withTimeout(async () =>
          await supabase.from('tickets').delete().eq('id', id)
        );
        if (error) throw error;
        break;
      }
    }
  }

  private async syncTransaction(action: string, id: string, data: Transaction): Promise<void> {
    switch (action) {
      case 'create': {
        const insert = toTransactionInsert(data, data.storeId);
        const { error } = await withTimeout(async () =>
          await supabase.from('transactions').upsert({ ...insert, id }, { onConflict: 'id' })
        );
        if (error) throw error;
        break;
      }
      case 'update': {
        const update = toTransactionUpdate(data);
        const { error } = await withTimeout(async () =>
          await supabase.from('transactions').update(update).eq('id', id)
        );
        if (error) throw error;
        break;
      }
      case 'delete': {
        const { error } = await withTimeout(async () =>
          await supabase.from('transactions').delete().eq('id', id)
        );
        if (error) throw error;
        break;
      }
    }
  }

  private async syncStaff(action: string, id: string, data: Staff): Promise<void> {
    // Staff is mostly read-only from POS, but clock in/out needs sync
    if (action === 'update') {
      const update = toStaffUpdate(data);
      const { error } = await withTimeout(async () =>
        await supabase.from('staff').update(update).eq('id', id)
      );
      if (error) throw error;
    }
  }

  // ==================== BATCH SYNC VIA EDGE FUNCTION ====================

  /**
   * Process operations via Edge Function (batch sync)
   * More efficient at scale - single request for multiple operations
   */
  private async processBatchViaEdgeFunction(
    operations: SyncOperation[],
    storeId: string
  ): Promise<{ successful: string[]; failed: Map<string, string> }> {
    const successful: string[] = [];
    const failed = new Map<string, string>();

    // Get Supabase URL from the client config
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    if (!supabaseUrl) {
      throw new Error('Supabase URL not configured');
    }

    // Map operations to Edge Function format
    const batchOperations = operations.map(op => ({
      entity: this.mapEntityName(op.entity),
      action: op.action.toUpperCase() as 'CREATE' | 'UPDATE' | 'DELETE',
      entityId: op.entityId,
      data: this.convertPayloadToSnakeCase(op.entity, op.payload),
      // Extract version from payload if it exists (for conflict detection)
      localVersion: (op.payload as Record<string, unknown>)?.syncVersion as number | undefined,
    }));

    try {
      // Get auth token
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;

      const response = await fetch(`${supabaseUrl}${BATCH_SYNC_ENDPOINT}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken && { 'Authorization': `Bearer ${accessToken}` }),
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY || '',
        },
        body: JSON.stringify({
          storeId,
          operations: batchOperations,
          clientTimestamp: new Date().toISOString(),
        }),
      });

      // Handle rate limiting
      if (response.status === 429) {
        const data = await response.json();
        const retryAfter = data.retryAfter || 60;
        console.warn(`[BackgroundSync] Rate limited, retry after ${retryAfter}s`);
        throw new Error(`Rate limited - retry after ${retryAfter} seconds`);
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const result = await response.json();

      // Process results
      for (const opResult of result.results || []) {
        if (opResult.success) {
          successful.push(opResult.entityId);
        } else {
          failed.set(opResult.entityId, opResult.error || 'Unknown error');
          if (opResult.conflict) {
            console.warn(`[BackgroundSync] Conflict detected for ${opResult.entityId}`);
          }
        }
      }

      console.log(`[BackgroundSync] Batch sync: ${successful.length} success, ${failed.size} failed`);

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Batch sync failed';
      console.error('[BackgroundSync] Batch sync error:', errorMsg);

      // Mark all operations as failed
      for (const op of operations) {
        failed.set(op.entityId, errorMsg);
      }
    }

    return { successful, failed };
  }

  /**
   * Map entity name from app format to database format
   */
  private mapEntityName(entity: string): string {
    const entityMap: Record<string, string> = {
      client: 'clients',
      appointment: 'appointments',
      ticket: 'tickets',
      transaction: 'transactions',
      staff: 'staff',
      service: 'services',
    };
    return entityMap[entity] || entity;
  }

  /**
   * Convert payload to snake_case for Supabase
   */
  private convertPayloadToSnakeCase(entity: string, payload: unknown): Record<string, unknown> {
    if (!payload || typeof payload !== 'object') {
      return {};
    }

    // Use existing adapters for proper conversion
    switch (entity) {
      case 'client':
        return toClientInsert(payload as Client, (payload as Client).storeId);
      case 'appointment':
        return toAppointmentInsert(payload as Appointment, (payload as Appointment).storeId);
      case 'ticket':
        return toTicketInsert(payload as Ticket, (payload as Ticket).storeId);
      case 'transaction':
        return toTransactionInsert(payload as Transaction, (payload as Transaction).storeId);
      case 'staff':
        return toStaffUpdate(payload as Staff);
      default:
        // Generic camelCase to snake_case conversion
        const result: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(payload as Record<string, unknown>)) {
          const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
          result[snakeKey] = value;
        }
        return result;
    }
  }

  /**
   * Process queue using batch sync when enabled
   */
  async processQueueBatch(storeId: string): Promise<void> {
    if (this.isSyncing || !navigator.onLine) {
      return;
    }

    this.isSyncing = true;
    this.notifyListeners();

    try {
      const pending = await syncQueueDB.getPending(BATCH_SIZE);
      this.stats.pending = pending.length;

      if (pending.length === 0) {
        return;
      }

      console.log(`[BackgroundSync] Batch processing ${pending.length} operations`);

      const { successful, failed } = await this.processBatchViaEdgeFunction(pending, storeId);

      // Update sync queue based on results
      for (const op of pending) {
        if (successful.includes(op.entityId)) {
          await syncQueueDB.remove(op.id);
          this.stats.synced++;
        } else {
          const error = failed.get(op.entityId) || 'Unknown error';
          const newAttempts = (op.attempts || 0) + 1;

          if (newAttempts >= MAX_RETRY_ATTEMPTS) {
            console.error(`[BackgroundSync] Max retries for ${op.entityId}, removing`);
            await syncQueueDB.remove(op.id);
            this.stats.failed++;
          } else {
            await syncQueueDB.update(op.id, {
              attempts: newAttempts,
              error,
              lastAttemptAt: new Date(),
              status: 'pending',
            });
          }
        }
      }

      this.stats.lastSyncAt = new Date();
      this.lastError = failed.size > 0 ? `${failed.size} operations failed` : null;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('[BackgroundSync] Batch queue error:', errorMessage);
      this.lastError = errorMessage;
    } finally {
      this.isSyncing = false;
      this.notifyListeners();
    }
  }

  /**
   * Check if batch sync is available (Edge Function deployed)
   */
  async isBatchSyncAvailable(): Promise<boolean> {
    if (!USE_BATCH_SYNC) return false;

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    if (!supabaseUrl) return false;

    try {
      // Simple health check - just verify the endpoint exists
      const response = await fetch(`${supabaseUrl}${BATCH_SYNC_ENDPOINT}`, {
        method: 'OPTIONS',
        headers: {
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY || '',
        },
      });
      return response.ok || response.status === 204;
    } catch {
      return false;
    }
  }
}

// ==================== SINGLETON EXPORT ====================

export const backgroundSyncService = new BackgroundSyncService();
export default backgroundSyncService;
