/**
 * useViewMode Hook
 *
 * Manages the staff sidebar view mode (normal or compact).
 * Persists to localStorage and respects team settings.
 */

import { useState, useCallback } from 'react';
import type { TeamSettings } from '@/components/TeamSettingsPanel';
import { STORAGE_KEYS } from '../constants';
import type { ViewMode } from '../types';

export interface ViewModeState {
  viewMode: ViewMode;
}

export interface ViewModeActions {
  setViewMode: (mode: ViewMode) => void;
  toggleViewMode: () => void;
}

export function useViewMode(teamSettings: TeamSettings): ViewModeState & ViewModeActions {
  // Initialize view mode from localStorage, default to 'normal'
  const [viewMode, setViewModeState] = useState<ViewMode>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.viewMode);
    return saved === 'normal' || saved === 'compact' ? (saved as ViewMode) : 'normal';
  });

  // Set view mode and persist to localStorage
  const setViewMode = useCallback((mode: ViewMode) => {
    setViewModeState(mode);
    localStorage.setItem(STORAGE_KEYS.viewMode, mode);
  }, []);

  // Toggle between view modes (normal, compact)
  const toggleViewMode = useCallback(() => {
    if (teamSettings.showMinimizeExpandIcon) {
      const newViewMode = viewMode === 'normal' ? 'compact' : 'normal';
      setViewMode(newViewMode);
    }
  }, [viewMode, teamSettings.showMinimizeExpandIcon, setViewMode]);

  return {
    viewMode,
    setViewMode,
    toggleViewMode,
  };
}
