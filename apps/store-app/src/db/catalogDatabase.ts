/**
 * Catalog Module Database Operations
 * CRUD operations for catalog entities following existing patterns
 *
 * See: docs/PRD-Catalog-Module.md
 */

import { v4 as uuidv4 } from 'uuid';
import { db } from './schema';
import { createBaseSyncableDefaults } from '../types/common';
import type {
  ServiceCategory,
  CreateCategoryInput,
  MenuService,
  CreateMenuServiceInput,
  ServiceVariant,
  CreateVariantInput,
  ServicePackage,
  CreatePackageInput,
  AddOnGroup,
  CreateAddOnGroupInput,
  AddOnOption,
  CreateAddOnOptionInput,
  StaffServiceAssignment,
  CreateStaffAssignmentInput,
  CatalogSettings,
  CategoryWithCount,
  ServiceWithVariants,
  AddOnGroupWithOptions,
  BookingSequence,
  CreateBookingSequenceInput
} from '../types';
import type { Product, CreateProductInput } from '../types/inventory';

// ==================== SERVICE CATEGORIES ====================

export const serviceCategoriesDB = {
  async getAll(storeId: string, includeInactive = false): Promise<ServiceCategory[]> {
    let query = db.serviceCategories
      .where('storeId')
      .equals(storeId);

    if (!includeInactive) {
      query = query.and(cat => cat.isActive);
    }

    return await query
      .sortBy('displayOrder');
  },

  async getById(id: string): Promise<ServiceCategory | undefined> {
    return await db.serviceCategories.get(id);
  },

  async getWithCounts(storeId: string, includeInactive = false): Promise<CategoryWithCount[]> {
    const categories = await this.getAll(storeId, includeInactive);
    const services = await db.menuServices
      .where('storeId')
      .equals(storeId)
      .toArray();

    return categories.map(cat => ({
      ...cat,
      servicesCount: services.filter(s => s.categoryId === cat.id).length,
      activeServicesCount: services.filter(s => s.categoryId === cat.id && s.status === 'active').length,
    }));
  },

  async create(input: CreateCategoryInput, userId: string, storeId: string, tenantId: string = storeId, deviceId = 'web-client'): Promise<ServiceCategory> {
    // Get next display order
    const maxOrder = await db.serviceCategories
      .where('storeId')
      .equals(storeId)
      .toArray()
      .then(cats => Math.max(0, ...cats.map(c => c.displayOrder)));

    const syncDefaults = createBaseSyncableDefaults(userId, deviceId, tenantId, storeId);

    const category: ServiceCategory = {
      id: uuidv4(),
      ...syncDefaults,
      ...input,
      displayOrder: input.displayOrder ?? maxOrder + 1,
    };

    await db.serviceCategories.add(category);
    return category;
  },

  async update(id: string, updates: Partial<ServiceCategory>, userId: string): Promise<ServiceCategory | undefined> {
    const category = await db.serviceCategories.get(id);
    if (!category) return undefined;

    const updated: ServiceCategory = {
      ...category,
      ...updates,
      updatedAt: new Date().toISOString(),
      lastModifiedBy: userId,
      syncStatus: 'local',
    };

    await db.serviceCategories.put(updated);
    return updated;
  },

  async delete(id: string): Promise<void> {
    await db.serviceCategories.delete(id);
  },

  async reorder(_storeId: string, orderedIds: string[], userId: string): Promise<void> {
    await db.transaction('rw', db.serviceCategories, async () => {
      for (let i = 0; i < orderedIds.length; i++) {
        await db.serviceCategories.update(orderedIds[i], {
          displayOrder: i,
          updatedAt: new Date().toISOString(),
          lastModifiedBy: userId,
          syncStatus: 'local',
        });
      }
    });
  },
};

// ==================== MENU SERVICES ====================

export const menuServicesDB = {
  async getAll(storeId: string, includeInactive = false): Promise<MenuService[]> {
    let query = db.menuServices
      .where('storeId')
      .equals(storeId);

    if (!includeInactive) {
      query = query.and(svc => svc.status === 'active');
    }

    return await query.sortBy('displayOrder');
  },

  async getById(id: string): Promise<MenuService | undefined> {
    return await db.menuServices.get(id);
  },

  async getByCategory(storeId: string, categoryId: string, includeInactive = false): Promise<MenuService[]> {
    let result = await db.menuServices
      .where('[storeId+categoryId]')
      .equals([storeId, categoryId])
      .toArray();

    if (!includeInactive) {
      result = result.filter(s => s.status === 'active');
    }

    return result.sort((a, b) => a.displayOrder - b.displayOrder);
  },

  async getWithVariants(id: string): Promise<ServiceWithVariants | undefined> {
    const service = await db.menuServices.get(id);
    if (!service) return undefined;

    const variants = await db.serviceVariants
      .where('serviceId')
      .equals(id)
      .and(v => v.isActive)
      .sortBy('displayOrder');

    return { ...service, variants };
  },

  async create(input: CreateMenuServiceInput, userId: string, storeId: string, tenantId: string = storeId, deviceId = 'web-client'): Promise<MenuService> {
    // Get next display order within category
    const maxOrder = await db.menuServices
      .where('[storeId+categoryId]')
      .equals([storeId, input.categoryId])
      .toArray()
      .then(svcs => Math.max(0, ...svcs.map(s => s.displayOrder)));

    const syncDefaults = createBaseSyncableDefaults(userId, deviceId, tenantId, storeId);

    const service: MenuService = {
      id: uuidv4(),
      ...syncDefaults,
      ...input,
      displayOrder: input.displayOrder ?? maxOrder + 1,
      variantCount: input.variantCount ?? 0,
    };

    await db.menuServices.add(service);
    return service;
  },

  async update(id: string, updates: Partial<MenuService>, userId: string): Promise<MenuService | undefined> {
    const service = await db.menuServices.get(id);
    if (!service) return undefined;

    const updated: MenuService = {
      ...service,
      ...updates,
      updatedAt: new Date().toISOString(),
      lastModifiedBy: userId,
      syncStatus: 'local',
    };

    await db.menuServices.put(updated);
    return updated;
  },

  async delete(id: string): Promise<void> {
    // Delete associated variants first
    await db.serviceVariants.where('serviceId').equals(id).delete();
    await db.menuServices.delete(id);
  },

  async archive(id: string, userId: string): Promise<MenuService | undefined> {
    const now = new Date().toISOString();
    return await this.update(id, {
      status: 'archived',
      archivedAt: now,
      archivedBy: userId,
    } as Partial<MenuService>, userId);
  },

  async restore(id: string, userId: string): Promise<MenuService | undefined> {
    return await this.update(id, {
      status: 'active',
      archivedAt: undefined,
      archivedBy: undefined,
    } as Partial<MenuService>, userId);
  },

  async reorder(_categoryId: string, orderedIds: string[], userId: string): Promise<void> {
    await db.transaction('rw', db.menuServices, async () => {
      for (let i = 0; i < orderedIds.length; i++) {
        await db.menuServices.update(orderedIds[i], {
          displayOrder: i,
          updatedAt: new Date().toISOString(),
          lastModifiedBy: userId,
          syncStatus: 'local',
        });
      }
    });
  },

  async search(storeId: string, query: string, limit = 50): Promise<MenuService[]> {
    const lowerQuery = query.toLowerCase();
    return await db.menuServices
      .where('storeId')
      .equals(storeId)
      .and(service =>
        service.name.toLowerCase().includes(lowerQuery) ||
        (service.description?.toLowerCase().includes(lowerQuery) ?? false) ||
        (service.tags?.some(tag => tag.toLowerCase().includes(lowerQuery)) ?? false)
      )
      .limit(limit)
      .toArray();
  },
};

// ==================== SERVICE VARIANTS ====================

export const serviceVariantsDB = {
  async getByService(serviceId: string, includeInactive = false): Promise<ServiceVariant[]> {
    let query = db.serviceVariants
      .where('serviceId')
      .equals(serviceId);

    if (!includeInactive) {
      query = query.and(v => v.isActive);
    }

    return await query.sortBy('displayOrder');
  },

  async getById(id: string): Promise<ServiceVariant | undefined> {
    return await db.serviceVariants.get(id);
  },

  async create(input: CreateVariantInput, userId: string, storeId: string, tenantId: string = storeId, deviceId = 'web-client'): Promise<ServiceVariant> {
    // Get next display order
    const maxOrder = await db.serviceVariants
      .where('serviceId')
      .equals(input.serviceId)
      .toArray()
      .then(vars => Math.max(0, ...vars.map(v => v.displayOrder)));

    const syncDefaults = createBaseSyncableDefaults(userId, deviceId, tenantId, storeId);

    const variant: ServiceVariant = {
      id: uuidv4(),
      ...syncDefaults,
      ...input,
      displayOrder: input.displayOrder ?? maxOrder + 1,
    };

    await db.serviceVariants.add(variant);
    return variant;
  },

  async update(id: string, updates: Partial<ServiceVariant>, userId: string): Promise<ServiceVariant | undefined> {
    const variant = await db.serviceVariants.get(id);
    if (!variant) return undefined;

    const updated: ServiceVariant = {
      ...variant,
      ...updates,
      updatedAt: new Date().toISOString(),
      lastModifiedBy: userId,
      syncStatus: 'local',
    };

    await db.serviceVariants.put(updated);
    return updated;
  },

  async delete(id: string): Promise<void> {
    await db.serviceVariants.delete(id);
  },

  async setDefault(serviceId: string, variantId: string, userId: string): Promise<void> {
    await db.transaction('rw', db.serviceVariants, async () => {
      // Remove default from all variants of this service
      const variants = await db.serviceVariants.where('serviceId').equals(serviceId).toArray();
      for (const v of variants) {
        await db.serviceVariants.update(v.id, {
          isDefault: v.id === variantId,
          updatedAt: new Date().toISOString(),
          lastModifiedBy: userId,
          syncStatus: 'local',
        });
      }
    });
  },
};

// ==================== SERVICE PACKAGES ====================

export const servicePackagesDB = {
  async getAll(storeId: string, includeInactive = false): Promise<ServicePackage[]> {
    let query = db.servicePackages
      .where('storeId')
      .equals(storeId);

    if (!includeInactive) {
      query = query.and(pkg => pkg.isActive);
    }

    return await query.sortBy('displayOrder');
  },

  async getById(id: string): Promise<ServicePackage | undefined> {
    return await db.servicePackages.get(id);
  },

  async create(input: CreatePackageInput, userId: string, storeId: string, tenantId: string = storeId, deviceId = 'web-client'): Promise<ServicePackage> {
    const maxOrder = await db.servicePackages
      .where('storeId')
      .equals(storeId)
      .toArray()
      .then(pkgs => Math.max(0, ...pkgs.map(p => p.displayOrder)));

    const syncDefaults = createBaseSyncableDefaults(userId, deviceId, tenantId, storeId);

    const pkg: ServicePackage = {
      id: uuidv4(),
      ...syncDefaults,
      ...input,
      displayOrder: input.displayOrder ?? maxOrder + 1,
    };

    await db.servicePackages.add(pkg);
    return pkg;
  },

  async update(id: string, updates: Partial<ServicePackage>, userId: string): Promise<ServicePackage | undefined> {
    const pkg = await db.servicePackages.get(id);
    if (!pkg) return undefined;

    const updated: ServicePackage = {
      ...pkg,
      ...updates,
      updatedAt: new Date().toISOString(),
      lastModifiedBy: userId,
      syncStatus: 'local',
    };

    await db.servicePackages.put(updated);
    return updated;
  },

  async delete(id: string): Promise<void> {
    await db.servicePackages.delete(id);
  },
};

// ==================== ADD-ON GROUPS ====================

export const addOnGroupsDB = {
  async getAll(storeId: string, includeInactive = false): Promise<AddOnGroup[]> {
    let query = db.addOnGroups
      .where('storeId')
      .equals(storeId);

    if (!includeInactive) {
      query = query.and(g => g.isActive);
    }

    return await query.sortBy('displayOrder');
  },

  async getById(id: string): Promise<AddOnGroup | undefined> {
    return await db.addOnGroups.get(id);
  },

  async getWithOptions(id: string): Promise<AddOnGroupWithOptions | undefined> {
    const group = await db.addOnGroups.get(id);
    if (!group) return undefined;

    const options = await db.addOnOptions
      .where('groupId')
      .equals(id)
      .and(o => o.isActive)
      .sortBy('displayOrder');

    return { ...group, options };
  },

  async getAllWithOptions(storeId: string, includeInactive = false): Promise<AddOnGroupWithOptions[]> {
    const groups = await this.getAll(storeId, includeInactive);
    const allOptions = await db.addOnOptions.where('storeId').equals(storeId).toArray();

    return groups.map(group => ({
      ...group,
      options: allOptions
        .filter(o => o.groupId === group.id && (includeInactive || o.isActive))
        .sort((a, b) => a.displayOrder - b.displayOrder),
    }));
  },

  async getForService(storeId: string, serviceId: string, categoryId: string): Promise<AddOnGroupWithOptions[]> {
    const allGroups = await this.getAllWithOptions(storeId, false);

    return allGroups.filter(group =>
      group.applicableToAll ||
      group.applicableServiceIds.includes(serviceId) ||
      group.applicableCategoryIds.includes(categoryId)
    );
  },

  async create(
    input: CreateAddOnGroupInput,
    userId: string,
    storeId: string,
    tenantId: string = storeId,
    deviceId = 'web-client'
  ): Promise<AddOnGroup> {
    const maxOrder = await db.addOnGroups
      .where('storeId')
      .equals(storeId)
      .toArray()
      .then(groups => Math.max(0, ...groups.map(g => g.displayOrder)));

    const syncDefaults = createBaseSyncableDefaults(userId, deviceId, tenantId, storeId);

    const group: AddOnGroup = {
      ...syncDefaults,
      id: uuidv4(),
      ...input,
      displayOrder: input.displayOrder ?? maxOrder + 1,
    };

    await db.addOnGroups.add(group);
    return group;
  },

  async update(
    id: string,
    updates: Partial<AddOnGroup>,
    userId: string,
    deviceId = 'web-client'
  ): Promise<AddOnGroup | undefined> {
    const group = await db.addOnGroups.get(id);
    if (!group) return undefined;

    const updated: AddOnGroup = {
      ...group,
      ...updates,
      version: group.version + 1,
      vectorClock: {
        ...group.vectorClock,
        [deviceId]: group.version + 1,
      },
      updatedAt: new Date().toISOString(),
      lastModifiedBy: userId,
      lastModifiedByDevice: deviceId,
      syncStatus: 'local',
    };

    await db.addOnGroups.put(updated);
    return updated;
  },

  async delete(id: string): Promise<void> {
    // Delete associated options first
    await db.addOnOptions.where('groupId').equals(id).delete();
    await db.addOnGroups.delete(id);
  },
};

// ==================== ADD-ON OPTIONS ====================

export const addOnOptionsDB = {
  async getByGroup(groupId: string, includeInactive = false): Promise<AddOnOption[]> {
    let query = db.addOnOptions
      .where('groupId')
      .equals(groupId);

    if (!includeInactive) {
      query = query.and(o => o.isActive);
    }

    return await query.sortBy('displayOrder');
  },

  async getById(id: string): Promise<AddOnOption | undefined> {
    return await db.addOnOptions.get(id);
  },

  async create(
    input: CreateAddOnOptionInput,
    userId: string,
    storeId: string,
    tenantId: string = storeId,
    deviceId = 'web-client'
  ): Promise<AddOnOption> {
    const maxOrder = await db.addOnOptions
      .where('groupId')
      .equals(input.groupId)
      .toArray()
      .then(opts => Math.max(0, ...opts.map(o => o.displayOrder)));

    const syncDefaults = createBaseSyncableDefaults(userId, deviceId, tenantId, storeId);

    const option: AddOnOption = {
      ...syncDefaults,
      id: uuidv4(),
      ...input,
      displayOrder: input.displayOrder ?? maxOrder + 1,
    };

    await db.addOnOptions.add(option);
    return option;
  },

  async update(
    id: string,
    updates: Partial<AddOnOption>,
    userId: string,
    deviceId = 'web-client'
  ): Promise<AddOnOption | undefined> {
    const option = await db.addOnOptions.get(id);
    if (!option) return undefined;

    const updated: AddOnOption = {
      ...option,
      ...updates,
      version: option.version + 1,
      vectorClock: {
        ...option.vectorClock,
        [deviceId]: option.version + 1,
      },
      updatedAt: new Date().toISOString(),
      lastModifiedBy: userId,
      lastModifiedByDevice: deviceId,
      syncStatus: 'local',
    };

    await db.addOnOptions.put(updated);
    return updated;
  },

  async delete(id: string): Promise<void> {
    await db.addOnOptions.delete(id);
  },
};

// ==================== STAFF-SERVICE ASSIGNMENTS ====================

export const staffServiceAssignmentsDB = {
  async getByStaff(storeId: string, staffId: string): Promise<StaffServiceAssignment[]> {
    return await db.staffServiceAssignments
      .where('[storeId+staffId]')
      .equals([storeId, staffId])
      .and(a => a.isActive)
      .toArray();
  },

  async getByService(storeId: string, serviceId: string): Promise<StaffServiceAssignment[]> {
    return await db.staffServiceAssignments
      .where('[storeId+serviceId]')
      .equals([storeId, serviceId])
      .and(a => a.isActive)
      .toArray();
  },

  async getById(id: string): Promise<StaffServiceAssignment | undefined> {
    return await db.staffServiceAssignments.get(id);
  },

  async getByStaffAndService(staffId: string, serviceId: string): Promise<StaffServiceAssignment | undefined> {
    return await db.staffServiceAssignments
      .where('[staffId+serviceId]')
      .equals([staffId, serviceId])
      .first();
  },

  async create(
    input: CreateStaffAssignmentInput,
    storeId: string,
    userId: string,
    deviceId: string,
    tenantId: string
  ): Promise<StaffServiceAssignment> {
    const syncDefaults = createBaseSyncableDefaults(userId, deviceId, tenantId, storeId);

    const assignment: StaffServiceAssignment = {
      id: uuidv4(),
      ...syncDefaults,
      ...input,
    };

    await db.staffServiceAssignments.add(assignment);
    return assignment;
  },

  async update(
    id: string,
    updates: Partial<StaffServiceAssignment>,
    userId: string,
    deviceId: string
  ): Promise<StaffServiceAssignment | undefined> {
    const assignment = await db.staffServiceAssignments.get(id);
    if (!assignment) return undefined;

    const newVersion = assignment.version + 1;
    const updated: StaffServiceAssignment = {
      ...assignment,
      ...updates,
      version: newVersion,
      vectorClock: {
        ...assignment.vectorClock,
        [deviceId]: newVersion,
      },
      updatedAt: new Date().toISOString(),
      lastModifiedBy: userId,
      lastModifiedByDevice: deviceId,
      syncStatus: 'local',
    };

    await db.staffServiceAssignments.put(updated);
    return updated;
  },

  async delete(id: string): Promise<void> {
    await db.staffServiceAssignments.delete(id);
  },

  async assignStaffToService(
    storeId: string,
    staffId: string,
    serviceId: string,
    userId: string,
    deviceId: string,
    tenantId: string,
    options?: { customPrice?: number; customDuration?: number; customCommissionRate?: number }
  ): Promise<StaffServiceAssignment> {
    // Check if already exists
    const existing = await this.getByStaffAndService(staffId, serviceId);
    if (existing) {
      if (!existing.isActive) {
        // Reactivate
        const updated = await this.update(existing.id, { isActive: true, ...options }, userId, deviceId);
        return updated!;
      }
      return existing;
    }

    return await this.create({
      staffId,
      serviceId,
      isActive: true,
      ...options,
    }, storeId, userId, deviceId, tenantId);
  },

  async removeStaffFromService(
    staffId: string,
    serviceId: string,
    userId: string,
    deviceId: string
  ): Promise<void> {
    const assignment = await this.getByStaffAndService(staffId, serviceId);
    if (assignment) {
      await this.update(assignment.id, { isActive: false }, userId, deviceId);
    }
  },
};

// ==================== CATALOG SETTINGS ====================

export const catalogSettingsDB = {
  async get(storeId: string): Promise<CatalogSettings | undefined> {
    return await db.catalogSettings
      .where('storeId')
      .equals(storeId)
      .first();
  },

  async getOrCreate(
    storeId: string,
    userId: string,
    deviceId: string,
    tenantId: string
  ): Promise<CatalogSettings> {
    // Check for existing settings first
    const existing = await this.get(storeId);
    if (existing) return existing;

    // Create default settings with sync fields
    const syncDefaults = createBaseSyncableDefaults(userId, deviceId, tenantId, storeId);
    const defaults: CatalogSettings = {
      id: uuidv4(),
      ...syncDefaults,
      defaultDuration: 60,
      defaultExtraTime: 0,
      defaultExtraTimeType: 'processing',
      defaultTaxRate: 0,
      currency: 'USD',
      currencySymbol: '$',
      showPricesOnline: true,
      requireDepositForOnlineBooking: false,
      defaultDepositPercentage: 20,
      enablePackages: true,
      enableAddOns: true,
      enableVariants: true,
      allowCustomPricing: true,
      bookingSequenceEnabled: false,
    };

    try {
      await db.catalogSettings.add(defaults);
      return defaults;
    } catch (error) {
      // Race condition: another call might have created it
      // Try to get the existing record
      const created = await this.get(storeId);
      if (created) return created;
      // If still not found, rethrow the error
      throw error;
    }
  },

  async update(
    storeId: string,
    updates: Partial<CatalogSettings>,
    userId: string,
    deviceId: string
  ): Promise<CatalogSettings | undefined> {
    const settings = await this.get(storeId);
    if (!settings) return undefined;

    const newVersion = settings.version + 1;
    const updated: CatalogSettings = {
      ...settings,
      ...updates,
      version: newVersion,
      vectorClock: {
        ...settings.vectorClock,
        [deviceId]: newVersion,
      },
      updatedAt: new Date().toISOString(),
      lastModifiedBy: userId,
      lastModifiedByDevice: deviceId,
      syncStatus: 'local',
    };

    await db.catalogSettings.put(updated);
    return updated;
  },
};

// ==================== PRODUCTS (Inventory/Catalog) ====================

/**
 * Products database operations.
 * For retail products displayed in checkout and catalog management.
 * Uses compound indexes - guards required to prevent IDBKeyRange errors.
 */
export const productsDB = {
  /**
   * Get all products for a store.
   * @param includeInactive - If true, includes inactive products
   */
  async getAll(storeId: string, includeInactive = false): Promise<Product[]> {
    if (!storeId) return [];

    if (includeInactive) {
      return await db.products
        .where('storeId')
        .equals(storeId)
        .toArray();
    }

    return await db.products
      .where('storeId')
      .equals(storeId)
      .and(p => p.isActive === true)
      .toArray();
  },

  /**
   * Get retail products only (for checkout ProductSales).
   * Uses compound index [storeId+isRetail].
   */
  async getRetail(storeId: string): Promise<Product[]> {
    if (!storeId) return [];

    return await db.products
      .where('storeId')
      .equals(storeId)
      .and(p => p.isRetail === true && p.isActive === true)
      .toArray();
  },

  /**
   * Get products by category.
   * Uses compound index [storeId+category].
   */
  async getByCategory(storeId: string, category: string): Promise<Product[]> {
    if (!storeId) return [];

    return await db.products
      .where('[storeId+category]')
      .equals([storeId, category])
      .and(p => p.isActive === true)
      .toArray();
  },

  /**
   * Get product by SKU.
   * Uses compound index [storeId+sku].
   */
  async getBySku(storeId: string, sku: string): Promise<Product | undefined> {
    if (!storeId) return undefined;

    return await db.products
      .where('[storeId+sku]')
      .equals([storeId, sku])
      .first();
  },

  /**
   * Get product by barcode.
   */
  async getByBarcode(storeId: string, barcode: string): Promise<Product | undefined> {
    if (!storeId) return undefined;

    return await db.products
      .where('storeId')
      .equals(storeId)
      .and(p => p.barcode === barcode)
      .first();
  },

  /**
   * Get product by ID.
   */
  async getById(id: string): Promise<Product | undefined> {
    return await db.products.get(id);
  },

  /**
   * Add a new product.
   */
  async add(product: Product): Promise<string> {
    await db.products.add(product);
    return product.id;
  },

  /**
   * Create a new product from input data.
   */
  async create(data: CreateProductInput, storeId: string, tenantId: string, userId = 'system', deviceId = 'unknown'): Promise<Product> {
    const now = new Date().toISOString();
    const product: Product = {
      id: uuidv4(),
      storeId,
      tenantId,
      ...data,
      margin: data.retailPrice > 0
        ? Math.round(((data.retailPrice - data.costPrice) / data.retailPrice) * 100)
        : 0,
      isActive: true,
      createdAt: now,
      updatedAt: now,
      version: 1,
      isDeleted: false,
      // Sync-related fields (required by BaseSyncableEntity)
      syncStatus: 'local',
      vectorClock: { [deviceId]: 1 },
      lastSyncedVersion: 0,
      createdBy: userId,
      createdByDevice: deviceId,
      lastModifiedBy: userId,
      lastModifiedByDevice: deviceId,
    };

    await db.products.add(product);
    return product;
  },

  /**
   * Update an existing product.
   */
  async update(id: string, changes: Partial<Product>): Promise<number> {
    return await db.products.update(id, {
      ...changes,
      updatedAt: new Date().toISOString(),
    });
  },

  /**
   * Delete a product (soft delete by setting isActive = false).
   */
  async delete(id: string): Promise<void> {
    await db.products.update(id, {
      isActive: false,
      updatedAt: new Date().toISOString(),
    });
  },

  /**
   * Archive a product (same as soft delete, returns updated product).
   */
  async archive(id: string): Promise<Product | undefined> {
    await db.products.update(id, {
      isActive: false,
      updatedAt: new Date().toISOString(),
    });
    return await db.products.get(id);
  },

  /**
   * Restore an archived product.
   * Sets isActive=true, isDeleted=false, increments version, updates vectorClock.
   * @param id - Product ID to restore
   * @param userId - User performing the restore
   * @param deviceId - Device performing the restore
   */
  async restore(id: string, userId: string, deviceId = 'web-client'): Promise<Product | undefined> {
    const product = await db.products.get(id);
    if (!product) return undefined;

    const newVersion = product.version + 1;
    const restored: Product = {
      ...product,
      isActive: true,
      isDeleted: false,
      version: newVersion,
      vectorClock: {
        ...product.vectorClock,
        [deviceId]: newVersion,
      },
      updatedAt: new Date().toISOString(),
      lastModifiedBy: userId,
      lastModifiedByDevice: deviceId,
      syncStatus: 'local',
    };

    await db.products.put(restored);
    return restored;
  },

  /**
   * Hard delete a product (use with caution).
   */
  async hardDelete(id: string): Promise<void> {
    await db.products.delete(id);
  },

  /**
   * Get unique categories for a store.
   */
  async getCategories(storeId: string): Promise<string[]> {
    if (!storeId) return [];

    const products = await db.products
      .where('storeId')
      .equals(storeId)
      .and(p => p.isActive === true)
      .toArray();

    const categories = new Set(products.map(p => p.category));
    return Array.from(categories).sort();
  },
};

// ==================== BOOKING SEQUENCES ====================

/**
 * Booking Sequences database operations.
 * Defines the order services should be performed during booking.
 * Example: Cut → Color → Style
 */
export const bookingSequencesDB = {
  /**
   * Get all booking sequences for a store.
   * @param includeDisabled - If true, includes disabled sequences
   */
  async getAll(storeId: string, includeDisabled = false): Promise<BookingSequence[]> {
    if (!storeId) return [];

    if (includeDisabled) {
      return await db.bookingSequences
        .where('storeId')
        .equals(storeId)
        .toArray();
    }

    return await db.bookingSequences
      .where('storeId')
      .equals(storeId)
      .and(seq => seq.isEnabled === true)
      .toArray();
  },

  /**
   * Get a booking sequence by ID.
   */
  async getById(id: string): Promise<BookingSequence | undefined> {
    return await db.bookingSequences.get(id);
  },

  /**
   * Create a new booking sequence.
   */
  async create(
    input: CreateBookingSequenceInput,
    userId: string,
    storeId: string,
    tenantId: string = storeId,
    deviceId = 'web-client'
  ): Promise<BookingSequence> {
    const syncDefaults = createBaseSyncableDefaults(userId, deviceId, tenantId, storeId);

    const sequence: BookingSequence = {
      id: uuidv4(),
      ...syncDefaults,
      ...input,
    };

    await db.bookingSequences.add(sequence);
    return sequence;
  },

  /**
   * Update an existing booking sequence.
   */
  async update(
    id: string,
    updates: Partial<BookingSequence>,
    userId: string,
    deviceId = 'web-client'
  ): Promise<BookingSequence | undefined> {
    const sequence = await db.bookingSequences.get(id);
    if (!sequence) return undefined;

    const newVersion = sequence.version + 1;
    const updated: BookingSequence = {
      ...sequence,
      ...updates,
      version: newVersion,
      vectorClock: {
        ...sequence.vectorClock,
        [deviceId]: newVersion,
      },
      updatedAt: new Date().toISOString(),
      lastModifiedBy: userId,
      lastModifiedByDevice: deviceId,
      syncStatus: 'local',
    };

    await db.bookingSequences.put(updated);
    return updated;
  },

  /**
   * Delete a booking sequence (hard delete).
   */
  async delete(id: string): Promise<void> {
    await db.bookingSequences.delete(id);
  },

  /**
   * Enable a booking sequence.
   */
  async enable(id: string, userId: string, deviceId = 'web-client'): Promise<BookingSequence | undefined> {
    return await this.update(id, { isEnabled: true }, userId, deviceId);
  },

  /**
   * Disable a booking sequence.
   */
  async disable(id: string, userId: string, deviceId = 'web-client'): Promise<BookingSequence | undefined> {
    return await this.update(id, { isEnabled: false }, userId, deviceId);
  },

  /**
   * Update the service order for a booking sequence.
   */
  async updateServiceOrder(
    id: string,
    serviceOrder: string[],
    userId: string,
    deviceId = 'web-client'
  ): Promise<BookingSequence | undefined> {
    return await this.update(id, { serviceOrder }, userId, deviceId);
  },
};
