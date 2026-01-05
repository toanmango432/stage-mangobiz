/**
 * Custom hook for staff card display configuration
 * Handles what information to show based on view mode and settings
 */

import { useMemo } from 'react';

export interface DisplayConfig {
  showName?: boolean;
  showQueueNumber?: boolean;
  showAvatar?: boolean;
  showTurnCount?: boolean;
  showStatus?: boolean;
  showClockedInTime?: boolean;
  showNextAppointment?: boolean;
  showSalesAmount?: boolean;
  showTickets?: boolean;
  showLastService?: boolean;
  enhancedSeparator?: boolean;
  notchOverlapsAvatar?: boolean;
}

const DEFAULT_DISPLAY_CONFIG: Required<DisplayConfig> = {
  showName: true,
  showQueueNumber: true,
  showAvatar: true,
  showTurnCount: true,
  showStatus: true,
  showClockedInTime: true,
  showNextAppointment: true,
  showSalesAmount: true,
  showTickets: true,
  showLastService: true,
  enhancedSeparator: true,
  notchOverlapsAvatar: false,
};

interface UseStaffCardDisplayProps {
  displayConfig?: DisplayConfig;
}

/**
 * Hook to merge and memoize display configuration
 */
export const useStaffCardDisplay = ({
  displayConfig,
}: UseStaffCardDisplayProps): Required<DisplayConfig> => {
  return useMemo(
    () => ({
      ...DEFAULT_DISPLAY_CONFIG,
      ...(displayConfig || {}),
    }),
    [displayConfig]
  );
};
