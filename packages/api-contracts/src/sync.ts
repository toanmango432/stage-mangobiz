/**
 * Sync API Contracts
 *
 * Shared types for offline sync operations between frontend and API.
 * Supports push/pull synchronization with conflict resolution.
 */

import { z } from 'zod';

// =============================================================================
// Sync Entities
// =============================================================================

export type SyncableEntity =
  | 'client'
  | 'staff'
  | 'service'
  | 'appointment'
  | 'ticket'
  | 'transaction';

export type SyncAction = 'CREATE' | 'UPDATE' | 'DELETE';

// =============================================================================
// Sync Operations
// =============================================================================

/**
 * Single sync operation (for push)
 */
export interface SyncOperation {
  /** Unique ID for this operation */
  id: string;
  /** Entity type being synced */
  entity: SyncableEntity;
  /** Action to perform */
  action: SyncAction;
  /** Entity ID (for UPDATE/DELETE) */
  entityId?: string;
  /** Entity data (for CREATE/UPDATE) */
  payload: Record<string, unknown>;
  /** Client-side timestamp when operation was created */
  clientTimestamp: string;
  /** Sync version for conflict detection */
  syncVersion?: number;
}

/**
 * Result of a single sync operation
 */
export interface SyncOperationResult {
  /** Operation ID */
  id: string;
  /** Whether the operation succeeded */
  success: boolean;
  /** Server-side entity ID (for CREATE operations) */
  entityId?: string;
  /** New sync version after operation */
  syncVersion?: number;
  /** Error if operation failed */
  error?: SyncError;
  /** Conflict data if there was a conflict */
  conflict?: SyncConflict;
}

// =============================================================================
// Push Request/Response
// =============================================================================

/**
 * Push request - send local changes to server
 */
export interface SyncPushRequest {
  /** Store ID */
  storeId: string;
  /** Device ID for tracking */
  deviceId?: string;
  /** Operations to push */
  operations: SyncOperation[];
}

/**
 * Push response - results of pushed operations
 */
export interface SyncPushResponse {
  /** Results for each operation */
  results: SyncOperationResult[];
  /** Overall success (all operations succeeded) */
  success: boolean;
  /** Number of successful operations */
  successCount: number;
  /** Number of failed operations */
  failureCount: number;
  /** Number of conflicts */
  conflictCount: number;
  /** Server timestamp */
  serverTimestamp: string;
}

// =============================================================================
// Pull Request/Response
// =============================================================================

/**
 * Pull request - get changes from server
 */
export interface SyncPullRequest {
  /** Store ID */
  storeId: string;
  /** Device ID */
  deviceId?: string;
  /** Only get changes since this timestamp */
  since?: string;
  /** Specific entities to pull (empty = all) */
  entities?: SyncableEntity[];
  /** Maximum number of records per entity */
  limit?: number;
}

/**
 * Changes for a single entity type
 */
export interface EntityChanges<T = Record<string, unknown>> {
  /** Entity type */
  entity: SyncableEntity;
  /** Created records */
  created: T[];
  /** Updated records */
  updated: T[];
  /** Deleted record IDs */
  deleted: string[];
  /** Sync version after these changes */
  syncVersion: number;
  /** Whether there are more changes to pull */
  hasMore: boolean;
}

/**
 * Pull response - changes from server
 */
export interface SyncPullResponse {
  /** Changes per entity type */
  changes: EntityChanges[];
  /** Server timestamp for this pull */
  serverTimestamp: string;
  /** Last sync timestamp (use for next pull) */
  lastSyncAt: string;
  /** Whether full sync is recommended (too many changes) */
  requiresFullSync?: boolean;
}

// =============================================================================
// Conflict Resolution
// =============================================================================

export type ConflictResolutionStrategy =
  | 'client_wins'
  | 'server_wins'
  | 'latest_wins'
  | 'manual';

/**
 * Sync conflict information
 */
export interface SyncConflict {
  /** Entity type */
  entity: SyncableEntity;
  /** Entity ID */
  entityId: string;
  /** Client version */
  clientVersion: number;
  /** Server version */
  serverVersion: number;
  /** Client data */
  clientData: Record<string, unknown>;
  /** Server data */
  serverData: Record<string, unknown>;
  /** Suggested resolution */
  suggestedResolution?: ConflictResolutionStrategy;
}

/**
 * Conflict resolution request
 */
export interface ResolveConflictRequest {
  /** Conflict to resolve */
  conflict: SyncConflict;
  /** Resolution strategy */
  resolution: ConflictResolutionStrategy;
  /** Merged data if manual resolution */
  mergedData?: Record<string, unknown>;
}

// =============================================================================
// Sync Status
// =============================================================================

export type SyncStatus = 'idle' | 'syncing' | 'error' | 'offline';

/**
 * Current sync status response
 */
export interface SyncStatusResponse {
  /** Current status */
  status: SyncStatus;
  /** Whether device is online */
  isOnline: boolean;
  /** Last successful sync timestamp */
  lastSyncAt: string | null;
  /** Number of pending operations */
  pendingCount: number;
  /** Current error if any */
  error: string | null;
  /** Server timestamp */
  serverTimestamp: string;
}

// =============================================================================
// Error Types
// =============================================================================

export type SyncErrorCode =
  | 'VALIDATION_ERROR'
  | 'CONFLICT'
  | 'NOT_FOUND'
  | 'PERMISSION_DENIED'
  | 'RATE_LIMITED'
  | 'SERVER_ERROR'
  | 'NETWORK_ERROR'
  | 'VERSION_MISMATCH';

export interface SyncError {
  code: SyncErrorCode;
  message: string;
  details?: unknown;
}

// =============================================================================
// Zod Schemas
// =============================================================================

export const SyncOperationSchema = z.object({
  id: z.string(),
  entity: z.enum(['client', 'staff', 'service', 'appointment', 'ticket', 'transaction']),
  action: z.enum(['CREATE', 'UPDATE', 'DELETE']),
  entityId: z.string().optional(),
  payload: z.record(z.unknown()),
  clientTimestamp: z.string().datetime(),
  syncVersion: z.number().optional(),
});

export const SyncPushRequestSchema = z.object({
  storeId: z.string().uuid(),
  deviceId: z.string().optional(),
  operations: z.array(SyncOperationSchema),
});

export const SyncPullRequestSchema = z.object({
  storeId: z.string().uuid(),
  deviceId: z.string().optional(),
  since: z.string().datetime().optional(),
  entities: z.array(z.enum(['client', 'staff', 'service', 'appointment', 'ticket', 'transaction'])).optional(),
  limit: z.number().positive().max(1000).optional(),
});
