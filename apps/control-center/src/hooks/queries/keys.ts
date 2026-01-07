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
    byLicense: (licenseId: string) => [...queryKeys.stores.all, 'license', licenseId] as const,
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

  // Members
  members: {
    all: ['members'] as const,
    list: () => [...queryKeys.members.all, 'list'] as const,
    detail: (id: string) => [...queryKeys.members.all, 'detail', id] as const,
    byTenant: (tenantId: string) => [...queryKeys.members.all, 'tenant', tenantId] as const,
    byStore: (storeId: string) => [...queryKeys.members.all, 'store', storeId] as const,
    stats: () => [...queryKeys.members.all, 'stats'] as const,
  },

  // Audit Logs
  auditLogs: {
    all: ['audit-logs'] as const,
    list: () => [...queryKeys.auditLogs.all, 'list'] as const,
    detail: (id: string) => [...queryKeys.auditLogs.all, 'detail', id] as const,
    byUser: (userId: string) => [...queryKeys.auditLogs.all, 'user', userId] as const,
    byEntity: (entityType: string, entityId?: string) =>
      [...queryKeys.auditLogs.all, 'entity', entityType, entityId] as const,
    byDateRange: (start: string, end: string) =>
      [...queryKeys.auditLogs.all, 'date-range', start, end] as const,
    recent: (hours: number) => [...queryKeys.auditLogs.all, 'recent', hours] as const,
  },

  // Feature Flags
  featureFlags: {
    all: ['feature-flags'] as const,
    list: () => [...queryKeys.featureFlags.all, 'list'] as const,
    detail: (id: string) => [...queryKeys.featureFlags.all, 'detail', id] as const,
    byKey: (key: string) => [...queryKeys.featureFlags.all, 'key', key] as const,
    byCategory: (category: string) => [...queryKeys.featureFlags.all, 'category', category] as const,
    forTier: (tier: string) => [...queryKeys.featureFlags.all, 'tier', tier] as const,
    stats: () => [...queryKeys.featureFlags.all, 'stats'] as const,
  },

  // Announcements
  announcements: {
    all: ['announcements'] as const,
    list: () => [...queryKeys.announcements.all, 'list'] as const,
    detail: (id: string) => [...queryKeys.announcements.all, 'detail', id] as const,
    active: () => [...queryKeys.announcements.all, 'active'] as const,
    byStatus: (status: string) => [...queryKeys.announcements.all, 'status', status] as const,
    byCategory: (category: string) => [...queryKeys.announcements.all, 'category', category] as const,
    stats: () => [...queryKeys.announcements.all, 'stats'] as const,
  },

  // Surveys
  surveys: {
    all: ['surveys'] as const,
    list: () => [...queryKeys.surveys.all, 'list'] as const,
    detail: (id: string) => [...queryKeys.surveys.all, 'detail', id] as const,
    active: () => [...queryKeys.surveys.all, 'active'] as const,
    byStatus: (status: string) => [...queryKeys.surveys.all, 'status', status] as const,
    byType: (type: string) => [...queryKeys.surveys.all, 'type', type] as const,
    responses: (surveyId: string) => [...queryKeys.surveys.all, 'responses', surveyId] as const,
    stats: () => [...queryKeys.surveys.all, 'stats'] as const,
  },

  // System Config
  systemConfig: {
    all: ['system-config'] as const,
    config: () => [...queryKeys.systemConfig.all, 'config'] as const,
    taxes: () => [...queryKeys.systemConfig.all, 'taxes'] as const,
    categories: () => [...queryKeys.systemConfig.all, 'categories'] as const,
    items: () => [...queryKeys.systemConfig.all, 'items'] as const,
    roles: () => [...queryKeys.systemConfig.all, 'roles'] as const,
    paymentMethods: () => [...queryKeys.systemConfig.all, 'payment-methods'] as const,
  },

  // Dashboard
  dashboard: {
    all: ['dashboard'] as const,
    stats: () => [...queryKeys.dashboard.all, 'stats'] as const,
    recentActivity: () => [...queryKeys.dashboard.all, 'activity'] as const,
  },
};
