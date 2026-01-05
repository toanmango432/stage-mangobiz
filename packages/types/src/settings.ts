/**
 * Settings Module Types
 * PRD Reference: docs/product/PRD-Settings-Module.md
 * 
 * Organized into 5 categories:
 * 1. Business - Profile, Contact, Address, Locale, Hours, Tax
 * 2. Checkout & Payments - Tips, Discounts, Terminals, Gateway, Hardware
 * 3. Receipts & Notifications - Receipt customization, Alerts
 * 4. Account & Licensing - Account, Security, Subscription, License
 * 5. System - Devices, Theme, Layout, Module Visibility
 */

// =============================================================================
// ENUMS
// =============================================================================

export type BusinessType = 
  | 'salon' 
  | 'spa' 
  | 'barbershop' 
  | 'nail_salon' 
  | 'med_spa' 
  | 'other';

export type DateFormat = 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD';

export type TimeFormat = '12h' | '24h';

export type TipCalculation = 'pre_tax' | 'post_tax';

export type TipDistributionMethod = 'per_provider' | 'split_evenly' | 'custom';

export type TipDefaultSelection = 'none' | 'tip1' | 'tip2' | 'tip3';

export type ServiceChargeApplyTo = 'all' | 'services' | 'products';

export type RoundingMethod = 'nearest_005' | 'nearest_010' | 'up' | 'down';

export type GatewayProvider = 'stripe' | 'fiserv' | 'square' | 'paypal';

export type GatewayApiMode = 'live' | 'sandbox';

export type TerminalType = 'fiserv_ttp' | 'stripe_s700' | 'wisepad_3' | 'square_reader';

export type ConnectionStatus = 'connected' | 'disconnected' | 'error';

export type HardwareDeviceType = 'printer' | 'cash_drawer' | 'scanner' | 'card_reader';

export type ConnectionType = 'bluetooth' | 'usb' | 'network';

export type ThemeMode = 'light' | 'dark' | 'system';

export type DefaultView = 'book' | 'front_desk' | 'sales';

export type SidebarPosition = 'left' | 'right';

export type FontSize = 'small' | 'medium' | 'large';

export type LicenseStatus = 'active' | 'expired' | 'suspended' | 'trial';

export type LicenseTier = 'free' | 'starter' | 'professional' | 'enterprise';

export type SubscriptionPlan = 'free' | 'starter' | 'professional' | 'enterprise';

export type BillingCycle = 'monthly' | 'annual';

// =============================================================================
// 1. BUSINESS SETTINGS
// =============================================================================

export interface SocialMedia {
  facebook?: string;
  instagram?: string;
  tiktok?: string;
}

export interface BusinessAddress {
  street: string;
  suite?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface BusinessLocale {
  timezone: string;
  currency: string;
  dateFormat: DateFormat;
  timeFormat: TimeFormat;
  language: string;
}

export interface DayHours {
  isOpen: boolean;
  openTime?: string; // HH:mm format
  closeTime?: string; // HH:mm format
}

export interface OperatingHours {
  monday: DayHours;
  tuesday: DayHours;
  wednesday: DayHours;
  thursday: DayHours;
  friday: DayHours;
  saturday: DayHours;
  sunday: DayHours;
}

export interface SpecialHours {
  id: string;
  date: string; // ISO date string
  isOpen: boolean;
  openTime?: string;
  closeTime?: string;
  reason?: string;
}

export interface ClosedPeriod {
  id: string;
  startDate: string; // ISO date string
  endDate: string; // ISO date string
  reason: string;
  notifyClients: boolean;
}

export interface TaxRate {
  id: string;
  name: string;
  rate: number; // Percentage (e.g., 8.25)
  appliesTo: ('services' | 'products')[];
  isDefault?: boolean;
}

export interface TaxExemption {
  id: string;
  type: 'product' | 'service' | 'client';
  entityId: string;
  reason?: string;
}

export interface TaxSettings {
  enabled: boolean;
  rate: number; // Primary tax rate
  name: string; // e.g., "Sales Tax"
  taxId?: string; // Business tax ID
  inclusive: boolean; // Prices include tax
  additionalRates: TaxRate[];
  exemptions: TaxExemption[];
}

export interface BusinessProfile {
  name: string;
  legalName: string;
  type: BusinessType;
  logoUrl?: string;
  description?: string;
}

export interface BusinessContact {
  phone: string;
  email: string;
  website?: string;
  socialMedia?: SocialMedia;
}

export interface BusinessSettings {
  profile: BusinessProfile;
  contact: BusinessContact;
  address: BusinessAddress;
  locale: BusinessLocale;
  operatingHours: OperatingHours;
  specialHours: SpecialHours[];
  closedPeriods: ClosedPeriod[];
  tax: TaxSettings;
}

// =============================================================================
// 2. CHECKOUT & PAYMENTS SETTINGS
// =============================================================================

export interface TipSettings {
  enabled: boolean;
  calculation: TipCalculation;
  suggestions: [number, number, number]; // e.g., [18, 20, 22]
  customAllowed: boolean;
  noTipOption: boolean;
  defaultSelection: TipDefaultSelection;
}

export interface TipDistribution {
  method: TipDistributionMethod;
  poolTips: boolean;
  houseCut: number; // Percentage (0-100)
}

export interface DiscountSettings {
  enabled: boolean;
  maxPercent: number;
  requireReason: boolean;
  requireApproval: boolean;
  approvalThreshold: number; // Percentage requiring approval
}

export interface ServiceChargeSettings {
  enabled: boolean;
  percent: number;
  name: string;
  applyTo: ServiceChargeApplyTo;
}

export interface RoundingSettings {
  enabled: boolean;
  method: RoundingMethod;
}

export interface PaymentMethodsSettings {
  card: boolean;
  tapToPay: boolean;
  cash: boolean;
  giftCard: boolean;
  storeCredit: boolean;
  check: boolean;
  custom: boolean; // Venmo, Zelle, etc.
}

export interface PaymentTerminal {
  id: string;
  storeId: string;
  deviceId?: string; // Associated POS device
  type: TerminalType;
  terminalId?: string; // Hardware serial/ID
  name: string;
  connectionStatus: ConnectionStatus;
  lastActivity?: string; // ISO timestamp
  config?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentGateway {
  provider: GatewayProvider;
  apiMode: GatewayApiMode;
  merchantId?: string;
  connectionStatus: ConnectionStatus;
  lastVerified?: string;
}

export interface HardwareDevice {
  id: string;
  storeId: string;
  deviceId?: string; // Associated POS device
  type: HardwareDeviceType;
  name: string;
  model?: string;
  connectionType: ConnectionType;
  connectionStatus: ConnectionStatus;
  config?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface CheckoutSettings {
  tips: TipSettings;
  tipDistribution: TipDistribution;
  discounts: DiscountSettings;
  serviceCharge: ServiceChargeSettings;
  rounding: RoundingSettings;
  paymentMethods: PaymentMethodsSettings;
  gateway?: PaymentGateway;
}

// =============================================================================
// 3. RECEIPTS & NOTIFICATIONS SETTINGS
// =============================================================================

export interface ReceiptHeader {
  showLogo: boolean;
  text?: string;
  showAddress: boolean;
  showPhone: boolean;
}

export interface ReceiptFooter {
  text?: string;
  showSocialMedia: boolean;
  returnPolicy?: string;
  thankYouMessage: string;
}

export interface ReceiptOptions {
  autoPrint: boolean;
  emailReceipt: boolean;
  smsReceipt: boolean;
  qrCode: boolean;
}

export interface ReceiptSettings {
  header: ReceiptHeader;
  footer: ReceiptFooter;
  options: ReceiptOptions;
}

export interface NotificationChannel {
  email: boolean;
  sms: boolean;
  push: boolean;
}

export interface ClientNotifications {
  appointmentConfirmation: NotificationChannel;
  appointmentReminder: NotificationChannel;
  appointmentCancelled: NotificationChannel;
  receipt: NotificationChannel;
  marketing: NotificationChannel;
  reminderTiming: number; // Hours before appointment
}

export interface StaffNotifications {
  newAppointment: NotificationChannel;
  scheduleChange: NotificationChannel;
  timeOffApproved: NotificationChannel;
}

export interface OwnerNotifications {
  dailySummary: NotificationChannel;
  largeTransaction: NotificationChannel;
  refundProcessed: NotificationChannel;
  licenseAlert: NotificationChannel;
  largeTransactionThreshold?: number; // Amount threshold
}

export interface NotificationSettings {
  client: ClientNotifications;
  staff: StaffNotifications;
  owner: OwnerNotifications;
}

// =============================================================================
// 4. ACCOUNT & LICENSING SETTINGS
// =============================================================================

export interface AccountInfo {
  email: string;
  phone: string;
  ownerName: string;
  createdAt: string;
}

export interface SecuritySettings {
  twoFactorEnabled: boolean;
  lastPasswordChange?: string;
}

export interface SubscriptionInfo {
  plan: SubscriptionPlan;
  billingCycle: BillingCycle;
  nextBillingDate?: string;
  paymentMethodLast4?: string;
}

export interface LicenseInfo {
  key: string;
  status: LicenseStatus;
  tier: LicenseTier;
  activationDate: string;
  expirationDate?: string;
  devicesAllowed: number;
  devicesActive: number;
}

export interface AccountSettings {
  info: AccountInfo;
  security: SecuritySettings;
  subscription: SubscriptionInfo;
  license: LicenseInfo;
}

// =============================================================================
// 5. SYSTEM SETTINGS
// =============================================================================

export interface RegisteredDevice {
  id: string;
  storeId: string;
  name: string;
  type: 'ipad' | 'android_tablet' | 'desktop' | 'web';
  deviceId: string;
  lastActive?: string;
  mode: 'online-only' | 'offline-enabled';
  status: 'active' | 'inactive' | 'revoked';
  createdAt: string;
}

export interface ThemeSettings {
  mode: ThemeMode;
  brandColor: string;
  accentColor: string;
}

export interface LayoutSettings {
  defaultView: DefaultView;
  sidebarPosition: SidebarPosition;
  compactMode: boolean;
  fontSize: FontSize;
}

export interface ModuleVisibility {
  module: string;
  visible: boolean;
  order: number;
}

export interface SystemSettings {
  theme: ThemeSettings;
  layout: LayoutSettings;
  moduleVisibility: ModuleVisibility[];
}

// =============================================================================
// COMBINED STORE SETTINGS
// =============================================================================

export interface StoreSettings {
  id: string;
  storeId: string;
  
  // Categories
  business: BusinessSettings;
  checkout: CheckoutSettings;
  receipts: ReceiptSettings;
  notifications: NotificationSettings;
  account: AccountSettings;
  system: SystemSettings;
  
  // Sync metadata
  syncVersion: number;
  createdAt: string;
  updatedAt: string;
}

// =============================================================================
// DEFAULT VALUES
// =============================================================================

export const DEFAULT_OPERATING_HOURS: OperatingHours = {
  monday: { isOpen: true, openTime: '09:00', closeTime: '19:00' },
  tuesday: { isOpen: true, openTime: '09:00', closeTime: '19:00' },
  wednesday: { isOpen: true, openTime: '09:00', closeTime: '19:00' },
  thursday: { isOpen: true, openTime: '09:00', closeTime: '21:00' },
  friday: { isOpen: true, openTime: '09:00', closeTime: '21:00' },
  saturday: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
  sunday: { isOpen: false },
};

export const DEFAULT_TIP_SETTINGS: TipSettings = {
  enabled: true,
  calculation: 'pre_tax',
  suggestions: [18, 20, 22],
  customAllowed: true,
  noTipOption: true,
  defaultSelection: 'none',
};

export const DEFAULT_TIP_DISTRIBUTION: TipDistribution = {
  method: 'per_provider',
  poolTips: false,
  houseCut: 0,
};

export const DEFAULT_DISCOUNT_SETTINGS: DiscountSettings = {
  enabled: true,
  maxPercent: 50,
  requireReason: true,
  requireApproval: false,
  approvalThreshold: 20,
};

export const DEFAULT_PAYMENT_METHODS: PaymentMethodsSettings = {
  card: true,
  tapToPay: true,
  cash: true,
  giftCard: true,
  storeCredit: true,
  check: false,
  custom: false,
};

export const DEFAULT_RECEIPT_SETTINGS: ReceiptSettings = {
  header: {
    showLogo: true,
    showAddress: true,
    showPhone: true,
  },
  footer: {
    showSocialMedia: false,
    thankYouMessage: 'Thank you for visiting!',
  },
  options: {
    autoPrint: true,
    emailReceipt: true,
    smsReceipt: false,
    qrCode: false,
  },
};

export const DEFAULT_NOTIFICATION_CHANNEL: NotificationChannel = {
  email: true,
  sms: false,
  push: false,
};

export const DEFAULT_MODULE_VISIBILITY: ModuleVisibility[] = [
  { module: 'book', visible: true, order: 1 },
  { module: 'front_desk', visible: true, order: 2 },
  { module: 'sales', visible: true, order: 3 },
  { module: 'pending', visible: true, order: 4 },
  { module: 'team', visible: true, order: 5 },
  { module: 'clients', visible: true, order: 6 },
  { module: 'reports', visible: true, order: 7 },
];

export const DEFAULT_THEME_SETTINGS: ThemeSettings = {
  mode: 'system',
  brandColor: '#E6A000',
  accentColor: '#3B82F6',
};

export const DEFAULT_LAYOUT_SETTINGS: LayoutSettings = {
  defaultView: 'front_desk',
  sidebarPosition: 'left',
  compactMode: false,
  fontSize: 'medium',
};

// =============================================================================
// SETTINGS CATEGORY ENUM (for navigation)
// =============================================================================

export type SettingsCategory = 
  | 'business' 
  | 'checkout' 
  | 'receipts' 
  | 'account' 
  | 'system'
  | 'devices'
  | 'integrations';

export const SETTINGS_CATEGORIES: { id: SettingsCategory; label: string; icon: string; description: string }[] = [
  { id: 'business', label: 'Business', icon: 'Building2', description: 'Profile, hours, tax settings' },
  { id: 'checkout', label: 'Checkout & Payments', icon: 'CreditCard', description: 'Tips, discounts, payment methods' },
  { id: 'receipts', label: 'Receipts & Notifications', icon: 'Receipt', description: 'Receipt design, alerts' },
  { id: 'devices', label: 'Device Manager', icon: 'Monitor', description: 'Registered devices, hardware' },
  { id: 'integrations', label: 'Integrations', icon: 'Plug', description: 'Third-party connections' },
  { id: 'account', label: 'Account & Licensing', icon: 'User', description: 'Account, subscription, license' },
  { id: 'system', label: 'System', icon: 'Settings', description: 'Theme, layout, preferences' },
];
