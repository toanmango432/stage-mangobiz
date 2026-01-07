/**
 * Query Key Factory
 * Centralized query keys for React Query
 */

export const queryKeys = {
  // Tenants
  tenants: {
    all: ['tenants'] as const,
    list: () => [...queryKeys.tenants.all, 'list'] as const,
    detail: (id: string) => [...queryKeys.tenants.all, 'detail', id] as const,
    stats: () => [...queryKeys.tenants.all, 'stats'] as const,
  },

  // Licenses
  licenses: {
    all: ['licenses'] as const,
    list: () => [...queryKeys.licenses.all, 'list'] as const,
    detail: (id: string) => [...queryKeys.licenses.all, 'detail', id] as const,
    byTenant: (tenantId: string) => [...queryKeys.licenses.all, 'tenant', tenantId] as const,
    expiring: (days: number) => [...queryKeys.licenses.all, 'expiring', days] as const,
    stats: () => [...queryKeys.licenses.all, 'stats'] as const,
  },

  // Stores
  stores: {
    all: ['stores'] as const,
    list: () => [...queryKeys.stores.all, 'list'] as const,
    detail: (id: string) => [...queryKeys.stores.all, 'detail', id] as const,
    byTenant: (tenantId: string) => [...queryKeys.stores.all, 'tenant', tenantId] as const,
    stats: () => [...queryKeys.stores.all, 'stats'] as const,
  },

  // Admin Users
  adminUsers: {
    all: ['admin-users'] as const,
    list: () => [...queryKeys.adminUsers.all, 'list'] as const,
    detail: (id: string) => [...queryKeys.adminUsers.all, 'detail', id] as const,
  },

  // Devices
  devices: {
    all: ['devices'] as const,
    list: () => [...queryKeys.devices.all, 'list'] as const,
    detail: (id: string) => [...queryKeys.devices.all, 'detail', id] as const,
    byStore: (storeId: string) => [...queryKeys.devices.all, 'store', storeId] as const,
    byLicense: (licenseId: string) => [...queryKeys.devices.all, 'license', licenseId] as const,
    stats: () => [...queryKeys.devices.all, 'stats'] as const,
  },

  // Dashboard
  dashboard: {
    all: ['dashboard'] as const,
    stats: () => [...queryKeys.dashboard.all, 'stats'] as const,
    recentActivity: () => [...queryKeys.dashboard.all, 'activity'] as const,
  },
};
