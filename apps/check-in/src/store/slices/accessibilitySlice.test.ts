/**
 * Unit Tests for Accessibility Slice
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import accessibilityReducer, {
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
  type AccessibilityState,
} from './accessibilitySlice';

// Mock localStorage
const mockLocalStorage: Record<string, string> = {};

vi.spyOn(Storage.prototype, 'getItem').mockImplementation((key) => {
  return mockLocalStorage[key] ?? null;
});

vi.spyOn(Storage.prototype, 'setItem').mockImplementation((key, value) => {
  mockLocalStorage[key] = value;
});

vi.spyOn(Storage.prototype, 'removeItem').mockImplementation((key) => {
  delete mockLocalStorage[key];
});

describe('accessibilitySlice', () => {
  const initialState: AccessibilityState = {
    largeTextMode: false,
    reducedMotionMode: false,
    highContrastMode: false,
    isAccessibilityMenuOpen: false,
  };

  beforeEach(() => {
    Object.keys(mockLocalStorage).forEach((key) => delete mockLocalStorage[key]);
  });

  describe('initial state', () => {
    it('returns initial state with defaults', () => {
      const result = accessibilityReducer(undefined, { type: '' });
      expect(result.largeTextMode).toBe(false);
      expect(result.reducedMotionMode).toBe(false);
      expect(result.highContrastMode).toBe(false);
      expect(result.isAccessibilityMenuOpen).toBe(false);
    });
  });

  describe('toggleLargeTextMode', () => {
    it('toggles large text mode on', () => {
      const result = accessibilityReducer(initialState, toggleLargeTextMode());
      expect(result.largeTextMode).toBe(true);
    });

    it('toggles large text mode off', () => {
      const stateWithLargeText = { ...initialState, largeTextMode: true };
      const result = accessibilityReducer(stateWithLargeText, toggleLargeTextMode());
      expect(result.largeTextMode).toBe(false);
    });

    it('saves to localStorage', () => {
      accessibilityReducer(initialState, toggleLargeTextMode());
      expect(mockLocalStorage['mango-checkin-accessibility']).toBeDefined();
    });
  });

  describe('toggleReducedMotionMode', () => {
    it('toggles reduced motion mode on', () => {
      const result = accessibilityReducer(initialState, toggleReducedMotionMode());
      expect(result.reducedMotionMode).toBe(true);
    });

    it('toggles reduced motion mode off', () => {
      const stateWithReducedMotion = { ...initialState, reducedMotionMode: true };
      const result = accessibilityReducer(stateWithReducedMotion, toggleReducedMotionMode());
      expect(result.reducedMotionMode).toBe(false);
    });
  });

  describe('toggleHighContrastMode', () => {
    it('toggles high contrast mode on', () => {
      const result = accessibilityReducer(initialState, toggleHighContrastMode());
      expect(result.highContrastMode).toBe(true);
    });

    it('toggles high contrast mode off', () => {
      const stateWithHighContrast = { ...initialState, highContrastMode: true };
      const result = accessibilityReducer(stateWithHighContrast, toggleHighContrastMode());
      expect(result.highContrastMode).toBe(false);
    });
  });

  describe('setLargeTextMode', () => {
    it('sets large text mode to true', () => {
      const result = accessibilityReducer(initialState, setLargeTextMode(true));
      expect(result.largeTextMode).toBe(true);
    });

    it('sets large text mode to false', () => {
      const stateWithLargeText = { ...initialState, largeTextMode: true };
      const result = accessibilityReducer(stateWithLargeText, setLargeTextMode(false));
      expect(result.largeTextMode).toBe(false);
    });
  });

  describe('setReducedMotionMode', () => {
    it('sets reduced motion mode to true', () => {
      const result = accessibilityReducer(initialState, setReducedMotionMode(true));
      expect(result.reducedMotionMode).toBe(true);
    });

    it('sets reduced motion mode to false', () => {
      const stateWithReducedMotion = { ...initialState, reducedMotionMode: true };
      const result = accessibilityReducer(stateWithReducedMotion, setReducedMotionMode(false));
      expect(result.reducedMotionMode).toBe(false);
    });
  });

  describe('setHighContrastMode', () => {
    it('sets high contrast mode to true', () => {
      const result = accessibilityReducer(initialState, setHighContrastMode(true));
      expect(result.highContrastMode).toBe(true);
    });

    it('sets high contrast mode to false', () => {
      const stateWithHighContrast = { ...initialState, highContrastMode: true };
      const result = accessibilityReducer(stateWithHighContrast, setHighContrastMode(false));
      expect(result.highContrastMode).toBe(false);
    });
  });

  describe('openAccessibilityMenu', () => {
    it('opens the accessibility menu', () => {
      const result = accessibilityReducer(initialState, openAccessibilityMenu());
      expect(result.isAccessibilityMenuOpen).toBe(true);
    });
  });

  describe('closeAccessibilityMenu', () => {
    it('closes the accessibility menu', () => {
      const stateWithMenu = { ...initialState, isAccessibilityMenuOpen: true };
      const result = accessibilityReducer(stateWithMenu, closeAccessibilityMenu());
      expect(result.isAccessibilityMenuOpen).toBe(false);
    });
  });

  describe('toggleAccessibilityMenu', () => {
    it('opens menu when closed', () => {
      const result = accessibilityReducer(initialState, toggleAccessibilityMenu());
      expect(result.isAccessibilityMenuOpen).toBe(true);
    });

    it('closes menu when open', () => {
      const stateWithMenu = { ...initialState, isAccessibilityMenuOpen: true };
      const result = accessibilityReducer(stateWithMenu, toggleAccessibilityMenu());
      expect(result.isAccessibilityMenuOpen).toBe(false);
    });
  });

  describe('resetAccessibilitySettings', () => {
    it('resets all accessibility settings to default', () => {
      const modifiedState: AccessibilityState = {
        largeTextMode: true,
        reducedMotionMode: true,
        highContrastMode: true,
        isAccessibilityMenuOpen: true,
      };
      
      const result = accessibilityReducer(modifiedState, resetAccessibilitySettings());
      
      expect(result.largeTextMode).toBe(false);
      expect(result.reducedMotionMode).toBe(false);
      expect(result.highContrastMode).toBe(false);
      // Note: menu state is NOT reset by this action
      expect(result.isAccessibilityMenuOpen).toBe(true);
    });

    it('saves reset state to localStorage', () => {
      const modifiedState: AccessibilityState = {
        largeTextMode: true,
        reducedMotionMode: true,
        highContrastMode: true,
        isAccessibilityMenuOpen: false,
      };
      
      accessibilityReducer(modifiedState, resetAccessibilitySettings());
      
      const saved = JSON.parse(mockLocalStorage['mango-checkin-accessibility'] || '{}');
      expect(saved.largeTextMode).toBe(false);
      expect(saved.reducedMotionMode).toBe(false);
      expect(saved.highContrastMode).toBe(false);
    });
  });
});
