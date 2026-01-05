/**
 * Settings Registry
 *
 * Comprehensive registry of all searchable settings in Mango POS.
 * Each setting entry includes:
 * - Unique ID
 * - Category for grouping
 * - Display label
 * - Keywords for search matching
 * - Navigation path for opening the setting
 */

// ============================================================================
// Types
// ============================================================================

export type SettingCategory =
  | 'business'
  | 'checkout'
  | 'receipts'
  | 'account'
  | 'system'
  | 'notifications'
  | 'integrations';

export interface SettingEntry {
  /** Unique setting identifier */
  id: string;
  /** Category for grouping */
  category: SettingCategory;
  /** Display label shown in search results */
  label: string;
  /** Additional search terms/keywords */
  keywords: string[];
  /** Navigation path to this setting */
  path: string;
  /** Optional description for subtitle */
  description?: string;
  /** Icon name (Lucide) */
  icon?: string;
}

// ============================================================================
// Category Configuration
// ============================================================================

export const SETTING_CATEGORY_CONFIG: Record<SettingCategory, {
  label: string;
  icon: string;
  color: string;
}> = {
  business: {
    label: 'Business',
    icon: 'Building2',
    color: 'text-blue-600',
  },
  checkout: {
    label: 'Checkout',
    icon: 'CreditCard',
    color: 'text-green-600',
  },
  receipts: {
    label: 'Receipts',
    icon: 'Receipt',
    color: 'text-purple-600',
  },
  account: {
    label: 'Account',
    icon: 'User',
    color: 'text-orange-600',
  },
  system: {
    label: 'System',
    icon: 'Settings',
    color: 'text-slate-600',
  },
  notifications: {
    label: 'Notifications',
    icon: 'Bell',
    color: 'text-pink-600',
  },
  integrations: {
    label: 'Integrations',
    icon: 'Plug',
    color: 'text-cyan-600',
  },
};

// ============================================================================
// Settings Registry (~60 entries)
// ============================================================================

export const SETTINGS_REGISTRY: SettingEntry[] = [
  // -------------------------------------------------------------------------
  // Business Settings (15 entries)
  // -------------------------------------------------------------------------
  {
    id: 'business-store-name',
    category: 'business',
    label: 'Store Name',
    keywords: ['salon', 'spa', 'business name', 'shop'],
    path: '/settings/business/store-info',
    description: 'Your business display name',
    icon: 'Store',
  },
  {
    id: 'business-address',
    category: 'business',
    label: 'Store Address',
    keywords: ['location', 'street', 'city', 'zip', 'postal'],
    path: '/settings/business/store-info',
    description: 'Physical business location',
    icon: 'MapPin',
  },
  {
    id: 'business-phone',
    category: 'business',
    label: 'Business Phone',
    keywords: ['telephone', 'contact', 'number'],
    path: '/settings/business/store-info',
    description: 'Main business phone number',
    icon: 'Phone',
  },
  {
    id: 'business-email',
    category: 'business',
    label: 'Business Email',
    keywords: ['contact', 'mail'],
    path: '/settings/business/store-info',
    description: 'Business contact email',
    icon: 'Mail',
  },
  {
    id: 'business-hours',
    category: 'business',
    label: 'Business Hours',
    keywords: ['schedule', 'open', 'close', 'operating'],
    path: '/settings/business/hours',
    description: 'Store operating hours',
    icon: 'Clock',
  },
  {
    id: 'business-timezone',
    category: 'business',
    label: 'Timezone',
    keywords: ['time zone', 'region', 'utc'],
    path: '/settings/business/store-info',
    description: 'Business timezone setting',
    icon: 'Globe',
  },
  {
    id: 'business-tax-rate',
    category: 'business',
    label: 'Tax Rate',
    keywords: ['sales tax', 'vat', 'gst', 'percentage'],
    path: '/settings/business/tax',
    description: 'Default sales tax rate',
    icon: 'Percent',
  },
  {
    id: 'business-tax-settings',
    category: 'business',
    label: 'Tax Configuration',
    keywords: ['tax exempt', 'tax rules', 'tax calculation'],
    path: '/settings/business/tax',
    description: 'Tax calculation settings',
    icon: 'Calculator',
  },
  {
    id: 'business-currency',
    category: 'business',
    label: 'Currency',
    keywords: ['money', 'dollar', 'usd'],
    path: '/settings/business/store-info',
    description: 'Business currency format',
    icon: 'DollarSign',
  },
  {
    id: 'business-logo',
    category: 'business',
    label: 'Business Logo',
    keywords: ['image', 'branding', 'brand'],
    path: '/settings/business/branding',
    description: 'Upload or change business logo',
    icon: 'Image',
  },
  {
    id: 'business-website',
    category: 'business',
    label: 'Website URL',
    keywords: ['web', 'site', 'url', 'link'],
    path: '/settings/business/store-info',
    description: 'Business website address',
    icon: 'Globe',
  },
  {
    id: 'business-booking-url',
    category: 'business',
    label: 'Online Booking Link',
    keywords: ['booking page', 'schedule online', 'appointments'],
    path: '/settings/business/booking',
    description: 'Customer-facing booking URL',
    icon: 'Link',
  },
  {
    id: 'business-services',
    category: 'business',
    label: 'Service Menu',
    keywords: ['services', 'menu', 'catalog', 'pricing'],
    path: '/settings/business/services',
    description: 'Manage services and pricing',
    icon: 'Scissors',
  },
  {
    id: 'business-categories',
    category: 'business',
    label: 'Service Categories',
    keywords: ['groups', 'organize', 'menu categories'],
    path: '/settings/business/categories',
    description: 'Organize services by category',
    icon: 'Folder',
  },
  {
    id: 'business-staff-services',
    category: 'business',
    label: 'Staff Service Assignments',
    keywords: ['who can do', 'service providers'],
    path: '/settings/business/staff-services',
    description: 'Assign services to staff members',
    icon: 'Users',
  },

  // -------------------------------------------------------------------------
  // Checkout Settings (12 entries)
  // -------------------------------------------------------------------------
  {
    id: 'checkout-tips',
    category: 'checkout',
    label: 'Tip Settings',
    keywords: ['gratuity', 'tip percentages', 'tipping'],
    path: '/settings/checkout/tips',
    description: 'Configure tip options',
    icon: 'Heart',
  },
  {
    id: 'checkout-tip-percentages',
    category: 'checkout',
    label: 'Tip Percentages',
    keywords: ['15%', '18%', '20%', '25%', 'custom tip'],
    path: '/settings/checkout/tips',
    description: 'Quick tip percentage buttons',
    icon: 'Percent',
  },
  {
    id: 'checkout-discounts',
    category: 'checkout',
    label: 'Discount Settings',
    keywords: ['promotion', 'sale', 'coupon', 'promo'],
    path: '/settings/checkout/discounts',
    description: 'Configure discount options',
    icon: 'Tag',
  },
  {
    id: 'checkout-payment-methods',
    category: 'checkout',
    label: 'Payment Methods',
    keywords: ['cash', 'card', 'credit', 'debit', 'apple pay', 'google pay'],
    path: '/settings/checkout/payments',
    description: 'Enabled payment types',
    icon: 'CreditCard',
  },
  {
    id: 'checkout-card-terminal',
    category: 'checkout',
    label: 'Card Terminal',
    keywords: ['card reader', 'pos terminal', 'payment terminal'],
    path: '/settings/checkout/terminal',
    description: 'Configure card reader',
    icon: 'Smartphone',
  },
  {
    id: 'checkout-tap-to-pay',
    category: 'checkout',
    label: 'Tap to Pay',
    keywords: ['nfc', 'contactless', 'apple tap', 'mobile payment'],
    path: '/settings/checkout/tap-to-pay',
    description: 'Tap to Pay on iPhone/Android',
    icon: 'Nfc',
  },
  {
    id: 'checkout-cash-drawer',
    category: 'checkout',
    label: 'Cash Drawer',
    keywords: ['cash register', 'drawer', 'till'],
    path: '/settings/checkout/cash-drawer',
    description: 'Cash drawer settings',
    icon: 'Inbox',
  },
  {
    id: 'checkout-gift-cards',
    category: 'checkout',
    label: 'Gift Card Settings',
    keywords: ['gift certificate', 'store credit'],
    path: '/settings/checkout/gift-cards',
    description: 'Gift card configuration',
    icon: 'Gift',
  },
  {
    id: 'checkout-loyalty',
    category: 'checkout',
    label: 'Loyalty Program',
    keywords: ['points', 'rewards', 'loyalty', 'membership'],
    path: '/settings/checkout/loyalty',
    description: 'Customer loyalty settings',
    icon: 'Award',
  },
  {
    id: 'checkout-signature',
    category: 'checkout',
    label: 'Signature Capture',
    keywords: ['sign', 'signature pad', 'customer signature'],
    path: '/settings/checkout/signature',
    description: 'Signature collection settings',
    icon: 'PenTool',
  },
  {
    id: 'checkout-refund-policy',
    category: 'checkout',
    label: 'Refund Policy',
    keywords: ['returns', 'refund', 'void', 'cancellation'],
    path: '/settings/checkout/refunds',
    description: 'Refund and void policies',
    icon: 'RefreshCcw',
  },
  {
    id: 'checkout-rounding',
    category: 'checkout',
    label: 'Cash Rounding',
    keywords: ['round up', 'round down', 'pennies'],
    path: '/settings/checkout/rounding',
    description: 'Cash rounding rules',
    icon: 'Circle',
  },

  // -------------------------------------------------------------------------
  // Receipt Settings (8 entries)
  // -------------------------------------------------------------------------
  {
    id: 'receipts-header',
    category: 'receipts',
    label: 'Receipt Header',
    keywords: ['header text', 'top message', 'receipt message'],
    path: '/settings/receipts/header',
    description: 'Custom header on receipts',
    icon: 'Type',
  },
  {
    id: 'receipts-footer',
    category: 'receipts',
    label: 'Receipt Footer',
    keywords: ['footer text', 'bottom message', 'thank you'],
    path: '/settings/receipts/footer',
    description: 'Custom footer on receipts',
    icon: 'Type',
  },
  {
    id: 'receipts-logo',
    category: 'receipts',
    label: 'Receipt Logo',
    keywords: ['print logo', 'receipt image'],
    path: '/settings/receipts/branding',
    description: 'Logo on printed receipts',
    icon: 'Image',
  },
  {
    id: 'receipts-paper-size',
    category: 'receipts',
    label: 'Paper Size',
    keywords: ['80mm', '58mm', 'thermal', 'printer width'],
    path: '/settings/receipts/printer',
    description: 'Receipt paper width',
    icon: 'Ruler',
  },
  {
    id: 'receipts-printer',
    category: 'receipts',
    label: 'Receipt Printer',
    keywords: ['thermal printer', 'print setup', 'epson', 'star'],
    path: '/settings/receipts/printer',
    description: 'Printer configuration',
    icon: 'Printer',
  },
  {
    id: 'receipts-auto-print',
    category: 'receipts',
    label: 'Auto Print',
    keywords: ['automatic print', 'print on checkout'],
    path: '/settings/receipts/options',
    description: 'Print receipts automatically',
    icon: 'Zap',
  },
  {
    id: 'receipts-email',
    category: 'receipts',
    label: 'Email Receipts',
    keywords: ['digital receipt', 'paperless', 'email receipt'],
    path: '/settings/receipts/email',
    description: 'Email receipt settings',
    icon: 'Mail',
  },
  {
    id: 'receipts-sms',
    category: 'receipts',
    label: 'SMS Receipts',
    keywords: ['text receipt', 'sms receipt'],
    path: '/settings/receipts/sms',
    description: 'Text message receipts',
    icon: 'MessageSquare',
  },

  // -------------------------------------------------------------------------
  // Account Settings (8 entries)
  // -------------------------------------------------------------------------
  {
    id: 'account-profile',
    category: 'account',
    label: 'My Profile',
    keywords: ['user profile', 'my account', 'personal'],
    path: '/settings/account/profile',
    description: 'Your account information',
    icon: 'User',
  },
  {
    id: 'account-password',
    category: 'account',
    label: 'Change Password',
    keywords: ['password', 'security', 'credentials'],
    path: '/settings/account/security',
    description: 'Update your password',
    icon: 'Lock',
  },
  {
    id: 'account-pin',
    category: 'account',
    label: 'Staff PIN',
    keywords: ['pin code', 'login pin', 'quick login'],
    path: '/settings/account/pin',
    description: 'Set your staff PIN',
    icon: 'KeyRound',
  },
  {
    id: 'account-subscription',
    category: 'account',
    label: 'Subscription',
    keywords: ['plan', 'billing', 'membership', 'upgrade'],
    path: '/settings/account/subscription',
    description: 'Manage your subscription',
    icon: 'CreditCard',
  },
  {
    id: 'account-license',
    category: 'account',
    label: 'License Key',
    keywords: ['activation', 'license', 'product key'],
    path: '/settings/account/license',
    description: 'View or enter license',
    icon: 'Key',
  },
  {
    id: 'account-team',
    category: 'account',
    label: 'Team Members',
    keywords: ['staff', 'employees', 'users', 'team'],
    path: '/settings/account/team',
    description: 'Manage team access',
    icon: 'Users',
  },
  {
    id: 'account-permissions',
    category: 'account',
    label: 'Permissions',
    keywords: ['roles', 'access', 'admin', 'manager'],
    path: '/settings/account/permissions',
    description: 'Staff permission levels',
    icon: 'Shield',
  },
  {
    id: 'account-2fa',
    category: 'account',
    label: 'Two-Factor Auth',
    keywords: ['2fa', 'mfa', 'authenticator', 'security'],
    path: '/settings/account/security',
    description: 'Enable 2FA security',
    icon: 'Smartphone',
  },

  // -------------------------------------------------------------------------
  // System Settings (12 entries)
  // -------------------------------------------------------------------------
  {
    id: 'system-theme',
    category: 'system',
    label: 'Theme',
    keywords: ['dark mode', 'light mode', 'appearance', 'color scheme'],
    path: '/settings/system/appearance',
    description: 'App theme preference',
    icon: 'Palette',
  },
  {
    id: 'system-language',
    category: 'system',
    label: 'Language',
    keywords: ['locale', 'english', 'spanish', 'vietnamese'],
    path: '/settings/system/language',
    description: 'App language setting',
    icon: 'Languages',
  },
  {
    id: 'system-date-format',
    category: 'system',
    label: 'Date Format',
    keywords: ['mm/dd', 'dd/mm', 'date display'],
    path: '/settings/system/regional',
    description: 'Date display format',
    icon: 'Calendar',
  },
  {
    id: 'system-time-format',
    category: 'system',
    label: 'Time Format',
    keywords: ['12 hour', '24 hour', 'am pm'],
    path: '/settings/system/regional',
    description: '12h or 24h time format',
    icon: 'Clock',
  },
  {
    id: 'system-layout',
    category: 'system',
    label: 'Front Desk Layout',
    keywords: ['grid', 'list', 'view mode', 'display'],
    path: '/settings/system/layout',
    description: 'Front desk display mode',
    icon: 'LayoutGrid',
  },
  {
    id: 'system-modules',
    category: 'system',
    label: 'Module Visibility',
    keywords: ['modules', 'features', 'show hide', 'navigation'],
    path: '/settings/system/modules',
    description: 'Show/hide app modules',
    icon: 'Eye',
  },
  {
    id: 'system-turn-tracker',
    category: 'system',
    label: 'Turn Tracker',
    keywords: ['rotation', 'turn', 'next up', 'queue'],
    path: '/settings/system/turn-tracker',
    description: 'Staff turn rotation settings',
    icon: 'RotateCcw',
  },
  {
    id: 'system-auto-assign',
    category: 'system',
    label: 'Auto-Assign Staff',
    keywords: ['smart assign', 'automatic', 'assignment'],
    path: '/settings/system/auto-assign',
    description: 'Automatic staff assignment',
    icon: 'Wand2',
  },
  {
    id: 'system-offline-mode',
    category: 'system',
    label: 'Offline Mode',
    keywords: ['offline', 'sync', 'local storage'],
    path: '/settings/system/offline',
    description: 'Offline mode settings',
    icon: 'WifiOff',
  },
  {
    id: 'system-data-sync',
    category: 'system',
    label: 'Data Sync',
    keywords: ['sync', 'cloud', 'backup', 'synchronize'],
    path: '/settings/system/sync',
    description: 'Cloud sync settings',
    icon: 'Cloud',
  },
  {
    id: 'system-backup',
    category: 'system',
    label: 'Backup & Restore',
    keywords: ['backup', 'restore', 'export', 'import'],
    path: '/settings/system/backup',
    description: 'Data backup options',
    icon: 'HardDrive',
  },
  {
    id: 'system-device',
    category: 'system',
    label: 'Device Settings',
    keywords: ['device', 'ipad', 'tablet', 'register'],
    path: '/settings/system/device',
    description: 'This device configuration',
    icon: 'Tablet',
  },

  // -------------------------------------------------------------------------
  // Notification Settings (5 entries)
  // -------------------------------------------------------------------------
  {
    id: 'notifications-appointment',
    category: 'notifications',
    label: 'Appointment Reminders',
    keywords: ['reminder', 'notification', 'alert', 'appointment alert'],
    path: '/settings/notifications/appointments',
    description: 'Client appointment reminders',
    icon: 'Bell',
  },
  {
    id: 'notifications-sms',
    category: 'notifications',
    label: 'SMS Notifications',
    keywords: ['text message', 'sms alert', 'text notification'],
    path: '/settings/notifications/sms',
    description: 'Text message alerts',
    icon: 'MessageSquare',
  },
  {
    id: 'notifications-email',
    category: 'notifications',
    label: 'Email Notifications',
    keywords: ['email alert', 'email notification'],
    path: '/settings/notifications/email',
    description: 'Email alert settings',
    icon: 'Mail',
  },
  {
    id: 'notifications-push',
    category: 'notifications',
    label: 'Push Notifications',
    keywords: ['push', 'mobile notification', 'app notification'],
    path: '/settings/notifications/push',
    description: 'Mobile push alerts',
    icon: 'Smartphone',
  },
  {
    id: 'notifications-sounds',
    category: 'notifications',
    label: 'Sound Alerts',
    keywords: ['sound', 'audio', 'beep', 'notification sound'],
    path: '/settings/notifications/sounds',
    description: 'App sound settings',
    icon: 'Volume2',
  },

  // -------------------------------------------------------------------------
  // Integration Settings (5 entries)
  // -------------------------------------------------------------------------
  {
    id: 'integrations-calendar',
    category: 'integrations',
    label: 'Calendar Sync',
    keywords: ['google calendar', 'apple calendar', 'ical', 'outlook'],
    path: '/settings/integrations/calendar',
    description: 'External calendar sync',
    icon: 'Calendar',
  },
  {
    id: 'integrations-quickbooks',
    category: 'integrations',
    label: 'QuickBooks',
    keywords: ['accounting', 'quickbooks', 'qbo', 'bookkeeping'],
    path: '/settings/integrations/quickbooks',
    description: 'QuickBooks integration',
    icon: 'Calculator',
  },
  {
    id: 'integrations-mailchimp',
    category: 'integrations',
    label: 'Mailchimp',
    keywords: ['email marketing', 'mailchimp', 'newsletter'],
    path: '/settings/integrations/mailchimp',
    description: 'Email marketing sync',
    icon: 'Mail',
  },
  {
    id: 'integrations-google',
    category: 'integrations',
    label: 'Google Business',
    keywords: ['google my business', 'google reviews', 'google maps'],
    path: '/settings/integrations/google',
    description: 'Google Business Profile',
    icon: 'MapPin',
  },
  {
    id: 'integrations-api',
    category: 'integrations',
    label: 'API Access',
    keywords: ['api key', 'developer', 'webhooks', 'integration'],
    path: '/settings/integrations/api',
    description: 'API keys and webhooks',
    icon: 'Code',
  },
];

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get all settings for a category
 */
export function getSettingsByCategory(category: SettingCategory): SettingEntry[] {
  return SETTINGS_REGISTRY.filter((s) => s.category === category);
}

/**
 * Get a setting by ID
 */
export function getSettingById(id: string): SettingEntry | undefined {
  return SETTINGS_REGISTRY.find((s) => s.id === id);
}

/**
 * Search settings by query (simple text match)
 */
export function searchSettings(query: string): SettingEntry[] {
  const normalized = query.toLowerCase().trim();
  if (!normalized) return [];

  return SETTINGS_REGISTRY.filter((setting) => {
    // Check label
    if (setting.label.toLowerCase().includes(normalized)) return true;
    // Check keywords
    if (setting.keywords.some((k) => k.toLowerCase().includes(normalized))) return true;
    // Check category
    if (setting.category.toLowerCase().includes(normalized)) return true;
    // Check description
    if (setting.description?.toLowerCase().includes(normalized)) return true;
    return false;
  });
}

/**
 * Get all unique categories with their settings count
 */
export function getCategorySummary(): Array<{
  category: SettingCategory;
  label: string;
  count: number;
}> {
  const categories = Object.keys(SETTING_CATEGORY_CONFIG) as SettingCategory[];
  return categories.map((category) => ({
    category,
    label: SETTING_CATEGORY_CONFIG[category].label,
    count: SETTINGS_REGISTRY.filter((s) => s.category === category).length,
  }));
}
