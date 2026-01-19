/**
 * Catalog SQLite Services
 *
 * SQLite service implementations for catalog/menu management tables.
 * Includes: ServiceCategory, MenuService, ServiceVariant, ServicePackage,
 * AddOnGroup, AddOnOption, StaffServiceAssignment, CatalogSettings, Product
 *
 * @module sqlite-adapter/services/catalog
 */

import { BaseSQLiteService, type TableSchema, type ColumnDefinition } from './BaseSQLiteService';
import type { SQLiteAdapter } from '../types';

// ============================================
// TYPE DEFINITIONS
// ============================================

/** Sync status for catalog entities */
export type CatalogSyncStatus = 'local' | 'synced' | 'pending' | 'error';

/** Service pricing type */
export type PricingType = 'fixed' | 'from' | 'free' | 'varies' | 'hourly';

/** Menu service status */
export type MenuServiceStatus = 'active' | 'inactive' | 'archived';

/** Booking availability */
export type BookingAvailability = 'online' | 'in-store' | 'both' | 'disabled';

/** Extra time type */
export type ExtraTimeType = 'processing' | 'blocked' | 'finishing';

/** Bundle booking mode */
export type BundleBookingMode = 'single-session' | 'multiple-visits';

/** Package service item (embedded in ServicePackage) */
export interface PackageServiceItem {
  serviceId: string;
  serviceName: string;
  variantId?: string;
  variantName?: string;
  quantity: number;
  originalPrice: number;
}

// ============================================
// SERVICE CATEGORY
// ============================================

export interface ServiceCategory extends Record<string, unknown> {
  id: string;
  storeId: string;
  name: string;
  description?: string;
  color: string;
  icon?: string;
  displayOrder: number;
  isActive: boolean;
  parentCategoryId?: string;
  showOnlineBooking?: boolean;
  createdAt: string;
  updatedAt: string;
  syncStatus: CatalogSyncStatus;
  createdBy?: string;
  lastModifiedBy?: string;
}

export interface ServiceCategoryRow {
  id: string;
  store_id: string;
  name: string;
  description: string | null;
  color: string;
  icon: string | null;
  display_order: number;
  is_active: number;
  parent_category_id: string | null;
  show_online_booking: number | null;
  created_at: string;
  updated_at: string;
  sync_status: string;
  created_by: string | null;
  last_modified_by: string | null;
}

const serviceCategorySchema: TableSchema = {
  tableName: 'service_categories',
  primaryKey: 'id',
  columns: {
    id: 'id',
    storeId: 'store_id',
    name: 'name',
    description: 'description',
    color: 'color',
    icon: 'icon',
    displayOrder: 'display_order',
    isActive: { column: 'is_active', type: 'boolean' } as ColumnDefinition,
    parentCategoryId: 'parent_category_id',
    showOnlineBooking: { column: 'show_online_booking', type: 'boolean' } as ColumnDefinition,
    createdAt: { column: 'created_at', type: 'date' } as ColumnDefinition,
    updatedAt: { column: 'updated_at', type: 'date' } as ColumnDefinition,
    syncStatus: 'sync_status',
    createdBy: 'created_by',
    lastModifiedBy: 'last_modified_by',
  },
};

export class ServiceCategorySQLiteService extends BaseSQLiteService<ServiceCategory, ServiceCategoryRow> {
  constructor(adapter: SQLiteAdapter) {
    super(adapter, serviceCategorySchema);
  }

  /**
   * Get active categories for a store
   */
  async getActive(storeId: string): Promise<ServiceCategory[]> {
    return this.findWhere('store_id = ? AND is_active = 1 ORDER BY display_order ASC', [storeId]);
  }

  /**
   * Get categories by parent (for hierarchical display)
   */
  async getByParent(storeId: string, parentId: string | null): Promise<ServiceCategory[]> {
    if (parentId === null) {
      return this.findWhere('store_id = ? AND parent_category_id IS NULL ORDER BY display_order ASC', [storeId]);
    }
    return this.findWhere('store_id = ? AND parent_category_id = ? ORDER BY display_order ASC', [storeId, parentId]);
  }

  /**
   * Get all categories for a store
   */
  async getByStore(storeId: string): Promise<ServiceCategory[]> {
    return this.findWhere('store_id = ? ORDER BY display_order ASC', [storeId]);
  }

  /**
   * Get root categories (no parent)
   */
  async getRootCategories(storeId: string): Promise<ServiceCategory[]> {
    return this.getByParent(storeId, null);
  }

  /**
   * Get child categories for a parent
   */
  async getChildCategories(parentCategoryId: string): Promise<ServiceCategory[]> {
    return this.findWhere('parent_category_id = ? ORDER BY display_order ASC', [parentCategoryId]);
  }

  /**
   * Count categories by store
   */
  async countByStore(storeId: string): Promise<number> {
    return this.countWhere('store_id = ?', [storeId]);
  }

  /**
   * Count active categories by store
   */
  async countActive(storeId: string): Promise<number> {
    return this.countWhere('store_id = ? AND is_active = 1', [storeId]);
  }

  /**
   * Update display order for multiple categories
   */
  async updateDisplayOrder(updates: Array<{ id: string; displayOrder: number }>): Promise<void> {
    const now = new Date().toISOString();

    for (const update of updates) {
      await this.db.run(
        `UPDATE ${this.schema.tableName} SET display_order = ?, updated_at = ? WHERE id = ?`,
        [update.displayOrder, now, update.id]
      );
    }
  }
}

// ============================================
// MENU SERVICE
// ============================================

export interface MenuService extends Record<string, unknown> {
  id: string;
  storeId: string;
  categoryId: string;
  name: string;
  description?: string;
  sku?: string;
  pricingType: PricingType;
  price: number;
  priceMax?: number;
  cost?: number;
  taxable: boolean;
  duration: number;
  extraTime?: number;
  extraTimeType?: ExtraTimeType;
  aftercareInstructions?: string;
  requiresPatchTest?: boolean;
  hasVariants: boolean;
  allStaffCanPerform: boolean;
  bookingAvailability: BookingAvailability;
  onlineBookingEnabled: boolean;
  requiresDeposit: boolean;
  depositAmount?: number;
  depositPercentage?: number;
  onlineBookingBufferMinutes?: number;
  advanceBookingDaysMin?: number;
  advanceBookingDaysMax?: number;
  rebookReminderDays?: number;
  turnWeight?: number;
  commissionRate?: number;
  color?: string;
  images?: string[];
  tags?: string[];
  status: MenuServiceStatus;
  displayOrder: number;
  showPriceOnline: boolean;
  allowCustomDuration: boolean;
  createdAt: string;
  updatedAt: string;
  syncStatus: CatalogSyncStatus;
  createdBy?: string;
  lastModifiedBy?: string;
}

export interface MenuServiceRow {
  id: string;
  store_id: string;
  category_id: string;
  name: string;
  description: string | null;
  sku: string | null;
  pricing_type: string;
  price: number;
  price_max: number | null;
  cost: number | null;
  taxable: number;
  duration: number;
  extra_time: number | null;
  extra_time_type: string | null;
  aftercare_instructions: string | null;
  requires_patch_test: number | null;
  has_variants: number;
  all_staff_can_perform: number;
  booking_availability: string;
  online_booking_enabled: number;
  requires_deposit: number;
  deposit_amount: number | null;
  deposit_percentage: number | null;
  online_booking_buffer_minutes: number | null;
  advance_booking_days_min: number | null;
  advance_booking_days_max: number | null;
  rebook_reminder_days: number | null;
  turn_weight: number | null;
  commission_rate: number | null;
  color: string | null;
  images: string | null;
  tags: string | null;
  status: string;
  display_order: number;
  show_price_online: number;
  allow_custom_duration: number;
  created_at: string;
  updated_at: string;
  sync_status: string;
  created_by: string | null;
  last_modified_by: string | null;
}

const menuServiceSchema: TableSchema = {
  tableName: 'menu_services',
  primaryKey: 'id',
  columns: {
    id: 'id',
    storeId: 'store_id',
    categoryId: 'category_id',
    name: 'name',
    description: 'description',
    sku: 'sku',
    pricingType: 'pricing_type',
    price: 'price',
    priceMax: 'price_max',
    cost: 'cost',
    taxable: { column: 'taxable', type: 'boolean' } as ColumnDefinition,
    duration: 'duration',
    extraTime: 'extra_time',
    extraTimeType: 'extra_time_type',
    aftercareInstructions: 'aftercare_instructions',
    requiresPatchTest: { column: 'requires_patch_test', type: 'boolean' } as ColumnDefinition,
    hasVariants: { column: 'has_variants', type: 'boolean' } as ColumnDefinition,
    allStaffCanPerform: { column: 'all_staff_can_perform', type: 'boolean' } as ColumnDefinition,
    bookingAvailability: 'booking_availability',
    onlineBookingEnabled: { column: 'online_booking_enabled', type: 'boolean' } as ColumnDefinition,
    requiresDeposit: { column: 'requires_deposit', type: 'boolean' } as ColumnDefinition,
    depositAmount: 'deposit_amount',
    depositPercentage: 'deposit_percentage',
    onlineBookingBufferMinutes: 'online_booking_buffer_minutes',
    advanceBookingDaysMin: 'advance_booking_days_min',
    advanceBookingDaysMax: 'advance_booking_days_max',
    rebookReminderDays: 'rebook_reminder_days',
    turnWeight: 'turn_weight',
    commissionRate: 'commission_rate',
    color: 'color',
    images: { column: 'images', type: 'json' } as ColumnDefinition,
    tags: { column: 'tags', type: 'json' } as ColumnDefinition,
    status: 'status',
    displayOrder: 'display_order',
    showPriceOnline: { column: 'show_price_online', type: 'boolean' } as ColumnDefinition,
    allowCustomDuration: { column: 'allow_custom_duration', type: 'boolean' } as ColumnDefinition,
    createdAt: { column: 'created_at', type: 'date' } as ColumnDefinition,
    updatedAt: { column: 'updated_at', type: 'date' } as ColumnDefinition,
    syncStatus: 'sync_status',
    createdBy: 'created_by',
    lastModifiedBy: 'last_modified_by',
  },
};

export class MenuServiceSQLiteService extends BaseSQLiteService<MenuService, MenuServiceRow> {
  constructor(adapter: SQLiteAdapter) {
    super(adapter, menuServiceSchema);
  }

  /**
   * Get services by category
   */
  async getByCategory(storeId: string, categoryId: string): Promise<MenuService[]> {
    return this.findWhere('store_id = ? AND category_id = ? ORDER BY display_order ASC', [storeId, categoryId]);
  }

  /**
   * Get active services (status = 'active')
   */
  async getActive(storeId: string): Promise<MenuService[]> {
    return this.findWhere("store_id = ? AND status = 'active' ORDER BY display_order ASC", [storeId]);
  }

  /**
   * Get all services for a store
   */
  async getByStore(storeId: string): Promise<MenuService[]> {
    return this.findWhere('store_id = ? ORDER BY display_order ASC', [storeId]);
  }

  /**
   * Search services by name/description
   */
  async search(storeId: string, query: string): Promise<MenuService[]> {
    const searchPattern = `%${query}%`;
    return this.findWhere(
      'store_id = ? AND (name LIKE ? OR description LIKE ?) ORDER BY display_order ASC',
      [storeId, searchPattern, searchPattern]
    );
  }

  /**
   * Get services enabled for online booking
   */
  async getOnlineBookingEnabled(storeId: string): Promise<MenuService[]> {
    return this.findWhere("store_id = ? AND online_booking_enabled = 1 AND status = 'active' ORDER BY display_order ASC", [storeId]);
  }

  /**
   * Count services by category
   */
  async countByCategory(storeId: string): Promise<Record<string, number>> {
    const rows = await this.db.all<{ category_id: string; count: number }>(
      `SELECT category_id, COUNT(*) as count
       FROM ${this.schema.tableName}
       WHERE store_id = ?
       GROUP BY category_id`,
      [storeId]
    );

    const result: Record<string, number> = {};
    for (const row of rows) {
      result[row.category_id] = row.count;
    }
    return result;
  }

  /**
   * Count active services by store
   */
  async countActive(storeId: string): Promise<number> {
    return this.countWhere("store_id = ? AND status = 'active'", [storeId]);
  }

  /**
   * Get services requiring patch test
   */
  async getRequiringPatchTest(storeId: string): Promise<MenuService[]> {
    return this.findWhere("store_id = ? AND requires_patch_test = 1 AND status = 'active' ORDER BY name ASC", [storeId]);
  }

  /**
   * Update display order for multiple services
   */
  async updateDisplayOrder(updates: Array<{ id: string; displayOrder: number }>): Promise<void> {
    const now = new Date().toISOString();

    for (const update of updates) {
      await this.db.run(
        `UPDATE ${this.schema.tableName} SET display_order = ?, updated_at = ? WHERE id = ?`,
        [update.displayOrder, now, update.id]
      );
    }
  }
}

// ============================================
// SERVICE VARIANT (Catalog Module)
// ============================================

export interface CatalogServiceVariant extends Record<string, unknown> {
  id: string;
  storeId: string;
  serviceId: string;
  name: string;
  duration: number;
  price: number;
  extraTime?: number;
  extraTimeType?: ExtraTimeType;
  isDefault: boolean;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  syncStatus: CatalogSyncStatus;
}

export interface CatalogServiceVariantRow {
  id: string;
  store_id: string;
  service_id: string;
  name: string;
  duration: number;
  price: number;
  extra_time: number | null;
  extra_time_type: string | null;
  is_default: number;
  display_order: number;
  is_active: number;
  created_at: string;
  updated_at: string;
  sync_status: string;
}

const serviceVariantSchema: TableSchema = {
  tableName: 'service_variants',
  primaryKey: 'id',
  columns: {
    id: 'id',
    storeId: 'store_id',
    serviceId: 'service_id',
    name: 'name',
    duration: 'duration',
    price: 'price',
    extraTime: 'extra_time',
    extraTimeType: 'extra_time_type',
    isDefault: { column: 'is_default', type: 'boolean' } as ColumnDefinition,
    displayOrder: 'display_order',
    isActive: { column: 'is_active', type: 'boolean' } as ColumnDefinition,
    createdAt: { column: 'created_at', type: 'date' } as ColumnDefinition,
    updatedAt: { column: 'updated_at', type: 'date' } as ColumnDefinition,
    syncStatus: 'sync_status',
  },
};

export class ServiceVariantSQLiteService extends BaseSQLiteService<CatalogServiceVariant, CatalogServiceVariantRow> {
  constructor(adapter: SQLiteAdapter) {
    super(adapter, serviceVariantSchema);
  }

  /**
   * Get variants for a service
   */
  async getByService(serviceId: string): Promise<CatalogServiceVariant[]> {
    return this.findWhere('service_id = ? ORDER BY display_order ASC', [serviceId]);
  }

  /**
   * Get active variants for a service
   */
  async getActiveByService(serviceId: string): Promise<CatalogServiceVariant[]> {
    return this.findWhere('service_id = ? AND is_active = 1 ORDER BY display_order ASC', [serviceId]);
  }

  /**
   * Get default variant for a service
   */
  async getDefaultByService(serviceId: string): Promise<CatalogServiceVariant | undefined> {
    return this.findOneWhere('service_id = ? AND is_default = 1', [serviceId]);
  }

  /**
   * Get all variants for a store
   */
  async getByStore(storeId: string): Promise<CatalogServiceVariant[]> {
    return this.findWhere('store_id = ? ORDER BY service_id, display_order ASC', [storeId]);
  }

  /**
   * Set a variant as default (unsets other defaults for same service)
   */
  async setDefault(variantId: string, serviceId: string): Promise<void> {
    const now = new Date().toISOString();

    // Unset other defaults
    await this.db.run(
      `UPDATE ${this.schema.tableName} SET is_default = 0, updated_at = ? WHERE service_id = ?`,
      [now, serviceId]
    );

    // Set the new default
    await this.db.run(
      `UPDATE ${this.schema.tableName} SET is_default = 1, updated_at = ? WHERE id = ?`,
      [now, variantId]
    );
  }
}

// ============================================
// SERVICE PACKAGE
// ============================================

export interface ServicePackage extends Record<string, unknown> {
  id: string;
  storeId: string;
  name: string;
  description?: string;
  services: PackageServiceItem[];
  originalPrice: number;
  packagePrice: number;
  discountType: 'fixed' | 'percentage';
  discountValue: number;
  bookingMode: BundleBookingMode;
  validityDays?: number;
  usageLimit?: number;
  bookingAvailability: BookingAvailability;
  onlineBookingEnabled: boolean;
  restrictedStaffIds?: string[];
  isActive: boolean;
  displayOrder: number;
  color?: string;
  images?: string[];
  createdAt: string;
  updatedAt: string;
  syncStatus: CatalogSyncStatus;
  createdBy?: string;
  lastModifiedBy?: string;
}

export interface ServicePackageRow {
  id: string;
  store_id: string;
  name: string;
  description: string | null;
  services: string;
  original_price: number;
  package_price: number;
  discount_type: string;
  discount_value: number;
  booking_mode: string;
  validity_days: number | null;
  usage_limit: number | null;
  booking_availability: string;
  online_booking_enabled: number;
  restricted_staff_ids: string | null;
  is_active: number;
  display_order: number;
  color: string | null;
  images: string | null;
  created_at: string;
  updated_at: string;
  sync_status: string;
  created_by: string | null;
  last_modified_by: string | null;
}

const servicePackageSchema: TableSchema = {
  tableName: 'service_packages',
  primaryKey: 'id',
  columns: {
    id: 'id',
    storeId: 'store_id',
    name: 'name',
    description: 'description',
    services: { column: 'services', type: 'json' } as ColumnDefinition,
    originalPrice: 'original_price',
    packagePrice: 'package_price',
    discountType: 'discount_type',
    discountValue: 'discount_value',
    bookingMode: 'booking_mode',
    validityDays: 'validity_days',
    usageLimit: 'usage_limit',
    bookingAvailability: 'booking_availability',
    onlineBookingEnabled: { column: 'online_booking_enabled', type: 'boolean' } as ColumnDefinition,
    restrictedStaffIds: { column: 'restricted_staff_ids', type: 'json' } as ColumnDefinition,
    isActive: { column: 'is_active', type: 'boolean' } as ColumnDefinition,
    displayOrder: 'display_order',
    color: 'color',
    images: { column: 'images', type: 'json' } as ColumnDefinition,
    createdAt: { column: 'created_at', type: 'date' } as ColumnDefinition,
    updatedAt: { column: 'updated_at', type: 'date' } as ColumnDefinition,
    syncStatus: 'sync_status',
    createdBy: 'created_by',
    lastModifiedBy: 'last_modified_by',
  },
};

export class ServicePackageSQLiteService extends BaseSQLiteService<ServicePackage, ServicePackageRow> {
  constructor(adapter: SQLiteAdapter) {
    super(adapter, servicePackageSchema);
  }

  /**
   * Get active packages for a store
   */
  async getActive(storeId: string): Promise<ServicePackage[]> {
    return this.findWhere('store_id = ? AND is_active = 1 ORDER BY display_order ASC', [storeId]);
  }

  /**
   * Get all packages for a store
   */
  async getByStore(storeId: string): Promise<ServicePackage[]> {
    return this.findWhere('store_id = ? ORDER BY display_order ASC', [storeId]);
  }

  /**
   * Get packages enabled for online booking
   */
  async getOnlineBookingEnabled(storeId: string): Promise<ServicePackage[]> {
    return this.findWhere('store_id = ? AND online_booking_enabled = 1 AND is_active = 1 ORDER BY display_order ASC', [storeId]);
  }

  /**
   * Search packages by name/description
   */
  async search(storeId: string, query: string): Promise<ServicePackage[]> {
    const searchPattern = `%${query}%`;
    return this.findWhere(
      'store_id = ? AND (name LIKE ? OR description LIKE ?) ORDER BY display_order ASC',
      [storeId, searchPattern, searchPattern]
    );
  }

  /**
   * Count active packages by store
   */
  async countActive(storeId: string): Promise<number> {
    return this.countWhere('store_id = ? AND is_active = 1', [storeId]);
  }
}

// ============================================
// ADD-ON GROUP
// ============================================

export interface AddOnGroup extends Record<string, unknown> {
  id: string;
  storeId: string;
  name: string;
  description?: string;
  selectionMode: 'single' | 'multiple';
  minSelections: number;
  maxSelections?: number;
  isRequired: boolean;
  applicableToAll: boolean;
  applicableCategoryIds: string[];
  applicableServiceIds: string[];
  isActive: boolean;
  displayOrder: number;
  onlineBookingEnabled: boolean;
  createdAt: string;
  updatedAt: string;
  syncStatus: CatalogSyncStatus;
}

export interface AddOnGroupRow {
  id: string;
  store_id: string;
  name: string;
  description: string | null;
  selection_mode: string;
  min_selections: number;
  max_selections: number | null;
  is_required: number;
  applicable_to_all: number;
  applicable_category_ids: string;
  applicable_service_ids: string;
  is_active: number;
  display_order: number;
  online_booking_enabled: number;
  created_at: string;
  updated_at: string;
  sync_status: string;
}

const addOnGroupSchema: TableSchema = {
  tableName: 'add_on_groups',
  primaryKey: 'id',
  columns: {
    id: 'id',
    storeId: 'store_id',
    name: 'name',
    description: 'description',
    selectionMode: 'selection_mode',
    minSelections: 'min_selections',
    maxSelections: 'max_selections',
    isRequired: { column: 'is_required', type: 'boolean' } as ColumnDefinition,
    applicableToAll: { column: 'applicable_to_all', type: 'boolean' } as ColumnDefinition,
    applicableCategoryIds: { column: 'applicable_category_ids', type: 'json' } as ColumnDefinition,
    applicableServiceIds: { column: 'applicable_service_ids', type: 'json' } as ColumnDefinition,
    isActive: { column: 'is_active', type: 'boolean' } as ColumnDefinition,
    displayOrder: 'display_order',
    onlineBookingEnabled: { column: 'online_booking_enabled', type: 'boolean' } as ColumnDefinition,
    createdAt: { column: 'created_at', type: 'date' } as ColumnDefinition,
    updatedAt: { column: 'updated_at', type: 'date' } as ColumnDefinition,
    syncStatus: 'sync_status',
  },
};

export class AddOnGroupSQLiteService extends BaseSQLiteService<AddOnGroup, AddOnGroupRow> {
  constructor(adapter: SQLiteAdapter) {
    super(adapter, addOnGroupSchema);
  }

  /**
   * Get active add-on groups for a store
   */
  async getActive(storeId: string): Promise<AddOnGroup[]> {
    return this.findWhere('store_id = ? AND is_active = 1 ORDER BY display_order ASC', [storeId]);
  }

  /**
   * Get all add-on groups for a store
   */
  async getByStore(storeId: string): Promise<AddOnGroup[]> {
    return this.findWhere('store_id = ? ORDER BY display_order ASC', [storeId]);
  }

  /**
   * Get add-on groups applicable to a service (using json_each)
   */
  async getApplicableToService(storeId: string, serviceId: string): Promise<AddOnGroup[]> {
    const rows = await this.db.all<AddOnGroupRow>(
      `SELECT g.*
       FROM ${this.schema.tableName} g
       WHERE g.store_id = ?
         AND g.is_active = 1
         AND (
           g.applicable_to_all = 1
           OR EXISTS (SELECT 1 FROM json_each(g.applicable_service_ids) WHERE value = ?)
         )
       ORDER BY g.display_order ASC`,
      [storeId, serviceId]
    );

    return rows.map(row => this.rowToEntity(row));
  }

  /**
   * Get add-on groups applicable to a category (using json_each)
   */
  async getApplicableToCategory(storeId: string, categoryId: string): Promise<AddOnGroup[]> {
    const rows = await this.db.all<AddOnGroupRow>(
      `SELECT g.*
       FROM ${this.schema.tableName} g
       WHERE g.store_id = ?
         AND g.is_active = 1
         AND (
           g.applicable_to_all = 1
           OR EXISTS (SELECT 1 FROM json_each(g.applicable_category_ids) WHERE value = ?)
         )
       ORDER BY g.display_order ASC`,
      [storeId, categoryId]
    );

    return rows.map(row => this.rowToEntity(row));
  }

  /**
   * Count active add-on groups by store
   */
  async countActive(storeId: string): Promise<number> {
    return this.countWhere('store_id = ? AND is_active = 1', [storeId]);
  }
}

// ============================================
// ADD-ON OPTION
// ============================================

export interface AddOnOption extends Record<string, unknown> {
  id: string;
  storeId: string;
  groupId: string;
  name: string;
  description?: string;
  price: number;
  duration: number;
  isActive: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
  syncStatus: CatalogSyncStatus;
}

export interface AddOnOptionRow {
  id: string;
  store_id: string;
  group_id: string;
  name: string;
  description: string | null;
  price: number;
  duration: number;
  is_active: number;
  display_order: number;
  created_at: string;
  updated_at: string;
  sync_status: string;
}

const addOnOptionSchema: TableSchema = {
  tableName: 'add_on_options',
  primaryKey: 'id',
  columns: {
    id: 'id',
    storeId: 'store_id',
    groupId: 'group_id',
    name: 'name',
    description: 'description',
    price: 'price',
    duration: 'duration',
    isActive: { column: 'is_active', type: 'boolean' } as ColumnDefinition,
    displayOrder: 'display_order',
    createdAt: { column: 'created_at', type: 'date' } as ColumnDefinition,
    updatedAt: { column: 'updated_at', type: 'date' } as ColumnDefinition,
    syncStatus: 'sync_status',
  },
};

export class AddOnOptionSQLiteService extends BaseSQLiteService<AddOnOption, AddOnOptionRow> {
  constructor(adapter: SQLiteAdapter) {
    super(adapter, addOnOptionSchema);
  }

  /**
   * Get options for a group
   */
  async getByGroup(groupId: string): Promise<AddOnOption[]> {
    return this.findWhere('group_id = ? ORDER BY display_order ASC', [groupId]);
  }

  /**
   * Get active options for a group
   */
  async getActiveByGroup(groupId: string): Promise<AddOnOption[]> {
    return this.findWhere('group_id = ? AND is_active = 1 ORDER BY display_order ASC', [groupId]);
  }

  /**
   * Get all options for a store
   */
  async getByStore(storeId: string): Promise<AddOnOption[]> {
    return this.findWhere('store_id = ? ORDER BY group_id, display_order ASC', [storeId]);
  }

  /**
   * Count options by group
   */
  async countByGroup(groupId: string): Promise<number> {
    return this.countWhere('group_id = ?', [groupId]);
  }

  /**
   * Delete all options for a group
   */
  async deleteByGroup(groupId: string): Promise<number> {
    const result = await this.db.run(
      `DELETE FROM ${this.schema.tableName} WHERE group_id = ?`,
      [groupId]
    );
    return result.changes;
  }
}

// ============================================
// STAFF SERVICE ASSIGNMENT
// ============================================

export interface StaffServiceAssignment extends Record<string, unknown> {
  id: string;
  storeId: string;
  staffId: string;
  serviceId: string;
  customPrice?: number;
  customDuration?: number;
  customCommissionRate?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  syncStatus: CatalogSyncStatus;
}

export interface StaffServiceAssignmentRow {
  id: string;
  store_id: string;
  staff_id: string;
  service_id: string;
  custom_price: number | null;
  custom_duration: number | null;
  custom_commission_rate: number | null;
  is_active: number;
  created_at: string;
  updated_at: string;
  sync_status: string;
}

const staffServiceAssignmentSchema: TableSchema = {
  tableName: 'staff_service_assignments',
  primaryKey: 'id',
  columns: {
    id: 'id',
    storeId: 'store_id',
    staffId: 'staff_id',
    serviceId: 'service_id',
    customPrice: 'custom_price',
    customDuration: 'custom_duration',
    customCommissionRate: 'custom_commission_rate',
    isActive: { column: 'is_active', type: 'boolean' } as ColumnDefinition,
    createdAt: { column: 'created_at', type: 'date' } as ColumnDefinition,
    updatedAt: { column: 'updated_at', type: 'date' } as ColumnDefinition,
    syncStatus: 'sync_status',
  },
};

export class StaffServiceAssignmentSQLiteService extends BaseSQLiteService<StaffServiceAssignment, StaffServiceAssignmentRow> {
  constructor(adapter: SQLiteAdapter) {
    super(adapter, staffServiceAssignmentSchema);
  }

  /**
   * Get assignments for a staff member
   */
  async getByStaff(staffId: string): Promise<StaffServiceAssignment[]> {
    return this.findWhere('staff_id = ? ORDER BY created_at ASC', [staffId]);
  }

  /**
   * Get active assignments for a staff member
   */
  async getActiveByStaff(staffId: string): Promise<StaffServiceAssignment[]> {
    return this.findWhere('staff_id = ? AND is_active = 1 ORDER BY created_at ASC', [staffId]);
  }

  /**
   * Get assignments for a service
   */
  async getByService(serviceId: string): Promise<StaffServiceAssignment[]> {
    return this.findWhere('service_id = ? ORDER BY created_at ASC', [serviceId]);
  }

  /**
   * Get active assignments for a service
   */
  async getActiveByService(serviceId: string): Promise<StaffServiceAssignment[]> {
    return this.findWhere('service_id = ? AND is_active = 1 ORDER BY created_at ASC', [serviceId]);
  }

  /**
   * Get assignment for a specific staff-service combination
   */
  async getByStaffAndService(staffId: string, serviceId: string): Promise<StaffServiceAssignment | undefined> {
    return this.findOneWhere('staff_id = ? AND service_id = ?', [staffId, serviceId]);
  }

  /**
   * Get all assignments for a store
   */
  async getByStore(storeId: string): Promise<StaffServiceAssignment[]> {
    return this.findWhere('store_id = ?', [storeId]);
  }

  /**
   * Count services assigned to a staff member
   */
  async countByStaff(staffId: string): Promise<number> {
    return this.countWhere('staff_id = ? AND is_active = 1', [staffId]);
  }

  /**
   * Count staff assigned to a service
   */
  async countByService(serviceId: string): Promise<number> {
    return this.countWhere('service_id = ? AND is_active = 1', [serviceId]);
  }

  /**
   * Bulk assign services to a staff member
   */
  async bulkAssignToStaff(
    storeId: string,
    staffId: string,
    serviceIds: string[]
  ): Promise<StaffServiceAssignment[]> {
    const results: StaffServiceAssignment[] = [];
    const now = new Date().toISOString();

    for (const serviceId of serviceIds) {
      const existing = await this.getByStaffAndService(staffId, serviceId);
      if (existing) {
        // Reactivate if inactive
        if (!existing.isActive) {
          await this.update(existing.id, { isActive: true, updatedAt: now });
          results.push({ ...existing, isActive: true, updatedAt: now });
        } else {
          results.push(existing);
        }
      } else {
        // Create new assignment
        const id = crypto.randomUUID();
        const assignment: StaffServiceAssignment = {
          id,
          storeId,
          staffId,
          serviceId,
          isActive: true,
          createdAt: now,
          updatedAt: now,
          syncStatus: 'local',
        };
        await this.create(assignment);
        results.push(assignment);
      }
    }

    return results;
  }

  /**
   * Remove all service assignments for a staff member
   */
  async removeAllForStaff(staffId: string): Promise<number> {
    const now = new Date().toISOString();
    const result = await this.db.run(
      `UPDATE ${this.schema.tableName} SET is_active = 0, updated_at = ? WHERE staff_id = ?`,
      [now, staffId]
    );
    return result.changes;
  }
}

// ============================================
// CATALOG SETTINGS
// ============================================

export interface CatalogSettings extends Record<string, unknown> {
  id: string;
  storeId: string;
  defaultDuration: number;
  defaultExtraTime: number;
  defaultExtraTimeType: ExtraTimeType;
  defaultTaxRate: number;
  currency: string;
  currencySymbol: string;
  showPricesOnline: boolean;
  requireDepositForOnlineBooking: boolean;
  defaultDepositPercentage: number;
  enablePackages: boolean;
  enableAddOns: boolean;
  enableVariants: boolean;
  allowCustomPricing: boolean;
  bookingSequenceEnabled: boolean;
  createdAt: string;
  updatedAt: string;
  syncStatus: CatalogSyncStatus;
}

export interface CatalogSettingsRow {
  id: string;
  store_id: string;
  default_duration: number;
  default_extra_time: number;
  default_extra_time_type: string;
  default_tax_rate: number;
  currency: string;
  currency_symbol: string;
  show_prices_online: number;
  require_deposit_for_online_booking: number;
  default_deposit_percentage: number;
  enable_packages: number;
  enable_add_ons: number;
  enable_variants: number;
  allow_custom_pricing: number;
  booking_sequence_enabled: number;
  created_at: string;
  updated_at: string;
  sync_status: string;
}

const catalogSettingsSchema: TableSchema = {
  tableName: 'catalog_settings',
  primaryKey: 'id',
  columns: {
    id: 'id',
    storeId: 'store_id',
    defaultDuration: 'default_duration',
    defaultExtraTime: 'default_extra_time',
    defaultExtraTimeType: 'default_extra_time_type',
    defaultTaxRate: 'default_tax_rate',
    currency: 'currency',
    currencySymbol: 'currency_symbol',
    showPricesOnline: { column: 'show_prices_online', type: 'boolean' } as ColumnDefinition,
    requireDepositForOnlineBooking: { column: 'require_deposit_for_online_booking', type: 'boolean' } as ColumnDefinition,
    defaultDepositPercentage: 'default_deposit_percentage',
    enablePackages: { column: 'enable_packages', type: 'boolean' } as ColumnDefinition,
    enableAddOns: { column: 'enable_add_ons', type: 'boolean' } as ColumnDefinition,
    enableVariants: { column: 'enable_variants', type: 'boolean' } as ColumnDefinition,
    allowCustomPricing: { column: 'allow_custom_pricing', type: 'boolean' } as ColumnDefinition,
    bookingSequenceEnabled: { column: 'booking_sequence_enabled', type: 'boolean' } as ColumnDefinition,
    createdAt: { column: 'created_at', type: 'date' } as ColumnDefinition,
    updatedAt: { column: 'updated_at', type: 'date' } as ColumnDefinition,
    syncStatus: 'sync_status',
  },
};

export class CatalogSettingsSQLiteService extends BaseSQLiteService<CatalogSettings, CatalogSettingsRow> {
  constructor(adapter: SQLiteAdapter) {
    super(adapter, catalogSettingsSchema);
  }

  /**
   * Get settings for a store (creates default if not exists)
   */
  async get(storeId: string): Promise<CatalogSettings | undefined> {
    return this.findOneWhere('store_id = ?', [storeId]);
  }

  /**
   * Set settings for a store (upsert)
   */
  async set(storeId: string, settings: Partial<CatalogSettings>): Promise<CatalogSettings> {
    const existing = await this.get(storeId);
    const now = new Date().toISOString();

    if (existing) {
      await this.update(existing.id, { ...settings, updatedAt: now });
      return { ...existing, ...settings, updatedAt: now };
    } else {
      const id = crypto.randomUUID();
      const defaultSettings: CatalogSettings = {
        id,
        storeId,
        defaultDuration: 60,
        defaultExtraTime: 0,
        defaultExtraTimeType: 'processing',
        defaultTaxRate: 0,
        currency: 'USD',
        currencySymbol: '$',
        showPricesOnline: true,
        requireDepositForOnlineBooking: false,
        defaultDepositPercentage: 0,
        enablePackages: true,
        enableAddOns: true,
        enableVariants: true,
        allowCustomPricing: true,
        bookingSequenceEnabled: false,
        createdAt: now,
        updatedAt: now,
        syncStatus: 'local',
        ...settings,
      };
      await this.create(defaultSettings);
      return defaultSettings;
    }
  }

  /**
   * Get or create default settings for a store
   */
  async getOrCreate(storeId: string): Promise<CatalogSettings> {
    const existing = await this.get(storeId);
    if (existing) {
      return existing;
    }
    return this.set(storeId, {});
  }
}

// ============================================
// PRODUCT
// ============================================

export interface Product extends Record<string, unknown> {
  id: string;
  storeId: string;
  sku: string;
  barcode?: string;
  name: string;
  brand: string;
  category: string;
  description?: string;
  retailPrice: number;
  costPrice: number;
  margin: number;
  isRetail: boolean;
  isBackbar: boolean;
  minStockLevel: number;
  reorderQuantity?: number;
  supplierId?: string;
  supplierName?: string;
  imageUrl?: string;
  size?: string;
  backbarUnit?: string;
  backbarUsesPerUnit?: number;
  isActive: boolean;
  isTaxExempt?: boolean;
  commissionRate?: number;
  createdAt: string;
  updatedAt: string;
  syncStatus: CatalogSyncStatus;
}

export interface ProductRow {
  id: string;
  store_id: string;
  sku: string;
  barcode: string | null;
  name: string;
  brand: string;
  category: string;
  description: string | null;
  retail_price: number;
  cost_price: number;
  margin: number;
  is_retail: number;
  is_backbar: number;
  min_stock_level: number;
  reorder_quantity: number | null;
  supplier_id: string | null;
  supplier_name: string | null;
  image_url: string | null;
  size: string | null;
  backbar_unit: string | null;
  backbar_uses_per_unit: number | null;
  is_active: number;
  is_tax_exempt: number | null;
  commission_rate: number | null;
  created_at: string;
  updated_at: string;
  sync_status: string;
}

const productSchema: TableSchema = {
  tableName: 'products',
  primaryKey: 'id',
  columns: {
    id: 'id',
    storeId: 'store_id',
    sku: 'sku',
    barcode: 'barcode',
    name: 'name',
    brand: 'brand',
    category: 'category',
    description: 'description',
    retailPrice: 'retail_price',
    costPrice: 'cost_price',
    margin: 'margin',
    isRetail: { column: 'is_retail', type: 'boolean' } as ColumnDefinition,
    isBackbar: { column: 'is_backbar', type: 'boolean' } as ColumnDefinition,
    minStockLevel: 'min_stock_level',
    reorderQuantity: 'reorder_quantity',
    supplierId: 'supplier_id',
    supplierName: 'supplier_name',
    imageUrl: 'image_url',
    size: 'size',
    backbarUnit: 'backbar_unit',
    backbarUsesPerUnit: 'backbar_uses_per_unit',
    isActive: { column: 'is_active', type: 'boolean' } as ColumnDefinition,
    isTaxExempt: { column: 'is_tax_exempt', type: 'boolean' } as ColumnDefinition,
    commissionRate: 'commission_rate',
    createdAt: { column: 'created_at', type: 'date' } as ColumnDefinition,
    updatedAt: { column: 'updated_at', type: 'date' } as ColumnDefinition,
    syncStatus: 'sync_status',
  },
};

export class ProductSQLiteService extends BaseSQLiteService<Product, ProductRow> {
  constructor(adapter: SQLiteAdapter) {
    super(adapter, productSchema);
  }

  /**
   * Get products by category
   */
  async getByCategory(storeId: string, category: string): Promise<Product[]> {
    return this.findWhere('store_id = ? AND category = ? ORDER BY name ASC', [storeId, category]);
  }

  /**
   * Get active products
   */
  async getActive(storeId: string): Promise<Product[]> {
    return this.findWhere('store_id = ? AND is_active = 1 ORDER BY name ASC', [storeId]);
  }

  /**
   * Get all products for a store
   */
  async getByStore(storeId: string): Promise<Product[]> {
    return this.findWhere('store_id = ? ORDER BY name ASC', [storeId]);
  }

  /**
   * Search products by name/description/SKU
   */
  async search(storeId: string, query: string): Promise<Product[]> {
    const searchPattern = `%${query}%`;
    return this.findWhere(
      'store_id = ? AND (name LIKE ? OR description LIKE ? OR sku LIKE ? OR brand LIKE ?) ORDER BY name ASC',
      [storeId, searchPattern, searchPattern, searchPattern, searchPattern]
    );
  }

  /**
   * Get product by SKU
   */
  async getBySku(storeId: string, sku: string): Promise<Product | undefined> {
    return this.findOneWhere('store_id = ? AND sku = ?', [storeId, sku]);
  }

  /**
   * Get product by barcode
   */
  async getByBarcode(barcode: string): Promise<Product | undefined> {
    return this.findOneWhere('barcode = ?', [barcode]);
  }

  /**
   * Get retail products
   */
  async getRetail(storeId: string): Promise<Product[]> {
    return this.findWhere('store_id = ? AND is_retail = 1 AND is_active = 1 ORDER BY name ASC', [storeId]);
  }

  /**
   * Get backbar products
   */
  async getBackbar(storeId: string): Promise<Product[]> {
    return this.findWhere('store_id = ? AND is_backbar = 1 AND is_active = 1 ORDER BY name ASC', [storeId]);
  }

  /**
   * Get products by supplier
   */
  async getBySupplier(storeId: string, supplierId: string): Promise<Product[]> {
    return this.findWhere('store_id = ? AND supplier_id = ? ORDER BY name ASC', [storeId, supplierId]);
  }

  /**
   * Get distinct categories for a store
   */
  async getCategories(storeId: string): Promise<string[]> {
    const rows = await this.db.all<{ category: string }>(
      `SELECT DISTINCT category
       FROM ${this.schema.tableName}
       WHERE store_id = ?
       ORDER BY category ASC`,
      [storeId]
    );

    return rows.map(row => row.category);
  }

  /**
   * Count products by category
   */
  async countByCategory(storeId: string): Promise<Record<string, number>> {
    const rows = await this.db.all<{ category: string; count: number }>(
      `SELECT category, COUNT(*) as count
       FROM ${this.schema.tableName}
       WHERE store_id = ?
       GROUP BY category`,
      [storeId]
    );

    const result: Record<string, number> = {};
    for (const row of rows) {
      result[row.category] = row.count;
    }
    return result;
  }

  /**
   * Count active products
   */
  async countActive(storeId: string): Promise<number> {
    return this.countWhere('store_id = ? AND is_active = 1', [storeId]);
  }
}
