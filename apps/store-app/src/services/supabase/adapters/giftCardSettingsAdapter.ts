/**
 * GiftCardSettings Type Adapter
 *
 * Converts between Supabase CatalogGiftCardSettingsRow and app GiftCardSettings types.
 * Handles snake_case to camelCase conversion and JSON parsing.
 */

import type {
  SyncStatus,
  CatalogGiftCardSettingsRow,
  CatalogGiftCardSettingsInsert,
  CatalogGiftCardSettingsUpdate,
} from '../types';
import type { GiftCardSettings } from '@/types/catalog';
import type { VectorClock } from '@/types/common';

/**
 * Parse vector clock from JSONB
 */
function parseVectorClock(json: unknown): VectorClock {
  if (!json || typeof json !== 'object') {
    return {};
  }
  return json as VectorClock;
}

/**
 * Convert Supabase CatalogGiftCardSettingsRow to app GiftCardSettings type
 */
export function toGiftCardSettings(row: CatalogGiftCardSettingsRow): GiftCardSettings {
  return {
    // Primary key
    id: row.id,

    // Multi-tenant isolation
    tenantId: row.tenant_id,
    storeId: row.store_id,
    locationId: row.location_id || undefined,

    // Custom amount settings
    allowCustomAmount: row.allow_custom_amount,
    minAmount: row.min_amount,
    maxAmount: row.max_amount,

    // Expiration
    defaultExpirationDays: row.default_expiration_days ?? undefined,

    // Online settings
    onlineEnabled: row.online_enabled,
    emailDeliveryEnabled: row.email_delivery_enabled,

    // Sync metadata
    syncStatus: row.sync_status as SyncStatus,
    version: row.version,
    vectorClock: parseVectorClock(row.vector_clock),
    lastSyncedVersion: row.last_synced_version,

    // Timestamps
    createdAt: row.created_at,
    updatedAt: row.updated_at,

    // Audit trail
    createdBy: row.created_by || '',
    createdByDevice: row.created_by_device || '',
    lastModifiedBy: row.last_modified_by || '',
    lastModifiedByDevice: row.last_modified_by_device || '',

    // Soft delete
    isDeleted: row.is_deleted,
    deletedAt: row.deleted_at || undefined,
    deletedBy: row.deleted_by || undefined,
    deletedByDevice: row.deleted_by_device || undefined,
    tombstoneExpiresAt: row.tombstone_expires_at || undefined,
  };
}

/**
 * Convert app GiftCardSettings to Supabase CatalogGiftCardSettingsInsert
 */
export function toGiftCardSettingsInsert(
  settings: Partial<GiftCardSettings>,
  storeId: string,
  tenantId: string,
  userId?: string,
  deviceId?: string
): CatalogGiftCardSettingsInsert {
  const now = new Date().toISOString();
  const initialVectorClock = deviceId ? { [deviceId]: 1 } : {};

  return {
    tenant_id: tenantId,
    store_id: storeId,
    location_id: null,

    // Custom amount settings
    allow_custom_amount: settings.allowCustomAmount ?? true,
    min_amount: settings.minAmount ?? 10,
    max_amount: settings.maxAmount ?? 500,

    // Expiration
    default_expiration_days: settings.defaultExpirationDays ?? null,

    // Online settings
    online_enabled: settings.onlineEnabled ?? true,
    email_delivery_enabled: settings.emailDeliveryEnabled ?? true,

    // Sync metadata
    sync_status: 'local',
    version: 1,
    vector_clock: initialVectorClock,
    last_synced_version: 0,

    // Timestamps
    created_at: now,
    updated_at: now,

    // Audit trail
    created_by: userId || null,
    created_by_device: deviceId || null,
    last_modified_by: userId || null,
    last_modified_by_device: deviceId || null,

    // Soft delete
    is_deleted: false,
    deleted_at: null,
    deleted_by: null,
    deleted_by_device: null,
    tombstone_expires_at: null,
  };
}

/**
 * Convert partial GiftCardSettings updates to Supabase CatalogGiftCardSettingsUpdate
 */
export function toGiftCardSettingsUpdate(
  updates: Partial<GiftCardSettings>,
  userId?: string,
  deviceId?: string
): CatalogGiftCardSettingsUpdate {
  const result: CatalogGiftCardSettingsUpdate = {};

  // Custom amount settings
  if (updates.allowCustomAmount !== undefined) {
    result.allow_custom_amount = updates.allowCustomAmount;
  }
  if (updates.minAmount !== undefined) {
    result.min_amount = updates.minAmount;
  }
  if (updates.maxAmount !== undefined) {
    result.max_amount = updates.maxAmount;
  }

  // Expiration
  if (updates.defaultExpirationDays !== undefined) {
    result.default_expiration_days = updates.defaultExpirationDays ?? null;
  }

  // Online settings
  if (updates.onlineEnabled !== undefined) {
    result.online_enabled = updates.onlineEnabled;
  }
  if (updates.emailDeliveryEnabled !== undefined) {
    result.email_delivery_enabled = updates.emailDeliveryEnabled;
  }

  // Sync metadata
  if (updates.syncStatus !== undefined) {
    result.sync_status = updates.syncStatus as SyncStatus;
  }
  if (updates.version !== undefined) {
    result.version = updates.version;
  }
  if (updates.vectorClock !== undefined) {
    result.vector_clock = updates.vectorClock;
  }
  if (updates.lastSyncedVersion !== undefined) {
    result.last_synced_version = updates.lastSyncedVersion;
  }

  // Soft delete
  if (updates.isDeleted !== undefined) {
    result.is_deleted = updates.isDeleted;
  }
  if (updates.deletedAt !== undefined) {
    result.deleted_at = updates.deletedAt || null;
  }
  if (updates.deletedBy !== undefined) {
    result.deleted_by = updates.deletedBy || null;
  }
  if (updates.deletedByDevice !== undefined) {
    result.deleted_by_device = updates.deletedByDevice || null;
  }
  if (updates.tombstoneExpiresAt !== undefined) {
    result.tombstone_expires_at = updates.tombstoneExpiresAt || null;
  }

  // Always update modified metadata and timestamp
  result.updated_at = new Date().toISOString();
  if (userId) {
    result.last_modified_by = userId;
  }
  if (deviceId) {
    result.last_modified_by_device = deviceId;
  }

  return result;
}
