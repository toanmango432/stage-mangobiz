/**
 * useCatalog Hook
 * Single hook for all catalog data and operations
 *
 * Uses Dexie live queries directly (no Redux) for simplicity.
 * This follows KISS principle - one source of truth in IndexedDB.
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/schema';
import {
  serviceCategoriesDB,
  menuServicesDB,
  serviceVariantsDB,
  servicePackagesDB,
  addOnGroupsDB,
  addOnOptionsDB,
  catalogSettingsDB,
  appointmentsDB,
} from '../db/database';
import { productsDB } from '../db/catalogDatabase';
import type {
  ServiceCategory,
  MenuService,
  ServicePackage,
  CategoryWithCount,
  ServiceAddOn,
  AddOnGroup,
  AddOnOption,
  AddOnGroupWithOptions,
  MenuGeneralSettings,
  EmbeddedVariant,
  MenuServiceWithEmbeddedVariants,
  CatalogTab,
  CatalogViewMode,
  GiftCardDenomination,
  GiftCardSettings,
} from '../types/catalog';
import type { Product, CreateProductInput } from '../types/inventory';
import {
  toServiceAddOn,
  toEmbeddedVariant,
  toMenuGeneralSettings,
  fromMenuGeneralSettings,
} from '../types/catalog';

// Toast function type (we'll integrate with your toast system)
type ToastFn = (message: string, type: 'success' | 'error') => void;

// Default no-op toast
const defaultToast: ToastFn = () => {};

/**
 * Service archive dependency check result.
 * Contains counts of items that depend on this service.
 */
export interface ServiceArchiveDependencies {
  /** Number of active packages containing this service */
  packageCount: number;
  /** Names of packages containing this service */
  packageNames: string[];
  /** Number of upcoming appointments with this service */
  upcomingAppointmentCount: number;
  /** Whether the service has any dependencies */
  hasDependencies: boolean;
}

/**
 * Result of archiving a service.
 */
export interface ArchiveServiceResult {
  /** Whether the archive operation succeeded */
  success: boolean;
  /** The archived service (if successful) */
  service?: MenuService;
  /** Warning about dependencies (always provided for awareness) */
  dependencies?: ServiceArchiveDependencies;
}

interface UseCatalogOptions {
  storeId: string;
  userId?: string;
  toast?: ToastFn;
}

interface CatalogUIState {
  activeTab: CatalogTab;
  selectedCategoryId: string | null;
  searchQuery: string;
  viewMode: CatalogViewMode;
  showInactive: boolean;
}

export function useCatalog({ storeId, userId = 'system', toast = defaultToast }: UseCatalogOptions) {
  // ==================== UI STATE ====================
  const [ui, setUI] = useState<CatalogUIState>({
    activeTab: 'services',
    selectedCategoryId: null,
    searchQuery: '',
    viewMode: 'grid',
    showInactive: false,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ==================== LIVE QUERIES ====================
  // Helper to check if storeId is valid for queries
  const isValidStoreId = storeId && storeId !== 'placeholder';

  // Categories with counts
  const categoriesWithCounts = useLiveQuery(
    async () => {
      if (!isValidStoreId) return [];
      try {
        const cats = await serviceCategoriesDB.getAll(storeId, ui.showInactive);
        const services = await db.menuServices.where('storeId').equals(storeId).toArray();

        return cats.map(cat => ({
          ...cat,
          servicesCount: services.filter(s => s.categoryId === cat.id).length,
          activeServicesCount: services.filter(s => s.categoryId === cat.id && s.status === 'active').length,
        })) as CategoryWithCount[];
      } catch (err) {
        console.warn('Failed to load categories:', err);
        return [];
      }
    },
    [storeId, ui.showInactive],
    [] as CategoryWithCount[]
  );

  // Services with embedded variants
  const servicesWithVariants = useLiveQuery(
    async () => {
      if (!isValidStoreId) return [];
      try {
        const services = await menuServicesDB.getAll(storeId, ui.showInactive);
        const variants = await db.serviceVariants.where('storeId').equals(storeId).toArray();

        return services.map(svc => ({
          ...svc,
          variants: variants
            .filter(v => v.serviceId === svc.id && (ui.showInactive || v.isActive))
            .sort((a, b) => a.displayOrder - b.displayOrder)
            .map(toEmbeddedVariant),
          processingTime: svc.extraTime,
          assignedStaffIds: [], // Will be populated from assignments if needed
        })) as MenuServiceWithEmbeddedVariants[];
      } catch (err) {
        console.warn('Failed to load services:', err);
        return [];
      }
    },
    [storeId, ui.showInactive],
    [] as MenuServiceWithEmbeddedVariants[]
  );

  // Packages
  const packages = useLiveQuery(
    async () => {
      if (!isValidStoreId) return [];
      try {
        return await servicePackagesDB.getAll(storeId, ui.showInactive);
      } catch (err) {
        console.warn('Failed to load packages:', err);
        return [];
      }
    },
    [storeId, ui.showInactive],
    [] as ServicePackage[]
  );

  // Add-ons (converted to legacy format for UI compatibility)
  const addOns = useLiveQuery(
    async () => {
      if (!isValidStoreId) return [];
      try {
        const groups = await addOnGroupsDB.getAll(storeId, ui.showInactive);
        const options = await db.addOnOptions.where('storeId').equals(storeId).toArray();

        // Convert to flat ServiceAddOn format for UI
        const result: ServiceAddOn[] = [];
        for (const group of groups) {
          const groupOptions = options.filter(o => o.groupId === group.id && (ui.showInactive || o.isActive));
          for (const option of groupOptions) {
            result.push(toServiceAddOn(group, option));
          }
        }
        return result.sort((a, b) => a.displayOrder - b.displayOrder);
      } catch (err) {
        console.warn('Failed to load add-ons:', err);
        return [];
      }
    },
    [storeId, ui.showInactive],
    [] as ServiceAddOn[]
  );

  // Add-on Groups with Options (for new grouped UI)
  const addOnGroupsWithOptions = useLiveQuery(
    async () => {
      if (!isValidStoreId) return [];
      try {
        const groups = await addOnGroupsDB.getAll(storeId, ui.showInactive);
        const options = await db.addOnOptions.where('storeId').equals(storeId).toArray();

        // Build groups with nested options
        const result: AddOnGroupWithOptions[] = groups.map(group => ({
          ...group,
          options: options
            .filter(o => o.groupId === group.id && (ui.showInactive || o.isActive))
            .sort((a, b) => a.displayOrder - b.displayOrder),
        }));

        return result.sort((a, b) => a.displayOrder - b.displayOrder);
      } catch (err) {
        console.warn('Failed to load add-on groups:', err);
        return [];
      }
    },
    [storeId, ui.showInactive],
    [] as AddOnGroupWithOptions[]
  );

  // Products (retail products for sale)
  // Guard: only query if storeId is valid to prevent IDBKeyRange errors
  const products = useLiveQuery(
    async () => {
      if (!isValidStoreId) return [];
      try {
        return await productsDB.getAll(storeId, ui.showInactive);
      } catch (err) {
        console.warn('Failed to load products:', err);
        return [];
      }
    },
    [storeId, ui.showInactive],
    [] as Product[]
  );

  // Product categories (unique from products)
  const productCategories = useMemo(() => {
    const uniqueCategories = new Set(products.map(p => p.category));
    return Array.from(uniqueCategories).sort();
  }, [products]);

  // Settings - use get() for read-only live query, initialize separately if needed
  const catalogSettings = useLiveQuery(
    async () => {
      if (!isValidStoreId) return undefined;
      try {
        return await catalogSettingsDB.get(storeId);
      } catch (err) {
        console.warn('Failed to load catalog settings:', err);
        return undefined;
      }
    },
    [storeId]
  );

  // Initialize settings if they don't exist (outside of live query)
  useEffect(() => {
    if (!isValidStoreId) return;
    if (catalogSettings === undefined) {
      // Check if we need to create default settings
      const tenantId = storeId; // TODO: Get actual tenantId from auth context
      const deviceId = 'web-client'; // TODO: Get actual deviceId from auth context
      catalogSettingsDB.get(storeId).then(existing => {
        if (!existing) {
          catalogSettingsDB.getOrCreate(storeId, userId, deviceId, tenantId);
        }
      }).catch(err => {
        console.warn('Failed to initialize catalog settings:', err);
      });
    }
  }, [storeId, userId, catalogSettings, isValidStoreId]);

  // Convert to MenuGeneralSettings for UI
  const settings = useMemo((): MenuGeneralSettings | null => {
    if (!catalogSettings) return null;
    return toMenuGeneralSettings(catalogSettings);
  }, [catalogSettings]);

  // Gift Card Denominations
  const giftCardDenominations = useLiveQuery(
    async () => {
      if (!storeId || storeId === 'placeholder') return [];
      try {
        const items = await db.giftCardDenominations
          .where('storeId')
          .equals(storeId)
          .toArray();
        return items.sort((a, b) => a.displayOrder - b.displayOrder);
      } catch (err) {
        console.warn('Failed to load gift card denominations:', err);
        return [];
      }
    },
    [storeId],
    [] as GiftCardDenomination[]
  );

  // Gift Card Settings
  const giftCardSettings = useLiveQuery(
    async () => {
      if (!storeId || storeId === 'placeholder') return null;
      try {
        // Query by storeId field, not by primary key
        const settings = await db.giftCardSettings
          .where('storeId')
          .equals(storeId)
          .first();
        return settings || null;
      } catch (err) {
        console.warn('Failed to load gift card settings:', err);
        return null;
      }
    },
    [storeId],
    null as GiftCardSettings | null
  );

  // ==================== FILTERED DATA ====================

  /**
   * Returns only active services (status === 'active').
   * This is the default for customer-facing views like booking and checkout.
   * Archived and inactive services are excluded.
   *
   * @example
   * const { getActiveServices } = useCatalog({ storeId });
   * const activeOnly = getActiveServices(); // Use in service selectors
   */
  const getActiveServices = useCallback(() => {
    return servicesWithVariants.filter(s => s.status === 'active');
  }, [servicesWithVariants]);

  /**
   * Returns only archived services (status === 'archived').
   * Use in admin views to show archived services separately.
   *
   * @example
   * const { getArchivedServices } = useCatalog({ storeId });
   * const archived = getArchivedServices(); // Show in admin "Archived" tab
   */
  const getArchivedServices = useCallback(() => {
    return servicesWithVariants.filter(s => s.status === 'archived');
  }, [servicesWithVariants]);

  const filteredServices = useMemo(() => {
    let result = servicesWithVariants;

    // Filter by category
    if (ui.selectedCategoryId) {
      result = result.filter(s => s.categoryId === ui.selectedCategoryId);
    }

    // Filter by search
    if (ui.searchQuery) {
      const query = ui.searchQuery.toLowerCase();
      result = result.filter(s =>
        s.name.toLowerCase().includes(query) ||
        s.description?.toLowerCase().includes(query) ||
        s.tags?.some(t => t.toLowerCase().includes(query))
      );
    }

    return result;
  }, [servicesWithVariants, ui.selectedCategoryId, ui.searchQuery]);

  const filteredPackages = useMemo(() => {
    if (!ui.searchQuery) return packages;
    const query = ui.searchQuery.toLowerCase();
    return packages.filter(p =>
      p.name.toLowerCase().includes(query) ||
      p.description?.toLowerCase().includes(query)
    );
  }, [packages, ui.searchQuery]);

  const filteredAddOns = useMemo(() => {
    if (!ui.searchQuery) return addOns;
    const query = ui.searchQuery.toLowerCase();
    return addOns.filter(a =>
      a.name.toLowerCase().includes(query) ||
      a.description?.toLowerCase().includes(query)
    );
  }, [addOns, ui.searchQuery]);

  const filteredProducts = useMemo(() => {
    if (!ui.searchQuery) return products;
    const query = ui.searchQuery.toLowerCase();
    return products.filter(p =>
      p.name.toLowerCase().includes(query) ||
      p.brand?.toLowerCase().includes(query) ||
      p.category.toLowerCase().includes(query) ||
      p.sku?.toLowerCase().includes(query)
    );
  }, [products, ui.searchQuery]);

  // ==================== UI ACTIONS ====================

  const setActiveTab = useCallback((tab: CatalogTab) => {
    setUI(prev => ({ ...prev, activeTab: tab }));
  }, []);

  const setSelectedCategory = useCallback((id: string | null) => {
    setUI(prev => ({ ...prev, selectedCategoryId: id }));
  }, []);

  const setSearchQuery = useCallback((query: string) => {
    setUI(prev => ({ ...prev, searchQuery: query }));
  }, []);

  const setViewMode = useCallback((mode: CatalogViewMode) => {
    setUI(prev => ({ ...prev, viewMode: mode }));
  }, []);

  const setShowInactive = useCallback((show: boolean) => {
    setUI(prev => ({ ...prev, showInactive: show }));
  }, []);

  // ==================== CRUD OPERATIONS WITH ERROR HANDLING ====================

  const withErrorHandling = useCallback(async <T>(
    operation: () => Promise<T>,
    successMessage?: string,
    errorMessage?: string
  ): Promise<T | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await operation();
      if (successMessage) toast(successMessage, 'success');
      return result;
    } catch (err) {
      const message = errorMessage || (err instanceof Error ? err.message : 'An error occurred');
      setError(message);
      toast(message, 'error');
      console.error('Catalog operation error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // ==================== CATEGORY ACTIONS ====================

  const createCategory = useCallback(async (data: Partial<ServiceCategory>) => {
    return withErrorHandling(
      () => serviceCategoriesDB.create(data as any, userId, storeId),
      'Category created',
      'Failed to create category'
    );
  }, [storeId, userId, withErrorHandling]);

  const updateCategory = useCallback(async (id: string, data: Partial<ServiceCategory>) => {
    return withErrorHandling(
      () => serviceCategoriesDB.update(id, data, userId),
      'Category updated',
      'Failed to update category'
    );
  }, [userId, withErrorHandling]);

  const deleteCategory = useCallback(async (id: string) => {
    // Check if category has services
    const services = servicesWithVariants.filter(s => s.categoryId === id);
    if (services.length > 0) {
      toast('Cannot delete category with services. Move or delete services first.', 'error');
      return false;
    }

    return withErrorHandling(
      async () => {
        await serviceCategoriesDB.delete(id);
        return true;
      },
      'Category deleted',
      'Failed to delete category'
    );
  }, [servicesWithVariants, withErrorHandling, toast]);

  const reorderCategories = useCallback(async (orderedIds: string[]) => {
    return withErrorHandling(
      () => serviceCategoriesDB.reorder(storeId, orderedIds, userId),
      undefined, // No success toast for reorder
      'Failed to reorder categories'
    );
  }, [storeId, userId, withErrorHandling]);

  // ==================== SERVICE ACTIONS ====================

  const createService = useCallback(async (
    data: Partial<MenuService>,
    variants?: EmbeddedVariant[]
  ) => {
    return withErrorHandling(
      async () => {
        const service = await menuServicesDB.create(data as any, userId, storeId);

        // Create variants if provided
        if (variants && variants.length > 0) {
          for (const v of variants) {
            await serviceVariantsDB.create({
              serviceId: service.id,
              name: v.name,
              duration: v.duration,
              price: v.price,
              extraTime: v.processingTime,
              isDefault: v.isDefault || false,
              displayOrder: variants.indexOf(v),
              isActive: true,
            }, userId, storeId);
          }
        }

        return service;
      },
      'Service created',
      'Failed to create service'
    );
  }, [storeId, userId, withErrorHandling]);

  const updateService = useCallback(async (
    id: string,
    data: Partial<MenuService>,
    variants?: EmbeddedVariant[]
  ) => {
    return withErrorHandling(
      async () => {
        const service = await menuServicesDB.update(id, data, userId);

        // Update variants if provided
        if (variants !== undefined) {
          // Get existing variants
          const existing = await serviceVariantsDB.getByService(id, true);
          const existingIds = existing.map(v => v.id);
          const newIds = variants.filter(v => v.id).map(v => v.id);

          // Delete removed variants
          for (const ev of existing) {
            if (!newIds.includes(ev.id)) {
              await serviceVariantsDB.delete(ev.id);
            }
          }

          // Update/create variants
          for (let i = 0; i < variants.length; i++) {
            const v = variants[i];
            if (existingIds.includes(v.id)) {
              // Update existing
              await serviceVariantsDB.update(v.id, {
                name: v.name,
                duration: v.duration,
                price: v.price,
                extraTime: v.processingTime,
                isDefault: v.isDefault,
                displayOrder: i,
              }, userId);
            } else {
              // Create new
              await serviceVariantsDB.create({
                serviceId: id,
                name: v.name,
                duration: v.duration,
                price: v.price,
                extraTime: v.processingTime,
                isDefault: v.isDefault || false,
                displayOrder: i,
                isActive: true,
              }, userId, storeId);
            }
          }
        }

        return service;
      },
      'Service updated',
      'Failed to update service'
    );
  }, [storeId, userId, withErrorHandling]);

  const deleteService = useCallback(async (id: string) => {
    return withErrorHandling(
      async () => {
        await menuServicesDB.delete(id);
        return true;
      },
      'Service deleted',
      'Failed to delete service'
    );
  }, [withErrorHandling]);

  /**
   * Check for dependencies that reference a service.
   * Used before archiving to warn about packages and upcoming appointments.
   */
  const checkServiceDependencies = useCallback(async (serviceId: string): Promise<ServiceArchiveDependencies> => {
    // Check for packages containing this service
    const allPackages = await servicePackagesDB.getAll(storeId, false);
    const dependentPackages = allPackages.filter(pkg =>
      pkg.isActive && pkg.services.some(svc => svc.serviceId === serviceId)
    );

    // Check for upcoming appointments with this service
    const now = new Date();
    const appointments = await appointmentsDB.getAll(storeId);
    const upcomingAppointments = appointments.filter(apt => {
      // Only count scheduled/confirmed appointments in the future
      const startTime = new Date(apt.scheduledStartTime);
      const isFuture = startTime > now;
      const isScheduled = ['scheduled', 'confirmed'].includes(apt.status);
      const hasService = apt.services.some(svc => svc.serviceId === serviceId);
      return isFuture && isScheduled && hasService;
    });

    return {
      packageCount: dependentPackages.length,
      packageNames: dependentPackages.map(pkg => pkg.name),
      upcomingAppointmentCount: upcomingAppointments.length,
      hasDependencies: dependentPackages.length > 0 || upcomingAppointments.length > 0,
    };
  }, [storeId]);

  /**
   * Archive a service with dependency checking.
   * Returns dependency information so the UI can warn the user.
   * Does NOT block archiving - archived services still work for existing appointments.
   */
  const archiveService = useCallback(async (id: string): Promise<ArchiveServiceResult | null> => {
    setIsLoading(true);
    setError(null);

    try {
      // Check dependencies first
      const dependencies = await checkServiceDependencies(id);

      // Archive the service (we don't block, just warn)
      const service = await menuServicesDB.archive(id, userId);

      if (!service) {
        throw new Error('Service not found');
      }

      // Show appropriate toast message
      if (dependencies.hasDependencies) {
        const warningParts: string[] = [];
        if (dependencies.packageCount > 0) {
          warningParts.push(`${dependencies.packageCount} package${dependencies.packageCount > 1 ? 's' : ''}`);
        }
        if (dependencies.upcomingAppointmentCount > 0) {
          warningParts.push(`${dependencies.upcomingAppointmentCount} upcoming appointment${dependencies.upcomingAppointmentCount > 1 ? 's' : ''}`);
        }
        toast(`Service archived. Note: ${warningParts.join(' and ')} still reference this service.`, 'success');
      } else {
        toast('Service archived', 'success');
      }

      return {
        success: true,
        service,
        dependencies,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to archive service';
      setError(message);
      toast(message, 'error');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [userId, storeId, checkServiceDependencies, toast]);

  /**
   * Restore an archived service back to active status.
   */
  const restoreService = useCallback(async (id: string) => {
    return withErrorHandling(
      () => menuServicesDB.restore(id, userId),
      'Service restored',
      'Failed to restore service'
    );
  }, [userId, withErrorHandling]);

  // ==================== PACKAGE ACTIONS ====================

  const createPackage = useCallback(async (data: Partial<ServicePackage>) => {
    return withErrorHandling(
      () => servicePackagesDB.create(data as any, userId, storeId),
      'Package created',
      'Failed to create package'
    );
  }, [storeId, userId, withErrorHandling]);

  const updatePackage = useCallback(async (id: string, data: Partial<ServicePackage>) => {
    return withErrorHandling(
      () => servicePackagesDB.update(id, data, userId),
      'Package updated',
      'Failed to update package'
    );
  }, [userId, withErrorHandling]);

  const deletePackage = useCallback(async (id: string) => {
    return withErrorHandling(
      async () => {
        await servicePackagesDB.delete(id);
        return true;
      },
      'Package deleted',
      'Failed to delete package'
    );
  }, [withErrorHandling]);

  // ==================== ADD-ON ACTIONS ====================
  // These work with the legacy ServiceAddOn format for UI compatibility

  const createAddOn = useCallback(async (data: Partial<ServiceAddOn>) => {
    return withErrorHandling(
      async () => {
        // Create a group with single option for simple add-ons
        const group = await addOnGroupsDB.create({
          name: data.name || '',
          description: data.description,
          selectionMode: 'single',
          minSelections: 0,
          maxSelections: 1,
          isRequired: false,
          applicableToAll: data.applicableToAll || false,
          applicableCategoryIds: data.applicableCategoryIds || [],
          applicableServiceIds: data.applicableServiceIds || [],
          isActive: data.isActive ?? true,
          displayOrder: data.displayOrder ?? 0,
          onlineBookingEnabled: data.onlineBookingEnabled ?? true,
        }, userId, storeId);

        const option = await addOnOptionsDB.create({
          groupId: group.id,
          name: data.name || '',
          description: data.description,
          price: data.price || 0,
          duration: data.duration || 0,
          isActive: data.isActive ?? true,
          displayOrder: 0,
        }, userId, storeId);

        return toServiceAddOn(group, option);
      },
      'Add-on created',
      'Failed to create add-on'
    );
  }, [storeId, userId, withErrorHandling]);

  const updateAddOn = useCallback(async (id: string, data: Partial<ServiceAddOn>) => {
    return withErrorHandling(
      async () => {
        // Find the option and its group
        const option = await addOnOptionsDB.getById(id);
        if (!option) throw new Error('Add-on not found');

        const group = await addOnGroupsDB.getById(option.groupId);
        if (!group) throw new Error('Add-on group not found');

        // Update both
        await addOnGroupsDB.update(group.id, {
          name: data.name,
          description: data.description,
          applicableToAll: data.applicableToAll,
          applicableCategoryIds: data.applicableCategoryIds,
          applicableServiceIds: data.applicableServiceIds,
          isActive: data.isActive,
          displayOrder: data.displayOrder,
          onlineBookingEnabled: data.onlineBookingEnabled,
        }, userId);

        await addOnOptionsDB.update(id, {
          name: data.name,
          description: data.description,
          price: data.price,
          duration: data.duration,
          isActive: data.isActive,
        }, userId);

        const updatedOption = await addOnOptionsDB.getById(id);
        const updatedGroup = await addOnGroupsDB.getById(option.groupId);

        return toServiceAddOn(updatedGroup!, updatedOption!);
      },
      'Add-on updated',
      'Failed to update add-on'
    );
  }, [userId, withErrorHandling]);

  const deleteAddOn = useCallback(async (id: string) => {
    return withErrorHandling(
      async () => {
        const option = await addOnOptionsDB.getById(id);
        if (option) {
          // Check if this is the only option in the group
          const groupOptions = await addOnOptionsDB.getByGroup(option.groupId, true);
          if (groupOptions.length === 1) {
            // Delete the whole group
            await addOnGroupsDB.delete(option.groupId);
          } else {
            // Just delete the option
            await addOnOptionsDB.delete(id);
          }
        }
        return true;
      },
      'Add-on deleted',
      'Failed to delete add-on'
    );
  }, [withErrorHandling]);

  // ==================== ADD-ON GROUP ACTIONS ====================
  // For the new grouped UI

  const createAddOnGroup = useCallback(async (data: Partial<AddOnGroup>) => {
    return withErrorHandling(
      async () => {
        const group = await addOnGroupsDB.create({
          name: data.name || '',
          description: data.description,
          selectionMode: data.selectionMode || 'single',
          minSelections: data.minSelections ?? 0,
          maxSelections: data.maxSelections,
          isRequired: data.isRequired ?? false,
          applicableToAll: data.applicableToAll ?? true,
          applicableCategoryIds: data.applicableCategoryIds || [],
          applicableServiceIds: data.applicableServiceIds || [],
          isActive: data.isActive ?? true,
          displayOrder: data.displayOrder ?? 0,
          onlineBookingEnabled: data.onlineBookingEnabled ?? true,
        }, userId, storeId);
        return group;
      },
      'Add-on group created',
      'Failed to create add-on group'
    );
  }, [storeId, withErrorHandling]);

  const updateAddOnGroup = useCallback(async (id: string, data: Partial<AddOnGroup>) => {
    return withErrorHandling(
      async () => {
        await addOnGroupsDB.update(id, data, userId);
        return await addOnGroupsDB.getById(id);
      },
      'Add-on group updated',
      'Failed to update add-on group'
    );
  }, [userId, withErrorHandling]);

  const deleteAddOnGroup = useCallback(async (id: string) => {
    return withErrorHandling(
      async () => {
        // Delete all options in the group first
        const options = await addOnOptionsDB.getByGroup(id, true);
        for (const option of options) {
          await addOnOptionsDB.delete(option.id);
        }
        // Then delete the group
        await addOnGroupsDB.delete(id);
        return true;
      },
      'Add-on group deleted',
      'Failed to delete add-on group'
    );
  }, [withErrorHandling]);

  // ==================== ADD-ON OPTION ACTIONS ====================

  const createAddOnOption = useCallback(async (data: Partial<AddOnOption>) => {
    return withErrorHandling(
      async () => {
        if (!data.groupId) throw new Error('Group ID is required');
        const option = await addOnOptionsDB.create({
          groupId: data.groupId,
          name: data.name || '',
          description: data.description,
          price: data.price || 0,
          duration: data.duration || 0,
          isActive: data.isActive ?? true,
          displayOrder: data.displayOrder ?? 0,
        }, userId, storeId);
        return option;
      },
      'Option added',
      'Failed to add option'
    );
  }, [userId, storeId, withErrorHandling]);

  const updateAddOnOption = useCallback(async (id: string, data: Partial<AddOnOption>) => {
    return withErrorHandling(
      async () => {
        await addOnOptionsDB.update(id, data, userId);
        return await addOnOptionsDB.getById(id);
      },
      'Option updated',
      'Failed to update option'
    );
  }, [userId, withErrorHandling]);

  const deleteAddOnOption = useCallback(async (id: string) => {
    return withErrorHandling(
      async () => {
        await addOnOptionsDB.delete(id);
        return true;
      },
      'Option deleted',
      'Failed to delete option'
    );
  }, [withErrorHandling]);

  // ==================== PRODUCT ACTIONS ====================

  const createProduct = useCallback(async (data: CreateProductInput) => {
    // Get tenantId from auth (using storeId as fallback)
    const tenantId = storeId; // TODO: Get actual tenantId from auth context
    return withErrorHandling(
      () => productsDB.create(data, storeId, tenantId),
      'Product created',
      'Failed to create product'
    );
  }, [storeId, withErrorHandling]);

  const updateProduct = useCallback(async (id: string, data: Partial<Product>) => {
    return withErrorHandling(
      () => productsDB.update(id, data),
      'Product updated',
      'Failed to update product'
    );
  }, [withErrorHandling]);

  const deleteProduct = useCallback(async (id: string) => {
    return withErrorHandling(
      async () => {
        await productsDB.delete(id);
        return true;
      },
      'Product deleted',
      'Failed to delete product'
    );
  }, [withErrorHandling]);

  const archiveProduct = useCallback(async (id: string) => {
    return withErrorHandling(
      () => productsDB.archive(id),
      'Product archived',
      'Failed to archive product'
    );
  }, [withErrorHandling]);

  // ==================== SETTINGS ACTIONS ====================

  const updateSettings = useCallback(async (data: Partial<MenuGeneralSettings>) => {
    return withErrorHandling(
      async () => {
        // Merge with current settings and convert
        const merged: MenuGeneralSettings = {
          defaultDuration: data.defaultDuration ?? settings?.defaultDuration ?? 60,
          defaultProcessingTime: data.defaultProcessingTime ?? settings?.defaultProcessingTime ?? 0,
          currency: data.currency ?? settings?.currency ?? 'USD',
          currencySymbol: data.currencySymbol ?? settings?.currencySymbol ?? '$',
          taxRate: data.taxRate ?? settings?.taxRate ?? 0,
          allowCustomPricing: data.allowCustomPricing ?? settings?.allowCustomPricing ?? true,
          showPricesOnline: data.showPricesOnline ?? settings?.showPricesOnline ?? true,
          requireDepositForOnlineBooking: data.requireDepositForOnlineBooking ?? settings?.requireDepositForOnlineBooking ?? false,
          defaultDepositPercentage: data.defaultDepositPercentage ?? settings?.defaultDepositPercentage ?? 20,
          enablePackages: data.enablePackages ?? settings?.enablePackages ?? true,
          enableAddOns: data.enableAddOns ?? settings?.enableAddOns ?? true,
        };
        const deviceId = 'web-client'; // TODO: Get actual deviceId from auth context
        const updates = fromMenuGeneralSettings(merged);
        await catalogSettingsDB.update(storeId, updates, userId, deviceId);
        return merged;
      },
      'Settings updated',
      'Failed to update settings'
    );
  }, [storeId, userId, settings, withErrorHandling]);

  // ==================== GIFT CARD ACTIONS ====================

  const createGiftCardDenomination = useCallback(async (data: Partial<GiftCardDenomination>) => {
    return withErrorHandling(
      async () => {
        const id = crypto.randomUUID();
        const now = new Date().toISOString();
        const maxOrder = giftCardDenominations.length > 0
          ? Math.max(...giftCardDenominations.map(d => d.displayOrder)) + 1
          : 0;
        const tenantId = storeId; // TODO: Get actual tenantId from auth context
        const deviceId = 'web-client'; // TODO: Get actual deviceId from auth context

        const denomination: GiftCardDenomination = {
          id,
          storeId,
          tenantId,
          amount: data.amount || 50,
          label: data.label,
          isActive: data.isActive ?? true,
          displayOrder: data.displayOrder ?? maxOrder,
          syncStatus: 'local',
          version: 1,
          vectorClock: { [deviceId]: 1 },
          lastSyncedVersion: 0,
          createdAt: now,
          updatedAt: now,
          createdBy: userId,
          createdByDevice: deviceId,
          lastModifiedBy: userId,
          lastModifiedByDevice: deviceId,
          isDeleted: false,
        };
        await db.giftCardDenominations.add(denomination);
        return denomination;
      },
      'Denomination created',
      'Failed to create denomination'
    );
  }, [storeId, userId, giftCardDenominations, withErrorHandling]);

  const updateGiftCardDenomination = useCallback(async (id: string, data: Partial<GiftCardDenomination>) => {
    return withErrorHandling(
      async () => {
        const existing = await db.giftCardDenominations.get(id);
        if (!existing) throw new Error('Denomination not found');

        const deviceId = 'web-client'; // TODO: Get actual deviceId from auth context
        const newVersion = existing.version + 1;

        await db.giftCardDenominations.update(id, {
          ...data,
          version: newVersion,
          vectorClock: { ...existing.vectorClock, [deviceId]: newVersion },
          updatedAt: new Date().toISOString(),
          lastModifiedBy: userId,
          lastModifiedByDevice: deviceId,
          syncStatus: 'pending',
        });
        return await db.giftCardDenominations.get(id);
      },
      'Denomination updated',
      'Failed to update denomination'
    );
  }, [userId, withErrorHandling]);

  const deleteGiftCardDenomination = useCallback(async (id: string) => {
    return withErrorHandling(
      async () => {
        await db.giftCardDenominations.delete(id);
        return true;
      },
      'Denomination deleted',
      'Failed to delete denomination'
    );
  }, [withErrorHandling]);

  const updateGiftCardSettings = useCallback(async (data: Partial<GiftCardSettings>) => {
    return withErrorHandling(
      async () => {
        // Query by storeId field instead of primary key
        const existing = await db.giftCardSettings
          .where('storeId')
          .equals(storeId)
          .first();
        const now = new Date().toISOString();
        const tenantId = storeId; // TODO: Get actual tenantId from auth context
        const deviceId = 'web-client'; // TODO: Get actual deviceId from auth context

        if (existing) {
          // Update using the actual record id
          const newVersion = existing.version + 1;
          await db.giftCardSettings.update(existing.id, {
            ...data,
            version: newVersion,
            vectorClock: { ...existing.vectorClock, [deviceId]: newVersion },
            updatedAt: now,
            lastModifiedBy: userId,
            lastModifiedByDevice: deviceId,
            syncStatus: 'pending',
          });
        } else {
          const id = crypto.randomUUID();
          const settings: GiftCardSettings = {
            id,
            storeId,
            tenantId,
            allowCustomAmount: data.allowCustomAmount ?? true,
            minAmount: data.minAmount ?? 10,
            maxAmount: data.maxAmount ?? 500,
            onlineEnabled: data.onlineEnabled ?? true,
            emailDeliveryEnabled: data.emailDeliveryEnabled ?? true,
            syncStatus: 'local',
            version: 1,
            vectorClock: { [deviceId]: 1 },
            lastSyncedVersion: 0,
            createdAt: now,
            updatedAt: now,
            createdBy: userId,
            createdByDevice: deviceId,
            lastModifiedBy: userId,
            lastModifiedByDevice: deviceId,
            isDeleted: false,
          };
          await db.giftCardSettings.add(settings);
        }
        // Return the updated/created settings
        return await db.giftCardSettings
          .where('storeId')
          .equals(storeId)
          .first();
      },
      'Gift card settings updated',
      'Failed to update gift card settings'
    );
  }, [storeId, userId, withErrorHandling]);

  // ==================== RETURN ====================

  return {
    // Data (live queries - automatically update)
    categories: categoriesWithCounts,
    services: servicesWithVariants,
    filteredServices,
    packages,
    filteredPackages,
    addOns,
    filteredAddOns,
    addOnGroupsWithOptions,
    products,
    filteredProducts,
    productCategories,
    settings,
    giftCardDenominations,
    giftCardSettings,

    // UI State
    ui,
    setActiveTab,
    setSelectedCategory,
    setSearchQuery,
    setViewMode,
    setShowInactive,

    // Loading/Error
    isLoading,
    error,

    // Category Actions
    createCategory,
    updateCategory,
    deleteCategory,
    reorderCategories,

    // Service Actions
    createService,
    updateService,
    deleteService,
    archiveService,
    restoreService,
    checkServiceDependencies,
    getActiveServices,
    getArchivedServices,

    // Package Actions
    createPackage,
    updatePackage,
    deletePackage,

    // Add-on Actions (legacy flat format)
    createAddOn,
    updateAddOn,
    deleteAddOn,

    // Add-on Group Actions (new grouped format)
    createAddOnGroup,
    updateAddOnGroup,
    deleteAddOnGroup,

    // Add-on Option Actions
    createAddOnOption,
    updateAddOnOption,
    deleteAddOnOption,

    // Product Actions
    createProduct,
    updateProduct,
    deleteProduct,
    archiveProduct,

    // Settings Actions
    updateSettings,

    // Gift Card Actions
    createGiftCardDenomination,
    updateGiftCardDenomination,
    deleteGiftCardDenomination,
    updateGiftCardSettings,
  };
}

export type UseCatalogReturn = ReturnType<typeof useCatalog>;
