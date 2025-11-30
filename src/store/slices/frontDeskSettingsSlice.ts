import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../index';
import { FrontDeskSettingsData } from '../../components/frontdesk-settings/types';
import { defaultFrontDeskSettings } from '../../components/frontdesk-settings/constants';

// Load settings from localStorage on initialization
const loadSettingsFromStorage = (): FrontDeskSettingsData => {
  try {
    const stored = localStorage.getItem('frontDeskSettings');
    if (stored) {
      const parsed = JSON.parse(stored);
      // Merge with defaults to ensure all fields exist
      return { ...defaultFrontDeskSettings, ...parsed };
    }
  } catch (error) {
    console.error('Failed to load FrontDesk settings from localStorage:', error);
  }
  return defaultFrontDeskSettings;
};

interface FrontDeskSettingsState {
  settings: FrontDeskSettingsData;
  hasUnsavedChanges: boolean;
  lastSaved: number | null;
}

const initialState: FrontDeskSettingsState = {
  settings: loadSettingsFromStorage(),
  hasUnsavedChanges: false,
  lastSaved: Date.now(),
};

const frontDeskSettingsSlice = createSlice({
  name: 'frontDeskSettings',
  initialState,
  reducers: {
    // Update a single setting
    updateSetting: <K extends keyof FrontDeskSettingsData>(
      state: FrontDeskSettingsState,
      action: PayloadAction<{ key: K; value: FrontDeskSettingsData[K] }>
    ) => {
      const { key, value } = action.payload;
      state.settings[key] = value as any;
      state.hasUnsavedChanges = true;

      // Apply dependencies
      if (key === 'inServiceActive' && value === true && !state.settings.waitListActive) {
        state.settings.waitListActive = true;
      }
      if (key === 'waitListActive' && value === false && state.settings.inServiceActive) {
        state.settings.inServiceActive = false;
      }
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

      // Apply dependencies after batch update
      if (state.settings.inServiceActive && !state.settings.waitListActive) {
        state.settings.waitListActive = true;
      }
    },

    // Apply a template preset
    applyTemplate: (
      state: FrontDeskSettingsState,
      action: PayloadAction<FrontDeskSettingsData['operationTemplate']>
    ) => {
      const template = action.payload;
      let templateSettings: Partial<FrontDeskSettingsData> = {
        operationTemplate: template,
      };

      // Apply preset values based on template
      switch (template) {
        case 'frontDeskBalanced':
          templateSettings = {
            ...templateSettings,
            viewWidth: 'wide',
            customWidthPercentage: 40,
            displayMode: 'column',
            combineSections: false,
            showComingAppointments: true,
            organizeBy: 'busyStatus',
          };
          break;
        case 'frontDeskTicketCenter':
          templateSettings = {
            ...templateSettings,
            viewWidth: 'compact',
            customWidthPercentage: 10,
            displayMode: 'tab',
            combineSections: true,
            showComingAppointments: true,
            organizeBy: 'busyStatus',
          };
          break;
        case 'teamWithOperationFlow':
          templateSettings = {
            ...templateSettings,
            viewWidth: 'wide',
            customWidthPercentage: 80,
            displayMode: 'column',
            combineSections: false,
            showComingAppointments: false,
            organizeBy: 'clockedStatus',
          };
          break;
        case 'teamInOut':
          templateSettings = {
            ...templateSettings,
            viewWidth: 'fullScreen',
            customWidthPercentage: 100,
            displayMode: 'column',
            combineSections: false,
            showComingAppointments: false,
            organizeBy: 'clockedStatus',
          };
          break;
      }

      state.settings = {
        ...state.settings,
        ...templateSettings,
      };
      state.hasUnsavedChanges = true;
    },

    // Save settings (persist to localStorage)
    saveSettings: (state: FrontDeskSettingsState) => {
      try {
        localStorage.setItem('frontDeskSettings', JSON.stringify(state.settings));
        state.hasUnsavedChanges = false;
        state.lastSaved = Date.now();

        // Dispatch custom event for other components
        window.dispatchEvent(
          new CustomEvent('frontDeskSettingsUpdated', {
            detail: state.settings,
          })
        );
      } catch (error) {
        console.error('Failed to save FrontDesk settings to localStorage:', error);
      }
    },

    // Reset to default settings
    resetSettings: (state: FrontDeskSettingsState) => {
      state.settings = defaultFrontDeskSettings;
      state.hasUnsavedChanges = true;
    },

    // Discard unsaved changes
    discardChanges: (state: FrontDeskSettingsState) => {
      state.settings = loadSettingsFromStorage();
      state.hasUnsavedChanges = false;
    },

    // Replace all settings (used when loading from external source)
    setSettings: (
      state: FrontDeskSettingsState,
      action: PayloadAction<FrontDeskSettingsData>
    ) => {
      state.settings = action.payload;
      state.hasUnsavedChanges = false;
      state.lastSaved = Date.now();
    },
  },
});

export const {
  updateSetting,
  updateSettings,
  applyTemplate,
  saveSettings,
  resetSettings,
  discardChanges,
  setSettings,
} = frontDeskSettingsSlice.actions;

// Selectors
export const selectFrontDeskSettings = (state: RootState) =>
  state.frontDeskSettings.settings;
export const selectHasUnsavedChanges = (state: RootState) =>
  state.frontDeskSettings.hasUnsavedChanges;
export const selectLastSaved = (state: RootState) => state.frontDeskSettings.lastSaved;

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

export default frontDeskSettingsSlice.reducer;
