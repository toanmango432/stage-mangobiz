/**
 * useViewMode Hook
 *
 * Manages the staff sidebar view mode (normal or compact).
 * US-014: Migrated from localStorage to Redux for centralized state management.
 * Respects team settings for toggle functionality.
 */

import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  selectStaffSidebarViewMode,
  setStaffSidebarViewMode,
} from '@/store/slices/frontDeskSettingsSlice';
import type { TeamSettings } from '@/components/TeamSettingsPanel';
import type { ViewMode } from '../types';

export interface ViewModeState {
  viewMode: ViewMode;
}

export interface ViewModeActions {
  setViewMode: (mode: ViewMode) => void;
  toggleViewMode: () => void;
}

export function useViewMode(teamSettings: TeamSettings): ViewModeState & ViewModeActions {
  const dispatch = useAppDispatch();
  const viewMode = useAppSelector(selectStaffSidebarViewMode);

  // Set view mode via Redux
  const setViewMode = useCallback((mode: ViewMode) => {
    dispatch(setStaffSidebarViewMode(mode));
  }, [dispatch]);

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
