/**
 * License Types
 * A license grants access to the POS system with specific tier and limits
 */

export type LicenseTier = 'free' | 'basic' | 'professional' | 'enterprise';
export type LicenseStatus = 'active' | 'expired' | 'revoked' | 'suspended';

export interface License {
  id: string;
  tenantId: string;
  licenseKey: string;           // Format: XXXX-XXXX-XXXX-XXXX
  tier: LicenseTier;
  status: LicenseStatus;
  maxStores: number;            // How many stores can use this license
  maxDevicesPerStore: number;   // How many devices per store
  features: string[];           // Enabled feature flags
  expiresAt?: Date;             // null = never expires
  activatedAt?: Date;           // When first activated by a store
  lastValidatedAt?: Date;       // Last validation check
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateLicenseInput {
  tenantId: string;
  tier: LicenseTier;
  maxStores?: number;
  maxDevicesPerStore?: number;
  features?: string[];
  expiresAt?: Date;
  notes?: string;
}

export interface UpdateLicenseInput {
  tier?: LicenseTier;
  status?: LicenseStatus;
  maxStores?: number;
  maxDevicesPerStore?: number;
  features?: string[];
  expiresAt?: Date;
  notes?: string;
}

// License tier configurations
export const LICENSE_TIER_CONFIG: Record<LicenseTier, {
  maxStores: number;
  maxDevicesPerStore: number;
  features: string[];
  price: number;
}> = {
  free: {
    maxStores: 1,
    maxDevicesPerStore: 1,
    features: ['basic_pos', 'appointments', 'clients'],
    price: 0,
  },
  basic: {
    maxStores: 1,
    maxDevicesPerStore: 2,
    features: ['basic_pos', 'appointments', 'clients', 'reports_basic', 'staff_management'],
    price: 29,
  },
  professional: {
    maxStores: 3,
    maxDevicesPerStore: 5,
    features: ['basic_pos', 'appointments', 'clients', 'reports_advanced', 'staff_management', 'inventory', 'marketing'],
    price: 79,
  },
  enterprise: {
    maxStores: 999,
    maxDevicesPerStore: 999,
    features: ['basic_pos', 'appointments', 'clients', 'reports_advanced', 'staff_management', 'inventory', 'marketing', 'api_access', 'white_label', 'priority_support'],
    price: 199,
  },
};
