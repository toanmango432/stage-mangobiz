import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface AccessibilitySettings {
  largeTextMode: boolean;
  reducedMotionMode: boolean;
  highContrastMode: boolean;
}

export interface AccessibilityState extends AccessibilitySettings {
  isAccessibilityMenuOpen: boolean;
}

const STORAGE_KEY = 'mango-checkin-accessibility';

function loadSettings(): AccessibilitySettings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // Ignore parse errors
  }
  return {
    largeTextMode: false,
    reducedMotionMode: false,
    highContrastMode: false,
  };
}

function saveSettings(settings: AccessibilitySettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Ignore storage errors
  }
}

const savedSettings = loadSettings();

const initialState: AccessibilityState = {
  ...savedSettings,
  isAccessibilityMenuOpen: false,
};

const accessibilitySlice = createSlice({
  name: 'accessibility',
  initialState,
  reducers: {
    toggleLargeTextMode: (state) => {
      state.largeTextMode = !state.largeTextMode;
      saveSettings({
        largeTextMode: state.largeTextMode,
        reducedMotionMode: state.reducedMotionMode,
        highContrastMode: state.highContrastMode,
      });
    },
    toggleReducedMotionMode: (state) => {
      state.reducedMotionMode = !state.reducedMotionMode;
      saveSettings({
        largeTextMode: state.largeTextMode,
        reducedMotionMode: state.reducedMotionMode,
        highContrastMode: state.highContrastMode,
      });
    },
    toggleHighContrastMode: (state) => {
      state.highContrastMode = !state.highContrastMode;
      saveSettings({
        largeTextMode: state.largeTextMode,
        reducedMotionMode: state.reducedMotionMode,
        highContrastMode: state.highContrastMode,
      });
    },
    setLargeTextMode: (state, action: PayloadAction<boolean>) => {
      state.largeTextMode = action.payload;
      saveSettings({
        largeTextMode: state.largeTextMode,
        reducedMotionMode: state.reducedMotionMode,
        highContrastMode: state.highContrastMode,
      });
    },
    setReducedMotionMode: (state, action: PayloadAction<boolean>) => {
      state.reducedMotionMode = action.payload;
      saveSettings({
        largeTextMode: state.largeTextMode,
        reducedMotionMode: state.reducedMotionMode,
        highContrastMode: state.highContrastMode,
      });
    },
    setHighContrastMode: (state, action: PayloadAction<boolean>) => {
      state.highContrastMode = action.payload;
      saveSettings({
        largeTextMode: state.largeTextMode,
        reducedMotionMode: state.reducedMotionMode,
        highContrastMode: state.highContrastMode,
      });
    },
    openAccessibilityMenu: (state) => {
      state.isAccessibilityMenuOpen = true;
    },
    closeAccessibilityMenu: (state) => {
      state.isAccessibilityMenuOpen = false;
    },
    toggleAccessibilityMenu: (state) => {
      state.isAccessibilityMenuOpen = !state.isAccessibilityMenuOpen;
    },
    resetAccessibilitySettings: (state) => {
      state.largeTextMode = false;
      state.reducedMotionMode = false;
      state.highContrastMode = false;
      saveSettings({
        largeTextMode: false,
        reducedMotionMode: false,
        highContrastMode: false,
      });
    },
  },
});

export const {
  toggleLargeTextMode,
  toggleReducedMotionMode,
  toggleHighContrastMode,
  setLargeTextMode,
  setReducedMotionMode,
  setHighContrastMode,
  openAccessibilityMenu,
  closeAccessibilityMenu,
  toggleAccessibilityMenu,
  resetAccessibilitySettings,
} = accessibilitySlice.actions;

export default accessibilitySlice.reducer;
