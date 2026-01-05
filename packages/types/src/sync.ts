import { SyncOperationType, EntityType } from './common';
import type { Client } from './client';
import type { Appointment } from './appointment';
import type { Ticket } from './Ticket';
import type { Transaction } from './transaction';
import type { Staff } from './staff';
import type { Service } from './service';

// ============================================
// SYNC OPERATION DISCRIMINATED UNION
// Type-safe sync operations for each entity type
// ============================================

/**
 * Base fields shared by all sync operations
 */
interface BaseSyncOperation {
  id: string;
  priority: number; // 1 = highest
  createdAt: Date;
  attempts: number;
  maxAttempts: number;
  status: 'pending' | 'syncing' | 'success' | 'failed';
  salonId?: string; // Store context for filtering
  error?: string;
  lastAttemptAt?: Date;
}

/**
 * Type-safe sync operation with discriminated union based on entity + action
 */
export type TypedSyncOperation = BaseSyncOperation & (
  // Client operations
  | { entity: 'client'; action: 'CREATE'; entityId: string; payload: Omit<Client, 'id' | 'createdAt' | 'updatedAt'> }
  | { entity: 'client'; action: 'UPDATE'; entityId: string; payload: Partial<Client> }
  | { entity: 'client'; action: 'DELETE'; entityId: string; payload: null }
  // Appointment operations
  | { entity: 'appointment'; action: 'CREATE'; entityId: string; payload: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'> }
  | { entity: 'appointment'; action: 'UPDATE'; entityId: string; payload: Partial<Appointment> }
  | { entity: 'appointment'; action: 'DELETE'; entityId: string; payload: null }
  // Ticket operations
  | { entity: 'ticket'; action: 'CREATE'; entityId: string; payload: Omit<Ticket, 'id' | 'createdAt' | 'updatedAt'> }
  | { entity: 'ticket'; action: 'UPDATE'; entityId: string; payload: Partial<Ticket> }
  | { entity: 'ticket'; action: 'DELETE'; entityId: string; payload: null }
  // Transaction operations
  | { entity: 'transaction'; action: 'CREATE'; entityId: string; payload: Omit<Transaction, 'id' | 'createdAt'> }
  | { entity: 'transaction'; action: 'UPDATE'; entityId: string; payload: Partial<Transaction> }
  | { entity: 'transaction'; action: 'DELETE'; entityId: string; payload: null }
  // Staff operations (mostly read-only from POS, but clock in/out needs sync)
  | { entity: 'staff'; action: 'UPDATE'; entityId: string; payload: Partial<Staff> }
  // Service operations (admin-only, rarely synced from POS)
  | { entity: 'service'; action: 'CREATE'; entityId: string; payload: Omit<Service, 'id' | 'createdAt' | 'updatedAt'> }
  | { entity: 'service'; action: 'UPDATE'; entityId: string; payload: Partial<Service> }
  | { entity: 'service'; action: 'DELETE'; entityId: string; payload: null }
);

/**
 * Legacy SyncOperation interface (kept for backwards compatibility)
 * @deprecated Use TypedSyncOperation for new code
 */
export interface SyncOperation {
  id: string;
  type: SyncOperationType;
  entity: EntityType;
  entityId: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  payload: unknown; // Changed from 'any' to 'unknown' for better type safety
  priority: number; // 1 = highest
  createdAt: Date;
  attempts: number;
  maxAttempts: number;
  status: 'pending' | 'syncing' | 'success' | 'failed';
  salonId?: string; // Optional salon context for filtering
  error?: string;
  lastAttemptAt?: Date;
}

/**
 * Type guard to check if a SyncOperation is for a specific entity
 */
export function isSyncOperationForEntity<E extends TypedSyncOperation['entity']>(
  op: SyncOperation,
  entity: E
): op is TypedSyncOperation & { entity: E } {
  return op.entity === entity;
}

/**
 * Helper to create a typed sync operation
 */
export function createSyncOperation<T extends TypedSyncOperation>(
  op: Omit<T, 'id' | 'createdAt' | 'attempts' | 'maxAttempts' | 'status'>
): T {
  return {
    ...op,
    id: crypto.randomUUID(),
    createdAt: new Date(),
    attempts: 0,
    maxAttempts: 5,
    status: 'pending',
  } as T;
}

export interface SyncQueueStats {
  pending: number;
  syncing: number;
  failed: number;
  lastSyncAt?: Date;
}
