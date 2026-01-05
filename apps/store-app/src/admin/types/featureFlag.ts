/**
 * Feature Flag Types
 * Control feature availability across license tiers
 */

export type FeatureFlagCategory =
  | 'Infrastructure'
  | 'Operations'
  | 'Analytics'
  | 'Marketing'
  | 'Communication'
  | 'Integration'
  | 'Security'
  | 'Payment'
  | 'Customer Experience';

export interface FeatureFlag {
  id: string;
  name: string;
  key: string;                    // Unique key for code reference (e.g., 'multi-device-sync')
  description: string;
  category: FeatureFlagCategory;
  enabledForFree: boolean;
  enabledForBasic: boolean;
  enabledForProfessional: boolean;
  enabledForEnterprise: boolean;
  globallyEnabled: boolean;       // Master switch - if false, feature is off for everyone
  rolloutPercentage: number;      // 0-100, for gradual rollout
  metadata?: Record<string, any>; // Additional configuration
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateFeatureFlagInput {
  name: string;
  key: string;
  description: string;
  category: FeatureFlagCategory;
  enabledForFree?: boolean;
  enabledForBasic?: boolean;
  enabledForProfessional?: boolean;
  enabledForEnterprise?: boolean;
  globallyEnabled?: boolean;
  rolloutPercentage?: number;
  metadata?: Record<string, any>;
}

export interface UpdateFeatureFlagInput {
  name?: string;
  description?: string;
  category?: FeatureFlagCategory;
  enabledForFree?: boolean;
  enabledForBasic?: boolean;
  enabledForProfessional?: boolean;
  enabledForEnterprise?: boolean;
  globallyEnabled?: boolean;
  rolloutPercentage?: number;
  metadata?: Record<string, any>;
}

// Default features that should be seeded
export const DEFAULT_FEATURE_FLAGS: Omit<FeatureFlag, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'Multi-Device Sync',
    key: 'multi-device-sync',
    description: 'Real-time synchronization across multiple devices',
    category: 'Infrastructure',
    enabledForFree: false,
    enabledForBasic: false,
    enabledForProfessional: true,
    enabledForEnterprise: true,
    globallyEnabled: true,
    rolloutPercentage: 100,
  },
  {
    name: 'Inventory Management',
    key: 'inventory-management',
    description: 'Track products, low stock alerts, reordering',
    category: 'Operations',
    enabledForFree: false,
    enabledForBasic: true,
    enabledForProfessional: true,
    enabledForEnterprise: true,
    globallyEnabled: true,
    rolloutPercentage: 100,
  },
  {
    name: 'Advanced Reporting',
    key: 'advanced-reporting',
    description: 'Custom reports and data analytics',
    category: 'Analytics',
    enabledForFree: false,
    enabledForBasic: false,
    enabledForProfessional: true,
    enabledForEnterprise: true,
    globallyEnabled: true,
    rolloutPercentage: 100,
  },
  {
    name: 'Customer Loyalty',
    key: 'customer-loyalty',
    description: 'Points-based rewards program',
    category: 'Marketing',
    enabledForFree: false,
    enabledForBasic: false,
    enabledForProfessional: true,
    enabledForEnterprise: true,
    globallyEnabled: true,
    rolloutPercentage: 100,
  },
  {
    name: 'Online Booking',
    key: 'online-booking',
    description: 'Web-based appointment scheduling',
    category: 'Customer Experience',
    enabledForFree: false,
    enabledForBasic: true,
    enabledForProfessional: true,
    enabledForEnterprise: true,
    globallyEnabled: true,
    rolloutPercentage: 100,
  },
  {
    name: 'SMS Notifications',
    key: 'sms-notifications',
    description: 'Automated SMS reminders and confirmations',
    category: 'Communication',
    enabledForFree: false,
    enabledForBasic: false,
    enabledForProfessional: false,
    enabledForEnterprise: true,
    globallyEnabled: false,
    rolloutPercentage: 0,
  },
  {
    name: 'Multi-Location Management',
    key: 'multi-location',
    description: 'Manage multiple store locations',
    category: 'Infrastructure',
    enabledForFree: false,
    enabledForBasic: false,
    enabledForProfessional: false,
    enabledForEnterprise: true,
    globallyEnabled: true,
    rolloutPercentage: 100,
  },
  {
    name: 'API Access',
    key: 'api-access',
    description: 'RESTful API for third-party integrations',
    category: 'Integration',
    enabledForFree: false,
    enabledForBasic: false,
    enabledForProfessional: false,
    enabledForEnterprise: true,
    globallyEnabled: true,
    rolloutPercentage: 100,
  },
  {
    name: 'Advanced Permissions',
    key: 'advanced-permissions',
    description: 'Granular role-based access control',
    category: 'Security',
    enabledForFree: false,
    enabledForBasic: false,
    enabledForProfessional: true,
    enabledForEnterprise: true,
    globallyEnabled: true,
    rolloutPercentage: 100,
  },
  {
    name: 'Payment Gateway Integration',
    key: 'payment-gateway',
    description: 'Direct payment processor integration',
    category: 'Payment',
    enabledForFree: false,
    enabledForBasic: false,
    enabledForProfessional: true,
    enabledForEnterprise: true,
    globallyEnabled: false,
    rolloutPercentage: 0,
  },
];
