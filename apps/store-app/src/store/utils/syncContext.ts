/**
 * Shared SyncContext Utility
 * Single source of truth for sync context across all slices.
 *
 * @see docs/architecture/DATA_STORAGE_STRATEGY.md
 */

/**
 * Context required for sync operations.
 * Must be provided for all create/update/delete operations.
 */
export interface SyncContext {
  /** User ID performing the action */
  userId: string;
  /** Device ID where action originated */
  deviceId: string;
  /** Store ID (optional for some operations) */
  storeId?: string;
  /** Tenant ID for multi-tenant support */
  tenantId?: string;
}

/**
 * Get default sync context for development/demo.
 * In production, this should come from auth state.
 */
export function getDefaultSyncContext(): SyncContext & { storeId: string } {
  return {
    userId: 'system',
    deviceId: 'device-web',
    storeId: 'default-store',
    tenantId: 'default-tenant',
  };
}

/**
 * Create a sync context from auth and device state.
 *
 * @param auth Auth state containing current user
 * @param device Device state containing device info
 * @returns SyncContext for mutations
 */
export function createSyncContext(
  auth: { userId?: string; storeId?: string; tenantId?: string },
  device: { deviceId?: string }
): SyncContext {
  return {
    userId: auth.userId || 'system',
    deviceId: device.deviceId || 'device-web',
    storeId: auth.storeId,
    tenantId: auth.tenantId,
  };
}

/**
 * Validate that a sync context has required fields.
 *
 * @param ctx SyncContext to validate
 * @returns true if context has userId and deviceId
 */
export function isValidSyncContext(ctx: Partial<SyncContext>): ctx is SyncContext {
  return Boolean(ctx.userId && ctx.deviceId);
}
