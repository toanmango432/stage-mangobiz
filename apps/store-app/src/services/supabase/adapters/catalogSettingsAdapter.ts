/**
 * CatalogSettings Type Adapter
 *
 * Converts between Supabase CatalogSettingsRow and app CatalogSettings types.
 * Handles snake_case to camelCase conversion and JSON parsing.
 */

import type {
  SyncStatus,
  CatalogSettingsRow,
  CatalogSettingsInsert,
  CatalogSettingsUpdate,
  ExtraTimeType,
} from '../types';
import type { CatalogSettings } from '@/types/catalog';
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
 * Convert Supabase CatalogSettingsRow to app CatalogSettings type
 */
export function toCatalogSettings(row: CatalogSettingsRow): CatalogSettings {
  return {
    // Primary key
    id: row.id,

    // Multi-tenant isolation
    tenantId: row.tenant_id,
    storeId: row.store_id,
    locationId: row.location_id || undefined,

    // Default values
    defaultDuration: row.default_duration,
    defaultExtraTime: row.default_extra_time,
    defaultExtraTimeType: row.default_extra_time_type as CatalogSettings['defaultExtraTimeType'],

    // Pricing defaults
    defaultTaxRate: row.default_tax_rate,
    currency: row.currency,
    currencySymbol: row.currency_symbol,

    // Online booking defaults
    showPricesOnline: row.show_prices_online,
    requireDepositForOnlineBooking: row.require_deposit_for_online_booking,
    defaultDepositPercentage: row.default_deposit_percentage,

    // Feature toggles
    enablePackages: row.enable_packages,
    enableAddOns: row.enable_add_ons,
    enableVariants: row.enable_variants,
    allowCustomPricing: row.allow_custom_pricing,
    bookingSequenceEnabled: row.booking_sequence_enabled,

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
 * Convert app CatalogSettings to Supabase CatalogSettingsInsert
 */
export function toCatalogSettingsInsert(
  settings: Partial<CatalogSettings>,
  storeId: string,
  tenantId: string,
  userId?: string,
  deviceId?: string
): CatalogSettingsInsert {
  const now = new Date().toISOString();
  const initialVectorClock = deviceId ? { [deviceId]: 1 } : {};

  return {
    tenant_id: tenantId,
    store_id: storeId,
    location_id: null,

    // Default values
    default_duration: settings.defaultDuration ?? 60,
    default_extra_time: settings.defaultExtraTime ?? 0,
    default_extra_time_type: (settings.defaultExtraTimeType ?? 'processing') as ExtraTimeType,

    // Pricing defaults
    default_tax_rate: settings.defaultTaxRate ?? 0,
    currency: settings.currency ?? 'USD',
    currency_symbol: settings.currencySymbol ?? '$',

    // Online booking defaults
    show_prices_online: settings.showPricesOnline ?? true,
    require_deposit_for_online_booking: settings.requireDepositForOnlineBooking ?? false,
    default_deposit_percentage: settings.defaultDepositPercentage ?? 20,

    // Feature toggles
    enable_packages: settings.enablePackages ?? true,
    enable_add_ons: settings.enableAddOns ?? true,
    enable_variants: settings.enableVariants ?? true,
    allow_custom_pricing: settings.allowCustomPricing ?? true,
    booking_sequence_enabled: settings.bookingSequenceEnabled ?? false,

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
 * Convert partial CatalogSettings updates to Supabase CatalogSettingsUpdate
 */
export function toCatalogSettingsUpdate(
  updates: Partial<CatalogSettings>,
  userId?: string,
  deviceId?: string
): CatalogSettingsUpdate {
  const result: CatalogSettingsUpdate = {};

  // Default values
  if (updates.defaultDuration !== undefined) {
    result.default_duration = updates.defaultDuration;
  }
  if (updates.defaultExtraTime !== undefined) {
    result.default_extra_time = updates.defaultExtraTime;
  }
  if (updates.defaultExtraTimeType !== undefined) {
    result.default_extra_time_type = updates.defaultExtraTimeType as ExtraTimeType;
  }

  // Pricing defaults
  if (updates.defaultTaxRate !== undefined) {
    result.default_tax_rate = updates.defaultTaxRate;
  }
  if (updates.currency !== undefined) {
    result.currency = updates.currency;
  }
  if (updates.currencySymbol !== undefined) {
    result.currency_symbol = updates.currencySymbol;
  }

  // Online booking defaults
  if (updates.showPricesOnline !== undefined) {
    result.show_prices_online = updates.showPricesOnline;
  }
  if (updates.requireDepositForOnlineBooking !== undefined) {
    result.require_deposit_for_online_booking = updates.requireDepositForOnlineBooking;
  }
  if (updates.defaultDepositPercentage !== undefined) {
    result.default_deposit_percentage = updates.defaultDepositPercentage;
  }

  // Feature toggles
  if (updates.enablePackages !== undefined) {
    result.enable_packages = updates.enablePackages;
  }
  if (updates.enableAddOns !== undefined) {
    result.enable_add_ons = updates.enableAddOns;
  }
  if (updates.enableVariants !== undefined) {
    result.enable_variants = updates.enableVariants;
  }
  if (updates.allowCustomPricing !== undefined) {
    result.allow_custom_pricing = updates.allowCustomPricing;
  }
  if (updates.bookingSequenceEnabled !== undefined) {
    result.booking_sequence_enabled = updates.bookingSequenceEnabled;
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
