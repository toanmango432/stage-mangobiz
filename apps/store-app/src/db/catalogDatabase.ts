/**
 * Catalog Module Database Operations
 * CRUD operations for catalog entities following existing patterns
 *
 * See: docs/PRD-Catalog-Module.md
 */

import { v4 as uuidv4 } from 'uuid';
import { db } from './schema';
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
  AddOnGroupWithOptions
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

  async create(input: CreateCategoryInput, userId: string, storeId: string): Promise<ServiceCategory> {
    const now = new Date().toISOString();

    // Get next display order
    const maxOrder = await db.serviceCategories
      .where('storeId')
      .equals(storeId)
      .toArray()
      .then(cats => Math.max(0, ...cats.map(c => c.displayOrder)));

    const category: ServiceCategory = {
      id: uuidv4(),
      storeId,
      ...input,
      displayOrder: input.displayOrder ?? maxOrder + 1,
      createdAt: now,
      updatedAt: now,
      createdBy: userId,
      lastModifiedBy: userId,
      syncStatus: 'local',
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

  async create(input: CreateMenuServiceInput, userId: string, storeId: string): Promise<MenuService> {
    const now = new Date().toISOString();

    // Get next display order within category
    const maxOrder = await db.menuServices
      .where('[storeId+categoryId]')
      .equals([storeId, input.categoryId])
      .toArray()
      .then(svcs => Math.max(0, ...svcs.map(s => s.displayOrder)));

    const service: MenuService = {
      id: uuidv4(),
      storeId,
      ...input,
      displayOrder: input.displayOrder ?? maxOrder + 1,
      createdAt: now,
      updatedAt: now,
      createdBy: userId,
      lastModifiedBy: userId,
      syncStatus: 'local',
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

  async create(input: CreateVariantInput, storeId: string): Promise<ServiceVariant> {
    const now = new Date().toISOString();

    // Get next display order
    const maxOrder = await db.serviceVariants
      .where('serviceId')
      .equals(input.serviceId)
      .toArray()
      .then(vars => Math.max(0, ...vars.map(v => v.displayOrder)));

    const variant: ServiceVariant = {
      id: uuidv4(),
      storeId,
      ...input,
      displayOrder: input.displayOrder ?? maxOrder + 1,
      createdAt: now,
      updatedAt: now,
      syncStatus: 'local',
    };

    await db.serviceVariants.add(variant);
    return variant;
  },

  async update(id: string, updates: Partial<ServiceVariant>): Promise<ServiceVariant | undefined> {
    const variant = await db.serviceVariants.get(id);
    if (!variant) return undefined;

    const updated: ServiceVariant = {
      ...variant,
      ...updates,
      updatedAt: new Date().toISOString(),
      syncStatus: 'local',
    };

    await db.serviceVariants.put(updated);
    return updated;
  },

  async delete(id: string): Promise<void> {
    await db.serviceVariants.delete(id);
  },

  async setDefault(serviceId: string, variantId: string): Promise<void> {
    await db.transaction('rw', db.serviceVariants, async () => {
      // Remove default from all variants of this service
      const variants = await db.serviceVariants.where('serviceId').equals(serviceId).toArray();
      for (const v of variants) {
        await db.serviceVariants.update(v.id, {
          isDefault: v.id === variantId,
          updatedAt: new Date().toISOString(),
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

  async create(input: CreatePackageInput, userId: string, storeId: string): Promise<ServicePackage> {
    const now = new Date().toISOString();

    const maxOrder = await db.servicePackages
      .where('storeId')
      .equals(storeId)
      .toArray()
      .then(pkgs => Math.max(0, ...pkgs.map(p => p.displayOrder)));

    const pkg: ServicePackage = {
      id: uuidv4(),
      storeId,
      ...input,
      displayOrder: input.displayOrder ?? maxOrder + 1,
      createdAt: now,
      updatedAt: now,
      createdBy: userId,
      lastModifiedBy: userId,
      syncStatus: 'local',
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

  async create(input: CreateAddOnGroupInput, storeId: string): Promise<AddOnGroup> {
    const now = new Date().toISOString();

    const maxOrder = await db.addOnGroups
      .where('storeId')
      .equals(storeId)
      .toArray()
      .then(groups => Math.max(0, ...groups.map(g => g.displayOrder)));

    const group: AddOnGroup = {
      id: uuidv4(),
      storeId,
      ...input,
      displayOrder: input.displayOrder ?? maxOrder + 1,
      createdAt: now,
      updatedAt: now,
      syncStatus: 'local',
    };

    await db.addOnGroups.add(group);
    return group;
  },

  async update(id: string, updates: Partial<AddOnGroup>): Promise<AddOnGroup | undefined> {
    const group = await db.addOnGroups.get(id);
    if (!group) return undefined;

    const updated: AddOnGroup = {
      ...group,
      ...updates,
      updatedAt: new Date().toISOString(),
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

  async create(input: CreateAddOnOptionInput, storeId: string): Promise<AddOnOption> {
    const now = new Date().toISOString();

    const maxOrder = await db.addOnOptions
      .where('groupId')
      .equals(input.groupId)
      .toArray()
      .then(opts => Math.max(0, ...opts.map(o => o.displayOrder)));

    const option: AddOnOption = {
      id: uuidv4(),
      storeId,
      ...input,
      displayOrder: input.displayOrder ?? maxOrder + 1,
      createdAt: now,
      updatedAt: now,
      syncStatus: 'local',
    };

    await db.addOnOptions.add(option);
    return option;
  },

  async update(id: string, updates: Partial<AddOnOption>): Promise<AddOnOption | undefined> {
    const option = await db.addOnOptions.get(id);
    if (!option) return undefined;

    const updated: AddOnOption = {
      ...option,
      ...updates,
      updatedAt: new Date().toISOString(),
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

  async create(input: CreateStaffAssignmentInput, storeId: string): Promise<StaffServiceAssignment> {
    const now = new Date().toISOString();

    const assignment: StaffServiceAssignment = {
      id: uuidv4(),
      storeId,
      ...input,
      createdAt: now,
      updatedAt: now,
      syncStatus: 'local',
    };

    await db.staffServiceAssignments.add(assignment);
    return assignment;
  },

  async update(id: string, updates: Partial<StaffServiceAssignment>): Promise<StaffServiceAssignment | undefined> {
    const assignment = await db.staffServiceAssignments.get(id);
    if (!assignment) return undefined;

    const updated: StaffServiceAssignment = {
      ...assignment,
      ...updates,
      updatedAt: new Date().toISOString(),
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
    options?: { customPrice?: number; customDuration?: number; customCommissionRate?: number }
  ): Promise<StaffServiceAssignment> {
    // Check if already exists
    const existing = await this.getByStaffAndService(staffId, serviceId);
    if (existing) {
      if (!existing.isActive) {
        // Reactivate
        const updated = await this.update(existing.id, { isActive: true, ...options });
        return updated!;
      }
      return existing;
    }

    return await this.create({
      staffId,
      serviceId,
      isActive: true,
      ...options,
    }, storeId);
  },

  async removeStaffFromService(staffId: string, serviceId: string): Promise<void> {
    const assignment = await this.getByStaffAndService(staffId, serviceId);
    if (assignment) {
      await this.update(assignment.id, { isActive: false });
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

  async getOrCreate(storeId: string): Promise<CatalogSettings> {
    // Check for existing settings first
    const existing = await this.get(storeId);
    if (existing) return existing;

    // Create default settings
    const now = new Date().toISOString();
    const defaults: CatalogSettings = {
      id: uuidv4(),
      storeId,
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
      createdAt: now,
      updatedAt: now,
      syncStatus: 'local',
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

  async update(storeId: string, updates: Partial<CatalogSettings>): Promise<CatalogSettings | undefined> {
    const settings = await this.get(storeId);
    if (!settings) return undefined;

    const updated: CatalogSettings = {
      ...settings,
      ...updates,
      updatedAt: new Date().toISOString(),
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
  async getAll(storeId: string, includeInactive: boolean = false): Promise<Product[]> {
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
  async create(data: CreateProductInput, storeId: string, tenantId: string, userId: string = 'system', deviceId: string = 'unknown'): Promise<Product> {
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
