/**
 * Catalog Data Service
 *
 * Handles all catalog-related data operations including:
 * - Service categories
 * - Menu services
 * - Service variants
 * - Service packages
 * - Add-on groups and options
 * - Staff service assignments
 * - Catalog settings
 * - Products
 * - Basic services
 *
 * LOCAL-FIRST architecture with SQLite/IndexedDB dual-path support.
 */

import { store } from '@/store';
import { shouldUseSQLite } from '@/config/featureFlags';

// LOCAL-FIRST: Import IndexedDB operations
import { servicesDB } from '@/db/database';

// SUPABASE: Import Supabase tables and adapters for cloud sync
import { serviceCategoriesTable } from '@/services/supabase/tables/serviceCategoriesTable';
import {
  toServiceCategory,
  toServiceCategories,
  toServiceCategoryInsert,
  toServiceCategoryUpdate,
} from '@/services/supabase/adapters/serviceCategoryAdapter';

// Catalog operations from Dexie
import {
  serviceCategoriesDB,
  menuServicesDB,
  serviceVariantsDB,
  servicePackagesDB,
  addOnGroupsDB,
  addOnOptionsDB,
  staffServiceAssignmentsDB,
  catalogSettingsDB,
  productsDB,
} from '@/db/catalogDatabase';

// SQLite: Import SQLite service wrappers
import {
  sqliteServicesDB,
  sqliteServiceCategoriesDB,
  sqliteMenuServicesDB,
  sqliteServiceVariantsDB,
  sqliteServicePackagesDB,
  sqliteAddOnGroupsDB,
  sqliteAddOnOptionsDB,
  sqliteStaffServiceAssignmentsDB,
  sqliteCatalogSettingsDB,
  sqliteProductsDB,
} from '@/services/sqliteServices';

import type { Service } from '@/types';
import type { AddOnGroup, AddOnOption, ServiceCategory, CreateCategoryInput } from '@/types/catalog';

// ==================== HELPERS ====================

const USE_SQLITE = shouldUseSQLite();

/**
 * Check if Supabase should be used for data operations.
 *
 * Returns true when:
 * - Device is online
 * - NOT using SQLite (Electron)
 * - VITE_USE_SUPABASE=true is set (opt-in for now)
 *
 * This enables direct Supabase access for online-only devices,
 * while offline-enabled devices continue using local-first storage.
 */
function shouldUseSupabase(): boolean {
  // Skip Supabase if SQLite is enabled (Electron uses local-first)
  if (USE_SQLITE) {
    return false;
  }

  // Check for explicit opt-in (VITE_USE_SUPABASE=true)
  const useSupabaseEnv = import.meta.env.VITE_USE_SUPABASE;
  if (useSupabaseEnv !== 'true') {
    return false;
  }

  // Only use Supabase when online
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return false;
  }

  return true;
}

const USE_SUPABASE = shouldUseSupabase();

/**
 * Get current store ID from Redux store
 */
function getStoreId(): string {
  const state = store.getState();
  return state.auth.storeId || '';
}

/**
 * Get current tenant ID from Redux store
 */
function getTenantId(): string {
  const state = store.getState();
  // tenantId typically equals storeId for single-store setups
  // For multi-store organizations, this would come from auth context
  return state.auth.store?.tenantId || state.auth.storeId || '';
}

/**
 * Get current user ID from Redux store
 */
function getUserId(): string {
  const state = store.getState();
  return state.auth.user?.id || state.auth.member?.memberId || '';
}

/**
 * Get device ID for sync tracking
 */
function getDeviceId(): string {
  // In browser environment, use a stored device ID or generate one
  if (typeof localStorage !== 'undefined') {
    let deviceId = localStorage.getItem('mango:deviceId');
    if (!deviceId) {
      deviceId = `web-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
      localStorage.setItem('mango:deviceId', deviceId);
    }
    return deviceId;
  }
  return 'web-client';
}

// ==================== CATALOG SERVICES ====================

/**
 * Services data operations - LOCAL-FIRST
 * Reads from IndexedDB or SQLite (services are read-only in POS, managed via Admin)
 *
 * SQLite routing: When USE_SQLITE=true and running in Electron, uses SQLite via sqliteServicesDB
 */
export const servicesService = {
  async getAll(): Promise<Service[]> {
    const storeId = getStoreId();
    if (!storeId) return [];

    if (USE_SQLITE) {
      return sqliteServicesDB.getAll(storeId);
    }
    return servicesDB.getAll(storeId);
  },

  async getById(id: string): Promise<Service | null> {
    if (USE_SQLITE) {
      const service = await sqliteServicesDB.getById(id);
      return service || null;
    }
    const service = await servicesDB.getById(id);
    return service || null;
  },

  async getActive(): Promise<Service[]> {
    const storeId = getStoreId();
    if (!storeId) return [];

    if (USE_SQLITE) {
      const services = await sqliteServicesDB.getAll(storeId);
      return services.filter(s => s.isActive);
    }
    const services = await servicesDB.getAll(storeId);
    return services.filter(s => s.isActive);
  },

  async getByCategory(category: string): Promise<Service[]> {
    const storeId = getStoreId();
    if (!storeId) return [];

    if (USE_SQLITE) {
      return sqliteServicesDB.getByCategory(storeId, category);
    }
    return servicesDB.getByCategory(storeId, category);
  },
};

/**
 * Service Categories data operations
 *
 * Routing priority:
 * 1. SQLite (if USE_SQLITE=true, Electron only)
 * 2. Supabase (if USE_SUPABASE=true and online)
 * 3. Dexie/IndexedDB (default local-first storage)
 */
export const serviceCategoriesService = {
  async getAll(storeId: string, includeInactive = false): Promise<ServiceCategory[]> {
    // SQLite path (Electron)
    if (USE_SQLITE) {
      // SQLite service returns unknown[], cast to ServiceCategory[]
      const result = await sqliteServiceCategoriesDB.getAll(storeId, includeInactive);
      return result as ServiceCategory[];
    }

    // Supabase path (online-only devices with opt-in)
    if (USE_SUPABASE) {
      const rows = await serviceCategoriesTable.getByStoreId(storeId, includeInactive);
      return toServiceCategories(rows);
    }

    // Dexie path (default local-first)
    return serviceCategoriesDB.getAll(storeId, includeInactive);
  },

  async getById(id: string): Promise<ServiceCategory | undefined> {
    // SQLite path
    if (USE_SQLITE) {
      const result = await sqliteServiceCategoriesDB.getById(id);
      return result as ServiceCategory | undefined;
    }

    // Supabase path
    if (USE_SUPABASE) {
      const row = await serviceCategoriesTable.getById(id);
      return row ? toServiceCategory(row) : undefined;
    }

    // Dexie path
    return serviceCategoriesDB.getById(id);
  },

  async create(
    input: CreateCategoryInput,
    userId: string,
    storeId: string,
    tenantId?: string,
    deviceId?: string
  ): Promise<ServiceCategory> {
    // SQLite path
    if (USE_SQLITE) {
      const result = await sqliteServiceCategoriesDB.create(input);
      return result as ServiceCategory;
    }

    // Supabase path
    if (USE_SUPABASE) {
      const effectiveTenantId = tenantId || getTenantId() || storeId;
      const effectiveDeviceId = deviceId || getDeviceId();
      const insertData = toServiceCategoryInsert(input, storeId, effectiveTenantId, userId, effectiveDeviceId);
      const row = await serviceCategoriesTable.create(insertData);
      return toServiceCategory(row);
    }

    // Dexie path
    return serviceCategoriesDB.create(input, userId, storeId);
  },

  async update(
    id: string,
    updates: Partial<ServiceCategory>,
    userId: string,
    deviceId?: string
  ): Promise<ServiceCategory | undefined> {
    // SQLite path
    if (USE_SQLITE) {
      const result = await sqliteServiceCategoriesDB.update(id, updates);
      return result as ServiceCategory | undefined;
    }

    // Supabase path
    if (USE_SUPABASE) {
      const effectiveDeviceId = deviceId || getDeviceId();
      const updateData = toServiceCategoryUpdate(updates, userId, effectiveDeviceId);
      const row = await serviceCategoriesTable.update(id, updateData);
      return toServiceCategory(row);
    }

    // Dexie path
    return serviceCategoriesDB.update(id, updates, userId);
  },

  async delete(id: string, userId?: string, deviceId?: string): Promise<void> {
    // SQLite path
    if (USE_SQLITE) {
      return sqliteServiceCategoriesDB.delete(id);
    }

    // Supabase path (soft delete with tombstone)
    if (USE_SUPABASE) {
      const effectiveUserId = userId || getUserId();
      const effectiveDeviceId = deviceId || getDeviceId();
      return serviceCategoriesTable.delete(id, effectiveUserId, effectiveDeviceId);
    }

    // Dexie path
    return serviceCategoriesDB.delete(id);
  },

  /**
   * Search categories by name (Supabase only currently)
   */
  async search(storeId: string, query: string): Promise<ServiceCategory[]> {
    // Supabase path
    if (USE_SUPABASE) {
      const rows = await serviceCategoriesTable.search(storeId, query);
      return toServiceCategories(rows);
    }

    // Fallback to getAll and filter in JS (SQLite/Dexie don't have search)
    const all = await this.getAll(storeId, false);
    const lowerQuery = query.toLowerCase();
    return all.filter(cat => cat.name.toLowerCase().includes(lowerQuery));
  },

  /**
   * Get categories for online booking (Supabase only currently)
   */
  async getOnlineBookingCategories(storeId: string): Promise<ServiceCategory[]> {
    // Supabase path
    if (USE_SUPABASE) {
      const rows = await serviceCategoriesTable.getOnlineBookingCategories(storeId);
      return toServiceCategories(rows);
    }

    // Fallback: filter from getAll
    const all = await this.getAll(storeId, false);
    return all.filter(cat => cat.showOnlineBooking);
  },

  /**
   * Get categories updated since a specific time (for sync)
   */
  async getUpdatedSince(storeId: string, since: Date): Promise<ServiceCategory[]> {
    // Supabase path
    if (USE_SUPABASE) {
      const rows = await serviceCategoriesTable.getUpdatedSince(storeId, since);
      return toServiceCategories(rows);
    }

    // Fallback: not available in SQLite/Dexie, return empty
    return [];
  },
};

/**
 * Menu Services data operations
 */
export const menuServicesService = {
  async getAll(storeId: string, includeInactive = false) {
    if (USE_SQLITE) {
      return sqliteMenuServicesDB.getAll(storeId, includeInactive);
    }
    return menuServicesDB.getAll(storeId, includeInactive);
  },

  async getById(id: string) {
    if (USE_SQLITE) {
      return sqliteMenuServicesDB.getById(id);
    }
    return menuServicesDB.getById(id);
  },

  async getByCategory(storeId: string, categoryId: string) {
    if (USE_SQLITE) {
      return sqliteMenuServicesDB.getByCategory(storeId, categoryId);
    }
    return menuServicesDB.getByCategory(storeId, categoryId);
  },

  async create(input: unknown, userId: string, storeId: string) {
    if (USE_SQLITE) {
      return sqliteMenuServicesDB.create(input);
    }
    return menuServicesDB.create(input as Parameters<typeof menuServicesDB.create>[0], userId, storeId);
  },

  async update(id: string, updates: unknown, userId: string) {
    if (USE_SQLITE) {
      return sqliteMenuServicesDB.update(id, updates);
    }
    return menuServicesDB.update(id, updates as Partial<unknown>, userId);
  },

  async delete(id: string) {
    if (USE_SQLITE) {
      return sqliteMenuServicesDB.delete(id);
    }
    return menuServicesDB.delete(id);
  },

  async search(storeId: string, query: string) {
    if (USE_SQLITE) {
      return sqliteMenuServicesDB.search(storeId, query);
    }
    return menuServicesDB.search(storeId, query);
  },
};

/**
 * Service Variants data operations
 */
export const serviceVariantsService = {
  async getByService(serviceId: string) {
    if (USE_SQLITE) {
      return sqliteServiceVariantsDB.getByService(serviceId);
    }
    return serviceVariantsDB.getByService(serviceId);
  },

  async getById(id: string) {
    if (USE_SQLITE) {
      return sqliteServiceVariantsDB.getById(id);
    }
    return serviceVariantsDB.getById(id);
  },

  async create(input: unknown, userId: string, storeId: string) {
    if (USE_SQLITE) {
      return sqliteServiceVariantsDB.create(input);
    }
    return serviceVariantsDB.create(input as Parameters<typeof serviceVariantsDB.create>[0], userId, storeId);
  },

  async update(id: string, updates: unknown, userId: string) {
    if (USE_SQLITE) {
      return sqliteServiceVariantsDB.update(id, updates);
    }
    return serviceVariantsDB.update(id, updates as Partial<unknown>, userId);
  },

  async delete(id: string) {
    if (USE_SQLITE) {
      return sqliteServiceVariantsDB.delete(id);
    }
    return serviceVariantsDB.delete(id);
  },
};

/**
 * Service Packages data operations
 */
export const servicePackagesService = {
  async getAll(storeId: string) {
    if (USE_SQLITE) {
      return sqliteServicePackagesDB.getAll(storeId);
    }
    return servicePackagesDB.getAll(storeId);
  },

  async getById(id: string) {
    if (USE_SQLITE) {
      return sqliteServicePackagesDB.getById(id);
    }
    return servicePackagesDB.getById(id);
  },

  async create(input: unknown, userId: string, storeId: string) {
    if (USE_SQLITE) {
      return sqliteServicePackagesDB.create(input);
    }
    return servicePackagesDB.create(input as Parameters<typeof servicePackagesDB.create>[0], userId, storeId);
  },

  async update(id: string, updates: unknown, userId: string) {
    if (USE_SQLITE) {
      return sqliteServicePackagesDB.update(id, updates);
    }
    return servicePackagesDB.update(id, updates as Partial<unknown>, userId);
  },

  async delete(id: string) {
    if (USE_SQLITE) {
      return sqliteServicePackagesDB.delete(id);
    }
    return servicePackagesDB.delete(id);
  },

  // Note: search not available in Dexie servicePackagesDB - can be added later if needed
};

/**
 * Add-On Groups data operations
 */
export const addOnGroupsService = {
  async getAll(storeId: string) {
    if (USE_SQLITE) {
      return sqliteAddOnGroupsDB.getAll(storeId);
    }
    return addOnGroupsDB.getAll(storeId);
  },

  async getById(id: string) {
    if (USE_SQLITE) {
      return sqliteAddOnGroupsDB.getById(id);
    }
    return addOnGroupsDB.getById(id);
  },

  async create(input: unknown, userId: string, storeId: string) {
    if (USE_SQLITE) {
      return sqliteAddOnGroupsDB.create(input);
    }
    // Dexie API: create(input, userId, storeId)
    return addOnGroupsDB.create(input as Parameters<typeof addOnGroupsDB.create>[0], userId, storeId);
  },

  async update(id: string, updates: unknown, userId: string) {
    if (USE_SQLITE) {
      return sqliteAddOnGroupsDB.update(id, updates);
    }
    // Dexie API: update(id, updates, userId)
    return addOnGroupsDB.update(id, updates as Partial<AddOnGroup>, userId);
  },

  async delete(id: string) {
    if (USE_SQLITE) {
      return sqliteAddOnGroupsDB.delete(id);
    }
    return addOnGroupsDB.delete(id);
  },
};

/**
 * Add-On Options data operations
 */
export const addOnOptionsService = {
  async getByGroup(groupId: string) {
    if (USE_SQLITE) {
      return sqliteAddOnOptionsDB.getByGroup(groupId);
    }
    return addOnOptionsDB.getByGroup(groupId);
  },

  async getById(id: string) {
    if (USE_SQLITE) {
      return sqliteAddOnOptionsDB.getById(id);
    }
    return addOnOptionsDB.getById(id);
  },

  async create(input: unknown, userId: string, storeId: string) {
    if (USE_SQLITE) {
      return sqliteAddOnOptionsDB.create(input);
    }
    // Dexie API: create(input, userId, storeId)
    return addOnOptionsDB.create(input as Parameters<typeof addOnOptionsDB.create>[0], userId, storeId);
  },

  async update(id: string, updates: unknown, userId: string) {
    if (USE_SQLITE) {
      return sqliteAddOnOptionsDB.update(id, updates);
    }
    // Dexie API: update(id, updates, userId)
    return addOnOptionsDB.update(id, updates as Partial<AddOnOption>, userId);
  },

  async delete(id: string) {
    if (USE_SQLITE) {
      return sqliteAddOnOptionsDB.delete(id);
    }
    return addOnOptionsDB.delete(id);
  },
};

/**
 * Staff Service Assignments data operations
 */
export const staffServiceAssignmentsService = {
  async getByStaff(storeId: string, staffId: string) {
    if (USE_SQLITE) {
      return sqliteStaffServiceAssignmentsDB.getByStaff(staffId);
    }
    // Dexie API: getByStaff(storeId, staffId)
    return staffServiceAssignmentsDB.getByStaff(storeId, staffId);
  },

  async getByService(storeId: string, serviceId: string) {
    if (USE_SQLITE) {
      return sqliteStaffServiceAssignmentsDB.getByService(serviceId);
    }
    // Dexie API: getByService(storeId, serviceId)
    return staffServiceAssignmentsDB.getByService(storeId, serviceId);
  },

  async getById(id: string) {
    if (USE_SQLITE) {
      return sqliteStaffServiceAssignmentsDB.getById(id);
    }
    return staffServiceAssignmentsDB.getById(id);
  },

  async create(input: unknown, userId: string, storeId: string, deviceId: string = 'web-client', tenantId?: string) {
    if (USE_SQLITE) {
      return sqliteStaffServiceAssignmentsDB.create(input);
    }
    // Dexie API: create(input, storeId, userId, deviceId, tenantId)
    return staffServiceAssignmentsDB.create(
      input as Parameters<typeof staffServiceAssignmentsDB.create>[0],
      storeId,
      userId,
      deviceId,
      tenantId || storeId
    );
  },

  async update(id: string, updates: unknown, userId: string, deviceId: string = 'web-client') {
    if (USE_SQLITE) {
      return sqliteStaffServiceAssignmentsDB.update(id, updates);
    }
    // Dexie API: update(id, updates, userId, deviceId)
    return staffServiceAssignmentsDB.update(id, updates as Partial<unknown>, userId, deviceId);
  },

  async delete(id: string) {
    if (USE_SQLITE) {
      return sqliteStaffServiceAssignmentsDB.delete(id);
    }
    return staffServiceAssignmentsDB.delete(id);
  },
};

/**
 * Catalog Settings data operations
 */
export const catalogSettingsService = {
  async get(storeId: string) {
    if (USE_SQLITE) {
      return sqliteCatalogSettingsDB.get(storeId);
    }
    return catalogSettingsDB.get(storeId);
  },

  async set(storeId: string, settings: unknown, userId: string, deviceId: string = 'web-client') {
    if (USE_SQLITE) {
      return sqliteCatalogSettingsDB.set(storeId, settings);
    }
    // Dexie API: update(storeId, updates, userId, deviceId)
    return catalogSettingsDB.update(storeId, settings as Partial<unknown>, userId, deviceId);
  },
};

/**
 * Products data operations
 */
export const productsService = {
  async getAll(storeId: string) {
    if (USE_SQLITE) {
      return sqliteProductsDB.getAll(storeId);
    }
    return productsDB.getAll(storeId);
  },

  async getById(id: string) {
    if (USE_SQLITE) {
      return sqliteProductsDB.getById(id);
    }
    return productsDB.getById(id);
  },

  async getByCategory(storeId: string, categoryId: string) {
    if (USE_SQLITE) {
      return sqliteProductsDB.getByCategory(storeId, categoryId);
    }
    return productsDB.getByCategory(storeId, categoryId);
  },

  async create(input: unknown, _userId: string, storeId: string, tenantId?: string) {
    if (USE_SQLITE) {
      return sqliteProductsDB.create(input);
    }
    // Dexie API: create(data, storeId, tenantId) - no userId
    return productsDB.create(input as Parameters<typeof productsDB.create>[0], storeId, tenantId || storeId);
  },

  async update(id: string, updates: unknown, _userId: string) {
    if (USE_SQLITE) {
      return sqliteProductsDB.update(id, updates);
    }
    // Dexie API: update(id, changes) - no userId
    return productsDB.update(id, updates as Partial<unknown>);
  },

  async delete(id: string) {
    if (USE_SQLITE) {
      return sqliteProductsDB.delete(id);
    }
    return productsDB.delete(id);
  },

  // Note: search not available in Dexie productsDB

  async getBySku(storeId: string, sku: string) {
    if (USE_SQLITE) {
      return sqliteProductsDB.getBySku(storeId, sku);
    }
    return productsDB.getBySku(storeId, sku);
  },

  async getByBarcode(storeId: string, barcode: string) {
    if (USE_SQLITE) {
      // SQLite: storeId filter for multi-tenant isolation
      return sqliteProductsDB.getByBarcode(storeId, barcode);
    }
    // Dexie API: getByBarcode(storeId, barcode)
    return productsDB.getByBarcode(storeId, barcode);
  },

  async getCategories(storeId: string) {
    if (USE_SQLITE) {
      return sqliteProductsDB.getCategories(storeId);
    }
    return productsDB.getCategories(storeId);
  },

  async getRetail(storeId: string) {
    if (USE_SQLITE) {
      return sqliteProductsDB.getRetail(storeId);
    }
    return productsDB.getRetail(storeId);
  },
};
