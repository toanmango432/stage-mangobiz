import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/schema';
import { settingsDB } from '../db/database';
import { secureStorage } from './secureStorage';
import type { Service, Staff } from '../types';

/**
 * Populates database with defaults from license validation response
 * Only runs once on first activation
 */

export interface DefaultsData {
  taxSettings?: Array<{
    name: string;
    rate: number;
    isDefault?: boolean;
  }>;
  categories?: Array<{
    name: string;
    icon?: string;
    color?: string;
  }>;
  items?: Array<{
    name: string;
    category: string;
    description?: string;
    duration: number;
    price: number;
    commissionRate?: number;
  }>;
  employeeRoles?: Array<{
    name: string;
    permissions: string[];
    color?: string;
  }>;
  paymentMethods?: Array<{
    name: string;
    type: 'cash' | 'card' | 'other';
    isActive?: boolean;
  }>;
}

class DefaultsPopulator {
  /**
   * Apply defaults from control center (first-time setup only)
   */
  async applyDefaults(salonId: string): Promise<void> {
    // Check if defaults have already been applied
    const alreadyApplied = await secureStorage.hasAppliedDefaults();
    if (alreadyApplied) {
      console.log('ℹ️ Defaults already applied - skipping');
      return;
    }

    // Get defaults from storage (set by license validation)
    const defaults = await secureStorage.getDefaults();
    if (!defaults) {
      console.log('ℹ️ No defaults to apply');
      return;
    }

    console.log('🌱 Applying defaults from control center...');

    try {
      // Apply tax settings
      if (defaults.taxSettings && defaults.taxSettings.length > 0) {
        await this.applyTaxSettings(defaults.taxSettings);
      }

      // Apply categories (stored as settings or metadata)
      if (defaults.categories && defaults.categories.length > 0) {
        await this.applyCategories(defaults.categories);
      }

      // Apply items/services
      if (defaults.items && defaults.items.length > 0) {
        await this.applyItems(salonId, defaults.items);
      }

      // Apply employee roles
      if (defaults.employeeRoles && defaults.employeeRoles.length > 0) {
        await this.applyEmployeeRoles(defaults.employeeRoles);
      }

      // Apply payment methods
      if (defaults.paymentMethods && defaults.paymentMethods.length > 0) {
        await this.applyPaymentMethods(defaults.paymentMethods);
      }

      // Mark defaults as applied
      await secureStorage.setDefaultsApplied();

      console.log('✅ Defaults applied successfully');
    } catch (error) {
      console.error('❌ Error applying defaults:', error);
      throw error;
    }
  }

  /**
   * Apply tax settings
   */
  private async applyTaxSettings(taxSettings: DefaultsData['taxSettings']): Promise<void> {
    if (!taxSettings) return;

    console.log(`📋 Applying ${taxSettings.length} tax settings...`);

    // Store tax settings
    await settingsDB.set('tax_settings', taxSettings);

    // Set default tax if specified
    const defaultTax = taxSettings.find((t) => t.isDefault);
    if (defaultTax) {
      await settingsDB.set('default_tax_rate', defaultTax.rate);
    }

    console.log('✅ Tax settings applied');
  }

  /**
   * Apply categories
   */
  private async applyCategories(categories: DefaultsData['categories']): Promise<void> {
    if (!categories) return;

    console.log(`📋 Applying ${categories.length} categories...`);

    // Store categories as settings
    await settingsDB.set('service_categories', categories);

    console.log('✅ Categories applied');
  }

  /**
   * Apply items/services to database
   */
  private async applyItems(salonId: string, items: DefaultsData['items']): Promise<void> {
    if (!items) return;

    console.log(`📋 Applying ${items.length} services/items...`);

    // Check if services already exist
    const existingCount = await db.services.count();
    if (existingCount > 0) {
      console.log('⚠️ Services already exist - skipping items');
      return;
    }

    // Convert items to Service objects
    const services: Service[] = items.map((item) => ({
      id: uuidv4(),
      salonId,
      name: item.name,
      category: item.category,
      description: item.description || '',
      duration: item.duration,
      price: item.price,
      commissionRate: item.commissionRate || 50,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      syncStatus: 'synced' as const,
    }));

    // Add to database
    await db.services.bulkAdd(services);

    console.log('✅ Services applied');
  }

  /**
   * Apply employee roles
   */
  private async applyEmployeeRoles(roles: DefaultsData['employeeRoles']): Promise<void> {
    if (!roles) return;

    console.log(`📋 Applying ${roles.length} employee roles...`);

    // Store employee roles as settings
    await settingsDB.set('employee_roles', roles);

    console.log('✅ Employee roles applied');
  }

  /**
   * Apply payment methods
   */
  private async applyPaymentMethods(methods: DefaultsData['paymentMethods']): Promise<void> {
    if (!methods) return;

    console.log(`📋 Applying ${methods.length} payment methods...`);

    // Store payment methods as settings
    await settingsDB.set('payment_methods', methods);

    console.log('✅ Payment methods applied');
  }

  /**
   * Clear all defaults (for testing)
   */
  async clearDefaults(): Promise<void> {
    await settingsDB.remove('tax_settings');
    await settingsDB.remove('default_tax_rate');
    await settingsDB.remove('service_categories');
    await settingsDB.remove('employee_roles');
    await settingsDB.remove('payment_methods');
    await secureStorage.clearAll();
    console.log('🗑️ Defaults cleared');
  }
}

export const defaultsPopulator = new DefaultsPopulator();
