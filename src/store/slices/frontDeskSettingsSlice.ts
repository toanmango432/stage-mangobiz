import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '../index';
import { FrontDeskSettingsData } from '../../components/frontdesk-settings/types';
import { defaultFrontDeskSettings } from '../../components/frontdesk-settings/constants';
import { getTemplateSettings } from '../../components/frontdesk-settings/templateConfigs';
import {
  loadSettings as loadSettingsFromDB,
  saveSettings as saveSettingsToDb,
  subscribeToSettingsChanges,
} from '../../services/frontDeskSettingsStorage';

// BUG-004 FIX: Extract dependency logic into reusable helper function
// This ensures dependencies are enforced consistently across all reducers
const applyDependencies = (settings: FrontDeskSettingsData): FrontDeskSettingsData => {
  const result = { ...settings };

  // Rule 1: In Service stage requires Wait List stage to be active
  if (result.inServiceActive && !result.waitListActive) {
    result.waitListActive = true;
  }

  // Rule 2: Disabling Wait List must also disable In Service
  if (!result.waitListActive && result.inServiceActive) {
    result.inServiceActive = false;
  }

  // Rule 3: showWaitList depends on waitListActive
  if (!result.waitListActive && result.showWaitList) {
    result.showWaitList = false;
  }

  // Rule 4: showInService depends on inServiceActive
  if (!result.inServiceActive && result.showInService) {
    result.showInService = false;
  }

  return result;
};

interface FrontDeskSettingsState {
  settings: FrontDeskSettingsData;
  hasUnsavedChanges: boolean;
  lastSaved: number | null;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
}

const initialState: FrontDeskSettingsState = {
  settings: defaultFrontDeskSettings,
  hasUnsavedChanges: false,
  lastSaved: null,
  isLoading: false,
  isInitialized: false,
  error: null,
};

// Async thunk to load settings from IndexedDB
export const loadFrontDeskSettings = createAsyncThunk(
  'frontDeskSettings/load',
  async (_, { rejectWithValue }) => {
    try {
      const settings = await loadSettingsFromDB();
      return settings;
    } catch (error) {
      console.error('Failed to load front desk settings:', error);
      return rejectWithValue('Failed to load settings');
    }
  }
);

// Async thunk to save settings to IndexedDB
export const saveFrontDeskSettings = createAsyncThunk(
  'frontDeskSettings/save',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const settings = state.frontDeskSettings.settings;
      const success = await saveSettingsToDb(settings);

      if (!success) {
        return rejectWithValue('Failed to save settings');
      }

      return Date.now();
    } catch (error) {
      console.error('Failed to save front desk settings:', error);
      return rejectWithValue('Failed to save settings');
    }
  }
);

const frontDeskSettingsSlice = createSlice({
  name: 'frontDeskSettings',
  initialState,
  reducers: {
    // Update a single setting
    updateSetting: (
      state: FrontDeskSettingsState,
      action: PayloadAction<{ key: keyof FrontDeskSettingsData; value: FrontDeskSettingsData[keyof FrontDeskSettingsData] }>
    ) => {
      const { key, value } = action.payload;
      state.settings = {
        ...state.settings,
        [key]: value
      };
      state.hasUnsavedChanges = true;
      state.settings = applyDependencies(state.settings);
    },

    // Update multiple settings at once
    updateSettings: (
      state: FrontDeskSettingsState,
      action: PayloadAction<Partial<FrontDeskSettingsData>>
    ) => {
      state.settings = {
        ...state.settings,
        ...action.payload,
      };
      state.hasUnsavedChanges = true;
      state.settings = applyDependencies(state.settings);
    },

    // Apply a template preset
    // ISSUE-001: Uses centralized template config from templateConfigs.ts
    applyTemplate: (
      state: FrontDeskSettingsState,
      action: PayloadAction<FrontDeskSettingsData['operationTemplate']>
    ) => {
      const template = action.payload;
      const templateSettings = getTemplateSettings(template);

      state.settings = {
        ...state.settings,
        ...templateSettings,
      };
      state.hasUnsavedChanges = true;
      state.settings = applyDependencies(state.settings);
    },

    // Reset to default settings
    resetSettings: (state: FrontDeskSettingsState) => {
      state.settings = defaultFrontDeskSettings;
      state.hasUnsavedChanges = true;
    },

    // Discard unsaved changes (will need to reload from DB)
    discardChanges: (state: FrontDeskSettingsState) => {
      // This will be handled by re-dispatching loadFrontDeskSettings
      state.hasUnsavedChanges = false;
    },

    // Replace all settings (used for cross-tab sync)
    setSettings: (
      state: FrontDeskSettingsState,
      action: PayloadAction<FrontDeskSettingsData>
    ) => {
      state.settings = action.payload;
      state.hasUnsavedChanges = false;
      state.lastSaved = Date.now();
    },

    // Clear error state
    clearError: (state: FrontDeskSettingsState) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Load settings
    builder
      .addCase(loadFrontDeskSettings.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loadFrontDeskSettings.fulfilled, (state, action) => {
        state.settings = action.payload;
        state.isLoading = false;
        state.isInitialized = true;
        state.hasUnsavedChanges = false;
        state.error = null;
      })
      .addCase(loadFrontDeskSettings.rejected, (state, action) => {
        state.isLoading = false;
        state.isInitialized = true;
        state.error = action.payload as string;
        // Keep default settings on error
      });

    // Save settings
    builder
      .addCase(saveFrontDeskSettings.pending, (state) => {
        state.error = null;
      })
      .addCase(saveFrontDeskSettings.fulfilled, (state, action) => {
        state.hasUnsavedChanges = false;
        state.lastSaved = action.payload;
        state.error = null;
      })
      .addCase(saveFrontDeskSettings.rejected, (state, action) => {
        state.error = action.payload as string;
        // Keep hasUnsavedChanges true so user can retry
      });
  },
});

export const {
  updateSetting,
  updateSettings,
  applyTemplate,
  resetSettings,
  discardChanges,
  setSettings,
  clearError,
} = frontDeskSettingsSlice.actions;

// Legacy export for backwards compatibility
// Components using saveSettings() will need to update to saveFrontDeskSettings()
export const saveSettings = saveFrontDeskSettings;

// Selectors
export const selectFrontDeskSettings = (state: RootState) =>
  state.frontDeskSettings.settings;
export const selectHasUnsavedChanges = (state: RootState) =>
  state.frontDeskSettings.hasUnsavedChanges;
export const selectLastSaved = (state: RootState) =>
  state.frontDeskSettings.lastSaved;
export const selectIsSettingsLoading = (state: RootState) =>
  state.frontDeskSettings.isLoading;
export const selectIsSettingsInitialized = (state: RootState) =>
  state.frontDeskSettings.isInitialized;
export const selectSettingsError = (state: RootState) =>
  state.frontDeskSettings.error;

// Specific setting selectors for performance
export const selectOperationTemplate = (state: RootState) =>
  state.frontDeskSettings.settings.operationTemplate;
export const selectDisplayMode = (state: RootState) =>
  state.frontDeskSettings.settings.displayMode;
export const selectViewWidth = (state: RootState) =>
  state.frontDeskSettings.settings.viewWidth;
export const selectOrganizeBy = (state: RootState) =>
  state.frontDeskSettings.settings.organizeBy;
export const selectShowComingAppointments = (state: RootState) =>
  state.frontDeskSettings.settings.showComingAppointments;
export const selectWaitListActive = (state: RootState) =>
  state.frontDeskSettings.settings.waitListActive;
export const selectInServiceActive = (state: RootState) =>
  state.frontDeskSettings.settings.inServiceActive;
export const selectSortBy = (state: RootState) =>
  state.frontDeskSettings.settings.sortBy;
export const selectViewStyle = (state: RootState) =>
  state.frontDeskSettings.settings.viewStyle;
export const selectCombineSections = (state: RootState) =>
  state.frontDeskSettings.settings.combineSections;

// ISSUE-002: Memoized derived selectors to eliminate duplicate local state
// These replace useState calls in FrontDesk.tsx that mirror Redux state
export const selectIsCombinedView = createSelector(
  [selectDisplayMode, selectCombineSections],
  (displayMode, combineSections) => displayMode === 'tab' || combineSections
);

export const selectCardViewMode = createSelector(
  [selectViewStyle],
  (viewStyle): 'normal' | 'compact' => viewStyle === 'compact' ? 'compact' : 'normal'
);

// Export the subscription function for cross-tab sync setup
export { subscribeToSettingsChanges };

export default frontDeskSettingsSlice.reducer;
