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
import { menuServicesTable } from '@/services/supabase/tables/menuServicesTable';
import { serviceVariantsTable } from '@/services/supabase/tables/serviceVariantsTable';
import { servicePackagesTable } from '@/services/supabase/tables/servicePackagesTable';
import { addOnGroupsTable } from '@/services/supabase/tables/addOnGroupsTable';
import { addOnOptionsTable } from '@/services/supabase/tables/addOnOptionsTable';
import { staffServiceAssignmentsTable } from '@/services/supabase/tables/staffServiceAssignmentsTable';
import { catalogSettingsTable } from '@/services/supabase/tables/catalogSettingsTable';
import { productsTable } from '@/services/supabase/tables/productsTable';
import {
  toServiceCategory,
  toServiceCategories,
  toServiceCategoryInsert,
  toServiceCategoryUpdate,
} from '@/services/supabase/adapters/serviceCategoryAdapter';
import {
  toMenuService,
  toMenuServices,
  toMenuServiceInsert,
  toMenuServiceUpdate,
} from '@/services/supabase/adapters/menuServiceAdapter';
import {
  toServiceVariant,
  toServiceVariants,
  toServiceVariantInsert,
  toServiceVariantUpdate,
} from '@/services/supabase/adapters/serviceVariantAdapter';
import {
  toServicePackage,
  toServicePackages,
  toServicePackageInsert,
  toServicePackageUpdate,
} from '@/services/supabase/adapters/servicePackageAdapter';
import {
  toAddOnGroup,
  toAddOnGroups,
  toAddOnGroupInsert,
  toAddOnGroupUpdate,
} from '@/services/supabase/adapters/addOnGroupAdapter';
import {
  toAddOnOption,
  toAddOnOptions,
  toAddOnOptionInsert,
  toAddOnOptionUpdate,
} from '@/services/supabase/adapters/addOnOptionAdapter';
import {
  toStaffServiceAssignment,
  toStaffServiceAssignments,
  toStaffServiceAssignmentInsert,
  toStaffServiceAssignmentUpdate,
} from '@/services/supabase/adapters/staffServiceAssignmentAdapter';
import {
  toCatalogSettings,
  toCatalogSettingsUpdate,
} from '@/services/supabase/adapters/catalogSettingsAdapter';
import {
  toProduct,
  toProducts,
  toProductInsert,
  toProductUpdate,
} from '@/services/supabase/adapters/productAdapter';

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
import type {
  AddOnGroup,
  AddOnOption,
  ServiceCategory,
  CreateCategoryInput,
  MenuService,
  CreateMenuServiceInput,
  ServiceVariant,
  CreateVariantInput,
  ServicePackage,
  CreatePackageInput,
  CreateAddOnGroupInput,
  CreateAddOnOptionInput,
  StaffServiceAssignment,
  CreateStaffAssignmentInput,
  CatalogSettings,
} from '@/types/catalog';
import type { Product } from '@/types/inventory';

/**
 * CreateProductInput - Input type for creating a new Product
 * Omits auto-generated fields from BaseSyncableEntity
 */
type CreateProductInput = Omit<Product,
  | 'id'
  | 'tenantId'
  | 'storeId'
  | 'locationId'
  | 'syncStatus'
  | 'version'
  | 'vectorClock'
  | 'lastSyncedVersion'
  | 'createdAt'
  | 'updatedAt'
  | 'createdBy'
  | 'createdByDevice'
  | 'lastModifiedBy'
  | 'lastModifiedByDevice'
  | 'isDeleted'
  | 'deletedAt'
  | 'deletedBy'
  | 'deletedByDevice'
  | 'tombstoneExpiresAt'
>;

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
 *
 * Routing priority:
 * 1. SQLite (if USE_SQLITE=true, Electron only)
 * 2. Supabase (if USE_SUPABASE=true and online)
 * 3. Dexie/IndexedDB (default local-first storage)
 */
export const menuServicesService = {
  async getAll(storeId: string, includeInactive = false): Promise<MenuService[]> {
    // SQLite path (Electron)
    if (USE_SQLITE) {
      const result = await sqliteMenuServicesDB.getAll(storeId, includeInactive);
      return result as MenuService[];
    }

    // Supabase path (online-only devices with opt-in)
    if (USE_SUPABASE) {
      const rows = await menuServicesTable.getByStoreId(storeId, includeInactive);
      return toMenuServices(rows);
    }

    // Dexie path (default local-first)
    return menuServicesDB.getAll(storeId, includeInactive);
  },

  async getById(id: string): Promise<MenuService | undefined> {
    // SQLite path
    if (USE_SQLITE) {
      const result = await sqliteMenuServicesDB.getById(id);
      return result as MenuService | undefined;
    }

    // Supabase path
    if (USE_SUPABASE) {
      const row = await menuServicesTable.getById(id);
      return row ? toMenuService(row) : undefined;
    }

    // Dexie path
    return menuServicesDB.getById(id);
  },

  async getByCategoryId(storeId: string, categoryId: string): Promise<MenuService[]> {
    // SQLite path
    if (USE_SQLITE) {
      const result = await sqliteMenuServicesDB.getByCategory(storeId, categoryId);
      return result as MenuService[];
    }

    // Supabase path
    if (USE_SUPABASE) {
      const rows = await menuServicesTable.getByCategoryId(categoryId, false);
      return toMenuServices(rows);
    }

    // Dexie path
    return menuServicesDB.getByCategory(storeId, categoryId);
  },

  async create(
    input: CreateMenuServiceInput,
    userId: string,
    storeId: string,
    tenantId?: string,
    deviceId?: string
  ): Promise<MenuService> {
    // SQLite path
    if (USE_SQLITE) {
      const result = await sqliteMenuServicesDB.create(input);
      return result as MenuService;
    }

    // Supabase path
    if (USE_SUPABASE) {
      const effectiveTenantId = tenantId || getTenantId() || storeId;
      const effectiveDeviceId = deviceId || getDeviceId();
      const insertData = toMenuServiceInsert(input, storeId, effectiveTenantId, userId, effectiveDeviceId);
      const row = await menuServicesTable.create(insertData);
      return toMenuService(row);
    }

    // Dexie path
    return menuServicesDB.create(input, userId, storeId);
  },

  async update(
    id: string,
    updates: Partial<MenuService>,
    userId: string,
    deviceId?: string
  ): Promise<MenuService | undefined> {
    // SQLite path
    if (USE_SQLITE) {
      const result = await sqliteMenuServicesDB.update(id, updates);
      return result as MenuService | undefined;
    }

    // Supabase path
    if (USE_SUPABASE) {
      const effectiveDeviceId = deviceId || getDeviceId();
      const updateData = toMenuServiceUpdate(updates, userId, effectiveDeviceId);
      const row = await menuServicesTable.update(id, updateData);
      return toMenuService(row);
    }

    // Dexie path
    return menuServicesDB.update(id, updates, userId);
  },

  async delete(id: string, userId?: string, deviceId?: string): Promise<void> {
    // SQLite path
    if (USE_SQLITE) {
      return sqliteMenuServicesDB.delete(id);
    }

    // Supabase path (soft delete with tombstone)
    if (USE_SUPABASE) {
      const effectiveUserId = userId || getUserId();
      const effectiveDeviceId = deviceId || getDeviceId();
      return menuServicesTable.delete(id, effectiveUserId, effectiveDeviceId);
    }

    // Dexie path
    return menuServicesDB.delete(id);
  },

  async archive(id: string, userId?: string): Promise<MenuService | undefined> {
    // SQLite path
    if (USE_SQLITE) {
      // SQLite doesn't have archive, just delete
      await sqliteMenuServicesDB.delete(id);
      return undefined;
    }

    // Supabase path
    if (USE_SUPABASE) {
      const effectiveUserId = userId || getUserId();
      const row = await menuServicesTable.archive(id, effectiveUserId);
      return toMenuService(row);
    }

    // Dexie path
    return menuServicesDB.archive(id, userId || '');
  },

  async restore(id: string, userId?: string): Promise<MenuService | undefined> {
    // SQLite path
    if (USE_SQLITE) {
      // SQLite doesn't have restore
      return undefined;
    }

    // Supabase path
    if (USE_SUPABASE) {
      const row = await menuServicesTable.restore(id);
      return toMenuService(row);
    }

    // Dexie path
    const effectiveUserId = userId || getUserId();
    return menuServicesDB.restore(id, effectiveUserId);
  },

  async search(storeId: string, query: string, limit = 50): Promise<MenuService[]> {
    // SQLite path
    if (USE_SQLITE) {
      const result = await sqliteMenuServicesDB.search(storeId, query);
      return result as MenuService[];
    }

    // Supabase path
    if (USE_SUPABASE) {
      const rows = await menuServicesTable.search(storeId, query, limit);
      return toMenuServices(rows);
    }

    // Dexie path
    return menuServicesDB.search(storeId, query);
  },

  /**
   * Get services updated since a specific time (for sync)
   */
  async getUpdatedSince(storeId: string, since: Date): Promise<MenuService[]> {
    // Supabase path
    if (USE_SUPABASE) {
      const rows = await menuServicesTable.getUpdatedSince(storeId, since);
      return toMenuServices(rows);
    }

    // Fallback: not available in SQLite/Dexie, return empty
    return [];
  },

  /**
   * Get services available for online booking
   */
  async getOnlineBookingServices(storeId: string): Promise<MenuService[]> {
    // Supabase path
    if (USE_SUPABASE) {
      const rows = await menuServicesTable.getOnlineBookingServices(storeId);
      return toMenuServices(rows);
    }

    // Fallback: filter from getAll
    const all = await this.getAll(storeId, false);
    return all.filter(s => s.onlineBookingEnabled && (s.bookingAvailability === 'online' || s.bookingAvailability === 'both'));
  },

  /**
   * Get services with variants (hasVariants = true)
   */
  async getServicesWithVariants(storeId: string): Promise<MenuService[]> {
    // Supabase path
    if (USE_SUPABASE) {
      const rows = await menuServicesTable.getServicesWithVariants(storeId);
      return toMenuServices(rows);
    }

    // Fallback: filter from getAll
    const all = await this.getAll(storeId, false);
    return all.filter(s => s.hasVariants);
  },

  /**
   * Get archived services only
   */
  async getArchivedServices(storeId: string): Promise<MenuService[]> {
    // Supabase path
    if (USE_SUPABASE) {
      const rows = await menuServicesTable.getArchivedServices(storeId);
      return toMenuServices(rows);
    }

    // Fallback: filter from getAll (includes archived)
    const all = await this.getAll(storeId, true);
    return all.filter(s => s.status === 'archived');
  },
};

/**
 * Service Variants data operations
 *
 * Routing priority:
 * 1. SQLite (if USE_SQLITE=true, Electron only)
 * 2. Supabase (if USE_SUPABASE=true and online)
 * 3. Dexie/IndexedDB (default local-first storage)
 */
export const serviceVariantsService = {
  async getByService(serviceId: string): Promise<ServiceVariant[]> {
    // SQLite path
    if (USE_SQLITE) {
      const result = await sqliteServiceVariantsDB.getByService(serviceId);
      return result as ServiceVariant[];
    }

    // Supabase path
    if (USE_SUPABASE) {
      const rows = await serviceVariantsTable.getByServiceId(serviceId, false);
      return toServiceVariants(rows);
    }

    // Dexie path
    return serviceVariantsDB.getByService(serviceId);
  },

  async getById(id: string): Promise<ServiceVariant | undefined> {
    // SQLite path
    if (USE_SQLITE) {
      const result = await sqliteServiceVariantsDB.getById(id);
      return result as ServiceVariant | undefined;
    }

    // Supabase path
    if (USE_SUPABASE) {
      const row = await serviceVariantsTable.getById(id);
      return row ? toServiceVariant(row) : undefined;
    }

    // Dexie path
    return serviceVariantsDB.getById(id);
  },

  async create(
    input: CreateVariantInput,
    userId: string,
    storeId: string,
    tenantId?: string,
    deviceId?: string
  ): Promise<ServiceVariant> {
    // SQLite path
    if (USE_SQLITE) {
      const result = await sqliteServiceVariantsDB.create(input);
      return result as ServiceVariant;
    }

    // Supabase path
    if (USE_SUPABASE) {
      const effectiveTenantId = tenantId || getTenantId() || storeId;
      const effectiveDeviceId = deviceId || getDeviceId();
      const insertData = toServiceVariantInsert(input, storeId, effectiveTenantId, userId, effectiveDeviceId);
      const row = await serviceVariantsTable.create(insertData);
      return toServiceVariant(row);
    }

    // Dexie path
    return serviceVariantsDB.create(input, userId, storeId);
  },

  async update(
    id: string,
    updates: Partial<ServiceVariant>,
    userId: string,
    deviceId?: string
  ): Promise<ServiceVariant | undefined> {
    // SQLite path
    if (USE_SQLITE) {
      const result = await sqliteServiceVariantsDB.update(id, updates);
      return result as ServiceVariant | undefined;
    }

    // Supabase path
    if (USE_SUPABASE) {
      const effectiveDeviceId = deviceId || getDeviceId();
      const updateData = toServiceVariantUpdate(updates, userId, effectiveDeviceId);
      const row = await serviceVariantsTable.update(id, updateData);
      return toServiceVariant(row);
    }

    // Dexie path
    return serviceVariantsDB.update(id, updates, userId);
  },

  async delete(id: string, userId?: string, deviceId?: string): Promise<void> {
    // SQLite path
    if (USE_SQLITE) {
      return sqliteServiceVariantsDB.delete(id);
    }

    // Supabase path (soft delete with tombstone)
    if (USE_SUPABASE) {
      const effectiveUserId = userId || getUserId();
      const effectiveDeviceId = deviceId || getDeviceId();
      return serviceVariantsTable.delete(id, effectiveUserId, effectiveDeviceId);
    }

    // Dexie path
    return serviceVariantsDB.delete(id);
  },

  /**
   * Get the default variant for a service
   */
  async getDefaultVariant(serviceId: string): Promise<ServiceVariant | undefined> {
    // Supabase path
    if (USE_SUPABASE) {
      const row = await serviceVariantsTable.getDefaultVariant(serviceId);
      return row ? toServiceVariant(row) : undefined;
    }

    // Fallback: get all and find default
    const variants = await this.getByService(serviceId);
    return variants.find(v => v.isDefault);
  },

  /**
   * Get variants updated since a specific time (for sync)
   */
  async getUpdatedSince(storeId: string, since: Date): Promise<ServiceVariant[]> {
    // Supabase path
    if (USE_SUPABASE) {
      const rows = await serviceVariantsTable.getUpdatedSince(storeId, since);
      return toServiceVariants(rows);
    }

    // Fallback: not available in SQLite/Dexie
    return [];
  },
};

/**
 * Service Packages data operations
 *
 * Routing priority:
 * 1. SQLite (if USE_SQLITE=true, Electron only)
 * 2. Supabase (if USE_SUPABASE=true and online)
 * 3. Dexie/IndexedDB (default local-first storage)
 */
export const servicePackagesService = {
  async getAll(storeId: string, includeInactive = false): Promise<ServicePackage[]> {
    // SQLite path
    if (USE_SQLITE) {
      const result = await sqliteServicePackagesDB.getAll(storeId);
      return result as ServicePackage[];
    }

    // Supabase path
    if (USE_SUPABASE) {
      const rows = await servicePackagesTable.getByStoreId(storeId, includeInactive);
      return toServicePackages(rows);
    }

    // Dexie path
    return servicePackagesDB.getAll(storeId);
  },

  async getById(id: string): Promise<ServicePackage | undefined> {
    // SQLite path
    if (USE_SQLITE) {
      const result = await sqliteServicePackagesDB.getById(id);
      return result as ServicePackage | undefined;
    }

    // Supabase path
    if (USE_SUPABASE) {
      const row = await servicePackagesTable.getById(id);
      return row ? toServicePackage(row) : undefined;
    }

    // Dexie path
    return servicePackagesDB.getById(id);
  },

  async create(
    input: CreatePackageInput,
    userId: string,
    storeId: string,
    tenantId?: string,
    deviceId?: string
  ): Promise<ServicePackage> {
    // SQLite path
    if (USE_SQLITE) {
      const result = await sqliteServicePackagesDB.create(input);
      return result as ServicePackage;
    }

    // Supabase path
    if (USE_SUPABASE) {
      const effectiveTenantId = tenantId || getTenantId() || storeId;
      const effectiveDeviceId = deviceId || getDeviceId();
      const insertData = toServicePackageInsert(input, storeId, effectiveTenantId, userId, effectiveDeviceId);
      const row = await servicePackagesTable.create(insertData);
      return toServicePackage(row);
    }

    // Dexie path
    return servicePackagesDB.create(input, userId, storeId);
  },

  async update(
    id: string,
    updates: Partial<ServicePackage>,
    userId: string,
    deviceId?: string
  ): Promise<ServicePackage | undefined> {
    // SQLite path
    if (USE_SQLITE) {
      const result = await sqliteServicePackagesDB.update(id, updates);
      return result as ServicePackage | undefined;
    }

    // Supabase path
    if (USE_SUPABASE) {
      const effectiveDeviceId = deviceId || getDeviceId();
      const updateData = toServicePackageUpdate(updates, userId, effectiveDeviceId);
      const row = await servicePackagesTable.update(id, updateData);
      return toServicePackage(row);
    }

    // Dexie path
    return servicePackagesDB.update(id, updates, userId);
  },

  async delete(id: string, userId?: string, deviceId?: string): Promise<void> {
    // SQLite path
    if (USE_SQLITE) {
      return sqliteServicePackagesDB.delete(id);
    }

    // Supabase path (soft delete with tombstone)
    if (USE_SUPABASE) {
      const effectiveUserId = userId || getUserId();
      const effectiveDeviceId = deviceId || getDeviceId();
      return servicePackagesTable.delete(id, effectiveUserId, effectiveDeviceId);
    }

    // Dexie path
    return servicePackagesDB.delete(id);
  },

  /**
   * Search packages by name or description
   */
  async search(storeId: string, query: string, limit = 50): Promise<ServicePackage[]> {
    // Supabase path
    if (USE_SUPABASE) {
      const rows = await servicePackagesTable.search(storeId, query, limit);
      return toServicePackages(rows);
    }

    // Fallback: getAll and filter in JS
    const all = await this.getAll(storeId, false);
    const lowerQuery = query.toLowerCase();
    return all.filter(pkg =>
      pkg.name.toLowerCase().includes(lowerQuery) ||
      pkg.description?.toLowerCase().includes(lowerQuery)
    ).slice(0, limit);
  },

  /**
   * Get packages available for online booking
   */
  async getOnlineBookingPackages(storeId: string): Promise<ServicePackage[]> {
    // Supabase path
    if (USE_SUPABASE) {
      const rows = await servicePackagesTable.getOnlineBookingPackages(storeId);
      return toServicePackages(rows);
    }

    // Fallback: filter from getAll
    const all = await this.getAll(storeId, false);
    return all.filter(pkg =>
      pkg.onlineBookingEnabled &&
      (pkg.bookingAvailability === 'online' || pkg.bookingAvailability === 'both')
    );
  },

  /**
   * Get packages updated since a specific time (for sync)
   */
  async getUpdatedSince(storeId: string, since: Date): Promise<ServicePackage[]> {
    // Supabase path
    if (USE_SUPABASE) {
      const rows = await servicePackagesTable.getUpdatedSince(storeId, since);
      return toServicePackages(rows);
    }

    // Fallback: not available in SQLite/Dexie
    return [];
  },
};

/**
 * Add-On Groups data operations
 *
 * Routing priority:
 * 1. SQLite (if USE_SQLITE=true, Electron only)
 * 2. Supabase (if USE_SUPABASE=true and online)
 * 3. Dexie/IndexedDB (default local-first storage)
 */
export const addOnGroupsService = {
  async getAll(storeId: string, includeInactive = false): Promise<AddOnGroup[]> {
    // SQLite path
    if (USE_SQLITE) {
      const result = await sqliteAddOnGroupsDB.getAll(storeId);
      return result as AddOnGroup[];
    }

    // Supabase path
    if (USE_SUPABASE) {
      const rows = await addOnGroupsTable.getByStoreId(storeId, includeInactive);
      return toAddOnGroups(rows);
    }

    // Dexie path
    return addOnGroupsDB.getAll(storeId);
  },

  async getById(id: string): Promise<AddOnGroup | undefined> {
    // SQLite path
    if (USE_SQLITE) {
      const result = await sqliteAddOnGroupsDB.getById(id);
      return result as AddOnGroup | undefined;
    }

    // Supabase path
    if (USE_SUPABASE) {
      const row = await addOnGroupsTable.getById(id);
      return row ? toAddOnGroup(row) : undefined;
    }

    // Dexie path
    return addOnGroupsDB.getById(id);
  },

  async create(
    input: CreateAddOnGroupInput,
    userId: string,
    storeId: string,
    tenantId?: string,
    deviceId?: string
  ): Promise<AddOnGroup> {
    // SQLite path
    if (USE_SQLITE) {
      const result = await sqliteAddOnGroupsDB.create(input);
      return result as AddOnGroup;
    }

    // Supabase path
    if (USE_SUPABASE) {
      const effectiveTenantId = tenantId || getTenantId() || storeId;
      const effectiveDeviceId = deviceId || getDeviceId();
      const insertData = toAddOnGroupInsert(input, storeId, effectiveTenantId, userId, effectiveDeviceId);
      const row = await addOnGroupsTable.create(insertData);
      return toAddOnGroup(row);
    }

    // Dexie path
    return addOnGroupsDB.create(input, userId, storeId);
  },

  async update(
    id: string,
    updates: Partial<AddOnGroup>,
    userId: string,
    deviceId?: string
  ): Promise<AddOnGroup | undefined> {
    // SQLite path
    if (USE_SQLITE) {
      const result = await sqliteAddOnGroupsDB.update(id, updates);
      return result as AddOnGroup | undefined;
    }

    // Supabase path
    if (USE_SUPABASE) {
      const effectiveDeviceId = deviceId || getDeviceId();
      const updateData = toAddOnGroupUpdate(updates, userId, effectiveDeviceId);
      const row = await addOnGroupsTable.update(id, updateData);
      return toAddOnGroup(row);
    }

    // Dexie path
    return addOnGroupsDB.update(id, updates, userId);
  },

  async delete(id: string, userId?: string, deviceId?: string): Promise<void> {
    // SQLite path
    if (USE_SQLITE) {
      return sqliteAddOnGroupsDB.delete(id);
    }

    // Supabase path (soft delete with tombstone)
    if (USE_SUPABASE) {
      const effectiveUserId = userId || getUserId();
      const effectiveDeviceId = deviceId || getDeviceId();
      return addOnGroupsTable.delete(id, effectiveUserId, effectiveDeviceId);
    }

    // Dexie path
    return addOnGroupsDB.delete(id);
  },

  /**
   * Get add-on groups applicable to a service
   */
  async getForService(storeId: string, serviceId?: string, categoryId?: string): Promise<AddOnGroup[]> {
    // Supabase path
    if (USE_SUPABASE) {
      const rows = await addOnGroupsTable.getForService(storeId, serviceId, categoryId);
      return toAddOnGroups(rows);
    }

    // Fallback: getAll and filter in JS
    const all = await this.getAll(storeId, false);
    return all.filter(group => {
      if (group.applicableToAll) return true;
      if (serviceId && group.applicableServiceIds?.includes(serviceId)) return true;
      if (categoryId && group.applicableCategoryIds?.includes(categoryId)) return true;
      return false;
    });
  },

  /**
   * Get add-on groups visible for online booking
   */
  async getOnlineBookingGroups(storeId: string): Promise<AddOnGroup[]> {
    // Supabase path
    if (USE_SUPABASE) {
      const rows = await addOnGroupsTable.getOnlineBookingGroups(storeId);
      return toAddOnGroups(rows);
    }

    // Fallback: filter from getAll
    const all = await this.getAll(storeId, false);
    return all.filter(g => g.onlineBookingEnabled);
  },

  /**
   * Search add-on groups by name
   */
  async search(storeId: string, query: string, limit = 50): Promise<AddOnGroup[]> {
    // Supabase path
    if (USE_SUPABASE) {
      const rows = await addOnGroupsTable.search(storeId, query, limit);
      return toAddOnGroups(rows);
    }

    // Fallback: getAll and filter in JS
    const all = await this.getAll(storeId, false);
    const lowerQuery = query.toLowerCase();
    return all.filter(g => g.name.toLowerCase().includes(lowerQuery)).slice(0, limit);
  },

  /**
   * Get add-on groups updated since a specific time (for sync)
   */
  async getUpdatedSince(storeId: string, since: Date): Promise<AddOnGroup[]> {
    // Supabase path
    if (USE_SUPABASE) {
      const rows = await addOnGroupsTable.getUpdatedSince(storeId, since);
      return toAddOnGroups(rows);
    }

    // Fallback: not available in SQLite/Dexie
    return [];
  },
};

/**
 * Add-On Options data operations
 *
 * Routing priority:
 * 1. SQLite (if USE_SQLITE=true, Electron only)
 * 2. Supabase (if USE_SUPABASE=true and online)
 * 3. Dexie/IndexedDB (default local-first storage)
 */
export const addOnOptionsService = {
  async getByGroup(groupId: string, includeInactive = false): Promise<AddOnOption[]> {
    // SQLite path
    if (USE_SQLITE) {
      const result = await sqliteAddOnOptionsDB.getByGroup(groupId);
      return result as AddOnOption[];
    }

    // Supabase path
    if (USE_SUPABASE) {
      const rows = await addOnOptionsTable.getByGroupId(groupId, includeInactive);
      return toAddOnOptions(rows);
    }

    // Dexie path
    return addOnOptionsDB.getByGroup(groupId);
  },

  async getById(id: string): Promise<AddOnOption | undefined> {
    // SQLite path
    if (USE_SQLITE) {
      const result = await sqliteAddOnOptionsDB.getById(id);
      return result as AddOnOption | undefined;
    }

    // Supabase path
    if (USE_SUPABASE) {
      const row = await addOnOptionsTable.getById(id);
      return row ? toAddOnOption(row) : undefined;
    }

    // Dexie path
    return addOnOptionsDB.getById(id);
  },

  async create(
    input: CreateAddOnOptionInput,
    userId: string,
    storeId: string,
    tenantId?: string,
    deviceId?: string
  ): Promise<AddOnOption> {
    // SQLite path
    if (USE_SQLITE) {
      const result = await sqliteAddOnOptionsDB.create(input);
      return result as AddOnOption;
    }

    // Supabase path
    if (USE_SUPABASE) {
      const effectiveTenantId = tenantId || getTenantId() || storeId;
      const effectiveDeviceId = deviceId || getDeviceId();
      const insertData = toAddOnOptionInsert(input, storeId, effectiveTenantId, userId, effectiveDeviceId);
      const row = await addOnOptionsTable.create(insertData);
      return toAddOnOption(row);
    }

    // Dexie path
    return addOnOptionsDB.create(input, userId, storeId);
  },

  async update(
    id: string,
    updates: Partial<AddOnOption>,
    userId: string,
    deviceId?: string
  ): Promise<AddOnOption | undefined> {
    // SQLite path
    if (USE_SQLITE) {
      const result = await sqliteAddOnOptionsDB.update(id, updates);
      return result as AddOnOption | undefined;
    }

    // Supabase path
    if (USE_SUPABASE) {
      const effectiveDeviceId = deviceId || getDeviceId();
      const updateData = toAddOnOptionUpdate(updates, userId, effectiveDeviceId);
      const row = await addOnOptionsTable.update(id, updateData);
      return toAddOnOption(row);
    }

    // Dexie path
    return addOnOptionsDB.update(id, updates, userId);
  },

  async delete(id: string, userId?: string, deviceId?: string): Promise<void> {
    // SQLite path
    if (USE_SQLITE) {
      return sqliteAddOnOptionsDB.delete(id);
    }

    // Supabase path (soft delete with tombstone)
    if (USE_SUPABASE) {
      const effectiveUserId = userId || getUserId();
      const effectiveDeviceId = deviceId || getDeviceId();
      return addOnOptionsTable.delete(id, effectiveUserId, effectiveDeviceId);
    }

    // Dexie path
    return addOnOptionsDB.delete(id);
  },

  /**
   * Get all options for multiple groups (for bulk loading)
   */
  async getByGroupIds(groupIds: string[]): Promise<AddOnOption[]> {
    if (groupIds.length === 0) return [];

    // Supabase path
    if (USE_SUPABASE) {
      const rows = await addOnOptionsTable.getByGroupIds(groupIds);
      return toAddOnOptions(rows);
    }

    // Fallback: get by each group and merge
    const results: AddOnOption[] = [];
    for (const groupId of groupIds) {
      const options = await this.getByGroup(groupId, false);
      results.push(...options);
    }
    return results;
  },

  /**
   * Search add-on options by name
   */
  async search(storeId: string, query: string, limit = 50): Promise<AddOnOption[]> {
    // Supabase path
    if (USE_SUPABASE) {
      const rows = await addOnOptionsTable.search(storeId, query, limit);
      return toAddOnOptions(rows);
    }

    // Fallback: not available in SQLite/Dexie, return empty
    return [];
  },

  /**
   * Get add-on options updated since a specific time (for sync)
   */
  async getUpdatedSince(storeId: string, since: Date): Promise<AddOnOption[]> {
    // Supabase path
    if (USE_SUPABASE) {
      const rows = await addOnOptionsTable.getUpdatedSince(storeId, since);
      return toAddOnOptions(rows);
    }

    // Fallback: not available in SQLite/Dexie
    return [];
  },
};

/**
 * Staff Service Assignments data operations
 *
 * Routing priority:
 * 1. SQLite (if USE_SQLITE=true, Electron only)
 * 2. Supabase (if USE_SUPABASE=true and online)
 * 3. Dexie/IndexedDB (default local-first storage)
 */
export const staffServiceAssignmentsService = {
  async getByStaff(storeId: string, staffId: string, includeInactive = false): Promise<StaffServiceAssignment[]> {
    // SQLite path
    if (USE_SQLITE) {
      const result = await sqliteStaffServiceAssignmentsDB.getByStaff(staffId);
      return result as StaffServiceAssignment[];
    }

    // Supabase path
    if (USE_SUPABASE) {
      const rows = await staffServiceAssignmentsTable.getByStaffId(staffId, includeInactive);
      return toStaffServiceAssignments(rows);
    }

    // Dexie path
    return staffServiceAssignmentsDB.getByStaff(storeId, staffId);
  },

  async getByService(storeId: string, serviceId: string, includeInactive = false): Promise<StaffServiceAssignment[]> {
    // SQLite path
    if (USE_SQLITE) {
      const result = await sqliteStaffServiceAssignmentsDB.getByService(serviceId);
      return result as StaffServiceAssignment[];
    }

    // Supabase path
    if (USE_SUPABASE) {
      const rows = await staffServiceAssignmentsTable.getByServiceId(serviceId, includeInactive);
      return toStaffServiceAssignments(rows);
    }

    // Dexie path
    return staffServiceAssignmentsDB.getByService(storeId, serviceId);
  },

  async getById(id: string): Promise<StaffServiceAssignment | undefined> {
    // SQLite path
    if (USE_SQLITE) {
      const result = await sqliteStaffServiceAssignmentsDB.getById(id);
      return result as StaffServiceAssignment | undefined;
    }

    // Supabase path
    if (USE_SUPABASE) {
      const row = await staffServiceAssignmentsTable.getById(id);
      return row ? toStaffServiceAssignment(row) : undefined;
    }

    // Dexie path
    return staffServiceAssignmentsDB.getById(id);
  },

  async create(
    input: CreateStaffAssignmentInput,
    userId: string,
    storeId: string,
    deviceId?: string,
    tenantId?: string
  ): Promise<StaffServiceAssignment> {
    const effectiveDeviceId = deviceId || getDeviceId();
    const effectiveTenantId = tenantId || getTenantId() || storeId;

    // SQLite path
    if (USE_SQLITE) {
      const result = await sqliteStaffServiceAssignmentsDB.create(input);
      return result as StaffServiceAssignment;
    }

    // Supabase path
    if (USE_SUPABASE) {
      const insertData = toStaffServiceAssignmentInsert(input, storeId, effectiveTenantId, userId, effectiveDeviceId);
      const row = await staffServiceAssignmentsTable.create(insertData);
      return toStaffServiceAssignment(row);
    }

    // Dexie path
    return staffServiceAssignmentsDB.create(input, storeId, userId, effectiveDeviceId, effectiveTenantId);
  },

  async update(
    id: string,
    updates: Partial<StaffServiceAssignment>,
    userId: string,
    deviceId?: string
  ): Promise<StaffServiceAssignment | undefined> {
    const effectiveDeviceId = deviceId || getDeviceId();

    // SQLite path
    if (USE_SQLITE) {
      const result = await sqliteStaffServiceAssignmentsDB.update(id, updates);
      return result as StaffServiceAssignment | undefined;
    }

    // Supabase path
    if (USE_SUPABASE) {
      const updateData = toStaffServiceAssignmentUpdate(updates, userId, effectiveDeviceId);
      const row = await staffServiceAssignmentsTable.update(id, updateData);
      return toStaffServiceAssignment(row);
    }

    // Dexie path
    return staffServiceAssignmentsDB.update(id, updates, userId, effectiveDeviceId);
  },

  async delete(id: string, userId?: string, deviceId?: string): Promise<void> {
    // SQLite path
    if (USE_SQLITE) {
      return sqliteStaffServiceAssignmentsDB.delete(id);
    }

    // Supabase path (soft delete with tombstone)
    if (USE_SUPABASE) {
      const effectiveUserId = userId || getUserId();
      const effectiveDeviceId = deviceId || getDeviceId();
      return staffServiceAssignmentsTable.delete(id, effectiveUserId, effectiveDeviceId);
    }

    // Dexie path
    return staffServiceAssignmentsDB.delete(id);
  },

  /**
   * Get assignment for a specific staff-service pair
   */
  async getByStaffAndService(staffId: string, serviceId: string): Promise<StaffServiceAssignment | undefined> {
    // Supabase path
    if (USE_SUPABASE) {
      const row = await staffServiceAssignmentsTable.getByStaffAndService(staffId, serviceId);
      return row ? toStaffServiceAssignment(row) : undefined;
    }

    // Fallback: get by staff and filter
    const storeId = getStoreId();
    const assignments = await this.getByStaff(storeId, staffId, false);
    return assignments.find(a => a.serviceId === serviceId);
  },

  /**
   * Get staff IDs that can perform a service
   */
  async getStaffIdsForService(serviceId: string): Promise<string[]> {
    // Supabase path
    if (USE_SUPABASE) {
      return staffServiceAssignmentsTable.getStaffIdsForService(serviceId);
    }

    // Fallback: get by service and map
    const storeId = getStoreId();
    const assignments = await this.getByService(storeId, serviceId, false);
    return assignments.map(a => a.staffId);
  },

  /**
   * Get service IDs a staff member can perform
   */
  async getServiceIdsForStaff(staffId: string): Promise<string[]> {
    // Supabase path
    if (USE_SUPABASE) {
      return staffServiceAssignmentsTable.getServiceIdsForStaff(staffId);
    }

    // Fallback: get by staff and map
    const storeId = getStoreId();
    const assignments = await this.getByStaff(storeId, staffId, false);
    return assignments.map(a => a.serviceId);
  },

  /**
   * Get assignments updated since a specific time (for sync)
   */
  async getUpdatedSince(storeId: string, since: Date): Promise<StaffServiceAssignment[]> {
    // Supabase path
    if (USE_SUPABASE) {
      const rows = await staffServiceAssignmentsTable.getUpdatedSince(storeId, since);
      return toStaffServiceAssignments(rows);
    }

    // Fallback: not available in SQLite/Dexie
    return [];
  },
};

/**
 * Catalog Settings data operations
 *
 * Routing priority:
 * 1. SQLite (if USE_SQLITE=true, Electron only)
 * 2. Supabase (if USE_SUPABASE=true and online)
 * 3. Dexie/IndexedDB (default local-first storage)
 */
export const catalogSettingsService = {
  async get(storeId: string): Promise<CatalogSettings | undefined> {
    // SQLite path
    if (USE_SQLITE) {
      const result = await sqliteCatalogSettingsDB.get(storeId);
      return result as CatalogSettings | undefined;
    }

    // Supabase path
    if (USE_SUPABASE) {
      const row = await catalogSettingsTable.get(storeId);
      return row ? toCatalogSettings(row) : undefined;
    }

    // Dexie path
    return catalogSettingsDB.get(storeId);
  },

  /**
   * Get or create settings for a store
   * Creates default settings if none exist
   */
  async getOrCreate(
    storeId: string,
    tenantId?: string,
    userId?: string,
    deviceId?: string
  ): Promise<CatalogSettings> {
    const effectiveTenantId = tenantId || getTenantId() || storeId;
    const effectiveUserId = userId || getUserId();
    const effectiveDeviceId = deviceId || getDeviceId();

    // Supabase path
    if (USE_SUPABASE) {
      const row = await catalogSettingsTable.getOrCreate(
        storeId,
        effectiveTenantId,
        effectiveUserId,
        effectiveDeviceId
      );
      return toCatalogSettings(row);
    }

    // Dexie has getOrCreate
    return catalogSettingsDB.getOrCreate(storeId, effectiveUserId, effectiveDeviceId, effectiveTenantId);
  },

  async update(
    storeId: string,
    updates: Partial<CatalogSettings>,
    userId?: string,
    deviceId?: string
  ): Promise<CatalogSettings | undefined> {
    const effectiveUserId = userId || getUserId();
    const effectiveDeviceId = deviceId || getDeviceId();

    // SQLite path
    if (USE_SQLITE) {
      const result = await sqliteCatalogSettingsDB.set(storeId, updates);
      return result as CatalogSettings | undefined;
    }

    // Supabase path
    if (USE_SUPABASE) {
      const updateData = toCatalogSettingsUpdate(updates, effectiveUserId, effectiveDeviceId);
      const row = await catalogSettingsTable.update(storeId, updateData);
      return toCatalogSettings(row);
    }

    // Dexie path
    return catalogSettingsDB.update(storeId, updates, effectiveUserId, effectiveDeviceId);
  },

  /**
   * Check if a feature is enabled
   */
  async isFeatureEnabled(
    storeId: string,
    feature: 'packages' | 'add_ons' | 'variants' | 'custom_pricing' | 'booking_sequence'
  ): Promise<boolean> {
    // Supabase path
    if (USE_SUPABASE) {
      return catalogSettingsTable.isFeatureEnabled(storeId, feature);
    }

    // Fallback: get settings and check
    const settings = await this.get(storeId);
    if (!settings) return true; // Default to enabled if no settings

    const featureMap: Record<string, keyof CatalogSettings> = {
      packages: 'enablePackages',
      add_ons: 'enableAddOns',
      variants: 'enableVariants',
      custom_pricing: 'allowCustomPricing',
      booking_sequence: 'bookingSequenceEnabled',
    };

    return Boolean(settings[featureMap[feature]]);
  },
};

/**
 * Products data operations
 *
 * Routing priority:
 * 1. SQLite (if USE_SQLITE=true, Electron only)
 * 2. Supabase (if USE_SUPABASE=true and online)
 * 3. Dexie/IndexedDB (default local-first storage)
 */
export const productsService = {
  async getAll(storeId: string, includeInactive = false): Promise<Product[]> {
    // SQLite path
    if (USE_SQLITE) {
      const result = await sqliteProductsDB.getAll(storeId);
      return result as Product[];
    }

    // Supabase path
    if (USE_SUPABASE) {
      const rows = await productsTable.getByStoreId(storeId, includeInactive);
      return toProducts(rows);
    }

    // Dexie path
    return productsDB.getAll(storeId);
  },

  async getById(id: string): Promise<Product | undefined> {
    // SQLite path
    if (USE_SQLITE) {
      const result = await sqliteProductsDB.getById(id);
      return result as Product | undefined;
    }

    // Supabase path
    if (USE_SUPABASE) {
      const row = await productsTable.getById(id);
      return row ? toProduct(row) : undefined;
    }

    // Dexie path
    return productsDB.getById(id);
  },

  async getByCategory(storeId: string, category: string, includeInactive = false): Promise<Product[]> {
    // SQLite path
    if (USE_SQLITE) {
      const result = await sqliteProductsDB.getByCategory(storeId, category);
      return result as Product[];
    }

    // Supabase path
    if (USE_SUPABASE) {
      const rows = await productsTable.getByCategory(storeId, category, includeInactive);
      return toProducts(rows);
    }

    // Dexie path
    return productsDB.getByCategory(storeId, category);
  },

  async create(
    input: CreateProductInput,
    userId: string,
    storeId: string,
    tenantId?: string,
    deviceId?: string
  ): Promise<Product> {
    const effectiveTenantId = tenantId || getTenantId() || storeId;

    // SQLite path
    if (USE_SQLITE) {
      const result = await sqliteProductsDB.create(input);
      return result as Product;
    }

    // Supabase path
    if (USE_SUPABASE) {
      const effectiveDeviceId = deviceId || getDeviceId();
      const insertData = toProductInsert(input, storeId, effectiveTenantId, userId, effectiveDeviceId);
      const row = await productsTable.create(insertData);
      return toProduct(row);
    }

    // Dexie path
    return productsDB.create(input, storeId, effectiveTenantId);
  },

  async update(
    id: string,
    updates: Partial<Product>,
    userId?: string,
    deviceId?: string
  ): Promise<Product | undefined> {
    // SQLite path
    if (USE_SQLITE) {
      const result = await sqliteProductsDB.update(id, updates);
      return result as Product | undefined;
    }

    // Supabase path
    if (USE_SUPABASE) {
      const effectiveUserId = userId || getUserId();
      const effectiveDeviceId = deviceId || getDeviceId();
      const updateData = toProductUpdate(updates, effectiveUserId, effectiveDeviceId);
      const row = await productsTable.update(id, updateData);
      return toProduct(row);
    }

    // Dexie path - update returns count, so fetch the updated record
    await productsDB.update(id, updates);
    return productsDB.getById(id);
  },

  async delete(id: string, userId?: string, deviceId?: string): Promise<void> {
    // SQLite path
    if (USE_SQLITE) {
      return sqliteProductsDB.delete(id);
    }

    // Supabase path (soft delete with tombstone)
    if (USE_SUPABASE) {
      const effectiveUserId = userId || getUserId();
      const effectiveDeviceId = deviceId || getDeviceId();
      return productsTable.delete(id, effectiveUserId, effectiveDeviceId);
    }

    // Dexie path
    return productsDB.delete(id);
  },

  /**
   * Search products by name, SKU, or barcode
   */
  async search(storeId: string, query: string, limit = 50): Promise<Product[]> {
    // Supabase path
    if (USE_SUPABASE) {
      const rows = await productsTable.search(storeId, query, limit);
      return toProducts(rows);
    }

    // Fallback: getAll and filter in JS
    const all = await this.getAll(storeId, false);
    const lowerQuery = query.toLowerCase();
    return all.filter(p =>
      p.name.toLowerCase().includes(lowerQuery) ||
      p.sku?.toLowerCase().includes(lowerQuery) ||
      p.barcode?.toLowerCase().includes(lowerQuery)
    ).slice(0, limit);
  },

  async getBySku(storeId: string, sku: string): Promise<Product | undefined> {
    // SQLite path
    if (USE_SQLITE) {
      const result = await sqliteProductsDB.getBySku(storeId, sku);
      return result as Product | undefined;
    }

    // Supabase path
    if (USE_SUPABASE) {
      const row = await productsTable.getBySku(storeId, sku);
      return row ? toProduct(row) : undefined;
    }

    // Dexie path
    return productsDB.getBySku(storeId, sku);
  },

  async getByBarcode(storeId: string, barcode: string): Promise<Product | undefined> {
    // SQLite path (storeId filter for multi-tenant isolation)
    if (USE_SQLITE) {
      const result = await sqliteProductsDB.getByBarcode(storeId, barcode);
      return result as Product | undefined;
    }

    // Supabase path (storeId filter for multi-tenant isolation)
    if (USE_SUPABASE) {
      const row = await productsTable.getByBarcode(storeId, barcode);
      return row ? toProduct(row) : undefined;
    }

    // Dexie path
    return productsDB.getByBarcode(storeId, barcode);
  },

  async getCategories(storeId: string): Promise<string[]> {
    // SQLite path
    if (USE_SQLITE) {
      return sqliteProductsDB.getCategories(storeId);
    }

    // Supabase path
    if (USE_SUPABASE) {
      return productsTable.getCategories(storeId);
    }

    // Dexie path
    return productsDB.getCategories(storeId);
  },

  async getRetail(storeId: string): Promise<Product[]> {
    // SQLite path
    if (USE_SQLITE) {
      const result = await sqliteProductsDB.getRetail(storeId);
      return result as Product[];
    }

    // Supabase path
    if (USE_SUPABASE) {
      const rows = await productsTable.getRetailProducts(storeId);
      return toProducts(rows);
    }

    // Dexie path
    return productsDB.getRetail(storeId);
  },

  /**
   * Archive a product (soft archive, recoverable)
   */
  async archive(id: string): Promise<Product | undefined> {
    // Supabase path
    if (USE_SUPABASE) {
      const row = await productsTable.archive(id);
      return toProduct(row);
    }

    // Fallback: update isActive
    return this.update(id, { isActive: false } as Partial<Product>);
  },

  /**
   * Restore an archived product
   */
  async restore(id: string): Promise<Product | undefined> {
    // Supabase path
    if (USE_SUPABASE) {
      const row = await productsTable.restore(id);
      return toProduct(row);
    }

    // Fallback: update isActive
    return this.update(id, { isActive: true } as Partial<Product>);
  },

  /**
   * Get products updated since a specific time (for sync)
   */
  async getUpdatedSince(storeId: string, since: Date): Promise<Product[]> {
    // Supabase path
    if (USE_SUPABASE) {
      const rows = await productsTable.getUpdatedSince(storeId, since);
      return toProducts(rows);
    }

    // Fallback: not available in SQLite/Dexie
    return [];
  },
};
