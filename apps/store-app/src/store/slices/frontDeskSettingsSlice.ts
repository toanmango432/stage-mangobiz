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

/**
 * US-017: TeamSettings interface (consolidated from TeamSettingsPanel)
 * These settings control the Staff Sidebar behavior and display
 */
export interface TeamSettings {
  // Workflow Preferences
  onCardClick: 'openOptions' | 'createTicket';
  filterWaitingList: boolean;
  allowSelectActiveTicket: boolean;
  // Team Display Structure
  organizeBy: 'clockedStatus' | 'busyStatus';
  // Card Data Toggles
  showTurnCount: boolean;
  showNextAppointment: boolean;
  showServicedAmount: boolean;
  showTicketCount: boolean;
  showLastDone: boolean;
  showMoreOptionsButton: boolean;
  // UI Controls
  showSearch: boolean;
  showMinimizeExpandIcon: boolean;
  // Views & Widths
  viewWidth: 'ultraCompact' | 'compact' | 'wide' | 'fullScreen' | 'custom';
  customWidthPercentage: number;
}

/** Default team settings values */
export const defaultTeamSettings: TeamSettings = {
  onCardClick: 'openOptions',
  filterWaitingList: false,
  allowSelectActiveTicket: false,
  organizeBy: 'busyStatus',
  showTurnCount: true,
  showNextAppointment: true,
  showServicedAmount: true,
  showTicketCount: true,
  showLastDone: true,
  showMoreOptionsButton: true,
  showSearch: true,
  showMinimizeExpandIcon: true,
  viewWidth: 'wide',
  customWidthPercentage: 25,
};

// View state that persists to localStorage (UI preferences, not settings)
interface ViewState {
  activeMobileSection: string;
  activeCombinedTab: string;
  combinedViewMode: 'grid' | 'list';
  combinedMinimizedLineView: boolean;
  serviceColumnWidth: number;
  // Staff sidebar state (US-014: migrated from StaffSidebar localStorage)
  staffSidebarViewMode: 'normal' | 'compact';
  staffSidebarWidth: number;
  staffSidebarWidthType: 'fixed' | 'percentage' | 'customPercentage';
  staffSidebarWidthPercentage: number;
  // US-017: Team settings (consolidated from TeamSettingsPanel localStorage)
  teamSettings: TeamSettings;
}

// Staff notes stored by staff ID (persisted to localStorage)
type StaffNotesMap = Record<string, string>;

// US-017: Load team settings from localStorage
const loadTeamSettings = (): TeamSettings => {
  try {
    const stored = localStorage.getItem('teamSettings');
    if (stored) {
      const parsed = JSON.parse(stored);
      // Merge with defaults to handle any missing properties
      return { ...defaultTeamSettings, ...parsed };
    }
  } catch {
    // Return defaults on parse error
  }
  return defaultTeamSettings;
};

// Load view state from localStorage on init
const loadViewState = (): ViewState => ({
  activeMobileSection: localStorage.getItem('activeMobileSection') || 'waitList',
  activeCombinedTab: localStorage.getItem('activeCombinedTab') || 'waitList',
  combinedViewMode: (localStorage.getItem('combinedViewMode') as 'grid' | 'list') || 'list',
  combinedMinimizedLineView: localStorage.getItem('combinedMinimizedLineView') === 'true',
  serviceColumnWidth: parseInt(localStorage.getItem('serviceColumnWidth') || '50', 10),
  // Staff sidebar state (US-014)
  staffSidebarViewMode: (localStorage.getItem('staffSidebarViewMode') as 'normal' | 'compact') || 'normal',
  staffSidebarWidth: parseInt(localStorage.getItem('staffSidebarWidth') || '256', 10),
  staffSidebarWidthType: (localStorage.getItem('staffSidebarWidthType') as 'fixed' | 'percentage' | 'customPercentage') || 'fixed',
  staffSidebarWidthPercentage: parseInt(localStorage.getItem('staffSidebarWidthPercentage') || '0', 10),
  // US-017: Team settings
  teamSettings: loadTeamSettings(),
});

// Load staff notes from localStorage
const loadStaffNotes = (): StaffNotesMap => {
  try {
    const stored = localStorage.getItem('staffNotes');
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
};

// Save staff notes to localStorage
const saveStaffNotes = (notes: StaffNotesMap): void => {
  localStorage.setItem('staffNotes', JSON.stringify(notes));
};

interface FrontDeskSettingsState {
  settings: FrontDeskSettingsData;
  viewState: ViewState;
  staffNotes: StaffNotesMap;
  hasUnsavedChanges: boolean;
  lastSaved: number | null;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
}

const initialState: FrontDeskSettingsState = {
  settings: defaultFrontDeskSettings,
  viewState: loadViewState(),
  staffNotes: loadStaffNotes(),
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

    // View state actions - auto-persist to localStorage
    setActiveMobileSection: (state: FrontDeskSettingsState, action: PayloadAction<string>) => {
      state.viewState.activeMobileSection = action.payload;
      localStorage.setItem('activeMobileSection', action.payload);
    },
    setActiveCombinedTab: (state: FrontDeskSettingsState, action: PayloadAction<string>) => {
      state.viewState.activeCombinedTab = action.payload;
      localStorage.setItem('activeCombinedTab', action.payload);
    },
    setCombinedViewMode: (state: FrontDeskSettingsState, action: PayloadAction<'grid' | 'list'>) => {
      state.viewState.combinedViewMode = action.payload;
      localStorage.setItem('combinedViewMode', action.payload);
    },
    setCombinedMinimizedLineView: (state: FrontDeskSettingsState, action: PayloadAction<boolean>) => {
      state.viewState.combinedMinimizedLineView = action.payload;
      localStorage.setItem('combinedMinimizedLineView', String(action.payload));
    },
    setServiceColumnWidth: (state: FrontDeskSettingsState, action: PayloadAction<number>) => {
      state.viewState.serviceColumnWidth = action.payload;
      localStorage.setItem('serviceColumnWidth', String(action.payload));
    },
    // Staff sidebar state actions (US-014)
    setStaffSidebarViewMode: (state: FrontDeskSettingsState, action: PayloadAction<'normal' | 'compact'>) => {
      state.viewState.staffSidebarViewMode = action.payload;
      localStorage.setItem('staffSidebarViewMode', action.payload);
    },
    setStaffSidebarWidth: (state: FrontDeskSettingsState, action: PayloadAction<number>) => {
      state.viewState.staffSidebarWidth = action.payload;
      localStorage.setItem('staffSidebarWidth', String(action.payload));
      // Update CSS custom property for PendingSectionFooter positioning
      if (typeof document !== 'undefined') {
        document.documentElement.style.setProperty('--staff-sidebar-width', `${action.payload}px`);
        window.dispatchEvent(new Event('staffSidebarWidthChanged'));
      }
    },
    setStaffSidebarWidthType: (state: FrontDeskSettingsState, action: PayloadAction<'fixed' | 'percentage' | 'customPercentage'>) => {
      state.viewState.staffSidebarWidthType = action.payload;
      localStorage.setItem('staffSidebarWidthType', action.payload);
    },
    setStaffSidebarWidthPercentage: (state: FrontDeskSettingsState, action: PayloadAction<number>) => {
      state.viewState.staffSidebarWidthPercentage = action.payload;
      localStorage.setItem('staffSidebarWidthPercentage', String(action.payload));
    },
    // Batch update for sidebar width settings (avoids multiple dispatches)
    setStaffSidebarWidthSettings: (
      state: FrontDeskSettingsState,
      action: PayloadAction<{ width: number; widthType: 'fixed' | 'percentage' | 'customPercentage'; widthPercentage: number }>
    ) => {
      const { width, widthType, widthPercentage } = action.payload;
      state.viewState.staffSidebarWidth = width;
      state.viewState.staffSidebarWidthType = widthType;
      state.viewState.staffSidebarWidthPercentage = widthPercentage;
      localStorage.setItem('staffSidebarWidth', String(width));
      localStorage.setItem('staffSidebarWidthType', widthType);
      localStorage.setItem('staffSidebarWidthPercentage', String(widthPercentage));
      // Update CSS custom property
      if (typeof document !== 'undefined') {
        document.documentElement.style.setProperty('--staff-sidebar-width', `${width}px`);
        window.dispatchEvent(new Event('staffSidebarWidthChanged'));
      }
    },
    // Staff notes actions
    setStaffNote: (
      state: FrontDeskSettingsState,
      action: PayloadAction<{ staffId: string | number; note: string }>
    ) => {
      const { staffId, note } = action.payload;
      const id = String(staffId);
      if (note.trim()) {
        state.staffNotes[id] = note.trim();
      } else {
        // Remove note if empty
        delete state.staffNotes[id];
      }
      // Persist to localStorage
      saveStaffNotes(state.staffNotes);
    },
    deleteStaffNote: (
      state: FrontDeskSettingsState,
      action: PayloadAction<string | number>
    ) => {
      const id = String(action.payload);
      delete state.staffNotes[id];
      saveStaffNotes(state.staffNotes);
    },
    // US-017: Team settings actions
    setTeamSettings: (
      state: FrontDeskSettingsState,
      action: PayloadAction<TeamSettings>
    ) => {
      state.viewState.teamSettings = action.payload;
      localStorage.setItem('teamSettings', JSON.stringify(action.payload));
    },
    updateTeamSettings: (
      state: FrontDeskSettingsState,
      action: PayloadAction<Partial<TeamSettings>>
    ) => {
      const updated = { ...state.viewState.teamSettings, ...action.payload };
      state.viewState.teamSettings = updated;
      localStorage.setItem('teamSettings', JSON.stringify(updated));
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
  // View state actions
  setActiveMobileSection,
  setActiveCombinedTab,
  setCombinedViewMode,
  setCombinedMinimizedLineView,
  setServiceColumnWidth,
  // Staff sidebar state actions (US-014)
  setStaffSidebarViewMode,
  setStaffSidebarWidth,
  setStaffSidebarWidthType,
  setStaffSidebarWidthPercentage,
  setStaffSidebarWidthSettings,
  // Staff notes actions
  setStaffNote,
  deleteStaffNote,
  // US-017: Team settings actions
  setTeamSettings,
  updateTeamSettings,
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

// View state selectors - centralized for FrontDesk component
export const selectViewState = (state: RootState) => state.frontDeskSettings.viewState;
export const selectActiveMobileSection = (state: RootState) => state.frontDeskSettings.viewState.activeMobileSection;
export const selectActiveCombinedTab = (state: RootState) => state.frontDeskSettings.viewState.activeCombinedTab;
export const selectCombinedViewMode = (state: RootState) => state.frontDeskSettings.viewState.combinedViewMode;
export const selectCombinedMinimizedLineView = (state: RootState) => state.frontDeskSettings.viewState.combinedMinimizedLineView;
export const selectServiceColumnWidth = (state: RootState) => state.frontDeskSettings.viewState.serviceColumnWidth;

// Staff sidebar state selectors (US-014)
export const selectStaffSidebarViewMode = (state: RootState) => state.frontDeskSettings.viewState.staffSidebarViewMode;
export const selectStaffSidebarWidth = (state: RootState) => state.frontDeskSettings.viewState.staffSidebarWidth;
export const selectStaffSidebarWidthType = (state: RootState) => state.frontDeskSettings.viewState.staffSidebarWidthType;
export const selectStaffSidebarWidthPercentage = (state: RootState) => state.frontDeskSettings.viewState.staffSidebarWidthPercentage;

// Staff notes selectors
export const selectAllStaffNotes = (state: RootState) => state.frontDeskSettings.staffNotes;
export const selectStaffNote = (staffId: string | number) => (state: RootState) =>
  state.frontDeskSettings.staffNotes[String(staffId)] || '';

// US-017: Team settings selectors
export const selectTeamSettings = (state: RootState) => state.frontDeskSettings.viewState.teamSettings;
export const selectTeamOrganizeBy = (state: RootState) => state.frontDeskSettings.viewState.teamSettings.organizeBy;
export const selectTeamViewWidth = (state: RootState) => state.frontDeskSettings.viewState.teamSettings.viewWidth;
export const selectTeamCustomWidthPercentage = (state: RootState) => state.frontDeskSettings.viewState.teamSettings.customWidthPercentage;

// Export the subscription function for cross-tab sync setup
export { subscribeToSettingsChanges };

export default frontDeskSettingsSlice.reducer;
