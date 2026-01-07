/**
 * System Config Repository
 * Handles CRUD operations for system configuration management
 */

import { BaseRepository, APIError } from './base.repository';
import { supabase, withCircuitBreaker } from '../client';
import {
  SystemConfig,
  TaxSetting,
  ServiceCategory,
  ServiceItem,
  EmployeeRole,
  PaymentMethod,
  UpdateSystemConfigInput,
  DEFAULT_SYSTEM_CONFIG,
} from '@/types/systemConfig';

// Database row type (snake_case)
interface SystemConfigRow {
  id: string;
  business_type: string;
  default_currency: string;
  default_timezone: string;
  tax_settings: TaxSetting[];
  categories: ServiceCategory[];
  items: ServiceItem[];
  employee_roles: EmployeeRole[];
  payment_methods: PaymentMethod[];
  updated_at: string;
  updated_by?: string;
}

// Convert DB row to app type
function toSystemConfig(row: SystemConfigRow): SystemConfig {
  return {
    id: row.id,
    businessType: row.business_type as SystemConfig['businessType'],
    defaultCurrency: row.default_currency,
    defaultTimezone: row.default_timezone,
    taxSettings: row.tax_settings || [],
    categories: row.categories || [],
    items: row.items || [],
    employeeRoles: row.employee_roles || [],
    paymentMethods: row.payment_methods || [],
    updatedAt: new Date(row.updated_at),
    updatedBy: row.updated_by,
  };
}

// Convert input to DB row
function toRow(input: UpdateSystemConfigInput): Partial<SystemConfigRow> {
  const row: Partial<SystemConfigRow> = {};
  if (input.businessType !== undefined) row.business_type = input.businessType;
  if (input.defaultCurrency !== undefined) row.default_currency = input.defaultCurrency;
  if (input.defaultTimezone !== undefined) row.default_timezone = input.defaultTimezone;
  if (input.taxSettings !== undefined) row.tax_settings = input.taxSettings;
  if (input.categories !== undefined) row.categories = input.categories;
  if (input.items !== undefined) row.items = input.items;
  if (input.employeeRoles !== undefined) row.employee_roles = input.employeeRoles;
  if (input.paymentMethods !== undefined) row.payment_methods = input.paymentMethods;
  return row;
}

class SystemConfigRepository extends BaseRepository<SystemConfigRow> {
  private readonly defaultId = 'default';

  constructor() {
    super('system_configs');
  }

  /**
   * Get the system configuration (singleton)
   */
  async get(): Promise<SystemConfig> {
    try {
      const { data, error } = await withCircuitBreaker(() =>
        supabase.from(this.tableName).select('*').eq('id', this.defaultId).single()
      );

      if (error) {
        if (error.code === 'PGRST116') {
          // No config exists, create with defaults
          return this.initializeDefault();
        }
        throw APIError.fromSupabaseError(error);
      }

      return toSystemConfig(data as SystemConfigRow);
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw APIError.fromSupabaseError(error);
    }
  }

  /**
   * Initialize with default configuration
   */
  private async initializeDefault(): Promise<SystemConfig> {
    try {
      const defaultData: Partial<SystemConfigRow> = {
        id: this.defaultId,
        business_type: DEFAULT_SYSTEM_CONFIG.businessType,
        default_currency: DEFAULT_SYSTEM_CONFIG.defaultCurrency,
        default_timezone: DEFAULT_SYSTEM_CONFIG.defaultTimezone,
        tax_settings: DEFAULT_SYSTEM_CONFIG.taxSettings,
        categories: DEFAULT_SYSTEM_CONFIG.categories,
        items: DEFAULT_SYSTEM_CONFIG.items,
        employee_roles: DEFAULT_SYSTEM_CONFIG.employeeRoles,
        payment_methods: DEFAULT_SYSTEM_CONFIG.paymentMethods,
      };

      const { data, error } = await withCircuitBreaker(() =>
        supabase.from(this.tableName).insert(defaultData).select().single()
      );

      if (error) throw APIError.fromSupabaseError(error);
      return toSystemConfig(data as SystemConfigRow);
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw APIError.fromSupabaseError(error);
    }
  }

  /**
   * Update system configuration
   */
  async updateConfig(input: UpdateSystemConfigInput, updatedBy?: string): Promise<SystemConfig> {
    try {
      const updateData = {
        ...toRow(input),
        updated_by: updatedBy,
      };

      const { data, error } = await withCircuitBreaker(() =>
        supabase
          .from(this.tableName)
          .update(updateData)
          .eq('id', this.defaultId)
          .select()
          .single()
      );

      if (error) throw APIError.fromSupabaseError(error);
      return toSystemConfig(data as SystemConfigRow);
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw APIError.fromSupabaseError(error);
    }
  }

  // ============================================================================
  // TAX SETTINGS
  // ============================================================================

  /**
   * Get all tax settings
   */
  async getTaxes(): Promise<TaxSetting[]> {
    const config = await this.get();
    return config.taxSettings;
  }

  /**
   * Add a tax setting
   */
  async addTax(tax: Omit<TaxSetting, 'id'>, updatedBy?: string): Promise<TaxSetting> {
    const config = await this.get();
    const newTax: TaxSetting = {
      ...tax,
      id: `tax_${Date.now()}`,
    };

    await this.updateConfig({
      taxSettings: [...config.taxSettings, newTax],
    }, updatedBy);

    return newTax;
  }

  /**
   * Update a tax setting
   */
  async updateTax(id: string, updates: Partial<TaxSetting>, updatedBy?: string): Promise<TaxSetting> {
    const config = await this.get();
    const index = config.taxSettings.findIndex(t => t.id === id);
    if (index === -1) throw APIError.notFound('Tax setting', id);

    const updatedTax = { ...config.taxSettings[index], ...updates };
    const taxSettings = [...config.taxSettings];
    taxSettings[index] = updatedTax;

    await this.updateConfig({ taxSettings }, updatedBy);
    return updatedTax;
  }

  /**
   * Delete a tax setting
   */
  async deleteTax(id: string, updatedBy?: string): Promise<void> {
    const config = await this.get();
    const taxSettings = config.taxSettings.filter(t => t.id !== id);
    await this.updateConfig({ taxSettings }, updatedBy);
  }

  // ============================================================================
  // SERVICE CATEGORIES
  // ============================================================================

  /**
   * Get all service categories
   */
  async getCategories(): Promise<ServiceCategory[]> {
    const config = await this.get();
    return config.categories;
  }

  /**
   * Add a service category
   */
  async addCategory(category: Omit<ServiceCategory, 'id'>, updatedBy?: string): Promise<ServiceCategory> {
    const config = await this.get();
    const newCategory: ServiceCategory = {
      ...category,
      id: `cat_${Date.now()}`,
    };

    await this.updateConfig({
      categories: [...config.categories, newCategory],
    }, updatedBy);

    return newCategory;
  }

  /**
   * Update a service category
   */
  async updateCategory(id: string, updates: Partial<ServiceCategory>, updatedBy?: string): Promise<ServiceCategory> {
    const config = await this.get();
    const index = config.categories.findIndex(c => c.id === id);
    if (index === -1) throw APIError.notFound('Service category', id);

    const updatedCategory = { ...config.categories[index], ...updates };
    const categories = [...config.categories];
    categories[index] = updatedCategory;

    await this.updateConfig({ categories }, updatedBy);
    return updatedCategory;
  }

  /**
   * Delete a service category
   */
  async deleteCategory(id: string, updatedBy?: string): Promise<void> {
    const config = await this.get();
    const categories = config.categories.filter(c => c.id !== id);
    // Also remove items in this category
    const items = config.items.filter(i => i.categoryId !== id);
    await this.updateConfig({ categories, items }, updatedBy);
  }

  // ============================================================================
  // SERVICE ITEMS
  // ============================================================================

  /**
   * Get all service items
   */
  async getItems(): Promise<ServiceItem[]> {
    const config = await this.get();
    return config.items;
  }

  /**
   * Add a service item
   */
  async addItem(item: Omit<ServiceItem, 'id'>, updatedBy?: string): Promise<ServiceItem> {
    const config = await this.get();
    const newItem: ServiceItem = {
      ...item,
      id: `item_${Date.now()}`,
    };

    await this.updateConfig({
      items: [...config.items, newItem],
    }, updatedBy);

    return newItem;
  }

  /**
   * Update a service item
   */
  async updateItem(id: string, updates: Partial<ServiceItem>, updatedBy?: string): Promise<ServiceItem> {
    const config = await this.get();
    const index = config.items.findIndex(i => i.id === id);
    if (index === -1) throw APIError.notFound('Service item', id);

    const updatedItem = { ...config.items[index], ...updates };
    const items = [...config.items];
    items[index] = updatedItem;

    await this.updateConfig({ items }, updatedBy);
    return updatedItem;
  }

  /**
   * Delete a service item
   */
  async deleteItem(id: string, updatedBy?: string): Promise<void> {
    const config = await this.get();
    const items = config.items.filter(i => i.id !== id);
    await this.updateConfig({ items }, updatedBy);
  }

  // ============================================================================
  // EMPLOYEE ROLES
  // ============================================================================

  /**
   * Get all employee roles
   */
  async getRoles(): Promise<EmployeeRole[]> {
    const config = await this.get();
    return config.employeeRoles;
  }

  /**
   * Add an employee role
   */
  async addRole(role: Omit<EmployeeRole, 'id'>, updatedBy?: string): Promise<EmployeeRole> {
    const config = await this.get();
    const newRole: EmployeeRole = {
      ...role,
      id: `role_${Date.now()}`,
    };

    await this.updateConfig({
      employeeRoles: [...config.employeeRoles, newRole],
    }, updatedBy);

    return newRole;
  }

  /**
   * Update an employee role
   */
  async updateRole(id: string, updates: Partial<EmployeeRole>, updatedBy?: string): Promise<EmployeeRole> {
    const config = await this.get();
    const index = config.employeeRoles.findIndex(r => r.id === id);
    if (index === -1) throw APIError.notFound('Employee role', id);

    const updatedRole = { ...config.employeeRoles[index], ...updates };
    const employeeRoles = [...config.employeeRoles];
    employeeRoles[index] = updatedRole;

    await this.updateConfig({ employeeRoles }, updatedBy);
    return updatedRole;
  }

  /**
   * Delete an employee role
   */
  async deleteRole(id: string, updatedBy?: string): Promise<void> {
    const config = await this.get();
    const employeeRoles = config.employeeRoles.filter(r => r.id !== id);
    await this.updateConfig({ employeeRoles }, updatedBy);
  }

  // ============================================================================
  // PAYMENT METHODS
  // ============================================================================

  /**
   * Get all payment methods
   */
  async getPaymentMethods(): Promise<PaymentMethod[]> {
    const config = await this.get();
    return config.paymentMethods;
  }

  /**
   * Add a payment method
   */
  async addPaymentMethod(method: Omit<PaymentMethod, 'id'>, updatedBy?: string): Promise<PaymentMethod> {
    const config = await this.get();
    const newMethod: PaymentMethod = {
      ...method,
      id: `pay_${Date.now()}`,
    };

    await this.updateConfig({
      paymentMethods: [...config.paymentMethods, newMethod],
    }, updatedBy);

    return newMethod;
  }

  /**
   * Update a payment method
   */
  async updatePaymentMethod(id: string, updates: Partial<PaymentMethod>, updatedBy?: string): Promise<PaymentMethod> {
    const config = await this.get();
    const index = config.paymentMethods.findIndex(p => p.id === id);
    if (index === -1) throw APIError.notFound('Payment method', id);

    const updatedMethod = { ...config.paymentMethods[index], ...updates };
    const paymentMethods = [...config.paymentMethods];
    paymentMethods[index] = updatedMethod;

    await this.updateConfig({ paymentMethods }, updatedBy);
    return updatedMethod;
  }

  /**
   * Delete a payment method
   */
  async deletePaymentMethod(id: string, updatedBy?: string): Promise<void> {
    const config = await this.get();
    const paymentMethods = config.paymentMethods.filter(p => p.id !== id);
    await this.updateConfig({ paymentMethods }, updatedBy);
  }

  /**
   * Reset to defaults
   */
  async resetToDefaults(updatedBy?: string): Promise<SystemConfig> {
    return this.updateConfig({
      businessType: DEFAULT_SYSTEM_CONFIG.businessType,
      defaultCurrency: DEFAULT_SYSTEM_CONFIG.defaultCurrency,
      defaultTimezone: DEFAULT_SYSTEM_CONFIG.defaultTimezone,
      taxSettings: DEFAULT_SYSTEM_CONFIG.taxSettings,
      categories: DEFAULT_SYSTEM_CONFIG.categories,
      items: DEFAULT_SYSTEM_CONFIG.items,
      employeeRoles: DEFAULT_SYSTEM_CONFIG.employeeRoles,
      paymentMethods: DEFAULT_SYSTEM_CONFIG.paymentMethods,
    }, updatedBy);
  }
}

export const systemConfigRepository = new SystemConfigRepository();
export { SystemConfigRepository };
