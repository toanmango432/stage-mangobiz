/**
 * Unit Tests for UI Slice
 */

import { describe, it, expect } from 'vitest';
import uiReducer, {
  setCurrentStep,
  setLoading,
  setError,
  setOffline,
  resetUI,
} from './uiSlice';
import type { UIState } from '../../types';

describe('uiSlice', () => {
  const initialState: UIState = {
    currentStep: 'welcome',
    isLoading: false,
    error: null,
    isOffline: false,
  };

  describe('initial state', () => {
    it('returns initial state', () => {
      const result = uiReducer(undefined, { type: '' });
      expect(result).toEqual(initialState);
    });
  });

  describe('setCurrentStep', () => {
    it('sets current step', () => {
      const result = uiReducer(initialState, setCurrentStep('client_lookup'));
      expect(result.currentStep).toBe('client_lookup');
    });

    it('clears error when changing step', () => {
      const stateWithError: UIState = {
        ...initialState,
        error: 'Some error',
      };
      
      const result = uiReducer(stateWithError, setCurrentStep('service_selection'));
      
      expect(result.currentStep).toBe('service_selection');
      expect(result.error).toBeNull();
    });

    it('handles all step types', () => {
      const steps = ['welcome', 'phone_input', 'client_lookup', 'registration', 'service_selection', 'technician_selection', 'guest_addition', 'review', 'confirmation', 'success'] as const;
      
      steps.forEach((step) => {
        const result = uiReducer(initialState, setCurrentStep(step));
        expect(result.currentStep).toBe(step);
      });
    });
  });

  describe('setLoading', () => {
    it('sets loading to true', () => {
      const result = uiReducer(initialState, setLoading(true));
      expect(result.isLoading).toBe(true);
    });

    it('sets loading to false', () => {
      const stateWithLoading: UIState = {
        ...initialState,
        isLoading: true,
      };
      
      const result = uiReducer(stateWithLoading, setLoading(false));
      expect(result.isLoading).toBe(false);
    });
  });

  describe('setError', () => {
    it('sets error message', () => {
      const result = uiReducer(initialState, setError('Network error'));
      expect(result.error).toBe('Network error');
    });

    it('clears loading when setting error', () => {
      const stateWithLoading: UIState = {
        ...initialState,
        isLoading: true,
      };
      
      const result = uiReducer(stateWithLoading, setError('Failed'));
      
      expect(result.error).toBe('Failed');
      expect(result.isLoading).toBe(false);
    });

    it('clears error when null', () => {
      const stateWithError: UIState = {
        ...initialState,
        error: 'Previous error',
      };
      
      const result = uiReducer(stateWithError, setError(null));
      expect(result.error).toBeNull();
    });
  });

  describe('setOffline', () => {
    it('sets offline to true', () => {
      const result = uiReducer(initialState, setOffline(true));
      expect(result.isOffline).toBe(true);
    });

    it('sets offline to false', () => {
      const stateOffline: UIState = {
        ...initialState,
        isOffline: true,
      };
      
      const result = uiReducer(stateOffline, setOffline(false));
      expect(result.isOffline).toBe(false);
    });
  });

  describe('resetUI', () => {
    it('resets step, loading, and error', () => {
      const modifiedState: UIState = {
        currentStep: 'confirmation',
        isLoading: true,
        error: 'Some error',
        isOffline: true,
      };
      
      const result = uiReducer(modifiedState, resetUI());
      
      expect(result.currentStep).toBe('welcome');
      expect(result.isLoading).toBe(false);
      expect(result.error).toBeNull();
      // Note: isOffline is NOT reset
      expect(result.isOffline).toBe(true);
    });
  });
});
