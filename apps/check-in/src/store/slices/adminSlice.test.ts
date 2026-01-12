/**
 * Unit Tests for Admin Slice
 */

import { describe, it, expect } from 'vitest';
import adminReducer, {
  requestHelp,
  cancelHelpRequest,
  showPinModal,
  hidePinModal,
  setPinError,
  activateAdminMode,
  deactivateAdminMode,
  resetAdmin,
  type AdminState,
} from './adminSlice';

describe('adminSlice', () => {
  const initialState: AdminState = {
    isAdminModeActive: false,
    isHelpRequested: false,
    helpRequestId: null,
    helpRequestedAt: null,
    showPinModal: false,
    pinError: null,
  };

  describe('initial state', () => {
    it('returns initial state', () => {
      const result = adminReducer(undefined, { type: '' });
      expect(result).toEqual(initialState);
    });
  });

  describe('requestHelp', () => {
    it('sets help requested state with request ID', () => {
      const requestId = 'help-123';
      const result = adminReducer(initialState, requestHelp(requestId));
      
      expect(result.isHelpRequested).toBe(true);
      expect(result.helpRequestId).toBe(requestId);
      expect(result.helpRequestedAt).toBeTruthy();
      expect(new Date(result.helpRequestedAt!).getTime()).toBeGreaterThan(0);
    });
  });

  describe('cancelHelpRequest', () => {
    it('clears help request state', () => {
      const stateWithHelp: AdminState = {
        ...initialState,
        isHelpRequested: true,
        helpRequestId: 'help-123',
        helpRequestedAt: '2026-01-11T10:00:00Z',
      };
      
      const result = adminReducer(stateWithHelp, cancelHelpRequest());
      
      expect(result.isHelpRequested).toBe(false);
      expect(result.helpRequestId).toBeNull();
      expect(result.helpRequestedAt).toBeNull();
    });
  });

  describe('showPinModal', () => {
    it('opens PIN modal and clears error', () => {
      const stateWithError: AdminState = {
        ...initialState,
        pinError: 'Previous error',
      };
      
      const result = adminReducer(stateWithError, showPinModal());
      
      expect(result.showPinModal).toBe(true);
      expect(result.pinError).toBeNull();
    });
  });

  describe('hidePinModal', () => {
    it('closes PIN modal and clears error', () => {
      const stateWithModal: AdminState = {
        ...initialState,
        showPinModal: true,
        pinError: 'Wrong PIN',
      };
      
      const result = adminReducer(stateWithModal, hidePinModal());
      
      expect(result.showPinModal).toBe(false);
      expect(result.pinError).toBeNull();
    });
  });

  describe('setPinError', () => {
    it('sets PIN error message', () => {
      const result = adminReducer(initialState, setPinError('Invalid PIN'));
      
      expect(result.pinError).toBe('Invalid PIN');
    });
  });

  describe('activateAdminMode', () => {
    it('activates admin mode and closes PIN modal', () => {
      const stateWithModal: AdminState = {
        ...initialState,
        showPinModal: true,
        pinError: 'Previous error',
      };
      
      const result = adminReducer(stateWithModal, activateAdminMode());
      
      expect(result.isAdminModeActive).toBe(true);
      expect(result.showPinModal).toBe(false);
      expect(result.pinError).toBeNull();
    });
  });

  describe('deactivateAdminMode', () => {
    it('deactivates admin mode', () => {
      const stateWithAdmin: AdminState = {
        ...initialState,
        isAdminModeActive: true,
      };
      
      const result = adminReducer(stateWithAdmin, deactivateAdminMode());
      
      expect(result.isAdminModeActive).toBe(false);
    });
  });

  describe('resetAdmin', () => {
    it('resets all state to initial values', () => {
      const modifiedState: AdminState = {
        isAdminModeActive: true,
        isHelpRequested: true,
        helpRequestId: 'help-123',
        helpRequestedAt: '2026-01-11T10:00:00Z',
        showPinModal: true,
        pinError: 'Error message',
      };
      
      const result = adminReducer(modifiedState, resetAdmin());
      
      expect(result).toEqual(initialState);
    });
  });
});
