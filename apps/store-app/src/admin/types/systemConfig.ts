/**
 * System Configuration Types
 * Default settings sent to new stores on first activation
 */

export interface TaxSetting {
  id: string;
  name: string;
  rate: number;        // Percentage (e.g., 8.5 for 8.5%)
  isDefault: boolean;
}

export interface ServiceCategory {
  id: string;
  name: string;
  icon: string;        // Emoji or icon name
  color: string;       // Hex color
  sortOrder: number;
}

export interface ServiceItem {
  id: string;
  name: string;
  categoryId: string;  // References ServiceCategory
  description: string;
  duration: number;    // Minutes
  price: number;       // Dollars
  commissionRate: number; // Percentage
  sortOrder: number;
}

export interface EmployeeRole {
  id: string;
  name: string;
  permissions: string[];
  color: string;       // Hex color
  sortOrder: number;
}

export interface PaymentMethod {
  id: string;
  name: string;
  type: 'cash' | 'card' | 'check' | 'gift_card' | 'other';
  isActive: boolean;
  sortOrder: number;
}

export interface SystemConfig {
  id: string;          // Single record with id='default'

  // Business defaults
  businessType: 'salon' | 'spa' | 'barbershop' | 'other';
  defaultCurrency: string;
  defaultTimezone: string;

  // Tax settings
  taxSettings: TaxSetting[];

  // Service catalog defaults
  categories: ServiceCategory[];
  items: ServiceItem[];

  // Staff defaults
  employeeRoles: EmployeeRole[];

  // Payment defaults
  paymentMethods: PaymentMethod[];

  // Metadata
  updatedAt: Date;
  updatedBy?: string;  // Admin user ID
}

export interface UpdateSystemConfigInput {
  businessType?: 'salon' | 'spa' | 'barbershop' | 'other';
  defaultCurrency?: string;
  defaultTimezone?: string;
  taxSettings?: TaxSetting[];
  categories?: ServiceCategory[];
  items?: ServiceItem[];
  employeeRoles?: EmployeeRole[];
  paymentMethods?: PaymentMethod[];
}

// Default system configuration for new installations
export const DEFAULT_SYSTEM_CONFIG: Omit<SystemConfig, 'id' | 'updatedAt'> = {
  businessType: 'salon',
  defaultCurrency: 'USD',
  defaultTimezone: 'America/Los_Angeles',

  taxSettings: [
    { id: 'tax_1', name: 'Sales Tax', rate: 8.5, isDefault: true },
  ],

  categories: [
    { id: 'cat_1', name: 'Manicure', icon: '💅', color: '#FF6B9D', sortOrder: 1 },
    { id: 'cat_2', name: 'Pedicure', icon: '🦶', color: '#4ECDC4', sortOrder: 2 },
    { id: 'cat_3', name: 'Waxing', icon: '✨', color: '#95E1D3', sortOrder: 3 },
    { id: 'cat_4', name: 'Facial', icon: '🧖', color: '#F9ED69', sortOrder: 4 },
  ],

  items: [
    { id: 'item_1', name: 'Basic Manicure', categoryId: 'cat_1', description: 'Filing, shaping, cuticle care', duration: 30, price: 20, commissionRate: 50, sortOrder: 1 },
    { id: 'item_2', name: 'Gel Manicure', categoryId: 'cat_1', description: 'Premium gel polish', duration: 45, price: 35, commissionRate: 50, sortOrder: 2 },
    { id: 'item_3', name: 'Basic Pedicure', categoryId: 'cat_2', description: 'Soak, filing, cuticle care', duration: 45, price: 30, commissionRate: 50, sortOrder: 3 },
    { id: 'item_4', name: 'Spa Pedicure', categoryId: 'cat_2', description: 'Deluxe with massage and mask', duration: 60, price: 50, commissionRate: 50, sortOrder: 4 },
  ],

  employeeRoles: [
    { id: 'role_1', name: 'Manager', permissions: ['all'], color: '#10B981', sortOrder: 1 },
    { id: 'role_2', name: 'Technician', permissions: ['create_ticket', 'checkout'], color: '#3B82F6', sortOrder: 2 },
  ],

  paymentMethods: [
    { id: 'pay_1', name: 'Cash', type: 'cash', isActive: true, sortOrder: 1 },
    { id: 'pay_2', name: 'Credit Card', type: 'card', isActive: true, sortOrder: 2 },
    { id: 'pay_3', name: 'Debit Card', type: 'card', isActive: true, sortOrder: 3 },
    { id: 'pay_4', name: 'Gift Card', type: 'gift_card', isActive: true, sortOrder: 4 },
  ],
};
