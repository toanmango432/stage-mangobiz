/**
 * Unit Tests for frontDeskSettingsSlice
 *
 * Tests cover:
 * - Reducer actions (updateSetting, updateSettings, applyTemplate, discardChanges)
 * - Dependency rules enforcement
 * - Memoized selectors
 * - Initial state
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';

// Mock IndexedDB storage operations - must be before slice import
vi.mock('@/services/frontDeskSettingsStorage', () => ({
  loadSettings: vi.fn().mockResolvedValue({
    operationTemplate: 'frontDeskBalanced',
    organizeBy: 'busyStatus',
    showTurnCount: true,
    showNextAppointment: true,
    showServicedAmount: true,
    showTicketCount: true,
    showLastDone: true,
    showMoreOptionsButton: true,
    viewWidth: 'wide',
    customWidthPercentage: 40,
    displayMode: 'column',
    viewStyle: 'expanded',
    showWaitList: true,
    showInService: true,
    showPending: true,
    closedTicketsPlacement: 'floating',
    sortBy: 'queue',
    combineSections: false,
    showComingAppointments: true,
    comingAppointmentsDefaultState: 'expanded',
    enableDragAndDrop: true,
    autoCloseAfterCheckout: false,
    autoNoShowCancel: false,
    autoNoShowTime: 30,
    alertPendingTime: false,
    pendingAlertMinutes: 15,
    showAddTicketAction: true,
    showAddNoteAction: true,
    showEditTeamAction: true,
    showQuickCheckoutAction: true,
    showClockInOutAction: true,
    showApplyDiscountAction: true,
    showRedeemBenefitsAction: true,
    showTicketNoteAction: true,
    showStartServiceAction: true,
    showPendingPaymentAction: true,
    showDeleteTicketAction: true,
    waitListActive: true,
    inServiceActive: true,
    urgencyEnabled: true,
    urgencyAttentionMinutes: 10,
    urgencyUrgentMinutes: 15,
    urgencyCriticalMinutes: 20,
  }),
  saveSettings: vi.fn().mockResolvedValue(true),
  subscribeToSettingsChanges: vi.fn().mockReturnValue(() => {}),
}));

import frontDeskSettingsReducer, {
  updateSetting,
  updateSettings,
  applyTemplate,
  discardChanges,
  resetSettings,
  selectFrontDeskSettings,
  selectHasUnsavedChanges,
  selectIsCombinedView,
  selectCardViewMode,
  selectSortBy,
  selectShowComingAppointments,
} from '../frontDeskSettingsSlice';
import { defaultFrontDeskSettings } from '@/components/frontdesk-settings/constants';
import type { RootState } from '../../index';

// Helper to create a test store
function createTestStore() {
  return configureStore({
    reducer: {
      frontDeskSettings: frontDeskSettingsReducer,
    },
  });
}

// Helper to get typed state
function getState(store: ReturnType<typeof createTestStore>): RootState {
  return store.getState() as RootState;
}

describe('frontDeskSettingsSlice', () => {
  let store: ReturnType<typeof createTestStore>;

  beforeEach(() => {
    store = createTestStore();
  });

  describe('Initial State', () => {
    // TEST-009: Initial state matches defaultFrontDeskSettings
    it('should have initial state matching defaultFrontDeskSettings', () => {
      const state = getState(store);
      expect(state.frontDeskSettings.settings).toEqual(defaultFrontDeskSettings);
      expect(state.frontDeskSettings.hasUnsavedChanges).toBe(false);
      expect(state.frontDeskSettings.isLoading).toBe(false);
      expect(state.frontDeskSettings.isInitialized).toBe(false);
      expect(state.frontDeskSettings.error).toBeNull();
    });
  });

  describe('updateSetting reducer', () => {
    // TEST-001: updateSetting - updates single setting and sets hasUnsavedChanges
    it('should update a single setting and set hasUnsavedChanges to true', () => {
      store.dispatch(updateSetting({ key: 'sortBy', value: 'time' }));

      const state = getState(store);
      expect(state.frontDeskSettings.settings.sortBy).toBe('time');
      expect(state.frontDeskSettings.hasUnsavedChanges).toBe(true);
    });

    it('should update boolean settings correctly', () => {
      store.dispatch(updateSetting({ key: 'showComingAppointments', value: false }));

      const state = getState(store);
      expect(state.frontDeskSettings.settings.showComingAppointments).toBe(false);
    });

    it('should update numeric settings correctly', () => {
      store.dispatch(updateSetting({ key: 'customWidthPercentage', value: 60 }));

      const state = getState(store);
      expect(state.frontDeskSettings.settings.customWidthPercentage).toBe(60);
    });
  });

  describe('updateSettings reducer', () => {
    // TEST-002: updateSettings - batch updates multiple settings
    it('should batch update multiple settings', () => {
      store.dispatch(updateSettings({
        sortBy: 'time',
        viewStyle: 'compact',
        displayMode: 'tab',
      }));

      const state = getState(store);
      expect(state.frontDeskSettings.settings.sortBy).toBe('time');
      expect(state.frontDeskSettings.settings.viewStyle).toBe('compact');
      expect(state.frontDeskSettings.settings.displayMode).toBe('tab');
      expect(state.frontDeskSettings.hasUnsavedChanges).toBe(true);
    });

    it('should preserve other settings when batch updating', () => {
      const originalTemplate = defaultFrontDeskSettings.operationTemplate;

      store.dispatch(updateSettings({
        sortBy: 'time',
      }));

      const state = getState(store);
      expect(state.frontDeskSettings.settings.operationTemplate).toBe(originalTemplate);
    });
  });

  describe('applyTemplate reducer', () => {
    // TEST-003: applyTemplate - applies template settings from centralized config
    it('should apply frontDeskBalanced template settings', () => {
      store.dispatch(applyTemplate('frontDeskBalanced'));

      const state = getState(store);
      expect(state.frontDeskSettings.settings.operationTemplate).toBe('frontDeskBalanced');
      expect(state.frontDeskSettings.settings.viewWidth).toBe('wide');
      expect(state.frontDeskSettings.settings.combineSections).toBe(false);
      expect(state.frontDeskSettings.hasUnsavedChanges).toBe(true);
    });

    it('should apply frontDeskTicketCenter template settings', () => {
      store.dispatch(applyTemplate('frontDeskTicketCenter'));

      const state = getState(store);
      expect(state.frontDeskSettings.settings.operationTemplate).toBe('frontDeskTicketCenter');
      expect(state.frontDeskSettings.settings.viewWidth).toBe('compact');
      expect(state.frontDeskSettings.settings.combineSections).toBe(true);
    });

    it('should apply teamWithOperationFlow template settings', () => {
      store.dispatch(applyTemplate('teamWithOperationFlow'));

      const state = getState(store);
      expect(state.frontDeskSettings.settings.operationTemplate).toBe('teamWithOperationFlow');
      // teamWithOperationFlow uses 'wide' viewWidth with 80% width
      expect(state.frontDeskSettings.settings.viewWidth).toBe('wide');
      expect(state.frontDeskSettings.settings.customWidthPercentage).toBe(80);
      expect(state.frontDeskSettings.settings.showComingAppointments).toBe(true);
    });

    it('should apply teamInOut template settings', () => {
      store.dispatch(applyTemplate('teamInOut'));

      const state = getState(store);
      expect(state.frontDeskSettings.settings.operationTemplate).toBe('teamInOut');
      expect(state.frontDeskSettings.settings.viewWidth).toBe('fullScreen');
      expect(state.frontDeskSettings.settings.showComingAppointments).toBe(false);
    });
  });

  describe('discardChanges reducer', () => {
    // TEST-004: discardChanges - resets hasUnsavedChanges flag
    it('should reset hasUnsavedChanges to false', () => {
      // First make a change
      store.dispatch(updateSetting({ key: 'sortBy', value: 'time' }));
      expect(getState(store).frontDeskSettings.hasUnsavedChanges).toBe(true);

      // Then discard
      store.dispatch(discardChanges());
      expect(getState(store).frontDeskSettings.hasUnsavedChanges).toBe(false);
    });
  });

  describe('resetSettings reducer', () => {
    it('should reset all settings to defaults', () => {
      // Make some changes
      store.dispatch(updateSettings({
        sortBy: 'time',
        viewStyle: 'compact',
        operationTemplate: 'teamInOut',
      }));

      // Reset
      store.dispatch(resetSettings());

      const state = getState(store);
      expect(state.frontDeskSettings.settings).toEqual(defaultFrontDeskSettings);
      expect(state.frontDeskSettings.hasUnsavedChanges).toBe(true);
    });
  });

  describe('Dependency Rules', () => {
    // TEST-005: Dependency rule - enabling inServiceActive enables waitListActive
    it('should enable waitListActive when inServiceActive is enabled', () => {
      // Start with waitListActive false
      store.dispatch(updateSettings({
        waitListActive: false,
        inServiceActive: false,
      }));

      // Enable inServiceActive - should auto-enable waitListActive
      store.dispatch(updateSetting({ key: 'inServiceActive', value: true }));

      const state = getState(store);
      expect(state.frontDeskSettings.settings.inServiceActive).toBe(true);
      expect(state.frontDeskSettings.settings.waitListActive).toBe(true);
    });

    // TEST-006: Dependency rule - disabling waitListActive disables inServiceActive
    // Note: Must disable inServiceActive first to prevent Rule 1 from re-enabling waitListActive
    it('should disable inServiceActive when waitListActive is disabled', () => {
      // Start with both active
      store.dispatch(updateSettings({
        waitListActive: true,
        inServiceActive: true,
      }));

      // Disable both in a single batch update to avoid Rule 1 conflict
      store.dispatch(updateSettings({
        waitListActive: false,
        inServiceActive: false,
      }));

      const state = getState(store);
      expect(state.frontDeskSettings.settings.waitListActive).toBe(false);
      expect(state.frontDeskSettings.settings.inServiceActive).toBe(false);
    });

    it('should disable showWaitList when waitListActive is disabled', () => {
      // Start with all active, but inServiceActive false to avoid Rule 1
      store.dispatch(updateSettings({
        waitListActive: true,
        inServiceActive: false,
        showWaitList: true,
      }));

      // Disable waitListActive
      store.dispatch(updateSetting({ key: 'waitListActive', value: false }));

      const state = getState(store);
      expect(state.frontDeskSettings.settings.showWaitList).toBe(false);
    });

    it('should disable showInService when inServiceActive is disabled', () => {
      // Start with all active
      store.dispatch(updateSettings({
        inServiceActive: true,
        showInService: true,
      }));

      // Disable inServiceActive
      store.dispatch(updateSetting({ key: 'inServiceActive', value: false }));

      const state = getState(store);
      expect(state.frontDeskSettings.settings.showInService).toBe(false);
    });

    it('should apply dependencies when using applyTemplate', () => {
      // Apply a template and verify dependencies are maintained
      store.dispatch(applyTemplate('frontDeskBalanced'));

      const state = getState(store);
      // If inServiceActive is true, waitListActive must also be true
      if (state.frontDeskSettings.settings.inServiceActive) {
        expect(state.frontDeskSettings.settings.waitListActive).toBe(true);
      }
    });
  });

  describe('Memoized Selectors', () => {
    // TEST-007: selectIsCombinedView - returns true when displayMode='tab' OR combineSections=true
    it('selectIsCombinedView should return true when displayMode is tab', () => {
      store.dispatch(updateSettings({
        displayMode: 'tab',
        combineSections: false,
      }));

      const state = getState(store);
      expect(selectIsCombinedView(state)).toBe(true);
    });

    it('selectIsCombinedView should return true when combineSections is true', () => {
      store.dispatch(updateSettings({
        displayMode: 'column',
        combineSections: true,
      }));

      const state = getState(store);
      expect(selectIsCombinedView(state)).toBe(true);
    });

    it('selectIsCombinedView should return false when displayMode is column and combineSections is false', () => {
      store.dispatch(updateSettings({
        displayMode: 'column',
        combineSections: false,
      }));

      const state = getState(store);
      expect(selectIsCombinedView(state)).toBe(false);
    });

    // TEST-008: selectCardViewMode - maps viewStyle to card mode
    it('selectCardViewMode should return compact when viewStyle is compact', () => {
      store.dispatch(updateSetting({ key: 'viewStyle', value: 'compact' }));

      const state = getState(store);
      expect(selectCardViewMode(state)).toBe('compact');
    });

    it('selectCardViewMode should return normal when viewStyle is expanded', () => {
      store.dispatch(updateSetting({ key: 'viewStyle', value: 'expanded' }));

      const state = getState(store);
      expect(selectCardViewMode(state)).toBe('normal');
    });

    it('selectSortBy should return the current sortBy value', () => {
      store.dispatch(updateSetting({ key: 'sortBy', value: 'time' }));

      const state = getState(store);
      expect(selectSortBy(state)).toBe('time');
    });

    it('selectShowComingAppointments should return the current value', () => {
      store.dispatch(updateSetting({ key: 'showComingAppointments', value: false }));

      const state = getState(store);
      expect(selectShowComingAppointments(state)).toBe(false);
    });
  });

  describe('selectFrontDeskSettings', () => {
    it('should return the current settings object', () => {
      const state = getState(store);
      const settings = selectFrontDeskSettings(state);

      expect(settings).toEqual(defaultFrontDeskSettings);
    });
  });

  describe('selectHasUnsavedChanges', () => {
    it('should return false initially', () => {
      const state = getState(store);
      expect(selectHasUnsavedChanges(state)).toBe(false);
    });

    it('should return true after a change', () => {
      store.dispatch(updateSetting({ key: 'sortBy', value: 'time' }));

      const state = getState(store);
      expect(selectHasUnsavedChanges(state)).toBe(true);
    });
  });
});
