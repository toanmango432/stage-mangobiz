/**
 * Config Slice
 * Manages Mango Pad configuration and settings (persisted to localStorage)
 */

import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { PadConfig, PromoSlide } from '@/types';

const DEFAULT_CONFIG: PadConfig = {
  salonId: '',
  mqttBrokerUrl: 'ws://localhost:1883',
  tipEnabled: true,
  tipType: 'percentage',
  tipSuggestions: [18, 20, 25, 30],
  signatureRequired: true,
  showReceiptOptions: true,
  paymentTimeout: 60,
  thankYouDelay: 5,
  splitPaymentEnabled: true,
  maxSplits: 4,
  logoUrl: undefined,
  promoSlides: [],
  slideDuration: 8,
  brandColors: { primary: '#6366F1', secondary: '#818CF8' },
  highContrastMode: false,
  largeTextMode: false,
};

const STORAGE_KEY = 'mango-pad-config';

function loadConfig(): PadConfig {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return { ...DEFAULT_CONFIG, ...JSON.parse(stored) };
    }
  } catch {
    console.warn('Failed to load config from localStorage');
  }
  return DEFAULT_CONFIG;
}

function saveConfig(config: PadConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch {
    console.warn('Failed to save config to localStorage');
  }
}

interface ConfigState {
  config: PadConfig;
}

const initialState: ConfigState = {
  config: loadConfig(),
};

export const configSlice = createSlice({
  name: 'config',
  initialState,
  reducers: {
    setConfig: (state, action: PayloadAction<Partial<PadConfig>>) => {
      state.config = { ...state.config, ...action.payload };
      saveConfig(state.config);
    },
    setSalonId: (state, action: PayloadAction<string>) => {
      state.config.salonId = action.payload;
      saveConfig(state.config);
    },
    setMqttBrokerUrl: (state, action: PayloadAction<string>) => {
      state.config.mqttBrokerUrl = action.payload;
      saveConfig(state.config);
    },
    setTipSettings: (
      state,
      action: PayloadAction<{
        enabled?: boolean;
        type?: 'percentage' | 'dollar';
        suggestions?: number[];
      }>
    ) => {
      const { enabled, type, suggestions } = action.payload;
      if (enabled !== undefined) state.config.tipEnabled = enabled;
      if (type !== undefined) state.config.tipType = type;
      if (suggestions !== undefined) state.config.tipSuggestions = suggestions;
      saveConfig(state.config);
    },
    setPromoSlides: (state, action: PayloadAction<PromoSlide[]>) => {
      state.config.promoSlides = action.payload;
      saveConfig(state.config);
    },
    addPromoSlide: (state, action: PayloadAction<PromoSlide>) => {
      state.config.promoSlides.push(action.payload);
      saveConfig(state.config);
    },
    removePromoSlide: (state, action: PayloadAction<string>) => {
      state.config.promoSlides = state.config.promoSlides.filter(
        (slide) => slide.id !== action.payload
      );
      saveConfig(state.config);
    },
    setBrandColors: (
      state,
      action: PayloadAction<{ primary: string; secondary: string }>
    ) => {
      state.config.brandColors = action.payload;
      saveConfig(state.config);
    },
    setAccessibilitySettings: (
      state,
      action: PayloadAction<{
        highContrastMode?: boolean;
        largeTextMode?: boolean;
      }>
    ) => {
      const { highContrastMode, largeTextMode } = action.payload;
      if (highContrastMode !== undefined)
        state.config.highContrastMode = highContrastMode;
      if (largeTextMode !== undefined) state.config.largeTextMode = largeTextMode;
      saveConfig(state.config);
    },
    resetConfig: (state) => {
      state.config = DEFAULT_CONFIG;
      saveConfig(state.config);
    },
    importConfig: (state, action: PayloadAction<PadConfig>) => {
      state.config = { ...DEFAULT_CONFIG, ...action.payload };
      saveConfig(state.config);
    },
  },
});

export const {
  setConfig,
  setSalonId,
  setMqttBrokerUrl,
  setTipSettings,
  setPromoSlides,
  addPromoSlide,
  removePromoSlide,
  setBrandColors,
  setAccessibilitySettings,
  resetConfig,
  importConfig,
} = configSlice.actions;

export default configSlice.reducer;
