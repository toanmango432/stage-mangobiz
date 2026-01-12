import { useCallback, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store';
import {
  toggleLargeTextMode,
  toggleReducedMotionMode,
  toggleHighContrastMode,
  openAccessibilityMenu,
  closeAccessibilityMenu,
  resetAccessibilitySettings,
} from '../store/slices';

export function useAccessibility() {
  const dispatch = useAppDispatch();
  const {
    largeTextMode,
    reducedMotionMode,
    highContrastMode,
    isAccessibilityMenuOpen,
  } = useAppSelector((state) => state.accessibility);

  const handleToggleLargeText = useCallback(() => {
    dispatch(toggleLargeTextMode());
  }, [dispatch]);

  const handleToggleReducedMotion = useCallback(() => {
    dispatch(toggleReducedMotionMode());
  }, [dispatch]);

  const handleToggleHighContrast = useCallback(() => {
    dispatch(toggleHighContrastMode());
  }, [dispatch]);

  const handleOpenMenu = useCallback(() => {
    dispatch(openAccessibilityMenu());
  }, [dispatch]);

  const handleCloseMenu = useCallback(() => {
    dispatch(closeAccessibilityMenu());
  }, [dispatch]);

  const handleReset = useCallback(() => {
    dispatch(resetAccessibilitySettings());
  }, [dispatch]);

  useEffect(() => {
    const root = document.documentElement;

    if (largeTextMode) {
      root.classList.add('large-text-mode');
    } else {
      root.classList.remove('large-text-mode');
    }

    if (reducedMotionMode) {
      root.classList.add('reduced-motion-mode');
    } else {
      root.classList.remove('reduced-motion-mode');
    }

    if (highContrastMode) {
      root.classList.add('high-contrast-mode');
    } else {
      root.classList.remove('high-contrast-mode');
    }
  }, [largeTextMode, reducedMotionMode, highContrastMode]);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return;
    }
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    
    if (prefersReducedMotion?.matches && !reducedMotionMode) {
      dispatch(toggleReducedMotionMode());
    }
  }, [dispatch, reducedMotionMode]);

  return {
    largeTextMode,
    reducedMotionMode,
    highContrastMode,
    isAccessibilityMenuOpen,
    toggleLargeText: handleToggleLargeText,
    toggleReducedMotion: handleToggleReducedMotion,
    toggleHighContrast: handleToggleHighContrast,
    openMenu: handleOpenMenu,
    closeMenu: handleCloseMenu,
    resetSettings: handleReset,
  };
}

export default useAccessibility;
