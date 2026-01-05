/**
 * Settings Database Operations
 * IndexedDB storage for Settings Module
 * 
 * PRD Reference: docs/product/PRD-Settings-Module.md
 */

import { v4 as uuidv4 } from 'uuid';
import { db } from './schema';
import type {
  StoreSettings,
  BusinessSettings,
  CheckoutSettings,
  ReceiptSettings,
  NotificationSettings,
  AccountSettings,
  SystemSettings,
  PaymentTerminal,
  HardwareDevice,
} from '../types/settings';

// =============================================================================
// STORE SETTINGS OPERATIONS
// =============================================================================

export const storeSettingsDB = {
  /**
   * Get store settings by store ID
   */
  async get(storeId: string): Promise<StoreSettings | undefined> {
    const result = await db.settings.get(`store_settings_${storeId}`);
    return result?.value as StoreSettings | undefined;
  },

  /**
   * Save store settings
   */
  async save(settings: StoreSettings): Promise<void> {
    const now = new Date().toISOString();
    const updated = {
      ...settings,
      updatedAt: now,
      syncVersion: (settings.syncVersion || 0) + 1,
    };
    await db.settings.put({ key: `store_settings_${settings.storeId}`, value: updated });
  },

  /**
   * Create default store settings
   */
  async createDefault(storeId: string): Promise<StoreSettings> {
    const now = new Date().toISOString();
    const defaultSettings: StoreSettings = {
      id: uuidv4(),
      storeId,
      business: createDefaultBusinessSettings(),
      checkout: createDefaultCheckoutSettings(),
      receipts: createDefaultReceiptSettings(),
      notifications: createDefaultNotificationSettings(),
      account: createDefaultAccountSettings(),
      system: createDefaultSystemSettings(),
      syncVersion: 1,
      createdAt: now,
      updatedAt: now,
    };
    
    await db.settings.put({ key: `store_settings_${storeId}`, value: defaultSettings });
    return defaultSettings;
  },

  /**
   * Get or create store settings
   */
  async getOrCreate(storeId: string): Promise<StoreSettings> {
    const existing = await this.get(storeId);
    if (existing) return existing;
    return await this.createDefault(storeId);
  },

  /**
   * Update business settings
   */
  async updateBusiness(storeId: string, business: Partial<BusinessSettings>): Promise<void> {
    const settings = await this.getOrCreate(storeId);
    settings.business = { ...settings.business, ...business };
    await this.save(settings);
  },

  /**
   * Update checkout settings
   */
  async updateCheckout(storeId: string, checkout: Partial<CheckoutSettings>): Promise<void> {
    const settings = await this.getOrCreate(storeId);
    settings.checkout = { ...settings.checkout, ...checkout };
    await this.save(settings);
  },

  /**
   * Update receipt settings
   */
  async updateReceipts(storeId: string, receipts: Partial<ReceiptSettings>): Promise<void> {
    const settings = await this.getOrCreate(storeId);
    settings.receipts = { ...settings.receipts, ...receipts };
    await this.save(settings);
  },

  /**
   * Update notification settings
   */
  async updateNotifications(storeId: string, notifications: Partial<NotificationSettings>): Promise<void> {
    const settings = await this.getOrCreate(storeId);
    settings.notifications = { ...settings.notifications, ...notifications };
    await this.save(settings);
  },

  /**
   * Update account settings
   */
  async updateAccount(storeId: string, account: Partial<AccountSettings>): Promise<void> {
    const settings = await this.getOrCreate(storeId);
    settings.account = { ...settings.account, ...account };
    await this.save(settings);
  },

  /**
   * Update system settings
   */
  async updateSystem(storeId: string, system: Partial<SystemSettings>): Promise<void> {
    const settings = await this.getOrCreate(storeId);
    settings.system = { ...settings.system, ...system };
    await this.save(settings);
  },

  /**
   * Delete store settings
   */
  async delete(storeId: string): Promise<void> {
    await db.settings.delete(`store_settings_${storeId}`);
  },
};

// =============================================================================
// PAYMENT TERMINALS OPERATIONS
// =============================================================================

export const paymentTerminalsDB = {
  /**
   * Get all terminals for a store
   */
  async getAll(storeId: string): Promise<PaymentTerminal[]> {
    const result = await db.settings.get(`payment_terminals_${storeId}`);
    return (result?.value as PaymentTerminal[]) || [];
  },

  /**
   * Get terminal by ID
   */
  async getById(storeId: string, terminalId: string): Promise<PaymentTerminal | undefined> {
    const terminals = await this.getAll(storeId);
    return terminals.find(t => t.id === terminalId);
  },

  /**
   * Add a new terminal
   */
  async add(storeId: string, terminal: Omit<PaymentTerminal, 'id' | 'storeId' | 'createdAt' | 'updatedAt'>): Promise<PaymentTerminal> {
    const now = new Date().toISOString();
    const newTerminal: PaymentTerminal = {
      ...terminal,
      id: uuidv4(),
      storeId,
      createdAt: now,
      updatedAt: now,
    };
    
    const terminals = await this.getAll(storeId);
    terminals.push(newTerminal);
    await db.settings.put({ key: `payment_terminals_${storeId}`, value: terminals });
    
    return newTerminal;
  },

  /**
   * Update a terminal
   */
  async update(storeId: string, terminalId: string, updates: Partial<PaymentTerminal>): Promise<void> {
    const terminals = await this.getAll(storeId);
    const index = terminals.findIndex(t => t.id === terminalId);
    if (index === -1) throw new Error('Terminal not found');
    
    terminals[index] = {
      ...terminals[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    
    await db.settings.put({ key: `payment_terminals_${storeId}`, value: terminals });
  },

  /**
   * Delete a terminal
   */
  async delete(storeId: string, terminalId: string): Promise<void> {
    const terminals = await this.getAll(storeId);
    const filtered = terminals.filter(t => t.id !== terminalId);
    await db.settings.put({ key: `payment_terminals_${storeId}`, value: filtered });
  },

  /**
   * Update terminal connection status
   */
  async updateStatus(storeId: string, terminalId: string, status: PaymentTerminal['connectionStatus']): Promise<void> {
    await this.update(storeId, terminalId, { 
      connectionStatus: status,
      lastActivity: new Date().toISOString(),
    });
  },
};

// =============================================================================
// HARDWARE DEVICES OPERATIONS
// =============================================================================

export const hardwareDevicesDB = {
  /**
   * Get all hardware devices for a store
   */
  async getAll(storeId: string): Promise<HardwareDevice[]> {
    const result = await db.settings.get(`hardware_devices_${storeId}`);
    return (result?.value as HardwareDevice[]) || [];
  },

  /**
   * Get device by ID
   */
  async getById(storeId: string, deviceId: string): Promise<HardwareDevice | undefined> {
    const devices = await this.getAll(storeId);
    return devices.find(d => d.id === deviceId);
  },

  /**
   * Get devices by type
   */
  async getByType(storeId: string, type: HardwareDevice['type']): Promise<HardwareDevice[]> {
    const devices = await this.getAll(storeId);
    return devices.filter(d => d.type === type);
  },

  /**
   * Add a new hardware device
   */
  async add(storeId: string, device: Omit<HardwareDevice, 'id' | 'storeId' | 'createdAt' | 'updatedAt'>): Promise<HardwareDevice> {
    const now = new Date().toISOString();
    const newDevice: HardwareDevice = {
      ...device,
      id: uuidv4(),
      storeId,
      createdAt: now,
      updatedAt: now,
    };
    
    const devices = await this.getAll(storeId);
    devices.push(newDevice);
    await db.settings.put({ key: `hardware_devices_${storeId}`, value: devices });
    
    return newDevice;
  },

  /**
   * Update a hardware device
   */
  async update(storeId: string, deviceId: string, updates: Partial<HardwareDevice>): Promise<void> {
    const devices = await this.getAll(storeId);
    const index = devices.findIndex(d => d.id === deviceId);
    if (index === -1) throw new Error('Device not found');
    
    devices[index] = {
      ...devices[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    
    await db.settings.put({ key: `hardware_devices_${storeId}`, value: devices });
  },

  /**
   * Delete a hardware device
   */
  async delete(storeId: string, deviceId: string): Promise<void> {
    const devices = await this.getAll(storeId);
    const filtered = devices.filter(d => d.id !== deviceId);
    await db.settings.put({ key: `hardware_devices_${storeId}`, value: filtered });
  },

  /**
   * Update device connection status
   */
  async updateStatus(storeId: string, deviceId: string, status: HardwareDevice['connectionStatus']): Promise<void> {
    await this.update(storeId, deviceId, { connectionStatus: status });
  },
};

// =============================================================================
// HELPER FUNCTIONS - DEFAULT SETTINGS CREATORS
// =============================================================================

function createDefaultBusinessSettings(): BusinessSettings {
  return {
    profile: {
      name: '',
      legalName: '',
      type: 'salon',
    },
    contact: {
      phone: '',
      email: '',
    },
    address: {
      street: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'US',
    },
    locale: {
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Chicago',
      currency: 'USD',
      dateFormat: 'MM/DD/YYYY',
      timeFormat: '12h',
      language: 'en',
    },
    operatingHours: {
      monday: { isOpen: true, openTime: '09:00', closeTime: '19:00' },
      tuesday: { isOpen: true, openTime: '09:00', closeTime: '19:00' },
      wednesday: { isOpen: true, openTime: '09:00', closeTime: '19:00' },
      thursday: { isOpen: true, openTime: '09:00', closeTime: '21:00' },
      friday: { isOpen: true, openTime: '09:00', closeTime: '21:00' },
      saturday: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
      sunday: { isOpen: false },
    },
    specialHours: [],
    closedPeriods: [],
    tax: {
      enabled: true,
      rate: 8.25,
      name: 'Sales Tax',
      inclusive: false,
      additionalRates: [],
      exemptions: [],
    },
  };
}

function createDefaultCheckoutSettings(): CheckoutSettings {
  return {
    tips: {
      enabled: true,
      calculation: 'pre_tax',
      suggestions: [18, 20, 22],
      customAllowed: true,
      noTipOption: true,
      defaultSelection: 'none',
    },
    tipDistribution: {
      method: 'per_provider',
      poolTips: false,
      houseCut: 0,
    },
    discounts: {
      enabled: true,
      maxPercent: 50,
      requireReason: true,
      requireApproval: false,
      approvalThreshold: 20,
    },
    serviceCharge: {
      enabled: false,
      percent: 0,
      name: 'Service Fee',
      applyTo: 'all',
    },
    rounding: {
      enabled: false,
      method: 'nearest_005',
    },
    paymentMethods: {
      card: true,
      tapToPay: true,
      cash: true,
      giftCard: true,
      storeCredit: true,
      check: false,
      custom: false,
    },
  };
}

function createDefaultReceiptSettings(): ReceiptSettings {
  return {
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
}

function createDefaultNotificationSettings(): NotificationSettings {
  return {
    client: {
      appointmentConfirmation: { email: true, sms: true, push: false },
      appointmentReminder: { email: false, sms: true, push: false },
      appointmentCancelled: { email: true, sms: true, push: false },
      receipt: { email: true, sms: false, push: false },
      marketing: { email: true, sms: false, push: false },
      reminderTiming: 24, // 24 hours before
    },
    staff: {
      newAppointment: { email: true, sms: false, push: true },
      scheduleChange: { email: true, sms: true, push: true },
      timeOffApproved: { email: true, sms: true, push: true },
    },
    owner: {
      dailySummary: { email: true, sms: false, push: false },
      largeTransaction: { email: true, sms: true, push: true },
      refundProcessed: { email: true, sms: true, push: true },
      licenseAlert: { email: true, sms: true, push: true },
      largeTransactionThreshold: 500,
    },
  };
}

function createDefaultAccountSettings(): AccountSettings {
  return {
    info: {
      email: '',
      phone: '',
      ownerName: '',
      createdAt: new Date().toISOString(),
    },
    security: {
      twoFactorEnabled: false,
    },
    subscription: {
      plan: 'free',
      billingCycle: 'monthly',
    },
    license: {
      key: '',
      status: 'trial',
      tier: 'free',
      activationDate: new Date().toISOString(),
      devicesAllowed: 1,
      devicesActive: 0,
    },
  };
}

function createDefaultSystemSettings(): SystemSettings {
  return {
    theme: {
      mode: 'system',
      brandColor: '#E6A000',
      accentColor: '#3B82F6',
    },
    layout: {
      defaultView: 'front_desk',
      sidebarPosition: 'left',
      compactMode: false,
      fontSize: 'medium',
    },
    moduleVisibility: [
      { module: 'book', visible: true, order: 1 },
      { module: 'front_desk', visible: true, order: 2 },
      { module: 'sales', visible: true, order: 3 },
      { module: 'pending', visible: true, order: 4 },
      { module: 'team', visible: true, order: 5 },
      { module: 'clients', visible: true, order: 6 },
      { module: 'reports', visible: true, order: 7 },
    ],
  };
}

// =============================================================================
// EXPORT ALL
// =============================================================================

export const settingsDB = {
  storeSettings: storeSettingsDB,
  paymentTerminals: paymentTerminalsDB,
  hardwareDevices: hardwareDevicesDB,
};

export default settingsDB;
