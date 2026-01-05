import { useState, useCallback } from 'react';

export type ViewMode = 'grid' | 'list';
export type CardViewMode = 'normal' | 'compact';

interface ViewModePreferenceOptions {
  storageKey: string;
  defaultViewMode?: ViewMode;
  defaultCardViewMode?: CardViewMode;
  defaultMinimizedLineView?: boolean;
}

/**
 * Hook for managing view mode preferences with localStorage persistence
 * Handles viewMode (grid/list), cardViewMode (normal/compact), and minimizedLineView
 */
export function useViewModePreference({
  storageKey,
  defaultViewMode = 'list',
  defaultCardViewMode = 'normal',
  defaultMinimizedLineView = false,
}: ViewModePreferenceOptions) {
  // View mode (grid/list)
  const [viewMode, setViewModeState] = useState<ViewMode>(() => {
    const saved = localStorage.getItem(`${storageKey}ViewMode`);
    return saved === 'grid' || saved === 'list' ? (saved as ViewMode) : defaultViewMode;
  });

  // Card view mode (normal/compact)
  const [cardViewMode, setCardViewModeState] = useState<CardViewMode>(() => {
    const saved = localStorage.getItem(`${storageKey}CardViewMode`);
    return saved === 'normal' || saved === 'compact' ? (saved as CardViewMode) : defaultCardViewMode;
  });

  // Minimized line view
  const [minimizedLineView, setMinimizedLineViewState] = useState<boolean>(() => {
    const saved = localStorage.getItem(`${storageKey}MinimizedLineView`);
    return saved === 'true' ? true : defaultMinimizedLineView;
  });

  // Setters with localStorage persistence
  const setViewMode = useCallback(
    (mode: ViewMode) => {
      setViewModeState(mode);
      localStorage.setItem(`${storageKey}ViewMode`, mode);
    },
    [storageKey]
  );

  const setCardViewMode = useCallback(
    (mode: CardViewMode) => {
      setCardViewModeState(mode);
      localStorage.setItem(`${storageKey}CardViewMode`, mode);
    },
    [storageKey]
  );

  const setMinimizedLineView = useCallback(
    (minimized: boolean) => {
      setMinimizedLineViewState(minimized);
      localStorage.setItem(`${storageKey}MinimizedLineView`, minimized.toString());
    },
    [storageKey]
  );

  // Toggle functions
  const toggleViewMode = useCallback(() => {
    setViewMode(viewMode === 'grid' ? 'list' : 'grid');
  }, [viewMode, setViewMode]);

  const toggleCardViewMode = useCallback(() => {
    setCardViewMode(cardViewMode === 'normal' ? 'compact' : 'normal');
  }, [cardViewMode, setCardViewMode]);

  const toggleMinimizedLineView = useCallback(() => {
    setMinimizedLineView(!minimizedLineView);
  }, [minimizedLineView, setMinimizedLineView]);

  return {
    viewMode,
    setViewMode,
    toggleViewMode,
    cardViewMode,
    setCardViewMode,
    toggleCardViewMode,
    minimizedLineView,
    setMinimizedLineView,
    toggleMinimizedLineView,
  };
}
