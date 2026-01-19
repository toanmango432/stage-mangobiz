/**
 * Service Type Adapter
 *
 * Converts between Supabase ServiceRow and app Service types.
 */

import type { ServiceRow, ServiceInsert, ServiceUpdate } from '../types';
import type { Service } from '@/types/service';
import type { SyncStatus } from '@/types/common';

/**
 * Convert Supabase ServiceRow to app Service type
 */
export function toService(row: ServiceRow): Service {
  return {
    id: row.id,
    storeId: row.store_id,
    name: row.name,
    category: row.category || '',
    duration: row.duration,
    price: row.price,
    commissionRate: 0, // Not stored in current Supabase schema
    isActive: row.is_active,
    createdAt: row.created_at, // ISO string (UTC)
    updatedAt: row.updated_at, // ISO string (UTC)
    syncStatus: row.sync_status as SyncStatus,
    // Archive fields - default to 'active' for backwards compatibility
    status: row.status || 'active',
    archivedAt: row.archived_at || undefined,
    archivedBy: row.archived_by || undefined,
  };
}

/**
 * Convert app Service to Supabase ServiceInsert
 */
export function toServiceInsert(
  service: Omit<Service, 'id' | 'createdAt' | 'updatedAt'>,
  storeId?: string
): Omit<ServiceInsert, 'store_id'> & { store_id?: string } {
  return {
    store_id: storeId || service.storeId,
    name: service.name,
    category: service.category || null,
    duration: service.duration,
    price: service.price,
    is_active: service.isActive,
    sync_status: service.syncStatus || 'synced',
    sync_version: 1,
    // Archive fields - default to 'active' for new services
    status: service.status || 'active',
    archived_at: service.archivedAt || null,
    archived_by: service.archivedBy || null,
  };
}

/**
 * Convert partial Service updates to Supabase ServiceUpdate
 */
export function toServiceUpdate(updates: Partial<Service>): ServiceUpdate {
  const result: ServiceUpdate = {};

  if (updates.name !== undefined) {
    result.name = updates.name;
  }
  if (updates.category !== undefined) {
    result.category = updates.category || null;
  }
  if (updates.duration !== undefined) {
    result.duration = updates.duration;
  }
  if (updates.price !== undefined) {
    result.price = updates.price;
  }
  if (updates.isActive !== undefined) {
    result.is_active = updates.isActive;
  }
  if (updates.syncStatus !== undefined) {
    result.sync_status = updates.syncStatus;
  }
  // Archive fields
  if (updates.status !== undefined) {
    result.status = updates.status;
  }
  if (updates.archivedAt !== undefined) {
    result.archived_at = updates.archivedAt || null;
  }
  if (updates.archivedBy !== undefined) {
    result.archived_by = updates.archivedBy || null;
  }

  return result;
}

/**
 * Convert array of ServiceRows to Services
 */
export function toServices(rows: ServiceRow[]): Service[] {
  return rows.map(toService);
}
