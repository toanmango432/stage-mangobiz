import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import type { ReactNode } from 'react';
import { useAccessibility } from './useAccessibility';
import accessibilityReducer from '../store/slices/accessibilitySlice';

function createTestStore() {
  return configureStore({
    reducer: {
      accessibility: accessibilityReducer,
    },
  });
}

function createWrapper(store: ReturnType<typeof createTestStore>) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <Provider store={store}>{children}</Provider>;
  };
}

describe('useAccessibility', () => {
  let store: ReturnType<typeof createTestStore>;

  beforeEach(() => {
    store = createTestStore();
    vi.spyOn(document.documentElement.classList, 'add');
    vi.spyOn(document.documentElement.classList, 'remove');
  });

  afterEach(() => {
    vi.restoreAllMocks();
    document.documentElement.className = '';
  });

  it('should return initial accessibility state', () => {
    const { result } = renderHook(() => useAccessibility(), {
      wrapper: createWrapper(store),
    });

    expect(result.current.largeTextMode).toBe(false);
    expect(result.current.reducedMotionMode).toBe(false);
    expect(result.current.highContrastMode).toBe(false);
    expect(result.current.isAccessibilityMenuOpen).toBe(false);
  });

  it('should toggle large text mode', () => {
    const { result } = renderHook(() => useAccessibility(), {
      wrapper: createWrapper(store),
    });

    act(() => {
      result.current.toggleLargeText();
    });

    expect(result.current.largeTextMode).toBe(true);
    expect(document.documentElement.classList.add).toHaveBeenCalledWith('large-text-mode');

    act(() => {
      result.current.toggleLargeText();
    });

    expect(result.current.largeTextMode).toBe(false);
    expect(document.documentElement.classList.remove).toHaveBeenCalledWith('large-text-mode');
  });

  it('should toggle reduced motion mode', () => {
    const { result } = renderHook(() => useAccessibility(), {
      wrapper: createWrapper(store),
    });

    act(() => {
      result.current.toggleReducedMotion();
    });

    expect(result.current.reducedMotionMode).toBe(true);
    expect(document.documentElement.classList.add).toHaveBeenCalledWith('reduced-motion-mode');
  });

  it('should toggle high contrast mode', () => {
    const { result } = renderHook(() => useAccessibility(), {
      wrapper: createWrapper(store),
    });

    act(() => {
      result.current.toggleHighContrast();
    });

    expect(result.current.highContrastMode).toBe(true);
    expect(document.documentElement.classList.add).toHaveBeenCalledWith('high-contrast-mode');
  });

  it('should open and close accessibility menu', () => {
    const { result } = renderHook(() => useAccessibility(), {
      wrapper: createWrapper(store),
    });

    expect(result.current.isAccessibilityMenuOpen).toBe(false);

    act(() => {
      result.current.openMenu();
    });

    expect(result.current.isAccessibilityMenuOpen).toBe(true);

    act(() => {
      result.current.closeMenu();
    });

    expect(result.current.isAccessibilityMenuOpen).toBe(false);
  });

  it('should reset all accessibility settings', () => {
    const { result } = renderHook(() => useAccessibility(), {
      wrapper: createWrapper(store),
    });

    // Enable all settings
    act(() => {
      result.current.toggleLargeText();
      result.current.toggleReducedMotion();
      result.current.toggleHighContrast();
    });

    expect(result.current.largeTextMode).toBe(true);
    expect(result.current.reducedMotionMode).toBe(true);
    expect(result.current.highContrastMode).toBe(true);

    // Reset
    act(() => {
      result.current.resetSettings();
    });

    expect(result.current.largeTextMode).toBe(false);
    expect(result.current.reducedMotionMode).toBe(false);
    expect(result.current.highContrastMode).toBe(false);
  });

  it('should apply CSS classes based on settings', () => {
    const { result } = renderHook(() => useAccessibility(), {
      wrapper: createWrapper(store),
    });

    // Enable large text mode
    act(() => {
      result.current.toggleLargeText();
    });
    expect(document.documentElement.classList.add).toHaveBeenCalledWith('large-text-mode');

    // Enable reduced motion mode
    act(() => {
      result.current.toggleReducedMotion();
    });
    expect(document.documentElement.classList.add).toHaveBeenCalledWith('reduced-motion-mode');

    // Enable high contrast mode
    act(() => {
      result.current.toggleHighContrast();
    });
    expect(document.documentElement.classList.add).toHaveBeenCalledWith('high-contrast-mode');
  });
});
