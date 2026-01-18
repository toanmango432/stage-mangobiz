/**
 * Settings Slice
 * Redux state management for Settings Module
 * 
 * PRD Reference: docs/product/PRD-Settings-Module.md
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../index';
import { settingsDB } from '../../db/settingsDB';
import type {
  StoreSettings,
  BusinessSettings,
  CheckoutSettings,
  PaymentTerminal,
  HardwareDevice,
  SettingsCategory,
  BusinessProfile,
  BusinessContact,
  BusinessAddress,
  BusinessLocale,
  OperatingHours,
  SpecialHours,
  ClosedPeriod,
  TaxSettings,
  TipSettings,
  TipDistribution,
  DiscountSettings,
  ServiceChargeSettings,
  RoundingSettings,
  PaymentMethodsSettings,
  PaymentGateway,
  ReceiptHeader,
  ReceiptFooter,
  ReceiptOptions,
  ClientNotifications,
  StaffNotifications,
  OwnerNotifications,
  ThemeSettings,
  LayoutSettings,
  ModuleVisibility,
  PricingPolicySettings,
} from '../../types/settings';
import { DEFAULT_PRICING_POLICY } from '../../types/settings';

// =============================================================================
// STATE INTERFACE
// =============================================================================

interface SettingsState {
  // Main settings object
  settings: StoreSettings | null;
  
  // Hardware/terminals (stored separately for easier management)
  paymentTerminals: PaymentTerminal[];
  hardwareDevices: HardwareDevice[];
  
  // UI state
  activeCategory: SettingsCategory;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  lastSaved: string | null;
  
  // Dirty tracking for unsaved changes
  hasUnsavedChanges: boolean;
}

const initialState: SettingsState = {
  settings: null,
  paymentTerminals: [],
  hardwareDevices: [],
  activeCategory: 'business',
  isLoading: false,
  isSaving: false,
  error: null,
  lastSaved: null,
  hasUnsavedChanges: false,
};

// =============================================================================
// ASYNC THUNKS
// =============================================================================

/**
 * Load all settings for a store
 */
export const loadSettings = createAsyncThunk(
  'settings/load',
  async (storeId: string, { rejectWithValue }) => {
    try {
      const settings = await settingsDB.storeSettings.getOrCreate(storeId);
      const terminals = await settingsDB.paymentTerminals.getAll(storeId);
      const devices = await settingsDB.hardwareDevices.getAll(storeId);
      
      return { settings, terminals, devices };
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to load settings');
    }
  }
);

/**
 * Save all settings
 */
export const saveSettings = createAsyncThunk(
  'settings/save',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const { settings } = state.settings;
      
      if (!settings) {
        throw new Error('No settings to save');
      }
      
      await settingsDB.storeSettings.save(settings);
      return new Date().toISOString();
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to save settings');
    }
  }
);

/**
 * Save business settings
 */
export const saveBusinessSettings = createAsyncThunk(
  'settings/saveBusiness',
  async (business: BusinessSettings, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const storeId = state.settings.settings?.storeId;
      
      if (!storeId) {
        throw new Error('No store ID');
      }
      
      await settingsDB.storeSettings.updateBusiness(storeId, business);
      return business;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to save business settings');
    }
  }
);

/**
 * Save checkout settings
 */
export const saveCheckoutSettings = createAsyncThunk(
  'settings/saveCheckout',
  async (checkout: CheckoutSettings, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const storeId = state.settings.settings?.storeId;
      
      if (!storeId) {
        throw new Error('No store ID');
      }
      
      await settingsDB.storeSettings.updateCheckout(storeId, checkout);
      return checkout;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to save checkout settings');
    }
  }
);

/**
 * Add payment terminal
 */
export const addPaymentTerminal = createAsyncThunk(
  'settings/addTerminal',
  async (terminal: Omit<PaymentTerminal, 'id' | 'storeId' | 'createdAt' | 'updatedAt'>, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const storeId = state.settings.settings?.storeId;
      
      if (!storeId) {
        throw new Error('No store ID');
      }
      
      const newTerminal = await settingsDB.paymentTerminals.add(storeId, terminal);
      return newTerminal;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to add terminal');
    }
  }
);

/**
 * Remove payment terminal
 */
export const removePaymentTerminal = createAsyncThunk(
  'settings/removeTerminal',
  async (terminalId: string, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const storeId = state.settings.settings?.storeId;
      
      if (!storeId) {
        throw new Error('No store ID');
      }
      
      await settingsDB.paymentTerminals.delete(storeId, terminalId);
      return terminalId;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to remove terminal');
    }
  }
);

/**
 * Add hardware device
 */
export const addHardwareDevice = createAsyncThunk(
  'settings/addDevice',
  async (device: Omit<HardwareDevice, 'id' | 'storeId' | 'createdAt' | 'updatedAt'>, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const storeId = state.settings.settings?.storeId;
      
      if (!storeId) {
        throw new Error('No store ID');
      }
      
      const newDevice = await settingsDB.hardwareDevices.add(storeId, device);
      return newDevice;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to add device');
    }
  }
);

/**
 * Remove hardware device
 */
export const removeHardwareDevice = createAsyncThunk(
  'settings/removeDevice',
  async (deviceId: string, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const storeId = state.settings.settings?.storeId;
      
      if (!storeId) {
        throw new Error('No store ID');
      }
      
      await settingsDB.hardwareDevices.delete(storeId, deviceId);
      return deviceId;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to remove device');
    }
  }
);

// =============================================================================
// SLICE
// =============================================================================

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    // ==================== UI ACTIONS ====================
    
    setActiveCategory: (state, action: PayloadAction<SettingsCategory>) => {
      state.activeCategory = action.payload;
    },
    
    clearError: (state) => {
      state.error = null;
    },
    
    setHasUnsavedChanges: (state, action: PayloadAction<boolean>) => {
      state.hasUnsavedChanges = action.payload;
    },
    
    // ==================== BUSINESS SETTINGS ====================
    
    updateBusinessProfile: (state, action: PayloadAction<Partial<BusinessProfile>>) => {
      if (state.settings) {
        state.settings.business.profile = { ...state.settings.business.profile, ...action.payload };
        state.hasUnsavedChanges = true;
      }
    },
    
    updateBusinessContact: (state, action: PayloadAction<Partial<BusinessContact>>) => {
      if (state.settings) {
        state.settings.business.contact = { ...state.settings.business.contact, ...action.payload };
        state.hasUnsavedChanges = true;
      }
    },
    
    updateBusinessAddress: (state, action: PayloadAction<Partial<BusinessAddress>>) => {
      if (state.settings) {
        state.settings.business.address = { ...state.settings.business.address, ...action.payload };
        state.hasUnsavedChanges = true;
      }
    },
    
    updateBusinessLocale: (state, action: PayloadAction<Partial<BusinessLocale>>) => {
      if (state.settings) {
        state.settings.business.locale = { ...state.settings.business.locale, ...action.payload };
        state.hasUnsavedChanges = true;
      }
    },
    
    updateOperatingHours: (state, action: PayloadAction<OperatingHours>) => {
      if (state.settings) {
        state.settings.business.operatingHours = action.payload;
        state.hasUnsavedChanges = true;
      }
    },
    
    addSpecialHours: (state, action: PayloadAction<SpecialHours>) => {
      if (state.settings) {
        state.settings.business.specialHours.push(action.payload);
        state.hasUnsavedChanges = true;
      }
    },
    
    removeSpecialHours: (state, action: PayloadAction<string>) => {
      if (state.settings) {
        state.settings.business.specialHours = state.settings.business.specialHours.filter(
          h => h.id !== action.payload
        );
        state.hasUnsavedChanges = true;
      }
    },
    
    addClosedPeriod: (state, action: PayloadAction<ClosedPeriod>) => {
      if (state.settings) {
        state.settings.business.closedPeriods.push(action.payload);
        state.hasUnsavedChanges = true;
      }
    },
    
    removeClosedPeriod: (state, action: PayloadAction<string>) => {
      if (state.settings) {
        state.settings.business.closedPeriods = state.settings.business.closedPeriods.filter(
          p => p.id !== action.payload
        );
        state.hasUnsavedChanges = true;
      }
    },
    
    updateTaxSettings: (state, action: PayloadAction<Partial<TaxSettings>>) => {
      if (state.settings) {
        state.settings.business.tax = { ...state.settings.business.tax, ...action.payload };
        state.hasUnsavedChanges = true;
      }
    },
    
    // ==================== CHECKOUT SETTINGS ====================
    
    updateTipSettings: (state, action: PayloadAction<Partial<TipSettings>>) => {
      if (state.settings) {
        state.settings.checkout.tips = { ...state.settings.checkout.tips, ...action.payload };
        state.hasUnsavedChanges = true;
      }
    },
    
    updateTipDistribution: (state, action: PayloadAction<Partial<TipDistribution>>) => {
      if (state.settings) {
        state.settings.checkout.tipDistribution = { ...state.settings.checkout.tipDistribution, ...action.payload };
        state.hasUnsavedChanges = true;
      }
    },
    
    updateDiscountSettings: (state, action: PayloadAction<Partial<DiscountSettings>>) => {
      if (state.settings) {
        state.settings.checkout.discounts = { ...state.settings.checkout.discounts, ...action.payload };
        state.hasUnsavedChanges = true;
      }
    },
    
    updateServiceChargeSettings: (state, action: PayloadAction<Partial<ServiceChargeSettings>>) => {
      if (state.settings) {
        state.settings.checkout.serviceCharge = { ...state.settings.checkout.serviceCharge, ...action.payload };
        state.hasUnsavedChanges = true;
      }
    },
    
    updateRoundingSettings: (state, action: PayloadAction<Partial<RoundingSettings>>) => {
      if (state.settings) {
        state.settings.checkout.rounding = { ...state.settings.checkout.rounding, ...action.payload };
        state.hasUnsavedChanges = true;
      }
    },
    
    updatePaymentMethods: (state, action: PayloadAction<Partial<PaymentMethodsSettings>>) => {
      if (state.settings) {
        state.settings.checkout.paymentMethods = { ...state.settings.checkout.paymentMethods, ...action.payload };
        state.hasUnsavedChanges = true;
      }
    },
    
    updatePaymentGateway: (state, action: PayloadAction<Partial<PaymentGateway>>) => {
      if (state.settings) {
        state.settings.checkout.gateway = { ...state.settings.checkout.gateway, ...action.payload } as PaymentGateway;
        state.hasUnsavedChanges = true;
      }
    },

    updatePricingPolicy: (state, action: PayloadAction<Partial<PricingPolicySettings>>) => {
      if (state.settings) {
        // Initialize with defaults if pricingPolicy doesn't exist
        const currentPolicy = state.settings.checkout.pricingPolicy || DEFAULT_PRICING_POLICY;
        state.settings.checkout.pricingPolicy = { ...currentPolicy, ...action.payload };
        state.hasUnsavedChanges = true;
      }
    },

    // ==================== RECEIPT SETTINGS ====================
    
    updateReceiptHeader: (state, action: PayloadAction<Partial<ReceiptHeader>>) => {
      if (state.settings) {
        state.settings.receipts.header = { ...state.settings.receipts.header, ...action.payload };
        state.hasUnsavedChanges = true;
      }
    },
    
    updateReceiptFooter: (state, action: PayloadAction<Partial<ReceiptFooter>>) => {
      if (state.settings) {
        state.settings.receipts.footer = { ...state.settings.receipts.footer, ...action.payload };
        state.hasUnsavedChanges = true;
      }
    },
    
    updateReceiptOptions: (state, action: PayloadAction<Partial<ReceiptOptions>>) => {
      if (state.settings) {
        state.settings.receipts.options = { ...state.settings.receipts.options, ...action.payload };
        state.hasUnsavedChanges = true;
      }
    },
    
    // ==================== NOTIFICATION SETTINGS ====================
    
    updateClientNotifications: (state, action: PayloadAction<Partial<ClientNotifications>>) => {
      if (state.settings) {
        state.settings.notifications.client = { ...state.settings.notifications.client, ...action.payload };
        state.hasUnsavedChanges = true;
      }
    },
    
    updateStaffNotifications: (state, action: PayloadAction<Partial<StaffNotifications>>) => {
      if (state.settings) {
        state.settings.notifications.staff = { ...state.settings.notifications.staff, ...action.payload };
        state.hasUnsavedChanges = true;
      }
    },
    
    updateOwnerNotifications: (state, action: PayloadAction<Partial<OwnerNotifications>>) => {
      if (state.settings) {
        state.settings.notifications.owner = { ...state.settings.notifications.owner, ...action.payload };
        state.hasUnsavedChanges = true;
      }
    },
    
    // ==================== SYSTEM SETTINGS ====================
    
    updateThemeSettings: (state, action: PayloadAction<Partial<ThemeSettings>>) => {
      if (state.settings) {
        state.settings.system.theme = { ...state.settings.system.theme, ...action.payload };
        state.hasUnsavedChanges = true;
      }
    },
    
    updateLayoutSettings: (state, action: PayloadAction<Partial<LayoutSettings>>) => {
      if (state.settings) {
        state.settings.system.layout = { ...state.settings.system.layout, ...action.payload };
        state.hasUnsavedChanges = true;
      }
    },
    
    updateModuleVisibility: (state, action: PayloadAction<ModuleVisibility[]>) => {
      if (state.settings) {
        state.settings.system.moduleVisibility = action.payload;
        state.hasUnsavedChanges = true;
      }
    },
    
    // ==================== TERMINAL STATUS ====================
    
    updateTerminalStatus: (state, action: PayloadAction<{ id: string; status: PaymentTerminal['connectionStatus'] }>) => {
      const terminal = state.paymentTerminals.find(t => t.id === action.payload.id);
      if (terminal) {
        terminal.connectionStatus = action.payload.status;
        terminal.lastActivity = new Date().toISOString();
      }
    },
    
    // ==================== DEVICE STATUS ====================
    
    updateDeviceStatus: (state, action: PayloadAction<{ id: string; status: HardwareDevice['connectionStatus'] }>) => {
      const device = state.hardwareDevices.find(d => d.id === action.payload.id);
      if (device) {
        device.connectionStatus = action.payload.status;
      }
    },
  },
  
  extraReducers: (builder) => {
    // Load settings
    builder
      .addCase(loadSettings.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loadSettings.fulfilled, (state, action) => {
        state.isLoading = false;
        state.settings = action.payload.settings;
        state.paymentTerminals = action.payload.terminals;
        state.hardwareDevices = action.payload.devices;
        state.hasUnsavedChanges = false;
      })
      .addCase(loadSettings.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
    
    // Save settings
    builder
      .addCase(saveSettings.pending, (state) => {
        state.isSaving = true;
        state.error = null;
      })
      .addCase(saveSettings.fulfilled, (state, action) => {
        state.isSaving = false;
        state.lastSaved = action.payload;
        state.hasUnsavedChanges = false;
      })
      .addCase(saveSettings.rejected, (state, action) => {
        state.isSaving = false;
        state.error = action.payload as string;
      });
    
    // Save business settings
    builder
      .addCase(saveBusinessSettings.pending, (state) => {
        state.isSaving = true;
      })
      .addCase(saveBusinessSettings.fulfilled, (state, action) => {
        state.isSaving = false;
        if (state.settings) {
          state.settings.business = action.payload;
        }
        state.hasUnsavedChanges = false;
        state.lastSaved = new Date().toISOString();
      })
      .addCase(saveBusinessSettings.rejected, (state, action) => {
        state.isSaving = false;
        state.error = action.payload as string;
      });
    
    // Save checkout settings
    builder
      .addCase(saveCheckoutSettings.pending, (state) => {
        state.isSaving = true;
      })
      .addCase(saveCheckoutSettings.fulfilled, (state, action) => {
        state.isSaving = false;
        if (state.settings) {
          state.settings.checkout = action.payload;
        }
        state.hasUnsavedChanges = false;
        state.lastSaved = new Date().toISOString();
      })
      .addCase(saveCheckoutSettings.rejected, (state, action) => {
        state.isSaving = false;
        state.error = action.payload as string;
      });
    
    // Add terminal
    builder
      .addCase(addPaymentTerminal.fulfilled, (state, action) => {
        state.paymentTerminals.push(action.payload);
      })
      .addCase(addPaymentTerminal.rejected, (state, action) => {
        state.error = action.payload as string;
      });
    
    // Remove terminal
    builder
      .addCase(removePaymentTerminal.fulfilled, (state, action) => {
        state.paymentTerminals = state.paymentTerminals.filter(t => t.id !== action.payload);
      })
      .addCase(removePaymentTerminal.rejected, (state, action) => {
        state.error = action.payload as string;
      });
    
    // Add device
    builder
      .addCase(addHardwareDevice.fulfilled, (state, action) => {
        state.hardwareDevices.push(action.payload);
      })
      .addCase(addHardwareDevice.rejected, (state, action) => {
        state.error = action.payload as string;
      });
    
    // Remove device
    builder
      .addCase(removeHardwareDevice.fulfilled, (state, action) => {
        state.hardwareDevices = state.hardwareDevices.filter(d => d.id !== action.payload);
      })
      .addCase(removeHardwareDevice.rejected, (state, action) => {
        state.error = action.payload as string;
      });
  },
});

// =============================================================================
// EXPORTS
// =============================================================================

export const {
  // UI
  setActiveCategory,
  clearError,
  setHasUnsavedChanges,
  // Business
  updateBusinessProfile,
  updateBusinessContact,
  updateBusinessAddress,
  updateBusinessLocale,
  updateOperatingHours,
  addSpecialHours,
  removeSpecialHours,
  addClosedPeriod,
  removeClosedPeriod,
  updateTaxSettings,
  // Checkout
  updateTipSettings,
  updateTipDistribution,
  updateDiscountSettings,
  updateServiceChargeSettings,
  updateRoundingSettings,
  updatePaymentMethods,
  updatePaymentGateway,
  updatePricingPolicy,
  // Receipts
  updateReceiptHeader,
  updateReceiptFooter,
  updateReceiptOptions,
  // Notifications
  updateClientNotifications,
  updateStaffNotifications,
  updateOwnerNotifications,
  // System
  updateThemeSettings,
  updateLayoutSettings,
  updateModuleVisibility,
  // Hardware
  updateTerminalStatus,
  updateDeviceStatus,
} = settingsSlice.actions;

// =============================================================================
// SELECTORS
// =============================================================================

export const selectSettings = (state: RootState) => state.settings.settings;
export const selectBusinessSettings = (state: RootState) => state.settings.settings?.business;
export const selectCheckoutSettings = (state: RootState) => state.settings.settings?.checkout;
export const selectReceiptSettings = (state: RootState) => state.settings.settings?.receipts;
export const selectNotificationSettings = (state: RootState) => state.settings.settings?.notifications;
export const selectAccountSettings = (state: RootState) => state.settings.settings?.account;
export const selectSystemSettings = (state: RootState) => state.settings.settings?.system;

export const selectPaymentTerminals = (state: RootState) => state.settings.paymentTerminals;
export const selectHardwareDevices = (state: RootState) => state.settings.hardwareDevices;

export const selectActiveCategory = (state: RootState) => state.settings.activeCategory;
export const selectIsLoading = (state: RootState) => state.settings.isLoading;
export const selectIsSaving = (state: RootState) => state.settings.isSaving;
export const selectError = (state: RootState) => state.settings.error;
export const selectHasUnsavedChanges = (state: RootState) => state.settings.hasUnsavedChanges;
export const selectLastSaved = (state: RootState) => state.settings.lastSaved;

// Derived selectors
export const selectTipSettings = (state: RootState) => state.settings.settings?.checkout.tips;
export const selectTaxSettings = (state: RootState) => state.settings.settings?.business.tax;
export const selectOperatingHours = (state: RootState) => state.settings.settings?.business.operatingHours;
export const selectTheme = (state: RootState) => state.settings.settings?.system.theme;

// Device connection selectors
export const selectConnectedHardwareDevices = (state: RootState) =>
  state.settings.hardwareDevices.filter(device => device.connectionStatus === 'connected');

export const selectConnectedPaymentTerminals = (state: RootState) =>
  state.settings.paymentTerminals.filter(terminal => terminal.connectionStatus === 'connected');

export const selectHardwareDevicesWithErrors = (state: RootState) =>
  state.settings.hardwareDevices.filter(
    device => device.connectionStatus === 'error' || device.connectionStatus === 'disconnected'
  );

export const selectPaymentTerminalsWithErrors = (state: RootState) =>
  state.settings.paymentTerminals.filter(
    terminal => terminal.connectionStatus === 'error' || terminal.connectionStatus === 'disconnected'
  );

export default settingsSlice.reducer;
