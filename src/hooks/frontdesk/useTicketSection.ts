import { useViewModePreference, ViewMode, CardViewMode } from './useViewModePreference';

interface UseTicketSectionOptions {
  sectionKey: string;
  defaultViewMode?: ViewMode;
  defaultCardViewMode?: CardViewMode;
  isCombinedView?: boolean;
  externalViewMode?: ViewMode;
  externalSetViewMode?: (mode: ViewMode) => void;
  externalCardViewMode?: CardViewMode;
  externalSetCardViewMode?: (mode: CardViewMode) => void;
  externalMinimizedLineView?: boolean;
  externalSetMinimizedLineView?: (minimized: boolean) => void;
}

/**
 * Combined hook for managing ticket section state
 * Handles both internal state (for standalone sections) and external state (for combined view)
 */
export function useTicketSection({
  sectionKey,
  defaultViewMode = 'list',
  defaultCardViewMode = 'normal',
  isCombinedView = false,
  externalViewMode,
  externalSetViewMode,
  externalCardViewMode,
  externalSetCardViewMode,
  externalMinimizedLineView,
  externalSetMinimizedLineView,
}: UseTicketSectionOptions) {
  // Internal state management
  const internal = useViewModePreference({
    storageKey: sectionKey,
    defaultViewMode,
    defaultCardViewMode,
  });

  // Use external state if in combined view, otherwise use internal
  const viewMode = isCombinedView && externalViewMode ? externalViewMode : internal.viewMode;
  const cardViewMode = isCombinedView && externalCardViewMode ? externalCardViewMode : internal.cardViewMode;
  const minimizedLineView = isCombinedView && externalMinimizedLineView !== undefined
    ? externalMinimizedLineView
    : internal.minimizedLineView;

  const setViewMode = (mode: ViewMode) => {
    if (isCombinedView && externalSetViewMode) {
      externalSetViewMode(mode);
    } else {
      internal.setViewMode(mode);
    }
  };

  const setCardViewMode = (mode: CardViewMode) => {
    if (isCombinedView && externalSetCardViewMode) {
      externalSetCardViewMode(mode);
    } else {
      internal.setCardViewMode(mode);
    }
  };

  const setMinimizedLineView = (minimized: boolean) => {
    if (isCombinedView && externalSetMinimizedLineView) {
      externalSetMinimizedLineView(minimized);
    } else {
      internal.setMinimizedLineView(minimized);
    }
  };

  const toggleViewMode = () => {
    setViewMode(viewMode === 'grid' ? 'list' : 'grid');
  };

  const toggleCardViewMode = () => {
    setCardViewMode(cardViewMode === 'normal' ? 'compact' : 'normal');
  };

  const toggleMinimizedLineView = () => {
    setMinimizedLineView(!minimizedLineView);
  };

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
