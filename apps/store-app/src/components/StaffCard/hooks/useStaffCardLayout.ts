/**
 * Custom hook for staff card layout calculations
 * Handles responsive sizing and dimensions
 */

import { useMemo } from 'react';
import { CARD_DIMENSIONS, getResponsiveSizes, type CardDimensions, type ResponsiveSizes } from '../constants/staffCardTokens';

export type ViewMode = 'ultra-compact' | 'compact' | 'normal';

interface UseStaffCardLayoutProps {
  viewMode: ViewMode;
  isBusy: boolean;
}

interface StaffCardLayout {
  dimensions: CardDimensions;
  sizes: ResponsiveSizes;
  isUltra: boolean;
  isCompact: boolean;
  isNormal: boolean;
}

/**
 * Hook to calculate and memoize card layout properties
 */
export const useStaffCardLayout = ({
  viewMode,
  isBusy,
}: UseStaffCardLayoutProps): StaffCardLayout => {
  const dimensions = useMemo(() => CARD_DIMENSIONS[viewMode], [viewMode]);

  const sizes = useMemo(
    () => getResponsiveSizes(viewMode, isBusy),
    [viewMode, isBusy]
  );

  const isUltra = viewMode === 'ultra-compact';
  const isCompact = viewMode === 'compact';
  const isNormal = viewMode === 'normal';

  return useMemo(
    () => ({
      dimensions,
      sizes,
      isUltra,
      isCompact,
      isNormal,
    }),
    [dimensions, sizes, isUltra, isCompact, isNormal]
  );
};
