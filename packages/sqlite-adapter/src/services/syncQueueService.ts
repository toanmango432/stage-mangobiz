/**
 * SyncQueueSQLiteService - Offline sync operation queue
 *
 * Manages the queue of operations that need to be synchronized with the server
 * when the device comes back online. Operations are prioritized and processed
 * in order with retry support.
 *
 * Priority levels:
 * - 1: High (critical operations like payments)
 * - 2: Medium (standard CRUD operations)
 * - 3: Low (background sync, analytics)
 *
 * Status flow: pending → syncing → complete | failed
 *
 * @module sqlite-adapter/services/syncQueueService
 */

import type { SQLiteAdapter } from '../types';
import { safeParseJSON, toJSONString } from '../utils';

// ==================== TYPES ====================

/**
 * Sync operation priority
 */
export type SyncPriority = 1 | 2 | 3;

/**
 * Sync operation status
 */
export type SyncStatus = 'pending' | 'syncing' | 'complete' | 'failed';

/**
 * Entity types that can be synced
 */
export type SyncEntity =
  | 'client'
  | 'ticket'
  | 'appointment'
  | 'transaction'
  | 'staff'
  | 'service'
  | 'setting'
  | string; // Allow custom entity types

/**
 * CRUD operation types
 */
export type SyncOperation = 'create' | 'update' | 'delete';

/**
 * Sync queue operation entry
 */
export interface SyncQueueOperation {
  /** Unique operation ID */
  id: string;
  /** Entity type being synced */
  entity: SyncEntity;
  /** ID of the entity being synced */
  entityId: string;
  /** Operation type */
  operation: SyncOperation;
  /** Operation payload (entity data) */
  data: Record<string, unknown>;
  /** Priority level (1=high, 2=medium, 3=low) */
  priority: SyncPriority;
  /** Current status */
  status: SyncStatus;
  /** Error message if failed */
  errorMessage: string | null;
  /** Number of retry attempts */
  retryCount: number;
  /** Maximum retry attempts before marking as failed */
  maxRetries: number;
  /** When operation was queued */
  createdAt: string;
  /** When operation was last updated */
  updatedAt: string | null;
  /** When operation completed (success or failed) */
  completedAt: string | null;
}

/**
 * Input for adding a new sync operation
 */
export interface AddSyncOperationInput {
  /** Entity type being synced */
  entity: SyncEntity;
  /** ID of the entity being synced */
  entityId: string;
  /** Operation type */
  operation: SyncOperation;
  /** Operation payload (entity data) */
  data: Record<string, unknown>;
  /** Priority level (default: 2) */
  priority?: SyncPriority;
  /** Maximum retry attempts (default: 3) */
  maxRetries?: number;
}

/**
 * Raw row from SQLite sync_queue table
 */
interface SyncQueueRow {
  id: string;
  entity: string;
  entity_id: string;
  operation: string;
  data: string;
  priority: number;
  status: string;
  error_message: string | null;
  retry_count: number;
  max_retries: number;
  created_at: string;
  updated_at: string | null;
  completed_at: string | null;
}

// ==================== SERVICE CLASS ====================

/**
 * SQLite service for offline sync queue management
 *
 * @example
 * const queue = new SyncQueueSQLiteService(db);
 *
 * // Add an operation to the queue
 * await queue.add({
 *   entity: 'client',
 *   entityId: 'client-123',
 *   operation: 'create',
 *   data: { name: 'John Doe', phone: '555-1234' },
 *   priority: 1 // high priority
 * });
 *
 * // Get next operations to sync
 * const pending = await queue.getNext(10);
 *
 * // Mark operation as complete
 * await queue.markComplete('op-123');
 */
export class SyncQueueSQLiteService {
  protected db: SQLiteAdapter;

  constructor(db: SQLiteAdapter) {
    this.db = db;
  }

  // ==================== CONVERSION METHODS ====================

  /**
   * Convert SQLite row to SyncQueueOperation object
   */
  private rowToOperation(row: SyncQueueRow): SyncQueueOperation {
    return {
      id: row.id,
      entity: row.entity as SyncEntity,
      entityId: row.entity_id,
      operation: row.operation as SyncOperation,
      data: safeParseJSON<Record<string, unknown>>(row.data, {}),
      priority: row.priority as SyncPriority,
      status: row.status as SyncStatus,
      errorMessage: row.error_message,
      retryCount: row.retry_count,
      maxRetries: row.max_retries,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      completedAt: row.completed_at,
    };
  }

  /**
   * Generate a unique operation ID
   */
  private generateId(): string {
    return `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // ==================== CRUD OPERATIONS ====================

  /**
   * Add a new operation to the sync queue
   *
   * @param input - Operation details
   * @returns The created operation
   *
   * @example
   * await queue.add({
   *   entity: 'client',
   *   entityId: 'client-123',
   *   operation: 'create',
   *   data: { name: 'John Doe' },
   *   priority: 1 // high priority
   * });
   */
  async add(input: AddSyncOperationInput): Promise<SyncQueueOperation> {
    const id = this.generateId();
    const now = new Date().toISOString();
    const priority = input.priority ?? 2;
    const maxRetries = input.maxRetries ?? 3;

    const sql = `
      INSERT INTO sync_queue (
        id, entity, entity_id, operation, data,
        priority, status, error_message, retry_count, max_retries,
        created_at, updated_at, completed_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await this.db.run(sql, [
      id,
      input.entity,
      input.entityId,
      input.operation,
      toJSONString(input.data),
      priority,
      'pending',
      null,
      0,
      maxRetries,
      now,
      null,
      null,
    ]);

    return {
      id,
      entity: input.entity,
      entityId: input.entityId,
      operation: input.operation,
      data: input.data,
      priority,
      status: 'pending',
      errorMessage: null,
      retryCount: 0,
      maxRetries,
      createdAt: now,
      updatedAt: null,
      completedAt: null,
    };
  }

  /**
   * Get next pending operations by priority then creation time
   *
   * Returns operations in order: highest priority (1) first,
   * then by oldest creation time (FIFO within priority).
   *
   * @param limit - Maximum number of operations to return
   * @returns Array of pending operations
   *
   * @example
   * // Get next 10 operations to process
   * const pending = await queue.getNext(10);
   */
  async getNext(limit: number = 10): Promise<SyncQueueOperation[]> {
    const sql = `
      SELECT * FROM sync_queue
      WHERE status = 'pending'
      ORDER BY priority ASC, created_at ASC
      LIMIT ?
    `;

    const rows = await this.db.all<SyncQueueRow>(sql, [limit]);
    return rows.map((row) => this.rowToOperation(row));
  }

  /**
   * Mark an operation as complete (successfully synced)
   *
   * @param id - Operation ID
   * @returns true if operation was updated, false if not found
   */
  async markComplete(id: string): Promise<boolean> {
    const now = new Date().toISOString();
    const sql = `
      UPDATE sync_queue
      SET status = 'complete', updated_at = ?, completed_at = ?
      WHERE id = ?
    `;

    const result = await this.db.run(sql, [now, now, id]);
    return result.changes > 0;
  }

  /**
   * Mark an operation as failed with error message
   *
   * Increments retry count. If retry count >= max_retries,
   * marks as 'failed'. Otherwise keeps as 'pending' for retry.
   *
   * @param id - Operation ID
   * @param errorMessage - Error message describing the failure
   * @returns true if operation was updated, false if not found
   */
  async markFailed(id: string, errorMessage: string): Promise<boolean> {
    const now = new Date().toISOString();

    // First get current retry count
    const getOp = await this.db.get<SyncQueueRow>(
      'SELECT * FROM sync_queue WHERE id = ?',
      [id]
    );

    if (!getOp) {
      return false;
    }

    const newRetryCount = getOp.retry_count + 1;
    const shouldFail = newRetryCount >= getOp.max_retries;
    const newStatus: SyncStatus = shouldFail ? 'failed' : 'pending';

    const sql = `
      UPDATE sync_queue
      SET
        status = ?,
        error_message = ?,
        retry_count = ?,
        updated_at = ?,
        completed_at = ?
      WHERE id = ?
    `;

    const result = await this.db.run(sql, [
      newStatus,
      errorMessage,
      newRetryCount,
      now,
      shouldFail ? now : null,
      id,
    ]);

    return result.changes > 0;
  }

  /**
   * Get all pending operations
   *
   * @returns Array of all pending operations ordered by priority then created_at
   */
  async getPending(): Promise<SyncQueueOperation[]> {
    const sql = `
      SELECT * FROM sync_queue
      WHERE status = 'pending'
      ORDER BY priority ASC, created_at ASC
    `;

    const rows = await this.db.all<SyncQueueRow>(sql, []);
    return rows.map((row) => this.rowToOperation(row));
  }

  /**
   * Clear all completed operations from the queue
   *
   * @returns Number of operations deleted
   */
  async clearCompleted(): Promise<number> {
    const sql = "DELETE FROM sync_queue WHERE status = 'complete'";
    const result = await this.db.run(sql, []);
    return result.changes;
  }

  // ==================== ADDITIONAL QUERY METHODS ====================

  /**
   * Get operation by ID
   *
   * @param id - Operation ID
   * @returns Operation or undefined if not found
   */
  async getById(id: string): Promise<SyncQueueOperation | undefined> {
    const sql = 'SELECT * FROM sync_queue WHERE id = ?';
    const row = await this.db.get<SyncQueueRow>(sql, [id]);

    if (!row) {
      return undefined;
    }

    return this.rowToOperation(row);
  }

  /**
   * Get operations by entity
   *
   * @param entity - Entity type
   * @returns Array of operations for the entity
   */
  async getByEntity(entity: SyncEntity): Promise<SyncQueueOperation[]> {
    const sql = `
      SELECT * FROM sync_queue
      WHERE entity = ?
      ORDER BY priority ASC, created_at ASC
    `;

    const rows = await this.db.all<SyncQueueRow>(sql, [entity]);
    return rows.map((row) => this.rowToOperation(row));
  }

  /**
   * Get operations by entity ID
   *
   * Useful for finding all pending operations for a specific record.
   *
   * @param entityId - Entity ID
   * @returns Array of operations for the entity ID
   */
  async getByEntityId(entityId: string): Promise<SyncQueueOperation[]> {
    const sql = `
      SELECT * FROM sync_queue
      WHERE entity_id = ?
      ORDER BY created_at ASC
    `;

    const rows = await this.db.all<SyncQueueRow>(sql, [entityId]);
    return rows.map((row) => this.rowToOperation(row));
  }

  /**
   * Get operations by status
   *
   * @param status - Status to filter by
   * @returns Array of operations with the given status
   */
  async getByStatus(status: SyncStatus): Promise<SyncQueueOperation[]> {
    const sql = `
      SELECT * FROM sync_queue
      WHERE status = ?
      ORDER BY priority ASC, created_at ASC
    `;

    const rows = await this.db.all<SyncQueueRow>(sql, [status]);
    return rows.map((row) => this.rowToOperation(row));
  }

  /**
   * Get failed operations
   *
   * @returns Array of all failed operations
   */
  async getFailed(): Promise<SyncQueueOperation[]> {
    return this.getByStatus('failed');
  }

  /**
   * Get currently syncing operations
   *
   * @returns Array of operations currently being synced
   */
  async getSyncing(): Promise<SyncQueueOperation[]> {
    return this.getByStatus('syncing');
  }

  /**
   * Mark an operation as syncing (in progress)
   *
   * @param id - Operation ID
   * @returns true if operation was updated, false if not found
   */
  async markSyncing(id: string): Promise<boolean> {
    const now = new Date().toISOString();
    const sql = `
      UPDATE sync_queue
      SET status = 'syncing', updated_at = ?
      WHERE id = ? AND status = 'pending'
    `;

    const result = await this.db.run(sql, [now, id]);
    return result.changes > 0;
  }

  /**
   * Reset a failed operation to pending for retry
   *
   * @param id - Operation ID
   * @returns true if operation was reset, false if not found or not failed
   */
  async resetForRetry(id: string): Promise<boolean> {
    const now = new Date().toISOString();
    const sql = `
      UPDATE sync_queue
      SET
        status = 'pending',
        error_message = NULL,
        retry_count = 0,
        updated_at = ?,
        completed_at = NULL
      WHERE id = ? AND status = 'failed'
    `;

    const result = await this.db.run(sql, [now, id]);
    return result.changes > 0;
  }

  /**
   * Delete an operation from the queue
   *
   * @param id - Operation ID
   * @returns true if operation was deleted, false if not found
   */
  async delete(id: string): Promise<boolean> {
    const sql = 'DELETE FROM sync_queue WHERE id = ?';
    const result = await this.db.run(sql, [id]);
    return result.changes > 0;
  }

  /**
   * Count operations by status
   *
   * @returns Object with counts for each status
   */
  async countByStatus(): Promise<Record<SyncStatus, number>> {
    const sql = `
      SELECT status, COUNT(*) as count
      FROM sync_queue
      GROUP BY status
    `;

    const rows = await this.db.all<{ status: string; count: number }>(sql, []);

    // Initialize with all statuses at 0
    const result: Record<SyncStatus, number> = {
      pending: 0,
      syncing: 0,
      complete: 0,
      failed: 0,
    };

    for (const row of rows) {
      const status = row.status as SyncStatus;
      if (status in result) {
        result[status] = row.count;
      }
    }

    return result;
  }

  /**
   * Count pending operations
   *
   * @returns Number of pending operations
   */
  async countPending(): Promise<number> {
    const sql = "SELECT COUNT(*) as count FROM sync_queue WHERE status = 'pending'";
    const result = await this.db.get<{ count: number }>(sql, []);
    return result?.count ?? 0;
  }

  /**
   * Count total operations in queue
   *
   * @returns Total number of operations
   */
  async count(): Promise<number> {
    const sql = 'SELECT COUNT(*) as count FROM sync_queue';
    const result = await this.db.get<{ count: number }>(sql, []);
    return result?.count ?? 0;
  }

  /**
   * Clear all operations from the queue
   *
   * WARNING: This deletes all operations including pending ones.
   * Use with caution.
   *
   * @returns Number of operations deleted
   */
  async clear(): Promise<number> {
    const sql = 'DELETE FROM sync_queue';
    const result = await this.db.run(sql, []);
    return result.changes;
  }

  /**
   * Clear all failed operations
   *
   * @returns Number of operations deleted
   */
  async clearFailed(): Promise<number> {
    const sql = "DELETE FROM sync_queue WHERE status = 'failed'";
    const result = await this.db.run(sql, []);
    return result.changes;
  }

  /**
   * Get queue statistics
   *
   * @returns Queue statistics including counts and oldest pending time
   */
  async getStats(): Promise<{
    total: number;
    pending: number;
    syncing: number;
    complete: number;
    failed: number;
    oldestPendingAt: string | null;
  }> {
    const counts = await this.countByStatus();
    const total = Object.values(counts).reduce((sum, count) => sum + count, 0);

    // Get oldest pending operation
    const oldestSql = `
      SELECT MIN(created_at) as oldest
      FROM sync_queue
      WHERE status = 'pending'
    `;
    const oldest = await this.db.get<{ oldest: string | null }>(oldestSql, []);

    return {
      total,
      pending: counts.pending,
      syncing: counts.syncing,
      complete: counts.complete,
      failed: counts.failed,
      oldestPendingAt: oldest?.oldest ?? null,
    };
  }

  /**
   * Check if there are any pending operations
   *
   * @returns true if there are pending operations
   */
  async hasPending(): Promise<boolean> {
    const count = await this.countPending();
    return count > 0;
  }

  /**
   * Get high priority operations (priority = 1)
   *
   * @param limit - Maximum number of operations to return
   * @returns Array of high priority pending operations
   */
  async getHighPriority(limit: number = 10): Promise<SyncQueueOperation[]> {
    const sql = `
      SELECT * FROM sync_queue
      WHERE status = 'pending' AND priority = 1
      ORDER BY created_at ASC
      LIMIT ?
    `;

    const rows = await this.db.all<SyncQueueRow>(sql, [limit]);
    return rows.map((row) => this.rowToOperation(row));
  }
}
