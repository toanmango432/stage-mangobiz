/**
 * Shared SyncContext utility for Redux slices.
 * Single source of truth for sync context across all mutations.
 */

// ============================================
// SYNC CONTEXT INTERFACE
// ============================================

/**
 * Context required for sync operations.
 * Must be provided for all create/update/delete operations.
 */
export interface SyncContext {
  userId: string;
  deviceId: string;
  storeId?: string;
  tenantId?: string;
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Default sync context for development/demo.
 * In production, use createSyncContext() with real auth data.
 */
export const getDefaultSyncContext = (): SyncContext => ({
  userId: 'system',
  deviceId:
    typeof window !== 'undefined'
      ? `device-${window.navigator.userAgent.slice(0, 10)}`
      : 'server',
  storeId: 'default-store',
  tenantId: 'default-tenant',
});

/**
 * Create a SyncContext from auth and device state.
 * Use this in production instead of getDefaultSyncContext().
 *
 * @param auth - Auth state containing current user info
 * @param device - Device state containing device info
 * @returns SyncContext with real values
 */
export const createSyncContext = (
  auth: { userId?: string; storeId?: string; tenantId?: string } | null,
  device: { deviceId?: string } | null
): SyncContext => ({
  userId: auth?.userId || 'system',
  deviceId: device?.deviceId || getDefaultSyncContext().deviceId,
  storeId: auth?.storeId || 'default-store',
  tenantId: auth?.tenantId,
});
