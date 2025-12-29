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

// ==================== SERVICE CATEGORIES ====================

export const serviceCategoriesDB = {
  async getAll(salonId: string, includeInactive = false): Promise<ServiceCategory[]> {
    let query = db.serviceCategories
      .where('salonId')
      .equals(salonId);

    if (!includeInactive) {
      query = query.and(cat => cat.isActive);
    }

    return await query
      .sortBy('displayOrder');
  },

  async getById(id: string): Promise<ServiceCategory | undefined> {
    return await db.serviceCategories.get(id);
  },

  async getWithCounts(salonId: string, includeInactive = false): Promise<CategoryWithCount[]> {
    const categories = await this.getAll(salonId, includeInactive);
    const services = await db.menuServices
      .where('salonId')
      .equals(salonId)
      .toArray();

    return categories.map(cat => ({
      ...cat,
      servicesCount: services.filter(s => s.categoryId === cat.id).length,
      activeServicesCount: services.filter(s => s.categoryId === cat.id && s.status === 'active').length,
    }));
  },

  async create(input: CreateCategoryInput, userId: string, salonId: string): Promise<ServiceCategory> {
    const now = new Date().toISOString();

    // Get next display order
    const maxOrder = await db.serviceCategories
      .where('salonId')
      .equals(salonId)
      .toArray()
      .then(cats => Math.max(0, ...cats.map(c => c.displayOrder)));

    const category: ServiceCategory = {
      id: uuidv4(),
      salonId,
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

  async reorder(_salonId: string, orderedIds: string[], userId: string): Promise<void> {
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
  async getAll(salonId: string, includeInactive = false): Promise<MenuService[]> {
    let query = db.menuServices
      .where('salonId')
      .equals(salonId);

    if (!includeInactive) {
      query = query.and(svc => svc.status === 'active');
    }

    return await query.sortBy('displayOrder');
  },

  async getById(id: string): Promise<MenuService | undefined> {
    return await db.menuServices.get(id);
  },

  async getByCategory(salonId: string, categoryId: string, includeInactive = false): Promise<MenuService[]> {
    let result = await db.menuServices
      .where('[salonId+categoryId]')
      .equals([salonId, categoryId])
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

  async create(input: CreateMenuServiceInput, userId: string, salonId: string): Promise<MenuService> {
    const now = new Date().toISOString();

    // Get next display order within category
    const maxOrder = await db.menuServices
      .where('[salonId+categoryId]')
      .equals([salonId, input.categoryId])
      .toArray()
      .then(svcs => Math.max(0, ...svcs.map(s => s.displayOrder)));

    const service: MenuService = {
      id: uuidv4(),
      salonId,
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
    return await this.update(id, { status: 'archived' }, userId);
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

  async search(salonId: string, query: string, limit = 50): Promise<MenuService[]> {
    const lowerQuery = query.toLowerCase();
    return await db.menuServices
      .where('salonId')
      .equals(salonId)
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

  async create(input: CreateVariantInput, salonId: string): Promise<ServiceVariant> {
    const now = new Date().toISOString();

    // Get next display order
    const maxOrder = await db.serviceVariants
      .where('serviceId')
      .equals(input.serviceId)
      .toArray()
      .then(vars => Math.max(0, ...vars.map(v => v.displayOrder)));

    const variant: ServiceVariant = {
      id: uuidv4(),
      salonId,
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
  async getAll(salonId: string, includeInactive = false): Promise<ServicePackage[]> {
    let query = db.servicePackages
      .where('salonId')
      .equals(salonId);

    if (!includeInactive) {
      query = query.and(pkg => pkg.isActive);
    }

    return await query.sortBy('displayOrder');
  },

  async getById(id: string): Promise<ServicePackage | undefined> {
    return await db.servicePackages.get(id);
  },

  async create(input: CreatePackageInput, userId: string, salonId: string): Promise<ServicePackage> {
    const now = new Date().toISOString();

    const maxOrder = await db.servicePackages
      .where('salonId')
      .equals(salonId)
      .toArray()
      .then(pkgs => Math.max(0, ...pkgs.map(p => p.displayOrder)));

    const pkg: ServicePackage = {
      id: uuidv4(),
      salonId,
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
  async getAll(salonId: string, includeInactive = false): Promise<AddOnGroup[]> {
    let query = db.addOnGroups
      .where('salonId')
      .equals(salonId);

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

  async getAllWithOptions(salonId: string, includeInactive = false): Promise<AddOnGroupWithOptions[]> {
    const groups = await this.getAll(salonId, includeInactive);
    const allOptions = await db.addOnOptions.where('salonId').equals(salonId).toArray();

    return groups.map(group => ({
      ...group,
      options: allOptions
        .filter(o => o.groupId === group.id && (includeInactive || o.isActive))
        .sort((a, b) => a.displayOrder - b.displayOrder),
    }));
  },

  async getForService(salonId: string, serviceId: string, categoryId: string): Promise<AddOnGroupWithOptions[]> {
    const allGroups = await this.getAllWithOptions(salonId, false);

    return allGroups.filter(group =>
      group.applicableToAll ||
      group.applicableServiceIds.includes(serviceId) ||
      group.applicableCategoryIds.includes(categoryId)
    );
  },

  async create(input: CreateAddOnGroupInput, salonId: string): Promise<AddOnGroup> {
    const now = new Date().toISOString();

    const maxOrder = await db.addOnGroups
      .where('salonId')
      .equals(salonId)
      .toArray()
      .then(groups => Math.max(0, ...groups.map(g => g.displayOrder)));

    const group: AddOnGroup = {
      id: uuidv4(),
      salonId,
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

  async create(input: CreateAddOnOptionInput, salonId: string): Promise<AddOnOption> {
    const now = new Date().toISOString();

    const maxOrder = await db.addOnOptions
      .where('groupId')
      .equals(input.groupId)
      .toArray()
      .then(opts => Math.max(0, ...opts.map(o => o.displayOrder)));

    const option: AddOnOption = {
      id: uuidv4(),
      salonId,
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
  async getByStaff(salonId: string, staffId: string): Promise<StaffServiceAssignment[]> {
    return await db.staffServiceAssignments
      .where('[salonId+staffId]')
      .equals([salonId, staffId])
      .and(a => a.isActive)
      .toArray();
  },

  async getByService(salonId: string, serviceId: string): Promise<StaffServiceAssignment[]> {
    return await db.staffServiceAssignments
      .where('[salonId+serviceId]')
      .equals([salonId, serviceId])
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

  async create(input: CreateStaffAssignmentInput, salonId: string): Promise<StaffServiceAssignment> {
    const now = new Date().toISOString();

    const assignment: StaffServiceAssignment = {
      id: uuidv4(),
      salonId,
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
    salonId: string,
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
    }, salonId);
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
  async get(salonId: string): Promise<CatalogSettings | undefined> {
    return await db.catalogSettings
      .where('salonId')
      .equals(salonId)
      .first();
  },

  async getOrCreate(salonId: string): Promise<CatalogSettings> {
    // Check for existing settings first
    const existing = await this.get(salonId);
    if (existing) return existing;

    // Create default settings
    const now = new Date().toISOString();
    const defaults: CatalogSettings = {
      id: uuidv4(),
      salonId,
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
      const created = await this.get(salonId);
      if (created) return created;
      // If still not found, rethrow the error
      throw error;
    }
  },

  async update(salonId: string, updates: Partial<CatalogSettings>): Promise<CatalogSettings | undefined> {
    const settings = await this.get(salonId);
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
